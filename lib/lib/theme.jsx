'use client';

import { useCallback, useEffect, useState } from 'react';

// Each app remembers its own theme. The defaults stay opposite on purpose:
// the console is a tool you stare at for eight hours and the customer app is
// a consumer product, so they should not look like the same thing. The toggle
// is an override, not a merge.

export const KEYS = {
  care: 'nexus.theme.care',
  my: 'nexus.theme.my',
  landing: 'nexus.theme.landing',
};

export const DEFAULTS = { care: 'dark', my: 'light', landing: 'dark' };

export function readTheme(scope) {
  try {
    return window.localStorage.getItem(KEYS[scope]) || DEFAULTS[scope];
  } catch {
    return DEFAULTS[scope];
  }
}

export function useTheme(scope) {
  const [theme, setTheme] = useState(DEFAULTS[scope]);

  // Runs on mount and on every client-side navigation between apps, which is
  // what keeps the inline script in the layout from going stale.
  useEffect(() => {
    const next = readTheme(scope);
    setTheme(next);
    document.documentElement.dataset.theme = next;
  }, [scope]);

  const set = useCallback(
    (next) => {
      setTheme(next);
      document.documentElement.dataset.theme = next;
      try {
        window.localStorage.setItem(KEYS[scope], next);
      } catch {
        /* private mode; the choice just will not survive a reload */
      }
    },
    [scope]
  );

  return [theme, set];
}

const SUN = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" strokeLinecap="round" />
  </svg>
);

const MOON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z" strokeLinejoin="round" />
  </svg>
);

export default function ThemeToggle({ scope }) {
  const [theme, set] = useTheme(scope);

  return (
    <div className="theme-switch" role="group" aria-label="Colour theme">
      <button
        type="button"
        data-on={theme === 'light'}
        onClick={() => set('light')}
        aria-pressed={theme === 'light'}
        title="Light"
      >
        {SUN}
        <span className="sr-only">Light</span>
      </button>
      <button
        type="button"
        data-on={theme === 'dark'}
        onClick={() => set('dark')}
        aria-pressed={theme === 'dark'}
        title="Dark"
      >
        {MOON}
        <span className="sr-only">Dark</span>
      </button>
    </div>
  );
}
