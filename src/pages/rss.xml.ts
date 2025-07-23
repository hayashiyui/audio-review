import { SITE } from '@/consts'
import rss from '@astrojs/rss'
import type { APIContext } from 'astro'
import { getAllPosts, getAllReviews } from '@/lib/data-utils'

export async function GET(context: APIContext) {
  try {
    const posts = await getAllPosts()
    const reviews = await getAllReviews()

    // レビューとブログ記事を結合してソート
    const allItems = [
      ...reviews.map((review) => ({
        title: review.data.title,
        description: `${review.data.brand || ''} ${review.data.model || ''} - ${review.data.category || 'オーディオ機器'}のレビュー`,
        pubDate: review.data.date,
        link: `/reviews/${review.id}/`,
        categories: review.data.tags || [],
      })),
      ...posts.map((post) => ({
        title: post.data.title,
        description: post.data.description || '',
        pubDate: post.data.date,
        link: `/blog/${post.id}/`,
        categories: post.data.tags || [],
      })),
    ].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf())

    return rss({
      title: SITE.title,
      description: SITE.description,
      site: context.site ?? SITE.href,
      items: allItems,
    })
  } catch (error) {
    console.error('Error generating RSS feed:', error)
    return new Response('Error generating RSS feed', { status: 500 })
  }
}
