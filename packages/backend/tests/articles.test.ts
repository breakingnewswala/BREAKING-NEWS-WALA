/**
 * BREAKING NEWS WALA — News Ingestion, Drafting & Article Lifecycle Core Engine Test Suite
 * Grounded in docs/05-Workflows.md (Section 23.1, WF-CRE-01, WF-CRE-03, WF-EDT-01..04, WF-TRU-01, WF-RSS-02),
 * docs/06-Business-Rules.md (RULE-NEWS-003, RULE-NEWS-004, RULE-NEWS-005, RULE-EDIT-001 through RULE-EDIT-007),
 * and docs/13-API.md (REP-03 through REP-08, ADM-02 through ADM-06)
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../src/app';
import { createTestClient, TestClient } from './test-helper';
import { tokenService } from '../src/modules/auth/token.service';
import { articleRepository, InMemoryArticleRepository } from '../src/modules/articles/article.repository';
import { territoryRepository, InMemoryTerritoryRepository } from '../src/modules/territory/territory.repository';
import { ArticleWorkflowEngine } from '../src/modules/articles/article.workflow';

describe('Article Lifecycle Core Engine — Unit & Workflow State Invariants', () => {
  it('should verify formal BPMN 2.0 state machine transitions (Section 23.1)', () => {
    // Permitted transitions
    assert.strictEqual(ArticleWorkflowEngine.isTransitionAllowed('draft', 'pending_review'), true);
    assert.strictEqual(ArticleWorkflowEngine.isTransitionAllowed('draft', 'published'), true);
    assert.strictEqual(ArticleWorkflowEngine.isTransitionAllowed('pending_review', 'under_review'), true);
    assert.strictEqual(ArticleWorkflowEngine.isTransitionAllowed('under_review', 'published'), true);
    assert.strictEqual(ArticleWorkflowEngine.isTransitionAllowed('under_review', 'revision_requested'), true);
    assert.strictEqual(ArticleWorkflowEngine.isTransitionAllowed('under_review', 'rejected'), true);
    assert.strictEqual(ArticleWorkflowEngine.isTransitionAllowed('revision_requested', 'pending_review'), true);
    assert.strictEqual(ArticleWorkflowEngine.isTransitionAllowed('published', 'archived'), true);
    assert.strictEqual(ArticleWorkflowEngine.isTransitionAllowed('published', 'retracted'), true);

    // Disallowed / Invalid transitions
    assert.strictEqual(ArticleWorkflowEngine.isTransitionAllowed('draft', 'retracted'), false);
    assert.strictEqual(ArticleWorkflowEngine.isTransitionAllowed('draft', 'archived'), false);
    assert.strictEqual(ArticleWorkflowEngine.isTransitionAllowed('rejected', 'published'), false);
    assert.strictEqual(ArticleWorkflowEngine.isTransitionAllowed('archived', 'draft'), false);
    assert.strictEqual(ArticleWorkflowEngine.isTransitionAllowed('retracted', 'published'), false);
  });

  it('should verify editor and reporter role checks', () => {
    assert.strictEqual(ArticleWorkflowEngine.isElevatedEditor(['ROLE_DESK_EDITOR']), true);
    assert.strictEqual(ArticleWorkflowEngine.isElevatedEditor(['editor']), true);
    assert.strictEqual(ArticleWorkflowEngine.isElevatedEditor(['ROLE_ADMIN']), true);
    assert.strictEqual(ArticleWorkflowEngine.isElevatedEditor(['ROLE_REPORTER_STANDARD']), false);
    assert.strictEqual(ArticleWorkflowEngine.isElevatedEditor(['ROLE_REPORTER_TRUSTED']), false);

    assert.strictEqual(ArticleWorkflowEngine.isTrustedReporter(['ROLE_REPORTER_TRUSTED']), true);
    assert.strictEqual(ArticleWorkflowEngine.isTrustedReporter(['reporter_trusted']), true);
    assert.strictEqual(ArticleWorkflowEngine.isTrustedReporter(['ROLE_REPORTER_STANDARD']), false);
  });
});

describe('Article Drafting, Validation & Publishing Engine (Integration)', () => {
  let client: TestClient;

  // Reusable auth tokens
  const reporterStandard = {
    id: 'user-reporter-std-101',
    token: tokenService.generateAccessToken({
      userId: 'user-reporter-std-101',
      roles: ['ROLE_REPORTER_STANDARD'],
      status: 'active',
    }).token,
  };

  const reporterStandard2 = {
    id: 'user-reporter-std-102',
    token: tokenService.generateAccessToken({
      userId: 'user-reporter-std-102',
      roles: ['ROLE_REPORTER_STANDARD'],
      status: 'active',
    }).token,
  };

  const reporterTrusted = {
    id: 'user-reporter-trusted-201',
    token: tokenService.generateAccessToken({
      userId: 'user-reporter-trusted-201',
      roles: ['ROLE_REPORTER_TRUSTED'],
      status: 'active',
    }).token,
  };

  const editorDesk = {
    id: 'user-editor-desk-301',
    token: tokenService.generateAccessToken({
      userId: 'user-editor-desk-301',
      roles: ['ROLE_DESK_EDITOR'],
      status: 'active',
    }).token,
  };

  // Valid Hindi test data meeting RULE-NEWS-003 and RULE-NEWS-004
  const validHindiHeadline = 'भोपाल में भारी बारिश से जनजीवन अस्त-व्यस्त, कई कॉलोनियों में भरा पानी';
  const validHindiBody = `मध्य प्रदेश की राजधानी भोपाल में पिछले 24 घंटों से लगातार हो रही मूसलाधार बारिश के चलते सामान्य जनजीवन बुरी तरह प्रभावित हो गया है। निचले इलाकों में पानी भर जाने से कई मुख्य मार्गों पर यातायात ठप हो गया है। नगर निगम और आपदा प्रबंधन की टीमें राहत और बचाव कार्य में जुटी हुई हैं।

मौसम विभाग ने अगले 48 घंटों के लिए भोपाल, सीहोर, राजगढ़ और विदिशा समेत कई जिलों में भारी से अत्यधिक भारी बारिश का रेड अलर्ट जारी किया है। प्रशासन ने नागरिकों से बिना जरूरी काम के घरों से बाहर न निकलने की अपील की है और हेल्पलाइन नंबर जारी किए हैं। स्कूलों और आंगनबाड़ी केंद्रों में अवकाश घोषित कर दिया गया है।`;

  before(async () => {
    const app = createApp();
    client = await createTestClient(app);

    // Register reporter territory assignment for Bhopal district (dist-bhopal)
    const territoryRepo = territoryRepository as InMemoryTerritoryRepository;
    territoryRepo.addMockAssignment({
      id: 'assign-bhopal-trusted-201',
      reporterId: reporterTrusted.id,
      locationId: 'dist-bhopal',
      assignmentType: 'PRIMARY',
      assignedBy: 'system',
      assignedAt: new Date(),
      status: 'active',
    });
  });

  after(async () => {
    await client.close();
  });

  beforeEach(() => {
    (articleRepository as InMemoryArticleRepository).clear();
  });

  describe('1. Content Validation & Sanitization (RULE-NEWS-003, RULE-NEWS-004, RULE-CAT-004, RULE-LOC-001)', () => {
    it('should reject draft when headline has fewer than 15 characters (RULE-NEWS-003)', async () => {
      const res = await client.post(
        '/api/v1/articles/drafts',
        {
          title: 'कम शब्द', // 7 chars
          bodyContent: validHindiBody,
          primaryCategoryId: 'madhya-pradesh',
          primaryLocationId: 'bhopal',
        },
        { Authorization: `Bearer ${reporterStandard.token}` }
      );

      assert.strictEqual(res.status, 422);
      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.strictEqual(json.error.code, 'ERR_VALIDATION_FAILED');
      assert.ok(json.error.details.some((d: any) => d.code === 'ERR_HEADLINE_LENGTH'));
    });

    it('should reject draft when headline exceeds 150 characters (RULE-NEWS-003)', async () => {
      const longHeadline = 'भोपाल में भारी बारिश से जनजीवन अस्त-व्यस्त '.repeat(10); // > 150 chars
      const res = await client.post(
        '/api/v1/articles/drafts',
        {
          title: longHeadline,
          bodyContent: validHindiBody,
          primaryCategoryId: 'madhya-pradesh',
          primaryLocationId: 'bhopal',
        },
        { Authorization: `Bearer ${reporterStandard.token}` }
      );

      assert.strictEqual(res.status, 422);
      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.ok(json.error.details.some((d: any) => d.code === 'ERR_HEADLINE_LENGTH'));
    });

    it('should reject draft when headline lacks Devanagari Hindi characters (RULE-NEWS-003)', async () => {
      const res = await client.post(
        '/api/v1/articles/drafts',
        {
          title: 'Heavy Rainfall in Bhopal causes severe waterlogging across city', // Pure English
          bodyContent: validHindiBody,
          primaryCategoryId: 'madhya-pradesh',
          primaryLocationId: 'bhopal',
        },
        { Authorization: `Bearer ${reporterStandard.token}` }
      );

      assert.strictEqual(res.status, 422);
      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.ok(json.error.details.some((d: any) => d.code === 'ERR_HEADLINE_SCRIPT'));
    });

    it('should reject draft when body is shorter than 50 words and 250 characters (RULE-NEWS-004)', async () => {
      const res = await client.post(
        '/api/v1/articles/drafts',
        {
          title: validHindiHeadline,
          bodyContent: 'यह खबर बहुत छोटी है और इसमें जरूरी शब्द नहीं हैं।',
          primaryCategoryId: 'madhya-pradesh',
          primaryLocationId: 'bhopal',
        },
        { Authorization: `Bearer ${reporterStandard.token}` }
      );

      assert.strictEqual(res.status, 422);
      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.ok(json.error.details.some((d: any) => d.code === 'ERR_BODY_MIN_LENGTH'));
    });

    it('should reject draft when body contains prohibited HTML tags (<script>) (RULE-NEWS-004)', async () => {
      const maliciousBody = `${validHindiBody} <script>alert("xss attack")</script>`;
      const res = await client.post(
        '/api/v1/articles/drafts',
        {
          title: validHindiHeadline,
          bodyContent: maliciousBody,
          primaryCategoryId: 'madhya-pradesh',
          primaryLocationId: 'bhopal',
        },
        { Authorization: `Bearer ${reporterStandard.token}` }
      );

      assert.strictEqual(res.status, 422);
      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.ok(json.error.details.some((d: any) => d.code === 'ERR_DISALLOWED_TAGS'));
    });

    it('should reject draft when primary category does not exist (RULE-CAT-004)', async () => {
      const res = await client.post(
        '/api/v1/articles/drafts',
        {
          title: validHindiHeadline,
          bodyContent: validHindiBody,
          primaryCategoryId: 'non-existent-category-slug',
          primaryLocationId: 'bhopal',
        },
        { Authorization: `Bearer ${reporterStandard.token}` }
      );

      assert.strictEqual(res.status, 404);
      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.ok(json.error.message.includes('not found in category registry'));
    });

    it('should reject draft when primary location district does not exist (RULE-LOC-001)', async () => {
      const res = await client.post(
        '/api/v1/articles/drafts',
        {
          title: validHindiHeadline,
          bodyContent: validHindiBody,
          primaryCategoryId: 'madhya-pradesh',
          primaryLocationId: 'mars-district',
        },
        { Authorization: `Bearer ${reporterStandard.token}` }
      );

      assert.strictEqual(res.status, 404);
      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.ok(json.error.message.includes('not found'));
    });
  });

  describe('2. Draft Creation, Retrieval & Author Portfolio (REP-03, REP-05)', () => {
    it('should successfully create a draft with public ID, slug, and initial revision snapshot', async () => {
      const res = await client.post(
        '/api/v1/articles/drafts',
        {
          title: validHindiHeadline,
          subheadline: 'मौसम विभाग ने जारी किया रेड अलर्ट',
          bodyContent: validHindiBody,
          primaryCategoryId: 'madhya-pradesh',
          primaryLocationId: 'bhopal',
        },
        { Authorization: `Bearer ${reporterStandard.token}` }
      );

      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.ok(json.data.id, 'Article must have UUID');
      assert.strictEqual(json.data.status, 'draft');
      assert.strictEqual(json.data.authorId, reporterStandard.id);
      assert.ok(json.data.publicId.startsWith('art_'), 'Public ID must follow art_ prefix');
      assert.ok(json.data.slug.includes(json.data.publicId), 'Slug must incorporate public ID for uniqueness');

      // Verify draft can be retrieved
      const draftRes = await client.get(`/api/v1/articles/drafts/${json.data.id}`, {
        Authorization: `Bearer ${reporterStandard.token}`,
      });
      assert.strictEqual(draftRes.status, 200);
      const draftJson = await draftRes.json();
      assert.strictEqual(draftJson.data.id, json.data.id);
      assert.strictEqual(draftJson.data.title, validHindiHeadline);

      // Verify initial revision snapshot (versionNumber: 1)
      const revRes = await client.get(`/api/v1/articles/${json.data.id}/revisions`, {
        Authorization: `Bearer ${reporterStandard.token}`,
      });
      assert.strictEqual(revRes.status, 200);
      const revJson = await revRes.json();
      assert.strictEqual(revJson.data.length, 1);
      assert.strictEqual(revJson.data[0].versionNumber, 1);
      assert.strictEqual(revJson.data[0].revisionSummary, 'Initial draft created');
    });

    it('should list articles in author portfolio (GET /api/v1/articles/my-articles)', async () => {
      // Create draft for reporter 1
      await client.post(
        '/api/v1/articles/drafts',
        {
          title: validHindiHeadline,
          bodyContent: validHindiBody,
          primaryCategoryId: 'madhya-pradesh',
          primaryLocationId: 'bhopal',
        },
        { Authorization: `Bearer ${reporterStandard.token}` }
      );

      const res = await client.get('/api/v1/articles/my-articles', {
        Authorization: `Bearer ${reporterStandard.token}`,
      });

      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.length, 1);
      assert.strictEqual(json.data[0].authorId, reporterStandard.id);

      // Different reporter receives empty portfolio
      const res2 = await client.get('/api/v1/articles/my-articles', {
        Authorization: `Bearer ${reporterStandard2.token}`,
      });
      const json2 = await res2.json();
      assert.strictEqual(json2.data.length, 0);
    });

    it('should support canonical alias /api/v1/reporter/news/drafts (REP-03 compatibility)', async () => {
      const res = await client.post(
        '/api/v1/reporter/news/drafts',
        {
          title: validHindiHeadline,
          bodyContent: validHindiBody,
          primaryCategoryId: 'madhya-pradesh',
          primaryLocationId: 'bhopal',
        },
        { Authorization: `Bearer ${reporterStandard.token}` }
      );

      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.status, 'draft');
    });
  });

  describe('3. Draft Updates & Revision History (REP-04, RULE-EDIT-006)', () => {
    it('should allow author to update draft and generate incremented revision snapshot (version 2)', async () => {
      // 1. Create draft
      const createRes = await client.post(
        '/api/v1/articles/drafts',
        {
          title: validHindiHeadline,
          bodyContent: validHindiBody,
          primaryCategoryId: 'madhya-pradesh',
          primaryLocationId: 'bhopal',
        },
        { Authorization: `Bearer ${reporterStandard.token}` }
      );
      const articleId = (await createRes.json()).data.id;

      // 2. Update draft title and body
      const updatedHeadline = 'भोपाल में भारी बारिश से जनजीवन ठप, कई प्रमुख कॉलोनियों में भरा पानी';
      const updateRes = await client.patch(
        `/api/v1/articles/drafts/${articleId}`,
        {
          title: updatedHeadline,
          revisionSummary: 'सुधार: मुख्य शीर्षक अपडेट किया गया',
        },
        { Authorization: `Bearer ${reporterStandard.token}` }
      );

      assert.strictEqual(updateRes.status, 200);
      const updateJson = await updateRes.json();
      assert.strictEqual(updateJson.data.title, updatedHeadline);

      // 3. Verify revisions (now contains version 2 and version 1)
      const revRes = await client.get(`/api/v1/articles/${articleId}/revisions`, {
        Authorization: `Bearer ${reporterStandard.token}`,
      });
      const revJson = await revRes.json();
      assert.strictEqual(revJson.data.length, 2);
      assert.strictEqual(revJson.data[0].versionNumber, 2);
      assert.strictEqual(revJson.data[0].title, updatedHeadline);
      assert.strictEqual(revJson.data[1].versionNumber, 1);
    });

    it('should prohibit non-author from updating another reporter draft (403 Forbidden)', async () => {
      const createRes = await client.post(
        '/api/v1/articles/drafts',
        {
          title: validHindiHeadline,
          bodyContent: validHindiBody,
          primaryCategoryId: 'madhya-pradesh',
          primaryLocationId: 'bhopal',
        },
        { Authorization: `Bearer ${reporterStandard.token}` }
      );
      const articleId = (await createRes.json()).data.id;

      // Reporter 2 attempts update
      const updateRes = await client.patch(
        `/api/v1/articles/drafts/${articleId}`,
        { title: 'शीर्षक में अनधिकृत परिवर्तन करने का प्रयास किया गया' },
        { Authorization: `Bearer ${reporterStandard2.token}` }
      );

      assert.strictEqual(updateRes.status, 403);
      const json = await updateRes.json();
      assert.strictEqual(json.success, false);
      assert.strictEqual(json.error.code, 'ERR_FORBIDDEN');
    });
  });

  describe('4. Workflow State Transitions (Submit, Direct-Publish, Review Desk)', () => {
    it('POST /:id/submit: author submits draft -> transitions to pending_review (WF-CRE-03)', async () => {
      const createRes = await client.post(
        '/api/v1/articles/drafts',
        {
          title: validHindiHeadline,
          bodyContent: validHindiBody,
          primaryCategoryId: 'madhya-pradesh',
          primaryLocationId: 'bhopal',
        },
        { Authorization: `Bearer ${reporterStandard.token}` }
      );
      const articleId = (await createRes.json()).data.id;

      const submitRes = await client.post(
        `/api/v1/articles/${articleId}/submit`,
        {},
        { Authorization: `Bearer ${reporterStandard.token}` }
      );

      assert.strictEqual(submitRes.status, 200);
      const json = await submitRes.json();
      assert.strictEqual(json.data.status, 'pending_review');
      assert.ok(json.data.submittedAt, 'Article must have submittedAt timestamp');
    });

    it('POST /:id/direct-publish: standard reporter attempt is rejected with 403 Forbidden (RULE-EDIT-001)', async () => {
      const createRes = await client.post(
        '/api/v1/articles/drafts',
        {
          title: validHindiHeadline,
          bodyContent: validHindiBody,
          primaryCategoryId: 'madhya-pradesh',
          primaryLocationId: 'bhopal',
        },
        { Authorization: `Bearer ${reporterStandard.token}` }
      );
      const articleId = (await createRes.json()).data.id;

      const pubRes = await client.post(
        `/api/v1/articles/${articleId}/direct-publish`,
        {},
        { Authorization: `Bearer ${reporterStandard.token}` }
      );

      assert.strictEqual(pubRes.status, 403);
      const json = await pubRes.json();
      assert.strictEqual(json.success, false);
      assert.ok(json.error.message.includes('Standard reporters cannot direct-publish'));
    });

    it('POST /:id/direct-publish: trusted reporter with beat district match publishes directly (RULE-EDIT-002)', async () => {
      // ReporterTrusted has active assignment in dist-bhopal
      const createRes = await client.post(
        '/api/v1/articles/drafts',
        {
          title: validHindiHeadline,
          bodyContent: validHindiBody,
          primaryCategoryId: 'madhya-pradesh',
          primaryLocationId: 'bhopal', // Resolves to dist-bhopal
        },
        { Authorization: `Bearer ${reporterTrusted.token}` }
      );
      const articleId = (await createRes.json()).data.id;

      const pubRes = await client.post(
        `/api/v1/articles/${articleId}/direct-publish`,
        {},
        { Authorization: `Bearer ${reporterTrusted.token}` }
      );

      assert.strictEqual(pubRes.status, 200);
      const json = await pubRes.json();
      assert.strictEqual(json.data.status, 'published');
      assert.ok(json.data.publishedAt, 'Published article must have publishedAt timestamp');
    });

    it('POST /:id/direct-publish: trusted reporter outside beat is rerouted to pending_review (RULE-EDIT-003)', async () => {
      // ReporterTrusted only has assignment for Bhopal, but writes article for Indore
      const createRes = await client.post(
        '/api/v1/articles/drafts',
        {
          title: 'इंदौर शहर में स्वच्छ सर्वेक्षण को लेकर व्यापक तैयारियां शुरू हुईं',
          bodyContent: validHindiBody,
          primaryCategoryId: 'madhya-pradesh',
          primaryLocationId: 'indore', // Resolves to dist-indore (outside Bhopal beat)
        },
        { Authorization: `Bearer ${reporterTrusted.token}` }
      );
      const articleId = (await createRes.json()).data.id;

      const pubRes = await client.post(
        `/api/v1/articles/${articleId}/direct-publish`,
        {},
        { Authorization: `Bearer ${reporterTrusted.token}` }
      );

      assert.strictEqual(pubRes.status, 200);
      const json = await pubRes.json();
      assert.strictEqual(json.data.status, 'pending_review');
      assert.strictEqual(json.data.rerouted, true);
      assert.ok(json.data.note.includes('RULE-EDIT-003'), 'Must note automatic rerouting per RULE-EDIT-003');
    });

    it('POST /:id/review: editor claims article (claim) -> transitions to under_review (WF-EDT-01)', async () => {
      // Create and submit draft
      const createRes = await client.post(
        '/api/v1/articles/drafts',
        {
          title: validHindiHeadline,
          bodyContent: validHindiBody,
          primaryCategoryId: 'madhya-pradesh',
          primaryLocationId: 'bhopal',
        },
        { Authorization: `Bearer ${reporterStandard.token}` }
      );
      const articleId = (await createRes.json()).data.id;
      await client.post(`/api/v1/articles/${articleId}/submit`, {}, { Authorization: `Bearer ${reporterStandard.token}` });

      // Editor claims article
      const claimRes = await client.post(
        `/api/v1/articles/${articleId}/review`,
        { action: 'claim' },
        { Authorization: `Bearer ${editorDesk.token}` }
      );

      assert.strictEqual(claimRes.status, 200);
      const json = await claimRes.json();
      assert.strictEqual(json.data.article.status, 'under_review');
      assert.strictEqual(json.data.review.action, 'claim');
      assert.strictEqual(json.data.review.reviewerId, editorDesk.id);
    });

    it('POST /:id/review: editor approves article (approve) -> transitions to published (WF-EDT-02)', async () => {
      // Create, submit, claim
      const createRes = await client.post(
        '/api/v1/articles/drafts',
        {
          title: validHindiHeadline,
          bodyContent: validHindiBody,
          primaryCategoryId: 'madhya-pradesh',
          primaryLocationId: 'bhopal',
        },
        { Authorization: `Bearer ${reporterStandard.token}` }
      );
      const articleId = (await createRes.json()).data.id;
      await client.post(`/api/v1/articles/${articleId}/submit`, {}, { Authorization: `Bearer ${reporterStandard.token}` });
      await client.post(`/api/v1/articles/${articleId}/review`, { action: 'claim' }, { Authorization: `Bearer ${editorDesk.token}` });

      // Editor approves
      const approveRes = await client.post(
        `/api/v1/articles/${articleId}/review`,
        { action: 'approve' },
        { Authorization: `Bearer ${editorDesk.token}` }
      );

      assert.strictEqual(approveRes.status, 200);
      const json = await approveRes.json();
      assert.strictEqual(json.data.article.status, 'published');
      assert.ok(json.data.article.publishedAt);
    });

    it('POST /:id/review: editor requests changes (request_changes) with feedback comments (WF-EDT-03)', async () => {
      const createRes = await client.post(
        '/api/v1/articles/drafts',
        {
          title: validHindiHeadline,
          bodyContent: validHindiBody,
          primaryCategoryId: 'madhya-pradesh',
          primaryLocationId: 'bhopal',
        },
        { Authorization: `Bearer ${reporterStandard.token}` }
      );
      const articleId = (await createRes.json()).data.id;
      await client.post(`/api/v1/articles/${articleId}/submit`, {}, { Authorization: `Bearer ${reporterStandard.token}` });
      await client.post(`/api/v1/articles/${articleId}/review`, { action: 'claim' }, { Authorization: `Bearer ${editorDesk.token}` });

      const reqRes = await client.post(
        `/api/v1/articles/${articleId}/review`,
        {
          action: 'request_changes',
          feedbackComments: 'कृपया नगर निगम के मुख्य अभियंता का आधिकारिक बयान जोड़ें।',
        },
        { Authorization: `Bearer ${editorDesk.token}` }
      );

      assert.strictEqual(reqRes.status, 200);
      const json = await reqRes.json();
      assert.strictEqual(json.data.article.status, 'revision_requested');

      // Author can inspect feedback via canonical REP-08 endpoint
      const fbRes = await client.get(`/api/v1/articles/${articleId}/feedback`, {
        Authorization: `Bearer ${reporterStandard.token}`,
      });
      assert.strictEqual(fbRes.status, 200);
      const fbJson = await fbRes.json();
      assert.strictEqual(fbJson.data.length, 2); // claim + request_changes
      assert.strictEqual(fbJson.data[0].action, 'request_changes');
      assert.ok(fbJson.data[0].feedbackComments.includes('अभियंता का आधिकारिक बयान'));
    });

    it('POST /:id/review: reject requires reasonCode and >= 10 chars feedback (RULE-EDIT-005)', async () => {
      const createRes = await client.post(
        '/api/v1/articles/drafts',
        {
          title: validHindiHeadline,
          bodyContent: validHindiBody,
          primaryCategoryId: 'madhya-pradesh',
          primaryLocationId: 'bhopal',
        },
        { Authorization: `Bearer ${reporterStandard.token}` }
      );
      const articleId = (await createRes.json()).data.id;
      await client.post(`/api/v1/articles/${articleId}/submit`, {}, { Authorization: `Bearer ${reporterStandard.token}` });
      await client.post(`/api/v1/articles/${articleId}/review`, { action: 'claim' }, { Authorization: `Bearer ${editorDesk.token}` });

      // Attempt rejection without reason code -> 422
      const rejRes1 = await client.post(
        `/api/v1/articles/${articleId}/review`,
        { action: 'reject', feedbackComments: 'यह खबर सत्यापित नहीं है।' },
        { Authorization: `Bearer ${editorDesk.token}` }
      );
      assert.strictEqual(rejRes1.status, 422);

      // Attempt rejection with comment < 10 chars -> 422
      const rejRes2 = await client.post(
        `/api/v1/articles/${articleId}/review`,
        { action: 'reject', reasonCode: 'UNVERIFIED', feedbackComments: 'गलत खबर' },
        { Authorization: `Bearer ${editorDesk.token}` }
      );
      assert.strictEqual(rejRes2.status, 422);

      // Valid rejection
      const rejRes3 = await client.post(
        `/api/v1/articles/${articleId}/review`,
        {
          action: 'reject',
          reasonCode: 'FACT_CHECK_FAILED',
          feedbackComments: 'दावे की पुष्टि किसी आधिकारिक स्रोत या प्रत्यक्षदर्शी से नहीं हो सकी (10-Point Fact Check Failed)।',
        },
        { Authorization: `Bearer ${editorDesk.token}` }
      );
      assert.strictEqual(rejRes3.status, 200);
      const json = await rejRes3.json();
      assert.strictEqual(json.data.article.status, 'rejected');

      // Rejected is a terminal state: cannot transition further
      const retryRes = await client.post(
        `/api/v1/articles/${articleId}/review`,
        { action: 'approve' },
        { Authorization: `Bearer ${editorDesk.token}` }
      );
      assert.strictEqual(retryRes.status, 422);
      const retryJson = await retryRes.json();
      assert.ok(retryJson.error.message.toLowerCase().includes('not permitted'));
    });
  });

  describe('5. External Wire / RSS News Ingestion (POST /api/v1/articles/ingest)', () => {
    it('should ingest external article into DRAFT status with SHA-256 deduplication', async () => {
      const wirePayload = {
        originalTitle: 'मध्य प्रदेश में औद्योगिक निवेश को बढ़ावा देने के लिए नई नीति तैयार',
        originalUrl: 'https://wire.example.com/news/2026/10/mp-industrial-policy-draft',
        bodyContent: validHindiBody,
        sourceName: 'पीटीआई भाषा (PTI Bhasha)',
        primaryCategoryId: 'business',
        primaryLocationId: 'bhopal',
      };

      // First ingestion
      const res1 = await client.post('/api/v1/articles/ingest', wirePayload, {
        Authorization: `Bearer ${editorDesk.token}`,
      });

      assert.strictEqual(res1.status, 200);
      const json1 = await res1.json();
      assert.strictEqual(json1.success, true);
      assert.strictEqual(json1.data.status, 'draft', 'External wire must ingest into draft status only');
      assert.strictEqual(json1.data.contentSource, 'external_wire');
      assert.strictEqual(json1.data.sourceAttribution, 'पीटीआई भाषा (PTI Bhasha)');
      assert.strictEqual(json1.data.isDuplicate, false);
      const firstArticleId = json1.data.id;

      // Duplicate ingestion with same URL
      const res2 = await client.post('/api/v1/articles/ingest', wirePayload, {
        Authorization: `Bearer ${editorDesk.token}`,
      });

      assert.strictEqual(res2.status, 200);
      const json2 = await res2.json();
      assert.strictEqual(json2.success, true);
      assert.strictEqual(json2.data.id, firstArticleId, 'Must return existing article on duplicate URL');
      assert.strictEqual(json2.data.isDuplicate, true);
    });

    it('should reject ingestion with missing required fields (422)', async () => {
      const res = await client.post(
        '/api/v1/articles/ingest',
        {
          originalTitle: 'शीर्षक केवल',
          // missing originalUrl, bodyContent, sourceName
        },
        { Authorization: `Bearer ${editorDesk.token}` }
      );

      assert.strictEqual(res.status, 422);
      const json = await res.json();
      assert.strictEqual(json.success, false);
    });
  });

  describe('6. Access Control & Public Visibility Boundaries', () => {
    it('should hide unpublished drafts from public / unauthenticated inquiries (403 Forbidden)', async () => {
      const createRes = await client.post(
        '/api/v1/articles/drafts',
        {
          title: validHindiHeadline,
          bodyContent: validHindiBody,
          primaryCategoryId: 'madhya-pradesh',
          primaryLocationId: 'bhopal',
        },
        { Authorization: `Bearer ${reporterStandard.token}` }
      );
      const articleId = (await createRes.json()).data.id;

      // Public / Anonymous user request
      const pubGetRes = await client.get(`/api/v1/articles/${articleId}`);
      assert.strictEqual(pubGetRes.status, 403);
      const json = await pubGetRes.json();
      assert.strictEqual(json.success, false);
      assert.strictEqual(json.error.code, 'ERR_FORBIDDEN');
    });

    it('should allow public access to published articles and filter unpublished from public feed', async () => {
      // 1. Create and direct-publish via trusted reporter
      const createRes = await client.post(
        '/api/v1/articles/drafts',
        {
          title: validHindiHeadline,
          bodyContent: validHindiBody,
          primaryCategoryId: 'madhya-pradesh',
          primaryLocationId: 'bhopal',
        },
        { Authorization: `Bearer ${reporterTrusted.token}` }
      );
      const articleId = (await createRes.json()).data.id;
      await client.post(`/api/v1/articles/${articleId}/direct-publish`, {}, { Authorization: `Bearer ${reporterTrusted.token}` });

      // 2. Public / Anonymous user request for published article
      const pubRes = await client.get(`/api/v1/articles/${articleId}`);
      assert.strictEqual(pubRes.status, 200);
      const pubJson = await pubRes.json();
      assert.strictEqual(pubJson.data.id, articleId);
      assert.strictEqual(pubJson.data.status, 'published');

      // 3. Public feed only returns published articles
      const feedRes = await client.get('/api/v1/articles');
      assert.strictEqual(feedRes.status, 200);
      const feedJson = await feedRes.json();
      assert.ok(feedJson.data.length >= 1);
      assert.ok(feedJson.data.every((a: any) => a.status === 'published'));
    });
  });
});
