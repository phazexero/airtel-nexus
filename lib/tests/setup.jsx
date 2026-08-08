import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import React from 'react';

// Next primitives the components import. Stubbed rather than mocked deeply,
// because what is under test is our behaviour, not Next's router.
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }) => (
    <a href={typeof href === 'string' ? href : '#'} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => globalThis.__PATH__ ?? '/care/customer',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// The seed endpoint. Serves the same shape /api/data does.
import { CUSTOMERS, LOCALITIES, PRODUCTS } from '@/lib/data';

globalThis.__SEED_FAILS__ = false;

// jsdom ships neither of these. Real browsers have both, so stubbing them keeps
// the tests honest rather than testing a degraded environment.
window.matchMedia = window.matchMedia || ((q) => ({
  matches: false, media: q, onchange: null,
  addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false,
}));
if (!('BroadcastChannel' in window)) {
  window.BroadcastChannel = class { constructor(n) { this.name = n; } postMessage() {} close() {} };
}

global.fetch = vi.fn(async (url) => {
  if (String(url).includes('/api/data')) {
    if (globalThis.__SEED_FAILS__) return { ok: false, status: 500, json: async () => ({}) };
    return {
      ok: true,
      status: 200,
      json: async () => ({
        customers: JSON.parse(JSON.stringify(CUSTOMERS)),
        localities: JSON.parse(JSON.stringify(LOCALITIES)),
        products: JSON.parse(JSON.stringify(PRODUCTS)),
        offers: [],
        intents: [],
        liveCampaigns: [],
        activity: [{ id: 'a0', at: '09:02', surface: 'system', text: 'seeded' }],
        seq: 1,
      }),
    };
  }
  return { ok: true, status: 200, json: async () => ({}) };
});

beforeEach(() => {
  window.localStorage.clear();
  globalThis.__SEED_FAILS__ = false;
});

// Fail any test that logs a React error or warning. This is what catches
// hydration mismatches, key warnings and act() violations.
const seen = [];
const realError = console.error;
const realWarn = console.warn;
beforeEach(() => {
  globalThis.__ALLOW_CONSOLE__ = false;
  seen.length = 0;
  console.error = (...a) => { seen.push(['error', a.join(' ')]); realError(...a); };
  console.warn = (...a) => { seen.push(['warn', a.join(' ')]); realWarn(...a); };
});
afterEach(() => {
  console.error = realError;
  console.warn = realWarn;
  if (globalThis.__ALLOW_CONSOLE__) return;
  const bad = seen.filter(([, m]) => !m.includes('not wrapped in act'));
  if (bad.length) throw new Error(`console output during test:\n${bad.map(([l, m]) => `${l}: ${m}`).join('\n')}`);
});
