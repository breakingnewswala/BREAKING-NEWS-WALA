/**
 * BREAKING NEWS WALA — MCP (Model Context Protocol) Tool Registry
 * Grounded in docs/18-MCP.md and DEC-053
 */

import { MCP_TOOL_IDS, McpToolId, AGENT_IDS } from '../constants';
import { McpToolDefinition } from '../types';

export class McpRegistry {
  private tools: Map<McpToolId, McpToolDefinition> = new Map();

  constructor() {
    this.seedCanonicalTools();
  }

  private seedCanonicalTools(): void {
    // 1. News Research & Archive Search
    this.register({
      id: MCP_TOOL_IDS.ARCHIVE_SEARCH,
      name: 'Archive Search Tool',
      description: 'Searches published news articles by query, category, and district for historical context',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          district: { type: 'string' },
          category: { type: 'string' },
          limit: { type: 'number', default: 5 },
        },
        required: ['query'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          articles: { type: 'array' },
          totalFound: { type: 'number' },
        },
      },
      status: 'active',
      allowedAgents: [
        AGENT_IDS.NEWS_WRITING,
        AGENT_IDS.RESEARCH_FACT_CHECK,
        AGENT_IDS.EDITORIAL_ASSISTANT,
      ],
      allowedRoles: ['reporter', 'editor', 'desk_editor', 'admin', 'super_admin'],
      permissionScope: 'articles:read',
      timeoutMs: 5000,
      rateLimitPerMinute: 60,
      auditEnabled: true,
    });

    // 2. Geography & Category Taxonomy Resolution
    this.register({
      id: MCP_TOOL_IDS.TAXONOMY_RESOLVE,
      name: 'Taxonomy Resolution Tool',
      description: 'Resolves authorized MP 55 districts and 21 categories to ensure valid metadata tags',
      inputSchema: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['district', 'category'] },
          searchTerm: { type: 'string' },
        },
        required: ['type'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          matches: { type: 'array' },
        },
      },
      status: 'active',
      allowedAgents: [
        AGENT_IDS.NEWS_WRITING,
        AGENT_IDS.NEWS_CLASSIFICATION,
        AGENT_IDS.SEO_ASSISTANT,
      ],
      allowedRoles: ['reporter', 'editor', 'admin', 'super_admin'],
      permissionScope: 'taxonomy:read',
      timeoutMs: 3000,
      rateLimitPerMinute: 120,
      auditEnabled: false,
    });

    // 3. Editorial Media Metadata Inspection
    this.register({
      id: MCP_TOOL_IDS.MEDIA_INSPECT,
      name: 'Media Metadata Inspector',
      description: 'Retrieves aspect ratio, dimensions, and attribution of uploaded media assets',
      inputSchema: {
        type: 'object',
        properties: {
          mediaId: { type: 'string' },
        },
        required: ['mediaId'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          mediaId: { type: 'string' },
          mimeType: { type: 'string' },
          width: { type: 'number' },
          height: { type: 'number' },
          blurhash: { type: 'string' },
          caption: { type: 'string' },
        },
      },
      status: 'active',
      allowedAgents: [
        AGENT_IDS.GRAPHICS_ASSISTANT,
        AGENT_IDS.VIDEO_ASSISTANT,
        AGENT_IDS.NEWS_WRITING,
      ],
      allowedRoles: ['reporter', 'editor', 'admin', 'super_admin'],
      permissionScope: 'media:read',
      timeoutMs: 4000,
      rateLimitPerMinute: 60,
      auditEnabled: true,
    });

    // 4. Wire & RSS Inspection
    this.register({
      id: MCP_TOOL_IDS.WIRE_INSPECT,
      name: 'Wire & RSS Source Inspector',
      description: 'Inspects authorized imported wire items for fact cross-referencing (Admin/Editor only)',
      inputSchema: {
        type: 'object',
        properties: {
          guid: { type: 'string' },
          sourceName: { type: 'string' },
        },
        required: ['guid'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          item: { type: 'object' },
        },
      },
      status: 'active',
      allowedAgents: [
        AGENT_IDS.RSS_PROCESSING,
        AGENT_IDS.RESEARCH_FACT_CHECK,
        AGENT_IDS.EDITORIAL_ASSISTANT,
      ],
      allowedRoles: ['editor', 'desk_editor', 'admin', 'super_admin'],
      permissionScope: 'wire:read',
      timeoutMs: 5000,
      rateLimitPerMinute: 30,
      auditEnabled: true,
    });

    // 5. Compliance Audit Log Query (Restricted)
    this.register({
      id: MCP_TOOL_IDS.AUDIT_QUERY,
      name: 'Audit Log Forensics Inspector',
      description: 'Queries platform audit log entries for authorized administrators',
      inputSchema: {
        type: 'object',
        properties: {
          entityId: { type: 'string' },
          action: { type: 'string' },
        },
        required: ['entityId'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          entries: { type: 'array' },
        },
      },
      status: 'active',
      allowedAgents: [AGENT_IDS.ANALYTICS_ASSISTANT],
      allowedRoles: ['admin', 'super_admin'],
      permissionScope: 'audit:read',
      timeoutMs: 5000,
      rateLimitPerMinute: 20,
      auditEnabled: true,
    });
  }

  public register(tool: McpToolDefinition): void {
    this.tools.set(tool.id, tool);
  }

  public get(id: McpToolId): McpToolDefinition | undefined {
    return this.tools.get(id);
  }

  public getAll(): McpToolDefinition[] {
    return Array.from(this.tools.values());
  }

  public getToolsForAgent(agentId: string): McpToolDefinition[] {
    return Array.from(this.tools.values()).filter(
      (tool) => tool.status === 'active' && tool.allowedAgents.includes(agentId as any)
    );
  }

  public updateToolStatus(id: McpToolId, status: 'active' | 'disabled'): void {
    const tool = this.tools.get(id);
    if (tool) {
      tool.status = status;
    }
  }
}

export const mcpRegistry = new McpRegistry();

