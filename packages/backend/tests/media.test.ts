/**
 * BREAKING NEWS WALA — Media Asset Ingestion & Cloud Storage Pipeline Test Suite
 * Grounded in docs/16-Storage.md, docs/DECISIONS.md (DEC-020), docs/06-Business-Rules.md
 * (RULE-NEWS-006, RULE-SEC-004, RULE-SEC-007, RULE-EDIT-006), and docs/13-API.md (MED-01 through MED-04)
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../src/app';
import { createTestClient, TestClient } from './test-helper';
import { tokenService } from '../src/modules/auth/token.service';
import { mediaRepository, InMemoryMediaRepository } from '../src/modules/media/media.repository';
import { storageProvider, LocalStorageProvider } from '../src/modules/media/media.storage';
import { articleRepository, InMemoryArticleRepository } from '../src/modules/articles/article.repository';
import { verifyMagicBytes } from '../src/modules/media/media.validator';
import {
  MIME_TYPE_WHITELIST,
  FILE_SIZE_LIMITS,
  AVATAR_SIZE_LIMIT,
  PROHIBITED_EXTENSIONS,
  PRESIGNED_URL_EXPIRY_SECONDS,
} from '../src/modules/media/media.constants';

describe('Media Ingestion Pipeline — Unit & Security Invariants', () => {
  it('should enforce MIME whitelist and prohibited extensions (Section 8.2)', () => {
    assert.strictEqual(MIME_TYPE_WHITELIST['image/jpeg'].assetType, 'image');
    assert.strictEqual(MIME_TYPE_WHITELIST['image/png'].assetType, 'image');
    assert.strictEqual(MIME_TYPE_WHITELIST['image/webp'].assetType, 'image');
    assert.strictEqual(MIME_TYPE_WHITELIST['video/mp4'].assetType, 'video');
    assert.strictEqual(MIME_TYPE_WHITELIST['video/quicktime'].assetType, 'video');
    assert.strictEqual(MIME_TYPE_WHITELIST['audio/mpeg'].assetType, 'audio');
    assert.strictEqual(MIME_TYPE_WHITELIST['application/pdf'].assetType, 'document');

    assert.strictEqual(PROHIBITED_EXTENSIONS.has('.exe'), true);
    assert.strictEqual(PROHIBITED_EXTENSIONS.has('.sh'), true);
    assert.strictEqual(PROHIBITED_EXTENSIONS.has('.php'), true);
    assert.strictEqual(PROHIBITED_EXTENSIONS.has('.bat'), true);
    assert.strictEqual(PROHIBITED_EXTENSIONS.has('.js'), true);
  });

  it('should enforce file size limits across media types (Section 8.1)', () => {
    assert.strictEqual(FILE_SIZE_LIMITS.image, 10 * 1024 * 1024);
    assert.strictEqual(FILE_SIZE_LIMITS.video, 100 * 1024 * 1024);
    assert.strictEqual(FILE_SIZE_LIMITS.audio, 25 * 1024 * 1024);
    assert.strictEqual(FILE_SIZE_LIMITS.document, 25 * 1024 * 1024);
    assert.strictEqual(AVATAR_SIZE_LIMIT, 2 * 1024 * 1024);
    assert.strictEqual(PRESIGNED_URL_EXPIRY_SECONDS, 900); // 15 minutes per DEC-020
  });

  it('should verify binary magic bytes for valid images and documents (RULE-SEC-004)', () => {
    // Valid JPEG: FF D8 FF E0
    const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    const jpegCheck = verifyMagicBytes(validJpeg, 'image/jpeg');
    assert.strictEqual(jpegCheck.isValid, true);
    assert.strictEqual(jpegCheck.detectedMime, 'image/jpeg');

    // Valid PNG: 89 50 4E 47 0D 0A 1A 0A
    const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const pngCheck = verifyMagicBytes(validPng, 'image/png');
    assert.strictEqual(pngCheck.isValid, true);
    assert.strictEqual(pngCheck.detectedMime, 'image/png');

    // Valid WebP: RIFF .... WEBP
    const validWebp = Buffer.concat([
      Buffer.from('RIFF'),
      Buffer.from([0x20, 0x00, 0x00, 0x00]),
      Buffer.from('WEBP'),
    ]);
    const webpCheck = verifyMagicBytes(validWebp, 'image/webp');
    assert.strictEqual(webpCheck.isValid, true);
    assert.strictEqual(webpCheck.detectedMime, 'image/webp');

    // Valid PDF: %PDF-
    const validPdf = Buffer.from('%PDF-1.4 sample content');
    const pdfCheck = verifyMagicBytes(validPdf, 'application/pdf');
    assert.strictEqual(pdfCheck.isValid, true);
    assert.strictEqual(pdfCheck.detectedMime, 'application/pdf');

    // Valid MP4: ....ftyp
    const validMp4 = Buffer.concat([
      Buffer.from([0x00, 0x00, 0x00, 0x18]),
      Buffer.from('ftyp'),
      Buffer.from('isom'),
    ]);
    const mp4Check = verifyMagicBytes(validMp4, 'video/mp4');
    assert.strictEqual(mp4Check.isValid, true);
  });

  it('should detect and reject spoofed files pretending to be JPEG or PNG (RULE-SEC-004, RULE-SEC-007)', () => {
    // Executable/PHP script pretending to be JPEG
    const maliciousScript = Buffer.from('<?php echo "evil payload"; ?>');
    const spoofedJpeg = verifyMagicBytes(maliciousScript, 'image/jpeg');
    assert.strictEqual(spoofedJpeg.isValid, false);
    assert.strictEqual(spoofedJpeg.error?.includes('JPEG magic bytes'), true);

    // Text file pretending to be PNG
    const spoofedPng = verifyMagicBytes(Buffer.from('This is a plain text file'), 'image/png');
    assert.strictEqual(spoofedPng.isValid, false);
    assert.strictEqual(spoofedPng.error?.includes('PNG magic bytes'), true);

    // Empty buffer
    const emptyCheck = verifyMagicBytes(Buffer.alloc(0), 'image/jpeg');
    assert.strictEqual(emptyCheck.isValid, false);
  });
});

describe('Media Ingestion & Cloud Storage Pipeline (Integration)', () => {
  let client: TestClient;

  // Reusable tokens
  const reporter1 = {
    id: 'usr-reporter-101',
    token: tokenService.generateAccessToken({
      userId: 'usr-reporter-101',
      roles: ['ROLE_REPORTER_STANDARD'],
      status: 'active',
    }).token,
  };

  const reporter2 = {
    id: 'usr-reporter-102',
    token: tokenService.generateAccessToken({
      userId: 'usr-reporter-102',
      roles: ['ROLE_REPORTER_STANDARD'],
      status: 'active',
    }).token,
  };

  const deskEditor = {
    id: 'usr-editor-301',
    token: tokenService.generateAccessToken({
      userId: 'usr-editor-301',
      roles: ['ROLE_DESK_EDITOR'],
      status: 'active',
    }).token,
  };

  const citizenUser = {
    id: 'usr-citizen-401',
    token: tokenService.generateAccessToken({
      userId: 'usr-citizen-401',
      roles: ['ROLE_PUBLIC_USER'],
      status: 'active',
    }).token,
  };

  before(async () => {
    const app = createApp();
    client = await createTestClient(app);
  });

  after(async () => {
    await client.close();
  });

  beforeEach(() => {
    if (mediaRepository instanceof InMemoryMediaRepository) {
      mediaRepository.clear();
    }
    if (storageProvider instanceof LocalStorageProvider) {
      storageProvider.clear();
    }
    if (articleRepository instanceof InMemoryArticleRepository) {
      articleRepository.clear();
    }
  });

  describe('1. Presigned Upload Initiation (POST /api/v1/media/presigned-upload, MED-01)', () => {
    it('should generate a presigned PUT upload ticket for valid JPEG image (5MB)', async () => {
      const res = await client.post(
        '/api/v1/media/presigned-upload',
        {
          fileName: 'bhopal-metro-inauguration.jpg',
          mimeType: 'image/jpeg',
          fileSizeBytes: 5 * 1024 * 1024,
          assetType: 'image',
          altTextHi: 'भोपाल मेट्रो स्टेशन का दृश्य',
        },
        { Authorization: `Bearer ${reporter1.token}` }
      );

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.mediaId);
      assert.ok(body.data.uploadUrl);
      assert.strictEqual(body.data.method, 'PUT');
      assert.strictEqual(body.data.expiresInSeconds, 900); // 15m expiry per DEC-020
      assert.strictEqual(body.data.headers['Content-Type'], 'image/jpeg');
      assert.ok(body.data.storageKey.startsWith('news/articles/'));
      assert.ok(body.data.storageKey.endsWith('.jpg'));
    });

    it('should generate presigned tickets for video and audio uploads', async () => {
      const resVideo = await client.post(
        '/api/v1/media/presigned-upload',
        {
          fileName: 'indore-press-conference.mp4',
          mimeType: 'video/mp4',
          fileSizeBytes: 45 * 1024 * 1024,
          assetType: 'video',
        },
        { Authorization: `Bearer ${reporter1.token}` }
      );
      assert.strictEqual(resVideo.status, 200);
      const videoData = (await resVideo.json()).data;
      assert.ok(videoData.storageKey.startsWith('video/reels/'));
      assert.ok(videoData.storageKey.endsWith('.mp4'));

      const resAudio = await client.post(
        '/api/v1/media/presigned-upload',
        {
          fileName: 'field-voice-note.mp3',
          mimeType: 'audio/mpeg',
          fileSizeBytes: 12 * 1024 * 1024,
          assetType: 'audio',
        },
        { Authorization: `Bearer ${reporter1.token}` }
      );
      assert.strictEqual(resAudio.status, 200);
      const audioData = (await resAudio.json()).data;
      assert.ok(audioData.storageKey.startsWith('audio/voiceovers/'));
    });

    it('should reject unauthenticated requests with 401 Unauthorized', async () => {
      const res = await client.post('/api/v1/media/presigned-upload', {
        fileName: 'test.jpg',
        mimeType: 'image/jpeg',
        fileSizeBytes: 1024 * 1024,
      });
      assert.strictEqual(res.status, 401);
    });

    it('should reject unsupported MIME type with 422 Unprocessable Entity', async () => {
      const res = await client.post(
        '/api/v1/media/presigned-upload',
        {
          fileName: 'installer.exe',
          mimeType: 'application/x-msdownload',
          fileSizeBytes: 1024 * 1024,
        },
        { Authorization: `Bearer ${reporter1.token}` }
      );
      assert.strictEqual(res.status, 422);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.ok(body.error.details.some((d: any) => d.code === 'ERR_UNSUPPORTED_MIME_TYPE'));
    });

    it('should reject prohibited executable extensions with 422', async () => {
      const res = await client.post(
        '/api/v1/media/presigned-upload',
        {
          fileName: 'malicious.php',
          mimeType: 'image/jpeg',
          fileSizeBytes: 1024,
        },
        { Authorization: `Bearer ${reporter1.token}` }
      );
      assert.strictEqual(res.status, 422);
      const body = await res.json();
      assert.ok(body.error.details.some((d: any) => d.code === 'ERR_PROHIBITED_EXTENSION'));
    });

    it('should reject MIME and extension mismatch with 422', async () => {
      const res = await client.post(
        '/api/v1/media/presigned-upload',
        {
          fileName: 'picture.pdf',
          mimeType: 'image/jpeg',
          fileSizeBytes: 1024,
        },
        { Authorization: `Bearer ${reporter1.token}` }
      );
      assert.strictEqual(res.status, 422);
      const body = await res.json();
      assert.ok(body.error.details.some((d: any) => d.code === 'ERR_MIME_EXTENSION_MISMATCH'));
    });

    it('should reject oversized image (>10MB) with 422', async () => {
      const res = await client.post(
        '/api/v1/media/presigned-upload',
        {
          fileName: 'giant-photo.jpg',
          mimeType: 'image/jpeg',
          fileSizeBytes: 15 * 1024 * 1024, // 15MB > 10MB limit
        },
        { Authorization: `Bearer ${reporter1.token}` }
      );
      assert.strictEqual(res.status, 422);
      const body = await res.json();
      assert.ok(body.error.details.some((d: any) => d.code === 'ERR_SIZE_EXCEEDED'));
    });

    it('should enforce 2MB avatar size limit for public citizens', async () => {
      // 3MB exceeds avatar limit (2MB) for citizen user
      const res = await client.post(
        '/api/v1/media/presigned-upload',
        {
          fileName: 'citizen-profile.jpg',
          mimeType: 'image/jpeg',
          fileSizeBytes: 3 * 1024 * 1024,
          assetType: 'avatar',
        },
        { Authorization: `Bearer ${citizenUser.token}` }
      );
      assert.strictEqual(res.status, 422);
      const body = await res.json();
      assert.ok(body.error.details.some((d: any) => d.code === 'ERR_SIZE_EXCEEDED'));
    });

    it('should reject directory traversal in filename with 422', async () => {
      const res = await client.post(
        '/api/v1/media/presigned-upload',
        {
          fileName: '../../../../etc/shadow.jpg',
          mimeType: 'image/jpeg',
          fileSizeBytes: 1024,
        },
        { Authorization: `Bearer ${reporter1.token}` }
      );
      assert.strictEqual(res.status, 422);
      const body = await res.json();
      assert.ok(body.error.details.some((d: any) => d.code === 'ERR_INVALID_FILENAME'));
    });
  });

  describe('2. Direct Binary Upload & Magic Byte Verification (POST /api/v1/media/upload)', () => {
    it('should accept valid direct JPEG upload with correct magic bytes', async () => {
      const validJpegBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00,
        0x60, 0x00, 0x60, 0x00, 0x00, 0xff, 0xd9,
      ]);

      const res = await client.post(
        '/api/v1/media/upload',
        {
          fileName: 'cm-speech.jpg',
          mimeType: 'image/jpeg',
          fileBuffer: validJpegBuffer.toString('base64'),
          altTextHi: 'मुख्यमंत्री का भाषण',
        },
        { Authorization: `Bearer ${reporter1.token}` }
      );

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.mimeType, 'image/jpeg');
      assert.strictEqual(body.data.processingStatus, 'ready');
      assert.strictEqual(body.data.uploadedBy, reporter1.id);
      assert.ok(body.data.variants.length >= 2); // thumb_320w and card_640w created
    });

    it('should reject direct upload with spoofed JPEG magic bytes (RULE-SEC-004)', async () => {
      const maliciousBuffer = Buffer.from('<?php system($_GET["cmd"]); ?>');

      const res = await client.post(
        '/api/v1/media/upload',
        {
          fileName: 'fake-photo.jpg',
          mimeType: 'image/jpeg',
          fileBuffer: maliciousBuffer.toString('base64'),
        },
        { Authorization: `Bearer ${reporter1.token}` }
      );

      assert.strictEqual(res.status, 422);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.ok(body.error.details.some((d: any) => d.code === 'ERR_MAGIC_BYTE_MISMATCH'));
    });

    it('should reject direct upload with empty buffer', async () => {
      const res = await client.post(
        '/api/v1/media/upload',
        {
          fileName: 'empty.jpg',
          mimeType: 'image/jpeg',
          fileBuffer: '',
        },
        { Authorization: `Bearer ${reporter1.token}` }
      );

      assert.strictEqual(res.status, 422);
      const body = await res.json();
      assert.ok(body.error.details.some((d: any) => d.code === 'ERR_EMPTY_FILE'));
    });
  });

  describe('3. Upload Confirmation & Variant Pipeline (POST /api/v1/media/confirm-upload, MED-02)', () => {
    it('should confirm valid upload after object is placed in storage and generate variants', async () => {
      // 1. Step 1: Initiate presigned upload
      const initRes = await client.post(
        '/api/v1/media/presigned-upload',
        {
          fileName: 'gwalior-fort.jpg',
          mimeType: 'image/jpeg',
          fileSizeBytes: 2 * 1024 * 1024,
          assetType: 'image',
        },
        { Authorization: `Bearer ${reporter1.token}` }
      );
      const initData = (await initRes.json()).data;

      // 2. Simulate client upload to storage provider
      await storageProvider.uploadObject(
        initData.storageKey,
        Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]),
        'image/jpeg'
      );

      // 3. Step 2: Confirm upload (MED-02)
      const confirmRes = await client.post(
        '/api/v1/media/confirm-upload',
        {
          mediaId: initData.mediaId,
          width: 1920,
          height: 1080,
        },
        { Authorization: `Bearer ${reporter1.token}` }
      );

      assert.strictEqual(confirmRes.status, 200);
      const confirmed = (await confirmRes.json()).data;
      assert.strictEqual(confirmed.processingStatus, 'ready');
      assert.strictEqual(confirmed.width, 1920);
      assert.strictEqual(confirmed.height, 1080);
      assert.strictEqual(confirmed.aspectRatio, '16:9');

      // Verify variants were created
      assert.ok(confirmed.variants.length >= 3);
      const variantTypes = confirmed.variants.map((v: any) => v.variantType);
      assert.ok(variantTypes.includes('thumb_320w'));
      assert.ok(variantTypes.includes('card_640w'));
      assert.ok(variantTypes.includes('lead_1200w'));
    });

    it('should reject confirmation if object is missing from cloud storage with 422', async () => {
      const initRes = await client.post(
        '/api/v1/media/presigned-upload',
        {
          fileName: 'phantom-upload.jpg',
          mimeType: 'image/jpeg',
          fileSizeBytes: 1024,
        },
        { Authorization: `Bearer ${reporter1.token}` }
      );
      const initData = (await initRes.json()).data;

      // Do NOT put object in storage; confirm directly
      const confirmRes = await client.post(
        '/api/v1/media/confirm-upload',
        {
          mediaId: initData.mediaId,
        },
        { Authorization: `Bearer ${reporter1.token}` }
      );

      assert.strictEqual(confirmRes.status, 422);
      const body = await confirmRes.json();
      assert.strictEqual(body.success, false);
      assert.ok(body.error.message.includes('Cloud storage verification failed'));
    });

    it('should reject non-owner attempting to confirm another reporter upload with 403 Forbidden', async () => {
      const initRes = await client.post(
        '/api/v1/media/presigned-upload',
        {
          fileName: 'secret-lead.jpg',
          mimeType: 'image/jpeg',
          fileSizeBytes: 1024,
        },
        { Authorization: `Bearer ${reporter1.token}` }
      );
      const initData = (await initRes.json()).data;

      // Reporter 2 attempts to confirm reporter 1's upload
      const confirmRes = await client.post(
        '/api/v1/media/confirm-upload',
        {
          mediaId: initData.mediaId,
        },
        { Authorization: `Bearer ${reporter2.token}` }
      );

      assert.strictEqual(confirmRes.status, 403);
    });

    it('should allow elevated editor to confirm any reporter upload', async () => {
      const initRes = await client.post(
        '/api/v1/media/presigned-upload',
        {
          fileName: 'urgent-wire.jpg',
          mimeType: 'image/jpeg',
          fileSizeBytes: 1024,
        },
        { Authorization: `Bearer ${reporter1.token}` }
      );
      const initData = (await initRes.json()).data;

      await storageProvider.uploadObject(
        initData.storageKey,
        Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
        'image/jpeg'
      );

      // Desk editor confirms
      const confirmRes = await client.post(
        '/api/v1/media/confirm-upload',
        {
          mediaId: initData.mediaId,
        },
        { Authorization: `Bearer ${deskEditor.token}` }
      );

      assert.strictEqual(confirmRes.status, 200);
      assert.strictEqual((await confirmRes.json()).data.processingStatus, 'ready');
    });
  });

  describe('4. Media Retrieval, Listing & Deletion (MED-03, MED-04)', () => {
    let createdAssetId: string;

    beforeEach(async () => {
      const validJpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
      const res = await client.post(
        '/api/v1/media/upload',
        {
          fileName: 'shared-news-photo.jpg',
          mimeType: 'image/jpeg',
          fileBuffer: validJpegBuffer.toString('base64'),
          altTextHi: 'सार्वजनिक समाचार फोटो',
        },
        { Authorization: `Bearer ${reporter1.token}` }
      );
      const data = (await res.json()).data;
      createdAssetId = data.id;
    });

    it('should retrieve media asset metadata via GET /api/v1/media/:id (MED-03)', async () => {
      const res = await client.get(`/api/v1/media/${createdAssetId}`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.id, createdAssetId);
      assert.strictEqual(body.data.altTextHi, 'सार्वजनिक समाचार फोटो');
      assert.ok(body.data.cdnUrl);
      assert.ok(body.data.variants.length > 0);
    });

    it('should return 404 for non-existent media id', async () => {
      const res = await client.get('/api/v1/media/med-uuid-00000000-0000-0000-0000-000000000000');
      assert.strictEqual(res.status, 404);
    });

    it('should list media assets with pagination and type filtering via GET /api/v1/media', async () => {
      const res = await client.get('/api/v1/media?page=1&limit=10&fileType=image');
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data));
      assert.ok(body.meta.pagination.total >= 1);
    });

    it('should allow uploader to delete own unreferenced media (MED-04)', async () => {
      const res = await client.delete(`/api/v1/media/${createdAssetId}`, {
        Authorization: `Bearer ${reporter1.token}`,
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.deleted, true);

      // Verify deletion from repository
      const verifyRes = await client.get(`/api/v1/media/${createdAssetId}`);
      assert.strictEqual(verifyRes.status, 404);
    });

    it('should reject non-owner reporter attempting to delete another user media with 403 Forbidden', async () => {
      const res = await client.delete(`/api/v1/media/${createdAssetId}`, {
        Authorization: `Bearer ${reporter2.token}`,
      });
      assert.strictEqual(res.status, 403);
    });

    it('should allow elevated editor to delete any media asset', async () => {
      const res = await client.delete(`/api/v1/media/${createdAssetId}`, {
        Authorization: `Bearer ${deskEditor.token}`,
      });
      assert.strictEqual(res.status, 200);
    });
  });

  describe('5. Article Attachment & Relational Deletion Safeguard (RULE-EDIT-006)', () => {
    let testMediaId: string;
    let testArticleId: string;

    beforeEach(async () => {
      // Create a test media asset
      const validJpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
      const mediaRes = await client.post(
        '/api/v1/media/upload',
        {
          fileName: 'kuno-cheetah.jpg',
          mimeType: 'image/jpeg',
          fileBuffer: validJpegBuffer.toString('base64'),
        },
        { Authorization: `Bearer ${reporter1.token}` }
      );
      testMediaId = (await mediaRes.json()).data.id;

      // Create a test article draft owned by reporter1
      const article = await articleRepository.createArticle({
        titleHi: 'कूनो नेशनल पार्क में नए चीतों का आगमन',
        slug: 'kuno-national-park-new-cheetahs-arrival',
        summaryHi: 'श्योपुर जिले के कूनो नेशनल पार्क में नए मेहमानों का स्वागत हुआ।',
        bodyRichHi: '<p>विस्तृत रिपोर्ट...</p>',
        bodyJsonHi: { type: 'doc', content: [] },
        categoryId: 'cat-environment',
        subcategoryId: 'sub-wildlife',
        districtId: 'dis-sheopur',
        divisionId: 'div-chambal',
        stateId: 'mp-state',
        authorId: reporter1.id,
        editorialDeskId: 'desk-general',
        status: 'draft',
      });
      testArticleId = article.id;
    });

    it('should attach media to article draft via POST /api/v1/media/attach-article', async () => {
      const res = await client.post(
        '/api/v1/media/attach-article',
        {
          articleId: testArticleId,
          mediaId: testMediaId,
          isFeatured: true,
        },
        { Authorization: `Bearer ${reporter1.token}` }
      );

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.articleId, testArticleId);
      assert.strictEqual(body.data.mediaId, testMediaId);

      // Verify article record was updated
      const updatedArticle = await articleRepository.findArticleById(testArticleId);
      assert.strictEqual(updatedArticle?.featuredMediaId, testMediaId);
    });

    it('should reject non-author reporter attempting to attach media with 403 Forbidden', async () => {
      const res = await client.post(
        '/api/v1/media/attach-article',
        {
          articleId: testArticleId,
          mediaId: testMediaId,
          isFeatured: true,
        },
        { Authorization: `Bearer ${reporter2.token}` }
      );
      assert.strictEqual(res.status, 403);
    });

    it('should prevent deleting media referenced by an active article with 409 Conflict (RULE-EDIT-006)', async () => {
      // 1. Attach media to article
      await client.post(
        '/api/v1/media/attach-article',
        {
          articleId: testArticleId,
          mediaId: testMediaId,
          isFeatured: true,
        },
        { Authorization: `Bearer ${reporter1.token}` }
      );

      // 2. Attempt deletion while article reference is active
      const deleteRes = await client.delete(`/api/v1/media/${testMediaId}`, {
        Authorization: `Bearer ${reporter1.token}`,
      });

      assert.strictEqual(deleteRes.status, 409);
      const body = await deleteRes.json();
      assert.strictEqual(body.success, false);
      assert.ok(body.error.message.includes('currently referenced by 1 active news article'));

      // 3. Detach media from article
      const detachRes = await client.post(
        '/api/v1/media/detach-article',
        {
          articleId: testArticleId,
          mediaId: testMediaId,
        },
        { Authorization: `Bearer ${reporter1.token}` }
      );
      assert.strictEqual(detachRes.status, 200);

      // 4. Deletion now succeeds
      const retryDeleteRes = await client.delete(`/api/v1/media/${testMediaId}`, {
        Authorization: `Bearer ${reporter1.token}`,
      });
      assert.strictEqual(retryDeleteRes.status, 200);
    });

    it('should verify canonical reporter alias route /api/v1/reporter/media/presigned-upload', async () => {
      const res = await client.post(
        '/api/v1/reporter/media/presigned-upload',
        {
          fileName: 'alias-test.jpg',
          mimeType: 'image/jpeg',
          fileSizeBytes: 1024,
        },
        { Authorization: `Bearer ${reporter1.token}` }
      );
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.mediaId);
    });
  });
});
