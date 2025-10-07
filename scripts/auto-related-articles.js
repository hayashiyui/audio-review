#!/usr/bin/env node
// Auto-set relatedArticles in frontmatter and insert <RelatedArticlesGrid /> into MDX bodies.
// - Idempotent (run-safe multiple times)
// - Minimal diffs (preserve existing order; only append missing items up to limits)
//
// Usage:
//   node scripts/auto-related-articles.js src/content/reviews/_incoming/ta-solitaire-t.mdx
//
// Notes:
// - Requires .cache/catalog.json
// - Understands YAML frontmatter (---) and leaves non-YAML files untouched
// - For MDX, inserts a single Grid block after the first H2 section if none exists

import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

const ROOT = process.cwd()
const CATALOG_PATH = path.join(ROOT, '.cache', 'catalog.json')

function readJsonSafe(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch (e) {
    return null
  }
}

function normalizeString(s) {
  return (s || '').toString().trim()
}

function parsePriceUSD(x) {
  if (!x) return null
  // extract first number with optional commas and decimals
  const m = String(x).replace(/[,\s]/g, '').match(/([0-9]+(?:\.[0-9]+)?)/)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

function normalizeModel(m) {
  return (m || '').replace(/[^a-z0-9]/gi, '').toLowerCase()
}

function longestCommonSubstr(a, b) {
  if (!a || !b) return 0
  const m = a.length
  const n = b.length
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  let res = 0
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
        if (dp[i][j] > res) res = dp[i][j]
      }
    }
  }
  return res
}

function hasLink(links, slug) {
  if (!Array.isArray(links)) return false
  return links.some(l => typeof l === 'string' && l.includes(`/${slug}`))
}

function uniqBy(array, key) {
  const seen = new Set()
  const out = []
  for (const item of array || []) {
    const k = key(item)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(item)
  }
  return out
}

function scoreCandidate(target, cand, catalogMap) {
  if (!cand) return -Infinity
  if (cand.slug === target.slug) return -Infinity
  // Exclude English collection if we can detect; our catalog uses same slug for JA/EN so skip here.

  let score = 0

  if (normalizeString(cand.brand).toLowerCase() === normalizeString(target.brand).toLowerCase()) {
    score += 40
  }
  if (normalizeString(cand.category).toLowerCase() === normalizeString(target.category).toLowerCase()) {
    score += 25
  }

  // Internal links (either direction)
  const tLinks = target.internalLinks || []
  const cLinks = cand.internalLinks || []
  if (hasLink(tLinks, cand.slug) || hasLink(cLinks, target.slug)) {
    score += 25
  }

  // Price proximity (±25%)
  const tPrice = parsePriceUSD(target.price)
  const cPrice = parsePriceUSD(cand.price)
  if (tPrice && cPrice) {
    const low = tPrice * 0.75
    const high = tPrice * 1.25
    if (cPrice >= low && cPrice <= high) score += 15
  }

  // Model/series partial match
  const tM = normalizeModel(target.model)
  const cM = normalizeModel(cand.model)
  if (tM && cM && longestCommonSubstr(tM, cM) >= 3) {
    score += 10
  }

  return score
}

function loadCatalog() {
  const data = readJsonSafe(CATALOG_PATH)
  if (!Array.isArray(data)) throw new Error('catalog.json not found or invalid')
  const map = new Map()
  for (const r of data) {
    map.set(r.slug, r)
  }
  return { list: data, map }
}

function detectFrontmatterStyle(src) {
  if (src.startsWith('---\n')) return 'yaml'
  if (/^export\s+const\s+frontmatter\s*=\s*\{/.test(src)) return 'export'
  return 'none'
}

function parseDoc(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const style = detectFrontmatterStyle(raw)
  if (style === 'yaml') {
    const fm = matter(raw)
    return { style, data: fm.data || {}, content: fm.content, raw, fm }
  }
  // Fallback: treat entire file as content
  return { style: 'none', data: {}, content: raw, raw, fm: null }
}

function formatRelatedArticles(arr) {
  // Normalize to objects { collection, id }
  const out = []
  for (const it of arr || []) {
    if (!it) continue
    if (typeof it === 'string') {
      out.push({ collection: 'reviews', id: it })
    } else if (typeof it === 'object') {
      const collection = it.collection || 'reviews'
      const id = it.id || it.slug || it.path || null
      if (id) out.push({ collection, id })
    }
  }
  return uniqBy(out, x => `${x.collection}:${x.id}`)
}

function rewriteYamlFrontmatterPreserving(raw, updater) {
  // Replace only the relatedArticles block if present, otherwise append within YAML block.
  const start = raw.indexOf('---\n')
  if (start !== 0) return null
  const end = raw.indexOf('\n---', 4)
  if (end < 0) return null
  const yaml = raw.slice(4, end)
  const body = raw.slice(end + 4)

  // Find relatedArticles block
  const lines = yaml.split('\n')
  let i = 0
  let raStart = -1
  let raEnd = -1
  let indent = ''
  for (; i < lines.length; i++) {
    const line = lines[i]
    const m = line.match(/^(\s*)relatedArticles\s*:\s*$/)
    if (m) {
      raStart = i
      indent = m[1] || ''
      i++
      // consume until next top-level key (same indent and key-like pattern)
      for (; i < lines.length; i++) {
        const ln = lines[i]
        if (/^\s*[a-zA-Z0-9_-]+\s*:\s*/.test(ln) && !ln.startsWith(indent + '  ')) {
          break
        }
      }
      raEnd = i
      break
    }
  }

  const { yamlNewBlock, changed } = updater({
    originalBlock: raStart >= 0 ? lines.slice(raStart, raEnd).join('\n') : null,
    indent,
  })

  if (!changed) return null

  let newYaml
  if (raStart >= 0) {
    newYaml = [
      ...lines.slice(0, raStart),
      yamlNewBlock,
      ...lines.slice(raEnd),
    ].join('\n')
  } else {
    // append near the end, before trailing newlines
    const trimmed = yaml.replace(/\n+$/, '')
    newYaml = `${trimmed}\nrelatedArticles:\n${yamlNewBlock.replace(/^\s*relatedArticles:\n?/, '')}`
  }

  return `---\n${newYaml}\n---${body}`
}

function buildRelatedArticlesYaml(items, indent = '') {
  const i2 = indent + '  '
  const i3 = i2 + '  '
  const lines = ['relatedArticles:']
  for (const it of items) {
    lines.push(`${indent}- collection: ${it.collection}`)
    lines.push(`${i3.slice(0, indent.length + 2)}id: ${it.id}`)
  }
  return lines.join('\n')
}

function insertGridIntoMdx(content, articles, title = '関連記事') {
  if (!/\<RelatedArticlesGrid\b/.test(content)) {
    // prepare block
    const n = Math.max(1, Math.min(4, articles.length))
    const columns = n >= 4 ? 4 : n === 3 ? 3 : 2
    const articleLines = articles
      .slice(0, n)
      .map(a => `    { collection: "${a.collection}", id: "${a.id}" },`)
      .join('\n')
    const block = `\n<RelatedArticlesGrid\n  articles={[\n${articleLines}\n  ]}\n  columns={${columns}}\n  title="${title}"\n/>\n`

    // Find first H2 (## ) and insert right after the H2 line
    const lines = content.split('\n')
    let idx = -1
    for (let i = 0; i < lines.length; i++) {
      if (/^##\s/.test(lines[i])) {
        idx = i
        break
      }
    }
    if (idx === -1) {
      // insert after first paragraph
      const p = lines.findIndex(l => l.trim() === '')
      if (p >= 0) {
        lines.splice(p + 1, 0, block)
      } else {
        lines.push(block)
      }
    } else {
      lines.splice(idx + 1, 0, block)
    }
    content = lines.join('\n')
  }

  // Ensure import exists exactly once
  if (!/^import\s+RelatedArticlesGrid\s+from\s+'@\/components\/RelatedArticlesGrid\.astro'\s*$/m.test(content)) {
    // place after last import line at the top block
    const lines = content.split('\n')
    let lastImport = -1
    for (let i = 0; i < Math.min(lines.length, 200); i++) {
      if (/^import\s/.test(lines[i])) lastImport = i
      else if (lastImport >= 0 && lines[i].trim() === '') break
    }
    const importLine = "import RelatedArticlesGrid from '@/components/RelatedArticlesGrid.astro'"
    if (lastImport >= 0) {
      // Insert after the last import line
      lines.splice(lastImport + 1, 0, importLine)
    } else {
      lines.splice(0, 0, importLine, '')
    }
    content = lines.join('\n')
  }

  return content
}

function chooseGridArticlesFromFrontmatter(rel) {
  const arr = formatRelatedArticles(rel)
  return arr.slice(0, Math.min(4, arr.length))
}

function computeTopRelated(target, catalog) {
  const scored = []
  for (const cand of catalog.list) {
    if (cand.collection !== 'reviews' && cand.collection !== 'columns') continue
    if (cand.slug === target.slug) continue
    const s = scoreCandidate(target, cand, catalog.map)
    if (s > -Infinity) scored.push({ slug: cand.slug, collection: cand.collection, score: s })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored
}

function loadTargetContext(filePath, catalog) {
  // Derive slug from file path name (without extension)
  const slug = path.basename(filePath).replace(/\.(md|mdx)$/i, '')
  // Find record in catalog; if missing, infer minimal record from frontmatter
  const parsed = parseDoc(filePath)
  const fm = parsed.data || {}
  const record = catalog.map.get(slug) || {
    collection: 'reviews',
    slug,
    title: fm.title || '',
    brand: fm.brand || '',
    model: fm.model || '',
    category: fm.category || '',
    price: fm.price || '',
    tags: fm.tags || [],
    internalLinks: [],
  }
  return { slug, parsed, record }
}

function updateFrontmatterRelatedYaml(filePath, existingRel, desiredRel) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const updated = rewriteYamlFrontmatterPreserving(raw, ({ indent }) => {
    const yamlNewBlock = buildRelatedArticlesYaml(desiredRel, indent)
    const same = JSON.stringify(formatRelatedArticles(existingRel)) === JSON.stringify(formatRelatedArticles(desiredRel))
    return { yamlNewBlock, changed: !same }
  })
  if (updated && updated !== raw) {
    fs.writeFileSync(filePath, updated)
    return true
  }
  return false
}

function ensureReciprocal(targetSlug, targetRecord, catalog) {
  // Minimal-diff mode: skip reciprocal updates by default.
  // If you want to enable, set an env flag and only touch 'reviews' pages listed in the actual Grid.
  if (process.env.ENABLE_RECIPROCAL !== '1') return
  const candidates = Array.from(new Set(targetRecord._gridChosen || [])).slice(0, 4)
  const allowed = new Set(candidates)
  for (const slug of candidates) {
    const rec = catalog.map.get(slug)
    if (!rec || rec.collection !== 'reviews') continue
    const pagePathBase = path.join('src', 'content', rec.collection)
    const jpPaths = [
      path.join(pagePathBase, `${rec.slug}.mdx`),
      path.join(pagePathBase, `${rec.slug}.md`),
    ]
    const existsPath = jpPaths.find(p => fs.existsSync(p))
    if (!existsPath) continue
    const parsed = parseDoc(existsPath)
    if (parsed.style !== 'yaml') continue
    const fm = parsed.data || {}
    const current = formatRelatedArticles(fm.relatedArticles)
    const already = current.some(it => it.id === targetSlug)
    if (already || current.length >= 9) continue
    const next = [...current, { collection: 'reviews', id: targetSlug }]
    const changed = updateFrontmatterRelatedYaml(existsPath, current, next)
    if (changed) console.log(`Updated reciprocal relatedArticles: ${existsPath}`)
  }
}

async function main() {
  const targetPath = process.argv[2]
  if (!targetPath) {
    console.error('Usage: node scripts/auto-related-articles.js <path-to-md-or-mdx>')
    process.exit(1)
  }
  if (!fs.existsSync(CATALOG_PATH)) {
    console.error('Error: .cache/catalog.json is required')
    process.exit(1)
  }
  if (!fs.existsSync(targetPath)) {
    console.error(`Error: target not found: ${targetPath}`)
    process.exit(1)
  }

  const catalog = loadCatalog()
  const { slug, parsed, record } = loadTargetContext(targetPath, catalog)

  // Step1: frontmatter.relatedArticles (YAML only; export style untouched)
  let desiredRelated = []
  const existingRelated = formatRelatedArticles(parsed.data.relatedArticles)

  // Minimal-diff policy: if some relatedArticles already exist (1-9), keep as-is
  // Only complement when it's empty or contains invalid entries (handled by formatRelatedArticles)
  if (existingRelated.length === 0) {
    const ranked = computeTopRelated(
      { ...record, slug },
      catalog
    )
    desiredRelated = ranked
      .map(r => ({ collection: 'reviews', id: r.slug }))
      .slice(0, 9)
  } else {
    desiredRelated = existingRelated
  }

  // Update YAML frontmatter only if needed
  if (parsed.style === 'yaml') {
    updateFrontmatterRelatedYaml(targetPath, existingRelated, desiredRelated)
  }

  // Step2: Insert Grid into MDX (MDX only)
  const isMdx = /\.(mdx)$/i.test(targetPath)
  if (isMdx) {
    // Choose up to 4 from desired related
    const gridArticles = chooseGridArticlesFromFrontmatter(desiredRelated)
    // stash chosen to use in reciprocal step
    record._gridChosen = gridArticles.map(a => a.id)

    const raw = fs.readFileSync(targetPath, 'utf8')
    const fm = matter(raw)
    const after = insertGridIntoMdx(fm.content, gridArticles, '関連記事')
    let out = raw
    if (after !== fm.content) {
      // Preserve original frontmatter block verbatim (minimal diff)
      const head = fm.matter || ''
      out = `${head}\n${after}`
    }
    if (out !== raw) {
      fs.writeFileSync(targetPath, out)
      console.log(`Inserted RelatedArticlesGrid: ${targetPath}`)
    }
  }

  // Step3: Reciprocal updates (minimal: append ours if space exists)
  ensureReciprocal(slug, record, catalog)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
