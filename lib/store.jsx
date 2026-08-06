'use client';

import { createContext, useContext, useMemo, useReducer } from 'react';

// One store behind both surfaces. An agent pushing an offer writes here, and
// the phone reads from the same place, so the loop in the demo is real rather
// than two screens pretending to talk to each other.

const StoreContext = createContext(null);

const initial = {
  offers: [],
  intents: [],
  activity: [
    { id: 'a0', at: '09:02', surface: 'system', text: 'Overnight scoring run finished. 41,208 profiles refreshed.' },
  ],
  liveCampaigns: [],
  seq: 1,
};

function stamp() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function reducer(state, action) {
  switch (action.type) {
    case 'PUSH_OFFER': {
      const id = `o${state.seq}`;
      return {
        ...state,
        seq: state.seq + 1,
        offers: [{ id, at: stamp(), status: 'new', ...action.offer }, ...state.offers],
        activity: [
          { id: `act${state.seq}`, at: stamp(), surface: 'console', text: `Offer sent to ${action.offer.to}: ${action.offer.title}` },
          ...state.activity,
        ],
      };
    }
    case 'RESPOND_OFFER': {
      const offer = state.offers.find((o) => o.id === action.id);
      if (!offer) return state;
      const intent =
        action.response === 'interested'
          ? [{
              id: `i${state.seq}`,
              at: stamp(),
              customer: offer.to,
              customerId: offer.toId,
              title: offer.title,
              note: 'Tapped through from the offer card and stopped on the details screen.',
            }, ...state.intents]
          : state.intents;
      return {
        ...state,
        seq: state.seq + 1,
        offers: state.offers.map((o) => (o.id === action.id ? { ...o, status: action.response } : o)),
        intents: intent,
        activity: [
          {
            id: `act${state.seq}`,
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
    case 'ACCEPT_OFFER': {
      return {
        ...state,
        seq: state.seq + 1,
        offers: state.offers.map((o) => (o.id === action.id ? { ...o, status: 'accepted' } : o)),
        intents: state.intents.filter((i) => i.customerId !== action.customerId),
        activity: [
          { id: `act${state.seq}`, at: stamp(), surface: 'app', text: `${action.customer} completed onboarding for ${action.title}.` },
          ...state.activity,
        ],
      };
    }
    case 'CLEAR_INTENT':
      return { ...state, intents: state.intents.filter((i) => i.id !== action.id) };
    case 'LAUNCH_CAMPAIGN':
      return {
        ...state,
        seq: state.seq + 1,
        liveCampaigns: [{ id: `c${state.seq}`, at: stamp(), ...action.campaign }, ...state.liveCampaigns],
        activity: [
          { id: `act${state.seq}`, at: stamp(), surface: 'console', text: `Campaign live in ${action.campaign.area}: ${action.campaign.headline}` },
          ...state.activity,
        ],
      };
    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
