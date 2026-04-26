// ==================== 标签系统 ====================

export type TagCategory = 
  | 'artist' 
  | 'style' 
  | 'quality' 
  | 'composition' 
  | 'lighting' 
  | 'character' 
  | 'environment';

export interface Tag {
  id: string;
  name: string;
  aliases: string[];
  category: TagCategory;
  useCount: number;
}

export interface TagWithWeight {
  tagId: string;
  weight: number;
}

export const TAG_CATEGORY_LABELS: Record<TagCategory, string> = {
  artist: '画师',
  style: '风格',
  quality: '质量',
  composition: '构图',
  lighting: '光影',
  character: '角色',
  environment: '环境',
};

// ==================== 提示词管理 ====================

export interface PromptRecord {
  id: string;
  name: string;
  positive: string;
  negative: string;
  tags: TagWithWeight[];
  source: 'manual' | 'parsed';
  /** Base64缩略图数据(120x120)，用于卡片展示 */
  thumbnailData?: string;
  /** Base64预览图数据(短边>900时缩放到900px)，用于弹窗大图展示 */
  previewData?: string;
  /** 图片生成参数（从魔法解析导入时携带） */
  parameters?: ImageParameters;
  createdAt: number;
  updatedAt: number;
}

// ==================== 画师管理（蜜汁配方） ====================

/**
 * 画师串（Artist Chain / Recipe）
 * 用户创建的画师组合配方，包含名称、关联图片和一组画师名
 */
export interface ArtistChain {
  id: string;
  /** 配方名称 */
  name: string;
  /** 画师名称数组（直接存储名称字符串） */
  artistNames: string[];
  /** 卡片标签数组（用户自定义分类标签，逗号分隔输入） */
  tags?: string[];
  /** Base64 缩略图 (120x120)，用于瀑布流卡片展示 */
  thumbnailData?: string;
  /** Base64 预览图 (短边≤900px)，用于详情弹窗大图展示 */
  previewData?: string;
  createdAt: number;
  updatedAt: number;
}

// ==================== 魔法解析 ====================

export type GeneratorType = 'comfyui' | 'stable-diffusion' | 'novelai' | 'unknown';

export interface ImageParameters {
  // 基本参数
  model?: string;
  modelHash?: string;
  sampler?: string;
  scheduler?: string;
  schedule?: string;
  steps?: number;
  cfg?: number;
  seed?: number;
  width?: number;
  height?: number;
  // 高清修复参数
  denoisingStrength?: number;
  hiresUpscale?: number;
  hiresSteps?: number;
  hiresUpscaler?: string;
  hiresCfg?: number;
  // 其他参数
  clipSkip?: number;
  version?: string;
  // 允许其他扩展参数
  [key: string]: string | number | undefined;
}

export interface ParsedImageData {
  id: string;
  fileName: string;
  /** @deprecated 请使用 thumbnailData 和 previewData */
  previewUrl?: string;
  /** Base64 缩略图数据 (120x120)，用于历史列表展示 */
  thumbnailData: string;
  /** Base64 预览图数据 (最大 800x800)，用于解析结果页展示 */
  previewData: string;
  generator: GeneratorType;
  positivePrompt: string;
  negativePrompt: string;
  parameters: ImageParameters;
  rawMetadata: Record<string, unknown>;
  createdAt: number;
}

// ==================== 应用状态 ====================

export type ModuleType = 'tags' | 'prompts' | 'artists' | 'spell' | 'tutorial';

export interface AppState {
  currentModule: ModuleType;
  selectedPromptId: string | null;
  selectedArtistId: string | null;
}

// ==================== IndexedDB ====================

export const DB_NAME = 'RookieToolsDB';
export const DB_VERSION = 3;

export const STORES = {
  TAGS: 'tags',
  PROMPTS: 'prompts',
  ARTISTS: 'artists',
  ARTIST_CHAINS: 'artistChains',
  PARSED_IMAGES: 'parsedImages',
  APP_STATE: 'appState',
} as const;
