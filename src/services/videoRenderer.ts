/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master Video Rendering Engine (VID-007, VID-010)
 * 
 * Strict Invariant: Pure Canvas composition & MediaStream rendering logic
 * completely decoupled from React UI components.
 * 
 * Features:
 * 1. Scene-based Canvas compositor (Background, Image, Ken Burns zoom, Lower-thirds, Masthead, Ticker)
 * 2. Real browser-side video recording pipeline via HTML5 Canvas captureStream & MediaRecorder
 * 3. Accurate aspect ratio scaling (9:16, 16:9, 1:1, 4:5, 3:4)
 * 4. High-resolution export with frame-by-frame rendering and progress tracking
 */

import { VideoAspectRatio, VideoProject, VideoScene } from '../types';
import { VideoTimelineEngine } from './videoTimelineEngine';

const imageCache = new Map<string, HTMLImageElement>();

function loadMediaImage(url: string): Promise<HTMLImageElement> {
  if (imageCache.has(url)) {
    const cached = imageCache.get(url)!;
    if (cached.complete) return Promise.resolve(cached);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = () => {
      resolve(img); // Non-fatal fallback
    };
    img.src = url;
  });
}

export class VideoRenderer {
  /**
   * Renders a single frame of a scene onto a 2D canvas context.
   * @param ctx CanvasRenderingContext2D
   * @param scene Active VideoScene
   * @param sceneProgress Normalized progress within active scene (0.0 to 1.0)
   * @param totalTimeSec Global playback timecode in seconds
   * @param aspectRatio Target aspect ratio
   */
  public static async renderSceneFrame(
    ctx: CanvasRenderingContext2D,
    scene: VideoScene,
    sceneProgress: number,
    totalTimeSec: number,
    aspectRatio: VideoAspectRatio = '9:16'
  ): Promise<void> {
    const { width: W, height: H } = VideoTimelineEngine.getDimensions(aspectRatio);

    ctx.save();
    ctx.clearRect(0, 0, W, H);

    // 1. Render Background
    if (scene.backgroundStyle === 'gradient-red') {
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#7F1D1D');
      grad.addColorStop(0.5, '#450A0A');
      grad.addColorStop(1, '#0B0F19');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    } else if (scene.backgroundStyle === 'navy-blue') {
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#0F172A');
      grad.addColorStop(0.5, '#1E293B');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    } else if (scene.backgroundStyle === 'breaking-yellow') {
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#78350F');
      grad.addColorStop(0.5, '#451A03');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    } else {
      // Dark Charcoal default
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, W, H);
    }

    // 2. Render Featured Image with cinematic Ken Burns zoom
    if (scene.imageUrl) {
      try {
        const img = await loadMediaImage(scene.imageUrl);
        if (img && img.width > 0 && img.height > 0) {
          ctx.save();

          // Subtle Ken Burns slow zoom (1.00 -> 1.08 over scene duration)
          const zoom = 1.0 + sceneProgress * 0.08;
          const mediaAreaH = H * (aspectRatio === '16:9' ? 0.75 : 0.58);
          const mediaAreaY = aspectRatio === '16:9' ? H * 0.12 : H * 0.16;

          ctx.beginPath();
          ctx.rect(0, mediaAreaY, W, mediaAreaH);
          ctx.clip();

          const imgRatio = img.width / img.height;
          const areaRatio = W / mediaAreaH;
          let drawW = W;
          let drawH = mediaAreaH;
          let drawX = 0;
          let drawY = mediaAreaY;

          if (imgRatio > areaRatio) {
            drawW = mediaAreaH * imgRatio;
            drawX = (W - drawW) / 2;
          } else {
            drawH = W / imgRatio;
            drawY = mediaAreaY + (mediaAreaH - drawH) / 2;
          }

          // Apply centered zoom
          const centerX = drawX + drawW / 2;
          const centerY = drawY + drawH / 2;
          ctx.translate(centerX, centerY);
          ctx.scale(zoom, zoom);
          ctx.translate(-centerX, -centerY);

          ctx.drawImage(img, drawX, drawY, drawW, drawH);

          // Dark gradient overlay for text readability
          const imgGrad = ctx.createLinearGradient(0, mediaAreaY, 0, mediaAreaY + mediaAreaH);
          imgGrad.addColorStop(0, 'rgba(15, 23, 42, 0.2)');
          imgGrad.addColorStop(0.7, 'rgba(15, 23, 42, 0.4)');
          imgGrad.addColorStop(1, 'rgba(11, 15, 25, 0.95)');
          ctx.fillStyle = imgGrad;
          ctx.fillRect(0, mediaAreaY, W, mediaAreaH);

          ctx.restore();
        }
      } catch {
        // Fallback gracefully
      }
    }

    // 3. Render Top Channel Masthead (Fixed clear-space buffer)
    const topBarH = aspectRatio === '16:9' ? 80 : 110;
    ctx.save();
    ctx.fillStyle = 'rgba(11, 15, 25, 0.92)';
    ctx.fillRect(0, 0, W, topBarH);

    // Tri-color Security Ribbon
    const barSegment = W / 3;
    ctx.fillStyle = '#ED1727';
    ctx.fillRect(0, 0, barSegment, 6);
    ctx.fillStyle = '#FDE900';
    ctx.fillRect(barSegment, 0, barSegment, 6);
    ctx.fillStyle = '#344FD6';
    ctx.fillRect(barSegment * 2, 0, barSegment, 6);

    // Channel Brand Mark "ब" Globe Logo
    const logoX = 36;
    const logoY = topBarH / 2;
    const logoR = aspectRatio === '16:9' ? 24 : 32;

    ctx.beginPath();
    ctx.arc(logoX + logoR, logoY, logoR, 0, Math.PI * 2);
    ctx.fillStyle = '#ED1727';
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `900 ${logoR * 1.1}px "Rozha One", "Noto Sans Devanagari", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ब', logoX + logoR, logoY + 2);

    // Channel Name Devanagari Typography
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `800 ${aspectRatio === '16:9' ? 26 : 34}px "Noto Sans Devanagari", sans-serif`;
    ctx.fillText('ब्रेकिंग न्यूज़ वाला', logoX + logoR * 2 + 16, logoY - 4);

    ctx.fillStyle = '#94A3B8';
    ctx.font = `600 ${aspectRatio === '16:9' ? 14 : 18}px sans-serif`;
    ctx.fillText('BREAKING NEWS WALA • 55 DISTRICTS MP', logoX + logoR * 2 + 16, logoY + (aspectRatio === '16:9' ? 18 : 24));

    // LIVE / HD Indicator
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ED1727';
    ctx.font = `900 ${aspectRatio === '16:9' ? 16 : 20}px sans-serif`;
    const pulseAlpha = 0.7 + Math.sin(totalTimeSec * 4) * 0.3;
    ctx.fillStyle = `rgba(237, 23, 39, ${pulseAlpha})`;
    ctx.fillText('● LIVE BULLETIN', W - 36, logoY);
    ctx.restore();

    // 4. Render Badges (Breaking Badge & District Badge)
    const badgeY = aspectRatio === '16:9' ? H * 0.65 : H * 0.58;
    ctx.save();
    // Breaking Red Badge
    ctx.fillStyle = '#ED1727';
    const bW = 200;
    const bH = 44;
    ctx.beginPath();
    ctx.roundRect(36, badgeY, bW, bH, 8);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 20px "Noto Sans Devanagari", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚨 बड़ी खबर | LIVE', 36 + bW / 2, badgeY + bH / 2);

    // District Gold Badge
    const distText = scene.district || 'मध्य प्रदेश';
    ctx.fillStyle = '#FDE900';
    const dW = 180;
    ctx.beginPath();
    ctx.roundRect(36 + bW + 12, badgeY, dW, bH, 8);
    ctx.fill();

    ctx.fillStyle = '#0F172A';
    ctx.font = '800 18px "Noto Sans Devanagari", sans-serif';
    ctx.fillText(distText, 36 + bW + 12 + dW / 2, badgeY + bH / 2);
    ctx.restore();

    // 5. Render Main Headline (Anti-clipping font calculation)
    const headline = scene.headline || 'मुख्य समाचार शीर्षक';
    const textStartY = badgeY + bH + 20;
    const textMaxW = W - 72;
    const textMaxH = H * (aspectRatio === '16:9' ? 0.18 : 0.22);

    ctx.save();
    let fontSize = aspectRatio === '16:9' ? 36 : 46;
    ctx.font = `800 ${fontSize}px "Noto Sans Devanagari", sans-serif`;

    // Wrap text lines
    const words = headline.split(' ');
    let lines: string[] = [];
    let curLine = '';

    for (const w of words) {
      const testLine = curLine ? `${curLine} ${w}` : w;
      if (ctx.measureText(testLine).width > textMaxW && curLine) {
        lines.push(curLine);
        curLine = w;
      } else {
        curLine = testLine;
      }
    }
    if (curLine) lines.push(curLine);

    // Auto-scale if lines exceed height
    const lineHeight = fontSize * 1.35;
    if (lines.length * lineHeight > textMaxH && fontSize > 24) {
      fontSize = Math.floor(fontSize * 0.85);
      ctx.font = `800 ${fontSize}px "Noto Sans Devanagari", sans-serif`;
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    let curY = textStartY;
    for (let i = 0; i < Math.min(lines.length, 3); i++) {
      ctx.fillText(lines[i], 36, curY);
      curY += fontSize * 1.35;
    }
    ctx.restore();

    // 6. Render Subtext / Lower Third
    if (scene.subtext) {
      ctx.save();
      ctx.fillStyle = '#CBD5E1';
      ctx.font = `600 ${aspectRatio === '16:9' ? 20 : 26}px "Noto Sans Devanagari", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const subWords = scene.subtext.split(' ');
      let subLine = '';
      const subLines: string[] = [];
      for (const sw of subWords) {
        const testSub = subLine ? `${subLine} ${sw}` : sw;
        if (ctx.measureText(testSub).width > textMaxW && subLine) {
          subLines.push(subLine);
          subLine = sw;
        } else {
          subLine = testSub;
        }
      }
      if (subLine) subLines.push(subLine);

      let subY = curY + 12;
      for (let j = 0; j < Math.min(subLines.length, 2); j++) {
        ctx.fillText(subLines[j], 36, subY);
        subY += (aspectRatio === '16:9' ? 20 : 26) * 1.35;
      }
      ctx.restore();
    }

    // 7. Render Bottom News Ticker (Scrolling ticker effect)
    const tickerH = aspectRatio === '16:9' ? 50 : 64;
    const tickerY = H - tickerH;

    ctx.save();
    ctx.fillStyle = '#B91C1C';
    ctx.fillRect(0, tickerY, W, tickerH);

    // Ticker Title Tab
    const tabW = 160;
    ctx.fillStyle = '#FDE900';
    ctx.fillRect(0, tickerY, tabW, tickerH);

    ctx.fillStyle = '#0F172A';
    ctx.font = '800 18px "Noto Sans Devanagari", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ताज़ा हलचल', tabW / 2, tickerY + tickerH / 2);

    // Animated scrolling ticker text
    ctx.save();
    ctx.beginPath();
    ctx.rect(tabW + 10, tickerY, W - tabW - 20, tickerH);
    ctx.clip();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 18px "Noto Sans Devanagari", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const tickerText =
      scene.lowerThird ||
      'मध्य प्रदेश के 55 जिलों की हर ताज़ा खबर, सरकारी योजना और निष्पक्ष ग्राउंड रिपोर्ट • breakingnewswala.com';
    const tickerTextW = ctx.measureText(tickerText).width;
    const scrollDistance = W - tabW + tickerTextW;
    const scrollX = W - ((totalTimeSec * 90) % scrollDistance);

    ctx.fillText(tickerText, scrollX, tickerY + tickerH / 2);
    ctx.restore();

    ctx.restore();
    ctx.restore();
  }

  /**
   * Real browser-side video recording pipeline.
   * Advances frame-by-frame and records real playable video via HTML5 Canvas captureStream & MediaRecorder.
   */
  public static async renderProjectToVideoBlob(
    canvas: HTMLCanvasElement,
    project: VideoProject,
    onProgress?: (percent: number) => void
  ): Promise<Blob> {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('ERR_CANVAS_CONTEXT: Failed to acquire 2D context.');

    const { width: W, height: H } = VideoTimelineEngine.getDimensions(project.aspectRatio);
    canvas.width = W;
    canvas.height = H;

    const scenes = project.scenes || [];
    if (scenes.length === 0) throw new Error('ERR_EMPTY_PROJECT: Project contains no scenes to render.');

    const fps = project.fps || 30;
    const totalDurationSec = VideoTimelineEngine.calculateTotalDuration(scenes);
    const totalFrames = Math.max(1, Math.floor(totalDurationSec * fps));

    // Resolve supported video mimeType
    let mimeType = 'video/webm;codecs=vp9';
    if (typeof MediaRecorder !== 'undefined') {
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
        mimeType = 'video/mp4;codecs=avc1';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        mimeType = 'video/webm;codecs=vp9';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
      }
    }

    const stream = canvas.captureStream(fps);
    const chunks: Blob[] = [];

    return new Promise(async (resolve, reject) => {
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4500000 });
      } catch (err: any) {
        // Fallback without options
        try {
          recorder = new MediaRecorder(stream);
        } catch (e: any) {
          return reject(new Error(`ERR_MEDIA_RECORDER: ${e.message}`));
        }
      }

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onerror = (e: any) => {
        reject(new Error(`ERR_RECORDER_ERROR: ${e.error?.message || 'Recording failed'}`));
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: recorder.mimeType || mimeType });
        if (onProgress) onProgress(100);
        resolve(finalBlob);
      };

      recorder.start(100); // 100ms time slice chunks

      // Step frame-by-frame through timeline
      const frameIntervalMs = 1000 / fps;
      let frame = 0;

      const renderNextFrame = async () => {
        if (frame >= totalFrames) {
          setTimeout(() => {
            recorder.stop();
          }, 300);
          return;
        }

        const currentTimeSec = (frame / fps);
        const sceneIdx = VideoTimelineEngine.getSceneIndexAtTime(scenes, currentTimeSec);
        const ranges = VideoTimelineEngine.computeSceneTimeRanges(scenes);
        const activeRange = ranges[sceneIdx];
        const sceneProgress = activeRange
          ? (currentTimeSec - activeRange.startSec) / (activeRange.endSec - activeRange.startSec || 1)
          : 0;

        await VideoRenderer.renderSceneFrame(
          ctx,
          scenes[sceneIdx] || scenes[0],
          Math.min(1.0, Math.max(0.0, sceneProgress)),
          currentTimeSec,
          project.aspectRatio
        );

        frame++;
        const pct = Math.floor((frame / totalFrames) * 98);
        if (onProgress && frame % 10 === 0) {
          onProgress(pct);
        }

        setTimeout(renderNextFrame, frameIntervalMs);
      };

      // Start rendering loop
      renderNextFrame();
    });
  }

  /**
   * Helper to draw a scene directly onto a visible HTMLCanvasElement for live previews.
   */
  public static async drawSceneToCanvas(
    canvas: HTMLCanvasElement,
    scene: VideoScene,
    project: VideoProject,
    timeSec = 0
  ): Promise<void> {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width: W, height: H } = VideoTimelineEngine.getDimensions(project.aspectRatio);
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }
    await this.renderSceneFrame(ctx, scene, 0.5, timeSec, project.aspectRatio);
  }

  /**
   * Browser file download helper.
   */
  public static downloadVideo(blobOrUrl: Blob | string, filename = 'breaking-news-wala-video.mp4') {
    const link = document.createElement('a');
    link.download = filename;
    if (typeof blobOrUrl === 'string') {
      link.href = blobOrUrl;
      link.click();
    } else {
      const url = URL.createObjectURL(blobOrUrl);
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
  }
}
