/**
 * BREAKING NEWS WALA — Design Document Manipulation & Validation Engine
 * Grounded in docs/07-Design.md and docs/DECISIONS.md (DEC-057, DEC-060)
 */

import {
  DesignDocument,
  DesignElement,
  GroupDesignElement,
  TextDesignElement,
  LogoDesignElement,
} from '@bnw/types';
import { STUDIO_LIMITS, STATUTORY_EMBLEM_WARNING } from './constants';
import { randomUUID } from 'crypto';

export class DesignEngine {
  /**
   * Validates a complete DesignDocument against invariants.
   */
  public static validateDesignDocument(doc: DesignDocument): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!doc.id || typeof doc.id !== 'string') {
      errors.push('Design ID is required and must be a valid string.');
    }
    if (!doc.title || doc.title.trim().length === 0) {
      errors.push('Design title cannot be empty.');
    }
    if (!doc.dimensions || doc.dimensions.width <= 0 || doc.dimensions.height <= 0) {
      errors.push('Design dimensions must have positive width and height.');
    }
    if (doc.dimensions && (doc.dimensions.width > STUDIO_LIMITS.MAX_CANVAS_WIDTH || doc.dimensions.height > STUDIO_LIMITS.MAX_CANVAS_HEIGHT)) {
      errors.push(`Canvas dimensions cannot exceed ${STUDIO_LIMITS.MAX_CANVAS_WIDTH}x${STUDIO_LIMITS.MAX_CANVAS_HEIGHT}px.`);
    }
    if (!doc.elements || !Array.isArray(doc.elements)) {
      errors.push('Design elements must be an array.');
    } else if (doc.elements.length > STUDIO_LIMITS.MAX_ELEMENTS_PER_CANVAS) {
      errors.push(`Design elements count cannot exceed ${STUDIO_LIMITS.MAX_ELEMENTS_PER_CANVAS}.`);
    }

    // Check individual elements
    const elementIds = new Set<string>();
    for (const el of doc.elements || []) {
      if (!el.id) {
        errors.push('Each design element must have a unique ID.');
      } else if (elementIds.has(el.id)) {
        errors.push(`Duplicate element ID detected: ${el.id}`);
      } else {
        elementIds.add(el.id);
      }

      if (el.type === 'text') {
        const textEl = el as TextDesignElement;
        if (textEl.text && textEl.text.length > STUDIO_LIMITS.MAX_TEXT_LENGTH) {
          errors.push(`Text element "${el.name}" exceeds maximum allowed length of ${STUDIO_LIMITS.MAX_TEXT_LENGTH} characters.`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Adds an element to the canvas and assigns appropriate z-index.
   */
  public static addElement(doc: DesignDocument, element: DesignElement): DesignDocument {
    const nextZIndex = doc.elements.reduce((max, el) => Math.max(max, el.zIndex || 0), 0) + 1;
    const newElement: DesignElement = {
      ...element,
      id: element.id || randomUUID(),
      zIndex: element.zIndex !== undefined && element.zIndex > 0 ? element.zIndex : nextZIndex,
    };

    return {
      ...doc,
      elements: [...doc.elements, newElement],
      version: doc.version + 1,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Updates an existing element by ID.
   */
  public static updateElement(
    doc: DesignDocument,
    elementId: string,
    updates: Partial<DesignElement>
  ): DesignDocument {
    let elementFound = false;
    const updatedElements = doc.elements.map((el) => {
      if (el.id === elementId) {
        elementFound = true;
        // If locked, prevent position/dimension alterations unless unlocking
        if (el.isLocked && updates.isLocked === undefined) {
          return el;
        }
        return {
          ...el,
          ...updates,
          id: el.id, // ID is immutable
          type: el.type, // Type is immutable
        } as DesignElement;
      }
      return el;
    });

    if (!elementFound) {
      throw new Error(`Element with ID "${elementId}" not found in design document.`);
    }

    return {
      ...doc,
      elements: updatedElements,
      version: doc.version + 1,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Removes an element from the canvas.
   */
  public static removeElement(doc: DesignDocument, elementId: string): DesignDocument {
    const updatedElements = doc.elements.filter((el) => el.id !== elementId);
    return {
      ...doc,
      elements: updatedElements,
      version: doc.version + 1,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Duplicates an element with an offset.
   */
  public static duplicateElement(
    doc: DesignDocument,
    elementId: string
  ): { doc: DesignDocument; newElement: DesignElement } {
    const target = doc.elements.find((el) => el.id === elementId);
    if (!target) {
      throw new Error(`Element with ID "${elementId}" not found for duplication.`);
    }

    const nextZIndex = doc.elements.reduce((max, el) => Math.max(max, el.zIndex || 0), 0) + 1;
    const newElement: DesignElement = {
      ...JSON.parse(JSON.stringify(target)),
      id: randomUUID(),
      name: `${target.name} (कॉपी)`,
      x: target.x + 20,
      y: target.y + 20,
      zIndex: nextZIndex,
      isLocked: false,
    };

    const updatedDoc: DesignDocument = {
      ...doc,
      elements: [...doc.elements, newElement],
      version: doc.version + 1,
      updatedAt: new Date().toISOString(),
    };

    return { doc: updatedDoc, newElement };
  }

  /**
   * Adjusts layer order (z-index) of an element.
   */
  public static reorderElement(
    doc: DesignDocument,
    elementId: string,
    action: 'front' | 'back' | 'forward' | 'backward'
  ): DesignDocument {
    const target = doc.elements.find((el) => el.id === elementId);
    if (!target) {
      throw new Error(`Element with ID "${elementId}" not found for reordering.`);
    }

    // Sort elements by zIndex
    const sorted = [...doc.elements].sort((a, b) => a.zIndex - b.zIndex);
    const currentIndex = sorted.findIndex((el) => el.id === elementId);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    if (action === 'front' && last) {
      target.zIndex = last.zIndex + 1;
    } else if (action === 'back' && first) {
      target.zIndex = Math.max(0, first.zIndex - 1);
    } else if (action === 'forward' && currentIndex < sorted.length - 1) {
      const nextEl = sorted[currentIndex + 1];
      if (nextEl) {
        const tempZ = target.zIndex;
        target.zIndex = nextEl.zIndex;
        nextEl.zIndex = tempZ;
      }
    } else if (action === 'backward' && currentIndex > 0) {
      const prevEl = sorted[currentIndex - 1];
      if (prevEl) {
        const tempZ = target.zIndex;
        target.zIndex = prevEl.zIndex;
        prevEl.zIndex = tempZ;
      }
    }

    // Normalize z-indexes to 1..N
    const reindexed = sorted
      .sort((a, b) => a.zIndex - b.zIndex)
      .map((el, idx) => ({ ...el, zIndex: idx + 1 }));

    return {
      ...doc,
      elements: reindexed,
      version: doc.version + 1,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Aligns an element relative to the canvas.
   */
  public static alignElement(
    doc: DesignDocument,
    elementId: string,
    alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
  ): DesignDocument {
    const target = doc.elements.find((el) => el.id === elementId);
    if (!target) {
      throw new Error(`Element with ID "${elementId}" not found for alignment.`);
    }

    let newX = target.x;
    let newY = target.y;

    switch (alignment) {
      case 'left':
        newX = 0;
        break;
      case 'center':
        newX = Math.round((doc.dimensions.width - target.width) / 2);
        break;
      case 'right':
        newX = doc.dimensions.width - target.width;
        break;
      case 'top':
        newY = 0;
        break;
      case 'middle':
        newY = Math.round((doc.dimensions.height - target.height) / 2);
        break;
      case 'bottom':
        newY = doc.dimensions.height - target.height;
        break;
    }

    return this.updateElement(doc, elementId, { x: newX, y: newY });
  }

  /**
   * Groups multiple elements into a logical group.
   */
  public static groupElements(
    doc: DesignDocument,
    elementIds: string[]
  ): { doc: DesignDocument; groupElement: GroupDesignElement } {
    if (elementIds.length < 2) {
      throw new Error('At least two elements are required to create a group.');
    }

    const groupItems = doc.elements.filter((el) => elementIds.includes(el.id));
    if (groupItems.length !== elementIds.length) {
      throw new Error('One or more element IDs for grouping were not found.');
    }

    // Compute bounding box for group
    const minX = Math.min(...groupItems.map((el) => el.x));
    const minY = Math.min(...groupItems.map((el) => el.y));
    const maxX = Math.max(...groupItems.map((el) => el.x + el.width));
    const maxY = Math.max(...groupItems.map((el) => el.y + el.height));

    const groupId = randomUUID();
    const groupElement: GroupDesignElement = {
      id: groupId,
      type: 'group',
      name: `समूह (${groupItems.length} तत्व)`,
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      rotation: 0,
      opacity: 1,
      zIndex: Math.max(...groupItems.map((el) => el.zIndex)) + 1,
      isLocked: false,
      isVisible: true,
      childElementIds: elementIds,
    };

    // Update child elements with groupId
    const updatedElements = doc.elements.map((el) => {
      if (elementIds.includes(el.id)) {
        return { ...el, groupId };
      }
      return el;
    });

    return {
      doc: {
        ...doc,
        elements: [...updatedElements, groupElement],
        version: doc.version + 1,
        updatedAt: new Date().toISOString(),
      },
      groupElement,
    };
  }

  /**
   * Ungroups a group element.
   */
  public static ungroupElements(doc: DesignDocument, groupId: string): DesignDocument {
    const groupElement = doc.elements.find((el) => el.id === groupId && el.type === 'group') as
      | GroupDesignElement
      | undefined;
    if (!groupElement) {
      throw new Error(`Group with ID "${groupId}" not found.`);
    }

    const updatedElements = doc.elements
      .filter((el) => el.id !== groupId)
      .map((el) => {
        if (el.groupId === groupId) {
          const { groupId: _, ...rest } = el;
          return rest as DesignElement;
        }
        return el;
      });

    return {
      ...doc,
      elements: updatedElements,
      version: doc.version + 1,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Computes dynamic Devanagari font auto-scaling to prevent headline clipping (WF-RGFX-01).
   */
  public static calculateDevanagariAutoFit(
    text: string,
    maxWidth: number,
    maxHeight: number,
    baseFontSize = 48
  ): { fontSize: number; fits: boolean; warning?: string } {
    const words = text.trim().split(/\s+/);
    let warning: string | undefined;

    if (words.length > STUDIO_LIMITS.MAX_HEADLINE_WORDS) {
      warning = `शीर्षक बहुत लंबा है (${words.length} शब्द)। अधिकतम अनुशंसित सीमा ${STUDIO_LIMITS.MAX_HEADLINE_WORDS} शब्द है।`;
    }

    // Average Devanagari character aspect ratio is ~0.55 width/height with upper/lower matras
    const approxCharWidthRatio = 0.55;
    const lineHeightRatio = 1.4;

    let fontSize = baseFontSize;
    const minFontSize = 18;

    while (fontSize >= minFontSize) {
      const charWidth = fontSize * approxCharWidthRatio;
      const charsPerLine = Math.max(1, Math.floor(maxWidth / charWidth));
      const estimatedLines = Math.ceil(text.length / charsPerLine);
      const estimatedTotalHeight = estimatedLines * (fontSize * lineHeightRatio);

      if (estimatedTotalHeight <= maxHeight) {
        return {
          fontSize,
          fits: true,
          warning,
        };
      }

      fontSize -= 2;
    }

    return {
      fontSize: minFontSize,
      fits: false,
      warning: warning || 'पाठ निर्धारित बॉक्स सीमा से अधिक बड़ा है। कृपया पाठ छोटा करें।',
    };
  }

  /**
   * Enforces brand integrity rules (DEC-060, State Emblem of India Act 2005).
   */
  public static validateBrandIntegrity(doc: DesignDocument): { isCompliant: boolean; violations: string[] } {
    const violations: string[] = [];

    // 1. Check for official logo presence and proportion lock
    const logoElements = doc.elements.filter((el) => el.type === 'logo') as LogoDesignElement[];
    if (logoElements.length > 0) {
      for (const logo of logoElements) {
        if (!logo.keepAspectRatio) {
          violations.push('लोगो का आकार विकृत नहीं किया जा सकता (अनुपात सुरक्षित होना अनिवार्य है - DEC-060)।');
        }
      }
    }

    // 2. State Emblem of India Act 2005 prohibition check
    const serialized = JSON.stringify(doc).toLowerCase();
    if (
      serialized.includes('ashoka lion') ||
      serialized.includes('state emblem') ||
      serialized.includes('mp government seal') ||
      serialized.includes('शासकीय मुहर')
    ) {
      violations.push(STATUTORY_EMBLEM_WARNING);
    }

    return {
      isCompliant: violations.length === 0,
      violations,
    };
  }
}
