/**
 * BREAKING NEWS WALA — RSS, Automation & Ingestion Test Suite
 * Grounded in docs/11-Architecture.md, docs/15-Security.md, docs/20-Integrations.md,
 * and docs/DECISIONS.md (DEC-048)
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { RssService } from '../../src/modules/rss/rss.service';
import { InMemoryRssRepository } from '../../src/modules/rss/rss.repository';
import { SsrfValidator } from '../../src/modules/rss/security/ssrf.validator';
import { SafeXmlParser } from '../../src/modules/rss/security/xml.parser';
import { AutomationService } from '../../src/modules/automation/automation.service';
import { InMemoryAutomationRepository } from '../../src/modules/automation/automation.repository';

describe('BNW-MASTER-005: AI Newsroom, RSS & Automation Engine Suite', () => {
  let rssRepo: InMemoryRssRepository;
  let rssService: RssService;
  let autoRepo: InMemoryAutomationRepository;
  let autoService: AutomationService;

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    rssRepo = new InMemoryRssRepository();
    rssService = new RssService(rssRepo);
    autoRepo = new InMemoryAutomationRepository();
    autoService = new AutomationService(autoRepo);
  });

  // =========================================================================
  // 1. SSRF Security & URL Validation
  // =========================================================================

  describe('1. SSRF Protection & URL Boundary Defense', () => {
    it('blocks localhost and loopback IPv4 addresses', () => {
      const r1 = SsrfValidator.validateUrl('http://127.0.0.1/feed.xml');
      assert.strictEqual(r1.isSafe, false);
      assert.match(r1.reason!, /Loopback|Restricted hostname/i);

      const r2 = SsrfValidator.validateUrl('http://localhost:8080/rss');
      assert.strictEqual(r2.isSafe, false);
      assert.match(r2.reason!, /Restricted hostname/i);
    });

    it('blocks private IPv4 ranges (Class A, B, C)', () => {
      const r1 = SsrfValidator.validateUrl('http://10.0.1.5/feed');
      assert.strictEqual(r1.isSafe, false);
      assert.match(r1.reason!, /Private Class A/i);

      const r2 = SsrfValidator.validateUrl('http://172.16.50.1/feed.xml');
      assert.strictEqual(r2.isSafe, false);
      assert.match(r2.reason!, /Private Class B/i);

      const r3 = SsrfValidator.validateUrl('http://192.168.1.1/rss');
      assert.strictEqual(r3.isSafe, false);
      assert.match(r3.reason!, /Private Class C/i);
    });

    it('blocks cloud metadata endpoints (169.254.169.254 and metadata.google.internal)', () => {
      const r1 = SsrfValidator.validateUrl('http://169.254.169.254/latest/meta-data/');
      assert.strictEqual(r1.isSafe, false);
      assert.match(r1.reason!, /Link-Local|Restricted/i);

      const r2 = SsrfValidator.validateUrl('http://metadata.google.internal/computeMetadata/v1/');
      assert.strictEqual(r2.isSafe, false);
      assert.match(r2.reason!, /Restricted hostname/i);
    });

    it('blocks non-HTTP protocols (file, ftp, gopher, javascript)', () => {
      const r1 = SsrfValidator.validateUrl('file:///etc/passwd');
      assert.strictEqual(r1.isSafe, false);
      assert.match(r1.reason!, /Disallowed protocol/i);

      const r2 = SsrfValidator.validateUrl('ftp://feed.example.com/rss.xml');
      assert.strictEqual(r2.isSafe, false);
      assert.match(r2.reason!, /Disallowed protocol/i);
    });

    it('blocks embedded user credentials in URL', () => {
      const r = SsrfValidator.validateUrl('https://admin:supersecret@news.mp.gov.in/feed');
      assert.strictEqual(r.isSafe, false);
      assert.match(r.reason!, /credentials/i);
    });

    it('blocks administrative and internal ports', () => {
      const r1 = SsrfValidator.validateUrl('http://news.mpinfo.org:22/feed.xml');
      assert.strictEqual(r1.isSafe, false);
      assert.match(r1.reason!, /Restricted port/i);

      const r2 = SsrfValidator.validateUrl('http://news.mpinfo.org:5432/rss');
      assert.strictEqual(r2.isSafe, false);
      assert.match(r2.reason!, /Restricted port/i);
    });

    it('approves legitimate public HTTPS RSS feed URLs', () => {
      const r = SsrfValidator.validateUrl('https://news.mpinfo.org/feed/rss2.xml');
      assert.strictEqual(r.isSafe, true);
      assert.strictEqual(r.port, 443);
      assert.strictEqual(r.protocol, 'https:');
    });
  });

  // =========================================================================
  // 2. Safe XML Parsing & XXE Defense
  // =========================================================================

  describe('2. Safe XML Parser & XXE Immunity', () => {
    it('detects and immediately blocks XXE entity expansion attacks', () => {
      const maliciousXml = `<?xml version="1.0"?>
      <!DOCTYPE root [
        <!ENTITY xxe SYSTEM "file:///etc/passwd">
      ]>
      <rss version="2.0">
        <channel>
          <title>&xxe;</title>
        </channel>
      </rss>`;

      assert.throws(() => {
        SafeXmlParser.parseFeed(maliciousXml);
      }, /XXE Injection attempt blocked/);
    });

    it('rejects feeds exceeding 5MB payload limit', () => {
      const hugeXml = 'x'.repeat(6 * 1024 * 1024);
      assert.throws(() => {
        SafeXmlParser.parseFeed(hugeXml);
      }, /exceeds maximum allowable limit/);
    });

    it('sanitizes malicious scripts and iframes inside feed content', () => {
      const dirtyHtml = `
        <p>मध्य प्रदेश में नई योजना का शुभारंभ।</p>
        <script>alert("hacked");</script>
        <iframe src="http://evil.com"></iframe>
        <img src="photo.jpg" onload="stealCookies()" />
        <a href="javascript:void(0)">क्लिक करें</a>
      `;

      const cleanHtml = SafeXmlParser.sanitizeHtml(dirtyHtml);
      assert.strictEqual(cleanHtml.includes('<script>'), false);
      assert.strictEqual(cleanHtml.includes('<iframe>'), false);
      assert.strictEqual(cleanHtml.includes('onload'), false);
      assert.strictEqual(cleanHtml.includes('javascript:'), false);
      assert.strictEqual(cleanHtml.includes('मध्य प्रदेश में नई योजना का शुभारंभ।'), true);
    });

    it('parses valid RSS 2.0 with Devanagari Hindi text and categories', () => {
      const sampleRss = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>भोपाल विकास समाचार</title>
          <link>https://bhopal-news.org</link>
          <description>राजधानी भोपाल के ताज़ा समाचार</description>
          <language>hi</language>
          <item>
            <title>भोपाल बीआरटीएस कॉरिडोर का नवीनीकरण कार्य प्रारंभ</title>
            <link>https://bhopal-news.org/item/101</link>
            <guid>bhopal-guid-101</guid>
            <description>राजधानी के होशंगाबाद रोड पर बीआरटीएस लेन के सुदृढ़ीकरण हेतु नया टेंडर जारी।</description>
            <category>विकास</category>
            <category>भोपाल</category>
            <pubDate>Sun, 01 Nov 2026 06:00:00 GMT</pubDate>
          </item>
        </channel>
      </rss>`;

      const parsed = SafeXmlParser.parseFeed(sampleRss);
      assert.strictEqual(parsed.title, 'भोपाल विकास समाचार');
      assert.strictEqual(parsed.items.length, 1);
      assert.strictEqual(parsed.items[0].guid, 'bhopal-guid-101');
      assert.strictEqual(parsed.items[0].title, 'भोपाल बीआरटीएस कॉरिडोर का नवीनीकरण कार्य प्रारंभ');
      assert.strictEqual(parsed.items[0].categories.length, 2);
    });
  });

  // =========================================================================
  // 3. RSS Source Management & Lifecycle
  // =========================================================================

  describe('3. RSS Source Governance & Lifecycle', () => {
    it('seeds canonical MP news sources in active state', async () => {
      const { items, total } = await rssService.listSources();
      assert.strictEqual(total >= 4, true);

      const prd = items.find((s) => s.id === 'rss-src-mp-prd-001');
      assert.ok(prd);
      assert.strictEqual(prd.status, 'active');
      assert.strictEqual(prd.isAuthorized, true);
    });

    it('creates new source as pending_approval and unauthorized by default', async () => {
      const created = await rssService.createSource({
        name: 'ग्वालियर हेराल्ड वायर',
        feedUrl: 'https://gwalior-herald.org/feed.xml',
        publisherName: 'Gwalior Herald Press',
        sourceCategory: 'local',
        geographicCoverage: 'Gwalior Division',
      });

      assert.strictEqual(created.status, 'pending_approval');
      assert.strictEqual(created.isAuthorized, false);
      assert.ok(created.id);
    });

    it('admin approves source and transitions to active and authorized', async () => {
      const created = await rssService.createSource({
        name: 'जबलपुर न्यूज़ नेटवर्क',
        feedUrl: 'https://jabalpur-network.org/feed.xml',
        publisherName: 'Jabalpur Regional News',
      });

      const approved = await rssService.approveSource(created.id, 'usr-admin-super');
      assert.strictEqual(approved.status, 'active');
      assert.strictEqual(approved.isAuthorized, true);
      assert.strictEqual(approved.approvedById, 'usr-admin-super');
    });

    it('correctly pauses, disables, archives and re-enables a source', async () => {
      const source = await rssService.getSourceById('rss-src-mp-prd-001');
      assert.strictEqual(source.status, 'active');

      const paused = await rssService.pauseSource(source.id);
      assert.strictEqual(paused.status, 'paused');

      const disabled = await rssService.disableSource(source.id);
      assert.strictEqual(disabled.status, 'disabled');
      assert.strictEqual(disabled.isAuthorized, false);

      const archived = await rssService.archiveSource(source.id);
      assert.strictEqual(archived.status, 'archived');
      assert.strictEqual(archived.isAuthorized, false);

      const reEnabled = await rssService.reEnableSource(source.id);
      assert.strictEqual(reEnabled.status, 'active');
      assert.strictEqual(reEnabled.isAuthorized, true);
    });

    it('rejects duplicate feed URL during source creation', async () => {
      await assert.rejects(
        rssService.createSource({
          name: 'डुप्लिकेट जनसंपर्क फ़ीड',
          feedUrl: 'https://news.mpinfo.org/feed/rss2.xml',
          publisherName: 'DPR Duplicate',
        }),
        /पहले से पंजीकृत है/
      );
    });
  });

  // =========================================================================
  // 4. Non-Negotiable Source Deactivation Guarantee
  // =========================================================================

  describe('4. Non-Negotiable Deactivation Guarantees & In-Flight Protection', () => {
    it('allows fetching only currently ACTIVE and AUTHORIZED sources', async () => {
      const result = await rssService.fetchAndIngest('rss-src-mp-prd-001');
      assert.strictEqual(result.httpStatus, 200);
      assert.strictEqual(result.itemsDiscovered > 0, true);
      assert.strictEqual(result.newDraftsCreated > 0, true);
    });

    it('strictly forbids fetching a PAUSED source', async () => {
      await rssService.pauseSource('rss-src-mp-prd-001');

      await assert.rejects(
        rssService.fetchAndIngest('rss-src-mp-prd-001'),
        /की स्थिति "paused" है और यह अधिकृत नहीं है/
      );
    });

    it('strictly forbids fetching a DISABLED source', async () => {
      await rssService.disableSource('rss-src-mp-prd-001');

      await assert.rejects(
        rssService.fetchAndIngest('rss-src-mp-prd-001'),
        /की स्थिति "disabled" है और यह अधिकृत नहीं है/
      );
    });

    it('strictly forbids fetching an ARCHIVED source', async () => {
      await rssService.archiveSource('rss-src-mp-prd-001');

      await assert.rejects(
        rssService.fetchAndIngest('rss-src-mp-prd-001'),
        /की स्थिति "archived" है और यह अधिकृत नहीं है/
      );
    });

    it('strictly forbids fetching a PENDING approval source', async () => {
      await assert.rejects(
        rssService.fetchAndIngest('rss-src-mock-wire-004'),
        /की स्थिति "pending_approval" है और यह अधिकृत नहीं है/
      );
    });

    it('IN-FLIGHT PROTECTION: aborts draft creation if source deactivated mid-flight', async () => {
      const source = await rssService.getSourceById('rss-src-air-bhopal-002');
      assert.strictEqual(source.status, 'active');

      // Register synthetic XML fixture
      rssService.registerMockXmlFixture(
        source.feedUrl,
        `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>आकाशवाणी भोपाल फ़ीड</title>
            <item>
              <title>मध्य प्रदेश विधानसभा का विशेष सत्र आहूत</title>
              <link>https://newsonair.gov.in/item/99</link>
              <guid>air-guid-99</guid>
              <description>विधानसभा अध्यक्ष द्वारा अधिसूचना जारी।</description>
            </item>
          </channel>
        </rss>`
      );

      // Disable source right after initial read
      await rssService.disableSource(source.id);

      // Attempting to fetch must be immediately blocked
      await assert.rejects(
        rssService.fetchAndIngest(source.id),
        /सक्रिय व अधिकृत स्रोतों से आयात की अनुमति है/
      );
    });
  });

  // =========================================================================
  // 5. Deduplication & Story Clustering
  // =========================================================================

  describe('5. Deduplication & Cross-Source Story Clustering', () => {
    it('skips duplicate items cleanly on subsequent fetches', async () => {
      // First fetch
      const res1 = await rssService.fetchAndIngest('rss-src-air-bhopal-002');
      assert.strictEqual(res1.newDraftsCreated > 0, true);

      // Second fetch with same content
      const res2 = await rssService.fetchAndIngest('rss-src-air-bhopal-002');
      assert.strictEqual(res2.newDraftsCreated, 0);
      assert.strictEqual(res2.duplicatesSkipped > 0, true);
    });

    it('clusters related stories across sources into a single StoryCluster', async () => {
      await rssService.fetchAndIngest('rss-src-mp-prd-001');
      const clusters = await rssService.listStoryClusters();
      assert.strictEqual(Array.isArray(clusters), true);
      assert.strictEqual(clusters.length > 0, true);
      assert.ok(clusters[0].id);
      assert.ok(clusters[0].title);
    });

    it('preserves full source attribution on all imported items', async () => {
      await rssService.fetchAndIngest('rss-src-mp-prd-001');
      const { items } = await rssService.listImportedItems();
      assert.strictEqual(items.length > 0, true);
      for (const item of items) {
        assert.ok(item.sourceAttribution.length > 0);
        assert.ok(item.guidHash.length === 64);
        assert.ok(item.generatedNewsId);
      }
    });
  });

  // =========================================================================
  // 6. Newsroom Automation Engine
  // =========================================================================

  describe('6. Newsroom Automation Engine & Safety Controls', () => {
    it('seeds canonical newsroom automation rules', async () => {
      const rules = await autoService.listRules();
      assert.strictEqual(rules.length >= 4, true);

      const summaryRule = rules.find((r) => r.id === 'rule-auto-summary-001');
      assert.ok(summaryRule);
      assert.strictEqual(summaryRule.status, 'active');
      assert.strictEqual(summaryRule.trigger, 'rss_item_discovered');
    });

    it('dispatches automation event and executes configured action', async () => {
      const logs = await autoService.dispatchEvent('rss_item_discovered', 'rss-item-123', {
        hasContent: true,
        title: 'भोपाल मेट्रो परीक्षण',
      });

      assert.strictEqual(logs.length > 0, true);
      const successfulLog = logs.find((l) => l.status === 'success');
      assert.ok(successfulLog);
      assert.strictEqual(successfulLog.actionsExecuted.length > 0, true);
      assert.strictEqual(successfulLog.actionsExecuted[0].actionType, 'request_ai_summary');
    });

    it('LOOP PREVENTION: aborts execution when hopCount exceeds maxHops limit', async () => {
      const rule = await autoService.getRuleById('rule-auto-summary-001');
      const log = await autoService.executeRule(rule, {
        triggerType: 'rss_item_discovered',
        entityId: 'test-loop',
        entityData: { hasContent: true },
        hopCount: 5, // Exceeds maxHops (3)
      });

      assert.strictEqual(log.status, 'failed');
      assert.match(log.error!, /लूप रोकथाम सक्रिय/);
    });

    it('AUTONOMOUS PUBLISH GUARD: strictly forbids rules that attempt direct publication', async () => {
      await assert.rejects(
        autoService.createRule({
          name: 'अवैध सीधा प्रकाशन नियम',
          description: 'बिना संपादक समीक्षा के प्रकाशित करना',
          trigger: 'rss_item_discovered',
          actions: [
            { actionType: 'direct_publish' as any, params: {} },
          ],
        }),
        /सीधे समाचार प्रकाशित करना वर्जित है/
      );
    });

    it('allows toggling automation rule active and inactive', async () => {
      const rule = await autoService.getRuleById('rule-auto-summary-001');
      assert.strictEqual(rule.status, 'active');

      const toggled = await autoService.toggleRule(rule.id);
      assert.strictEqual(toggled.status, 'inactive');

      const toggledBack = await autoService.toggleRule(rule.id);
      assert.strictEqual(toggledBack.status, 'active');
    });
  });

  // =========================================================================
  // 7. Decision Governance (DEC-048 Invariant)
  // =========================================================================

  describe('7. Decision Governance & Invariant (DEC-048)', () => {
    it('DEC-048: rejects ROLE_CHIEF_EDITOR on RSS source creation', async () => {
      await assert.rejects(
        rssService.createSource(
          {
            name: 'अवैध स्रोत',
            feedUrl: 'https://example.com/feed.xml',
            publisherName: 'Publisher',
          },
          'usr-1',
          ['ROLE_CHIEF_EDITOR']
        ),
        /DEC-048/
      );
    });

    it('DEC-048: rejects chief_editor role on source approval', async () => {
      await assert.rejects(
        rssService.approveSource('rss-src-mp-prd-001', 'usr-1', ['chief_editor']),
        /DEC-048/
      );
    });

    it('DEC-048: rejects ROLE_CHIEF_EDITOR on automation rule creation', async () => {
      await assert.rejects(
        autoService.createRule(
          {
            name: 'मुख्य संपादक नियम',
            description: 'परीक्षण',
            trigger: 'rss_import_completed',
            actions: [{ actionType: 'suggest_category', params: {} }],
          },
          'usr-1',
          ['ROLE_CHIEF_EDITOR']
        ),
        /DEC-048/
      );
    });
  });
});

