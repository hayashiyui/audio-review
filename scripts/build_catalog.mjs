import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

const ROOTS = [
  { dir: 'src/content/reviews', collection: 'reviews' },
  { dir: 'src/content/columns', collection: 'columns' },
];

// ROOTS 配下の直下のみ対象にする（子フォルダへは潜らない）
function* listTopLevelMarkdown(d) {
  for (const dirent of fs.readdirSync(d, { withFileTypes: true })) {
    if (dirent.isFile() && /\.(md|mdx)$/i.test(dirent.name)) {
      yield path.join(d, dirent.name)
    }
  }
}
const kebab = (s) => s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

const catalog = [];
for (const { dir, collection } of ROOTS) {
  if (!fs.existsSync(dir)) continue;
  // 直下のファイルのみ走査
  for (const file of listTopLevelMarkdown(dir)) {
    const raw = fs.readFileSync(file, 'utf8');
    const { data, content } = matter(raw);
    const slug = data?.slug || kebab(path.basename(file).replace(/\.(mdx?|md)$/i,''));
    const title = data?.title || '';
    const brand = data?.brand || '';
    const model = data?.model || '';
    const category = data?.category || '';
    const price = data?.price || data?.msrp || null; // 任意
    const tags = Array.isArray(data?.tags) ? data.tags : [];
    // 既存の内部リンク（/reviews/ja/... or /columns/...）
    const internalLinks = Array.from(content.matchAll(/\]\(\/(reviews|columns)\/[^\)]+/g)).map(m => m[0]);
    catalog.push({ collection, slug, title, brand, model, category, price, tags, internalLinks });
  }
}
await fsp.mkdir('.cache', { recursive: true });
await fsp.writeFile('.cache/catalog.json', JSON.stringify(catalog, null, 2), 'utf8');
console.log(`catalog: ${catalog.length} items -> .cache/catalog.json`);
