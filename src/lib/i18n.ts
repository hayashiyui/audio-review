export type Locale = 'ja' | 'en'

export const DEFAULT_LOCALE: Locale = 'ja'

export const altLocale = (l: Locale): Locale => (l === 'ja' ? 'en' : 'ja')

export const localizePath = (path: string, locale: Locale) => {
  const p = path.startsWith('/') ? path : `/${path}`
  return locale === 'ja' ? p : `/en${p}`
}

// Category labels (JA -> EN)
const CATEGORY_JA_TO_EN: Record<string, string> = {
  // reviews
  'スピーカー': 'Speakers',
  'ヘッドホン': 'Headphones',
  'イヤホン': 'Earphones',
  'デジタルプレーヤー': 'Digital Player',
  DAC: 'DAC',
  'パワーアンプ': 'Power Amplifier',
  'プリアンプ': 'Preamplifier',
  'プリメインアンプ': 'Integrated Amplifier',
  'ヘッドホンアンプ': 'Headphone Amplifier',
  'アナログ': 'Analog',
  'ケーブル': 'Cables',
  'アクセサリ': 'Accessories',
  // columns
  'オーディオ基礎知識': 'Basics',
  'セットアップ': 'Setup',
  '音質改善': 'Sound Improvement',
  '業界動向': 'Industry Trends',
  '技術解説': 'Technical',
  'エッセイ': 'Essay',
  '購入ガイド': 'Buying Guide',
  'その他': 'Others',
}

export function categoryLabel(category: string | undefined, locale: Locale): string {
  if (!category) return ''
  if (locale === 'en') return CATEGORY_JA_TO_EN[category] ?? category
  return category
}
