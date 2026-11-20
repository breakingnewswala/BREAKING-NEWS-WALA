import { VideoPostPlatform } from '../../types';

export interface ParsedVideoUrl {
  isValid: boolean;
  platform: VideoPostPlatform;
  embedUrl: string;
  originalUrl: string;
  errorMessage?: string;
}

export function parseVideoUrl(inputUrl: string): ParsedVideoUrl {
  const clean = (inputUrl || '').trim();
  if (!clean) {
    return {
      isValid: false,
      platform: 'DIRECT',
      embedUrl: '',
      originalUrl: clean,
      errorMessage: 'कृपया एक वैध वीडियो लिंक (URL) दर्ज करें।',
    };
  }

  try {
    const urlObj = new URL(clean);
    const host = urlObj.hostname.toLowerCase();

    // 1. Facebook Video
    if (host.includes('facebook.com') || host.includes('fb.watch') || host.includes('fb.com')) {
      const encoded = encodeURIComponent(clean);
      return {
        isValid: true,
        platform: 'FACEBOOK',
        embedUrl: `https://www.facebook.com/plugins/video.php?href=${encoded}&show_text=false&width=500`,
        originalUrl: clean,
      };
    }

    // 2. Instagram Reel / Post
    if (host.includes('instagram.com')) {
      // e.g. https://www.instagram.com/reel/C8q9xKlBwZ_/ or https://www.instagram.com/p/xxx/
      let basePath = urlObj.pathname.replace(/\/+$/, '');
      if (basePath.endsWith('/embed')) {
        basePath = basePath.replace('/embed', '');
      }
      return {
        isValid: true,
        platform: 'INSTAGRAM',
        embedUrl: `https://www.instagram.com${basePath}/embed`,
        originalUrl: clean,
      };
    }

    // 3. YouTube (Supports standard and Shorts)
    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      let videoId = '';
      if (host.includes('youtu.be')) {
        videoId = urlObj.pathname.replace('/', '');
      } else if (urlObj.pathname.includes('/shorts/')) {
        videoId = urlObj.pathname.split('/shorts/')[1]?.split('/')[0] || '';
      } else {
        videoId = urlObj.searchParams.get('v') || '';
      }

      if (videoId) {
        return {
          isValid: true,
          platform: 'YOUTUBE',
          embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0`,
          originalUrl: clean,
        };
      }
    }

    // Direct MP4 / HLS / other URL
    if (clean.endsWith('.mp4') || clean.endsWith('.m3u8')) {
      return {
        isValid: true,
        platform: 'DIRECT',
        embedUrl: clean,
        originalUrl: clean,
      };
    }

    // Unsupported platform link
    return {
      isValid: false,
      platform: 'DIRECT',
      embedUrl: '',
      originalUrl: clean,
      errorMessage: 'केवल Facebook, Instagram एवं YouTube वीडियो लिंक समर्थित हैं।',
    };
  } catch {
    return {
      isValid: false,
      platform: 'DIRECT',
      embedUrl: '',
      originalUrl: clean,
      errorMessage: 'अमान्य URL प्रारूप। कृपया https:// से प्रारंभ होने वाला पूरा लिंक दर्ज करें।',
    };
  }
}
