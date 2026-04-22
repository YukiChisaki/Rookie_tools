import ExifReader from 'exifreader';
import type { ParsedImageData, GeneratorType } from '../types';

interface RawMetadata {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface ParseResult {
  success: boolean;
  data?: ParsedImageData;
  error?: string;
}

/**
 * 辅助函数：提取字段值（支持直接值或 { value: string } 对象）
 */
function extractFieldValue(field: unknown): string | null {
  if (typeof field === 'string') {
    return field;
  }
  if (field && typeof field === 'object') {
    const obj = field as { value?: string; description?: string };
    if (obj.value && typeof obj.value === 'string') {
      return obj.value;
    }
    if (obj.description && typeof obj.description === 'string') {
      return obj.description;
    }
  }
  return null;
}

/**
 * 检测生成器类型
 */
function detectGenerator(metadata: RawMetadata): GeneratorType {
  // ComfyUI 检测 - 检查是否有 workflow 或 prompt 字段
  const hasWorkflow = !!extractFieldValue(metadata.workflow);
  const hasPrompt = !!extractFieldValue(metadata.prompt);

  if (hasWorkflow || hasPrompt) {
    console.log('[SpellParser] 检测到生成器类型: ComfyUI (通过 workflow/prompt 字段)');
    return 'comfyui';
  }

  // NovelAI 检测 - 检查 Software 或 Comment 中是否包含 NovelAI
  const software = metadata.Software?.value || metadata.Software;
  const comment = metadata.Comment?.value || metadata.Comment;
  if (
    (typeof software === 'string' && software.toLowerCase().includes('novelai')) ||
    (typeof comment === 'string' && comment.toLowerCase().includes('novelai'))
  ) {
    console.log('[SpellParser] 检测到生成器类型: NovelAI (通过 Software/Comment 字段)');
    return 'novelai';
  }

  // Stable Diffusion 检测 - 检查是否有 parameters 字段（AUTOMATIC1111/webui 格式）
  if (metadata.parameters) {
    console.log('[SpellParser] 检测到生成器类型: Stable Diffusion (通过 parameters 字段)');
    return 'stable-diffusion';
  }

  // Stable Diffusion 检测 - 检查是否有 sd-metadata 或 DreamStudio
  const description = metadata.ImageDescription?.value || metadata.ImageDescription;
  if (
    metadata['sd-metadata'] ||
    (typeof software === 'string' && software.toLowerCase().includes('stable')) ||
    (typeof description === 'string' && description.includes('DreamStudio'))
  ) {
    console.log('[SpellParser] 检测到生成器类型: Stable Diffusion (通过 sd-metadata/Software 字段)');
    return 'stable-diffusion';
  }

  // 检查 PNG 文本块中的特定字段
  if (metadata.pngTextChunks) {
    for (const chunk of metadata.pngTextChunks) {
      if (chunk.type === 'tEXt' || chunk.type === 'iTXt') {
        if (
          chunk.description?.toLowerCase().includes('stable diffusion') ||
          chunk.value?.toLowerCase().includes('stable diffusion')
        ) {
          console.log('[SpellParser] 检测到生成器类型: Stable Diffusion (通过 PNG 文本块)');
          return 'stable-diffusion';
        }
      }
    }
  }

  console.log('[SpellParser] 未能识别生成器类型，标记为 unknown');
  return 'unknown';
}

/**
 * 解析 ComfyUI 元数据
 */
function parseComfyUIMetadata(metadata: RawMetadata): Partial<ParsedImageData> {
  const result: Partial<ParsedImageData> = {
    positivePrompt: '',
    negativePrompt: '',
    parameters: {},
  };

  try {
    console.log('[SpellParser] 开始解析 ComfyUI 元数据...');

    // 提取 workflow 值（可能是字符串或 { value: string } 对象）
    const workflowRaw = extractFieldValue(metadata.workflow);
    console.log('[SpellParser] workflow 原始数据存在:', !!workflowRaw);

    // 解析 workflow
    if (workflowRaw) {
      try {
        const workflow = JSON.parse(workflowRaw);
        console.log('[SpellParser] workflow 解析成功，节点数:', workflow?.nodes?.length || 0);

        // 从 workflow 中提取提示词
        if (workflow?.nodes) {
          let clipEncodeCount = 0;
          for (const node of workflow.nodes) {
            if (node.type === 'CLIPTextEncode') {
              clipEncodeCount++;
              const text = node.widgets_values?.[0] || '';
              console.log(`[SpellParser] 找到 CLIPTextEncode 节点 #${clipEncodeCount}:`, text.substring(0, 50) + '...');

              // 根据内容判断是正提示词还是负提示词
              if (text && !result.positivePrompt) {
                result.positivePrompt = text;
              } else if (text && result.positivePrompt && !result.negativePrompt) {
                result.negativePrompt = text;
              }
            }
          }
          console.log('[SpellParser] 从 workflow 提取的正向提示词长度:', result.positivePrompt?.length || 0);
          console.log('[SpellParser] 从 workflow 提取的反向提示词长度:', result.negativePrompt?.length || 0);
        }
      } catch (e) {
        console.error('[SpellParser] 解析 workflow JSON 失败:', e);
      }
    }

    // 提取 prompt 值
    const promptRaw = extractFieldValue(metadata.prompt);
    console.log('[SpellParser] prompt 原始数据存在:', !!promptRaw);

    // 解析 prompt（执行记录）
    if (promptRaw) {
      try {
        const prompt = JSON.parse(promptRaw);
        const nodeEntries = Object.entries(prompt);
        console.log('[SpellParser] prompt 解析成功，节点数:', nodeEntries.length);

        // 第一步：先找到 KSampler 节点，确定正负提示词的连接关系
        const samplerNodes: Array<{ id: string; node: { inputs?: { positive?: [string, number]; negative?: [string, number] } } }> = [];
        for (const [nodeId, nodeData] of nodeEntries) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const node = nodeData as any;
          if (node.class_type === 'KSampler' || node.class_type?.includes('Sampler')) {
            samplerNodes.push({ id: nodeId, node });
          }
        }

        // 找到正向和负向提示词的节点 ID
        const positiveNodeIds = new Set<string>();
        const negativeNodeIds = new Set<string>();

        for (const sampler of samplerNodes) {
          const positiveInput = sampler.node.inputs?.positive;
          const negativeInput = sampler.node.inputs?.negative;

          if (positiveInput && Array.isArray(positiveInput)) {
            positiveNodeIds.add(String(positiveInput[0]));
            console.log(`[SpellParser] KSampler ${sampler.id} 的正向输入来自节点:`, positiveInput[0]);
          }
          if (negativeInput && Array.isArray(negativeInput)) {
            negativeNodeIds.add(String(negativeInput[0]));
            console.log(`[SpellParser] KSampler ${sampler.id} 的负向输入来自节点:`, negativeInput[0]);
          }
        }

        // 第二步：解析所有节点，根据连接关系分配提示词
        for (const [nodeId, nodeData] of nodeEntries) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const node = nodeData as any;

          if (node.class_type === 'CLIPTextEncode') {
            const text = node.inputs?.text || '';
            console.log(`[SpellParser] prompt 中找到 CLIPTextEncode 节点 ${nodeId}:`, text.substring(0, 50) + '...');

            // 根据 KSampler 的连接关系判断是正向还是负向
            if (positiveNodeIds.has(nodeId)) {
              result.positivePrompt = text;
              console.log(`[SpellParser] 节点 ${nodeId} 被识别为正向提示词`);
            } else if (negativeNodeIds.has(nodeId)) {
              result.negativePrompt = text;
              console.log(`[SpellParser] 节点 ${nodeId} 被识别为负向提示词`);
            } else {
              // 如果没有找到连接关系，使用启发式判断
              const lowerText = text.toLowerCase();
              const negativeIndicators = ['bad', 'worst', 'low quality', 'blurry', 'negative', 'lowres', 'jpeg', 'error', 'worstquality'];
              const isNegative = negativeIndicators.some(ind => lowerText.includes(ind));

              if (isNegative && !result.negativePrompt) {
                result.negativePrompt = text;
                console.log(`[SpellParser] 节点 ${nodeId} 根据内容被识别为负向提示词`);
              } else if (!result.positivePrompt) {
                result.positivePrompt = text;
                console.log(`[SpellParser] 节点 ${nodeId} 根据内容被识别为正向提示词`);
              } else if (!result.negativePrompt) {
                result.negativePrompt = text;
                console.log(`[SpellParser] 节点 ${nodeId} 被识别为负向提示词（备选）`);
              }
            }
          }

          // 提取 KSampler 参数
          if (node.class_type === 'KSampler' || node.class_type?.includes('Sampler')) {
            console.log('[SpellParser] 找到 KSampler 节点:', nodeId, node.inputs);
            result.parameters = {
              ...result.parameters,
              sampler: node.inputs?.sampler_name,
              scheduler: node.inputs?.scheduler,
              steps: node.inputs?.steps,
              cfg: node.inputs?.cfg,
              seed: node.inputs?.seed,
            };
          }

          // 提取模型信息
          if (node.class_type === 'CheckpointLoaderSimple') {
            console.log('[SpellParser] 找到 CheckpointLoaderSimple 节点:', nodeId);
            result.parameters = {
              ...result.parameters,
              model: node.inputs?.ckpt_name,
            };
          }

          // 提取尺寸信息
          if (node.class_type === 'EmptyLatentImage') {
            console.log('[SpellParser] 找到 EmptyLatentImage 节点:', nodeId, node.inputs);
            result.parameters = {
              ...result.parameters,
              width: node.inputs?.width,
              height: node.inputs?.height,
            };
          }
        }
      } catch (e) {
        console.error('[SpellParser] 解析 prompt JSON 失败:', e);
      }
    }

    console.log('[SpellParser] ComfyUI 解析完成，参数:', result.parameters);
  } catch (error) {
    console.error('[SpellParser] 解析 ComfyUI 元数据失败:', error);
  }

  return result;
}

/**
 * 解析 NovelAI 元数据
 */
function parseNovelAIMetadata(metadata: RawMetadata): Partial<ParsedImageData> {
  const result: Partial<ParsedImageData> = {
    positivePrompt: '',
    negativePrompt: '',
    parameters: {},
  };

  try {
    // NovelAI 数据通常在 Comment 字段中
    const comment = metadata.Comment?.value || metadata.Comment;
    if (typeof comment === 'string') {
      try {
        const data = JSON.parse(comment);

        if (data.prompt) {
          result.positivePrompt = data.prompt;
        }

        if (data.negative_prompt) {
          result.negativePrompt = data.negative_prompt;
        }

        result.parameters = {
          ...result.parameters,
          sampler: data.sampler,
          steps: data.steps,
          cfg: data.scale,
          seed: data.seed,
          width: data.width,
          height: data.height,
        };
      } catch {
        // 如果不是 JSON，直接作为提示词
        result.positivePrompt = comment;
      }
    }

    // 从 description 提取
    const description = metadata.ImageDescription?.value || metadata.ImageDescription;
    if (description && !result.positivePrompt) {
      result.positivePrompt = description;
    }
  } catch (error) {
    console.error('解析 NovelAI 元数据失败:', error);
  }

  return result;
}

/**
 * 解析 Stable Diffusion 元数据
 */
function parseStableDiffusionMetadata(metadata: RawMetadata): Partial<ParsedImageData> {
  const result: Partial<ParsedImageData> = {
    positivePrompt: '',
    negativePrompt: '',
    parameters: {},
  };

  try {
    console.log('[SpellParser] 开始解析 Stable Diffusion 元数据...');

    // 检查 PNG 文本块中的 parameters 字段（AUTOMATIC1111 格式）
    // parameters 可能直接是字符串，也可能是一个带有 value 属性的对象
    let params: string | undefined;

    if (metadata.parameters) {
      if (typeof metadata.parameters === 'string') {
        params = metadata.parameters;
      } else if (metadata.parameters.value && typeof metadata.parameters.value === 'string') {
        params = metadata.parameters.value;
      } else if (metadata.parameters.description && typeof metadata.parameters.description === 'string') {
        params = metadata.parameters.description;
      }
    }

    console.log('[SpellParser] parameters 原始值:', params ? '存在' : '不存在');
    if (params) {
      console.log('[SpellParser] parameters 内容预览:', params.substring(0, 200) + '...');
    }

    // 解析 parameters 字符串
    if (params) {
      const lines = params.split('\n');
      console.log('[SpellParser] parameters 分割后行数:', lines.length);

      // 找到 Negative prompt: 所在的行索引
      let negativePromptIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('Negative prompt:')) {
          negativePromptIndex = i;
          break;
        }
      }

      // 提取正向提示词（从开头到 Negative prompt 之前的所有行）
      if (negativePromptIndex > 0) {
        result.positivePrompt = lines.slice(0, negativePromptIndex).join('\n').trim();
      } else if (lines.length >= 1) {
        // 如果没有找到 Negative prompt，第一行作为正向提示词
        result.positivePrompt = lines[0].trim();
      }

      // 提取反向提示词（Negative prompt: 行到参数行之间的内容）
      if (negativePromptIndex >= 0) {
        // 找到参数行（通常是最后一行，包含 Steps: 等）
        let paramLineIndex = lines.length - 1;
        for (let i = lines.length - 1; i > negativePromptIndex; i--) {
          if (lines[i].includes('Steps:')) {
            paramLineIndex = i;
            break;
          }
        }

        // 提取 Negative prompt 内容（去除 "Negative prompt:" 前缀）
        const negativeLines = lines.slice(negativePromptIndex, paramLineIndex);
        result.negativePrompt = negativeLines
          .join('\n')
          .replace(/^Negative prompt:\s*/i, '')
          .trim();
      }

      console.log('[SpellParser] 提取的正向提示词长度:', result.positivePrompt?.length || 0);
      console.log('[SpellParser] 提取的反向提示词长度:', result.negativePrompt?.length || 0);

      // 解析参数行
      const paramLine = lines[lines.length - 1];
      console.log('[SpellParser] 参数行内容:', paramLine.substring(0, 150));

      // 解析 Steps
      const stepsMatch = paramLine.match(/Steps:\s*(\d+)/i);
      if (stepsMatch) {
        result.parameters = { ...result.parameters, steps: parseInt(stepsMatch[1], 10) };
      }

      // 解析 Sampler
      const samplerMatch = paramLine.match(/Sampler:\s*([^,]+)/i);
      if (samplerMatch) {
        result.parameters = { ...result.parameters, sampler: samplerMatch[1].trim() };
      }

      // 解析 Schedule type
      const scheduleMatch = paramLine.match(/Schedule type:\s*([^,]+)/i);
      if (scheduleMatch) {
        result.parameters = { ...result.parameters, schedule: scheduleMatch[1].trim() };
      }

      // 解析 CFG scale
      const cfgMatch = paramLine.match(/CFG\s*scale:\s*([\d.]+)/i);
      if (cfgMatch) {
        result.parameters = { ...result.parameters, cfg: parseFloat(cfgMatch[1]) };
      }

      // 解析 Seed
      const seedMatch = paramLine.match(/Seed:\s*(\d+)/i);
      if (seedMatch) {
        result.parameters = { ...result.parameters, seed: parseInt(seedMatch[1], 10) };
      }

      // 解析尺寸
      const sizeMatch = paramLine.match(/Size:\s*(\d+)x(\d+)/i);
      if (sizeMatch) {
        result.parameters = {
          ...result.parameters,
          width: parseInt(sizeMatch[1], 10),
          height: parseInt(sizeMatch[2], 10),
        };
      }

      // 解析 Model hash
      const modelHashMatch = paramLine.match(/Model hash:\s*([^,]+)/i);
      if (modelHashMatch) {
        result.parameters = { ...result.parameters, modelHash: modelHashMatch[1].trim() };
      }

      // 解析 Model
      const modelMatch = paramLine.match(/Model:\s*([^,]+)/i);
      if (modelMatch) {
        result.parameters = { ...result.parameters, model: modelMatch[1].trim() };
      }

      // 解析 Denoising strength
      const denoiseMatch = paramLine.match(/Denoising\s*strength:\s*([\d.]+)/i);
      if (denoiseMatch) {
        result.parameters = { ...result.parameters, denoisingStrength: parseFloat(denoiseMatch[1]) };
      }

      // 解析 Clip skip
      const clipSkipMatch = paramLine.match(/Clip\s*skip:\s*(\d+)/i);
      if (clipSkipMatch) {
        result.parameters = { ...result.parameters, clipSkip: parseInt(clipSkipMatch[1], 10) };
      }

      // 解析 Hires upscale
      const hiresUpscaleMatch = paramLine.match(/Hires\s*upscale:\s*([\d.]+)/i);
      if (hiresUpscaleMatch) {
        result.parameters = { ...result.parameters, hiresUpscale: parseFloat(hiresUpscaleMatch[1]) };
      }

      // 解析 Hires steps
      const hiresStepsMatch = paramLine.match(/Hires\s*steps:\s*(\d+)/i);
      if (hiresStepsMatch) {
        result.parameters = { ...result.parameters, hiresSteps: parseInt(hiresStepsMatch[1], 10) };
      }

      // 解析 Hires upscaler
      const hiresUpscalerMatch = paramLine.match(/Hires\s*upscaler:\s*([^,]+)/i);
      if (hiresUpscalerMatch) {
        result.parameters = { ...result.parameters, hiresUpscaler: hiresUpscalerMatch[1].trim() };
      }

      // 解析 Hires CFG Scale
      const hiresCfgMatch = paramLine.match(/Hires\s*CFG\s*Scale:\s*([\d.]+)/i);
      if (hiresCfgMatch) {
        result.parameters = { ...result.parameters, hiresCfg: parseFloat(hiresCfgMatch[1]) };
      }

      // 解析 Version
      const versionMatch = paramLine.match(/Version:\s*([^,]+)/i);
      if (versionMatch) {
        result.parameters = { ...result.parameters, version: versionMatch[1].trim() };
      }

      console.log('[SpellParser] 解析完成的参数:', result.parameters);
    }

    // 检查 sd-metadata 字段
    if (metadata['sd-metadata']) {
      const sdMeta =
        typeof metadata['sd-metadata'] === 'string'
          ? JSON.parse(metadata['sd-metadata'])
          : metadata['sd-metadata'];

      if (sdMeta.prompt) {
        result.positivePrompt = sdMeta.prompt;
      }

      result.parameters = {
        ...result.parameters,
        sampler: sdMeta.sampler,
        steps: sdMeta.steps,
        cfg: sdMeta.cfg_scale,
        seed: sdMeta.seed,
        width: sdMeta.width,
        height: sdMeta.height,
        model: sdMeta.model,
      };
    }

    // 从 exif 的 UserComment 提取
    const userComment = metadata.exif?.UserComment?.value;
    if (userComment && !result.positivePrompt) {
      if (typeof userComment === 'string') {
        result.positivePrompt = userComment;
      } else if (Array.isArray(userComment)) {
        result.positivePrompt = userComment.join(' ');
      }
    }
  } catch (error) {
    console.error('解析 Stable Diffusion 元数据失败:', error);
  }

  return result;
}

/**
 * 解析图片文件
 */
export async function parseImage(file: File): Promise<ParseResult> {
  try {
    console.log('========================================');
    console.log('[SpellParser] 开始解析图片:', file.name);
    console.log('[SpellParser] 文件类型:', file.type);
    console.log('[SpellParser] 文件大小:', (file.size / 1024).toFixed(2), 'KB');

    // 读取文件为 ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // 使用 ExifReader 解析元数据
    const tags = await ExifReader.load(arrayBuffer, {
      includeUnknown: true,
    });

    // 输出原始元数据到控制台
    console.log('[SpellParser] ===== 原始元数据 =====');
    console.log('[SpellParser] 所有标签键:', Object.keys(tags));

    // 遍历并输出每个元数据字段
    for (const [key, value] of Object.entries(tags)) {
      const valueType = typeof value;
      if (valueType === 'object' && value !== null) {
        const val = value as { value?: unknown; description?: string };
        if (val.value !== undefined) {
          const displayValue = typeof val.value === 'string'
            ? val.value.substring(0, 100) + (val.value.length > 100 ? '...' : '')
            : val.value;
          console.log(`[SpellParser] ${key}:`, displayValue);
        } else {
          console.log(`[SpellParser] ${key}:`, JSON.stringify(value).substring(0, 100));
        }
      } else {
        console.log(`[SpellParser] ${key}:`, value);
      }
    }
    console.log('[SpellParser] ===== 元数据结束 =====');

    // 检测生成器类型
    const generator = detectGenerator(tags);

    // 根据生成器类型解析元数据
    let parsedData: Partial<ParsedImageData> = {
      positivePrompt: '',
      negativePrompt: '',
      parameters: {},
    };

    switch (generator) {
      case 'comfyui':
        parsedData = parseComfyUIMetadata(tags);
        break;
      case 'novelai':
        parsedData = parseNovelAIMetadata(tags);
        break;
      case 'stable-diffusion':
        parsedData = parseStableDiffusionMetadata(tags);
        break;
      default:
        // 尝试从通用字段提取
        {
          const desc = tags.ImageDescription?.value || tags.Description?.value || tags['Image Description']?.value;
          parsedData.positivePrompt = typeof desc === 'string' ? desc : '';
        }
        break;
    }

    // 从 EXIF/PNG 元数据中提取图片基本信息（宽高等）
    const imageWidth = tags['Image Width']?.value || tags['ImageWidth']?.value || tags['ExifImageWidth']?.value;
    const imageHeight = tags['Image Height']?.value || tags['ImageHeight']?.value || tags['ExifImageHeight']?.value;

    if (imageWidth !== undefined || imageHeight !== undefined) {
      console.log('[SpellParser] 从 EXIF 提取到图片尺寸:', imageWidth, 'x', imageHeight);
    }

    // 合并参数，优先使用解析器提取的参数，如果没有则使用 EXIF 中的
    const mergedParameters = {
      ...parsedData.parameters,
    };

    // 如果解析器没有提取到宽高，则从 EXIF 中获取
    if (mergedParameters.width === undefined && imageWidth !== undefined) {
      mergedParameters.width = typeof imageWidth === 'string' ? parseInt(imageWidth, 10) : imageWidth;
    }
    if (mergedParameters.height === undefined && imageHeight !== undefined) {
      mergedParameters.height = typeof imageHeight === 'string' ? parseInt(imageHeight, 10) : imageHeight;
    }

    // 创建图片预览 URL
    const previewUrl = URL.createObjectURL(file);

    // 构建解析结果
    const result: ParsedImageData = {
      id: crypto.randomUUID(),
      fileName: file.name,
      previewUrl,
      generator,
      positivePrompt: parsedData.positivePrompt || '',
      negativePrompt: parsedData.negativePrompt || '',
      parameters: mergedParameters,
      rawMetadata: tags as Record<string, unknown>,
      createdAt: Date.now(),
    };

    // 输出解析结果摘要
    console.log('[SpellParser] ===== 解析结果 =====');
    console.log('[SpellParser] 生成器类型:', generator);
    console.log('[SpellParser] 正向提示词长度:', result.positivePrompt.length);
    console.log('[SpellParser] 反向提示词长度:', result.negativePrompt.length);
    console.log('[SpellParser] 提取的参数:', result.parameters);
    console.log('[SpellParser] ===== 解析完成 =====');
    console.log('========================================');

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('解析图片失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

/**
 * 释放预览 URL
 */
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * 格式化生成器名称
 */
export function formatGeneratorName(generator: GeneratorType): string {
  const names: Record<GeneratorType, string> = {
    comfyui: 'ComfyUI',
    'stable-diffusion': 'Stable Diffusion',
    novelai: 'NovelAI',
    unknown: '未知',
  };
  return names[generator] || '未知';
}

/**
 * 格式化参数显示
 */
export function formatParameter(
  key: string,
  value: string | number | undefined
): string {
  if (value === undefined || value === null) return '-';

  const formatters: Record<string, (v: string | number) => string> = {
    width: (v) => `${v}px`,
    height: (v) => `${v}px`,
    cfg: (v) => `${v}`,
    steps: (v) => `${v}`,
    seed: (v) => `${v}`,
  };

  return formatters[key]?.(value) || String(value);
}
