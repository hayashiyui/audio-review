export type Locale = 'ja' | 'en'

export const DEFAULT_LOCALE: Locale = 'ja'

export const altLocale = (l: Locale): Locale => (l === 'ja' ? 'en' : 'ja')

export const localizePath = (path: string, locale: Locale) => {
  const p = path.startsWith('/') ? path : `/${path}`
  return locale === 'ja' ? p : `/en${p}`
}

