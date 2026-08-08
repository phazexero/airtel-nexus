import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    if (f === 'node_modules' || f === '.next') continue;
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(jsx?|mjs)$/.test(p)) out.push(p);
  }
  return out;
}

function exportsOf(file) {
  const src = readFileSync(file, 'utf8');
  const names = new Set();
  for (const m of src.matchAll(/export\s+(?:async\s+)?(?:function|const|let|class)\s+(\w+)/g)) names.add(m[1]);
  for (const m of src.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const part of m[1].split(',')) {
      const n = part.trim().split(/\s+as\s+/).pop().trim();
      if (n) names.add(n);
    }
  }
  if (/export\s+default/.test(src)) names.add('default');
  return names;
}

const files = walk('.').filter((f) => !f.startsWith('node_modules'));
const problems = [];

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/import\s+([\w*{},\s]+?)\s+from\s+'(@\/[^']+|\.[^']+)'/g)) {
    const clause = m[1];
    let spec = m[2];
    if (spec.startsWith('@/')) spec = spec.slice(2);
    else spec = join(file, '..', spec).replace(/\\/g, '/');
    let target = null;
    for (const ext of ['', '.js', '.jsx', '/index.js', '/index.jsx']) {
      try { if (statSync(spec + ext).isFile()) { target = spec + ext; break; } } catch {}
    }
    if (!target) { problems.push(`${file}: cannot resolve '${m[2]}'`); continue; }
    if (/\.css$/.test(target)) continue;
    const have = exportsOf(target);
    const named = clause.match(/\{([^}]*)\}/);
    const wanted = [];
    if (/^\s*\w/.test(clause)) wanted.push('default');
    if (named) for (const part of named[1].split(',')) {
      const n = part.trim().split(/\s+as\s+/)[0].trim();
      if (n) wanted.push(n);
    }
    for (const w of wanted) {
      if (!have.has(w)) problems.push(`${file}: '${w}' is not exported by ${target}`);
    }
  }
}

console.log(problems.length ? problems.join('\n') : `OK — every import resolves across ${files.length} files`);
process.exit(problems.length ? 1 : 0);
