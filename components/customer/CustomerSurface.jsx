'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDb } from '@/lib/db';
import ThemeToggle from '@/lib/theme';
import { ACCOUNT } from '@/lib/operators';
import { LoadFail } from '@/components/ui/Skeleton';
import PhoneApp from './PhoneApp';

export default function CustomerSurface() {
  const { state, reset } = useDb();
  const [tab, setTab] = useState('home');

  return (
    <div className="shell">
      <header className="topbar topbar-my">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span>
            Airtel One
            <small>Your account</small>
          </span>
        </Link>
        <span className="topbar-note">
          {ACCOUNT.name} · {ACCOUNT.number}. The same person sits first in the distributor queue.
        </span>
        <div className="topbar-right">
          <ThemeToggle scope="my" />
          <Link href="/care" className="btn ghost">
            Distributor console
          </Link>
        </div>
      </header>

      <div className="app-stage">
        <div className="stage-left">
          <PhoneApp tab={tab} setTab={setTab} />
        </div>

        <aside className="rail">
          <span className="eyebrow">What you are looking at</span>
          <h2>The customer side of the same loop</h2>
          <p>
            This account is also the first conversation in the care queue. Sign into AltCare in
            another tab, send the recommended offer, and it arrives here without a refresh.
          </p>

          <div style={{ margin: '24px 0 10px' }}>
            <span className="eyebrow">The demo path</span>
          </div>
          <div className="rail-step">
            <b>1. Open the distributor console in a second tab</b>
            <span>Work as the supervisor if you want to edit data while you go.</span>
          </div>
          <div className="rail-step">
            <b>2. Send the recommended offer</b>
            <span>The console shapes the wording to this customer&rsquo;s temperament and language.</span>
          </div>
          <div className="rail-step">
            <b>3. Watch it land here</b>
            <span>No refresh needed. The two tabs stay in step.</span>
          </div>
          <div className="rail-step">
            <b>4. Tap &ldquo;Tell me more&rdquo;</b>
            <span>A hot lead appears on the console queue while intent is still warm.</span>
          </div>
          <div className="rail-step" style={{ borderLeft: 0, paddingBottom: 0 }}>
            <b>5. Finish onboarding here</b>
            <span>Three steps, existing KYC carried across, and the console sees it complete.</span>
          </div>

          <div style={{ margin: '26px 0 0' }}>
            <span className="eyebrow">Session activity</span>
            {state.status === 'error' ? (
              <div style={{ marginTop: 12 }}>
                <LoadFail onRetry={reset} />
              </div>
            ) : (
              <ul className="feed">
                {state.activity.slice(0, 9).map((a) => (
                  <li key={a.id} data-surface={a.surface}>
                    <time>{a.at}</time>
                    <i>{a.surface}</i>
                    <span>{a.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
