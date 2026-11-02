import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Clock,
  FileText,
  MapPin,
  Server,
  ArrowRight,
  RefreshCw,
  Activity,
} from 'lucide-react';
import { fetchAdminStats } from '../lib/api';
import { AdminStats } from '../types';
import { AdminTab } from '../components/AdminSidebar';

interface AdminDashboardViewProps {
  onNavigate: (tab: AdminTab) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'डैशबोर्ड डेटा लोड करने में विफल।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF' }}>
            प्लेटफ़ॉर्म एडमिनिस्ट्रेटिव डैशबोर्ड (Admin Overview)
          </h1>
          <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '2px' }}>
            केंद्रीय उपयोगकर्ता, रिपोर्टर नेटवर्क, आलेख सांख्यिकी एवं सिस्टम स्वास्थ्य की वास्तविक स्थिति
          </p>
        </div>
        <button
          type="button"
          onClick={loadStats}
          disabled={loading}
          className="btn btn-secondary btn-sm"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>ताज़ा करें</span>
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#F87171',
            fontSize: '13px',
            marginBottom: '20px',
          }}
        >
          {error}
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <div className="stat-box" style={{ borderLeft: '3px solid #344FD6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-title">कुल पंजीकृत नागरिक</span>
            <Users size={18} color="#344FD6" />
          </div>
          <div className="stat-value">{stats ? stats.totalUsers : '...'}</div>
          <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '4px' }}>
            सक्रिय: <strong style={{ color: '#4ADE80' }}>{stats?.activeUsers ?? 0}</strong> | निलंबित: {stats?.suspendedUsers ?? 0}
          </div>
        </div>

        <div className="stat-box" style={{ borderLeft: '3px solid #FDE900' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-title">सत्यापन प्रतीक्षारत रिपोर्टर</span>
            <Clock size={18} color="#FDE900" />
          </div>
          <div className="stat-value" style={{ color: '#FACC15' }}>
            {stats ? stats.pendingReporters : '...'}
          </div>
          <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '4px' }}>
            त्वरित सत्यापन आवश्यक
          </div>
        </div>

        <div className="stat-box" style={{ borderLeft: '3px solid #16A34A' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-title">सत्यापित फील्ड रिपोर्टर</span>
            <UserCheck size={18} color="#16A34A" />
          </div>
          <div className="stat-value" style={{ color: '#4ADE80' }}>
            {stats ? stats.activeReporters : '...'}
          </div>
          <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '4px' }}>
            कुल आवेदन: {stats?.totalReporters ?? 0}
          </div>
        </div>

        <div className="stat-box" style={{ borderLeft: '3px solid #ED1727' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-title">लाइव प्रकाशित समाचार</span>
            <FileText size={18} color="#ED1727" />
          </div>
          <div className="stat-value">{stats ? stats.publishedArticles : '...'}</div>
          <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '4px' }}>
            कुल दर्ज आलेख: {stats?.totalArticles ?? 0}
          </div>
        </div>

        <div className="stat-box" style={{ borderLeft: '3px solid #06B6D4' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-title">म.प्र. जिला कवरेज</span>
            <MapPin size={18} color="#06B6D4" />
          </div>
          <div className="stat-value">{stats ? `${stats.districtCoverageCount} / 55` : '...'}</div>
          <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '4px' }}>
            सक्रिय बीट असाइनमेंट वाले जिले
          </div>
        </div>

        <div className="stat-box" style={{ borderLeft: '3px solid #8B5CF6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-title">सिस्टम अपटाइम व स्थिति</span>
            <Server size={18} color="#8B5CF6" />
          </div>
          <div className="stat-value" style={{ fontSize: '20px', color: '#A78BFA' }}>
            {stats ? `${Math.floor(stats.systemHealth.uptimeSeconds / 60)} मि.` : '...'}
          </div>
          <div style={{ fontSize: '11.5px', color: '#4ADE80', marginTop: '4px' }}>
            डेटाबेस: सक्रिय | रेडिस: सक्रिय
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px' }}>
          त्वरित प्रशासनिक संचालन (Quick Actions)
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button
            type="button"
            onClick={() => onNavigate('reporters')}
            className="btn btn-primary"
          >
            <UserCheck size={14} />
            <span>लंबित रिपोर्टर सत्यापन ({stats?.pendingReporters ?? 0})</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('territory')}
            className="btn btn-secondary"
          >
            <MapPin size={14} />
            <span>जिला बीट आवंटन</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('users')}
            className="btn btn-secondary"
          >
            <Users size={14} />
            <span>उपयोगकर्ता प्रबंधन</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="btn btn-secondary"
          >
            <Server size={14} />
            <span>प्लेटफ़ॉर्म सेटिंग्स</span>
          </button>
        </div>
      </div>

      {/* Recent Administrative Audit Actions */}
      <div className="admin-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={17} color="#344FD6" />
            <span>हालिया प्रशासनिक ऑडिट गतिविधियां (Recent Audit Logs)</span>
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('audit')}
            style={{
              background: 'none',
              border: 'none',
              color: '#38BDF8',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>सभी लॉग देखें</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {stats && stats.recentAuditActions && stats.recentAuditActions.length > 0 ? (
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>क्रिया (Action)</th>
                  <th>प्रशासक (Actor)</th>
                  <th>लक्षित इकाई (Target)</th>
                  <th>आईपी पता (IP Address)</th>
                  <th>दिनांक व समय (Timestamp)</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentAuditActions.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className="badge badge-active">{log.action}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{log.actorName || 'सिस्टम'}</td>
                    <td style={{ color: '#94A3B8' }}>{log.targetEntityType}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{log.ipAddress}</td>
                    <td style={{ color: '#94A3B8' }}>
                      {new Date(log.createdAt).toLocaleString('hi-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px', color: '#64748B', fontSize: '13px' }}>
            वर्तमान में कोई ऑडिट रिकॉर्ड उपलब्ध नहीं है।
          </div>
        )}
      </div>
    </div>
  );
};
