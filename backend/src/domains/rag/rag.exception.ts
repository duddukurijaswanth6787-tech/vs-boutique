import { BusinessException } from '@common/exceptions';

export class RagException extends BusinessException {
  constructor(message = 'RAG operation failed', code = 'RAG_ERROR') {
    super(message, code);
  }
}

export class KnowledgeException extends BusinessException {
  constructor(
    message = 'Knowledge operation failed',
    code = 'RAG_KNOWLEDGE_ERROR',
  ) {
    super(message, code);
  }
}

export class ConversationException extends BusinessException {
  constructor(
    message = 'Conversation operation failed',
    code = 'RAG_CONVERSATION_ERROR',
  ) {
    super(message, code);
  }
}
