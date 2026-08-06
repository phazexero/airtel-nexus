'use client';

import { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDb } from '@/lib/db';
import ThemeToggle from '@/lib/theme';

const SessionContext = createContext(null);
export function useSession() {
  return useContext(SessionContext);
}

// Edit mode lives at the chrome level so the toggle in the header governs every
// panel below it, rather than each card carrying its own switch.
const EditContext = createContext({ editing: false, canEdit: false, setEditing: () => {} });
export function useEdit() {
  return useContext(EditContext);
}

export default function CareChrome({ user, children }) {
  const router = useRouter();
  const { reset, state } = useDb();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const canEdit = user.role === 'supervisor';

  async function signOut() {
    setBusy(true);
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app: 'care' }),
    });
    router.replace('/care/login');
    router.refresh();
  }

  return (
    <SessionContext.Provider value={user}>
      <EditContext.Provider value={{ editing: editing && canEdit, canEdit, setEditing }}>
        <div className="shell">
          <header className="topbar">
            <Link href="/care" className="brand">
              <span className="brand-mark" aria-hidden="true" />
              <span>
                Nexus Care
                <small>Operator console</small>
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
                  onClick={() => setEditing((v) => !v)}
                  disabled={state.status !== 'ready'}
                >
                  {editing ? 'Done editing' : 'Edit data'}
                </button>
              )}
              {editing && (
                <button className="btn ghost" onClick={reset}>
                  Reset demo data
                </button>
              )}

              <div className="who-chip">
                <span className="avatar" aria-hidden="true">{user.initials}</span>
                <span>
                  <b>{user.name}</b>
                  <small>
                    {user.id} · {user.role}
                  </small>
                </span>
              </div>

              <button className="btn ghost" onClick={signOut} disabled={busy}>
                {busy ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </header>

          {children}
        </div>
      </EditContext.Provider>
    </SessionContext.Provider>
  );
}
