import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Video,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Film,
  Sparkles,
  Eye,
} from 'lucide-react';
import { VideoPost } from '../../types';
import { parseVideoUrl } from './videoEmbedHelper';

interface AdminVideoManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoPosts: VideoPost[];
  onSaveVideoPost: (post: VideoPost) => void;
  onDeleteVideoPost: (postId: string) => void;
}

export const AdminVideoManagerModal: React.FC<AdminVideoManagerModalProps> = ({
  isOpen,
  onClose,
  videoPosts,
  onSaveVideoPost,
  onDeleteVideoPost,
}) => {
  const [activeTab, setActiveTab] = useState<'NEW' | 'LIST'>('NEW');

  // Form states
  const [urlInput, setUrlInput] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [category, setCategory] = useState<string>('मध्य प्रदेश');
  const [district, setDistrict] = useState<string>('भोपाल');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [status, setStatus] = useState<'PUBLISHED' | 'DRAFT'>('PUBLISHED');

  const [validationResult, setValidationResult] = useState<{
    tested: boolean;
    isValid: boolean;
    platform: string;
    embedUrl: string;
    errorMessage?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleValidateUrl = () => {
    const parsed = parseVideoUrl(urlInput);
    setValidationResult({
      tested: true,
      isValid: parsed.isValid,
      platform: parsed.platform,
      embedUrl: parsed.embedUrl,
      errorMessage: parsed.errorMessage,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseVideoUrl(urlInput);
    if (!parsed.isValid) {
      setValidationResult({
        tested: true,
        isValid: false,
        platform: parsed.platform,
        embedUrl: '',
        errorMessage: parsed.errorMessage,
      });
      return;
    }

    if (!title.trim()) {
      alert('कृपया वीडियो का शीर्षक (Title) दर्ज करें।');
      return;
    }

    const newPost: VideoPost = {
      id: `vid-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      caption: caption.trim() || undefined,
      platform: parsed.platform,
      url: urlInput.trim(),
      embedUrl: parsed.embedUrl,
      thumbnailUrl: thumbnailUrl.trim() || undefined,
      category: category.trim(),
      districtId: district ? `dist-${district.toLowerCase()}` : undefined,
      displayOrder: Number(displayOrder) || 1,
      status: status,
      createdAt: new Date().toISOString(),
      publishedAt: status === 'PUBLISHED' ? new Date().toISOString() : undefined,
      authorName: 'एडमिन डेस्क',
      viewsCount: 0,
    };

    onSaveVideoPost(newPost);

    // Reset form
    setUrlInput('');
    setTitle('');
    setCaption('');
    setThumbnailUrl('');
    setValidationResult(null);
    setActiveTab('LIST');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-600 rounded-lg text-white">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white font-news-hero">
                वीडियो URL प्रबंधन (Video Management)
              </h2>
              <p className="text-[11px] text-slate-400">
                Facebook एवं Instagram वीडियो लिंक जोड़ें व संपादित करें
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-5 pt-2">
          <button
            onClick={() => setActiveTab('NEW')}
            className={`pb-2 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'NEW'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            + नया वीडियो लिंक जोड़ें
          </button>
          <button
            onClick={() => setActiveTab('LIST')}
            className={`pb-2 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'LIST'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            सक्रिय वीडियो सूची ({videoPosts.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 max-h-[75vh] overflow-y-auto">
          {activeTab === 'NEW' ? (
            <form onSubmit={handleSave} className="space-y-4">
              {/* 1. URL Input & Test Button */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Facebook / Instagram वीडियो लिंक (URL) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    placeholder="https://www.facebook.com/... अथवा https://www.instagram.com/reel/..."
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      setValidationResult(null);
                    }}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-red-500"
                  />
                  <button
                    type="button"
                    onClick={handleValidateUrl}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors shrink-0 cursor-pointer"
                  >
                    सत्यापित करें
                  </button>
                </div>

                {/* Validation Feedback */}
                {validationResult?.tested && (
                  <div
                    className={`mt-2 p-2 rounded-lg text-xs flex items-center gap-2 ${
                      validationResult.isValid
                        ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                        : 'bg-red-950/60 border border-red-800 text-red-300'
                    }`}
                  >
                    {validationResult.isValid ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                        <span>
                          वैध {validationResult.platform} वीडियो लिंक पहचाना गया।
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                        <span>{validationResult.errorMessage}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Video Title */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  वीडियो शीर्षक (Title / Headline) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="उदा. भोपाल मेट्रो द्वितीय चरण ट्रायल रन की एक्सक्लूसिव कवरेज"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-red-500"
                />
              </div>

              {/* 3. Caption / Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  विवरण / कैप्शन (Optional Caption)
                </label>
                <textarea
                  rows={2}
                  placeholder="समाचार का संक्षिप्त विवरण दर्ज करें..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-red-500"
                />
              </div>

              {/* 4. Category & District */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    श्रेणी (Category)
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-red-500"
                  >
                    <option value="मध्य प्रदेश">मध्य प्रदेश</option>
                    <option value="राजनीति">राजनीति</option>
                    <option value="अपराध">अपराध</option>
                    <option value="व्यापार">व्यापार</option>
                    <option value="खेल">खेल</option>
                    <option value="पर्यटन">पर्यटन</option>
                    <option value="धर्म-संस्कृति">धर्म-संस्कृति</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    ज़िला (District)
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. भोपाल / इंदौर"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-red-500"
                  />
                </div>
              </div>

              {/* 5. Custom Thumbnail URL (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  कस्टम थंबनेल फोटो URL (वैकल्पिक)
                </label>
                <input
                  type="url"
                  placeholder="https://... (यदि कवर फोटो उपलब्ध हो)"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-red-500"
                />
              </div>

              {/* 6. Display Order & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    प्रदर्शन प्राथमिकता क्रम (Display Order)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    प्रकाशन स्थिति (Status)
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'PUBLISHED' | 'DRAFT')}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-red-500"
                  >
                    <option value="PUBLISHED">प्रकाशित (PUBLISHED)</option>
                    <option value="DRAFT">ड्राफ्ट (DRAFT)</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-md cursor-pointer"
                >
                  वीडियो लिंक सहेजें
                </button>
              </div>
            </form>
          ) : (
            /* Tab 2: Existing Video Posts List */
            <div className="space-y-3">
              {videoPosts.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">
                  कोई वीडियो लिंक नहीं है। कृपया "नया वीडियो लिंक जोड़ें" टैब से जोड़ें।
                </p>
              ) : (
                videoPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="truncate flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                          {post.platform}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            post.status === 'PUBLISHED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {post.status}
                        </span>
                        {post.category && (
                          <span className="text-[10px] text-slate-400">
                            • {post.category}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-white truncate">
                        {post.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">
                        {post.url}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
                        title="लिंक खोलें"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => {
                          if (confirm(`क्या आप "${post.title}" को हटाना चाहते हैं?`)) {
                            onDeleteVideoPost(post.id);
                          }
                        }}
                        className="p-1.5 bg-red-950/60 hover:bg-red-900 border border-red-800/60 text-red-400 rounded-lg text-xs transition-colors cursor-pointer"
                        title="हटाएं"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
