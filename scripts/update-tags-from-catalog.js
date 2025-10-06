#!/usr/bin/env node
/**
 * Rebuild frontmatter.tags for given MD/MDX files based on global tag popularity
 * from .cache/catalog.json and content-derived related terms.
 *
 * Rules (summarized):
 * - Popularity = document frequency across catalog (unique per doc), empty tags excluded
 * - Priority = popularity desc, then string asc (stable)
 * - For each target file:
 *   A) Add mandatory tags: country (if detectable) and brand (from frontmatter)
 *   B) Add matches between content-related terms and popular tags
 *   C) Filter: exclude category/model/slug, 1-char, digits-only, duplicates
 *   D) Sort by priority and keep top 7
 *   E) Overwrite frontmatter.tags only; keep rest intact
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const CATALOG_PATH = path.join(ROOT, '.cache', 'catalog.json');

function loadCatalog() {
  const raw = fs.readFileSync(CATALOG_PATH, 'utf8');
  /** @type {Array<{slug:string,tags?:string[]}>} */
  const data = JSON.parse(raw);
  // Build doc-frequency map
  /** @type {Map<string, number>} */
  const freq = new Map();
  for (const rec of data) {
    const tags = Array.isArray(rec.tags) ? rec.tags.filter(t => typeof t === 'string' && t.length > 0) : [];
    const uniq = Array.from(new Set(tags));
    for (const t of uniq) {
      freq.set(t, (freq.get(t) || 0) + 1);
    }
  }
  return freq;
}

/** Extract frontmatter range [startIdx,endIdx] in text that begins with --- and ends with --- */
function getFrontmatterRange(text) {
  const start = text.indexOf('\n---\n') === 0 ? 0 : (text.startsWith('---\n') ? 0 : -1);
  // If file starts with '---\n', find the next '\n---\n'
  if (start === 0) {
    const end = text.indexOf('\n---\n', '---\n'.length);
    if (end !== -1) return [0, end + '\n---\n'.length];
  }
  // Not YAML style; try MDX object style: export const frontmatter = { ... }
  const mdxObjStart = text.indexOf('export const frontmatter');
  if (mdxObjStart !== -1) {
    // naive brace matching from first '{'
    const braceIdx = text.indexOf('{', mdxObjStart);
    if (braceIdx !== -1) {
      let i = braceIdx, depth = 0;
      while (i < text.length) {
        const ch = text[i];
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) {
            return [mdxObjStart, i + 1];
          }
        }
        i++;
      }
    }
  }
  return [-1, -1];
}

function parseFrontmatterYamlBlock(block) {
  // Very small YAML reader for simple key: value pairs used in this repo
  // We only need brand/model/category/tags line values.
  const out = {};
  const lines = block.split('\n');
  for (const line of lines) {
    if (!line.includes(':')) continue;
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (key === 'tags') {
      const arrMatch = val.match(/^\[(.*)\]$/);
      if (arrMatch) {
        const inner = arrMatch[1].trim();
        if (!inner) out[key] = [];
        else {
          // split by comma but keep quoted strings
          const items = inner.match(/\"([^\\\"]|\\.)*\"|\'([^\\\']|\\.)*\'|[^,]+/g) || [];
          out[key] = items.map(s => s.trim().replace(/^['\"]|['\"]$/g, ''));
        }
      } else {
        out[key] = [];
      }
    } else {
      // strip surrounding quotes if any
      val = val.replace(/^['\"]|['\"]$/g, '');
      out[key] = val;
    }
  }
  return out;
}

function extractRelatedTerms(text, fm) {
  const bodyStart = text.indexOf('\n---\n') === 0 ? text.indexOf('\n---\n', '---\n'.length) + '\n---\n'.length : 0;
  const body = text.slice(bodyStart);
  const source = (body + '\n' + (Array.isArray(fm.tags) ? fm.tags.join(' ') : '')).toLowerCase();

  /** @type {Set<string>} */
  const terms = new Set();
  // Direct Japanese terms
  if (/ノイズキャンセリング|\banc\b/i.test(source)) terms.add('ノイズキャンセリング');
  if (/ワイヤレス/i.test(source)) terms.add('ワイヤレス');
  if (/密閉型/i.test(source)) terms.add('密閉型');
  if (/ダイナミック(ドライバー|型)?/i.test(source)) terms.add('ダイナミック型');
  if (/(aptx(\s*hd|\s*adaptive)?)/i.test(source)) terms.add('aptX');
  if (/\bldac\b/i.test(source)) terms.add('LDAC');
  if (/\bbluetooth\b/i.test(source)) terms.add('Bluetooth');
  if (/hi[-\s]?res|ハイレゾ/i.test(source)) terms.add('ハイレゾ');
  if (/usb\s*-?dac|usb\s*c/i.test(source)) terms.add('USB-DAC');
  if (/multipoint|マルチポイント/i.test(source)) terms.add('マルチポイント');
  if (/ipx\d/i.test(source)) terms.add('IPX');

  // Country hints (simple Japanese mentions)
  if (/ドイツ/.test(text)) terms.add('ドイツ');
  if (/日本/.test(text)) terms.add('日本');
  if (/米国|アメリカ/.test(text)) terms.add('米国');
  if (/英国|イギリス/.test(text)) terms.add('英国');
  if (/フランス/.test(text)) terms.add('フランス');
  if (/韓国/.test(text)) terms.add('韓国');
  if (/中国/.test(text)) terms.add('中国');
  if (/デンマーク/.test(text)) terms.add('デンマーク');
  if (/オーストリア/.test(text)) terms.add('オーストリア');
  if (/カナダ/.test(text)) terms.add('カナダ');
  if (/ルーマニア/.test(text)) terms.add('ルーマニア');
  if (/スペイン/.test(text)) terms.add('スペイン');
  if (/ポーランド/.test(text)) terms.add('ポーランド');
  if (/オランダ/.test(text)) terms.add('オランダ');
  if (/セルビア/.test(text)) terms.add('セルビア');
  return terms;
}

function buildTagsForFile(absPath, freq) {
  const raw = fs.readFileSync(absPath, 'utf8');
  const [fmStart, fmEnd] = getFrontmatterRange(raw);
  if (fmStart !== 0 || fmEnd === -1) {
    throw new Error(`Frontmatter not found or not at start: ${absPath}`);
  }
  const fmBlock = raw.slice('---\n'.length, fmEnd - '\n---\n'.length);
  const fm = parseFrontmatterYamlBlock(fmBlock);
  const brand = fm.brand || '';
  const model = fm.model || '';
  const category = fm.category || '';

  const terms = extractRelatedTerms(raw, fm);
  // Candidate sets
  const mandatory = new Set();
  if (brand) mandatory.add(brand);
  // Pick one country if present in terms and in popularity list
  const countryCandidates = ['ドイツ','日本','米国','英国','フランス','韓国','中国','デンマーク','オーストリア','カナダ','ルーマニア','スペイン','ポーランド','オランダ','セルビア'];
  for (const c of countryCandidates) {
    if (terms.has(c)) { mandatory.add(c); break; }
  }

  // Popular tag universe
  const popularSet = new Set(freq.keys());

  // From terms, only those present in popular tags
  const related = new Set(Array.from(terms).filter(t => popularSet.has(t)));

  // Combine
  /** @type {string[]} */
  let combined = Array.from(new Set([...mandatory, ...related]));

  // Filters
  const slug = path.basename(absPath).replace(/\.(md|mdx)$/i, '');
  combined = combined.filter(t => {
    if (!t) return false;
    if (t === category || t === model || t === slug) return false;
    if (/^\d+$/.test(t)) return false; // digits only
    if (t.length <= 1) return false; // 1-char
    return true;
  });

  // Separate mandatory and optional (related) to enforce inclusion of mandatory
  const optional = combined.filter(t => !mandatory.has(t));
  const sortKey = (t) => [-(freq.get(t) || 0), t];
  optional.sort((a, b) => {
    const fa = freq.get(a) || 0;
    const fb = freq.get(b) || 0;
    if (fb !== fa) return fb - fa;
    return a.localeCompare(b, 'ja');
  });
  // Build final keeping mandatory, then best optional until cap
  const cap = 7;
  const finalSet = new Set();
  for (const m of mandatory) finalSet.add(m);
  for (const t of optional) {
    if (finalSet.size >= cap) break;
    finalSet.add(t);
  }
  // Order final by global priority (popularity desc, string asc)
  const final = Array.from(finalSet).sort((a, b) => {
    const fa = freq.get(a) || 0;
    const fb = freq.get(b) || 0;
    if (fb !== fa) return fb - fa;
    return a.localeCompare(b, 'ja');
  });

  return final;
}

function overwriteTagsInlineYaml(text, newTags) {
  const startMark = '---\n';
  const endMark = '\n---\n';
  if (!text.startsWith(startMark)) return text;
  const end = text.indexOf(endMark, startMark.length);
  if (end === -1) return text;
  const header = text.slice(0, end + endMark.length);
  const body = text.slice(end + endMark.length);
  // Replace a single-line tags: [..] keeping spacing style: tags: ["a", "b"]
  const headerNew = header.replace(/^(tags:\s*)\[[^\n\]]*\](\s*)$/m, (_m, p1, p2) => {
    const arr = '[' + newTags.map(t => JSON.stringify(t)).join(', ') + ']';
    return `${p1}${arr}${p2}`;
  });
  return headerNew + body;
}

function main() {
  const freq = loadCatalog();
  const targets = process.argv.slice(2);
  if (targets.length === 0) {
    console.error('Usage: node scripts/update-tags-from-catalog.js <file1.mdx> [file2.mdx ...]');
    process.exit(1);
  }
  for (const t of targets) {
    const abs = path.isAbsolute(t) ? t : path.join(ROOT, t);
    if (!fs.existsSync(abs)) {
      console.error(`Not found: ${t}`);
      process.exitCode = 2;
      continue;
    }
    const newTags = buildTagsForFile(abs, freq);
    const before = fs.readFileSync(abs, 'utf8');
    const after = overwriteTagsInlineYaml(before, newTags);
    if (before !== after) {
      fs.writeFileSync(abs, after, 'utf8');
      console.log(`Updated tags for ${t}: ${JSON.stringify(newTags)}`);
    } else {
      console.log(`No changes for ${t} (tags already up to date).`);
    }
  }
}

// ESM entry
main();
