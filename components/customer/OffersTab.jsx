'use client';

import { useStore } from '@/lib/store';
import { APP_USER_ID } from '@/lib/data';

export default function OffersTab({ setTab }) {
  const { state, dispatch } = useStore();
  const offers = state.offers.filter((o) => o.toId === APP_USER_ID);

  if (offers.length === 0) {
    return (
      <>
        <div className="sec-head">
          <h2>Offers</h2>
        </div>
        <div className="state-note">
          Nothing here yet.
          <br />
          Switch to the care console, open Ananya Sen, and send the recommended offer. It arrives on
          this screen straight away.
        </div>
      </>
    );
  }

  return (
    <>
      <div className="sec-head">
        <h2>Offers</h2>
        <span className="pill ai">{offers.length} total</span>
      </div>

      {offers.map((o) => (
        <div className="offer-card" key={o.id}>
          <span className="ai-tag">Chosen for you · {o.at}</span>
          <h3>{o.title}</h3>
          <p>{o.body}</p>

          {o.status === 'new' && (
            <div className="offer-actions">
              <button
                className="btn ai"
                onClick={() => {
                  dispatch({ type: 'RESPOND_OFFER', id: o.id, response: 'interested' });
                  setTab('onboard');
                }}
              >
                Tell me more
              </button>
              <button
                className="btn"
                onClick={() => dispatch({ type: 'RESPOND_OFFER', id: o.id, response: 'dismissed' })}
              >
                Not now
              </button>
            </div>
          )}

          {o.status === 'interested' && (
            <div className="offer-actions">
              <button className="btn ai" onClick={() => setTab('onboard')}>
                Continue where you left off
              </button>
            </div>
          )}

          {o.status === 'dismissed' && (
            <span className="pill">Hidden for 30 days</span>
          )}

          {o.status === 'accepted' && <span className="pill good">Active on your account</span>}
        </div>
      ))}
    </>
  );
}
