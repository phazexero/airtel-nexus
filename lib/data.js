// Bump this whenever anything in this file changes in a way a stale cache
// would contradict: renamed people, changed plans, new fields. The client
// stores its working set in localStorage, and without this stamp a browser
// that ran an earlier build keeps serving the old data forever with nothing on
// screen to explain why. That is exactly how a renamed persona survives a
// rename.
export const DATA_VERSION = '2026-08-08-sanyam-gupta';

// ---------------------------------------------------------------------------
// Demo dataset. Everything here is synthetic and shaped to look like what the
// real systems would hand over: CRM profile, usage telemetry, network
// inventory, and third-party area data.
// ---------------------------------------------------------------------------

export const PRODUCTS = {
  postpaid: {
    id: 'postpaid',
    name: 'Postpaid Infinity 549',
    line: 'Mobile',
    price: 549,
    unit: '/month',
    blurb: 'Unlimited calls, 75 GB data, data rollover, one free family SIM.',
    margin: 'high',
  },
  black: {
    id: 'black',
    name: 'Airtel Black 1099',
    line: 'Bundle',
    price: 1099,
    unit: '/month',
    blurb: 'Fiber + DTH + 2 postpaid lines on a single bill, one support line.',
    margin: 'very high',
  },
  fiber: {
    id: 'fiber',
    name: 'Xstream Fiber 200 Mbps',
    line: 'Home',
    price: 699,
    unit: '/month',
    blurb: '200 Mbps unlimited, free router, 22 OTT apps included.',
    margin: 'high',
  },
  dth: {
    id: 'dth',
    name: 'Xstream DTH HD',
    line: 'Home',
    price: 299,
    unit: '/month',
    blurb: '250+ channels, HD box on rent-free terms with annual pack.',
    margin: 'medium',
  },
  fd: {
    id: 'fd',
    name: 'Payments Bank Fixed Deposit',
    line: 'Money',
    price: 8.5,
    unit: '% p.a.',
    blurb: 'Booked through partner small finance bank. Insured up to ₹5 lakh.',
    margin: 'high',
  },
  savings: {
    id: 'savings',
    name: 'Payments Bank Savings',
    line: 'Money',
    price: 7,
    unit: '% p.a.',
    blurb: 'Zero balance, ₹5 lakh free insurance, instant account from the app.',
    margin: 'medium',
  },
  annualPack: {
    id: 'annualPack',
    name: 'Prepaid Annual 3599',
    line: 'Mobile',
    price: 3599,
    unit: '/year',
    blurb: '2 GB a day, unlimited calls, 365 days validity. Works out to ₹300/month.',
    margin: 'medium',
  },
  merchant: {
    id: 'merchant',
    name: 'Merchant Collect Account',
    line: 'Money',
    price: 0,
    unit: 'setup',
    blurb: 'Free QR, same-day settlement, daily collection summary on SMS.',
    margin: 'medium',
  },
};

// Each cluster is drawn as a circle centred on `lat`/`lng` and sized by
// `subscribers`. Circles rather than polygons on purpose: a hand-drawn polygon
// looks like an official ward boundary without being one, and that is a claim
// worth not making. A circle reads as "roughly here, roughly this big", which
// is exactly what this data supports.

// The population mix each cluster is dominated by. One label per area, because
// a map that hedges every zone into "mixed" tells a distributor nothing.
// What each cluster is dominated by. Shown as a label beside the area name.
// It no longer drives the map colouring: the map now answers "how good a
// prospect is this, for which product", and a demographic label is a different
// question that was quietly competing for the same visual channel.
export const POPULATION_TYPES = {
  it: { label: 'IT workforce' },
  students: { label: 'Students' },
  retirees: { label: 'Retirees' },
  traders: { label: 'Traders and SMB' },
  value: { label: 'Value households' },
  affluent: { label: 'Affluent families' },
};

// Where the account owner's handset is right now. Fixed rather than read from
// the browser: a demo that asks for location permission on stage is a demo
// that stalls on stage.
export const USER_LOCATION = {
  name: 'Sanyam Gupta',
  label: 'Live · IIFT Kolkata',
  place: 'IIFT Kolkata, Madurdaha',
  lat: 22.5138,
  lng: 88.403,
  locality: 'madurdaha',
  accuracyM: 35,
};

// --- Localities -------------------------------------------------------------
// Area-level facts the campaign studio reasons over. In production these come
// from census + internal tower/billing data + partner spend panels.

export const LOCALITIES = [
  {
    id: 'madurdaha',
    population: 'students',
    name: 'Madurdaha and Chowbaga',
    city: 'Kolkata',
    pin: '700107',
    lat: 22.5136,
    lng: 88.4035,
    subscribers: 29400,
    medianAge: 26,
    prepaidShare: 88,
    fiberPenetration: 24,
    arpu: 176,
    churnRisk: 'high',
    savingsIndex: 31,
    dataPerUser: 33.2,
    segment: 'Campus and hostel cluster around IIFT, nine-month residency',
    need: 'Highest data burn, lowest willingness to commit',
    product: 'fiber',
    evidence: [
      'Data use of 33.2 GB a month is the highest of any cluster in this belt',
      'Add-on pack purchases run 3.9 per user each month, which is expensive for them and messy for us',
      'Shared flats behind the campus mean one fiber line can serve 4 to 6 paying users',
    ],
  },
  {
    id: 'ruby-kasba',
    population: 'traders',
    name: 'Ruby and Kasba',
    city: 'Kolkata',
    pin: '700078',
    lat: 22.5152,
    lng: 88.39,
    subscribers: 46800,
    medianAge: 39,
    prepaidShare: 64,
    fiberPenetration: 21,
    arpu: 194,
    churnRisk: 'medium',
    savingsIndex: 57,
    dataPerUser: 13.6,
    segment: 'Retail and clinic belt off the Bypass, cash-heavy counters',
    need: 'Daily cash collection, no digital settlement',
    product: 'merchant',
    evidence: [
      '1,900 registered shops and clinics inside a 2 km radius, 74% still collecting in cash',
      'Peak voice and data load sits between 11:00 and 15:00, a business-hours pattern',
      'Competitor QR penetration is 36%, so the category is proven here but not locked',
    ],
  },
  {
    id: 'sector-v',
    population: 'it',
    name: 'Salt Lake Sector V',
    city: 'Kolkata',
    pin: '700091',
    lat: 22.5697,
    lng: 88.4324,
    subscribers: 58200,
    medianAge: 29,
    prepaidShare: 69,
    fiberPenetration: 26,
    arpu: 271,
    churnRisk: 'medium',
    savingsIndex: 44,
    dataPerUser: 28.4,
    segment: 'IT workforce, rented flats within a short commute of the park',
    need: 'Heavy data on prepaid, no home broadband',
    product: 'black',
    evidence: [
      'Data use runs 28.4 GB a month per user, 2.3x the circle average',
      '69% still on prepaid while paying for a separate broadband line elsewhere',
      'Fiber is already lit on 86% of buildings here, so install lead time is under 48 hours',
    ],
  },
  {
    id: 'ballygunge',
    population: 'affluent',
    name: 'Ballygunge',
    city: 'Kolkata',
    pin: '700019',
    lat: 22.5241,
    lng: 88.3654,
    subscribers: 38400,
    medianAge: 44,
    prepaidShare: 33,
    fiberPenetration: 58,
    arpu: 402,
    churnRisk: 'low',
    savingsIndex: 92,
    dataPerUser: 24.1,
    segment: 'Affluent families, owned property, 3+ connections',
    need: 'Multiple separate bills, no consolidation',
    product: 'black',
    evidence: [
      'Average household already pays us on 3.2 separate bills',
      'Highest ARPU cluster in this belt at ₹402',
      'Complaint volume is low but each ticket touches two product teams, which is where the friction sits',
    ],
  },
  {
    id: 'santoshpur',
    population: 'value',
    name: 'Santoshpur and Survey Park',
    city: 'Kolkata',
    pin: '700075',
    lat: 22.4934,
    lng: 88.389,
    subscribers: 51300,
    medianAge: 37,
    prepaidShare: 82,
    fiberPenetration: 15,
    arpu: 154,
    churnRisk: 'high',
    savingsIndex: 39,
    dataPerUser: 14.8,
    segment: 'Value-led households, single earner, older housing stock',
    need: 'Recharge fatigue, monthly cash crunch churn',
    product: 'annualPack',
    evidence: [
      '29% of users let validity lapse for more than 2 days each quarter',
      'Port-out requests spike in the last week of every month',
      'Annual pack uptake here is 7%, against 17% in comparable value clusters',
    ],
  },
  {
    id: 'jodhpur-park',
    population: 'retirees',
    name: 'Jodhpur Park and Dhakuria',
    city: 'Kolkata',
    pin: '700068',
    lat: 22.5051,
    lng: 88.3652,
    subscribers: 33700,
    medianAge: 57,
    prepaidShare: 41,
    fiberPenetration: 34,
    arpu: 226,
    churnRisk: 'low',
    savingsIndex: 88,
    dataPerUser: 10.9,
    segment: 'Retired professionals, self-occupied flats, long tenure',
    need: 'Idle savings, no growth product',
    product: 'fd',
    evidence: [
      '66% of account holders keep more than ₹1 lakh parked in a savings account for over 90 days',
      'Only 5% hold any deposit product with us, against 19% across Kolkata',
      'Branch-walk-in rate is 2.9x the city average, so this area still trusts assisted onboarding',
    ],
  },
];

// --- Care queue -------------------------------------------------------------
// Each customer carries the four profile parameters the pitch describes:
// past experience, temperament, communication effectiveness, language response.

export const CUSTOMERS = [
  {
    id: 'C-88214',
    name: 'Sanyam Gupta',
    initials: 'SG',
    phone: '98301 •• 4471',
    locality: 'madurdaha',
    tenure: 61,
    plan: 'Prepaid ₹299 / 28 days',
    planType: 'prepaid',
    arpu: 299,
    holds: ['Mobile'],
    reason: 'Data exhausted before cycle end, fifth time this quarter',
    channel: 'App chat',
    waiting: '00:42',
    priority: 'high',
    profile: {
      pastExperience: 'good',
      pastExperienceNote: 'Two tickets in 5 years, both closed same day. CSAT 4.6.',
      temperament: 'analytical',
      temperamentNote: 'Reads the fine print. Asks for per-GB maths before agreeing.',
      communication: 'high',
      communicationNote: 'Types full sentences, answers questions in order.',
      language: 'English',
      languageNote: 'Sets app to English. Never switches even when the agent does.',
      bestTime: 'After 19:30',
    },
    signals: [
      'Bought 5 data top-ups in the last 60 days, ₹605 above plan value',
      'Opened the Black bundle page twice in the last week and left at the price screen',
      'Building is fiber-ready, no home broadband on file',
    ],
  },
  {
    id: 'C-40117',
    name: 'Bimal Chatterjee',
    initials: 'BC',
    phone: '98311 •• 0092',
    locality: 'jodhpur-park',
    tenure: 143,
    plan: 'Postpaid ₹399',
    planType: 'postpaid',
    arpu: 399,
    holds: ['Mobile', 'DTH'],
    reason: 'Wants to close the Payments Bank account, calls it useless',
    channel: 'Voice',
    waiting: '01:57',
    priority: 'high',
    profile: {
      pastExperience: 'poor',
      pastExperienceNote: 'DTH outage in March took 6 days and 4 calls. CSAT 2.1.',
      temperament: 'frustrated',
      temperamentNote: 'Opens by restating the old complaint. Wants acknowledgement first.',
      communication: 'medium',
      communicationNote: 'Talks over prompts. Short, clipped answers.',
      language: 'Bengali',
      languageNote: 'Switches to Bengali when explaining the problem. Responds warmer in it.',
      bestTime: '10:00 to 12:00',
    },
    signals: [
      '₹2.4 lakh sitting in the savings balance for 118 days with no outward transfer',
      'Never opened the deposits tab in the app',
      'Retired in 2021, pension credit lands on the 1st of every month',
    ],
  },
  {
    id: 'C-73902',
    name: 'Sohini Das',
    initials: 'SD',
    phone: '90071 •• 3318',
    locality: 'ballygunge',
    tenure: 88,
    plan: 'Postpaid ₹749 + Fiber + DTH',
    planType: 'postpaid',
    arpu: 1247,
    holds: ['Mobile', 'Fiber', 'DTH'],
    reason: 'Three bills on three dates, wants one',
    channel: 'App chat',
    waiting: '00:18',
    priority: 'medium',
    profile: {
      pastExperience: 'good',
      pastExperienceNote: 'No escalations. Pays before due date every cycle.',
      temperament: 'warm',
      temperamentNote: 'Chatty opener, responds to being treated as a long-standing customer.',
      communication: 'high',
      communicationNote: 'Clear about what she wants. Decides fast when given one option.',
      language: 'English',
      languageNote: 'English throughout, informal register.',
      bestTime: 'Anytime',
    },
    signals: [
      'Already paying ₹1,247 across three bills, which is above the Black 1099 price',
      'Called twice this year about billing dates, never about service',
      'Both DTH and fiber are on the same address as the primary mobile',
    ],
  },
  {
    id: 'C-21756',
    name: 'Rakesh Prasad',
    initials: 'RP',
    phone: '89101 •• 7734',
    locality: 'ruby-kasba',
    tenure: 27,
    plan: 'Prepaid ₹239 / 28 days',
    planType: 'prepaid',
    arpu: 239,
    holds: ['Mobile'],
    reason: 'Recharge failed, money debited',
    channel: 'Voice',
    waiting: '03:12',
    priority: 'urgent',
    profile: {
      pastExperience: 'mixed',
      pastExperienceNote: 'One payment failure last year, refunded in 3 days. CSAT 3.4.',
      temperament: 'impatient',
      temperamentNote: 'Calling from the shop counter. Needs the answer in one line.',
      communication: 'low',
      communicationNote: 'Background noise, interrupts. Confirm each step back to him.',
      language: 'Hindi',
      languageNote: 'Hindi first, mixes in English product names.',
      bestTime: 'Before 11:00',
    },
    signals: [
      'Runs a hardware shop, ~₹40,000 daily cash collection by his own account',
      'Receives 30+ inbound calls a day on this number',
      'No merchant account with anyone on record',
    ],
  },
  {
    id: 'C-95560',
    name: 'Farhan Alam',
    initials: 'FA',
    phone: '70441 •• 2205',
    locality: 'madurdaha',
    tenure: 14,
    plan: 'Prepaid ₹199 / 28 days',
    planType: 'prepaid',
    arpu: 199,
    holds: ['Mobile'],
    reason: 'Asking whether a data pack rolls over',
    channel: 'App chat',
    waiting: '00:09',
    priority: 'low',
    profile: {
      pastExperience: 'neutral',
      pastExperienceNote: 'New customer, no history to speak of.',
      temperament: 'skeptical',
      temperamentNote: 'Assumes a catch. Wants proof, not adjectives.',
      communication: 'high',
      communicationNote: 'Short, precise questions. Will check whatever you claim.',
      language: 'English',
      languageNote: 'English, very informal. Reacts badly to scripted formality.',
      bestTime: 'After 21:00',
    },
    signals: [
      'Bought 6 add-on data packs in 28 days, ₹438 above plan value',
      'Address matches a 5-person shared flat, 3 of them are on our network',
      'Streams 4 to 6 hours a night on a mobile connection',
    ],
  },
  {
    id: 'C-11938',
    name: 'Mou Bhattacharya',
    initials: 'MB',
    phone: '98741 •• 6650',
    locality: 'santoshpur',
    tenure: 74,
    plan: 'Prepaid ₹179 / 28 days',
    planType: 'prepaid',
    arpu: 179,
    holds: ['Mobile'],
    reason: 'Number went inactive, wants to know why',
    channel: 'Voice',
    waiting: '02:05',
    priority: 'high',
    profile: {
      pastExperience: 'mixed',
      pastExperienceNote: 'Three validity lapses. Each one ends with an apology call from us.',
      temperament: 'anxious',
      temperamentNote: 'Worried about losing the number. Needs reassurance before anything else.',
      communication: 'medium',
      communicationNote: 'Answers in short bursts. Repeat the resolution back slowly.',
      language: 'Bengali',
      languageNote: 'Bengali only. Product names in English confuse the conversation.',
      bestTime: '14:00 to 17:00',
    },
    signals: [
      'Validity lapsed 4 times in 18 months, always in the last week of the month',
      'Recharges land on the 3rd to 6th of the month, right after salary credit',
      'Port-out enquiry raised in April, not completed',
    ],
  },
];

// --- Customer-app persona ---------------------------------------------------
// The phone is Sanyam Gupta's account (C-88214), so an agent action on the
// console lands on a real profile instead of a placeholder.

export const APP_USER_ID = 'C-88214';

export const APP_USER = {
  balance: 1.7,
  validityDays: 4,
  dataLeftGb: 0.4,
  dataTotalGb: 42,
  rewards: 3,
  billsDue: 0,
};

export const RECHARGE_PACKS = [
  { id: 'p299', price: 299, days: 28, data: '1.5 GB/day', tag: 'Current pack' },
  { id: 'p349', price: 349, days: 28, data: '2.5 GB/day', tag: 'Most bought' },
  { id: 'p3599', price: 3599, days: 365, data: '2 GB/day', tag: 'Best value' },
  { id: 'p49', price: 49, days: 1, data: '1 GB add-on', tag: 'Top-up' },
];

export function localityById(id) {
  return LOCALITIES.find((l) => l.id === id);
}

export function customerById(id) {
  return CUSTOMERS.find((c) => c.id === id);
}
