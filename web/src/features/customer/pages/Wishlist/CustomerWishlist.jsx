import { useNavigate } from 'react-router-dom';
import { Heart, Star, ShoppingBag } from 'lucide-react';
import CustomerLayout from '../../../../components/CustomerLayout';
import { useWishlist } from '@core/contexts';
import { useCustomerAuth } from '@core/contexts';
import OtpModal from '@core/components/shared/OtpModal';
import { useState } from 'react';
import PremiumImage from '@core/components/ui/PremiumImage';
import { IMAGES } from '@core/services';
import ProductCard from '@core/components/commerce/ProductCard';
import EmptyState from '@core/components/ui/EmptyState';
import Button from '@core/components/ui/Button';

const CustomerWishlist = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useCustomerAuth();
  const { items, remove, loading } = useWishlist();
  const [showOtp, setShowOtp] = useState(false);

  if (!isAuthenticated) return (
    <CustomerLayout>
      <EmptyState
        title="Saved Items"
        description="Sign in to view and manage your wishlist"
        actionLabel="Sign In"
        onAction={() => setShowOtp(true)}
        icon={Heart}
      />
      {showOtp && <OtpModal onClose={() => setShowOtp(false)} />}
    </CustomerLayout>
  );

  return (
    <CustomerLayout>
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">My Wishlist</h1>
          <span className="text-sm text-gray-400">{items.length} items</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-52 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="Your Wishlist is Empty"
            description="Save your favorite items here"
            actionLabel="Browse Products"
            onAction={() => navigate('/customer/shop')}
            icon={Heart}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map(w => {
              const p = w.product;
              if (!p) return null;
              return (
                <ProductCard
                  key={w.id}
                  product={p}
                  onWishlistClick={(id) => remove(id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
};

export default CustomerWishlist;
