export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
  DISCONTINUED = 'DISCONTINUED',
}

export enum ProductType {
  READYMADE = 'READYMADE',
  WHOLESALE = 'WHOLESALE',
  FEATURED = 'FEATURED',
  NEW_ARRIVAL = 'NEW_ARRIVAL',
  BESTSELLER = 'BESTSELLER',
}

export enum GenderType {
  WOMEN = 'WOMEN',
  GIRLS = 'GIRLS',
  UNISEX = 'UNISEX',
}

export enum AgeGroup {
  AGE_4_6 = '4-6',
  AGE_7_9 = '7-9',
  AGE_10_12 = '10-12',
  AGE_13_17 = '13-17',
  AGE_18_22 = '18-22',
  AGE_23_29 = '23-29',
  AGE_30_35 = '30-35',
  AGE_35_PLUS = '35+',
}

export enum ProductVisibility {
  VISIBLE = 'VISIBLE',
  HIDDEN = 'HIDDEN',
  SEARCHABLE = 'SEARCHABLE',
}

export enum InventoryStatus {
  IN_STOCK = 'IN_STOCK',
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  BACKORDERED = 'BACKORDERED',
  DISCONTINUED = 'DISCONTINUED',
}

export enum StockMovementType {
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  SALES_ORDER = 'SALES_ORDER',
  RETURN = 'RETURN',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER = 'TRANSFER',
  WRITE_OFF = 'WRITE_OFF',
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  MODEL_3D = 'MODEL_3D',
}

export enum AttributeType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  COLOR = 'COLOR',
  DATE = 'DATE',
  SELECT = 'SELECT',
  MULTI_SELECT = 'MULTI_SELECT',
  SIZE = 'SIZE',
  IMAGE = 'IMAGE',
  URL = 'URL',
}

export enum PriceType {
  BASE = 'BASE',
  SALE = 'SALE',
  WHOLESALE = 'WHOLESALE',
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  BUY_X_GET_Y = 'BUY_X_GET_Y',
}

export enum VariantStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

export enum WarehouseStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
}
