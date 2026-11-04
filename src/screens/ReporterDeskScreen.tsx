import React, { useState } from 'react';
import {
  PenTool,
  History,
  MessageSquare,
  Sparkles,
  Mic,
  MicOff,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Upload,
  Send,
  ShieldCheck,
  Check,
  UserCheck,
  Layers,
  Award,
  Calendar,
  MapPin,
  FileText,
  AlertCircle,
  Users,
} from 'lucide-react';
import {
  ArticleDetail,
  CategoryItem,
  CreateDraftRequest,
  DistrictItem,
  ReporterAiDraft,
  ReporterProfile,
} from '../types';
import { BnwAiService } from '../services/aiService';

interface ReporterDeskScreenProps {
  categories: CategoryItem[];
  districts: DistrictItem[];
  reporterDrafts: ArticleDetail[];
  reporters?: ReporterProfile[];
  onSubmitDraft: (draft: CreateDraftRequest, reporter?: ReporterProfile) => void;
  onBackClick: () => void;
}

export const ReporterDeskScreen: React.FC<ReporterDeskScreenProps> = ({
  categories,
  districts,
  reporterDrafts,
  reporters = [],
  onSubmitDraft,
  onBackClick,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'my_stories' | 'assignments' | 'profile'>('create');

  // Active Reporter Selection (Persona Switcher)
  const [selectedReporterId, setSelectedReporterId] = useState<string>(
    reporters[0]?.id || 'rep-active'
  );

  const activeReporter: ReporterProfile =
    reporters.find((r) => r.id === selectedReporterId) ||
    reporters[0] || {
      id: 'rep-active',
      name: 'राजेश पटेल',
      email: 'rajesh.patel@breakingnewswala.com',
      phone: '+91 98260 12345',
      role: 'trusted_reporter',
      assignedDistricts: ['भोपाल', 'सीहोर'],
      assignedDivision: 'भोपाल संभाग',
      totalStoriesFiled: 148,
      totalStoriesPublished: 142,
      badgeNumber: 'BNW-REP-0101',
      joinedDate: '15 जनवरी 2024',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      status: 'ACTIVE',
    };

  // Form states
  const [creationMode, setCreationMode] = useState<'raw_script' | 'manual'>('manual');
  const [rawNotes, setRawNotes] = useState('');
  const [headline, setHeadline] = useState('');
  const [bodyContent, setBodyContent] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('cat-mp');
  const [selectedDistrictId, setSelectedDistrictId] = useState('dist-bhopal');
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=80'
  );
  const [imageCaption, setImageCaption] = useState('');
  const [imageAttribution, setImageAttribution] = useState('बीएनडब्ल्यू फील्ड संवाददाता');
  const [isBreaking, setIsBreaking] = useState(false);

  // Self Fact-Checking Protocol checks
  const [checkSource, setCheckSource] = useState(true);
  const [checkOfficial, setCheckOfficial] = useState(true);
  const [checkMediaAuthentic, setCheckMediaAuthentic] = useState(true);
  const [checkHarmonious, setCheckHarmonious] = useState(true);

  // AI Assistant state
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiDraftResult, setAiDraftResult] = useState<ReporterAiDraft | null>(null);

  // Audio recording simulation
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Success modal
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Story Status Filter
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Trigger AI Field Assistance (Local Simulation Engine)
  const handleAiAssist = async () => {
    const inputContent = rawNotes.trim() || bodyContent.trim() || headline.trim();
    if (!inputContent) {
      alert('कृपया पहले कुछ कच्चे नोट्स या विवरण दर्ज करें ताकि AI आपकी सहायता कर सके।');
      return;
    }
    setIsAiLoading(true);
    try {
      const selectedDist = districts.find((d) => d.id === selectedDistrictId)?.nameHi || 'भोपाल';
      const result = await BnwAiService.assistReporter(inputContent, selectedDist);
      setAiDraftResult(result);
      if (!headline) {
        setHeadline(result.suggestedHeadline);
      }
      if (!bodyContent && result.leadParagraph) {
        setBodyContent(`${result.leadParagraph}\n\n${inputContent}`);
      }
    } catch {
      alert('AI सहायता लोड करने में समस्या हुई।');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApplyAiSuggestion = (suggestion: ReporterAiDraft) => {
    setHeadline(suggestion.suggestedHeadline);
    if (!bodyContent.includes(suggestion.leadParagraph)) {
      setBodyContent(`${suggestion.leadParagraph}\n\n${bodyContent || rawNotes}`);
    }
    setCreationMode('manual');
    setAiDraftResult(null);
  };

  const handleVoiceNoteToggle = () => {
    if (isRecordingVoice) {
      setIsRecordingVoice(false);
      setBodyContent((prev) =>
        prev
          ? `${prev}\n\n[फील्ड वॉइस नोट डिक्टेशन (सिम्युलेटर - ${recordingSeconds}s): स्थानीय नागरिकों और प्रशासन से प्राप्त प्रारंभिक साक्ष्य दर्ज किए गए।]`
          : `[फील्ड वॉइस नोट डिक्टेशन (सिम्युलेटर - ${recordingSeconds}s): स्थानीय नागरिकों और प्रशासन से प्राप्त प्रारंभिक साक्ष्य दर्ज किए गए।]`
      );
      setRecordingSeconds(0);
    } else {
      setIsRecordingVoice(true);
      setRecordingSeconds(0);
      const interval = setInterval(() => {
        setRecordingSeconds((s) => {
          if (s >= 15) {
            clearInterval(interval);
            return s;
          }
          return s + 1;
        });
      }, 1000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline.trim() || !bodyContent.trim()) {
      alert('कृपया शीर्षक और समाचार विवरण दोनों भरें।');
      return;
    }

    const draftReq: CreateDraftRequest = {
      title: headline,
      content: bodyContent,
      summary: bodyContent.slice(0, 160),
      categoryId: selectedCategoryId,
      districtId: selectedDistrictId,
      featuredImage: imageUrl,
      imageCaption:
        imageCaption ||
        `जिला ${districts.find((d) => d.id === selectedDistrictId)?.nameHi || ''} से फील्ड कवरेज`,
      imageAttribution: imageAttribution || activeReporter.name,
      isBreaking: isBreaking,
    };

    onSubmitDraft(draftReq, activeReporter);
    setSubmittedSuccess(true);
    setHeadline('');
    setBodyContent('');
    setRawNotes('');
    setTimeout(() => {
      setSubmittedSuccess(false);
      setActiveTab('my_stories');
    }, 2000);
  };

  const filteredDrafts = reporterDrafts.filter((d) => {
    if (statusFilter === 'ALL') return true;
    return d.status === statusFilter;
  });

  return (
    <div className="bg-slate-100 min-h-screen pb-24 font-sans">
      {/* 1. Reporter Profile Header Bar */}
      <div className="bg-slate-900 text-white px-4 py-5 border-b border-slate-800 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-yellow-400 overflow-hidden shrink-0 shadow-sm">
              <img
                src={activeReporter.avatar}
                alt={activeReporter.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-lg font-black tracking-tight font-serif">
                  संवाददाता डिजिटल कार्यक्षेत्र (Reporter Desk)
                </h1>
                <span className="px-2 py-0.5 bg-emerald-700 text-white text-[10px] font-bold rounded-full">
                  प्रमाणित बीट
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                संवाददाता: <strong>{activeReporter.name}</strong> • प्रेस बैज:{' '}
                <strong className="font-mono text-yellow-300">{activeReporter.badgeNumber}</strong> • बीट:{' '}
                <strong>{activeReporter.assignedDistricts.join(', ')}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Persona Switcher Dropdown */}
            {reporters.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
                <Users className="w-3.5 h-3.5 text-slate-400 ml-1" />
                <select
                  value={selectedReporterId}
                  onChange={(e) => setSelectedReporterId(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-hidden pr-2 cursor-pointer"
                  title="सक्रिय संवाददाता प्रोफ़ाइल बदलें"
                >
                  {reporters.map((rep) => (
                    <option key={rep.id} value={rep.id} className="bg-slate-900 text-white">
                      {rep.name} ({rep.badgeNumber} - {rep.assignedDistricts[0]})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="px-3 py-1.5 bg-emerald-900/70 border border-emerald-600 rounded-lg text-emerald-200 text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>विश्वास स्कोर: 98% (A+)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-[57px] z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('create')}
            className={`py-3.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'create'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>समाचार दर्ज करें</span>
          </button>

          <button
            onClick={() => setActiveTab('my_stories')}
            className={`py-3.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'my_stories'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>मेरी खबरें ({reporterDrafts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('assignments')}
            className={`py-3.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'assignments'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>संपादकीय असाइनमेंट्स (3)</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'profile'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>प्रेस पहचान पत्र (Press ID)</span>
          </button>
        </div>
      </div>

      {/* 3. Main Workspace Container */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {submittedSuccess && (
          <div className="mb-4 bg-emerald-100 border border-emerald-400 text-emerald-900 p-4 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              समाचार ड्राफ्ट सफलतापूर्वक दर्ज हुआ! इसे मुख्य संपादक डेस्क की समीक्षा में भेज दिया गया है।
            </span>
          </div>
        )}

        {/* TAB 1: COMPOSE STORY */}
        {activeTab === 'create' && (
          <form
            onSubmit={handleSubmit}
            className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-red-600" />
                <h2 className="text-sm md:text-base font-bold text-slate-900">
                  ग्राउंड रिपोर्ट अथवा ब्रेकिंग न्यूज़ फाइल करें
                </h2>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                10-बिंदु संपादकीय संहिता अनिवार्य
              </span>
            </div>

            {/* Creation Mode Toggle (Raw Notes vs Structured) */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setCreationMode('manual')}
                className={`flex-1 py-1.5 rounded-lg transition-colors ${
                  creationMode === 'manual'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📝 मानक रिपोर्टर एडिटर
              </button>
              <button
                type="button"
                onClick={() => setCreationMode('raw_script')}
                className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                  creationMode === 'raw_script'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>कच्ची स्क्रिप्ट / AI फील्ड सहायक (सिम्युलेटर)</span>
              </button>
            </div>

            {/* Raw Script Input Mode */}
            {creationMode === 'raw_script' && (
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    कच्ची स्क्रिप्ट या त्वरित ऑडियो नोट्स दर्ज करें:
                  </span>
                  <button
                    type="button"
                    onClick={handleAiAssist}
                    disabled={isAiLoading}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold shadow-xs transition-colors"
                  >
                    {isAiLoading ? 'AI तैयार कर रहा...' : 'AI से खबर तैयार कराएं'}
                  </button>
                </div>
                <textarea
                  value={rawNotes}
                  onChange={(e) => setRawNotes(e.target.value)}
                  rows={4}
                  placeholder="उदा. सीहोर मंडी में आज सोयाबीन की रिकॉर्ड आवक हुई, किसानों को 5100 का भाव मिला। एसडीएम ने उपार्जन केंद्रों का दौरा किया..."
                  className="w-full p-2.5 bg-white border border-indigo-200 rounded-lg text-slate-900"
                />
                <span className="text-[10px] text-indigo-600 block italic">
                  * यह सुविधा स्थानीय हेयूरिस्टिक इंजन द्वारा संचालित है।
                </span>
              </div>
            )}

            {/* District & Category Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ज़िला चुनें (Madhya Pradesh 55 Districts) *
                </label>
                <select
                  value={selectedDistrictId}
                  onChange={(e) => setSelectedDistrictId(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 bg-white"
                >
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nameHi} ({d.nameEn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  समाचार श्रेणी *
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameHi}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Headline Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  समाचार शीर्षक (Headline in Devanagari) *
                </label>
                <span className="text-[10px] text-slate-400">
                  {headline.length}/120 अक्षर
                </span>
              </div>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="उदा. सीहोर कृषि उपज मंडी में सोयाबीन के भाव में उछाल, किसानों के चेहरे खिले..."
                className="w-full text-sm font-semibold border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500"
                required
              />
            </div>

            {/* Content Textarea + Voice Dictation + AI Assist */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  समाचार का मुख्य विवरण व ग्राउंड रिपोर्ट *
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleVoiceNoteToggle}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                      isRecordingVoice
                        ? 'bg-red-600 text-white animate-pulse'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    title="ऑडियो डिक्टेशन सिम्युलेटर"
                  >
                    {isRecordingVoice ? (
                      <MicOff className="w-3.5 h-3.5" />
                    ) : (
                      <Mic className="w-3.5 h-3.5 text-red-600" />
                    )}
                    <span>
                      {isRecordingVoice
                        ? `रिकॉर्डिंग (${recordingSeconds}s)... रोकें`
                        : 'फील्ड वॉइस नोट (सिम्युलेटर)'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAiAssist}
                    disabled={isAiLoading}
                    className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-bold transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isAiLoading ? 'AI तैयार कर रहा...' : 'AI सुधार'}</span>
                  </button>
                </div>
              </div>

              <textarea
                value={bodyContent}
                onChange={(e) => setBodyContent(e.target.value)}
                rows={6}
                placeholder="घटना स्थल का पूरा ब्यौरा लिखें: क्या हुआ, कब हुआ, संबंधित अधिकारी (DM/SP/SDM) का क्या कहना है, प्रत्यक्षदर्शियों का पक्ष..."
                className="w-full text-xs font-normal border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 leading-relaxed"
                required
              />
            </div>

            {/* AI Assistant Output Box */}
            {aiDraftResult && (
              <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-950 flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    AI फील्ड संपादन सुझाव (हेयूरिस्टिक):
                  </span>
                  <button
                    type="button"
                    onClick={() => handleApplyAiSuggestion(aiDraftResult)}
                    className="px-2.5 py-1 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700"
                  >
                    सुझाव लागू करें
                  </button>
                </div>
                <p>
                  <strong>सुझाया गया शीर्षक:</strong> {aiDraftResult.suggestedHeadline}
                </p>
                <p>
                  <strong>लीड पैराग्राफ:</strong> {aiDraftResult.leadParagraph}
                </p>
              </div>
            )}

            {/* Ground Image URL & Attribution */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                ग्राउंड फोटो / मीडिया URL एवं स्रोत साभार
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... फोटो का वेब लिंक"
                  className="w-full border border-slate-300 rounded p-2 text-xs bg-white"
                />
                <input
                  type="text"
                  value={imageAttribution}
                  onChange={(e) => setImageAttribution(e.target.value)}
                  placeholder="फोटो स्रोत / क्रेडिट (उदा. बीएनडब्ल्यू ब्यूरो)"
                  className="w-full border border-slate-300 rounded p-2 text-xs bg-white"
                />
              </div>
            </div>

            {/* Breaking News Checkbox */}
            <div className="flex items-center gap-2.5 p-3 bg-red-50/70 border border-red-200 rounded-xl">
              <input
                type="checkbox"
                id="isBreakingCheckbox"
                checked={isBreaking}
                onChange={(e) => setIsBreaking(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
              />
              <label htmlFor="isBreakingCheckbox" className="text-xs font-bold text-red-900 cursor-pointer">
                🚨 इसे तत्काल 'राज्यव्यापी ब्रेकिंग न्यूज़' के रूप में चिह्नित करें
              </label>
            </div>

            {/* Mandatory 10-Point Self Declaration */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                संवाददाता 10-बिंदु स्व-सत्यापन घोषणा (Mandatory):
              </span>
              <div className="space-y-1.5 text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkSource}
                    onChange={(e) => setCheckSource(e.target.checked)}
                    className="w-3.5 h-3.5 text-amber-600"
                  />
                  <span>1. सूचना प्रत्यक्ष स्थल अथवा प्रत्यक्षदर्शी स्रोतों से जांची गई है।</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkOfficial}
                    onChange={(e) => setCheckOfficial(e.target.checked)}
                    className="w-3.5 h-3.5 text-amber-600"
                  />
                  <span>2. प्रशासनिक पक्ष (कलेक्टर/पुलिस/तहसीलदार) को सूचना से अवगत करा दिया गया है।</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkMediaAuthentic}
                    onChange={(e) => setCheckMediaAuthentic(e.target.checked)}
                    className="w-3.5 h-3.5 text-amber-600"
                  />
                  <span>3. फोटो व वीडियो आज के घटना स्थल के वास्तविक हैं, कोई भ्रामक फुटेज नहीं।</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkHarmonious}
                    onChange={(e) => setCheckHarmonious(e.target.checked)}
                    className="w-3.5 h-3.5 text-amber-600"
                  />
                  <span>4. रिपोर्ट किसी भी प्रकार की धार्मिक अथवा सामाजिक वैमनस्यता को बढ़ावा नहीं देती।</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!checkSource || !checkOfficial || !checkMediaAuthentic || !checkHarmonious}
              className="w-full py-3 bg-[#ED1727] hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>संपादकीय समीक्षा हेतु प्रेषित करें (Submit for Desk Review)</span>
            </button>
          </form>
        )}

        {/* TAB 2: MY STORIES & DRAFT TRACKING */}
        {activeTab === 'my_stories' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-800">
                आपके द्वारा सबमिट की गई खबरें व वर्तमान स्थिति:
              </h2>

              <div className="flex items-center gap-1.5 text-xs">
                {['ALL', 'PENDING_REVIEW', 'REVISION_REQUESTED', 'PUBLISHED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                      statusFilter === st
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {st === 'ALL'
                      ? 'सभी'
                      : st === 'PENDING_REVIEW'
                      ? 'कतार में'
                      : st === 'REVISION_REQUESTED'
                      ? 'संशोधन'
                      : 'प्रकाशित'}
                  </button>
                ))}
              </div>
            </div>

            {filteredDrafts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">इस फ़िल्टर में कोई खबर उपलब्ध नहीं है।</p>
              </div>
            ) : (
              filteredDrafts.map((draft) => {
                const getStatusBadge = () => {
                  switch (draft.status) {
                    case 'PUBLISHED':
                      return { text: 'प्रकाशित (LIVE)', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
                    case 'UNDER_REVIEW':
                      return { text: 'समीक्षाधीन (Under Review)', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
                    case 'REVISION_REQUESTED':
                      return { text: 'संशोधन अपेक्षित', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
                    default:
                      return { text: 'डेस्क कतार में (Pending)', bg: 'bg-slate-100 text-slate-700 border-slate-300' };
                  }
                };

                const badge = getStatusBadge();

                return (
                  <div
                    key={draft.id}
                    className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {draft.districtName} • {draft.categoryName}
                      </span>
                      <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${badge.bg}`}>
                        {badge.text}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {draft.title}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-2">
                      {draft.content}
                    </p>

                    {draft.status === 'REVISION_REQUESTED' && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-950 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>संपादकीय निर्देश:</strong>{' '}
                          {draft.summary || 'कृपया संबंधित प्रशासनिक अधिकारी का पक्ष शामिल करें।'}
                        </div>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span>दर्ज समय: {draft.createdAt}</span>
                      {draft.isBreaking && (
                        <span className="text-red-600 font-bold">🚨 ब्रेकिंग टैग</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: ASSIGNMENTS */}
        {activeTab === 'assignments' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-red-600" />
              केंद्रीय डेस्क द्वारा आवंटित प्राथमिकता कवरेज
            </h3>

            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-red-200 bg-red-50/40 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="bg-red-600 text-white font-bold px-2 py-0.5 rounded text-[10px]">
                    अति आवश्यक (HIGH PRIORITY)
                  </span>
                  <span className="text-slate-500 font-semibold">समय सीमा: आज शाम 05:00 बजे तक</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">
                  सीहोर व रायसेन उपार्जन केंद्रों पर किसानों के पंजीयन व स्लॉट बुकिंग की ग्राउंड रिपोर्ट
                </h4>
                <p className="text-slate-700">
                  सोसायटियों पर बायोमेट्रिक सर्वर की स्थिति और किसानों की समस्याओं पर 300 शब्दों की खबर व 2 ग्राउंड फोटोज़ भेजें।
                </p>
                <button
                  onClick={() => {
                    setActiveTab('create');
                    setHeadline(
                      'सीहोर उपार्जन केंद्रों पर किसान पंजीयन में सर्वर धीमा, कतारों में खड़े अन्नदाता...'
                    );
                  }}
                  className="px-3 py-1.5 bg-red-600 text-white font-bold rounded-lg text-xs hover:bg-red-700"
                >
                  इस असाइनमेंट पर खबर दर्ज करें
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="bg-blue-600 text-white font-bold px-2 py-0.5 rounded text-[10px]">
                    विशेष बीट
                  </span>
                  <span className="text-slate-500 font-semibold">समय सीमा: कल दोपहर 12:00 बजे</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">
                  भोपाल नगर निगम: स्वच्छता सर्वेक्षण 2026 नवाचार व वार्ड स्तर पर गीले-सूखे कचरे का पृथक्करण
                </h4>
                <p className="text-slate-600">
                  अपर आयुक्त स्वास्थ्य का अधिकृत पक्ष और स्थानीय नागरिकों की प्रतिक्रिया शामिल करें।
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DIGITAL PRESS ID */}
        {activeTab === 'profile' && (
          <div className="max-w-md mx-auto space-y-4">
            <div className="text-center pb-2">
              <h3 className="text-base font-black text-slate-900">
                डिजिटल प्रेस पहचान पत्र (डेमो परिचय पत्र)
              </h3>
              <p className="text-xs text-slate-500">
                BREAKING NEWS WALA द्वारा अधिकृत फील्ड संवाददाता पहचान पत्र (डेमो मोड)
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-700 via-slate-900 to-slate-950 text-white rounded-2xl p-5 shadow-xl border-2 border-yellow-400 space-y-4">
              <div className="flex items-center justify-between border-b border-white/20 pb-3">
                <img
                  src="/brand/logo.png"
                  alt="Logo"
                  className="h-7 w-auto object-contain bg-white p-1 rounded"
                />
                <span className="text-xs font-bold text-yellow-300 font-mono">
                  ID: {activeReporter.badgeNumber}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <img
                  src={activeReporter.avatar}
                  alt={activeReporter.name}
                  className="w-18 h-18 rounded-xl border-2 border-white object-cover shadow-sm"
                />
                <div className="space-y-1">
                  <h4 className="text-base font-black">{activeReporter.name}</h4>
                  <p className="text-xs text-yellow-300 font-bold">
                    {activeReporter.role === 'trusted_reporter'
                      ? 'वरिष्ठ जिला संवाददाता'
                      : 'जिला संवाददाता'}
                  </p>
                  <p className="text-[11px] text-slate-300">
                    {activeReporter.assignedDivision || 'मध्य प्रदेश'} •{' '}
                    {activeReporter.assignedDistricts.join(', ')}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">{activeReporter.phone}</p>
                </div>
              </div>

              <div className="text-[10px] text-slate-300 border-t border-white/20 pt-2.5 flex justify-between items-center">
                <span>जारी दिनांक: {activeReporter.joinedDate}</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  वैधता: सक्रिय (Active)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
