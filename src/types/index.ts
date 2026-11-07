export type ContentType = 'quran' | 'hadith' | 'quote' | 'dua';

export interface QuoteItem {
  id: string;
  type: ContentType;
  cats: string[];
  ar: string;
  bn: string;
  ref: string;
  topic?: string;
}

export type AspectRatio = '1080x1080' | '1080x1350' | '1080x1920' | '1200x630';

export interface AspectRatioOption {
  id: AspectRatio;
  label: string;
  ratio: string;
  description: string;
  width: number;
  height: number;
}

export type BrandPosition = 
  | 'top-center' 
  | 'top-left' 
  | 'top-right' 
  | 'bottom-center' 
  | 'bottom-left' 
  | 'bottom-right';

export interface BrandConfig {
  name: string;
  tagline: string;
  handle: string;
  showLogo: boolean;
  showTag: boolean;
  showHandle: boolean;
  logo: string | null;
  pos: BrandPosition;
  logoSize: number;
  watermark: boolean;
}

export type ThemeId = 
  | 'golden' 
  | 'emerald' 
  | 'classic' 
  | 'black' 
  | 'sapphire' 
  | 'crimson' 
  | 'minimal' 
  | 'nokia';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  nameEn: string;
  text: string;
  accent: string;
  ar: string;
  border: string;
  bgDesc: string;
  previewBg: string;
}

export type BorderStyle = 'none' | 'simple' | 'double' | 'ornate' | 'arch';
export type PatternStyle = 'none' | 'geometric' | 'arabesque' | 'stars' | 'subtle';

export interface PosterConfig {
  bn: string;
  ar: string;
  ref: string;
  showAr: boolean;
  showBismillah: boolean;
  theme: ThemeId;
  size: AspectRatio;
  font: string;
  fontSize: number;
  arabicSizeRatio: number;
  lineHeight: number;
  autoFit: boolean;
  textColor: string;
  accentColor: string;
  arabicColor: string;
  align: 'left' | 'center' | 'right';
  refPos: 'below' | 'top' | 'bottom';
  overlay: number;
  bgType: 'theme' | 'custom' | 'pattern';
  bgPattern: PatternStyle;
  borderStyle: BorderStyle;
  decorCorner: boolean;
  decorDivider: boolean;
  bgDataUrl?: string | null;
}

export interface SavedDesign {
  id: string;
  title: string;
  created: number;
  updated: number;
  poster: PosterConfig;
  thumb: string;
}

export interface UserStats {
  exports: number;
  caps: number;
  saved: number;
}
