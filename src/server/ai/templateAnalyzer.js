/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * AI Template Analyzer & Geometric Broadsheet Segmentation Engine
 */

export class TemplateAnalyzerEngine {
  static getProviderInfo() {
    return {
      model: 'bnw-mock-v1',
      provider: 'bnw-local-layout-analyzer',
      isFallback: true,
      offlineReady: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Geometric layout segmentation algorithm calculating totalSlots,
   * structure, aspect ratios, and density.
   *
   * @param {Array<object>} elements - Page elements or bounding boxes
   * @returns {object} Analysis result
   */
  static analyzeTemplateStructure(elements) {
    if (!elements || !Array.isArray(elements) || elements.length === 0) {
      return {
        totalSlots: 0,
        storySlots: 0,
        adSlots: 0,
        headlineSlots: 0,
        columnSlots: 0,
        imageSlots: 0,
        layoutDensity: 'LOW',
        structure: 'BLANK_PAGE',
        slots: [],
        extractedAt: new Date().toISOString(),
        metadata: this.getProviderInfo(),
      };
    }

    let storySlots = 0;
    let adSlots = 0;
    let headlineSlots = 0;
    let columnSlots = 0;
    let imageSlots = 0;

    const slots = elements.map((el, i) => {
      const type = el.elementType || el.type || 'STORY';
      const bounds = el.bounds || { x: 0, y: 0, width: 100, height: 100 };
      const colSpan = el.colSpan || (bounds.width > 500 ? 6 : bounds.width > 300 ? 4 : 2);

      if (type === 'STORY') storySlots++;
      else if (type === 'AD') adSlots++;
      else if (type === 'HEADLINE' || type === 'MASTHEAD') headlineSlots++;
      else if (type === 'COLUMN') columnSlots++;
      else if (type === 'IMAGE') imageSlots++;

      const w = Math.max(1, Math.round(bounds.width || 100));
      const h = Math.max(1, Math.round(bounds.height || 100));

      return {
        slotId: el.id || `slot-${i + 1}`,
        type,
        colSpan,
        bounds,
        recommendedAspectRatio: `${w}:${h}`,
        asciBadgeRequired: type === 'AD',
      };
    });

    const totalSlots = slots.length;
    let layoutDensity = 'LOW';
    if (totalSlots >= 8) {
      layoutDensity = 'BROADSHEET_STANDARD';
    } else if (totalSlots >= 5) {
      layoutDensity = 'HIGH';
    } else if (totalSlots >= 3) {
      layoutDensity = 'MEDIUM';
    }

    const structure = totalSlots > 5 ? 'MULTI_COLUMN_BROADSHEET' : 'SIMPLE_LAYOUT';

    return {
      totalSlots,
      storySlots,
      adSlots,
      headlineSlots,
      columnSlots,
      imageSlots,
      layoutDensity,
      structure,
      slots,
      extractedAt: new Date().toISOString(),
      metadata: this.getProviderInfo(),
    };
  }

  /**
   * Converts analysis result into an EpaperTemplateDoc candidate
   */
  static convertAnalysisToTemplate(analysis, { name, nameHi, category = 'CUSTOM', gridColumns = 8 } = {}) {
    const timestamp = new Date().toISOString();
    return {
      id: `tpl-custom-${Date.now()}`,
      templateCode: `TPL-CUST-${Date.now().toString(36).toUpperCase()}`,
      name: name || 'कस्टम पेज लेआउट',
      nameHi: nameHi || name || 'कस्टम पेज लेआउट',
      category,
      gridColumns,
      isSystem: false,
      version: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      regions: (analysis.slots || []).map((s, idx) => ({
        id: `reg-${idx + 1}-${s.type.toLowerCase()}`,
        name: `क्षेत्र ${idx + 1}: ${s.type}`,
        bounds: s.bounds,
        colSpan: s.colSpan,
        defaultElementType: s.type,
      })),
    };
  }
}
