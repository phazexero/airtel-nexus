'use client';

import { useState } from 'react';
import { StoreProvider } from '@/lib/store';
import CustomerSurface from '@/components/customer/CustomerSurface';
import AgentConsole from '@/components/agent/AgentConsole';

export default function Page() {
  const [surface, setSurface] = useState('console');

  return (
    <StoreProvider>
      <div className="shell">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <span>
              Nexus
              <small>Airtel dual surface</small>
            </span>
          </div>
          <span className="topbar-note">
            Both surfaces share one state. What an agent sends shows up on the phone, and what the
            phone taps shows up on the queue.
          </span>
          <div className="surface-switch" role="tablist" aria-label="Choose a surface">
            <button
              role="tab"
              aria-selected={surface === 'console'}
              data-on={surface === 'console'}
              onClick={() => setSurface('console')}
            >
              Care console
            </button>
            <button
              role="tab"
              aria-selected={surface === 'app'}
              data-on={surface === 'app'}
              onClick={() => setSurface('app')}
            >
              Customer app
            </button>
          </div>
        </header>

        {surface === 'console' ? <AgentConsole /> : <CustomerSurface />}
      </div>
    </StoreProvider>
  );
}
