export interface RecentlyViewedItem {
  productId: string;
  name: string;
  slug?: string;
  basePrice?: number;
  salePrice?: number;
  viewedAt: string;
}

export interface RecentlyViewedStorageItem {
  productId: string;
  viewedAt: string;
}
