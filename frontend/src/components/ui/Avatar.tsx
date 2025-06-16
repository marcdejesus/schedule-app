import React, { useState, useEffect } from 'react';
import { UserIcon } from '@heroicons/react/24/outline';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showLoadingState?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12', 
  lg: 'w-16 h-16',
  xl: 'w-32 h-32'
};

const iconSizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8', 
  xl: 'w-16 h-16'
};

// Helper function to resolve avatar URLs
const resolveAvatarUrl = (src?: string): string | undefined => {
  if (!src) {
    console.log('Avatar URL Resolution: No src provided');
    return undefined;
  }
  
  console.log('Avatar URL Resolution - Input:', src);
  
  // Clean up the URL - remove any extra whitespace and normalize
  const cleanSrc = src.trim();
  
  // If it's already a full URL (starts with http/https), return as-is
  if (cleanSrc.startsWith('http://') || cleanSrc.startsWith('https://')) {
    console.log('Avatar URL Resolution - Full URL detected:', cleanSrc);
    return cleanSrc;
  }
  
  // If it's a relative path starting with /rails/active_storage/, 
  // it will be proxied by Next.js, so return as-is
  if (cleanSrc.startsWith('/rails/active_storage/')) {
    console.log('Avatar URL Resolution - Rails blob path detected, will be proxied by Next.js:', cleanSrc);
    // Ensure the URL is properly encoded for browser consumption
    try {
      // Split the URL to avoid double-encoding the already encoded parts
      const parts = cleanSrc.split('/');
      const encodedParts = parts.map((part, index) => {
        // Don't re-encode parts that are already encoded (like the signed blob IDs)
        if (index < 5 || part.includes('=') || part.includes('%')) {
          return part;
        }
        return encodeURIComponent(part);
      });
      const finalUrl = encodedParts.join('/');
      console.log('Avatar URL Resolution - Encoded URL:', finalUrl);
      return finalUrl;
    } catch (error) {
      console.error('Avatar URL encoding failed:', error);
      return cleanSrc; // Fall back to original if encoding fails
    }
  }
  
  // If it's a relative API path, it will also be proxied
  if (cleanSrc.startsWith('/api/')) {
    console.log('Avatar URL Resolution - API path detected, will be proxied by Next.js:', cleanSrc);
    return cleanSrc;
  }
  
  // For other relative paths, treat as-is (might be gravatar or external)
  console.log('Avatar URL Resolution - Other URL type:', cleanSrc);
  return cleanSrc;
};

export function Avatar({ 
  src, 
  alt = 'Profile picture', 
  size = 'md',
  className = '',
  showLoadingState = true
}: AvatarProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const resolvedSrc = resolveAvatarUrl(src);

  console.log('Avatar component render:', {
    originalSrc: src ? `${src.substring(0, 50)}...` : 'none',
    resolvedSrc: resolvedSrc ? `${resolvedSrc.substring(0, 50)}...` : 'none',
    imageLoaded,
    imageError,
    isLoading
  });

  useEffect(() => {
    if (resolvedSrc) {
      console.log('Avatar: Starting to load image:', resolvedSrc.substring(0, 80) + '...');
      console.log('Avatar: Full resolved URL:', resolvedSrc);
      setIsLoading(true);
      setImageLoaded(false);
      setImageError(false);
      
      // Test the URL accessibility
      console.log('Avatar: Testing URL accessibility...');
      fetch(resolvedSrc, { 
        method: 'HEAD',
        mode: 'cors' 
      })
      .then(response => {
        console.log('Avatar: URL test response:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          url: response.url,
          headers: Object.fromEntries(response.headers.entries())
        });
        if (!response.ok) {
          console.error('Avatar: URL test failed - server returned', response.status, response.statusText);
        }
      })
      .catch(error => {
        console.error('Avatar: URL test failed with error:', error);
      });
      
    } else {
      console.log('Avatar: No resolved src, showing placeholder');
      setIsLoading(false);
      setImageLoaded(false);
      setImageError(false);
    }
  }, [resolvedSrc]);

  const handleImageLoad = () => {
    console.log('Avatar: Image loaded successfully for URL:', resolvedSrc);
    setImageLoaded(true);
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    console.error('Avatar: Image failed to load');
    console.error('Avatar: Failed URL:', target.src);
    console.error('Avatar: Error event:', e);
    console.error('Avatar: Image natural dimensions:', {
      naturalWidth: target.naturalWidth,
      naturalHeight: target.naturalHeight
    });
    setImageLoaded(false);
    setIsLoading(false);
    setImageError(true);
  };

  const shouldShowImage = resolvedSrc && imageLoaded && !imageError;
  const shouldShowPlaceholder = !resolvedSrc || imageError || (!imageLoaded && !isLoading);
  const shouldShowLoading = isLoading && showLoadingState && !imageLoaded && resolvedSrc;

  console.log('Avatar display logic:', {
    shouldShowImage,
    shouldShowPlaceholder, 
    shouldShowLoading,
    hasResolvedSrc: !!resolvedSrc
  });

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Main Avatar Display */}
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-100 flex items-center justify-center`}>
        {shouldShowImage && (
          <img
            src={resolvedSrc}
            alt={alt}
            className="w-full h-full object-cover"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
        
        {shouldShowPlaceholder && (
          <UserIcon className={`${iconSizeClasses[size]} text-gray-400`} aria-hidden="true" />
        )}
        
        {/* Hidden preloader image - only if we have a resolved URL and haven't loaded yet */}
        {resolvedSrc && !imageLoaded && !imageError && (
          <img
            src={resolvedSrc}
            alt={alt}
            className="absolute opacity-0 pointer-events-none"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
      </div>

      {/* Loading Overlay */}
      {shouldShowLoading && (
        <div className="absolute inset-0 rounded-full bg-gray-200 bg-opacity-75 flex items-center justify-center">
          <div className={`animate-spin rounded-full border-2 border-blue-500 border-t-transparent ${
            size === 'sm' ? 'w-3 h-3' : 
            size === 'md' ? 'w-4 h-4' :
            size === 'lg' ? 'w-6 h-6' : 'w-8 h-8'
          }`}></div>
        </div>
      )}
      
      {/* Debug Info Overlay (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute -bottom-12 left-0 text-xs bg-black bg-opacity-75 text-white p-1 rounded opacity-0 hover:opacity-100 transition-opacity">
          <div>Original: {src ? `${src.substring(0, 30)}...` : 'none'}</div>
          <div>Resolved: {resolvedSrc ? `${resolvedSrc.substring(0, 30)}...` : 'none'}</div>
          <div>Status: {imageLoaded ? 'loaded' : imageError ? 'error' : isLoading ? 'loading' : 'waiting'}</div>
        </div>
      )}
    </div>
  );
} 