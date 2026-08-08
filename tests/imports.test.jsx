import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// ===========================================================================
//  IMPORT INTEGRITY
//
//  Every named import is checked against what the target file actually
//  exports.
//
//  This is the check that catches a half-applied update: a component that has
//  been replaced importing something from a module that has not. Nothing else
//  in the suite sees it, because the failing screen throws at build time in the
//  app while the tests import the modules directly and find them fine.
// ===========================================================================

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
  for (const m of src.matchAll(/export\s+(?:async\s+)?(?:function|const|let|class)\s+(\w+)/g)) {
    names.add(m[1]);
  }
  for (const m of src.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const part of m[1].split(',')) {
      const n = part.trim().split(/\s+as\s+/).pop().trim();
      if (n) names.add(n);
    }
  }
  if (/export\s+default/.test(src)) names.add('default');
  return names;
}

function resolve(spec, from) {
  let base = spec.startsWith('@/') ? spec.slice(2) : join(from, '..', spec).replace(/\\/g, '/');
  for (const ext of ['', '.js', '.jsx', '/index.js', '/index.jsx']) {
    try {
      if (statSync(base + ext).isFile()) return base + ext;
    } catch {
      /* keep trying */
    }
  }
  return null;
}

const FILES = [...walk('app'), ...walk('components'), ...walk('lib'), ...walk('tests')];

describe('every import matches an export', () => {
  it('resolves every local module path', () => {
    const missing = [];
    for (const file of FILES) {
      for (const m of readFileSync(file, 'utf8').matchAll(
        /import\s+([\w*{},\s]+?)\s+from\s+'(@\/[^']+|\.[^']+)'/g
      )) {
        if (!resolve(m[2], file)) missing.push(`${file} -> ${m[2]}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('finds every named import in its target', () => {
    const problems = [];
    for (const file of FILES) {
      for (const m of readFileSync(file, 'utf8').matchAll(
        /import\s+([\w*{},\s]+?)\s+from\s+'(@\/[^']+|\.[^']+)'/g
      )) {
        const target = resolve(m[2], file);
        if (!target || /\.css$/.test(target)) continue;
        const have = exportsOf(target);
        const clause = m[1];
        const wanted = [];
        if (/^\s*\w/.test(clause)) wanted.push('default');
        const named = clause.match(/\{([^}]*)\}/);
        if (named) {
          for (const part of named[1].split(',')) {
            const n = part.trim().split(/\s+as\s+/)[0].trim();
            if (n) wanted.push(n);
          }
        }
        for (const w of wanted) {
          if (!have.has(w)) problems.push(`${file}: '${w}' is not exported by ${target}`);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it('has no import of a module that no longer exists', () => {
    // Files deleted across updates: the polygon boundary data, the auth layer,
    // the old single-app store.
    const gone = ['@/lib/auth', '@/lib/store', 'LoginForm', 'VacationCare', 'AgentConsole'];
    for (const file of FILES) {
      const src = readFileSync(file, 'utf8');
      for (const g of gone) {
        expect(src.includes(`from '${g}'`), `${file} imports ${g}`).toBe(false);
      }
    }
  });
});
