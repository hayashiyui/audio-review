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
    const posts = (await getAllPosts()).filter((post) => ((post.data as any).locale ? (post.data as any).locale === 'en' : true))
    const reviews = (await getAllReviews()).filter((review) => (review.data.locale ?? 'ja') === 'en')
    const columns = (await getAllColumns()).filter((column) => (column.data.locale ?? 'ja') === 'en')

    const allItems = [
      ...reviews.map((review) => ({
        title: review.data.title,
        description: `${review.data.brand || ''} ${review.data.model || ''} - ${review.data.category || 'Audio Equipment'} Review`,
        pubDate: review.data.date,
        link: `/en/reviews/${review.id.replace(/^en\//, '').replace(/\.en$/, '')}/`,
        categories: review.data.tags || [],
      })),
      ...columns.map((column) => ({
        title: column.data.title,
        description: column.data.description || `${column.data.category || 'Audio'} Column`,
        pubDate: column.data.date,
        link: `/en/columns/${column.id.replace(/^en\//, '').replace(/\.en$/, '')}/`,
        categories: column.data.tags || [],
      })),
      ...posts.map((post) => ({
        title: post.data.title,
        description: post.data.description || '',
        pubDate: post.data.date,
        link: `/en/blog/${post.id}/`,
        categories: post.data.tags || [],
      })),
    ].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf())

    const siteOrigin = context.site?.origin ?? SITE.href
    const customData = [
      ...HUBS.map((hub) => `<link rel="hub" href="${hub}"/>`),
      `<link rel="self" href="${new URL('/en/rss.xml', siteOrigin).toString()}"/>`,
    ].join('\n')

    return rss({
      title: 'Audio Review Blog (English)',
      description: 'Deep audio equipment reviews from super high-end to entry level. Speakers, headphones, earphones, DAC, amplifiers and more.',
      site: context.site ?? SITE.href,
      items: allItems,
      customData,
    })
  } catch (error) {
    console.error('Error generating EN RSS feed:', error)
    return new Response('Error generating EN RSS feed', { status: 500 })
  }
}
