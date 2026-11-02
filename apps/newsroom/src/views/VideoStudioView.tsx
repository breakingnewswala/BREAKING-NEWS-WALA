/**
 * BREAKING NEWS WALA — Central Newsroom Video Production Studio
 * Multi-track timeline editor, preview canvas, overlay engine, and FFmpeg render integration.
 * Grounded in docs/11-Architecture.md, docs/12-Database.md (DOM-I),
 * docs/17-Agents.md (AGT-VID-009), and docs/DECISIONS.md (DEC-048, DEC-060)
 */

import React, { useState, useEffect } from 'react';
import {
  Video,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Scissors,
  Trash2,
  Type,
  Music,
  FileText,
  Sparkles,
  Download,
  Film,
} from 'lucide-react';
import {
  VideoProjectDocument,
  VideoTemplate,
  VideoRenderJob,
  VideoClip,
  VideoAspectRatio,
} from '../types';
import {
  createVideoProject,
  prefillVideoFromArticle,
  fetchVideoTemplates,
  submitVideoRenderJob,
  fetchVideoRenderJob,
  requestAiVideoScript,
} from '../lib/api';

type DrawerTab = 'templates' | 'media' | 'overlays' | 'audio' | 'subtitles';

export const VideoStudioView: React.FC = () => {
  const [project, setProject] = useState<VideoProjectDocument | null>(null);
  const [templates, setTemplates] = useState<VideoTemplate[]>([]);
  const [activeDrawerTab, setActiveDrawerTab] = useState<DrawerTab>('templates');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [activeRenderJob, setActiveRenderJob] = useState<VideoRenderJob | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [aiTopic, setAiTopic] = useState<string>('');
  const [aiDistrict, setAiDistrict] = useState<string>('भोपाल');
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Initialize or load prefill
  useEffect(() => {
    const initStudio = async () => {
      setLoading(true);
      try {
        const tpls = await fetchVideoTemplates();
        setTemplates(tpls);

        // Check for prefill parameter
        const hash = window.location.hash || '';
        const params = new URLSearchParams(hash.split('?')[1] || '');
        const prefillNewsId = params.get('prefillNewsId');

        if (prefillNewsId) {
          try {
            const prefilled = await prefillVideoFromArticle(prefillNewsId, {
              aspectRatio: '9:16',
              targetDurationSeconds: 30,
            });
            setProject(prefilled);
            setSelectedTrackId(prefilled.tracks[0]?.id || null);
            setNotification({
              type: 'success',
              message: `आलेख #${prefillNewsId.slice(0, 8)} से वीडियो प्रोजेक्ट स्वतः लोड हुआ!`,
            });
            return;
          } catch {
            // fallback to default template
          }
        }

        // Default: Load first template schema
        if (tpls.length > 0 && tpls[0]?.schema) {
          const defaultDoc: VideoProjectDocument = {
            ...tpls[0].schema,
            id: `vid-${Date.now()}`,
            title: 'नया न्यूज़ वीडियो प्रोजेक्ट (9:16)',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setProject(defaultDoc);
          setSelectedTrackId(defaultDoc.tracks[0]?.id || null);
        }
      } catch (err: any) {
        setNotification({ type: 'error', message: err?.message || 'स्टूडियो लोड करने में विफल।' });
      } finally {
        setLoading(false);
      }
    };

    initStudio();
  }, []);

  // Playback timer simulation
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && project) {
      interval = setInterval(() => {
        setCurrentTimeSec((prev) => {
          if (prev >= project.duration) {
            setIsPlaying(false);
            return 0;
          }
          return Math.round((prev + 0.1) * 10) / 10;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, project]);

  // Render job polling
  useEffect(() => {
    let pollInterval: any = null;
    if (activeRenderJob && (activeRenderJob.status === 'queued' || activeRenderJob.status === 'rendering')) {
      pollInterval = setInterval(async () => {
        try {
          const updated = await fetchVideoRenderJob(activeRenderJob.id);
          setActiveRenderJob(updated);
          if (updated.status === 'completed') {
            setNotification({
              type: 'success',
              message: 'वीडियो सफलतापूर्वक रेंडर हो गया! आउटपुट तैयार है।',
            });
          }
        } catch {
          // ignore transient poll error
        }
      }, 2000);
    }
    return () => clearInterval(pollInterval);
  }, [activeRenderJob]);

  // Handler: Change Aspect Ratio
  const handleAspectRatioChange = (ratio: VideoAspectRatio) => {
    if (!project) return;
    const dimensions = {
      '9:16': { width: 1080, height: 1920 },
      '16:9': { width: 1920, height: 1080 },
      '1:1': { width: 1080, height: 1080 },
      '4:5': { width: 1080, height: 1350 },
      custom: { width: 1920, height: 1080 },
    }[ratio];

    setProject({
      ...project,
      aspectRatio: ratio,
      width: dimensions.width,
      height: dimensions.height,
    });
  };

  // Handler: Apply Template
  const handleApplyTemplate = (tpl: VideoTemplate) => {
    if (!tpl.schema) return;
    if (window.confirm(`क्या आप "${tpl.name}" टेम्पलेट लागू करना चाहते हैं? वर्तमान परिवर्तन बदल जाएंगे।`)) {
      setProject({
        ...tpl.schema,
        id: `vid-${Date.now()}`,
        title: `${tpl.name} - नया प्रोजेक्ट`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setCurrentTimeSec(0);
      setIsPlaying(false);
      setNotification({ type: 'success', message: `टेम्पलेट "${tpl.name}" सफलतापूर्वक लागू हुआ।` });
    }
  };

  // Handler: Add Clip
  const handleAddClip = () => {
    if (!project) return;
    const track = project.tracks.find((t) => t.id === selectedTrackId) || project.tracks[0];
    if (!track) return;

    const newClip: VideoClip = {
      id: `clp-${Date.now()}`,
      trackId: track.id,
      name: `क्लिप #${track.clips.length + 1}`,
      clipType: track.type === 'graphics' ? 'lower_third' : track.type === 'audio' ? 'audio' : 'video',
      timelineStart: currentTimeSec,
      timelineDuration: 5,
      sourceStart: 0,
      sourceEnd: 5,
      volume: 1,
      opacity: 1,
    };

    const updatedClips = [...track.clips, newClip].sort((a, b) => (a.timelineStart || 0) - (b.timelineStart || 0));
    const updatedTracks = project.tracks.map((t) => (t.id === track.id ? { ...t, clips: updatedClips } : t));

    setProject({
      ...project,
      tracks: updatedTracks,
      duration: Math.max(project.duration, currentTimeSec + 5),
    });
    setSelectedClipId(newClip.id);
  };

  // Handler: Split Clip
  const handleSplitClip = () => {
    if (!project || !selectedClipId || !selectedTrackId) return;
    const track = project.tracks.find((t) => t.id === selectedTrackId);
    if (!track) return;

    const clip = track.clips.find((c) => c.id === selectedClipId);
    if (!clip) return;

    const start = clip.timelineStart || 0;
    const dur = clip.timelineDuration || 5;
    const end = start + dur;

    if (currentTimeSec <= start + 0.5 || currentTimeSec >= end - 0.5) {
      alert('क्लिप विभाजन के लिए प्लेहेड को क्लिप के मध्य बिंदु पर रखें।');
      return;
    }

    const firstDur = Math.round((currentTimeSec - start) * 10) / 10;
    const secondDur = Math.round((dur - firstDur) * 10) / 10;

    const part1: VideoClip = { ...clip, id: `${clip.id}-p1`, name: `${clip.name} (भाग 1)`, timelineDuration: firstDur };
    const part2: VideoClip = {
      ...clip,
      id: `${clip.id}-p2`,
      name: `${clip.name} (भाग 2)`,
      timelineStart: currentTimeSec,
      timelineDuration: secondDur,
    };

    const updatedClips = track.clips.flatMap((c) => (c.id === clip.id ? [part1, part2] : [c]));
    const updatedTracks = project.tracks.map((t) => (t.id === track.id ? { ...t, clips: updatedClips } : t));

    setProject({ ...project, tracks: updatedTracks });
  };

  // Handler: Delete Clip
  const handleDeleteClip = () => {
    if (!project || !selectedClipId || !selectedTrackId) return;
    const track = project.tracks.find((t) => t.id === selectedTrackId);
    if (!track) return;

    const updatedClips = track.clips.filter((c) => c.id !== selectedClipId);
    const updatedTracks = project.tracks.map((t) => (t.id === track.id ? { ...t, clips: updatedClips } : t));

    setProject({ ...project, tracks: updatedTracks });
    setSelectedClipId(null);
  };

  // Handler: Submit Render
  const handleSubmitRender = async () => {
    if (!project) return;
    setSaving(true);
    try {
      // Save project first
      const saved = await createVideoProject(project);
      setProject(saved);

      // Submit render job
      const job = await submitVideoRenderJob(saved.id, '1080p');
      setActiveRenderJob(job);
      setNotification({
        type: 'success',
        message: `रेंडर कार्य #${job.id.slice(0, 8)} कतार में दर्ज। पृष्ठभूमि में एन्कोडिंग सक्रिय।`,
      });
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'रेंडर कार्य सबमिट करने में विफल।' });
    } finally {
      setSaving(false);
    }
  };

  // Handler: AI Script Request
  const handleGenerateAiScript = async () => {
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    try {
      const res = await requestAiVideoScript({
        headline: aiTopic,
        district: aiDistrict,
        targetDurationSeconds: 30,
        tone: 'breaking',
      });

      if (res && project) {
        setProject({
          ...project,
          title: res.headlineHi || aiTopic,
          subtitles: {
            id: `sub-${Date.now()}`,
            language: 'hi',
            isBurnedIn: false,
            cues: res.suggestedSubtitleCues || [],
          },
        });
        setShowAiModal(false);
        setNotification({
          type: 'success',
          message: 'AI वीडियो स्क्रिप्ट एवं सबटाइटल सफलतापूर्वक तैयार किए गए!',
        });
      }
    } catch (err: any) {
      alert(`AI स्क्रिप्ट त्रुटि: ${err?.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '600px', color: '#64748b' }}>
        <p>वीडियो प्रोडक्शन स्टूडियो लोड हो रहा है...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', backgroundColor: '#0f172a', color: '#f8fafc' }}>
      {/* Top Application Bar */}
      <div
        style={{
          height: '56px',
          backgroundColor: '#1e293b',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#ED1727',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <Video size={18} />
          </div>

          <input
            type="text"
            value={project?.title || ''}
            onChange={(e) => project && setProject({ ...project, title: e.target.value })}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid transparent',
              color: '#f8fafc',
              fontSize: '15px',
              fontWeight: 700,
              padding: '4px 8px',
              borderRadius: '4px',
              width: '280px',
            }}
            placeholder="वीडियो प्रोजेक्ट शीर्षक..."
          />
        </div>

        {/* Aspect Ratio Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#0f172a', padding: '4px', borderRadius: '8px' }}>
          {(['9:16', '16:9', '1:1', '4:5'] as VideoAspectRatio[]).map((ratio) => (
            <button
              key={ratio}
              onClick={() => handleAspectRatioChange(ratio)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: project?.aspectRatio === ratio ? '#2563eb' : 'transparent',
                color: project?.aspectRatio === ratio ? '#fff' : '#94a3b8',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {ratio === '9:16' ? '📱 9:16' : ratio === '16:9' ? '📺 16:9' : ratio === '1:1' ? '⏹️ 1:1' : '🖼️ 4:5'}
            </button>
          ))}
        </div>

        {/* Right Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setShowAiModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: '#4338ca',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Sparkles size={16} />
            AI स्क्रिप्ट
          </button>

          <button
            onClick={handleSubmitRender}
            disabled={Boolean(saving || activeRenderJob?.status === 'rendering')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              backgroundColor: '#ED1727',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Film size={16} />
            {saving ? 'सेव हो रहा है...' : 'रेंडर वीडियो'}
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          style={{
            padding: '8px 16px',
            backgroundColor: notification.type === 'success' ? '#14532d' : '#7f1d1d',
            color: '#f8fafc',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '14px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Workspace (Drawer + Canvas + Inspector) */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Left Drawer Navigation Icons */}
        <div
          style={{
            width: '56px',
            backgroundColor: '#1e293b',
            borderRight: '1px solid #334155',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '12px 0',
            gap: '16px',
          }}
        >
          <button
            title="टेम्पलेट्स"
            onClick={() => setActiveDrawerTab('templates')}
            style={{
              background: 'none',
              border: 'none',
              color: activeDrawerTab === 'templates' ? '#ED1727' : '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <Film size={22} />
          </button>

          <button
            title="लोअर थर्ड्स व टिकर"
            onClick={() => setActiveDrawerTab('overlays')}
            style={{
              background: 'none',
              border: 'none',
              color: activeDrawerTab === 'overlays' ? '#ED1727' : '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <Type size={22} />
          </button>

          <button
            title="ऑडियो व वॉइसओवर"
            onClick={() => setActiveDrawerTab('audio')}
            style={{
              background: 'none',
              border: 'none',
              color: activeDrawerTab === 'audio' ? '#ED1727' : '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <Music size={22} />
          </button>

          <button
            title="सबटाइटल"
            onClick={() => setActiveDrawerTab('subtitles')}
            style={{
              background: 'none',
              border: 'none',
              color: activeDrawerTab === 'subtitles' ? '#ED1727' : '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <FileText size={22} />
          </button>
        </div>

        {/* Left Drawer Content Panel */}
        <div
          style={{
            width: '280px',
            backgroundColor: '#1e293b',
            borderRight: '1px solid #334155',
            overflowY: 'auto',
            padding: '16px',
          }}
        >
          {activeDrawerTab === 'templates' && (
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0', color: '#cbd5e1' }}>
                न्यूज़ वीडियो टेम्पलेट्स
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => handleApplyTemplate(tpl)}
                    style={{
                      padding: '10px',
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      border: '1px solid #334155',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
                      <span>{tpl.aspectRatio}</span>
                      <span>{tpl.duration}s</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '13px', marginTop: '4px', color: '#f8fafc' }}>
                      {tpl.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeDrawerTab === 'overlays' && (
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0', color: '#cbd5e1' }}>
                लोअर थर्ड व ग्राफिक प्रीसेट्स
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={handleAddClip}
                  style={{
                    padding: '10px',
                    backgroundColor: '#dc2626',
                    color: '#fff',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  + ब्रेकिंग टिकर पट्टी जोड़ें
                </button>

                <button
                  onClick={handleAddClip}
                  style={{
                    padding: '10px',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  + संवाददाता व ब्यूरो बैज जोड़ें
                </button>
              </div>
            </div>
          )}

          {activeDrawerTab === 'audio' && (
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0', color: '#cbd5e1' }}>
                ऑडियो व वॉइसओवर ट्रैक्स
              </h3>
              <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
                <p>मल्टी-चैनल स्टीरियो ऑडियो मिक्सर (48kHz, 192kbps AAC)।</p>
                <div style={{ padding: '10px', backgroundColor: '#0f172a', borderRadius: '6px', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, color: '#f8fafc' }}>पृष्ठभूमि संगीत (BGM)</div>
                  <input type="range" min="0" max="1" step="0.05" defaultValue="0.25" style={{ width: '100%' }} />
                </div>
                <div style={{ padding: '10px', backgroundColor: '#0f172a', borderRadius: '6px' }}>
                  <div style={{ fontWeight: 600, color: '#f8fafc' }}>वॉइसओवर वॉल्यूम (Duck 80%)</div>
                  <input type="range" min="0" max="1" step="0.05" defaultValue="1.0" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          )}

          {activeDrawerTab === 'subtitles' && (
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0', color: '#cbd5e1' }}>
                देवनागरी सबटाइटल पंक्तियां
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {project?.subtitles?.cues.map((cue, idx) => (
                  <div
                    key={cue.id}
                    style={{
                      padding: '8px',
                      backgroundColor: '#0f172a',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ color: '#f59e0b', fontWeight: 600 }}>
                      #{idx + 1} ({cue.startTime}s - {cue.endTime}s)
                    </div>
                    <div style={{ color: '#e2e8f0', marginTop: '2px' }}>{cue.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center Preview Canvas */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0b1120',
            position: 'relative',
            padding: '20px',
          }}
        >
          {/* Aspect-Ratio Box Preview */}
          <div
            style={{
              position: 'relative',
              width: project?.aspectRatio === '9:16' ? '280px' : project?.aspectRatio === '1:1' ? '400px' : '560px',
              height: project?.aspectRatio === '9:16' ? '498px' : project?.aspectRatio === '1:1' ? '400px' : '315px',
              backgroundColor: '#1e293b',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* Safe Area Watermark */}
            <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}>
              <img src="/brand/logo.png" alt="BNW Logo" style={{ height: '24px', opacity: 0.9 }} />
            </div>

            {/* Video Placeholder / Live Frame Simulation */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                fontSize: '14px',
              }}
            >
              {currentTimeSec < 3 ? (
                <div style={{ textAlign: 'center', color: '#ED1727', fontWeight: 800, fontSize: '18px' }}>
                  ⚡ ब्रेकिंग न्यूज़ वाला (ओपनिंग बंपर)
                </div>
              ) : currentTimeSec > (project?.duration || 30) - 3 ? (
                <div style={{ textAlign: 'center', color: '#FDE900', fontWeight: 800, fontSize: '18px' }}>
                  📺 फॉलो करें @breakingnewswala
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <Film size={36} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                  <div>लाइव समाचार दृश्य (फुटेज)</div>
                </div>
              )}
            </div>

            {/* Dynamic Lower Third & Subtitle Overlay */}
            {currentTimeSec >= 3 && currentTimeSec <= (project?.duration || 30) - 3 && (
              <div style={{ position: 'relative', zIndex: 20 }}>
                {/* Lower Third Ticker */}
                <div
                  style={{
                    backgroundColor: '#ED1727',
                    color: '#fff',
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ backgroundColor: '#FDE900', color: '#0f172a', padding: '2px 6px', borderRadius: '3px', fontSize: '11px' }}>
                    ताज़ा ख़बर
                  </span>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {project?.title}
                  </span>
                </div>

                {/* Subtitle Display */}
                {project?.subtitles?.cues
                  .filter((c) => currentTimeSec >= c.startTime && currentTimeSec <= c.endTime)
                  .map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: '4px 10px',
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        color: '#fff',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {c.text}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Player Controls Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginTop: '16px',
              backgroundColor: '#1e293b',
              padding: '6px 16px',
              borderRadius: '24px',
            }}
          >
            <button
              onClick={() => setCurrentTimeSec(0)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <RotateCcw size={16} />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#ED1727',
                border: 'none',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '2px' }} />}
            </button>

            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', minWidth: '90px', textAlign: 'center' }}>
              {currentTimeSec.toFixed(1)}s / {project?.duration}s
            </span>
          </div>
        </div>

        {/* Right Inspector & Render Status */}
        <div
          style={{
            width: '280px',
            backgroundColor: '#1e293b',
            borderLeft: '1px solid #334155',
            padding: '16px',
            overflowY: 'auto',
          }}
        >
          <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0', color: '#cbd5e1' }}>
            क्लिप व रेंडर इंस्पेक्टर
          </h3>

          {activeRenderJob && (
            <div
              style={{
                padding: '12px',
                backgroundColor: '#0f172a',
                borderRadius: '8px',
                border: '1px solid #334155',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb', marginBottom: '4px' }}>
                रेंडर स्थिति: {activeRenderJob.status}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
                {activeRenderJob.statusMessage || 'प्रसंस्करण सक्रिय...'}
              </div>

              <div style={{ width: '100%', height: '6px', backgroundColor: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${activeRenderJob.progressPercent}%`, height: '100%', backgroundColor: '#2563eb' }} />
              </div>

              {activeRenderJob.status === 'completed' && activeRenderJob.outputUrl && (
                <a
                  href={activeRenderJob.outputUrl}
                  download
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginTop: '10px',
                    padding: '6px 12px',
                    backgroundColor: '#16a34a',
                    color: '#fff',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  <Download size={14} />
                  वीडियो डाउनलोड करें
                </a>
              )}
            </div>
          )}

          <div style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <strong>पहलू अनुपात:</strong> {project?.aspectRatio}
            </div>
            <div>
              <strong>आयाम:</strong> {project?.width} x {project?.height}
            </div>
            <div>
              <strong>फ्रेम प्रति सेकंड (FPS):</strong> {project?.fps}
            </div>
            <div>
              <strong>कुल अवधि:</strong> {project?.duration} सेकंड
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Timeline Ruler & Multi-Track Canvas */}
      <div
        style={{
          height: '220px',
          backgroundColor: '#1e293b',
          borderTop: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Timeline Action Bar */}
        <div
          style={{
            height: '40px',
            backgroundColor: '#0f172a',
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleAddClip}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                backgroundColor: '#334155',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus size={14} />
              क्लिप जोड़ें
            </button>

            <button
              onClick={handleSplitClip}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                backgroundColor: '#334155',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Scissors size={14} />
              विभाजित करें
            </button>

            <button
              onClick={handleDeleteClip}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                backgroundColor: '#7f1d1d',
                color: '#fca5a5',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Trash2 size={14} />
              हटाएं
            </button>
          </div>

          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            प्लेहेड: <strong>{currentTimeSec.toFixed(1)}s</strong>
          </div>
        </div>

        {/* Tracks List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {project?.tracks.map((track) => (
            <div
              key={track.id}
              onClick={() => setSelectedTrackId(track.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: selectedTrackId === track.id ? '#334155' : '#0f172a',
                borderRadius: '6px',
                padding: '4px 8px',
                border: selectedTrackId === track.id ? '1px solid #2563eb' : '1px solid #1e293b',
              }}
            >
              <div style={{ width: '130px', fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>
                {track.name}
              </div>

              {/* Track Content Blocks */}
              <div style={{ flex: 1, height: '32px', backgroundColor: '#1e293b', borderRadius: '4px', position: 'relative' }}>
                {track.clips.map((clip) => {
                  const start = clip.timelineStart || 0;
                  const dur = clip.timelineDuration || 5;
                  const total = project.duration || 30;
                  const leftPercent = (start / total) * 100;
                  const widthPercent = (dur / total) * 100;

                  return (
                    <div
                      key={clip.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTrackId(track.id);
                        setSelectedClipId(clip.id);
                      }}
                      style={{
                        position: 'absolute',
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                        height: '100%',
                        backgroundColor:
                          selectedClipId === clip.id
                            ? '#3b82f6'
                            : track.type === 'video'
                            ? '#2563eb'
                            : track.type === 'graphics'
                            ? '#dc2626'
                            : '#059669',
                        borderRadius: '3px',
                        border: selectedClipId === clip.id ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)',
                        padding: '2px 6px',
                        fontSize: '11px',
                        color: '#fff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {clip.name} ({dur}s)
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Assistant Modal */}
      {showAiModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              width: '450px',
              backgroundColor: '#1e293b',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #334155',
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
              ✨ AI वीडियो स्क्रिप्ट व सीन जेनेरेटर (AGT-VID-009)
            </h3>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                समाचार का मुख्य विषय / शीर्षक:
              </label>
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="उदा. भोपाल में भारी बारिश से जनजीवन प्रभावित..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #475569',
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                ज़िला / ब्यूरो क्षेत्र:
              </label>
              <input
                type="text"
                value={aiDistrict}
                onChange={(e) => setAiDistrict(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #475569',
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowAiModal(false)}
                style={{
                  padding: '8px 14px',
                  backgroundColor: '#334155',
                  color: '#cbd5e1',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                रद्द करें
              </button>
              <button
                onClick={handleGenerateAiScript}
                disabled={aiLoading || !aiTopic.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#4338ca',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                {aiLoading ? 'जेनरेट हो रहा है...' : 'स्क्रिप्ट बनाएं'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
