#!/usr/bin/env node
/**
 * Normalize MD/MDX formatting for incoming review files.
 *
 * Rules (idempotent):
 * A) Remove top-level H1 immediately after frontmatter (first non-empty line starting with "# ").
 * B) Change the last heading named one of [引用文献, 参考文献, References] to H2 (##), preserving inline formatting.
 * C) In that references section (from the matched heading to EOF),
 *    remove Japanese access-date expressions like "10月 7, 2025にアクセス" including the following comma-like punctuation and extra spaces.
 *
 * Notes:
 * - Frontmatter must not be modified.
 * - Apply only to specified files passed as CLI args.
 */
const fs = require('fs');
const path = require('path');

function normalizeFile(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const lines = src.split(/\r?\n/);

  // Locate frontmatter bounds if present at top
  let fmStart = -1;
  let fmEnd = -1;
  if (lines[0] && lines[0].trim() === '---') {
    fmStart = 0;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') { fmEnd = i; break; }
    }
  }
  const contentStartIdx = fmEnd >= 0 ? fmEnd + 1 : 0;

  // A) Remove H1 if the first non-empty line after frontmatter starts with '# '
  {
    for (let i = contentStartIdx; i < lines.length; i++) {
      const raw = lines[i];
      if (raw.trim() === '') continue; // skip empty lines
      if (raw.startsWith('# ')) {
        // Delete exactly this line
        lines.splice(i, 1);
      }
      break; // only inspect the very first non-empty line
    }
  }

  // B) Find the last heading with name among targets and force to H2
  const headingTargets = new Set(['引用文献', '参考文献']);
  const matchHeading = (line) => {
    const m = line.match(/^\s*(#{1,6})\s+(.+?)\s*$/);
    if (!m) return null;
    // Strip simple inline emphasis markers for name matching only
    const nameRaw = m[2];
    const nameNorm = nameRaw
      .replace(/^\*+|\*+$/g, '') // trim leading/trailing asterisks
      .replace(/^_+|_+$/g, '')
      .trim();
    const lower = nameNorm.toLowerCase();
    if (headingTargets.has(nameNorm) || lower === 'references') {
      return { level: m[1].length, nameRaw, matchRange: m[0] };
    }
    return null;
  };
  const matchedIdx = [];
  for (let i = contentStartIdx; i < lines.length; i++) {
    const res = matchHeading(lines[i]);
    if (res) matchedIdx.push(i);
  }
  let refHeadingIdx = -1;
  if (matchedIdx.length > 0) {
    refHeadingIdx = matchedIdx[matchedIdx.length - 1];
    // Rebuild as H2 preserving inline text (nameRaw)
    const m = lines[refHeadingIdx].match(/^\s*(#{1,6})\s+(.+?)\s*$/);
    if (m) {
      const nameRaw = m[2];
      lines[refHeadingIdx] = '## ' + nameRaw.trim();
    }
  }

  // C) Within references section, scrub access-date expressions on list lines
  if (refHeadingIdx >= 0) {
    const accessRe = /\b(?:1[0-2]|[1-9])月\s+(?:3[01]|[12][0-9]|[1-9]),\s*\d{4}にアクセス(?:[、，,]\s*)?/g;
    for (let i = refHeadingIdx + 1; i < lines.length; i++) {
      const line = lines[i];
      // bullets or ordered list lines only
      if (/^\s*(?:[-*+]\s+|\d+\.\s+)/.test(line)) {
        let replaced = line.replace(accessRe, '');
        // Tidy up any double spaces left just before '[' but keep trailing two-space hard-breaks
        // Only collapse spaces where we removed the access block (middle of line)
        replaced = replaced.replace(/\s+(?=\[)/g, ' ');
        lines[i] = replaced;
      }
    }
  }

  const out = lines.join('\n');
  if (out !== src) {
    fs.writeFileSync(filePath, out, 'utf8');
  }
}

function main() {
  const files = process.argv.slice(2).filter(Boolean);
  if (files.length === 0) {
    console.error('No input files. Usage: node scripts/normalize-incoming-mdx.cjs <file> [...files]');
    process.exit(2);
  }
  try {
    for (const f of files) {
      const p = path.resolve(process.cwd(), f);
      if (!fs.existsSync(p)) {
        console.error(`Not found: ${f}`);
        process.exit(3);
      }
      normalizeFile(p);
    }
  } catch (e) {
    console.error(e?.stack || String(e));
    process.exit(1);
  }
}

if (require.main === module) main();

