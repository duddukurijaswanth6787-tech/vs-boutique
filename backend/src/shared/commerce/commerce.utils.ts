import { randomBytes } from 'node:crypto';
import { COMMERCE_CONSTANTS } from './commerce.constants';

export class SkuGenerator {
  static generate(productCode?: string): string {
    const prefix = COMMERCE_CONSTANTS.SKU_PREFIX;
    const code = (productCode ?? '').slice(0, 3).toUpperCase();
    const rand = randomBytes(4).toString('hex').toUpperCase().slice(0, 4);
    return `${prefix}${code}${rand}`;
  }
}

export class SlugGenerator {
  static generate(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, COMMERCE_CONSTANTS.SLUG_MAX_LENGTH);
  }
}

export class BarcodeGenerator {
  static generate(): string {
    const prefix = COMMERCE_CONSTANTS.BARCODE_PREFIX;
    const rand = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
    const raw = `${prefix}${rand}`;
    const checksum = raw
      .split('')
      .reduce((sum, d, i) => sum + parseInt(d) * (i % 2 === 0 ? 1 : 3), 0);
    const checkDigit = (10 - (checksum % 10)) % 10;
    return `${raw}${checkDigit}`;
  }
}

export class PriceFormatter {
  static format(amount: number): number {
    return parseFloat(amount.toFixed(COMMERCE_CONSTANTS.PRICE_PRECISION));
  }
}

export class WeightFormatter {
  static format(grams: number): number {
    return parseFloat(grams.toFixed(COMMERCE_CONSTANTS.WEIGHT_PRECISION));
  }
}

export class DimensionFormatter {
  static format(cm: number): number {
    return parseFloat(cm.toFixed(COMMERCE_CONSTANTS.DIMENSION_PRECISION));
  }
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
) {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
}

export async function generateUnique(
  generator: () => string,
  checker: (val: string) => Promise<any>,
): Promise<string> {
  let val = generator();
  while (await checker(val)) val = generator();
  return val;
}
