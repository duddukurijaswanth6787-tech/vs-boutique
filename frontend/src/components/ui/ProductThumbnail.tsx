'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag } from 'lucide-react'

interface ProductThumbnailProps {
  src?: string | null
  alt: string
  className?: string
  href?: string
}

export function ProductThumbnail({ src, alt, className = '', href }: ProductThumbnailProps) {
  const inner = (
    <div className={`w-14 h-14 rounded-lg bg-neutral-50 border border-neutral-200 overflow-hidden flex items-center justify-center shrink-0 relative ${className}`}>
      <ShoppingBag className="w-5 h-5 text-neutral-400 absolute" />
      {src && (
        <Image
          src={src}
          alt={alt || ''}
          fill
          loading="lazy"
          sizes="56px"
          className="object-cover w-full h-full relative"
          onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none' }}
        />
      )}
    </div>
  )

  if (href) {
    return <Link href={href} className="hover:opacity-90 transition-opacity">{inner}</Link>
  }

  return inner
}
