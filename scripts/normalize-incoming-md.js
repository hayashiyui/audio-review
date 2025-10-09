// Normalize Markdown per A/B/C rules for a single file.
// Usage: node scripts/normalize-incoming-md.js <path-to-mdx>
import fs from 'node:fs'
import path from 'node:path'

const file = process.argv[2]
if (!file) {
  console.error('Missing file path')
  process.exit(2)
}

const abspath = path.resolve(process.cwd(), file)
let text = ''
try {
  text = fs.readFileSync(abspath, 'utf8')
} catch (e) {
  process.exit(3)
}

const lines = text.split(/\r?\n/)

// A) Remove leading H1 after frontmatter
let i = 0
let inFrontmatter = false
if (lines[0]?.trim() === '---') {
  inFrontmatter = true
  i = 1
  while (i < lines.length) {
    if (lines[i].trim() === '---') {
      i++
      break
    }
    i++
  }
}
let bodyStart = i
while (bodyStart < lines.length && lines[bodyStart].trim() === '') bodyStart++
if (bodyStart < lines.length && /^#\s+/.test(lines[bodyStart])) {
  lines.splice(bodyStart, 1)
}

// B) Normalize final References heading to H2 (## )
const isTargetHeading = (raw) => {
  const m = raw.match(/^\s{0,3}(#{1,6})\s+(.*)$/)
  if (!m) return null
  let text = m[2].trim()
  // strip simple emphasis wrappers like **...** or __...__
  if (/^\*\*(.*)\*\*$/.test(text)) text = RegExp.$1.trim()
  if (/^__(.*)__$/.test(text)) text = RegExp.$1.trim()
  const lower = text.toLowerCase()
  if (text === '引用文献' || text === '参考文献' || lower === 'references') {
    return { level: m[1].length, text }
  }
  return null
}

let lastRefIdx = -1
let lastRefText = ''
for (let idx = 0; idx < lines.length; idx++) {
  const info = isTargetHeading(lines[idx])
  if (info) {
    lastRefIdx = idx
    lastRefText = info.text
  }
}
if (lastRefIdx >= 0) {
  lines[lastRefIdx] = `## ${lastRefText.trim()}`
}

// C) Remove access-date expressions within the references section list items
if (lastRefIdx >= 0) {
  const accessPattern = /(\d{1,2})月\s+\d{1,2},\s+\d{4}にアクセス(?:\s*[、，,]\s*)?/g
  for (let idx = lastRefIdx + 1; idx < lines.length; idx++) {
    const line = lines[idx]
    if (/^\s*(?:[-*]\s+|\d+\.\s+)/.test(line)) {
      lines[idx] = line.replace(accessPattern, '')
    }
  }
}

const output = lines.join('\n')
try {
  fs.writeFileSync(abspath, output, 'utf8')
} catch (e) {
  process.exit(4)
}

process.exit(0)
