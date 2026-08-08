'use client';

import { createContext, useContext, useState } from 'react';
import Link from 'next/link';
import { useDb } from '@/lib/db';
import ThemeToggle from '@/lib/theme';
import { OPERATORS, DEFAULT_OPERATOR } from '@/lib/operators';

const SessionContext = createContext(DEFAULT_OPERATOR);
export function useSession() {
  return useContext(SessionContext);
}

// Edit mode lives at the chrome level so one toggle governs every panel below
// it, rather than each card carrying its own switch.
const EditContext = createContext({ editing: false, canEdit: false, setEditing: () => {} });
export function useEdit() {
  return useContext(EditContext);
}

export default function CareChrome({ children }) {
  const { reset, state } = useDb();
  const [user, setUser] = useState(DEFAULT_OPERATOR);
  const [editing, setEditing] = useState(false);
  const canEdit = user.role === 'supervisor';

  function switchOperator(id) {
    const next = OPERATORS.find((o) => o.id === id) ?? DEFAULT_OPERATOR;
    setUser(next);
    if (next.role !== 'supervisor') setEditing(false);
  }

  return (
    <SessionContext.Provider value={user}>
      <EditContext.Provider value={{ editing: editing && canEdit, canEdit, setEditing }}>
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
                  onClick={() => setEditing((v) => !v)}
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
                <select value={user.id} onChange={(e) => switchOperator(e.target.value)} aria-label="Working as">
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
      </EditContext.Provider>
    </SessionContext.Provider>
  );
}
