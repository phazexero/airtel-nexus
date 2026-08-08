import { PRODUCTS as SEED_PRODUCTS, localityById } from './data';

// ===========================================================================
//  DECISION LAYER
//
//  Right now every function below runs a transparent rules engine so the demo
//  works offline and gives the same answer twice. Each one is written with the
//  same shape a model call would have: build inputs -> get a decision object
//  -> render it. To swap in a real model later, fill in callModel() in
//  app/api/ai/route.js and flip USE_REMOTE_MODEL to true. Nothing in the UI
//  needs to change, because the UI only ever reads the decision object.
// ===========================================================================

export const USE_REMOTE_MODEL = false;

// --- Scoring ---------------------------------------------------------------

const EXPERIENCE_WEIGHT = { good: 18, neutral: 6, mixed: -4, poor: -16 };
const TEMPERAMENT_WEIGHT = {
  warm: 14,
  analytical: 8,
  skeptical: -2,
  anxious: -6,
  impatient: -8,
  frustrated: -18,
};
const COMMUNICATION_WEIGHT = { high: 12, medium: 4, low: -6 };

export function propensity(customer) {
  const p = customer.profile;
  let score = 46;
  score += EXPERIENCE_WEIGHT[p.pastExperience] ?? 0;
  score += TEMPERAMENT_WEIGHT[p.temperament] ?? 0;
  score += COMMUNICATION_WEIGHT[p.communication] ?? 0;
  if (customer.tenure > 60) score += 8;
  if (customer.arpu > 500) score += 9;
  if (customer.signals.length > 2) score += 5;
  return Math.max(6, Math.min(96, Math.round(score)));
}

// --- Tone shaping ----------------------------------------------------------
// The four profile parameters decide how the same offer gets said, not what
// gets offered. That split is the whole point: the offer comes from the data,
// the wording comes from the person.

const OPENERS = {
  frustrated: (c) =>
    `Start by naming the old problem before anything else: "${c.name.split(' ')[0]}, I can see the March outage took six days and four calls. That should not have happened, and I am not going to make you repeat it."`,
  impatient: () =>
    'One line, then the fix: "Payment is traced, refund reaches you in 48 hours. Anything else on this call takes 30 seconds."',
  anxious: () =>
    `Reassure before explaining: "Your number is safe, nothing is lost. Let me tell you exactly what happened and what I am doing about it."`,
  analytical: (c) =>
    `Lead with the arithmetic, not the adjective: "You have spent ₹605 above your pack this quarter. Let me show you what that money buys on a different structure."`,
  skeptical: () =>
    `No selling language. State the fact and let it stand: "Six add-on packs in 28 days. Here is the number, you can check it in the app while we talk."`,
  warm: (c) =>
    `Acknowledge the relationship first: "You have been with us seven years and never once escalated. Let me fix the billing dates properly rather than patch it."`,
};

const CLOSERS = {
  frustrated: 'Offer the exit, not the upsell: "If you still want to close it after this, I will do it on this call, no retention script."',
  impatient: 'Close in one action: "Say yes and it is done before you hang up. No form, no callback."',
  anxious: 'Close with certainty: "I am setting auto-pay so this cannot happen again. You will get an SMS in two minutes confirming it."',
  analytical: 'Close on the number: "₹300 a month against ₹483 today. Shall I apply it to this cycle or the next one?"',
  skeptical: 'Close with a reversible step: "Take it for a month. If it does not work out, cancel from the app, no call needed."',
  warm: 'Close on convenience: "One bill, one date, same total. Want me to set it to the 5th?"',
};

const LANGUAGE_NOTE = {
  Bengali: 'Conduct the call in Bengali. Keep product names in English, everything else in Bengali. Do not read the English script aloud.',
  Hindi: 'Hindi throughout. Product names stay in English. Confirm each step back to him because the line is noisy.',
  English: 'English, informal register. Skip the formal greeting block, it reads as a script to this profile.',
};

// --- Next Best Action ------------------------------------------------------

function pickAction(customer, loc, PRODUCTS) {

  if (customer.id === 'C-40117') {
    return {
      product: PRODUCTS.fd,
      headline: 'Rescue first, then move the idle balance',
      stage: 'Save then grow',
      why: [
        '₹2.4 lakh has sat in savings for 118 days with no outward transfer',
        'The close request is about the March DTH outage, not about the bank account',
        `${loc.name} shows the same pattern across 68% of account holders`,
      ],
      risk: 'Do not pitch anything until the outage is acknowledged and a credit is confirmed. Pitching first will lose both the account and the DTH line.',
    };
  }
  if (customer.id === 'C-88214') {
    return {
      product: PRODUCTS.black,
      headline: 'Convert the top-up leak into a bundle',
      stage: 'Ready for Black bundle',
      why: [
        '₹605 spent above pack value in 60 days across 5 top-ups',
        'Opened the Black page twice this week and dropped at the price screen',
        'Building is fiber-lit, so install lands inside 48 hours',
      ],
      risk: 'They left at the price screen, so the price is the objection. Open with the ₹605 already spent, not with ₹1,099.',
    };
  }
  if (customer.id === 'C-73902') {
    return {
      product: PRODUCTS.black,
      headline: 'Consolidate three bills at no extra cost',
      stage: 'Bundle migration',
      why: [
        'Already paying ₹1,247 a month across three bills',
        'Black 1099 is ₹148 cheaper than what she pays today',
        'All three services sit on one address, so migration is a same-day change',
      ],
      risk: 'This one sells itself. The only failure mode is over-explaining. State the saving and ask for the billing date.',
    };
  }
  if (customer.id === 'C-21756') {
    return {
      product: PRODUCTS.merchant,
      headline: 'Fix the refund, then open a collect account',
      stage: 'Merchant acquisition',
      why: [
        '~₹40,000 daily cash collection at a hardware counter',
        'No merchant account on record with anyone',
        `${loc.name} has 2,100 shops in 2 km, 79% still on cash`,
      ],
      risk: 'He is on the shop floor. Resolve the refund in the first 20 seconds or nothing after it gets heard.',
    };
  }
  if (customer.id === 'C-95560') {
    return {
      product: PRODUCTS.fiber,
      headline: 'Split one fiber line across the flat',
      stage: 'Shared-household fiber',
      why: [
        '6 add-on packs in 28 days, ₹438 above plan value',
        'Three of the five people in the flat are already on our network',
        'Streams 4 to 6 hours a night on a mobile connection',
      ],
      risk: 'Nine-month residency, so a 12-month lock will kill it. Lead with the monthly split per person, ₹140 each.',
    };
  }
  return {
    product: PRODUCTS.annualPack,
    headline: 'End the monthly recharge cliff',
    stage: 'Churn prevention',
    why: [
      'Validity lapsed 4 times in 18 months, always in the last week',
      'Recharges land right after salary credit on the 3rd to 6th',
      'Port-out enquiry raised in April and never completed',
    ],
    risk: 'A port-out enquiry is open. Treat this as retention, not upsell. Offer the annual pack only after the number is confirmed safe.',
  };
}

export function nextBestAction(customer, locality, products) {
  const PRODUCTS = products && Object.keys(products).length ? products : SEED_PRODUCTS;
  const loc = locality ?? localityById(customer.locality);
  // === AI INTEGRATION POINT ===============================================
  // const decision = await fetch('/api/ai', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ task: 'next-best-action', customer }),
  // }).then((r) => r.json());
  // return decision;
  // ========================================================================
  const base = pickAction(customer, loc, PRODUCTS);
  const p = customer.profile;
  const score = propensity(customer);

  return {
    ...base,
    confidence: score,
    tone: {
      opener: OPENERS[p.temperament](customer),
      closer: CLOSERS[p.temperament],
      language: LANGUAGE_NOTE[p.language],
      pace:
        p.communication === 'low'
          ? 'Slow down. One instruction per turn, and confirm it back before the next one.'
          : p.communication === 'medium'
            ? 'Medium pace. Repeat the resolution once at the end.'
            : 'Normal pace. This profile keeps up and dislikes repetition.',
    },
    inputs: [
      { label: 'Past experience', value: p.pastExperience, note: p.pastExperienceNote },
      { label: 'Temperament', value: p.temperament, note: p.temperamentNote },
      { label: 'Communication', value: p.communication, note: p.communicationNote },
      { label: 'Language response', value: p.language, note: p.languageNote },
    ],
  };
}

// --- Campaign studio -------------------------------------------------------

const ANGLES = {
  fd: {
    angle: 'Money that is sitting still',
    headline: 'Your savings account is paying you 3%. This is paying 8.5%.',
    sub: 'Open a fixed deposit from the Airtel app in four minutes. Insured up to ₹5 lakh.',
    proof: 'Booked with a partner small finance bank. Same insurance cover as your bank deposit.',
    channels: [
      { name: 'Doorstep leaflet', split: 40, why: 'Branch-walk-in rate here is 3.1x city average, so paper still converts' },
      { name: 'Assisted app onboarding at 3 society gates', split: 35, why: 'This segment finishes the flow when someone is standing next to them' },
      { name: 'Outbound call, Bengali, 10:00 to 12:00', split: 25, why: 'Matches the stated best-contact window for the age profile' },
    ],
    creative: 'Print in Bengali and English on the same leaflet. Lead with the two numbers side by side and nothing else. No lifestyle photography, this audience reads the rate.',
  },
  black: {
    angle: 'One bill instead of four',
    headline: 'You are already paying for all of it. Just not on one bill.',
    sub: 'Fiber, DTH and two postpaid lines. One date, one amount, one number to call.',
    proof: 'Households here pay us on 3.2 bills a month on average. Black is usually cheaper than the total.',
    channels: [
      { name: 'In-app card on bill-payment screen', split: 45, why: 'Catches them at the exact moment the split-bill annoyance is live' },
      { name: 'Lift and lobby panels in fiber-lit buildings', split: 30, why: '88% of buildings here are already lit, so the offer is immediately deliverable' },
      { name: 'WhatsApp with a personal bill comparison', split: 25, why: 'The saving is specific per household, which needs a one-to-one channel' },
    ],
    creative: 'Show their actual current total against the bundle price. Do not use a generic price. The comparison is the creative.',
  },
  annualPack: {
    angle: 'Stop the last-week-of-the-month cliff',
    headline: 'Recharge once. Then forget about it for a year.',
    sub: '₹3,599 for 365 days. Works out to ₹300 a month, and your number never goes quiet.',
    proof: '31% of users in this area lose validity for more than two days every quarter.',
    channels: [
      { name: 'Retailer counter kit at 60 recharge points', split: 45, why: 'This cluster still recharges over the counter, not in the app' },
      { name: 'Salary-week SMS on the 3rd to 6th', split: 35, why: 'Recharge behaviour here is locked to the salary credit date' },
      { name: 'Vernacular audio ad on local FM', split: 20, why: 'Bengali audio outperforms text for this literacy and age mix' },
    ],
    creative: 'Bengali first. Frame the price as ₹300 a month, never as ₹3,599. The lump sum is the objection, so the creative should never lead with it.',
  },
  merchant: {
    angle: 'The counter that never closes the till',
    headline: 'Free QR. Money in your account the same day.',
    sub: 'No setup cost, no monthly fee. Daily collection summary on SMS at closing time.',
    proof: '79% of the 2,100 shops within 2 km of here still collect only in cash.',
    channels: [
      { name: 'Feet-on-street shop visits, 11:00 to 15:00', split: 50, why: 'Matches the observed business-hours load pattern for this cluster' },
      { name: 'Market association tie-up', split: 30, why: 'Trader clusters adopt in groups, so the association is the unlock' },
      { name: 'Hindi outbound call before 11:00', split: 20, why: 'Before the counter gets busy, which is the only window they can talk' },
    ],
    creative: 'Hindi and Bengali. Print the settlement timing on the QR standee itself, because same-day settlement is the actual differentiator against the incumbents.',
  },
  fiber: {
    angle: 'Split the line, split the bill',
    headline: '₹140 each. Five people, one connection, no data packs.',
    sub: '200 Mbps unlimited, free router, 22 OTT apps. Cancel from the app any month.',
    proof: 'Average user here buys 4.1 add-on packs a month. That is more than the fiber share.',
    channels: [
      { name: 'Hostel and shared-flat notice boards', split: 40, why: 'The buying unit is the flat, not the person, so reach the flat' },
      { name: 'Campus-adjacent digital, 21:00 to 01:00', split: 35, why: 'Peak streaming window is when the pain is felt' },
      { name: 'Referral credit for existing users in the same building', split: 25, why: 'Three of five in a typical flat are already on our network' },
    ],
    creative: 'Lead with the per-person monthly figure and the no-lock-in line together. A 12-month contract is a hard no for a 9-month residency, so say the cancellation terms in the headline area, not the footnote.',
  },
  savings: {
    angle: 'A bank account that opens in four minutes',
    headline: 'Zero balance. 7% interest. Opens from the app you already have.',
    sub: '₹5 lakh insurance included. No branch visit, no minimum.',
    proof: 'Video KYC completes in under six minutes on average in this circle.',
    channels: [
      { name: 'In-app banner after recharge', split: 50, why: 'Highest-intent moment, the payment method is already open' },
      { name: 'Retailer-assisted onboarding', split: 30, why: 'Assisted completion rates run well above self-serve for first accounts' },
      { name: 'Vernacular SMS', split: 20, why: 'Cheap reach for a low-consideration product' },
    ],
    creative: 'Say the interest rate and the insurance figure in the first line. Everything else is a footnote.',
  },
};

const OBJECTIVE_TILT = {
  acquisition: 'Weight spend toward reach channels and accept a lower conversion rate. Judge this on qualified leads, not on same-week revenue.',
  upsell: 'Weight spend toward in-app and outbound, where you already know who you are talking to. Judge on ARPU movement in the next two billing cycles.',
  retention: 'Weight spend toward assisted and one-to-one channels. Judge on port-out requests withdrawn and validity lapses avoided, not on new revenue.',
};

export function buildCampaign(locality, objective = 'upsell', budget = 250000, products) {
  // === AI INTEGRATION POINT ===============================================
  // Same shape as above. Send { task: 'campaign', locality, objective, budget }
  // to /api/ai and return the decision object unchanged.
  // ========================================================================
  const loc = typeof locality === 'string' ? localityById(locality) : locality;
  const catalogue = products && Object.keys(products).length ? products : SEED_PRODUCTS;
  const product = catalogue[loc.product] ?? catalogue.savings;
  const angle = ANGLES[loc.product] ?? ANGLES.savings;

  const reach = Math.round(loc.subscribers * 0.72);
  const baseRate = objective === 'retention' ? 0.031 : objective === 'upsell' ? 0.024 : 0.014;
  const fit = (loc.savingsIndex > 70 && loc.product === 'fd') || loc.churnRisk === 'high' ? 1.35 : 1;
  const conversions = Math.round(reach * baseRate * fit);
  const revenue = Math.round(
    conversions * (product.unit === '% p.a.' ? 640 : product.unit === '/year' ? product.price / 12 : product.price)
  );

  return {
    locality: loc,
    product,
    objective,
    budget,
    ...angle,
    need: loc.need,
    evidence: loc.evidence,
    objectiveNote: OBJECTIVE_TILT[objective],
    projection: {
      reach,
      conversions,
      revenue,
      cac: Math.round(budget / Math.max(conversions, 1)),
      payback: Math.max(1, Math.round(budget / Math.max(revenue, 1))),
    },
  };
}

export function formatINR(n) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${Math.round(n)}`;
}
