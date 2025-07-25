import type { CollectionEntry } from 'astro:content'
import { SITE } from '@/consts'

/**
 * サイト全体の構造化データ（WebSite schema）を生成
 */
export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": SITE.title,
    "description": SITE.description,
    "url": SITE.href,
    "inLanguage": SITE.locale,
    "author": {
      "@type": "Person",
      "name": SITE.author
    },
    "publisher": {
      "@type": "Person",
      "name": SITE.author
    }
  }
}

/**
 * ブログ記事の構造化データ（BlogPosting schema）を生成
 */
export function generateBlogPostingSchema(
  entry: CollectionEntry<'blog'>,
  authors: Array<{ name: string; avatar: string }>
) {
  const imageUrl = entry.data.image 
    ? `${SITE.href}${entry.data.image.src}`
    : null

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": entry.data.title,
    "description": entry.data.description,
    "image": imageUrl,
    "datePublished": entry.data.date.toISOString(),
    "dateModified": entry.data.date.toISOString(),
    "author": authors.length > 0 ? authors.map(author => ({
      "@type": "Person",
      "name": author.name
    })) : {
      "@type": "Person",
      "name": SITE.author
    },
    "publisher": {
      "@type": "Person",
      "name": SITE.author
    },
    "url": new URL(`/blog/${entry.id}`, SITE.href).toString(),
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": new URL(`/blog/${entry.id}`, SITE.href).toString()
    }
  }
}

/**
 * レビュー記事の構造化データ（Review schema）を生成
 */
export function generateReviewSchema(entry: CollectionEntry<'reviews'>) {
  const imageUrl = entry.data.heroImage
    ? `${SITE.href}${entry.data.heroImage.src}`
    : null

  const productName = entry.data.brand && entry.data.model 
    ? `${entry.data.brand} ${entry.data.model}`
    : entry.data.title

  return {
    "@context": "https://schema.org",
    "@type": "Review",
    "reviewBody": entry.data.description,
    "datePublished": entry.data.date.toISOString(),
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": "4",
      "bestRating": "5"
    },
    "author": {
      "@type": "Person",
      "name": SITE.author
    },
    "publisher": {
      "@type": "Person",
      "name": SITE.author
    },
    "url": new URL(`/reviews/${entry.id}`, SITE.href).toString(),
    "itemReviewed": {
      "@type": "Product",  
      "name": productName,
      "brand": entry.data.brand ? {
        "@type": "Brand",
        "name": entry.data.brand
      } : undefined,
      "category": entry.data.category,
      "image": imageUrl
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": new URL(`/reviews/${entry.id}`, SITE.href).toString()
    }
  }
}

/**
 * コラム記事の構造化データ（Article schema）を生成
 */
export function generateArticleSchema(entry: CollectionEntry<'columns'>) {
  const imageUrl = entry.data.heroImage
    ? `${SITE.href}${entry.data.heroImage.src}`
    : null

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": entry.data.title,
    "description": entry.data.description,
    "image": imageUrl,
    "datePublished": entry.data.date.toISOString(),
    "author": {
      "@type": "Person",
      "name": SITE.author
    },
    "publisher": {
      "@type": "Person",
      "name": SITE.author
    },
    "url": new URL(`/columns/${entry.id}`, SITE.href).toString(),
    "articleSection": entry.data.category,
    "keywords": entry.data.tags?.join(', '),
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": new URL(`/columns/${entry.id}`, SITE.href).toString()
    }
  }
}

/**
 * 構造化データをJSON-LD形式で出力するためのヘルパー関数
 */
export function structuredDataToScript(data: object) {
  return `<script type="application/ld+json">${JSON.stringify(data, null, 2)}</script>`
}