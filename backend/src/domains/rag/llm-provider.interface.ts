import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LLMResult {
  content: string;
  model: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  responseTimeMs: number;
}

export interface LLMProvider {
  generate(
    systemPrompt: string,
    messages: Array<{ role: string; content: string }>,
  ): Promise<LLMResult>;
  health(): Promise<{ ok: boolean; message: string }>;
  model(): string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

@Injectable()
export class GeminiLLMProvider implements LLMProvider {
  private readonly apiKey: string;
  private readonly modelName: string;
  private readonly timeout: number;
  private readonly maxTokens: number;
  private readonly temperature: number;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('rag.llmApiKey', '');
    this.modelName = config.get<string>('rag.llmModel', 'gemini-1.5-flash');
    this.timeout = config.get<number>('rag.llmTimeout', 30000);
    this.maxTokens = config.get<number>('rag.llmMaxTokens', 1024);
    this.temperature = config.get<number>('rag.llmTemperature', 0.7);
  }

  async generate(
    systemPrompt: string,
    messages: Array<{ role: string; content: string }>,
  ): Promise<LLMResult> {
    const start = Date.now();
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `${systemPrompt}\n\n${messages.map((m) => `${m.role}: ${m.content}`).join('\n')}`,
          },
        ],
      },
    ];

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: this.temperature,
              maxOutputTokens: this.maxTokens,
            },
          }),
          signal: controller.signal,
        },
      );

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`Gemini API error ${res.status}: ${errBody}`);
      }

      const data = (await res.json()) as GeminiResponse;
      const text =
        data.candidates?.[0]?.content?.parts
          ?.map((p) => p.text ?? '')
          .join('') ?? '';
      const usage = data.usageMetadata;

      return {
        content: text,
        model: this.modelName,
        provider: 'gemini',
        promptTokens: usage?.promptTokenCount ?? 0,
        completionTokens: usage?.candidatesTokenCount ?? 0,
        totalTokens: usage?.totalTokenCount ?? 0,
        responseTimeMs: Date.now() - start,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  async health(): Promise<{ ok: boolean; message: string }> {
    if (!this.apiKey)
      return { ok: false, message: 'GEMINI_API_KEY not configured' };
    return { ok: true, message: 'Gemini LLM provider ready' };
  }

  model(): string {
    return this.modelName;
  }
}

// ponytail: mock provider for testing without API keys. Returns canned responses.
// Add more realistic mock data when specific test scenarios require it.
@Injectable()
export class MockLLMProvider implements LLMProvider {
  async generate(
    _systemPrompt: string,
    messages: Array<{ role: string; content: string }>,
  ): Promise<LLMResult> {
    const lastMsg = messages[messages.length - 1]?.content ?? '';
    return {
      content: `Mock response to: "${lastMsg.slice(0, 50)}..."`,
      model: 'mock-model',
      provider: 'mock',
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      responseTimeMs: 0,
    };
  }

  async health(): Promise<{ ok: boolean; message: string }> {
    return { ok: true, message: 'Mock provider ready' };
  }

  model(): string {
    return 'mock-model';
  }
}
