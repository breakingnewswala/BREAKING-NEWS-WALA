import React, { useState } from 'react';
import { EpaperEditionDoc, EpaperEditionStatus } from '../../types';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Archive,
  FileText,
  Layout,
  Eye,
  Check,
  RefreshCw,
} from 'lucide-react';

export interface EpaperStatusPipelineProps {
  edition: EpaperEditionDoc;
  currentRole?: string;
  onStatusChange?: (nextStatus: EpaperEditionStatus, remarks?: string) => Promise<void> | void;
  isCompact?: boolean;
}

export interface PipelineStageConfig {
  key: EpaperEditionStatus;
  labelHi: string;
  labelEn: string;
  description: string;
  colorHex: string;
  bgLight: string;
  textColor: string;
  borderColor: string;
  icon: React.ElementType;
  requiresChiefEditor?: boolean;
}

export const PIPELINE_STAGES: PipelineStageConfig[] = [
  {
    key: 'DRAFT',
    labelHi: 'प्रारूप',
    labelEn: 'Draft',
    description: 'आरंभिक पृष्ठ संरचना एवं रिक्त खाके',
    colorHex: '#64748B',
    bgLight: 'bg-slate-50',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-300',
    icon: FileText,
  },
  {
    key: 'EDITORIAL_REVIEW',
    labelHi: 'संपादकीय समीक्षा',
    labelEn: 'Editorial Review',
    description: 'समाचार चयन एवं प्राथमिक क्यूरेशन',
    colorHex: '#D97706',
    bgLight: 'bg-amber-50',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-300',
    icon: Eye,
  },
  {
    key: 'LAYOUT_IN_PROGRESS',
    labelHi: 'लेआउट प्रगति पर',
    labelEn: 'Layout in Progress',
    description: 'ब्रॉडशीट कैनवास डिज़ाइन एवं संयोजन',
    colorHex: '#2563EB',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-300',
    icon: Layout,
  },
  {
    key: 'QUALITY_CHECK',
    labelHi: 'गुणवत्ता जांच',
    labelEn: 'Quality Check',
    description: 'प्रीफ़्लाइट डायग्नोस्टिक्स एवं सत्यापन',
    colorHex: '#4F46E5',
    bgLight: 'bg-indigo-50',
    textColor: 'text-indigo-800',
    borderColor: 'border-indigo-300',
    icon: AlertTriangle,
  },
  {
    key: 'APPROVED',
    labelHi: 'स्वीकृत',
    labelEn: 'Approved',
    description: 'मुख्य संपादक द्वारा अंतिम अनुमोदन',
    colorHex: '#059669',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-800',
    borderColor: 'border-emerald-300',
    icon: ShieldCheck,
    requiresChiefEditor: true,
  },
  {
    key: 'PUBLISHED',
    labelHi: 'प्रकाशित',
    labelEn: 'Published',
    description: 'सार्वजनिक पाठकों हेतु लाइव ब्रॉडशीट',
    colorHex: '#16A34A',
    bgLight: 'bg-green-50',
    textColor: 'text-green-800',
    borderColor: 'border-green-400',
    icon: CheckCircle2,
    requiresChiefEditor: true,
  },
  {
    key: 'ARCHIVED',
    labelHi: 'अभिलेखागार',
    labelEn: 'Archived',
    description: 'ऐतिहासिक डिजिटल पुरालेख सुरक्षित',
    colorHex: '#475569',
    bgLight: 'bg-slate-100',
    textColor: 'text-slate-800',
    borderColor: 'border-slate-400',
    icon: Archive,
  },
];

export const EpaperStatusPipeline: React.FC<EpaperStatusPipelineProps> = ({
  edition,
  currentRole = 'EDITOR',
  onStatusChange,
  isCompact = false,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [targetStage, setTargetStage] = useState<EpaperEditionStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentIndex = PIPELINE_STAGES.findIndex((s) => s.key === edition.status);
  const normalizedRole = String(currentRole).toUpperCase().replace(/^ROLE_/, '');
  const isChiefOrAdmin = ['MASTER_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'CHIEF_EDITOR'].includes(normalizedRole);

  const nextStageConfig = currentIndex >= 0 && currentIndex < PIPELINE_STAGES.length - 1
    ? PIPELINE_STAGES[currentIndex + 1]
    : null;

  const handleAdvance = async (stageToSet?: EpaperEditionStatus) => {
    const nextStatus = stageToSet || (nextStageConfig ? nextStageConfig.key : null);
    if (!nextStatus) return;

    const targetConfig = PIPELINE_STAGES.find((s) => s.key === nextStatus);
    if (targetConfig?.requiresChiefEditor && !isChiefOrAdmin) {
      setErrorMessage('संस्करण को स्वीकृत अथवा प्रकाशित करने हेतु मुख्य संपादक अथवा मास्टर एडमिन अधिकार अनिवार्य हैं।');
      return;
    }

    setErrorMessage(null);
    setIsUpdating(true);
    try {
      if (onStatusChange) {
        await onStatusChange(nextStatus, remarks);
      }
      setRemarks('');
      setTargetStage(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'स्थिति अद्यतन विफल रहा');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isCompact) {
    const currentConfig = PIPELINE_STAGES[currentIndex] || PIPELINE_STAGES[0];
    return (
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${currentConfig.bgLight} ${currentConfig.textColor} ${currentConfig.borderColor}`}
        >
          <currentConfig.icon className="w-3.5 h-3.5" />
          <span>{currentConfig.labelHi}</span>
        </span>
        {nextStageConfig && (
          <button
            onClick={() => handleAdvance(nextStageConfig.key)}
            disabled={isUpdating}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5"
            title={`स्थिति आगे बढ़ाएं: ${nextStageConfig.labelHi}`}
          >
            <span>{nextStageConfig.labelHi}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="text-xs text-slate-500 font-medium">प्रकाशन जीवनचक्र (Publication Lifecycle)</div>
          <div className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>संस्करण स्थिति:</span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border ${
                PIPELINE_STAGES[currentIndex]?.bgLight || 'bg-slate-100'
              } ${PIPELINE_STAGES[currentIndex]?.textColor || 'text-slate-800'} ${
                PIPELINE_STAGES[currentIndex]?.borderColor || 'border-slate-300'
              }`}
            >
              {PIPELINE_STAGES[currentIndex]?.labelHi} ({PIPELINE_STAGES[currentIndex]?.labelEn})
            </span>
          </div>
        </div>
        <div className="text-xs text-slate-500">
          संस्करण: <span className="font-mono font-bold text-slate-700">v{edition.version || 1}</span>
          {edition.publishedAt && (
            <span className="ml-2 text-emerald-700 font-medium">
              • प्रकाशित: {new Date(edition.publishedAt).toLocaleDateString('hi-IN')}
            </span>
          )}
        </div>
      </div>

      {/* 7-Stage Horizontal Stepper */}
      <div className="relative overflow-x-auto py-2">
        <div className="flex items-center justify-between min-w-[700px] relative">
          {/* Connecting Line */}
          <div className="absolute top-4 left-6 right-6 h-1 bg-slate-200 -z-0" />
          <div
            className="absolute top-4 left-6 h-1 bg-emerald-500 transition-all duration-300 -z-0"
            style={{
              width: `${(Math.max(0, currentIndex) / (PIPELINE_STAGES.length - 1)) * 100}%`,
            }}
          />

          {PIPELINE_STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isUpcoming = idx > currentIndex;
            const StageIcon = stage.icon;

            return (
              <div
                key={stage.key}
                onClick={() => {
                  if (idx !== currentIndex) {
                    setTargetStage(stage.key);
                  }
                }}
                className={`flex flex-col items-center cursor-pointer group px-1 relative z-10`}
                title={`${stage.labelHi} - ${stage.description}`}
              >
                {/* Step Circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 scale-110'
                      : 'bg-white border-2 border-slate-300 text-slate-400 group-hover:border-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <StageIcon className="w-4 h-4" />
                  )}
                </div>

                {/* Step Label */}
                <div className="mt-2 text-center">
                  <div
                    className={`text-xs font-bold leading-tight ${
                      isCurrent
                        ? 'text-blue-700'
                        : isCompleted
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {stage.labelHi}
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans">{stage.labelEn}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
        <div className="flex-1 min-w-[240px]">
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="संपादकीय टिप्पणी दर्ज करें (वैकल्पिक)..."
            className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {targetStage && targetStage !== edition.status && (
            <button
              onClick={() => handleAdvance(targetStage)}
              disabled={isUpdating}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 transition-colors"
            >
              {isUpdating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{PIPELINE_STAGES.find((s) => s.key === targetStage)?.labelHi} पर बदलें</span>
            </button>
          )}

          {nextStageConfig && (
            <button
              onClick={() => handleAdvance(nextStageConfig.key)}
              disabled={isUpdating}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              {isUpdating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>अगला चरण: {nextStageConfig.labelHi}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {edition.status === 'PUBLISHED' && (
            <button
              onClick={() => handleAdvance('ARCHIVED')}
              disabled={isUpdating}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>आर्काइव करें</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
