// scripts/targets.mjs
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const CANDIDATES = [
  process.env.TARGET_DIR?.trim(),
  'src/content/reviews/ja/_incoming',
  'src/content/reviews/_incoming',
].filter(Boolean);

function list(dir) {
  try {
    return readdirSync(dir)
      .map(n => join(dir, n))
      .filter(p => statSync(p).isFile() && /\.mdx$/i.test(p));
  } catch { return []; }
}

const files = CANDIDATES.flatMap(list);
if (!files.length) {
  console.error('No target .md found (searched: ' + CANDIDATES.join(', ') + ')');
  process.exit(2);
}
console.log(files[0]);
