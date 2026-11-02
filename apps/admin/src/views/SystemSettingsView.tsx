import React, { useState, useEffect } from 'react';
import { Edit3, RefreshCw } from 'lucide-react';
import { fetchSettings, updateSetting } from '../lib/api';
import { SystemSettingItem } from '../types';

export const SystemSettingsView: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSetting, setEditingSetting] = useState<SystemSettingItem | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await fetchSettings();
      setSettings(data);
    } catch (err: any) {
      console.warn('Failed to load system settings:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleOpenEdit = (s: SystemSettingItem) => {
    setEditingSetting(s);
    setEditValue(s.value);
    setMessage(null);
  };

  const handleSaveSetting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSetting) return;

    setSaving(true);
    setMessage(null);
    try {
      await updateSetting(editingSetting.key, editValue);
      setMessage({ type: 'success', text: `सेटिंग "${editingSetting.key}" सफलतापूर्वक अपडेट की गई।` });
      setEditingSetting(null);
      loadSettings();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'सेटिंग सुरक्षित करने में विफल।' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF' }}>
            प्लेटफ़ॉर्म व सिस्टम सेटिंग्स (Platform Configuration)
          </h1>
          <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '2px' }}>
            संपादकीय सीमाएं, ब्रेकिंग थ्रेशोल्ड, अधिसूचना टॉगल एवं सामान्य प्लेटफ़ॉर्म कॉन्फ़िगरेशन
          </p>
        </div>
        <button
          type="button"
          onClick={loadSettings}
          disabled={loading}
          className="btn btn-secondary btn-sm"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>ताज़ा करें</span>
        </button>
      </div>

      {message && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
            color: message.type === 'success' ? '#4ADE80' : '#F87171',
            fontSize: '13px',
            marginBottom: '20px',
          }}
        >
          {message.text}
        </div>
      )}

      {/* Safety Notice */}
      <div
        style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          marginBottom: '20px',
          fontSize: '12px',
          color: '#E2E8F0',
        }}
      >
        🛡️ <strong>सुरक्षा दिशा-निर्देश (KMS & Secret Shield):</strong> इस कंसोल में केवल सुरक्षित रनटाइम
        कॉन्फ़िगरेशन मान ही प्रदर्शित हैं। डेटाबेस पासवर्ड, JWT सीक्रेट कुंजियां एवं थर्ड-पार्टी API क्रेडेंशियल्स
        पर्यावरण चरों (Environment Variables) द्वारा नियंत्रित हैं और यहां कभी एक्सपोज़ नहीं किए जाते।
      </div>

      {/* Settings Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', fontSize: '13px' }}>
          कॉन्फ़िगरेशन सेटिंग्स लोड हो रही हैं...
        </div>
      ) : settings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B', fontSize: '13px' }}>
          कोई कॉन्फ़िगरेशन रिकॉर्ड नहीं मिला।
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {settings.map((s) => (
            <div key={s.id} className="admin-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <code style={{ fontSize: '12px', fontWeight: 700, color: '#38BDF8' }}>{s.key}</code>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: '#1E293B',
                      color: '#94A3B8',
                      textTransform: 'uppercase',
                    }}
                  >
                    {s.category}
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor: '#020617',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#FFFFFF',
                    fontFamily: s.valueType === 'boolean' || s.valueType === 'number' ? 'monospace' : 'inherit',
                    wordBreak: 'break-all',
                    marginBottom: '10px',
                  }}
                >
                  {s.value}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #1E293B' }}>
                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  प्रकार: {s.valueType}
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(s)}
                  className="btn btn-secondary btn-sm"
                >
                  <Edit3 size={12} />
                  <span>संशोधन करें</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Setting Modal */}
      {editingSetting && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px' }}>
              कॉन्फ़िगरेशन संशोधन: {editingSetting.key}
            </h3>

            <form onSubmit={handleSaveSetting} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                  नवीन मान (New Value):
                </label>
                {editingSetting.valueType === 'boolean' ? (
                  <select
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="form-select"
                  >
                    <option value="true">true (सक्रिय)</option>
                    <option value="false">false (निष्क्रिय)</option>
                  </select>
                ) : (
                  <input
                    type={editingSetting.valueType === 'number' ? 'number' : 'text'}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="form-input"
                    required
                  />
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingSetting(null)}
                  disabled={saving}
                  className="btn btn-secondary"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? 'सुरक्षित हो रहा है...' : 'सुरक्षित करें'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
