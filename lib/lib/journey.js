// ===========================================================================
//  DISTRIBUTOR JOURNEY
//
//  The five stages a distributor moves through in a day, taken from the
//  journey artefact. Each stage carries a `feature` link, which is the part
//  that matters: the journey is not a poster in the product, it is a map of
//  where each stage actually happens. A distributor reading "prioritise the
//  right leads" can click straight into the queue that does it.
//
//  `proof` figures are targets, not measured results. They are stated as such
//  on screen so nobody mistakes them for observed data.
// ===========================================================================

export const JOURNEY = [
  {
    n: 1,
    title: 'Understand my market',
    sub: 'Area and customer insight in seconds',
    action:
      'Opens the console to see real-time demand, coverage, penetration and opportunity hotspots.',
    asks: 'Where are the biggest opportunities in my area today?',
    enabler: {
      name: 'AI market intelligence',
      detail: 'Cluster mapping, penetration heat and demand forecasts at pin-code level.',
    },
    helps: 'Focus on high-potential sectors and put effort where the impact is highest.',
    proof: ['2x more productive field visits', '30% higher conversion'],
    feature: { href: '/care/campaigns', label: 'Campaign studio' },
  },
  {
    n: 2,
    title: 'Prioritise the right leads',
    sub: 'Know who to approach right now',
    action:
      'Checks the prioritised lead list built from intent, usage behaviour and payment pattern.',
    asks: 'Who should I approach first for the best conversion?',
    enabler: {
      name: 'Lead scoring and next best action',
      detail: 'Scores and ranks the queue, then names the action to take on each one.',
    },
    helps: 'Saves time by putting warm, high-propensity leads first, each with its own script.',
    proof: ['40% higher conversion rate', '25% less time spent selecting leads'],
    feature: { href: '/care/customer', label: 'Customer queue' },
  },
  {
    n: 3,
    title: 'Engage and convert',
    sub: 'Close with confidence',
    action:
      'Uses the recommended script, personalised offers and trust-building features to convert in the conversation.',
    asks: 'How do I convince them quickly and build trust?',
    enabler: {
      name: 'Smart conversion tools',
      detail: 'Scripts shaped to temperament and language, offer cards, and trust features.',
    },
    helps: 'Handles objections, removes friction, and closes more on the spot.',
    proof: ['Higher attach rate', 'Faster conversions', 'Better customer experience'],
    feature: { href: '/care/customer', label: 'Next best action' },
  },
  {
    n: 4,
    title: 'Grow the business',
    sub: 'Unlock more from the same base',
    action: 'Gets cross-sell and bundle recommendations for more ARPU per customer.',
    asks: 'How do I sell more and increase my earnings?',
    enabler: {
      name: 'Cross-sell and bundle engine',
      detail: 'Personalised bundle suggestions and upsell openings drawn from what they already pay for.',
    },
    helps: 'Raises ARPU and revenue per customer without adding a single new connection.',
    proof: ['Higher ARPU', 'More bundles sold', 'Increased monthly revenue'],
    feature: { href: '/care/customer', label: 'Customer 360' },
  },
  {
    n: 5,
    title: 'Track and improve',
    sub: 'Monitor performance, improve daily',
    action: 'Tracks conversions, revenue, leads and team metrics as they move.',
    asks: 'How am I doing today, and what can I improve?',
    enabler: {
      name: 'Performance dashboard',
      detail: 'Live KPIs against goals, with the assumption behind each number stated.',
    },
    helps: 'Keeps targets in view and turns the gap into something actionable.',
    proof: ['Better goal achievement', 'Data-driven improvement'],
    feature: { href: '/care/performance', label: 'Performance' },
  },
];

export const JOURNEY_PROMISE = 'Empowering distributors. Delighting customers. Driving growth together.';

export const JOURNEY_OUTCOMES = [
  { title: 'Work smarter', detail: 'AI-powered insight instead of instinct' },
  { title: 'Save time', detail: 'Convert more, earn more per hour in the field' },
  { title: 'Serve better', detail: 'Build trust and retain the customers you win' },
  { title: 'Increase revenue', detail: 'Cross-sell and bundles on the existing base' },
  { title: 'Track performance', detail: 'Hit targets consistently, not occasionally' },
  { title: 'Grow long term', detail: 'Stronger recognition and higher loyalty' },
];
