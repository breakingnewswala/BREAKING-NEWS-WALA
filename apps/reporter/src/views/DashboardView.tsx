import React, { useEffect, useState } from 'react';
import {
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  PlusCircle,
  TrendingUp,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { ReporterArticle, ReporterUser, TerritoryAssignment } from '../types';
import { fetchMyArticles, fetchMyTerritories } from '../lib/api';
import { StatCard } from '../components/StatCard';
import { ArticleListItem } from '../components/ArticleListItem';

interface DashboardViewProps {
  user: ReporterUser;
  onNavigate: (route: string) => void;
  onEditArticle: (article: ReporterArticle) => void;
  onViewArticle: (article: ReporterArticle) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  onNavigate,
  onEditArticle,
  onViewArticle,
}) => {
  const [articles, setArticles] = useState<ReporterArticle[]>([]);
  const [territories, setTerritories] = useState<TerritoryAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [articlesData, territoryData] = await Promise.all([
        fetchMyArticles(),
        fetchMyTerritories(),
      ]);
      setArticles(articlesData);
      setTerritories(territoryData);
    } catch {
      // Offline fallback handling
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Compute stat counts
  const publishedCount = articles.filter((a) => a.status === 'PUBLISHED').length;
  const pendingCount = articles.filter((a) => a.status === 'PENDING_REVIEW').length;
  const revisionsCount = articles.filter((a) => a.status === 'REVISION_REQUESTED').length;
  const draftsCount = articles.filter((a) => a.status === 'DRAFT').length;

  const recentArticles = articles.slice(0, 5);

  return (
    <div className="reporter-container">
      {/* 1. Welcome & Territory Card */}
      <div className="reporter-card" style={{ background: 'linear-gradient(135deg, #111827 0%, #1F2937 100%)', color: '#FFFFFF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800 }}>
                नमस्ते, {user.fullName || 'संवाददाता'}
              </span>
              {user.isTrustedPublisher && (
                <span style={{ backgroundColor: '#FDE900', color: '#111827', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                  ★ अधिकृत प्रकाशक
                </span>
              )}
            </div>

            {/* Assigned Beats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#CBD5E1', flexWrap: 'wrap' }}>
              <MapPin size={14} color="#FDE900" />
              <span>आवंटित क्षेत्र (Assigned Territory):</span>
              {territories.length > 0 ? (
                territories.map((t) => (
                  <span
                    key={t.districtId}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 600,
                      color: '#FDE900',
                    }}
                  >
                    {t.districtNameHi} {t.divisionNameHi ? `(${t.divisionNameHi} संभाग)` : ''}
                  </span>
                ))
              ) : (
                <span style={{ color: '#94A3B8' }}>{user.homeDistrictId || 'मध्य प्रदेश (मुख्यालय)'}</span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={loadDashboardData}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#FFFFFF',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>रिफ्रेश</span>
          </button>
        </div>

        {/* Quick Dispatch CTA Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            type="button"
            onClick={() => onNavigate('#/news/create')}
            className="btn btn-primary"
            style={{ padding: '10px 14px', fontSize: '13px' }}
          >
            <PlusCircle size={16} />
            <span>नई खबर दर्ज करें</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('#/performance')}
            className="btn btn-secondary"
            style={{ padding: '10px 14px', fontSize: '13px', backgroundColor: '#FFFFFF', color: '#1E293B' }}
          >
            <TrendingUp size={16} color="#344FD6" />
            <span>पाठक आंकड़े</span>
          </button>
        </div>
      </div>

      {/* 2. Urgent Revision Notice (If Any) */}
      {revisionsCount > 0 && (
        <div
          onClick={() => onNavigate('#/news/history')}
          style={{
            backgroundColor: '#FAF5FF',
            border: '1px solid #C084FC',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={22} color="#7E22CE" />
            <div>
              <p style={{ fontSize: '14px', fontWeight: 800, color: '#6B21A8' }}>
                संपादकीय सुधार अपेक्षित ({revisionsCount} समाचार)
              </p>
              <p style={{ fontSize: '12px', color: '#7E22CE' }}>
                न्यूज़रूम डेस्क द्वारा संशोधन निर्देश दिए गए हैं। कृपया विवरण देखकर अद्यतन करें।
              </p>
            </div>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#7E22CE' }}>देखें →</span>
        </div>
      )}

      {/* 3. Stat Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        <StatCard
          title="लाइव प्रकाशित"
          count={publishedCount}
          icon={<CheckCircle2 size={20} />}
          accentColor="#10B981"
          bgColor="#DCFCE7"
          onClick={() => onNavigate('#/news/history')}
        />
        <StatCard
          title="समीक्षाधीन"
          count={pendingCount}
          icon={<Clock size={20} />}
          accentColor="#B45309"
          bgColor="#FEF3C7"
          onClick={() => onNavigate('#/news/history')}
        />
        <StatCard
          title="सुधार अपेक्षित"
          count={revisionsCount}
          icon={<AlertCircle size={20} />}
          accentColor="#7E22CE"
          bgColor="#F3E8FF"
          onClick={() => onNavigate('#/news/history')}
        />
        <StatCard
          title="ड्राफ्ट"
          count={draftsCount}
          icon={<FileText size={20} />}
          accentColor="#475569"
          bgColor="#F1F5F9"
          onClick={() => onNavigate('#/news/drafts')}
        />
      </div>

      {/* 4. Recent Dispatches Activity Section */}
      <div className="reporter-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B' }}>
            हालिया गतिविधियाँ (Recent Dispatches)
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('#/news/history')}
            style={{ fontSize: '12px', fontWeight: 700, color: '#344FD6', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            सभी देखें →
          </button>
        </div>

        {recentArticles.length > 0 ? (
          <div>
            {recentArticles.map((art) => (
              <ArticleListItem
                key={art.id}
                article={art}
                onEdit={onEditArticle}
                onView={onViewArticle}
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748B' }}>
            <FileText size={36} color="#CBD5E1" style={{ margin: '0 auto 8px auto' }} />
            <p style={{ fontSize: '14px', fontWeight: 600 }}>अभी कोई समाचार दर्ज नहीं है</p>
            <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
              फील्ड से अपनी पहली खबर दर्ज करने के लिए &apos;नई खबर दर्ज करें&apos; पर टैप करें।
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardView;

