import { NextResponse } from 'next/server';
import { CUSTOMERS, LOCALITIES, PRODUCTS } from '@/lib/data';

// Seed endpoint. The delay is deliberate: it makes the loading states in the
// UI real rather than decorative, and it is the first thing to remove when a
// database goes in behind this route.

export const dynamic = 'force-dynamic';

export async function GET() {
  await new Promise((r) => setTimeout(r, 700));
  return NextResponse.json({
    customers: CUSTOMERS,
    localities: LOCALITIES,
    products: PRODUCTS,
    offers: [],
    intents: [],
    requests: [],
    services: { fiber: true, unlimitedFiber: false },
    safeguard: { active: true, daysLeft: 4, reason: 'Autopay failed' },
    vacation: null,
    nba: { status: 'waiting' },
    kyc: 'not started',
    liveCampaigns: [],
    activity: [
      { id: 'a0', at: '09:02', surface: 'system', text: 'Overnight scoring run finished. 41,208 profiles refreshed.' },
    ],
    seq: 1,
  });
}
