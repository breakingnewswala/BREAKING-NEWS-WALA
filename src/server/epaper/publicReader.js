/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Public E-Paper Reader Engine & Social Clipping Mathematics
 * 
 * Provides:
 * - Zoom model and clamping logic (0.5 to 4.0 / 10% to 200%)
 * - Reading mode typography scaling (12px to 32px), word count, reading time
 * - 4:5 and 1:1 social clipping bounding box calculations
 * 
 * Grounded in docs/07-Design.md, docs/11-Architecture.md
 * Master Milestone 5 (Step 11, Features F19 & F20)
 */

export class PublicReaderEngine {
  static getZoomModel(initialZoom = 1.0, pan = { x: 0, y: 0 }) {
    return {
      currentZoom: Math.min(4.0, Math.max(0.5, initialZoom)),
      minZoom: 0.5,
      maxZoom: 4.0,
      panX: pan.x || 0,
      panY: pan.y || 0,
      step: 0.25,
    };
  }

  static computeZoom(current, delta) {
    const next = Number((current + delta).toFixed(2));
    return { zoom: Math.min(4.0, Math.max(0.5, next)) };
  }

  static formatReadingModeArticle(elementOrArticle, options = { fontSize: 18 }) {
    const fontSize = Math.min(32, Math.max(12, options.fontSize || 18));
    const headline = elementOrArticle.customHeadline || elementOrArticle.title || 'प्रमुख समाचार';
    const body = elementOrArticle.customBodyText || elementOrArticle.content || elementOrArticle.summary || '';
    const words = body.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const isDevanagari = /[\u0900-\u097F]/.test(body) && /[\u094D\u093E-\u094C\u0902\u0903\u093C]/.test(body);

    // Approximate line breaking for reading mode display
    const estLineChars = Math.max(20, Math.round(600 / (fontSize * 0.62)));
    const lines = [];
    let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).length > estLineChars) {
        lines.push(cur);
        cur = w;
      } else {
        cur = cur ? cur + ' ' + w : w;
      }
    }
    if (cur) lines.push(cur);

    return {
      headline,
      fontSize,
      lineHeight: Number((fontSize * 1.6).toFixed(1)),
      lines,
      wordCount,
      readingTimeMinutes: Math.max(1, Math.ceil(wordCount / 180)),
      isDevanagari,
      body,
      byline: elementOrArticle.byline || elementOrArticle.authorName || 'विशेष संवाददाता',
      photographer: elementOrArticle.photographerCredit || 'ब्यूरो फोटो',
      imageUrl: elementOrArticle.imageUrl,
    };
  }

  static generateSocialClippingBounds(rect, format = '4:5') {
    const targetRatio = format === '4:5' ? 0.8 : 1.0;
    const width = rect.width;
    const height = Math.round(width / targetRatio);
    return {
      x: rect.x,
      y: rect.y,
      width,
      height,
      aspectRatio: format,
      ratioValue: Number((width / height).toFixed(2)),
    };
  }
}
