'use client';

import { useRecentlyViewed } from './recently-viewed.hooks';

interface Props {
  userId: string | null;
  maxItems?: number;
}

export function RecentlyViewedSection({ userId, maxItems = 10 }: Props) {
  const { items, loading } = useRecentlyViewed(userId);

  if (loading || items.length === 0) return null;

  const display = items.slice(0, maxItems);

  return (
    <section className="w-full">
      <h2 className="text-xl font-semibold mb-4">Recently Viewed</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {display.map((item) => (
          <a
            key={item.productId}
            href={`/products/${item.slug ?? item.productId}`}
            className="flex-shrink-0 w-40 rounded-lg border p-3 hover:shadow-md transition-shadow"
          >
            <p className="text-sm font-medium truncate">{item.name}</p>
            {item.salePrice != null && (
              <p className="text-sm text-gray-600 mt-1">
                ₹{Number(item.salePrice).toLocaleString()}
                {item.basePrice != null && Number(item.basePrice) > Number(item.salePrice) && (
                  <span className="line-through text-xs text-gray-400 ml-1">
                    ₹{Number(item.basePrice).toLocaleString()}
                  </span>
                )}
              </p>
            )}
          </a>
        ))}
      </div>
    </section>
  );
}
