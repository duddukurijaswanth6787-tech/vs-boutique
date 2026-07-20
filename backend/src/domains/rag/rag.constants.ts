export const RAG_RESOURCE = 'rag' as const;

export const RAG_PERMISSIONS = {
  MANAGE_AGENTS: 'rag:agents:manage',
  VIEW_AGENTS: 'rag:agents:view',
  MANAGE_KNOWLEDGE: 'rag:knowledge:manage',
  VIEW_KNOWLEDGE: 'rag:knowledge:view',
  VIEW_CONVERSATIONS: 'rag:conversations:view',
  MANAGE_CONVERSATIONS: 'rag:conversations:manage',
} as const;

export const RAG_MODULE_NAME = 'RAG' as const;

// ponytail: event names match AppEventEmitter string pattern.
// Emit with: eventEmitter.emit(RAG_EVENTS.AGENT_CREATED, { agentId, agentKey })
export const RAG_EVENTS = {
  AGENT_CREATED: 'rag.agent.created',
  AGENT_UPDATED: 'rag.agent.updated',
  AGENT_DELETED: 'rag.agent.deleted',
  KNOWLEDGE_CREATED: 'rag.knowledge.created',
  KNOWLEDGE_UPDATED: 'rag.knowledge.updated',
  KNOWLEDGE_DELETED: 'rag.knowledge.deleted',
  DOCUMENT_UPLOADED: 'rag.document.uploaded',
  DOCUMENT_DELETED: 'rag.document.deleted',
  CHUNK_CREATED: 'rag.chunk.created',
  CHUNK_DELETED: 'rag.chunk.deleted',
  CONVERSATION_CREATED: 'rag.conversation.created',
  CONVERSATION_DELETED: 'rag.conversation.deleted',
  MESSAGE_CREATED: 'rag.message.created',
  MESSAGE_DELETED: 'rag.message.deleted',
  EMBEDDING_QUEUED: 'rag.embedding.queued',
  EMBEDDING_COMPLETED: 'rag.embedding.completed',
  EMBEDDING_FAILED: 'rag.embedding.failed',
} as const;
