#!/usr/bin/env node
/*
 Linkify citations and add anchors for references list per spec.
 - A) Add <a id="ref-n"></a> to reference list items in the last H2 titled 引用文献/参考文献/References
 - B) Linkify space+number occurrences [n](#ref-n) in body outside references section, with exclusions.
*/
const fs = require('fs');
const path = process.argv[2];
if (!path) {
  console.error('Usage: node scripts/linkify-refs.js <file>');
  process.exit(1);
}
const original = fs.readFileSync(path, 'utf8');
const lines = original.split(/\r?\n/);
// Find last H2 matching the section title
let refH2Index = -1;
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (/^##\s*(引用文献|参考文献|References)\s*$/i.test(l)) refH2Index = i;
}
let refEndIndex = lines.length; // exclusive
if (refH2Index >= 0) {
  for (let i = refH2Index + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) { refEndIndex = i; break; }
  }
}
// Collect references numbers R and add anchors in section
const R = new Set();
if (refH2Index >= 0) {
  for (let i = refH2Index + 1; i < refEndIndex; i++) {
    let line = lines[i];
    const already = /^\s*(?:[-*]\s*)?<a id="ref-(\d{1,3})"><\/a>/.exec(line);
    if (already) {
      const n = parseInt(already[1], 10);
      if (n >= 1 && n <= 999) R.add(n);
      continue;
    }
    // Patterns in priority: - [n], - n, n., n)
    let m;
    // - [n]
    m = /^\s*([-*]\s*)(\[(\d{1,3})\])(\s+.*|\s*)?$/.exec(line);
    if (m) {
      const n = parseInt(m[3],10);
      if (n>=1 && n<=999) {
        R.add(n);
        lines[i] = `${m[1]}<a id="ref-${n}"></a>${m[2]}${m[4]??''}`;
      }
      continue;
    }
    // - n ... (no dot)
    m = /^\s*([-*]\s*)((\d{1,3}))(\s+.*|\s*)?$/.exec(line);
    if (m) {
      const n = parseInt(m[2],10);
      if (n>=1 && n<=999) {
        R.add(n);
        lines[i] = `${m[1]}<a id="ref-${n}"></a>${m[2]}${m[4]??''}`;
      }
      continue;
    }
    // n. ...
    m = /^\s*((\d{1,3}))[.)](\s+.*|\s*)?$/.exec(line);
    if (m) {
      const n = parseInt(m[1],10);
      if (n>=1 && n<=999) {
        R.add(n);
        lines[i] = `<a id="ref-${n}"></a>${m[1]}${line[m[1].length] /* . or ) */}${m[3]??''}`;
      }
      continue;
    }
    // - [n] ... with trailing content
    m = /^\s*([-*]\s*)(\[(\d{1,3})\])([^\n]*)$/.exec(line);
    if (m) {
      const n = parseInt(m[3],10);
      if (n>=1 && n<=999) {
        R.add(n);
        lines[i] = `${m[1]}<a id="ref-${n}"></a>${m[2]}${m[4]}`;
      }
      continue;
    }
    // - n. ...
    m = /^\s*([-*]\s*)((\d{1,3})[.)])([^\n]*)$/.exec(line);
    if (m) {
      const n = parseInt(m[2],10);
      if (n>=1 && n<=999) {
        R.add(n);
        lines[i] = `${m[1]}<a id="ref-${n}"></a>${m[2]}${m[4]}`;
      }
      continue;
    }
  }
}
// Build array of R for quick test
const Rset = new Set([...R].map(String));
// Helper to detect code block fences
function isFence(line) {
  return /^\s*```/.test(line) || /^\s*~~~/.test(line);
}
// Build new body with linkification outside ref section
function linkifyRange(arr, from, to) {
  let inFence = false;
  for (let i = from; i < to; i++) {
    let s = arr[i];
    if (isFence(s)) { inFence = !inFence; arr[i] = s; continue; }
    if (inFence) continue;
    // Skip if line is H2 references heading line
    if (i === refH2Index) continue;
    // Mask inline code spans
    const maskRanges = [];
    // inline code
    {
      let idx = 0; let start = -1;
      while ((idx = s.indexOf('`', idx)) !== -1) {
        if (start === -1) { start = idx; idx++; }
        else { maskRanges.push([start, idx+1]); start = -1; idx++; }
      }
    }
    // autolinks <http...>
    {
      const re = /<https?:\/\/[^>]+>/g; let m;
      while ((m = re.exec(s))) { maskRanges.push([m.index, m.index + m[0].length]); }
    }
    // link/image URL parentheses parts
    {
      const re = /!?\[[^\]]*\]\(([^)]*)\)/g; let m;
      while ((m = re.exec(s))) {
        const inner = m[0];
        const open = inner.indexOf('(');
        const start = m.index + open + 1;
        const end = start + (m[1] ? m[1].length : 0);
        maskRanges.push([start, end]);
      }
    }
    // existing [n](#ref-n) and variants: mask to keep idempotent
    {
      const re = /\[(\d{1,3})\]\s*\(#ref-\1\)/g; let m;
      while ((m = re.exec(s))) { maskRanges.push([m.index, m.index + m[0].length]); }
    }
    // normalize mask ranges (merge overlaps)
    maskRanges.sort((a,b)=>a[0]-b[0]);
    const merged = [];
    for (const r of maskRanges) {
      if (!merged.length || r[0] > merged[merged.length-1][1]) merged.push(r);
      else merged[merged.length-1][1] = Math.max(merged[merged.length-1][1], r[1]);
    }
    // Build segments
    let cursor = 0; let out = '';
    function withinMasked(pos) {
      for (const [a,b] of merged) if (pos >= a && pos < b) return true; return false;
    }
    // First pass: handle ranges like " 3-5" or " 3–5"
    function replaceInSegment(seg) {
      // Two-step: ranges then singletons
      // Ranges
      seg = seg.replace(/(\s)(\d{1,3})(\s*[–-]\s*)(\d{1,3})(?!\d)/g, (m, sp, a, dash, b, off, str) => {
        if (!Rset.has(a) || !Rset.has(b)) return m;
        // Exclusions: currency before, units after each number
        const startIdx = off + sp.length; // index of first number
        const before = str.slice(0, off);
        // Check currency just before spaces
        const prevNonSpace = (before.match(/[^\s]$/) || [''])[0];
        if (prevNonSpace === '¥' || prevNonSpace === '$') return m;
        // Units after first number
        const afterA = str.slice(off + sp.length + a.length);
        if (/^\s?(%|Hz|kHz|MHz|dB|mm|cm|kg|g|Ω|ohm|V|mW|W|¥|\$|°|年|月|日)\b/.test(afterA)) return m;
        // Units after second number
        const afterB = str.slice(off + sp.length + a.length + dash.length + b.length);
        if (/^\s?(%|Hz|kHz|MHz|dB|mm|cm|kg|g|Ω|ohm|V|mW|W|¥|\$|°|年|月|日)\b/.test(afterB)) return m;
        return `${sp}[${a}](#ref-${a})${dash}[${b}](#ref-${b})`;
      });
      // Singletons
      seg = seg.replace(/(\s)(\d{1,3})(?!\d)/g, (m, sp, n, off, str) => {
        if (!Rset.has(n)) return m;
        // Skip if already linkified just ahead
        const rest = str.slice(off + sp.length + n.length);
        if (/^\s*\]\s*\(#ref-\d+\)/.test(rest)) return m;
        // Trailing character must be delimiter (space or punctuation), not a letter-like char
        if (!/^(\s|[.,;:、。\]\)\-–—]|$)/.test(rest)) return m;
        // Exclude decimals like " 3.0" (dot followed by digit)
        if (/^\.(?=\d)/.test(rest)) return m;
        // Currency before
        const before = str.slice(0, off);
        const prevNonSpaceMatch = before.match(/[^\s]$/);
        const prevNonSpace = prevNonSpaceMatch ? prevNonSpaceMatch[0] : '';
        if (prevNonSpace === '¥' || prevNonSpace === '$') return m;
        // Units after
        if (/^\s?(%|Hz|kHz|MHz|dB|mm|cm|kg|g|Ω|ohm|V|mW|W|¥|\$|°|年|月|日)\b/.test(rest)) return m;
        return `${sp}[${n}](#ref-${n})`;
      });
      return seg;
    }
    for (let p = 0; p <= s.length; p++) {
      const maskedHere = withinMasked(p);
      if (!maskedHere && p < s.length) continue;
      const chunk = s.slice(cursor, p);
      out += replaceInSegment(chunk);
      if (p < s.length) out += s[p];
      cursor = p + 1;
    }
    arr[i] = out;
  }
}
// Linkify parts outside references section by mutating lines
if (refH2Index >= 0) {
  linkifyRange(lines, 0, refH2Index);
  linkifyRange(lines, refEndIndex, lines.length);
} else {
  linkifyRange(lines, 0, lines.length);
}
process.stdout.write(lines.join('\n'));
