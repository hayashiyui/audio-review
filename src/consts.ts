import type { IconMap, SocialLink, Site } from '@/types'

export const SITE: Site = {
  title: 'Audio Review Blog',
  description:
    'オーディオ機器の専門レビューサイト。ヘッドホン、スピーカー、DAC、アンプの詳細レビューと試聴レポート。音質評価から価格比較まで、あなたの音楽体験を向上させる製品選びをサポートします。',
  href: 'https://audio-review.pages.dev',
  author: 'Audio Reviewer',
  locale: 'ja-JP',
  featuredPostCount: 2,
  postsPerPage: 3,
}

export const NAV_LINKS: SocialLink[] = [
  {
    href: '/reviews',
    label: 'レビュー',
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
