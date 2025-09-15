import { getCollection, render, type CollectionEntry } from 'astro:content'
import { readingTime, calculateCharCountFromHtml } from '@/lib/utils'

export async function getAllAuthors(): Promise<CollectionEntry<'authors'>[]> {
  return await getCollection('authors')
}

export async function getAllPosts(): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getCollection('blog')
  return posts
    .filter((post) => !post.data.draft && !isSubpost(post.id))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
}

export async function getAllReviews(): Promise<CollectionEntry<'reviews'>[]> {
  const reviews = await getCollection('reviews')
  return reviews
    .filter((review) => !review.data.draft)
    .sort((a, b) => {
      const dateA = a.data.updatedAt ?? a.data.date
      const dateB = b.data.updatedAt ?? b.data.date
      return dateB.valueOf() - dateA.valueOf()
    })
}

export async function getAllColumns(): Promise<CollectionEntry<'columns'>[]> {
  const columns = await getCollection('columns')
  return columns
    .filter((column) => !column.data.draft)
    .sort((a, b) => {
      const dateA = a.data.updatedAt ?? a.data.date
      const dateB = b.data.updatedAt ?? b.data.date
      return dateB.valueOf() - dateA.valueOf()
    })
}

export async function getAllPostsAndSubposts(): Promise<
  CollectionEntry<'blog'>[]
> {
  const posts = await getCollection('blog')
  return posts
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
}

export async function getAllProjects(): Promise<CollectionEntry<'projects'>[]> {
  const projects = await getCollection('projects')
  return projects.sort((a, b) => {
    const dateA = a.data.startDate?.getTime() || 0
    const dateB = b.data.startDate?.getTime() || 0
    return dateB - dateA
  })
}

export async function getAllTags(): Promise<Map<string, number>> {
  const posts = await getAllPosts()
  return posts.reduce((acc, post) => {
    post.data.tags?.forEach((tag) => {
      acc.set(tag, (acc.get(tag) || 0) + 1)
    })
    return acc
  }, new Map<string, number>())
}

export async function getAdjacentPosts(currentId: string): Promise<{
  newer: CollectionEntry<'blog'> | null
  older: CollectionEntry<'blog'> | null
  parent: CollectionEntry<'blog'> | null
}> {
  const allPosts = await getAllPosts()

  if (isSubpost(currentId)) {
    const parentId = getParentId(currentId)
    const allPosts = await getAllPosts()
    const parent = allPosts.find((post) => post.id === parentId) || null

    const posts = await getCollection('blog')
    const subposts = posts
      .filter(
        (post) =>
          isSubpost(post.id) &&
          getParentId(post.id) === parentId &&
          !post.data.draft,
      )
      .sort((a, b) => {
        const dateDiff = a.data.date.valueOf() - b.data.date.valueOf()
        if (dateDiff !== 0) return dateDiff

        const orderA = a.data.order ?? 0
        const orderB = b.data.order ?? 0
        return orderA - orderB
      })

    const currentIndex = subposts.findIndex((post) => post.id === currentId)
    if (currentIndex === -1) {
      return { newer: null, older: null, parent }
    }

    return {
      newer:
        currentIndex < subposts.length - 1 ? subposts[currentIndex + 1] : null,
      older: currentIndex > 0 ? subposts[currentIndex - 1] : null,
      parent,
    }
  }

  const parentPosts = allPosts.filter((post) => !isSubpost(post.id))
  const currentIndex = parentPosts.findIndex((post) => post.id === currentId)

  if (currentIndex === -1) {
    return { newer: null, older: null, parent: null }
  }

  return {
    newer: currentIndex > 0 ? parentPosts[currentIndex - 1] : null,
    older:
      currentIndex < parentPosts.length - 1
        ? parentPosts[currentIndex + 1]
        : null,
    parent: null,
  }
}

export async function getPostsByAuthor(
  authorId: string,
): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getAllPosts()
  return posts.filter((post) => post.data.authors?.includes(authorId))
}

export async function getPostsByTag(
  tag: string,
): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getAllPosts()
  return posts.filter((post) => post.data.tags?.includes(tag))
}

export async function getRecentPosts(
  count: number,
): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getAllPosts()
  return posts.slice(0, count)
}

export async function getRecentReviews(
  count: number,
): Promise<CollectionEntry<'reviews'>[]> {
  const reviews = await getAllReviews()
  return reviews.slice(0, count)
}

export async function getRecentColumns(
  count: number,
): Promise<CollectionEntry<'columns'>[]> {
  const columns = await getAllColumns()
  return columns.slice(0, count)
}

export async function getAllReviewTags(): Promise<Map<string, number>> {
  const reviews = await getAllReviews()
  return reviews.reduce((acc, review) => {
    review.data.tags?.forEach((tag) => {
      acc.set(tag, (acc.get(tag) || 0) + 1)
    })
    return acc
  }, new Map<string, number>())
}

export async function getReviewsByTag(
  tag: string,
): Promise<CollectionEntry<'reviews'>[]> {
  const reviews = await getAllReviews()
  return reviews.filter((review) => review.data.tags?.includes(tag))
}

export async function getAllColumnTags(): Promise<Map<string, number>> {
  const columns = await getAllColumns()
  return columns.reduce((acc, column) => {
    column.data.tags?.forEach((tag) => {
      acc.set(tag, (acc.get(tag) || 0) + 1)
    })
    return acc
  }, new Map<string, number>())
}

export async function getColumnsByTag(
  tag: string,
): Promise<CollectionEntry<'columns'>[]> {
  const columns = await getAllColumns()
  return columns.filter((column) => column.data.tags?.includes(tag))
}

export async function getSortedTags(): Promise<
  { tag: string; count: number }[]
> {
  const tagCounts = await getAllTags()
  return [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => {
      const countDiff = b.count - a.count
      return countDiff !== 0 ? countDiff : a.tag.localeCompare(b.tag)
    })
}

export async function getSortedReviewTags(): Promise<
  { tag: string; count: number }[]
> {
  const tagCounts = await getAllReviewTags()
  return [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => {
      const countDiff = b.count - a.count
      return countDiff !== 0 ? countDiff : a.tag.localeCompare(b.tag)
    })
}

export async function getSortedColumnTags(): Promise<
  { tag: string; count: number }[]
> {
  const tagCounts = await getAllColumnTags()
  return [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => {
      const countDiff = b.count - a.count
      return countDiff !== 0 ? countDiff : a.tag.localeCompare(b.tag)
    })
}

export function getParentId(subpostId: string): string {
  return subpostId.split('/')[0]
}

export async function getSubpostsForParent(
  parentId: string,
): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getCollection('blog')
  return posts
    .filter(
      (post) =>
        !post.data.draft &&
        isSubpost(post.id) &&
        getParentId(post.id) === parentId,
    )
    .sort((a, b) => {
      const dateDiff = a.data.date.valueOf() - b.data.date.valueOf()
      if (dateDiff !== 0) return dateDiff

      const orderA = a.data.order ?? 0
      const orderB = b.data.order ?? 0
      return orderA - orderB
    })
}

export function groupPostsByYear(
  posts: CollectionEntry<'blog'>[],
): Record<string, CollectionEntry<'blog'>[]> {
  return posts.reduce(
    (acc: Record<string, CollectionEntry<'blog'>[]>, post) => {
      const year = post.data.date.getFullYear().toString()
      ;(acc[year] ??= []).push(post)
      return acc
    },
    {},
  )
}

export function groupReviewsByYear(
  reviews: CollectionEntry<'reviews'>[],
): Record<string, CollectionEntry<'reviews'>[]> {
  return reviews.reduce(
    (acc: Record<string, CollectionEntry<'reviews'>[]>, review) => {
      const year = review.data.date.getFullYear().toString()
      ;(acc[year] ??= []).push(review)
      return acc
    },
    {},
  )
}

export function groupColumnsByYear(
  columns: CollectionEntry<'columns'>[],
): Record<string, CollectionEntry<'columns'>[]> {
  return columns.reduce(
    (acc: Record<string, CollectionEntry<'columns'>[]>, column) => {
      const year = column.data.date.getFullYear().toString()
      ;(acc[year] ??= []).push(column)
      return acc
    },
    {},
  )
}

export async function hasSubposts(postId: string): Promise<boolean> {
  const subposts = await getSubpostsForParent(postId)
  return subposts.length > 0
}

export function isSubpost(postId: string): boolean {
  // ロケール接頭辞（例: en/<slug>）はサブポストではない
  if (/^(en|ja)\//.test(postId)) return false
  return postId.includes('/')
}

export async function getParentPost(
  subpostId: string,
): Promise<CollectionEntry<'blog'> | null> {
  if (!isSubpost(subpostId)) {
    return null
  }

  const parentId = getParentId(subpostId)
  const allPosts = await getAllPosts()
  return allPosts.find((post) => post.id === parentId) || null
}

export async function parseAuthors(authorIds: string[] = []) {
  if (!authorIds.length) return []

  const allAuthors = await getAllAuthors()
  const authorMap = new Map(allAuthors.map((author) => [author.id, author]))

  return authorIds.map((id) => {
    const author = authorMap.get(id)
    return {
      id,
      name: author?.data?.name || id,
      avatar: author?.data?.avatar || '/static/logo.png',
      isRegistered: !!author,
    }
  })
}

export async function getPostById(
  postId: string,
): Promise<CollectionEntry<'blog'> | null> {
  const allPosts = await getAllPostsAndSubposts()
  return allPosts.find((post) => post.id === postId) || null
}

export async function getSubpostCount(parentId: string): Promise<number> {
  const subposts = await getSubpostsForParent(parentId)
  return subposts.length
}

export async function getCombinedReadingTime(postId: string): Promise<string> {
  const post = await getPostById(postId)
  if (!post) return readingTime(0)

  let totalChars = calculateCharCountFromHtml(post.body)

  if (!isSubpost(postId)) {
    const subposts = await getSubpostsForParent(postId)
    for (const subpost of subposts) {
      totalChars += calculateCharCountFromHtml(subpost.body)
    }
  }

  return readingTime(totalChars)
}

export async function getPostReadingTime(postId: string): Promise<string> {
  const post = await getPostById(postId)
  if (!post) return readingTime(0)

  const charCount = calculateCharCountFromHtml(post.body)
  return readingTime(charCount)
}

export type TOCHeading = {
  slug: string
  text: string
  depth: number
  isSubpostTitle?: boolean
}

export type TOCSection = {
  type: 'parent' | 'subpost'
  title: string
  headings: TOCHeading[]
  subpostId?: string
}

export async function getTOCSections(postId: string): Promise<TOCSection[]> {
  const post = await getPostById(postId)
  if (!post) return []

  const parentId = isSubpost(postId) ? getParentId(postId) : postId
  const parentPost = isSubpost(postId) ? await getPostById(parentId) : post

  if (!parentPost) return []

  const sections: TOCSection[] = []

  const { headings: parentHeadings } = await render(parentPost)
  if (parentHeadings.length > 0) {
    sections.push({
      type: 'parent',
      title: 'Overview',
      headings: parentHeadings.map((heading) => ({
        slug: heading.slug,
        text: heading.text,
        depth: heading.depth,
      })),
    })
  }

  const subposts = await getSubpostsForParent(parentId)
  for (const subpost of subposts) {
    const { headings: subpostHeadings } = await render(subpost)
    if (subpostHeadings.length > 0) {
      sections.push({
        type: 'subpost',
        title: subpost.data.title,
        headings: subpostHeadings.map((heading, index) => ({
          slug: heading.slug,
          text: heading.text,
          depth: heading.depth,
          isSubpostTitle: index === 0,
        })),
        subpostId: subpost.id,
      })
    }
  }

  return sections
}

export async function getPostTOCSections(postId: string): Promise<TOCSection[]> {
  const reviews = await getCollection('reviews')
  const review = reviews.find((r) => r.id === postId)
  if (!review) return []

  const { headings } = await render(review)
  if (headings.length === 0) return []

  return [{
    type: 'parent',
    title: review.data.title,
    headings: headings.map((heading) => ({
      slug: heading.slug,
      text: heading.text,
      depth: heading.depth,
    })),
  }]
}

export async function getAdjacentReviews(
  currentId: string,
  locale?: 'ja' | 'en',
): Promise<{
  newer: CollectionEntry<'reviews'> | null
  older: CollectionEntry<'reviews'> | null
}> {
  let allReviews = await getAllReviews()
  if (locale) {
    allReviews = allReviews.filter((r) => (r.data.locale ?? 'ja') === locale)
  }
  const currentIndex = allReviews.findIndex((review) => review.id === currentId)

  if (currentIndex === -1) {
    return { newer: null, older: null }
  }

  return {
    newer: currentIndex > 0 ? allReviews[currentIndex - 1] : null,
    older: currentIndex < allReviews.length - 1 ? allReviews[currentIndex + 1] : null,
  }
}

export async function getAdjacentColumns(
  currentId: string,
  locale?: 'ja' | 'en',
): Promise<{
  newer: CollectionEntry<'columns'> | null
  older: CollectionEntry<'columns'> | null
}> {
  let allColumns = await getAllColumns()
  if (locale) {
    allColumns = allColumns.filter((c) => (c.data.locale ?? 'ja') === locale)
  }
  const currentIndex = allColumns.findIndex((column) => column.id === currentId)

  if (currentIndex === -1) {
    return { newer: null, older: null }
  }

  return {
    newer: currentIndex > 0 ? allColumns[currentIndex - 1] : null,
    older: currentIndex < allColumns.length - 1 ? allColumns[currentIndex + 1] : null,
  }
}

export async function getColumnTOCSections(columnId: string): Promise<TOCSection[]> {
  const columns = await getCollection('columns')
  const column = columns.find((c) => c.id === columnId)
  if (!column) return []

  const { headings } = await render(column)
  if (headings.length === 0) return []

  return [{
    type: 'parent',
    title: column.data.title,
    headings: headings.map((heading) => ({
      slug: heading.slug,
      text: heading.text,
      depth: heading.depth,
    })),
  }]
}

export async function getColumnById(
  columnId: string,
): Promise<CollectionEntry<'columns'> | null> {
  const allColumns = await getAllColumns()
  return allColumns.find((column) => column.id === columnId) || null
}

export async function getColumnReadingTime(columnId: string): Promise<string> {
  const column = await getColumnById(columnId)
  if (!column) return readingTime(0)

  const charCount = calculateCharCountFromHtml(column.body)
  return readingTime(charCount)
}

export async function getReviewById(
  reviewId: string,
): Promise<CollectionEntry<'reviews'> | null> {
  const allReviews = await getAllReviews()
  return allReviews.find((review) => review.id === reviewId) || null
}

export async function getReviewReadingTime(reviewId: string): Promise<string> {
  const review = await getReviewById(reviewId)
  if (!review) return readingTime(0)

  const charCount = calculateCharCountFromHtml(review.body)
  return readingTime(charCount)
}

// Blog用タグ関数
export async function getAllBlogTags(): Promise<Map<string, number>> {
  const blogs = await getCollection('blog')
  return blogs.reduce((acc, blog) => {
    blog.data.tags?.forEach((tag) => {
      acc.set(tag, (acc.get(tag) || 0) + 1)
    })
    return acc
  }, new Map<string, number>())
}

export async function getBlogsByTag(
  tag: string,
): Promise<CollectionEntry<'blog'>[]> {
  const blogs = await getCollection('blog')
  return blogs.filter(blog => blog.data.tags?.includes(tag))
}

// 全コレクション統合タグ関数
export async function getAllCombinedTags(): Promise<Map<string, number>> {
  const [blogTags, reviewTags, columnTags] = await Promise.all([
    getAllBlogTags(),
    getAllReviewTags(),
    getAllColumnTags(),
  ])

  const combinedTags = new Map<string, number>()

  // 各コレクションのタグを統合
  for (const [tag, count] of blogTags) {
    combinedTags.set(tag, (combinedTags.get(tag) || 0) + count)
  }
  for (const [tag, count] of reviewTags) {
    combinedTags.set(tag, (combinedTags.get(tag) || 0) + count)
  }
  for (const [tag, count] of columnTags) {
    combinedTags.set(tag, (combinedTags.get(tag) || 0) + count)
  }

  return combinedTags
}

export async function getEntriesByTag(
  tag: string,
): Promise<{
  blogs: CollectionEntry<'blog'>[]
  reviews: CollectionEntry<'reviews'>[]
  columns: CollectionEntry<'columns'>[]
}> {
  const [blogs, reviews, columns] = await Promise.all([
    getBlogsByTag(tag),
    getReviewsByTag(tag),
    getColumnsByTag(tag),
  ])

  return { blogs, reviews, columns }
}

export async function getSortedAllTags(): Promise<
  { tag: string; count: number }[]
> {
  const tagCounts = await getAllCombinedTags()
  return [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => {
      const countDiff = b.count - a.count
      return countDiff !== 0 ? countDiff : a.tag.localeCompare(b.tag)
    })
}

// 関連記事取得機能

export async function getRelatedArticles(
  collection: 'reviews' | 'columns',
  articleId: string,
  locale?: 'ja' | 'en',
): Promise<(CollectionEntry<'reviews'> | CollectionEntry<'columns'>)[]> {
  let currentArticle: CollectionEntry<'reviews'> | CollectionEntry<'columns'> | null = null

  if (collection === 'reviews') {
    currentArticle = await getReviewById(articleId)
  } else if (collection === 'columns') {
    currentArticle = await getColumnById(articleId)
  }

  if (!currentArticle || !currentArticle.data.relatedArticles) {
    return []
  }

  const relatedEntries: (CollectionEntry<'reviews'> | CollectionEntry<'columns'>)[] = []

  for (const relatedRef of currentArticle.data.relatedArticles) {
    let relatedEntry: any = null

    if (relatedRef.collection === 'reviews') {
      relatedEntry = await getReviewById(relatedRef.id)
      // ロケールが合わない場合のフォールバック（translationKey または .en サフィックス）
      if (locale && relatedEntry && (relatedEntry.data.locale ?? 'ja') !== locale) {
        const all = await getAllReviews()
        if (relatedEntry.data.translationKey) {
          const alt = all.find(
            (e) => e.data.translationKey === relatedEntry.data.translationKey && (e.data.locale ?? 'ja') === locale,
          )
          if (alt) relatedEntry = alt
        } else if (locale === 'en') {
          const altId = relatedRef.id.endsWith('.en') ? relatedRef.id : `${relatedRef.id}.en`
          const alt = all.find((e) => e.id === altId)
          if (alt) relatedEntry = alt
          // ディレクトリ方式 en/<id> も探索
          if (!alt) {
            const base = relatedRef.id.replace(/\.en$/, '').replace(/^en\//, '')
            const altDir = all.find((e) => e.id === `en/${base}`)
            if (altDir) relatedEntry = altDir
          }
        }
      }
    } else if (relatedRef.collection === 'columns') {
      relatedEntry = await getColumnById(relatedRef.id)
      if (locale && relatedEntry && (relatedEntry.data.locale ?? 'ja') !== locale) {
        const all = await getAllColumns()
        if (relatedEntry.data.translationKey) {
          const alt = all.find(
            (e) => e.data.translationKey === relatedEntry.data.translationKey && (e.data.locale ?? 'ja') === locale,
          )
          if (alt) relatedEntry = alt
        } else if (locale === 'en') {
          const altId = relatedRef.id.endsWith('.en') ? relatedRef.id : `${relatedRef.id}.en`
          const alt = all.find((e) => e.id === altId)
          if (alt) relatedEntry = alt
          // ディレクトリ方式 en/<id> も探索
          if (!alt) {
            const base = relatedRef.id.replace(/\.en$/, '').replace(/^en\//, '')
            const altDir = all.find((e) => e.id === `en/${base}`)
            if (altDir) relatedEntry = altDir
          }
        }
      }
    }

    if (relatedEntry && !relatedEntry.data.draft && (!locale || (relatedEntry.data.locale ?? 'ja') === locale)) {
      relatedEntries.push(relatedEntry)
    }
  }

  return relatedEntries
}

// カテゴリ関連関数

export async function getReviewsByCategory(
  category: string,
): Promise<CollectionEntry<'reviews'>[]> {
  const reviews = await getAllReviews()
  return reviews.filter((review) => review.data.category === category)
}

export async function getColumnsByCategory(
  category: string,
): Promise<CollectionEntry<'columns'>[]> {
  const columns = await getAllColumns()
  return columns.filter((column) => column.data.category === category)
}

export async function getAllReviewCategories(): Promise<Map<string, number>> {
  const reviews = await getAllReviews()
  const categoryMap = new Map<string, number>()
  
  reviews.forEach((review) => {
    if (review.data.category) {
      categoryMap.set(
        review.data.category, 
        (categoryMap.get(review.data.category) || 0) + 1
      )
    }
  })
  
  return categoryMap
}

export async function getAllColumnCategories(): Promise<Map<string, number>> {
  const columns = await getAllColumns()
  const categoryMap = new Map<string, number>()
  
  columns.forEach((column) => {
    if (column.data.category) {
      categoryMap.set(
        column.data.category,
        (categoryMap.get(column.data.category) || 0) + 1
      )
    }
  })
  
  return categoryMap
}

export async function getSortedReviewCategories(): Promise<
  { category: string; count: number }[]
> {
  const categoryMap = await getAllReviewCategories()
  return [...categoryMap.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => {
      const countDiff = b.count - a.count
      return countDiff !== 0 ? countDiff : a.category.localeCompare(b.category)
    })
}

export async function getSortedColumnCategories(): Promise<
  { category: string; count: number }[]
> {
  const categoryMap = await getAllColumnCategories()
  return [...categoryMap.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => {
      const countDiff = b.count - a.count
      return countDiff !== 0 ? countDiff : a.category.localeCompare(b.category)
    })
}
