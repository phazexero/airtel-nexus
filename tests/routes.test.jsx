import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// ===========================================================================
//  ROUTE COMPOSITION
//
//  Every screen is assembled the way Next assembles it: layout wrapping layout
//  wrapping page. Rendering pages on their own, which is what every other test
//  file does, cannot catch a provider that is missing from a layout, because
//  the test supplies its own.
//
//  This is the file that catches "useDb must be used inside DbProvider".
// ===========================================================================

import RootLayout from '@/app/layout';
import Landing from '@/app/page';
import NotFound from '@/app/not-found';
import CareLayout from '@/app/care/layout';
import CarePage from '@/app/care/page';
import CareLoading from '@/app/care/loading';
import WorkspaceLayout from '@/app/care/(workspace)/layout';
import WorkspaceLoading from '@/app/care/(workspace)/loading';
import CustomerPage from '@/app/care/(workspace)/customer/page';
import CampaignsPage from '@/app/care/(workspace)/campaigns/page';
import JourneyPage from '@/app/care/(workspace)/journey/page';
import PerformancePage from '@/app/care/(workspace)/performance/page';
import MyLayout from '@/app/my/layout';
import MyPage from '@/app/my/page';
import MyLoading from '@/app/my/loading';

// The root layout renders html and body, which cannot nest inside the jsdom
// document body. So instead of rendering it, its element tree is walked to
// find the provider, and that same provider component is used to wrap every
// screen below. If the root layout stops providing it, `rootProvider` throws
// and every screen test fails, which is the behaviour we want: the test must
// not be able to supply a provider the app forgot.
function findInTree(node, predicate) {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const hit = findInTree(child, predicate);
      if (hit) return hit;
    }
    return null;
  }
  if (predicate(node)) return node;
  return findInTree(node.props?.children, predicate);
}

function rootProvider() {
  const tree = RootLayout({ children: '__slot__' });
  const found = findInTree(
    tree,
    (n) => typeof n.type === 'function' && /DbProvider/.test(n.type.name ?? '')
  );
  if (!found) throw new Error('the root layout does not provide the data context');
  return found.type;
}

const Provider = rootProvider();
const app = (node) => <Provider>{node}</Provider>;
const care = (page) => app(CareLayout({ children: WorkspaceLayout({ children: page }) }));

const SCREENS = [
  ['/', () => app(Landing())],
  ['/care', () => app(CareLayout({ children: CarePage() }))],
  ['/care/customer', () => care(CustomerPage())],
  ['/care/campaigns', () => care(CampaignsPage())],
  ['/care/journey', () => care(JourneyPage())],
  ['/care/performance', () => care(PerformancePage())],
  ['/my', () => app(MyLayout({ children: MyPage() }))],
  ['404', () => app(NotFound())],
];

const LOADERS = [
  ['/care loading', () => app(CareLayout({ children: CareLoading() }))],
  ['/care/* loading', () => care(WorkspaceLoading())],
  ['/my loading', () => app(MyLayout({ children: MyLoading() }))],
];

describe('every route composes without a missing provider', () => {
  for (const [path, build] of SCREENS) {
    it(`renders ${path}`, async () => {
      // Any hook reading a context its layout forgot to provide throws here.
      const { container, unmount } = render(build());
      expect(container.firstChild, `${path} rendered nothing`).toBeTruthy();
      await waitFor(() => expect(container.textContent.length).toBeGreaterThan(20));
      expect(container.textContent).not.toContain('must be used inside');
      unmount();
    });
  }

  for (const [name, build] of LOADERS) {
    it(`renders ${name}`, () => {
      const { container, unmount } = render(build());
      expect(container.firstChild, `${name} rendered nothing`).toBeTruthy();
      unmount();
    });
  }

  it('has a root layout that renders and provides the data context', () => {
    const tree = RootLayout({ children: null });
    expect(tree.type).toBe('html');
    // Asserted directly, because every screen test above depends on it.
    expect(() => rootProvider()).not.toThrow();
  });

  it('keeps the per-app layouts free of their own provider', () => {
    // Two providers would mean two independent stores, and an offer sent on one
    // surface would never arrive on the other.
    for (const [name, layout] of [['care', CareLayout], ['my', MyLayout]]) {
      const tree = layout({ children: '__slot__' });
      const nested = findInTree(
        tree,
        (n) => typeof n?.type === 'function' && /DbProvider/.test(n.type.name ?? '')
      );
      expect(nested, `${name} layout provides its own store`).toBeNull();
    }
  });
});

describe('the store survives a second module evaluation', () => {
  it('hands both copies the same store', async () => {
    // A bundler may place this module in more than one chunk. With React
    // context that meant the provider published on one object while consumers
    // read from another, and every screen died claiming it was outside a
    // provider it was plainly inside. An external store on globalThis has no
    // such failure mode: both copies resolve to the same object.
    vi.resetModules();
    const first = await import('@/lib/db');
    vi.resetModules();
    const second = await import('@/lib/db');
    expect(first.useDb).not.toBe(second.useDb);

    function Probe() {
      const { state } = second.useDb();
      return <span>{state.status}</span>;
    }
    // Rendered under the provider from the OTHER copy of the module.
    const { DbProvider } = first;
    render(
      <DbProvider>
        <Probe />
      </DbProvider>
    );
    expect(await screen.findByText(/loading|ready/)).toBeInTheDocument();
  });

  it('works with no provider at all', async () => {
    // The provider is a convenience now, not a requirement. Nothing in the app
    // can throw for want of one.
    const { useDb } = await import('@/lib/db');
    function Bare() {
      const { state } = useDb();
      return <span>{state.status}</span>;
    }
    render(<Bare />);
    expect(await screen.findByText(/loading|ready/)).toBeInTheDocument();
  });
});

describe('error boundaries', () => {
  it('shows a recoverable panel instead of a blank screen', async () => {
    const { default: ErrorPanel } = await import('@/components/ui/ErrorPanel');
    const reset = vi.fn();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorPanel error={new Error('boom')} reset={reset} scope="the map" home="/care" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Something broke in the map/)).toBeInTheDocument();
    // The message is shown, not swallowed. Debugging in front of a room needs it.
    expect(screen.getByText('boom')).toBeInTheDocument();
    screen.getByRole('button', { name: 'Try again' }).click();
    expect(reset).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('covers the app, each app, and the outermost failure', async () => {
    for (const p of ['@/app/error', '@/app/care/error', '@/app/my/error', '@/app/global-error']) {
      const mod = await import(p);
      expect(typeof mod.default, `${p} has no default export`).toBe('function');
    }
  });
});
