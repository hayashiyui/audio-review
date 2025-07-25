import type { IconMap, SocialLink, Site } from '@/types'

export const SITE: Site = {
  title: 'Audio Review Blog',
  description:
    'オーディオ機器の専門レビューサイト。ヘッドホン、スピーカー、DAC、アンプの詳細レビュー。',
  href: 'https://audiomatome.com',
  author: 'Neko',
  locale: 'ja-JP',
  featuredPostCount: 20,
  postsPerPage: 20,
}

export const NAV_LINKS: SocialLink[] = [
  {
    href: '/reviews',
    label: 'レビュー',
  },
  {
    href: '/columns',
    label: 'コラム',
  },
]

export const SOCIAL_LINKS: SocialLink[] = [
  {
    href: '/rss.xml',
    label: 'RSS',
  },
]

export const ICON_MAP: IconMap = {
  Website: 'lucide:globe',
  GitHub: 'lucide:github',
  LinkedIn: 'lucide:linkedin',
  Twitter: 'lucide:twitter',
  Email: 'lucide:mail',
  RSS: 'lucide:rss',
}
