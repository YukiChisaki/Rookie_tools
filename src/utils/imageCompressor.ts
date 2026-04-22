/**
 * 图片压缩工具
 * 使用 Canvas API 实现客户端图片压缩
 */

export interface CompressedImages {
  /** Base64 缩略图数据 (120x120) */
  thumbnailData: string;
  /** Base64 预览图数据 (最大 800x800) */
  previewData: string;
}

export interface CompressOptions {
  /** 缩略图最大尺寸 */
  thumbnailSize?: number;
  /** 预览图最大尺寸 */
  previewSize?: number;
  /** 压缩质量 (0-1) */
  quality?: number;
  /** 输出格式 */
  type?: string;
}

const DEFAULT_OPTIONS: Required<CompressOptions> = {
  thumbnailSize: 120,
  previewSize: 800,
  quality: 0.85,
  type: 'image/jpeg',
};

/**
 * 读取文件为 Data URL
 */
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 加载图片
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * 计算等比缩放后的尺寸
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxSize: number
): { width: number; height: number } {
  if (originalWidth <= maxSize && originalHeight <= maxSize) {
    return { width: originalWidth, height: originalHeight };
  }

  const ratio = Math.min(maxSize / originalWidth, maxSize / originalHeight);
  return {
    width: Math.round(originalWidth * ratio),
    height: Math.round(originalHeight * ratio),
  };
}

/**
 * 使用 Canvas 压缩图片
 */
function compressWithCanvas(
  img: HTMLImageElement,
  maxSize: number,
  quality: number,
  type: string
): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('无法创建 Canvas 上下文');
  }

  const { width, height } = calculateDimensions(img.width, img.height, maxSize);

  canvas.width = width;
  canvas.height = height;

  // 使用高质量缩放
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 绘制图片
  ctx.drawImage(img, 0, 0, width, height);

  // 导出为 Base64
  return canvas.toDataURL(type, quality);
}

/**
 * 压缩图片文件
 * @param file 原始图片文件
 * @param options 压缩选项
 * @returns 压缩后的缩略图和预览图 Base64 数据
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<CompressedImages> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // 读取文件
    const dataUrl = await readFileAsDataURL(file);

    // 加载图片
    const img = await loadImage(dataUrl);

    // 生成缩略图 (120x120)
    const thumbnailData = compressWithCanvas(
      img,
      opts.thumbnailSize,
      opts.quality,
      opts.type
    );

    // 生成预览图 (最大 800x800)
    const previewData = compressWithCanvas(
      img,
      opts.previewSize,
      opts.quality,
      opts.type
    );

    return {
      thumbnailData,
      previewData,
    };
  } catch (error) {
    console.error('[ImageCompressor] 压缩图片失败:', error);
    throw new Error(
      error instanceof Error ? error.message : '图片压缩失败'
    );
  }
}

/**
 * 从 Base64 数据创建 Blob URL（用于临时展示）
 * @param base64Data Base64 图片数据
 * @returns Blob URL
 */
export function createBlobUrlFromBase64(base64Data: string): string {
  try {
    // 解析 Base64 数据
    const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);

    if (!matches || matches.length !== 3) {
      throw new Error('无效的 Base64 数据');
    }

    const mimeType = matches[1];
    const byteString = atob(matches[2]);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([uint8Array], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('[ImageCompressor] 创建 Blob URL 失败:', error);
    return '';
  }
}

/**
 * 释放 Blob URL
 */
export function revokeBlobUrl(url: string): void {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

/**
 * 获取 Base64 数据的大小（KB）
 */
export function getBase64SizeKB(base64Data: string): number {
  // 移除 data URI 前缀
  const base64 = base64Data.split(',')[1] || base64Data;
  // Base64 每 4 个字符代表 3 个字节
  const bytes = (base64.length * 3) / 4;
  return Math.round(bytes / 1024);
}
