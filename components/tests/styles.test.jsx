import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const css = readFileSync('app/globals.css', 'utf8');

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (f === 'node_modules' || f === '.next') continue;
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.jsx')) out.push(p);
  }
  return out;
}

const sources = [...walk('app'), ...walk('components')].filter((p) => !p.includes('tests'));

describe('stylesheet', () => {
  it('has balanced braces', () => {
    // A stray brace silently kills every rule after it, and the page still
    // renders, just unstyled. Cheap to assert, expensive to notice by eye.
    let depth = 0;
    let line = 0;
    css.split('\n').forEach((l, i) => {
      depth += (l.match(/{/g) ?? []).length - (l.match(/}/g) ?? []).length;
      if (depth < 0 && !line) line = i + 1;
    });
    expect(line, 'closing brace with no opener').toBe(0);
    expect(depth, 'unclosed rule').toBe(0);
  });

  it('has no orphaned declaration outside a rule', () => {
    let depth = 0;
    let inComment = false;
    const orphans = [];
    css.split('\n').forEach((raw, i) => {
      const l = raw.trim();
      // Prose inside a block comment can end in a semicolon, which used to read
      // as a stray declaration.
      if (inComment) {
        if (l.includes('*/')) inComment = false;
        return;
      }
      if (l.startsWith('/*') && !l.includes('*/')) {
        inComment = true;
        return;
      }
      const opens = (l.match(/{/g) ?? []).length;
      const closes = (l.match(/}/g) ?? []).length;
      if (depth === 0 && opens === 0 && l && !l.startsWith('/*') && !l.startsWith('*') && l.endsWith(';')) {
        orphans.push(`${i + 1}: ${l}`);
      }
      depth += opens - closes;
    });
    expect(orphans).toEqual([]);
  });

  it('defines every custom property it uses', () => {
    const defined = new Set([...css.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
    // Some are set per element from a JSX style prop rather than in the sheet.
    for (const p of sources) {
      for (const m of readFileSync(p, 'utf8').matchAll(/['"](--[a-z0-9-]+)['"]\s*:/g)) {
        defined.add(m[1]);
      }
    }
    const used = new Set([...css.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]));
    expect([...used].filter((v) => !defined.has(v))).toEqual([]);
  });

  it('has a rule for every class the components reference', () => {
    const classes = new Set();
    for (const p of sources) {
      const src = readFileSync(p, 'utf8');
      for (const m of src.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
        // Strip ${...} first, or the identifiers and conditions inside the
        // expression get mistaken for class names.
        const literal = (m[1] ?? m[2]).replace(/\$\{[^}]*\}/g, ' ');
        for (const c of literal.split(/[\s'"]+/)) {
          if (c && /^[a-z][a-z0-9-]*$/.test(c)) classes.add(c);
        }
      }
    }
    const missing = [...classes].filter((c) => !new RegExp(`\\.${c}[^a-z0-9-]`).test(css));
    expect(missing, 'classes with no matching CSS rule').toEqual([]);
  });

  it('keeps no styles for the login screens that were removed', () => {
    for (const gone of ['.auth-care', '.auth-my', '.otp-hint', '.cred-grid', '.surface-switch']) {
      expect(css, gone).not.toContain(gone);
    }
  });
});

describe('sources', () => {
  it('carries no sign-in surface anywhere, in code or in copy', () => {
    // Asked for four times, so it is asserted rather than remembered. This
    // catches a reintroduced form, a stray route file, and stale prose that
    // tells a reader a sign-in exists when it does not.
    const banned = /login|sign.?in|password|<form|type=["']password["']|httpOnly|CARE_COOKIE|MY_COOKIE/i;
    for (const p of [...sources, 'README.md', 'app/globals.css']) {
      const src = readFileSync(p, 'utf8');
      const hit = src.split('\n').findIndex((l) => banned.test(l));
      expect(hit, `${p}:${hit + 1} mentions a sign-in`).toBe(-1);
    }
    for (const p of ['middleware.js', 'lib/auth.js', 'components/ui/LoginForm.jsx']) {
      expect(existsSync(p), `${p} exists`).toBe(false);
    }
  });

  it('has no leftover imports of deleted modules', () => {
    for (const p of sources) {
      const src = readFileSync(p, 'utf8');
      for (const gone of ['@/lib/auth', '@/lib/store', 'LoginForm', 'AgentConsole']) {
        expect(src, `${p} imports ${gone}`).not.toContain(gone);
      }
    }
  });

  it("marks every component that uses hooks as a client component", () => {
    for (const p of sources) {
      const src = readFileSync(p, 'utf8');
      const usesHooks = /\buse(State|Effect|Reducer|Context|Callback|Memo|Ref|Db|Edit|Session|Theme)\(/.test(src);
      if (usesHooks) expect(src.startsWith("'use client'"), `${p} needs 'use client'`).toBe(true);
    }
  });
});
