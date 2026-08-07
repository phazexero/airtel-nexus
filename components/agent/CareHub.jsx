'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDb } from '@/lib/db';
import { useSession } from './CareChrome';
import { FEATURES } from './FeatureNav';
import { Skel } from '@/components/ui/Skeleton';
import Count from '@/components/ui/Count';

const DETAIL = {
  '/care/journey': {
    title: 'Distributor journey',
    lede: 'The five stages of a distributor\u2019s day, with the part of this console that runs each one. Start here if you want the shape of the whole thing before the detail.',
    points: ['Five stages, start to close', 'Each stage links into its tool', 'Targets stated as targets'],
  },
  '/care/customer': {
    title: 'Customer',
    lede: 'The queue, the full profile, and the next best action for whoever is waiting. The recommendation reads four profile parameters and returns both what to offer and how to say it.',
    points: ['Six conversations open', 'Profile read across four parameters', 'Script shaped to temperament and language'],
  },
  '/care/campaigns': {
    title: 'Campaign studio',
    lede: 'Pin-code clusters instead of cities. Pick a micro-market, set an objective and a budget, and the studio builds a brief off that cluster\u2019s own dominant need.',
    points: ['Six mapped micro-markets', 'Channel split with a reason per channel', 'Revenue projection and payback'],
  },
  '/care/performance': {
    title: 'Performance',
    lede: 'What the two features are meant to move, held in one place so the assumptions behind the pitch are easy to find and easy to argue with.',
    points: ['Training cost and ramp time', 'Offer accuracy against today', 'Cluster ranking by opportunity'],
  },
};

export default function CareHub() {
  const { state } = useDb();
  const user = useSession();
  const loading = state.status !== 'ready';

  // Resolved after mount, not during render. This page is prerendered at build
  // time, so a date computed in render would be frozen at whenever the build
  // ran and would not match what the browser computes.
  const [today, setToday] = useState('');
  useEffect(() => {
    setToday(
      new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
    );
  }, []);

  const openValue = state.customers.reduce((s, c) => s + c.arpu, 0);

  return (
    <div className="hub">
      <div className="hub-inner">
        <header className="hub-head">
          <span className="eyebrow">
            {user.team}
            {today ? ` · ${today}` : ''}
          </span>
          <h1>
            Good to see you, {user.name.split(' ')[0]}.
          </h1>
          <p>
            Three places to work from. Everything below reads the same working set, so a change in
            one shows up in the others.
            {user.role === 'supervisor'
              ? ' Your account can edit that working set from inside any feature.'
              : ' Your account is read only; a supervisor can edit the underlying records.'}
          </p>
        </header>

        <div className="hub-stats">
          <div className="hub-stat">
            <span>Conversations open</span>
            <b>{loading ? <Skel w={54} h={22} /> : <Count to={state.customers.length} />}</b>
          </div>
          <div className="hub-stat">
            <span>Monthly value in the queue</span>
            <b>{loading ? <Skel w={78} h={22} /> : <Count to={openValue} prefix="₹" />}</b>
          </div>
          <div className="hub-stat">
            <span>Micro-markets mapped</span>
            <b>{loading ? <Skel w={40} h={22} /> : <Count to={state.localities.length} />}</b>
          </div>
          <div className="hub-stat">
            <span>Hot leads waiting</span>
            <b data-hot={state.intents.length > 0}>
              {loading ? <Skel w={40} h={22} /> : <Count to={state.intents.length} />}
            </b>
          </div>
        </div>

        <div className="hub-grid stagger">
          {FEATURES.map((f) => {
            const d = DETAIL[f.href];
            return (
              <Link href={f.href} key={f.href} className="hub-card">
                <span className="hub-icon">{f.icon}</span>
                <h2>{d.title}</h2>
                <p>{d.lede}</p>
                <ul>
                  {d.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                <span className="hub-cta">Open</span>
              </Link>
            );
          })}
        </div>

        <footer className="hub-foot">
          <span className="eyebrow">Recent activity</span>
          {loading ? (
            <div className="skel-lines" style={{ marginTop: 12 }}>
              <Skel w="72%" h={10} />
              <Skel w="54%" h={10} />
            </div>
          ) : (
            <ul className="feed">
              {state.activity.slice(0, 5).map((a) => (
                <li key={a.id} data-surface={a.surface}>
                  <time>{a.at}</time>
                  <i>{a.surface}</i>
                  <span>{a.text}</span>
                </li>
              ))}
            </ul>
          )}
        </footer>
      </div>
    </div>
  );
}
