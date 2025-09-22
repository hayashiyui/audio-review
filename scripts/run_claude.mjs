import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const [ , , playbookPath, ...files ] = process.argv;
if (!playbookPath || files.length===0) {
  console.error('Usage: node scripts/run_claude.mjs <playbook.md> <file...>');
  process.exit(1);
}
const prompt = readFileSync(playbookPath, 'utf8').replaceAll('{{FILES}}', files.join('\n'));

const args = [
  '-p', prompt,
  '--allowedTools', 'Read,Bash',
  '--permission-mode', 'acceptEdits',
  '--output-format', 'json'
];
// claude コマンドは事前に `pnpm add -g @anthropic-ai/claude-code` 済み＆サインイン前提
const r = spawnSync('claude', args, { stdio: 'inherit' });
process.exit(r.status ?? 1);
