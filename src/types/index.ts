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
  createdAt: number;
  updatedAt: number;
}

// ==================== 画师管理 ====================

export interface Artist {
  id: string;
  name: string;
  previewImage?: string;
  isFavorite: boolean;
  useCount: number;
}

export interface ArtistChain {
  id: string;
  name: string;
  artistIds: string[];
  previewImage?: string;
  createdAt: number;
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

export type ModuleType = 'tags' | 'prompts' | 'artists' | 'spell';

export interface AppState {
  currentModule: ModuleType;
  selectedPromptId: string | null;
  selectedArtistId: string | null;
}

// ==================== IndexedDB ====================

export const DB_NAME = 'RookieToolsDB';
export const DB_VERSION = 2;

export const STORES = {
  TAGS: 'tags',
  PROMPTS: 'prompts',
  ARTISTS: 'artists',
  ARTIST_CHAINS: 'artistChains',
  PARSED_IMAGES: 'parsedImages',
  APP_STATE: 'appState',
} as const;
