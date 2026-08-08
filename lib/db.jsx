'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { DATA_VERSION } from './data';

// ===========================================================================
//  DATA LAYER
//
//  One store behind both apps. It loads asynchronously from /api/data so the
//  loading states in the UI are real rather than decorative, then persists to
//  localStorage and broadcasts every change to other open tabs. Open the care
//  console in one tab and the customer app in another and they stay in step.
//
//  For a real deployment this is the layer that gets replaced: swap the
//  localStorage read and write in load() and persist() for API calls against a
//  database. Every component reads through useDb(), so nothing above this file
//  needs to change.
// ===========================================================================

const KEY = 'nexus.state.v2';
const CHANNEL = 'nexus.sync';

const DbContext = createContext(null);

const empty = {
  status: 'loading', // loading | ready | error
  dataVersion: DATA_VERSION,
  customers: [],
  localities: [],
  products: {},
  offers: [],
  intents: [],
  requests: [],
  services: { fiber: true, unlimitedFiber: false },
  // Autopay has failed and the grace window is running. This is the state the
  // app opens in, because the film opens on it.
  safeguard: { active: true, daysLeft: 4, reason: 'Autopay failed' },
  vacation: null,
  nba: { status: 'waiting' }, // waiting | upgraded
  liveCampaigns: [],
  activity: [],
  kyc: 'not started',
  seq: 1,
};

// A cache written by an older build can be missing whole collections. Spreading
// that over the empty state leaves an app that renders an empty queue forever
// with no error to explain it, so check the shape before trusting it.
// Reading storage is its own failure domain. Safari private mode and blocked
// third-party storage both make this throw, and losing persistence must not
// take the whole app down with it.
function readCache() {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function usable(payload) {
  return Boolean(
    payload &&
      // Written by the same seed we are running. A cache from an older build
      // can be structurally perfect and still hold people who no longer exist.
      payload.dataVersion === DATA_VERSION &&
      Array.isArray(payload.customers) &&
      payload.customers.length &&
      Array.isArray(payload.localities) &&
      payload.localities.length &&
      payload.products &&
      Object.keys(payload.products).length
  );
}

function stamp() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.payload, status: 'ready' };
    case 'FAILED':
      return { ...state, status: 'error' };

    // --- editing ----------------------------------------------------------
    case 'UPDATE_CUSTOMER':
      return {
        ...state,
        seq: state.seq + 1,
        customers: state.customers.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c)),
        activity: [
          { id: `e${state.seq}`, at: stamp(), surface: 'console', text: `${action.by} edited the profile for ${action.id}.` },
          ...state.activity,
        ],
      };
    case 'UPDATE_LOCALITY':
      return {
        ...state,
        seq: state.seq + 1,
        localities: state.localities.map((l) => (l.id === action.id ? { ...l, ...action.patch } : l)),
        activity: [
          { id: `e${state.seq}`, at: stamp(), surface: 'console', text: `${action.by} edited area data for ${action.id}.` },
          ...state.activity,
        ],
      };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        seq: state.seq + 1,
        products: { ...state.products, [action.id]: { ...state.products[action.id], ...action.patch } },
      };

    // --- the cross-surface loop -------------------------------------------
    case 'PUSH_OFFER':
      return {
        ...state,
        seq: state.seq + 1,
        offers: [{ id: `o${state.seq}`, at: stamp(), status: 'new', ...action.offer }, ...state.offers],
        activity: [
          { id: `a${state.seq}`, at: stamp(), surface: 'console', text: `Offer sent to ${action.offer.to}: ${action.offer.title}` },
          ...state.activity,
        ],
      };
    case 'RESPOND_OFFER': {
      const offer = state.offers.find((o) => o.id === action.id);
      if (!offer) return state;
      return {
        ...state,
        seq: state.seq + 1,
        offers: state.offers.map((o) => (o.id === action.id ? { ...o, status: action.response } : o)),
        intents:
          action.response === 'interested'
            ? [{ id: `i${state.seq}`, at: stamp(), customer: offer.to, customerId: offer.toId, title: offer.title, note: 'Tapped through from the offer card and stopped on the details screen.' }, ...state.intents]
            : state.intents,
        activity: [
          {
            id: `a${state.seq}`,
            at: stamp(),
            surface: 'app',
            text:
              action.response === 'interested'
                ? `${offer.to} showed interest in ${offer.title}. Hot lead raised on the queue.`
                : `${offer.to} dismissed ${offer.title}. Suppressed for 30 days.`,
          },
          ...state.activity,
        ],
      };
    }
    case 'ACCEPT_OFFER':
      return {
        ...state,
        seq: state.seq + 1,
        offers: state.offers.map((o) => (o.id === action.id ? { ...o, status: 'accepted' } : o)),
        intents: state.intents.filter((i) => i.customerId !== action.customerId),
        activity: [
          { id: `a${state.seq}`, at: stamp(), surface: 'app', text: `${action.customer} completed onboarding for ${action.title}.` },
          ...state.activity,
        ],
      };
    // --- customer-initiated, which is the direction that matters ------------
    // A request raised in the app becomes a lead on the distributor queue. The
    // customer took the first step, so the console should see it as intent
    // rather than as a support ticket.
    case 'RAISE_REQUEST':
      return {
        ...state,
        seq: state.seq + 1,
        requests: [{ id: `r${state.seq}`, at: stamp(), status: 'raised', ...action.request }, ...state.requests],
        intents: [
          {
            id: `i${state.seq}`,
            at: stamp(),
            customer: action.request.from,
            customerId: action.request.fromId,
            title: action.request.title,
            score: action.request.score ?? 79,
            note: action.request.note,
          },
          ...state.intents,
        ],
        activity: [
          { id: `a${state.seq}`, at: stamp(), surface: 'app', text: `${action.request.from} requested ${action.request.title}. Raised with customer support.` },
          ...state.activity,
        ],
      };

    case 'SAFEGUARD_SETTLE':
      return {
        ...state,
        seq: state.seq + 1,
        safeguard: { ...state.safeguard, active: false, daysLeft: 0 },
        activity: [
          { id: `a${state.seq}`, at: stamp(), surface: 'app', text: 'Bundle settled inside the SafeGuard window. No service was interrupted.' },
          ...state.activity,
        ],
      };

    // One tap, no confirmation screen. The offer already carries the reason it
    // was made, so a second screen asking "are you sure" would only add doubt.
    case 'NBA_UPGRADE':
      return {
        ...state,
        seq: state.seq + 1,
        nba: { status: 'upgraded' },
        services: { ...state.services, unlimitedFiber: true },
        activity: [
          { id: `a${state.seq}`, at: stamp(), surface: 'app', text: 'Unlimited Fiber upgrade accepted from the in-app recommendation. One tap, no agent touch.' },
          ...state.activity,
        ],
      };

    // Pausing billing is retention, so the console sees it. A customer who
    // pauses is a customer who did not cancel.
    case 'SCHEDULE_VACATION':
      return {
        ...state,
        seq: state.seq + 1,
        vacation: { id: `v${state.seq}`, at: stamp(), ...action.vacation },
        activity: [
          {
            id: `a${state.seq}`,
            at: stamp(),
            surface: 'app',
            text: `${action.customer} scheduled a ${action.vacation.days} day Vacation Shield break. Billing paused, connection retained.`,
          },
          ...state.activity,
        ],
      };

    case 'CANCEL_VACATION':
      return {
        ...state,
        seq: state.seq + 1,
        vacation: null,
        activity: [
          { id: `a${state.seq}`, at: stamp(), surface: 'app', text: `${action.customer} resumed early from a Vacation Shield break.` },
          ...state.activity,
        ],
      };

    case 'KYC_STATUS':
      return {
        ...state,
        seq: state.seq + 1,
        kyc: action.status,
        activity:
          action.status === 'verified'
            ? [{ id: `a${state.seq}`, at: stamp(), surface: 'app', text: `${action.customer} completed KYC imaging. Postpaid activation cleared.` }, ...state.activity]
            : state.activity,
      };

    case 'CLEAR_INTENT':
      return { ...state, intents: state.intents.filter((i) => i.id !== action.id) };
    case 'LAUNCH_CAMPAIGN':
      return {
        ...state,
        seq: state.seq + 1,
        liveCampaigns: [{ id: `c${state.seq}`, at: stamp(), ...action.campaign }, ...state.liveCampaigns],
        activity: [
          { id: `a${state.seq}`, at: stamp(), surface: 'console', text: `Campaign live in ${action.campaign.area}: ${action.campaign.headline}` },
          ...state.activity,
        ],
      };
    default:
      return state;
  }
}

export function DbProvider({ children }) {
  const [state, rawDispatch] = useReducer(reducer, empty);
  const channel = useRef(null);
  const echo = useRef(false);

  // --- load -----------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cached = typeof window !== 'undefined' ? readCache() : null;
        if (cached) {
          let parsed = null;
          try {
            parsed = JSON.parse(cached);
          } catch {
            parsed = null;
          }
          if (usable(parsed)) {
            // Small delay even on the cached path so the skeletons are visible
            // rather than flashing. Drop this when the data source is real.
            await new Promise((r) => setTimeout(r, 260));
            if (!cancelled) rawDispatch({ type: 'HYDRATE', payload: parsed });
            return;
          }
          // Unreadable or written by an older build. Drop it and reseed.
          try {
            window.localStorage.removeItem(KEY);
          } catch {
            /* nothing to do */
          }
        }
        const res = await fetch('/api/data');
        if (!res.ok) throw new Error(`seed failed: ${res.status}`);
        const seed = await res.json();
        if (!cancelled) rawDispatch({ type: 'HYDRATE', payload: seed });
      } catch (err) {
        console.error(err);
        if (!cancelled) rawDispatch({ type: 'FAILED' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // --- persist and broadcast ------------------------------------------------
  useEffect(() => {
    if (state.status !== 'ready') return;
    const { status: _drop, ...persistable } = state;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(persistable));
    } catch {
      /* storage full or blocked; the session still works, it just will not survive a reload */
    }
    if (echo.current) {
      echo.current = false;
      return;
    }
    channel.current?.postMessage(persistable);
  }, [state]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return undefined;
    const ch = new BroadcastChannel(CHANNEL);
    channel.current = ch;
    ch.onmessage = (e) => {
      echo.current = true;
      rawDispatch({ type: 'HYDRATE', payload: e.data });
    };
    return () => ch.close();
  }, []);

  const reset = useCallback(async () => {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* nothing to do */
    }
    try {
      const res = await fetch('/api/data');
      if (!res.ok) throw new Error(`reseed failed: ${res.status}`);
      const seed = await res.json();
      rawDispatch({ type: 'HYDRATE', payload: seed });
      channel.current?.postMessage(seed);
    } catch {
      // Reset is a user action, so a failure here has to surface rather than
      // leave the console showing data the user believes they cleared.
      rawDispatch({ type: 'FAILED' });
    }
  }, []);

  const value = useMemo(
    () => ({ state, dispatch: rawDispatch, reset, ready: state.status === 'ready' }),
    [state, reset]
  );

  return <DbContext.Provider value={value}>{children}</DbContext.Provider>;
}

export function useDb() {
  const ctx = useContext(DbContext);
  if (!ctx) throw new Error('useDb must be used inside DbProvider');
  return ctx;
}

// Convenience selectors so components do not re-implement lookups.
export function useCustomer(id) {
  const { state } = useDb();
  return state.customers.find((c) => c.id === id);
}

export function useLocality(id) {
  const { state } = useDb();
  return state.localities.find((l) => l.id === id);
}
