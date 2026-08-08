import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DbProvider } from '@/lib/db';
import CareChrome from '@/components/agent/CareChrome';
import CustomerView from '@/components/agent/CustomerView';
import Count from '@/components/ui/Count';

const KEY = 'nexus.state.v2';

const shell = (ui) => render(<DbProvider><CareChrome>{ui}</CareChrome></DbProvider>);
const loaded = () => screen.findByRole('heading', { name: 'Sanyam Gupta', level: 2 }, { timeout: 4000 });

describe('bad cached state', () => {
  it('reseeds when the cache was written by an older build', async () => {
    // A payload missing whole collections, which is what a schema change leaves
    // behind. Spreading it over the empty state used to give a permanently
    // empty queue with nothing on screen to explain it.
    window.localStorage.setItem(KEY, JSON.stringify({ offers: [], activity: [], seq: 1 }));
    shell(<CustomerView />);
    expect(await loaded()).toBeInTheDocument();
    expect(screen.getByText(/6 waiting/)).toBeInTheDocument();
  });

  it('reseeds when the cache is not valid JSON', async () => {
    window.localStorage.setItem(KEY, '{not json');
    shell(<CustomerView />);
    expect(await loaded()).toBeInTheDocument();
  });

  it('reseeds when the cache holds empty collections', async () => {
    window.localStorage.setItem(KEY, JSON.stringify({ customers: [], localities: [], products: {} }));
    shell(<CustomerView />);
    expect(await loaded()).toBeInTheDocument();
  });

  it('restores a good cache instead of refetching', async () => {
    const first = shell(<CustomerView />);
    await loaded();
    await waitFor(() => expect(window.localStorage.getItem(KEY)).toBeTruthy(), { timeout: 4000 });
    first.unmount();
    const calls = global.fetch.mock.calls.length;

    shell(<CustomerView />);
    expect(await loaded()).toBeInTheDocument();
    expect(global.fetch.mock.calls.length).toBe(calls);
  });
});

describe('hostile browser environments', () => {
  it('still runs when localStorage throws, as it does in some private modes', async () => {
    globalThis.__ALLOW_CONSOLE__ = true;
    const store = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem() { throw new Error('denied'); },
        setItem() { throw new Error('denied'); },
        removeItem() { throw new Error('denied'); },
        clear() {},
      },
    });
    try {
      shell(<CustomerView />);
      expect(await loaded()).toBeInTheDocument();
    } finally {
      Object.defineProperty(window, 'localStorage', { configurable: true, value: store });
    }
  });

  it('counts up without matchMedia', async () => {
    const real = window.matchMedia;
    delete window.matchMedia;
    try {
      render(<Count to={480} prefix="₹" />);
      await waitFor(() => expect(screen.getByText('₹480')).toBeInTheDocument(), { timeout: 3000 });
    } finally {
      window.matchMedia = real;
    }
  });

  it('honours reduced motion by landing on the value immediately', async () => {
    window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
    render(<Count to={91} suffix="%" />);
    expect(await screen.findByText('91%')).toBeInTheDocument();
  });

  it('survives a missing BroadcastChannel', async () => {
    const real = window.BroadcastChannel;
    delete window.BroadcastChannel;
    try {
      shell(<CustomerView />);
      expect(await loaded()).toBeInTheDocument();
    } finally {
      window.BroadcastChannel = real;
    }
  });
});

describe('reset', () => {
  it('surfaces a failure instead of leaving data the user thinks they cleared', async () => {
    globalThis.__ALLOW_CONSOLE__ = true;
    const user = userEvent.setup();
    shell(<CustomerView />);
    await loaded();
    await user.click(screen.getByRole('button', { name: 'Edit data' }));

    globalThis.__SEED_FAILS__ = true;
    await user.click(screen.getByRole('button', { name: 'Reset demo data' }));
    expect(await screen.findByText(/Could not load the working set/)).toBeInTheDocument();
  });
});
