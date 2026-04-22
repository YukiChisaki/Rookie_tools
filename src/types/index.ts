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

// ==================== 图片解析 ====================

export interface ParsedImageMetadata {
  positive: string;
  negative: string;
  model?: string;
  sampler?: string;
  steps?: number;
  cfg?: number;
  seed?: number;
  width?: number;
  height?: number;
  workflow?: object;
}

export interface ParsedImage {
  id: string;
  fileName: string;
  originalBlob: Blob;
  thumbnailBlob: Blob;
  metadata: ParsedImageMetadata;
  parsedAt: number;
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

// ==================== 应用状态 ====================

export type ModuleType = 'parser' | 'tags' | 'prompts' | 'artists';

export interface AppState {
  currentModule: ModuleType;
  selectedPromptId: string | null;
  selectedArtistId: string | null;
}

// ==================== IndexedDB ====================

export const DB_NAME = 'RookieToolsDB';
export const DB_VERSION = 1;

export const STORES = {
  TAGS: 'tags',
  PROMPTS: 'prompts',
  PARSED_IMAGES: 'parsedImages',
  ARTISTS: 'artists',
  ARTIST_CHAINS: 'artistChains',
  APP_STATE: 'appState',
} as const;
