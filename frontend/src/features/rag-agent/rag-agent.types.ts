export type LLMProvider = 'gemini' | 'openai';

export type KnowledgeSourceType = 'TEXT' | 'DOCUMENT' | 'URL' | 'FAQ' | 'CMS';

export type KnowledgeSourceStatus = 'DRAFT' | 'PENDING' | 'PROCESSING' | 'INDEXED' | 'FAILED' | 'ARCHIVED';

export interface RagAgent {
  id: string;
  name: string;
  agentKey: string;
  description: string | null;
  modelProvider: LLMProvider;
  model: string;
  temperature: number;
  maxTokens: number;
  isActive: boolean;
  systemRole: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  knowledgeSources?: RagAgentKnowledgeSource[];
  tools?: string[]; // Array of enabled tools like 'PRODUCT_SEARCH', 'ORDER_TRACKING'
}

export interface RagAgentKnowledgeSource {
  agentId: string;
  knowledgeSourceId: string;
  createdAt: string;
  knowledgeSource?: KnowledgeSource;
}

export interface CreateAgentDto {
  name: string;
  agentKey: string;
  description?: string;
  modelProvider?: LLMProvider;
  model?: string;
  systemRole?: string;
  temperature?: number;
  maxTokens?: number;
  isActive?: boolean;
}

export type UpdateAgentDto = Partial<CreateAgentDto>;

export interface AgentStatusDto {
  action: 'ACTIVATE' | 'DEACTIVATE';
}

export interface AssignKnowledgeDto {
  knowledgeSourceIds: string[];
}

export interface ConfigureToolsDto {
  tools: string[];
}

export interface TestAgentDto {
  message: string;
  conversationId?: string;
}

export interface KnowledgeSource {
  id: string;
  name: string;
  sourceType: KnowledgeSourceType;
  sourceUrl: string | null;
  rawText: string | null;
  status: KnowledgeSourceStatus;
  indexingError: string | null;
  lastIndexedAt: string | null;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateKnowledgeSourceDto {
  name: string;
  sourceType: KnowledgeSourceType;
  sourceUrl?: string;
  rawText?: string;
}

export interface UpdateKnowledgeSourceDto {
  name?: string;
  sourceUrl?: string;
  rawText?: string;
}

export interface UploadUrlRequestDto {
  fileName: string;
  mimeType: string;
  size: number;
}

export interface ConfirmUploadDto {
  s3Key: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export interface KnowledgeChunk {
  id: string;
  documentId: string;
  knowledgeSourceId: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface KnowledgeChunkListResponse {
  data: KnowledgeChunk[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface RagConversation {
  id: string;
  agentId: string;
  customerId: string | null;
  guestId: string | null;
  title: string | null;
  status: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  agent?: RagAgent;
  toolExecutions?: RagToolExecution[];
}

export interface RagMessage {
  id: string;
  conversationId: string;
  senderType: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  latencyMs: number | null;
  relevanceScore: number | null;
  modelProvider: string | null;
  model: string | null;
  createdAt: string;
  citations?: RagMessageCitation[];
}

export interface RagMessageCitation {
  id: string;
  messageId: string;
  chunkId: string | null;
  sourceId: string | null;
  sourceTitle: string | null;
  excerpt: string | null;
  relevanceScore: number | null;
}

export interface RagToolExecution {
  id: string;
  conversationId: string;
  messageId: string | null;
  toolName: string;
  status: 'SUCCESS' | 'FAILED';
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  durationMs: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface RagSummaryAnalytics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatencyMs: number;
  averageRelevanceScore: number;
  totalConversations: number;
  totalMessages: number;
}

export interface RagAgentPerformanceSummary {
  agentId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatencyMs: number;
  averageRelevanceScore: number;
}

export interface IndexingStatusResponse {
  id: string;
  status: KnowledgeSourceStatus;
  lastIndexedAt: string | null;
  indexingError: string | null;
}

export interface RagHealthIndicator {
  status: 'up' | 'down';
  enabled: boolean;
  llm: {
    provider: string;
    status: 'UP' | 'DOWN' | 'UNCONFIGURED' | 'DISABLED';
  };
  embedding: {
    provider: string;
    status: 'UP' | 'DOWN' | 'UNCONFIGURED' | 'DISABLED';
  };
  ingestionQueue: {
    status: 'UP' | 'DOWN';
  };
  vectorDatabase: {
    status: 'UP' | 'DOWN';
  };
}
