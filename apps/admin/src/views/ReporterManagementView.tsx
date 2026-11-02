import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle,
  Clock,
  Sliders,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { fetchReporters, verifyReporter, updateReporterTrust } from '../lib/api';
import { ReporterManagementItem } from '../types';

export const ReporterManagementView: React.FC = () => {
  const [reporters, setReporters] = useState<ReporterManagementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'verified'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Verification Modal State
  const [verifyingReporter, setVerifyingReporter] = useState<ReporterManagementItem | null>(null);
  const [verifyDecision, setVerifyDecision] = useState<'verified' | 'rejected'>('verified');
  const [rejectReason, setRejectReason] = useState('');
  const [submittingVerify, setSubmittingVerify] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Trust Score Modal State
  const [trustReporter, setTrustReporter] = useState<ReporterManagementItem | null>(null);
  const [trustScore, setTrustScore] = useState(50);
  const [canDirectPublish, setCanDirectPublish] = useState(false);
  const [isTrusted, setIsTrusted] = useState(false);
  const [submittingTrust, setSubmittingTrust] = useState(false);
  const [trustError, setTrustError] = useState<string | null>(null);

  const loadReporters = async () => {
    setLoading(true);
    try {
      const res = await fetchReporters({
        page,
        limit: 15,
        status: activeTab === 'all' ? undefined : activeTab,
        search: searchTerm.trim() || undefined,
      });
      setReporters(res.items);
      setTotalPages(res.totalPages);
      setTotalRecords(res.total);
    } catch (err: any) {
      console.warn('Failed to load reporters:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReporters();
  }, [page, activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadReporters();
  };

  const handleOpenVerifyModal = (rep: ReporterManagementItem) => {
    setVerifyingReporter(rep);
    setVerifyDecision('verified');
    setRejectReason('');
    setVerifyError(null);
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingReporter) return;

    if (verifyDecision === 'rejected' && rejectReason.trim().length < 5) {
      setVerifyError('सत्यापन अस्वीकृति हेतु कम से कम 5 अक्षरों का आधिकारिक कारण अनिवार्य है।');
      return;
    }

    setSubmittingVerify(true);
    setVerifyError(null);
    try {
      await verifyReporter(verifyingReporter.userId, verifyDecision, rejectReason.trim() || undefined);
      setVerifyingReporter(null);
      loadReporters();
    } catch (err: any) {
      setVerifyError(err.message || 'सत्यापन कार्यवाही विफल।');
    } finally {
      setSubmittingVerify(false);
    }
  };

  const handleOpenTrustModal = (rep: ReporterManagementItem) => {
    setTrustReporter(rep);
    setTrustScore(rep.trustScore);
    setCanDirectPublish(rep.canDirectPublish);
    setIsTrusted(rep.isTrustedReporter);
    setTrustError(null);
  };

  const handleTrustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trustReporter) return;

    setSubmittingTrust(true);
    setTrustError(null);
    try {
      await updateReporterTrust(trustReporter.userId, trustScore, canDirectPublish, isTrusted);
      setTrustReporter(null);
      loadReporters();
    } catch (err: any) {
      setTrustError(err.message || 'ट्रस्ट स्कोर अपडेट विफल।');
    } finally {
      setSubmittingTrust(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF' }}>
            रिपोर्टर प्रबंधन व सत्यापन डेस्क (Reporter Management)
          </h1>
          <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '2px' }}>
            संवाददाताओं की प्रेस साख सत्यापन, बीट असाइनमेंट, ट्रस्ट स्कोर एवं रिपोर्टिंग प्रदर्शन का प्रशासन
          </p>
        </div>
        <button
          type="button"
          onClick={loadReporters}
          disabled={loading}
          className="btn btn-secondary btn-sm"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>ताज़ा करें</span>
        </button>
      </div>

      {/* View Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => {
            setActiveTab('pending');
            setPage(1);
          }}
          className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Clock size={14} />
          <span>सत्यापन प्रतीक्षारत (Pending Verification)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('verified');
            setPage(1);
          }}
          className={`btn ${activeTab === 'verified' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <CheckCircle size={14} />
          <span>सत्यापित रिपोर्टर (Active Verified)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('all');
            setPage(1);
          }}
          className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <span>समस्त रिपोर्टर डायरेक्टरी (All)</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="admin-card" style={{ padding: '16px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="रिपोर्टर नाम, कोड (e.g. REP-MP-*) अथवा प्रेस कार्ड नंबर से खोजें..."
              className="form-input"
              style={{ paddingLeft: '34px' }}
            />
            <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '11px', top: '11px' }} />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            खोजें
          </button>
        </form>
      </div>

      {/* Reporters Table */}
      <div className="admin-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600 }}>
            कुल परिणाम: <strong>{totalRecords}</strong> रिपोर्टर
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', fontSize: '13px' }}>
            रिपोर्टर डेटा लोड हो रहा है...
          </div>
        ) : reporters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748B', fontSize: '13px' }}>
            कोई रिपोर्टर रिकॉर्ड नहीं मिला।
          </div>
        ) : (
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>संवाददाता व कोड</th>
                  <th>प्रेस आईडी विवरण</th>
                  <th>सत्यापन स्थिति</th>
                  <th>ट्रस्ट स्कोर व अधिकार</th>
                  <th>बीट असाइनमेंट</th>
                  <th>आलेख निष्पादन</th>
                  <th>कार्यवाही</th>
                </tr>
              </thead>
              <tbody>
                {reporters.map((r) => (
                  <tr key={r.userId}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#FFFFFF' }}>{r.fullName}</div>
                      <div style={{ fontSize: '11px', color: '#38BDF8', fontFamily: 'monospace' }}>
                        {r.reporterCode}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>{r.phoneNumber || r.email}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#E2E8F0' }}>
                        {r.pressIdCardNumber || 'कार्ड दर्ज नहीं'}
                      </div>
                      {r.verifiedAt && (
                        <div style={{ fontSize: '10.5px', color: '#4ADE80' }}>
                          सत्यापित: {new Date(r.verifiedAt).toLocaleDateString('hi-IN')}
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          r.verificationStatus === 'verified'
                            ? 'badge-verified'
                            : r.verificationStatus === 'pending'
                            ? 'badge-pending'
                            : 'badge-rejected'
                        }`}
                      >
                        {r.verificationStatus === 'verified'
                          ? 'सत्यापित'
                          : r.verificationStatus === 'pending'
                          ? 'सत्यापन लंबित'
                          : 'अस्वीकृत'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
                          {r.trustScore}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748B' }}>/100</span>
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#94A3B8', marginTop: '2px' }}>
                        {r.isTrustedReporter ? '⭐ विश्वसनीय' : 'साधारण'} |{' '}
                        {r.canDirectPublish ? '⚡ सीधा प्रकाशन' : 'समीक्षाधीन'}
                      </div>
                    </td>
                    <td>
                      {r.assignedBeats.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {r.assignedBeats.map((b) => (
                            <span
                              key={b.id}
                              style={{
                                fontSize: '11px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: '#1E293B',
                                border: '1px solid #334155',
                                color: '#CBD5E1',
                              }}
                            >
                              📍 {b.locationName} ({b.assignmentType})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#EF4444' }}>बीट आवंटित नहीं</span>
                      )}
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      <div>सबमिट: <strong>{r.totalSubmissions}</strong></div>
                      <div style={{ color: '#4ADE80' }}>स्वीकृत: <strong>{r.approvedSubmissions}</strong></div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {r.verificationStatus === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleOpenVerifyModal(r)}
                            className="btn btn-primary btn-sm"
                          >
                            सत्यापित करें
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenTrustModal(r)}
                          className="btn btn-secondary btn-sm"
                        >
                          <Sliders size={12} />
                          <span>ट्रस्ट व अधिकार</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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

      {/* Verification Modal */}
      {verifyingReporter && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px' }}>
              संवाददाता साख सत्यापन: {verifyingReporter.fullName}
            </h3>

            {verifyError && (
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
                {verifyError}
              </div>
            )}

            <form onSubmit={handleVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '12.5px', color: '#CBD5E1', backgroundColor: '#1E293B', padding: '10px 14px', borderRadius: '8px' }}>
                <div><strong>रिपोर्टर कोड:</strong> {verifyingReporter.reporterCode}</div>
                <div><strong>प्रेस आईडी:</strong> {verifyingReporter.pressIdCardNumber || 'अनुपलब्ध'}</div>
                <div><strong>संपर्क:</strong> {verifyingReporter.phoneNumber || verifyingReporter.email}</div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                  सत्यापन निर्णय (Verification Decision):
                </label>
                <select
                  value={verifyDecision}
                  onChange={(e) => setVerifyDecision(e.target.value as any)}
                  className="form-select"
                >
                  <option value="verified">स्वीकृत करें (Verify & Authorize Reporter)</option>
                  <option value="rejected">अस्वीकृत करें (Reject Press Accreditation)</option>
                </select>
              </div>

              {verifyDecision === 'rejected' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    अस्वीकृति का आधिकारिक कारण (Mandatory Reason):
                  </label>
                  <textarea
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="प्रेस कार्ड अमान्य, गलत विवरण या फर्जी आवेदन..."
                    className="form-textarea"
                    required
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setVerifyingReporter(null)}
                  disabled={submittingVerify}
                  className="btn btn-secondary"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={submittingVerify}
                  className={verifyDecision === 'verified' ? 'btn btn-success' : 'btn btn-danger'}
                >
                  {submittingVerify
                    ? 'प्रक्रिया जारी...'
                    : verifyDecision === 'verified'
                    ? 'सत्यापन स्वीकृत करें'
                    : 'आवेदन अस्वीकृत करें'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trust Score & Publishing Eligibility Modal */}
      {trustReporter && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px' }}>
              ट्रस्ट स्कोर व विशेषाधिकार: {trustReporter.fullName}
            </h3>

            {trustError && (
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
                {trustError}
              </div>
            )}

            <form onSubmit={handleTrustSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                  <span>विश्वसनीयता स्कोर (Trust Score):</span>
                  <span style={{ color: '#38BDF8', fontSize: '14px' }}>{trustScore} / 100</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={trustScore}
                  onChange={(e) => setTrustScore(parseInt(e.target.value, 10))}
                  style={{ width: '100%', accentColor: '#344FD6' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#1E293B', padding: '12px', borderRadius: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isTrusted}
                    onChange={(e) => setIsTrusted(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#16A34A' }}
                  />
                  <span>विश्वसनीय संवाददाता (Trusted Reporter Status)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={canDirectPublish}
                    onChange={(e) => setCanDirectPublish(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#ED1727' }}
                  />
                  <span>सीधा प्रकाशन अधिकार (Direct Publish Without Desk Review)</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setTrustReporter(null)}
                  disabled={submittingTrust}
                  className="btn btn-secondary"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={submittingTrust}
                  className="btn btn-primary"
                >
                  {submittingTrust ? 'सुरक्षित हो रहा है...' : 'सुरक्षित करें'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
