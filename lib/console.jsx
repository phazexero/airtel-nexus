'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { OPERATORS, DEFAULT_OPERATOR } from './operators';

// ===========================================================================
//  CONSOLE STATE
//
//  Who you are working as, and whether edit mode is on.
//
//  Same shape as lib/db.jsx and for the same reason: a bundler may place a
//  module in more than one chunk, and React context is matched by object
//  reference. With context, a split here would not throw, which is worse than
//  throwing. Edit mode would simply stop working, the operator would silently
//  revert to the default, and nothing would say why.
//
//  An external store on globalThis has no such failure mode.
// ===========================================================================

const STORE = Symbol.for('altcare.console.store');

const initial = { operatorId: DEFAULT_OPERATOR.id, editing: false };

function createStore() {
  let state = initial;
  const listeners = new Set();

  const set = (next) => {
    if (next === state) return;
    state = next;
    listeners.forEach((fn) => fn());
  };

  return {
    getState: () => state,
    getServerState: () => initial,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    setOperator(id) {
      const next = OPERATORS.find((o) => o.id === id) ?? DEFAULT_OPERATOR;
      // Dropping to an account that cannot edit has to close edit mode with it,
      // or the console would keep showing editable fields to someone who is not
      // allowed to change anything.
      set({ operatorId: next.id, editing: next.role === 'supervisor' ? state.editing : false });
    },
    setEditing(on) {
      const user = OPERATORS.find((o) => o.id === state.operatorId) ?? DEFAULT_OPERATOR;
      set({ ...state, editing: user.role === 'supervisor' ? Boolean(on) : false });
    },
  };
}

function store() {
  if (!globalThis[STORE]) globalThis[STORE] = createStore();
  return globalThis[STORE];
}

export function useConsole() {
  const s = store();
  const state = useSyncExternalStore(s.subscribe, s.getState, s.getServerState);

  const user = useMemo(
    () => OPERATORS.find((o) => o.id === state.operatorId) ?? DEFAULT_OPERATOR,
    [state.operatorId]
  );
  const canEdit = user.role === 'supervisor';

  const setEditing = useCallback((on) => s.setEditing(on), [s]);
  const setOperator = useCallback((id) => s.setOperator(id), [s]);

  return useMemo(
    () => ({ user, canEdit, editing: state.editing && canEdit, setEditing, setOperator }),
    [user, canEdit, state.editing, setEditing, setOperator]
  );
}

// Test seam, matching lib/db.jsx.
export function __resetConsole() {
  delete globalThis[STORE];
}
