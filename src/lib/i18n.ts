export type Locale = 'ja' | 'en'

export const DEFAULT_LOCALE: Locale = 'ja'

export const altLocale = (l: Locale): Locale => (l === 'ja' ? 'en' : 'ja')

export const localizePath = (path: string, locale: Locale) => {
  const p = path.startsWith('/') ? path : `/${path}`
  return locale === 'ja' ? p : `/en${p}`
}

// Category labels (EN -> JA)
const CATEGORY_EN_TO_JA: Record<string, string> = {
  // reviews
  'Speakers': 'スピーカー',
  'Headphones': 'ヘッドホン',
  'Earphones': 'イヤホン',
  'Digital Player': 'デジタルプレーヤー',
  'DAC': 'DAC',
  'Power Amplifier': 'パワーアンプ',
  'Preamplifier': 'プリアンプ',
  'Integrated Amplifier': 'プリメインアンプ',
  'Headphone Amplifier': 'ヘッドホンアンプ',
  'Analog': 'アナログ',
  'Cables': 'ケーブル',
  'Accessories': 'アクセサリ',
  // columns
  'Basics': 'オーディオ基礎知識',
  'Setup': 'セットアップ',
  'Sound Improvement': '音質改善',
  'Industry Trends': '業界動向',
  'Technical': '技術解説',
  'Essay': 'エッセイ',
  'Buying Guide': '購入ガイド',
  'Others': 'その他',
}

export function categoryLabel(category: string | undefined, locale: Locale): string {
  if (!category) return ''
  if (locale === 'ja') return CATEGORY_EN_TO_JA[category] ?? category
  return category
}

// Get translation by translationKey
import { getCollection } from 'astro:content'

export async function getTranslation(
  translationKey: string,
  targetLocale: Locale,
  collection: 'reviews' | 'columns'
): Promise<{ slug: string; title: string } | null> {
  try {
    // 直接フィルタ条件でgetCollectionを呼び出す
    const targetEntries = await getCollection(collection, ({ data }) => {
      return data.translationKey === translationKey &&
             (data.locale ?? 'ja') === targetLocale
    })

    if (targetEntries.length === 0) return null

    const entry = targetEntries[0]

    // スラッグの処理を修正
    let slug = entry.id
    if (targetLocale === 'en') {
      // 英語版の場合：`en/filename` 形式からスラッグを抽出
      slug = slug.replace(/^en\//, '')
    }

    return { slug, title: entry.data.title }
  } catch (error) {
    console.error('getTranslation error:', error)
    return null
  }
}
