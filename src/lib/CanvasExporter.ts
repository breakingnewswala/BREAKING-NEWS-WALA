import { NewsCardData } from '../types';
import { getActiveFooterPng } from './footerUtils';
import {
  drawOriginalHeader,
  drawBreakingRedHeader,
  drawInvestigationHeader,
  drawQuoteHeader,
} from './HeaderDesigns';

/**
 * High-resolution canvas renderer for News Graphic Cards (1080x1350 4:5 or 1080x1080 1:1)
 */
export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Fallback placeholder image if URL fails
      const fallback = new Image();
      fallback.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" fill="%231e293b"><rect width="800" height="600"/></svg>';
      fallback.onload = () => resolve(fallback);
      fallback.onerror = (e) => reject(e);
    };
    img.src = src;
  });
};

// Professional Breaking News Curved Red Pointer Arrow SVG
const DEFAULT_3D_ARROW_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="arrowBodyRed" x1="10%" y1="90%" x2="80%" y2="20%">
      <stop offset="0%" stop-color="#C00000" />
      <stop offset="45%" stop-color="#E50914" />
      <stop offset="100%" stop-color="#FF1E26" />
    </linearGradient>
    <linearGradient id="arrowSpineGloss" x1="10%" y1="90%" x2="60%" y2="30%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.1" />
      <stop offset="40%" stop-color="#FFFFFF" stop-opacity="0.85" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.95" />
    </linearGradient>
  </defs>
  <!-- 1. Heavy Black Base Silhouette -->
  <path d="M 320 60 L 196 106 L 236 110 Q 120 160 70 310 L 104 344 Q 170 220 270 144 L 274 184 Z" fill="#000000" stroke="#000000" stroke-width="22" stroke-linejoin="round" stroke-linecap="round" />
  <!-- 2. Bold White Border (Sticker effect) -->
  <path d="M 320 60 L 196 106 L 236 110 Q 120 160 70 310 L 104 344 Q 170 220 270 144 L 274 184 Z" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="12" stroke-linejoin="round" stroke-linecap="round" />
  <!-- 3. Vibrant Red Body -->
  <path d="M 320 60 L 196 106 L 236 110 Q 120 160 70 310 L 104 344 Q 170 220 270 144 L 274 184 Z" fill="url(#arrowBodyRed)" stroke="#990000" stroke-width="3" stroke-linejoin="round" />
  <!-- 4. Glossy Highlight along Curved Spine -->
  <path d="M 85 300 Q 128 170 230 118" stroke="url(#arrowSpineGloss)" stroke-width="6" stroke-linecap="round" fill="none" />
  <!-- 5. Central Ridge Highlight on Arrowhead -->
  <line x1="240" y1="125" x2="312" y2="66" stroke="rgba(255, 255, 255, 0.85)" stroke-width="4" stroke-linecap="round" />
  <!-- 6. Wing Accent -->
  <line x1="202" y1="108" x2="236" y2="110" stroke="rgba(255, 255, 255, 0.6)" stroke-width="2.5" stroke-linecap="round" />
</svg>`)}`;

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (typeof (ctx as any).roundRect === 'function') {
    ctx.beginPath();
    (ctx as any).roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

export async function renderCardToCanvas(card: NewsCardData): Promise<HTMLCanvasElement> {
  // Ensure Baloo 2 font is loaded in browser environment before drawing
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.load('800 48px "Baloo 2"');
      await document.fonts.load('700 24px "Baloo 2"');
    } catch (e) {
      // Continue if browser does not support font loading API
    }
  }

  const canvas = document.createElement('canvas');
  const width = 1080;
  let height = 1350; // 4:5 Instagram Portrait by default
  if (card.aspectRatio === '1:1') height = 1080;
  if (card.aspectRatio === '9:16') height = 1920;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D canvas context');

  // Background fallback
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, width, height);

  const footerBarHeight = 78;
  const isSuperBreaking = card.frameDesign === 'jacket-breaking-red';

  // 0. Pre-calculate Headline Lines in Baloo 2 font early so we know the exact top of the white box
  const maxHeadlineWidth = width - 96; // 48px padding on each side
  const scaleRatio = 2.15; // Maps ~30px editor font to ~65px canvas, matching the visual preview ratio
  let targetFontSize = Math.round((card.headlineFontSize || 30) * scaleRatio);
  targetFontSize = Math.max(54, Math.min(80, targetFontSize));

  ctx.save();
  const rawHeadline = card.formattedHeadline || card.headline || '';
  const manualLines = rawHeadline.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (manualLines.length >= 2) {
    for (let s = targetFontSize; s >= 46; s -= 2) {
      ctx.font = `800 ${s}px "Baloo 2", "Noto Sans Devanagari", sans-serif`;
      const allFit = manualLines.every((m) => {
        const cleanText = m.replace(/\[yellow\]/g, '').replace(/\[\/yellow\]/g, '');
        return ctx.measureText(cleanText).width <= maxHeadlineWidth;
      });
      if (allFit) {
        targetFontSize = s;
        break;
      }
    }
  }
  ctx.restore();

  const isQuote = card.frameDesign === 'jacket-quote';

  const headlineFontSize = targetFontSize;
  const headlineLineHeight = Math.round(headlineFontSize * 1.34);
  const headlineLines = getHeadlineLines(
    ctx,
    card.formattedHeadline || card.headline,
    card.highlightWords,
    maxHeadlineWidth,
    headlineFontSize
  );
  const totalHeadlineHeight = headlineLines.length * headlineLineHeight;

  // Standard headline positions
  const headlineBottomY = height - footerBarHeight - 22;
  const headlineStartY = headlineBottomY - totalHeadlineHeight;

  // For Super Breaking:
  // Dynamically calculate white box height based on headline lines so text NEVER touches footer!
  const ribbonW = Math.round(width * 0.70);
  const ribbonH = Math.round(ribbonW * (150 / 960));
  const ribbonHangInsideWhiteBox = Math.round(ribbonH * 0.5);
  const gapBelowRibbon = 24;
  const bottomPaddingAboveFooter = 36;
  const superBreakingWhiteBoxH = ribbonHangInsideWhiteBox + gapBelowRibbon + totalHeadlineHeight + bottomPaddingAboveFooter;
  const whiteBoxH = Math.max(280, superBreakingWhiteBoxH);
  const whiteBoxY = height - footerBarHeight - whiteBoxH;

  // Ribbon is positioned exactly half on photo, half on white box:
  const superBreakingRibbonY = whiteBoxY - Math.round(ribbonH * 0.5);
  const superBreakingHeadlineTextY = whiteBoxY + ribbonHangInsideWhiteBox + gapBelowRibbon;

  // Photo bottom boundaries:
  // 1. Super Breaking: stops at top of white box (whiteBoxY)
  // 2. Quote (बयान): strictly restricted to top 50% of card, leaving lower half solid black for quote & speaker
  // 3. Default Breaking News Wala & standard: stops below the middle line of the 3-line text, never touching the footer!
  const photoBottomY = isSuperBreaking
    ? whiteBoxY
    : isQuote
    ? Math.round(height * 0.50)
    : Math.round(headlineStartY + headlineLineHeight * 1.35);

  // 1. Draw Images according to layouts with custom crop (X/Y) & zoom
  try {
    const mainImg = await loadImage(card.images.main);

    // Read crop settings (defaults to Center: X=50%, Y=50%, Zoom=1)
    const mainCrop = card.imagePositions?.main || { x: 50, y: 50, zoom: 1 };
    const secondCrop = card.imagePositions?.second || { x: 50, y: 50, zoom: 1 };
    const thirdCrop = card.imagePositions?.third || { x: 50, y: 50, zoom: 1 };
    const fourthCrop = card.imagePositions?.fourth || { x: 50, y: 50, zoom: 1 };

    const mCropX = (mainCrop.x ?? 50) / 100;
    const mCropY = (mainCrop.y ?? 50) / 100;
    const mZoom = Math.max(1, mainCrop.zoom || 1);

    const sCropX = (secondCrop.x ?? 50) / 100;
    const sCropY = (secondCrop.y ?? 50) / 100;
    const sZoom = Math.max(1, secondCrop.zoom || 1);

    const tCropX = (thirdCrop.x ?? 50) / 100;
    const tCropY = (thirdCrop.y ?? 50) / 100;
    const tZoom = Math.max(1, thirdCrop.zoom || 1);

    const foCropX = (fourthCrop.x ?? 50) / 100;
    const foCropY = (fourthCrop.y ?? 50) / 100;
    const foZoom = Math.max(1, fourthCrop.zoom || 1);

    if (isQuote) {
      // Quote (बयान) Jacket: Strictly single image restricted to top 50%
      drawImageCover(ctx, mainImg, 0, 0, width, photoBottomY, mCropX, mCropY, mZoom);
    } else if (card.layout === 'full' && !isSuperBreaking) {
      // Full bleed edge-to-edge image across entire card
      drawImageCover(ctx, mainImg, 0, 0, width, height, mCropX, mCropY, mZoom);
    } else if (
      card.layout === 'single' ||
      !card.layout ||
      card.layout === 'inset-circle' ||
      (card.layout === 'full' && isSuperBreaking)
    ) {
      // Single Image / Constrained photo: stops at photoBottomY
      drawImageCover(ctx, mainImg, 0, 0, width, photoBottomY, mCropX, mCropY, mZoom);
    } else if (card.layout === 'split-v') {
      // 2 images: 35% Top, 65% Bottom (35-65 ratio as requested)
      const topH = photoBottomY * 0.35;
      const bottomH = photoBottomY * 0.65;
      drawImageCover(ctx, mainImg, 0, 0, width, topH - 2, mCropX, mCropY, mZoom);

      // Clean white divider line
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, topH - 2, width, 4);

      if (card.images.second) {
        const secondImg = await loadImage(card.images.second);
        drawImageCover(ctx, secondImg, 0, topH + 2, width, bottomH - 2, sCropX, sCropY, sZoom);
      } else {
        drawImageCover(ctx, mainImg, 0, topH + 2, width, bottomH - 2, sCropX, sCropY, sZoom);
      }
    } else if (card.layout === 'double') {
      // 2 images: 50-50 Up & Down (50% आधी ऊपर, 50% आधी नीचे)
      const topH = photoBottomY * 0.50;
      const bottomH = photoBottomY * 0.50;
      drawImageCover(ctx, mainImg, 0, 0, width, topH - 2, mCropX, mCropY, mZoom);

      // Clean white divider line
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, topH - 2, width, 4);

      if (card.images.second) {
        const secondImg = await loadImage(card.images.second);
        drawImageCover(ctx, secondImg, 0, topH + 2, width, bottomH - 2, sCropX, sCropY, sZoom);
      } else {
        drawImageCover(ctx, mainImg, 0, topH + 2, width, bottomH - 2, sCropX, sCropY, sZoom);
      }
    } else if (card.layout === 'double-h' || card.layout === 'split-h') {
      // 2 horizontal columns side by side (लेफ्ट-राइट)
      const halfW = width / 2;
      drawImageCover(ctx, mainImg, 0, 0, halfW - 2, photoBottomY, mCropX, mCropY, mZoom);
      if (card.images.second) {
        const secondImg = await loadImage(card.images.second);
        drawImageCover(ctx, secondImg, halfW + 2, 0, halfW - 2, photoBottomY, sCropX, sCropY, sZoom);
      } else {
        drawImageCover(ctx, mainImg, halfW + 2, 0, halfW - 2, photoBottomY, sCropX, sCropY, sZoom);
      }
    } else if (card.layout === 'grid-3') {
      // 3 images: 2 on top, 1 wide at bottom
      const topH = photoBottomY * 0.52;
      const bottomH = photoBottomY * 0.48;
      const halfW = width / 2;

      // Top Left
      drawImageCover(ctx, mainImg, 0, 0, halfW - 3, topH - 3, mCropX, mCropY, mZoom);

      // Top Right
      if (card.images.second) {
        const secondImg = await loadImage(card.images.second);
        drawImageCover(ctx, secondImg, halfW + 3, 0, halfW - 3, topH - 3, sCropX, sCropY, sZoom);
      } else {
        drawImageCover(ctx, mainImg, halfW + 3, 0, halfW - 3, topH - 3, sCropX, sCropY, sZoom);
      }

      // Bottom Wide
      if (card.images.third) {
        const thirdImg = await loadImage(card.images.third);
        drawImageCover(ctx, thirdImg, 0, topH + 3, width, bottomH - 3, tCropX, tCropY, tZoom);
      } else {
        drawImageCover(ctx, mainImg, 0, topH + 3, width, bottomH - 3, tCropX, tCropY, tZoom);
      }
    } else if (card.layout === 'grid-3-bottom') {
      // 3 images: 1 wide on top, 2 on bottom
      const topH = photoBottomY * 0.48;
      const bottomH = photoBottomY * 0.52;
      const halfW = width / 2;

      // Top Wide
      drawImageCover(ctx, mainImg, 0, 0, width, topH - 3, mCropX, mCropY, mZoom);

      // Bottom Left
      if (card.images.second) {
        const secondImg = await loadImage(card.images.second);
        drawImageCover(ctx, secondImg, 0, topH + 3, halfW - 3, bottomH - 3, sCropX, sCropY, sZoom);
      } else {
        drawImageCover(ctx, mainImg, 0, topH + 3, halfW - 3, bottomH - 3, sCropX, sCropY, sZoom);
      }

      // Bottom Right
      if (card.images.third) {
        const thirdImg = await loadImage(card.images.third);
        drawImageCover(ctx, thirdImg, halfW + 3, topH + 3, halfW - 3, bottomH - 3, tCropX, tCropY, tZoom);
      } else {
        drawImageCover(ctx, mainImg, halfW + 3, topH + 3, halfW - 3, bottomH - 3, tCropX, tCropY, tZoom);
      }
    } else if (card.layout === 'grid-4') {
      // 4 images: 2 on top, 2 on bottom (2x2 Grid)
      const topH = photoBottomY * 0.50;
      const bottomH = photoBottomY * 0.50;
      const halfW = width / 2;

      // Top Left (Main)
      drawImageCover(ctx, mainImg, 0, 0, halfW - 2, topH - 2, mCropX, mCropY, mZoom);

      // Top Right (Second)
      if (card.images.second) {
        const secondImg = await loadImage(card.images.second);
        drawImageCover(ctx, secondImg, halfW + 2, 0, halfW - 2, topH - 2, sCropX, sCropY, sZoom);
      } else {
        drawImageCover(ctx, mainImg, halfW + 2, 0, halfW - 2, topH - 2, sCropX, sCropY, sZoom);
      }

      // Bottom Left (Third)
      if (card.images.third) {
        const thirdImg = await loadImage(card.images.third);
        drawImageCover(ctx, thirdImg, 0, topH + 2, halfW - 2, bottomH - 2, tCropX, tCropY, tZoom);
      } else {
        drawImageCover(ctx, mainImg, 0, topH + 2, halfW - 2, bottomH - 2, tCropX, tCropY, tZoom);
      }

      // Bottom Right (Fourth)
      if (card.images.fourth) {
        const fourthImg = await loadImage(card.images.fourth);
        drawImageCover(ctx, fourthImg, halfW + 2, topH + 2, halfW - 2, bottomH - 2, foCropX, foCropY, foZoom);
      } else if (card.images.second) {
        const secondImg = await loadImage(card.images.second);
        drawImageCover(ctx, secondImg, halfW + 2, topH + 2, halfW - 2, bottomH - 2, sCropX, sCropY, sZoom);
      } else {
        drawImageCover(ctx, mainImg, halfW + 2, topH + 2, halfW - 2, bottomH - 2, mCropX, mCropY, mZoom);
      }

      // White Grid Dividers
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, topH - 2, width, 4); // Horizontal line
      ctx.fillRect(halfW - 2, 0, 4, photoBottomY); // Vertical line
    }

    // Draw Inset Circle if layout is inset-circle (Round Circle Image)
    if (card.layout === 'inset-circle' && card.images.insetCircle) {
      const insetImg = await loadImage(card.images.insetCircle);
      const cx = (card.insetPosition.x / 100) * width;
      const cy = (card.insetPosition.y / 100) * height;
      const radius = width * 0.155; // ~168px radius

      // Inset photo crop & zoom settings
      const icPos = card.imagePositions?.insetCircle;
      const icCropX = (icPos?.x ?? 50) / 100;
      const icCropY = (icPos?.y ?? 50) / 100;
      const icZoom = icPos?.zoom ?? 1.0;

      // Circular shadow background
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = 32;
      ctx.shadowOffsetY = 16;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Circular clipped photo with custom crop & zoom
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 4, 0, Math.PI * 2);
      ctx.clip();
      drawImageCover(ctx, insetImg, cx - radius, cy - radius, radius * 2, radius * 2, icCropX, icCropY, icZoom);
      ctx.restore();

      // White circular stroke border
      ctx.save();
      ctx.lineWidth = 9;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  } catch (imgErr) {
    console.warn('Canvas image load warning:', imgErr);
  }

  // Optional user dark overlay if requested
  if (card.darkOverlayOpacity && card.darkOverlayOpacity > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${card.darkOverlayOpacity})`;
    ctx.fillRect(0, 0, width, height);
  }

  // Exclusive "⚡ सुपर ब्रेकिंग" subtle watermark across photo area (15% opacity)
  if (card.showSuperBreakingWatermark) {
    drawSuperBreakingWatermark(
      ctx,
      width,
      photoBottomY,
      card.breakingWatermarkText || '⚡ सुपर ब्रेकिंग',
      card.breakingWatermarkOpacity ?? 0.15
    );
  }

  // Load custom logo image if provided
  let customLogoImg: HTMLImageElement | undefined;
  if (card.customLogoUrl) {
    try {
      customLogoImg = await loadImage(card.customLogoUrl);
    } catch (logoErr) {
      console.warn('Custom logo load warning:', logoErr);
    }
  }

  // 2. Render Header / Jacket
  if (card.frameDesign === 'jacket-investigation') {
    // Special Investigation Header
    const headH = 64;
    const grad = ctx.createLinearGradient(0, 0, width, 0);
    grad.addColorStop(0, '#0a0a0a');
    grad.addColorStop(0.5, '#171717');
    grad.addColorStop(1, '#451a03');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, headH);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(0, headH - 4, width, 4);

    // Badge: 🔍 विशेष पड़ताल
    ctx.fillStyle = '#F59E0B';
    drawRoundedRect(ctx, 32, 12, 210, 40, 8);
    ctx.fill();
    ctx.font = '900 22px "Baloo 2", sans-serif';
    ctx.fillStyle = '#0a0a0a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔍 विशेष पड़ताल', 48, 32);

    ctx.font = '900 24px "Baloo 2", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(card.investigationCaseNumber || card.brandName || 'INVESTIGATION REPORT', 265, 32);

    ctx.font = '900 18px monospace';
    ctx.fillStyle = '#FBBF24';
    ctx.textAlign = 'right';
    ctx.fillText('EXCLUSIVE', width - 36, 32);
  } else if (card.frameDesign === 'jacket-quote') {
    // Quote / Statement Header
    const headH = 64;
    const grad = ctx.createLinearGradient(0, 0, width, 0);
    grad.addColorStop(0, '#171717');
    grad.addColorStop(0.5, '#0a0a0a');
    grad.addColorStop(1, '#171717');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, headH);
    ctx.fillStyle = '#525252';
    ctx.fillRect(0, headH - 2, width, 2);

    // Badge: ❝ बयान एवं कोटेशन
    ctx.fillStyle = '#FFE600';
    drawRoundedRect(ctx, 32, 12, 230, 40, 8);
    ctx.fill();
    ctx.font = '900 22px "Baloo 2", sans-serif';
    ctx.fillStyle = '#0a0a0a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('❝ बयान एवं कोटेशन', 48, 32);

    ctx.font = '900 24px "Baloo 2", sans-serif';
    ctx.fillStyle = '#E5E5E5';
    ctx.fillText(card.brandName || 'ब्रेकिंग न्यूज़वाला', 285, 32);

    ctx.font = '900 18px serif';
    ctx.fillStyle = '#FFE600';
    ctx.textAlign = 'right';
    ctx.fillText('STATEMENT', width - 36, 32);
  } else if (card.frameDesign === 'custom-png') {
    if (!card.hideDefaultHeaderInCustomFrame) {
      if (card.customHeaderPng) {
        try {
          const headerImg = await loadImage(card.customHeaderPng);
          const headerAspect = headerImg.width / headerImg.height;
          const drawH = width / headerAspect;
          ctx.drawImage(headerImg, 0, 0, width, drawH);
        } catch (err) {
          drawOriginalHeader(ctx, width, card, customLogoImg);
        }
      } else {
        drawOriginalHeader(ctx, width, card, customLogoImg);
      }
    }
  } else if (card.customHeaderPng) {
    try {
      const headerImg = await loadImage(card.customHeaderPng);
      const headerAspect = headerImg.width / headerImg.height;
      const drawH = width / headerAspect;
      ctx.drawImage(headerImg, 0, 0, width, drawH);
    } catch (err) {
      drawOriginalHeader(ctx, width, card, customLogoImg);
    }
  } else if (card.customHeaderPng) {
    try {
      const headerImg = await loadImage(card.customHeaderPng);
      const headerAspect = headerImg.width / headerImg.height;
      const drawH = width / headerAspect;
      ctx.drawImage(headerImg, 0, 0, width, drawH);
    } catch (err) {
      console.warn('Custom header load error:', err);
      drawOriginalHeader(ctx, width, card, customLogoImg);
    }
  } else {
    // Both jacket-original and jacket-breaking-red use the official header!
    drawOriginalHeader(ctx, width, card, customLogoImg);
  }

  // Optional full frame transparent overlay PNG ONLY when custom-png template is selected
  if (card.frameDesign === 'custom-png' && card.customFrameOverlayPng) {
    try {
      const overlayImg = await loadImage(card.customFrameOverlayPng);
      ctx.drawImage(overlayImg, 0, 0, width, height);
    } catch (err) {
      console.warn('Frame overlay load error:', err);
    }
  }

  // 4. Render Bottom Section: Super Breaking vs Quote vs Standard Original
  if (card.frameDesign === 'jacket-breaking-red') {
    // Super Breaking Template: Badges above + Centered BREAKING NEWS ribbon + Solid pure white headline + Yellow footer

    // Solid white background plate
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, whiteBoxY, width, height - footerBarHeight - whiteBoxY);

    // Subtle divider at top of white plate
    ctx.fillStyle = '#E5E7EB';
    ctx.fillRect(0, whiteBoxY, width, 2);

    // Centered, scaled BREAKING NEWS Ribbon with gentle soft shadow touching border
    const ribbonScalePct = 70;
    await drawSuperBreakingRibbon(
      ctx,
      width,
      superBreakingRibbonY,
      card.customBreakingRibbonPng,
      ribbonScalePct
    );

    // Location Badge & Callout Tag floating ABOVE the ribbon
    const badgeY = superBreakingRibbonY - 48 - 14;
    if (card.location) {
      drawLocationBadge(ctx, 48, badgeY, card.location);
    }
    if (card.showCallout) {
      drawCalloutTag(ctx, width - 48, badgeY, card.calloutTag);
    }

    // AI GENERATED Watermark if enabled
    if (card.showAiGenerated) {
      drawAiGeneratedWatermark(ctx, width, height, card.aiGeneratedText || 'AI GENERATED');
    }

    // 2-Line Headline inside the white box with comfortable top breathing space (never touching ribbon)
    const hlColor = card.highlightColor && card.highlightColor !== '#FFE600' ? card.highlightColor : '#DC2626';
    const headlineTextY = superBreakingHeadlineTextY;
    drawRenderedHeadlineLines(
      ctx,
      headlineLines,
      hlColor,
      width,
      headlineTextY,
      headlineFontSize,
      headlineLineHeight,
      card.headlineAlign || 'center',
      48,
      true // isLightBackground = true
    );
  } else if (card.frameDesign === 'jacket-quote') {
    // ==========================================
    // Dedicated Quote (बयान) Template Layout
    // Single image in top 50%, clean solid black lower 50%
    // ==========================================

    // 1. Solid black for the lower 50% area
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, photoBottomY, width, height - photoBottomY);

    // 2. On-photo badges (District is hidden per user instruction)
    // "🔴 पूरी खबर डिस्क्रिप्शन में" placed cleanly on mid-side of photo
    if (card.showCallout) {
      const calloutY = photoBottomY - 52;
      drawCalloutTag(ctx, width - 44, calloutY, card.calloutTag);
    }

    // AI GENERATED Watermark if enabled
    if (card.showAiGenerated) {
      drawAiGeneratedWatermark(ctx, width, Math.round(photoBottomY * 0.5), card.aiGeneratedText || 'AI GENERATED');
    }

    // 3. Center the Quote Block in the lower black space
    const quoteAreaTop = photoBottomY;
    const quoteAreaBottom = height - footerBarHeight;
    const quoteAreaH = quoteAreaBottom - quoteAreaTop;

    const quoteBadgeW = 76;
    const quoteBadgeH = 42;
    const quoteBlockHeight = quoteBadgeH + 20 + totalHeadlineHeight + 20 + quoteBadgeH + 28 + 40;
    const startBlockY = quoteAreaTop + Math.max(20, Math.round((quoteAreaH - quoteBlockHeight) / 2));

    // Top Quote divider line & yellow badge with opening double quotes
    const topQuoteY = startBlockY + Math.round(quoteBadgeH / 2);
    ctx.save();
    ctx.strokeStyle = '#FFE600';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(110, topQuoteY);
    ctx.lineTo(width / 2 - quoteBadgeW / 2 - 12, topQuoteY);
    ctx.moveTo(width / 2 + quoteBadgeW / 2 + 12, topQuoteY);
    ctx.lineTo(width - 110, topQuoteY);
    ctx.stroke();

    ctx.fillStyle = '#FFE600';
    ctx.beginPath();
    ctx.roundRect(width / 2 - quoteBadgeW / 2, topQuoteY - quoteBadgeH / 2, quoteBadgeW, quoteBadgeH, 8);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.font = '900 56px "Plus Jakarta Sans", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('“', width / 2, topQuoteY + 12);
    ctx.restore();

    // 4. Center-aligned 2-3 Line Quote Headline with comfortable side padding (90px margin)
    const quoteTextStartY = topQuoteY + Math.round(quoteBadgeH / 2) + 20;
    drawRenderedHeadlineLines(
      ctx,
      headlineLines,
      card.highlightColor || '#FFE600',
      width,
      quoteTextStartY,
      headlineFontSize,
      headlineLineHeight,
      'center',
      90, // Reduced width / increased side padding as requested
      false
    );

    // 5. Bottom Quote divider line & yellow badge with closing double quotes
    const bottomQuoteY = quoteTextStartY + totalHeadlineHeight + 20;
    ctx.save();
    ctx.strokeStyle = '#FFE600';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(110, bottomQuoteY);
    ctx.lineTo(width / 2 - quoteBadgeW / 2 - 12, bottomQuoteY);
    ctx.moveTo(width / 2 + quoteBadgeW / 2 + 12, bottomQuoteY);
    ctx.lineTo(width - 110, bottomQuoteY);
    ctx.stroke();

    ctx.fillStyle = '#FFE600';
    ctx.beginPath();
    ctx.roundRect(width / 2 - quoteBadgeW / 2, bottomQuoteY - quoteBadgeH / 2, quoteBadgeW, quoteBadgeH, 8);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.font = '900 56px "Plus Jakarta Sans", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('”', width / 2, bottomQuoteY + 12);
    ctx.restore();

    // 6. Speaker Name & Designation: Single Line centered
    // Name slightly larger (38px bold), Title slightly smaller (28px)
    const speakerY = bottomQuoteY + Math.round(quoteBadgeH / 2) + 28;
    const speakerName = card.speakerName || 'अनिरुद्धाचार्य महाराज';
    const speakerTitle = card.speakerTitle || 'कथावाचक';
    drawSpeakerAttribution(ctx, width, speakerY, speakerName, speakerTitle);
  } else {
    // Standard Original Layout
    const headlineBottomY = height - footerBarHeight - 22;
    const headlineStartY = headlineBottomY - totalHeadlineHeight;
    
    // Badge height is 40px. Add clean, professional 28px breathing space between badge bottom and headline top:
    const badgeH = 40;
    const badgeBottomGap = 28;
    const topStripY = headlineStartY - badgeH - badgeBottomGap;

    // Compact, gentle headline gradient scrim (so photo remains 80%+ completely visible)
    const scrimTop = topStripY - 50;
    const scrimGradient = ctx.createLinearGradient(0, scrimTop, 0, height - footerBarHeight);
    scrimGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    scrimGradient.addColorStop(0.20, 'rgba(0, 0, 0, 0.65)');
    scrimGradient.addColorStop(0.55, 'rgba(0, 0, 0, 0.92)');
    scrimGradient.addColorStop(1, 'rgba(0, 0, 0, 0.99)');
    ctx.fillStyle = scrimGradient;
    ctx.fillRect(0, scrimTop, width, height - footerBarHeight - scrimTop);

    // Top Strip: Location (Left) & "🔴 पूरी खबर डिस्क्रिप्शन में" (Right)
    if (card.location) {
      drawLocationBadge(ctx, 48, topStripY, card.location);
    }
    if (card.showCallout) {
      drawCalloutTag(ctx, width - 48, topStripY, card.calloutTag);
    }

    // AI GENERATED Watermark along Left Edge, Rotated 90°, Low Opacity
    if (card.showAiGenerated) {
      drawAiGeneratedWatermark(ctx, width, height, card.aiGeneratedText || 'AI GENERATED');
    }

    // 3-Line News Headline Caption in Baloo 2 font - Justified / Center / Left
    drawRenderedHeadlineLines(
      ctx,
      headlineLines,
      card.highlightColor || '#FFE600',
      width,
      headlineStartY,
      headlineFontSize,
      headlineLineHeight,
      card.headlineAlign || 'justify',
      48,
      false
    );
  }

  // 8. Permanent Theme Footer Bar (Exact reproduction of Footer.png)
  // (Skip standard footer bar if jacket-quote, because it has its own dedicated pill footer)
  if (card.frameDesign !== 'jacket-quote' && !(card.frameDesign === 'custom-png' && card.hideDefaultFooterInCustomFrame)) {
    await drawThemeFooterBar(
      ctx,
      width,
      height,
      footerBarHeight,
      card.socialHandle,
      card.whatsappNumber,
      card.customFooterPng
    );
  }

  return canvas;
}

// Helper: Draw image with cover aspect ratio, custom crop (X/Y) and zoom
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  cropX: number = 0.5,
  cropY: number = 0.5,
  zoom: number = 1.0
) {
  const safeZoom = Math.max(1, zoom || 1);
  const imgRatio = img.width / img.height;
  const targetRatio = w / h;
  let baseSWidth: number;
  let baseSHeight: number;

  if (imgRatio > targetRatio) {
    baseSHeight = img.height;
    baseSWidth = img.height * targetRatio;
  } else {
    baseSWidth = img.width;
    baseSHeight = img.width / targetRatio;
  }

  // Calculate scaled sampling area
  const sWidth = baseSWidth / safeZoom;
  const sHeight = baseSHeight / safeZoom;

  // Maximum movable room in source image
  const maxMoveX = Math.max(0, img.width - sWidth);
  const maxMoveY = Math.max(0, img.height - sHeight);

  const safeCropX = Math.max(0, Math.min(1, cropX));
  const safeCropY = Math.max(0, Math.min(1, cropY));

  const sx = maxMoveX * safeCropX;
  const sy = maxMoveY * safeCropY;

  ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
}

// Signature Top-Right Swoosh Arcs
function drawTopRightSwoosh(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  const startX = width - 180;
  const endY = 240;

  // Outer Black swoosh
  ctx.fillStyle = '#050505';
  ctx.beginPath();
  ctx.moveTo(width, 0);
  ctx.lineTo(startX - 20, 0);
  ctx.quadraticCurveTo(width - 20, 60, width, endY + 40);
  ctx.closePath();
  ctx.fill();

  // Middle Yellow swoosh
  ctx.fillStyle = '#FFDD00';
  ctx.beginPath();
  ctx.moveTo(width, 0);
  ctx.lineTo(startX, 0);
  ctx.quadraticCurveTo(width - 15, 50, width, endY + 20);
  ctx.closePath();
  ctx.fill();

  // Inner Red swoosh
  ctx.fillStyle = '#E50914';
  ctx.beginPath();
  ctx.moveTo(width, 0);
  ctx.lineTo(startX + 30, 0);
  ctx.quadraticCurveTo(width - 10, 40, width, endY);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// Official Logo Badge at Top-Left
function drawLogoBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  brandName: string = 'ब्रेकिंग न्यूज़वाला',
  tagline: string = 'भारत के जिलों से आपके दिलों तक'
) {
  ctx.save();
  const boxW = 280;
  const boxH = 92;
  const radius = 16;

  // Shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 4;

  // Yellow rounded container
  ctx.fillStyle = '#FFEA00';
  ctx.beginPath();
  ctx.roundRect(x, y, boxW, boxH, radius);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Red Border
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#D91A2A';
  ctx.stroke();

  // Blue Globe Icon (Left inside badge)
  const globeX = x + 44;
  const globeY = y + 42;
  const globeR = 30;
  ctx.beginPath();
  ctx.arc(globeX, globeY, globeR, 0, Math.PI * 2);
  ctx.fillStyle = '#1D4ED8';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#FACC15';
  ctx.stroke();

  // Simple continents on globe in yellow/orange
  ctx.fillStyle = '#FDE047';
  ctx.beginPath();
  ctx.arc(globeX - 6, globeY - 6, 12, 0, Math.PI);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(globeX + 8, globeY + 8, 10, 0, Math.PI);
  ctx.fill();

  // Latitude/longitude lines
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(globeX, globeY, globeR - 2, 10, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Text: "ब्रेकिंग" (Red)
  ctx.fillStyle = '#DC2626';
  ctx.font = 'bold 30px "Mukta", "Noto Sans Devanagari", sans-serif';
  ctx.fillText('ब्रेकिंग', x + 90, y + 36);

  // Text: "न्यूज़वाला" (Red)
  ctx.font = 'bold 24px "Mukta", "Noto Sans Devanagari", sans-serif';
  ctx.fillText('न्यूज़वाला', x + 90, y + 62);

  // Bottom Tagline bar inside badge
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.roundRect(x + 88, y + 68, boxW - 96, 18, 4);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 11px "Noto Sans Devanagari", sans-serif';
  ctx.fillText(tagline, x + 93, y + 81);

  ctx.restore();
}

// Top Location Badge (Above Headline)
function drawLocationBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  locationText: string
) {
  if (!locationText) return;
  ctx.save();
  ctx.font = '800 22px "Baloo 2", "Noto Sans Devanagari", sans-serif';
  const textW = ctx.measureText(locationText).width;
  const badgeW = textW + 56;
  const badgeH = 40;

  // Red badge background
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.roundRect(x, y, badgeW, badgeH, 6);
  ctx.fill();

  // Highlight stroke
  ctx.strokeStyle = '#EF4444';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Pin icon (white)
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(x + 19, y + 16, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 14, y + 17);
  ctx.lineTo(x + 24, y + 17);
  ctx.lineTo(x + 19, y + 27);
  ctx.closePath();
  ctx.fill();

  // Location text in Baloo 2
  ctx.fillStyle = '#FFFFFF';
  ctx.textBaseline = 'middle';
  ctx.fillText(locationText, x + 34, y + badgeH / 2 + 1);

  ctx.restore();
}

// Callout Tag "🔴 पूरी खबर डिस्क्रिप्शन में" (Top Right above Headline)
function drawCalloutTag(
  ctx: CanvasRenderingContext2D,
  rightX: number,
  y: number,
  text: string
) {
  ctx.save();
  ctx.font = '800 22px "Baloo 2", "Noto Sans Devanagari", sans-serif';
  const cleanText = text.replace('🔴', '').trim() || 'पूरी खबर डिस्क्रिप्शन में';
  const textWidth = ctx.measureText(cleanText).width;
  const pillW = textWidth + 56;
  const pillH = 40;
  const pillX = rightX - pillW;

  // Background white box
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(pillX, y, pillW, pillH, 6);
  ctx.fill();

  // Yellow accent border
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#FFE600';
  ctx.stroke();

  // Red pulsing dot
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.arc(pillX + 20, y + pillH / 2, 6.5, 0, Math.PI * 2);
  ctx.fill();

  // Text in Baloo 2
  ctx.fillStyle = '#0F172A';
  ctx.textBaseline = 'middle';
  ctx.fillText(cleanText, pillX + 36, y + pillH / 2 + 1);

  ctx.restore();
}

// Dedicated Quote Footer Pill matching IMAGE NEWS - TEAM (2).png
function drawQuoteFooterPill(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  const pillW = 540;
  const pillH = 58;
  const pillX = (width - pillW) / 2;
  const pillY = height - 90;

  // Outer black rounded capsule with crisp white/gold border
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 1. Red Capsule "WATCH NOW ▶" on the left
  const watchW = 148;
  const watchH = 46;
  const watchX = pillX + 6;
  const watchY = pillY + 6;

  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.roundRect(watchX, watchY, watchW, watchH, watchH / 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 14px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('WATCH NOW  ▶', watchX + watchW / 2, watchY + watchH / 2);

  // 2. 6 Social Media circular icons with labels on the right
  const icons = [
    { label: 'FACEBOOK', color: '#1877F2', symbol: 'f' },
    { label: 'INSTAGRAM', color: '#E1306C', symbol: '📷' },
    { label: 'YOUTUBE', color: '#FF0000', symbol: '▶' },
    { label: '𝕏', color: '#111111', symbol: '𝕏' },
    { label: 'LINKEDIN', color: '#0A66C2', symbol: 'in' },
    { label: 'PUBLIC APP', color: '#FF8C00', symbol: 'P' },
  ];

  const iconRadius = 14;
  let curIconX = watchX + watchW + 28;
  const iconCenterY = pillY + 22;

  icons.forEach((ic) => {
    // Circle background
    ctx.beginPath();
    ctx.arc(curIconX, iconCenterY, iconRadius, 0, Math.PI * 2);
    ctx.fillStyle = ic.color;
    ctx.fill();

    // Circle border
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Icon symbol
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ic.symbol, curIconX, iconCenterY);

    // Mini label underneath
    ctx.font = '700 8px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(ic.label, curIconX, iconCenterY + iconRadius + 9);

    curIconX += 54;
  });

  ctx.restore();
}

// Vertical AI GENERATED Watermark along Left Edge/Wall, Rotated 90°, Low Opacity
function drawAiGeneratedWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  text: string = 'AI GENERATED'
) {
  ctx.save();
  // Placed right along the left wall of the photo area
  const x = 22;
  const y = height * 0.44;
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);

  ctx.font = '800 14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  if ('letterSpacing' in ctx) {
    (ctx as any).letterSpacing = '3px';
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const uppercaseText = (text || 'AI GENERATED').toUpperCase();
  // Generous horizontal space (50px padding) before and after text so it never touches the shadow or edge
  const textWidth = ctx.measureText(uppercaseText).width + 50;
  const pillH = 26;

  // Translucent dark backdrop
  ctx.fillStyle = 'rgba(0, 0, 0, 0.60)';
  ctx.beginPath();
  ctx.roundRect(-textWidth / 2, -pillH / 2, textWidth, pillH, 4);
  ctx.fill();

  // Subtle border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Low opacity white uppercase text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillText(uppercaseText, 0, 1);

  ctx.restore();
}

// Professional Breaking News Curved Red Pointer Arrow
// Placed to the bottom-left of the circle, pointing UP-RIGHT directly into the circle
function drawRed3DPointerArrow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  arrowImg: HTMLImageElement
) {
  ctx.save();
  const arrowW = radius * 1.55;
  const arrowH = radius * 1.55;

  // In 400x400 viewBox, arrowhead tip is at (320, 60) => 80% X, 15% Y.
  // We align the tip to touch the lower-left perimeter of the circle (angle 225°: cx - 0.707*R, cy + 0.707*R)
  const targetTipX = cx - radius * 0.707;
  const targetTipY = cy + radius * 0.707;

  const arrowX = targetTipX - 0.80 * arrowW;
  const arrowY = targetTipY - 0.15 * arrowH;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 32;
  ctx.shadowOffsetY = 16;
  ctx.drawImage(arrowImg, arrowX, arrowY, arrowW, arrowH);
  ctx.restore();
}

interface WordToken {
  text: string;
  isHighlight: boolean;
}

// Parse words and break into maximum 3 lines for clean news caption
function getHeadlineLines(
  ctx: CanvasRenderingContext2D,
  rawText: string,
  highlightWords: string[],
  maxWidth: number,
  fontSize: number
): WordToken[][] {
  ctx.save();
  ctx.font = `800 ${fontSize}px "Baloo 2", "Noto Sans Devanagari", sans-serif`;

  const parseTokensFromChunk = (chunk: string): WordToken[] => {
    const tokens: WordToken[] = [];
    const yellowRegex = /\[yellow\](.*?)\[\/yellow\]/g;
    let lastIndex = 0;
    let match;

    while ((match = yellowRegex.exec(chunk)) !== null) {
      if (match.index > lastIndex) {
        const regularChunk = chunk.substring(lastIndex, match.index);
        for (const w of regularChunk.split(/[ \t]+/)) {
          if (w && w.trim()) tokens.push({ text: w.trim(), isHighlight: false });
        }
      }
      const highlightChunk = match[1];
      for (const w of highlightChunk.split(/[ \t]+/)) {
        if (w && w.trim()) tokens.push({ text: w.trim(), isHighlight: true });
      }
      lastIndex = yellowRegex.lastIndex;
    }

    if (lastIndex < chunk.length) {
      const tailChunk = chunk.substring(lastIndex);
      for (const w of tailChunk.split(/[ \t]+/)) {
        if (w && w.trim()) tokens.push({ text: w.trim(), isHighlight: false });
      }
    }

    if (!chunk.includes('[yellow]') && highlightWords && highlightWords.length > 0) {
      tokens.forEach((t) => {
        const matchWord = highlightWords.some((hw) =>
          hw && (t.text.toLowerCase().includes(hw.toLowerCase()) || hw.toLowerCase().includes(t.text.toLowerCase()))
        );
        if (matchWord) t.isHighlight = true;
      });
    }

    return tokens;
  };

  const manualLines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const spaceWidth = ctx.measureText(' ').width;
  const lines: WordToken[][] = [];

  if (manualLines.length > 1) {
    // User explicitly created lines using Enter in the editor
    for (const mLine of manualLines) {
      const lineTokens = parseTokensFromChunk(mLine);
      if (lineTokens.length === 0) continue;

      let curLine: WordToken[] = [];
      let curWidth = 0;

      for (const token of lineTokens) {
        const wordWidth = ctx.measureText(token.text).width;
        if (curWidth + wordWidth > maxWidth && curLine.length > 0) {
          lines.push(curLine);
          curLine = [token];
          curWidth = wordWidth + spaceWidth;
        } else {
          curLine.push(token);
          curWidth += wordWidth + spaceWidth;
        }
      }
      if (curLine.length > 0) {
        lines.push(curLine);
      }
    }
  } else {
    // Single block of text: wrap automatically based on maxWidth
    const allTokens = parseTokensFromChunk(rawText);
    let currentLine: WordToken[] = [];
    let currentLineWidth = 0;

    for (const token of allTokens) {
      const wordWidth = ctx.measureText(token.text).width;
      if (currentLineWidth + wordWidth > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = [token];
        currentLineWidth = wordWidth + spaceWidth;
      } else {
        currentLine.push(token);
        currentLineWidth += wordWidth + spaceWidth;
      }
    }
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }
  }

  // Cap at 3 lines as requested: "फुटर पर तीन लाइन में कैप्शन जाएगा"
  if (lines.length > 3) {
    lines.splice(3);
    const lastLine = lines[2];
    if (lastLine && lastLine.length > 0) {
      const last = lastLine[lastLine.length - 1];
      if (!last.text.endsWith('...')) {
        last.text += '...';
      }
    }
  }

  ctx.restore();
  return lines;
}

// Render BREAKING NEWS Ribbon (Centered, scaled nicely, subtle shadow, matches uploaded PNG)
async function drawSuperBreakingRibbon(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  ribbonY: number,
  customRibbonUrl?: string,
  scalePercent: number = 70
) {
  ctx.save();
  const clampedScale = Math.max(0.50, Math.min(0.95, scalePercent / 100));
  const ribbonW = Math.round(canvasWidth * clampedScale); // User configured scale
  const ribbonH = Math.round(ribbonW * (150 / 960)); // Proportional to SVG aspect ratio
  const startX = Math.round((canvasWidth - ribbonW) / 2);

  // Softer shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 8;

  try {
    const imgUrl = customRibbonUrl || '/assets/breaking_news_ribbon.svg';
    const ribbonImg = await loadImage(imgUrl);
    ctx.drawImage(ribbonImg, startX, ribbonY, ribbonW, ribbonH);
    ctx.restore();
    return;
  } catch (err) {
    console.warn('Could not load ribbon image, using vector fallback', err);
  }

  // Vector fallback matching uploaded BREAKING NEWS WALA.png
  const slantOffset = Math.round(ribbonH * 0.28);
  const leftW = Math.round(ribbonW * 0.48);

  // Top speed lines
  ctx.fillStyle = '#E50914';
  ctx.fillRect(startX + Math.round(ribbonW * 0.25), ribbonY - 6, Math.round(ribbonW * 0.58), 6);
  ctx.fillStyle = '#2244E8';
  ctx.fillRect(startX + 18, ribbonY + 6, Math.round(ribbonW * 0.45), 5);

  // Left Blue Parallelogram: BREAKING
  ctx.beginPath();
  ctx.moveTo(startX + slantOffset, ribbonY + 16);
  ctx.lineTo(startX + leftW + slantOffset, ribbonY + 16);
  ctx.lineTo(startX + leftW, ribbonY + ribbonH - 16);
  ctx.lineTo(startX, ribbonY + ribbonH - 16);
  ctx.closePath();
  ctx.fillStyle = '#2244E8';
  ctx.fill();

  // Right Red Parallelogram: NEWS
  const rightStartX = startX + leftW + 6;
  ctx.beginPath();
  ctx.moveTo(rightStartX + slantOffset, ribbonY + 14);
  ctx.lineTo(startX + ribbonW + slantOffset, ribbonY + 14);
  ctx.lineTo(startX + ribbonW, ribbonY + ribbonH - 14);
  ctx.lineTo(rightStartX, ribbonY + ribbonH - 14);
  ctx.closePath();
  ctx.fillStyle = '#E50914';
  ctx.fill();

  // Text BREAKING
  ctx.shadowColor = 'transparent';
  ctx.font = 'italic 900 48px sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BREAKING', startX + leftW / 2 + slantOffset / 2, ribbonY + ribbonH / 2);

  // Text NEWS
  ctx.font = 'italic 900 52px sans-serif';
  ctx.fillText('NEWS', rightStartX + (ribbonW - (rightStartX - startX)) / 2 + slantOffset / 2, ribbonY + ribbonH / 2);

  // Bottom speed lines
  ctx.fillStyle = '#E50914';
  ctx.fillRect(startX + Math.round(ribbonW * 0.16), ribbonY + ribbonH - 8, Math.round(ribbonW * 0.32), 5);
  ctx.fillStyle = '#2244E8';
  ctx.fillRect(startX + Math.round(ribbonW * 0.30), ribbonY + ribbonH + 2, Math.round(ribbonW * 0.52), 6);

  ctx.restore();
}

// Render Subtle Exclusive Watermark across photo area (15% opacity)
function drawSuperBreakingWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  watermarkText: string = '⚡ सुपर ब्रेकिंग',
  opacity: number = 0.15
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.clip();

  ctx.rotate((-20 * Math.PI) / 180);
  ctx.font = '900 36px "Baloo 2", sans-serif';
  ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const stepX = 380;
  const stepY = 130;
  for (let y = -height * 1.5; y < height * 2.5; y += stepY) {
    for (let x = -width * 1.5; x < width * 2.5; x += stepX) {
      ctx.fillText(watermarkText, x, y);
    }
  }
  ctx.restore();
}

// Render the 3-line headline caption - Justified (Default) or Center or Left
function drawRenderedHeadlineLines(
  ctx: CanvasRenderingContext2D,
  lines: WordToken[][],
  highlightColor: string,
  canvasWidth: number,
  startY: number,
  fontSize: number,
  lineHeight: number,
  align: 'justify' | 'center' | 'left' = 'justify',
  margin: number = 48,
  isLightBackground: boolean = false
) {
  ctx.save();
  ctx.font = `800 ${fontSize}px "Baloo 2", "Noto Sans Devanagari", sans-serif`;
  ctx.textBaseline = 'top';
  const spaceWidth = ctx.measureText(' ').width;
  const targetLineWidth = canvasWidth - margin * 2;

  lines.forEach((line, lineIdx) => {
    const isLastLine = lineIdx === lines.length - 1;
    const gaps = line.length - 1;

    // Calculate total pure word width
    let totalWordWidth = 0;
    line.forEach((token) => {
      totalWordWidth += ctx.measureText(token.text).width;
    });

    const naturalLineWidth = totalWordWidth + gaps * spaceWidth;

    let curX: number;
    let currentSpaceWidth = spaceWidth;

    if (align === 'justify') {
      if (gaps > 0) {
        const extraSpace = targetLineWidth - totalWordWidth;
        const justifiedSpace = extraSpace / gaps;

        // In Justify mode:
        // If not the last line, or if the last line is substantially filled (>= 58% of width)
        if (!isLastLine || (naturalLineWidth / targetLineWidth >= 0.58 && justifiedSpace <= spaceWidth * 2.8)) {
          currentSpaceWidth = Math.max(spaceWidth, justifiedSpace);
          curX = margin;
        } else {
          // If the last line has very few words, center it with slightly enhanced word spacing
          const lastLineSpace = Math.min(spaceWidth * 1.5, Math.max(spaceWidth, justifiedSpace));
          const adjustedWidth = totalWordWidth + gaps * lastLineSpace;
          curX = Math.round((canvasWidth - adjustedWidth) / 2);
          currentSpaceWidth = lastLineSpace;
        }
      } else {
        // Single word on the line: center it
        curX = Math.round((canvasWidth - totalWordWidth) / 2);
      }
    } else if (align === 'left') {
      curX = margin;
      currentSpaceWidth = spaceWidth;
    } else {
      // Center
      curX = Math.round((canvasWidth - naturalLineWidth) / 2);
      currentSpaceWidth = spaceWidth;
    }

    const curY = startY + lineIdx * lineHeight;

    line.forEach((token) => {
      const wordW = ctx.measureText(token.text).width;

      if (!isLightBackground) {
        // Heavy stroke shadow for punchy readability
        ctx.lineWidth = 7;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.strokeText(token.text, curX, curY);
      }

      // Fill color
      ctx.fillStyle = token.isHighlight
        ? highlightColor
        : isLightBackground
        ? '#0A0A0A'
        : '#FFFFFF';
      ctx.fillText(token.text, curX, curY);

      curX += wordW + currentSpaceWidth;
    });
  });

  ctx.restore();
}

// Theme Footer Bar (Exact reproduction of Footer.png)
async function drawThemeFooterBar(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  barH: number,
  socialHandle: string = '/BreakingNewsWala',
  whatsappNumber: string = '+91 96698 02408',
  customFooterPng?: string
) {
  // If user uploaded custom Footer.png, draw it directly
  if (customFooterPng) {
    try {
      const footerImg = await loadImage(customFooterPng);
      const footerAspect = footerImg.width / footerImg.height;
      const drawH = width / footerAspect;
      ctx.drawImage(footerImg, 0, height - drawH, width, drawH);
      return;
    } catch (err) {
      console.warn('Custom footer load error:', err);
    }
  }

  ctx.save();
  const barY = height - barH;

  // Solid white bottom bar background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, barY, width, barH);

  // Top border line
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, barY);
  ctx.lineTo(width, barY);
  ctx.stroke();

  const iconY = barY + barH / 2;
  let curX = 26;

  // 1. Cluster of 6 Black Circular Social Icons
  const iconRadius = 13;
  const iconDiameter = iconRadius * 2;

  // Helper to draw black circular icon background
  const drawCircleBase = (x: number) => {
    ctx.beginPath();
    ctx.arc(x + iconRadius, iconY, iconRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
  };

  // 1. Instagram
  drawCircleBase(curX);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.8;
  ctx.strokeRect(curX + 6, iconY - 7, 14, 14);
  ctx.beginPath();
  ctx.arc(curX + 13, iconY, 3.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(curX + 16, iconY - 5, 1.8, 1.8);
  curX += iconDiameter + 8;

  // 2. Facebook
  drawCircleBase(curX);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('f', curX + iconRadius, iconY);
  curX += iconDiameter + 8;

  // 3. X (Twitter)
  drawCircleBase(curX);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('𝕏', curX + iconRadius, iconY);
  curX += iconDiameter + 8;

  // 4. Threads
  drawCircleBase(curX);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('@', curX + iconRadius, iconY);
  curX += iconDiameter + 8;

  // 5. YouTube
  drawCircleBase(curX);
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(curX + 10, iconY - 6);
  ctx.lineTo(curX + 19, iconY);
  ctx.lineTo(curX + 10, iconY + 6);
  ctx.closePath();
  ctx.fill();
  curX += iconDiameter + 8;

  // 6. LinkedIn
  drawCircleBase(curX);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('in', curX + iconRadius, iconY);
  curX += iconDiameter + 12;

  // Social Handle Text
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000000';
  ctx.font = '800 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(socialHandle, curX, iconY);
  curX += ctx.measureText(socialHandle).width + 18;

  // WhatsApp Icon (Black Circle with Phone Icon)
  drawCircleBase(curX);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('📞', curX + iconRadius, iconY);
  curX += iconDiameter + 6;

  // WhatsApp Number
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000000';
  ctx.font = '800 20px "Plus Jakarta Sans", sans-serif';
  const waText = whatsappNumber.startsWith('/') ? whatsappNumber : `/${whatsappNumber}`;
  ctx.fillText(waText, curX, iconY);

  // Right Side: "# News Update" Badge as seen in Footer.png
  const badgeH = 46;
  const badgeY = barY + (barH - badgeH) / 2;
  const squareW = 44;

  ctx.font = '800 20px "Plus Jakarta Sans", sans-serif';
  const labelText = 'News Update';
  const labelW = ctx.measureText(labelText).width + 24;
  const totalBadgeW = squareW + labelW;
  const badgeX = width - totalBadgeW - 24;

  // Yellow border around whole badge
  ctx.strokeStyle = '#FFE600';
  ctx.lineWidth = 3;
  ctx.strokeRect(badgeX, badgeY, totalBadgeW, badgeH);

  // Left square: Solid yellow fill with black "#"
  ctx.fillStyle = '#FFE600';
  ctx.fillRect(badgeX, badgeY, squareW, badgeH);

  ctx.fillStyle = '#000000';
  ctx.font = '900 24px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('#', badgeX + squareW / 2, badgeY + badgeH / 2);

  // Right section: Solid white with black text "News Update"
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(badgeX + squareW, badgeY + 1.5, labelW - 1.5, badgeH - 3);

  ctx.fillStyle = '#000000';
  ctx.font = '800 19px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(labelText, badgeX + squareW + labelW / 2, badgeY + badgeH / 2);

  ctx.restore();
}
