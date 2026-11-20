/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master Production Graphic Rendering Engine & Broadsheet Newspaper Renderer
 * 
 * Strict Invariant: Pure Canvas/OffscreenCanvas rendering logic separate from UI components.
 * Supports:
 * - 4:5, 1:1, 9:16, 16:9, 3:4 social aspect ratios.
 * - Broadsheet 32.9 cm x 52.0 cm (932.6 pt x 1474.0 pt) multi-column rendering.
 * - Dynamic Devanagari typography scaling and Indic-conjunct-safe word-gap justification.
 * - Mandatory ASCI 'विज्ञापन' badge on all advertisement placements.
 * - Layer compositing: Backgrounds, Images, Badges, Logos, Text, Mastheads, Stories, Ads.
 * - High-resolution PNG, WebP, and 300 DPI print export matching preview.
 */

import type {
  GraphicAspectRatio,
  GraphicItem,
  GraphicLayer,
  GraphicTemplate,
  EpaperPageDoc,
  EpaperPageElement,
  EpaperPageElementBounds,
} from '../types/index.ts';
import {
  BroadsheetGridEngine,
  BROADSHEET_CONSTANTS,
  calculateColumnGrid,
  detectAllCollisions,
} from '../utils/epaperLayout.ts';
import type {
  ColumnGridConfig,
  SnapGuideLine,
  CollisionReport,
  ResizeHandleType,
} from '../utils/epaperLayout.ts';

export {
  BroadsheetGridEngine,
  BROADSHEET_CONSTANTS,
  calculateColumnGrid,
  detectAllCollisions,
};
export type { ColumnGridConfig, SnapGuideLine, CollisionReport, ResizeHandleType };

export interface RenderOptions {
  scale?: number; // scale multiplier (default 1 for 1080p canvas)
  targetFormat?: 'png' | 'webp';
  quality?: number;
  showWatermark?: boolean;
}

export interface ArticleClippingRenderOptions {
  headline: string;
  body: string;
  reporterName: string;
  reporterBadge?: string;
  reporterAvatar?: string;
  photoUrl?: string;
  date?: string;
  district?: string;
  editionTitle?: string;
  format?: '1:1' | '4:5';
  category?: string;
}

export const ASPECT_RATIO_DIMENSIONS: Record<
  GraphicAspectRatio,
  { width: number; height: number; label: string }
> = {
  '4:5': { width: 1080, height: 1350, label: '4:5 (इंस्टाग्राम / फेसबुक फीड)' },
  '1:1': { width: 1080, height: 1080, label: '1:1 (स्क्वायर / व्हाट्सएप स्टेटस)' },
  '9:16': { width: 1080, height: 1920, label: '9:16 (स्टोरी / रील / वर्टिकल)' },
  '16:9': { width: 1920, height: 1080, label: '16:9 (वेब / लैंडस्केप थंबनेल)' },
  '3:4': { width: 1080, height: 1440, label: '3:4 (पोर्ट्रेट बैनर)' },
};

// ============================================================================
// TYPOGRAPHY CONTRACTS & DEVANAGARI JUSTIFICATION ENGINE
// ============================================================================

export interface JustifiedLineResult {
  justified: boolean;
  text: string;
  words: string[];
  wordWidths: number[];
  wordCount: number;
  spacePerGap: number;
  alignment: 'JUSTIFIED' | 'LEFT' | 'CENTER';
  gaps: number;
  lineWidth: number;
}

export interface ParagraphLayoutResult {
  lines: JustifiedLineResult[];
  totalLines: number;
  totalHeight: number;
  isOverflowing: boolean;
  terminalLineJustified: boolean;
}

export class DevanagariTypographyEngine {
  /**
   * Detects Devanagari script range (\u0900-\u097F) with conjuncts, matras, halants, nuktas.
   */
  public static isComplexDevanagari(text: string): boolean {
    return /[\u0900-\u097F]/.test(text) && /[\u094D\u093E-\u094C\u0902\u0903\u093C]/.test(text);
  }

  /**
   * Justifies a single line of Devanagari text by distributing extra width strictly across
   * inter-word gaps without breaking or mutating complex Indic conjuncts.
   * Invariant: Terminal lines of paragraphs or single-word lines remain un-justified (LEFT).
   */
  public static justifyDevanagariLine(
    words: string[],
    targetWidth: number,
    fontSize = 12,
    isTerminalLine = false,
    ctx?: CanvasRenderingContext2D
  ): JustifiedLineResult {
    if (!words || words.length === 0) {
      return {
        justified: false,
        text: '',
        words: [],
        wordWidths: [],
        wordCount: 0,
        spacePerGap: 0,
        alignment: 'LEFT',
        gaps: 0,
        lineWidth: 0,
      };
    }

    // Estimate intrinsic word widths (approx 0.62 * fontSize * length for Indic script when headless)
    const wordWidths = words.map((w) =>
      ctx ? ctx.measureText(w).width : Number((w.length * fontSize * 0.62).toFixed(2))
    );
    const sumWordWidths = wordWidths.reduce((a, b) => a + b, 0);

    // Terminal line or single-word line MUST remain left-aligned without extra gap stretching
    if (words.length === 1 || isTerminalLine) {
      return {
        justified: false,
        text: words.join(' '),
        words,
        wordWidths,
        wordCount: words.length,
        spacePerGap: 0,
        alignment: 'LEFT',
        gaps: Math.max(0, words.length - 1),
        lineWidth: sumWordWidths,
      };
    }

    const gaps = words.length - 1;
    const remainingWidth = Math.max(0, targetWidth - sumWordWidths);
    const spacePerGap = Number((remainingWidth / gaps).toFixed(2));

    // Maximum space clamp to prevent typographic white rivers
    const normalSpace = ctx ? ctx.measureText(' ').width : fontSize * 0.35;
    if (spacePerGap > normalSpace * 3.5 || spacePerGap > 24) {
      return {
        justified: false,
        text: words.join(' '),
        words,
        wordWidths,
        wordCount: words.length,
        spacePerGap: 0,
        alignment: 'LEFT',
        gaps,
        lineWidth: sumWordWidths,
      };
    }

    return {
      justified: true,
      text: words.join(' '),
      words,
      wordWidths,
      wordCount: words.length,
      spacePerGap,
      alignment: 'JUSTIFIED',
      gaps,
      lineWidth: targetWidth,
    };
  }

  /**
   * Wraps and justifies an entire paragraph of Devanagari text to a target width.
   * Guarantees that the final terminal line stays left-aligned.
   */
  public static wrapAndJustifyParagraph(
    text: string,
    targetWidth: number,
    fontSize = 12,
    maxLines = 10,
    ctx?: CanvasRenderingContext2D
  ): ParagraphLayoutResult {
    const rawWords = text.split(/\s+/).filter(Boolean);
    const lines: JustifiedLineResult[] = [];
    let currentWords: string[] = [];
    let currentWidth = 0;
    const normalSpace = ctx ? ctx.measureText(' ').width : fontSize * 0.3;

    for (const word of rawWords) {
      const wordWidth = ctx ? ctx.measureText(word).width : word.length * fontSize * 0.62;
      const testWidth = currentWidth + wordWidth + (currentWords.length > 0 ? normalSpace : 0);

      if (testWidth > targetWidth && currentWords.length > 0) {
        lines.push(this.justifyDevanagariLine(currentWords, targetWidth, fontSize, false, ctx));
        currentWords = [word];
        currentWidth = wordWidth;
      } else {
        currentWords.push(word);
        currentWidth += (currentWords.length > 1 ? normalSpace : 0) + wordWidth;
      }
    }

    if (currentWords.length > 0) {
      // Terminal line of paragraph stays strictly left-aligned
      lines.push(this.justifyDevanagariLine(currentWords, targetWidth, fontSize, true, ctx));
    }

    const estimatedLineHeight = fontSize * 1.35;
    const totalHeight = lines.length * estimatedLineHeight;
    const isOverflowing = lines.length > maxLines;

    return {
      lines,
      totalLines: lines.length,
      totalHeight,
      isOverflowing,
      terminalLineJustified: lines[lines.length - 1]?.justified === true,
    };
  }

  /**
   * Renders justified Devanagari text directly to a canvas 2D rendering context.
   */
  public static renderJustifiedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    width: number,
    lineHeight: number,
    fontSize: number,
    fontFamily = '"Noto Sans Devanagari", sans-serif',
    maxHeight?: number,
    color = '#0F172A'
  ): { linesRendered: number; totalHeight: number; isOverflowing: boolean } {
    ctx.save();
    ctx.font = `400 ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'alphabetic';

    const maxLines = maxHeight ? Math.floor(maxHeight / lineHeight) : 999;
    const layout = this.wrapAndJustifyParagraph(text, width, fontSize, maxLines, ctx);

    let currentY = y + fontSize; // Baseline offset
    let linesRendered = 0;

    for (let i = 0; i < layout.lines.length; i++) {
      if (linesRendered >= maxLines) break;

      const line = layout.lines[i];
      let curX = x;

      if (line.justified && line.words.length > 1) {
        for (let w = 0; w < line.words.length; w++) {
          ctx.fillText(line.words[w], curX, currentY);
          curX += line.wordWidths[w] + line.spacePerGap;
        }
      } else {
        ctx.fillText(line.text, x, currentY);
      }

      currentY += lineHeight;
      linesRendered++;
    }

    ctx.restore();
    return {
      linesRendered,
      totalHeight: linesRendered * lineHeight,
      isOverflowing: layout.lines.length > maxLines,
    };
  }
}

// ============================================================================
// BROADSHEET RENDER OPTIONS
// ============================================================================

export interface BroadsheetRenderOptions {
  scale?: number;                // Zoom scale (default 1.0)
  panOffset?: { x: number; y: number };
  showGrid?: boolean;            // Display modular column overlays
  showGuidelines?: boolean;      // Display magnetic snap lines
  showMargins?: boolean;         // Display printable area boundary
  selectedElementId?: string | null;
  hoveredElementId?: string | null;
  draggedBounds?: EpaperPageElementBounds | null;
  activeSnapLines?: SnapGuideLine[];
  collidingElementIds?: string[];
  renderTarget?: 'screen' | 'export_print' | 'thumbnail';
  showTrimAndBleedMarks?: boolean; // Draw prepress corner trim marks, registration targets & CMYK swatches
  dpi?: number;
  onImageLoaded?: () => void;
}

// Image element cache to avoid repeated network fetches
const imageElementCache = new Map<string, HTMLImageElement>();

function loadImage(url: string): Promise<HTMLImageElement> {
  if (imageElementCache.has(url)) {
    const cached = imageElementCache.get(url)!;
    if (cached.complete) return Promise.resolve(cached);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageElementCache.set(url, img);
      resolve(img);
    };
    img.onerror = () => {
      // Fallback on error to prevent total render failure
      resolve(img);
    };
    img.src = url;
  });
}

// ============================================================================
// MASTER GRAPHIC RENDERER CLASS
// ============================================================================

export class GraphicRenderer {
  /**
   * Resolves canonical dimensions for a given aspect ratio.
   */
  public static getDimensions(aspectRatio: GraphicAspectRatio): { width: number; height: number } {
    return ASPECT_RATIO_DIMENSIONS[aspectRatio] || ASPECT_RATIO_DIMENSIONS['4:5'];
  }

  /**
   * Wraps and measures Devanagari text with auto-scaling to prevent bounds overflow.
   */
  public static measureAndWrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    initialFontSize: number,
    maxWidth: number,
    maxHeight: number,
    fontFamily = 'Noto Sans Devanagari, Rozha One, sans-serif',
    fontWeight: string | number = '700',
    lineHeightMultiplier = 1.35
  ): { lines: string[]; finalFontSize: number; lineHeight: number } {
    let fontSize = initialFontSize;
    const minFontSize = 18;

    while (fontSize >= minFontSize) {
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      const lineHeight = fontSize * lineHeightMultiplier;
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = words[0] || '';

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const testLine = `${currentLine} ${word}`;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      lines.push(currentLine);

      const totalHeight = lines.length * lineHeight;
      if (totalHeight <= maxHeight || fontSize <= minFontSize) {
        return { lines, finalFontSize: fontSize, lineHeight };
      }

      fontSize -= 2; // Step down font size
    }

    return {
      lines: [text],
      finalFontSize: minFontSize,
      lineHeight: minFontSize * lineHeightMultiplier,
    };
  }

  /**
   * Draws a rounded rectangle path on canvas.
   */
  public static roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /**
   * Renders the complete social graphic onto a target canvas element.
   */
  public static async renderToCanvas(
    canvas: HTMLCanvasElement,
    graphic: Partial<GraphicItem>,
    template?: Partial<GraphicTemplate>,
    options: RenderOptions = {}
  ): Promise<void> {
    const aspectRatio = graphic.aspectRatio || template?.aspectRatio || '4:5';
    const dims = this.getDimensions(aspectRatio);
    const scale = options.scale || 1;

    canvas.width = dims.width * scale;
    canvas.height = dims.height * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('ERR_CANVAS_CONTEXT: Unable to obtain 2D canvas context.');

    ctx.save();
    ctx.scale(scale, scale);

    const W = dims.width;
    const H = dims.height;

    // 1. Render Background
    const bgStyle = template?.backgroundStyle || graphic.backgroundStyle || 'gradient-red';
    const bgColor = template?.backgroundColor || graphic.themeColor || '#0F172A';

    if (bgStyle === 'gradient-red') {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#1E293B');
      grad.addColorStop(0.5, '#0F172A');
      grad.addColorStop(1, '#7F1D1D');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    } else if (bgStyle === 'dark-charcoal') {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#0F172A');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    } else if (bgStyle === 'navy-blue') {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#0F172A');
      grad.addColorStop(1, '#1E3A8A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    } else if (bgStyle === 'breaking-yellow') {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#78350F');
      grad.addColorStop(1, '#0F172A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, W, H);
    }

    // 2. Render Main Featured Image if present
    const imageUrl = graphic.imageUrl || template?.layers?.find((l) => l.type === 'image')?.content;
    if (imageUrl) {
      try {
        const img = await loadImage(imageUrl);
        if (img && img.width > 0) {
          const imgY = H * 0.11;
          const imgH = H * 0.48;

          // Draw image with aspect fill
          ctx.save();
          const imgAspect = img.width / img.height;
          const targetAspect = W / imgH;

          let sx = 0, sy = 0, sw = img.width, sh = img.height;
          if (imgAspect > targetAspect) {
            sw = img.height * targetAspect;
            sx = (img.width - sw) / 2;
          } else {
            sh = img.width / targetAspect;
            sy = (img.height - sh) / 2;
          }

          ctx.drawImage(img, sx, sy, sw, sh, 0, imgY, W, imgH);

          // Subtle gradient overlay over image bottom to blend seamlessly into dark content area
          const overlayGrad = ctx.createLinearGradient(0, imgY + imgH - 120, 0, imgY + imgH);
          overlayGrad.addColorStop(0, 'rgba(15, 23, 42, 0)');
          overlayGrad.addColorStop(1, 'rgba(15, 23, 42, 1)');
          ctx.fillStyle = overlayGrad;
          ctx.fillRect(0, imgY + imgH - 120, W, 120);

          ctx.restore();
        }
      } catch (err) {
        console.warn('[GraphicRenderer] Image load warning:', err);
      }
    }

    // 3. Render Top Brand Masthead Bar
    const topBarHeight = H * 0.10;
    const mastheadGrad = ctx.createLinearGradient(0, 0, W, 0);
    mastheadGrad.addColorStop(0, '#0F172A');
    mastheadGrad.addColorStop(1, '#1E293B');
    ctx.fillStyle = mastheadGrad;
    ctx.fillRect(0, 0, W, topBarHeight);

    // Channel Tri-Color Border line
    ctx.fillStyle = '#ED1727';
    ctx.fillRect(0, topBarHeight - 6, W * 0.33, 6);
    ctx.fillStyle = '#FDE900';
    ctx.fillRect(W * 0.33, topBarHeight - 6, W * 0.33, 6);
    ctx.fillStyle = '#344FD6';
    ctx.fillRect(W * 0.66, topBarHeight - 6, W * 0.34, 6);

    // Channel Logo & Title
    ctx.save();
    // Red accent globe box
    this.roundRect(ctx, 40, 24, 56, 56, 12);
    ctx.fillStyle = '#ED1727';
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ब', 68, 52);

    // Brand Name Text
    ctx.textAlign = 'left';
    ctx.font = '900 36px "Rozha One", serif, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('ब्रेकिंग न्यूज़ वाला', 114, 48);

    ctx.font = '700 16px sans-serif';
    ctx.fillStyle = '#ED1727';
    (ctx as any).letterSpacing = '2px';
    ctx.fillText('BREAKING NEWS WALA • MADHYA PRADESH', 116, 74);
    ctx.restore();

    // 4. Render Badges (Breaking News & District Tag)
    const isBreaking = graphic.isBreaking !== undefined ? graphic.isBreaking : true;
    const districtText = graphic.districtName || 'मध्य प्रदेश (समस्त 55 जिले)';

    const badgesY = H * 0.60;

    // Breaking Ribbon
    if (isBreaking) {
      ctx.save();
      const ribbonText = '🚨 बड़ी खबर | BREAKING';
      ctx.font = '900 24px "Noto Sans Devanagari", sans-serif';
      const textWidth = ctx.measureText(ribbonText).width;
      const ribbonW = textWidth + 36;
      const ribbonH = 48;

      this.roundRect(ctx, 40, badgesY, ribbonW, ribbonH, 8);
      ctx.fillStyle = '#ED1727';
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.textBaseline = 'middle';
      ctx.fillText(ribbonText, 58, badgesY + ribbonH / 2);
      ctx.restore();
    }

    // District Pill
    ctx.save();
    ctx.font = '800 22px "Noto Sans Devanagari", sans-serif';
    const distMetrics = ctx.measureText(districtText);
    const distW = distMetrics.width + 32;
    const distH = 48;
    const distStartX = isBreaking ? 40 + 320 : 40;

    this.roundRect(ctx, distStartX, badgesY, distW, distH, 8);
    ctx.fillStyle = '#FDE900';
    ctx.fill();

    ctx.fillStyle = '#0F172A';
    ctx.textBaseline = 'middle';
    ctx.fillText(districtText, distStartX + 16, badgesY + distH / 2);
    ctx.restore();

    // 5. Render Main Headline Text (Vernacular Anti-Clipping Devanagari)
    const headline =
      graphic.headline ||
      graphic.title ||
      'मध्य प्रदेश में महत्वपूर्ण प्रशासनिक फैसला, नए दिशा-निर्देश तत्काल प्रभाव से लागू';

    const headlineAreaX = 40;
    const headlineAreaY = badgesY + 70;
    const headlineAreaW = W - 80;
    const headlineAreaH = H * 0.22;

    const wrappedHeadline = this.measureAndWrapText(
      ctx,
      headline,
      50,
      headlineAreaW,
      headlineAreaH,
      '"Noto Sans Devanagari", "Rozha One", sans-serif',
      '800',
      1.35
    );

    ctx.save();
    ctx.font = `800 ${wrappedHeadline.finalFontSize}px "Noto Sans Devanagari", "Rozha One", sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    let textY = headlineAreaY + wrappedHeadline.finalFontSize;
    for (const line of wrappedHeadline.lines) {
      ctx.fillText(line, headlineAreaX, textY);
      textY += wrappedHeadline.lineHeight;
    }
    ctx.restore();

    // 6. Render Subtext / Standfirst
    const subtext =
      graphic.subtext ||
      'संबंधित विभाग ने आदेश की प्रतिलिपि समस्त जिला कलेक्टरों व पुलिस अधीक्षकों को प्रेषित की।';

    if (subtext) {
      const subAreaY = textY + 15;
      const subAreaH = H * 0.08;

      const wrappedSub = this.measureAndWrapText(
        ctx,
        subtext,
        24,
        headlineAreaW,
        subAreaH,
        '"Noto Sans Devanagari", sans-serif',
        '500',
        1.4
      );

      ctx.save();
      ctx.font = `500 ${wrappedSub.finalFontSize}px "Noto Sans Devanagari", sans-serif`;
      ctx.fillStyle = '#CBD5E1';

      let curSubY = subAreaY + wrappedSub.finalFontSize;
      for (const sLine of wrappedSub.lines) {
        ctx.fillText(sLine, headlineAreaX, curSubY);
        curSubY += wrappedSub.lineHeight;
      }
      ctx.restore();
    }

    // 7. Render Footer Bar (Byline, Channel Tagline, Verification)
    const footerH = 64;
    const footerY = H - footerH;

    ctx.save();
    ctx.fillStyle = '#0B1120';
    ctx.fillRect(0, footerY, W, footerH);

    ctx.fillStyle = '#64748B';
    ctx.font = '600 20px "Noto Sans Devanagari", sans-serif';
    ctx.textBaseline = 'middle';
    const authorStr = graphic.authorName ? `संवाददाता: ${graphic.authorName}` : 'ब्यूरो रिपोर्ट';
    ctx.fillText(`${authorStr} • विश्वसनीय व निष्पक्ष पत्रकारिता`, 40, footerY + footerH / 2);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ED1727';
    ctx.font = '700 20px sans-serif';
    ctx.fillText('breakingnewswala.com', W - 40, footerY + footerH / 2);
    ctx.restore();

    ctx.restore();
  }


  // ==========================================================================
  // BROADSHEET CANVAS RENDERING PIPELINE
  // ==========================================================================

  /**
   * Renders an entire broadsheet newspaper page with modular column grid,
   * magnetic snap overlays, elements, and Devanagari justified typography.
   */
  public static renderBroadsheetPage(
    canvas: HTMLCanvasElement | any,
    page: EpaperPageDoc,
    options: BroadsheetRenderOptions = {}
  ): void {
    const scale = options.scale || 1.0;
    const panX = options.panOffset?.x || 0;
    const panY = options.panOffset?.y || 0;

    const pageWidth = BROADSHEET_CONSTANTS.PAGE_WIDTH_PT;
    const pageHeight = BROADSHEET_CONSTANTS.PAGE_HEIGHT_PT;

    if (canvas.width !== undefined && canvas.height !== undefined) {
      canvas.width = Math.round(pageWidth * scale);
      canvas.height = Math.round(pageHeight * scale);
    }

    const ctx = canvas.getContext ? canvas.getContext('2d') : null;
    if (!ctx) return;

    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(panX, panY);

    // 1. Background newsprint
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, pageWidth, pageHeight);

    // 1b. Prepress Trim & Bleed Marks, Registration Crosshairs & CMYK Calibration Bars
    if (options.showTrimAndBleedMarks) {
      ctx.save();
      const markLength = 20;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 0.75;
      ctx.setLineDash([]);

      const tLeft = BROADSHEET_CONSTANTS.MARGIN_LEFT_PT;
      const tTop = BROADSHEET_CONSTANTS.MARGIN_TOP_PT;
      const tRight = BROADSHEET_CONSTANTS.MARGIN_LEFT_PT + BROADSHEET_CONSTANTS.PRINTABLE_WIDTH_PT;
      const tBottom = BROADSHEET_CONSTANTS.MARGIN_TOP_PT + BROADSHEET_CONSTANTS.PRINTABLE_HEIGHT_PT;

      // 8 Corner Crop Marks
      ctx.beginPath();
      ctx.moveTo(tLeft, tTop);
      ctx.lineTo(tLeft - markLength, tTop);
      ctx.moveTo(tLeft, tTop);
      ctx.lineTo(tLeft, tTop - markLength);

      ctx.moveTo(tRight, tTop);
      ctx.lineTo(tRight + markLength, tTop);
      ctx.moveTo(tRight, tTop);
      ctx.lineTo(tRight, tTop - markLength);

      ctx.moveTo(tLeft, tBottom);
      ctx.lineTo(tLeft - markLength, tBottom);
      ctx.moveTo(tLeft, tBottom);
      ctx.lineTo(tLeft, tBottom + markLength);

      ctx.moveTo(tRight, tBottom);
      ctx.lineTo(tRight + markLength, tBottom);
      ctx.moveTo(tRight, tBottom);
      ctx.lineTo(tRight, tBottom + markLength);
      ctx.stroke();

      // Center Registration Target (top margin)
      const midX = pageWidth / 2;
      const regY = tTop / 2;
      ctx.beginPath();
      ctx.arc(midX, regY, 8, 0, Math.PI * 2);
      ctx.moveTo(midX - 12, regY);
      ctx.lineTo(midX + 12, regY);
      ctx.moveTo(midX, regY - 12);
      ctx.lineTo(midX, regY + 12);
      ctx.stroke();

      // CMYK Calibration Swatches in top margin
      const cmykY = regY - 5;
      const swW = 14;
      const swH = 10;
      const colors = ['#00FFFF', '#FF00FF', '#FFFF00', '#000000'];
      colors.forEach((c, idx) => {
        ctx.fillStyle = c;
        ctx.fillRect(midX + 24 + idx * swW, cmykY, swW, swH);
        ctx.strokeRect(midX + 24 + idx * swW, cmykY, swW, swH);
      });

      ctx.restore();
    }

    // 2. Printable margin guidelines if requested
    if (options.showMargins) {
      ctx.save();
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(
        BROADSHEET_CONSTANTS.MARGIN_LEFT_PT,
        BROADSHEET_CONSTANTS.MARGIN_TOP_PT,
        BROADSHEET_CONSTANTS.PRINTABLE_WIDTH_PT,
        BROADSHEET_CONSTANTS.PRINTABLE_HEIGHT_PT
      );
      ctx.restore();
    }

    // 3. Top Running Folio Header (Standard Newspaper Masthead Folio)
    const folioY = 40;
    ctx.save();
    ctx.fillStyle = '#0F172A';
    ctx.font = '700 12px "Noto Sans Devanagari", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      `ब्रेकिंग न्यूज़ वाला • मध्य प्रदेश का अग्रणी डिजिटल दैनिक • ${page.pageTitle || 'मुख्य पृष्ठ'}`,
      BROADSHEET_CONSTANTS.MARGIN_LEFT_PT,
      folioY + 12
    );

    ctx.textAlign = 'right';
    ctx.font = '600 11px "Noto Sans Devanagari", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(
      `पृष्ठ ${page.pageNumber || 1} • मूल्य: ₹4.00`,
      pageWidth - BROADSHEET_CONSTANTS.MARGIN_RIGHT_PT,
      folioY + 12
    );

    // Folio bottom dividing rule
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(BROADSHEET_CONSTANTS.MARGIN_LEFT_PT, folioY + 20);
    ctx.lineTo(pageWidth - BROADSHEET_CONSTANTS.MARGIN_RIGHT_PT, folioY + 20);
    ctx.stroke();
    ctx.restore();

    // 4. Modular Column Grid Overlay (if enabled)
    if (options.showGrid) {
      const grid = calculateColumnGrid(page.gridColumns || 8);
      ctx.save();
      for (let i = 0; i < grid.columnOffsets.length; i++) {
        // Draw column box
        ctx.fillStyle = 'rgba(59, 130, 246, 0.04)';
        ctx.fillRect(
          grid.columnOffsets[i],
          BROADSHEET_CONSTANTS.MARGIN_TOP_PT,
          grid.columnWidth,
          BROADSHEET_CONSTANTS.PRINTABLE_HEIGHT_PT
        );

        // Column boundary lines
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.lineWidth = 0.75;
        ctx.strokeRect(
          grid.columnOffsets[i],
          BROADSHEET_CONSTANTS.MARGIN_TOP_PT,
          grid.columnWidth,
          BROADSHEET_CONSTANTS.PRINTABLE_HEIGHT_PT
        );

        // Column label
        ctx.fillStyle = 'rgba(37, 99, 235, 0.4)';
        ctx.font = '600 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          `C${i + 1}`,
          grid.columnOffsets[i] + grid.columnWidth / 2,
          BROADSHEET_CONSTANTS.MARGIN_TOP_PT - 6
        );
      }
      ctx.restore();
    }

    // 5. Render Page Elements sorted by zIndex
    const sortedElements = [...(page.elements || [])].sort(
      (a, b) => (a.zIndex || 1) - (b.zIndex || 1)
    );

    for (const el of sortedElements) {
      const rawBounds =
        el.id === options.selectedElementId && options.draggedBounds
          ? options.draggedBounds
          : el.bounds;

      const bounds: EpaperPageElementBounds = {
        x: rawBounds.x >= BROADSHEET_CONSTANTS.MARGIN_LEFT_PT ? rawBounds.x : BROADSHEET_CONSTANTS.MARGIN_LEFT_PT + (rawBounds.x || 0),
        y: rawBounds.y >= BROADSHEET_CONSTANTS.MARGIN_TOP_PT ? rawBounds.y : BROADSHEET_CONSTANTS.MARGIN_TOP_PT + (rawBounds.y || 0),
        width: rawBounds.width,
        height: rawBounds.height,
      };

      this.renderBroadsheetElement(ctx, el, bounds, options.onImageLoaded);
    }

    // 6. Interactive Overlays (Selection, Handles, Collisions, Snap Guidelines)
    if (options.renderTarget !== 'export_print') {
      // Draw Red Collision Warnings
      if (options.collidingElementIds && options.collidingElementIds.length > 0) {
        ctx.save();
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';

        for (const el of sortedElements) {
          if (options.collidingElementIds.includes(el.id)) {
            const rawB = el.id === options.selectedElementId && options.draggedBounds
              ? options.draggedBounds
              : el.bounds;
            const b: EpaperPageElementBounds = {
              x: rawB.x >= BROADSHEET_CONSTANTS.MARGIN_LEFT_PT ? rawB.x : BROADSHEET_CONSTANTS.MARGIN_LEFT_PT + (rawB.x || 0),
              y: rawB.y >= BROADSHEET_CONSTANTS.MARGIN_TOP_PT ? rawB.y : BROADSHEET_CONSTANTS.MARGIN_TOP_PT + (rawB.y || 0),
              width: rawB.width,
              height: rawB.height,
            };
            ctx.fillRect(b.x, b.y, b.width, b.height);
            ctx.strokeRect(b.x, b.y, b.width, b.height);

            // Warning pill
            ctx.save();
            ctx.setLineDash([]);
            ctx.fillStyle = '#EF4444';
            this.roundRect(ctx, b.x + 4, b.y + 4, 76, 18, 4);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '700 9px "Noto Sans Devanagari", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚠️ ओवरलैप', b.x + 42, b.y + 13);
            ctx.restore();
          }
        }
        ctx.restore();
      }

      // Draw Cyan Magnetic Snap Guidelines
      if (options.activeSnapLines && options.activeSnapLines.length > 0) {
        ctx.save();
        ctx.strokeStyle = '#06B6D4';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);

        for (const line of options.activeSnapLines) {
          ctx.beginPath();
          if (line.axis === 'x') {
            ctx.moveTo(line.position, 0);
            ctx.lineTo(line.position, pageHeight);
          } else {
            ctx.moveTo(0, line.position);
            ctx.lineTo(pageWidth, line.position);
          }
          ctx.stroke();
        }
        ctx.restore();
      }

      // Draw Selected Element Outline & 8 Resize Handles
      if (options.selectedElementId) {
        const selEl = sortedElements.find((e) => e.id === options.selectedElementId);
        if (selEl) {
          const b = options.draggedBounds || selEl.bounds;
          ctx.save();
          ctx.strokeStyle = '#2563EB';
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          ctx.strokeRect(b.x, b.y, b.width, b.height);

          // 8 Resize Handles: nw, n, ne, e, se, s, sw, w
          const handleSize = 8;
          const half = handleSize / 2;
          const handles = [
            { x: b.x, y: b.y }, // nw
            { x: b.x + b.width / 2, y: b.y }, // n
            { x: b.x + b.width, y: b.y }, // ne
            { x: b.x + b.width, y: b.y + b.height / 2 }, // e
            { x: b.x + b.width, y: b.y + b.height }, // se
            { x: b.x + b.width / 2, y: b.y + b.height }, // s
            { x: b.x, y: b.y + b.height }, // sw
            { x: b.x, y: b.y + b.height / 2 }, // w
          ];

          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = '#2563EB';
          ctx.lineWidth = 1.5;

          for (const h of handles) {
            ctx.fillRect(h.x - half, h.y - half, handleSize, handleSize);
            ctx.strokeRect(h.x - half, h.y - half, handleSize, handleSize);
          }

          // Top Info Pill
          ctx.fillStyle = '#2563EB';
          const label = `${selEl.elementType} • ${Math.round(b.width)}pt × ${Math.round(b.height)}pt (${selEl.colSpan || 1} Col)`;
          ctx.font = '600 10px sans-serif';
          const tagW = ctx.measureText(label).width + 16;
          this.roundRect(ctx, b.x, Math.max(0, b.y - 22), tagW, 18, 4);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, b.x + 8, Math.max(9, b.y - 13));

          ctx.restore();
        }
      }
    }

    ctx.restore();
  }

  /**
   * High-Resolution 300 DPI broadsheet canvas rendering method.
   * Computes scale factor 300 / 72 = 4.1666667 and renders with export_print target.
   */
  public static renderHighResBroadsheetPage(
    canvas: HTMLCanvasElement | any,
    page: EpaperPageDoc,
    options: BroadsheetRenderOptions = {}
  ): void {
    const dpi = options.dpi || 300;
    const scale = dpi / 72;
    this.renderBroadsheetPage(canvas, page, {
      ...options,
      scale,
      renderTarget: 'export_print',
      showTrimAndBleedMarks: options.showTrimAndBleedMarks !== undefined ? options.showTrimAndBleedMarks : true,
      showGrid: false,
      showGuidelines: false,
      showMargins: false,
    });
  }

  /**
   * Preloads all image and advertisement assets for an epaper page to ensure
   * instant, flicker-free canvas rendering.
   */
  public static async preloadPageImages(page: EpaperPageDoc): Promise<void> {
    if (!page || !Array.isArray(page.elements)) return;
    const urls: string[] = [];
    for (const el of page.elements) {
      if ((el.elementType === 'IMAGE' || el.elementType === 'AD') && el.imageUrl) {
        urls.push(el.imageUrl);
      }
    }
    if (urls.length === 0) return;
    await Promise.all(
      urls.map((url) => loadImage(url).catch(() => null))
    );
  }

  /**
   * Breaks text into lines strictly bounded by maxWidth.
   * Protects Indic conjuncts and word boundaries.
   */
  public static wrapTextToLines(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] {
    if (!text) return [];
    const paragraphs = text.split('\n');
    const allLines: string[] = [];

    for (const para of paragraphs) {
      const words = para.split(/\s+/).filter(Boolean);
      if (words.length === 0) continue;

      let currentLine = '';
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = ctx.measureText(testLine).width;

        if (testWidth > maxWidth && currentLine) {
          allLines.push(currentLine);
          currentLine = word;
        } else if (testWidth > maxWidth && !currentLine) {
          allLines.push(word);
          currentLine = '';
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        allLines.push(currentLine);
      }
    }

    return allLines;
  }

  /**
   * Dispatches and renders an individual broadsheet element.
   */
  public static renderBroadsheetElement(
    ctx: CanvasRenderingContext2D,
    el: EpaperPageElement,
    bounds: EpaperPageElementBounds,
    onImageLoaded?: () => void
  ): void {
    ctx.save();

    // Clip to element bounds to prevent accidental bleed
    ctx.beginPath();
    ctx.rect(bounds.x, bounds.y, bounds.width, bounds.height);
    ctx.clip();

    switch (el.elementType) {
      case 'MASTHEAD':
        this.renderMastheadElement(ctx, el, bounds);
        break;
      case 'HEADLINE':
        this.renderHeadlineElement(ctx, el, bounds);
        break;
      case 'STORY':
        this.renderStoryElement(ctx, el, bounds);
        break;
      case 'IMAGE':
        this.renderImageElement(ctx, el, bounds, onImageLoaded);
        break;
      case 'AD':
        this.renderAdElement(ctx, el, bounds, onImageLoaded);
        break;
      case 'COLUMN':
        this.renderColumnElement(ctx, el, bounds);
        break;
      default:
        this.renderStoryElement(ctx, el, bounds);
        break;
    }

    ctx.restore();
  }


  /**
   * Renders traditional newspaper Masthead.
   */
  private static renderMastheadElement(
    ctx: CanvasRenderingContext2D,
    el: EpaperPageElement,
    b: EpaperPageElementBounds
  ): void {
    // Background fill
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(b.x, b.y, b.width, b.height);

    // Masthead Tricolor Ribbon
    ctx.fillStyle = '#ED1727';
    ctx.fillRect(b.x, b.y, b.width * 0.33, 4);
    ctx.fillStyle = '#FDE900';
    ctx.fillRect(b.x + b.width * 0.33, b.y, b.width * 0.33, 4);
    ctx.fillStyle = '#344FD6';
    ctx.fillRect(b.x + b.width * 0.66, b.y, b.width * 0.34, 4);

    // Red Logo Emblem 'ब'
    const logoSize = Math.min(50, b.height * 0.55);
    const logoX = b.x + 12;
    const logoY = b.y + 12;

    this.roundRect(ctx, logoX, logoY, logoSize, logoSize, 8);
    ctx.fillStyle = '#ED1727';
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `900 ${Math.round(logoSize * 0.6)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ब', logoX + logoSize / 2, logoY + logoSize / 2);

    // Title: "ब्रेकिंग न्यूज़ वाला"
    ctx.textAlign = 'left';
    ctx.font = `900 ${Math.min(48, Math.round(b.height * 0.45))}px "Rozha One", "Noto Sans Devanagari", serif`;
    ctx.fillStyle = '#0F172A';
    ctx.fillText('ब्रेकिंग न्यूज़ वाला', logoX + logoSize + 14, b.y + b.height * 0.45);

    // Subtitle & Regional Bar
    ctx.font = '700 12px "Noto Sans Devanagari", sans-serif';
    ctx.fillStyle = '#ED1727';
    ctx.fillText(
      'मध्य प्रदेश का सबसे विश्वसनीय एवं निर्भीक डिजिटल दैनिक • 55 जिलों की धड़कन',
      logoX + logoSize + 16,
      b.y + b.height * 0.72
    );

    // Imprint strip at bottom
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y + b.height - 2);
    ctx.lineTo(b.x + b.width, b.y + b.height - 2);
    ctx.stroke();
  }

  /**
   * Renders bold newspaper Headline block with deck/kicker, dynamic font sizing,
   * Indic line-wrapping, and ellipsis protection against overflow.
   */
  private static renderHeadlineElement(
    ctx: CanvasRenderingContext2D,
    el: EpaperPageElement,
    b: EpaperPageElementBounds
  ): void {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(b.x, b.y, b.width, b.height);

    let curY = b.y;

    // Kicker if present
    if (el.customSubheadline) {
      ctx.fillStyle = '#ED1727';
      ctx.font = '800 12px "Noto Sans Devanagari", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(el.customSubheadline, b.x + 3, curY + 2);
      curY += 18;
    }

    const availableH = Math.max(16, b.y + b.height - curY - 4);
    const text = (el.customHeadline || 'मुख्य समाचार का प्रमुख शीर्षक').trim();
    const isCenter = el.textAlign === 'center';
    const textX = isCenter ? b.x + b.width / 2 : b.x + 3;
    const maxW = Math.max(40, b.width - 6);

    // Dynamically scale font size so entire headline fits cleanly without clipping
    let bestFontSize = Math.min(36, Math.max(14, el.fontSize || Math.round(availableH * 0.45)));
    let wrappedLines: string[] = [];
    let bestLineHeight = bestFontSize * 1.25;

    for (let testSize = bestFontSize; testSize >= 13; testSize -= 1.5) {
      ctx.font = `800 ${testSize}px "Rozha One", "Noto Sans Devanagari", serif`;
      const testLineH = testSize * 1.25;
      const lines = this.wrapTextToLines(ctx, text, maxW);
      const totalH = lines.length * testLineH;

      if (totalH <= availableH || testSize <= 14) {
        bestFontSize = testSize;
        wrappedLines = lines;
        bestLineHeight = testLineH;
        break;
      }
    }

    ctx.font = `800 ${bestFontSize}px "Rozha One", "Noto Sans Devanagari", serif`;
    ctx.fillStyle = '#0F172A';
    ctx.textAlign = isCenter ? 'center' : 'left';
    ctx.textBaseline = 'top';

    const maxLines = Math.max(1, Math.floor(availableH / bestLineHeight));
    for (let i = 0; i < wrappedLines.length; i++) {
      if (i >= maxLines) break;
      let lineText = wrappedLines[i];
      if (i === maxLines - 1 && wrappedLines.length > maxLines) {
        while (lineText.length > 2 && ctx.measureText(`${lineText}…`).width > maxW) {
          lineText = lineText.slice(0, -1);
        }
        lineText += '…';
      }
      ctx.fillText(lineText, textX, curY);
      curY += bestLineHeight;
    }

    // Bottom hairline rule
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y + b.height - 1);
    ctx.lineTo(b.x + b.width, b.y + b.height - 1);
    ctx.stroke();
  }

  /**
   * Renders standard Story element with multi-line wrapped headline, byline,
   * and justified Devanagari body text bounded to available area.
   */
  private static renderStoryElement(
    ctx: CanvasRenderingContext2D,
    el: EpaperPageElement,
    b: EpaperPageElementBounds
  ): void {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(b.x, b.y, b.width, b.height);

    let curY = b.y + 4;
    const maxW = Math.max(30, b.width - 6);

    // 1. Headline if defined on the story with multi-line word wrapping
    if (el.customHeadline) {
      const hSize = Math.min(20, Math.max(13, Math.round((el.fontSize || 12) * 1.3)));
      const hLineH = hSize * 1.28;
      ctx.font = `800 ${hSize}px "Rozha One", "Noto Sans Devanagari", serif`;
      ctx.fillStyle = '#0F172A';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      const hLines = this.wrapTextToLines(ctx, el.customHeadline.trim(), maxW);
      const maxHeadlineLines = Math.min(3, hLines.length);
      for (let i = 0; i < maxHeadlineLines; i++) {
        let hl = hLines[i];
        if (i === maxHeadlineLines - 1 && hLines.length > maxHeadlineLines) {
          while (hl.length > 2 && ctx.measureText(`${hl}…`).width > maxW) {
            hl = hl.slice(0, -1);
          }
          hl += '…';
        }
        ctx.fillText(hl, b.x + 3, curY);
        curY += hLineH;
      }
      curY += 4;
    }

    // 2. Byline / Dateline Bar
    const byline = el.byline || 'संवाददाता, बीएनडब्ल्यू';
    ctx.font = '600 10px "Noto Sans Devanagari", sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`भोपाल | ${byline}`, b.x + 3, curY);
    curY += 15;

    // Dividing rule
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(b.x + 2, curY);
    ctx.lineTo(b.x + b.width - 2, curY);
    ctx.stroke();
    curY += 5;

    // 3. Justified Body Text
    const bodyText =
      el.customBodyText ||
      'मध्य प्रदेश में सरकार ने जनहित के लिए नए दिशा-निर्देश जारी किए हैं। ग्रामीण व शहरी क्षेत्रों में विकास कार्यों को तेजी से पूरा करने का लक्ष्य निर्धारित किया गया है। अधिकारियों को समयबद्ध क्रियान्वयन सुनिश्चित करने के निर्देश दिए गए हैं।';

    const fontSize = el.fontSize || 11;
    const lineHeight = (el.lineHeight || 1.38) * fontSize;
    const availableHeight = Math.max(0, b.y + b.height - curY - 4);

    if (availableHeight >= lineHeight) {
      DevanagariTypographyEngine.renderJustifiedText(
        ctx,
        bodyText,
        b.x + 3,
        curY,
        maxW,
        lineHeight,
        fontSize,
        '"Noto Sans Devanagari", sans-serif',
        availableHeight,
        '#1E293B'
      );
    }

    // Subtle right border for multi-column feel
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(b.x + b.width, b.y);
    ctx.lineTo(b.x + b.width, b.y + b.height);
    ctx.stroke();
  }

  /**
   * Renders Image element with photo, aspect-fill cover rendering, caption bar,
   * photo credit, and graceful fallback when image genuinely does not exist.
   */
  private static renderImageElement(
    ctx: CanvasRenderingContext2D,
    el: EpaperPageElement,
    b: EpaperPageElementBounds,
    onImageLoaded?: () => void
  ): void {
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(b.x, b.y, b.width, b.height);

    const hasCaption = Boolean(el.imageCaption || el.photoCredit);
    const captionH = hasCaption ? 24 : 0;
    const imgAreaH = Math.max(0, b.height - captionH);

    let imageDrawn = false;

    // Draw Image if URL provided
    if (el.imageUrl && imgAreaH > 0) {
      if (imageElementCache.has(el.imageUrl)) {
        const cachedImg = imageElementCache.get(el.imageUrl)!;
        if (cachedImg.complete && cachedImg.naturalWidth > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(b.x, b.y, b.width, imgAreaH);
          ctx.clip();

          // object-fit: cover calculation to preserve aspect ratio without stretching
          const imgAspect = cachedImg.naturalWidth / cachedImg.naturalHeight;
          const targetAspect = b.width / imgAreaH;
          let sx = 0;
          let sy = 0;
          let sWidth = cachedImg.naturalWidth;
          let sHeight = cachedImg.naturalHeight;

          if (imgAspect > targetAspect) {
            sWidth = cachedImg.naturalHeight * targetAspect;
            sx = (cachedImg.naturalWidth - sWidth) / 2;
          } else {
            sHeight = cachedImg.naturalWidth / targetAspect;
            sy = (cachedImg.naturalHeight - sHeight) / 2;
          }

          ctx.drawImage(cachedImg, sx, sy, sWidth, sHeight, b.x, b.y, b.width, imgAreaH);
          ctx.restore();
          imageDrawn = true;
        }
      } else if (typeof Image !== 'undefined') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          imageElementCache.set(el.imageUrl!, img);
          if (onImageLoaded) {
            onImageLoaded();
          }
        };
        img.src = el.imageUrl;
      }
    }

    // Graceful Fallback ONLY when image is missing or loading
    if (!imageDrawn) {
      ctx.fillStyle = '#F1F5F9';
      ctx.fillRect(b.x, b.y, b.width, imgAreaH);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '600 12px "Noto Sans Devanagari", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const placeholderText = el.imageUrl ? '📷 चित्र लोड हो रहा है...' : '📷 चित्र / फोटो उपलब्ध नहीं';
      ctx.fillText(placeholderText, b.x + b.width / 2, b.y + imgAreaH / 2 - 6);

      if (el.imageCaption) {
        ctx.font = '500 10px "Noto Sans Devanagari", sans-serif';
        ctx.fillStyle = '#64748B';
        ctx.fillText(el.imageCaption, b.x + b.width / 2, b.y + imgAreaH / 2 + 14);
      }
    }

    // Caption & Credit Bar at bottom
    if (captionH > 0) {
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(b.x, b.y + b.height - captionH, b.width, captionH);

      ctx.fillStyle = '#F8FAFC';
      ctx.font = '500 10px "Noto Sans Devanagari", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      const captionText = el.imageCaption || '';
      const credit = el.photoCredit ? `फोटो: ${el.photoCredit}` : 'फोटो: बीएनडब्ल्यू ब्यूरो';

      if (captionText) {
        const creditW = ctx.measureText(` | ${credit}`).width;
        const maxCaptionW = b.width - creditW - 16;
        let displayCaption = captionText;
        if (ctx.measureText(displayCaption).width > maxCaptionW) {
          while (displayCaption.length > 3 && ctx.measureText(`${displayCaption}…`).width > maxCaptionW) {
            displayCaption = displayCaption.slice(0, -1);
          }
          displayCaption += '…';
        }
        ctx.fillText(`${displayCaption} | ${credit}`, b.x + 8, b.y + b.height - captionH / 2);
      } else {
        ctx.fillText(credit, b.x + 8, b.y + b.height - captionH / 2);
      }
    }

    // Frame border
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.strokeRect(b.x, b.y, b.width, b.height);
  }

  /**
   * Renders Advertisement element with MANDATORY ASCI 'विज्ञापन' badge,
   * image creative support, and wrapped copy text.
   */
  private static renderAdElement(
    ctx: CanvasRenderingContext2D,
    el: EpaperPageElement,
    b: EpaperPageElementBounds,
    onImageLoaded?: () => void
  ): void {
    // Ad background
    ctx.fillStyle = '#FFFBEB'; // Light warm amber
    ctx.fillRect(b.x, b.y, b.width, b.height);

    // If an advertisement creative image is provided, draw it within bounds
    let imageDrawn = false;
    if (el.imageUrl) {
      if (imageElementCache.has(el.imageUrl)) {
        const cachedImg = imageElementCache.get(el.imageUrl)!;
        if (cachedImg.complete && cachedImg.naturalWidth > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(b.x + 1, b.y + 1, b.width - 2, b.height - 2);
          ctx.clip();
          const imgAspect = cachedImg.naturalWidth / cachedImg.naturalHeight;
          const targetAspect = (b.width - 2) / (b.height - 2);
          let sx = 0;
          let sy = 0;
          let sWidth = cachedImg.naturalWidth;
          let sHeight = cachedImg.naturalHeight;

          if (imgAspect > targetAspect) {
            sWidth = cachedImg.naturalHeight * targetAspect;
            sx = (cachedImg.naturalWidth - sWidth) / 2;
          } else {
            sHeight = cachedImg.naturalWidth / targetAspect;
            sy = (cachedImg.naturalHeight - sHeight) / 2;
          }

          ctx.drawImage(cachedImg, sx, sy, sWidth, sHeight, b.x + 1, b.y + 1, b.width - 2, b.height - 2);
          ctx.restore();
          imageDrawn = true;
        }
      } else if (typeof Image !== 'undefined') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          imageElementCache.set(el.imageUrl!, img);
          if (onImageLoaded) onImageLoaded();
        };
        img.src = el.imageUrl;
      }
    }

    // Outer border
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(b.x + 1, b.y + 1, b.width - 2, b.height - 2);

    // If creative image was not rendered, draw title & copy text with wrapping
    if (!imageDrawn) {
      ctx.fillStyle = '#78350F';
      ctx.font = '700 13px "Noto Sans Devanagari", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const adTitle = el.customHeadline || 'व्यावसायिक विज्ञापन (Commercial Ad)';
      const maxTextW = b.width - 20;
      const titleLines = this.wrapTextToLines(ctx, adTitle, maxTextW);
      const titleLineH = 16;
      let titleY = b.y + b.height / 2 - ((titleLines.length - 1) * titleLineH) / 2 - (el.customBodyText ? 10 : 0);

      for (const line of titleLines.slice(0, 3)) {
        ctx.fillText(line, b.x + b.width / 2, titleY);
        titleY += titleLineH;
      }

      if (el.customBodyText) {
        ctx.font = '500 10px "Noto Sans Devanagari", sans-serif';
        ctx.fillStyle = '#92400E';
        ctx.fillText(el.customBodyText, b.x + b.width / 2, titleY + 6);
      }
    }

    // MANDATORY ASCI 'विज्ञापन' BADGE
    // Placed strictly in top-right corner
    const badgeW = 54;
    const badgeH = 18;
    const badgeX = b.x + b.width - badgeW - 6;
    const badgeY = b.y + 6;

    ctx.save();
    ctx.fillStyle = '#ED1727';
    this.roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 4);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 10px "Noto Sans Devanagari", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(el.badgeText || 'विज्ञापन', badgeX + badgeW / 2, badgeY + badgeH / 2);
    ctx.restore();
  }

  /**
   * Renders Editorial Column (Op-Ed / Viewpoint) element.
   */
  private static renderColumnElement(
    ctx: CanvasRenderingContext2D,
    el: EpaperPageElement,
    b: EpaperPageElementBounds
  ): void {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(b.x, b.y, b.width, b.height);

    // Top banner
    const bannerH = 34;
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(b.x, b.y, b.width, bannerH);

    ctx.fillStyle = '#FDE900';
    ctx.font = '800 12px "Noto Sans Devanagari", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const bannerTitle = el.customHeadline || 'विशेष आलेख एवं दृष्टिकोण';
    let displayBanner = bannerTitle;
    const maxBannerW = b.width - 16;
    if (ctx.measureText(displayBanner).width > maxBannerW) {
      while (displayBanner.length > 3 && ctx.measureText(`${displayBanner}…`).width > maxBannerW) {
        displayBanner = displayBanner.slice(0, -1);
      }
      displayBanner += '…';
    }
    ctx.fillText(displayBanner, b.x + 8, b.y + bannerH / 2);

    // Author circle & byline
    let curY = b.y + bannerH + 8;
    ctx.fillStyle = '#ED1727';
    ctx.beginPath();
    ctx.arc(b.x + 18, curY + 12, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('सं', b.x + 18, curY + 12);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#0F172A';
    ctx.font = '700 11px "Noto Sans Devanagari", sans-serif';
    ctx.fillText(el.byline || 'संपादकीय मंडल', b.x + 36, curY + 12);
    curY += 28;

    // Justified Body Text
    const bodyText =
      el.customBodyText ||
      'मध्य प्रदेश के 55 जिलों में औद्योगिक एवं आधारभूत संरचना का विस्तार ग्रामीण अर्थव्यवस्था को सशक्त कर रहा है। सुशासन और पारदर्शिता ही जन-विश्वास की सबसे मजबूत आधारशिला है।';

    const availableH = Math.max(0, b.y + b.height - curY - 4);
    if (availableH >= 15) {
      DevanagariTypographyEngine.renderJustifiedText(
        ctx,
        bodyText,
        b.x + 4,
        curY,
        b.width - 8,
        15,
        10.5,
        '"Noto Sans Devanagari", sans-serif',
        availableH,
        '#1E293B'
      );
    }

    // Border
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1;
    ctx.strokeRect(b.x, b.y, b.width, b.height);
  }

  // ==========================================================================
  // WHATSAPP ARTICLE CLIPPING RENDERER (STEP 7 & STEP 8)
  // Supports both 4:5 Portrait (1080x1350) and 1:1 Square (1080x1080)
  // ==========================================================================

  /**
   * Renders a dedicated 4:5 (1080 x 1350 px) or 1:1 (1080 x 1080 px) Article Clipping with:
   * - Top BNW branding masthead (tri-color stripe, 'ब्रेकिंग न्यूज़ वाला', date, district, category)
   * - Devanagari headline with anti-clipping line height
   * - Optional featured photo with aspect crop, or elegant missing-image editorial divider
   * - Justified Devanagari body text using DevanagariTypographyEngine
   * - Bottom reporter attribution card (circular avatar, name, accreditation badge, verified seal, domain)
   */
  public static async renderArticleClipping(
    canvas: HTMLCanvasElement,
    options: ArticleClippingRenderOptions
  ): Promise<void> {
    const isSquare = options.format === '1:1';
    const W = 1080;
    const H = isSquare ? 1080 : 1350;

    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext ? canvas.getContext('2d') : null;
    if (!ctx) return;

    ctx.save();

    // 1. Base card background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);

    // Subtle paper border
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);

    // 2. Top Tri-Color Stripe (8px)
    ctx.fillStyle = '#ED1727';
    ctx.fillRect(0, 0, W * 0.33, 8);
    ctx.fillStyle = '#FDE900';
    ctx.fillRect(W * 0.33, 0, W * 0.33, 8);
    ctx.fillStyle = '#344FD6';
    ctx.fillRect(W * 0.66, 0, W * 0.34, 8);

    // 3. Elegant Top Masthead Bar
    const mastheadH = isSquare ? 110 : 120;
    const mastheadGrad = ctx.createLinearGradient(0, 8, W, 8);
    mastheadGrad.addColorStop(0, '#0F172A');
    mastheadGrad.addColorStop(1, '#1E293B');
    ctx.fillStyle = mastheadGrad;
    ctx.fillRect(0, 8, W, mastheadH);

    // Logo icon box
    const logoX = 40;
    const logoY = isSquare ? 20 : 24;
    const logoSize = isSquare ? 58 : 64;
    ctx.fillStyle = '#ED1727';
    ctx.beginPath();
    ctx.roundRect(logoX, logoY, logoSize, logoSize, 12);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${isSquare ? 36 : 40}px "Rozha One", "Noto Sans Devanagari", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ब', logoX + logoSize / 2, logoY + logoSize / 2 + 2);

    // Masthead brand title
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${isSquare ? 28 : 32}px "Noto Sans Devanagari", sans-serif`;
    ctx.fillText('ब्रेकिंग न्यूज़ वाला', logoX + logoSize + 18, isSquare ? 48 : 54);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '700 11px "Inter", sans-serif';
    ctx.fillText('BREAKING NEWS WALA • MADHYA PRADESH', logoX + logoSize + 18, isSquare ? 68 : 74);

    // District Tag & Date on Right Side
    const rightMargin = W - 40;
    const districtText = options.district || 'मध्य प्रदेश';
    const dateText = options.date || new Date().toLocaleDateString('hi-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // District Tag Pill
    ctx.font = 'bold 15px "Noto Sans Devanagari", sans-serif';
    const distMetrics = ctx.measureText(districtText);
    const pillW = distMetrics.width + 24;
    const pillH = 30;
    const pillX = rightMargin - pillW;
    const pillY = isSquare ? 26 : 32;

    ctx.fillStyle = '#FDE900';
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 15);
    ctx.fill();

    ctx.fillStyle = '#0F172A';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(districtText, pillX + pillW / 2, pillY + pillH / 2);

    // Date text below pill
    ctx.textAlign = 'right';
    ctx.fillStyle = '#94A3B8';
    ctx.font = '13px "Noto Sans Devanagari", sans-serif';
    ctx.fillText(dateText, rightMargin, isSquare ? 78 : 86);

    // Masthead bottom tri-color accent line (4px)
    ctx.fillStyle = '#ED1727';
    ctx.fillRect(0, 8 + mastheadH - 4, W * 0.33, 4);
    ctx.fillStyle = '#FDE900';
    ctx.fillRect(W * 0.33, 8 + mastheadH - 4, W * 0.33, 4);
    ctx.fillStyle = '#344FD6';
    ctx.fillRect(W * 0.66, 8 + mastheadH - 4, W * 0.34, 4);

    // 4. Edition Ribbon & Category Tag
    const contentMarginX = 50;
    const contentW = W - contentMarginX * 2;
    let currentY = 8 + mastheadH + (isSquare ? 18 : 24);

    const editionTitle = options.editionTitle || 'अख़बार कतरन • विशेष ग्राउंड रिपोर्ट';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#DC2626';
    ctx.font = 'bold 14px "Noto Sans Devanagari", sans-serif';
    
    let ribbonText = `📰 ${editionTitle}`;
    if (options.category) {
      ribbonText = `📰 [${options.category}] • ${editionTitle}`;
    }
    ctx.fillText(ribbonText, contentMarginX, currentY);
    currentY += 12;

    // 5. Headline Rendering (Anti-Clipping line height)
    ctx.fillStyle = '#0F172A';
    const headlineFontSize = isSquare ? 30 : 34;
    const headlineLineHeight = isSquare ? 42 : 48;
    ctx.font = `bold ${headlineFontSize}px "Noto Sans Devanagari", sans-serif`;

    const headlineWords = (options.headline || '').split(/\s+/).filter(Boolean);
    let headLine = '';
    const headlineLines: string[] = [];

    for (const word of headlineWords) {
      const testLine = headLine ? `${headLine} ${word}` : word;
      const testW = ctx.measureText(testLine).width;
      if (testW > contentW && headLine) {
        headlineLines.push(headLine);
        headLine = word;
      } else {
        headLine = testLine;
      }
    }
    if (headLine) headlineLines.push(headLine);

    currentY += headlineFontSize;
    const maxHeadlineLines = isSquare ? 2 : 3;
    for (let i = 0; i < Math.min(headlineLines.length, maxHeadlineLines); i++) {
      ctx.fillText(headlineLines[i], contentMarginX, currentY);
      currentY += headlineLineHeight;
    }
    currentY += 8;

    // 6. Optional Featured Photo with Aspect Crop or Graceful Missing-Image Divider
    let photoDrawn = false;
    if (options.photoUrl) {
      try {
        const photo = await loadImage(options.photoUrl);
        if (photo && photo.width > 0) {
          const photoH = isSquare ? 260 : 340;
          const photoY = currentY;

          ctx.save();
          ctx.beginPath();
          ctx.roundRect(contentMarginX, photoY, contentW, photoH, 12);
          ctx.clip();

          const photoAspect = photo.width / photo.height;
          const targetAspect = contentW / photoH;
          let sx = 0, sy = 0, sw = photo.width, sh = photo.height;

          if (photoAspect > targetAspect) {
            sw = photo.height * targetAspect;
            sx = (photo.width - sw) / 2;
          } else {
            sh = photo.width / targetAspect;
            sy = (photo.height - sh) / 2;
          }

          ctx.drawImage(photo, sx, sy, sw, sh, contentMarginX, photoY, contentW, photoH);
          ctx.restore();

          // Border around photo
          ctx.strokeStyle = '#CBD5E1';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(contentMarginX, photoY, contentW, photoH, 12);
          ctx.stroke();

          currentY += photoH + (isSquare ? 14 : 20);
          photoDrawn = true;
        }
      } catch (err) {
        console.warn('[renderArticleClipping] Photo load error:', err);
      }
    }

    if (!photoDrawn) {
      // Missing photo graceful fallback (editorial divider, never fabricated image)
      ctx.save();
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(contentMarginX, currentY);
      ctx.lineTo(contentMarginX + contentW, currentY);
      ctx.stroke();

      // Red accent in center
      ctx.fillStyle = '#ED1727';
      ctx.fillRect(contentMarginX + (contentW - 80) / 2, currentY - 1, 80, 3);
      ctx.restore();
      currentY += isSquare ? 14 : 18;
    }

    // 7. Justified Devanagari Body Text
    const attributionCardH = isSquare ? 130 : 150;
    const attributionCardY = H - attributionCardH;
    const bodyMaxHeight = attributionCardY - currentY - 16;

    if (bodyMaxHeight > 60 && options.body) {
      const bodyFontSize = photoDrawn ? (isSquare ? 18 : 20) : (isSquare ? 21 : 23);
      const bodyLineHeight = photoDrawn ? (isSquare ? 28 : 32) : (isSquare ? 32 : 36);

      DevanagariTypographyEngine.renderJustifiedText(
        ctx,
        options.body,
        contentMarginX,
        currentY,
        contentW,
        bodyLineHeight,
        bodyFontSize,
        '"Noto Sans Devanagari", sans-serif',
        bodyMaxHeight,
        '#1E293B'
      );
    }

    // 8. Bottom Reporter Attribution Card
    // Container background
    const footerGrad = ctx.createLinearGradient(0, attributionCardY, W, attributionCardY);
    footerGrad.addColorStop(0, '#0F172A');
    footerGrad.addColorStop(1, '#1E293B');
    ctx.fillStyle = footerGrad;
    ctx.fillRect(0, attributionCardY, W, attributionCardH);

    // Top border accent on card
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, attributionCardY, W, 2);

    // Avatar
    const avatarR = isSquare ? 36 : 42;
    const avatarX = 50 + avatarR;
    const avatarY = attributionCardY + attributionCardH / 2;

    let avatarDrawn = false;
    if (options.reporterAvatar) {
      try {
        const avatarImg = await loadImage(options.reporterAvatar);
        if (avatarImg && avatarImg.width > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(avatarImg, avatarX - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
          ctx.restore();
          avatarDrawn = true;
        }
      } catch (err) {
        console.warn('[renderArticleClipping] Avatar load error:', err);
      }
    }

    if (!avatarDrawn) {
      // Fallback stylized initials avatar
      ctx.fillStyle = '#3B82F6';
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${isSquare ? 26 : 30}px "Noto Sans Devanagari", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const initial = (options.reporterName || 'सं')[0];
      ctx.fillText(initial, avatarX, avatarY);
    }

    // Green verification badge on avatar
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.arc(avatarX + (isSquare ? 22 : 26), avatarY + (isSquare ? 22 : 26), isSquare ? 10 : 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${isSquare ? 10 : 12}px "Inter", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✓', avatarX + (isSquare ? 22 : 26), avatarY + (isSquare ? 22 : 26));

    // Reporter Details
    const textStartX = avatarX + avatarR + (isSquare ? 16 : 20);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // Reporter Name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${isSquare ? 21 : 24}px "Noto Sans Devanagari", sans-serif`;
    ctx.fillText(options.reporterName || 'अधिकृत संवाददाता', textStartX, avatarY - (isSquare ? 6 : 8));

    // Accreditation Badge Pill
    const badgeNumber = options.reporterBadge || 'BNW-REP-0101';
    ctx.fillStyle = '#38BDF8';
    ctx.font = `600 ${isSquare ? 12 : 13}px "Inter", "Noto Sans Devanagari", sans-serif`;
    ctx.fillText(`अधिकृत रिपोर्टर • ${badgeNumber}`, textStartX, avatarY + (isSquare ? 14 : 16));

    ctx.fillStyle = '#94A3B8';
    ctx.font = `${isSquare ? 11 : 12}px "Noto Sans Devanagari", sans-serif`;
    ctx.fillText('मध्य प्रदेश के 55 जिलों का विश्वसनीय डिजिटल नेटवर्क', textStartX, avatarY + (isSquare ? 32 : 36));

    // Right-aligned branding & domain
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FDE900';
    ctx.font = `bold ${isSquare ? 15 : 17}px "Inter", sans-serif`;
    ctx.fillText('breakingnewswala.com', W - 50, avatarY - 6);

    ctx.fillStyle = '#94A3B8';
    ctx.font = `${isSquare ? 11 : 12}px "Noto Sans Devanagari", sans-serif`;
    ctx.fillText('ई-पेपर डिजिटल संस्करण • जन-जन की आवाज', W - 50, avatarY + 18);

    ctx.restore();
  }


  // ==========================================================================
  // EXPORT UTILITIES
  // ==========================================================================

  /**
   * Generates a high-resolution PNG or WebP Blob from a canvas.
   */
  public static exportAsBlob(
    canvas: HTMLCanvasElement,
    format: 'png' | 'webp' = 'png',
    quality = 0.95
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const mime = format === 'webp' ? 'image/webp' : 'image/png';
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('ERR_BLOB_CREATION: Failed to export canvas as Blob.'));
        },
        mime,
        quality
      );
    });
  }

  /**
   * Generates a data URL for instant image display or fallback.
   */
  public static exportAsDataUrl(
    canvas: HTMLCanvasElement,
    format: 'png' | 'webp' = 'png'
  ): string {
    const mime = format === 'webp' ? 'image/webp' : 'image/png';
    return canvas.toDataURL(mime, 0.95);
  }

  /**
   * Triggers browser download of a graphic file.
   */
  public static downloadImage(blobOrUrl: Blob | string, filename = 'breaking-news-wala-graphic.png') {
    const link = document.createElement('a');
    link.download = filename;
    if (typeof blobOrUrl === 'string') {
      link.href = blobOrUrl;
      link.click();
    } else {
      const url = URL.createObjectURL(blobOrUrl);
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
}
