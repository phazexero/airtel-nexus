'use client';

import Link from 'next/link';
import { useDb } from '@/lib/db';
import { useConsole } from '@/lib/console';
import ThemeToggle from '@/lib/theme';
import { OPERATORS } from '@/lib/operators';

// The console's identity and edit mode live in lib/console.jsx as an external
// store, not in React context. These two hooks stay exported from here because
// every panel already imports them from this file, and because this is where
// they conceptually belong.
export function useSession() {
  return useConsole().user;
}

export function useEdit() {
  const { editing, canEdit, setEditing } = useConsole();
  return { editing, canEdit, setEditing };
}

export default function CareChrome({ children }) {
  const { reset, state } = useDb();
  const { user, canEdit, editing, setEditing, setOperator } = useConsole();

  return (
        <div className="shell">
          <header className="topbar">
            <Link href="/care" className="brand">
              <span className="brand-mark" aria-hidden="true" />
              <span>
                AltCare
                <small>Distributor console</small>
              </span>
            </Link>

            <span className="topbar-note">
              {state.status === 'ready'
                ? `${state.customers.length} conversations open · ${state.localities.length} micro-markets mapped`
                : 'Loading the working set…'}
            </span>

            <div className="topbar-right">
              <ThemeToggle scope="care" />

              {canEdit && (
                <button
                  className={`btn ${editing ? 'primary' : ''}`}
                  onClick={() => setEditing(!editing)}
                  disabled={state.status !== 'ready'}
                >
                  {editing ? 'Done editing' : 'Edit data'}
                </button>
              )}
              {editing && canEdit && (
                <button className="btn ghost" onClick={reset}>
                  Reset demo data
                </button>
              )}

              <label className="op-switch">
                <span className="avatar" aria-hidden="true">
                  {user.initials}
                </span>
                <span className="op-meta">
                  <b>{user.name}</b>
                  <small>
                    {user.role}
                    {canEdit ? '' : ' · read only'}
                  </small>
                </span>
                <select value={user.id} onChange={(e) => setOperator(e.target.value)} aria-label="Working as">
                  {OPERATORS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} · {o.role}
                    </option>
                  ))}
                </select>
              </label>

              <Link href="/" className="btn ghost">
                Both apps
              </Link>
            </div>
          </header>

          {children}
        </div>
  );
}
