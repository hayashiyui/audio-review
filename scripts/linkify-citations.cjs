#!/usr/bin/env node
// Linkify in-text citation numbers to reference anchors and add anchors in the reference list.
// Usage: node scripts/linkify-citations.js <path-to-mdx>
// Idempotent: safe to run multiple times.

const fs = require('fs')
const path = require('path')

function read(file) {
  return fs.readFileSync(file, 'utf8')
}

function write(file, content) {
  fs.writeFileSync(file, content, 'utf8')
}

// Normalize H2 heading text (strip markdown formatting like ** and extra spaces)
function normalizeHeading(line) {
  if (!/^##\s+/.test(line)) return null
  let text = line.replace(/^##\s+/, '').trim()
  // remove surrounding bold markers if present
  text = text.replace(/^\*\*(.*)\*\*$/,'$1').trim()
  return text
}

function findReferenceSection(lines) {
  const targetHeadings = new Set(['引用文献', '参考文献', 'References'])
  let refStartIdx = -1
  for (let i = 0; i < lines.length; i++) {
    const norm = normalizeHeading(lines[i])
    if (norm && targetHeadings.has(norm)) {
      refStartIdx = i
    }
  }
  if (refStartIdx === -1) return null
  let refEndIdx = lines.length
  for (let i = refStartIdx + 1; i < lines.length; i++) {
    // next H2 or higher (## or #)
    if (/^##\s+/.test(lines[i]) || /^#\s+/.test(lines[i])) {
      refEndIdx = i
      break
    }
  }
  return { refHeadingIdx: refStartIdx, refStart: refStartIdx + 1, refEnd: refEndIdx }
}

function addAnchorsAndCollect(lines, refRange) {
  const { refStart, refEnd } = refRange
  const numbers = new Set()
  const newLines = [...lines]
  for (let i = refStart; i < refEnd; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    let m
    // patterns priority: - [n], - n, n., n)
    // 1) bullet with [n]
    m = line.match(/^(\s*[-*]\s*)(\[(\d{1,3})\])(.*)$/)
    if (m) {
      const n = parseInt(m[3], 10)
      if (n >= 1 && n <= 999) {
        numbers.add(n)
        const anchor = `<a id="ref-${n}"></a>`
        if (!line.includes(anchor)) {
          newLines[i] = `${m[1]}${anchor}${m[2]}${m[4]}`
        }
      }
      continue
    }
    // 2) bullet with n (e.g., "- 1 Foo")
    m = line.match(/^(\s*[-*]\s+)(\d{1,3})(\b.*)$/)
    if (m) {
      const n = parseInt(m[2], 10)
      if (n >= 1 && n <= 999) {
        numbers.add(n)
        const anchor = `<a id="ref-${n}"></a>`
        if (!line.includes(anchor)) {
          newLines[i] = `${m[1]}${anchor}${m[2]}${m[3]}`
        }
      }
      continue
    }
    // 3) ordered list like "1. Foo" or "1) Foo"
    m = line.match(/^(\s*)(\d{1,3})([.)])(\s+)(.*)$/)
    if (m) {
      const n = parseInt(m[2], 10)
      if (n >= 1 && n <= 999) {
        numbers.add(n)
        const anchor = `<a id="ref-${n}"></a>`
        if (!line.includes(anchor)) {
          newLines[i] = `${m[1]}${m[2]}${m[3]}${m[4]}${anchor}${m[5]}`
        }
      }
      continue
    }
    // 4) catch-all: if the line starts with an anchor already, try to extract number following it
    m = line.match(/^(\s*)<a id="ref-(\d{1,3})"><\/a>(.*)$/)
    if (m) {
      const n = parseInt(m[2], 10)
      if (n >= 1 && n <= 999) numbers.add(n)
    }
  }
  return { lines: newLines, refNumbers: numbers }
}

function linkifyBody(text, refNumbers) {
  // Units/symbols that should suppress linking if they appear right after the number (allowing optional spaces)
  const forbiddenAfter = [
    '%','Hz','kHz','MHz','dB','mm','cm','kg','g','Ω','ohm','V','mW','W','¥','$','°','年','月','日'
  ]

  function hasForbiddenAfter(rest) {
    const t = rest.replace(/^[ \t]+/, '')
    for (const u of forbiddenAfter) {
      if (t.startsWith(u)) return true
    }
    return false
  }

  function prevNonSpaceChar(s, idx) {
    for (let i = idx - 1; i >= 0; i--) {
      const c = s[i]
      if (c !== ' ' && c !== '\t') return c
    }
    return ''
  }

  // 1) Handle ranges like " 3-5" or " 3–5"
  const rangeRe = /(\s)(\d{1,3})(\s*[–-]\s*)(\d{1,3})(?=\b|[^0-9A-Za-z]|$)/g
  text = text.replace(rangeRe, (m, sp, n1, dash, n2, offset, s) => {
    const N1 = parseInt(n1, 10)
    const N2 = parseInt(n2, 10)
    // Skip if either number out of range set
    const inR1 = refNumbers.has(N1)
    const inR2 = refNumbers.has(N2)
    if (!inR1 && !inR2) return m
    // Skip if just after currency symbol
    const prev = prevNonSpaceChar(s, offset + sp.length)
    if (prev === '$' || prev === '¥') return m
    // Check forbidden units after first and second numbers
    const afterN1 = s.slice(offset + sp.length + n1.length)
    // afterN2: at end of full match
    const matchEnd = offset + m.length
    const afterN2 = s.slice(matchEnd)
    if (hasForbiddenAfter(afterN1) || hasForbiddenAfter(afterN2)) return m
    const part1 = inR1 ? `${sp}[${N1}](#ref-${N1})` : `${sp}${n1}`
    const part2 = inR2 ? `[${N2}](#ref-${N2})` : `${n2}`
    return `${part1}${dash}${part2}`
  })

  // 2) Handle single numbers: " 7" -> " [7](#ref-7)"
  const singleRe = /(\s)(\d{1,3})(?=\b|[^0-9A-Za-z]|$)/g
  text = text.replace(singleRe, (m, sp, n, offset, s) => {
    const N = parseInt(n, 10)
    if (!refNumbers.has(N)) return m
    // Avoid already linkified [n](#ref-n)
    const before = s.slice(Math.max(0, offset - 2), offset + m.length + 20)
    if (/\[\s*\d{1,3}\s*\]\s*\(#ref-\d{1,3}\)/.test(before)) return m
    // Skip if just after currency symbol
    const prev = prevNonSpaceChar(s, offset + sp.length)
    if (prev === '$' || prev === '¥') return m
    // Skip if forbidden unit/symbol follows (allowing optional spaces)
    const rest = s.slice(offset + sp.length + n.length)
    // Skip decimals or thousand separators like 5.1 / 22,000
    if (/^[ \t]*[\.,]\d/.test(rest)) return m
    // Skip if previous non-space char is a slash (e.g., ratings like 4.5 / 5)
    const prevChar = prevNonSpaceChar(s, offset + sp.length)
    if (prevChar === '/' || /[A-Za-z]/.test(prevChar)) return m
    if (hasForbiddenAfter(rest)) return m
    return `${sp}[${N}](#ref-${N})`
  })

  // Cleanup: revert false positives like [5](#ref-5).1 or [22](#ref-22),000 or [2](#ref-2)mm
  text = text
    .replace(/\[(\d{1,3})\]\(#ref-\1\)(?=\s*[\.,]\d)/g, '$1')
    .replace(/\[(\d{1,3})\]\(#ref-\1\)(?=\s*(?:mm|cm|kg|g|Ω|ohm|V|mW|W)\b)/g, '$1')
    .replace(/\[(\d{1,3})\]\(#ref-\1\)(?=\s*(?:Hz|kHz|MHz|dB)\b)/g, '$1')
    .replace(/\/(\s*)\[(\d{1,3})\]\(#ref-\2\)/g, '/$1$2')
    .replace(/\[(\d{1,3})\]\(#ref-\1\)(?=\s*\/\s*\d)/g, '$1')
    .replace(/\b([A-Za-z]+)\s*\[(\d{1,3})\]\(#ref-\2\)/g, '$1 $2')

  return text
}

function process(content) {
  // Preserve YAML frontmatter
  let fmEndIdx = -1
  if (content.startsWith('---')) {
    const lines = content.split(/\r?\n/)
    for (let i = 1; i < lines.length; i++) {
      if (/^---\s*$/.test(lines[i])) { fmEndIdx = i; break }
    }
    if (fmEndIdx !== -1) {
      const fm = lines.slice(0, fmEndIdx + 1).join('\n')
      const bodyLines = lines.slice(fmEndIdx + 1)
      const { resultBody } = processBody(bodyLines.join('\n'))
      return fm + '\n' + resultBody
    }
  }
  // No frontmatter or unterminated; just process whole
  const { resultBody } = processBody(content)
  return resultBody
}

function processBody(body) {
  const lines = body.split(/\r?\n/)
  const refRange = findReferenceSection(lines)
  if (!refRange) {
    return { resultBody: body }
  }
  // Step A: add anchors and collect R
  const { lines: withAnchors, refNumbers } = addAnchorsAndCollect(lines, refRange)

  // Step B: linkify outside reference section
  const pre = withAnchors.slice(0, refRange.refHeadingIdx).join('\n')
  const headingAndRefs = withAnchors.slice(refRange.refHeadingIdx, refRange.refEnd).join('\n')
  const post = withAnchors.slice(refRange.refEnd).join('\n')

  const linkedPre = linkifyBody(pre, refNumbers)
  const linkedPost = linkifyBody(post, refNumbers)

  const resultBody = [linkedPre, headingAndRefs, linkedPost].join('\n')
  return { resultBody }
}

function main() {
  // Some sandboxes provide no argv beyond the node binary.
  // Fallback to the specific review file when no argument is given.
  const fallback = 'src/content/reviews/_incoming/ta-solitaire-t.mdx'
  const file = (Array.isArray(process.argv) && process.argv.length >= 3) ? process.argv[2] : fallback
  const src = read(file)
  const out = process(src)
  if (out !== src) write(file, out)
}

if (require.main === module) main()
