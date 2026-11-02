/**
 * BREAKING NEWS WALA — Prompt Version Registry
 * Grounded in docs/21-Prompts.md and DEC-052
 */

import { AGENT_IDS, AgentId } from '../constants';
import { PromptTemplate, PromptVersion } from '../types';

export class PromptRegistry {
  private templates: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.seedDefaultTemplates();
  }

  private seedDefaultTemplates(): void {
    // 1. News Writing Template
    this.registerTemplate({
      id: 'PRM-WRT-001',
      name: 'News Writing & Structuring Template',
      purpose: 'Transforms raw field notes into structured Hindi inverted-pyramid news copy',
      targetAgentId: AGENT_IDS.NEWS_WRITING,
      currentVersion: '1.0.0',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      versions: [
        {
          version: '1.0.0',
          systemDirective: 'Structure unstructured raw notes into an inverted-pyramid Hindi news article.',
          safetyGuardrails: ['Anti-hallucination', 'Source preservation', 'Missing information notice'],
          templateText:
            'Ingest raw reporter notes from <untrusted_content> and produce a structured news draft. Identify any missing official statements.',
          inputVariables: ['rawNotes', 'category', 'district'],
          outputSchema: {
            suggestedHeadline: 'string',
            leadStandfirst: 'string',
            bodyParagraphs: 'array of strings',
            contextBackground: 'string',
            missingInformationNotices: 'array of strings',
            suggestedCategory: 'string',
            suggestedDistrict: 'string',
          },
          changelog: 'Initial production baseline prompt for news writing',
          createdBy: 'system_bootstrap',
          createdAt: new Date().toISOString(),
          isActive: true,
        },
      ],
    });

    // 2. Headline Generation Template
    this.registerTemplate({
      id: 'PRM-HDL-002',
      name: 'Headline Suggestion Template',
      purpose: 'Generates multi-angle informative and engaging Hindi headlines',
      targetAgentId: AGENT_IDS.HEADLINE_GENERATION,
      currentVersion: '1.0.0',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      versions: [
        {
          version: '1.0.0',
          systemDirective: 'Generate 2 to 3 alternative Devanagari Hindi headlines strictly preserving factual meaning.',
          safetyGuardrails: ['No clickbait', 'No sensationalism', 'Fact-preservation invariant'],
          templateText:
            'Analyze the provided article copy in <untrusted_content> and generate alternative headline options.',
          inputVariables: ['articleBody', 'category', 'district', 'tone'],
          outputSchema: {
            options: 'array of { headline, subheadline, tone, characterCount }',
            suggestedTags: 'array of strings',
            isFactPreserved: 'boolean',
          },
          changelog: 'Initial production baseline prompt for headlines',
          createdBy: 'system_bootstrap',
          createdAt: new Date().toISOString(),
          isActive: true,
        },
      ],
    });

    // 3. Fact-Check Assistance Template
    this.registerTemplate({
      id: 'PRM-RES-006',
      name: 'Fact-Check & Source Research Template',
      purpose: 'Identifies verifiable claims, missing evidence, and contradictions for human review',
      targetAgentId: AGENT_IDS.RESEARCH_FACT_CHECK,
      currentVersion: '1.0.0',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      versions: [
        {
          version: '1.0.0',
          systemDirective:
            'Identify verifiable factual claims and potential ambiguities. You DO NOT have authority to approve or certify news.',
          safetyGuardrails: ['Human editorial primacy', 'Assistive uncertainty advisory', 'No legal certification'],
          templateText:
            'Inspect the news story and claimed sources in <untrusted_content>. Extract individual claims, rate verification risk, and note missing documentation.',
          inputVariables: ['articleTitle', 'articleBody', 'sourcesClaimed', 'district'],
          outputSchema: {
            claimsIdentified: 'array of { claimText, verificationDimension, status, riskLevel, editorialAdvice }',
            overallAdvisory: 'string',
            potentialContradictions: 'array of strings',
            missingEvidenceNotes: 'array of strings',
            humanReviewChecklist: 'array of strings',
            isAutomatedApproval: 'boolean (strictly false)',
          },
          changelog: 'Initial baseline for editorial fact-checking assistance',
          createdBy: 'system_bootstrap',
          createdAt: new Date().toISOString(),
          isActive: true,
        },
      ],
    });

    // 4. Translation & Summarization Template
    this.registerTemplate({
      id: 'PRM-TRN-010',
      name: 'Vernacular Translation & Summarization Template',
      purpose: 'Generates concise summaries and English-Hindi translations',
      targetAgentId: AGENT_IDS.TRANSLATION_SUMMARY,
      currentVersion: '1.0.0',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      versions: [
        {
          version: '1.0.0',
          systemDirective: 'Provide high-quality vernacular Hindi summaries or translations preserving all named entities.',
          safetyGuardrails: ['Entity preservation', 'No meaning distortion'],
          templateText: 'Summarize or translate the provided text in <untrusted_content> according to requested mode.',
          inputVariables: ['text', 'mode'],
          outputSchema: {
            resultText: 'string',
            keyEntities: 'array of strings',
            wordCount: 'number',
          },
          changelog: 'Initial translation and summary baseline',
          createdBy: 'system_bootstrap',
          createdAt: new Date().toISOString(),
          isActive: true,
        },
      ],
    });

    // 5. Categorization Template
    this.registerTemplate({
      id: 'PRM-CLS-011',
      name: 'News Classification & Taxonomy Template',
      purpose: 'Suggests primary category, subcategory, and district from article text',
      targetAgentId: AGENT_IDS.NEWS_CLASSIFICATION,
      currentVersion: '1.0.0',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      versions: [
        {
          version: '1.0.0',
          systemDirective: 'Analyze news text and match against Madhya Pradesh approved categories and 55 districts.',
          safetyGuardrails: ['Taxonomy constraint', 'No invented categories'],
          templateText: 'Classify the news story in <untrusted_content> into approved category and district.',
          inputVariables: ['title', 'body'],
          outputSchema: {
            suggestedCategory: 'string',
            suggestedSubcategory: 'string',
            suggestedDistrict: 'string',
            confidenceScore: 'number',
            keywords: 'array of strings',
          },
          changelog: 'Initial news classification baseline',
          createdBy: 'system_bootstrap',
          createdAt: new Date().toISOString(),
          isActive: true,
        },
      ],
    });
  }

  public registerTemplate(template: PromptTemplate): void {
    this.templates.set(template.id, template);
  }

  public get(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  public getByAgent(agentId: AgentId): PromptTemplate | undefined {
    return Array.from(this.templates.values()).find((t) => t.targetAgentId === agentId);
  }

  public getAll(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  public getActiveVersion(templateId: string): PromptVersion | undefined {
    const template = this.templates.get(templateId);
    if (!template) return undefined;
    return template.versions.find((v) => v.isActive) || template.versions[template.versions.length - 1];
  }

  public addVersion(templateId: string, version: PromptVersion): void {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Prompt template ${templateId} not found`);
    }

    // Set other versions to inactive if new version is active
    if (version.isActive) {
      for (const v of template.versions) {
        v.isActive = false;
      }
      template.currentVersion = version.version;
    }

    template.versions.push(version);
    template.updatedAt = new Date().toISOString();
  }

  public rollbackToVersion(templateId: string, targetVersion: string): void {
    const template = this.templates.get(templateId);
    if (!template) throw new Error(`Prompt template ${templateId} not found`);

    const version = template.versions.find((v) => v.version === targetVersion);
    if (!version) throw new Error(`Version ${targetVersion} not found in template ${templateId}`);

    for (const v of template.versions) {
      v.isActive = v.version === targetVersion;
    }
    template.currentVersion = targetVersion;
    template.updatedAt = new Date().toISOString();
  }
}

export const promptRegistry = new PromptRegistry();

