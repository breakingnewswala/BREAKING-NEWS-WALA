import React from 'react';
import { Sliders } from 'lucide-react';

export interface StepItem {
  step: number;
  id: string;
  label: string;
  icon: string;
}

export const DEFAULT_STEPS: StepItem[] = [
  { step: 1, id: 'step-frame', label: '1. टेम्पलेट', icon: '🖼️' },
  { step: 2, id: 'step-ai', label: '2. AI टूल्स', icon: '✨' },
  { step: 3, id: 'step-header-footer', label: '3. हेडर/फुटर', icon: '🎨' },
  { step: 4, id: 'step-layout', label: '4. फोटो लेआउट', icon: '📷' },
  { step: 5, id: 'step-headline', label: '5. हेडलाइन', icon: '✍️' },
  { step: 6, id: 'step-location-date', label: '6. जिला व डेट', icon: '📍' },
];

interface StepNavigatorProps {
  activeStep: number;
  onStepChange: (step: number) => void;
  mobileViewMode?: 'steps' | 'all';
  onToggleMobileViewMode?: (mode: 'steps' | 'all') => void;
  className?: string;
  compact?: boolean;
  steps?: StepItem[];
}

export const StepNavigator: React.FC<StepNavigatorProps> = ({
  activeStep,
  onStepChange,
  mobileViewMode = 'steps',
  onToggleMobileViewMode,
  className = '',
  compact = false,
  steps = DEFAULT_STEPS,
}) => {
  const handleStepClick = (s: StepItem) => {
    onStepChange(s.step);
    // Smooth scroll to step anchor
    const el = document.getElementById(s.id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div
      className={`w-full bg-neutral-900/98 backdrop-blur-md border border-neutral-800 rounded-xl ${
        compact ? 'p-1.5 sm:p-2' : 'p-2 sm:p-2.5'
      } shadow-xl ${className}`}
    >
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <span className="text-[10px] sm:text-[11px] font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sliders className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-400" />
          <span>
            एडिटर स्टेप्स ({activeStep} / {steps.length})
          </span>
        </span>

        {/* Mobile view mode toggle if callback provided */}
        {onToggleMobileViewMode && (
          <div className="flex items-center gap-0.5 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-[10px]">
            <button
              type="button"
              onClick={() => onToggleMobileViewMode('steps')}
              className={`px-2 py-0.5 sm:py-1 rounded font-bold transition-all cursor-pointer ${
                mobileViewMode === 'steps'
                  ? 'bg-yellow-400 text-neutral-950 shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              ↔️ स्लाइड
            </button>
            <button
              type="button"
              onClick={() => onToggleMobileViewMode('all')}
              className={`px-2 py-0.5 sm:py-1 rounded font-bold transition-all cursor-pointer ${
                mobileViewMode === 'all'
                  ? 'bg-yellow-400 text-neutral-950 shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              ↕️ सभी
            </button>
          </div>
        )}
      </div>

      {/* Horizontal Scrollable Step Pills */}
      <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
        {steps.map((s) => (
          <button
            key={s.step}
            type="button"
            onClick={() => handleStepClick(s)}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg whitespace-nowrap font-bold flex items-center gap-1 sm:gap-1.5 shrink-0 transition-all cursor-pointer text-[11px] sm:text-xs ${
              activeStep === s.step
                ? 'bg-yellow-400 text-neutral-950 shadow-md ring-1 ring-yellow-300'
                : 'bg-neutral-950 text-neutral-300 hover:bg-neutral-800 border border-neutral-800'
            }`}
          >
            <span>{s.icon}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
