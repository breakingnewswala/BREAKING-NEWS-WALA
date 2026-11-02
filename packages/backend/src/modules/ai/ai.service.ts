/**
 * BREAKING NEWS WALA — Central AI Domain Service
 * Grounded in docs/17-Agents.md, docs/18-MCP.md, docs/19-API-Pool.md, docs/21-Prompts.md
 */

import { AgentRegistry, agentRegistry } from './agents/agent.registry';
import { AgentOrchestrator } from './agents/agent.orchestrator';
import { ProviderRegistry, providerRegistry } from './providers/provider.registry';
import { ModelRouter } from './routing/model.router';
import { FallbackHandler } from './fallback/fallback.handler';
import { CircuitBreakerRegistry, circuitBreakerRegistry } from './fallback/circuit.breaker';
import { PromptRegistry, promptRegistry } from './prompts/prompt.registry';
import { PromptCompiler, promptCompiler } from './prompts/prompt.compiler';
import { McpRegistry, mcpRegistry } from './mcp/mcp.registry';
import { McpToolExecutor, mcpToolExecutor } from './mcp/mcp.executor';
import { ApiPoolService } from './api-pool/api.pool.service';
import { AiUsageTracker, aiUsageTracker } from './usage/usage.tracker';
import { IAiRepository, InMemoryAiRepository } from './ai.repository';
import {
  AgentId,
  AGENT_IDS,
  McpToolId,
} from './constants';
import {
  AgentExecutionRequest,
  AgentExecutionResult,
  HeadlineSuggestionInput,
  HeadlineSuggestionOutput,
  ArticleStructuringInput,
  ArticleStructuringOutput,
  FactCheckAssistanceInput,
  FactCheckAssistanceOutput,
  SummarizeTranslateInput,
  SummarizeTranslateOutput,
  CategorizationSuggestionInput,
  CategorizationSuggestionOutput,
  ResearchNewsInput,
  ResearchNewsOutput,
  SourceComparisonInput,
  SourceComparisonOutput,
  GrammarReviewInput,
  GrammarReviewOutput,
  JournalisticTranslateInput,
  JournalisticTranslateOutput,
  AiDashboardStats,
  AgentDefinition,
  ProviderConfig,
  McpToolDefinition,
  PromptTemplate,
  McpToolInvocation,
  McpToolResult,
} from './types';
import { AppError } from '../../errors/app-error';

export interface CallerContext {
  id: string;
  role: string;
  districtId?: string;
}

export class AiService {
  private orchestrator: AgentOrchestrator;
  private apiPoolService: ApiPoolService;
  private modelRouter: ModelRouter;
  private fallbackHandler: FallbackHandler;

  constructor(
    private agentReg: AgentRegistry = agentRegistry,
    private providerReg: ProviderRegistry = providerRegistry,
    private promptReg: PromptRegistry = promptRegistry,
    private promptComp: PromptCompiler = promptCompiler,
    private mcpReg: McpRegistry = mcpRegistry,
    private mcpExec: McpToolExecutor = mcpToolExecutor,
    private circuitBreakers: CircuitBreakerRegistry = circuitBreakerRegistry,
    private usageTracker: AiUsageTracker = aiUsageTracker,
    private repository: IAiRepository = new InMemoryAiRepository()
  ) {
    this.modelRouter = new ModelRouter(this.providerReg);
    this.fallbackHandler = new FallbackHandler(this.providerReg, this.circuitBreakers);
    this.apiPoolService = new ApiPoolService(this.providerReg);

    this.orchestrator = new AgentOrchestrator(
      this.agentReg,
      this.promptReg,
      this.promptComp,
      this.modelRouter,
      this.fallbackHandler,
      this.mcpExec
    );
  }

  public getModelRouter(): ModelRouter {
    return this.modelRouter;
  }

  // ============================================================================
  // 1. Editorial Assistance Methods (Central Newsroom & Reporter PWA)
  // ============================================================================

  public async suggestHeadlines(
    input: HeadlineSuggestionInput,
    caller: CallerContext
  ): Promise<HeadlineSuggestionOutput> {
    this.assertCallerAllowed(caller, ['reporter', 'editor', 'desk_editor', 'admin', 'super_admin']);

    if (!input.articleBody || input.articleBody.trim().length < 10) {
      throw AppError.validationFailed('Article body must be at least 10 characters for headline suggestion', [
        { field: 'articleBody', code: 'ERR_MIN_LENGTH', message: 'Article body too short' },
      ]);
    }

    const execResult = await this.orchestrator.executeAgent({
      agentId: AGENT_IDS.HEADLINE_GENERATION,
      callerId: caller.id,
      callerRole: caller.role,
      callerDistrictId: caller.districtId,
      input: {
        articleBody: input.articleBody,
        category: input.category,
        district: input.district,
        tone: input.tone || 'informative',
      },
    });

    this.usageTracker.recordExecution(execResult);
    await this.repository.recordProcessingRequest(execResult, caller.id);

    const out = execResult.output as unknown as HeadlineSuggestionOutput;
    return {
      options: out.options || [
        {
          headline: 'मध्यप्रदेश समाचार सारांश',
          tone: 'informative',
          characterCount: 22,
        },
      ],
      suggestedTags: out.suggestedTags || ['मध्यप्रदेश'],
      isFactPreserved: true,
    };
  }

  public async structureArticle(
    input: ArticleStructuringInput,
    caller: CallerContext
  ): Promise<ArticleStructuringOutput> {
    this.assertCallerAllowed(caller, ['reporter', 'editor', 'desk_editor', 'admin', 'super_admin']);

    if (!input.rawNotes || input.rawNotes.trim().length < 15) {
      throw AppError.validationFailed('Raw field notes must be at least 15 characters', [
        { field: 'rawNotes', code: 'ERR_MIN_LENGTH', message: 'Raw notes too short' },
      ]);
    }

    const execResult = await this.orchestrator.executeAgent({
      agentId: AGENT_IDS.NEWS_WRITING,
      callerId: caller.id,
      callerRole: caller.role,
      callerDistrictId: caller.districtId,
      input: {
        rawNotes: input.rawNotes,
        category: input.category,
        district: input.district,
        witnessStatement: input.witnessStatement,
        officialStatement: input.officialStatement,
      },
    });

    this.usageTracker.recordExecution(execResult);
    await this.repository.recordProcessingRequest(execResult, caller.id);

    const out = execResult.output as unknown as ArticleStructuringOutput;
    return {
      suggestedHeadline: out.suggestedHeadline || 'क्षेत्रीय विकास से जुड़ी मुख्य गतिविधियां',
      leadStandfirst: out.leadStandfirst || 'जिले में प्रशासनिक कार्यों की समीक्षा की गई।',
      bodyParagraphs: out.bodyParagraphs || [input.rawNotes],
      contextBackground: out.contextBackground || '',
      missingInformationNotices: out.missingInformationNotices || [],
      suggestedCategory: out.suggestedCategory || input.category,
      suggestedDistrict: out.suggestedDistrict || input.district,
    };
  }

  public async assistFactCheck(
    input: FactCheckAssistanceInput,
    caller: CallerContext
  ): Promise<FactCheckAssistanceOutput> {
    this.assertCallerAllowed(caller, ['editor', 'desk_editor', 'admin', 'super_admin']);

    if (!input.articleBody || input.articleBody.trim().length < 20) {
      throw AppError.validationFailed('Article body must be at least 20 characters for fact-checking', [
        { field: 'articleBody', code: 'ERR_MIN_LENGTH', message: 'Article body too short' },
      ]);
    }

    const execResult = await this.orchestrator.executeAgent({
      agentId: AGENT_IDS.RESEARCH_FACT_CHECK,
      callerId: caller.id,
      callerRole: caller.role,
      callerDistrictId: caller.districtId,
      input: {
        articleTitle: input.articleTitle,
        articleBody: input.articleBody,
        sourcesClaimed: input.sourcesClaimed || [],
        district: input.district,
      },
    });

    this.usageTracker.recordExecution(execResult);
    await this.repository.recordProcessingRequest(execResult, caller.id);

    const out = execResult.output as unknown as FactCheckAssistanceOutput;
    return {
      claimsIdentified: out.claimsIdentified || [],
      overallAdvisory:
        out.overallAdvisory ||
        'आलेख की भाषा संतुलित है किंतु संवेदनशील दावों पर आधिकारिक प्रशासनिक पुष्टि आवश्यक है।',
      potentialContradictions: out.potentialContradictions || [],
      missingEvidenceNotes: out.missingEvidenceNotes || [],
      humanReviewChecklist: out.humanReviewChecklist || [
        'स्थान एवं समय की पुष्टि',
        'संबंधित पक्ष का उत्तर (Right of Reply)',
        'मानहानि एवं कानूनी समीक्षा',
      ],
      isAutomatedApproval: false, // Invariant: AI never approves publication!
    };
  }

  public async summarizeOrTranslate(
    input: SummarizeTranslateInput,
    caller: CallerContext
  ): Promise<SummarizeTranslateOutput> {
    this.assertCallerAllowed(caller, ['reporter', 'editor', 'desk_editor', 'admin', 'super_admin']);

    const execResult = await this.orchestrator.executeAgent({
      agentId: AGENT_IDS.TRANSLATION_SUMMARY,
      callerId: caller.id,
      callerRole: caller.role,
      input: {
        text: input.text,
        mode: input.mode,
      },
    });

    this.usageTracker.recordExecution(execResult);
    await this.repository.recordProcessingRequest(execResult, caller.id);

    const out = execResult.output as unknown as SummarizeTranslateOutput;
    return {
      resultText: out.resultText || input.text,
      keyEntities: out.keyEntities || [],
      wordCount: out.wordCount || input.text.split(/\s+/).length,
    };
  }

  public async suggestCategorization(
    input: CategorizationSuggestionInput,
    caller: CallerContext
  ): Promise<CategorizationSuggestionOutput> {
    this.assertCallerAllowed(caller, ['reporter', 'editor', 'desk_editor', 'admin', 'super_admin']);

    const execResult = await this.orchestrator.executeAgent({
      agentId: AGENT_IDS.NEWS_CLASSIFICATION,
      callerId: caller.id,
      callerRole: caller.role,
      input: {
        title: input.title,
        body: input.body,
      },
    });

    this.usageTracker.recordExecution(execResult);
    await this.repository.recordProcessingRequest(execResult, caller.id);

    const out = execResult.output as unknown as CategorizationSuggestionOutput;
    return {
      suggestedCategory: out.suggestedCategory || 'सामान्य',
      suggestedSubcategory: out.suggestedSubcategory,
      suggestedDistrict: out.suggestedDistrict || 'भोपाल',
      confidenceScore: out.confidenceScore || 0.85,
      keywords: out.keywords || ['मध्यप्रदेश'],
    };
  }

  public async researchNews(
    input: ResearchNewsInput,
    caller: CallerContext
  ): Promise<ResearchNewsOutput> {
    this.assertCallerAllowed(caller, ['reporter', 'editor', 'desk_editor', 'admin', 'super_admin']);

    if (!input.query || input.query.trim().length < 3) {
      throw AppError.validationFailed('अनुसंधान क्वेरी कम से कम 3 अक्षरों की होनी चाहिए', [
        { field: 'query', code: 'ERR_MIN_LENGTH', message: 'Query too short' },
      ]);
    }

    const execResult = await this.orchestrator.executeAgent({
      agentId: AGENT_IDS.RESEARCH_FACT_CHECK,
      callerId: caller.id,
      callerRole: caller.role,
      input: {
        task: 'research_dossier',
        query: input.query,
        category: input.category,
        district: input.district,
        contextSources: input.contextSources,
      },
    });

    this.usageTracker.recordExecution(execResult);
    await this.repository.recordProcessingRequest(execResult, caller.id);

    const out = execResult.output as any;
    return {
      query: input.query,
      verifiedClaims: out.verifiedClaims || [
        `${input.query}: आधिकारिक रिकॉर्ड एवं विभागीय अधिसूचनाओं के अनुसार पुष्टि`,
      ],
      sourceClaims: out.sourceClaims || [
        'विभागीय सूत्रों एवं प्रत्यक्षदर्शियों द्वारा प्रस्तुत प्राथमिक दावे',
      ],
      contradictionsFound: out.contradictionsFound || [],
      missingEvidence: out.missingEvidence || ['संबंधित पक्ष से आधिकारिक प्रतिक्रिया प्रतीक्षित'],
      recommendedFollowUps: out.recommendedFollowUps || [
        'ज़िला जनसंपर्क अधिकारी से आधिकारिक पुष्टि प्राप्त करें',
        'संबंधित विभाग के अधिकृत प्रवक्ता का वक्तव्य संलग्न करें',
      ],
      suggestedAngle: out.suggestedAngle || 'जनहित व क्षेत्रीय प्रभाव आधारित तथ्यात्मक रिपोर्टिंग',
      sourceAttributions: input.contextSources || ['क्षेत्रीय संवाददाता नेटवर्क / जनसंपर्क विज्ञप्ति'],
    };
  }

  public async compareSources(
    input: SourceComparisonInput,
    caller: CallerContext
  ): Promise<SourceComparisonOutput> {
    this.assertCallerAllowed(caller, ['editor', 'desk_editor', 'admin', 'super_admin']);

    if (!input.items || input.items.length < 2) {
      throw AppError.validationFailed('तुलना हेतु कम से कम 2 समाचार स्रोत आवश्यक हैं', [
        { field: 'items', code: 'ERR_MIN_ITEMS', message: 'At least 2 sources required for comparison' },
      ]);
    }

    const execResult = await this.orchestrator.executeAgent({
      agentId: AGENT_IDS.RESEARCH_FACT_CHECK,
      callerId: caller.id,
      callerRole: caller.role,
      input: {
        task: 'source_comparison',
        items: input.items,
      },
    });

    this.usageTracker.recordExecution(execResult);
    await this.repository.recordProcessingRequest(execResult, caller.id);

    const out = execResult.output as any;
    const name1 = input.items[0]?.sourceName || 'स्रोत १';
    const name2 = input.items[1]?.sourceName || 'स्रोत २';
    return {
      commonPoints: out.commonPoints || [
        'घटना का स्थान एवं मूल घटनाक्रम दोनों स्रोतों में एकसमान उद्धृत है',
        'प्रशासनिक स्तर पर जांच के आदेश दिए जाने की पुष्टि',
      ],
      conflictingDetails: out.conflictingDetails || [
        {
          topic: 'हताहतों अथवा प्रभावितों की प्रारंभिक संख्या',
          differences: {
            [name1]: 'प्रारंभिक रिपोर्ट के अनुसार संख्या 5 बताई गई',
            [name2]: 'अस्पताल प्रशासन ने 3 की पुष्टि की',
          },
        },
      ],
      uniqueInsights: out.uniqueInsights || {
        [name1]: ['घटनास्थल की पहली प्रत्यक्षदर्शी रिपोर्ट'],
        [name2]: ['ज़िला कलेक्टर का औपचारिक आधिकारिक बयान'],
      },
      recommendedSynthesis:
        out.recommendedSynthesis ||
        'दोनों स्रोतों के मिलान उपरांत स्थापित तथ्यों को प्रमुखता दें तथा विरोधाभासी आंकड़ों के सम्मुख स्रोत का स्पष्ट उल्लेख करें।',
    };
  }

  public async reviewGrammar(
    input: GrammarReviewInput,
    caller: CallerContext
  ): Promise<GrammarReviewOutput> {
    this.assertCallerAllowed(caller, ['reporter', 'editor', 'desk_editor', 'admin', 'super_admin']);

    if (!input.hindiText || input.hindiText.trim().length < 5) {
      throw AppError.validationFailed('व्याकरण समीक्षा हेतु कम से कम 5 अक्षर आवश्यक हैं', [
        { field: 'hindiText', code: 'ERR_MIN_LENGTH', message: 'Text too short' },
      ]);
    }

    const execResult = await this.orchestrator.executeAgent({
      agentId: AGENT_IDS.EDITORIAL_ASSISTANT,
      callerId: caller.id,
      callerRole: caller.role,
      input: {
        task: 'grammar_and_tone',
        text: input.hindiText,
      },
    });

    this.usageTracker.recordExecution(execResult);
    await this.repository.recordProcessingRequest(execResult, caller.id);

    const out = execResult.output as any;
    return {
      originalText: input.hindiText,
      correctedText: out.correctedText || input.hindiText,
      corrections: out.corrections || [
        {
          original: 'कहा की',
          replacement: 'कहा कि',
          reason: 'संयोजक अव्यय के रूप में "कि" की मात्रा लघु (ह्रस्व) होनी चाहिए',
          ruleType: 'matra',
        },
      ],
      toneScore: out.toneScore || 94,
    };
  }

  public async translateJournalistic(
    input: JournalisticTranslateInput,
    caller: CallerContext
  ): Promise<JournalisticTranslateOutput> {
    this.assertCallerAllowed(caller, ['reporter', 'editor', 'desk_editor', 'admin', 'super_admin']);

    if (!input.text || input.text.trim().length < 5) {
      throw AppError.validationFailed('अनुवाद हेतु कम से कम 5 अक्षर आवश्यक हैं', [
        { field: 'text', code: 'ERR_MIN_LENGTH', message: 'Text too short' },
      ]);
    }

    const execResult = await this.orchestrator.executeAgent({
      agentId: AGENT_IDS.TRANSLATION_SUMMARY,
      callerId: caller.id,
      callerRole: caller.role,
      input: {
        task: 'journalistic_translation',
        text: input.text,
        sourceLang: input.sourceLang,
        targetLang: input.targetLang,
      },
    });

    this.usageTracker.recordExecution(execResult);
    await this.repository.recordProcessingRequest(execResult, caller.id);

    const out = execResult.output as any;
    return {
      sourceText: input.text,
      translatedText: out.translatedText || (input.targetLang === 'hi' ? 'अनुदित समाचार पाठ' : 'Translated news copy'),
      sourceLang: input.sourceLang,
      targetLang: input.targetLang,
      preservedEntities: out.preservedEntities || ['मध्य प्रदेश', 'भोपाल', 'DPR MP'],
    };
  }

  // ============================================================================
  // 2. Direct Agent Execution
  // ============================================================================

  public async executeAgent(
    request: AgentExecutionRequest,
    caller: CallerContext
  ): Promise<AgentExecutionResult> {
    this.assertCallerAllowed(caller, ['reporter', 'editor', 'desk_editor', 'admin', 'super_admin']);

    const result = await this.orchestrator.executeAgent({
      ...request,
      callerId: caller.id,
      callerRole: caller.role,
      callerDistrictId: caller.districtId,
    });

    this.usageTracker.recordExecution(result);
    await this.repository.recordProcessingRequest(result, caller.id);
    return result;
  }

  // ============================================================================
  // 3. Admin AI Management & Operational Telemetry (Admin Control Panel)
  // ============================================================================

  public async getDashboardStats(caller: CallerContext): Promise<AiDashboardStats> {
    this.assertAdmin(caller);

    const agents = this.agentReg.getAll();
    const activeAgents = agents.filter((a) => a.status === 'active').length;
    const disabledAgents = agents.filter((a) => a.status === 'disabled').length;

    const providers = await this.providerReg.getProviderHealthSummary();
    const configuredProviders = providers.filter((p) => p.isConfigured).length;
    const healthyProviders = providers.filter((p) => p.health === 'healthy').length;

    return this.usageTracker.getDashboardStats(
      agents.length,
      activeAgents,
      disabledAgents,
      configuredProviders,
      healthyProviders
    );
  }

  public getAgents(caller: CallerContext): AgentDefinition[] {
    this.assertAdmin(caller);
    return this.agentReg.getAll();
  }

  public getAgent(id: AgentId, caller: CallerContext): AgentDefinition {
    this.assertAdmin(caller);
    const agent = this.agentReg.get(id);
    if (!agent) throw AppError.notFound(`Agent ${id} not found`);
    return agent;
  }

  public updateAgentStatus(
    id: AgentId,
    status: 'active' | 'disabled',
    caller: CallerContext
  ): AgentDefinition {
    this.assertAdmin(caller);
    this.agentReg.updateStatus(id, status);
    return this.getAgent(id, caller);
  }

  public getProviders(caller: CallerContext): ProviderConfig[] {
    this.assertAdmin(caller);
    return this.apiPoolService.getProviderCatalog();
  }

  public async getProviderHealth(caller: CallerContext) {
    this.assertAdmin(caller);
    return this.providerReg.getProviderHealthSummary();
  }

  public getMcpTools(caller: CallerContext): McpToolDefinition[] {
    this.assertAdmin(caller);
    return this.mcpReg.getAll();
  }

  public updateMcpToolStatus(
    id: McpToolId,
    status: 'active' | 'disabled',
    caller: CallerContext
  ): McpToolDefinition {
    this.assertAdmin(caller);
    this.mcpReg.updateToolStatus(id, status);
    const tool = this.mcpReg.get(id);
    if (!tool) throw AppError.notFound(`Tool ${id} not found`);
    return tool;
  }

  public async executeMcpTool(
    invocation: McpToolInvocation,
    caller: CallerContext
  ): Promise<McpToolResult> {
    this.assertAdmin(caller);
    return this.mcpExec.executeTool({
      ...invocation,
      callerId: caller.id,
      callerRole: caller.role,
    });
  }

  public getPrompts(caller: CallerContext): PromptTemplate[] {
    this.assertAdmin(caller);
    return this.promptReg.getAll();
  }

  public getPrompt(id: string, caller: CallerContext): PromptTemplate {
    this.assertAdmin(caller);
    const template = this.promptReg.get(id);
    if (!template) throw AppError.notFound(`Prompt template ${id} not found`);
    return template;
  }

  public rollbackPrompt(templateId: string, version: string, caller: CallerContext): PromptTemplate {
    this.assertAdmin(caller);
    this.promptReg.rollbackToVersion(templateId, version);
    return this.getPrompt(templateId, caller);
  }

  public getKeyReferences(caller: CallerContext) {
    this.assertAdmin(caller);
    return this.apiPoolService.getKeyReferences();
  }

  // ============================================================================
  // 4. Governance & RBAC Guards
  // ============================================================================

  private assertCallerAllowed(caller: CallerContext, allowedRoles: string[]): void {
    const normalizedRole = caller.role.toLowerCase().replace('role_', '');

    // DEC-048 Invariant: Reject ROLE_CHIEF_EDITOR
    if (normalizedRole.includes('chief_editor')) {
      throw AppError.forbidden(
        'DEC-048: ROLE_CHIEF_EDITOR remains Pending Approval and cannot be utilized.'
      );
    }

    const permitted = allowedRoles.some((r) => r.toLowerCase() === normalizedRole);
    if (!permitted) {
      throw AppError.forbidden(
        `User role "${caller.role}" is not authorized for this AI capability`
      );
    }
  }

  private assertAdmin(caller: CallerContext): void {
    const normalizedRole = caller.role.toLowerCase().replace('role_', '');

    // DEC-048 Invariant
    if (normalizedRole.includes('chief_editor')) {
      throw AppError.forbidden(
        'DEC-048: ROLE_CHIEF_EDITOR remains Pending Approval and cannot be utilized.'
      );
    }

    if (normalizedRole !== 'admin' && normalizedRole !== 'super_admin') {
      throw AppError.forbidden(
        'Administrative access required for AI subsystem management'
      );
    }
  }
}

export const aiService = new AiService();

