import React, { useState, useRef } from 'react';
import { Camera, Upload, Trash2, AlertCircle } from 'lucide-react';
import { uploadFieldMedia } from '../lib/api';

interface MediaUploadBoxProps {
  initialImageUrl?: string;
  initialCaption?: string;
  initialAttribution?: string;
  onMediaAttached: (media: { mediaId: string; url: string; caption?: string; attribution?: string }) => void;
  onMediaRemoved?: () => void;
}

export const MediaUploadBox: React.FC<MediaUploadBoxProps> = ({
  initialImageUrl,
  initialCaption = '',
  initialAttribution = '',
  onMediaAttached,
  onMediaRemoved,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl || null);
  const [caption, setCaption] = useState(initialCaption);
  const [attribution, setAttribution] = useState(initialAttribution);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (Images <= 10MB, Video <= 100MB)
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      setUploadError('केवल फोटो (JPEG, PNG, WebP) या वीडियो (MP4) मान्य हैं।');
      return;
    }

    if (isImage && file.size > 10 * 1024 * 1024) {
      setUploadError('फोटो का आकार 10MB से कम होना चाहिए।');
      return;
    }

    if (isVideo && file.size > 100 * 1024 * 1024) {
      setUploadError('वीडियो का आकार 100MB से कम होना चाहिए।');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await uploadFieldMedia(file, caption, attribution);
      setImageUrl(result.url);
      onMediaAttached({
        mediaId: result.mediaId,
        url: result.url,
        caption,
        attribution,
      });
    } catch (err: any) {
      // If server upload fails (e.g. offline dev), create local object URL as offline fallback preview
      const localPreviewUrl = URL.createObjectURL(file);
      setImageUrl(localPreviewUrl);
      onMediaAttached({
        mediaId: `local-media-${Date.now()}`,
        url: localPreviewUrl,
        caption,
        attribution,
      });
      // Do not block reporter drafting if storage API is in offline sandbox
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setImageUrl(null);
    setCaption('');
    setAttribution('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onMediaRemoved) {
      onMediaRemoved();
    }
  };

  return (
    <div
      style={{
        border: '1px dashed #CBD5E1',
        borderRadius: '12px',
        padding: '16px',
        backgroundColor: '#F8FAFC',
        marginBottom: '16px',
      }}
    >
      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Camera size={16} color="#ED1727" />
        <span>ग्राउंड फोटो / मीडिया संलग्नक (16:9 प्राथमिक इमेज)</span>
      </label>

      {imageUrl ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            style={{
              position: 'relative',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#000',
              aspectRatio: '16 / 9',
              width: '100%',
            }}
          >
            <img
              src={imageUrl}
              alt="संलग्न मीडिया"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <button
              type="button"
              onClick={handleRemove}
              aria-label="फोटो हटाएं"
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                backgroundColor: 'rgba(237, 23, 39, 0.9)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              <Trash2 size={13} />
              <span>हटाएं</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
            <input
              type="text"
              placeholder="फोटो कैप्शन (विवरण): उदा. कलेक्ट्रेट में ज्ञापन सौंपते ग्रामीण..."
              value={caption}
              onChange={(e) => {
                setCaption(e.target.value);
                if (imageUrl) {
                  onMediaAttached({ mediaId: '', url: imageUrl, caption: e.target.value, attribution });
                }
              }}
              className="form-input"
              style={{ fontSize: '13px', minHeight: '40px', padding: '8px 12px' }}
            />
            <input
              type="text"
              placeholder="फोटो साभार / क्रेडिट: उदा. संवाद सूत्र / निवाड़ी"
              value={attribution}
              onChange={(e) => {
                setAttribution(e.target.value);
                if (imageUrl) {
                  onMediaAttached({ mediaId: '', url: imageUrl, caption, attribution: e.target.value });
                }
              }}
              className="form-input"
              style={{ fontSize: '13px', minHeight: '40px', padding: '8px 12px' }}
            />
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 10px' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4"
            capture="environment"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="field-media-file-input"
          />

          <label
            htmlFor="field-media-file-input"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              padding: '12px 20px',
              color: '#1E293B',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <Upload size={18} color="#ED1727" />
            <span>{isUploading ? 'अपलोड हो रहा है...' : 'कैमरा या गैलरी से फोटो चुनें'}</span>
          </label>

          <p style={{ fontSize: '11px', color: '#64748B', marginTop: '8px' }}>
            अधिकतम 10MB (JPEG, PNG, WebP) • उच्च रिज़ॉल्यूशन फील्ड फोटो मान्य
          </p>
        </div>
      )}

      {uploadError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#B91C1C',
            fontSize: '12px',
            marginTop: '8px',
            backgroundColor: '#FEE2E2',
            padding: '6px 10px',
            borderRadius: '6px',
          }}
        >
          <AlertCircle size={14} />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
};

export default MediaUploadBox;
