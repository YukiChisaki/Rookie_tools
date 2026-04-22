import type { ParsedImageMetadata } from '../types';

interface PNGChunk {
  name: string;
  data: Uint8Array;
}

export function usePNGMetadata() {
  function readPNGChunks(buffer: ArrayBuffer): PNGChunk[] {
    const chunks: PNGChunk[] = [];
    const view = new DataView(buffer);
    let offset = 8; // Skip PNG signature

    while (offset < buffer.byteLength) {
      const length = view.getUint32(offset);
      const name = String.fromCharCode(
        view.getUint8(offset + 4),
        view.getUint8(offset + 5),
        view.getUint8(offset + 6),
        view.getUint8(offset + 7)
      );

      const data = new Uint8Array(buffer, offset + 8, length);
      chunks.push({ name, data });

      offset += 12 + length; // 4 (length) + 4 (name) + length (data) + 4 (CRC)
    }

    return chunks;
  }

  function extractTextData(chunks: PNGChunk[]): Record<string, string> {
    const result: Record<string, string> = {};

    for (const chunk of chunks) {
      if (chunk.name === 'tEXt') {
        // tEXt: keyword\0text
        const data = chunk.data;
        let separatorIndex = 0;
        for (let i = 0; i < data.length; i++) {
          if (data[i] === 0) {
            separatorIndex = i;
            break;
          }
        }

        const keyword = new TextDecoder().decode(data.slice(0, separatorIndex));
        const text = new TextDecoder().decode(data.slice(separatorIndex + 1));
        result[keyword] = text;
      } else if (chunk.name === 'iTXt') {
        // iTXt: more complex, but similar
        const data = chunk.data;
        let keywordEnd = 0;
        for (let i = 0; i < data.length; i++) {
          if (data[i] === 0) {
            keywordEnd = i;
            break;
          }
        }

        const keyword = new TextDecoder().decode(data.slice(0, keywordEnd));
        // Skip compression flag, compression method, language tag, translated keyword
        let offset = keywordEnd + 1;
        if (data[offset] === 0) { // Not compressed
          offset += 2; // compression flag + method
          // Skip language tag
          while (offset < data.length && data[offset] !== 0) offset++;
          offset++; // null terminator
          // Skip translated keyword
          while (offset < data.length && data[offset] !== 0) offset++;
          offset++; // null terminator

          const text = new TextDecoder().decode(data.slice(offset));
          result[keyword] = text;
        }
      }
    }

    return result;
  }

  function parseStableDiffusionParameters(params: string): ParsedImageMetadata {
    const metadata: ParsedImageMetadata = {
      positive: '',
      negative: '',
    };

    // Split by "Negative prompt:" to separate positive and negative
    const negativeMatch = params.match(/Negative prompt:\s*([\s\S]*?)(?=\n\w+:|$)/);
    
    if (negativeMatch) {
      metadata.negative = negativeMatch[1].trim();
      metadata.positive = params.substring(0, params.indexOf('Negative prompt:')).trim();
    } else {
      // Try to find parameters section
      const stepsMatch = params.match(/\nSteps:\s*\d+/);
      if (stepsMatch) {
        metadata.positive = params.substring(0, stepsMatch.index).trim();
      } else {
        metadata.positive = params.trim();
      }
    }

    // Extract parameters
    const paramMatch = params.match(/Steps:\s*(\d+),\s*Sampler:\s*([^,]+),\s*CFG scale:\s*([\d.]+),.*Seed:\s*(\d+)/);
    if (paramMatch) {
      metadata.steps = parseInt(paramMatch[1]);
      metadata.sampler = paramMatch[2].trim();
      metadata.cfg = parseFloat(paramMatch[3]);
      metadata.seed = parseInt(paramMatch[4]);
    }

    // Extract model if present
    const modelMatch = params.match(/Model:\s*([^,\n]+)/);
    if (modelMatch) {
      metadata.model = modelMatch[1].trim();
    }

    // Extract size
    const sizeMatch = params.match(/Size:\s*(\d+)x(\d+)/);
    if (sizeMatch) {
      metadata.width = parseInt(sizeMatch[1]);
      metadata.height = parseInt(sizeMatch[2]);
    }

    return metadata;
  }

  async function parseImage(file: File): Promise<ParsedImageMetadata | null> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        try {
          const buffer = reader.result as ArrayBuffer;
          const chunks = readPNGChunks(buffer);
          const textData = extractTextData(chunks);

          // Check for ComfyUI workflow
          if (textData.workflow) {
            try {
              const workflow = JSON.parse(textData.workflow);
              const metadata = extractComfyUIMetadata(workflow);
              resolve(metadata);
              return;
            } catch (e) {
              console.error('Failed to parse ComfyUI workflow:', e);
            }
          }

          // Check for Stable Diffusion parameters
          if (textData.parameters) {
            const metadata = parseStableDiffusionParameters(textData.parameters);
            resolve(metadata);
            return;
          }

          // Check for prompt
          if (textData.prompt) {
            resolve({
              positive: textData.prompt,
              negative: textData.negative || '',
            });
            return;
          }

          resolve(null);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  function extractComfyUIMetadata(workflow: any): ParsedImageMetadata {
    const metadata: ParsedImageMetadata = {
      positive: '',
      negative: '',
      workflow,
    };

    // Try to find KSampler or similar nodes
    if (workflow.nodes) {
      for (const node of workflow.nodes) {
        if (node.type === 'KSampler' || node.type === 'KSamplerAdvanced') {
          if (node.inputs) {
            metadata.seed = node.inputs.seed;
            metadata.steps = node.inputs.steps;
            metadata.cfg = node.inputs.cfg;
            metadata.sampler = node.inputs.sampler_name;
          }
        }
      }
    }

    return metadata;
  }

  return {
    parseImage,
    parseStableDiffusionParameters,
  };
}
