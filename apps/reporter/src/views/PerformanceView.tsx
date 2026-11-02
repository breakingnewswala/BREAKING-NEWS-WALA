import React, { useEffect, useState } from 'react';
import { ArrowLeft, TrendingUp, Eye, RefreshCw } from 'lucide-react';
import { ReporterPerformanceData } from '../types';
import { fetchReporterPerformance } from '../lib/api';

interface PerformanceViewProps {
  onBack: () => void;
}

export const PerformanceView: React.FC<PerformanceViewProps> = ({ onBack }) => {
  const [performance, setPerformance] = useState<ReporterPerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadPerformance = async () => {
    setIsLoading(true);
    try {
      const data = await fetchReporterPerformance();
      setPerformance(data);
    } catch {
      // Offline
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPerformance();
  }, []);

  return (
    <div className="reporter-container">
      {/* Top Bar */}
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
          <span>डैशबोर्ड</span>
        </button>

        <button
          type="button"
          onClick={loadPerformance}
          style={{
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '12px',
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

      {/* Header Card */}
      <div className="reporter-card" style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)', color: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <TrendingUp size={24} color="#FDE900" />
          <h1 style={{ fontSize: '18px', fontWeight: 800 }}>
            रिपोर्टिंग प्रदर्शन व पाठक विश्लेषण
          </h1>
        </div>
        <p style={{ fontSize: '12px', color: '#DBEAFE', lineHeight: '1.6' }}>
          आपकी प्रकाशित खबरों का पाठक प्रभाव, व्यूज़ और क्षेत्रीय पहुंच आंकड़े
        </p>
      </div>

      {/* Primary Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        <div className="reporter-card" style={{ marginBottom: 0 }}>
          <p style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>कुल प्रकाशित खबरें</p>
          <p style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', fontFamily: 'Inter, sans-serif', marginTop: '4px' }}>
            {performance?.totalArticlesPublished || 0}
          </p>
        </div>

        <div className="reporter-card" style={{ marginBottom: 0 }}>
          <p style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>कुल पाठक संख्या (Total Views)</p>
          <p style={{ fontSize: '26px', fontWeight: 800, color: '#059669', fontFamily: 'Inter, sans-serif', marginTop: '4px' }}>
            {performance?.totalArticleViews || 0}
          </p>
        </div>

        <div className="reporter-card" style={{ marginBottom: 0 }}>
          <p style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>लाइव पाठक (Last 15m)</p>
          <p style={{ fontSize: '26px', fontWeight: 800, color: '#DC2626', fontFamily: 'Inter, sans-serif', marginTop: '4px' }}>
            {performance?.viewsLast15m || 0}
          </p>
        </div>
      </div>

      {/* Top Read Articles */}
      <div className="reporter-card">
        <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Eye size={16} color="#344FD6" />
          <span>सर्वाधिक पढ़ी गई खबरें (Top Read Stories)</span>
        </h2>

        {performance?.topPerformingArticles && performance.topPerformingArticles.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {performance.topPerformingArticles.map((story, idx) => (
              <div
                key={story.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: idx === 0 ? '#FDE900' : '#E2E8F0',
                      color: idx === 0 ? '#111827' : '#475569',
                      fontSize: '11px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {story.title}
                  </span>
                </div>

                <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669', flexShrink: 0 }}>
                  👁️ {story.views} व्यूज़
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '12px', color: '#64748B', textAlign: 'center', padding: '20px 0' }}>
            अभी कोई प्रकाशित खबर का पाठक डेटा उपलब्ध नहीं है।
          </p>
        )}
      </div>

      {/* Editorial Governance & Anti-Clickbait Notice (DEC-069) */}
      <div
        style={{
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          padding: '12px 14px',
          fontSize: '11px',
          color: '#64748B',
          lineHeight: '1.6',
        }}
      >
        <p style={{ fontWeight: 700, color: '#334155', marginBottom: '2px' }}>
          ⚖️ संपादकीय नीति एवं गुणवत्ता दिशा-निर्देश (DEC-069):
        </p>
        <p>
          BREAKING NEWS WALA पत्रकारिता की निष्पक्षता एवं विश्वसनीयता को सर्वोच्च प्राथमिकता देता है। यहाँ प्रदर्शित पाठक आंकड़े केवल जनहित पत्रकारिता के प्रभाव को मापने हेतु हैं। किसी भी प्रकार का प्रति-क्लिक प्रोत्साहन या क्लिकबेट भुगतान पूर्णतः प्रतिबंधित है।
        </p>
      </div>
    </div>
  );
};

export default PerformanceView;
