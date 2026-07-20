import { RAG_EVENTS } from './rag.constants';

// ponytail: event classes define the contract for AppEventEmitter.
// Each exposes eventName for emit() and a typed payload via toPayload().
// Phase 2+ will wire actual emit() calls in services.

export class AgentCreatedEvent {
  static readonly eventName = RAG_EVENTS.AGENT_CREATED;
  constructor(
    public readonly agentId: string,
    public readonly agentKey: string,
  ) {}
  toPayload(): Record<string, unknown> {
    return { agentId: this.agentId, agentKey: this.agentKey };
  }
}

export class AgentUpdatedEvent {
  static readonly eventName = RAG_EVENTS.AGENT_UPDATED;
  constructor(public readonly agentId: string) {}
  toPayload(): Record<string, unknown> {
    return { agentId: this.agentId };
  }
}

export class AgentDeletedEvent {
  static readonly eventName = RAG_EVENTS.AGENT_DELETED;
  constructor(public readonly agentId: string) {}
  toPayload(): Record<string, unknown> {
    return { agentId: this.agentId };
  }
}

export class KnowledgeCreatedEvent {
  static readonly eventName = RAG_EVENTS.KNOWLEDGE_CREATED;
  constructor(
    public readonly sourceId: string,
    public readonly sourceType: string,
  ) {}
  toPayload(): Record<string, unknown> {
    return { sourceId: this.sourceId, sourceType: this.sourceType };
  }
}

export class KnowledgeUpdatedEvent {
  static readonly eventName = RAG_EVENTS.KNOWLEDGE_UPDATED;
  constructor(public readonly sourceId: string) {}
  toPayload(): Record<string, unknown> {
    return { sourceId: this.sourceId };
  }
}

export class KnowledgeDeletedEvent {
  static readonly eventName = RAG_EVENTS.KNOWLEDGE_DELETED;
  constructor(public readonly sourceId: string) {}
  toPayload(): Record<string, unknown> {
    return { sourceId: this.sourceId };
  }
}

export class DocumentUploadedEvent {
  static readonly eventName = RAG_EVENTS.DOCUMENT_UPLOADED;
  constructor(
    public readonly documentId: string,
    public readonly knowledgeSourceId: string,
  ) {}
  toPayload(): Record<string, unknown> {
    return {
      documentId: this.documentId,
      knowledgeSourceId: this.knowledgeSourceId,
    };
  }
}

export class DocumentDeletedEvent {
  static readonly eventName = RAG_EVENTS.DOCUMENT_DELETED;
  constructor(public readonly documentId: string) {}
  toPayload(): Record<string, unknown> {
    return { documentId: this.documentId };
  }
}

export class ChunkCreatedEvent {
  static readonly eventName = RAG_EVENTS.CHUNK_CREATED;
  constructor(
    public readonly chunkId: string,
    public readonly documentId: string,
  ) {}
  toPayload(): Record<string, unknown> {
    return { chunkId: this.chunkId, documentId: this.documentId };
  }
}

export class ChunkDeletedEvent {
  static readonly eventName = RAG_EVENTS.CHUNK_DELETED;
  constructor(public readonly chunkId: string) {}
  toPayload(): Record<string, unknown> {
    return { chunkId: this.chunkId };
  }
}

export class ConversationCreatedEvent {
  static readonly eventName = RAG_EVENTS.CONVERSATION_CREATED;
  constructor(
    public readonly conversationId: string,
    public readonly agentId: string,
  ) {}
  toPayload(): Record<string, unknown> {
    return { conversationId: this.conversationId, agentId: this.agentId };
  }
}

export class ConversationDeletedEvent {
  static readonly eventName = RAG_EVENTS.CONVERSATION_DELETED;
  constructor(public readonly conversationId: string) {}
  toPayload(): Record<string, unknown> {
    return { conversationId: this.conversationId };
  }
}

export class MessageCreatedEvent {
  static readonly eventName = RAG_EVENTS.MESSAGE_CREATED;
  constructor(
    public readonly messageId: string,
    public readonly conversationId: string,
  ) {}
  toPayload(): Record<string, unknown> {
    return { messageId: this.messageId, conversationId: this.conversationId };
  }
}

export class MessageDeletedEvent {
  static readonly eventName = RAG_EVENTS.MESSAGE_DELETED;
  constructor(public readonly messageId: string) {}
  toPayload(): Record<string, unknown> {
    return { messageId: this.messageId };
  }
}

export class EmbeddingQueuedEvent {
  static readonly eventName = RAG_EVENTS.EMBEDDING_QUEUED;
  constructor(
    public readonly jobId: string,
    public readonly sourceId: string,
  ) {}
  toPayload(): Record<string, unknown> {
    return { jobId: this.jobId, sourceId: this.sourceId };
  }
}

export class EmbeddingCompletedEvent {
  static readonly eventName = RAG_EVENTS.EMBEDDING_COMPLETED;
  constructor(
    public readonly jobId: string,
    public readonly sourceId: string,
    public readonly chunkCount: number,
  ) {}
  toPayload(): Record<string, unknown> {
    return {
      jobId: this.jobId,
      sourceId: this.sourceId,
      chunkCount: this.chunkCount,
    };
  }
}

export class EmbeddingFailedEvent {
  static readonly eventName = RAG_EVENTS.EMBEDDING_FAILED;
  constructor(
    public readonly jobId: string,
    public readonly sourceId: string,
    public readonly error: string,
  ) {}
  toPayload(): Record<string, unknown> {
    return { jobId: this.jobId, sourceId: this.sourceId, error: this.error };
  }
}
