/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Authoritative E-Paper Quality Checker & Publishing Assurance Dashboard
 * File: src/components/epaper/EpaperQualityDashboard.tsx
 *
 * Implements Step 10:
 * 1. Six diagnostic validation categories (Structure, Editorial, Layout, Ads, Metadata, Technical/Export)
 * 2. Visual Quality Score meter with transparent formula breakdown
 * 3. Filterable issue explorer with page-level deep-linking to Page Designer
 * 4. Controlled Editorial Exception workflow for Warnings/Errors with written justifications
 * 5. Multi-stage Human-in-the-Loop publishing pipeline:
 *    - Run Quality Scan (re-validates & clears staleness)
 *    - Final Editorial Approval (EDITOR / ADMIN)
 *    - Scheduled Publication (with IST time)
 *    - Immediate Publication (creates immutable version snapshot)
 *    - Post-Publication Correction (starts vX.0 revision draft while preserving original)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Info,
  RefreshCw,
  Calendar,
  Clock,
  Layers,
  FileCheck,
  Send,
  Eye,
  ArrowRight,
  Filter,
  Check,
  Search,
  Sparkles,
  Lock,
  ChevronRight,
  History,
  FileText,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import {
  EpaperEditionDoc,
  EpaperQualityCheckReport,
  EpaperQualityIssue,
  EpaperQualitySeverity,
  EpaperQualityCategory,
} from '../../types';

interface EpaperQualityDashboardProps {
  edition?: EpaperEditionDoc | null;
  editions?: EpaperEditionDoc[];
  currentRole?: string;
  onOpenDesigner?: (editionId: string, pageNumber: number) => void;
  onBack?: () => void;
  onEditionUpdated?: (updatedEdition: EpaperEditionDoc) => void;
}

const CATEGORY_LABELS: Record<string, { hi: string; icon: string }> = {
  STRUCTURE: { hi: 'संस्करण संरचना', icon: '📐' },
  EDITORIAL: { hi: 'संपादकीय गुणवत्ता', icon: '✍️' },
  LAYOUT: { hi: 'दृश्य एवं लेआउट', icon: '🖼️' },
  ADVERTISEMENT: { hi: 'विज्ञापन एवं प्रायोजन', icon: '📢' },
  METADATA: { hi: 'मेटाडेटा एवं साभार', icon: '🏷️' },
  EXPORT: { hi: 'तकनीकी एवं निर्यात', icon: '🖨️' },
};

const SEVERITY_COLORS: Record<EpaperQualitySeverity, { bg: string; text: string; border: string; label: string }> = {
  CRITICAL: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300', label: 'गंभीर (Critical)' },
  ERROR: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300', label: 'त्रुटि (Error)' },
  WARNING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', label: 'चेतावनी (Warning)' },
  INFO: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300', label: 'सूचना (Info)' },
};

export const EpaperQualityDashboard: React.FC<EpaperQualityDashboardProps> = ({
  edition: initialEdition,
  editions = [],
  currentRole = 'EDITOR',
  onOpenDesigner,
  onBack,
  onEditionUpdated,
}) => {
  const [selectedEditionId, setSelectedEditionId] = useState<string>(
    initialEdition?.id || (editions.length > 0 ? editions[0].id : '')
  );
  const [currentEdition, setCurrentEdition] = useState<EpaperEditionDoc | null>(initialEdition || null);
  const [report, setReport] = useState<EpaperQualityCheckReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [skipExportCheck, setSkipExportCheck] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [exceptionModalIssue, setExceptionModalIssue] = useState<EpaperQualityIssue | null>(null);
  const [exceptionReason, setExceptionReason] = useState<string>('');
  const [showApproveModal, setShowApproveModal] = useState<boolean>(false);
  const [approvalRemarks, setApprovalRemarks] = useState<string>('');
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [showCorrectionModal, setShowCorrectionModal] = useState<boolean>(false);
  const [correctionRemarks, setCorrectionRemarks] = useState<string>('');
  const [showPublishConfirmModal, setShowPublishConfirmModal] = useState<boolean>(false);

  // Load edition and quality report
  const loadEditionData = async (edId: string) => {
    if (!edId) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const ed = editions.find((e) => e.id === edId);
      if (ed) {
        setCurrentEdition(ed);
        if (ed.qualityCheckResult) {
          setReport(ed.qualityCheckResult);
        } else {
          // Auto-run initial evaluation
          const rep = await apiClient.epaper.runQualityCheck(edId, skipExportCheck);
          setReport(rep);
        }
      } else {
        const rep = await apiClient.epaper.runQualityCheck(edId, skipExportCheck);
        setReport(rep);
      }
    } catch (err: any) {
      console.error('गुणवत्ता रिपोर्ट लोड करने में त्रुटि:', err);
      setErrorMessage(err.message || 'गुणवत्ता रिपोर्ट प्राप्त करने में त्रुटि हुई');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEditionId) {
      loadEditionData(selectedEditionId);
    }
  }, [selectedEditionId]);

  const handleRunScan = async () => {
    if (!selectedEditionId) return;
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const rep = await apiClient.epaper.runQualityCheck(selectedEditionId, skipExportCheck);
      setReport(rep);
      setSuccessMessage('गुणवत्ता परीक्षण सफलतापूर्वक पूर्ण हुआ!');
      if (currentEdition) {
        const updated = { ...currentEdition, qualityCheckResult: rep, isQualityStale: false };
        setCurrentEdition(updated);
        onEditionUpdated?.(updated);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'परीक्षण चलाने में त्रुटि हुई');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantException = async () => {
    if (!exceptionModalIssue || !selectedEditionId) return;
    if (!exceptionReason || exceptionReason.trim().length < 5) {
      alert('कृपया अपवाद का वैध लिखित कारण दर्ज करें (न्यूनतम 5 अक्षर)');
      return;
    }
    setActionLoading(true);
    try {
      const res = await apiClient.epaper.grantQualityException(selectedEditionId, {
        issueId: exceptionModalIssue.id,
        reason: exceptionReason.trim(),
      });
      setReport(res.updatedReport);
      setSuccessMessage(`आपत्ति [${exceptionModalIssue.id}] हेतु संपादकीय अपवाद स्वीकृत किया गया।`);
      setExceptionModalIssue(null);
      setExceptionReason('');
    } catch (err: any) {
      alert(err.message || 'अपवाद प्रदान करने में त्रुटि हुई');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinalApproval = async () => {
    if (!selectedEditionId) return;
    setActionLoading(true);
    try {
      const res = await apiClient.epaper.approveEdition(selectedEditionId, {
        version: currentEdition?.version,
        remarks: approvalRemarks,
      });
      setCurrentEdition(res.edition);
      setReport(res.qualityReport);
      setShowApproveModal(false);
      setApprovalRemarks('');
      setSuccessMessage('संस्करण को सफलतापूर्वक अंतिम संपादकीय अनुमोदन (FINAL_APPROVED) प्रदान किया गया!');
      onEditionUpdated?.(res.edition);
    } catch (err: any) {
      alert(err.message || 'अंतिम अनुमोदन विफल रहा');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSchedulePublish = async () => {
    if (!selectedEditionId || !scheduledTime) {
      alert('कृपया प्रकाशन हेतु निर्धारित समय (IST) चुनें');
      return;
    }
    setActionLoading(true);
    try {
      const res = await apiClient.epaper.scheduleEdition(selectedEditionId, {
        scheduledPublishAtIst: scheduledTime,
        version: currentEdition?.version,
      });
      setCurrentEdition(res.edition);
      setShowScheduleModal(false);
      setScheduledTime('');
      setSuccessMessage(`संस्करण को ${scheduledTime} हेतु सफलतापूर्वक शेड्यूल किया गया!`);
      onEditionUpdated?.(res.edition);
    } catch (err: any) {
      alert(err.message || 'शेड्यूलिंग विफल रही');
    } finally {
      setActionLoading(false);
    }
  };

  const handleImmediatePublish = async () => {
    if (!selectedEditionId) return;
    setActionLoading(true);
    try {
      const res = await apiClient.epaper.publishEdition(selectedEditionId, currentEdition?.version);
      setCurrentEdition(res.edition);
      setShowPublishConfirmModal(false);
      setSuccessMessage(`संस्करण सफलतापूर्वक प्रकाशित हुआ! संस्करण स्नैपशॉट: ${res.snapshot?.versionTag || 'v1.0.0'}`);
      onEditionUpdated?.(res.edition);
    } catch (err: any) {
      alert(err.message || 'प्रकाशन विफल रहा');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePostPublicationCorrection = async () => {
    if (!selectedEditionId) return;
    setActionLoading(true);
    try {
      const res = await apiClient.epaper.createEditionCorrection(selectedEditionId, correctionRemarks);
      setCurrentEdition(res.edition);
      setShowCorrectionModal(false);
      setCorrectionRemarks('');
      setSuccessMessage(res.message || 'सुधार ड्राफ्ट सक्रिय किया गया!');
      onEditionUpdated?.(res.edition);
      // Run fresh scan on revision
      handleRunScan();
    } catch (err: any) {
      alert(err.message || 'संशोधन आरंभ करना विफल रहा');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered issues
  const filteredIssues = useMemo(() => {
    if (!report || !report.issues) return [];
    return report.issues.filter((issue) => {
      if (selectedSeverity !== 'ALL' && issue.severity !== selectedSeverity) return false;
      if (selectedCategory !== 'ALL' && issue.category !== selectedCategory) return false;
      if (selectedStatus !== 'ALL' && issue.resolutionStatus !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = issue.titleHi.toLowerCase().includes(q);
        const inDesc = issue.descriptionHi.toLowerCase().includes(q);
        const inCode = issue.code.toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inCode) return false;
      }
      return true;
    });
  }, [report, selectedSeverity, selectedCategory, selectedStatus, searchQuery]);

  const isPublished = currentEdition?.status === 'PUBLISHED';
  const isApproved = currentEdition?.status === 'FINAL_APPROVED' || currentEdition?.status === 'APPROVED';
  const isScheduled = currentEdition?.status === 'SCHEDULED';
  const isQualityStale = currentEdition?.isQualityStale || report?.isStale;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">ई-पेपर गुणवत्ता परीक्षक एवं प्रकाशन द्वार</h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  चरण 10
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                प्रकाशन-पूर्व स्वचालित 6-श्रेणी गुणवत्ता विश्लेषण, विसंगति निवारण एवं अपरिवर्तनीय अनुमोदन पाइपलाइन
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Edition Switcher */}
            {editions.length > 0 && (
              <select
                value={selectedEditionId}
                onChange={(e) => setSelectedEditionId(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {editions.map((ed) => (
                  <option key={ed.id} value={ed.id}>
                    {ed.title} ({ed.publicationDate}) — {ed.status}
                  </option>
                ))}
              </select>
            )}

            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={skipExportCheck}
                onChange={(e) => setSkipExportCheck(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>फास्ट स्कैन (निर्यात रेंडर छोड़ें)</span>
            </label>

            <button
              onClick={handleRunScan}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'स्कैन जारी...' : 'पुनः गुणवत्ता स्कैन चलाएं'}</span>
            </button>

            {onBack && (
              <button
                onClick={onBack}
                className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-all"
              >
                वापस
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Quality Staleness Alert Banner */}
        {isQualityStale && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>चेतावनी:</strong> पृष्ठ लेआउट अथवा समाचारों में नवीन बदलाव किए गए हैं। पूर्व गुणवत्ता रिपोर्ट पुरानी (Stale) हो चुकी है। प्रकाशन हेतु पुनः स्कैन अनिवार्य है।
              </span>
            </div>
            <button
              onClick={handleRunScan}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shrink-0"
            >
              अभी अपडेट करें
            </button>
          </div>
        )}
      </div>

      {/* Top Status & Metrics Grid */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Quality Score Meter */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">गुणवत्ता स्कोर</span>
              <span className="text-xs text-slate-400">बेस 100</span>
            </div>
            <div className="my-3 flex items-baseline gap-2">
              <span
                className={`text-4xl font-black ${
                  report.qualityScore >= 80
                    ? 'text-emerald-600'
                    : report.qualityScore >= 50
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}
              >
                {report.qualityScore}
              </span>
              <span className="text-sm text-slate-400">/ 100</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  report.qualityScore >= 80
                    ? 'bg-emerald-500'
                    : report.qualityScore >= 50
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.max(5, report.qualityScore)}%` }}
              />
            </div>
            <div className="mt-2 text-3xs text-slate-400">
              कटौती: गंभीर (-25), त्रुटि (-10), चेतावनी (-3)
            </div>
          </div>

          {/* Publishing Readiness Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">प्रकाशन तत्परता</span>
              <span
                className={`px-2 py-0.5 rounded-full text-3xs font-extrabold ${
                  report.canPublish ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {report.canPublish ? 'स्वीकार्य (READY)' : 'अवरुद्ध (BLOCKED)'}
              </span>
            </div>
            <div className="my-2">
              {report.canPublish ? (
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>प्रकाशन हेतु कोई गंभीर अथवा त्रुटि स्तर की आपत्ति शेष नहीं है।</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-700 text-xs font-semibold">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span>
                    {report.criticalCount} गंभीर एवं {report.errorCount} त्रुटियां समाधान की प्रतीक्षा में हैं।
                  </span>
                </div>
              )}
            </div>
            <div className="text-3xs text-slate-400 flex items-center justify-between">
              <span>अंतिम जांच: {new Date(report.scannedAt).toLocaleTimeString('hi-IN')}</span>
              <span>परीक्षक: {report.scannedBy}</span>
            </div>
          </div>

          {/* Issue Tally Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">आपत्ति विवरण</span>
            <div className="grid grid-cols-2 gap-2 my-2">
              <div className="p-2 rounded-xl bg-red-50 border border-red-100 flex items-center justify-between">
                <span className="text-3xs font-bold text-red-700">गंभीर</span>
                <span className="text-sm font-black text-red-800">{report.criticalCount}</span>
              </div>
              <div className="p-2 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-between">
                <span className="text-3xs font-bold text-orange-700">त्रुटि</span>
                <span className="text-sm font-black text-orange-800">{report.errorCount}</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-between">
                <span className="text-3xs font-bold text-amber-700">चेतावनी</span>
                <span className="text-sm font-black text-amber-800">{report.warningCount}</span>
              </div>
              <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                <span className="text-3xs font-bold text-blue-700">अपवाद</span>
                <span className="text-sm font-black text-blue-800">{report.exceptionCount}</span>
              </div>
            </div>
            <div className="text-3xs text-slate-400">कुल दर्ज आपत्तियां: {report.totalIssues}</div>
          </div>

          {/* Workflow Status & Action Pipeline */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">कार्यप्रवाह स्थिति</span>
              <span className="px-2 py-0.5 rounded-full text-3xs font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {currentEdition?.status || 'DRAFT'}
              </span>
            </div>

            <div className="my-2 space-y-1.5">
              {isPublished ? (
                <div className="text-xs text-emerald-400 flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>संस्करण सार्वजनिक रूप से प्रकाशित है</span>
                </div>
              ) : isScheduled ? (
                <div className="text-xs text-indigo-300 flex items-center gap-1.5 font-bold">
                  <Clock className="w-4 h-4 text-indigo-300" />
                  <span>शेड्यूल किया गया: {currentEdition?.scheduledPublishAtIst || 'समय निर्धारित'}</span>
                </div>
              ) : isApproved ? (
                <div className="text-xs text-blue-300 flex items-center gap-1.5 font-bold">
                  <FileCheck className="w-4 h-4 text-blue-300" />
                  <span>संपादकीय रूप से स्वीकृत (Final Approved)</span>
                </div>
              ) : (
                <div className="text-xs text-slate-300 flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-amber-400" />
                  <span>अंतिम अनुमोदन एवं प्रकाशन प्रतीक्षित</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60">
              {/* Publication Buttons based on state */}
              {!isPublished && (
                <>
                  {!isApproved && (
                    <button
                      onClick={() => setShowApproveModal(true)}
                      disabled={!report.canApprove || isQualityStale}
                      className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-3xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      title={!report.canApprove ? 'अनसुलझी आपत्तियां होने के कारण अवरुद्ध' : 'संपादकीय अनुमोदन दें'}
                    >
                      अनुमोदन दें
                    </button>
                  )}

                  {isApproved && (
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="flex-1 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-3xs font-bold transition-all"
                    >
                      शेड्यूल करें
                    </button>
                  )}

                  <button
                    onClick={() => setShowPublishConfirmModal(true)}
                    disabled={!report.canPublish || isQualityStale}
                    className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-3xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    title={!report.canPublish ? 'गंभीर त्रुटियों के निवारण बिना प्रकाशन संभव नहीं' : 'तत्काल प्रकाशित करें'}
                  >
                    प्रकाशित करें
                  </button>
                </>
              )}

              {isPublished && (
                <button
                  onClick={() => setShowCorrectionModal(true)}
                  className="w-full py-1.5 px-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-3xs font-bold transition-all"
                >
                  संशोधन प्रारंभ करें (Post-Pub Revision)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6 Category Diagnostic Cards */}
      {report && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {(Object.keys(CATEGORY_LABELS) as EpaperQualityCategory[]).map((catKey) => {
            const catSummary = report.categories?.[catKey];
            const meta = CATEGORY_LABELS[catKey];
            const isPassing = catSummary?.status === 'PASS';
            const hasCritical = (catSummary?.criticalCount || 0) > 0;
            const hasError = (catSummary?.errorCount || 0) > 0;

            return (
              <div
                key={catKey}
                onClick={() => setSelectedCategory(selectedCategory === catKey ? 'ALL' : catKey)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  selectedCategory === catKey
                    ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50/30'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-base">
                  <span>{meta.icon}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-3xs font-bold ${
                      hasCritical
                        ? 'bg-red-100 text-red-700'
                        : hasError
                        ? 'bg-orange-100 text-orange-700'
                        : isPassing
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {hasCritical ? 'अवरुद्ध' : hasError ? 'त्रुटि' : isPassing ? 'उत्तीर्ण' : 'चेतावनी'}
                  </span>
                </div>
                <div className="mt-2 text-xs font-bold text-slate-800 line-clamp-1">{meta.hi}</div>
                <div className="mt-1 flex items-center justify-between text-3xs text-slate-500">
                  <span>आपत्तियां:</span>
                  <span className="font-bold text-slate-700">{catSummary?.issueCount || 0}</span>
                </div>
                <div className="text-3xs text-slate-400">उत्तीर्ण दर: {catSummary?.passPercentage || 100}%</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Severity Pills */}
          {(['ALL', 'CRITICAL', 'ERROR', 'WARNING', 'INFO'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedSeverity === sev
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {sev === 'ALL'
                ? 'सभी गंभीरता'
                : sev === 'CRITICAL'
                ? 'गंभीर'
                : sev === 'ERROR'
                ? 'त्रुटियां'
                : sev === 'WARNING'
                ? 'चेतावनी'
                : 'सूचना'}
            </button>
          ))}

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">सभी समाधान स्थिति</option>
            <option value="UNRESOLVED">अनसुलझी (Unresolved)</option>
            <option value="EXCEPTION_GRANTED">स्वीकृत अपवाद (Exception)</option>
            <option value="RESOLVED">हल की गई (Resolved)</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="आपत्ति खोजें (शीर्षक, कोड)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-3">
        {filteredIssues.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">चयनित मानदंडों में कोई आपत्ति नहीं मिली</h3>
            <p className="text-xs text-slate-500 mt-1">
              इस श्रेणी अथवा गंभीरता स्तर पर सभी परीक्षण सफलतापूर्वक उत्तीर्ण हैं।
            </p>
          </div>
        ) : (
          filteredIssues.map((issue) => {
            const sevMeta = SEVERITY_COLORS[issue.severity];
            const catMeta = CATEGORY_LABELS[issue.category] || { hi: issue.category, icon: '📌' };
            const isExceptionGranted = issue.resolutionStatus === 'EXCEPTION_GRANTED';
            const isCritical = issue.severity === 'CRITICAL';

            return (
              <div
                key={issue.id}
                className={`bg-white border rounded-2xl p-4 shadow-xs transition-all hover:border-slate-300 ${
                  isCritical ? 'border-red-200' : issue.severity === 'ERROR' ? 'border-orange-200' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-3xs font-extrabold border ${sevMeta.bg} ${sevMeta.text} ${sevMeta.border}`}>
                        {sevMeta.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-3xs font-bold bg-slate-100 text-slate-700">
                        {catMeta.icon} {catMeta.hi}
                      </span>
                      {issue.pageNumber && (
                        <span className="px-2 py-0.5 rounded-full text-3xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          पृष्ठ {issue.pageNumber}
                        </span>
                      )}
                      <span className="text-3xs font-mono text-slate-400">[{issue.code}]</span>

                      {isExceptionGranted && (
                        <span className="px-2 py-0.5 rounded-full text-3xs font-bold bg-blue-100 text-blue-800">
                          अपवाद स्वीकृत (Exception by {issue.resolvedBy})
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{issue.titleHi}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{issue.descriptionHi}</p>

                    {issue.recommendationHi && (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                        <span>
                          <strong>अनुशंसित सुधार:</strong> {issue.recommendationHi}
                        </span>
                      </div>
                    )}

                    {isExceptionGranted && issue.exceptionReason && (
                      <div className="p-2 rounded-xl bg-blue-50/50 border border-blue-100 text-xs text-blue-800">
                        <strong>स्वीकृति कारण:</strong> {issue.exceptionReason}
                      </div>
                    )}
                  </div>

                  {/* Issue Actions */}
                  <div className="flex flex-wrap md:flex-col items-end gap-2 shrink-0">
                    {/* Page Designer Navigation Jump */}
                    {issue.pageNumber && onOpenDesigner && (
                      <button
                        onClick={() => onOpenDesigner(selectedEditionId, issue.pageNumber!)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                        title="सीधे लेआउट डिज़ाइनर में जाकर सुधारें"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>पेज {issue.pageNumber} सुधारें</span>
                      </button>
                    )}

                    {/* Grant Exception Button */}
                    {!isExceptionGranted && !isCritical && (
                      <button
                        onClick={() => {
                          setExceptionModalIssue(issue);
                          setExceptionReason('');
                        }}
                        className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all"
                      >
                        अपवाद दें (Exception)
                      </button>
                    )}

                    {/* Critical Rule Notification */}
                    {isCritical && (
                      <span className="text-3xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-lg">
                        अपवाद अनुमत नहीं (सुधार अनिवार्य)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: Grant Exception */}
      {exceptionModalIssue && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-blue-700">
              <HelpCircle className="w-6 h-6" />
              <h3 className="text-base font-black text-slate-900">संपादकीय अपवाद (Editorial Exception) प्रदान करें</h3>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="font-bold text-slate-800">{exceptionModalIssue.titleHi}</div>
              <div className="text-slate-600">{exceptionModalIssue.descriptionHi}</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">अपवाद का लिखित कारण (अनिवार्य):</label>
              <textarea
                rows={3}
                placeholder="जैसे: विज्ञापनदाता के विशेष आग्रह पर लेआउट स्वीकृत किया गया..."
                value={exceptionReason}
                onChange={(e) => setExceptionReason(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-3xs text-slate-400">न्यूनतम 5 अक्षर। यह प्रविष्टि ऑडिट ट्रेल में दर्ज होगी।</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setExceptionModalIssue(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-all"
              >
                रद्द करें
              </button>
              <button
                onClick={handleGrantException}
                disabled={actionLoading || exceptionReason.trim().length < 5}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {actionLoading ? 'स्वीकृत हो रहा है...' : 'अपवाद की पुष्टि करें'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Final Editorial Approval */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <FileCheck className="w-6 h-6" />
              <h3 className="text-base font-black text-slate-900">अंतिम संपादकीय अनुमोदन (Final Approval)</h3>
            </div>
            <p className="text-xs text-slate-600">
              यह कार्रवाई संस्करण को <strong>FINAL_APPROVED</strong> स्थिति में स्थानांतरित करेगी। इसके उपरांत संस्करण प्रकाशन अथवा शेड्यूलिंग हेतु योग्य हो जाएगा।
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">संपादकीय टिप्पणी (वैकल्पिक):</label>
              <textarea
                rows={2}
                placeholder="जैसे: मुख्य पृष्ठ एवं सम्पादकीय लेख की समीक्षा पूर्ण, प्रकाशन हेतु संस्तुत..."
                value={approvalRemarks}
                onChange={(e) => setApprovalRemarks(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-all"
              >
                रद्द करें
              </button>
              <button
                onClick={handleFinalApproval}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {actionLoading ? 'स्वीकृत किया जा रहा है...' : 'अंतिम अनुमोदन दें'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Schedule Publication */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <Clock className="w-6 h-6" />
              <h3 className="text-base font-black text-slate-900">प्रकाशन समय निर्धारित करें (Schedule)</h3>
            </div>
            <p className="text-xs text-slate-600">
              निर्धारित समय (IST) पर संस्करण स्वचालित रूप से पाठकों हेतु उपलब्ध करा दिया जाएगा।
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">प्रकाशन तिथि एवं समय (IST):</label>
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-all"
              >
                रद्द करें
              </button>
              <button
                onClick={handleSchedulePublish}
                disabled={actionLoading || !scheduledTime}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {actionLoading ? 'शेड्यूलिंग...' : 'शेड्यूल सुरक्षित करें'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Immediate Publish Confirmation */}
      {showPublishConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <Send className="w-6 h-6" />
              <h3 className="text-base font-black text-slate-900">ई-पेपर तत्काल प्रकाशन की पुष्टि</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              क्या आप संस्करण <strong>"{currentEdition?.title}"</strong> को तत्काल सार्वजनिक रूप से प्रकाशित करना चाहते हैं?
              प्रकाशन के साथ ही संस्करण का अपरिवर्तनीय स्नैपशॉट (Immutable Version) संग्रहीत कर लिया जाएगा।
            </p>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>गुणवत्ता स्कोर: {report?.qualityScore || 100} / 100 (सभी गंभीर अवरोधक शून्य हैं)</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowPublishConfirmModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-all"
              >
                रद्द करें
              </button>
              <button
                onClick={handleImmediatePublish}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {actionLoading ? 'प्रकाशित हो रहा है...' : 'हाँ, अभी प्रकाशित करें'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Post-Publication Correction Request */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <History className="w-6 h-6" />
              <h3 className="text-base font-black text-slate-900">प्रकाशन पश्चात संशोधन (Revision Draft)</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              यह प्रक्रिया वर्तमान प्रकाशित संस्करण के स्नैपशॉट को 100% अपरिवर्तनीय सुरक्षित रखते हुए, एक नवीन संशोधित ड्राफ्ट संस्करण (Revision Draft) सक्रिय करेगी।
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">संशोधन का कारण अथवा संपादकीय नोट:</label>
              <textarea
                rows={3}
                placeholder="जैसे: पृष्ठ 3 पर मुद्रित आंकड़े में संशोधन..."
                value={correctionRemarks}
                onChange={(e) => setCorrectionRemarks(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-all"
              >
                रद्द करें
              </button>
              <button
                onClick={handlePostPublicationCorrection}
                disabled={actionLoading}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {actionLoading ? 'ड्राफ्ट बनाया जा रहा है...' : 'संशोधन ड्राफ्ट सक्रिय करें'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
