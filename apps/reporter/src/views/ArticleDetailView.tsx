import React, { useEffect, useState } from 'react';
import { ArrowLeft, Edit3 } from 'lucide-react';
import { ArticleReviewRecord, ReporterArticle } from '../types';
import { fetchArticleReviews } from '../lib/api';

interface ArticleDetailViewProps {
  article: ReporterArticle;
  onBack: () => void;
  onEdit: (article: ReporterArticle) => void;
}

export const ArticleDetailView: React.FC<ArticleDetailViewProps> = ({
  article,
  onBack,
  onEdit,
}) => {
  const [reviews, setReviews] = useState<ArticleReviewRecord[]>([]);

  useEffect(() => {
    async function loadReviews() {
      try {
        const reviewData = await fetchArticleReviews(article.id);
        setReviews(reviewData);
      } catch {
        // Fallback
      }
    }
    loadReviews();
  }, [article.id]);

  const getStatusText = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DRAFT': return 'ड्राफ्ट (अप्रकाशित)';
      case 'PENDING_REVIEW': return 'समीक्षाधीन (न्यूज़रूम कतार)';
      case 'REVISION_REQUESTED': return 'संपादकीय सुधार अपेक्षित';
      case 'PUBLISHED': return 'लाइव प्रकाशित';
      case 'REJECTED': return 'अस्वीकृत';
      default: return status;
    }
  };

  return (
    <div className="reporter-container">
      {/* Top Bar: Back & Edit CTA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'transparent',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            color: '#475569',
            cursor: 'pointer',
            padding: '6px 0',
          }}
        >
          <ArrowLeft size={16} />
          <span>वापस लौटें</span>
        </button>

        {(article.status === 'DRAFT' || article.status === 'REVISION_REQUESTED') && (
          <button
            type="button"
            onClick={() => onEdit(article)}
            className="btn btn-primary"
            style={{ padding: '6px 14px', fontSize: '12px', minHeight: '36px' }}
          >
            <Edit3 size={14} />
            <span>{article.status === 'REVISION_REQUESTED' ? 'निर्देशानुसार सुधार करें' : 'संपादित करें'}</span>
          </button>
        )}
      </div>

      {/* Main Article Preview Card */}
      <div className="reporter-card">
        {/* Status & Beats Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <span className={`status-chip ${article.status.toLowerCase()}`}>
            {getStatusText(article.status)}
          </span>

          {article.primaryLocationNameHi && (
            <span style={{ fontSize: '11px', fontWeight: 600, backgroundColor: '#F1F5F9', padding: '2px 8px', borderRadius: '4px', color: '#1E293B' }}>
              📍 {article.primaryLocationNameHi}
            </span>
          )}

          {article.primaryCategoryNameHi && (
            <span style={{ fontSize: '11px', fontWeight: 600, backgroundColor: '#F1F5F9', padding: '2px 8px', borderRadius: '4px', color: '#1E293B' }}>
              {article.primaryCategoryNameHi}
            </span>
          )}
        </div>

        {/* Master Headline */}
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', lineHeight: '1.4', marginBottom: '8px' }}>
          {article.title}
        </h1>

        {/* Subhead */}
        {article.subheadline && (
          <p style={{ fontSize: '14px', color: '#475569', fontStyle: 'italic', marginBottom: '16px', borderLeft: '3px solid #ED1727', paddingLeft: '8px' }}>
            {article.subheadline}
          </p>
        )}

        {/* Media */}
        {article.featuredImageUrl && (
          <div style={{ margin: '16px 0', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#000', aspectRatio: '16/9' }}>
            <img
              src={article.featuredImageUrl}
              alt={article.imageCaption || article.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Caption & Attribution */}
        {(article.imageCaption || article.imageAttribution) && (
          <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '16px', fontStyle: 'italic' }}>
            {article.imageCaption && <span>{article.imageCaption} </span>}
            {article.imageAttribution && <span>(फोटो साभार: {article.imageAttribution})</span>}
          </div>
        )}

        {/* Body Content */}
        <div style={{ fontSize: '15px', color: '#1E293B', lineHeight: '1.85', whiteSpace: 'pre-wrap', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
          {article.bodyContent || article.excerpt || 'कोई विस्तृत विवरण उपलब्ध नहीं है।'}
        </div>
      </div>

      {/* Editorial Feedback & Review History Card */}
      <div className="reporter-card">
        <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>📋</span>
          <span>संपादकीय समीक्षा एवं फीडबैक विवरण</span>
        </h2>

        {/* Current Rejection / Revision Note */}
        {article.editorialNotes && (
          <div
            style={{
              backgroundColor: '#FAF5FF',
              border: '1px solid #E9D5FF',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '12px',
              fontSize: '13px',
              color: '#6B21A8',
            }}
          >
            <strong style={{ display: 'block', marginBottom: '4px' }}>संपादकीय सुधार निर्देश:</strong>
            <p>{article.editorialNotes}</p>
          </div>
        )}

        {article.rejectionReason && (
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '12px',
              fontSize: '13px',
              color: '#991B1B',
            }}
          >
            <strong style={{ display: 'block', marginBottom: '4px' }}>अस्वीकृति का आधिकारिक कारण:</strong>
            <p>{article.rejectionReason}</p>
          </div>
        )}

        {/* Review Log Records */}
        {reviews.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {reviews.map((rev) => (
              <div
                key={rev.id}
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, color: '#334155' }}>
                    निर्णय: {rev.decision}
                  </span>
                  <span style={{ color: '#94A3B8', fontSize: '11px' }}>
                    {new Date(rev.createdAt).toLocaleDateString('hi-IN')}
                  </span>
                </div>
                {rev.feedbackNotes && (
                  <p style={{ color: '#475569' }}>{rev.feedbackNotes}</p>
                )}
              </div>
            ))}
          </div>
        ) : !article.editorialNotes && !article.rejectionReason ? (
          <p style={{ fontSize: '12px', color: '#64748B' }}>
            वर्तमान में इस आलेख पर कोई संपादकीय टिप्पणी दर्ज नहीं है।
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default ArticleDetailView;
