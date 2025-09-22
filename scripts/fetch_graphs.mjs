// scripts/fetch_graphs.mjs
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { chromium } from 'playwright';

const CONTENT = 'src/content/reviews/ja/_incoming';
const GRAPHS_DIR = 'public/graphs';
fs.mkdirSync(GRAPHS_DIR, { recursive: true });

function extractRefUrls(markdown) {
  // 見出し「引用」「参考文献」「References」以降のURLを拾う簡易版
  const m = markdown.split(/\n#+\s*(引用|参考文献|References)\s*\n/i)[2] || '';
  return Array.from(m.matchAll(/\bhttps?:\/\/\S+/g)).map(x => x[0]);
}
function slugFromFile(f) {
  return path.basename(f).replace(/\.md$/i, '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

for (const f of fs.readdirSync(CONTENT).filter(n => n.endsWith('.md'))) {
  const file = path.join(CONTENT, f);
  const raw = fs.readFileSync(file, 'utf8');
  const { data, content } = matter(raw);
  const slug = data?.slug || slugFromFile(f);
  const outDir = path.join(GRAPHS_DIR, slug);
  fs.mkdirSync(outDir, { recursive: true });

  const urls = extractRefUrls(content).slice(0, 6); // 上位6件だけ
  if (!urls.length) continue;

  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 2 });

  let idx = 1;
  for (const u of urls) {
    try {
      await page.goto(u, { waitUntil: 'networkidle', timeout: 45000 });
      // 「測定/グラフ」らしき要素のヒューリスティック
      const candidates = [
        'img[alt*=frequency i]', 'img[alt*=response i]', 'img[alt*=fr i]', 'img[alt*=thd i]',
        'figure img', 'main img', 'article img', 'img'
      ];
      let el = null;
      for (const s of candidates) { el = await page.$(s); if (el) break; }
      if (!el) continue;
      const out = path.join(outDir, `graph-${idx++}.jpg`);
      await el.screenshot({ path: out, type: 'jpeg', quality: 90 });
      console.log(`saved: ${out}`);
    } catch (e) {
      console.warn('graph skip:', u, e.message);
    }
  }
  await browser.close();
}
