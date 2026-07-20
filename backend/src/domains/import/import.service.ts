import { Injectable } from '@nestjs/common';
import { LoggerService } from '@common/logger/logger.service';
import { AuditService } from '@domains/audit/audit.service';
import { ProductsService } from '@domains/products/products.service';
import { ImportPreviewResponse, ImportResultResponse } from './import.types';

@Injectable()
export class ImportService {
  private importHistory: ImportResultResponse[] = [];

  constructor(
    private readonly auditService: AuditService,
    private readonly loggerService: LoggerService,
    private readonly productsService?: ProductsService,
  ) {}

  private parseCsv(buffer: Buffer): {
    headers: string[];
    rows: Record<string, string>[];
  } {
    const text = buffer
      .toString('utf-8')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
    const lines = text.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length < 2) return { headers: [], rows: [] };
    const headers = this.parseCsvLine(lines[0]).map((h) => h.trim());
    const rows = lines.slice(1).map((line) => {
      const values = this.parseCsvLine(line);
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = (values[i] || '').trim();
      });
      return row;
    });
    return { headers, rows };
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }

  async preview(
    entity: string,
    buffer: Buffer,
  ): Promise<ImportPreviewResponse> {
    const { headers, rows } = this.parseCsv(buffer);
    const columns = headers;
    const errors: { row: number; message: string }[] = [];
    const validRows: Record<string, any>[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowErrors = this.validateRow(entity, row, i + 1);
      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        validRows.push(row);
      }
    }

    return {
      totalRows: rows.length,
      validRows: validRows.length,
      errorRows: errors.length,
      preview: validRows.slice(0, 5),
      errors,
      columns,
    };
  }

  private validateRow(
    entity: string,
    row: Record<string, any>,
    rowNum: number,
  ): { row: number; message: string }[] {
    const errors: { row: number; message: string }[] = [];
    if (entity === 'products') {
      if (!row.name)
        errors.push({ row: rowNum, message: 'Product name is required' });
      if (!row.basePrice && !row.price)
        errors.push({ row: rowNum, message: 'Price is required' });
    } else if (entity === 'customers') {
      if (!row.email && !row.Email)
        errors.push({ row: rowNum, message: 'Email is required' });
      if (!row.firstName && !row['First Name'])
        errors.push({ row: rowNum, message: 'First name is required' });
    }
    return errors;
  }

  async confirm(
    entity: string,
    dto: { rows: Record<string, any>[]; entity: string },
    userId: string,
  ): Promise<ImportResultResponse> {
    const success: string[] = [];
    const errors: { row?: number; message: string }[] = [];
    let skipped = 0;

    for (let i = 0; i < dto.rows.length; i++) {
      const row = dto.rows[i];
      try {
        if (entity === 'products') {
          await this.productsService?.create(
            {
              name: row.name,
              basePrice: parseFloat(row.basePrice || row.price || '0'),
              brandId: row.brandId || '00000000-0000-0000-0000-000000000000',
              shortDescription: row.shortDescription || row.description,
              sku: row.sku,
              status: 'DRAFT',
            },
            userId,
          );
        } else if (entity === 'customers') {
          // ponytail: import creates minimal user record; profile created on first login
          errors.push({
            row: i + 1,
            message: 'Customer import requires backend registration flow',
          });
          skipped++;
          continue;
        }
        success.push(row.name || row.email || `row-${i}`);
      } catch (err: any) {
        errors.push({ row: i + 1, message: err.message });
      }
    }

    const result: ImportResultResponse = {
      imported: success.length,
      skipped,
      failed: errors.length,
      errors,
      entity,
      createdAt: new Date(),
    };

    this.importHistory.unshift(result);
    if (this.importHistory.length > 50) this.importHistory.pop();

    await this.auditService.log({
      action: `IMPORT_${entity.toUpperCase()}`,
      module: 'import',
      resource: entity,
      userId,
      newValue: { imported: success.length, failed: errors.length, skipped },
    });

    this.loggerService.log(
      { action: 'import_completed', entity, imported: success.length },
      'ImportService',
    );
    return result;
  }

  async getHistory(): Promise<ImportResultResponse[]> {
    return this.importHistory;
  }
}
