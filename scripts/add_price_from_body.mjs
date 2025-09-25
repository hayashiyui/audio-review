#!/usr/bin/env node
// Add `price: $XXXX` to review frontmatter by extracting dollar price from body (JP),
// then mirror the same value to the corresponding EN file if present.
// - Targets: src/content/reviews/*.mdx (excludes en/)
// - Price detection: "$123", "US$123", "9,500ドル", "約9,500ドル", "USD 123"
// - Skips: if no price is found in JP body, or JP already has price
// - EN: set the same price as JP (add or overwrite)

import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const REVIEWS_DIR = path.join(ROOT, 'src/content/reviews')

const WRITE = process.argv.includes('--write')

/**
 * Read file as UTF-8 text.
 */
function read(file) {
  return fs.readFileSync(file, 'utf8')
}

/**
 * Write text to file if changed.
 */
function writeIfChanged(file, next) {
  const prev = fs.readFileSync(file, 'utf8')
  if (prev === next) return false
  if (WRITE) fs.writeFileSync(file, next, 'utf8')
  return true
}

/**
 * Extract frontmatter and body.
 */
function splitFrontmatter(src) {
  const m = src.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/)
  if (!m) return { frontmatter: null, body: src, fmBlock: null }
  const fmBlock = m[0]
  const frontmatter = m[1]
  const body = src.slice(fmBlock.length)
  return { frontmatter, body, fmBlock }
}

function normalizeToken(s) {
  if (!s) return null
  const t = String(s).trim().replace(/^"|"$/g, '')
  if (!t) return null
  return t
}

function toLower(s) {
  return s ? s.toLowerCase() : s
}

function compact(s) {
  return s ? s.replace(/[\s\-_.]/g, '') : s
}

function yamlValue(frontmatter, key) {
  const m = frontmatter.match(new RegExp(`^${key}:\s*(.*)$`, 'mi'))
  if (!m) return null
  return normalizeToken(m[1])
}

function findAllPricesInText(text) {
  const out = []
  // $ or US$ amounts, optionally with range like "$8,000 - $10,500"
  const rSignG = /(?:US?\$|\$)\s*([0-9][0-9,]*(?:\.[0-9]{2})?)/g
  let m
  while ((m = rSignG.exec(text))) out.push(m[1].replace(/,/g, ''))

  // USD: 133,000 style
  const rUsdColonG = /USD\*{0,2}\s*:\*{0,2}\s*([0-9][0-9,]*(?:\.[0-9]{2})?)/g
  while ((m = rUsdColonG.exec(text))) out.push(m[1].replace(/,/g, ''))

  // Japanese "9,500ドル" / "約9,500ドル" / "30,000 USドル"
  const rJaG = /約?\s*((?:[0-9]{1,3}(?:,[0-9]{3})+)|[0-9]{3,})\s*(?:US?ドル|ドル)/g
  while ((m = rJaG.exec(text))) out.push(m[1].replace(/,/g, ''))

  return out
}

function parseTableRow(line) {
  // split markdown table row into trimmed cells, ignoring leading/trailing empties
  const raw = line.split('|').map(s => s.trim())
  // remove leading/trailing empty caused by pipes
  if (raw.length && raw[0] === '') raw.shift()
  if (raw.length && raw[raw.length - 1] === '') raw.pop()
  return raw
}

function extractDollarForProduct(body, { brand, model, title }) {
  const brandNorm = normalizeToken(brand)
  const modelNorm = normalizeToken(model)
  const titleNorm = normalizeToken(title)

  const tokens = []
  if (modelNorm) tokens.push(toLower(modelNorm), toLower(compact(modelNorm)))
  if (brandNorm) tokens.push(toLower(brandNorm), toLower(compact(brandNorm)))
  if (brandNorm && modelNorm) tokens.push(toLower(`${brandNorm} ${modelNorm}`), toLower(compact(`${brandNorm}${modelNorm}`)))
  if (titleNorm) tokens.push(toLower(titleNorm))
  const uniqueTokens = Array.from(new Set(tokens.filter(Boolean)))

  const lines = body.split(/\r?\n/)

  // 1) Try markdown table column matching using header row
  let targetCol = -1
  let inTable = false
  let foundFromTable = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!inTable) {
      if (line.includes('|')) {
        const cells = parseTableRow(line)
        if (cells.length >= 2) {
          // check header row: any cell contains model/brand token
          const matchIdx = cells.findIndex(c => uniqueTokens.some(t => c.toLowerCase().includes(t)))
          if (matchIdx >= 0) {
            // next line should be delimiter like | --- | --- |
            const delim = lines[i + 1] || ''
            if (/\|\s*:?-{3,}/.test(delim)) {
              targetCol = matchIdx
              inTable = true
              i++ // skip delimiter line
              continue
            }
          }
        }
      }
    } else {
      // within table block until a non-table line
      if (!/^\s*\|/.test(line)) {
        inTable = false
        targetCol = -1
        continue
      }
      const row = parseTableRow(line)
      if (targetCol >= 0 && targetCol < row.length) {
        const cell = row[targetCol]
        const prices = findAllPricesInText(cell)
        if (prices.length) foundFromTable.push(...prices)
      }
    }
  }
  if (foundFromTable.length) {
    const max = Math.max(...foundFromTable.map(n => Number(n)))
    if (Number.isFinite(max)) return `$${max}`
  }

  // 2) Section-based: scan the section whose heading contains the model/brand tokens
  const headingIdx = lines.findIndex(l => /^\s*#{2,3}\s+/.test(l) && uniqueTokens.some(t => l.toLowerCase().includes(t)))
  if (headingIdx >= 0) {
    const level = (lines[headingIdx].match(/^\s*(#{2,3})/)?.[1] || '##').length
    let end = lines.length
    for (let i = headingIdx + 1; i < lines.length; i++) {
      const m = lines[i].match(/^\s*(#{1,6})\s+/)
      if (m && m[1].length <= level) { end = i; break }
    }
    const section = lines.slice(headingIdx, end).join('\n')
    const EXCLUDE_NEAR = [/\bamp(lifier)?\b/i, /EF1000/i, /アンプ/]
    const candidates = []
    const rAll = /US?\$\s*[0-9][0-9,]*(?:\.[0-9]{2})?|\$\s*[0-9][0-9,]*(?:\.[0-9]{2})?|USD\s*:!?\s*[0-9][0-9,]*(?:\.[0-9]{2})?|約?\s*(?:[0-9]{1,3}(?:,[0-9]{3})+|[0-9]{3,})\s*(?:US?ドル|ドル)/gi
    let mm
    while ((mm = rAll.exec(section))) {
      const text = mm[0]
      const nums = findAllPricesInText(text)
      if (!nums.length) continue
      const num = Number(nums[nums.length - 1])
      const ctx = section.slice(Math.max(0, mm.index - 80), Math.min(section.length, mm.index + 80))
      if (EXCLUDE_NEAR.some(rx => rx.test(ctx))) continue
      candidates.push(num)
    }
    if (candidates.length) {
      const max = Math.max(...candidates)
      if (Number.isFinite(max)) return `$${max}`
    }
  }

  // 2b) If explicit USD: appears anywhere, take the largest — tends to be used in spec/price blocks
  {
    const usdAll = []
    const rUsdColonG2 = /USD\*{0,2}\s*:\*{0,2}\s*([0-9][0-9,]*(?:\.[0-9]{2})?)/g
    let m
    while ((m = rUsdColonG2.exec(body))) usdAll.push(Number(m[1].replace(/,/g, '')))
    if (usdAll.length) {
      const max = Math.max(...usdAll)
      if (Number.isFinite(max)) return `$${max}`
    }
  }

  // 3) Fallback: choose price occurrences closest to model/brand tokens within window
  const bodyLower = body.toLowerCase()
  // detect references section start to avoid picking youtube titles etc.
  const refHeadingMatch = bodyLower.match(/^##\s*(?:参考|references|出典)/m)
  let refStartIdx = refHeadingMatch ? refHeadingMatch.index : Infinity
  const refAnchorIdx = bodyLower.indexOf('<span id="ref-')
  if (refAnchorIdx >= 0) refStartIdx = Math.min(refStartIdx, refAnchorIdx)
  const modelPositions = []
  for (const t of uniqueTokens) {
    const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    let m
    while ((m = re.exec(bodyLower))) modelPositions.push(m.index)
  }
  const allMatches = []
  // Collect all prices with index positions
  const rAll = /US?\$\s*[0-9][0-9,]*(?:\.[0-9]{2})?|\$\s*[0-9][0-9,]*(?:\.[0-9]{2})?|USD\*{0,2}\s*:\*{0,2}\s*[0-9][0-9,]*(?:\.[0-9]{2})?|約?\s*(?:[0-9]{1,3}(?:,[0-9]{3})+|[0-9]{3,})\s*(?:US?ドル|ドル)/gi
  let mm
  while ((mm = rAll.exec(body))) {
    const text = mm[0]
    const nums = findAllPricesInText(text)
    if (!nums.length) continue
    const priceNum = Number(nums[nums.length - 1])
    const idx = mm.index
    allMatches.push({ idx, priceNum })
  }
  if (allMatches.length && modelPositions.length) {
    const EXCLUDE_NEAR = [/\bamp(lifier)?\b/i, /EF1000/i, /アンプ/]
    const within = allMatches
      .map(p => {
        const d = modelPositions.reduce((min, mp) => Math.min(min, Math.abs(p.idx - mp)), Infinity)
        return { ...p, dist: d }
      })
      .filter(p => p.dist <= 600)
      .filter(p => p.idx < refStartIdx) // ignore references/footnotes area
      .filter(p => {
        // Exclude obvious non-target contexts (e.g., dedicated amp EF1000 near Susvara mention)
        const ctx = body.slice(Math.max(0, p.idx - 60), Math.min(body.length, p.idx + 60))
        return !EXCLUDE_NEAR.some(rx => rx.test(ctx))
      })
    if (within.length) {
      const minDist = within.reduce((m, p) => Math.min(m, p.dist), Infinity)
      const near = within.filter(p => p.dist <= minDist + 10)
      const max = Math.max(...near.map(p => p.priceNum))
      if (Number.isFinite(max)) return `$${max}`
    }
  }

  return null
}

/**
 * Insert or replace price in frontmatter.
 */
function upsertPrice(frontmatter, price) {
  if (!frontmatter) return null
  const has = /^price:\s*/m.test(frontmatter)
  if (has) {
    // Replace existing value
    return frontmatter.replace(/^price:\s*.*?$/m, `price: ${price}`)
  }
  // Insert before end (append line)
  const trimmed = frontmatter.replace(/\s+$/, '')
  return `${trimmed}\nprice: ${price}\n`
}

/**
 * Process a single JP file and optionally its EN counterpart.
 */
function processFile(file) {
  const src = read(file)
  const { frontmatter, body, fmBlock } = splitFrontmatter(src)
  if (!frontmatter || !fmBlock) return { status: 'no-frontmatter' }

  if (/^price:\s*/m.test(frontmatter)) {
    return { status: 'jp-has-price' }
  }

  const brand = yamlValue(frontmatter, 'brand')
  const model = yamlValue(frontmatter, 'model')
  const title = yamlValue(frontmatter, 'title')
  const price = extractDollarForProduct(body, { brand, model, title })
  if (!price) return { status: 'no-price-found' }

  const nextFront = upsertPrice(frontmatter, price)
  const next = src.replace(fmBlock, `---\n${nextFront}---\n`)

  const changed = writeIfChanged(file, next)

  // EN counterpart
  const base = path.basename(file)
  const enPath = path.join(REVIEWS_DIR, 'en', base)
  let enStatus = 'en-missing'
  if (fs.existsSync(enPath)) {
    const enSrc = read(enPath)
    const { frontmatter: enFm, fmBlock: enFmBlock } = splitFrontmatter(enSrc)
    if (!enFm || !enFmBlock) {
      enStatus = 'en-no-frontmatter'
    } else {
      const nextEnFront = upsertPrice(enFm, price)
      const nextEn = enSrc.replace(enFmBlock, `---\n${nextEnFront}---\n`)
      const enChanged = writeIfChanged(enPath, nextEn)
      enStatus = enChanged ? 'en-updated' : 'en-unchanged'
    }
  }

  return { status: changed ? 'jp-updated' : 'jp-unchanged', price, enStatus }
}

function listTargetFiles() {
  const entries = fs.readdirSync(REVIEWS_DIR)
  const files = []
  for (const name of entries) {
    const p = path.join(REVIEWS_DIR, name)
    const stat = fs.statSync(p)
    if (stat.isDirectory()) continue
    if (!name.endsWith('.mdx')) continue
    // skip _incoming drafts? include them but they might already have price
    files.push(p)
  }
  return files
}

function main() {
  const files = listTargetFiles()
  const results = []
  for (const f of files) {
    const r = processFile(f)
    results.push({ file: path.relative(ROOT, f), ...r })
  }
  const summary = {
    total: results.length,
    jpUpdated: results.filter(r => r.status === 'jp-updated').length,
    jpHasPrice: results.filter(r => r.status === 'jp-has-price').length,
    noPrice: results.filter(r => r.status === 'no-price-found').length,
    enUpdated: results.filter(r => r.enStatus === 'en-updated').length,
  }
  console.log(JSON.stringify({ summary, results }, null, 2))
  if (!WRITE) {
    console.log('\n(dry-run) Use --write to apply changes.')
  }
}

main()
