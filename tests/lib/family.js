// ===========================================================================
//  FAMILY BUNDLING
//
//  Two things live here: what the household actually looks like, and the
//  engine that turns that into a bundle recommendation.
//
//  The recommendation is rules-derived on purpose, same as lib/ai.js. Every
//  number on the screen is arithmetic the customer can check against their own
//  bills, which is the whole reason this converts. A generated figure that
//  cannot be reconciled with a real statement destroys the pitch instead of
//  making it. When a model goes in, it should write the wording and leave the
//  maths alone.
//
//  App usage is read on the device and only category totals are used. Nothing
//  here needs, or should have, a per-app record leaving the handset.
// ===========================================================================

// One account. Sanyam is the owner and the payer; the other lines sit under his
// account rather than being accounts of their own. That is what makes a single
// SafeGuard window, a single bill and a single bundle coherent.
export const ACCOUNT_OWNER = 'Sanyam Gupta';

export const HOUSEHOLD = {
  name: "Sanyam Gupta's account",
  area: 'Madurdaha, Chowbaga',
  pin: '700107',
  fiberReady: true,
  // Home broadband is already ours and already inside the bundle.
  broadband: { provider: 'Xstream Fiber', monthly: 699, speed: '200 Mbps' },
};

export const MEMBERS = [
  {
    id: 'C-88214',
    name: 'Sanyam Gupta',
    initials: 'SG',
    relation: 'Account owner · your line',
    plan: 'Prepaid ₹299 / 28 days',
    planType: 'prepaid',
    bundled: false,
    monthly: 299,
    topUpsMonthly: 202, // the ₹605 a quarter spent above the pack
    dataGb: 46,
    usage: [
      { app: 'Netflix', category: 'Video', gb: 12.4 },
      { app: 'YouTube', category: 'Video', gb: 9.1 },
      { app: 'Video calls for work', category: 'Work', gb: 6.2 },
      { app: 'Instagram', category: 'Social', gb: 5.8 },
      { app: 'WhatsApp', category: 'Messaging', gb: 2.3 },
      { app: 'Everything else', category: 'Browsing', gb: 10.2 },
    ],
  },
  {
    id: 'F-2',
    name: 'Pragya Ghosh',
    initials: 'PG',
    relation: 'Line on your account',
    plan: 'Postpaid ₹449',
    planType: 'postpaid',
    bundled: true,
    monthly: 449,
    topUpsMonthly: 0,
    dataGb: 41,
    usage: [
      { app: 'YouTube', category: 'Video', gb: 13.2 },
      { app: 'Netflix', category: 'Video', gb: 8.4 },
      { app: 'Spotify', category: 'Music', gb: 5.1 },
      { app: 'Instagram', category: 'Social', gb: 6.6 },
      { app: 'Everything else', category: 'Browsing', gb: 7.7 },
    ],
  },
  {
    id: 'F-3',
    name: 'Debshishu Ghosh',
    initials: 'DG',
    relation: 'Line on your account',
    plan: 'Postpaid ₹549',
    planType: 'postpaid',
    bundled: true,
    monthly: 549,
    topUpsMonthly: 0,
    dataGb: 33,
    usage: [
      { app: 'Online gaming', category: 'Gaming', gb: 11.8 },
      { app: 'YouTube', category: 'Video', gb: 9.3 },
      { app: 'Netflix', category: 'Video', gb: 5.2 },
      { app: 'WhatsApp', category: 'Messaging', gb: 2.1 },
      { app: 'Everything else', category: 'Browsing', gb: 4.6 },
    ],
  },
];

// The four services inside the bundle today, all billed to the account owner.
// SafeGuard protects exactly this list, which is why it is defined here rather
// than typed into the component.
export const BUNDLED_SERVICES = [
  { id: 'fiber', name: 'Xstream Fiber', detail: '200 Mbps home broadband' },
  { id: 'ott', name: 'OTT pack', detail: '8 apps on one subscription' },
  { id: 'line-1', name: 'Postpaid ₹449', detail: "Pragya's line" },
  { id: 'line-2', name: 'Postpaid ₹549', detail: "Debshishu's line" },
];

// Subscriptions the household pays for outside Airtel. `heldBy` is what makes
// the duplicate audit possible.
export const SUBSCRIPTIONS = [
  { id: 'netflix-a', name: 'Netflix Standard', heldBy: 'C-88214', monthly: 499, inBundle: true },
  { id: 'netflix-r', name: 'Netflix Mobile', heldBy: 'F-3', monthly: 199, inBundle: true },
  { id: 'prime', name: 'Prime Video', heldBy: 'F-2', monthly: 179, inBundle: true },
  { id: 'sonyliv', name: 'SonyLIV', heldBy: 'F-2', monthly: 299, inBundle: true },
  { id: 'spotify', name: 'Spotify Premium', heldBy: 'F-3', monthly: 119, inBundle: false },
];

export const BUNDLE = {
  name: 'Airtel Black Family',
  monthly: 2199,
  lines: 3,
  fiber: '300 Mbps unlimited',
  dataNote: 'Unlimited calls on all three lines, 120 GB shared data with rollover',
  ott: [
    'Netflix',
    'Prime Video',
    'Disney+ Hotstar',
    'SonyLIV',
    'ZEE5',
    'Apple TV+',
    'Lionsgate Play',
    'Hoichoi',
  ],
};

// --- derived ---------------------------------------------------------------

export function memberSpend(m) {
  return m.monthly + m.topUpsMonthly;
}

export function subsFor(memberId, subs = SUBSCRIPTIONS) {
  return subs.filter((s) => s.heldBy === memberId);
}

export function usageByCategory(members = MEMBERS) {
  const totals = new Map();
  for (const m of members) {
    for (const u of m.usage) totals.set(u.category, (totals.get(u.category) ?? 0) + u.gb);
  }
  const all = [...totals.values()].reduce((a, b) => a + b, 0) || 1;
  return [...totals.entries()]
    .map(([category, gb]) => ({ category, gb: Math.round(gb * 10) / 10, share: Math.round((gb / all) * 100) }))
    .sort((a, b) => b.gb - a.gb);
}

export function topApps(members = MEMBERS, n = 5) {
  const totals = new Map();
  for (const m of members) {
    for (const u of m.usage) {
      if (u.app === 'Everything else') continue;
      totals.set(u.app, (totals.get(u.app) ?? 0) + u.gb);
    }
  }
  return [...totals.entries()]
    .map(([app, gb]) => ({ app, gb: Math.round(gb * 10) / 10 }))
    .sort((a, b) => b.gb - a.gb)
    .slice(0, n);
}

// Two subscriptions to the same service in one household. The service name
// before the tier is what identifies the overlap.
export function duplicateSubs(subs = SUBSCRIPTIONS) {
  const byService = new Map();
  for (const s of subs) {
    const service = s.name.split(' ')[0];
    byService.set(service, [...(byService.get(service) ?? []), s]);
  }
  return [...byService.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([service, list]) => ({ service, subs: list, wasted: Math.min(...list.map((x) => x.monthly)) }));
}

export function householdSpend(members = MEMBERS, subs = SUBSCRIPTIONS, household = HOUSEHOLD) {
  const mobile = members.reduce((s, m) => s + memberSpend(m), 0);
  const ott = subs.reduce((s, x) => s + x.monthly, 0);
  const broadband = household.broadband?.monthly ?? 0;
  return { mobile, ott, broadband, total: mobile + ott + broadband };
}

// --- recommendation --------------------------------------------------------

export function recommendBundle({
  members = MEMBERS,
  subs = SUBSCRIPTIONS,
  household = HOUSEHOLD,
  bundle = BUNDLE,
} = {}) {
  // === AI INTEGRATION POINT ===============================================
  // POST { task: 'family-bundle', members, subs, household } to /api/ai and
  // return the same shape. Keep the arithmetic below on this side: the model
  // should choose the wording, not the savings figure.
  // ========================================================================

  const now = householdSpend(members, subs, household);
  const replaced = subs.filter((s) => s.inBundle);
  const kept = subs.filter((s) => !s.inBundle);
  const keptCost = kept.reduce((s, x) => s + x.monthly, 0);

  const after = bundle.monthly + keptCost;
  const saving = now.total - after;

  const cats = usageByCategory(members);
  const video = cats.find((c) => c.category === 'Video');
  const dupes = duplicateSubs(subs);
  const totalData = members.reduce((s, m) => s + m.dataGb, 0);

  const why = [];
  why.push(
    `${members.length} lines on ${new Set(members.map((m) => m.plan)).size} different plans, and ${members.filter((m) => !m.bundled).length} still outside the bundle`
  );
  if (video) {
    why.push(
      `${video.share}% of household data is video, and the apps driving it are in the bundle rather than billed separately`
    );
  }
  for (const d of dupes) {
    why.push(`Two ${d.service} subscriptions in one house, ₹${d.wasted} a month of it duplicated`);
  }
  const outside = members.filter((m) => !m.bundled);
  if (outside.length) {
    why.push(
      `${outside.map((m) => m.name.split(' ')[0]).join(' and ')} still billed separately, so ${outside.length === 1 ? 'that line misses' : 'those lines miss'} the bundle rate and the shared data`
    );
  }
  why.push(`${totalData} GB used across the household against ${bundle.dataNote.toLowerCase()}`);

  return {
    bundle,
    now,
    after,
    saving,
    savingYearly: saving * 12,
    replaced,
    kept,
    keptCost,
    why,
    cats,
    apps: topApps(members),
    dupes,
    // Stated rather than buried, because the honest exception is what makes the
    // rest of the comparison credible.
    caveat: kept.length
      ? `${kept.map((k) => k.name).join(' and ')} is not part of the bundle, so keep paying for that separately. The saving above already accounts for it.`
      : null,
  };
}
