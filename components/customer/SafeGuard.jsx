'use client';

import { useDb } from '@/lib/db';
import { BUNDLED_SERVICES } from '@/lib/family';

// ===========================================================================
//  SAFEGUARD — GRACE-DAY SHIELD
//
//  A failed autopay on a bundle is the worst version of a failed payment: one
//  card decline takes down broadband, OTT and two phone lines at once. That is
//  the risk a customer is quietly accepting when they consolidate, and it is
//  the first objection anyone raises to bundling.
//
//  SafeGuard is the answer to that objection, so it has to be the first thing
//  on screen when it fires, not a line in an email. Everything bundled gets the
//  same protection window; it does not scale with the number of services,
//  because a customer should not have to work out their own grace period.
// ===========================================================================

export const GRACE_DAYS = 4;

export function SafeGuardBanner({ setTab }) {
  const { state } = useDb();
  const sg = state.safeguard;
  if (!sg?.active) return null;

  return (
    <button className="sg-banner" onClick={() => setTab('safeguard')}>
      <span className="sg-shield" aria-hidden="true">◈</span>
      <span className="sg-banner-body">
        <b>{sg.reason} — Grace-Day Shield active</b>
        <small>
          All {BUNDLED_SERVICES.length} bundled services protected for {sg.daysLeft} more days.
        </small>
      </span>
      <span className="sg-banner-go" aria-hidden="true">›</span>
    </button>
  );
}

export default function SafeGuard({ setTab }) {
  const { state, dispatch } = useDb();
  const sg = state.safeguard;

  if (!sg?.active) {
    return (
      <>
        <div className="vac-head">
          <button className="kyc-back" onClick={() => setTab('home')} aria-label="Go back">
            ←
          </button>
          <div>
            <span className="eyebrow">SafeGuard</span>
            <h2>Everything is settled</h2>
          </div>
        </div>
        <div className="tile">
          <h3>No services were interrupted</h3>
          <p>
            Your bundle was settled inside the grace window, so nothing was suspended and there is
            no reconnection charge. SafeGuard is armed again for the next cycle.
          </p>
        </div>
        <button className="btn primary block" onClick={() => setTab('home')}>
          Back to home
        </button>
      </>
    );
  }

  return (
    <>
      <div className="vac-head">
        <button className="kyc-back" onClick={() => setTab('home')} aria-label="Go back">
          ←
        </button>
        <div>
          <span className="eyebrow">SafeGuard</span>
          <h2>Grace-Day Shield</h2>
        </div>
      </div>

      {/* The full-frame state. Everything the customer needs to stop worrying
          is in this block, in the order they worry about it: what happened, what
          did not happen, and how long they have. */}
      <div className="sg-hero">
        <span className="sg-hero-icon" aria-hidden="true">◈</span>
        <strong>{sg.reason}</strong>
        <p>Grace-Day Shield active</p>
        <div className="sg-count">
          <b>{sg.daysLeft}</b>
          <span>days of protection left</span>
        </div>
      </div>

      <div className="tile">
        <span className="eyebrow">Protected right now</span>
        <ul className="sg-services">
          {BUNDLED_SERVICES.map((b) => (
            <li key={b.id}>
              <span className="sg-ok" aria-hidden="true">✓</span>
              <span>
                <b>{b.name}</b>
                <small>{b.detail}</small>
              </span>
              <em>Running</em>
            </li>
          ))}
        </ul>
        <p className="sg-note">
          One account, one bundle. A single missed payment does not take down {BUNDLED_SERVICES.length}{' '}
          services, it buys grace days instead. Everything inside the bundle gets the same{' '}
          {GRACE_DAYS} days, whether that is one service or ten.
        </p>
      </div>

      <div className="tile">
        <span className="eyebrow">What happens next</span>
        <ul className="vac-list" style={{ marginTop: 8 }}>
          <li>Recharge any time in the next {sg.daysLeft} days and it squares off immediately</li>
          <li>No late fee, no reconnection charge, no re-verification</li>
          <li>Nothing is suspended while the shield is up</li>
        </ul>
      </div>

      <button className="btn primary block" onClick={() => dispatch({ type: 'SAFEGUARD_SETTLE' })}>
        Pay now and square off
      </button>
      <button className="btn ghost block" style={{ marginTop: 6 }} onClick={() => setTab('home')}>
        I will do it later
      </button>
    </>
  );
}
