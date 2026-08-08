'use client';

import { useDb } from '@/lib/db';
import { APP_USER_ID } from '@/lib/data';
import {
  ACCOUNT_OWNER,
  HOUSEHOLD,
  MEMBERS,
  SUBSCRIPTIONS,
  memberSpend,
  subsFor,
  recommendBundle,
} from '@/lib/family';
import Count from '@/components/ui/Count';

export default function FamilyTab({ setTab }) {
  const { state, dispatch } = useDb();
  const me = state.customers.find((c) => c.id === APP_USER_ID);
  const rec = recommendBundle();

  const raised = state.requests.find((r) => r.type === 'family-bundle');

  function requestBundle() {
    dispatch({
      type: 'RAISE_REQUEST',
      request: {
        type: 'family-bundle',
        from: me?.name ?? 'Customer',
        fromId: APP_USER_ID,
        title: rec.bundle.name,
        note: `Asked to move ${MEMBERS.length} household lines onto ${rec.bundle.name}. Saving ₹${rec.saving.toLocaleString('en-IN')} a month against current spend.`,
      },
    });
  }

  return (
    <>
      <div className="sec-head">
        <h2>Your account</h2>
        <span className="pill">{HOUSEHOLD.area}</span>
      </div>

      <div className="fam-total">
        <span className="eyebrow">Everything on {ACCOUNT_OWNER}&rsquo;s account</span>
        <strong>
          <Count to={rec.now.total} prefix="₹" />
        </strong>
        <div className="fam-split">
          <span>
            <b>₹{rec.now.mobile.toLocaleString('en-IN')}</b>
            {MEMBERS.length} lines on this account
          </span>
          <span>
            <b>₹{rec.now.broadband.toLocaleString('en-IN')}</b>
            home broadband
          </span>
          <span>
            <b>₹{rec.now.ott.toLocaleString('en-IN')}</b>
            {SUBSCRIPTIONS.length} subscriptions
          </span>
        </div>
      </div>

      {/* Who is on what. Separate plans and separate dates are the problem the
          bundle solves, so both have to be visible before the offer. */}
      {MEMBERS.map((m) => {
        const subs = subsFor(m.id);
        return (
          <div className="fam-member" key={m.id}>
            <span className="avatar">{m.initials}</span>
            <div className="fam-member-body">
              <div className="fam-member-top">
                <b>{m.name}</b>
                <span className="mono">₹{memberSpend(m).toLocaleString('en-IN')}</span>
              </div>
              <small>
                {m.relation} · {m.plan}
              </small>
              <div className="fam-meta">
                <span>{m.dataGb} GB used</span>
                {m.topUpsMonthly > 0 && <span className="fam-warn">₹{m.topUpsMonthly}/mo on top-ups</span>}
                {subs.map((s) => (
                  <span key={s.id}>{s.name}</span>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* On-device usage. This is what makes the recommendation specific rather
          than generic, so it is shown to the customer rather than kept behind
          the scenes. */}
      <div className="sec-head">
        <h2>Where your data goes</h2>
      </div>

      <div className="tile">
        <div className="fam-bar" role="img" aria-label="Household data by category">
          {rec.cats.map((c) => (
            <i key={c.category} style={{ width: `${c.share}%` }} data-cat={c.category} title={`${c.category} ${c.share}%`} />
          ))}
        </div>
        <ul className="fam-cats">
          {rec.cats.map((c) => (
            <li key={c.category}>
              <i data-cat={c.category} />
              {c.category}
              <b>{c.share}%</b>
              <small>{c.gb} GB</small>
            </li>
          ))}
        </ul>
        <p className="fam-privacy">
          Read on this device. Only category totals are used to pick an offer, and no per-app record
          leaves your phone.
        </p>
      </div>

      <div className="tile">
        <span className="eyebrow">Top apps across the household</span>
        <ul className="fam-apps">
          {rec.apps.map((a) => (
            <li key={a.app}>
              {a.app}
              <b>{a.gb} GB</b>
            </li>
          ))}
        </ul>
      </div>

      {rec.dupes.length > 0 && (
        <div className="alert-card">
          <span className="alert-icon" aria-hidden="true">⧉</span>
          <div className="alert-body">
            <h3>You are paying twice for the same thing</h3>
            {rec.dupes.map((d) => (
              <p key={d.service} style={{ marginBottom: 6 }}>
                Two {d.service} subscriptions in one household, on{' '}
                {d.subs.map((s) => s.name.split(' ').slice(-1)[0].toLowerCase()).join(' and ')} tiers.
                That is ₹{d.wasted} a month for something you already have.
              </p>
            ))}
          </div>
        </div>
      )}

      {/* The recommendation. Every number here reconciles against the panel
          above, which is the only reason it is worth showing at all. */}
      <div className="sec-head">
        <h2>Recommended for you</h2>
        <span className="ai-tag">From your usage</span>
      </div>

      <div className="fam-rec">
        <div className="fam-rec-top">
          <span className="eyebrow">One bill, one date</span>
          <h3>{rec.bundle.name}</h3>
          <div className="fam-price">
            <strong>₹{rec.bundle.monthly.toLocaleString('en-IN')}</strong>
            <em>a month for the whole house</em>
          </div>
          <div className="fam-saving">
            You save <b>₹{rec.saving.toLocaleString('en-IN')}</b> a month, ₹
            {rec.savingYearly.toLocaleString('en-IN')} a year
          </div>
        </div>

        <div className="fam-rec-body">
          <div className="fam-includes">
            <span className="eyebrow">What is in it</span>
            <ul>
              <li>
                {rec.bundle.lines} mobile lines · {rec.bundle.dataNote}
              </li>
              <li>{rec.bundle.fiber} home fiber, installed in about 48 hours</li>
              <li>{rec.bundle.ott.length} OTT apps included at no extra cost</li>
            </ul>
            <div className="fam-ott">
              {rec.bundle.ott.map((o) => (
                <span key={o}>{o}</span>
              ))}
            </div>
          </div>

          <div className="fam-swap">
            <span className="eyebrow">Subscriptions this replaces</span>
            <ul>
              {rec.replaced.map((s) => (
                <li key={s.id}>
                  <s>{s.name}</s>
                  <b>₹{s.monthly}</b>
                </li>
              ))}
            </ul>
            {rec.caveat && <p className="fam-caveat">{rec.caveat}</p>}
          </div>

          <div className="fam-why">
            <span className="eyebrow">Why this one for your household</span>
            <ul className="reasons">
              {rec.why.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>

          {raised ? (
            <div className="alert-raised" role="status">
              <b>We have raised a request for this to customer support.</b>
              <span>
                Reference {raised.id.toUpperCase()} · raised at {raised.at}. Someone will call to
                confirm the four lines and book your fiber install.
              </span>
            </div>
          ) : (
            <>
              <button className="btn primary block" onClick={requestBundle}>
                Move the household to this bundle
              </button>
              <button className="btn ghost block" style={{ marginTop: 6 }} onClick={() => setTab('home')}>
                Not right now
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
