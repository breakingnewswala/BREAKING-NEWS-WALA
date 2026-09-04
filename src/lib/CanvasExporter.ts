import { NewsCardData } from '../types';
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
  const photoBottomY = height - footerBarHeight;

  // 1. Draw Images according to 5 layouts with custom crop (X/Y) & zoom
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

    if (card.layout === 'full') {
      // Full bleed edge-to-edge image across entire card
      drawImageCover(ctx, mainImg, 0, 0, width, height, mCropX, mCropY, mZoom);
    } else if (card.layout === 'single' || !card.layout || card.layout === 'inset-circle') {
      // Single Image: Clear, bright, prominent photo taking maximum space
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

  // 2. Render Header / Jacket
  // If one of the hold/pending header styles is selected, do not draw Breaking News Wala header
  if (
    card.frameDesign === 'jacket-breaking-red' ||
    card.frameDesign === 'jacket-investigation' ||
    card.frameDesign === 'jacket-quote'
  ) {
    // Hold / Pending: Wait for user to provide separate jackets for these 3 styles
  } else if (card.customHeaderPng) {
    try {
      const headerImg = await loadImage(card.customHeaderPng);
      const headerAspect = headerImg.width / headerImg.height;
      const drawH = width / headerAspect;
      ctx.drawImage(headerImg, 0, 0, width, drawH);
    } catch (err) {
      console.warn('Custom header load error:', err);
      drawOriginalHeader(ctx, width, card);
    }
  } else {
    // Default: Official 'ब्रेकिंग न्यूज़ वाला' jacket
    drawOriginalHeader(ctx, width, card);
  }

  // Optional full frame transparent overlay PNG if provided
  if (card.customFrameOverlayPng) {
    try {
      const overlayImg = await loadImage(card.customFrameOverlayPng);
      ctx.drawImage(overlayImg, 0, 0, width, height);
    } catch (err) {
      console.warn('Frame overlay load error:', err);
    }
  }

  // 3. Calculate Headline Lines in Baloo 2 font (Capped at 3 lines: "फुटर पर तीन लाइन में कैप्शन जाएगा")
  const maxHeadlineWidth = width - 96;
  const headlineFontSize = card.headlineFontSize ? card.headlineFontSize * 1.35 : 44;
  const headlineLineHeight = headlineFontSize * 1.38;
  const headlineLines = getHeadlineLines(
    ctx,
    card.formattedHeadline || card.headline,
    card.highlightWords,
    maxHeadlineWidth,
    headlineFontSize
  );
  const totalHeadlineHeight = headlineLines.length * headlineLineHeight;

  // 4. Positions relative to bottom footer bar
  const headlineBottomY = height - footerBarHeight - 22;
  const headlineStartY = headlineBottomY - totalHeadlineHeight;
  
  // Badge height is 40px. Add clean, professional 28px breathing space between badge bottom and headline top:
  const badgeH = 40;
  const badgeBottomGap = 28;
  const topStripY = headlineStartY - badgeH - badgeBottomGap;

  // 5. Compact, gentle headline gradient scrim (so photo remains 80%+ completely visible)
  const scrimTop = topStripY - 50;
  const scrimGradient = ctx.createLinearGradient(0, scrimTop, 0, height - footerBarHeight);
  scrimGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  scrimGradient.addColorStop(0.20, 'rgba(0, 0, 0, 0.65)');
  scrimGradient.addColorStop(0.55, 'rgba(0, 0, 0, 0.92)');
  scrimGradient.addColorStop(1, 'rgba(0, 0, 0, 0.99)');
  ctx.fillStyle = scrimGradient;
  ctx.fillRect(0, scrimTop, width, height - footerBarHeight - scrimTop);

  // 6. Top Strip: Location (Left) & "🔴 पूरी खबर डिस्क्रिप्शन में" (Right)
  if (card.location) {
    drawLocationBadge(ctx, 48, topStripY, card.location);
  }
  if (card.showCallout) {
    drawCalloutTag(ctx, width - 48, topStripY, card.calloutTag);
  }

  // 6B. AI GENERATED Watermark along Left Edge, Rotated 90°, Low Opacity
  if (card.showAiGenerated) {
    drawAiGeneratedWatermark(ctx, width, height, card.aiGeneratedText || 'AI GENERATED');
  }

  // 7. 3-Line News Headline Caption in Baloo 2 font - Justified / Center / Left
  drawRenderedHeadlineLines(
    ctx,
    headlineLines,
    card.highlightColor || '#FFE600',
    width,
    headlineStartY,
    headlineFontSize,
    headlineLineHeight,
    card.headlineAlign || 'justify'
  );

  // 8. Permanent Theme Footer Bar (Exact reproduction of Footer.png)
  await drawThemeFooterBar(
    ctx,
    width,
    height,
    footerBarHeight,
    card.socialHandle,
    card.whatsappNumber,
    card.customFooterPng
  );

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

// Vertical AI GENERATED Watermark along Left Edge/Wall, Rotated 90°, Low Opacity
function drawAiGeneratedWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  text: string = 'AI GENERATED'
) {
  ctx.save();
  // Placed right along the left wall of the photo area
  const x = 20;
  const y = height * 0.44;
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);

  ctx.font = '800 15px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const uppercaseText = (text || 'AI GENERATED').toUpperCase();
  const textWidth = ctx.measureText(uppercaseText).width + 30;
  const pillH = 24;

  // Translucent dark backdrop
  ctx.fillStyle = 'rgba(0, 0, 0, 0.50)';
  ctx.beginPath();
  ctx.roundRect(-textWidth / 2, -pillH / 2, textWidth, pillH, 4);
  ctx.fill();

  // Subtle border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Low opacity white uppercase text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  if ('letterSpacing' in ctx) {
    (ctx as any).letterSpacing = '3px';
  }
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
  margin: number = 48
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

      // Heavy stroke shadow for punchy readability
      ctx.lineWidth = 7;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
      ctx.strokeText(token.text, curX, curY);

      // Fill color
      ctx.fillStyle = token.isHighlight ? highlightColor : '#FFFFFF';
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
