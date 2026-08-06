'use client';

import { customerById, localityById } from '@/lib/data';
import { nextBestAction } from '@/lib/ai';
import NextBestAction from './NextBestAction';
import Count from '@/components/ui/Count';

const SCALE = {
  pastExperience: { good: 4, neutral: 3, mixed: 2, poor: 1 },
  temperament: { warm: 4, analytical: 4, skeptical: 3, anxious: 2, impatient: 2, frustrated: 1 },
  communication: { high: 4, medium: 3, low: 1 },
  language: { English: 4, Bengali: 4, Hindi: 4 },
};

export default function CustomerWorkspace({ customerId }) {
  const customer = customerById(customerId);
  const loc = localityById(customer.locality);
  const decision = nextBestAction(customer);

  return (
    <>
      <div className="who">
        <div className="avatar">{customer.initials}</div>
        <div>
          <h2>{customer.name}</h2>
          <p>
            {customer.id} · {customer.phone} · {customer.plan} · {customer.tenure} months with us
          </p>
        </div>
        <div className="who-tags">
          <span className="pill">{loc.name}</span>
          <span className="pill">{loc.pin}</span>
          <span className={`pill ${customer.priority === 'urgent' ? 'hot' : ''}`}>
            {customer.channel} · waiting {customer.waiting}
          </span>
        </div>
      </div>

      <div className="grid-4 stagger" key={customer.id} style={{ marginBottom: 16 }}>
        <div className="stat">
          <span>Monthly value</span>
          <b><Count to={customer.arpu} prefix="₹" /></b>
          <span>Across {customer.holds.length} service{customer.holds.length > 1 ? 's' : ''}</span>
        </div>
        <div className="stat">
          <span>Tenure</span>
          <b>{Math.floor(customer.tenure / 12)}y {customer.tenure % 12}m</b>
          <span>Joined {2026 - Math.floor(customer.tenure / 12)}</span>
        </div>
        <div className="stat">
          <span>Area</span>
          <b style={{ fontSize: 17 }}>{loc.name}</b>
          <span>{loc.segment}</span>
        </div>
        <div className="stat">
          <span>Why they are here</span>
          <b style={{ fontSize: 14, lineHeight: 1.4, marginTop: 8 }}>{customer.reason}</b>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <header>
            <h3>Profile read</h3>
            <span className="pill ai">4 parameters</span>
          </header>

          {decision.inputs.map((p) => {
            const key =
              p.label === 'Past experience'
                ? 'pastExperience'
                : p.label === 'Temperament'
                  ? 'temperament'
                  : p.label === 'Communication'
                    ? 'communication'
                    : 'language';
            const level = SCALE[key][p.value] ?? 3;
            const tone = level >= 4 ? 'good' : level <= 1 ? 'bad' : 'neutral';
            return (
              <div className="param" key={p.label}>
                <div className="param-top">
                  <b>{p.label}</b>
                  <div className="bars" data-tone={tone}>
                    {[1, 2, 3, 4].map((i) => (
                      <i key={i} data-on={i <= level} />
                    ))}
                  </div>
                  <span className="val">{p.value}</span>
                </div>
                <p>{p.note}</p>
              </div>
            );
          })}

          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--d-line)' }}>
            <span className="eyebrow">Best time to reach</span>
            <p style={{ margin: '5px 0 0', fontSize: 13, fontWeight: 600 }}>
              {customer.profile.bestTime}
            </p>
          </div>
        </div>

        <div className="card">
          <header>
            <h3>Signals picked up</h3>
            <span className="pill">Last 90 days</span>
          </header>
          <ul className="reasons">
            {customer.signals.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>

          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--d-line)' }}>
            <span className="eyebrow">Area context · {loc.name}</span>
            <table className="table" style={{ marginTop: 10 }}>
              <tbody>
                <tr>
                  <td>Dominant need</td>
                  <td><b>{loc.need}</b></td>
                </tr>
                <tr>
                  <td>Prepaid share</td>
                  <td><b>{loc.prepaidShare}%</b></td>
                </tr>
                <tr>
                  <td>Fiber penetration</td>
                  <td><b>{loc.fiberPenetration}%</b></td>
                </tr>
                <tr>
                  <td>Area ARPU</td>
                  <td><b>₹{loc.arpu}</b></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <NextBestAction customer={customer} decision={decision} />
      </div>
    </>
  );
}
