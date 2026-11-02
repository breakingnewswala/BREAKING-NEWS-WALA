import React, { useState, useEffect } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { fetchUsers, updateUserStatus } from '../lib/api';
import { UserManagementItem } from '../types';

export const UserManagementView: React.FC = () => {
  const [users, setUsers] = useState<UserManagementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Status Modal State
  const [selectedUser, setSelectedUser] = useState<UserManagementItem | null>(null);
  const [newStatus, setNewStatus] = useState<string>('active');
  const [statusReason, setStatusReason] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetchUsers({
        page,
        limit: 15,
        search: searchTerm.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
      });
      setUsers(res.items);
      setTotalPages(res.totalPages);
      setTotalRecords(res.total);
    } catch (err: any) {
      console.warn('Failed to load users:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, statusFilter, roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const handleOpenStatusModal = (user: UserManagementItem) => {
    setSelectedUser(user);
    setNewStatus(user.status);
    setStatusReason('');
    setModalError(null);
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setUpdating(true);
    setModalError(null);
    try {
      await updateUserStatus(selectedUser.id, newStatus, statusReason.trim() || undefined);
      setSelectedUser(null);
      loadUsers();
    } catch (err: any) {
      setModalError(err.message || 'स्थिति अपडेट करने में त्रुटि हुई।');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF' }}>
            उपयोगकर्ता प्रशासन (User Management)
          </h1>
          <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '2px' }}>
            पंजीकृत नागरिक, संवाददाता एवं संपादकीय खातों की स्थिति व अनुमतियों का नियंत्रण
          </p>
        </div>
        <button
          type="button"
          onClick={loadUsers}
          disabled={loading}
          className="btn btn-secondary btn-sm"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>ताज़ा करें</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="admin-card" style={{ padding: '16px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="नाम, ईमेल अथवा फ़ोन नंबर से खोजें..."
              className="form-input"
              style={{ paddingLeft: '34px' }}
            />
            <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '11px', top: '11px' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 700 }}>स्थिति:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="form-select"
              style={{ width: 'auto' }}
            >
              <option value="all">सभी स्थितियां</option>
              <option value="active">सक्रिय (Active)</option>
              <option value="suspended">निलंबित (Suspended)</option>
              <option value="deactivated">निष्क्रिय (Deactivated)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 700 }}>भूमिका:</span>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="form-select"
              style={{ width: 'auto' }}
            >
              <option value="all">सभी भूमिकाएं</option>
              <option value="admin">प्रशासक (Admin)</option>
              <option value="editor">संपादक (Editor)</option>
              <option value="reporter">संवाददाता (Reporter)</option>
              <option value="citizen">नागरिक पाठक (Citizen)</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-sm">
            खोजें
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="admin-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600 }}>
            कुल परिणाम: <strong>{totalRecords}</strong> उपयोगकर्ता
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', fontSize: '13px' }}>
            डेटा लोड हो रहा है...
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748B', fontSize: '13px' }}>
            कोई उपयोगकर्ता नहीं मिला।
          </div>
        ) : (
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>नाम व संपर्क</th>
                  <th>पंजीकृत भूमिकाएं (Roles)</th>
                  <th>रिपोर्टर प्रोफ़ाइल</th>
                  <th>खाता स्थिति</th>
                  <th>पंजीकरण दिनांक</th>
                  <th>कार्यवाही</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#FFFFFF' }}>{u.fullName}</div>
                      <div style={{ fontSize: '11.5px', color: '#94A3B8' }}>
                        {u.phoneNumber || u.email || 'संपर्क अनुपलब्ध'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {u.roles.map((r) => (
                          <span
                            key={r}
                            style={{
                              fontSize: '10.5px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: '#1E293B',
                              color: '#E2E8F0',
                              border: '1px solid #334155',
                            }}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      {u.reporterProfile ? (
                        <div>
                          <span className="badge badge-verified" style={{ fontSize: '10px' }}>
                            {u.reporterProfile.reporterCode}
                          </span>
                          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                            स्कोर: {u.reporterProfile.trustScore}/100
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '11.5px', color: '#64748B' }}>साधारण पाठक</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          u.status === 'active'
                            ? 'badge-active'
                            : u.status === 'suspended'
                            ? 'badge-suspended'
                            : 'badge-rejected'
                        }`}
                      >
                        {u.status === 'active' ? 'सक्रिय' : u.status === 'suspended' ? 'निलंबित' : u.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: '#94A3B8' }}>
                      {new Date(u.createdAt).toLocaleDateString('hi-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleOpenStatusModal(u)}
                        className="btn btn-secondary btn-sm"
                      >
                        स्थिति बदलें
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

      {/* Status Modal */}
      {selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px' }}>
              खाता स्थिति परिवर्तन: {selectedUser.fullName}
            </h3>

            {modalError && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#F87171',
                  fontSize: '12px',
                  marginBottom: '14px',
                }}
              >
                {modalError}
              </div>
            )}

            <form onSubmit={handleStatusSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                  नवीन स्थिति चुनें:
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="form-select"
                >
                  <option value="active">सक्रिय (Active — सामान्य पहुंच)</option>
                  <option value="suspended">निलंबित (Suspended — अस्थायी रोक)</option>
                  <option value="deactivated">निष्क्रिय (Deactivated — स्थायी खाता बंदी)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                  प्रशासनिक कारण विवरण (Reason for Audit Log):
                </label>
                <textarea
                  rows={3}
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="स्थिति परिवर्तन का प्रशासनिक कारण दर्ज करें..."
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  disabled={updating}
                  className="btn btn-secondary"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="btn btn-primary"
                >
                  {updating ? 'सुरक्षित हो रहा है...' : 'स्थिति लागू करें'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
