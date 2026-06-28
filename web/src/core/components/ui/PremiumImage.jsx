import { useState } from 'react';
import { resolveProductImage, getUnsplashSrcSet, IMAGES } from '../../../services/imageConfig';
import Skeleton from './Skeleton';

/**
 * Premium Image Component for VS Boutique.
 * Automatically handles:
 * - Centralized luxury image resolution (for products, categories, etc.)
 * - Responsive images using dynamic Unsplash srcSet
 * - Skeleton loaders during image loading
 * - Smooth fade-in transitions on load
 * - Graceful fallback on load error
 * - Lazy-loading by default
 */
export default function PremiumImage({
  src,
  alt = 'VS Boutique Fashion',
  className = '',
  category = '',
  productName = '',
  loading = 'lazy',
  aspectRatio = 'aspect-[3/4]',
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Resolve the image using the centralized config if needed
  const resolvedSrc = resolveProductImage(productName, category, src);

  const [prevSrc, setPrevSrc] = useState(resolvedSrc);
  if (resolvedSrc !== prevSrc) {
    setPrevSrc(resolvedSrc);
    setIsLoaded(false);
    setHasError(false);
  }

  // Handle fallback if loading fails
  const handleImageError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  // Generate responsive srcSet for Unsplash images
  const srcSet = getUnsplashSrcSet(resolvedSrc);
  const sizes = srcSet ? '(max-width: 640px) 640px, (max-width: 1024px) 1080px, 1600px' : undefined;

  // Render the final source URL or fallback
  const finalSrc = hasError ? IMAGES.placeholder : resolvedSrc;

  return (
    <div className={`relative overflow-hidden ${aspectRatio} ${className}`} {...props}>
      {/* Skeleton Shimmer Loader */}
      {!isLoaded && (
        <div className="absolute inset-0 z-10">
          <Skeleton variant="rect" width="100%" height="100%" className="bg-gray-100 dark:bg-gray-800" />
        </div>
      )}

      {/* Actual Image Element */}
      <img
        src={finalSrc}
        srcSet={hasError ? undefined : srcSet}
        sizes={hasError ? undefined : sizes}
        alt={alt}
        loading={loading}
        onError={handleImageError}
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
