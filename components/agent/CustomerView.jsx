'use client';

import { useEffect, useState } from 'react';
import { useDb } from '@/lib/db';
import { SkelQueue, SkelStats, SkelCard, LoadFail } from '@/components/ui/Skeleton';
import CustomerWorkspace from './CustomerWorkspace';

export default function CustomerView() {
  const { state, dispatch, reset } = useDb();
  const [activeId, setActiveId] = useState(null);

  // Select the first conversation once the working set arrives, and hold the
  // selection if the operator has already picked one.
  useEffect(() => {
    if (state.status === 'ready' && !activeId && state.customers.length) {
      setActiveId(state.customers[0].id);
    }
  }, [state.status, state.customers, activeId]);

  const loading = state.status === 'loading';
  const failed = state.status === 'error';

  return (
    <div className="console">
      <aside className="queue">
        <div className="queue-head">
          <span className="eyebrow">Care queue · Kolkata circle</span>
          <h2>{loading ? 'Loading' : `${state.customers.length} waiting`}</h2>
          <p>
            {loading
              ? 'Pulling the working set for this shift.'
              : 'Ordered by revenue at risk, not by arrival time.'}
          </p>
        </div>

        {state.intents.map((i) => (
          <div className="intent-strip" key={i.id}>
            <b>Hot lead · {i.customer}</b>
            <span>{i.note}</span>
            <div style={{ marginTop: 9, display: 'flex', gap: 6 }}>
              <button
                className="btn"
                style={{ padding: '6px 12px', fontSize: 11.5 }}
                onClick={() => setActiveId(i.customerId)}
              >
                Open profile
              </button>
              <button
                className="btn ghost"
                style={{ padding: '6px 12px', fontSize: 11.5 }}
                onClick={() => dispatch({ type: 'CLEAR_INTENT', id: i.id })}
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}

        {loading ? (
          <SkelQueue />
        ) : (
          <div className="queue-list">
            {state.customers.map((c) => (
              <button
                key={c.id}
                className="qrow"
                data-on={c.id === activeId}
                onClick={() => setActiveId(c.id)}
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
        )}
      </aside>

      <section className="workspace">
        <div className="ws-body">
          {failed && <LoadFail onRetry={reset} />}

          {loading && (
            <>
              <SkelStats />
              <div className="grid-2">
                <SkelCard lines={7} />
                <SkelCard lines={7} />
              </div>
            </>
          )}

          {state.status === 'ready' && activeId && <CustomerWorkspace customerId={activeId} />}
        </div>
      </section>
    </div>
  );
}
