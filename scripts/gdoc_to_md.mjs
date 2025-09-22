// scripts/gdoc_to_md.mjs
import { execSync } from 'node:child_process';
import { readdirSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';

const INCOMING = 'src/content/reviews/ja/_incoming';

function* walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const s = statSync(p);
    if (s.isDirectory()) yield* walk(p);
    else yield p;
  }
}

for (const file of walk(INCOMING)) {
  if (!/\.(docx|html?)$/i.test(file)) continue;
  const out = file.replace(/\.(docx|html?)$/i, '.md');
  const outDir = dirname(out);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  // Pandoc: GFMで出力（表/脚注を扱いやすく）
  const cmd = `pandoc "${file}" -t gfm -o "${out}"`;
  console.log('> ' + cmd);
  execSync(cmd, { stdio: 'inherit' });
}
