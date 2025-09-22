// scripts/md_postprocess.mjs
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { visit } from 'mdast-util-visit';

const ROOT = 'src/content/reviews/ja/_incoming';
const REVIEW_ROOT = 'src/content/reviews/ja';

function slugFromFile(f) {
  return path.basename(f).replace(/\.md$/i, '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}
function loadSlugs() {
  const m = new Map();
  const walk = (dir) => {
    for (const n of fs.readdirSync(dir)) {
      const p = path.join(dir, n);
      const st = fs.statSync(p);
      if (st.isDirectory()) { if (!/_incoming$/.test(p)) walk(p); continue; }
      if (!/\.md$/.test(n)) continue;
      const md = fs.readFileSync(p, 'utf8');
      const { data } = matter(md);
      const slug = data?.slug || slugFromFile(n);
      const title = (data?.title || n.replace(/\.md$/, '')).toLowerCase();
      m.set(title, slug);
    }
  };
  walk(REVIEW_ROOT);
  return m;
}
const slugDict = loadSlugs();

function linkifyCitations(tree) {
  // [1] → [1](#ref-1)
  visit(tree, 'text', (node) => {
    node.value = node.value.replace(/\[(\d+)\]/g, (_m, n) => `[${n}](#ref-${n})`);
  });
  // 末尾リストの各項目に <a id="ref-n"></a> を付与
  let inRefs = false;
  visit(tree, (node) => {
    if (node.type === 'heading' && /引用|参考文献|References/.test(node.children?.[0]?.value || '')) inRefs = true;
    if (inRefs && node.type === 'listItem') {
      const first = node.children?.[0];
      if (first?.type === 'paragraph' && first.children?.[0]?.type === 'text') {
        const m = first.children[0].value.match(/^\s*\[(\d+)\]/);
        if (m) {
          first.children.unshift({ type:'html', value:`<a id="ref-${m[1]}"></a>` });
        }
      }
    }
  });
}

function transformTables(tree) {
  // ヘッダに "出典URL" があるテーブルを変換
  visit(tree, 'table', (table) => {
    const header = table.children[0]; // tableRow
    if (!header) return;
    const hasSourceCol = header.children?.some(c => c.children?.[0]?.value?.match(/出典URL/i));
    if (!hasSourceCol) return;
    const sourceColIdx = header.children.findIndex(c => /出典URL/i.test(c.children?.[0]?.value || ''));
    for (const row of table.children.slice(1)) {
      const cells = row.children;
      const urlCell = cells[sourceColIdx];
      const urlText = urlCell?.children?.map(t => t.value || '').join('').trim();
      if (urlText) {
        // 1列目テキストをリンク化
        const first = cells[0];
        const textNode = first.children?.find(n => n.type === 'text');
        if (textNode) {
          first.children = [{ type: 'link', url: urlText, children: [{ type: 'text', value: textNode.value }]}];
        }
      }
      // 出典URL列を削除
      row.children = row.children.filter((_, i) => i !== sourceColIdx);
    }
    // ヘッダも削除
    header.children = header.children.filter((_, i) => i !== sourceColIdx);
  });
}

function internalLinks(tree) {
  // 既存レビュー名（見出しや本文の最初の出現）を内部リンク化（やりすぎ回避で1回）
  const linked = new Set();
  visit(tree, 'text', (node, idx, parent) => {
    if (!parent || parent.type === 'link') return;
    for (const [titleLower, slug] of slugDict) {
      const re = new RegExp(`\\b(${titleLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'i');
      if (re.test(node.value) && !linked.has(slug)) {
        const m = node.value.match(re);
        const before = node.value.slice(0, m.index);
        const after = node.value.slice(m.index + m[0].length);
        parent.children.splice(idx, 1,
          { type: 'text', value: before },
          { type: 'link', url: `/reviews/ja/${slug}/`, children: [{ type: 'text', value: m[0] }] },
          { type: 'text', value: after }
        );
        linked.add(slug);
        break;
      }
    }
  });
}

for (const name of fs.readdirSync(ROOT).filter(n => n.endsWith('.md'))) {
  const file = path.join(ROOT, name);
  const { data, content } = matter(fs.readFileSync(file, 'utf8'));

  const tree = unified().use(remarkParse).use(remarkGfm).parse(content);
  transformTables(tree);
  linkifyCitations(tree);
  internalLinks(tree);

  const next = unified().use(remarkStringify, { bullet: '-', fences: true }).stringify(tree);
  fs.writeFileSync(file, matter.stringify(next, data), 'utf8');
  console.log('postprocessed:', name);
}
