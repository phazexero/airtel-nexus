'use client';

import { useState } from 'react';
import Link from 'next/link';
import { JOURNEY, JOURNEY_PROMISE, JOURNEY_OUTCOMES } from '@/lib/journey';

export default function JourneyView() {
  const [open, setOpen] = useState(1);

  return (
    <>
      <div className="journey-rail">
        {JOURNEY.map((s) => (
          <button
            key={s.n}
            className="journey-step"
            data-on={open === s.n}
            onClick={() => setOpen(s.n)}
            aria-expanded={open === s.n}
          >
            <span className="journey-num">{s.n}</span>
            <span className="journey-step-label">
              <b>{s.title}</b>
              <small>{s.sub}</small>
            </span>
          </button>
        ))}
      </div>

      {JOURNEY.filter((s) => s.n === open).map((s) => (
        <div className="journey-detail" key={s.n}>
          <div className="journey-quote">
            <span className="eyebrow">What the distributor is asking</span>
            <blockquote>{s.asks}</blockquote>
          </div>

          <div className="grid-3" style={{ marginBottom: 14 }}>
            <div className="card">
              <header>
                <h3>What they do</h3>
              </header>
              <p className="journey-body">{s.action}</p>
            </div>

            <div className="card journey-enabler">
              <header>
                <h3>{s.enabler.name}</h3>
                <span className="pill ai">Enabler</span>
              </header>
              <p className="journey-body">{s.enabler.detail}</p>
              <Link href={s.feature.href} className="btn ai journey-jump">
                Open {s.feature.label}
              </Link>
            </div>

            <div className="card">
              <header>
                <h3>How it helps</h3>
              </header>
              <p className="journey-body">{s.helps}</p>
              <div className="journey-proof">
                <span className="eyebrow">Target</span>
                <ul>
                  {s.proof.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="journey-promise">{JOURNEY_PROMISE}</div>

      <div className="journey-outcomes">
        {JOURNEY_OUTCOMES.map((o) => (
          <div key={o.title}>
            <b>{o.title}</b>
            <span>{o.detail}</span>
          </div>
        ))}
      </div>

      <p className="journey-note">
        The figures on each stage are targets the pitch argues for, not measured results. The
        assumptions behind them sit on the Performance feature, in one place, so they are easy to
        find and easy to argue with.
      </p>
    </>
  );
}
