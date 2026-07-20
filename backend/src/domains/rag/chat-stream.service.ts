import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  OrchestrateDto,
  OrchestrateResponseDto,
} from './orchestrator.types';

export interface ChatStream {
  // ponytail: streaming contract. Non-streaming default resolves the full response.
  // SSE/WebSocket transport plugs in here later without touching the chat service.
  stream(dto: OrchestrateDto): Promise<OrchestrateResponseDto>;
}

@Injectable()
export class ChatStreamService implements ChatStream {
  private readonly enabled: boolean;

  constructor(config: ConfigService) {
    this.enabled = config.get<boolean>('rag.chatStreamEnabled', false);
  }

  async stream(_dto: OrchestrateDto): Promise<OrchestrateResponseDto> {
    // ponytail: default non-streaming. When rag.chatStreamEnabled + a transport exist,
    // swap this for a generator that yields tokens; chat service stays unchanged.
    throw new Error(
      'Non-streaming mode: use AIOrchestratorService.orchestrate directly',
    );
  }

  isStreaming(): boolean {
    return this.enabled;
  }
}
