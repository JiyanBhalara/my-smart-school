// components/SupabaseImage.tsx
'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

interface SupabaseImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
}

export default function SupabaseImage({ 
  src, 
  alt, 
  className = "", 
  width, 
  height, 
  fill = false 
}: SupabaseImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Custom loader for external URLs (including Supabase)
  const customLoader = ({ src }: { src: string }) => {
    return src;
  };

  if (error || !src) {
    return (
      <div 
        className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center ${className}`}
        style={{ width: width || '100%', height: height || 200 }}
      >
        <div className="text-gray-500 text-center p-4">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" 
            />
          </svg>
          <p className="text-sm">Image unavailable</p>
        </div>
      </div>
    );
  }

  // Use Next.js Image with custom loader for all URLs
  return (
    <div className="relative">
      {loading && (
        <div 
          className={`absolute inset-0 bg-gray-200 animate-pulse rounded flex items-center justify-center z-10 ${className}`}
          style={{ width: width || '100%', height: height || 'auto' }}
        >
          <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {fill ? (
        <Image
          src={src}
          alt={alt}
          fill
          loader={customLoader}
          className={`object-cover transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'} ${className}`}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onLoad={() => setLoading(false)}
          onError={() => {
            setError(true);
            setLoading(false);
          }}
          unoptimized
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          width={width || 500}
          height={height || 300}
          loader={customLoader}
          className={`object-cover transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'} ${className}`}
          onLoad={() => setLoading(false)}
          onError={() => {
            setError(true);
            setLoading(false);
          }}
          unoptimized
        />
      )}
    </div>
  );
}