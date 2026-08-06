'use client';

import { useState } from 'react';
import { useDb } from '@/lib/db';
import { APP_USER_ID } from '@/lib/data';

// The onboarding claim in the pitch is that a customer who already exists in
// the system should not be re-onboarded. Everything on this screen is either
// pre-filled from the account or confirmed with one tap.

const STEPS = [
  {
    id: 1,
    title: 'Confirm what we already hold',
    body: 'Name, address and KYC are already verified on your prepaid line. Nothing to re-enter.',
  },
  {
    id: 2,
    title: 'Pick the billing date',
    body: 'Set it to the day after your salary credit so it never clashes.',
  },
  {
    id: 3,
    title: 'Confirm and go live',
    body: 'The mobile line switches on the next cycle. Fiber install is booked for a slot you choose.',
  },
];

export default function OnboardTab({ setTab }) {
  const { state, dispatch } = useDb();
  const [step, setStep] = useState(1);
  const me = state.customers.find((c) => c.id === APP_USER_ID);

  const mine = state.offers.filter((o) => o.toId === APP_USER_ID);
  const live = mine.find((o) => o.status === 'interested') ?? mine[0];
  const done = mine.some((o) => o.status === 'accepted');

  if (!live) {
    return (
      <div className="state-note">
        No offer in progress. Open the Offers tab once the console has sent one.
      </div>
    );
  }

  if (done) {
    return (
      <>
        <div className="sec-head">
          <h2>All set</h2>
        </div>
        <div className="tile" style={{ borderColor: '#c9ebd6', background: '#f2fbf5' }}>
          <h3>{live.title} is active</h3>
          <p>
            Confirmation SMS sent. Your fiber install slot is Saturday, 10:00 to 12:00. No callback
            needed, and nothing was re-verified.
          </p>
        </div>
        <div className="tile">
          <span className="eyebrow">What just happened</span>
          <h3 style={{ marginTop: 8 }}>Zero forms, zero KYC repeats</h3>
          <p>
            Existing KYC carried across, the plan change applied to the next cycle, and the console
            recorded the conversion against the agent who sent the offer.
          </p>
        </div>
        <button className="btn block" style={{ marginTop: 4 }} onClick={() => setTab('home')}>
          Back to home
        </button>
      </>
    );
  }

  return (
    <>
      <div className="sec-head">
        <h2>{live.title}</h2>
        <span className="pill ai">Step {step} of 3</span>
      </div>

      <div className="tile">
        <ul className="steps">
          {STEPS.map((s) => (
            <li key={s.id}>
              <span className="step-dot" data-done={s.id < step}>
                {s.id < step ? '✓' : s.id}
              </span>
              <div>
                <b>{s.title}</b>
                {s.body}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {step === 1 && (
        <div className="tile">
          <h3>On file already</h3>
          <p style={{ marginTop: 8 }}>
            {me?.name} · {me?.phone}
            <br />
            KYC verified 2021 · Address verified on the fiber survey
          </p>
        </div>
      )}

      {step === 2 && (
        <div className="tile">
          <h3>Billing date</h3>
          <p style={{ marginBottom: 12 }}>Pick the date your bill should generate each month.</p>
          <div className="quick-grid">
            {[1, 5, 10, 15].map((d) => (
              <button className="quick" key={d}>
                <b>{d}</b>
                of month
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="tile">
          <h3>Summary</h3>
          <p style={{ marginTop: 8 }}>
            {live.title}
            <br />
            Starts next cycle · cancel from the app any month
          </p>
        </div>
      )}

      <button
        className="btn primary block"
        onClick={() => {
          if (step < 3) return setStep(step + 1);
          dispatch({
            type: 'ACCEPT_OFFER',
            id: live.id,
            customer: live.to,
            customerId: live.toId,
            title: live.title,
          });
        }}
      >
        {step < 3 ? 'Continue' : 'Confirm and activate'}
      </button>
      <button className="btn ghost block" style={{ marginTop: 6 }} onClick={() => setTab('offers')}>
        Back to offers
      </button>
    </>
  );
}
