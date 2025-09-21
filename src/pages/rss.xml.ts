import { SITE } from '@/consts'
import rss from '@astrojs/rss'
import type { APIContext } from 'astro'
import { getAllPosts, getAllReviews, getAllColumns } from '@/lib/data-utils'

const HUBS = [
  'https://pubsubhubbub.appspot.com/',
  'https://websub.superfeedr.com/',
]

export async function GET(context: APIContext) {
  try {
    const posts = await getAllPosts()
    const reviews = (await getAllReviews()).filter((entry) => (entry.data.locale ?? 'ja') === 'ja')
    const columns = (await getAllColumns()).filter((entry) => (entry.data.locale ?? 'ja') === 'ja')

    const allItems = [
      ...reviews.map((review) => ({
        title: review.data.title,
        description: `${review.data.brand || ''} ${review.data.model || ''} - ${review.data.category || 'オーディオ機器'}のレビュー`,
        pubDate: review.data.date,
        link: `/reviews/${review.id}/`,
        categories: review.data.tags || [],
      })),
      ...columns.map((column) => ({
        title: column.data.title,
        description: column.data.description || `${column.data.category || 'オーディオ'}に関するコラム`,
        pubDate: column.data.date,
        link: `/columns/${column.id}/`,
        categories: column.data.tags || [],
      })),
      ...posts.map((post) => ({
        title: post.data.title,
        description: post.data.description || '',
        pubDate: post.data.date,
        link: `/blog/${post.id}/`,
        categories: post.data.tags || [],
      })),
    ].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf())

    const siteOrigin = context.site?.origin ?? SITE.href
    const customData = [
      ...HUBS.map((hub) => `<link rel="hub" href="${hub}"/>`),
      `<link rel="self" href="${new URL('/rss.xml', siteOrigin).toString()}"/>`,
    ].join('\n')

    return rss({
      title: SITE.title,
      description: SITE.description,
      site: context.site ?? SITE.href,
      items: allItems,
      customData,
    })
  } catch (error) {
    console.error('Error generating RSS feed:', error)
    return new Response('Error generating RSS feed', { status: 500 })
  }
}
