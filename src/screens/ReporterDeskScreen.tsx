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
} from 'lucide-react';
import { ArticleDetail, CategoryItem, CreateDraftRequest, DistrictItem, ReporterAiDraft } from '../types';
import { BnwAiService } from '../services/aiService';

interface ReporterDeskScreenProps {
  categories: CategoryItem[];
  districts: DistrictItem[];
  reporterDrafts: ArticleDetail[];
  onSubmitDraft: (draft: CreateDraftRequest) => void;
  onBackClick: () => void;
}

export const ReporterDeskScreen: React.FC<ReporterDeskScreenProps> = ({
  categories,
  districts,
  reporterDrafts,
  onSubmitDraft,
}) => {
  const [activeTab, setActiveTab] = useState<'compose' | 'history' | 'feedback'>('compose');

  // Form states
  const [headline, setHeadline] = useState('');
  const [bodyContent, setBodyContent] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('cat-mp');
  const [selectedDistrictId, setSelectedDistrictId] = useState('dist-bhopal');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=80');
  const [imageCaption, setImageCaption] = useState('');
  const [imageAttribution, setImageAttribution] = useState('बीएनडब्ल्यू फील्ड रिपोर्टर');
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

  // Trigger AI Field Assistance
  const handleAiAssist = async () => {
    if (!bodyContent.trim() && !headline.trim()) {
      alert('कृपया पहले कुछ कच्चे नोट्स या विवरण दर्ज करें ताकि AI आपकी सहायता कर सके।');
      return;
    }
    setIsAiLoading(true);
    try {
      const selectedDist = districts.find((d) => d.id === selectedDistrictId)?.nameHi || 'भोपाल';
      const result = await BnwAiService.assistReporter(
        headline ? `${headline}\n${bodyContent}` : bodyContent,
        selectedDist
      );
      setAiDraftResult(result);
      if (!headline) {
        setHeadline(result.suggestedHeadline);
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
      setBodyContent(`${suggestion.leadParagraph}\n\n${bodyContent}`);
    }
    setAiDraftResult(null);
  };

  const handleVoiceNoteToggle = () => {
    if (isRecordingVoice) {
      setIsRecordingVoice(false);
      setBodyContent((prev) =>
        prev
          ? `${prev}\n\n[फील्ड वॉइस नोट डिक्टेशन (${recordingSeconds}s): स्थानीय नागरिकों और प्रशासन से प्राप्त प्रारंभिक साक्ष्य दर्ज किए गए।]`
          : `[फील्ड वॉइस नोट डिक्टेशन (${recordingSeconds}s): स्थानीय नागरिकों और प्रशासन से प्राप्त प्रारंभिक साक्ष्य दर्ज किए गए।]`
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
      imageCaption: imageCaption || `जिला ${districts.find((d) => d.id === selectedDistrictId)?.nameHi || ''} से फील्ड कवरेज`,
      imageAttribution: imageAttribution,
      isBreaking: isBreaking,
    };

    onSubmitDraft(draftReq);
    setSubmittedSuccess(true);
    setHeadline('');
    setBodyContent('');
    setTimeout(() => {
      setSubmittedSuccess(false);
      setActiveTab('history');
    }, 2000);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Reporter Profile & Trust Score Header */}
      <div className="bg-slate-900 text-white px-4 py-4 border-b border-slate-800">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h1 className="text-base md:text-lg font-bold">संवाददाता फील्ड डेस्क (Reporter Portal)</h1>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              प्रमाणित संवाददाता: <strong>राजेश पटेल</strong> • गृह बीट: <strong>भोपाल एवं मध्य प्रदेश</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-emerald-900/80 border border-emerald-600 rounded-lg text-emerald-200 text-xs font-bold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>★ विश्वास स्कोर: 98%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 px-3">
        <div className="max-w-3xl mx-auto flex gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('compose')}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'compose'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <PenTool className="w-4 h-4" />
            नया समाचार दर्ज करें
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            सबमिशन इतिहास ({reporterDrafts.length})
          </button>

          <button
            onClick={() => setActiveTab('feedback')}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'feedback'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            संपादकीय फीडबैक
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-3xl mx-auto px-4 py-4">
        {submittedSuccess && (
          <div className="mb-4 bg-emerald-100 border border-emerald-400 text-emerald-900 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>समाचार ड्राफ्ट सफलतापूर्वक दर्ज हुआ! इसे मुख्य संपादक डेस्क की समीक्षा में भेज दिया गया है।</span>
          </div>
        )}

        {/* Tab 1: Compose Story */}
        {activeTab === 'compose' && (
          <form onSubmit={handleSubmit} className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <PenTool className="w-4 h-4 text-red-600" />
                ग्राउंड रिपोर्ट / ब्रेकिंग न्यूज़ दर्ज करें
              </h2>
              <span className="text-[11px] font-semibold text-slate-500">
                10-बिंदु संपादकीय संहिता अनिवार्य
              </span>
            </div>

            {/* District & Category Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ज़िला चुनें (Madhya Pradesh 55 Districts) *
                </label>
                <select
                  value={selectedDistrictId}
                  onChange={(e) => setSelectedDistrictId(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 bg-white"
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
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 bg-white"
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
              />
            </div>

            {/* Body Content Input + Field Mic + AI Assistant */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  समाचार विवरण व फील्ड नोट्स *
                </label>

                <div className="flex items-center gap-2">
                  {/* Voice Note Simulation */}
                  <button
                    type="button"
                    onClick={handleVoiceNoteToggle}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                      isRecordingVoice
                        ? 'bg-red-600 text-white animate-pulse'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isRecordingVoice ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-red-600" />}
                    <span>{isRecordingVoice ? `रिकॉर्डिंग (${recordingSeconds}s)... रोकें` : 'फील्ड वॉइस नोट'}</span>
                  </button>

                  {/* AI Assistant Button */}
                  <button
                    type="button"
                    onClick={handleAiAssist}
                    disabled={isAiLoading}
                    className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-bold transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isAiLoading ? 'AI तैयार कर रहा...' : 'AI फील्ड सहायक'}</span>
                  </button>
                </div>
              </div>

              <textarea
                value={bodyContent}
                onChange={(e) => setBodyContent(e.target.value)}
                rows={5}
                placeholder="घटना स्थल का पूरा ब्यौरा लिखें: क्या हुआ, कब हुआ, संबंधित अधिकारी (DM/SP/SDM) का क्या कहना है, प्रत्यक्षदर्शियों का पक्ष..."
                className="w-full text-xs font-normal border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 leading-relaxed"
              />
            </div>

            {/* AI Suggestion Box if available */}
            {aiDraftResult && (
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-950 flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    AI फील्ड सुझाव:
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
                <div className="text-[11px] text-indigo-900 bg-white/80 p-2 rounded border border-indigo-100">
                  <span className="font-bold block">10-बिंदु गाइडेंस:</span>
                  <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                    {aiDraftResult.factCheckGuidance.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Featured Image URL & Attribution */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
              <label className="font-bold text-slate-800 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                ग्राउंड फोटो / मीडिया URL
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... फोटो का वेब लिंक"
                  className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white"
                />
                <input
                  type="text"
                  value={imageAttribution}
                  onChange={(e) => setImageAttribution(e.target.value)}
                  placeholder="फोटो स्रोत / क्रेडिट (उदा. बीएनडब्ल्यू ब्यूरो)"
                  className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white"
                />
              </div>
            </div>

            {/* Breaking News Toggle */}
            <div className="flex items-center gap-2 p-2.5 bg-red-50/60 border border-red-200 rounded-lg">
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

            {/* 10-Point Fact Check Self-Declaration */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-1.5 text-xs">
              <span className="font-bold text-amber-900 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                संवाददाता 10-बिंदु स्व-सत्यापन घोषणा (Mandatory):
              </span>
              <div className="space-y-1 text-slate-700">
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
                  <span>3. फोटो व वीडियो आज के घटना स्थल के वास्तविक हैं, कोई पुराना फुटेज नहीं।</span>
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
              className="w-full py-3 bg-[#ED1727] hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>संपादकीय समीक्षा हेतु प्रेषित करें (Submit for Desk Review)</span>
            </button>
          </form>
        )}

        {/* Tab 2: Submission History */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-800">
              आपके द्वारा भेजी गई खबरें व वर्तमान स्थिति:
            </h2>

            {reporterDrafts.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-xl border border-slate-200">
                <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">अभी कोई सबमिशन उपलब्ध नहीं है।</p>
              </div>
            ) : (
              reporterDrafts.map((draft) => {
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
                    className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-500">
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

                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
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

        {/* Tab 3: Editorial Feedback */}
        {activeTab === 'feedback' && (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              न्यूज़रूम संपादकीय दिशानिर्देश व फीडबैक
            </h3>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-1.5 text-blue-950">
              <p className="font-bold">चीफ एडिटर नोट (दैनिक ब्रीफिंग):</p>
              <p>
                सभी 55 जिला संवाददाताओं को निर्देश: कृषि उपज मंडियों में समर्थन मूल्य खरीद व उपार्जन केंद्रों से संबंधित किसानों की समस्याओं को सर्वोच्च प्राथमिकता से उठाएं। खबर के साथ स्थानीय एसडीएम या तहसीलदार का अधिकृत पक्ष संलग्न करना अनिवार्य है।
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 text-slate-700">
              <span className="font-bold block text-slate-900">फैक्ट चेक गुणवत्ता स्कोर सुधार:</span>
              <p>• किसी भी आकस्मिक दुर्घटना की खबर में केवल अधिकृत पुलिस कंट्रोल रूम अथवा अस्पताल प्रबंधन के आंकड़ों का ही उल्लेख करें।</p>
              <p>• भ्रामक सोशल मीडिया क्लिप्स को बिना जिला जनसंपर्क अधिकारी (PRO) से सत्यापित किए कतई सबमिट न करें।</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
