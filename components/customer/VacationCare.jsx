'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDb } from '@/lib/db';
import { APP_USER_ID } from '@/lib/data';

// ===========================================================================
//  VACATION CARE
//
//  Pausing billing is a retention feature dressed as a convenience. The churn
//  it prevents is the customer who cancels before a long trip and never comes
//  back, so the screen is built around removing the reasons to cancel: the
//  number stays, the plan stays, there is no reconnection charge, and the
//  saving is stated before they commit rather than after.
//
//  Dates are resolved after mount, never during render. This page is
//  prerendered, so a date computed in render would be frozen at build time and
//  disagree with the browser.
// ===========================================================================

const PAUSABLE = [
  {
    id: 'fiber',
    name: 'Xstream Fiber',
    detail: '200 Mbps home broadband',
    dailyRate: 699 / 30,
    // Flipped on once a fiber connection exists on the account.
    requires: 'an active fiber connection',
  },
  {
    id: 'mobile',
    name: 'Mobile pack validity',
    detail: 'Prepaid ₹299 / 28 days',
    dailyRate: 299 / 28,
  },
];

const MAX_DAYS = 90;

function iso(d) {
  return d.toISOString().slice(0, 10);
}

function nightsBetween(from, to) {
  if (!from || !to) return 0;
  const ms = new Date(to).getTime() - new Date(from).getTime();
  return ms > 0 ? Math.round(ms / 86400000) : 0;
}

function pretty(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function VacationCare({ setTab }) {
  const { state, dispatch } = useDb();
  const me = state.customers.find((c) => c.id === APP_USER_ID);

  const fiberActive = Boolean(state.services?.fiber);
  const booked = state.vacation ?? null;

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [today, setToday] = useState('');
  const [picked, setPicked] = useState(['mobile']);

  // Resolved on the client, for the reason in the header comment.
  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getTime() + 7 * 86400000);
    const end = new Date(now.getTime() + 21 * 86400000);
    setToday(iso(now));
    setFrom(iso(start));
    setTo(iso(end));
    if (fiberActive) setPicked(['fiber', 'mobile']);
  }, [fiberActive]);

  const days = nightsBetween(from, to);
  const overLimit = days > MAX_DAYS;

  const saving = useMemo(
    () =>
      Math.round(
        PAUSABLE.filter((p) => picked.includes(p.id)).reduce((s, p) => s + p.dailyRate * days, 0)
      ),
    [picked, days]
  );

  function toggle(id) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  function schedule() {
    dispatch({
      type: 'SCHEDULE_VACATION',
      vacation: {
        from,
        to,
        days,
        saving,
        services: PAUSABLE.filter((p) => picked.includes(p.id)).map((p) => p.name),
      },
      customer: me?.name ?? 'Customer',
    });
  }

  if (booked) {
    return (
      <>
        <div className="vac-head">
          <button className="kyc-back" onClick={() => setTab('bank')} aria-label="Go back">
            ←
          </button>
          <div>
            <span className="eyebrow">Vacation Care</span>
            <h2>Your break is set</h2>
          </div>
        </div>

        <div className="vac-booked">
          <span className="vac-tick" aria-hidden="true">✈</span>
          <strong>
            {pretty(booked.from)} to {pretty(booked.to)}
          </strong>
          <span>
            {booked.days} days paused · you save about ₹{booked.saving.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="tile">
          <span className="eyebrow">Paused while you are away</span>
          <ul className="vac-list" style={{ marginTop: 8 }}>
            {booked.services.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>

        <div className="tile">
          <span className="eyebrow">What stays the same</span>
          <ul className="vac-list" style={{ marginTop: 8 }}>
            <li>Your number and your plan</li>
            <li>Incoming calls and SMS on the mobile line</li>
            <li>No reconnection charge when the break ends</li>
          </ul>
        </div>

        <button
          className="btn block"
          onClick={() => dispatch({ type: 'CANCEL_VACATION', customer: me?.name ?? 'Customer' })}
        >
          Resume everything now
        </button>
        <button className="btn ghost block" style={{ marginTop: 6 }} onClick={() => setTab('bank')}>
          Back to payments
        </button>
      </>
    );
  }

  return (
    <>
      <div className="vac-head">
        <button className="kyc-back" onClick={() => setTab('bank')} aria-label="Go back">
          ←
        </button>
        <div>
          <span className="eyebrow">Going on vacation?</span>
          <h2>Introducing Vacation Care</h2>
        </div>
      </div>

      <p className="vac-lede">
        Pause what you are not using while you are away. Billing stops for those days, your number
        and plan stay exactly where they are, and there is nothing to pay to start again.
      </p>

      <div className="tile">
        <span className="eyebrow">When are you away</span>
        <div className="vac-dates">
          <label>
            <span>Leaving</span>
            <input type="date" value={from} min={today} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            <span>Back on</span>
            <input type="date" value={to} min={from || today} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>
        {days > 0 && !overLimit && <p className="vac-days">{days} days</p>}
        {overLimit && (
          <p className="vac-days vac-error">
            Vacation Care covers up to {MAX_DAYS} days a year. Shorten the break or split it.
          </p>
        )}
      </div>

      <div className="tile">
        <span className="eyebrow">What to pause</span>
        <ul className="vac-picks">
          {PAUSABLE.map((p) => {
            const locked = p.id === 'fiber' && !fiberActive;
            return (
              <li key={p.id}>
                <label data-locked={locked}>
                  <input
                    type="checkbox"
                    checked={!locked && picked.includes(p.id)}
                    disabled={locked}
                    onChange={() => toggle(p.id)}
                  />
                  <span>
                    <b>{p.name}</b>
                    <small>
                      {locked ? `Needs ${p.requires}. Available once yours is live.` : p.detail}
                    </small>
                  </span>
                  {!locked && <em>₹{Math.round(p.dailyRate)}/day</em>}
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      {saving > 0 && !overLimit && (
        <div className="vac-saving">
          <span>You will not be billed for</span>
          <strong>₹{saving.toLocaleString('en-IN')}</strong>
          <span>across {days} days away</span>
        </div>
      )}

      <button
        className="btn primary block"
        disabled={days < 1 || overLimit || picked.length === 0}
        onClick={schedule}
      >
        Schedule the break
      </button>

      <p className="kyc-legal">
        You can resume early from this screen at any time and only the days you were actually away
        are credited. Emergency calls stay available on a paused mobile line.
      </p>
    </>
  );
}
