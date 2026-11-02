/**
 * BREAKING NEWS WALA — Central AI Agent Registry
 * Grounded in docs/17-Agents.md (14 Specialized AI Agents Taxonomy)
 */

import { AGENT_IDS, AgentId, MODEL_IDS, CAPABILITY_TIERS, MCP_TOOL_IDS } from '../constants';
import { AgentDefinition } from '../types';

export class AgentRegistry {
  private agents: Map<AgentId, AgentDefinition> = new Map();

  constructor() {
    this.seedCanonicalAgents();
  }

  private seedCanonicalAgents(): void {
    // 1. News Writing Agent (AGT-WRT-001)
    this.register({
      id: AGENT_IDS.NEWS_WRITING,
      name: 'News Writing & Structuring Agent',
      hindiName: 'समाचार लेखन एवं संरचना एजेंट',
      description: 'Ingests raw reporter notes and structures them into journalistic inverted-pyramid Hindi copy',
      category: 'creation',
      purpose: 'Raw script structuring with zero hallucination and anti-clickbait constraints',
      status: 'active',
      version: '1.0.0',
      assignedTier: CAPABILITY_TIERS.DEEP,
      defaultModelId: MODEL_IDS.GEMINI_PRO,
      promptTemplateId: 'PRM-WRT-001',
      promptVersion: '1.0.0',
      allowedRoles: ['reporter', 'editor', 'desk_editor', 'admin', 'super_admin'],
      allowedTools: [MCP_TOOL_IDS.ARCHIVE_SEARCH, MCP_TOOL_IDS.TAXONOMY_RESOLVE],
      inputSchema: { type: 'object', required: ['rawNotes', 'category', 'district'] },
      outputSchema: { type: 'object', required: ['suggestedHeadline', 'leadStandfirst', 'bodyParagraphs'] },
      timeoutMs: 30000,
      maxRetries: 2,
      dailyQuotaLimit: 25,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 2. Headline Generation Agent (AGT-HDL-002)
    this.register({
      id: AGENT_IDS.HEADLINE_GENERATION,
      name: 'Headline Generation Agent',
      hindiName: 'शीर्षक सुझाव एजेंट',
      description: 'Generates multi-angle informative and engaging Hindi headlines preserving factual meaning',
      category: 'creation',
      purpose: 'Fast-tier headline and catchphrase generation without clickbait',
      status: 'active',
      version: '1.0.0',
      assignedTier: CAPABILITY_TIERS.FAST,
      defaultModelId: MODEL_IDS.GEMINI_FLASH,
      promptTemplateId: 'PRM-HDL-002',
      promptVersion: '1.0.0',
      allowedRoles: ['reporter', 'editor', 'desk_editor', 'admin', 'super_admin'],
      allowedTools: [],
      inputSchema: { type: 'object', required: ['articleBody'] },
      outputSchema: { type: 'object', required: ['options'] },
      timeoutMs: 10000,
      maxRetries: 2,
      dailyQuotaLimit: 50,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 3. Editorial Assistant Agent (AGT-EDT-003)
    this.register({
      id: AGENT_IDS.EDITORIAL_ASSISTANT,
      name: 'Editorial Assistant Agent',
      hindiName: 'संपादकीय समीक्षा एजेंट',
      description: 'Audits draft text for journalistic tone, clarity, and grammatical consistency',
      category: 'editorial',
      purpose: 'Editorial review desk support for language polishing',
      status: 'active',
      version: '1.0.0',
      assignedTier: CAPABILITY_TIERS.DEEP,
      defaultModelId: MODEL_IDS.GEMINI_PRO,
      promptTemplateId: 'PRM-EDT-003',
      promptVersion: '1.0.0',
      allowedRoles: ['editor', 'desk_editor', 'admin', 'super_admin'],
      allowedTools: [MCP_TOOL_IDS.ARCHIVE_SEARCH],
      inputSchema: { type: 'object', required: ['articleText'] },
      outputSchema: { type: 'object', required: ['suggestions'] },
      timeoutMs: 25000,
      maxRetries: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 4. RSS Processing Agent (AGT-RSS-004)
    this.register({
      id: AGENT_IDS.RSS_PROCESSING,
      name: 'RSS Processing Agent',
      hindiName: 'आरएसएस वायर प्रसंस्करण एजेंट',
      description: 'Parses authorized external wire feeds into structured Hindi news drafts',
      category: 'ingestion',
      purpose: 'Batch wire import assistance (Admin-only)',
      status: 'active',
      version: '1.0.0',
      assignedTier: CAPABILITY_TIERS.FAST,
      defaultModelId: MODEL_IDS.GEMINI_FLASH,
      promptTemplateId: 'PRM-RSS-004',
      promptVersion: '1.0.0',
      allowedRoles: ['admin', 'super_admin'],
      allowedTools: [MCP_TOOL_IDS.WIRE_INSPECT],
      inputSchema: { type: 'object', required: ['feedItem'] },
      outputSchema: { type: 'object', required: ['draft'] },
      timeoutMs: 15000,
      maxRetries: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 5. URL-to-News Agent (AGT-URL-005)
    this.register({
      id: AGENT_IDS.URL_TO_NEWS,
      name: 'URL-to-News Agent',
      hindiName: 'यूआरएल समाचार निष्कर्षण एजेंट',
      description: 'Extracts article facts from external URLs and drafts original Hindi reports (Admin-only)',
      category: 'ingestion',
      purpose: 'External web research conversion under strict SSRF isolation',
      status: 'active',
      version: '1.0.0',
      assignedTier: CAPABILITY_TIERS.DEEP,
      defaultModelId: MODEL_IDS.GEMINI_PRO,
      promptTemplateId: 'PRM-URL-005',
      promptVersion: '1.0.0',
      allowedRoles: ['admin', 'super_admin'],
      allowedTools: [],
      inputSchema: { type: 'object', required: ['urlContent'] },
      outputSchema: { type: 'object', required: ['draft'] },
      timeoutMs: 30000,
      maxRetries: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 6. Research & Fact-Checking Agent (AGT-RES-006)
    this.register({
      id: AGENT_IDS.RESEARCH_FACT_CHECK,
      name: 'Research & Fact-Checking Agent',
      hindiName: 'अनुसंधान एवं तथ्य-जांच सहायक एजेंट',
      description: 'Extracts claims, highlights contradictions, and cross-references source references for human review',
      category: 'editorial',
      purpose: 'Fact-checking assistance. AI NEVER approves or certifies news.',
      status: 'active',
      version: '1.0.0',
      assignedTier: CAPABILITY_TIERS.DEEP,
      defaultModelId: MODEL_IDS.GEMINI_PRO,
      promptTemplateId: 'PRM-RES-006',
      promptVersion: '1.0.0',
      allowedRoles: ['editor', 'desk_editor', 'admin', 'super_admin'],
      allowedTools: [MCP_TOOL_IDS.ARCHIVE_SEARCH, MCP_TOOL_IDS.WIRE_INSPECT],
      inputSchema: { type: 'object', required: ['articleTitle', 'articleBody'] },
      outputSchema: { type: 'object', required: ['claimsIdentified', 'overallAdvisory'] },
      timeoutMs: 30000,
      maxRetries: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 7. SEO Assistant Agent (AGT-SEO-007)
    this.register({
      id: AGENT_IDS.SEO_ASSISTANT,
      name: 'SEO Assistant Agent',
      hindiName: 'एसईओ सहायक एजेंट',
      description: 'Generates SEO meta titles, descriptions, and Devanagari transliterated URL slugs',
      category: 'distribution',
      purpose: 'Search engine discoverability optimization',
      status: 'active',
      version: '1.0.0',
      assignedTier: CAPABILITY_TIERS.FAST,
      defaultModelId: MODEL_IDS.GEMINI_FLASH,
      promptTemplateId: 'PRM-SEO-007',
      promptVersion: '1.0.0',
      allowedRoles: ['reporter', 'editor', 'desk_editor', 'admin', 'super_admin'],
      allowedTools: [MCP_TOOL_IDS.TAXONOMY_RESOLVE],
      inputSchema: { type: 'object', required: ['headline', 'body'] },
      outputSchema: { type: 'object', required: ['metaTitle', 'metaDescription', 'slug'] },
      timeoutMs: 10000,
      maxRetries: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 8. Graphics Assistant Agent (AGT-GRP-008)
    this.register({
      id: AGENT_IDS.GRAPHICS_ASSISTANT,
      name: 'Graphics Assistant Agent',
      hindiName: 'ग्राफिक्स सहायक एजेंट',
      description: 'Adapts news headlines and quotes to fit assigned graphic card layout bounds',
      category: 'media',
      purpose: 'Template-constrained text fitting for news cards',
      status: 'active',
      version: '1.0.0',
      assignedTier: CAPABILITY_TIERS.FAST,
      defaultModelId: MODEL_IDS.GEMINI_FLASH,
      promptTemplateId: 'PRM-GRP-008',
      promptVersion: '1.0.0',
      allowedRoles: ['reporter', 'editor', 'admin', 'super_admin'],
      allowedTools: [MCP_TOOL_IDS.MEDIA_INSPECT],
      inputSchema: { type: 'object', required: ['headline', 'templateId'] },
      outputSchema: { type: 'object', required: ['fittedHeadline'] },
      timeoutMs: 10000,
      maxRetries: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 9. Video Assistant Agent (AGT-VID-009)
    this.register({
      id: AGENT_IDS.VIDEO_ASSISTANT,
      name: 'Video Assistant Agent',
      hindiName: 'वीडियो सहायक एजेंट',
      description: 'Drafts 60-second voiceover scripts and scene sequencing for video reels',
      category: 'media',
      purpose: 'Short-form news video production scripting',
      status: 'active',
      version: '1.0.0',
      assignedTier: CAPABILITY_TIERS.DEEP,
      defaultModelId: MODEL_IDS.GEMINI_PRO,
      promptTemplateId: 'PRM-VID-009',
      promptVersion: '1.0.0',
      allowedRoles: ['editor', 'admin', 'super_admin'],
      allowedTools: [MCP_TOOL_IDS.MEDIA_INSPECT],
      inputSchema: { type: 'object', required: ['articleText'] },
      outputSchema: { type: 'object', required: ['scenes', 'voiceoverScript'] },
      timeoutMs: 25000,
      maxRetries: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 10. Translation & Summary Agent (AGT-TRN-010)
    this.register({
      id: AGENT_IDS.TRANSLATION_SUMMARY,
      name: 'Translation & Summary Agent',
      hindiName: 'अनुवाद एवं सारांश एजेंट',
      description: 'Provides English-Hindi translations and bulleted story summaries',
      category: 'creation',
      purpose: 'Vernacular translation and multi-length synthesis',
      status: 'active',
      version: '1.0.0',
      assignedTier: CAPABILITY_TIERS.FAST,
      defaultModelId: MODEL_IDS.GEMINI_FLASH,
      promptTemplateId: 'PRM-TRN-010',
      promptVersion: '1.0.0',
      allowedRoles: ['reporter', 'editor', 'desk_editor', 'admin', 'super_admin'],
      allowedTools: [],
      inputSchema: { type: 'object', required: ['text', 'mode'] },
      outputSchema: { type: 'object', required: ['resultText'] },
      timeoutMs: 15000,
      maxRetries: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 11. News Classification Agent (AGT-CLS-011)
    this.register({
      id: AGENT_IDS.NEWS_CLASSIFICATION,
      name: 'News Classification Agent',
      hindiName: 'समाचार वर्गीकरण एजेंट',
      description: 'Maps news copy into authorized categories and 55 MP districts',
      category: 'editorial',
      purpose: 'Taxonomy tagging and geography validation',
      status: 'active',
      version: '1.0.0',
      assignedTier: CAPABILITY_TIERS.FAST,
      defaultModelId: MODEL_IDS.GEMINI_FLASH,
      promptTemplateId: 'PRM-CLS-011',
      promptVersion: '1.0.0',
      allowedRoles: ['reporter', 'editor', 'desk_editor', 'admin', 'super_admin'],
      allowedTools: [MCP_TOOL_IDS.TAXONOMY_RESOLVE],
      inputSchema: { type: 'object', required: ['title', 'body'] },
      outputSchema: { type: 'object', required: ['suggestedCategory'] },
      timeoutMs: 8000,
      maxRetries: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 12. Duplicate News Detection Agent (AGT-DUP-012)
    this.register({
      id: AGENT_IDS.DUPLICATE_DETECTION,
      name: 'Duplicate News Detection Agent',
      hindiName: 'दोहराव समाचार पहचान एजेंट',
      description: 'Identifies redundant wire dispatches or cross-reporter duplicate submissions',
      category: 'editorial',
      purpose: 'Semantic duplicate clustering using vector embeddings',
      status: 'active',
      version: '1.0.0',
      assignedTier: CAPABILITY_TIERS.EMBEDDING,
      defaultModelId: MODEL_IDS.GEMINI_EMBEDDING,
      promptTemplateId: 'PRM-DUP-012',
      promptVersion: '1.0.0',
      allowedRoles: ['editor', 'desk_editor', 'admin', 'super_admin'],
      allowedTools: [MCP_TOOL_IDS.ARCHIVE_SEARCH],
      inputSchema: { type: 'object', required: ['text'] },
      outputSchema: { type: 'object', required: ['isDuplicate', 'similarityScore'] },
      timeoutMs: 10000,
      maxRetries: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 13. Notification Content Agent (AGT-NOT-013)
    this.register({
      id: AGENT_IDS.NOTIFICATION_CONTENT,
      name: 'Notification Content Agent',
      hindiName: 'अधिसूचना सामग्री एजेंट',
      description: 'Drafts ultra-concise mobile breaking news push alerts under 120 characters',
      category: 'distribution',
      purpose: 'High-urgency mobile alert copy drafting for editor approval',
      status: 'active',
      version: '1.0.0',
      assignedTier: CAPABILITY_TIERS.FAST,
      defaultModelId: MODEL_IDS.GEMINI_FLASH,
      promptTemplateId: 'PRM-NOT-013',
      promptVersion: '1.0.0',
      allowedRoles: ['editor', 'admin', 'super_admin'],
      allowedTools: [],
      inputSchema: { type: 'object', required: ['headline', 'summary'] },
      outputSchema: { type: 'object', required: ['pushTitle', 'pushBody'] },
      timeoutMs: 8000,
      maxRetries: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 14. Analytics Assistant Agent (AGT-ANL-014)
    this.register({
      id: AGENT_IDS.ANALYTICS_ASSISTANT,
      name: 'Analytics Assistant Agent',
      hindiName: 'विश्लेषण सहायक एजेंट',
      description: 'Generates natural language summaries of district filing velocity and readership',
      category: 'platform',
      purpose: 'Editorial intelligence reports for bureau chiefs and admins',
      status: 'active',
      version: '1.0.0',
      assignedTier: CAPABILITY_TIERS.FAST,
      defaultModelId: MODEL_IDS.GEMINI_FLASH,
      promptTemplateId: 'PRM-ANL-014',
      promptVersion: '1.0.0',
      allowedRoles: ['admin', 'super_admin'],
      allowedTools: [MCP_TOOL_IDS.AUDIT_QUERY],
      inputSchema: { type: 'object', required: ['period'] },
      outputSchema: { type: 'object', required: ['summaryText'] },
      timeoutMs: 15000,
      maxRetries: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  public register(agent: AgentDefinition): void {
    this.agents.set(agent.id, agent);
  }

  public get(id: AgentId): AgentDefinition | undefined {
    return this.agents.get(id);
  }

  public getAll(): AgentDefinition[] {
    return Array.from(this.agents.values());
  }

  public updateStatus(id: AgentId, status: 'active' | 'disabled' | 'pending_approval'): void {
    const agent = this.agents.get(id);
    if (agent) {
      agent.status = status;
      agent.updatedAt = new Date().toISOString();
    }
  }

  public updateConfiguration(
    id: AgentId,
    config: Partial<Pick<AgentDefinition, 'assignedTier' | 'defaultModelId' | 'allowedTools' | 'timeoutMs'>>
  ): void {
    const agent = this.agents.get(id);
    if (agent) {
      Object.assign(agent, config, { updatedAt: new Date().toISOString() });
    }
  }
}

export const agentRegistry = new AgentRegistry();

