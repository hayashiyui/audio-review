// scripts/prepare_assets.mjs
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import metascraper from 'metascraper';
import metascraperImage from 'metascraper-image';
import sharp from 'sharp';
import { chromium } from 'playwright';

const CONTENT = 'src/content/reviews/ja/_incoming';
const HERO_DIR = 'public/hero';
fs.mkdirSync(HERO_DIR, { recursive: true });

const m = metascraper([metascraperImage()]);

async function getOgImage(url) {
  const res = await fetch(url);
  const html = await res.text();
  const meta = await m({ html, url });
  return meta.image;
}

function slugFromFile(f) {
  return path.basename(f).replace(/\.md$/i, '').trim().toLowerCase()
    .replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

async function fallbackScreenshot(url, outPath) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle' });
  // ヒーロー候補をざっくり
  const sel = ['.hero img', 'main img', 'header img', 'img[alt*="hero"]', 'img'];
  for (const s of sel) {
    const el = await page.$(s);
    if (!el) continue;
    await el.screenshot({ path: outPath });
    break;
  }
  await browser.close();
}

for (const f of fs.readdirSync(CONTENT).filter(n => n.endsWith('.md'))) {
  const file = path.join(CONTENT, f);
  const md = fs.readFileSync(file, 'utf8');
  const { data } = matter(md);
  const url = data?.officialUrl || data?.officialURL || data?.url;
  if (!url) continue;

  const slug = data?.slug || slugFromFile(f);
  const tmpPng = path.join(HERO_DIR, `${slug}.png`);
  const outJpg = path.join(HERO_DIR, `${slug}.jpg`);

  let imgUrl;
  try {
    imgUrl = await getOgImage(url);
  } catch {}
  if (imgUrl) {
    const buf = await (await fetch(imgUrl)).arrayBuffer();
    fs.writeFileSync(tmpPng, Buffer.from(buf));
  } else {
    await fallbackScreenshot(url, tmpPng);
  }

  // jpg化＆横1200px に正規化
  await sharp(tmpPng).resize({ width: 1200 }).jpeg({ quality: 82 }).toFile(outJpg);
  fs.rmSync(tmpPng, { force: true });

  // frontmatter に heroImage を追記（なければ）
  if (!data.heroImage) {
    data.heroImage = `/hero/${path.basename(outJpg)}`;
    const body = md.split('---').slice(2).join('---').replace(/^\n/, '');
    const next = matter.stringify(body, data);
    fs.writeFileSync(file, next, 'utf8');
    console.log(`heroImage set: ${f} -> ${data.heroImage}`);
  }
}
