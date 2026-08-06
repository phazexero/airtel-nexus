'use client';

import { useState } from 'react';
import { LOCALITIES } from '@/lib/data';
import { buildCampaign, formatINR } from '@/lib/ai';
import { useStore } from '@/lib/store';
import Count from '@/components/ui/Count';

const OBJECTIVES = [
  { id: 'acquisition', label: 'Acquire' },
  { id: 'upsell', label: 'Upsell' },
  { id: 'retention', label: 'Retain' },
];

// Simple projection of the six pins into the frame. Real deployment swaps this
// for the GIS layer; the interaction and the data contract stay the same.
const BOUNDS = { minLat: 22.49, maxLat: 22.6, minLng: 88.3, maxLng: 88.47 };

function project(loc) {
  const x = ((loc.lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 84 + 8;
  const y = (1 - (loc.lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 74 + 12;
  return { x, y };
}

export default function CampaignStudio() {
  const { state, dispatch } = useStore();
  const [areaId, setAreaId] = useState(null);
  const [objective, setObjective] = useState('upsell');
  const [budget, setBudget] = useState(250000);
  const [brief, setBrief] = useState(null);
  const [busy, setBusy] = useState(false);

  function generate() {
    if (!areaId) return;
    setBusy(true);
    // Deliberate delay so the demo shows the work being done. Replace with the
    // real await when /api/ai is wired to a model.
    setTimeout(() => {
      setBrief(buildCampaign(areaId, objective, budget));
      setBusy(false);
    }, 650);
  }

  const selected = LOCALITIES.find((l) => l.id === areaId);

  return (
    <div className="studio">
      <div>
        <div className="card" style={{ padding: 14 }}>
          <div className="map-frame">
            <svg className="map-grid" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {[...Array(9)].map((_, i) => (
                <line key={`v${i}`} x1={(i + 1) * 10} y1="0" x2={(i + 1) * 10} y2="100" stroke="#2a3348" strokeWidth="0.3" />
              ))}
              {[...Array(9)].map((_, i) => (
                <line key={`h${i}`} x1="0" y1={(i + 1) * 10} x2="100" y2={(i + 1) * 10} stroke="#2a3348" strokeWidth="0.3" />
              ))}
            </svg>
            {LOCALITIES.map((l) => {
              const { x, y } = project(l);
              const size = 14 + (l.subscribers / 63800) * 22;
              return (
                <button
                  key={l.id}
                  className="map-pin"
                  data-on={l.id === areaId}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  onClick={() => {
                    setAreaId(l.id);
                    setBrief(null);
                  }}
                  aria-label={`Select ${l.name}`}
                >
                  <i style={{ width: size, height: size }} />
                  <span>{l.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          <div className="area-list">
            {LOCALITIES.map((l) => (
              <button
                key={l.id}
                className="area-row"
                data-on={l.id === areaId}
                onClick={() => {
                  setAreaId(l.id);
                  setBrief(null);
                }}
              >
                <div>
                  <b>{l.name}</b>
                  <small>{l.need}</small>
                </div>
                <span className="mono">{l.pin}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginTop: 12 }}>
          <div className="field">
            <label htmlFor="obj">Objective</label>
            <div className="seg" id="obj">
              {OBJECTIVES.map((o) => (
                <button
                  key={o.id}
                  data-on={objective === o.id}
                  onClick={() => {
                    setObjective(o.id);
                    setBrief(null);
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label htmlFor="bud">Budget · {formatINR(budget)}</label>
            <input
              id="bud"
              type="range"
              min={50000}
              max={1000000}
              step={25000}
              value={budget}
              onChange={(e) => {
                setBudget(Number(e.target.value));
                setBrief(null);
              }}
            />
          </div>

          <button className="btn ai block" onClick={generate} disabled={!areaId || busy}>
            {busy ? 'Reading the area…' : 'Build the campaign'}
          </button>
          {!areaId && (
            <p style={{ fontSize: 11.5, color: 'var(--d-text-3)', margin: '10px 0 0', textAlign: 'center' }}>
              Pick an area on the map first.
            </p>
          )}
        </div>
      </div>

      <div>
        {!brief && (
          <div className="empty-studio">
            <span className="ai-tag">Campaign studio</span>
            <h3 style={{ marginTop: 10 }}>
              {selected ? `${selected.name} is selected` : 'Pick a micro-market'}
            </h3>
            <p>
              {selected
                ? `Set the objective and budget, then build the campaign. The brief is derived from what this pin cluster actually shows, not from a city-wide average.`
                : 'City-level campaigns average away the thing that makes an area worth targeting. Each pin here is a pin-code cluster with its own dominant need.'}
            </p>
          </div>
        )}

        {brief && <Brief brief={brief} onLaunch={() => dispatch({ type: 'LAUNCH_CAMPAIGN', campaign: { area: brief.locality.name, headline: brief.headline } })} launched={state.liveCampaigns.some((c) => c.area === brief.locality.name)} />}
      </div>
    </div>
  );
}

function Brief({ brief, onLaunch, launched }) {
  const { locality: loc, projection: pr, product } = brief;

  return (
    <>
      <div className="grid-4 stagger" style={{ marginBottom: 14 }}>
        <div className="stat">
          <span>Reach in this cluster</span>
          <b><Count to={pr.reach} /></b>
          <span>of {loc.subscribers.toLocaleString('en-IN')} on network</span>
        </div>
        <div className="stat">
          <span>Expected conversions</span>
          <b><Count to={pr.conversions} /></b>
          <span>at the modelled response rate</span>
        </div>
        <div className="stat">
          <span>Monthly revenue added</span>
          <b>{formatINR(pr.revenue)}</b>
          <span>recurring, not one-time</span>
        </div>
        <div className="stat">
          <span>Cost per acquisition</span>
          <b><Count to={pr.cac} prefix="₹" /></b>
          <span>payback in {pr.payback} month{pr.payback > 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="creative" style={{ marginBottom: 14 }}>
        <div className="creative-top">
          <span className="eyebrow">
            {loc.name} · {loc.pin} · {brief.angle}
          </span>
          <h2>{brief.headline}</h2>
          <p>{brief.sub}</p>
        </div>
        <div className="creative-body">
          <span className="eyebrow">Proof line to carry on every asset</span>
          <p style={{ fontSize: 13, lineHeight: 1.6, margin: '6px 0 16px', color: 'var(--d-text-2)' }}>
            {brief.proof}
          </p>
          <span className="eyebrow">Creative direction</span>
          <p style={{ fontSize: 13, lineHeight: 1.6, margin: '6px 0 0', color: 'var(--d-text-2)' }}>
            {brief.creative}
          </p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <header>
            <h3>Channel split</h3>
            <span className="pill">{formatINR(brief.budget)}</span>
          </header>
          {brief.channels.map((c) => (
            <div className="channel" key={c.name}>
              <div className="channel-bar">
                <i style={{ width: `${c.split}%` }} />
                <small>{c.split}%</small>
              </div>
              <div>
                <b>{c.name}</b>
                <span>{c.why}</span>
              </div>
            </div>
          ))}
          <div className="callout" style={{ borderLeftColor: 'var(--red)', background: 'rgba(228,0,0,0.1)' }}>
            <b style={{ color: '#ff6b6b' }}>Objective tilt</b>
            <p>{brief.objectiveNote}</p>
          </div>
        </div>

        <div className="card">
          <header>
            <h3>What the area told us</h3>
            <span className="pill ai">Evidence</span>
          </header>
          <ul className="reasons">
            {brief.evidence.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>

          <div className="thinking" style={{ marginTop: 16 }}>
            <span className="c">// how the brief was derived</span>
            <br />
            <span className="k">area</span> = {loc.pin} · {loc.segment}
            <br />
            <span className="k">need</span> = {loc.need}
            <br />
            <span className="k">product</span> = {product.name}
            <br />
            <span className="k">rate</span> = {loc.arpu} ARPU · {loc.prepaidShare}% prepaid ·{' '}
            {loc.fiberPenetration}% fiber
            <br />
            <span className="k">churn</span> = {loc.churnRisk}
            <br />
            <span className="c">// wording generated, targeting is rule-derived</span>
          </div>

          <div className="actions-row">
            <button className="btn ai" onClick={onLaunch} disabled={launched}>
              {launched ? 'Campaign is live' : 'Launch in this cluster'}
            </button>
            <button className="btn">Export brief</button>
          </div>
        </div>
      </div>
    </>
  );
}
