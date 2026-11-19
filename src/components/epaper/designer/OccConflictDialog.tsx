import React from 'react';
import { AlertTriangle, RefreshCw, Zap, X } from 'lucide-react';

export interface OccConflictDialogProps {
  isOpen: boolean;
  currentVersion: number;
  remoteVersion?: number;
  onReloadRemote: () => void;
  onForceOverwrite: () => void;
  onCancel: () => void;
}

export const OccConflictDialog: React.FC<OccConflictDialogProps> = ({
  isOpen,
  currentVersion,
  remoteVersion,
  onReloadRemote,
  onForceOverwrite,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-amber-200 shadow-2xl p-6 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                संस्करण विरोध (OCC Concurrency Conflict)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                HTTP 409: Concurrent Edit Detected
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200/80 text-sm text-amber-950 mb-5 leading-relaxed">
          <p className="font-semibold mb-1">
            ⚠️ यह पृष्ठ किसी अन्य संपादक या प्रक्रिया द्वारा संशोधित किया गया है।
          </p>
          <p className="text-xs text-amber-800">
            स्थानीय संस्करण: <span className="font-mono font-bold">v{currentVersion}</span> • सर्वर का वर्तमान संस्करण:{' '}
            <span className="font-mono font-bold">v{remoteVersion || currentVersion + 1}</span>
          </p>
          <p className="text-xs text-amber-900 mt-2">
            डेटा की शुद्धता सुनिश्चित करने के लिए, आप या तो सर्वर से ताज़ा डेटा पुनः लोड कर सकते हैं या अपने बदलावों को अंतिम संस्करण पर अधिलेखित (Force Overwrite) कर सकते हैं।
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            रद्द करें (Cancel)
          </button>

          <button
            onClick={onReloadRemote}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-100 border border-slate-300 hover:bg-slate-200 text-sm font-bold text-slate-800 flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-slate-600" />
            ताज़ा संस्करण लोड करें (Reload)
          </button>

          <button
            onClick={onForceOverwrite}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-sm font-bold text-white shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Zap className="w-4 h-4" />
            अधिलेखित करें (Force Overwrite)
          </button>
        </div>
      </div>
    </div>
  );
};
