import { Injectable } from '@nestjs/common';

export interface ChunkInput {
  text: string;
  chunkSize: number;
  chunkOverlap: number;
  maxChunks?: number;
}

export interface ChunkResult {
  content: string;
  index: number;
  startOffset: number;
  endOffset: number;
  characterCount: number;
}

export interface ChunkingStrategy {
  chunk(input: ChunkInput): ChunkResult[];
}

function computeOffsets(
  chunks: string[],
  originalText: string,
): { startOffset: number; endOffset: number }[] {
  const offsets: { startOffset: number; endOffset: number }[] = [];
  let searchFrom = 0;
  for (const chunk of chunks) {
    const idx = originalText.indexOf(chunk, searchFrom);
    if (idx === -1) {
      offsets.push({ startOffset: 0, endOffset: 0 });
    } else {
      offsets.push({ startOffset: idx, endOffset: idx + chunk.length });
      searchFrom = idx + 1;
    }
  }
  return offsets;
}

// ponytail: Fixed — simplest strategy, splits by exact character count.
// Use for uniform chunk sizes (code files, logs). Default strategy.
class FixedStrategy implements ChunkingStrategy {
  chunk(input: ChunkInput): ChunkResult[] {
    const { text, chunkSize, chunkOverlap } = input;
    const contents: string[] = [];
    let start = 0;
    while (start < text.length) {
      if (input.maxChunks && contents.length >= input.maxChunks) break;
      const end = Math.min(start + chunkSize, text.length);
      contents.push(text.slice(start, end));
      if (end >= text.length) break;
      start += chunkSize - chunkOverlap;
    }
    return contents.map((content, i) => ({
      content,
      index: i,
      startOffset: 0,
      endOffset: 0,
      characterCount: content.length,
    }));
  }
}

// ponytail: Paragraph — splits on double newlines, groups into chunks up to chunkSize.
// Works well for prose documents, articles, documentation.
class ParagraphStrategy implements ChunkingStrategy {
  chunk(input: ChunkInput): ChunkResult[] {
    const { text, chunkSize } = input;
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    const contents: string[] = [];
    let buffer = '';
    for (const para of paragraphs) {
      const candidate = buffer ? `${buffer}\n\n${para}` : para;
      if (candidate.length > chunkSize && buffer) {
        contents.push(buffer);
        const words = buffer.split(/\s+/);
        const overlapWords = words
          .slice(-Math.ceil(input.chunkOverlap / 5))
          .join(' ');
        buffer = overlapWords ? `${overlapWords}\n\n${para}` : para;
      } else {
        buffer = candidate;
      }
      if (input.maxChunks && contents.length >= input.maxChunks) break;
    }
    if (buffer) contents.push(buffer);
    return contents.map((content, i) => ({
      content,
      index: i,
      startOffset: 0,
      endOffset: 0,
      characterCount: content.length,
    }));
  }
}

// ponytail: Sentence — splits on sentence boundaries ([.!?] + space/capital). Regex is approximate:
// doesn't handle abbreviations (Dr., Mr., Inc.) or decimal numbers. Upgrade when those cause quality issues.
class SentenceStrategy implements ChunkingStrategy {
  chunk(input: ChunkInput): ChunkResult[] {
    const { text, chunkSize, chunkOverlap } = input;
    const sentences = text.match(/[^.!?\n]+[.!?]*\s*/g) || [text];
    const contents: string[] = [];
    let buffer = '';
    for (const sentence of sentences) {
      const candidate = buffer ? `${buffer}${sentence}` : sentence;
      if (candidate.length > chunkSize && buffer) {
        contents.push(buffer.trim());
        const words = buffer.split(/\s+/);
        const overlapText = words.slice(-Math.ceil(chunkOverlap / 5)).join(' ');
        buffer = overlapText ? `${overlapText} ${sentence}` : sentence;
      } else {
        buffer = candidate;
      }
      if (input.maxChunks && contents.length >= input.maxChunks) break;
    }
    if (buffer?.trim()) contents.push(buffer.trim());
    return contents.map((content, i) => ({
      content,
      index: i,
      startOffset: 0,
      endOffset: 0,
      characterCount: content.length,
    }));
  }
}

// ponytail: Recursive — tries paragraph first, then sentence, then fixed as fallback.
// Matches LangChain's RecursiveCharacterTextSplitter behavior.
class RecursiveStrategy implements ChunkingStrategy {
  chunk(input: ChunkInput): ChunkResult[] {
    const { text, chunkSize, maxChunks } = input;
    const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
    const contents: string[] = [];

    for (const para of paragraphs) {
      const candidate =
        contents.length > 0
          ? `${contents[contents.length - 1]}\n\n${para}`
          : para;
      if (candidate.length <= chunkSize) {
        if (contents.length > 0) {
          const last = contents.pop()!;
          contents.push(`${last}\n\n${para}`);
        } else {
          contents.push(para);
        }
      } else if (para.length > chunkSize) {
        const sentences = para.match(/[^.!?\n]+[.!?]*\s*/g) || [para];
        for (const sentence of sentences) {
          if (contents.length === 0) {
            contents.push(sentence);
          } else {
            const merged = `${contents[contents.length - 1]} ${sentence}`;
            if (merged.length <= chunkSize) {
              contents[contents.length - 1] = merged;
            } else {
              contents.push(sentence);
            }
          }
          if (maxChunks && contents.length >= maxChunks) break;
        }
      } else {
        contents.push(para);
      }
      if (maxChunks && contents.length >= maxChunks) break;
    }

    return contents.map((content, i) => ({
      content,
      index: i,
      startOffset: 0,
      endOffset: 0,
      characterCount: content.length,
    }));
  }
}

@Injectable()
export class ChunkingService {
  private readonly strategies: Map<string, ChunkingStrategy> = new Map();

  constructor() {
    this.strategies.set('fixed', new FixedStrategy());
    this.strategies.set('paragraph', new ParagraphStrategy());
    this.strategies.set('sentence', new SentenceStrategy());
    this.strategies.set('recursive', new RecursiveStrategy());
  }

  chunk(input: ChunkInput, strategy = 'fixed'): ChunkResult[] {
    const impl = this.strategies.get(strategy);
    if (!impl) throw new Error(`Unknown chunking strategy: ${strategy}`);

    const original = input.text;
    const results = impl.chunk(input);
    const offsets = computeOffsets(
      results.map((r) => r.content),
      original,
    );

    return results.map((r, i) => ({
      ...r,
      startOffset: offsets[i]?.startOffset ?? 0,
      endOffset: offsets[i]?.endOffset ?? 0,
      characterCount: r.content.length,
    }));
  }
}
