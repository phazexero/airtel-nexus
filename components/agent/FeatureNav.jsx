'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDb } from '@/lib/db';

// The three features live here once you are inside one of them. The hub at
// /care is the way in; this rail is the way across, so nobody has to go back
// out to the hub to switch tasks.

export const FEATURES = [
  {
    href: '/care/customer',
    label: 'Customer',
    blurb: 'Queue, profile and next best action',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <circle cx="12" cy="8" r="3.4" />
        <path d="M4.6 20c.7-3.7 3.7-5.8 7.4-5.8s6.7 2.1 7.4 5.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/care/campaigns',
    label: 'Campaigns',
    blurb: 'Geocentric campaign studio',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Z" strokeLinejoin="round" />
        <circle cx="12" cy="10" r="2.6" />
      </svg>
    ),
  },
  {
    href: '/care/performance',
    label: 'Performance',
    blurb: 'What the two features move',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function FeatureNav() {
  const path = usePathname();
  const { state } = useDb();

  const counts = {
    '/care/customer': state.status === 'ready' ? state.customers.length : null,
    '/care/campaigns': state.status === 'ready' ? state.localities.length : null,
    '/care/performance': state.liveCampaigns.length || null,
  };

  return (
    <nav className="feature-nav" aria-label="Console features">
      <Link href="/care" className="nav-home">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v6H4zM14 15h6v6h-6z" strokeLinejoin="round" />
        </svg>
        <span>All features</span>
      </Link>

      <ul>
        {FEATURES.map((f) => {
          const on = path.startsWith(f.href);
          return (
            <li key={f.href}>
              <Link href={f.href} className="nav-item" data-on={on} aria-current={on ? 'page' : undefined}>
                <span className="nav-icon">{f.icon}</span>
                <span className="nav-label">
                  <b>{f.label}</b>
                  <small>{f.blurb}</small>
                </span>
                {counts[f.href] != null && <span className="nav-count mono">{counts[f.href]}</span>}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="nav-foot">
        {state.intents.length > 0 && (
          <Link href="/care/customer" className="nav-alert">
            <b>{state.intents.length} hot lead{state.intents.length > 1 ? 's' : ''}</b>
            <span>Waiting on the queue</span>
          </Link>
        )}
        <Link href="/" className="nav-exit">Both apps</Link>
      </div>
    </nav>
  );
}
