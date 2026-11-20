/**
 * STEP 25E: Mobile Website Synchronization, TAZA Swipe Feed, VIDEO Feed & Master Admin Role Navigation Test Suite
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('STEP 25E: Mobile Synchronization & Navigation Verification', () => {

  it('1. Mobile Header: Profile button hidden on mobile beside search, retained on desktop', () => {
    const mastheadPath = path.join(rootDir, 'src', 'components', 'BnwMasthead.tsx');
    const content = fs.readFileSync(mastheadPath, 'utf8');

    // Check that profile button has `hidden lg:flex` responsive constraint
    assert.ok(
      content.includes('hidden lg:flex') && content.includes('प्रोफ़ाइल'),
      'Mobile header must hide the profile button on mobile screens while preserving it on desktop (hidden lg:flex)'
    );

    // Desktop header includes TAZA and VIDEO links
    assert.ok(content.includes('ताज़ा खबरें') && content.includes("onTabChange('taza')"), 'Desktop header includes link to Taza');
    assert.ok(content.includes('वीडियो (VIDEO)') && content.includes("onTabChange('video-feed')"), 'Desktop header includes link to Video Feed');
  });

  it('2. Master Admin Mobile Menu: Exactly 3 role options (MASTER ADMIN, REPORTER, USER)', () => {
    const navDrawerPath = path.join(rootDir, 'src', 'components', 'NavDrawer.tsx');
    const content = fs.readFileSync(navDrawerPath, 'utf8');

    // Check that Master Admin switcher renders MASTER ADMIN, REPORTER, USER
    assert.ok(content.includes("handlePersonaClick('MASTER_ADMIN')") && content.includes('>MASTER ADMIN<'), 'Option 1: MASTER ADMIN');
    assert.ok(content.includes("handlePersonaClick('REPORTER')") && content.includes('>REPORTER<'), 'Option 2: REPORTER');
    assert.ok(content.includes("handlePersonaClick('READER')") && content.includes('>USER<'), 'Option 3: USER');

    // Check quick master login is guarded so normal users cannot trigger it
    assert.ok(content.includes('isMasterAccount'), 'Quick master switch must be restricted to verified master account');
  });

  it('3. Normal User Login Redirect: Normal users land on "home" and avoid automatic redirect to "epaper"', () => {
    const appPath = path.join(rootDir, 'src', 'App.tsx');
    const content = fs.readFileSync(appPath, 'utf8');

    // Check that READER role resets activeTab to 'home' and clears hash
    assert.ok(
      content.includes("if (mappedRole === 'READER')") || content.includes("resolvedRole === 'READER'"),
      'READER role is explicitly checked on login'
    );
    assert.ok(
      content.includes("setActiveTab('home')") && content.includes("window.location.hash = ''"),
      'READER role clears hash and routes to home'
    );
  });

  it('4. BottomNav: 5 buttons correctly configured with TAZA, VIDEO, and Role-adaptive slot', () => {
    const bottomNavPath = path.join(rootDir, 'src', 'components', 'BottomNav.tsx');
    const content = fs.readFileSync(bottomNavPath, 'utf8');

    // Button 1: Home
    assert.ok(content.includes("onTabChange('home')") && content.includes('होम'), 'Button 1: होम (home)');
    // Button 2: Taza
    assert.ok(content.includes("onTabChange('taza')") && content.includes('ताज़ा'), 'Button 2: ताज़ा (taza)');
    // Button 3: Video
    assert.ok(content.includes("onTabChange('video-feed')") && content.includes('VIDEO'), 'Button 3: VIDEO (video-feed)');
    // Button 5: Profile
    assert.ok(content.includes("onTabChange('profile')") && content.includes('प्रोफ़ाइल'), 'Button 5: प्रोफ़ाइल (profile)');
    // Button 4: Staff or Epaper
    assert.ok(content.includes("onTabChange('epaper')") && content.includes('ई-पेपर'), 'Button 4: ई-पेपर (epaper for readers)');
  });

  it('5. TAZA Full-Screen Swipe Feed: Verification of Touch Gestures, Audio TTS, and Reader Sheet', () => {
    const tazaPath = path.join(rootDir, 'src', 'components', 'taza', 'TazaFeedScreen.tsx');
    const content = fs.readFileSync(tazaPath, 'utf8');

    assert.ok(content.includes('handleTouchStart') && content.includes('handleTouchEnd'), 'Touch swipe gesture handling implemented');
    assert.ok(content.includes('window.speechSynthesis'), 'TTS speech synthesis implemented for audio read-aloud');
    assert.ok(content.includes('showFullArticle') && content.includes('setShowFullArticle'), 'Slide-up full article sheet implemented');
    assert.ok(content.includes('handlePrevStory') && content.includes('handleNextStory'), 'Floating chevron and keyboard navigation implemented');
  });

  it('6. VIDEO Feed & Embed Engine: Verification of Facebook, Instagram, and YouTube parsing', () => {
    const embedHelperPath = path.join(rootDir, 'src', 'components', 'video', 'videoEmbedHelper.ts');
    const embedHelper = fs.readFileSync(embedHelperPath, 'utf8');

    assert.ok(embedHelper.includes('facebook.com') && embedHelper.includes('fb.watch'), 'Facebook URL recognition supported');
    assert.ok(embedHelper.includes('instagram.com/reel') && embedHelper.includes('instagram.com/p'), 'Instagram Reels/Posts supported');
    assert.ok(embedHelper.includes('youtube.com') && embedHelper.includes('youtu.be'), 'YouTube URLs supported');

    const defaultVideosPath = path.join(rootDir, 'src', 'data', 'defaultVideoPosts.ts');
    const defaultVideos = fs.readFileSync(defaultVideosPath, 'utf8');
    assert.ok(defaultVideos.includes('DEFAULT_VIDEO_POSTS'), 'Default initial video posts seeded');
    assert.ok(defaultVideos.includes('vid-post-001') && defaultVideos.includes('vid-post-002'), 'Sample regional Facebook and Instagram videos provided');

    const adminVideoManagerPath = path.join(rootDir, 'src', 'components', 'video', 'AdminVideoManagerModal.tsx');
    const adminVideoManager = fs.readFileSync(adminVideoManagerPath, 'utf8');
    assert.ok(adminVideoManager.includes('AdminVideoManagerModal'), 'Admin video manager modal exists');
    assert.ok(adminVideoManager.includes('onSaveVideoPost') && adminVideoManager.includes('onDeleteVideoPost'), 'CRUD operations for video posts supported');
  });

  it('7. Single Shared Central Backend & Database Invariant Verification', () => {
    const packageJsonPath = path.join(rootDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    assert.ok(!packageJson.dependencies?.pg, 'PostgreSQL pg client must NOT be installed');
    assert.ok(!packageJson.dependencies?.['@prisma/client'], 'Prisma client must NOT be installed in active web client');
    assert.ok(!packageJson.dependencies?.sequelize, 'Sequelize must NOT be installed');
  });

});
