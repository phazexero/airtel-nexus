'use client';

import { useCallback, useMemo, useState } from 'react';
import { buildCampaign, formatINR, marketingDirections, areaBrief, opportunityBand } from '@/lib/ai';
import { POPULATION_TYPES } from '@/lib/data';
import AreaMap from './AreaMap';
import { useDb } from '@/lib/db';
import { useEdit, useSession } from './CareChrome';
import { EditText, EditList } from '@/components/ui/Editable';
import { Skel } from '@/components/ui/Skeleton';
import Count from '@/components/ui/Count';

const OBJECTIVES = [
  { id: 'acquisition', label: 'Acquire' },
  { id: 'upsell', label: 'Upsell' },
  { id: 'retention', label: 'Retain' },
];

const MODES = [
  { id: 'population', label: 'Population type' },
  { id: 'opportunity', label: 'Opportunity' },
];

const OPPORTUNITY_FILL = ['#4a2020', '#8a1c1c', '#cc1616', '#ff2e2e'];
const BAND_LABELS = ['Watch', 'Worth a look', 'Strong', 'Priority'];

export default function CampaignStudio() {
  const { state, dispatch } = useDb();
  const { editing } = useEdit();
  const user = useSession();
  const LOCALITIES = state.localities;

  const [areaId, setAreaId] = useState(null);
  const [mode, setMode] = useState('population');
  const [objective, setObjective] = useState('upsell');
  const [budget, setBudget] = useState(250000);
  const [direction, setDirection] = useState(null);
  const [brief, setBrief] = useState(null);
  const [busy, setBusy] = useState(false);

  const selected = LOCALITIES.find((l) => l.id === areaId) ?? null;
  const directions = useMemo(() => (selected ? marketingDirections(selected) : []), [selected]);

  const pickArea = useCallback((id) => {
    setAreaId(id);
    setDirection(null);
    setBrief(null);
  }, []);

  function generate() {
    if (!selected) return;
    setBusy(true);
    setTimeout(() => {
      setBrief(buildCampaign(selected, objective, budget, state.products));
      setBusy(false);
    }, 900);
  }

  const legend =
    mode === 'population'
      ? Object.entries(POPULATION_TYPES).map(([id, t]) => ({ id, label: t.label, colour: t.colour }))
      : OPPORTUNITY_FILL.map((colour, i) => ({ id: `band-${i}`, colour, label: BAND_LABELS[i] }));

  return (
    <>
      {/* The map is the screen. Everything below answers a question it raises. */}
      <div className="geo">
        <div className="geo-bar">
          <div>
            <span className="eyebrow">Around IIFT Kolkata · Madurdaha</span>
            <h3>{LOCALITIES.length} micro-markets within 6 km</h3>
          </div>
          <div className="seg geo-mode">
            {MODES.map((m) => (
              <button key={m.id} data-on={mode === m.id} onClick={() => setMode(m.id)}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <AreaMap
          localities={LOCALITIES}
          mode={mode}
          selectedId={areaId}
          onSelect={pickArea}
        />

        <div className="geo-legend">
          {legend.map((k) => (
            <span key={k.id}>
              <i style={{ background: k.colour }} />
              {k.label}
            </span>
          ))}
        </div>
      </div>

      {!selected && (
        <div className="empty-studio">
          <span className="ai-tag">Campaign studio</span>
          <h3>Pick a micro-market</h3>
          <p>
            City-level campaigns average away the thing that makes an area worth targeting. Each
            zone here is a pin-code cluster with its own population mix and its own dominant need.
          </p>
        </div>
      )}

      {selected && (
        <div className="grid-2 geo-detail">
          {/* Three lines. Any more and it competes with the map above it. */}
          <div className="card">
            <header>
              <h3>{selected.name}</h3>
              <span className="pill">{selected.pin}</span>
            </header>
            <ul className="area-mini">
              {areaBrief(selected).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <div className="area-tags">
              <span className="pill">
                <i
                  className="dotc"
                  style={{ background: POPULATION_TYPES[selected.population]?.colour }}
                />
                {POPULATION_TYPES[selected.population]?.label}
              </span>
              <span className="pill">
                {opportunityBand(selected).label} · {opportunityBand(selected).score}
              </span>
              <span className="pill">{selected.churnRisk} churn</span>
            </div>

            {editing && (
              <div style={{ marginTop: 14 }}>
                <span className="eyebrow">Area need</span>
                <EditText
                  value={selected.need}
                  editing
                  multiline
                  onChange={(v) =>
                    dispatch({
                      type: 'UPDATE_LOCALITY',
                      id: selected.id,
                      patch: { need: v },
                      by: user.name,
                    })
                  }
                />
              </div>
            )}
          </div>

          {/* AltAI suggestion box: directions, not a ranking in disguise. */}
          <div className="altai">
            <header>
              <span className="ai-tag">AltAI suggestion box</span>
              <h3>Where this campaign could go</h3>
            </header>
            <p className="altai-lede">
              Three legitimate plays for {selected.name}. Pick the one you can defend, not the one
              at the top.
            </p>
            <ul className="altai-list">
              {directions.map((d, i) => (
                <li key={d.id}>
                  <button
                    data-on={direction === d.id}
                    onClick={() => setDirection(direction === d.id ? null : d.id)}
                    aria-expanded={direction === d.id}
                  >
                    <span className="altai-n">{i + 1}</span>
                    <span className="altai-body">
                      <b>{d.name}</b>
                      <small>{d.thrust}</small>
                      {direction === d.id && (
                        <span className="altai-open">
                          <em>Moves</em>
                          <ul>
                            {d.moves.map((mv) => (
                              <li key={mv}>{mv}</li>
                            ))}
                          </ul>
                          <em>Trade</em>
                          <p>{d.tradeoff}</p>
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {selected && (
        <div className="card geo-controls">
          <div className="grid-3">
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
            <div className="field">
              <span className="field-label">Build</span>
              <button className="btn ai block" onClick={generate} disabled={busy}>
                {busy ? 'Reading the area…' : 'Build the campaign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {busy && <BriefSkeleton />}

      {brief && !busy && (
        <Brief
          brief={brief}
          direction={directions.find((d) => d.id === direction) ?? null}
          editing={editing}
          onEdit={(patch) => {
            dispatch({ type: 'UPDATE_LOCALITY', id: brief.locality.id, patch, by: user.name });
            setBrief(buildCampaign({ ...brief.locality, ...patch }, objective, budget, state.products));
          }}
          onLaunch={() =>
            dispatch({
              type: 'LAUNCH_CAMPAIGN',
              campaign: { area: brief.locality.name, headline: brief.headline },
            })
          }
          launched={state.liveCampaigns.some((c) => c.area === brief.locality.name)}
        />
      )}
    </>
  );
}

function BriefSkeleton() {
  return (
    <>
      <div className="grid-4" style={{ margin: '14px 0' }}>
        {[0, 1, 2, 3].map((i) => (
          <div className="stat" key={i}>
            <Skel w="58%" h={9} />
            <Skel w="70%" h={26} style={{ margin: '10px 0 8px' }} />
            <Skel w="84%" h={9} />
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11.5, color: 'var(--d-text-3)', textAlign: 'center' }}>
        Reading area telemetry, product fit and channel response history.
      </p>
    </>
  );
}

function Brief({ brief, direction, onLaunch, launched, editing, onEdit }) {
  const { locality: loc, projection: pr, product } = brief;

  return (
    <div style={{ marginTop: 14 }}>
      <div className="grid-4 stagger" style={{ marginBottom: 14 }}>
        <div className="stat">
          <span>Reach in this cluster</span>
          <b>
            <Count to={pr.reach} />
          </b>
          <span>of {loc.subscribers.toLocaleString('en-IN')} on network</span>
        </div>
        <div className="stat">
          <span>Expected conversions</span>
          <b>
            <Count to={pr.conversions} />
          </b>
          <span>at the modelled response rate</span>
        </div>
        <div className="stat">
          <span>Monthly revenue added</span>
          <b>{formatINR(pr.revenue)}</b>
          <span>recurring, not one-time</span>
        </div>
        <div className="stat">
          <span>Cost per acquisition</span>
          <b>
            <Count to={pr.cac} prefix="₹" />
          </b>
          <span>
            payback in {pr.payback} month{pr.payback > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="creative" style={{ marginBottom: 14 }}>
        <div className="creative-top">
          <span className="eyebrow">
            {loc.name} · {loc.pin} · {direction ? direction.name : brief.angle}
          </span>
          <h2>{brief.headline}</h2>
          <p>{brief.sub}</p>
        </div>
        <div className="creative-body">
          {direction && (
            <>
              <span className="eyebrow">Direction taken</span>
              <p style={{ fontSize: 13, lineHeight: 1.6, margin: '6px 0 16px', color: 'var(--d-text-2)' }}>
                {direction.thrust} {direction.tradeoff}
              </p>
            </>
          )}
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
          {direction && (
            <div className="callout" style={{ borderLeftColor: 'var(--red)', background: 'rgba(228,0,0,0.1)' }}>
              <b style={{ color: '#ff6b6b' }}>Direction: {direction.name}</b>
              <p>
                Weight the split toward {direction.moves[0].toLowerCase()}. {direction.tradeoff}
              </p>
            </div>
          )}
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
          <EditList
            items={brief.evidence}
            editing={editing}
            onChange={(v) => onEdit({ evidence: v })}
            addLabel="Add evidence"
          />

          <div className="thinking" style={{ marginTop: 16 }}>
            <span className="c">// how the brief was derived</span>
            <br />
            <span className="k">area</span> = {loc.pin} · {loc.segment}
            <br />
            <span className="k">need</span> = {loc.need}
            <br />
            <span className="k">product</span> = {product.name}
            <br />
            <span className="k">direction</span> = {direction ? direction.id : 'engine default'}
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
    </div>
  );
}
