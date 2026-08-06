'use client';

import { useState } from 'react';
import { CUSTOMERS } from '@/lib/data';
import { useStore } from '@/lib/store';
import CustomerWorkspace from './CustomerWorkspace';
import CampaignStudio from './CampaignStudio';
import Performance from './Performance';

const WS_TABS = [
  { id: 'customer', label: 'Customer' },
  { id: 'studio', label: 'Campaign studio' },
  { id: 'performance', label: 'Performance' },
];

export default function AgentConsole() {
  const { state, dispatch } = useStore();
  const [activeId, setActiveId] = useState(CUSTOMERS[0].id);
  const [ws, setWs] = useState('customer');

  return (
    <div className="console">
      <aside className="queue">
        <div className="queue-head">
          <span className="eyebrow">Care queue · Kolkata circle</span>
          <h2>{CUSTOMERS.length} waiting</h2>
          <p>Ordered by revenue at risk, not by arrival time.</p>
        </div>

        {state.intents.map((i) => (
          <div className="intent-strip" key={i.id}>
            <b>Hot lead · {i.customer}</b>
            <span>{i.note}</span>
            <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
              <button
                className="btn"
                style={{ padding: '6px 11px', fontSize: 12 }}
                onClick={() => {
                  setActiveId(i.customerId);
                  setWs('customer');
                }}
              >
                Open profile
              </button>
              <button
                className="btn ghost"
                style={{ padding: '6px 11px', fontSize: 12 }}
                onClick={() => dispatch({ type: 'CLEAR_INTENT', id: i.id })}
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}

        <div className="queue-list">
          {CUSTOMERS.map((c) => (
            <button
              key={c.id}
              className="qrow"
              data-on={c.id === activeId && ws === 'customer'}
              onClick={() => {
                setActiveId(c.id);
                setWs('customer');
              }}
            >
              <div className="qrow-top">
                <span className="dot" data-p={c.priority} />
                <strong>{c.name}</strong>
                <span className="mono">{c.waiting}</span>
              </div>
              <p>
                {c.channel} · {c.reason}
              </p>
            </button>
          ))}
        </div>
      </aside>

      <section className="workspace">
        <nav className="ws-tabs">
          {WS_TABS.map((t) => (
            <button key={t.id} data-on={ws === t.id} onClick={() => setWs(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>

        <div className="ws-body">
          {ws === 'customer' && <CustomerWorkspace customerId={activeId} />}
          {ws === 'studio' && <CampaignStudio />}
          {ws === 'performance' && <Performance />}
        </div>
      </section>
    </div>
  );
}
