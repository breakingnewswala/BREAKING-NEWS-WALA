/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master Production Graphic Rendering Engine
 * 
 * Strict Invariant: Pure Canvas/OffscreenCanvas rendering logic separate from UI components.
 * Supports:
 * - 4:5, 1:1, 9:16, 16:9, 3:4 aspect ratios.
 * - Dynamic Devanagari typography scaling to prevent glyph clipping and overflow.
 * - Layer compositing: Backgrounds, Images, Badges, Logos, Text.
 * - High-resolution PNG and WebP export matching preview.
 */

import { GraphicAspectRatio, GraphicItem, GraphicLayer, GraphicTemplate } from '../types';

export interface RenderOptions {
  scale?: number; // scale multiplier (default 1 for 1080p canvas)
  targetFormat?: 'png' | 'webp';
  quality?: number;
  showWatermark?: boolean;
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
  private static roundRect(
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
   * Renders the complete graphic onto a target canvas element.
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
    ctx.letterSpacing = '2px';
    ctx.fillText('BREAKING NEWS WALA • MADHYA PRADESH', 116, 74);
    ctx.restore();

    // 4. Render Badges (Breaking News & District Tag)
    const isBreaking = graphic.isBreaking !== undefined ? graphic.isBreaking : true;
    const districtText = graphic.districtName || 'मध्य प्रदेश (समस्त 55 जिले)';
    const categoryText = graphic.categoryName || 'विशेष समाचार';

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

