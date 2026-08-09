'use client';

import { useEffect, useState } from 'react';
import { useDb } from '@/lib/db';

// ===========================================================================
//  NEXT BEST ACTION — the customer-facing half
//
//  The console version explains a recommendation to an agent. This one has to
//  land on a phone in a few seconds while its owner is doing something else,
//  so it carries exactly two things: the trigger that produced it, and one
//  action. No price table, no comparison, no second confirmation screen.
//
//  It arrives on its own rather than waiting for an agent, because the whole
//  claim is that the system noticed first. The arrival is animated on mount so
//  the moment can be filmed or demoed on demand instead of being waited for.
// ===========================================================================

export const TRIGGER = '5x Data Exhaustion Detected';
export const OFFER = 'Switch to Unlimited Fiber';

export default function NbaPush() {
  const { state, dispatch } = useDb();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShown(true), 260);
    return () => clearTimeout(t);
  }, []);

  const upgraded = state.nba?.status === 'upgraded';

  if (upgraded) {
    return (
      <div className="nba-push nba-done" role="status">
        <span className="nba-icon" aria-hidden="true">✓</span>
        <div className="nba-body">
          <b>Unlimited Fiber is on</b>
          <p>Your fiber connection has been requested. An associate will come to your location to install it.</p>
          <p>After that, no data cap, no top-ups. Applies from Installation date and shows on your next bill.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`nba-push${shown ? ' is-in' : ''}`} role="status" aria-live="polite">
      <span className="ai-tag">AI-driven next best action</span>

      <div className="nba-trigger">
        <span className="nba-icon" aria-hidden="true">⚠</span>
        <b>{TRIGGER}</b>
      </div>

      <div className="nba-arrow" aria-hidden="true">↓</div>

      <h3>{OFFER}</h3>
      <p>
        Your line has run dry five times this quarter. Unlimited Fiber removes the cap and the
        top-ups along with it.
      </p>

      <button className="btn primary block nba-tap" onClick={() => dispatch({ type: 'NBA_UPGRADE' })}>
        1-Tap Upgrade
      </button>
    </div>
  );
}
