import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Heart, Star, ChevronLeft, ShoppingBag, Share2, Minus, Plus, Shield, Truck, Check, Award, Clock, Sparkles, Pencil, Trash2, ThumbsUp, MessageSquare } from 'lucide-react';
import CustomerLayout from '../../../../components/CustomerLayout';
import ReviewModal from '@core/components/shared/ReviewModal';
import { getPublicProduct, getPublicProducts } from '@core/services';
import { useCustomerAuth } from '@core/contexts';
import { useWishlist } from '@core/contexts';
import { useCart } from '@core/contexts';
import { useReview } from '@core/contexts';
import OtpModal from '@core/components/shared/OtpModal';
import PremiumImage from '@core/components/ui/PremiumImage';

const FEATURES = [
  { icon: Truck, label: 'Free Delivery', sub: 'On orders above ₹499' },
  { icon: Shield, label: 'Secure Payment', sub: '100% secure checkout' },
  { icon: Award, label: 'Quality Guarantee', sub: '7-day return policy' },
  { icon: Clock, label: 'Easy Exchange', sub: 'Size issues? We fix it' },
];

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const CustomerProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, customer } = useCustomerAuth();
  const { items: wishlistItems, add: addWishlist, remove: removeWishlist } = useWishlist();
  const { addItem: addCartItem } = useCart();
  const { useReviews } = useReview();
  const [showOtp, setShowOtp] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getPublicProduct(id),
  });

  const { data: similarData } = useQuery({
    queryKey: ['product-similar', id],
    queryFn: () => getPublicProducts({ category: product?.data?.category, limit: 6 }),
    enabled: !!product?.data?.category,
  });

  const { reviews, summary, loading: reviewsLoading, addReview, editReview, removeReview, isAdding, isEditing } = useReviews(id);

  const productData = product?.data;
  const similar = (similarData?.data || []).filter(p => p.id !== id).slice(0, 4);
  const wishlistIds = new Set(wishlistItems.map(w => w.productId));
  const isWishlisted = wishlistIds.has(productData?.id);

  const images = productData?.images || [];
  const variants = productData?.variants || [];
  const currentVariant = selectedVariant
    ? variants.find(v => v.id === selectedVariant)
    : variants[0];

  const displayReviews = showAllReviews ? reviews : reviews?.slice(0, 3);
  const currentUserId = customer?.id;

  const avgRating = summary?.averageRating || productData?.averageRating || 0;
  const reviewCount = summary?.totalReviews || productData?.reviewCount || 0;
  const breakdown = summary?.breakdown || {};

  useEffect(() => {
    if (productData) {
      try {
        const prev = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        const updated = [{ id: productData.id, name: productData.name, price: productData.basePrice, image: productData.images?.[0]?.url || '' }, ...prev.filter(p => p.id !== productData.id)];
        localStorage.setItem('recentlyViewed', JSON.stringify(updated.slice(0, 10)));
      } catch { /* localStorage not available */ }
    }
  }, [productData]);

  const handleAddToCart = useCallback(async () => {
    if (!isAuthenticated) { setShowOtp(true); return; }
    try {
      await addCartItem({ productId: productData.id, variantId: currentVariant?.id || null, quantity: qty });
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to add to cart');
    }
  }, [isAuthenticated, productData, currentVariant, qty, addCartItem]);

  const handleOpenReviewModal = () => {
    if (!isAuthenticated) { setShowOtp(true); return; }
    setEditingReview(null);
    setShowReviewModal(true);
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (data) => {
    if (editingReview) {
      await editReview({ reviewId: editingReview.id, data });
    } else {
      await addReview(data);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    await removeReview(reviewId);
  };

  const maxBreakdownCount = Math.max(...Object.values(breakdown), 1);

  if (isLoading) return (
    <CustomerLayout>
      <div className="animate-pulse">
        <div className="h-80 md:h-96 bg-gray-200" />
        <div className="p-4 space-y-4 -mt-8 relative z-10">
          <div className="bg-white rounded-3xl p-5 space-y-4">
            <div className="h-6 bg-gray-200 rounded-xl w-3/4" />
            <div className="h-4 bg-gray-200 rounded-xl w-1/2" />
            <div className="h-8 bg-gray-200 rounded-xl w-1/3" />
            <div className="h-16 bg-gray-200 rounded-2xl" />
            <div className="h-12 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    </CustomerLayout>
  );

  if (error || !productData) return (
    <CustomerLayout>
      <div className="text-center py-20">
        <div className="text-5xl mb-4">😕</div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Product Not Found</h3>
        <p className="text-sm text-gray-400 mb-6">This product may have been removed or is unavailable</p>
        <button onClick={() => navigate('/customer/shop')} className="px-8 py-3.5 bg-primary text-white rounded-2xl text-sm font-semibold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all">
          Browse Products
        </button>
      </div>
    </CustomerLayout>
  );

  return (
    <CustomerLayout>
      <div className="pb-28 md:pb-8">
        {/* Image Gallery */}
        <div className="relative md:flex md:gap-4 md:max-w-[1400px] md:mx-auto md:px-6 md:pt-6">
          <div className="md:flex-1 md:sticky md:top-20 md:self-start">
            <div className="relative h-80 md:h-[500px] bg-gray-50 flex items-center justify-center overflow-hidden rounded-none md:rounded-3xl w-full">
              <PremiumImage
                src={images[imgIdx]?.url}
                alt={productData.name}
                productName={productData.name}
                category={productData.category}
                aspectRatio="absolute inset-0"
                className="w-full h-full object-cover"
              />
              <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2.5 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm hover:bg-white transition-all z-10">
                <ChevronLeft size={20} className="text-gray-700" />
              </button>
              <button onClick={() => isWishlisted ? removeWishlist(productData.id) : addWishlist(productData.id)}
                className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm hover:bg-white hover:scale-110 transition-all z-10">
                <Heart size={20} className={isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-400'} />
              </button>
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 md:hidden">
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setImgIdx(i)}
                      className={`rounded-full transition-all ${i === imgIdx ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/50'}`} />
                  ))}
                </div>
              )}
            </div>
            {/* Desktop Thumbnails */}
            {images.length > 1 && (
              <div className="hidden md:flex mt-3 space-x-2">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all relative ${
                      i === imgIdx ? 'border-primary opacity-100' : 'border-transparent opacity-60 hover:opacity-80'
                    }`}>
                    <PremiumImage
                      src={img.url}
                      alt=""
                      productName={productData.name}
                      category={productData.category}
                      aspectRatio="absolute inset-0"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="md:flex-1 md:max-w-[600px]">
            {/* Product Info */}
            <div className="px-4 md:px-0 -mt-4 md:mt-0 relative z-10">
              <div className="bg-white rounded-3xl p-5 md:rounded-2xl md:shadow-none md:p-0 shadow-sm border border-gray-50 md:border-0 space-y-4">
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h1 className="text-xl md:text-2xl font-bold text-gray-900 font-serif">{productData.name}</h1>
                      <p className="text-sm text-gray-400 mt-0.5">{productData.boutique?.name}</p>
                    </div>
                    <button className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all">
                      <Share2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="flex items-center space-x-0.5">
                      <Star size={14} className="text-amber-400 fill-amber-400" />
                      <span className="text-sm font-semibold text-gray-900">{avgRating ? Number(avgRating).toFixed(1) : '0.0'}</span>
                    </div>
                    <span className="text-xs text-gray-400">({reviewCount} reviews)</span>
                    <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-lg flex items-center space-x-0.5">
                      <Check size={10} /> <span>In Stock</span>
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-gray-900">₹{currentVariant?.price || productData.basePrice}</span>
                  {(currentVariant?.compareAtPrice || productData.compareAtPrice) && (
                    <>
                      <span className="text-sm text-gray-400 line-through">₹{currentVariant?.compareAtPrice || productData.compareAtPrice}</span>
                      <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-lg">
                        -{Math.round((1 - (currentVariant?.price || productData.basePrice) / (currentVariant?.compareAtPrice || productData.compareAtPrice)) * 100)}%
                      </span>
                    </>
                  )}
                </div>

                {/* Delivery Estimate */}
                <div className="bg-gradient-to-r from-primary/5 to-primary/5 rounded-2xl p-4">
                  <div className="flex items-center space-x-3">
                    <Truck size={18} className="text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Estimated Delivery</p>
                      <p className="text-xs text-gray-400">Free delivery on orders above ₹499</p>
                    </div>
                  </div>
                </div>

                {/* Variants */}
                {variants.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Select Variant</p>
                    <div className="grid grid-cols-2 gap-2">
                      {variants.map(v => (
                        <button key={v.id} onClick={() => setSelectedVariant(v.id)}
                          className={`px-4 py-3 rounded-xl text-xs font-semibold transition-all border ${
                            selectedVariant === v.id || (!selectedVariant && v === variants[0])
                              ? 'border-primary bg-primary/5 text-primary shadow-sm'
                              : 'border-gray-100 text-gray-600 hover:border-gray-200'
                          }`}>
                          <span className="block">{v.name}</span>
                          <span className="block mt-0.5 text-primary">₹{v.price}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</p>
                  <div className="flex items-center space-x-3 bg-gray-50 rounded-xl p-1">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-1.5 hover:bg-white rounded-lg transition-colors">
                      <Minus size={14} />
                    </button>
                    <span className="text-base font-bold text-gray-900 w-8 text-center">{qty}</span>
                    <button onClick={() => setQty(qty + 1)} className="p-1.5 hover:bg-white rounded-lg transition-colors">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {FEATURES.map(({ icon: Icon, label, sub }) => (
                    <div key={label} className="flex items-start space-x-2 p-2">
                      <Icon size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[11px] font-semibold text-gray-900">{label}</p>
                        <p className="text-[9px] text-gray-400">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Review Summary */}
            <div className="px-4 md:px-0 mt-4">
              <div className="bg-white rounded-3xl p-5 md:rounded-2xl shadow-sm border border-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900">Reviews</h3>
                  <button onClick={handleOpenReviewModal}
                    className="text-xs font-semibold text-primary bg-primary/5 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-all">
                    Write a Review
                  </button>
                </div>

                {reviewsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
                  </div>
                ) : reviewCount > 0 ? (
                  <>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="text-center">
                        <span className="text-4xl font-bold text-gray-900">{Number(avgRating).toFixed(1)}</span>
                        <div className="flex items-center justify-center mt-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={10}
                              className={`${s <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                          ))}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">{reviewCount} reviews</p>
                      </div>
                      <div className="flex-1 space-y-1">
                        {[5, 4, 3, 2, 1].map(r => {
                          const count = breakdown[r] || 0;
                          const pct = maxBreakdownCount > 0 ? (count / maxBreakdownCount) * 100 : 0;
                          return (
                            <div key={r} className="flex items-center space-x-2">
                              <span className="text-[10px] text-gray-400 w-3">{r}</span>
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-[10px] text-gray-400 w-4">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {displayReviews.map(review => {
                        const isOwn = review.userId === currentUserId;
                        return (
                          <div key={review.id} className="border-t border-gray-50 pt-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-primary/5 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-bold text-primary">
                                    {(review.user?.name || 'A')[0].toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <p className="text-sm font-semibold text-gray-900">{review.user?.name || 'Anonymous'}</p>
                                    {review.isVerifiedPurchase && (
                                      <span className="flex items-center space-x-0.5 text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                        <ThumbsUp size={8} /> <span>Verified</span>
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2 mt-0.5">
                                    <div className="flex items-center space-x-0.5">
                                      {[1, 2, 3, 4, 5].map(s => (
                                        <Star key={s} size={10}
                                          className={`${s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                                      ))}
                                    </div>
                                    <span className="text-[10px] text-gray-400">{formatDate(review.createdAt)}</span>
                                  </div>
                                </div>
                              </div>
                              {isOwn && (
                                <div className="flex items-center space-x-1">
                                  <button onClick={() => handleEditReview(review)}
                                    className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-primary transition-colors">
                                    <Pencil size={14} />
                                  </button>
                                  <button onClick={() => handleDeleteReview(review.id)}
                                    className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                            {review.title && (
                              <p className="text-sm font-semibold text-gray-900 mt-2">{review.title}</p>
                            )}
                            {review.comment && (
                              <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                            )}
                            {review.reply && (
                              <div className="mt-2 ml-4 pl-3 border-l-2 border-primary/20 bg-gray-50 rounded-r-xl p-3">
                                <div className="flex items-center space-x-1.5 mb-1">
                                  <MessageSquare size={12} className="text-primary" />
                                  <span className="text-[11px] font-semibold text-primary">Store Reply</span>
                                </div>
                                <p className="text-xs text-gray-600">{review.reply}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {reviews.length > 3 && (
                      <button onClick={() => setShowAllReviews(!showAllReviews)}
                        className="w-full mt-4 py-2.5 text-xs font-semibold text-primary bg-primary/5 rounded-xl hover:bg-primary/10 transition-all">
                        {showAllReviews ? 'Show Less' : `See All ${reviews.length} Reviews`}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Star size={32} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-sm text-gray-400 font-medium">No reviews yet</p>
                    <p className="text-xs text-gray-300 mt-1">Be the first to review this product</p>
                    {isAuthenticated && (
                      <button onClick={handleOpenReviewModal}
                        className="mt-4 px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-semibold hover:-translate-y-0.5 transition-all shadow-md">
                        Write a Review
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Similar Products */}
            {similar.length > 0 && (
              <div className="px-4 md:px-0 mt-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                  <Sparkles size={14} className="text-primary mr-1.5" /> Similar Products
                </h3>
                <div className="flex space-x-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
                  {similar.map(p => (
                    <div key={p.id} onClick={() => navigate(`/customer/shop/${p.id}`)}
                      className="min-w-[140px] bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden flex-shrink-0 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                      <div className="h-32 bg-gray-50 relative overflow-hidden">
                        <PremiumImage
                          src={p.images?.[0]?.url}
                          alt={p.name}
                          productName={p.name}
                          category={p.category?.name || p.category}
                          aspectRatio="absolute inset-0"
                          className="w-full h-full object-cover"
                        />
                        {p.compareAtPrice && (
                          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-red-500 text-white text-[8px] font-bold rounded-lg">
                            -{Math.round((1 - p.basePrice / p.compareAtPrice) * 100)}%
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="text-[11px] font-semibold text-gray-900 truncate">{p.name}</p>
                        <p className="text-xs font-bold text-gray-900 mt-0.5">₹{p.basePrice}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Add to Cart Button */}
        <div className="hidden md:block fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">₹{currentVariant?.price || productData.basePrice}</p>
              {(currentVariant?.compareAtPrice || productData.compareAtPrice) && (
                <span className="text-sm text-gray-400 line-through">₹{currentVariant?.compareAtPrice || productData.compareAtPrice}</span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={() => isWishlisted ? removeWishlist(productData.id) : addWishlist(productData.id)}
                className="p-3.5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                <Heart size={20} className={isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-400'} />
              </button>
              <button onClick={handleAddToCart}
                className="px-8 py-3.5 bg-primary text-white rounded-2xl font-semibold text-sm shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all flex items-center space-x-2">
                {addedToCart ? <><Check size={18} /><span>Added!</span></> : <><ShoppingBag size={18} /><span>Add to Cart</span></>}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Bottom Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-20 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="max-w-lg mx-auto flex items-center space-x-3">
            <button onClick={() => isWishlisted ? removeWishlist(productData.id) : addWishlist(productData.id)}
              className="p-3.5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
              <Heart size={20} className={isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-400'} />
            </button>
            <button onClick={handleAddToCart}
              className="flex-1 py-3.5 bg-primary text-white rounded-2xl font-semibold text-sm shadow-lg shadow-primary/20 flex items-center justify-center space-x-2">
              {addedToCart ? <><Check size={18} /><span>Added!</span></> : <><ShoppingBag size={18} /><span>Add to Cart</span></>}
            </button>
          </div>
        </div>
      </div>

      <ReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleSubmitReview}
        saving={isAdding || isEditing}
        initial={editingReview ? { rating: editingReview.rating, comment: editingReview.comment } : null}
      />

      {showOtp && <OtpModal onClose={() => setShowOtp(false)} />}
    </CustomerLayout>
  );
};

export default CustomerProductDetail;
