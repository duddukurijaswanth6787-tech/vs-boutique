import { Injectable } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';

export interface ParseResult {
  text: string;
  metadata: Record<string, unknown>;
}

export interface DocumentParser {
  parse(input: Buffer): Promise<ParseResult>;
}

@Injectable()
export class PdfParser implements DocumentParser {
  async parse(input: Buffer): Promise<ParseResult> {
    const parser = new PDFParse({ data: new Uint8Array(input) });
    const text = await parser.getText();
    const info = await parser.getInfo();
    return {
      text: text?.text ?? '',
      metadata: {
        pageCount: text?.pages?.length ?? 0,
        pdfVersion: info?.info?.pdfFormatVersion,
      },
    };
  }
}

// ponytail: mammoth extracts raw text from .docx (no formatting). Kept simple —
// style mapping (bold→markdown, etc.) can be added via mammoth's convertToHtml if needed.
@Injectable()
export class DocxParser implements DocumentParser {
  async parse(input: Buffer): Promise<ParseResult> {
    const result = await mammoth.extractRawText({ buffer: input });
    return {
      text: result.value,
      metadata: {
        warnings: result.messages.filter(
          (m: { type: string }) => m.type === 'warning',
        ).length,
      },
    };
  }
}

// ponytail: covers both text/plain and text/markdown — Markdown IS plain text for ingestion purposes.
@Injectable()
export class TextParser implements DocumentParser {
  async parse(input: Buffer): Promise<ParseResult> {
    const text = input.toString('utf-8');
    return { text, metadata: {} };
  }
}

// ponytail: simple line/column split. Handles 90% of CSV files.
// Fails on quoted fields with embedded commas/newlines. Upgrade to csv-parse when encountered.
@Injectable()
export class CsvParser implements DocumentParser {
  async parse(input: Buffer): Promise<ParseResult> {
    const raw = input.toString('utf-8');
    const lines = raw.split('\n').filter((l) => l.trim().length > 0);
    const content = lines
      .map((line) =>
        line
          .split(',')
          .map((c) => c.trim())
          .join(' '),
      )
      .join('\n');
    return { text: content, metadata: { rows: lines.length } };
  }
}

@Injectable()
export class JsonParser implements DocumentParser {
  async parse(input: Buffer): Promise<ParseResult> {
    const raw = input.toString('utf-8');
    const obj = JSON.parse(raw);
    const content =
      typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
    return {
      text: content,
      metadata: { rootType: typeof obj, isArray: Array.isArray(obj) },
    };
  }
}
