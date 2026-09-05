import React, { useRef, useState, useEffect } from 'react';
import { NewsCardData } from '../types';
import { MapPin } from 'lucide-react';
import { HeaderGraphic } from './HeaderGraphic';
import { FooterGraphic } from './FooterGraphic';

interface CardPreviewProps {
  card: NewsCardData;
  scale?: number;
  className?: string;
}

export const CardPreview: React.FC<CardPreviewProps> = ({ card, scale = 1, className }) => {
  const isSuperBreaking = card.frameDesign === 'jacket-breaking-red';
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomPlateRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(480);
  const [bottomPlateHeight, setBottomPlateHeight] = useState<number>(146);

  // Synchronize container width with ResizeObserver for 100% exact 1080px canvas font matching
  useEffect(() => {
    if (!containerRef.current) return;
    const updateW = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        if (w > 0) setContainerWidth(w);
      }
    };
    updateW();
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!isSuperBreaking) return;
    const updateHeight = () => {
      if (bottomPlateRef.current) {
        const h = bottomPlateRef.current.offsetHeight;
        if (h > 0) setBottomPlateHeight(h);
      }
    };
    updateHeight();
    const timer = setTimeout(updateHeight, 60);
    return () => clearTimeout(timer);
  }, [
    isSuperBreaking,
    card.headline,
    card.formattedHeadline,
    card.headlineFontSize,
    card.breakingRibbonOffsetY,
    card.breakingRibbonScale,
    card.socialHandle,
    card.whatsappNumber,
  ]);

  // Exact proportional font size & padding matching CanvasExporter 1080px canvas
  const previewScale = containerWidth / 1080;
  const canvasTargetFontSize = Math.max(54, Math.min(80, Math.round((card.headlineFontSize || 30) * 2.15)));
  const effectivePreviewFontSize = Math.max(16, Math.round(canvasTargetFontSize * previewScale));
  const effectivePaddingX = Math.max(16, Math.round(48 * previewScale));
  // Parse formatted headline with [yellow]...[/yellow] or highlightWords, preserving manual lines
  const renderFormattedHeadline = () => {
    const raw = card.formattedHeadline || card.headline;
    if (!raw) return null;

    const parseLineParts = (textChunk: string) => {
      const yellowRegex = /\[yellow\](.*?)\[\/yellow\]/g;
      const parts: { text: string; isYellow: boolean }[] = [];
      let lastIndex = 0;
      let match;

      while ((match = yellowRegex.exec(textChunk)) !== null) {
        if (match.index > lastIndex) {
          const plain = textChunk.substring(lastIndex, match.index);
          plain.split(/(\s+)/).forEach((word) => {
            if (word) {
              const isHl = card.highlightWords?.some(
                (hw) => hw && (word.includes(hw) || hw.includes(word))
              );
              parts.push({ text: word, isYellow: Boolean(isHl) });
            }
          });
        }
        const highlighted = match[1];
        highlighted.split(/(\s+)/).forEach((word) => {
          if (word) parts.push({ text: word, isYellow: true });
        });
        lastIndex = yellowRegex.lastIndex;
      }

      if (lastIndex < textChunk.length) {
        const tail = textChunk.substring(lastIndex);
        tail.split(/(\s+)/).forEach((word) => {
          if (word) {
            const isHl = card.highlightWords?.some(
              (hw) => hw && (word.includes(hw) || hw.includes(word))
            );
            parts.push({ text: word, isYellow: Boolean(isHl) });
          }
        });
      }

      const isSuperBreaking = card.frameDesign === 'jacket-breaking-red';
      const baseTextColor = isSuperBreaking ? '#000000' : '#FFFFFF';
      const highlightColor = isSuperBreaking
        ? (card.highlightColor && card.highlightColor !== '#FFE600' ? card.highlightColor : '#DC2626')
        : (card.highlightColor || '#FFE600');

      if (parts.length === 0) {
        return <span style={{ color: baseTextColor }}>{textChunk}</span>;
      }

      return parts.map((part, idx) => (
        <span
          key={idx}
          style={{
            color: part.isYellow ? highlightColor : baseTextColor,
            textShadow: isSuperBreaking ? 'none' : '0 2px 8px rgba(0,0,0,0.9), 0 4px 16px rgba(0,0,0,0.9)',
          }}
          className={part.isYellow ? 'font-black' : 'font-extrabold'}
        >
          {part.text}
        </span>
      ));
    };

    const manualLines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    if (manualLines.length > 1) {
      return (
        <span className="block">
          {manualLines.map((mLine, lIdx) => (
            <span key={lIdx} className="block leading-[1.32]">
              {parseLineParts(mLine)}
            </span>
          ))}
        </span>
      );
    }

    return parseLineParts(raw);
  };

  // Aspect ratio class
  const aspectClass =
    card.aspectRatio === '1:1'
      ? 'aspect-square'
      : card.aspectRatio === '9:16'
      ? 'aspect-[9/16]'
      : 'aspect-[4/5]';

  const getImageStyle = (pos?: { x: number; y: number; zoom?: number }) => {
    const x = pos?.x ?? 50;
    const y = pos?.y ?? 50;
    const zoom = Math.max(1, pos?.zoom ?? 1);
    return {
      objectPosition: `${x}% ${y}%`,
      transform: zoom > 1 ? `scale(${zoom})` : undefined,
      transformOrigin: `${x}% ${y}%`,
    };
  };

  const mainStyle = getImageStyle(card.imagePositions?.main);
  const secondStyle = getImageStyle(card.imagePositions?.second);
  const thirdStyle = getImageStyle(card.imagePositions?.third);
  const fourthStyle = getImageStyle(card.imagePositions?.fourth);
  const insetCircleStyle = getImageStyle(card.imagePositions?.insetCircle);

  return (
    <div
      ref={containerRef}
      id="news-card-container"
      className={`relative w-full max-w-[540px] mx-auto overflow-hidden rounded-2xl shadow-2xl bg-neutral-900 select-none ${aspectClass} ${className || ''}`}
      style={{
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
      }}
    >
      {/* 1. BACKGROUND PHOTOS ACCORDING TO USER'S SELECTED LAYOUT */}
      <div
        className="absolute inset-x-0 top-0 z-0 overflow-hidden bg-neutral-950 transition-all duration-150"
        style={{
          bottom: isSuperBreaking
            ? `${bottomPlateHeight}px`
            : card.frameDesign === 'jacket-quote'
            ? '52%'
            : '84px',
        }}
      >
        {/* Layout 1: Single Image (Clear, Bright, Prominent) */}
        {(card.layout === 'single' || !card.layout) && (
          <div className="w-full h-full overflow-hidden relative">
            <img
              src={card.images.main}
              alt="News background"
              className="w-full h-full object-cover transition-all duration-150"
              style={mainStyle}
            />
          </div>
        )}

        {/* Layout 2: Full Image (Edge to edge with maximum picture visibility) */}
        {card.layout === 'full' && (
          <div className="w-full h-full overflow-hidden relative">
            <img
              src={card.images.main}
              alt="News full background"
              className="w-full h-full object-cover transition-all duration-150"
              style={mainStyle}
            />
          </div>
        )}

        {/* Layout 3A: Double Image (35-65 Up & Down: 35% ऊपर, 65% नीचे) */}
        {card.layout === 'split-v' && (
          <div className="w-full h-full flex flex-col">
            {/* Top Frame: 35% Height */}
            <div className="w-full h-[35%] overflow-hidden relative border-b-2 border-white/40">
              <img
                src={card.images.main}
                alt="News top (35%)"
                className="w-full h-full object-cover transition-all duration-150"
                style={mainStyle}
              />
            </div>
            {/* Bottom Frame: 65% Remaining Height with custom crop support */}
            <div className="w-full h-[65%] overflow-hidden relative">
              <img
                src={card.images.second || card.images.main}
                alt="News bottom (65%)"
                className="w-full h-full object-cover transition-all duration-150"
                style={secondStyle}
              />
            </div>
          </div>
        )}

        {/* Layout 3B: Double Image (50-50 Up & Down: 50% आधी ऊपर, 50% आधी नीचे) */}
        {card.layout === 'double' && (
          <div className="w-full h-full flex flex-col">
            {/* Top Frame: 50% Height */}
            <div className="w-full h-[50%] overflow-hidden relative border-b-2 border-white/40">
              <img
                src={card.images.main}
                alt="News top (50%)"
                className="w-full h-full object-cover transition-all duration-150"
                style={mainStyle}
              />
            </div>
            {/* Bottom Frame: 50% Height */}
            <div className="w-full h-[50%] overflow-hidden relative">
              <img
                src={card.images.second || card.images.main}
                alt="News bottom (50%)"
                className="w-full h-full object-cover transition-all duration-150"
                style={secondStyle}
              />
            </div>
          </div>
        )}

        {/* Layout 3C: Double Image (50-50 Left & Right: साइड-बाई-साइड) */}
        {(card.layout === 'double-h' || card.layout === 'split-h') && (
          <div className="w-full h-full grid grid-cols-2 gap-0.5">
            <div className="w-full h-full overflow-hidden relative">
              <img
                src={card.images.main}
                alt="News left (50%)"
                className="w-full h-full object-cover transition-all duration-150"
                style={mainStyle}
              />
            </div>
            <div className="w-full h-full overflow-hidden relative">
              <img
                src={card.images.second || card.images.main}
                alt="News right (50%)"
                className="w-full h-full object-cover transition-all duration-150"
                style={secondStyle}
              />
            </div>
          </div>
        )}

        {/* Layout 4A: Three Image (2 फोटो ऊपर, 1 चौड़ी फोटो नीचे) */}
        {card.layout === 'grid-3' && (
          <div className="w-full h-full flex flex-col gap-0.5">
            <div className="w-full h-[52%] grid grid-cols-2 gap-0.5">
              <div className="w-full h-full overflow-hidden relative">
                <img
                  src={card.images.main}
                  alt="News top left"
                  className="w-full h-full object-cover transition-all duration-150"
                  style={mainStyle}
                />
              </div>
              <div className="w-full h-full overflow-hidden relative">
                <img
                  src={card.images.second || card.images.main}
                  alt="News top right"
                  className="w-full h-full object-cover transition-all duration-150"
                  style={secondStyle}
                />
              </div>
            </div>
            <div className="w-full h-[48%] overflow-hidden relative">
              <img
                src={card.images.third || card.images.main}
                alt="News bottom wide"
                className="w-full h-full object-cover transition-all duration-150"
                style={thirdStyle}
              />
            </div>
          </div>
        )}

        {/* Layout 4B: Three Image (1 चौड़ी फोटो ऊपर, 2 फोटो नीचे) */}
        {card.layout === 'grid-3-bottom' && (
          <div className="w-full h-full flex flex-col gap-0.5">
            <div className="w-full h-[48%] overflow-hidden relative">
              <img
                src={card.images.main}
                alt="News top wide"
                className="w-full h-full object-cover transition-all duration-150"
                style={mainStyle}
              />
            </div>
            <div className="w-full h-[52%] grid grid-cols-2 gap-0.5">
              <div className="w-full h-full overflow-hidden relative">
                <img
                  src={card.images.second || card.images.main}
                  alt="News bottom left"
                  className="w-full h-full object-cover transition-all duration-150"
                  style={secondStyle}
                />
              </div>
              <div className="w-full h-full overflow-hidden relative">
                <img
                  src={card.images.third || card.images.main}
                  alt="News bottom right"
                  className="w-full h-full object-cover transition-all duration-150"
                  style={thirdStyle}
                />
              </div>
            </div>
          </div>
        )}

        {/* Layout 4C: Four Image (4 फोटो: 2 ऊपर, 2 नीचे - 2x2 Grid) */}
        {card.layout === 'grid-4' && (
          <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0.5">
            {/* Top Left */}
            <div className="w-full h-full overflow-hidden relative">
              <img
                src={card.images.main}
                alt="News top left"
                className="w-full h-full object-cover transition-all duration-150"
                style={mainStyle}
              />
            </div>
            {/* Top Right */}
            <div className="w-full h-full overflow-hidden relative">
              <img
                src={card.images.second || card.images.main}
                alt="News top right"
                className="w-full h-full object-cover transition-all duration-150"
                style={secondStyle}
              />
            </div>
            {/* Bottom Left */}
            <div className="w-full h-full overflow-hidden relative">
              <img
                src={card.images.third || card.images.main}
                alt="News bottom left"
                className="w-full h-full object-cover transition-all duration-150"
                style={thirdStyle}
              />
            </div>
            {/* Bottom Right */}
            <div className="w-full h-full overflow-hidden relative">
              <img
                src={card.images.fourth || card.images.second || card.images.main}
                alt="News bottom right"
                className="w-full h-full object-cover transition-all duration-150"
                style={fourthStyle}
              />
            </div>
          </div>
        )}

        {/* Layout 5: Round Circle Image (Background + Inset circular portrait + Red 3D Curved Arrow) */}
        {card.layout === 'inset-circle' && (
          <div className="relative w-full h-full overflow-hidden">
            <img
              src={card.images.main}
              alt="News main background"
              className="w-full h-full object-cover transition-all duration-150"
              style={mainStyle}
            />

            {/* Inset Circle Photo with Red Curved Pointer Arrow */}
            {card.images.insetCircle && (
              <div
                className="absolute z-15 pointer-events-none"
                style={{
                  left: `${card.insetPosition.x}%`,
                  top: `${card.insetPosition.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {/* Circular cutout with thick white border & intense drop shadow */}
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full border-[5px] border-white shadow-[0_16px_40px_rgba(0,0,0,0.95)] overflow-hidden bg-neutral-800 shrink-0 ring-2 ring-black/40">
                  <img
                    src={card.images.insetCircle}
                    alt="Inset portrait"
                    className="w-full h-full object-cover transition-all duration-150"
                    style={insetCircleStyle}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Optional user-controlled dark overlay */}
        {card.darkOverlayOpacity > 0 && (
          <div
            className="absolute inset-0 bg-black pointer-events-none"
            style={{ opacity: card.darkOverlayOpacity }}
          />
        )}

        {/* Exclusive "⚡ सुपर ब्रेकिंग" subtle watermark across photo area (15% opacity) */}
        {card.showSuperBreakingWatermark && (
          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden flex flex-col justify-around select-none">
            <div className="w-[200%] -ml-[50%] flex flex-col gap-8 sm:gap-11 -rotate-20">
              {[...Array(6)].map((_, rIdx) => (
                <div
                  key={rIdx}
                  className="flex whitespace-nowrap gap-12 sm:gap-16 font-black tracking-widest font-['Baloo_2']"
                  style={{
                    color: `rgba(255, 255, 255, ${card.breakingWatermarkOpacity ?? 0.15})`,
                    textShadow: '0 1px 2px rgba(0,0,0,0.45)',
                    fontSize: '15px',
                  }}
                >
                  {[...Array(8)].map((_, cIdx) => (
                    <span key={cIdx} className="flex items-center gap-1.5 shrink-0">
                      {card.breakingWatermarkText || '⚡ सुपर ब्रेकिंग'}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. THEME HEADER JACKET */}
      {card.frameDesign === 'jacket-investigation' ? (
        <div className="absolute top-0 inset-x-0 z-20 pointer-events-none">
          <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-amber-950 text-white px-4 py-2 flex items-center justify-between shadow-xl border-b-2 border-yellow-500">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500 text-neutral-950 text-xs font-black px-2 py-0.5 rounded shadow">
                🔍 विशेष पड़ताल
              </span>
              <span className="text-xs sm:text-sm font-black tracking-wide">
                {card.investigationCaseNumber || 'INVESTIGATION REPORT'}
              </span>
            </div>
            <span className="text-[10px] font-bold text-amber-400 font-mono tracking-wider">
              EXCLUSIVE
            </span>
          </div>
        </div>
      ) : card.frameDesign === 'custom-png' ? (
        !card.hideDefaultHeaderInCustomFrame && (
          <HeaderGraphic
            customHeaderPng={card.customHeaderPng}
            brandTagline={card.brandTagline}
            brandName={card.brandName}
            customLogoUrl={card.customLogoUrl}
          />
        )
      ) : (
        /* jacket-original, jacket-breaking-red & jacket-quote all use the official brand header */
        <HeaderGraphic
          customHeaderPng={card.customHeaderPng}
          brandTagline={card.brandTagline}
          brandName={card.brandName}
          customLogoUrl={card.customLogoUrl}
        />
      )}

      {/* Double Golden Borders for Quote Template (IMAGE NEWS - TEAM (2).png) */}
      {card.frameDesign === 'jacket-quote' && (
        <div className="absolute inset-0 pointer-events-none z-25 p-2 sm:p-2.5 flex flex-col justify-between">
          <div className="w-full h-full border-[2.5px] border-[#FFE600] p-1 rounded-sm">
            <div className="w-full h-full border-[1.5px] border-dashed border-[#FFE600] rounded-sm" />
          </div>
        </div>
      )}

      {/* Optional Full Frame Overlay PNG - ONLY active when custom-png frame is selected */}
      {card.frameDesign === 'custom-png' && card.customFrameOverlayPng && (
        <img
          src={card.customFrameOverlayPng}
          alt="Frame Overlay"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-25"
        />
      )}

      {/* 2B. AI GENERATED Watermark: Vertical along Left Wall, Rotated 90°, Low Opacity */}
      {card.showAiGenerated && (
        <div
          className="absolute left-1.5 sm:left-2 top-[44%] -translate-y-1/2 pointer-events-none z-25 flex items-center justify-center select-none"
          style={{ width: '28px', height: '130px' }}
        >
          <div className="absolute -rotate-90 whitespace-nowrap bg-black/60 backdrop-blur-[2px] border border-white/25 px-3.5 py-1 rounded-sm shadow-md flex items-center justify-center">
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-white/85 px-1.5 inline-block">
              {card.aiGeneratedText || 'AI GENERATED'}
            </span>
          </div>
        </div>
      )}

      {/* 3. BOTTOM SECTION: SUPER BREAKING JACKET vs QUOTE vs STANDARD ORIGINAL */}
      {card.frameDesign === 'jacket-breaking-red' ? (
        /* ================= SUPER BREAKING JACKET LAYOUT ================= */
        <div className="absolute bottom-0 inset-x-0 z-20 flex flex-col justify-end">
          {/* A. Location & Callout Tag floating ABOVE the Breaking News ribbon */}
          <div className="flex items-center justify-between px-4 sm:px-6 mb-2 pointer-events-none">
            {/* Location Badge (Left) */}
            {card.location ? (
              <div className="bg-red-600 border border-red-500/90 text-white rounded-md px-2.5 py-1 flex items-center gap-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
                <MapPin className="w-3 h-3 text-white fill-white shrink-0" />
                <span className="font-black text-[11px] sm:text-xs font-['Baloo_2'] tracking-wide">
                  {card.location}
                </span>
              </div>
            ) : (
              <div />
            )}

            {/* Callout Tag (Right) */}
            {card.showCallout && (
              <div className="bg-white border-2 border-yellow-400 rounded-md px-3 py-0.5 sm:py-1 shadow-[0_4px_12px_rgba(0,0,0,0.6)] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse shrink-0" />
                <span className="text-neutral-950 font-black text-[11px] sm:text-xs font-['Baloo_2']">
                  {card.calloutTag.replace('🔴', '').trim() || 'पूरी खबर डिस्क्रिप्शन में'}
                </span>
              </div>
            )}
          </div>

          {/* B. BREAKING NEWS Ribbon (Centered, 70% width, half-in half-out of white box) */}
          <div className="relative w-full z-25 flex justify-center items-center select-none -mb-2.5 px-6">
            <img
              src={card.customBreakingRibbonPng || '/assets/breaking_news_ribbon.svg'}
              alt="BREAKING NEWS"
              className="h-auto object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.30)] transition-all"
              style={{
                width: '70%',
                maxWidth: '440px',
              }}
            />
          </div>

          {/* Wrapper for Bottom White Headline Plate + Footer (Measured by bottomPlateRef) */}
          <div ref={bottomPlateRef} className="w-full flex flex-col z-20">
            {/* C. Solid Pure White Background with Fixed Space for 2-3 Line Headline */}
            <div
              className="bg-white pb-3 shadow-xl min-h-[96px] sm:min-h-[114px] flex flex-col justify-center border-t border-neutral-200"
              style={{
                paddingLeft: `${effectivePaddingX}px`,
                paddingRight: `${effectivePaddingX}px`,
                paddingTop: '34px',
              }}
            >
              <h1
                className={`font-black tracking-normal leading-[1.34] font-['Baloo_2'] text-[#0A0A0A] ${
                  card.headlineAlign === 'center'
                    ? 'text-center'
                    : card.headlineAlign === 'left'
                    ? 'text-left'
                    : 'text-center sm:text-left'
                }`}
                style={{
                  fontSize: `${effectivePreviewFontSize}px`,
                }}
              >
                {renderFormattedHeadline()}
              </h1>
            </div>

            {/* D. Yellow Footer Graphic */}
            <FooterGraphic
              socialHandle={card.socialHandle}
              whatsappNumber={card.whatsappNumber}
              customFooterPng={card.customFooterPng}
            />
          </div>
        </div>
      ) : card.frameDesign === 'jacket-quote' ? (
        /* ================= QUOTE (बयान) JACKET LAYOUT ================= */
        <div className="absolute bottom-0 inset-x-0 z-20 flex flex-col justify-end pt-4 pb-3 sm:pb-4 px-3 sm:px-5 bg-gradient-to-t from-black via-black via-75% to-transparent">
          {/* A. Top Quote Line & Yellow Badge “ */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
            <div className="h-[2px] flex-1 bg-[#FFE600] max-w-[120px]" />
            <div className="bg-[#FFE600] text-black px-2 py-0.5 rounded font-black text-sm sm:text-base flex items-center justify-center shadow">
              “
            </div>
            <div className="h-[2px] flex-1 bg-[#FFE600] max-w-[120px]" />
          </div>

          {/* B. 2-3 Line Headline / Statement Quote */}
          <div className="px-2 py-1 text-center">
            <h1
              className="font-black tracking-normal leading-[1.38] font-['Baloo_2'] text-center text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
              style={{
                fontSize: `${effectivePreviewFontSize}px`,
              }}
            >
              {renderFormattedHeadline()}
            </h1>
          </div>

          {/* C. Bottom Quote Line & Yellow Badge ” */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mt-2 mb-1.5">
            <div className="h-[2px] flex-1 bg-[#FFE600] max-w-[120px]" />
            <div className="bg-[#FFE600] text-black px-2 py-0.5 rounded font-black text-sm sm:text-base flex items-center justify-center shadow">
              ”
            </div>
            <div className="h-[2px] flex-1 bg-[#FFE600] max-w-[120px]" />
          </div>

          {/* D. Speaker Name & Designation (Single Line centered) */}
          <div className="text-center text-white font-black text-xs sm:text-sm font-['Baloo_2'] mb-3 tracking-wide drop-shadow-sm">
            {card.speakerName || 'अनिरुद्धाचार्य महाराज, कथावाचक'}
          </div>

          {/* E. Dedicated Quote Footer Capsule Pill */}
          <div className="w-full flex justify-center pb-1">
            <div className="bg-black border border-white/90 rounded-full px-2 sm:px-3 py-1 flex items-center gap-1.5 sm:gap-2.5 shadow-lg max-w-[95%]">
              <div className="bg-red-600 text-white text-[9px] sm:text-[10px] font-black px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full whitespace-nowrap shadow">
                WATCH NOW  ▶
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 text-[8px] sm:text-[9px]">
                <span className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold text-[8px]">f</span>
                <span className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-[#E1306C] text-white flex items-center justify-center font-bold text-[8px]">📷</span>
                <span className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-[#FF0000] text-white flex items-center justify-center font-bold text-[8px]">▶</span>
                <span className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-[#111111] border border-white/40 text-white flex items-center justify-center font-bold text-[8px]">𝕏</span>
                <span className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-[#0A66C2] text-white flex items-center justify-center font-bold text-[8px]">in</span>
                <span className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-[#FF8C00] text-white flex items-center justify-center font-bold text-[8px]">P</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= STANDARD ORIGINAL JACKET LAYOUT ================= */
        <div className="absolute bottom-0 inset-x-0 z-20 flex flex-col justify-end pt-8 pb-0 bg-gradient-to-t from-black via-black/95 via-50% to-transparent">
          {/* Top Strip above Caption: Location & "🔴 पूरी खबर डिस्क्रिप्शन में" */}
          <div className="flex items-center justify-between px-4 sm:px-6 mb-3 sm:mb-4">
            {/* Location Badge (Placed at top space above headline) */}
            {card.location ? (
              <div className="bg-red-600 border border-red-500/80 text-white rounded-md px-2.5 py-1 flex items-center gap-1.5 shadow-md">
                <MapPin className="w-3 h-3 text-white fill-white shrink-0" />
                <span className="font-black text-[11px] sm:text-xs font-['Baloo_2'] tracking-wide">
                  {card.location}
                </span>
              </div>
            ) : (
              <div />
            )}

            {/* Callout Tag: "🔴 पूरी खबर डिस्क्रिप्शन में" */}
            {card.showCallout && (
              <div className="bg-white border-2 border-yellow-400 rounded-md px-3 py-0.5 sm:py-1 shadow-md flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse shrink-0" />
                <span className="text-neutral-950 font-black text-[11px] sm:text-xs font-['Baloo_2']">
                  {card.calloutTag.replace('🔴', '').trim() || 'पूरी खबर डिस्क्रिप्शन में'}
                </span>
              </div>
            )}
          </div>

          {/* 3-Line News Headline Caption in Baloo 2 font - Justified (Default) or Center or Left */}
          <div
            className="pt-1.5 pb-2.5 sm:pb-3 overflow-visible"
            style={{
              paddingLeft: `${effectivePaddingX}px`,
              paddingRight: `${effectivePaddingX}px`,
            }}
          >
            <h1
              className={`font-black tracking-normal leading-[1.38] font-['Baloo_2'] overflow-visible drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] ${
                card.headlineAlign === 'center'
                  ? 'text-center'
                  : card.headlineAlign === 'left'
                  ? 'text-left'
                  : 'text-justify'
              }`}
              style={{
                fontSize: `${effectivePreviewFontSize}px`,
                textJustify: 'inter-word',
                textAlignLast:
                  card.headlineAlign === 'center'
                    ? 'center'
                    : card.headlineAlign === 'left'
                    ? 'left'
                    : 'justify',
              }}
            >
              {renderFormattedHeadline()}
            </h1>
          </div>

          {/* 4. PERMANENT THEME FOOTER BAR (Matching Footer.png) */}
          {!(card.frameDesign === 'custom-png' && card.hideDefaultFooterInCustomFrame) && (
            <FooterGraphic
              socialHandle={card.socialHandle}
              whatsappNumber={card.whatsappNumber}
              customFooterPng={card.customFooterPng}
            />
          )}
        </div>
      )}
    </div>
  );
};
