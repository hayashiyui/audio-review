import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const [ , , playbookPath, ...files ] = process.argv;
if (!playbookPath || files.length===0) {
  console.error('Usage: node scripts/run_codex.mjs <playbook.md> <file...>');
  process.exit(1);
}
const prompt = readFileSync(playbookPath, 'utf8')
  .replaceAll('{{FILES}}', files.join('\n'));

// codex は `pnpm add -g @openai/codex` 済み＆ChatGPTサインイン前提
const r = spawnSync('codex', ['exec', prompt], { stdio: 'inherit' });
process.exit(r.status ?? 1);
