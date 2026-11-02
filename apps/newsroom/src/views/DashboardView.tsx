import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Clock,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Zap,
  ArrowRight,
  ShieldCheck,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { EditorialArticle, EditorialStats, EditorialUser } from '../types';
import { fetchArticlesQueue, fetchEditorialStats } from '../lib/api';
import { EditorialActivityPanel } from '../components/EditorialActivityPanel';

interface DashboardViewProps {
  user: EditorialUser;
  onNavigate: (route: string) => void;
  onOpenArticle: (articleId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  onNavigate,
  onOpenArticle,
}) => {
  const [stats, setStats] = useState<EditorialStats>({
    totalIncoming: 0,
    pendingReview: 0,
    underReview: 0,
    revisionRequested: 0,
    publishedToday: 0,
    publishedTotal: 0,
    rejected: 0,
    breakingNews: 0,
  });
  const [pendingArticles, setPendingArticles] = useState<EditorialArticle[]>([]);
  const [underReviewArticles, setUnderReviewArticles] = useState<EditorialArticle[]>([]);
  const [breakingArticles, setBreakingArticles] = useState<EditorialArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const [statsData, pendingData, underReviewData, breakingData] = await Promise.all([
        fetchEditorialStats(),
        fetchArticlesQueue({ status: 'pending_review', limit: 5 }),
        fetchArticlesQueue({ status: 'under_review', limit: 5 }),
        fetchArticlesQueue({ isBreaking: true, limit: 5 }),
      ]);

      setStats(statsData);
      setPendingArticles(pendingData.items);
      setUnderReviewArticles(underReviewData.items);
      setBreakingArticles(breakingData.items);
    } catch {
      // Graceful error state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="newsroom-content">
      {/* Top Welcome & Summary Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🏢</span>
            <span>सेंट्रल न्यूज़रूम कमान डेस्क</span>
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
            नमस्ते {user.fullName || 'संपादक'}, मध्य प्रदेश के 55 जिलों से आने वाली खबरों की वास्तविक समय स्थिति:
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => onNavigate('#/queue')}
            className="btn btn-primary"
          >
            <Inbox size={15} />
            <span>समीक्षा कतार खोलें</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('#/breaking')}
            className="btn btn-danger"
          >
            <Zap size={15} />
            <span>ब्रेकिंग डेस्क ({stats.breakingNews})</span>
          </button>
        </div>
      </div>

      {/* 1. Real-Time Server-Backed Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-header">
            <span className="stat-title">कुल आवक आलेख</span>
            <Inbox size={18} color="#344FD6" />
          </div>
          <div className="stat-value">{loading ? '...' : stats.totalIncoming}</div>
          <div className="stat-footer">समीक्षाधीन + जांची जा रही खबरें</div>
        </div>

        <div className="stat-card yellow">
          <div className="stat-header">
            <span className="stat-title">समीक्षा हेतु लंबित</span>
            <Clock size={18} color="#D97706" />
          </div>
          <div className="stat-value">{loading ? '...' : stats.pendingReview}</div>
          <div className="stat-footer">न्यूज़रूम में क्लेम हेतु तैयार</div>
        </div>

        <div className="stat-card blue">
          <div className="stat-header">
            <span className="stat-title">समीक्षाधीन (Claimed)</span>
            <ShieldCheck size={18} color="#2563EB" />
          </div>
          <div className="stat-value">{loading ? '...' : stats.underReview}</div>
          <div className="stat-footer">संपादक द्वारा जांची जा रही</div>
        </div>

        <div className="stat-card yellow">
          <div className="stat-header">
            <span className="stat-title">संशोधन अनुरोध</span>
            <RotateCcw size={18} color="#EA580C" />
          </div>
          <div className="stat-value">{loading ? '...' : stats.revisionRequested}</div>
          <div className="stat-footer">रिपोर्टर के पाले में लंबित</div>
        </div>

        <div className="stat-card green">
          <div className="stat-header">
            <span className="stat-title">आज प्रकाशित</span>
            <CheckCircle2 size={18} color="#059669" />
          </div>
          <div className="stat-value">{loading ? '...' : stats.publishedToday}</div>
          <div className="stat-footer">कुल लाइव: {stats.publishedTotal} आलेख</div>
        </div>

        <div className="stat-card red">
          <div className="stat-header">
            <span className="stat-title">अस्वीकृत आलेख</span>
            <XCircle size={18} color="#DC2626" />
          </div>
          <div className="stat-value">{loading ? '...' : stats.rejected}</div>
          <div className="stat-footer">तथ्य-जांच में अनुत्तीर्ण</div>
        </div>
      </div>

      {/* 2. Urgent Breaking News Ribbon (If Present) */}
      {breakingArticles.length > 0 && (
        <div
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #F87171',
            borderRadius: '10px',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge badge-breaking">
              <Zap size={12} />
              <span>ब्रेकिंग अलर्ट</span>
            </span>
            <strong style={{ fontSize: '14px', color: '#991B1B' }}>
              {breakingArticles[0]?.title}
            </strong>
            <span style={{ fontSize: '12px', color: '#7F1D1D' }}>
              📍 {breakingArticles[0]?.primaryLocationNameHi || breakingArticles[0]?.primaryLocationId}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onOpenArticle(breakingArticles[0]!.id)}
            className="btn btn-danger btn-sm"
          >
            <span>डेस्क पर खोलें</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* 3. Two-Column Workspace: Quick Incoming Queue vs Claimed & Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
        {/* Left Column: Incoming Pending Submissions */}
        <div className="newsroom-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 className="card-title" style={{ marginBottom: 0 }}>
              <Inbox size={18} color="#ED1727" />
              <span>नई आवक खबरें (Pending Review)</span>
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('#/queue?status=pending_review')}
              style={{ background: 'none', border: 'none', color: '#344FD6', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>सभी देखें ({stats.pendingReview})</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {loading && pendingArticles.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>लोड हो रहा है...</p>
          ) : pendingArticles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 10px', color: '#64748B', fontSize: '13px' }}>
              <FileText size={28} color="#CBD5E1" style={{ margin: '0 auto 8px auto', display: 'block' }} />
              <p>वर्तमान में कोई नई खबर समीक्षा हेतु लंबित नहीं है।</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingArticles.map((art) => (
                <div key={art.id} className="article-item" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span className="badge badge-pending">लंबित</span>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>
                        📍 {art.primaryLocationNameHi || art.primaryLocationId}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}>•</span>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>
                        {art.authorName || 'संवाद सूत्र'}
                      </span>
                    </div>
                    <div
                      style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                      onClick={() => onOpenArticle(art.id)}
                      title={art.title}
                    >
                      {art.title}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenArticle(art.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ whiteSpace: 'nowrap', marginLeft: '12px' }}
                  >
                    <span>समीक्षा करें</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Claimed / Under Review Desk */}
        <div className="newsroom-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 className="card-title" style={{ marginBottom: 0 }}>
              <ShieldCheck size={18} color="#2563EB" />
              <span>जांची जा रही खबरें (Under Review)</span>
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('#/my-claims')}
              style={{ background: 'none', border: 'none', color: '#344FD6', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>सभी देखें ({stats.underReview})</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {loading && underReviewArticles.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>लोड हो रहा है...</p>
          ) : underReviewArticles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 10px', color: '#64748B', fontSize: '13px' }}>
              <AlertTriangle size={28} color="#CBD5E1" style={{ margin: '0 auto 8px auto', display: 'block' }} />
              <p>वर्तमान में कोई आलेख समीक्षाधीन नहीं है। कतार से आलेख क्लेम करें।</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {underReviewArticles.map((art) => (
                <div key={art.id} className="article-item" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span className="badge badge-under-review">जांची जा रही</span>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>
                        📍 {art.primaryLocationNameHi || art.primaryLocationId}
                      </span>
                    </div>
                    <div
                      style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                      onClick={() => onOpenArticle(art.id)}
                      title={art.title}
                    >
                      {art.title}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenArticle(art.id)}
                    className="btn btn-primary btn-sm"
                    style={{ whiteSpace: 'nowrap', marginLeft: '12px' }}
                  >
                    <span>डेस्क खोलें</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Live Editorial Activity Feed Stream */}
      <EditorialActivityPanel onViewArticle={onOpenArticle} />
    </div>
  );
};

