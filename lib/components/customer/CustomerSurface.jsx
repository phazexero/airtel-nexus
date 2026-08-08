'use client';

import { useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/lib/theme';
import { ACCOUNT } from '@/lib/operators';
import PhoneApp from './PhoneApp';

export default function CustomerSurface() {
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
          {ACCOUNT.name}&rsquo;s account · {ACCOUNT.number}. The same account sits first in the distributor queue.
        </span>
        <div className="topbar-right">
          <ThemeToggle scope="my" />
          <Link href="/care" className="btn ghost">
            Distributor console
          </Link>
        </div>
      </header>

      <div className="app-stage app-stage-solo">
        <div className="stage-left">
          <PhoneApp tab={tab} setTab={setTab} />
        </div>

      </div>
    </div>
  );
}
