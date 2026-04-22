import type { ParsedImageData } from '../../types';

export interface ImageUploaderProps {
  isLoading?: boolean;
}

export interface ImageUploaderEmits {
  (e: 'upload', file: File): void;
  (e: 'drag-over', value: boolean): void;
}

export interface ParseResultProps {
  image: ParsedImageData;
}

export interface ParseResultEmits {
  (e: 'copy', text: string, type: 'positive' | 'negative' | 'full'): void;
  (e: 'import'): void;
  (e: 'close'): void;
}

export interface HistoryListProps {
  images: ParsedImageData[];
  currentId?: string;
}

export interface HistoryListEmits {
  (e: 'select', image: ParsedImageData): void;
  (e: 'delete', id: string): void;
}

export interface MetadataViewerProps {
  metadata: Record<string, unknown>;
}
