'use client';

import { useDb } from '@/lib/db';
import { propensity, formatINR } from '@/lib/ai';
import Count from '@/components/ui/Count';

const BEFORE_AFTER = [
  { metric: 'Agent ramp to full productivity', before: '6 weeks', after: '9 days', note: 'The script comes with the profile, so a new agent is not memorising pitches' },
  { metric: 'Classroom training cost per agent', before: '₹38,000', after: '₹11,000', note: 'Product training stays, pitch training moves into the console' },
  { metric: 'Upsell attempt rate per shift', before: '31%', after: '78%', note: 'Agents skip the pitch when unsure. A recommendation removes the guess' },
  { metric: 'Offers that reach the wrong profile', before: '1 in 4', after: '1 in 19', note: 'Suppression rules read the same signals the recommendation does' },
  { metric: 'Campaign spend on non-responsive areas', before: '42%', after: '17%', note: 'Cluster targeting instead of city-wide buys' },
];

export default function Performance() {
  const { state } = useDb();
  const CUSTOMERS = state.customers;
  const LOCALITIES = state.localities;
  const avg = Math.round(CUSTOMERS.reduce((s, c) => s + propensity(c), 0) / CUSTOMERS.length);
  const pipeline = LOCALITIES.reduce((s, l) => s + Math.round(l.subscribers * 0.72 * 0.024), 0);

  return (
    <>
      <div className="grid-4 stagger" style={{ marginBottom: 18 }}>
        <div className="stat">
          <span>Queue conversion score</span>
          <b><Count to={avg} suffix="%" /></b>
          <span>Average across the {CUSTOMERS.length} open conversations</span>
        </div>
        <div className="stat">
          <span>Offers sent this session</span>
          <b>{state.offers.length}</b>
          <span>{state.offers.filter((o) => o.status === 'accepted').length} completed onboarding</span>
        </div>
        <div className="stat">
          <span>Campaigns live</span>
          <b>{state.liveCampaigns.length}</b>
          <span>Across {LOCALITIES.length} mapped micro-markets</span>
        </div>
        <div className="stat">
          <span>Addressable this quarter</span>
          <b><Count to={pipeline} /></b>
          <span>Conversions modelled across all clusters</span>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <header>
            <h3>What the two features are meant to move</h3>
            <span className="pill warn">Modelled, not measured</span>
          </header>
          <table className="table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Today</th>
                <th>Target</th>
              </tr>
            </thead>
            <tbody>
              {BEFORE_AFTER.map((r) => (
                <tr key={r.metric}>
                  <td>
                    <b>{r.metric}</b>
                    <br />
                    <span style={{ fontSize: 11.5, color: 'var(--d-text-3)' }}>{r.note}</span>
                  </td>
                  <td className="mono">{r.before}</td>
                  <td className="mono" style={{ color: '#ff6b6b', fontWeight: 700 }}>{r.after}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: 11.5, color: 'var(--d-text-3)', lineHeight: 1.6, marginBottom: 0 }}>
            These are the demo&rsquo;s assumptions, held in one place so they can be argued with.
            Nothing here is a measured result.
          </p>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 12 }}>
            <header>
              <h3>Live campaigns</h3>
            </header>
            {state.liveCampaigns.length === 0 ? (
              <p style={{ fontSize: 12.5, color: 'var(--d-text-3)', margin: 0, lineHeight: 1.6 }}>
                None yet. Build one in the campaign studio and launch it into a cluster.
              </p>
            ) : (
              state.liveCampaigns.map((c) => (
                <div className="channel" key={c.id}>
                  <div className="channel-bar">
                    <small>{c.at}</small>
                  </div>
                  <div>
                    <b>{c.area}</b>
                    <span>{c.headline}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="card">
            <header>
              <h3>Cluster ranking</h3>
              <span className="pill">By revenue opportunity</span>
            </header>
            <table className="table">
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Need</th>
                  <th>Opportunity</th>
                </tr>
              </thead>
              <tbody>
                {[...LOCALITIES]
                  .map((l) => ({ l, v: Math.round(l.subscribers * 0.72 * 0.024 * l.arpu) }))
                  .sort((a, b) => b.v - a.v)
                  .map(({ l, v }) => (
                    <tr key={l.id}>
                      <td>
                        <b>{l.name}</b>
                        <br />
                        <span className="mono" style={{ fontSize: 11, color: 'var(--d-text-3)' }}>{l.pin}</span>
                      </td>
                      <td style={{ fontSize: 11.5 }}>{l.need}</td>
                      <td className="mono"><b>{formatINR(v)}</b>/mo</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
