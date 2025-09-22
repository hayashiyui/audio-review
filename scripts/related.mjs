// scripts/related.mjs
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const JA = 'src/content/reviews/ja';
const MAX = 3;

function* mdFiles(dir) {
  for (const n of fs.readdirSync(dir)) {
    const p = path.join(dir, n);
    const st = fs.statSync(p);
    if (st.isDirectory()) { if (!/_incoming$/.test(p)) yield* mdFiles(p); continue; }
    if (/\.md$/.test(n)) yield p;
  }
}
function slugFromFile(f){return path.basename(f).replace(/\.md$/,'').toLowerCase().replace(/\s+/g,'-').replace(/[^\w-]/g,'');}

const articles = [];
for (const f of mdFiles(JA)) {
  const raw = fs.readFileSync(f,'utf8');
  const { data, content } = matter(raw);
  articles.push({
    file: f,
    slug: data?.slug || slugFromFile(f),
    brand: (data?.brand||'').toLowerCase(),
    tags: (data?.tags||[]).map(t=>String(t).toLowerCase()),
    text: content.toLowerCase().slice(0, 5000)
  });
}

function score(a, b){
  let s = 0;
  if (a.brand && a.brand===b.brand) s+=3;
  const overlap = a.tags.filter(t=>b.tags.includes(t)).length;
  s += overlap*2;
  // 超簡易TF-IDF的: 単語共通数
  const wa = new Set(a.text.split(/\W+/));
  const wb = new Set(b.text.split(/\W+/));
  let common=0; for(const w of wa) if(w.length>4 && wb.has(w)) common++;
  s += Math.min(common/50, 3);
  return s;
}

for (const a of articles) {
  const ranked = articles
    .filter(b=>b.file!==a.file)
    .map(b=>({ slug:b.slug, score:score(a,b)}))
    .sort((x,y)=>y.score-x.score)
    .slice(0,MAX)
    .map(x=>x.slug);
  const raw = fs.readFileSync(a.file,'utf8');
  const g = matter(raw);
  g.data.related = ranked;
  fs.writeFileSync(a.file, matter.stringify(g.content, g.data), 'utf8');
  console.log('related:', a.slug, '->', ranked.join(', '));
}
