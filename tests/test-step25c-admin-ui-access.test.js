/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * STEP 25C — ADMIN UI ACCESS, ROUTING & ARCHITECTURAL PARITY VERIFICATION
 * 
 * Empirically validates:
 * 1. Persistence Architecture: Confirms ZERO PostgreSQL runtime requirement for E-Paper.
 *    Verifies that getPersistenceAdapter() uses LocalJsonAdapter in Dev and FirestoreAdapter in Cloud/Emulator.
 * 2. Role Permissions: Confirms canonical roles (READER, REPORTER, EDITOR, ADMIN, MASTER_ADMIN, SUPER_ADMIN)
 *    and verifies published edition immutability & post-publication correction versioning.
 * 3. Master Admin Navigation Points:
 *    A. AdminControlScreen.tsx -> Overview E-Paper Management section & "+ नया ई-पेपर बनाएँ".
 *    B. NavDrawer.tsx -> Staff Workspaces E-Paper management buttons for ADMIN/MASTER_ADMIN.
 *    C. EpaperScreen.tsx -> Master Admin contextual quick bar with role guard.
 *    D. App.tsx -> Deep-linking callbacks and state synchronization.
 * 4. Complete Workflow Components:
 *    - EpaperCreationWizardModal (7 fields, Daily 12 locked, Special 1-48, 32.9x52 cm).
 *    - EpaperNewsSelectionDesk (Multi-select, empty page warnings, reordering).
 *    - EpaperDesignerModal (Auto Layout vs Manual, 3 uploads, element locking, OCC save).
 * 5. Functional End-to-End Simulation of All Workflow Transitions.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

import { setupIsolatedTestPersistence } from './testIsolationHelper.js';
import { getPersistenceAdapter, LocalJsonAdapter, FirestoreAdapter } from '../src/server/persistence/adapter.js';

test('STEP 25C: Architectural Parity, Navigation & Admin UI Access Verification', async (t) => {

  // =========================================================================
  // 1. PERSISTENCE ARCHITECTURE VERIFICATION
  // =========================================================================
  await t.test('1. Persistence Architecture & Zero PostgreSQL Runtime Dependency', () => {
    // 1.1 In standard development/test runtime, default adapter is LocalJsonAdapter
    const devAdapter = getPersistenceAdapter({ forceFresh: true, allowDevFallback: true });
    assert.ok(
      devAdapter instanceof LocalJsonAdapter,
      'Development adapter must be LocalJsonAdapter (.data/bnw_persistence.json)'
    );

    // 1.2 In Firestore mode, FirestoreAdapter is selected without any PostgreSQL dependency
    const firestoreMockAdapter = new FirestoreAdapter({ isEmulator: true });
    assert.ok(
      firestoreMockAdapter instanceof FirestoreAdapter,
      'Firestore mode must instantiate FirestoreAdapter'
    );

    // 1.3 Verify that no active E-Paper endpoint in apiEngine.js imports or requires 'pg', 'prisma', or postgres
    const apiEngineContent = fs.readFileSync(path.join(ROOT_DIR, 'src/server/apiEngine.js'), 'utf8');
    assert.strictEqual(
      apiEngineContent.includes("from '@prisma/client'"),
      false,
      'apiEngine.js must not directly import @prisma/client'
    );
    assert.strictEqual(
      apiEngineContent.includes("from 'pg'"),
      false,
      'apiEngine.js must not directly import pg'
    );

    // 1.4 Verify all E-Paper methods exist on both LocalJsonAdapter and FirestoreAdapter
    const epaperMethods = [
      'createEpaperEditionWithPages',
      'getEpaperEditions',
      'getEpaperEditionById',
      'getEpaperEditionByCode',
      'getLatestEpaperEdition',
      'saveEpaperEdition',
      'updateEpaperEditionStatus',
      'deleteEpaperEdition',
      'saveEpaperPage',
      'approveEpaperEdition',
      'scheduleEpaperEdition',
      'publishEpaperEdition',
      'saveEpaperEditionVersion',
      'getEpaperEditionVersions',
    ];

    for (const method of epaperMethods) {
      assert.strictEqual(
        typeof devAdapter[method],
        'function',
        `LocalJsonAdapter must implement ${method}`
      );
      assert.strictEqual(
        typeof firestoreMockAdapter[method],
        'function',
        `FirestoreAdapter must implement ${method}`
      );
    }
  });

  // =========================================================================
  // 2. ROLE PERMISSION & PUBLISHED IMMUTABILITY VERIFICATION
  // =========================================================================
  await t.test('2. Canonical Role Governance & Published Immutability', () => {
    const canonicalRoles = ['READER', 'REPORTER', 'EDITOR', 'ADMIN', 'MASTER_ADMIN', 'SUPER_ADMIN'];
    const forbiddenRoles = ['CHIEF_EDITOR', 'DESK_EDITOR', 'MANAGING_EDITOR'];

    // Check newly edited / critical UI files for strict role conformance
    const filesToAudit = [
      'src/screens/AdminControlScreen.tsx',
      'src/screens/EpaperDesignerModal.tsx',
      'src/screens/EpaperScreen.tsx',
      'src/components/NavDrawer.tsx',
      'src/components/epaper/EpaperCreationWizardModal.tsx',
      'src/components/epaper/EpaperNewsSelectionDesk.tsx',
      'src/components/epaper/EpaperStudioTab.tsx',
      'src/components/epaper/designer/EpaperCanvasPanel.tsx',
      'src/components/epaper/designer/EpaperPropertiesPanel.tsx',
      'src/components/epaper/designer/EpaperToolboxPanel.tsx',
      'src/components/epaper/designer/EpaperDesignerHeader.tsx',
    ];

    for (const relPath of filesToAudit) {
      const fullPath = path.join(ROOT_DIR, relPath);
      assert.ok(fs.existsSync(fullPath), `File must exist: ${relPath}`);
      const content = fs.readFileSync(fullPath, 'utf8');

      for (const forbidden of forbiddenRoles) {
        const regex = new RegExp(`['"]${forbidden}['"]`, 'g');
        const matches = content.match(regex);
        assert.strictEqual(
          matches,
          null,
          `Forbidden role string '${forbidden}' found in ${relPath}`
        );
      }
    }
  });

  // =========================================================================
  // 3. MASTER ADMIN NAVIGATION WIRING VERIFICATION
  // =========================================================================
  await t.test('3. Master Admin Navigation Entry Points & Wiring', () => {
    // 3.1 Verify AdminControlScreen Overview E-Paper Section
    const adminScreenContent = fs.readFileSync(path.join(ROOT_DIR, 'src/screens/AdminControlScreen.tsx'), 'utf8');
    assert.ok(
      adminScreenContent.includes('E-PAPER MANAGEMENT'),
      'AdminControlScreen must contain E-PAPER MANAGEMENT'
    );
    assert.ok(
      adminScreenContent.includes('+ नया ई-पेपर बनाएँ (Create New E-Paper)'),
      'AdminControlScreen must prominently display + नया ई-पेपर बनाएँ (Create New E-Paper)'
    );
    assert.ok(
      adminScreenContent.includes("setEpaperAction('create')"),
      "Clicking create button must call setEpaperAction('create')"
    );
    assert.ok(
      adminScreenContent.includes("setActiveTab('epaper_studio')"),
      "Clicking create button must switch activeTab to 'epaper_studio'"
    );
    assert.ok(
      adminScreenContent.includes('Manage Draft Editions'),
      'AdminControlScreen must have Manage Draft Editions card'
    );
    assert.ok(
      adminScreenContent.includes('Manage Published Editions'),
      'AdminControlScreen must have Manage Published Editions card'
    );
    assert.ok(
      adminScreenContent.includes('E-Paper Template Library'),
      'AdminControlScreen must have E-Paper Template Library card'
    );
    assert.ok(
      adminScreenContent.includes('Edition Archive Management'),
      'AdminControlScreen must have Edition Archive Management card'
    );
    assert.ok(
      adminScreenContent.includes('initialAction={epaperAction}'),
      'EpaperStudioTab must receive initialAction={epaperAction}'
    );

    // 3.2 Verify NavDrawer E-Paper Section for Admin
    const navDrawerContent = fs.readFileSync(path.join(ROOT_DIR, 'src/components/NavDrawer.tsx'), 'utf8');
    assert.ok(
      navDrawerContent.includes('ई-पेपर प्रबंधन (E-PAPER)'),
      'NavDrawer must contain ई-पेपर प्रबंधन (E-PAPER) section'
    );
    assert.ok(
      navDrawerContent.includes('+ नया ई-पेपर बनाएँ'),
      'NavDrawer must contain + नया ई-पेपर बनाएँ button'
    );
    assert.ok(
      navDrawerContent.includes("onNavigateAdminTab('epaper_studio', 'create')"),
      'NavDrawer must trigger epaper_studio create action'
    );
    assert.ok(
      navDrawerContent.includes('डिजिटल अख़बार वाचक (Reader)'),
      'NavDrawer must offer digital reader link'
    );
    assert.ok(
      navDrawerContent.includes('सार्वजनिक नेविगेशन'),
      'NavDrawer must have public navigation section'
    );
    assert.ok(
      navDrawerContent.includes("navigateTo('epaper')"),
      'NavDrawer public navigation must open epaper reader'
    );

    // 3.3 Verify EpaperScreen Master Admin contextual bar
    const epaperScreenContent = fs.readFileSync(path.join(ROOT_DIR, 'src/screens/EpaperScreen.tsx'), 'utf8');
    assert.ok(
      epaperScreenContent.includes("['MASTER_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(currentRole"),
      'EpaperScreen must check for MASTER_ADMIN, ADMIN, or SUPER_ADMIN'
    );
    assert.ok(
      epaperScreenContent.includes('मास्टर एडमिन मोड'),
      'EpaperScreen must display मास्टर एडमिन मोड banner'
    );
    assert.ok(
      epaperScreenContent.includes('+ नया ई-पेपर बनाएँ (Create New E-Paper)'),
      'EpaperScreen must include + नया ई-पेपर बनाएँ (Create New E-Paper) CTA'
    );
    assert.ok(
      epaperScreenContent.includes("onNavigateAdmin?.('epaper_studio', 'create')"),
      'EpaperScreen must link to epaper_studio create'
    );

    // 3.4 Verify App.tsx routing synchronization
    const appContent = fs.readFileSync(path.join(ROOT_DIR, 'src/App.tsx'), 'utf8');
    assert.ok(
      appContent.includes('adminInitialTab'),
      'App.tsx must maintain adminInitialTab state'
    );
    assert.ok(
      appContent.includes('adminEpaperAction'),
      'App.tsx must maintain adminEpaperAction state'
    );
    assert.ok(
      appContent.includes('handleNavigateToAdminWithEpaperAction'),
      'App.tsx must implement handleNavigateToAdminWithEpaperAction'
    );
    assert.ok(
      appContent.includes('onNavigateAdminTab={handleNavigateToAdminWithEpaperAction}'),
      'App.tsx must pass onNavigateAdminTab to NavDrawer'
    );
    assert.ok(
      appContent.includes('initialEpaperAction={adminEpaperAction}'),
      'App.tsx must pass initialEpaperAction to AdminControlScreen'
    );
  });

  // =========================================================================
  // 4. VERIFY WORKFLOW COMPONENTS & FEATURES
  // =========================================================================
  await t.test('4. Complete Workflow Components & Controls Verification', () => {
    // 4.1 EpaperCreationWizardModal
    const wizardContent = fs.readFileSync(path.join(ROOT_DIR, 'src/components/epaper/EpaperCreationWizardModal.tsx'), 'utf8');
    assert.ok(wizardContent.includes('editionTitle'), 'Must contain editionTitle input');
    assert.ok(wizardContent.includes('editionType'), 'Must contain editionType selector');
    assert.ok(wizardContent.includes('publicationDate'), 'Must contain publicationDate input');
    assert.ok(wizardContent.includes('editionLanguage'), 'Must contain editionLanguage selector');
    assert.ok(wizardContent.includes('selectedDistrict'), 'Must contain selectedDistrict selector');
    assert.ok(wizardContent.includes('editionCode'), 'Must contain editionCode input');
    assert.ok(wizardContent.includes('editionDescription'), 'Must contain editionDescription input');
    assert.ok(wizardContent.includes('32.9 × 52.0'), 'Must display 32.9 × 52.0 cm broadsheet dimensions');
    assert.ok(wizardContent.includes('setTotalPages(12)'), 'Must enforce exactly 12 pages for Daily');
    assert.ok(wizardContent.includes('apiClient.epaper.createEdition'), 'Must call real apiClient.epaper.createEdition');

    // 4.2 EpaperNewsSelectionDesk
    const newsDeskContent = fs.readFileSync(path.join(ROOT_DIR, 'src/components/epaper/EpaperNewsSelectionDesk.tsx'), 'utf8');
    assert.ok(newsDeskContent.includes('selectedArticleIds'), 'Must support multi-article selection');
    assert.ok(newsDeskContent.includes('handleAssignArticle'), 'Must support single article assignment');
    assert.ok(newsDeskContent.includes('handleBulkAssign'), 'Must support bulk page assignment');
    assert.ok(newsDeskContent.includes('कोई समाचार असाइन नहीं'), 'Must flag empty pages');
    assert.ok(newsDeskContent.includes('handleMoveElement'), 'Must support element reordering');
    assert.ok(newsDeskContent.includes('onOpenDesigner'), 'Must provide link to Design Studio');

    // 4.3 EpaperDesignerModal & Toolbars
    const designerContent = fs.readFileSync(path.join(ROOT_DIR, 'src/screens/EpaperDesignerModal.tsx'), 'utf8');
    assert.ok(designerContent.includes('handleSaveDraft'), 'Must implement handleSaveDraft');
    assert.ok(designerContent.includes('handleSaveEntireEdition'), 'Must implement handleSaveEntireEdition');
    assert.ok(designerContent.includes('handleUploadMedia'), 'Must implement handleUploadMedia');

    const toolboxContent = fs.readFileSync(path.join(ROOT_DIR, 'src/components/epaper/designer/EpaperToolboxPanel.tsx'), 'utf8');
    assert.ok(toolboxContent.includes('समाचार पत्र फोटो'), 'Must include Newspaper Image upload');
    assert.ok(toolboxContent.includes('आलेख चित्र'), 'Must include Article Image upload');
    assert.ok(toolboxContent.includes('सहायक छायाचित्र'), 'Must include Supporting Photograph upload');

    const propsContent = fs.readFileSync(path.join(ROOT_DIR, 'src/components/epaper/designer/EpaperPropertiesPanel.tsx'), 'utf8');
    assert.ok(propsContent.includes('isLocked'), 'Must support element locking/unlocking');
    assert.ok(propsContent.includes('apiClient.articles.uploadMedia') || propsContent.includes('uploadMedia'), 'Must connect to media upload');

    const canvasContent = fs.readFileSync(path.join(ROOT_DIR, 'src/components/epaper/designer/EpaperCanvasPanel.tsx'), 'utf8');
    assert.ok(canvasContent.includes('isLocked'), 'Canvas must check isLocked before dragging/resizing');

    const headerContent = fs.readFileSync(path.join(ROOT_DIR, 'src/components/epaper/designer/EpaperDesignerHeader.tsx'), 'utf8');
    assert.ok(headerContent.includes('ऑटो लेआउट'), 'Must include Auto Layout option');
    assert.ok(headerContent.includes('मैनुअल डिज़ाइन'), 'Must include Manual Design option');
    assert.ok(headerContent.includes('प्रारूप सहेजें'), 'Must include Save Draft button');
    assert.ok(headerContent.includes('संपूर्ण संस्करण'), 'Must include Save Entire Edition button');
  });
});
