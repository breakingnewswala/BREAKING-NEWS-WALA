import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, RefreshCw } from 'lucide-react';
import {
  fetchReporters,
  fetchDistricts,
  assignReporterTerritory,
  revokeReporterTerritory,
} from '../lib/api';
import { ReporterManagementItem, DistrictOption } from '../types';

export const TerritoryBeatsView: React.FC = () => {
  const [reporters, setReporters] = useState<ReporterManagementItem[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReporterId, setSelectedReporterId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [assignmentType, setAssignmentType] = useState('BEAT');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [repsRes, distsRes] = await Promise.all([
        fetchReporters({ limit: 100 }),
        fetchDistricts(),
      ]);
      setReporters(repsRes.items);
      setDistricts(distsRes);
      if (repsRes.items.length > 0 && !selectedReporterId) {
        setSelectedReporterId(repsRes.items[0]!.userId);
      }
      if (distsRes.length > 0 && !selectedDistrictId) {
        setSelectedDistrictId(distsRes[0]!.id);
      }
    } catch (err: any) {
      console.warn('Failed to load territory beats data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignBeat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReporterId || !selectedDistrictId) {
      setMessage({ type: 'error', text: 'कृपया रिपोर्टर एवं जिला दोनों का चयन करें।' });
      return;
    }

    setActionLoading(true);
    setMessage(null);
    try {
      await assignReporterTerritory(selectedReporterId, selectedDistrictId, assignmentType);
      setMessage({ type: 'success', text: 'नवीन बीट क्षेत्राधिकार सफलतापूर्वक आवंटित किया गया।' });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'बीट आवंटन विफल रहा।' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeBeat = async (assignmentId: string) => {
    if (!confirm('क्या आप निश्चित रूप से इस बीट आवंटन को निरस्त करना चाहते हैं?')) return;

    setActionLoading(true);
    setMessage(null);
    try {
      await revokeReporterTerritory(assignmentId);
      setMessage({ type: 'success', text: 'बीट क्षेत्राधिकार सफलतापूर्वक निरस्त किया गया।' });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'बीट निरस्तीकरण विफल रहा।' });
    } finally {
      setActionLoading(false);
    }
  };

  // Extract all active assignments across reporters
  const allAssignments = reporters.flatMap((rep) =>
    rep.assignedBeats.map((b) => ({
      ...b,
      reporterName: rep.fullName,
      reporterCode: rep.reporterCode,
      reporterId: rep.userId,
    }))
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF' }}>
            संवाददाता क्षेत्राधिकार व बीट आवंटन (Territory Beats Management)
          </h1>
          <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '2px' }}>
            मध्य प्रदेश के 55 जिलों एवं 10 संभागों में फील्ड संवाददाताओं की भौगोलिक बीट का केंद्रीय नियंत्रण
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="btn btn-secondary btn-sm"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>ताज़ा करें</span>
        </button>
      </div>

      {/* Assign Beat Form */}
      <div className="admin-card">
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px' }}>
          नवीन बीट क्षेत्राधिकार आवंटन (Assign Geographical Beat)
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

        <form onSubmit={handleAssignBeat} style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 240px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
              संवाददाता चुनें (Select Reporter):
            </label>
            <select
              value={selectedReporterId}
              onChange={(e) => setSelectedReporterId(e.target.value)}
              className="form-select"
            >
              {reporters.map((r) => (
                <option key={r.userId} value={r.userId}>
                  {r.fullName} ({r.reporterCode})
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1 1 240px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
              मध्य प्रदेश जिला चुनें (MP District):
            </label>
            <select
              value={selectedDistrictId}
              onChange={(e) => setSelectedDistrictId(e.target.value)}
              className="form-select"
            >
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nameHi} ({d.nameEn})
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: '0 1 180px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
              आवंटन प्रकार (Type):
            </label>
            <select
              value={assignmentType}
              onChange={(e) => setAssignmentType(e.target.value)}
              className="form-select"
            >
              <option value="PRIMARY">PRIMARY (मुख्य जिला बीट)</option>
              <option value="SECONDARY">SECONDARY (सहायक बीट)</option>
              <option value="BEAT">BEAT (विशेष कवरेज)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={actionLoading}
            className="btn btn-primary"
            style={{ padding: '10px 18px' }}
          >
            <Plus size={14} />
            <span>बीट आवंटित करें</span>
          </button>
        </form>
      </div>

      {/* Active Beat Allocations Table */}
      <div className="admin-card">
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px' }}>
          वर्तमान में सक्रिय बीट आवंटन ({allAssignments.length})
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#94A3B8', fontSize: '13px' }}>
            बीट आवंटन लोड हो रहा है...
          </div>
        ) : allAssignments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#64748B', fontSize: '13px' }}>
            वर्तमान में कोई सक्रिय बीट आवंटन दर्ज नहीं है।
          </div>
        ) : (
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>आवंटित जिला / क्षेत्र</th>
                  <th>संवाददाता का नाम व कोड</th>
                  <th>बीट श्रेणी</th>
                  <th>कार्यवाही</th>
                </tr>
              </thead>
              <tbody>
                {allAssignments.map((asg) => (
                  <tr key={asg.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} color="#ED1727" />
                        <span>{asg.locationName}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>{asg.locationType}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#E2E8F0' }}>{asg.reporterName}</div>
                      <div style={{ fontSize: '11px', color: '#38BDF8', fontFamily: 'monospace' }}>
                        {asg.reporterCode}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          asg.assignmentType === 'PRIMARY'
                            ? 'badge-verified'
                            : asg.assignmentType === 'SECONDARY'
                            ? 'badge-pending'
                            : 'badge-active'
                        }`}
                      >
                        {asg.assignmentType}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleRevokeBeat(asg.id)}
                        disabled={actionLoading}
                        className="btn btn-danger btn-sm"
                      >
                        <Trash2 size={12} />
                        <span>निरस्त करें</span>
                      </button>
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
