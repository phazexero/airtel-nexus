'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import PhoneApp from './PhoneApp';

export default function CustomerSurface() {
  const { state } = useStore();
  const [tab, setTab] = useState('home');

  return (
    <div className="app-stage">
      <div className="stage-left">
        <PhoneApp tab={tab} setTab={setTab} />
      </div>

      <aside className="rail">
        <span className="eyebrow">What you are looking at</span>
        <h2>The customer side of the same loop</h2>
        <p>
          This is Ananya Sen&rsquo;s app. She is also the first customer in the care queue on the
          other surface. Send her an offer from the console and it lands here within the same
          session, on the Offers tab.
        </p>

        <div style={{ margin: '22px 0 8px' }}>
          <span className="eyebrow">The demo path</span>
        </div>
        <div className="rail-step">
          <b>1. Open the care console</b>
          <span>Pick Ananya Sen. The Next Best Action panel reads her four profile parameters.</span>
        </div>
        <div className="rail-step">
          <b>2. Send the offer to her app</b>
          <span>The console writes the offer with wording shaped to her temperament and language.</span>
        </div>
        <div className="rail-step">
          <b>3. Come back here</b>
          <span>The offer is waiting on the Offers tab with an unread badge.</span>
        </div>
        <div className="rail-step">
          <b>4. Tap &ldquo;Tell me more&rdquo;</b>
          <span>
            That raises a hot lead back on the console queue, which is the signal an agent needs to
            call while intent is still warm.
          </span>
        </div>
        <div className="rail-step" style={{ borderLeft: 0, paddingBottom: 0 }}>
          <b>5. Finish onboarding in-app</b>
          <span>Three steps, no callback, no form. The console sees it complete.</span>
        </div>

        <div style={{ margin: '26px 0 0' }}>
          <span className="eyebrow">Session activity</span>
          <ul className="feed">
            {state.activity.slice(0, 9).map((a) => (
              <li key={a.id} data-surface={a.surface}>
                <time>{a.at}</time>
                <i>{a.surface}</i>
                <span>{a.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
