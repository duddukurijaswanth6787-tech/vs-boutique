import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Store, Star, MapPin, Tag, ShieldCheck, Clock, Package, ChevronLeft, ChevronRight, Heart, Loader2, Check, ShoppingBag } from 'lucide-react';
import { getPublicProduct } from '@core/services';
import { useWishlist } from '@core/contexts';
import { useCustomerAuth } from '@core/contexts';
import { useCart } from '@core/contexts';
import OtpModal from '@core/components/shared/OtpModal';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const { isWishlisted, add, remove } = useWishlist();
  const { isAuthenticated } = useCustomerAuth();
  const { addItem } = useCart();
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const { data: fetchResult, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getPublicProduct(id),
  });

  const product = fetchResult?.data || fetchResult;
  const error = queryError?.message || (queryError ? 'Failed to load product details.' : '');

  useEffect(() => {
    if (product?.variants?.length > 0 && !selectedVariant) {
      setSelectedVariant(product.variants[0]);
    }
  }, [product]);


  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff8f2] flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-[#c89b3c]/30 border-t-[#c89b3c] rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium text-gray-500">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#fff8f2] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto px-6">
          <Package className="w-16 h-16 text-gray-300 mx-auto" />
          <h2 className="text-xl font-serif font-bold text-gray-800">Product Not Found</h2>
          <p className="text-sm text-gray-500">{error || 'The product you are looking for does not exist or has been removed.'}</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-[#c89b3c] text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-[#b8892e] transition-all cursor-pointer"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : [{ url: 'https://placehold.co/600x700/f5efe6/c89b3c?text=No+Image', isPrimary: true }];
  const currentImage = images[selectedImageIndex] || images[0];
  const hasSale = product.compareAtPrice && Number(product.compareAtPrice) > 0 && Number(product.compareAtPrice) > (selectedVariant ? Number(selectedVariant.price) : Number(product.basePrice));
  const inventory = selectedVariant?.inventory;
  const inStock = !inventory?.trackInventory || (inventory?.quantity > 0);

  return (
    <div className="min-h-screen bg-[#fff8f2] font-sans text-[#1f1b14] antialiased">
      <header className="sticky top-0 z-50 bg-[#fff8f2]/90 backdrop-blur-xl border-b border-[#d2c5b1]/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/products')}
              className="flex items-center space-x-2 text-[#1f1b14] hover:text-[#c89b3c] transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-bold">Products</span>
            </button>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="relative bg-white rounded-[2rem] overflow-hidden shadow-card border border-[#d2c5b1]/20 aspect-[4/5]">
              <img
                src={currentImage.url}
                alt={currentImage.alt || product.name}
                className="w-full h-full object-cover"
              />
              {hasSale && (
                <span className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm">
                  Sale
                </span>
              )}
              {!inStock && (
                <span className="absolute top-4 right-4 bg-gray-800/80 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm">
                  Out of Stock
                </span>
              )}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex(i => Math.max(0, i - 1))}
                    disabled={selectedImageIndex === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md disabled:opacity-30 hover:bg-white transition-all cursor-pointer"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex(i => Math.min(images.length - 1, i + 1))}
                    disabled={selectedImageIndex === images.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md disabled:opacity-30 hover:bg-white transition-all cursor-pointer"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-2">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      idx === selectedImageIndex ? 'border-[#c89b3c] shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt={img.alt || ''} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-[10px] font-semibold text-gray-400">
              <button onClick={() => navigate('/')} className="hover:text-[#c89b3c] cursor-pointer">Home</button>
              <span>/</span>
              <button onClick={() => navigate('/products')} className="hover:text-[#c89b3c] cursor-pointer">Products</button>
              {product.category && (
                <>
                  <span>/</span>
                  <span className="text-[#1f1b14]">{product.category.name}</span>
                </>
              )}
            </div>

            {/* Title & Rating */}
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-black text-[#1f1b14]">{product.name}</h1>
              <div className="flex items-center space-x-4 mt-2">
                {product.averageRating > 0 && (
                  <div className="flex items-center space-x-1 text-[#c89b3c] text-sm">
                    <Star size={16} className="fill-current" />
                    <span className="font-bold">{Number(product.averageRating).toFixed(1)}</span>
                    <span className="text-gray-400 font-medium">({product.reviewCount || 0} reviews)</span>
                  </div>
                )}
                {product.boutique && (
                  <div className="flex items-center space-x-1 text-gray-500 text-xs">
                    <MapPin size={12} />
                    <span className="font-semibold">{product.boutique.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline space-x-3">
              {selectedVariant ? (
                <>
                  <span className="text-3xl font-black text-[#1f1b14]">₹{Number(selectedVariant.price)}</span>
                  {selectedVariant.compareAtPrice && Number(selectedVariant.compareAtPrice) > Number(selectedVariant.price) && (
                    <span className="text-lg text-gray-400 line-through font-medium">
                      ₹{Number(selectedVariant.compareAtPrice).toLocaleString()}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="text-3xl font-black text-[#1f1b14]">₹{Number(product.basePrice)}</span>
                  {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.basePrice) && (
                    <span className="text-lg text-gray-400 line-through font-medium">
                      ₹{Number(product.compareAtPrice).toLocaleString()}
                    </span>
                  )}
                </>
              )}
              {hasSale && (
                <span className="bg-red-100 text-red-600 text-[10px] font-black px-2.5 py-1 rounded-lg">
                  {Math.round((1 - (selectedVariant ? Number(selectedVariant.price) : Number(product.basePrice)) / Number(product.compareAtPrice)) * 100)}% OFF
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Description</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}
            {product.shortDescription && !product.description && (
              <p className="text-sm text-gray-700 leading-relaxed">{product.shortDescription}</p>
            )}

            {/* Variant Selection */}
            {product.variants?.length > 0 && (
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">
                  Variant {selectedVariant ? `- ${selectedVariant.name}` : ''}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((v) => {
                    const vInv = v.inventory;
                    const vInStock = !vInv?.trackInventory || vInv?.quantity > 0;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        disabled={!vInStock}
                        className={`px-5 py-3 rounded-xl text-sm font-bold border transition-all duration-200 cursor-pointer ${
                          selectedVariant?.id === v.id
                            ? 'bg-[#c89b3c] border-[#c89b3c] text-white shadow-md shadow-[#c89b3c]/20'
                            : vInStock
                            ? 'bg-white border-[#d2c5b1]/30 text-[#1f1b14] hover:border-[#c89b3c]'
                            : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <span className="block">{v.name}</span>
                        <span className={`block text-[10px] mt-0.5 ${selectedVariant?.id === v.id ? 'text-white/80' : 'text-gray-400'}`}>
                          ₹{Number(v.price)}
                          {!vInStock && ' - Out of Stock'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Inventory Status */}
            <div className="flex items-center space-x-3">
              {inStock ? (
                <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2.5 rounded-xl">
                  <ShieldCheck size={16} />
                  <span className="text-xs font-bold">
                    {inventory?.trackInventory
                      ? inventory.quantity <= (inventory.lowStockThreshold || 5)
                        ? `Only ${inventory.quantity} left`
                        : 'In Stock'
                      : 'Available'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 bg-red-50 text-red-600 px-4 py-2.5 rounded-xl">
                  <Clock size={16} />
                  <span className="text-xs font-bold">Out of Stock</span>
                </div>
              )}
            </div>

            {/* Wishlist Button */}
            <div className="pt-1">
              <button
                onClick={async () => {
                  if (!isAuthenticated) return;
                  setWishlistLoading(true);
                  if (isWishlisted(product.id)) {
                    await remove(product.id);
                  } else {
                    await add(product.id);
                  }
                  setWishlistLoading(false);
                }}
                disabled={!isAuthenticated || wishlistLoading}
                className={`w-full font-black py-3.5 px-8 rounded-2xl text-sm flex items-center justify-center space-x-2 transition-all duration-300 cursor-pointer border ${
                  isWishlisted(product.id)
                    ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                    : isAuthenticated
                    ? 'bg-[#fff8f2] border-[#d2c5b1]/30 text-[#1f1b14] hover:border-[#c89b3c] hover:text-[#c89b3c]'
                    : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {wishlistLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Heart size={16} className={isWishlisted(product.id) ? 'fill-current' : ''} />
                )}
                <span>
                  {!isAuthenticated
                    ? 'Sign in to Wishlist'
                    : isWishlisted(product.id)
                    ? 'Remove from Wishlist'
                    : 'Add to Wishlist'}
                </span>
              </button>
            </div>

            {/* Brand & Tags */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              {product.brand && (
                <div className="bg-white rounded-xl p-4 border border-[#d2c5b1]/20">
                  <div className="flex items-center space-x-2 text-[#c89b3c] mb-1">
                    <Tag size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Brand</span>
                  </div>
                  <p className="text-sm font-bold">{product.brand.name}</p>
                </div>
              )}
              {product.productType && (
                <div className="bg-white rounded-xl p-4 border border-[#d2c5b1]/20">
                  <div className="flex items-center space-x-2 text-[#c89b3c] mb-1">
                    <Package size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Type</span>
                  </div>
                  <p className="text-sm font-bold">{product.productType.replace(/_/g, ' ')}</p>
                </div>
              )}
            </div>

            {product.tags?.length > 0 && (
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="bg-[#c89b3c]/5 text-[#c89b3c] text-[10px] font-bold px-3 py-1.5 rounded-full border border-[#c89b3c]/20"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Delivery Info */}
            <div className="bg-white rounded-[1.5rem] p-5 border border-[#d2c5b1]/20 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Delivery Information</h3>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-8 h-8 bg-[#c89b3c]/10 rounded-lg flex items-center justify-center shrink-0">
                  <Clock size={16} className="text-[#c89b3c]" />
                </div>
                <div>
                  <p className="font-bold text-xs">Delivery Type</p>
                  <p className="text-gray-500 text-xs">{(product.deliveryType || 'STANDARD').replace(/_/g, ' ')}</p>
                </div>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="pt-2">
              <button
                onClick={async () => {
                  if (!isAuthenticated) { setShowOtp(true); return; }
                  try {
                    await addItem({ productId: product.id, variantId: selectedVariant?.id || null, quantity: 1 });
                    setAddedToCart(true);
                    setTimeout(() => setAddedToCart(false), 2500);
                  } catch (err) {
                    alert(err?.response?.data?.message || 'Failed to add to cart');
                  }
                }}
                disabled={!inStock}
                className={`w-full font-black py-4 px-8 rounded-2xl text-sm flex items-center justify-center space-x-2 transition-all duration-300 cursor-pointer border ${
                  !inStock
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-200'
                    : addedToCart
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-[#c89b3c] text-white border-[#c89b3c] hover:bg-[#b8892e] shadow-lg shadow-[#c89b3c]/20'
                }`}
              >
                {addedToCart ? <Check size={18} /> : <ShoppingBag size={18} />}
                <span>{addedToCart ? 'Added to Cart!' : 'Add to Cart'}</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-[#d2c5b1]/20 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <span className="text-sm font-serif font-black tracking-wider text-[#1f1b14]">
            VS <span className="text-[#c89b3c]">Boutique</span>
          </span>
          <p className="text-[10px] text-gray-400 font-medium">© {new Date().getFullYear()} VS Boutique</p>
        </div>
      </footer>
      {showOtp && <OtpModal onClose={() => setShowOtp(false)} />}
    </div>
  );
}
