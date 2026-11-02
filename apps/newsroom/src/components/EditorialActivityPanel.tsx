import React, { useState, useEffect } from 'react';
import { Activity, Clock, CheckCircle2, XCircle, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { EditorialReviewRecord } from '../types';
import { fetchEditorialActivity } from '../lib/api';

interface EditorialActivityPanelProps {
  onViewArticle?: (articleId: string) => void;
}

export const EditorialActivityPanel: React.FC<EditorialActivityPanelProps> = ({ onViewArticle }) => {
  const [activities, setActivities] = useState<EditorialReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivity = async () => {
    try {
      const records = await fetchEditorialActivity(15);
      setActivities(records);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivity();
    // Controlled polling: 60 seconds interval with cleanup
    const timer = setInterval(loadActivity, 60000);
    return () => clearInterval(timer);
  }, []);

  const getActionBadge = (action: string) => {
    switch (action.toLowerCase()) {
      case 'approve':
      case 'direct_published':
        return {
          icon: CheckCircle2,
          color: '#059669',
          bg: '#D1FAE5',
          label: 'प्रकाशित एवं अनुमोदित',
        };
      case 'claim':
        return {
          icon: ShieldCheck,
          color: '#2563EB',
          bg: '#DBEAFE',
          label: 'समीक्षा हेतु क्लेम',
        };
      case 'request_changes':
        return {
          icon: RotateCcw,
          color: '#D97706',
          bg: '#FEF3C7',
          label: 'संशोधन अनुरोध',
        };
      case 'reject':
        return {
          icon: XCircle,
          color: '#DC2626',
          bg: '#FEE2E2',
          label: 'अस्वीकृत',
        };
      case 'retract':
        return {
          icon: AlertTriangle,
          color: '#9333EA',
          bg: '#F3E8FF',
          label: 'आपातकालीन वापसी',
        };
      default:
        return {
          icon: Activity,
          color: '#475569',
          bg: '#F1F5F9',
          label: action,
        };
    }
  };

  return (
    <div className="newsroom-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <h2 className="card-title" style={{ marginBottom: 0 }}>
          <Activity size={18} color="#344FD6" />
          <span>लाइव संपादकीय डेस्क गतिविधि (Audit Activity)</span>
        </h2>
        <span style={{ fontSize: '11px', color: '#64748B' }}>
          प्रत्येक 60 सेकंड में स्वतः रिफ्रेश
        </span>
      </div>

      {loading && activities.length === 0 ? (
        <p style={{ fontSize: '12px', color: '#94A3B8', textAlign: 'center', padding: '16px 0' }}>
          संपादकीय गतिविधियां लोड हो रही हैं...
        </p>
      ) : activities.length === 0 ? (
        <p style={{ fontSize: '12px', color: '#94A3B8', textAlign: 'center', padding: '16px 0' }}>
          हाल ही में कोई संपादकीय समीक्षा दर्ज नहीं हुई है।
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {activities.map((act) => {
            const badge = getActionBadge(act.action);
            const Icon = badge.icon;
            const timeStr = act.createdAt
              ? new Date(act.createdAt).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <div
                key={act.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: badge.bg,
                      color: badge.color,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Icon size={12} />
                    <span>{badge.label}</span>
                  </span>

                  <span
                    style={{
                      fontWeight: 700,
                      color: '#0F172A',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      cursor: onViewArticle && act.news?.id ? 'pointer' : 'default',
                    }}
                    onClick={() => {
                      if (onViewArticle && act.news?.id) {
                        onViewArticle(act.news.id);
                      }
                    }}
                    title={act.news?.title || act.newsId}
                  >
                    {act.news?.title || `आलेख ID: ${act.newsId.slice(0, 8)}...`}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px', whiteSpace: 'nowrap' }}>
                  <span style={{ color: '#64748B', fontSize: '11px' }}>
                    {act.reviewer?.fullName || 'डेस्क संपादक'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94A3B8', fontSize: '11px' }}>
                    <Clock size={11} />
                    <span>{timeStr}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

