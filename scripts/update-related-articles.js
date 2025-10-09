// Auto-update related articles and insert RelatedArticlesGrid for a target MDX/MD file
// Idempotent and minimal-diff focused: only edits relatedArticles in frontmatter and inserts Grid blocks/imports.
// Usage: node scripts/update-related-articles.js src/content/reviews/_incoming/bowers-and-wilkins-nautilus.mdx

import fs from 'node:fs'
import path from 'node:path'

const CATALOG_PATH = path.join(process.cwd(), '.cache', 'catalog.json')
const GRID_IMPORT_LINE = "import RelatedArticlesGrid from '@/components/RelatedArticlesGrid.astro'"

/**
 * Read JSON catalog
 */
function readCatalog() {
  const raw = fs.readFileSync(CATALOG_PATH, 'utf-8')
  const data = JSON.parse(raw)
  return data
}

/**
 * Parse frontmatter YAML block from content and return { frontmatterYAML, contentBody, meta }
 * Very lightweight parser: assumes frontmatter starts at beginning with ---\n and ends with \n---\n
 */
function splitFrontmatter(content) {
  if (!content.startsWith('---')) {
    return { frontmatter: null, body: content, lang: 'mdx' }
  }
  const end = content.indexOf('\n---', 3)
  if (end === -1) {
    return { frontmatter: null, body: content, lang: 'mdx' }
  }
  const fm = content.slice(0, end + 4) // includes trailing ---\n
  const body = content.slice(end + 4)
  return { frontmatter: fm, body, lang: 'yaml' }
}

/**
 * Extract a YAML scalar value from frontmatter string by key (top-level)
 */
function getYamlScalar(fm, key) {
  const re = new RegExp(`^${key}\\s*:\\s*(.*)$`, 'm')
  const m = fm.match(re)
  if (!m) return null
  let v = m[1].trim()
  // strip surrounding quotes if any
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1)
  }
  return v
}

/**
 * Extract simple YAML array from frontmatter by key (e.g., tags: [a, b])
 */
function getYamlInlineArray(fm, key) {
  const re = new RegExp(`^${key}\\s*:\\s*\\[(.*)\\]\\s*$`, 'm')
  const m = fm.match(re)
  if (!m) return null
  const inner = m[1]
  if (!inner.trim()) return []
  // split by comma not inside quotes (simple heuristic)
  return inner
    .split(',')
    .map(s => s.trim())
    .map(s => {
      if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
        return s.slice(1, -1)
      }
      return s
    })
}

/**
 * Replace or insert the relatedArticles YAML block minimally.
 * Returns new content string.
 */
function replaceRelatedArticlesYaml(content, relatedList) {
  const { frontmatter, body } = splitFrontmatter(content)
  if (!frontmatter) return content // not YAML frontmatter, skip

  const newBlockLines = []
  newBlockLines.push('relatedArticles:')
  relatedList.forEach(item => {
    newBlockLines.push(`  - collection: ${item.collection}`)
    newBlockLines.push(`    id: ${item.id}`)
  })
  const newBlock = newBlockLines.join('\n') + '\n'

  // Find existing relatedArticles block
  const lines = frontmatter.split('\n')
  let startIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (/^relatedArticles\s*:/.test(lines[i])) {
      startIdx = i
      break
    }
  }

  let newFrontmatter = frontmatter
  if (startIdx >= 0) {
    // Determine block indent of 'relatedArticles:' and find the block end robustly
    const keyIndent = (lines[startIdx].match(/^\s*/)?.[0] || '').length
    let endIdx = startIdx
    for (let j = startIdx + 1; j < lines.length; j++) {
      const line = lines[j]
      if (/^---\s*$/.test(line)) { // end of YAML FM
        endIdx = j - 1
        break
      }
      const indentLen = (line.match(/^\s*/)?.[0] || '').length
      const isTopLevelKey = indentLen <= keyIndent && /^[A-Za-z0-9_\-]+\s*:/.test(line)
      if (isTopLevelKey) {
        endIdx = j - 1
        break
      }
      endIdx = j
    }
    const before = lines.slice(0, startIdx).join('\n')
    const after = lines.slice(endIdx + 1).join('\n')
    // Ensure trailing newline handling
    newFrontmatter = [before, newBlock.trimEnd(), after].join('\n')
  } else {
    // Insert before closing ---
    const insertPos = frontmatter.lastIndexOf('\n---')
    newFrontmatter = frontmatter.slice(0, insertPos) + '\n' + newBlock + frontmatter.slice(insertPos)
  }
  return newFrontmatter + body
}

function parseExistingRelatedFromYaml(content) {
  const { frontmatter } = splitFrontmatter(content)
  if (!frontmatter) return []
  const lines = frontmatter.split('\n')
  const arr = []
  let collecting = false
  let keyIndent = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^relatedArticles\s*:\s*\[\s*\]\s*$/.test(line)) {
      // empty inline array
      return []
    }
    if (/^relatedArticles\s*:/.test(line)) {
      collecting = true
      keyIndent = (line.match(/^\s*/)?.[0] || '').length
      continue
    }
    if (collecting) {
      if (/^---\s*$/.test(line)) break
      const indentLen = (line.match(/^\s*/)?.[0] || '').length
      if (indentLen <= keyIndent && /^[A-Za-z0-9_\-]+\s*:/.test(line)) break
      const m1 = line.match(/^\s*-\s*collection:\s*(\S+)/)
      if (m1) {
        arr.push({ collection: m1[1], id: null })
        continue
      }
      const m2 = line.match(/^\s*id:\s*(\S+)/)
      if (m2 && arr.length) {
        arr[arr.length - 1].id = m2[1]
      }
    }
  }
  // filter invalid entries
  return arr.filter(x => x.collection && x.id)
}

function normalizeCategory(cat) {
  if (!cat) return ''
  return String(cat).trim().toLowerCase().replace(/s$/, '')
}

function parsePriceUSD(str) {
  if (!str) return null
  const m = String(str).replace(/[,\s]/g, '').match(/\$([0-9]+(?:\.[0-9]+)?)/)
  if (!m) return null
  return parseFloat(m[1])
}

function modelSimilarity(a, b) {
  if (!a || !b) return false
  const na = a.toLowerCase().replace(/[^a-z0-9]/g, ' ')
  const nb = b.toLowerCase().replace(/[^a-z0-9]/g, ' ')
  const aTokens = na.split(/\s+/).filter(t => t.length >= 2)
  for (const t of aTokens) {
    if (nb.includes(t)) return true
  }
  return false
}

function includesLinkToSlug(internalLinks, collection, slug) {
  if (!Array.isArray(internalLinks)) return false
  const needle = `/${collection}/${slug}/`
  return internalLinks.some(s => typeof s === 'string' && s.includes(needle))
}

function scoreCandidate(target, cand) {
  let score = 0
  // same brand
  if (target.brand && cand.brand && target.brand.toLowerCase() === cand.brand.toLowerCase()) score += 40
  // same category (singularized)
  if (normalizeCategory(target.category) && normalizeCategory(cand.category) && normalizeCategory(target.category) === normalizeCategory(cand.category)) score += 25
  // mutual/internal links (we only know if cand links to target from catalog)
  if (includesLinkToSlug(cand.internalLinks, 'reviews', target.slug)) score += 25
  // price proximity
  if (target.price && cand.price) {
    const within = cand.price >= target.price * 0.75 && cand.price <= target.price * 1.25
    if (within) score += 15
  }
  // model/series similarity
  if (modelSimilarity(target.model, cand.model)) score += 10
  return score
}

function uniqueById(list) {
  const seen = new Set()
  const out = []
  for (const x of list) {
    const key = `${x.collection}:${x.slug}`
    if (!seen.has(key)) {
      seen.add(key)
      out.push(x)
    }
  }
  return out
}

function buildRelatedList(existing, ranked, maxItems = 9) {
  // De-duplicate existing while preserving order
  const seen = new Set()
  const normalized = []
  for (const e of existing) {
    const k = `${e.collection}:${e.id}`
    if (seen.has(k)) continue
    seen.add(k)
    normalized.push(e)
  }
  // Enforce hard cap first (idempotent)
  let out = normalized.slice(0, maxItems)
  if (out.length >= maxItems) return out
  const existingSet = new Set(out.map(e => `${e.collection}:${e.id}`))
  for (const r of ranked) {
    const key = `${r.collection}:${r.slug}`
    if (existingSet.has(key)) continue
    out.push({ collection: r.collection, id: r.slug })
    existingSet.add(key)
    if (out.length >= maxItems) break
  }
  return out
}

function ensureGridImport(content) {
  if (content.includes(GRID_IMPORT_LINE)) return content
  const { frontmatter, body } = splitFrontmatter(content)
  const afterFm = frontmatter ? body : content
  const lines = afterFm.split('\n')
  // find last import line at the top contiguous block
  let lastImportIndex = -1
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^\s*import\s+/.test(line)) lastImportIndex = i
    else if (line.trim() === '') continue
    else if (lastImportIndex >= 0) break
    else if (i > 20) break // bail early
  }
  if (lastImportIndex >= 0) {
    lines.splice(lastImportIndex + 1, 0, GRID_IMPORT_LINE)
    const newBody = lines.join('\n')
    return (frontmatter ? frontmatter : '') + newBody
  }
  // no import block; insert at very top after fm
  if (frontmatter) return frontmatter + GRID_IMPORT_LINE + '\n' + body
  return GRID_IMPORT_LINE + '\n' + content
}

function insertGridBlock(content, articles, title = '関連記事') {
  if (!articles.length) return content
  if (content.includes('<RelatedArticlesGrid')) return content // already present anywhere → be conservative
  const { frontmatter, body } = splitFrontmatter(content)
  const searchArea = frontmatter ? body : content
  const lines = searchArea.split('\n')

  // find first H2 heading line starting with '## '
  let insertAt = -1
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^##\s/.test(line) || /^##\*\*/.test(line)) { // supports '## **Title**'
      insertAt = i
      break
    }
  }
  if (insertAt === -1) return content // no h2 found → skip

  // move past heading line and following single blank line
  let insIdx = insertAt + 1
  while (insIdx < lines.length && lines[insIdx].trim() === '') insIdx++

  const count = Math.min(4, Math.max(1, articles.length))
  const cols = count >= 4 ? 4 : count === 3 ? 3 : 2
  const items = articles.slice(0, count)
  const itemsStr = items
    .map(a => `    { collection: "${a.collection}", id: "${a.slug}" },`)
    .join('\n')
  const block = [
    '',
    '<RelatedArticlesGrid',
    '  articles={[',
    itemsStr,
    '  ]}',
    `  columns={${cols}}`,
    `  title="${title}"`,
    '/>',
    '',
  ].join('\n')

  lines.splice(insIdx, 0, block)
  const newSearchArea = lines.join('\n')
  return (frontmatter ? frontmatter : '') + newSearchArea
}

function findContentFileBySlug(collection, slug) {
  const base = path.join('src', 'content', collection)
  const patterns = [
    path.join(base, `${slug}.mdx`),
    path.join(base, `${slug}.md`),
    path.join(base, '**', `${slug}.mdx`),
    path.join(base, '**', `${slug}.md`),
  ]
  for (const p of patterns) {
    if (fs.existsSync(p)) return p
  }
  return null
}

function main() {
  const targetPath = process.argv[2]
  if (!targetPath) {
    console.error('Usage: node scripts/update-related-articles.js <path-to-md-or-mdx>')
    process.exit(1)
  }
  if (!fs.existsSync(CATALOG_PATH)) {
    console.error(`Catalog not found: ${CATALOG_PATH}`)
    process.exit(1)
  }

  const catalog = readCatalog()
  const targetContent = fs.readFileSync(targetPath, 'utf-8')
  const { frontmatter } = splitFrontmatter(targetContent)
  if (!frontmatter) {
    console.error('Frontmatter YAML not found in target file. Aborting.')
    process.exit(1)
  }
  const slug = path.basename(targetPath).replace(/\.(md|mdx)$/i, '')
  const brand = getYamlScalar(frontmatter, 'brand') || ''
  const model = getYamlScalar(frontmatter, 'model') || ''
  const category = getYamlScalar(frontmatter, 'category') || ''
  const priceStr = getYamlScalar(frontmatter, 'price') || ''
  const tags = getYamlInlineArray(frontmatter, 'tags') || []
  const price = parsePriceUSD(priceStr)

  const target = { slug, brand, model, category, price, tags }

  // prepare catalog records with normalized price numbers
  const records = catalog
    .filter(r => r && r.slug && !(r.slug === slug && r.collection === 'reviews'))
    .map(r => ({ ...r, price: parsePriceUSD(r.price || '') }))

  // Rank candidates
  const ranked = records
    .map(r => ({
      ...r,
      score: scoreCandidate(target, r),
    }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug))

  // Build frontmatter.relatedArticles (respect existing order)
  const existing = parseExistingRelatedFromYaml(targetContent)
  const relatedList = buildRelatedList(existing, ranked, 9)

  // Write back relatedArticles block (YAML only)
  let updated = replaceRelatedArticlesYaml(targetContent, relatedList)

  // Insert Grid for MDX only
  const ext = path.extname(targetPath).toLowerCase()
  if (ext === '.mdx') {
    // select up to 4 strongest from same category for the grid
    const sameCat = ranked.filter(r => normalizeCategory(r.category) === normalizeCategory(category))
    const gridPicks = (sameCat.length ? sameCat : ranked).slice(0, 4)

    // ensure import
    updated = ensureGridImport(updated)
    // insert block near first H2
    updated = insertGridBlock(updated, gridPicks)
  }

  if (updated !== targetContent) {
    fs.writeFileSync(targetPath, updated, 'utf-8')
    console.log(`Updated target: ${targetPath}`)
  } else {
    console.log('No changes to target (idempotent).')
  }

  // Step3: Update reciprocal relatedArticles for grid picks (if we inserted any)
  const reciprocalTargets = []
  if (ext === '.mdx') {
    // Recompute gridPicks with same logic
    const sameCat = ranked.filter(r => normalizeCategory(r.category) === normalizeCategory(category))
    const gridPicks = (sameCat.length ? sameCat : ranked).slice(0, 4)
    reciprocalTargets.push(...gridPicks)
  }

  for (const rec of reciprocalTargets) {
    const filePath = findContentFileBySlug(rec.collection, rec.slug)
    if (!filePath) continue
    const content = fs.readFileSync(filePath, 'utf-8')
    const exist = parseExistingRelatedFromYaml(content)
    const key = `${'reviews'}:${slug}`
    const has = new Set(exist.map(e => `${e.collection}:${e.id}`)).has(key)
    if (has) continue
    const newList = [...exist, { collection: 'reviews', id: slug }]
    const newContent = replaceRelatedArticlesYaml(content, newList)
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf-8')
      console.log(`Updated reciprocal: ${filePath}`)
    }
  }
}

// ESM entry
main()
