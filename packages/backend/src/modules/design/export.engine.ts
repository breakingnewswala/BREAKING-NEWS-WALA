/**
 * BREAKING NEWS WALA — Design Export & Vector Rendering Engine
 * Grounded in docs/16-Storage.md (Section 4) and docs/DECISIONS.md (DEC-059, DEC-060)
 */

import {
  DesignDocument,
  DesignElement,
  TextDesignElement,
  ImageDesignElement,
  ShapeDesignElement,
  BadgeDesignElement,
  LogoDesignElement,
  ExportDesignResult,
} from '@bnw/types';
import { CANONICAL_BRAND_ASSET } from './constants';
import { randomUUID } from 'crypto';

export class ExportEngine {
  /**
   * Sanitizes input strings to prevent SVG script injection attacks.
   */
  private static sanitizeText(raw: string): string {
    if (!raw) return '';
    return raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Generates a standards-compliant SVG document from a DesignDocument.
   */
  public static renderToSvg(doc: DesignDocument, scaleFactor = 1): string {
    const width = doc.dimensions.width * scaleFactor;
    const height = doc.dimensions.height * scaleFactor;

    // Background rendering
    let backgroundSvg = '';
    if (doc.background.type === 'color') {
      backgroundSvg = `<rect width="${width}" height="${height}" fill="${this.sanitizeText(doc.background.value)}" opacity="${doc.background.opacity ?? 1}" />`;
    } else if (doc.background.type === 'gradient') {
      backgroundSvg = `
        <defs>
          <linearGradient id="bg_gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#111827" />
            <stop offset="100%" stop-color="#1F2937" />
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#bg_gradient)" opacity="${doc.background.opacity ?? 1}" />`;
    } else if (doc.background.type === 'image') {
      backgroundSvg = `<image href="${this.sanitizeText(doc.background.value)}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" opacity="${doc.background.opacity ?? 1}" />`;
    }

    // Sort elements by zIndex
    const sortedElements = [...doc.elements]
      .filter((el) => el.isVisible)
      .sort((a, b) => a.zIndex - b.zIndex);

    const renderedElements = sortedElements
      .map((el) => this.renderElementToSvg(el, scaleFactor))
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700;800&amp;family=Rozha+One&amp;family=Inter:wght@400;600;700&amp;display=swap');
    text {
      font-family: 'Rozha One', 'Noto Sans Devanagari', 'Inter', serif, sans-serif;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
    }
  </style>
  <!-- Background -->
  ${backgroundSvg}

  <!-- Canvas Elements -->
  ${renderedElements}
</svg>`;
  }

  /**
   * Renders an individual design element to SVG syntax.
   */
  private static renderElementToSvg(el: DesignElement, scale: number): string {
    const x = el.x * scale;
    const y = el.y * scale;
    const width = el.width * scale;
    const height = el.height * scale;
    const opacity = el.opacity ?? 1;
    const rotationTransform = el.rotation ? `transform="rotate(${el.rotation} ${x + width / 2} ${y + height / 2})"` : '';

    switch (el.type) {
      case 'text': {
        const textEl = el as TextDesignElement;
        const fontSize = (textEl.fontSize || 32) * scale;
        const color = this.sanitizeText(textEl.color || '#FFFFFF');
        const fontFamily = this.sanitizeText(textEl.fontFamily || 'Rozha One, Noto Sans Devanagari');
        const fontWeight = textEl.fontWeight || 700;
        const textAlign = textEl.textAlign || 'left';
        const anchor = textAlign === 'center' ? 'middle' : textAlign === 'right' ? 'end' : 'start';
        const textX = textAlign === 'center' ? x + width / 2 : textAlign === 'right' ? x + width : x;

        // Background highlight if present
        let highlight = '';
        if (textEl.backgroundColor) {
          highlight = `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${this.sanitizeText(textEl.backgroundColor)}" rx="4" />`;
        }

        return `
          <g opacity="${opacity}" ${rotationTransform}>
            ${highlight}
            <text x="${textX}" y="${y + fontSize}" font-size="${fontSize}px" font-family="${fontFamily}" font-weight="${fontWeight}" fill="${color}" text-anchor="${anchor}">
              ${this.sanitizeText(textEl.text)}
            </text>
          </g>`;
      }

      case 'image': {
        const imgEl = el as ImageDesignElement;
        return `
          <g opacity="${opacity}" ${rotationTransform}>
            <image href="${this.sanitizeText(imgEl.imageUrl)}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" />
          </g>`;
      }

      case 'shape': {
        const shapeEl = el as ShapeDesignElement;
        const fill = this.sanitizeText(shapeEl.fillColor || '#ED1727');
        const stroke = shapeEl.strokeColor ? `stroke="${this.sanitizeText(shapeEl.strokeColor)}" stroke-width="${(shapeEl.strokeWidth || 1) * scale}"` : '';

        if (shapeEl.shapeKind === 'circle') {
          const r = Math.min(width, height) / 2;
          return `<circle cx="${x + r}" cy="${y + r}" r="${r}" fill="${fill}" ${stroke} opacity="${opacity}" ${rotationTransform} />`;
        } else if (shapeEl.shapeKind === 'rounded_rectangle') {
          const rx = (shapeEl.borderRadius || 12) * scale;
          return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${rx}" fill="${fill}" ${stroke} opacity="${opacity}" ${rotationTransform} />`;
        } else if (shapeEl.shapeKind === 'line' || shapeEl.shapeKind === 'divider') {
          return `<line x1="${x}" y1="${y}" x2="${x + width}" y2="${y}" stroke="${fill}" stroke-width="${(shapeEl.strokeWidth || 2) * scale}" opacity="${opacity}" ${rotationTransform} />`;
        }

        // Standard rectangle
        return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" ${stroke} opacity="${opacity}" ${rotationTransform} />`;
      }

      case 'badge': {
        const badgeEl = el as BadgeDesignElement;
        const primary = this.sanitizeText(badgeEl.primaryColor || '#ED1727');
        const textColor = this.sanitizeText(badgeEl.textColor || '#FFFFFF');
        const fontSize = Math.max(12, Math.round(height * 0.45));

        return `
          <g opacity="${opacity}" ${rotationTransform}>
            <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="6" fill="${primary}" />
            <text x="${x + width / 2}" y="${y + height * 0.68}" font-size="${fontSize}px" font-weight="800" fill="${textColor}" text-anchor="middle">
              ${this.sanitizeText(badgeEl.text)}
            </text>
          </g>`;
      }

      case 'logo': {
        const logoEl = el as LogoDesignElement;
        const logoUrl = this.sanitizeText(logoEl.imageUrl || CANONICAL_BRAND_ASSET.logoUrl);
        return `
          <g opacity="${opacity}" ${rotationTransform}>
            <image href="${logoUrl}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" />
          </g>`;
      }

      default:
        return '';
    }
  }

  /**
   * Simulates/produces high-resolution export metadata and data URI.
   */
  public static async exportDesign(
    doc: DesignDocument,
    format: 'png' | 'jpeg' | 'webp' | 'svg',
    scaleFactor: 1 | 2 | 3 = 1,
    quality = 0.92
  ): Promise<ExportDesignResult> {
    const exportId = `exp_${randomUUID()}`;
    const scaledWidth = doc.dimensions.width * scaleFactor;
    const scaledHeight = doc.dimensions.height * scaleFactor;

    // Generate SVG payload
    const svgContent = this.renderToSvg(doc, scaleFactor);
    const base64Svg = Buffer.from(svgContent, 'utf-8').toString('base64');
    const dataUrl = `data:image/svg+xml;base64,${base64Svg}`;

    // Compute approximate file size
    const estimatedSizeBytes = Math.round(
      format === 'svg'
        ? svgContent.length
        : scaledWidth * scaledHeight * (format === 'png' ? 4 : format === 'jpeg' ? 1.2 * quality : 0.8 * quality) * 0.35
    );

    return {
      exportId,
      format,
      width: scaledWidth,
      height: scaledHeight,
      fileSizeBytes: estimatedSizeBytes,
      dataUrl: format === 'svg' ? dataUrl : undefined,
      downloadUrl: `/api/v1/design/exports/${exportId}/download?format=${format}`,
      createdAt: new Date().toISOString(),
    };
  }
}

