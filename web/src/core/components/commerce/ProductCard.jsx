import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, MapPin, Heart } from 'lucide-react';
import { useWishlist } from '../../contexts';
import { useCustomerAuth } from '../../contexts';
import { useCart } from '../../contexts';
import OtpModal from '../shared/OtpModal';
import Card from '../ui/Card';
import Button from '../ui/Button';
import RatingComponent from './RatingComponent';
import PriceComponent from './PriceComponent';
import AvailabilityBadge from './AvailabilityBadge';
import DiscountBadge from './DiscountBadge';
import PremiumImage from '../ui/PremiumImage';

function getLowestPrice(variants) {
  if (!variants || variants.length === 0) return null;
  return Math.min(...variants.map(v => Number(v.price)).filter(Boolean));
}

function getStockStatus(variants) {
  if (!variants || variants.length === 0) return 'unknown';
  const allOutOfStock = variants.every(v => v.inventory?.trackInventory && v.inventory?.quantity <= 0);
  const anyLow = variants.some(v => v.inventory?.trackInventory && v.inventory?.quantity > 0 && v.inventory?.quantity <= (v.inventory?.lowStockThreshold || 5));
  if (allOutOfStock) return 'out_of_stock';
  if (anyLow) return 'low_stock';
  return 'in_stock';
}

export default function ProductCard({ product, onWishlistClick }) {
  const navigate = useNavigate();
  const [showOtp, setShowOtp] = useState(false);
  const { isWishlisted } = useWishlist();
  const { isAuthenticated } = useCustomerAuth();
  const { addItem } = useCart();
  
  const lowestPrice = getLowestPrice(product.variants);
  const stockStatus = getStockStatus(product.variants);
  const wishlisted = isWishlisted(product.id);
  const inStock = stockStatus !== 'out_of_stock';

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) { setShowOtp(true); return; }
    try {
      const firstVariant = product.variants?.[0];
      await addItem({
        productId: product.id,
        variantId: firstVariant?.id || null,
        quantity: 1,
      });
    } catch { /* ignore */ }
  };

  return (
    <Card
      onClick={() => navigate(`/products/${product.id}`)}
      className="flex flex-col relative h-full cursor-pointer select-none group"
      isHoverable
    >
      <div className="relative w-full overflow-hidden bg-gray-50 dark:bg-gray-800">
        <PremiumImage
          src={product.images?.[0]?.url}
          alt={product.name}
          productName={product.name}
          category={product.category?.name || product.category}
          aspectRatio="aspect-[3/4]"
          className="group-hover:scale-105 transition-transform duration-500"
        />
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); if (onWishlistClick) onWishlistClick(product.id); }}
          className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-md cursor-pointer ${
            wishlisted
              ? 'bg-accent text-white'
              : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:bg-accent hover:text-white'
          }`}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={16} className={wishlisted ? 'fill-current' : ''} />
        </button>
        {stockStatus !== 'in_stock' && (
          <div className="absolute top-4 left-4">
            <AvailabilityBadge status={stockStatus} />
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4 bg-white dark:bg-gray-900">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <h4 className="text-sm font-serif font-black text-gray-900 dark:text-gray-100 group-hover:text-accent transition-colors line-clamp-1 flex-1">
              {product.name}
            </h4>
            <RatingComponent
              rating={product.averageRating}
              reviewsCount={product.reviewCount}
              size="sm"
              className="shrink-0"
            />
          </div>

          <div className="flex justify-between items-center">
            {product.boutique && (
              <p className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-wider flex items-center">
                <MapPin size={10} className="text-accent mr-1 shrink-0" />
                <span className="truncate">{product.boutique.name}{product.boutique.city ? `, ${product.boutique.city}` : ''}</span>
              </p>
            )}
            
            {product.compareAtPrice > 0 && lowestPrice !== null && (
              <DiscountBadge price={lowestPrice} originalPrice={product.compareAtPrice} />
            )}
          </div>

          <PriceComponent
            price={lowestPrice !== null ? lowestPrice : product.basePrice}
            originalPrice={product.compareAtPrice}
            size="md"
            className="pt-1 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="flex space-x-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddToCart}
            disabled={!inStock}
            className="flex-1 flex items-center justify-center gap-1.5 py-3"
          >
            <ShoppingBag size={12} />
            <span>Add to Cart</span>
          </Button>
          <Button
            variant="luxury"
            size="sm"
            onClick={(e) => { e.stopPropagation(); navigate(`/products/${product.id}`); }}
            className="py-3 px-4 shrink-0"
          >
            View
          </Button>
        </div>
      </div>

      {showOtp && <OtpModal onClose={() => setShowOtp(false)} />}
    </Card>
  );
}
