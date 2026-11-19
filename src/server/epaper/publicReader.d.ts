export interface ZoomModel {
  currentZoom: number;
  minZoom: number;
  maxZoom: number;
  panX: number;
  panY: number;
  step: number;
}

export interface FormattedReadingModeArticle {
  headline: string;
  fontSize: number;
  lineHeight: number;
  lines: string[];
  wordCount: number;
  readingTimeMinutes: number;
  isDevanagari: boolean;
  body: string;
  byline: string;
  photographer: string;
  imageUrl?: string;
}

export interface SocialClippingBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  aspectRatio: string;
  ratioValue: number;
}

export class PublicReaderEngine {
  static getZoomModel(initialZoom?: number, pan?: { x: number; y: number }): ZoomModel;
  static computeZoom(current: number, delta: number): { zoom: number };
  static formatReadingModeArticle(
    elementOrArticle: any,
    options?: { fontSize?: number }
  ): FormattedReadingModeArticle;
  static generateSocialClippingBounds(
    rect: { x: number; y: number; width: number; height: number },
    format?: string
  ): SocialClippingBounds;
}
