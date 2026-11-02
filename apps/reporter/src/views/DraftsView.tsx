import React, { useEffect, useState } from 'react';
import { FileText, PlusCircle, RefreshCw } from 'lucide-react';
import { ReporterArticle } from '../types';
import { fetchMyArticles } from '../lib/api';
import { ArticleListItem } from '../components/ArticleListItem';

interface DraftsViewProps {
  onNavigate: (route: string) => void;
  onEditArticle: (article: ReporterArticle) => void;
}

export const DraftsView: React.FC<DraftsViewProps> = ({
  onNavigate,
  onEditArticle,
}) => {
  const [drafts, setDrafts] = useState<ReporterArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDrafts = async () => {
    setIsLoading(true);
    try {
      const all = await fetchMyArticles('DRAFT');
      const filtered = all.filter((a) => a.status === 'DRAFT');
      setDrafts(filtered);
    } catch {
      // Offline
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  return (
    <div className="reporter-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B' }}>
            ड्राफ्ट समाचार (Saved Drafts)
          </h1>
          <p style={{ fontSize: '12px', color: '#64748B' }}>
            अप्रकाशित आलेख जिन्हें आप कभी भी पूरा कर सकते हैं
          </p>
        </div>

        <button
          type="button"
          onClick={loadDrafts}
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

      {/* Drafts List */}
      {drafts.length > 0 ? (
        <div>
          {drafts.map((draft) => (
            <ArticleListItem
              key={draft.id}
              article={draft}
              onEdit={onEditArticle}
            />
          ))}
        </div>
      ) : (
        <div className="reporter-card" style={{ textAlign: 'center', padding: '40px 16px' }}>
          <FileText size={40} color="#CBD5E1" style={{ margin: '0 auto 10px auto' }} />
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#334155' }}>
            कोई सुरक्षित ड्राफ्ट नहीं है
          </h2>
          <p style={{ fontSize: '12px', color: '#64748B', maxWidth: '320px', margin: '4px auto 16px auto' }}>
            जब आप कोई खबर लिखना शुरू करते हैं, तो उसका अप्रकाशित ड्राफ्ट यहाँ सुरक्षित रहता है।
          </p>

          <button
            type="button"
            onClick={() => onNavigate('#/news/create')}
            className="btn btn-primary"
            style={{ margin: '0 auto' }}
          >
            <PlusCircle size={16} />
            <span>नई खबर लिखें</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default DraftsView;

