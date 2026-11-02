/**
 * BREAKING NEWS WALA — AI Subsystem Master Test Suite
 * Task ID: BNW-MASTER-002
 * Grounded in docs/17-Agents.md, docs/18-MCP.md, docs/19-API-Pool.md, docs/21-Prompts.md, docs/DECISIONS.md
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  AiService,
  agentRegistry,
  providerRegistry,
  promptRegistry,
  promptCompiler,
  mcpRegistry,
  mcpToolExecutor,
  circuitBreakerRegistry,
  aiUsageTracker,
  InMemoryAiRepository,
  AGENT_IDS,
  PROVIDER_IDS,
  MODEL_IDS,
  MCP_TOOL_IDS,
  CAPABILITY_TIERS,
  ModelRouter,
  FallbackHandler,
  MockProviderAdapter,
  GeminiProviderAdapter,
  AnthropicProviderAdapter,
  OpenAiProviderAdapter,
  ProviderError,
} from '../../src/modules/ai';

describe('BNW-MASTER-002: AI Agent Fleet, MCP & Multi-Provider AI Infrastructure', () => {
  let aiService: AiService;
  let mockAdapter: MockProviderAdapter;
  let modelRouter: ModelRouter;
  let fallbackHandler: FallbackHandler;
  let repo: InMemoryAiRepository;

  beforeEach(() => {
    mockAdapter = new MockProviderAdapter();
    providerRegistry.register(mockAdapter);

    modelRouter = new ModelRouter(providerRegistry);
    modelRouter.setMockMode(true); // Deterministic test execution

    fallbackHandler = new FallbackHandler(providerRegistry, circuitBreakerRegistry);
    repo = new InMemoryAiRepository();

    aiService = new AiService(
      agentRegistry,
      providerRegistry,
      promptRegistry,
      promptCompiler,
      mcpRegistry,
      mcpToolExecutor,
      circuitBreakerRegistry,
      aiUsageTracker,
      repo
    );
  });

  // ==========================================================================
  // Suite 1: Canonical 14 AI Agent Registry & Taxonomies (docs/17-Agents.md)
  // ==========================================================================
  describe('Canonical 14 Agent Registry & Taxonomies', () => {
    it('should have all 14 canonical agents registered', () => {
      const agents = agentRegistry.getAll();
      assert.strictEqual(agents.length, 14, 'Must register exactly 14 specialized agents');

      const expectedIds = Object.values(AGENT_IDS);
      for (const id of expectedIds) {
        const found = agentRegistry.get(id);
        assert.ok(found, `Agent ${id} must be present in registry`);
        assert.ok(found.name.length > 0, `Agent ${id} must have an English name`);
        assert.ok(found.hindiName.length > 0, `Agent ${id} must have a Hindi name`);
        assert.ok(found.assignedTier, `Agent ${id} must have an assigned capability tier`);
        assert.ok(found.defaultModelId, `Agent ${id} must have a default model assigned`);
        assert.ok(found.version, `Agent ${id} must be versioned`);
      }
    });

    it('should assign correct capability tiers to canonical agents', () => {
      const newsWriting = agentRegistry.get(AGENT_IDS.NEWS_WRITING);
      assert.strictEqual(newsWriting?.assignedTier, CAPABILITY_TIERS.DEEP);

      const headlineGen = agentRegistry.get(AGENT_IDS.HEADLINE_GENERATION);
      assert.strictEqual(headlineGen?.assignedTier, CAPABILITY_TIERS.FAST);

      const dupDetection = agentRegistry.get(AGENT_IDS.DUPLICATE_DETECTION);
      assert.strictEqual(dupDetection?.assignedTier, CAPABILITY_TIERS.EMBEDDING);
    });

    it('should support enabling and disabling agent status', () => {
      const caller = { id: 'admin_1', role: 'admin' };
      const updated = aiService.updateAgentStatus(AGENT_IDS.NEWS_WRITING, 'disabled', caller);
      assert.strictEqual(updated.status, 'disabled');

      // Re-enable for subsequent tests
      aiService.updateAgentStatus(AGENT_IDS.NEWS_WRITING, 'active', caller);
    });
  });

  // ==========================================================================
  // Suite 2: Provider Adapters & Health (docs/19-API-Pool.md)
  // ==========================================================================
  describe('Multi-Provider Adapters & Health', () => {
    it('should instantiate Gemini, Anthropic, OpenAI and Mock adapters', () => {
      const gemini = providerRegistry.get(PROVIDER_IDS.GEMINI);
      assert.ok(gemini instanceof GeminiProviderAdapter);
      assert.strictEqual(gemini.providerId, PROVIDER_IDS.GEMINI);

      const anthropic = providerRegistry.get(PROVIDER_IDS.ANTHROPIC);
      assert.ok(anthropic instanceof AnthropicProviderAdapter);
      assert.strictEqual(anthropic.providerId, PROVIDER_IDS.ANTHROPIC);

      const openai = providerRegistry.get(PROVIDER_IDS.OPENAI);
      assert.ok(openai instanceof OpenAiProviderAdapter);
      assert.strictEqual(openai.providerId, PROVIDER_IDS.OPENAI);

      const mock = providerRegistry.get(PROVIDER_IDS.MOCK);
      assert.ok(mock instanceof MockProviderAdapter);
      assert.strictEqual(mock.isConfigured(), true);
    });

    it('should report standby status when commercial API keys are absent', async () => {
      const unconfiguredGemini = new GeminiProviderAdapter('');
      assert.strictEqual(unconfiguredGemini.isConfigured(), false);
      const health = await unconfiguredGemini.getHealth();
      assert.strictEqual(health, 'standby');
    });

    it('mock adapter should execute and generate deterministic structured output with token counts', async () => {
      const res = await mockAdapter.execute({
        modelIdentifier: MODEL_IDS.MOCK_MODEL,
        systemPrompt: 'System directive',
        userPrompt: 'मध्यप्रदेश समाचार विश्लेषण',
        responseFormat: 'json',
      });

      assert.strictEqual(res.providerId, PROVIDER_IDS.MOCK);
      assert.ok(res.totalTokens > 0);
      assert.ok(res.durationMs >= 0);
      assert.ok(res.structuredData);
    });
  });

  // ==========================================================================
  // Suite 3: Model Routing, Circuit Breakers & Bounded Fallback (DEC-050, DEC-051)
  // ==========================================================================
  describe('Routing, Circuit Breakers & Bounded Fallback', () => {
    it('should route Fast tier to Fast models and Deep tier to Deep models', () => {
      const router = new ModelRouter(providerRegistry);
      router.setMockMode(false);

      const fastPolicy = router.getPolicy(CAPABILITY_TIERS.FAST);
      assert.strictEqual(fastPolicy.primaryModel, MODEL_IDS.GEMINI_FLASH);

      const deepPolicy = router.getPolicy(CAPABILITY_TIERS.DEEP);
      assert.strictEqual(deepPolicy.primaryModel, MODEL_IDS.GEMINI_PRO);
    });

    it('circuit breaker should transition CLOSED -> OPEN on repeated failures', () => {
      const cb = new (circuitBreakerRegistry.constructor as any)(2, 1000);
      const testProvider = 'PRV-TEST-FAIL' as any;

      assert.strictEqual(cb.canExecute(testProvider), true);
      cb.recordFailure(testProvider);
      assert.strictEqual(cb.canExecute(testProvider), true);

      cb.recordFailure(testProvider); // Reaches threshold 2
      assert.strictEqual(cb.canExecute(testProvider), false); // Trips OPEN
    });

    it('fallback handler should transparently fail over when primary provider throws retryable error', async () => {
      // Configure mock adapter to fail once with rate limit (429)
      mockAdapter.setSimulatedFailure('rate_limit', 1);

      // Chain has Primary (failing mock) and Secondary (working mock with reset)
      const chain = [
        { provider: PROVIDER_IDS.MOCK, model: MODEL_IDS.GEMINI_FLASH },
        { provider: PROVIDER_IDS.MOCK, model: MODEL_IDS.MOCK_MODEL },
      ];

      const result = await fallbackHandler.executeWithFallback(chain, {
        modelIdentifier: MODEL_IDS.MOCK_MODEL,
        systemPrompt: 'Test system',
        userPrompt: 'Test user',
      });

      assert.ok(result.response);
      assert.strictEqual(result.fallbackOccurred, true);
      assert.strictEqual(result.attemptedProviders.length, 2);
    });

    it('fallback handler should NOT fall back on non-retryable 401 authentication errors', async () => {
      mockAdapter.setSimulatedFailure('auth_error', 1);

      const chain = [
        { provider: PROVIDER_IDS.MOCK, model: MODEL_IDS.GEMINI_FLASH },
        { provider: PROVIDER_IDS.MOCK, model: MODEL_IDS.MOCK_MODEL },
      ];

      await assert.rejects(
        async () => {
          await fallbackHandler.executeWithFallback(chain, {
            modelIdentifier: MODEL_IDS.MOCK_MODEL,
            systemPrompt: 'Test',
            userPrompt: 'Test',
          });
        },
        (err: unknown) => {
          assert.ok(err instanceof ProviderError);
          assert.strictEqual(err.isRetryable, false);
          assert.strictEqual(err.statusCode, 401);
          return true;
        }
      );
    });
  });

  // ==========================================================================
  // Suite 4: 8-Layer Prompt Compilation & Prompt Registry (DEC-052)
  // ==========================================================================
  describe('8-Layer Prompt Compiler & Prompt Library', () => {
    it('prompt compiler should assemble all 8 hierarchical layers', () => {
      const compiled = promptCompiler.compile({
        agentName: 'Headline Generator',
        agentHindiName: 'शीर्षक एजेंट',
        agentPersona: 'Generate objective catchphrases.',
        taskTemplate: 'Generate 2 headlines for the news story.',
        sourceData: 'भोपाल में मेट्रो का ट्रायल रन सफल रहा।',
        runtimeVariables: { district: 'भोपाल', category: 'विकास' },
        outputSchemaDirectives: 'Output pure JSON format.',
      });

      // Verify presence of all layers
      assert.ok(compiled.systemPrompt.includes('### L1: GLOBAL PLATFORM IDENTITY'));
      assert.ok(compiled.systemPrompt.includes('### L2: SECURITY & PROMPT-INJECTION GUARDRAILS'));
      assert.ok(compiled.systemPrompt.includes('### L3: EDITORIAL STANDARDS'));
      assert.ok(compiled.systemPrompt.includes('### L4: AGENT PERSONA'));
      assert.ok(compiled.userPrompt.includes('### L5: TASK INSTRUCTIONS'));
      assert.ok(compiled.userPrompt.includes('<untrusted_content>'));
      assert.ok(compiled.userPrompt.includes('### L7: RUNTIME CONTEXT VARIABLES'));
      assert.ok(compiled.userPrompt.includes('### L8: OUTPUT DIRECTIVES'));
      assert.strictEqual(compiled.layerProvenance.length, 8);
    });

    it('prompt registry should support version rollback', () => {
      const template = promptRegistry.get('PRM-HDL-002');
      assert.ok(template);
      const originalVersion = template.currentVersion;

      // Add version 1.1.0
      promptRegistry.addVersion('PRM-HDL-002', {
        version: '1.1.0',
        templateText: 'Updated template text',
        systemDirective: 'Updated directive',
        safetyGuardrails: ['Anti-clickbait'],
        inputVariables: ['articleBody'],
        outputSchema: {},
        changelog: 'Added extra safety rule',
        createdBy: 'test_admin',
        createdAt: new Date().toISOString(),
        isActive: true,
      });

      assert.strictEqual(promptRegistry.get('PRM-HDL-002')?.currentVersion, '1.1.0');

      // Rollback to originalVersion
      promptRegistry.rollbackToVersion('PRM-HDL-002', originalVersion);
      assert.strictEqual(promptRegistry.get('PRM-HDL-002')?.currentVersion, originalVersion);
    });
  });

  // ==========================================================================
  // Suite 5: MCP (Model Context Protocol) Security & Tool Broker (DEC-053)
  // ==========================================================================
  describe('Model Context Protocol (MCP) Tools & Security', () => {
    it('should execute archive search tool for authorized role and agent', async () => {
      const result = await mcpToolExecutor.executeTool({
        toolId: MCP_TOOL_IDS.ARCHIVE_SEARCH,
        agentId: AGENT_IDS.RESEARCH_FACT_CHECK,
        callerId: 'editor_1',
        callerRole: 'editor',
        parameters: { query: 'कृषि' },
        executionId: 'exec_test_mcp_1',
      });

      assert.strictEqual(result.status, 'success');
      assert.ok(result.data?.articles);
    });

    it('should reject tool execution if caller role is not authorized', async () => {
      await assert.rejects(
        async () => {
          await mcpToolExecutor.executeTool({
            toolId: MCP_TOOL_IDS.AUDIT_QUERY, // Admin/Super Admin only!
            agentId: AGENT_IDS.ANALYTICS_ASSISTANT,
            callerId: 'reporter_1',
            callerRole: 'reporter', // Unauthorized!
            parameters: { entityId: 'art_123' },
            executionId: 'exec_test_mcp_2',
          });
        },
        (err: unknown) => {
          assert.strictEqual((err as any).statusCode, 403);
          return true;
        }
      );
    });

    it('should reject tool execution if agent is not in allowedAgents allowlist', async () => {
      await assert.rejects(
        async () => {
          await mcpToolExecutor.executeTool({
            toolId: MCP_TOOL_IDS.WIRE_INSPECT,
            agentId: AGENT_IDS.NOTIFICATION_CONTENT, // Notification agent cannot inspect raw wires
            callerId: 'editor_1',
            callerRole: 'editor',
            parameters: { guid: 'wire_999' },
            executionId: 'exec_test_mcp_3',
          });
        },
        (err: unknown) => {
          assert.strictEqual((err as any).statusCode, 403);
          return true;
        }
      );
    });

    it('should fail schema validation if required tool parameter is missing', async () => {
      await assert.rejects(
        async () => {
          await mcpToolExecutor.executeTool({
            toolId: MCP_TOOL_IDS.ARCHIVE_SEARCH,
            agentId: AGENT_IDS.RESEARCH_FACT_CHECK,
            callerId: 'editor_1',
            callerRole: 'editor',
            parameters: {}, // Missing required 'query'
            executionId: 'exec_test_mcp_4',
          });
        },
        (err: unknown) => {
          assert.strictEqual((err as any).statusCode, 422);
          return true;
        }
      );
    });
  });

  // ==========================================================================
  // Suite 6: Newsroom Editorial AI Assistance (Central Newsroom Integration)
  // ==========================================================================
  describe('Newsroom Editorial AI Assistance Capabilities', () => {
    it('suggestHeadlines should return informative Devanagari headline options', async () => {
      const caller = { id: 'rep_1', role: 'reporter' };
      const res = await aiService.suggestHeadlines(
        {
          articleBody: 'मध्यप्रदेश सरकार ने किसानों के लिए आधुनिक सिंचाई प्रणाली की घोषणा की है।',
          category: 'कृषि',
          district: 'भोपाल',
        },
        caller
      );

      assert.ok(res.options.length >= 1);
      assert.ok(res.options[0]?.headline.length > 0);
      assert.strictEqual(res.isFactPreserved, true);
    });

    it('structureArticle should structure raw field notes into inverted pyramid format', async () => {
      const caller = { id: 'rep_1', role: 'reporter' };
      const res = await aiService.structureArticle(
        {
          rawNotes: 'भोपाल बैठक आज हुई, मुख्यमंत्री ने अधिकारियों को सख्त निर्देश दिए, काम समय पर हो।',
          category: 'प्रशासन',
          district: 'भोपाल',
        },
        caller
      );

      assert.ok(res.suggestedHeadline.length > 0);
      assert.ok(res.leadStandfirst.length > 0);
      assert.ok(res.bodyParagraphs.length >= 1);
    });

    it('assistFactCheck should identify claims and strictly declare isAutomatedApproval: false', async () => {
      const caller = { id: 'edt_1', role: 'editor' };
      const res = await aiService.assistFactCheck(
        {
          articleTitle: 'सड़क निर्माण में अनियमितताओं का आरोप',
          articleBody: 'स्थानीय नागरिकों का आरोप है कि ठेकेदार ने घटिया सामग्री का उपयोग किया है।',
          sourcesClaimed: ['स्थानीय नागरिक'],
          district: 'इंदौर',
        },
        caller
      );

      assert.ok(res.claimsIdentified.length >= 1);
      assert.strictEqual(res.isAutomatedApproval, false, 'AI must never independently approve news!');
      assert.ok(res.humanReviewChecklist.length > 0);
    });

    it('summarizeOrTranslate should generate vernacular summary', async () => {
      const caller = { id: 'edt_1', role: 'editor' };
      const res = await aiService.summarizeOrTranslate(
        {
          text: 'The state cabinet today approved several major urban infrastructure projects across Madhya Pradesh.',
          mode: 'en_to_hi',
        },
        caller
      );

      assert.ok(res.resultText.length > 0);
      assert.ok(res.wordCount > 0);
    });

    it('suggestCategorization should classify news text into approved taxonomy', async () => {
      const caller = { id: 'rep_1', role: 'reporter' };
      const res = await aiService.suggestCategorization(
        {
          title: 'भोपाल में नई मेट्रो लाइन का विस्तार',
          body: 'मेट्रो रेल कॉर्पोरेशन ने नए स्टेशनों की सूची जारी की है।',
        },
        caller
      );

      assert.ok(res.suggestedCategory.length > 0);
      assert.ok(res.confidenceScore > 0);
    });
  });

  // ==========================================================================
  // Suite 7: Role Governance & DEC-048 Invariant Protection
  // ==========================================================================
  describe('Role Governance & Invariant Preservation', () => {
    it('DEC-048: ROLE_CHIEF_EDITOR must be blocked and rejected from AI operations', async () => {
      const chiefCaller = { id: 'usr_chief', role: 'ROLE_CHIEF_EDITOR' };

      await assert.rejects(
        async () => {
          await aiService.suggestHeadlines(
            { articleBody: 'समाचार आलेख की समीक्षा हेतु परीक्षण सामग्री' },
            chiefCaller
          );
        },
        (err: unknown) => {
          assert.strictEqual((err as any).statusCode, 403);
          assert.ok(
            (err as any).message.includes('DEC-048'),
            'Must cite DEC-048 Pending Approval status'
          );
          return true;
        }
      );
    });

    it('citizens and regular readers must be denied access to editorial AI tools', async () => {
      const citizenCaller = { id: 'cit_1', role: 'citizen' };

      await assert.rejects(
        async () => {
          await aiService.suggestHeadlines(
            { articleBody: 'समाचार आलेख की समीक्षा हेतु परीक्षण सामग्री' },
            citizenCaller
          );
        },
        (err: unknown) => {
          assert.strictEqual((err as any).statusCode, 403);
          return true;
        }
      );
    });

    it('non-admin roles must be denied access to Admin AI management endpoints', async () => {
      const editorCaller = { id: 'edt_1', role: 'editor' };

      await assert.rejects(
        async () => {
          await aiService.getDashboardStats(editorCaller);
        },
        (err: unknown) => {
          assert.strictEqual((err as any).statusCode, 403);
          return true;
        }
      );
    });
  });

  // ==========================================================================
  // Suite 8: Admin AI Management & Secret Masking (Admin Control Panel)
  // ==========================================================================
  describe('Admin AI Management & Secret Masking', () => {
    it('getDashboardStats should return complete real operational metrics', async () => {
      const adminCaller = { id: 'admin_1', role: 'admin' };
      const stats = await aiService.getDashboardStats(adminCaller);

      assert.strictEqual(stats.registeredAgentsCount, 14);
      assert.ok(stats.activeAgentsCount > 0);
      assert.ok(stats.configuredProvidersCount >= 1);
      assert.ok(Array.isArray(stats.recentExecutions));
    });

    it('getKeyReferences should strictly mask credentials without leaking full API keys', () => {
      const adminCaller = { id: 'admin_1', role: 'admin' };
      const keys = aiService.getKeyReferences(adminCaller);

      assert.ok(keys.length >= 3);
      for (const k of keys) {
        assert.ok(k.maskedKey.includes('...'), 'Key must be masked with ellipsis');
        assert.ok(!k.maskedKey.startsWith('AIzaSy') || k.maskedKey.length <= 15);
      }
    });
  });
});

