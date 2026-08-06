'use client';

import { useDb } from '@/lib/db';
import { nextBestAction } from '@/lib/ai';
import { useEdit, useSession } from './CareChrome';
import { EditText, EditNumber, EditSelect, EditList } from '@/components/ui/Editable';
import NextBestAction from './NextBestAction';
import Count from '@/components/ui/Count';

const SCALE = {
  pastExperience: { good: 4, neutral: 3, mixed: 2, poor: 1 },
  temperament: { warm: 4, analytical: 4, skeptical: 3, anxious: 2, impatient: 2, frustrated: 1 },
  communication: { high: 4, medium: 3, low: 1 },
  language: { English: 4, Bengali: 4, Hindi: 4 },
};

const OPTIONS = {
  pastExperience: ['good', 'neutral', 'mixed', 'poor'],
  temperament: ['warm', 'analytical', 'skeptical', 'anxious', 'impatient', 'frustrated'],
  communication: ['high', 'medium', 'low'],
  language: ['English', 'Bengali', 'Hindi'],
};

const PARAMS = [
  { key: 'temperament', label: 'Temperament', note: 'temperamentNote' },
  { key: 'pastExperience', label: 'Past experience', note: 'pastExperienceNote' },
  { key: 'communication', label: 'Communication', note: 'communicationNote' },
  { key: 'language', label: 'Language response', note: 'languageNote' },
];

export default function CustomerWorkspace({ customerId }) {
  const { state, dispatch } = useDb();
  const { editing } = useEdit();
  const user = useSession();

  const customer = state.customers.find((c) => c.id === customerId);
  if (!customer) return null;

  const loc = state.localities.find((l) => l.id === customer.locality);
  const decision = nextBestAction(customer, loc, state.products);

  const patch = (p) => dispatch({ type: 'UPDATE_CUSTOMER', id: customer.id, patch: p, by: user.name });
  const patchProfile = (k, v) => patch({ profile: { ...customer.profile, [k]: v } });
  const patchLoc = (p) => dispatch({ type: 'UPDATE_LOCALITY', id: loc.id, patch: p, by: user.name });

  return (
    <>
      <div className="who">
        <div className="avatar">{customer.initials}</div>
        <div>
          <h2>
            <EditText value={customer.name} editing={editing} onChange={(v) => patch({ name: v })} />
          </h2>
          <p>
            {customer.id} · {customer.phone} · <EditText value={customer.plan} editing={editing} onChange={(v) => patch({ plan: v })} /> ·{' '}
            {customer.tenure} months with us
          </p>
        </div>
        <div className="who-tags">
          <span className="pill">{loc?.name}</span>
          <span className="pill">{loc?.pin}</span>
          <span className={`pill ${customer.priority === 'urgent' ? 'hot' : ''}`}>
            {customer.channel} · waiting {customer.waiting}
          </span>
          {editing && <span className="pill ai">Editing</span>}
        </div>
      </div>

      <div className="grid-4 stagger" key={customer.id} style={{ marginBottom: 16 }}>
        <div className="stat">
          <span>Monthly value</span>
          <b>
            {editing ? (
              <EditNumber value={customer.arpu} editing prefix="₹" onChange={(v) => patch({ arpu: v || 0 })} />
            ) : (
              <Count to={customer.arpu} prefix="₹" />
            )}
          </b>
          <span>
            Across {customer.holds.length} service{customer.holds.length > 1 ? 's' : ''}
          </span>
        </div>
        <div className="stat">
          <span>Tenure</span>
          <b>
            {editing ? (
              <EditNumber value={customer.tenure} editing suffix=" mo" onChange={(v) => patch({ tenure: v || 0 })} />
            ) : (
              `${Math.floor(customer.tenure / 12)}y ${customer.tenure % 12}m`
            )}
          </b>
          <span>Joined {2026 - Math.floor(customer.tenure / 12)}</span>
        </div>
        <div className="stat">
          <span>Area</span>
          <b style={{ fontSize: 17 }}>{loc?.name}</b>
          <span>{loc?.segment}</span>
        </div>
        <div className="stat">
          <span>Why they are here</span>
          <b style={{ fontSize: 14, lineHeight: 1.4, marginTop: 8 }}>
            <EditText value={customer.reason} editing={editing} multiline onChange={(v) => patch({ reason: v })} />
          </b>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <header>
            <h3>Profile read</h3>
            <span className="pill ai">4 parameters</span>
          </header>

          {PARAMS.map((p) => {
            const value = customer.profile[p.key];
            const level = SCALE[p.key][value] ?? 3;
            const tone = level >= 4 ? 'good' : level <= 1 ? 'bad' : 'neutral';
            return (
              <div className="param" key={p.key}>
                <div className="param-top">
                  <b>{p.label}</b>
                  <div className="bars" data-tone={tone}>
                    {[1, 2, 3, 4].map((i) => (
                      <i key={i} data-on={i <= level} />
                    ))}
                  </div>
                  <span className="val">
                    <EditSelect
                      value={value}
                      options={OPTIONS[p.key]}
                      editing={editing}
                      onChange={(v) => patchProfile(p.key, v)}
                    />
                  </span>
                </div>
                <p>
                  <EditText
                    value={customer.profile[p.note]}
                    editing={editing}
                    multiline
                    onChange={(v) => patchProfile(p.note, v)}
                  />
                </p>
              </div>
            );
          })}

          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--d-line)' }}>
            <span className="eyebrow">Best time to reach</span>
            <p style={{ margin: '6px 0 0', fontSize: 13, fontWeight: 600 }}>
              <EditText
                value={customer.profile.bestTime}
                editing={editing}
                onChange={(v) => patchProfile('bestTime', v)}
              />
            </p>
          </div>

          {editing && (
            <p style={{ fontSize: 11, color: 'var(--d-text-3)', lineHeight: 1.6, margin: '14px 0 0' }}>
              Change temperament or language and the script on the right rewrites itself. That is the
              point of exposing these four fields rather than hiding them in a model.
            </p>
          )}
        </div>

        <div className="card">
          <header>
            <h3>Signals picked up</h3>
            <span className="pill">Last 90 days</span>
          </header>
          <EditList
            items={customer.signals}
            editing={editing}
            onChange={(v) => patch({ signals: v })}
            addLabel="Add a signal"
          />

          <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--d-line)' }}>
            <span className="eyebrow">Area context · {loc?.name}</span>
            <table className="table" style={{ marginTop: 10 }}>
              <tbody>
                <tr>
                  <td>Dominant need</td>
                  <td>
                    <b>
                      <EditText value={loc.need} editing={editing} onChange={(v) => patchLoc({ need: v })} />
                    </b>
                  </td>
                </tr>
                <tr>
                  <td>Prepaid share</td>
                  <td>
                    <b>
                      <EditNumber value={loc.prepaidShare} editing={editing} suffix="%" max={100} onChange={(v) => patchLoc({ prepaidShare: v || 0 })} />
                    </b>
                  </td>
                </tr>
                <tr>
                  <td>Fiber penetration</td>
                  <td>
                    <b>
                      <EditNumber value={loc.fiberPenetration} editing={editing} suffix="%" max={100} onChange={(v) => patchLoc({ fiberPenetration: v || 0 })} />
                    </b>
                  </td>
                </tr>
                <tr>
                  <td>Area ARPU</td>
                  <td>
                    <b>
                      <EditNumber value={loc.arpu} editing={editing} prefix="₹" onChange={(v) => patchLoc({ arpu: v || 0 })} />
                    </b>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <NextBestAction customer={customer} decision={decision} />
      </div>
    </>
  );
}
