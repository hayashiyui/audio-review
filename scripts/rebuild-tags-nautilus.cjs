#!/usr/bin/env node
/*
  Rebuild frontmatter.tags for a specific article based on global tag doc-frequency
  Rules (summarized):
  - Global popularity: count unique tag occurrences per doc across .cache/catalog.json
  - Candidate A (must-include): country tag and brand tag
  - Candidate B: from popular tags matched to article content/metadata (heuristics)
  - Filters: exclude category/model/slug-like, 1-char, numeric-only, duplicates
  - Max 7 tags, order by (df desc, tag asc). Keep A even if low df.
  - YAML frontmatter only (target file uses YAML). Body untouched.
*/

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CATALOG = path.join(ROOT, '.cache', 'catalog.json');
const TARGET = path.join(
  ROOT,
  'src/content/reviews/_incoming/bowers-and-wilkins-nautilus.mdx'
);

function readJson(p) {
  const s = fs.readFileSync(p, 'utf8');
  return JSON.parse(s);
}

function buildGlobalTagStats(catalog) {
  const freq = new Map();
  for (const rec of catalog) {
    const tags = Array.isArray(rec.tags) ? [...new Set(rec.tags.filter(t => typeof t === 'string' && t.trim().length > 0))] : [];
    for (const t of tags) {
      freq.set(t, (freq.get(t) || 0) + 1);
    }
  }
  const popular = Array.from(freq.entries())
    .map(([tag, df]) => ({ tag, df }))
    .sort((a, b) => (b.df - a.df) || a.tag.localeCompare(b.tag));
  const popularSet = new Set(popular.map(x => x.tag));
  return { freq, popular, popularSet };
}

function detectFrontmatterBounds(src) {
  if (!src.startsWith('---')) return null;
  const end = src.indexOf('\n---', 3);
  if (end === -1) return null;
  const endIdx = end + '\n---'.length;
  return { start: 0, end: endIdx };
}

function parseYamlFrontmatter(yaml) {
  // Very small YAML subset parser for simple key: value lines used here.
  // We only need brand, model, category, translationKey/title in case of filtering
  const obj = {};
  const lines = yaml.split(/\r?\n/);
  for (const line of lines) {
    const m = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    else if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    obj[key] = val;
  }
  return obj;
}

function getFileSlug(filePath, fmObj) {
  // Prefer translationKey if present, else file name
  if (typeof fmObj.translationKey === 'string' && fmObj.translationKey.trim()) return fmObj.translationKey.trim();
  const base = path.basename(filePath);
  const m = /^(.*)\.(md|mdx)$/i.exec(base);
  return m ? m[1] : base;
}

function computeCountryTagForBrand(catalog, brand) {
  // Known country tags seen globally
  const countryTags = new Set(['日本', '米国', '英国', 'ドイツ', 'フランス', 'デンマーク', 'カナダ', '韓国', '中国', 'ルーマニア', 'ポーランド']);
  const byBrand = catalog.filter(r => r.brand === brand);
  const cand = new Map();
  for (const rec of byBrand) {
    for (const t of (rec.tags || [])) {
      if (countryTags.has(t)) cand.set(t, (cand.get(t) || 0) + 1);
    }
  }
  if (cand.size) {
    // pick most frequent
    return Array.from(cand.entries()).sort((a, b) => b[1] - a[1])[0][0];
  }
  // Fallback minimal mapping for common brands
  const fallback = new Map([
    ['Bowers & Wilkins', '英国'],
  ]);
  return fallback.get(brand) || null;
}

function computeBrandTagForBrand(catalog, brand, globalStats) {
  const byBrand = catalog.filter(r => r.brand === brand);
  const score = new Map();
  for (const rec of byBrand) {
    for (const t of (rec.tags || [])) {
      // Heuristic: tag is brand-like if equal to brand or looks like a known alias inside brand (e.g., B&W)
      const normalized = s => s.replace(/[^A-Za-z0-9]+/g, '').toLowerCase();
      const tNorm = normalized(t);
      const bNorm = normalized(brand);
      if (tNorm === bNorm || /^(bw|bowerswilkins|bowersandwilkins)$/.test(tNorm)) {
        score.set(t, (score.get(t) || 0) + 1);
      }
    }
  }
  if (score.size) {
    // choose the one with highest global df, then lexicographical
    const { freq } = globalStats;
    return Array.from(score.keys()).sort((a, b) => (freq.get(b) || 0) - (freq.get(a) || 0) || a.localeCompare(b))[0];
  }
  // default to brand itself
  return brand;
}

function extractRelatedTokens(text) {
  const tokens = new Set();
  const t = text;
  // Heuristic matches
  if (/ハイエンド/.test(t) || /ハイエンドオーディオ/.test(t)) tokens.add('ハイエンドオーディオ');
  if (/floorstanding/i.test(t)) tokens.add('フロアスタンディング');
  if (/ドーム/.test(t) || /コーン/.test(t)) tokens.add('ダイナミック型');
  if (/ノイズキャンセリング/.test(t)) tokens.add('ノイズキャンセリング');
  if (/ワイヤレス/.test(t)) tokens.add('ワイヤレス');
  if (/LDAC/i.test(t)) tokens.add('LDAC');
  if (/apt\s?X/i.test(t)) tokens.add('aptX');
  // Price-based (super high-end) if JPY >= 2,000,000 or USD >= 10000 appears
  let addSuper = false;
  // JPY
  const yenMatches = t.match(/([\u00A5¥]|JPY)\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)/g);
  if (yenMatches) {
    for (const m of yenMatches) {
      const num = parseInt(m.replace(/[^0-9]/g, ''), 10);
      if (num >= 2000000) addSuper = true;
    }
  }
  // USD
  const usdMatches = t.match(/(USD|\$)\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)/g);
  if (usdMatches) {
    for (const m of usdMatches) {
      const num = parseInt(m.replace(/[^0-9]/g, ''), 10);
      if (num >= 10000) addSuper = true;
    }
  }
  if (addSuper) tokens.add('スーパーハイエンド');
  return tokens;
}

function buildTags({ catalog, globalStats, filePath, content }) {
  const bounds = detectFrontmatterBounds(content);
  if (!bounds) throw new Error('YAML frontmatter not found');
  const yaml = content.slice(bounds.start + 3, bounds.end - 3).replace(/^\n|\n$/g, '');
  const fm = parseYamlFrontmatter(yaml);
  const slug = getFileSlug(filePath, fm);
  const brand = fm.brand || '';
  const category = (fm.category || '').trim();
  const model = (fm.model || '').trim();

  const must = new Set();
  // Candidate A: country + brand
  if (brand) {
    const country = computeCountryTagForBrand(catalog, brand);
    if (country) must.add(country);
    const brandTag = computeBrandTagForBrand(catalog, brand, globalStats);
    if (brandTag) must.add(brandTag);
  }

  // Candidate B: popular tags matched from content
  const related = extractRelatedTokens(content);
  const candB = Array.from(related).filter(t => globalStats.popularSet.has(t));

  // Merge
  const merged = [];
  for (const t of must) merged.push(t);
  // Sort B by popularity
  const bSorted = candB.sort((a, b) => (globalStats.freq.get(b) || 0) - (globalStats.freq.get(a) || 0) || a.localeCompare(b));
  for (const t of bSorted) if (!merged.includes(t)) merged.push(t);

  // Filters
  const isBad = (t) => {
    if (!t || typeof t !== 'string') return true;
    if (t.length <= 1) return true;
    if (/^[0-9]+$/.test(t)) return true;
    if (t === slug || t.toLowerCase() === slug.toLowerCase()) return true;
    if (model && t === model) return true;
    if (category && t === category) return true;
    return false;
  };
  const filtered = merged.filter(t => !isBad(t));

  // If fewer than 7 and there are other highly popular tags that match content broadly, optionally add 'ハイエンドオーディオ'
  if (filtered.length < 7 && !filtered.includes('ハイエンドオーディオ') && /ハイエンド/.test(content)) {
    filtered.push('ハイエンドオーディオ');
  }

  // De-duplicate while keeping original order, then re-order by popularity
  const dedup = [];
  for (const t of filtered) if (!dedup.includes(t)) dedup.push(t);
  // Trim to max 7 but keep must-have even if low-popularity
  const keepSet = new Set(must);
  const trimmed = [];
  for (const t of dedup) {
    if (trimmed.length >= 7) break;
    // always include must-haves first; remaining B fill afterwards
    if (keepSet.has(t)) {
      trimmed.push(t);
    }
  }
  for (const t of dedup) {
    if (trimmed.length >= 7) break;
    if (!trimmed.includes(t)) trimmed.push(t);
  }
  // Final order: by popularity among the chosen set
  const final = [...trimmed].sort((a, b) => (globalStats.freq.get(b) || 0) - (globalStats.freq.get(a) || 0) || a.localeCompare(b));

  return final;
}

function replaceTagsLine(frontmatter, newTags) {
  const quote = (s) => '"' + s.replace(/"/g, '\\"') + '"';
  const arr = '[' + newTags.map(quote).join(', ') + ']';
  if (/^tags:\s*\[.*$/m.test(frontmatter)) {
    return frontmatter.replace(/^tags:\s*\[.*$/m, `tags: ${arr}`);
  }
  // If no existing tags line, append one at the end of the frontmatter block
  const sep = frontmatter.endsWith('\n') ? '' : '\n';
  return frontmatter + sep + `tags: ${arr}` + '\n';
}

function main() {
  const catalog = readJson(CATALOG);
  const globalStats = buildGlobalTagStats(catalog);
  const raw = fs.readFileSync(TARGET, 'utf8');
  const bounds = detectFrontmatterBounds(raw);
  if (!bounds) throw new Error('Frontmatter not found in target');
  const fmBlock = raw.slice(bounds.start + 3, bounds.end - 3).replace(/^\n|\n$/g, '');
  const newTags = buildTags({ catalog, globalStats, filePath: TARGET, content: raw });
  const newFmBlock = replaceTagsLine(fmBlock, newTags);
  const next = raw.slice(0, bounds.start) + '---\n' + newFmBlock + '\n---' + raw.slice(bounds.end);
  if (next !== raw) {
    fs.writeFileSync(TARGET, next, 'utf8');
    console.log(JSON.stringify({ updated: true, tags: newTags }));
  } else {
    console.log(JSON.stringify({ updated: false, tags: newTags }));
  }
}

if (require.main === module) {
  try { main(); } catch (e) { console.error(e.message || String(e)); process.exit(1); }
}
