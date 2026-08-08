'use client';

import { useEffect, useState } from 'react';
import { useDb } from '@/lib/db';
import { APP_USER_ID } from '@/lib/data';
import { useEdit } from './CareChrome';
import { EditText, EditNumber } from '@/components/ui/Editable';
import Count from '@/components/ui/Count';

export default function NextBestAction({ customer, decision }) {
  const { state, dispatch } = useDb();
  const { editing } = useEdit();
  const [width, setWidth] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setWidth(0);
    const t = setTimeout(() => setWidth(decision.confidence), 80);
    return () => clearTimeout(t);
  }, [decision.confidence, customer.id]);

  const alreadySent = state.offers.some((o) => o.toId === customer.id);
  const isAppUser = customer.id === APP_USER_ID;
  const product = decision.product;

  async function send() {
    setSending(true);
    // Stands in for the delivery call. The button stays busy so the operator
    // gets the same feedback they would from a real send.
    await new Promise((r) => setTimeout(r, 600));
    dispatch({
      type: 'PUSH_OFFER',
      offer: {
        to: customer.name,
        toId: customer.id,
        title: product.name,
        body: `${decision.headline}. ${product.blurb}`,
      },
    });
    setSending(false);
  }

  function patchProduct(p) {
    dispatch({ type: 'UPDATE_PRODUCT', id: product.id, patch: p });
  }

  return (
    <div className="grid-2">
      <div className="nba">
        <span className="ai-tag">Next best action · {decision.stage}</span>
        <h3>{decision.headline}</h3>
        <p className="sub">
          <EditText value={product.name} editing={editing} onChange={(v) => patchProduct({ name: v })} /> ·{' '}
          <EditNumber value={product.price} editing={editing} prefix="₹" onChange={(v) => patchProduct({ price: v || 0 })} />
          {product.unit} · {product.margin} margin
        </p>

        <div className="conf">
          <div className="conf-bar">
            <i style={{ width: `${width}%` }} />
          </div>
          <strong key={`${customer.id}-${decision.confidence}`}>
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

        {editing && (
          <div style={{ marginTop: 14 }}>
            <span className="eyebrow">Offer copy sent to the app</span>
            <EditText
              value={product.blurb}
              editing
              multiline
              onChange={(v) => patchProduct({ blurb: v })}
            />
          </div>
        )}

        <div className="actions-row">
          <button className="btn ai" onClick={send} disabled={alreadySent || sending}>
            {sending ? 'Sending…' : alreadySent ? 'Offer sent to app' : 'Send to customer app'}
          </button>
          <button className="btn">Read the script on call</button>
          <button className="btn ghost">Not relevant</button>
        </div>

        {alreadySent && (
          <p style={{ fontSize: 11.5, color: 'var(--d-text-3)', margin: '13px 0 0', lineHeight: 1.6 }}>
            {isAppUser
              ? 'Open Airtel One in another tab to see it arrive. Anything the customer taps comes back to this queue as a hot lead.'
              : 'Delivered. Only Sanyam Gupta has an Airtel One account in this demo, so the return journey is visible on his profile.'}
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

        <p style={{ fontSize: 11.5, color: 'var(--d-text-3)', lineHeight: 1.65, margin: '15px 0 0' }}>
          The product comes from the data and stays auditable. Only the wording is generated, which
          is what a new agent normally takes six weeks of training to get right.
        </p>
      </div>
    </div>
  );
}
