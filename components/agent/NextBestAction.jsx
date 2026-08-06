'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { APP_USER_ID } from '@/lib/data';
import Count from '@/components/ui/Count';

export default function NextBestAction({ customer, decision }) {
  const { state, dispatch } = useStore();
  const [width, setWidth] = useState(0);

  useEffect(() => {
    setWidth(0);
    const t = setTimeout(() => setWidth(decision.confidence), 80);
    return () => clearTimeout(t);
  }, [decision.confidence, customer.id]);

  const alreadySent = state.offers.some((o) => o.toId === customer.id);
  const isAppUser = customer.id === APP_USER_ID;

  function send() {
    dispatch({
      type: 'PUSH_OFFER',
      offer: {
        to: customer.name,
        toId: customer.id,
        title: decision.product.name,
        body: `${decision.headline}. ${decision.product.blurb}`,
      },
    });
  }

  return (
    <div className="grid-2">
      <div className="nba">
        <span className="ai-tag">Next best action · {decision.stage}</span>
        <h3>{decision.headline}</h3>
        <p className="sub">
          {decision.product.name} · ₹{decision.product.price.toLocaleString('en-IN')}
          {decision.product.unit} · {decision.product.margin} margin
        </p>

        <div className="conf">
          <div className="conf-bar">
            <i style={{ width: `${width}%` }} />
          </div>
          <strong key={customer.id}>
            <Count to={decision.confidence} suffix="%" />
          </strong>
        </div>
        <span className="eyebrow">Likelihood this lands on this call</span>

        <div style={{ marginTop: 16 }}>
          <span className="eyebrow">Why this one</span>
          <ul className="reasons">
            {decision.why.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>

        <div className="callout">
          <b>Watch out</b>
          <p>{decision.risk}</p>
        </div>

        <div className="actions-row">
          <button className="btn ai" onClick={send} disabled={alreadySent}>
            {alreadySent ? 'Offer sent to app' : 'Send to customer app'}
          </button>
          <button className="btn">Read the script on call</button>
          <button className="btn ghost">Not relevant</button>
        </div>

        {alreadySent && isAppUser && (
          <p style={{ fontSize: 12, color: 'var(--d-text-3)', margin: '12px 0 0', lineHeight: 1.55 }}>
            Switch to the customer app to see it arrive, then tap through. Anything the customer does
            comes back to this queue as a hot lead.
          </p>
        )}
        {alreadySent && !isAppUser && (
          <p style={{ fontSize: 12, color: 'var(--d-text-3)', margin: '12px 0 0', lineHeight: 1.55 }}>
            Delivered. Only Ananya Sen&rsquo;s phone is rendered in this demo, so the return journey
            is visible on her profile.
          </p>
        )}
      </div>

      <div className="card">
        <header>
          <h3>How to say it</h3>
          <span className="pill ai">Shaped by the 4 parameters</span>
        </header>

        <div className="script">
          <div className="script-row">
            <span className="eyebrow">Open with</span>
            <p>{decision.tone.opener}</p>
          </div>
          <div className="script-row">
            <span className="eyebrow">Language</span>
            <p>{decision.tone.language}</p>
          </div>
          <div className="script-row">
            <span className="eyebrow">Pace</span>
            <p>{decision.tone.pace}</p>
          </div>
          <div className="script-row">
            <span className="eyebrow">Close with</span>
            <p>{decision.tone.closer}</p>
          </div>
        </div>

        <p style={{ fontSize: 12, color: 'var(--d-text-3)', lineHeight: 1.6, margin: '14px 0 0' }}>
          The product comes from the data and stays auditable. Only the wording is generated, which
          is what a new agent normally takes six weeks of training to get right.
        </p>
      </div>
    </div>
  );
}
