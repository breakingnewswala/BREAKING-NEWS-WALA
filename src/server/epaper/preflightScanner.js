/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Quality Preflight Scanner Engine
 * 
 * Implements 5 diagnostic quality checks across broadsheet pages and elements:
 * 1. TEXT_OVERFLOW (BLOCKER): Text height exceeding bounding box
 * 2. LOW_RES_IMAGE (WARNING): Image resolution below 800px print threshold
 * 3. MISSING_ATTRIBUTION (ERROR): Story lacking reporter byline/credit
 * 4. UNAPPROVED_AD_PLACEMENT (BLOCKER): Ad lacking mandatory ASCI 'विज्ञापन' badge or unapproved status
 * 5. ORPHAN_HEADLINE (BLOCKER): Headline element with empty body text
 * 
 * Grounded in docs/06-Business-Rules.md, docs/11-Architecture.md
 * Master Milestone 5 (Step 10, Features F17 & F18)
 */

export const SEVERITY = {
  BLOCKER: 'BLOCKER',
  ERROR: 'ERROR',
  WARNING: 'WARNING',
};

export class QualityPreflightScanner {
  /**
   * Evaluates an edition and all its broadsheet pages against 5 diagnostic rules.
   * @param {Object} edition - EpaperEditionDoc
   * @param {Array<Object>} pages - Array of EpaperPageDoc
   * @returns {Object} Preflight diagnostic report
   */
  static evaluate(edition, pages = []) {
    const blockers = [];
    const errors = [];
    const warnings = [];

    const safePages = Array.isArray(pages) ? pages : [];

    // 0. PAGE_COUNT_RULE: Daily/Regular editions must contain exactly 12 pages; Special editions are flexible
    const editionType = String(edition?.editionType || 'REGULAR').toUpperCase();
    if (editionType === 'REGULAR' || editionType === 'DAILY') {
      if (safePages.length !== 12) {
        blockers.push({
          code: 'INVALID_PAGE_COUNT',
          severity: SEVERITY.BLOCKER,
          message: `दैनिक ई-पेपर संस्करण में अनिवार्य रूप से ठीक 12 पृष्ठ होने चाहिए (वर्तमान: ${safePages.length} पृष्ठ)। विशेष संस्करण (SPECIAL) स्वतंत्र पृष्ठ विन्यास रख सकते हैं।`,
        });
      }
    } else if (safePages.length === 0) {
      blockers.push({
        code: 'EMPTY_EDITION',
        severity: SEVERITY.BLOCKER,
        message: 'ई-पेपर संस्करण में कम से कम 1 पृष्ठ होना अनिवार्य है।',
      });
    }

    for (const page of safePages) {
      const elements = Array.isArray(page.elements) ? page.elements : [];
      const pageNum = page.pageNumber || 1;

      for (const el of elements) {
        if (!el) continue;

        // 1. TEXT_OVERFLOW (BLOCKER)
        if (el.elementType === 'STORY' && el.customBodyText) {
          const estimatedLineHeight = (el.fontSize || 12) * 1.35;
          const estLines = (el.customBodyText.length || 0) / 40;
          const requiredHeight = estLines * estimatedLineHeight;
          if (el.bounds && requiredHeight > el.bounds.height * 1.5) {
            blockers.push({
              code: 'TEXT_OVERFLOW',
              severity: SEVERITY.BLOCKER,
              pageNumber: pageNum,
              elementId: el.id,
              message: `Page ${pageNum}: कहानी का विवरण बाउंडिंग बॉक्स से बाहर जा रहा है (${Math.round(requiredHeight)}px > ${el.bounds.height}px)`,
            });
          }
        }

        // 2. LOW_RES_IMAGE (WARNING)
        if ((el.elementType === 'IMAGE' || el.hasImage) && el.imageWidth && el.imageWidth < 800) {
          warnings.push({
            code: 'LOW_RES_IMAGE',
            severity: SEVERITY.WARNING,
            pageNumber: pageNum,
            elementId: el.id,
            message: `Page ${pageNum}: चित्र की रिज़ॉल्यूशन मुद्रण हेतु कम है (${el.imageWidth}px < 800px)`,
          });
        }

        // 3. MISSING_ATTRIBUTION (ERROR)
        if (el.elementType === 'STORY' && !el.byline && !el.reporterId) {
          errors.push({
            code: 'MISSING_ATTRIBUTION',
            severity: SEVERITY.ERROR,
            pageNumber: pageNum,
            elementId: el.id,
            message: `Page ${pageNum}: समाचार सामग्री में रिपोर्टर या बायलाइन क्रेडिट अनुपस्थित है`,
          });
        }

        // 4. UNAPPROVED_AD_PLACEMENT (BLOCKER)
        if (el.elementType === 'AD') {
          if (!el.asciBadge) {
            blockers.push({
              code: 'UNAPPROVED_AD_PLACEMENT',
              severity: SEVERITY.BLOCKER,
              pageNumber: pageNum,
              elementId: el.id,
              message: `Page ${pageNum}: विज्ञापन पर अनिवार्य ASCI 'विज्ञापन' पहचान चिह्न अनुपस्थित है`,
            });
          }
          if (el.adStatus && el.adStatus !== 'APPROVED') {
            blockers.push({
              code: 'UNAPPROVED_AD_PLACEMENT',
              severity: SEVERITY.BLOCKER,
              pageNumber: pageNum,
              elementId: el.id,
              message: `Page ${pageNum}: विज्ञापन संपादन द्वारा स्वीकृत नहीं है (स्थिति: ${el.adStatus})`,
            });
          }
        }

        // 5. ORPHAN_HEADLINE (BLOCKER)
        if (el.elementType === 'HEADLINE' && (!el.customBodyText || el.customBodyText.trim() === '')) {
          blockers.push({
            code: 'ORPHAN_HEADLINE',
            severity: SEVERITY.BLOCKER,
            pageNumber: pageNum,
            elementId: el.id,
            message: `Page ${pageNum}: शीर्षक बिना किसी संबंधित समाचार विवरण के उपस्थित है (Orphan Headline)`,
          });
        }
      }
    }

    const canPublish = blockers.length === 0;
    return {
      canPublish,
      blockerCount: blockers.length,
      errorCount: errors.length,
      warningCount: warnings.length,
      blockers,
      errors,
      warnings,
      scannedAt: new Date().toISOString(),
    };
  }
}
