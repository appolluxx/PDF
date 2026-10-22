export type ToolId =
  | 'merge'
  | 'split'
  | 'compress'
  | 'pdf-to-img'
  | 'img-to-pdf'
  | 'pdf-to-word'
  | 'rotate'
  | 'organize'
  | 'watermark'
  | 'page-numbers'
  | 'protect'
  | 'unlock';

export type ToolCategory = 'all' | 'convert' | 'organize' | 'optimize' | 'security';

export interface ToolDef {
  id: ToolId;
  titleKey: string;
  descKey: string;
  category: ToolCategory;
  icon: string;
  color?: string;
  badge?: string;
  accept: string;
  multiple: boolean;
}

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount?: number;
  previewUrls?: string[];
  rotation?: number;
}

export interface PageInfo {
  pageNumber: number;
  previewUrl: string;
  rotation: number;
  deleted?: boolean;
}

export type CompressionLevel = 'extreme' | 'recommended' | 'low';

export interface WatermarkOptions {
  text: string;
  fontSize: number;
  opacity: number;
  color: string;
  rotation: number;
  position: 'center' | 'diagonal' | 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left';
}

export interface PageNumberOptions {
  position: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right';
  format: 'number' | 'page-x-of-y' | 'thai-page-x-of-y';
  fontSize: number;
  margin: number;
}

export interface ImageToPdfOptions {
  orientation: 'auto' | 'portrait' | 'landscape';
  pageSize: 'a4' | 'fit' | 'letter';
  margin: 'none' | 'small' | 'large';
}
