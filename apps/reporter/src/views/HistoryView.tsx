import React, { useEffect, useState } from 'react';
import { History, RefreshCw } from 'lucide-react';
import { ReporterArticle } from '../types';
import { fetchMyArticles } from '../lib/api';
import { ArticleListItem } from '../components/ArticleListItem';

interface HistoryViewProps {
  onEditArticle: (article: ReporterArticle) => void;
  onViewArticle: (article: ReporterArticle) => void;
}

type TabKey = 'ALL' | 'PENDING_REVIEW' | 'REVISION_REQUESTED' | 'PUBLISHED' | 'REJECTED';

export const HistoryView: React.FC<HistoryViewProps> = ({
  onEditArticle,
  onViewArticle,
}) => {
  const [articles, setArticles] = useState<ReporterArticle[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const loadArticles = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMyArticles();
      setArticles(data);
    } catch {
      // Offline
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'ALL', label: 'सभी समाचार' },
    { key: 'PENDING_REVIEW', label: 'समीक्षाधीन' },
    { key: 'REVISION_REQUESTED', label: 'सुधार अपेक्षित' },
    { key: 'PUBLISHED', label: 'प्रकाशित' },
    { key: 'REJECTED', label: 'अस्वीकृत' },
  ];

  const filteredArticles = articles.filter((a) => {
    if (activeTab === 'ALL') return true;
    return a.status.toUpperCase() === activeTab;
  });

  return (
    <div className="reporter-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B' }}>
            रिपोर्टिंग इतिहास (Submission History)
          </h1>
          <p style={{ fontSize: '12px', color: '#64748B' }}>
            आपके द्वारा फील्ड से प्रेषित सभी समाचारों की स्थिति व प्रगति
          </p>
        </div>

        <button
          type="button"
          onClick={loadArticles}
          style={{
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>रिफ्रेश</span>
        </button>
      </div>

      {/* Horizontal Filter Tabs (Scrollable on Mobile) */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '16px',
          scrollbarWidth: 'none',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const count =
            tab.key === 'ALL'
              ? articles.length
              : articles.filter((a) => a.status.toUpperCase() === tab.key).length;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                border: '1px solid',
                cursor: 'pointer',
                backgroundColor: isActive ? '#ED1727' : '#FFFFFF',
                color: isActive ? '#FFFFFF' : '#475569',
                borderColor: isActive ? '#ED1727' : '#CBD5E1',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  marginLeft: '6px',
                  fontSize: '11px',
                  opacity: isActive ? 1 : 0.7,
                  backgroundColor: isActive ? 'rgba(0,0,0,0.2)' : '#F1F5F9',
                  padding: '1px 6px',
                  borderRadius: '9999px',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filtered Articles List */}
      {filteredArticles.length > 0 ? (
        <div>
          {filteredArticles.map((art) => (
            <ArticleListItem
              key={art.id}
              article={art}
              onEdit={onEditArticle}
              onView={onViewArticle}
            />
          ))}
        </div>
      ) : (
        <div className="reporter-card" style={{ textAlign: 'center', padding: '40px 16px' }}>
          <History size={36} color="#CBD5E1" style={{ margin: '0 auto 8px auto' }} />
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#334155' }}>
            इस श्रेणी में कोई खबर नहीं है
          </h2>
          <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
            चयनित फ़िल्टर के अंतर्गत वर्तमान में कोई रिकॉर्ड उपलब्ध नहीं है।
          </p>
        </div>
      )}
    </div>
  );
};

export default HistoryView;

