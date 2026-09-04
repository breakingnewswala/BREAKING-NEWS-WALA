import React from 'react';
import { NewsCardData } from '../types';
import { MapPin } from 'lucide-react';
import { HeaderGraphic } from './HeaderGraphic';
import { FooterGraphic } from './FooterGraphic';

interface CardPreviewProps {
  card: NewsCardData;
  scale?: number;
}

export const CardPreview: React.FC<CardPreviewProps> = ({ card, scale = 1 }) => {
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

      if (parts.length === 0) {
        return <span className="text-white">{textChunk}</span>;
      }

      return parts.map((part, idx) => (
        <span
          key={idx}
          style={{
            color: part.isYellow ? card.highlightColor || '#FFE600' : '#FFFFFF',
            textShadow: '0 2px 8px rgba(0,0,0,0.9), 0 4px 16px rgba(0,0,0,0.9)',
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
            <span key={lIdx} className="block leading-[1.38]">
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
      id="news-card-container"
      className={`relative w-full max-w-[540px] mx-auto overflow-hidden rounded-2xl shadow-2xl bg-neutral-900 select-none ${aspectClass}`}
      style={{
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
      }}
    >
      {/* 1. BACKGROUND PHOTOS ACCORDING TO USER'S SELECTED LAYOUT */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-neutral-950">
        {/* Layout 1: Single Image (Clear, Bright, Prominent) */}
        {(card.layout === 'single' || !card.layout) && (
          <div className="w-full h-full overflow-hidden relative">
            <img
              src={card.images.main}
              alt="News background"
              className="w-full h-full object-cover transition-all duration-150"
              style={mainStyle}
              crossOrigin="anonymous"
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
              crossOrigin="anonymous"
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
                crossOrigin="anonymous"
              />
            </div>
            {/* Bottom Frame: 65% Remaining Height with custom crop support */}
            <div className="w-full h-[65%] overflow-hidden relative">
              <img
                src={card.images.second || card.images.main}
                alt="News bottom (65%)"
                className="w-full h-full object-cover transition-all duration-150"
                style={secondStyle}
                crossOrigin="anonymous"
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
                crossOrigin="anonymous"
              />
            </div>
            {/* Bottom Frame: 50% Height */}
            <div className="w-full h-[50%] overflow-hidden relative">
              <img
                src={card.images.second || card.images.main}
                alt="News bottom (50%)"
                className="w-full h-full object-cover transition-all duration-150"
                style={secondStyle}
                crossOrigin="anonymous"
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
                crossOrigin="anonymous"
              />
            </div>
            <div className="w-full h-full overflow-hidden relative">
              <img
                src={card.images.second || card.images.main}
                alt="News right (50%)"
                className="w-full h-full object-cover transition-all duration-150"
                style={secondStyle}
                crossOrigin="anonymous"
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
                  crossOrigin="anonymous"
                />
              </div>
              <div className="w-full h-full overflow-hidden relative">
                <img
                  src={card.images.second || card.images.main}
                  alt="News top right"
                  className="w-full h-full object-cover transition-all duration-150"
                  style={secondStyle}
                  crossOrigin="anonymous"
                />
              </div>
            </div>
            <div className="w-full h-[48%] overflow-hidden relative">
              <img
                src={card.images.third || card.images.main}
                alt="News bottom wide"
                className="w-full h-full object-cover transition-all duration-150"
                style={thirdStyle}
                crossOrigin="anonymous"
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
                crossOrigin="anonymous"
              />
            </div>
            <div className="w-full h-[52%] grid grid-cols-2 gap-0.5">
              <div className="w-full h-full overflow-hidden relative">
                <img
                  src={card.images.second || card.images.main}
                  alt="News bottom left"
                  className="w-full h-full object-cover transition-all duration-150"
                  style={secondStyle}
                  crossOrigin="anonymous"
                />
              </div>
              <div className="w-full h-full overflow-hidden relative">
                <img
                  src={card.images.third || card.images.main}
                  alt="News bottom right"
                  className="w-full h-full object-cover transition-all duration-150"
                  style={thirdStyle}
                  crossOrigin="anonymous"
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
                crossOrigin="anonymous"
              />
            </div>
            {/* Top Right */}
            <div className="w-full h-full overflow-hidden relative">
              <img
                src={card.images.second || card.images.main}
                alt="News top right"
                className="w-full h-full object-cover transition-all duration-150"
                style={secondStyle}
                crossOrigin="anonymous"
              />
            </div>
            {/* Bottom Left */}
            <div className="w-full h-full overflow-hidden relative">
              <img
                src={card.images.third || card.images.main}
                alt="News bottom left"
                className="w-full h-full object-cover transition-all duration-150"
                style={thirdStyle}
                crossOrigin="anonymous"
              />
            </div>
            {/* Bottom Right */}
            <div className="w-full h-full overflow-hidden relative">
              <img
                src={card.images.fourth || card.images.second || card.images.main}
                alt="News bottom right"
                className="w-full h-full object-cover transition-all duration-150"
                style={fourthStyle}
                crossOrigin="anonymous"
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
              crossOrigin="anonymous"
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
                    crossOrigin="anonymous"
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
      </div>

      {/* 2. THEME HEADER JACKET */}
      {/* If an on-hold header style is chosen, user explicitly requested to wait for upcoming custom jackets */}
      {card.frameDesign === 'jacket-breaking-red' ||
      card.frameDesign === 'jacket-investigation' ||
      card.frameDesign === 'jacket-quote' ? (
        <div className="absolute top-3 inset-x-4 z-20 pointer-events-none flex justify-center">
          <div className="bg-black/70 backdrop-blur-sm border border-yellow-400/60 text-yellow-300 text-[11px] sm:text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span>
              {card.frameDesign === 'jacket-breaking-red'
                ? 'सुपर ब्रेकिंग'
                : card.frameDesign === 'jacket-investigation'
                ? 'विशेष पड़ताल'
                : 'बयान / कोटेशन'}{' '}
              की नई जैकेट प्रतीक्षित है (अपलोड होने पर जुड़ेगी)
            </span>
          </div>
        </div>
      ) : (
        <HeaderGraphic
          customHeaderPng={card.customHeaderPng}
          brandTagline={card.brandTagline}
        />
      )}

      {/* Optional Full Frame Overlay PNG */}
      {card.customFrameOverlayPng && (
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
          style={{ width: '20px', height: '110px' }}
        >
          <div className="absolute -rotate-90 whitespace-nowrap bg-black/50 backdrop-blur-[2px] border border-white/20 px-2 py-0.5 rounded-sm shadow-sm flex items-center">
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.25em] text-white/75">
              {card.aiGeneratedText || 'AI GENERATED'}
            </span>
          </div>
        </div>
      )}

      {/* 3. PERMANENT FIXED SPACE AT BOTTOM: 3-LINE CAPTION & THEME FOOTER */}
      {/* Black fade starts smoothly behind caption so image is completely visible above */}
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
        <div className="px-5 sm:px-8 pt-1.5 pb-2.5 sm:pb-3 overflow-visible">
          <h1
            className={`font-black tracking-normal leading-[1.38] font-['Baloo_2'] overflow-visible drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] ${
              card.headlineAlign === 'center'
                ? 'text-center'
                : card.headlineAlign === 'left'
                ? 'text-left'
                : 'text-justify'
            }`}
            style={{
              fontSize: `${card.headlineFontSize || 30}px`,
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
        <FooterGraphic
          socialHandle={card.socialHandle}
          whatsappNumber={card.whatsappNumber}
          customFooterPng={card.customFooterPng}
        />
      </div>
    </div>
  );
};
