import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  Radio,
  FileCheck,
  AlertTriangle,
  Send,
  Eye,
  Sliders,
  Check,
  Edit3,
  Save,
  Lock,
  Unlock,
} from 'lucide-react';
import { ArticleDetail, EditorialFactCheckResult } from '../types';
import { BnwAiService } from '../services/aiService';

interface NewsroomDeskScreenProps {
  pendingArticles: ArticleDetail[];
  onApproveAndPublish: (articleId: string, updatedTitle?: string, updatedContent?: string) => void;
  onRequestRevision: (articleId: string, comments: string) => void;
  onRejectArticle: (articleId: string) => void;
  onBroadcastBreakingAlert: (title: string, district: string) => void;
}

export const NewsroomDeskScreen: React.FC<NewsroomDeskScreenProps> = ({
  pendingArticles,
  onApproveAndPublish,
  onRequestRevision,
  onRejectArticle,
  onBroadcastBreakingAlert,
}) => {
  const [selectedArticleId, setSelectedArticleId] = useState<string>(
    pendingArticles[0]?.id || ''
  );
  const [isAiAuditing, setIsAiAuditing] = useState(false);
  const [factCheckResult, setFactCheckResult] = useState<EditorialFactCheckResult | null>(null);

  // Inline Sub-editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');

  // Story Claiming state
  const [claimedBy, setClaimedBy] = useState<string | null>(null);

  // Revision comments modal / input
  const [revisionComments, setRevisionComments] = useState('');
  const [showRevisionBox, setShowRevisionBox] = useState(false);

  // Broadcast alert modal
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastHeadline, setBroadcastHeadline] = useState('');
  const [broadcastDistrict, setBroadcastDistrict] = useState('पूरा मध्य प्रदेश');
  const [broadcastToast, setBroadcastToast] = useState<string | null>(null);

  const selectedArticle =
    pendingArticles.find((a) => a.id === selectedArticleId) || pendingArticles[0];

  useEffect(() => {
    if (selectedArticle) {
      setEditedTitle(selectedArticle.title);
      setEditedContent(selectedArticle.content);
      setIsEditing(false);
      setClaimedBy(null);
    }
  }, [selectedArticleId, pendingArticles]);

  const handleRunAiAudit = async () => {
    if (!selectedArticle) return;
    setIsAiAuditing(true);
    try {
      const result = await BnwAiService.evaluateEditorialFactCheck(
        editedTitle || selectedArticle.title,
        editedContent || selectedArticle.content,
        selectedArticle.districtName || 'मध्य प्रदेश'
      );
      setFactCheckResult(result);
      if (result.refinedHeadline) {
        setEditedTitle(result.refinedHeadline);
      }
    } catch {
      alert('AI तथ्य-जांच विश्लेषण में त्रुटि हुई।');
    } finally {
      setIsAiAuditing(false);
    }
  };

  const handleTriggerBroadcast = () => {
    if (!broadcastHeadline.trim()) {
      alert('कृपया ब्रेकिंग अलर्ट का शीर्षक दर्ज करें।');
      return;
    }
    onBroadcastBreakingAlert(broadcastHeadline, broadcastDistrict);
    setShowBroadcastModal(false);
    setBroadcastToast(
      `🚨 [डेमो] सिम्युलेटेड राज्यव्यापी अलर्ट जारी (स्थानीय पूर्वावलोकन)`
    );
    setBroadcastHeadline('');
    setTimeout(() => setBroadcastToast(null), 4000);
  };

  const handlePublishWithEdits = () => {
    if (!selectedArticle) return;
    onApproveAndPublish(selectedArticle.id, editedTitle, editedContent);
  };

  return (
    <div className="bg-slate-100 min-h-screen pb-24 font-sans">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white px-4 py-5 border-b border-slate-800 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <h1 className="text-base md:text-xl font-black tracking-tight font-serif">
                केंद्रीय संपादकीय डेस्क (Chief Newsroom Desk)
              </h1>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              10-बिंदु संपादकीय सत्यापन, तथ्य-जांच, सब-एडिटिंग एवं राज्यव्यापी प्रकाशन नियंत्रण
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#ED1727] hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>राज्यव्यापी ब्रेकिंग अलर्ट</span>
            </button>
            <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-400">
              लंबित समीक्षा: {pendingArticles.length}
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Toast Feedback */}
      {broadcastToast && (
        <div className="max-w-6xl mx-auto mt-3 px-4">
          <div className="bg-red-600 text-white p-3 rounded-xl shadow-lg text-xs font-bold flex items-center justify-between">
            <span>{broadcastToast}</span>
            <button onClick={() => setBroadcastToast(null)} className="text-white hover:text-slate-200">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Review Layout */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {pendingArticles.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
            <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-slate-900">
              न्यूज़रूम समीक्षा कतार शून्य है!
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              सभी फील्ड रिपोर्टर स्टोरीज़ या तो स्वीकृत कर प्रकाशित कर दी गई हैं अथवा संशोधन हेतु भेजी गई हैं।
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left Column: Queue List */}
            <div className="space-y-2 lg:col-span-1">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider px-1">
                लंबित फील्ड रिपोर्ट्स ({pendingArticles.length})
              </h3>
              <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
                {pendingArticles.map((art) => {
                  const isSelected = art.id === selectedArticle?.id;
                  return (
                    <div
                      key={art.id}
                      onClick={() => {
                        setSelectedArticleId(art.id);
                        setFactCheckResult(null);
                        setShowRevisionBox(false);
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-white border-red-500 shadow-md ring-1 ring-red-400/30'
                          : 'bg-white/90 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {art.districtName}
                        </span>
                        <span className="text-slate-400 font-medium">
                          {art.createdAt}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                        {art.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1.5 flex items-center justify-between">
                        <span>संवाददाता: {art.authorName}</span>
                        {art.isBreaking && (
                          <span className="text-red-600 font-bold">🚨 ब्रेकिंग</span>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Review & Sub-Editing Workspace */}
            {selectedArticle && (
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  {/* Article Metadata Header + Claim Button */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded">
                        {selectedArticle.districtName}
                      </span>
                      <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded">
                        {selectedArticle.categoryName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setClaimedBy(claimedBy ? null : 'मुख्य संपादक (Desk Editor)')
                        }
                        className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                          claimedBy
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {claimedBy ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        <span>{claimedBy ? `डेस्क क्लेम: ${claimedBy}` : 'स्टोरी क्लेम करें'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsEditing(!isEditing)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                          isEditing
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isEditing ? 'संपादन मोड सक्रिय' : 'सब-एडिट करें'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Headline (Display or Edit) */}
                  {isEditing ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        संपादित शीर्षक (Desk Edited Headline):
                      </label>
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="w-full text-sm font-bold p-2.5 border border-blue-400 rounded-lg bg-blue-50/20"
                      />
                    </div>
                  ) : (
                    <h2 className="text-base md:text-xl font-bold text-slate-900 leading-snug">
                      {editedTitle || selectedArticle.title}
                    </h2>
                  )}

                  {/* Image Preview */}
                  {selectedArticle.featuredImage && (
                    <div className="rounded-xl overflow-hidden border border-slate-200">
                      <img
                        src={selectedArticle.featuredImage}
                        alt="ग्राउंड फोटो"
                        className="w-full h-48 sm:h-56 object-cover"
                      />
                      {selectedArticle.imageCaption && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-2 border-t border-slate-200">
                          {selectedArticle.imageCaption}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Content (Display or Edit) */}
                  {isEditing ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        संपादित खबर विवरण (Desk Edited Content):
                      </label>
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        rows={7}
                        className="w-full text-xs md:text-sm p-3 border border-blue-400 rounded-lg bg-blue-50/20 leading-relaxed font-sans"
                      />
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 whitespace-pre-line leading-relaxed max-h-64 overflow-y-auto">
                      {editedContent || selectedArticle.content}
                    </div>
                  )}

                  {/* AI 10-Point Fact Check Audit Action */}
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-indigo-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span>एआई 10-बिंदु संपादकीय फैक्ट-चेक ऑडिटर (हेयूरिस्टिक सिमुलेटर)</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRunAiAudit}
                        disabled={isAiAuditing}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition-colors shadow-2xs"
                      >
                        {isAiAuditing ? 'विश्लेषण चल रहा है...' : 'जांच शुरू करें'}
                      </button>
                    </div>

                    {factCheckResult && (
                      <div className="mt-2 pt-2 border-t border-indigo-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-900">
                            हेयूरिस्टिक सत्यापन स्कोर: {factCheckResult.score}/100
                          </span>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                            {factCheckResult.credibilityRating}
                          </span>
                        </div>

                        <p className="text-slate-700 italic bg-white/90 p-2.5 rounded border border-indigo-100">
                          "{factCheckResult.editorialRemarksHindi}"
                        </p>

                        <div className="space-y-1">
                          {factCheckResult.checklist.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-[11px]">
                              {item.status === 'PASSED' ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                              )}
                              <div>
                                <span className="font-bold text-slate-800">{item.pointName}:</span>{' '}
                                <span className="text-slate-600">{item.commentHindi}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Revision Box if requested */}
                  {showRevisionBox && (
                    <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
                      <label className="block text-xs font-bold text-amber-950">
                        संवाददाता के लिए संपादकीय निर्देश / अपेक्षित संशोधन:
                      </label>
                      <textarea
                        value={revisionComments}
                        onChange={(e) => setRevisionComments(e.target.value)}
                        placeholder="कृपया संबंधित एसडीएम या तहसीलदार का पक्ष शामिल करें..."
                        className="w-full text-xs p-2.5 border border-amber-300 rounded bg-white"
                        rows={2}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowRevisionBox(false)}
                          className="px-2.5 py-1 text-xs text-slate-600"
                        >
                          रद्द करें
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!revisionComments.trim()) {
                              alert('कृपया संशोधन टिप्पणी दर्ज करें।');
                              return;
                            }
                            onRequestRevision(selectedArticle.id, revisionComments);
                            setShowRevisionBox(false);
                            setRevisionComments('');
                          }}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded"
                        >
                          संशोधन हेतु वापस भेजें
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Editorial Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowRevisionBox(true)}
                        className="flex items-center gap-1 px-3 py-2 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-bold transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>संशोधन मांगें</span>
                      </button>

                      <button
                        onClick={() => onRejectArticle(selectedArticle.id)}
                        className="flex items-center gap-1 px-3 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>अस्वीकृत</span>
                      </button>
                    </div>

                    <button
                      onClick={handlePublishWithEdits}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-[#ED1727] hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>स्वीकृत करें व लाइव प्रकाशित करें</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Broadcast Breaking Alert Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                <Radio className="w-5 h-5 animate-spin" />
                <span>राज्यव्यापी ब्रेकिंग अलर्ट जारी करें</span>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                प्रसारण क्षेत्र (Target Coverage):
              </label>
              <select
                value={broadcastDistrict}
                onChange={(e) => setBroadcastDistrict(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="पूरा मध्य प्रदेश">पूरा मध्य प्रदेश (समस्त 55 जिले)</option>
                <option value="भोपाल संभाग">भोपाल संभाग</option>
                <option value="इंदौर संभाग">इंदौर संभाग</option>
                <option value="ग्वालियर-चंबल">ग्वालियर-चंबल संभाग</option>
                <option value="महाकोशल व विंध्य">महाकोशल व विंध्य संभाग</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ब्रेकिंग अलर्ट का शीर्षक (Short Push Headline) *
              </label>
              <input
                type="text"
                value={broadcastHeadline}
                onChange={(e) => setBroadcastHeadline(e.target.value)}
                placeholder="उदा. बड़ी खबर: मध्य प्रदेश में मौसम विभाग का भारी बारिश का रेड अलर्ट..."
                className="w-full text-xs font-bold p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              ℹ️ [डेमो मोड] यह संदेश स्थानीय पूर्वावलोकन हेतु सिम्युलेटेड है। वास्तविक FCM पुश नोटिफिकेशन प्रेषण हेतु सर्वर बैकएंड व अधिकृत क्रेडेंशियल्स आवश्यक हैं।
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 font-semibold"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={handleTriggerBroadcast}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                🚨 अलर्ट प्रसारित करें
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
