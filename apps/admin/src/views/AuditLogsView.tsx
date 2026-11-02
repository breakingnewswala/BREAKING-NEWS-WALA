import React, { useState, useEffect } from 'react';
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { fetchAuditLogs } from '../lib/api';
import { AdminAuditLogItem } from '../types';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Inspector Modal State
  const [inspectedLog, setInspectedLog] = useState<AdminAuditLogItem | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetchAuditLogs({
        page,
        limit: 20,
        action: actionFilter.trim() || undefined,
        targetType: targetTypeFilter.trim() || undefined,
      });
      setLogs(res.items);
      setTotalPages(res.totalPages);
      setTotalRecords(res.total);
    } catch (err: any) {
      console.warn('Failed to load audit logs:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF' }}>
            अपरिवर्तनीय प्रशासनिक ऑडिट लॉग (Audit Trail Records)
          </h1>
          <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '2px' }}>
            प्लेटफ़ॉर्म प्रशासकों, संपादकों एवं सिस्टम द्वारा की गई समस्त महत्वपूर्ण कार्यवाहियों का अपरिवर्तनीय विधिक रिकॉर्ड
          </p>
        </div>
        <button
          type="button"
          onClick={loadLogs}
          disabled={loading}
          className="btn btn-secondary btn-sm"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>ताज़ा करें</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="admin-card" style={{ padding: '16px' }}>
        <form onSubmit={handleFilterSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: '1 1 220px' }}>
            <input
              type="text"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              placeholder="क्रिया (e.g. USER_STATUS, REPORTER_VERIFY)..."
              className="form-input"
            />
          </div>

          <div style={{ flex: '1 1 200px' }}>
            <input
              type="text"
              value={targetTypeFilter}
              onChange={(e) => setTargetTypeFilter(e.target.value)}
              placeholder="इकाई प्रकार (e.g. USER, REPORTER_PROFILE)..."
              className="form-input"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-sm">
            फ़िल्टर लागू करें
          </button>
        </form>
      </div>

      {/* Logs Table */}
      <div className="admin-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600 }}>
            कुल दर्ज ऑडिट लॉग: <strong>{totalRecords}</strong>
          </span>
          <span style={{ fontSize: '11px', color: '#64748B' }}>
            🔒 विधिक संरक्षण: ऑडिट लॉग संपादन अथवा विलोपन से पूर्णतः सुरक्षित हैं
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', fontSize: '13px' }}>
            ऑडिट लॉग लोड हो रहे हैं...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748B', fontSize: '13px' }}>
            कोई ऑडिट रिकॉर्ड नहीं मिला।
          </div>
        ) : (
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>क्रिया (Action Event)</th>
                  <th>प्रशासक / कर्ता (Actor)</th>
                  <th>लक्षित इकाई (Target Entity)</th>
                  <th>आईपी व क्लाइंट (Context)</th>
                  <th>समय (Timestamp)</th>
                  <th>पेलोड निरीक्षण</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className="badge badge-active" style={{ fontFamily: 'monospace', fontSize: '10.5px' }}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{log.actorName || 'सिस्टम'}</div>
                      <div style={{ fontSize: '10.5px', color: '#94A3B8', fontFamily: 'monospace' }}>
                        {log.actorUserId || 'SYSTEM_DAEMON'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#38BDF8' }}>{log.targetEntityType}</div>
                      <div style={{ fontSize: '10.5px', color: '#94A3B8', fontFamily: 'monospace' }}>
                        {log.targetEntityId}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontFamily: 'monospace', fontSize: '11.5px', color: '#CBD5E1' }}>
                        {log.ipAddress}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748B', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.userAgent || 'API'}
                      </div>
                    </td>
                    <td style={{ fontSize: '12px', color: '#94A3B8' }}>
                      {new Date(log.createdAt).toLocaleString('hi-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setInspectedLog(log)}
                        className="btn btn-secondary btn-sm"
                      >
                        <Eye size={12} />
                        <span>पेलोड</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '16px',
              paddingTop: '14px',
              borderTop: '1px solid #334155',
            }}
          >
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>
              पृष्ठ {page} / {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="btn btn-secondary btn-sm"
              >
                <ChevronLeft size={14} />
                <span>पिछला</span>
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="btn btn-secondary btn-sm"
              >
                <span>अगला</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspector Modal */}
      {inspectedLog && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px' }}>
              ऑडिट लॉग पेलोड विवरण: {inspectedLog.action}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
              <div style={{ fontSize: '12px', color: '#CBD5E1', backgroundColor: '#1E293B', padding: '10px 14px', borderRadius: '8px' }}>
                <div><strong>लॉग आईडी:</strong> {inspectedLog.id}</div>
                <div><strong>प्रशासक:</strong> {inspectedLog.actorName} ({inspectedLog.actorUserId})</div>
                <div><strong>लक्षित इकाई:</strong> {inspectedLog.targetEntityType} ({inspectedLog.targetEntityId})</div>
                <div><strong>आईपी पता:</strong> {inspectedLog.ipAddress}</div>
              </div>

              {inspectedLog.payloadBefore && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#F87171', marginBottom: '4px' }}>
                    परिवर्तन पूर्व पेलोड (Payload Before):
                  </div>
                  <pre
                    style={{
                      backgroundColor: '#020617',
                      padding: '10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: '#E2E8F0',
                      overflowX: 'auto',
                    }}
                  >
                    {JSON.stringify(inspectedLog.payloadBefore, null, 2)}
                  </pre>
                </div>
              )}

              {inspectedLog.payloadAfter && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#4ADE80', marginBottom: '4px' }}>
                    परिवर्तन पश्चात पेलोड (Payload After):
                  </div>
                  <pre
                    style={{
                      backgroundColor: '#020617',
                      padding: '10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: '#E2E8F0',
                      overflowX: 'auto',
                    }}
                  >
                    {JSON.stringify(inspectedLog.payloadAfter, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setInspectedLog(null)}
                className="btn btn-secondary"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
