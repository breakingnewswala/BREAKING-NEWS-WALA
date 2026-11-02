import React from 'react';
import { ReporterArticle } from '../types';
import { Edit3, Eye, AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface ArticleListItemProps {
  article: ReporterArticle;
  onEdit?: (article: ReporterArticle) => void;
  onView?: (article: ReporterArticle) => void;
}

export const ArticleListItem: React.FC<ArticleListItemProps> = ({
  article,
  onEdit,
  onView,
}) => {
  // Map lifecycle statuses to Hindi labels & visual styles
  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DRAFT':
        return {
          label: 'ड्राफ्ट (अप्रकाशित)',
          className: 'status-chip draft',
          icon: <Clock size={12} />,
        };
      case 'PENDING_REVIEW':
        return {
          label: 'समीक्षाधीन (न्यूज़रूम कतार)',
          className: 'status-chip pending_review',
          icon: <Clock size={12} />,
        };
      case 'REVISION_REQUESTED':
        return {
          label: 'सुधार अपेक्षित',
          className: 'status-chip revision_requested',
          icon: <AlertCircle size={12} />,
        };
      case 'PUBLISHED':
        return {
          label: 'लाइव प्रकाशित',
          className: 'status-chip published',
          icon: <CheckCircle2 size={12} />,
        };
      case 'REJECTED':
        return {
          label: 'अस्वीकृत',
          className: 'status-chip rejected',
          icon: <XCircle size={12} />,
        };
      default:
        return {
          label: status,
          className: 'status-chip draft',
          icon: <Clock size={12} />,
        };
    }
  };

  const badge = getStatusBadge(article.status);
  const formattedDate = article.updatedAt
    ? new Date(article.updatedAt).toLocaleDateString('hi-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '10px',
        padding: '14px',
        marginBottom: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {/* Top Bar: Badges & Timestamp */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
        <span className={badge.className}>
          {badge.icon}
          <span>{badge.label}</span>
        </span>

        <span style={{ fontSize: '11px', color: '#64748B' }}>
          {formattedDate}
        </span>
      </div>

      {/* Headline */}
      <h3
        style={{
          fontSize: '15px',
          fontWeight: 700,
          color: '#1E293B',
          lineHeight: '1.45',
          cursor: onView ? 'pointer' : 'default',
        }}
        onClick={() => onView && onView(article)}
      >
        {article.title || 'शीर्षक रहित खबर'}
      </h3>

      {/* Meta Pills (Category & District) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748B', flexWrap: 'wrap' }}>
        {article.primaryLocationNameHi && (
          <span style={{ backgroundColor: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
            📍 {article.primaryLocationNameHi}
          </span>
        )}
        {article.primaryCategoryNameHi && (
          <span style={{ backgroundColor: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
            {article.primaryCategoryNameHi}
          </span>
        )}
        {Boolean(article.viewCount && article.viewCount > 0) && (
          <span style={{ color: '#059669', fontWeight: 600 }}>
            👁️ {article.viewCount} पाठक
          </span>
        )}
      </div>

      {/* Editorial Feedback Alert Snippet */}
      {article.editorialNotes && article.status === 'REVISION_REQUESTED' && (
        <div
          style={{
            backgroundColor: '#FAF5FF',
            border: '1px solid #E9D5FF',
            borderRadius: '6px',
            padding: '8px 10px',
            fontSize: '12px',
            color: '#6B21A8',
            marginTop: '4px',
          }}
        >
          <strong>संपादकीय निर्देश:</strong> {article.editorialNotes}
        </div>
      )}

      {/* Rejection Reason Snippet */}
      {article.rejectionReason && article.status === 'REJECTED' && (
        <div
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '6px',
            padding: '8px 10px',
            fontSize: '12px',
            color: '#991B1B',
            marginTop: '4px',
          }}
        >
          <strong>अस्वीकृति कारण:</strong> {article.rejectionReason}
        </div>
      )}

      {/* Action Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '4px', paddingTop: '6px', borderTop: '1px solid #F1F5F9' }}>
        {onView && (
          <button
            type="button"
            onClick={() => onView(article)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'transparent',
              border: 'none',
              color: '#344FD6',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '6px 8px',
            }}
          >
            <Eye size={14} />
            <span>विवरण</span>
          </button>
        )}

        {onEdit && (article.status === 'DRAFT' || article.status === 'REVISION_REQUESTED') && (
          <button
            type="button"
            onClick={() => onEdit(article)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#ED1727',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '6px 12px',
            }}
          >
            <Edit3 size={13} />
            <span>{article.status === 'REVISION_REQUESTED' ? 'सुधार करें' : 'संपादन जारी रखें'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ArticleListItem;

