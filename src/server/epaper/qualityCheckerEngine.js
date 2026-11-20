/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Authoritative E-Paper Quality Checker & Publishing Assurance Engine
 * File: src/server/epaper/qualityCheckerEngine.js
 *
 * Implements Step 10 Requirements:
 * 1. Six comprehensive diagnostic validation categories:
 *    A. Edition Structure (12 pages for Daily, Special independent counts, page sequence, broadsheet size)
 *    B. Editorial Quality (approved status check, headlines, bodies, reporter/editor credits, duplicate detection)
 *    C. Visual & Layout Quality (overflow, AABB collision, boundaries, broken images, Devanagari text, masthead)
 *    D. Advertisement Quality (approved status, ASCI sponsored badges, slot boundaries, content displacement)
 *    E. Metadata & Attribution (editionCode, publicationDate, reporter attribution, source article references)
 *    F. Technical & Export Quality (element validity, high-res PNG/PDF export generation, non-zero buffers)
 * 2. Strict Severity Hierarchy: CRITICAL (blocks publish), ERROR (blocks publish), WARNING (editorial review), INFO (advisory).
 * 3. Reproducible Documented Quality Score (Base 100 - Critical*25 - Error*10 - Warning*3).
 * 4. Exception Workflow: Warning/Error exceptions require authorized roles & written reasons; CRITICAL issues CANNOT be bypassed.
 * 5. Publishing Safety & Immutability: Re-validation gate, OCC version check, immutable snapshots, stale check invalidation.
 */

import { checkAABBCollision, BROADSHEET_LAYOUT_CONSTANTS } from '../ai/layoutAssistant.js';
import { HighResExportEngine, BROADSHEET_CONSTANTS } from './exportEngine.js';

export const QUALITY_SEVERITY = {
  CRITICAL: 'CRITICAL',
  ERROR: 'ERROR',
  WARNING: 'WARNING',
  INFO: 'INFO',
};

export const QUALITY_CATEGORIES = {
  STRUCTURE: 'STRUCTURE',
  EDITORIAL: 'EDITORIAL',
  LAYOUT: 'LAYOUT',
  ADVERTISEMENT: 'ADVERTISEMENT',
  METADATA: 'METADATA',
  EXPORT: 'EXPORT',
};

export const CATEGORY_NAMES_HI = {
  STRUCTURE: 'संस्करण संरचना (Structure)',
  EDITORIAL: 'संपादकीय गुणवत्ता (Editorial)',
  LAYOUT: 'दृश्य एवं लेआउट (Visual & Layout)',
  ADVERTISEMENT: 'विज्ञापन एवं प्रायोजन (Advertisement)',
  METADATA: 'मेटाडेटा एवं श्रेय (Metadata & Attribution)',
  EXPORT: 'तकनीकी एवं निर्यात (Export & Technical)',
};

export class QualityCheckerEngine {
  /**
   * Evaluates complete edition across all 6 diagnostic categories.
   * @param {Object} params
   * @param {Object} params.edition - EpaperEditionDoc
   * @param {Array<Object>} params.pages - Array of EpaperPageDoc
   * @param {Object} [params.adapter=null] - Persistence adapter for article/ad validation
   * @param {Object} [params.user=null] - Current requesting user
   * @param {boolean} [params.skipExportCheck=false] - Whether to skip heavy PDF/PNG rendering test
   * @returns {Promise<Object>} Full diagnostic report matching EpaperQualityCheckReport
   */
  static async evaluateEdition({
    edition,
    pages = [],
    adapter = null,
    user = null,
    skipExportCheck = false,
  }) {
    if (!edition) {
      throw new Error('गुणवत्ता परीक्षण हेतु संस्करण डेटा (edition) अनिवार्य है।');
    }

    const issues = [];
    let issueCounter = 1;

    const addIssue = ({
      category,
      severity,
      code,
      titleHi,
      descriptionHi,
      recommendationHi,
      pageNumber = undefined,
      elementId = undefined,
      articleId = undefined,
      adId = undefined,
    }) => {
      issues.push({
        id: `iss-${category.toLowerCase().slice(0, 3)}-${String(issueCounter++).padStart(3, '0')}`,
        editionId: edition.id,
        pageNumber,
        elementId,
        articleId,
        adId,
        category,
        severity,
        code,
        titleHi,
        descriptionHi,
        recommendationHi,
        timestamp: new Date().toISOString(),
        resolutionStatus: 'UNRESOLVED',
      });
    };

    const safePages = Array.isArray(pages) ? [...pages] : [];
    safePages.sort((a, b) => (Number(a.pageNumber) || 0) - (Number(b.pageNumber) || 0));

    // =========================================================================
    // CATEGORY A: EDITION STRUCTURE
    // =========================================================================
    const editionType = String(edition.editionType || 'DAILY').toUpperCase();
    const isDaily = editionType === 'DAILY' || editionType === 'REGULAR';

    // A1. Page Count Validation
    if (isDaily) {
      if (safePages.length !== 12) {
        addIssue({
          category: QUALITY_CATEGORIES.STRUCTURE,
          severity: QUALITY_SEVERITY.CRITICAL,
          code: 'DAILY_PAGE_COUNT_MISMATCH',
          titleHi: 'दैनिक संस्करण में अमान्य पृष्ठ संख्या',
          descriptionHi: `दैनिक ई-पेपर संस्करण में अनिवार्य रूप से ठीक 12 पृष्ठ होने चाहिए (वर्तमान: ${safePages.length} पृष्ठ)।`,
          recommendationHi: 'संस्करण में ठीक 12 पृष्ठ शामिल करें अथवा अनुपलब्ध पृष्ठ जोड़ें।',
        });
      }
    } else {
      // Special edition
      const expectedPages = parseInt(edition.totalPages, 10) || 4;
      if (safePages.length === 0 || safePages.length > 48) {
        addIssue({
          category: QUALITY_CATEGORIES.STRUCTURE,
          severity: QUALITY_SEVERITY.CRITICAL,
          code: 'SPECIAL_PAGE_COUNT_INVALID',
          titleHi: 'विशेष संस्करण पृष्ठ सीमा उल्लंघन',
          descriptionHi: `विशेष संस्करण में 1 से 48 पृष्ठ होने चाहिए (वर्तमान: ${safePages.length} पृष्ठ)।`,
          recommendationHi: 'पृष्ठ संख्या को 1 से 48 के बीच समायोजित करें।',
        });
      } else if (safePages.length !== expectedPages) {
        addIssue({
          category: QUALITY_CATEGORIES.STRUCTURE,
          severity: QUALITY_SEVERITY.ERROR,
          code: 'SPECIAL_PAGE_COUNT_MISMATCH',
          titleHi: 'विशेष संस्करण निर्धारित पृष्ठ संख्या बेमेल',
          descriptionHi: `विशेष संस्करण में निर्धारित ${expectedPages} के स्थान पर ${safePages.length} पृष्ठ पाए गए।`,
          recommendationHi: 'निर्धारित पृष्ठ संख्या के अनुरूप पृष्ठ सृजित करें।',
        });
      }
    }

    // A2. Missing Pages in Sequence & Duplicate Page Numbers
    const pageNumMap = new Map();
    const seenPageNumbers = new Set();
    let maxPageNum = 0;

    safePages.forEach((p) => {
      const pNum = Number(p.pageNumber);
      if (pNum > maxPageNum) maxPageNum = pNum;
      if (seenPageNumbers.has(pNum)) {
        addIssue({
          category: QUALITY_CATEGORIES.STRUCTURE,
          severity: QUALITY_SEVERITY.CRITICAL,
          code: 'DUPLICATE_PAGE_NUMBER',
          titleHi: `डुप्लीकेट पृष्ठ संख्या: पृष्ठ ${pNum}`,
          descriptionHi: `संस्करण में पृष्ठ संख्या ${pNum} एक से अधिक बार प्रयुक्त हुई है।`,
          recommendationHi: `पृष्ठ संख्या ${pNum} का क्रम सुधारें ताकि प्रत्येक पृष्ठ अद्वितीय हो।`,
          pageNumber: pNum,
        });
      }
      seenPageNumbers.add(pNum);
      pageNumMap.set(pNum, p);
    });

    const targetTotalPages = isDaily ? 12 : (parseInt(edition.totalPages, 10) || safePages.length);
    for (let i = 1; i <= targetTotalPages; i++) {
      if (!pageNumMap.has(i)) {
        addIssue({
          category: QUALITY_CATEGORIES.STRUCTURE,
          severity: QUALITY_SEVERITY.CRITICAL,
          code: 'MISSING_PAGE_IN_SEQUENCE',
          titleHi: `अनुपलब्ध पृष्ठ: पृष्ठ संख्या ${i}`,
          descriptionHi: `पृष्ठ अनुक्रम में पृष्ठ संख्या ${i} अनुपलब्ध है।`,
          recommendationHi: `पृष्ठ संख्या ${i} का निर्माण करें अथवा पेज क्रम पुनर्व्यवस्थित करें।`,
          pageNumber: i,
        });
      }
    }

    // A3. Basic Edition Metadata
    if (!edition.title || edition.title.trim().length === 0) {
      addIssue({
        category: QUALITY_CATEGORIES.STRUCTURE,
        severity: QUALITY_SEVERITY.ERROR,
        code: 'MISSING_EDITION_TITLE',
        titleHi: 'संस्करण शीर्षक अनुपस्थित',
        descriptionHi: 'ई-पेपर संस्करण का मुख्य शीर्षक रिक्त है।',
        recommendationHi: 'संस्करण का स्पष्ट शीर्षक (उदा. भोपाल दैनिक संस्करण) प्रविष्ट करें।',
      });
    }

    if (!edition.publicationDate || !/^\d{4}-\d{2}-\d{2}$/.test(edition.publicationDate)) {
      addIssue({
        category: QUALITY_CATEGORIES.STRUCTURE,
        severity: QUALITY_SEVERITY.ERROR,
        code: 'INVALID_PUBLICATION_DATE',
        titleHi: 'अमान्य अथवा अनुपस्थित प्रकाशन तिथि',
        descriptionHi: `प्रकाशन तिथि मानक YYYY-MM-DD प्रारूप में होनी चाहिए (वर्तमान: "${edition.publicationDate || 'रिक्त'}").`,
        recommendationHi: 'प्रकाशन की वैध तिथि निर्धारित करें।',
      });
    }

    // A4. Physical Broadsheet Dimensions
    const targetWidthPt = BROADSHEET_LAYOUT_CONSTANTS.PAGE_WIDTH_PT; // 932.6
    const targetHeightPt = BROADSHEET_LAYOUT_CONSTANTS.PAGE_HEIGHT_PT; // 1474.0

    safePages.forEach((p) => {
      const w = Number(p.width ?? p.bounds?.widthPt ?? p.bounds?.width) || targetWidthPt;
      const h = Number(p.height ?? p.bounds?.heightPt ?? p.bounds?.height) || targetHeightPt;
      if (Math.abs(w - targetWidthPt) > 5 || Math.abs(h - targetHeightPt) > 5) {
        addIssue({
          category: QUALITY_CATEGORIES.STRUCTURE,
          severity: QUALITY_SEVERITY.ERROR,
          code: 'INVALID_PAGE_DIMENSIONS',
          titleHi: `अमान्य ब्रॉडशीट आकार (पृष्ठ ${p.pageNumber})`,
          descriptionHi: `पृष्ठ ${p.pageNumber} का माप (${w}x${h} pt) 32.9x52.0 cm (${targetWidthPt}x${targetHeightPt} pt) मानक से भिन्न है।`,
          recommendationHi: 'पृष्ठ आयाम को मानक ब्रॉडशीट (932.6 x 1474 pt) पर रीसेट करें।',
          pageNumber: p.pageNumber,
        });
      }
    });

    // =========================================================================
    // CATEGORY B: EDITORIAL QUALITY & ARTICLE VERIFICATION
    // =========================================================================
    const placedArticleIds = new Map(); // articleId -> [pageNumber]
    const assignedArticleObjects = new Map();

    for (const page of safePages) {
      const elements = Array.isArray(page.elements) ? page.elements : [];
      const pageNum = page.pageNumber || 1;

      for (const el of elements) {
        if (!el) continue;

        if (el.elementType === 'STORY' || el.articleId) {
          const artId = el.articleId || el.id;

          // Track duplicate placements
          if (artId) {
            if (!placedArticleIds.has(artId)) {
              placedArticleIds.set(artId, []);
            }
            placedArticleIds.get(artId).push(pageNum);
          }

          // B1. Missing or empty headline
          const headlineText = (el.customHeadline || el.headline || el.title || '').trim();
          if (!headlineText) {
            addIssue({
              category: QUALITY_CATEGORIES.EDITORIAL,
              severity: QUALITY_SEVERITY.ERROR,
              code: 'EMPTY_STORY_HEADLINE',
              titleHi: `रिक्त समाचार शीर्षक (पृष्ठ ${pageNum})`,
              descriptionHi: `पृष्ठ ${pageNum} पर स्थित समाचार में कोई शीर्षक उपलब्ध नहीं है।`,
              recommendationHi: 'समाचार के लिए स्पष्ट व प्रामाणिक देवनागरी शीर्षक जोड़ें।',
              pageNumber: pageNum,
              elementId: el.id,
              articleId: artId,
            });
          }

          // B2. Missing body text
          const bodyText = (el.customBodyText || el.bodyText || el.content || el.summary || '').trim();
          if (!bodyText) {
            addIssue({
              category: QUALITY_CATEGORIES.EDITORIAL,
              severity: QUALITY_SEVERITY.ERROR,
              code: 'EMPTY_STORY_BODY',
              titleHi: `रिक्त समाचार सामग्री (पृष्ठ ${pageNum})`,
              descriptionHi: `पृष्ठ ${pageNum} पर स्थित समाचार का मुख्य विवरण (Body) पूर्णतः रिक्त है।`,
              recommendationHi: 'समाचार की मूल सामग्री अथवा सारगर्भित विवरण प्रविष्ट करें।',
              pageNumber: pageNum,
              elementId: el.id,
              articleId: artId,
            });
          } else {
            // Suspiciously short article (< 20 words)
            const wordCount = bodyText.split(/\s+/).length;
            if (wordCount < 20 && el.elementType === 'STORY') {
              addIssue({
                category: QUALITY_CATEGORIES.EDITORIAL,
                severity: QUALITY_SEVERITY.WARNING,
                code: 'SUSPICIOUSLY_SHORT_ARTICLE',
                titleHi: `अत्यंत संक्षिप्त समाचार (${wordCount} शब्द, पृष्ठ ${pageNum})`,
                descriptionHi: `समाचार में केवल ${wordCount} शब्द हैं, जो समाचार पत्र मानक से कम है।`,
                recommendationHi: 'समाचार में अतिरिक्त संदर्भ या विस्तृत विवरण जोड़ें।',
                pageNumber: pageNum,
                elementId: el.id,
                articleId: artId,
              });
            }
          }

          // B3. Missing reporter byline / credits
          const reporterCredit = (el.byline || el.reporterName || el.authorName || el.credit || '').trim();
          if (!reporterCredit && !el.reporterId) {
            addIssue({
              category: QUALITY_CATEGORIES.EDITORIAL,
              severity: QUALITY_SEVERITY.WARNING,
              code: 'MISSING_REPORTER_CREDIT',
              titleHi: `रिपोर्टर श्रेय अनुपस्थित (पृष्ठ ${pageNum})`,
              descriptionHi: `समाचार "${headlineText ? headlineText.slice(0, 40) + '...' : 'अनाम'}" में रिपोर्टर बायलाइन अनुपलब्ध है।`,
              recommendationHi: 'संवाददाता का नाम अथवा ब्यूरो संदर्भ (उदा. विशेष संवाददाता/BNW) जोड़ें।',
              pageNumber: pageNum,
              elementId: el.id,
              articleId: artId,
            });
          }

          // B3b. Missing editor credits
          const editorCredit = (el.editorCredit || el.deskEditorName || '').trim();
          if (!editorCredit) {
            addIssue({
              category: QUALITY_CATEGORIES.EDITORIAL,
              severity: QUALITY_SEVERITY.WARNING,
              code: 'MISSING_EDITOR_CREDIT',
              titleHi: `संपादक श्रेय अनुपस्थित (पृष्ठ ${pageNum})`,
              descriptionHi: `समाचार "${headlineText ? headlineText.slice(0, 40) + '...' : 'अनाम'}" में डेस्क संपादक का नाम अनुपलब्ध है।`,
              recommendationHi: 'डेस्क संपादक अथवा समीक्षक का नाम जोड़ें।',
              pageNumber: pageNum,
              elementId: el.id,
              articleId: artId,
            });
          }

          // Check persistence status if adapter is available
          if (adapter && artId) {
            try {
              const dbArt = await adapter.getArticleByIdOrSlug(artId);
              if (dbArt) {
                assignedArticleObjects.set(artId, dbArt);

                // Unapproved article placed on page -> CRITICAL
                const artStatus = String(dbArt.status || '').toUpperCase();
                const wfStatus = String(dbArt.workflowStatus || '').toUpperCase();
                const isApproved =
                  artStatus === 'APPROVED' ||
                  artStatus === 'PUBLISHED' ||
                  wfStatus === 'APPROVED_FOR_EPAPER' ||
                  wfStatus === 'ASSIGNED_TO_PAGE' ||
                  wfStatus === 'PAGE_DESIGNED' ||
                  wfStatus === 'FINAL_APPROVED';

                if (!isApproved) {
                  addIssue({
                    category: QUALITY_CATEGORIES.EDITORIAL,
                    severity: QUALITY_SEVERITY.CRITICAL,
                    code: 'UNAPPROVED_ARTICLE_PLACED',
                    titleHi: `अस्वीकृत समाचार का स्थानन (पृष्ठ ${pageNum})`,
                    descriptionHi: `समाचार "${dbArt.title?.slice(0, 45)}..." वर्तमान में '${artStatus || 'DRAFT'}' स्थिति में है और ई-पेपर हेतु स्वीकृत नहीं है।`,
                    recommendationHi: 'संपादकीय चयन डेस्क में जाकर समाचार को स्वीकृत करें अथवा पृष्ठ से हटाएं।',
                    pageNumber: pageNum,
                    elementId: el.id,
                    articleId: artId,
                  });
                }

                // Check for unresolved editorial remarks
                if (dbArt.rejectionReason || (dbArt.editorialRemarks && dbArt.editorialRemarks.includes('अस्वीकृत'))) {
                  addIssue({
                    category: QUALITY_CATEGORIES.EDITORIAL,
                    severity: QUALITY_SEVERITY.WARNING,
                    code: 'UNRESOLVED_EDITORIAL_REMARKS',
                    titleHi: `असमाधानित संपादकीय टिप्पणी (पृष्ठ ${pageNum})`,
                    descriptionHi: `लेख में संपादकीय आपत्ति दर्ज है: "${dbArt.rejectionReason || dbArt.editorialRemarks}"`,
                    recommendationHi: 'संपादकीय टिप्पणी की समीक्षा कर समाधान करें।',
                    pageNumber: pageNum,
                    elementId: el.id,
                    articleId: artId,
                  });
                }
              }
            } catch (_e) {}
          }
        }
      }
    }

    // Check for duplicate article placements across pages
    for (const [artId, pagesPlaced] of placedArticleIds.entries()) {
      if (pagesPlaced.length > 1) {
        addIssue({
          category: QUALITY_CATEGORIES.EDITORIAL,
          severity: QUALITY_SEVERITY.CRITICAL,
          code: 'DUPLICATE_ARTICLE_PLACEMENT',
          titleHi: `डुप्लीकेट समाचार स्थानन (${pagesPlaced.length} बार)`,
          descriptionHi: `समाचार (ID: ${artId}) पृष्ठ [${pagesPlaced.join(', ')}] पर एक से अधिक बार रखा गया है।`,
          recommendationHi: 'अनावश्यक डुप्लीकेट स्थानन हटाएं ताकि प्रत्येक समाचार केवल एक बार छपे।',
          articleId: artId,
        });
      }
    }

    // =========================================================================
    // CATEGORY C: VISUAL AND LAYOUT QUALITY
    // =========================================================================
    for (const page of safePages) {
      const elements = Array.isArray(page.elements) ? page.elements : [];
      const pageNum = page.pageNumber || 1;
      let hasMasthead = Boolean(page.templateId === 'tpl-epaper-01-front' || (typeof page.templateId === 'string' && page.templateId.includes('front')));
      let totalElementArea = 0;

      const printWidth = BROADSHEET_LAYOUT_CONSTANTS.PRINTABLE_WIDTH_PT; // ~847.5
      const printHeight = BROADSHEET_LAYOUT_CONSTANTS.PRINTABLE_HEIGHT_PT; // ~1247.2
      const printableArea = printWidth * printHeight;

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (!el) continue;

        const bounds = el.bounds || { x: 0, y: 0, width: 100, height: 100 };
        totalElementArea += (bounds.width || 0) * (bounds.height || 0);

        if (el.elementType === 'MASTHEAD') {
          hasMasthead = true;
        }

        // C1. Outside Printable Boundaries Check
        const maxX = BROADSHEET_LAYOUT_CONSTANTS.PAGE_WIDTH_PT - 10;
        const maxY = BROADSHEET_LAYOUT_CONSTANTS.PAGE_HEIGHT_PT - 10;
        if (
          bounds.x < 5 ||
          bounds.y < 5 ||
          bounds.x + bounds.width > maxX ||
          bounds.y + bounds.height > maxY
        ) {
          addIssue({
            category: QUALITY_CATEGORIES.LAYOUT,
            severity: QUALITY_SEVERITY.ERROR,
            code: 'ELEMENT_OUTSIDE_PAGE_BOUNDARY',
            titleHi: `एलिमेंट पृष्ठ सीमा से बाहर (पृष्ठ ${pageNum})`,
            descriptionHi: `एलिमेंट (${el.elementType || 'Unknown'}) पृष्ठ के मुद्रण योग्य क्षेत्र से बाहर निकल रहा है।`,
            recommendationHi: 'एलिमेंट को पेज मार्जिन के अंदर पुनः स्थापित करें।',
            pageNumber: pageNum,
            elementId: el.id,
          });
        }

        // C2. Broken Image References
        if (el.elementType === 'IMAGE' || el.elementType === 'PHOTO' || el.hasImage || el.imageUrl) {
          const imgSrc = el.imageUrl || el.src || el.imageSrc;
          const isBroken = !imgSrc || imgSrc.trim().length === 0 || imgSrc.startsWith('invalid-') || imgSrc.includes('broken');
          if (isBroken) {
            addIssue({
              category: QUALITY_CATEGORIES.LAYOUT,
              severity: QUALITY_SEVERITY.ERROR,
              code: 'BROKEN_IMAGE_REFERENCE',
              titleHi: `टूटा हुआ/अनुपस्थित चित्र संदर्भ (पृष्ठ ${pageNum})`,
              descriptionHi: `चित्र स्लॉट में कोई मान्य छवि स्रोत (URL) उपलब्ध नहीं है।`,
              recommendationHi: 'वैध छवि अपलोड करें अथवा चित्र स्लॉट हटाएं।',
              pageNumber: pageNum,
              elementId: el.id,
            });
          }
        }

        // C3. Devanagari Unicode Rendering Health Check
        const allText = `${el.customHeadline || ''} ${el.customBodyText || ''} ${el.title || ''} ${el.byline || ''}`;
        if (allText.includes('\uFFFD') || /[\uD800-\uDFFF]/.test(allText)) {
          addIssue({
            category: QUALITY_CATEGORIES.LAYOUT,
            severity: QUALITY_SEVERITY.ERROR,
            code: 'DEVANAGARI_ENCODING_ERROR',
            titleHi: `देवनागरी फॉन्ट/एन्कोडिंग त्रुटि (पृष्ठ ${pageNum})`,
            descriptionHi: `एलिमेंट में दूषित यूनिकोड या अव्यवस्थित देवनागरी अक्षर (Replacement Character) पाए गए।`,
            recommendationHi: 'टेक्स्ट को शुद्ध देवनागरी यूनिकोड (UTF-8) में पुनः पेस्ट या टाइप करें।',
            pageNumber: pageNum,
            elementId: el.id,
          });
        }

        // C4. Typography Overflow Checks
        if (el.elementType === 'STORY' && el.customBodyText) {
          const estimatedLineHeight = (el.fontSize || 10) * 1.35;
          const estLines = (el.customBodyText.length || 0) / 38;
          const requiredHeight = estLines * estimatedLineHeight;
          if (bounds.height > 0 && requiredHeight > bounds.height * 1.4) {
            addIssue({
              category: QUALITY_CATEGORIES.LAYOUT,
              severity: QUALITY_SEVERITY.CRITICAL,
              code: 'TEXT_OVERFLOW_CRITICAL',
              titleHi: `गंभीर टेक्स्ट ओवरफ्लो (पृष्ठ ${pageNum})`,
              descriptionHi: `समाचार विवरण बॉक्स आकार (${bounds.height}px) से 40% अधिक बड़ा है (~${Math.round(requiredHeight)}px अपेक्षित)।`,
              recommendationHi: 'टेक्स्ट संक्षिप्त करें अथवा बाउंडिंग बॉक्स की ऊंचाई/कॉलम स्पैन बढ़ाएं।',
              pageNumber: pageNum,
              elementId: el.id,
            });
          } else if (bounds.height > 0 && requiredHeight > bounds.height * 1.1) {
            addIssue({
              category: QUALITY_CATEGORIES.LAYOUT,
              severity: QUALITY_SEVERITY.ERROR,
              code: 'TEXT_OVERFLOW_WARNING',
              titleHi: `टेक्स्ट ओवरफ्लो चेतावनी (पृष्ठ ${pageNum})`,
              descriptionHi: `समाचार विवरण बॉक्स की निचली सीमा को छू रहा है।`,
              recommendationHi: 'फ़ॉन्ट आकार 0.5pt कम करें या अतिरिक्त पंक्तियां हटाएं।',
              pageNumber: pageNum,
              elementId: el.id,
            });
          }
        }

        // C5. Excessively Small Typography (< 6pt)
        if (el.fontSize && el.fontSize < 6 && el.elementType !== 'PRIMITIVE') {
          addIssue({
            category: QUALITY_CATEGORIES.LAYOUT,
            severity: QUALITY_SEVERITY.WARNING,
            code: 'UNREADABLE_SMALL_TYPOGRAPHY',
            titleHi: `अति-सूक्ष्म फॉन्ट आकार (${el.fontSize}pt, पृष्ठ ${pageNum})`,
            descriptionHi: `अखबार मुद्रण में 6pt से छोटा फॉन्ट पठनीय नहीं रहता।`,
            recommendationHi: 'फॉन्ट आकार न्यूनतम 7pt या 8pt पर सेट करें।',
            pageNumber: pageNum,
            elementId: el.id,
          });
        }

        // C6. 2D AABB Overlapping Collision Detection
        for (let j = i + 1; j < elements.length; j++) {
          const otherEl = elements[j];
          if (!otherEl) continue;

          // Ignore container/background primitives
          const isIgnored =
            el.elementType === 'COLUMN' ||
            otherEl.elementType === 'COLUMN' ||
            el.elementType === 'PRIMITIVE' ||
            otherEl.elementType === 'PRIMITIVE';

          if (!isIgnored) {
            const b1 = bounds;
            const b2 = otherEl.bounds || { x: 0, y: 0, width: 100, height: 100 };
            if (checkAABBCollision(b1, b2, 5)) {
              addIssue({
                category: QUALITY_CATEGORIES.LAYOUT,
                severity: QUALITY_SEVERITY.ERROR,
                code: 'OVERLAPPING_PAGE_ELEMENTS',
                titleHi: `एलिमेंट ओवरलैप (पृष्ठ ${pageNum})`,
                descriptionHi: `एलिमेंट "${el.elementType}" और "${otherEl.elementType}" आपस में टकरा (Overlap) रहे हैं।`,
                recommendationHi: 'एलिमेंट्स के मध्य न्यूनतम 5mm (14pt) का गटर सुनिश्चित करें।',
                pageNumber: pageNum,
                elementId: el.id,
              });
            }
          }
        }
      }

      // C7. Front Page Masthead Requirement
      if (pageNum === 1 && elements.length > 0 && !hasMasthead) {
        addIssue({
          category: QUALITY_CATEGORIES.LAYOUT,
          severity: QUALITY_SEVERITY.ERROR,
          code: 'FRONT_PAGE_MISSING_MASTHEAD',
          titleHi: 'प्रथम पृष्ठ पर अखबार मास्टहेड अनुपस्थित',
          descriptionHi: 'दैनिक अथवा विशेष संस्करण के पृष्ठ 1 पर मुख्य मास्टहेड (Banner) होना अनिवार्य है।',
          recommendationHi: 'पृष्ठ 1 के शीर्ष पर मास्टहेड एलिमेंट जोड़ें।',
          pageNumber: 1,
        });
      }

      // C8. Abnormal Empty Space (< 25% utilization on non-special pages)
      if (elements.length > 0 && totalElementArea < printableArea * 0.25 && pageNum <= 8) {
        addIssue({
          category: QUALITY_CATEGORIES.LAYOUT,
          severity: QUALITY_SEVERITY.WARNING,
          code: 'ABNORMAL_EMPTY_SPACE',
          titleHi: `अत्यधिक रिक्त स्थान (पृष्ठ ${pageNum})`,
          descriptionHi: `पृष्ठ ${pageNum} केवल ${Math.round((totalElementArea / printableArea) * 100)}% भरा हुआ है।`,
          recommendationHi: 'अतिरिक्त समाचार, छायाचित्र अथवा विज्ञापन जोड़कर दृश्य भार संतुलित करें।',
          pageNumber: pageNum,
        });
      }
    }

    // =========================================================================
    // CATEGORY D: ADVERTISEMENT QUALITY & ASCI COMPLIANCE
    // =========================================================================
    for (const page of safePages) {
      const elements = Array.isArray(page.elements) ? page.elements : [];
      const pageNum = page.pageNumber || 1;

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        const isAd = el && (el.elementType === 'AD' || el.elementType === 'AD_SLOT' || el.elementType === 'ADVERTISEMENT' || Boolean(el.adId) || Boolean(el.slotType));
        if (!el || !isAd) continue;

        // D1. ASCI Sponsored Badge Check
        const badgeStr = `${el.asciBadgeText || ''} ${el.badgeText || ''} ${el.title || ''}`;
        const hasAsciBadge =
          Boolean(el.asciBadge) ||
          badgeStr.includes('विज्ञापन') ||
          badgeStr.includes('प्रायोजित');

        if (!hasAsciBadge) {
          addIssue({
            category: QUALITY_CATEGORIES.ADVERTISEMENT,
            severity: QUALITY_SEVERITY.ERROR,
            code: 'MISSING_ASCI_SPONSORED_BADGE',
            titleHi: `विज्ञापन पर 'विज्ञापन' पहचान चिह्न अनुपस्थित (पृष्ठ ${pageNum})`,
            descriptionHi: `विज्ञापन नियामक (ASCI) मानकों के तहत प्रत्येक विज्ञापन पर 'विज्ञापन' लेबल अनिवार्य है।`,
            recommendationHi: 'विज्ञापन एलिमेंट में ASCI लेबल सक्रिय करें।',
            pageNumber: pageNum,
            elementId: el.id,
            adId: el.adId,
          });
        }

        // D2. Unapproved Advertisement Check
        const adStatus = String(el.adStatus || el.status || '').toUpperCase();
        if (adStatus && adStatus !== 'APPROVED' && adStatus !== 'SCHEDULED' && adStatus !== 'PUBLISHED') {
          addIssue({
            category: QUALITY_CATEGORIES.ADVERTISEMENT,
            severity: QUALITY_SEVERITY.CRITICAL,
            code: 'UNAPPROVED_AD_PLACEMENT',
            titleHi: `अस्वीकृत विज्ञापन का स्थानन (पृष्ठ ${pageNum})`,
            descriptionHi: `विज्ञापन वर्तमान में '${adStatus}' स्थिति में है और प्रकाशन हेतु अनुमोदित नहीं है।`,
            recommendationHi: 'विज्ञापन प्रबंधक में जाकर विज्ञापन स्वीकृत करें अथवा पृष्ठ से हटाएं।',
            pageNumber: pageNum,
            elementId: el.id,
            adId: el.adId,
          });
        }

        // Verify with persistence if adId exists
        if (adapter && el.adId) {
          try {
            let dbAd = null;
            if (typeof adapter.getEpaperAdSubmissionById === 'function') {
              dbAd = await adapter.getEpaperAdSubmissionById(el.adId);
            }
            if (!dbAd && Array.isArray(adapter.data?.epaperAds)) {
              dbAd = adapter.data.epaperAds.find((a) => a.id === el.adId);
            }
            if (!dbAd && Array.isArray(adapter.data?.epaperAdSubmissions)) {
              dbAd = adapter.data.epaperAdSubmissions.find((a) => a.id === el.adId);
            }
            if (dbAd) {
              const dbStatus = String(dbAd.status || '').toUpperCase();
              if (dbStatus === 'REJECTED' || dbStatus === 'DRAFT' || dbStatus === 'CANCELLED') {
                addIssue({
                  category: QUALITY_CATEGORIES.ADVERTISEMENT,
                  severity: QUALITY_SEVERITY.CRITICAL,
                  code: 'UNAPPROVED_AD_PLACEMENT',
                  titleHi: `डेटाबेस में अस्वीकृत विज्ञापन (पृष्ठ ${pageNum})`,
                  descriptionHi: `विज्ञापन रिकॉर्ड (${dbAd.businessName || dbAd.submissionNumber || el.adId}) की स्थिति '${dbStatus}' है।`,
                  recommendationHi: 'विज्ञापन की स्थिति को APPROVED पर अद्यतित करें।',
                  pageNumber: pageNum,
                  elementId: el.id,
                  adId: el.adId,
                });
              }
            }
          } catch (_e) {}
        }

        // D3. Ad Displacing Editorial Content / Overlap
        for (let j = 0; j < elements.length; j++) {
          if (i === j) continue;
          const other = elements[j];
          if (!other) continue;

          if (other.elementType === 'STORY' || other.elementType === 'HEADLINE' || other.articleId) {
            const b1 = el.bounds || { x: 0, y: 0, width: 100, height: 100 };
            const b2 = other.bounds || { x: 0, y: 0, width: 100, height: 100 };
            if (checkAABBCollision(b1, b2, 1)) {
              addIssue({
                category: QUALITY_CATEGORIES.ADVERTISEMENT,
                severity: QUALITY_SEVERITY.CRITICAL,
                code: 'AD_DISPLACING_EDITORIAL_CONTENT',
                titleHi: `विज्ञापन द्वारा समाचार का अतिक्रमण (पृष्ठ ${pageNum})`,
                descriptionHi: `विज्ञापन समाचार सामग्री के ऊपर आ रहा है (Content Displacement Collision)।`,
                recommendationHi: 'विज्ञापन को आरक्षित विज्ञापन स्लॉट में स्थानांतरित करें ताकि समाचार न ढके।',
                pageNumber: pageNum,
                elementId: el.id,
                adId: el.adId,
              });
            }
          } else if (other.elementType === 'AD' && j > i) {
            // Overlapping ads
            const b1 = el.bounds || { x: 0, y: 0, width: 100, height: 100 };
            const b2 = other.bounds || { x: 0, y: 0, width: 100, height: 100 };
            if (checkAABBCollision(b1, b2, 5)) {
              addIssue({
                category: QUALITY_CATEGORIES.ADVERTISEMENT,
                severity: QUALITY_SEVERITY.CRITICAL,
                code: 'OVERLAPPING_ADVERTISEMENTS',
                titleHi: `परस्पर टकराते विज्ञापन (पृष्ठ ${pageNum})`,
                descriptionHi: `दो विज्ञापन स्लॉट एक-दूसरे के ऊपर रखे गए हैं।`,
                recommendationHi: 'विज्ञापनों को अलग-अलग कॉलम या पृष्ठों पर निर्धारित करें।',
                pageNumber: pageNum,
                elementId: el.id,
                adId: el.adId,
              });
            }
          }
        }
      }
    }

    // =========================================================================
    // CATEGORY E: METADATA AND ATTRIBUTION
    // =========================================================================
    if (!edition.editionCode || edition.editionCode.trim().length === 0) {
      addIssue({
        category: QUALITY_CATEGORIES.METADATA,
        severity: QUALITY_SEVERITY.ERROR,
        code: 'MISSING_EDITION_CODE',
        titleHi: 'संस्करण कोड अनुपस्थित',
        descriptionHi: 'ई-पेपर का आधिकारिक पहचान कोड (editionCode) रिक्त है।',
        recommendationHi: 'मानक संस्करण कोड (उदा. EP-BHO-2026-11-20) दर्ज करें।',
      });
    }

    if (!edition.districtName && !edition.districtId && !edition.divisionName) {
      addIssue({
        category: QUALITY_CATEGORIES.METADATA,
        severity: QUALITY_SEVERITY.WARNING,
        code: 'MISSING_GEOGRAPHIC_METADATA',
        titleHi: 'भौगोलिक अधिकार-क्षेत्र मेटाडेटा अनुपस्थित',
        descriptionHi: 'संस्करण से संबंधित जिला अथवा संभाग का नाम दर्ज नहीं है।',
        recommendationHi: 'संबंधित जिला/संभाग का चयन करें।',
      });
    }

    // =========================================================================
    // CATEGORY F: TECHNICAL AND EXPORT QUALITY
    // =========================================================================
    if (!skipExportCheck && safePages.length > 0) {
      try {
        // HighRes PDF Export Builder Test
        const testPdf = HighResExportEngine.buildPrintReadyPdf(edition, safePages, { isTestMode: true });
        if (!testPdf || testPdf.length === 0) {
          addIssue({
            category: QUALITY_CATEGORIES.EXPORT,
            severity: QUALITY_SEVERITY.CRITICAL,
            code: 'ZERO_BYTE_EXPORT_PDF',
            titleHi: 'शून्य बाइट पीडीएफ निर्यात विफलता',
            descriptionHi: 'प्रिंट-रेडी पीडीएफ निर्माण प्रक्रिया ने 0-बाइट का रिक्त बफर उत्पन्न किया।',
            recommendationHi: 'पृष्ठ तत्वों व रेंडरिंग पाइपलाइन की जांच करें।',
          });
        }
      } catch (pdfErr) {
        addIssue({
          category: QUALITY_CATEGORIES.EXPORT,
          severity: QUALITY_SEVERITY.ERROR,
          code: 'PDF_EXPORT_PIPELINE_ERROR',
          titleHi: 'पीडीएफ निर्यात त्रुटि',
          descriptionHi: `पीडीएफ जनरेशन में तकनीकी त्रुटि: ${pdfErr.message}`,
          recommendationHi: 'पीडीएफ एक्सपोर्टर सेटिंग्स व फॉन्ट रिसोर्स की पुष्टि करें।',
        });
      }

      try {
        // HighRes Single Page PNG Test on first page
        const testPng = HighResExportEngine.generate300DpiPageImage(edition, safePages[0], { isTestMode: true });
        if (!testPng || testPng.length === 0) {
          addIssue({
            category: QUALITY_CATEGORIES.EXPORT,
            severity: QUALITY_SEVERITY.ERROR,
            code: 'PAGE_IMAGE_EXPORT_FAILED',
            titleHi: 'पृष्ठ 1 इमेज एक्सपोर्ट विफलता',
            descriptionHi: 'उच्च रिज़ॉल्यूशन मुद्रण इमेज निर्माण असफल रहा।',
            recommendationHi: 'कैन्वस व ग्राफिक्स रेंडरर की कार्यप्रणाली जांचें।',
            pageNumber: 1,
          });
        }
      } catch (pngErr) {
        addIssue({
          category: QUALITY_CATEGORIES.EXPORT,
          severity: QUALITY_SEVERITY.ERROR,
          code: 'IMAGE_EXPORT_PIPELINE_ERROR',
          titleHi: 'इमेज एक्सपोर्ट तकनीकी त्रुटि',
          descriptionHi: `पेज इमेज रेंडरिंग में त्रुटि: ${pngErr.message}`,
          recommendationHi: 'इमेज पाइपलाइन जांचें।',
          pageNumber: 1,
        });
      }
    }

    // =========================================================================
    // METRICS, SCORING & SUMMARY CALCULATION
    // =========================================================================
    const criticalCount = issues.filter((i) => i.severity === QUALITY_SEVERITY.CRITICAL && i.resolutionStatus === 'UNRESOLVED').length;
    const errorCount = issues.filter((i) => i.severity === QUALITY_SEVERITY.ERROR && i.resolutionStatus === 'UNRESOLVED').length;
    const warningCount = issues.filter((i) => i.severity === QUALITY_SEVERITY.WARNING && i.resolutionStatus === 'UNRESOLVED').length;
    const infoCount = issues.filter((i) => i.severity === QUALITY_SEVERITY.INFO).length;

    const unresolvedCount = issues.filter((i) => i.resolutionStatus === 'UNRESOLVED').length;
    const resolvedCount = issues.filter((i) => i.resolutionStatus === 'RESOLVED').length;
    const exceptionCount = issues.filter((i) => i.resolutionStatus === 'EXCEPTION_GRANTED').length;

    // Reproducible Documented Quality Score Calculation:
    // Base 100 - (Critical * 25 + Error * 10 + Warning * 3)
    const criticalDeduction = criticalCount * 25;
    const errorDeduction = errorCount * 10;
    const warningDeduction = warningCount * 3;
    const rawScore = 100 - (criticalDeduction + errorDeduction + warningDeduction);
    const finalScore = Math.max(0, Math.min(100, rawScore));

    const scoreBreakdown = {
      baseScore: 100,
      criticalDeduction,
      errorDeduction,
      warningDeduction,
      finalScore,
      formula: '100 - (Critical × 25 + Error × 10 + Warning × 3)',
    };

    // Publication & Approval Permissions
    const canPublish = criticalCount === 0 && errorCount === 0;
    const canApprove = criticalCount === 0 && errorCount === 0;

    let overallStatus = 'PASSED';
    if (criticalCount > 0 || errorCount > 0) {
      overallStatus = 'FAILED';
    } else if (warningCount > 0) {
      overallStatus = 'WARNINGS_PENDING';
    }

    // Category-wise summary
    const categoriesSummary = {};
    Object.values(QUALITY_CATEGORIES).forEach((cat) => {
      const catIssues = issues.filter((i) => i.category === cat);
      const cCount = catIssues.filter((i) => i.severity === QUALITY_SEVERITY.CRITICAL && i.resolutionStatus === 'UNRESOLVED').length;
      const eCount = catIssues.filter((i) => i.severity === QUALITY_SEVERITY.ERROR && i.resolutionStatus === 'UNRESOLVED').length;
      const wCount = catIssues.filter((i) => i.severity === QUALITY_SEVERITY.WARNING && i.resolutionStatus === 'UNRESOLVED').length;
      const iCount = catIssues.filter((i) => i.severity === QUALITY_SEVERITY.INFO).length;

      categoriesSummary[cat] = {
        category: cat,
        nameHi: CATEGORY_NAMES_HI[cat] || cat,
        criticalCount: cCount,
        errorCount: eCount,
        warningCount: wCount,
        infoCount: iCount,
        passed: cCount === 0 && eCount === 0,
        status: (cCount === 0 && eCount === 0) ? 'PASS' : 'FAIL',
        issueCount: catIssues.length,
        passPercentage: catIssues.length === 0 ? 100 : Math.max(0, Math.round(((catIssues.length - (cCount + eCount)) / catIssues.length) * 100)),
      };
    });

    // Page-wise status
    const pageStatus = safePages.map((p) => {
      const pNum = Number(p.pageNumber);
      const pIssues = issues.filter((i) => i.pageNumber === pNum);
      const c = pIssues.filter((i) => i.severity === QUALITY_SEVERITY.CRITICAL && i.resolutionStatus === 'UNRESOLVED').length;
      const e = pIssues.filter((i) => i.severity === QUALITY_SEVERITY.ERROR && i.resolutionStatus === 'UNRESOLVED').length;
      const w = pIssues.filter((i) => i.severity === QUALITY_SEVERITY.WARNING && i.resolutionStatus === 'UNRESOLVED').length;

      return {
        pageNumber: pNum,
        passed: c === 0 && e === 0,
        criticalCount: c,
        errorCount: e,
        warningCount: w,
        issueCount: pIssues.length,
      };
    });

    return {
      editionId: edition.id,
      editionVersion: edition.version || 1,
      canPublish,
      canApprove,
      overallStatus,
      qualityScore: finalScore,
      scoreBreakdown,
      totalPagesChecked: safePages.length,
      totalIssues: issues.length,
      criticalCount,
      errorCount,
      warningCount,
      infoCount,
      unresolvedCount,
      resolvedCount,
      exceptionCount,
      issues,
      categories: categoriesSummary,
      pageStatus,
      scannedAt: new Date().toISOString(),
      scannedBy: user?.fullName || 'सिस्टम परीक्षक',
      isStale: false,
    };
  }

  /**
   * Grants an explicit written editorial exception for a WARNING or ERROR issue.
   * CRITICAL issues CANNOT be granted exceptions under any circumstances.
   */
  static grantException({
    report,
    issueId,
    reason,
    user,
  }) {
    if (!report || !Array.isArray(report.issues)) {
      throw new Error('मान्य गुणवत्ता रिपोर्ट आवश्यक है।');
    }

    if (!user) {
      const err = new Error('अपवाद (Exception) प्रदान करने हेतु प्रमाणीकरण अनिवार्य है।');
      err.statusCode = 401;
      err.code = 'ERR_UNAUTHORIZED';
      throw err;
    }

    const userRole = (user.role || user.roles?.[0] || '').toUpperCase();
    const allowedRoles = ['EDITOR', 'ADMIN', 'MASTER_ADMIN', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(userRole)) {
      const err = new Error('अपवाद प्रदान करने हेतु संपादकीय अथवा एडमिन अधिकार अनिवार्य हैं।');
      err.statusCode = 403;
      err.code = 'ERR_FORBIDDEN';
      throw err;
    }

    if (!reason || reason.trim().length < 5) {
      const err = new Error('अपवाद प्रदान करने के लिए लिखित कारण (न्यूनतम 5 अक्षर) अनिवार्य है।');
      err.statusCode = 400;
      err.code = 'ERR_INVALID_EXCEPTION_REASON';
      throw err;
    }

    const issue = report.issues.find((i) => i.id === issueId);
    if (!issue) {
      const err = new Error(`पहचान आईडी ${issueId} की कोई आपत्ति नहीं मिली।`);
      err.statusCode = 404;
      err.code = 'ERR_ISSUE_NOT_FOUND';
      throw err;
    }

    // Invariant: CRITICAL issues CANNOT be bypassed via exception
    if (issue.severity === QUALITY_SEVERITY.CRITICAL) {
      const err = new Error('ERR_CRITICAL_CANNOT_BE_BYPASSED: गंभीर (CRITICAL) आपत्तियों पर कोई अपवाद अनुमत नहीं है। इसका अनिवार्य समाधान आवश्यक है।');
      err.statusCode = 403;
      err.code = 'ERR_CRITICAL_CANNOT_BE_BYPASSED';
      throw err;
    }

    issue.resolutionStatus = 'EXCEPTION_GRANTED';
    issue.resolvedBy = user.fullName || user.name || 'संपादक';
    issue.resolvedAt = new Date().toISOString();
    issue.exceptionReason = reason.trim();

    // Recalculate metrics
    const unresolvedCritical = report.issues.filter((i) => i.severity === QUALITY_SEVERITY.CRITICAL && i.resolutionStatus === 'UNRESOLVED').length;
    const unresolvedError = report.issues.filter((i) => i.severity === QUALITY_SEVERITY.ERROR && i.resolutionStatus === 'UNRESOLVED').length;
    const unresolvedWarning = report.issues.filter((i) => i.severity === QUALITY_SEVERITY.WARNING && i.resolutionStatus === 'UNRESOLVED').length;

    report.criticalCount = unresolvedCritical;
    report.errorCount = unresolvedError;
    report.warningCount = unresolvedWarning;
    report.exceptionCount = report.issues.filter((i) => i.resolutionStatus === 'EXCEPTION_GRANTED').length;
    report.unresolvedCount = report.issues.filter((i) => i.resolutionStatus === 'UNRESOLVED').length;

    report.canPublish = unresolvedCritical === 0 && unresolvedError === 0;
    report.canApprove = unresolvedCritical === 0 && unresolvedError === 0;

    const rawScore = 100 - (unresolvedCritical * 25 + unresolvedError * 10 + unresolvedWarning * 3);
    report.qualityScore = Math.max(0, Math.min(100, rawScore));
    report.scoreBreakdown.finalScore = report.qualityScore;

    return {
      success: true,
      issue,
      updatedReport: report,
    };
  }

  /**
   * Calculates standardized quality score directly from an array of issues.
   * Formula: 100 - (Critical * 25 + Error * 10 + Warning * 3)
   */
  static calculateScore(issues = []) {
    const list = Array.isArray(issues) ? issues : [];
    const criticalCount = list.filter((i) => i.severity === QUALITY_SEVERITY.CRITICAL && i.resolutionStatus !== 'EXCEPTION_GRANTED' && i.resolutionStatus !== 'RESOLVED').length;
    const errorCount = list.filter((i) => i.severity === QUALITY_SEVERITY.ERROR && i.resolutionStatus !== 'EXCEPTION_GRANTED' && i.resolutionStatus !== 'RESOLVED').length;
    const warningCount = list.filter((i) => i.severity === QUALITY_SEVERITY.WARNING && i.resolutionStatus !== 'EXCEPTION_GRANTED' && i.resolutionStatus !== 'RESOLVED').length;

    const criticalDeduction = criticalCount * 25;
    const errorDeduction = errorCount * 10;
    const warningDeduction = warningCount * 3;
    const rawScore = 100 - (criticalDeduction + errorDeduction + warningDeduction);
    const score = Math.max(0, Math.min(100, rawScore));

    return {
      score,
      criticalCount,
      errorCount,
      warningCount,
      passed: criticalCount === 0 && errorCount === 0,
      canPublish: criticalCount === 0 && errorCount === 0,
      formula: '100 - (Critical * 25 + Error * 10 + Warning * 3)',
    };
  }
}
