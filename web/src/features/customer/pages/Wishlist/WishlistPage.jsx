import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Store, Heart, ShoppingBag, Star, MapPin, Trash2 } from 'lucide-react';
import { useWishlist } from '@core/contexts';
import { useCustomerAuth } from '@core/contexts';
import PremiumImage from '@core/components/ui/PremiumImage';
import { IMAGES } from '@core/services';
import ProductCard from '@core/components/commerce/ProductCard';
import EmptyState from '@core/components/ui/EmptyState';
import Button from '@core/components/ui/Button';
import IconButton from '@core/components/ui/IconButton';

export default function WishlistPage() {
  const navigate = useNavigate();
  const { items, loading, remove } = useWishlist();
  const { isAuthenticated } = useCustomerAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fff8f2] flex items-center justify-center">
        <EmptyState
          title="Sign in to View Wishlist"
          description="Please sign in to view and manage your wishlist items."
          actionLabel="Go Home"
          onAction={() => navigate('/')}
          icon={Heart}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff8f2] font-sans text-[#1f1b14] antialiased">
      <header className="sticky top-0 z-50 bg-[#fff8f2]/90 backdrop-blur-xl border-b border-[#d2c5b1]/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <IconButton
              icon={ArrowLeft}
              onClick={() => navigate('/products')}
              ariaLabel="Back to Shop"
            />
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-7 h-7 bg-[#c89b3c] rounded-lg flex items-center justify-center">
                <Store className="text-white" size={14} />
              </div>
              <span className="text-sm font-serif font-black tracking-wider">
                VS <span className="text-[#c89b3c]">Boutique</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center space-x-3 mb-8">
          <Heart size={24} className="text-[#c89b3c]" />
          <h1 className="text-2xl font-serif font-black text-[#1f1b14]">My Wishlist</h1>
          <span className="text-sm text-gray-400 font-medium">({items.length} items)</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="bg-white rounded-[2rem] p-4 shadow-card space-y-4 animate-pulse border border-gray-100">
                <div className="w-full h-48 bg-gray-200 rounded-2xl"></div>
                <div className="h-5 bg-gray-200 rounded-lg w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded-lg w-1/2"></div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="Your Wishlist is Empty"
            description="Browse our products and add items you love to your wishlist."
            actionLabel="Browse Products"
            onAction={() => navigate('/products')}
            icon={Heart}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => {
              const p = item.product;
              if (!p) return null;
              return (
                <ProductCard
                  key={item.id}
                  product={p}
                  onWishlistClick={(id) => remove(id)}
                />
              );
            })}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-[#d2c5b1]/20 py-8 mt-8">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <span className="text-sm font-serif font-black tracking-wider text-[#1f1b14]">VS <span className="text-[#c89b3c]">Boutique</span></span>
          <p className="text-[10px] text-gray-400 font-medium">© {new Date().getFullYear()} VS Boutique</p>
        </div>
      </footer>
    </div>
  );
}
