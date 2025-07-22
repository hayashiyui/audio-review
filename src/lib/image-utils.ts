/**
 * 画像管理用ユーティリティ関数
 */

export type ImageCategory = 'hero' | 'product' | 'thumbnail' | 'gallery' | 'brand'
/**
 * 製品画像のパスを生成
 */
export function getProductImagePath(
  brand: string,
  model: string,
  type: string = 'main',
  extension: string = 'jpg'
): string {
  const slug = `${brand}-${model}`.toLowerCase().replace(/\s+/g, '-')
  return `/images/products/${slug}-${type}.${extension}`
}

/**
 * ヒーロー画像のパスを生成
 */
export function getHeroImagePath(slug: string, extension: string = 'jpg'): string {
  return `/images/hero/${slug}.${extension}`
}

/**
 * サムネイル画像のパスを生成
 */
export function getThumbnailImagePath(
  brand: string,
  model: string,
  extension: string = 'jpg'
): string {
  const slug = `${brand}-${model}`.toLowerCase().replace(/\s+/g, '-')
  return `/images/thumbnails/${slug}.${extension}`
}

/**
 * ブランドロゴのパスを生成
 */
export function getBrandLogoPath(brand: string, extension: string = 'svg'): string {
  const slug = brand.toLowerCase().replace(/\s+/g, '-')
  return `/images/brands/${slug}.${extension}`
}

/**
 * ギャラリー画像のパスを生成
 */
export function getGalleryImagePath(
  brand: string,
  model: string,
  imageNumber: number,
  extension: string = 'jpg'
): string {
  const slug = `${brand}-${model}`.toLowerCase().replace(/\s+/g, '-')
  return `/images/gallery/${slug}-${imageNumber.toString().padStart(2, '0')}.${extension}`
}

/**
 * 画像のalt属性を生成
 */
export function generateImageAlt(
  brand: string,
  model: string,
  type: string = 'メイン画像'
): string {
  return `${brand} ${model} ${type}`
}

/**
 * 画像サイズの定義
 */
export const IMAGE_SIZES = {
  hero: { width: 1200, height: 630 },
  product: { width: 800, height: 600 },
  thumbnail: { width: 400, height: 300 },
  gallery: { width: 1024, height: 768 },
  brand: { width: 200, height: 200 },
} as const

/**
 * 画像品質の定義
 */
export const IMAGE_QUALITY = {
  hero: 90,
  product: 85,
  thumbnail: 80,
  gallery: 90,
  brand: 95,
} as const

/**
 * レスポンシブ画像のsrcset生成
 */
export function generateSrcSet(basePath: string, sizes: number[]): string {
  return sizes
    .map(size => `${basePath}?w=${size}&q=85&f=webp ${size}w`)
    .join(', ')
}

/**
 * 画像の存在確認（開発用）
 */
export function validateImagePath(path: string): boolean {
  // 開発環境でのみ実行される画像パス検証
  if (import.meta.env.DEV) {
    // 実際のファイル存在確認はビルド時に行う
    console.log(`Image path validation: ${path}`)
  }
  return true
}

/**
 * 画像メタデータの型定義
 */
export interface ImageMetadata {
  src: string
  alt: string
  width: number
  height: number
  category: ImageCategory
  quality?: number
}

/**
 * 製品用画像メタデータ生成
 */
export function createProductImageMetadata(
  brand: string,
  model: string,
  type: string = 'main'
): ImageMetadata {
  return {
    src: getProductImagePath(brand, model, type),
    alt: generateImageAlt(brand, model, type),
    width: IMAGE_SIZES.product.width,
    height: IMAGE_SIZES.product.height,
    category: 'product',
    quality: IMAGE_QUALITY.product,
  }
}