import React, { useState, useEffect } from 'react';
import { 
  fetchArticlesQueue, 
  claimArticle, 
  fetchCategories, 
  fetchDistricts 
} from '../lib/api';
import { EditorialArticle, CategoryItem, DistrictItem } from '../types';

interface BreakingDeskViewProps {
  onOpenArticle: (articleId: string) => void;
}

export const BreakingDeskView: React.FC<BreakingDeskViewProps> = ({ onOpenArticle }) => {
  const [articles, setArticles] = useState<EditorialArticle[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [queueRes, catRes, distRes] = await Promise.all([
        fetchArticlesQueue({
          status: selectedStatus === 'all' ? undefined : selectedStatus,
          locationId: selectedLocation || undefined,
          isBreaking: true,
          limit: 50,
          page: 1,
        }),
        fetchCategories(),
        fetchDistricts(),
      ]);

      setArticles(queueRes.items);
      setCategories(catRes);
      setDistricts(distRes);
    } catch (err: any) {
      setError(err.message || 'ब्रेकिंग डेस्क डेटा लोड करने में विफल।');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedStatus, selectedLocation]);

  // Controlled 30-second polling for breaking desk if autoRefresh is enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchArticlesQueue({
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        locationId: selectedLocation || undefined,
        isBreaking: true,
        limit: 50,
        page: 1,
      }).then((res) => {
        setArticles(res.items);
      }).catch((err: any) => {
        console.warn('Breaking desk poll error:', err?.message);
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, selectedStatus, selectedLocation]);

  const handleFastClaim = async (articleId: string) => {
    setClaimingId(articleId);
    try {
      await claimArticle(articleId);
      onOpenArticle(articleId);
    } catch (err: any) {
      alert(`दावा विफल: ${err.message}`);
      setClaimingId(null);
      loadData();
    }
  };

  const getCategoryName = (art: EditorialArticle) => {
    if (art.primaryCategoryNameHi) return art.primaryCategoryNameHi;
    const found = categories.find((c) => c.id === art.primaryCategoryId);
    return found ? found.nameHi : 'सामान्य';
  };

  const getLocationName = (art: EditorialArticle) => {
    if (art.primaryLocationNameHi) return art.primaryLocationNameHi;
    const found = districts.find((d) => d.id === art.primaryLocationId);
    return found ? found.nameHi : 'सम्पूर्ण म.प्र.';
  };

  const urgentCount = articles.filter((a) => a.status === 'submitted' || a.status === 'pending_review').length;
  const inReviewCount = articles.filter((a) => a.status === 'under_review').length;
  const publishedCount = articles.filter((a) => a.status === 'published').length;

  return (
    <div className="space-y-6">
      {/* Breaking Desk Banner */}
      <div className="bg-red-950/40 border border-red-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-red-600/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <span className="flex h-4 w-4 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600"></span>
            </span>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                🚨 लाइव ब्रेकिंग न्यूज़ डेस्क (Breaking Operations Desk)
              </h1>
              <p className="text-xs text-red-200 mt-0.5">
                मध्य प्रदेश एवं राष्ट्रीय आपातकालीन समाचार, फ्लैश अपडेट्स तथा उच्च प्राथमिकता वाली घटनाओं का त्वरित सत्यापन।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                autoRefresh 
                  ? 'bg-red-600/20 border-red-500 text-red-200' 
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
              {autoRefresh ? 'स्वचालित रिफ्रेश सक्रिय (30s)' : 'मैनुअल रिफ्रेश'}
            </button>
            <button
              onClick={loadData}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
            >
              {isLoading ? 'ताज़ा हो रहा है...' : 'अभी ताज़ा करें'}
            </button>
          </div>
        </div>

        {/* Quick Breaking KPI Badges */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-red-900/60">
          <div className="bg-slate-900/60 rounded-lg p-2.5 border border-red-900/40">
            <div className="text-[11px] font-bold text-red-300">लंबित ब्रेकिंग दावे (Pending)</div>
            <div className="text-xl font-black text-red-400 mt-0.5">{urgentCount}</div>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-2.5 border border-yellow-900/40">
            <div className="text-[11px] font-bold text-yellow-300">जांच में ब्रेकिंग (Under Review)</div>
            <div className="text-xl font-black text-yellow-400 mt-0.5">{inReviewCount}</div>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-2.5 border border-green-900/40">
            <div className="text-[11px] font-bold text-green-300">आज प्रकाशित ब्रेकिंग (Published)</div>
            <div className="text-xl font-black text-green-400 mt-0.5">{publishedCount}</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400">स्थिति:</span>
          {(['all', 'submitted', 'pending_review', 'under_review', 'published'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors ${
                selectedStatus === st
                  ? 'bg-red-600 border-red-500 text-white shadow'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {st === 'all' && 'सभी ब्रेकिंग'}
              {st === 'submitted' && 'प्रतीक्षारत (Submitted)'}
              {st === 'pending_review' && 'समीक्षा कतार (Pending)'}
              {st === 'under_review' && 'डेस्क समीक्षाधीन (Reviewing)'}
              {st === 'published' && 'लाइव प्रकाशित (Published)'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-400">जिला:</label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:border-red-500 focus:outline-none"
          >
            <option value="">सम्पूर्ण मध्य प्रदेश (All Districts)</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nameHi} ({d.nameEn})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs">
          {error}
        </div>
      )}

      {/* Breaking Articles Grid */}
      {isLoading && articles.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-sm bg-slate-900 rounded-xl border border-slate-800 animate-pulse">
          🚨 ब्रेकिंग डेस्क डेटा संकलित किया जा रहा है...
        </div>
      ) : articles.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 rounded-xl border border-slate-800">
          <div className="text-4xl mb-3">📡</div>
          <h3 className="text-base font-bold text-white">वर्तमान में कोई ब्रेकिंग अलर्ट सक्रिय नहीं है</h3>
          <p className="text-xs text-slate-400 mt-1">
            जैसे ही रिपोर्टर या फील्ड स्ट्रिंगर द्वारा ब्रेकिंग न्यूज़ दर्ज की जाएगी, वह यहां प्राथमिकता क्रम में प्रदर्शित होगी।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((art) => (
            <div
              key={art.id}
              className={`bg-slate-900 rounded-xl border transition-all p-4 flex flex-col justify-between ${
                art.status === 'submitted' || art.status === 'pending_review'
                  ? 'border-red-500/80 shadow-md shadow-red-950/40 bg-gradient-to-b from-red-950/20 to-slate-900' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase bg-red-600 text-white animate-pulse">
                    ⚡ ब्रेकिंग अलर्ट
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    art.status === 'submitted' || art.status === 'pending_review' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                    art.status === 'under_review' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                    art.status === 'published' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {art.status === 'submitted' || art.status === 'pending_review' ? 'समीक्षा प्रतीक्षारत' :
                     art.status === 'under_review' ? 'समीक्षा जारी' :
                     art.status === 'published' ? 'प्रकाशित' : art.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white line-clamp-2 leading-relaxed mb-2">
                  {art.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                  {art.bodyContent}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 mb-3">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    📂 {getCategoryName(art)}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    📍 {getLocationName(art)}
                  </span>
                  {art.authorName && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      ✍️ {art.authorName}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-500">
                  {art.submittedAt 
                    ? new Date(art.submittedAt).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }) 
                    : new Date(art.createdAt).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>

                <div className="flex items-center gap-2">
                  {(art.status === 'submitted' || art.status === 'pending_review') && (
                    <button
                      onClick={() => handleFastClaim(art.id)}
                      disabled={claimingId === art.id}
                      className="px-2.5 py-1 text-xs font-black rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                    >
                      {claimingId === art.id ? 'दावा...' : 'त्वरित दावा (Claim)'}
                    </button>
                  )}
                  <button
                    onClick={() => onOpenArticle(art.id)}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  >
                    डेस्क खोलें →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
