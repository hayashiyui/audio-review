import type { IconMap, SocialLink, Site } from '@/types'

export const SITE: Site = {
  title: 'Audio Review Blog',
  description:
    'スーパーハイエンドからエントリーまで。スピーカー、ヘッドホン、イヤホン、DAC、アンプ等オーディオ機器の忖度なき深層レビュー。そっとポエムを添えて',
  href: 'https://audiomatome.com',
  author: '哲学的なNEKO',
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
