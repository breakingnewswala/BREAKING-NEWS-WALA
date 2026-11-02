import React, { useState, useEffect } from 'react';
import { ShieldAlert, Plus, Trash2, RefreshCw } from 'lucide-react';
import { fetchRoles, assignUserRole, revokeUserRole } from '../lib/api';
import { RoleManagementItem } from '../types';

export const RoleGovernanceView: React.FC = () => {
  const [roles, setRoles] = useState<RoleManagementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetUserId, setTargetUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('reporter');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const data = await fetchRoles();
      setRoles(data);
    } catch (err: any) {
      console.warn('Failed to load roles:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId.trim()) {
      setMessage({ type: 'error', text: 'कृपया वैध उपयोगकर्ता आईडी (UUID) दर्ज करें।' });
      return;
    }

    // DEC-048 Client Verification
    const cleanRole = selectedRole.toUpperCase().replace(/^ROLE_/, '');
    if (cleanRole === 'CHIEF_EDITOR') {
      setMessage({
        type: 'error',
        text: 'DEC-048 नियम: ROLE_CHIEF_EDITOR अभी अनुमोदन हेतु लंबित (Pending Approval) है तथा इसे असाइन नहीं किया जा सकता।',
      });
      return;
    }

    setActionLoading(true);
    setMessage(null);
    try {
      await assignUserRole(targetUserId.trim(), selectedRole);
      setMessage({ type: 'success', text: `भूमिका "${selectedRole}" उपयोगकर्ता को सफलतापूर्वक सौंपी गई।` });
      setTargetUserId('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'भूमिका असाइनमेंट विफल रहा।' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeRole = async () => {
    if (!targetUserId.trim()) {
      setMessage({ type: 'error', text: 'कृपया भूमिका निरस्त करने हेतु उपयोगकर्ता आईडी दर्ज करें।' });
      return;
    }

    setActionLoading(true);
    setMessage(null);
    try {
      await revokeUserRole(targetUserId.trim(), selectedRole);
      setMessage({ type: 'success', text: `भूमिका "${selectedRole}" सफलतापूर्वक निरस्त की गई।` });
      setTargetUserId('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'भूमिका निरस्तीकरण विफल रहा।' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF' }}>
            भूमिका व RBAC नियम प्रशासन (Role Governance)
          </h1>
          <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '2px' }}>
            सिस्टम भूमिकाएं, अधिकार श्रेणियां एवं DEC-048 गवर्नेंस नियमों का अनुपालन
          </p>
        </div>
        <button
          type="button"
          onClick={loadRoles}
          disabled={loading}
          className="btn btn-secondary btn-sm"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>ताज़ा करें</span>
        </button>
      </div>

      {/* DEC-048 Governance Banner */}
      <div
        style={{
          padding: '14px 18px',
          borderRadius: '10px',
          backgroundColor: 'rgba(234, 179, 8, 0.1)',
          border: '1px solid rgba(234, 179, 8, 0.4)',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <ShieldAlert size={20} color="#FACC15" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#FEF08A' }}>
            आधिकारिक गवर्नेंस निर्देश — DEC-048 (Pending Executive Approval)
          </div>
          <div style={{ fontSize: '12px', color: '#E2E8F0', marginTop: '3px' }}>
            <code>ROLE_CHIEF_EDITOR</code> अभी औपचारिक रूप से <strong>Pending Approval</strong> स्थिति में है। किसी भी
            प्रशासक द्वारा यह भूमिका किसी भी खाते को आवंटित नहीं की जा सकती। संपादकीय प्रकाशन अधिकार केवल सत्यापित
            एडिटर्स एवं एडमिनिस्ट्रेटर स्तर पर ही सीमित हैं।
          </div>
        </div>
      </div>

      {/* Role Assignment Console */}
      <div className="admin-card">
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px' }}>
          उपयोगकर्ता भूमिका असाइनमेंट कंसोल (Assign / Revoke User Roles)
        </h3>

        {message && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              color: message.type === 'success' ? '#4ADE80' : '#F87171',
              fontSize: '12.5px',
              marginBottom: '16px',
            }}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleAssignRole} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 260px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
              लक्षित उपयोगकर्ता आईडी (User UUID):
            </label>
            <input
              type="text"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
              className="form-input"
              required
            />
          </div>

          <div style={{ flex: '0 1 220px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
              भूमिका चुनें (Select Role):
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="form-select"
            >
              <option value="reporter">reporter (संवाददाता)</option>
              <option value="trusted_reporter">trusted_reporter (विश्वसनीय संवाददाता)</option>
              <option value="editor">editor (डेस्क संपादक)</option>
              <option value="desk_editor">desk_editor (डेस्क प्रभारी)</option>
              <option value="sub_editor">sub_editor (उप-संपादक)</option>
              <option value="bureau_chief">bureau_chief (ब्यूरो चीफ)</option>
              <option value="admin">admin (प्लेटफ़ॉर्म प्रशासक)</option>
              <option value="citizen">citizen (नागरिक पाठक)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="submit"
              disabled={actionLoading}
              className="btn btn-primary"
            >
              <Plus size={14} />
              <span>भूमिका प्रदान करें</span>
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleRevokeRole}
              className="btn btn-danger"
            >
              <Trash2 size={14} />
              <span>भूमिका हटाएं</span>
            </button>
          </div>
        </form>
      </div>

      {/* Canonical Roles Table */}
      <div className="admin-card">
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px' }}>
          मान्यता प्राप्त सिस्टम भूमिकाएं (Canonical System Roles)
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#94A3B8', fontSize: '13px' }}>
            भूमिका सूची लोड हो रही है...
          </div>
        ) : (
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>पहचानकर्ता (Role Key)</th>
                  <th>प्रदर्शित नाम (Hindi Display Name)</th>
                  <th>प्रकार (System Type)</th>
                  <th>अनुमतियां (Assigned Permissions)</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <code style={{ color: '#38BDF8', fontWeight: 700 }}>{r.name}</code>
                    </td>
                    <td style={{ fontWeight: 600, color: '#FFFFFF' }}>{r.displayName}</td>
                    <td>
                      <span className="badge badge-active">{r.isSystem ? 'कोर सिस्टम' : 'कस्टम'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {r.permissions.map((p) => (
                          <span
                            key={p}
                            style={{
                              fontSize: '10px',
                              padding: '2px 5px',
                              borderRadius: '4px',
                              backgroundColor: '#1E293B',
                              color: '#94A3B8',
                              border: '1px solid #334155',
                              fontFamily: 'monospace',
                            }}
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
