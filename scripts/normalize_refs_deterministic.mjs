// scripts/normalize_refs_deterministic.mjs
import fs from 'node:fs';

const files = process.argv.slice(2);
if (!files.length) { console.error('Usage: node scripts/normalize_refs_deterministic.mjs <file...>'); process.exit(1); }

for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');

  // A) frontmatterの後、最初の非空行が "# " なら削除
  s = s.replace(/^---[\s\S]*?---\s*\n([\s\S]*?)$/m, (m, body) => {
    const lines = body.split('\n');
    let i = 0; while (i < lines.length && /^\s*$/.test(lines[i])) i++;
    if (i < lines.length && /^#\s+/.test(lines[i])) { lines.splice(i, 1); }
    return m.slice(0, m.indexOf(body)) + lines.join('\n');
  });

  // B) 末尾の引用見出しを H2 に統一（最後に出現するものだけ）
  {
    const idxs = [];
    const re = /^(#{1,6})\s*(引用文献|参考文献|References)\s*$/gmi;
    let m; while ((m = re.exec(s))) idxs.push([m.index, m[0].length, m[1]]);
    if (idxs.length) {
      const [pos, len] = idxs[idxs.length - 1];
      s = s.slice(0, pos) + s.slice(pos, pos + len).replace(/^#{1,6}/, '##') + s.slice(pos + len);
    }
  }

  // C) 引用セクション（上記H2から次のH2/H1直前）内のアクセス日を除去
  {
    const start = s.search(/^##\s*(引用文献|参考文献|References)\s*$/mi);
    if (start !== -1) {
      const after = s.slice(start);
      const nextH2 = after.slice(after.indexOf('\n')+1).search(/^\s*##\s+/m);
      const endPos = nextH2 === -1 ? s.length : start + 1 + after.indexOf('\n') + nextH2;
      const section = s.slice(start, endPos);
      const cleaned = section
        // 和文/英文のアクセス注記いろいろ
        .replace(/（[^）]*?(?:アクセス日|閲覧日|最終アクセス)[^）]*）/g, '')
        .replace(/\([^)]*?(?:accessed on|Accessed:?|Last accessed:?)[^)]*\)/gi, '')
        // “, ” などのぶら下がり句読点と余分スペースを整理
        .replace(/\s*[,，]\s*(?=\)|）|$)/g, '')
        .replace(/[ \t]+$/gm, '');
      s = s.slice(0, start) + cleaned + s.slice(endPos);
    }
  }

  fs.writeFileSync(f, s, 'utf8');
  console.log('normalized:', f);
}
