// scripts/fetch_graphs.mjs
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { chromium } from 'playwright';

const CONTENT = 'src/content/reviews/_incoming';   // 必要ならあなたの構成に合わせて変更
const OUT_DIR = 'src/assets/images/contents';         // Step 7 と揃える（フラット命名）
fs.mkdirSync(OUT_DIR, { recursive: true });

function* walk(dir) {
  for (const n of fs.readdirSync(dir)) {
    const p = path.join(dir, n);
    const s = fs.statSync(p);
    if (s.isDirectory()) yield* walk(p);
    else if (/\.(md|mdx)$/i.test(n)) yield p;
  }
}

// 「引用文献」セクション以降からURLを抽出（"**引用文献**" のような太字も許容）
function extractRefUrls(markdown) {
  const split = markdown.split(/\n#{1,6}\s*(?:\*\*)?(?:引用文献|参考文献|References)(?:\*\*)?\s*\n/i);
  const tail = split[1] || '';
  const urls = Array.from(tail.matchAll(/\bhttps?:\/\/[^\s)>\]]+/g)).map(m => m[0]);
  // 末尾に付きがちな記号をトリム
  return urls.map(u => u.replace(/[)\]\u3001\u3002。.,]+$/u, ''));
}

function slugFromFile(f) {
  return path.basename(f).replace(/\.(md|mdx)$/i, '')
    .trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

async function bestGraphLocator(page) {
  // 大きめの画像を優先（幅×高さが最大のもの）
  const sel = [
    'img[alt*="frequency" i]',
    'img[alt*="response" i]',
    'img[alt*="fr" i]',
    'img[alt*="thd" i]',
    'figure img',
    'article img',
    'main img',
    'img'
  ];
  for (const s of sel) {
    const locs = page.locator(s);
    const count = await locs.count();
    if (!count) continue;
    // 全候補のサイズを調べて最大を返す
    let best = null, bestArea = 0;
    for (let i = 0; i < count; i++) {
      const el = locs.nth(i);
      const box = await el.boundingBox().catch(() => null);
      if (!box) continue;
      const area = box.width * box.height;
      if (area > bestArea) { best = el; bestArea = area; }
    }
    if (best) return best;
  }
  return null;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 1280, height: 800 } });

  for (const file of walk(CONTENT)) {
    const raw = fs.readFileSync(file, 'utf8');
    const { data, content } = matter(raw);
    const slug = data?.slug || slugFromFile(file);
    const urls = extractRefUrls(content).slice(0, 6);
    if (!urls.length) continue;

    let idx = 1;
    for (const u of urls) {
      try {
        await page.goto(u, { waitUntil: 'networkidle', timeout: 45000 });
        // 少し待ってレイジーロードを落ち着かせる
        await page.waitForTimeout(500);

        const el = await bestGraphLocator(page);
        if (!el) continue;

        const out = path.join(OUT_DIR, `${slug}-graph-${idx}.jpg`);
        if (fs.existsSync(out)) { idx++; continue; } // 冪等: 既にあれば次へ
        await el.scrollIntoViewIfNeeded().catch(()=>{});
        await el.screenshot({ path: out, type: 'jpeg', quality: 90 });
        console.log(`saved: ${out}`);
        idx++;
      } catch (e) {
        console.warn('graph skip:', u, e.message);
      }
    }
  }

  await browser.close();
})();
