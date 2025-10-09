#!/usr/bin/env node
/*
  Rebuild frontmatter.tags for given MD/MDX files based on global tag doc-frequency
  Source of truth: .cache/catalog.json

  Rules:
  - Popularity = document frequency across catalog (unique per doc), empty tags excluded
  - Priority = popularity desc, then string asc (stable)
  - For each target file:
    A) Must-include: country (derived from brand's existing records) and brand tag (prefer alias used in catalog)
    B) Add matches between content-derived related tokens and popular tags
    C) Filter out category/model/slug, 1-char, digits-only, duplicates
    D) Sort by priority and keep top 8 (must-include are always kept)
    E) Overwrite only frontmatter.tags; body stays intact
*/

const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()
const CATALOG = path.join(ROOT, '.cache', 'catalog.json')

function readJson(p) {
  const s = fs.readFileSync(p, 'utf8')
  return JSON.parse(s)
}

function buildGlobalTagStats(catalog) {
  const freq = new Map()
  for (const rec of catalog) {
    const tags = Array.isArray(rec.tags)
      ? [...new Set(rec.tags.filter(t => typeof t === 'string' && t.trim().length > 0))]
      : []
    for (const t of tags) freq.set(t, (freq.get(t) || 0) + 1)
  }
  const popular = Array.from(freq.entries())
    .map(([tag, df]) => ({ tag, df }))
    .sort((a, b) => (b.df - a.df) || a.tag.localeCompare(b.tag, 'ja'))
  const popularSet = new Set(popular.map(x => x.tag))
  return { freq, popular, popularSet }
}

function detectFrontmatterBounds(src) {
  // allow leading BOM/blank lines before frontmatter
  const startIdx = src.indexOf('---\n')
  if (startIdx === -1) return null
  const before = src.slice(0, startIdx).replace(/\uFEFF/g, '')
  if (before.trim() !== '') return null
  // find closing marker on its own line
  const closeIdx = src.indexOf('\n---\n', startIdx + 4)
  if (closeIdx === -1) return null
  const endIdx = closeIdx + '\n---\n'.length
  return { start: startIdx, end: endIdx }
}

function parseYamlFrontmatter(yaml) {
  const obj = {}
  const lines = yaml.split(/\r?\n/)
  for (const line of lines) {
    const m = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line)
    if (!m) continue
    const key = m[1]
    let val = m[2].trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    obj[key] = val
  }
  return obj
}

function getFileSlug(filePath, fmObj) {
  if (typeof fmObj.translationKey === 'string' && fmObj.translationKey.trim()) return fmObj.translationKey.trim()
  const base = path.basename(filePath)
  const m = /^(.*)\.(md|mdx)$/i.exec(base)
  return m ? m[1] : base
}

function computeCountryTagForBrand(catalog, brand) {
  const countryTags = new Set(['日本','米国','英国','ドイツ','フランス','デンマーク','カナダ','韓国','中国','ルーマニア','スペイン','ポーランド','オランダ','セルビア'])
  const byBrand = catalog.filter(r => r.brand === brand)
  const cand = new Map()
  for (const rec of byBrand) {
    for (const t of (rec.tags || [])) if (countryTags.has(t)) cand.set(t, (cand.get(t) || 0) + 1)
  }
  if (cand.size) return Array.from(cand.entries()).sort((a, b) => b[1] - a[1])[0][0]
  // minimal fallback for common brands
  const fallback = new Map([
    ['Bowers & Wilkins', '英国'],
  ])
  return fallback.get(brand) || null
}

function computeBrandTagForBrand(catalog, brand, globalStats) {
  const byBrand = catalog.filter(r => r.brand === brand)
  const score = new Map()
  const normalized = s => s.replace(/[^A-Za-z0-9]+/g, '').toLowerCase()
  const bNorm = normalized(brand)
  for (const rec of byBrand) {
    for (const t of (rec.tags || [])) {
      const tNorm = normalized(t)
      if (tNorm === bNorm || /^(bw|bowerswilkins|bowersandwilkins)$/.test(tNorm)) {
        score.set(t, (score.get(t) || 0) + 1)
      }
    }
  }
  if (score.size) {
    const { freq } = globalStats
    return Array.from(score.keys()).sort((a, b) => (freq.get(b) || 0) - (freq.get(a) || 0) || a.localeCompare(b, 'ja'))[0]
  }
  return brand
}

function extractRelatedTokens(text) {
  const tokens = new Set()
  const t = text
  if (/ハイエンドオーディオ|ハイエンド/.test(t)) tokens.add('ハイエンドオーディオ')
  if (/floorstanding|フロアスタンディング/i.test(t)) tokens.add('フロアスタンディング')
  if (/ブックシェルフ|bookshelf/i.test(t)) tokens.add('ブックシェルフ')
  if (/ノイズキャンセリング|\bANC\b/i.test(t)) tokens.add('ノイズキャンセリング')
  if (/ワイヤレス|bluetooth/i.test(t)) tokens.add('ワイヤレス')
  if (/LDAC/i.test(t)) tokens.add('LDAC')
  if (/apt\s?-?x(\s*hd|\s*adaptive)?/i.test(t)) tokens.add('aptX')
  if (/ハイレゾ|hi[-\s]?res/i.test(t)) tokens.add('ハイレゾ')
  if (/usb\s*-?dac|usb\s*c/i.test(t)) tokens.add('USB-DAC')
  if (/multipoint|マルチポイント/i.test(t)) tokens.add('マルチポイント')
  if (/ipx\d/i.test(t)) tokens.add('IPX')
  // diamond tweeter phrasing
  if (/ダイヤモンド/.test(t) && /(ツイーター|ドーム)/.test(t)) tokens.add('ダイヤモンド振動板')
  // Price-based super high-end if JPY >= 2,000,000 or USD >= 10,000 appears
  let addSuper = false
  const yenMatches = t.match(/[\u00A5¥]|JPY\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)/g)
  if (yenMatches) for (const m of yenMatches) { const num = parseInt(String(m).replace(/[^0-9]/g, ''), 10); if (num >= 2000000) addSuper = true }
  const usdMatches = t.match(/(USD|\$)\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)/g)
  if (usdMatches) for (const m of usdMatches) { const num = parseInt(String(m).replace(/[^0-9]/g, ''), 10); if (num >= 10000) addSuper = true }
  if (addSuper) tokens.add('スーパーハイエンド')
  return tokens
}

function buildTags({ catalog, globalStats, filePath, content }) {
  const bounds = detectFrontmatterBounds(content)
  if (!bounds) throw new Error('YAML frontmatter not found')
  const yaml = content.slice(bounds.start + 3, bounds.end - 3).replace(/^\n|\n$/g, '')
  const fm = parseYamlFrontmatter(yaml)
  const slug = getFileSlug(filePath, fm)
  const brand = fm.brand || ''
  const category = (fm.category || '').trim()
  const model = (fm.model || '').trim()

  const must = new Set()
  if (brand) {
    const country = computeCountryTagForBrand(catalog, brand)
    if (country) must.add(country)
    const brandTag = computeBrandTagForBrand(catalog, brand, globalStats)
    if (brandTag) must.add(brandTag)
  }

  // Candidate B: popular tags matched from content/body and fm.tags text
  const relatedHeur = extractRelatedTokens(content)
  const fmTagsLine = (yaml.match(/^tags:\s*\[(.*)\]\s*$/m) || [,''])[1]
  const fmTagsText = fmTagsLine || ''
  const haystack = String(fmTagsText)
  const candB = new Set()
  const countryTags = new Set(['日本','米国','英国','ドイツ','フランス','デンマーク','カナダ','韓国','中国','ルーマニア','スペイン','ポーランド','オランダ','セルビア'])
  for (const tag of globalStats.popularSet) {
    if (!tag) continue
    if (relatedHeur.has(tag)) { candB.add(tag); continue }
    // avoid pulling extra country tags from free text; country is handled in must
    if (countryTags.has(tag)) continue
    if (haystack.includes(tag)) candB.add(tag)
  }

  // Merge A + B and filter
  const merged = []
  for (const t of must) merged.push(t)
  // sort B by popularity first for deterministic fill
  const bSorted = Array.from(candB).sort((a, b) => (globalStats.freq.get(b) || 0) - (globalStats.freq.get(a) || 0) || a.localeCompare(b, 'ja'))
  for (const t of bSorted) if (!merged.includes(t)) merged.push(t)

  const headphoneOnly = new Set(['密閉型','開放型','ワイヤレス','ノイズキャンセリング','aptX','LDAC','マルチポイント','IPX','USB-DAC'])
  const isBad = (t) => {
    if (!t || typeof t !== 'string') return true
    if (t.length <= 1) return true
    if (/^[0-9]+$/.test(t)) return true
    if (t === slug || t.toLowerCase() === slug.toLowerCase()) return true
    if (model && t === model) return true
    if (category && t === category) return true
    // if article is Speakers, drop headphone-only tags
    if (/^speakers$/i.test(category) && headphoneOnly.has(t)) return true
    return false
  }
  const filtered = merged.filter(t => !isBad(t))

  // De-duplicate preserving order
  const dedup = []
  for (const t of filtered) if (!dedup.includes(t)) dedup.push(t)

  // Cap to 8 while keeping must-have
  const CAP = 8
  const keepSet = new Set(must)
  const kept = []
  for (const t of dedup) {
    if (keepSet.has(t)) kept.push(t)
  }
  for (const t of dedup) {
    if (kept.length >= CAP) break
    if (!keepSet.has(t)) kept.push(t)
  }

  // Final order: by popularity among chosen set
  const final = kept.sort((a, b) => (globalStats.freq.get(b) || 0) - (globalStats.freq.get(a) || 0) || a.localeCompare(b, 'ja'))
  return final
}

function replaceTagsLine(frontmatter, newTags) {
  const quote = (s) => '"' + s.replace(/"/g, '\\"') + '"'
  const arr = '[' + newTags.map(quote).join(', ') + ']'
  if (/^tags:\s*\[.*\]$/m.test(frontmatter)) {
    return frontmatter.replace(/^tags:\s*\[.*\]$/m, `tags: ${arr}`)
  }
  const sep = frontmatter.endsWith('\n') ? '' : '\n'
  return frontmatter + sep + `tags: ${arr}` + '\n'
}

function updateFileTags(filePath, catalog, globalStats) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const bounds = detectFrontmatterBounds(raw)
  if (!bounds) throw new Error(`Frontmatter not found in ${filePath}`)
  const fmBlock = raw.slice(bounds.start + 3, bounds.end - 3).replace(/^\n|\n$/g, '')
  const newTags = buildTags({ catalog, globalStats, filePath, content: raw })
  const newFmBlock = replaceTagsLine(fmBlock, newTags)
  const next = raw.slice(0, bounds.start) + '---\n' + newFmBlock + '\n---\n' + raw.slice(bounds.end)
  if (next !== raw) {
    fs.writeFileSync(filePath, next, 'utf8')
    return { updated: true, tags: newTags }
  }
  return { updated: false, tags: newTags }
}

function main() {
  const targets = process.argv.slice(2)
  if (!targets.length) {
    console.error('Usage: node scripts/rebuild-tags-from-catalog.cjs <file1.mdx> [file2.mdx ...]')
    process.exit(1)
  }
  const catalog = readJson(CATALOG)
  const globalStats = buildGlobalTagStats(catalog)
  const results = []
  for (const t of targets) {
    const abs = path.isAbsolute(t) ? t : path.join(ROOT, t)
    if (!fs.existsSync(abs)) { results.push({ file: t, error: 'not found' }); continue }
    try {
      const r = updateFileTags(abs, catalog, globalStats)
      results.push({ file: t, ...r })
    } catch (e) {
      results.push({ file: t, error: e.message || String(e) })
    }
  }
  console.log(JSON.stringify(results, null, 2))
}

if (require.main === module) {
  try { main() } catch (e) { console.error(e.message || String(e)); process.exit(1) }
}
