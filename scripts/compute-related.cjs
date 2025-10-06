// Compute related articles for a target MD/MDX using .cache/catalog.json
// Usage: node scripts/compute-related.js <target-file>
// Prints JSON: { slug, collection, related: [{collection,id,score}], brand, model, category }

const fs = require('fs')
const path = require('path')

function readCatalog() {
  const p = path.resolve('.cache/catalog.json')
  const raw = fs.readFileSync(p, 'utf8')
  return JSON.parse(raw)
}

function normalizeBrand(s) {
  if (!s) return ''
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function normalizeCategory(s) {
  if (!s) return ''
  return String(s).toLowerCase()
}

function parsePriceUsd(p) {
  if (!p) return null
  const m = String(p).replace(/,/g, '').match(/\$\s*([0-9]+(?:\.[0-9]+)?)/)
  return m ? parseFloat(m[1]) : null
}

function yamlFrontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---/)
  if (!m) return {}
  const y = m[1]
  const out = {}
  // Very tiny YAML parser for simple key: value, key: [a, b]
  const lines = y.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const kv = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/)
    if (!kv) continue
    const key = kv[1]
    let val = kv[2].trim()
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1)
    } else if (val.startsWith("'") && val.endsWith("'")) {
      val = val.slice(1, -1)
    } else if (val.startsWith('[') && val.endsWith(']')) {
      // simple array split by comma
      const arr = val
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
      out[key] = arr
      continue
    }
    out[key] = val
  }
  return out
}

function extractSlugAndCollection(targetPath) {
  // src/content/<collection>/.../<slug>.mdx
  const parts = targetPath.split(path.sep)
  const idx = parts.indexOf('content')
  if (idx === -1) return { collection: '', slug: '' }
  const collection = parts[idx + 1]
  const file = parts[parts.length - 1]
  const slug = file.replace(/\.(md|mdx)$/i, '')
  return { collection, slug }
}

function internalLinksContains(links, collection, slug) {
  if (!Array.isArray(links) || !links.length) return false
  const needle = `/${collection}/${slug}`
  return links.some((s) => typeof s === 'string' && s.includes(needle))
}

function modelSeriesScore(aModel, bModel) {
  if (!aModel || !bModel) return 0
  const an = String(aModel).toLowerCase()
  const bn = String(bModel).toLowerCase()
  // simple: common token length >= 4 (e.g., "bathys", "px8", "xm6"-> 2 but allow xm)
  const tokensA = an.split(/[^a-z0-9]+/).filter((t) => t.length >= 2)
  const tokensB = bn.split(/[^a-z0-9]+/).filter((t) => t.length >= 2)
  const setB = new Set(tokensB)
  const common = tokensA.find((t) => setB.has(t))
  return common ? 10 : 0
}

function tagOverlapScore(aTags, bTags) {
  if (!Array.isArray(aTags) || !Array.isArray(bTags)) return 0
  const jaPrefs = new Set(['ワイヤレス', 'ノイズキャンセリング', 'Bluetooth', '密閉型'])
  const sa = new Set(aTags)
  const sb = new Set(bTags)
  let score = 0
  for (const t of jaPrefs) {
    if (sa.has(t) && sb.has(t)) score += 2 // small tie-breaker only
  }
  return score
}

function main() {
  const target = process.argv[2]
  if (!target) {
    console.error('Usage: node scripts/compute-related.js <target-file>')
    process.exit(2)
  }
  const src = fs.readFileSync(target, 'utf8')
  const fm = yamlFrontmatter(src)
  const { brand, model, category, price, tags } = fm
  const my = extractSlugAndCollection(target)
  const cat = readCatalog()
  const myBrandNorm = normalizeBrand(brand)
  const myCatNorm = normalizeCategory(category)
  const myPrice = parsePriceUsd(price)

  const related = []
  for (const rec of cat) {
    if (!rec || !rec.slug || !rec.collection) continue
    // Exclude self if present
    if (rec.slug === my.slug && rec.collection === my.collection) continue
    // Exclude obvious empties
    if (!rec.category) continue

    let score = 0
    // same brand
    if (myBrandNorm && normalizeBrand(rec.brand) === myBrandNorm) score += 40

    // same category
    if (myCatNorm && normalizeCategory(rec.category) === myCatNorm) score += 25

    // internal link either way (from rec -> me, or me -> rec - but we don't have my internal links here)
    if (internalLinksContains(rec.internalLinks, my.collection, my.slug)) score += 25

    // price proximity
    const recPrice = parsePriceUsd(rec.price)
    if (myPrice != null && recPrice != null && myPrice > 0) {
      const diff = Math.abs(recPrice - myPrice) / myPrice
      if (diff <= 0.25) score += 15
    }

    // model/series
    score += modelSeriesScore(model, rec.model)

    // tie-break via tag overlap (small weight)
    score += tagOverlapScore(tags, rec.tags)

    if (score > 0) {
      related.push({
        collection: rec.collection,
        id: rec.slug,
        score,
        title: rec.title || '',
      })
    }
  }

  related.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))

  const top = []
  const seen = new Set()
  for (const r of related) {
    const key = `${r.collection}:${r.id}`
    if (seen.has(key)) continue
    seen.add(key)
    top.push({ collection: r.collection, id: r.id, score: r.score })
    if (top.length >= 20) break
  }

  const result = {
    slug: my.slug,
    collection: my.collection,
    brand: brand || '',
    model: model || '',
    category: category || '',
    related: top,
  }
  process.stdout.write(JSON.stringify(result, null, 2))
}

main()
