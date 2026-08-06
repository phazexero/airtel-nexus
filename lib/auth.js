// ===========================================================================
//  DEMO AUTHENTICATION — NOT PRODUCTION AUTH
//
//  This is a believable login flow for a demo, not a security system. The
//  credentials below sit in the repository in plain text and anyone with the
//  source can read them. That is a deliberate trade for a pitch build.
//
//  To make this real you would replace DEMO_USERS with a user table, store
//  password hashes (argon2 or bcrypt, never SHA-256 alone), move SESSION_SECRET
//  into a required environment variable with no fallback, add rate limiting on
//  the login route, and issue the customer OTP over SMS instead of returning it
//  in the response. The session cookie mechanics below are already shaped
//  correctly: httpOnly, sameSite lax, signed, and expiring.
// ===========================================================================

const SESSION_SECRET = process.env.SESSION_SECRET || 'nexus-demo-secret-not-for-production';
const MAX_AGE = 60 * 60 * 8; // eight hours, one shift

export const CARE_COOKIE = 'nexus_care';
export const MY_COOKIE = 'nexus_my';

// --- Care console operators -------------------------------------------------

export const DEMO_USERS = [
  {
    id: 'AG-2041',
    email: 'a.roy@airtel.demo',
    password: 'care1234',
    name: 'Arindam Roy',
    initials: 'AR',
    role: 'agent',
    team: 'Kolkata circle · Retention pod 3',
  },
  {
    id: 'SV-0117',
    email: 's.iyer@airtel.demo',
    password: 'super1234',
    name: 'Shalini Iyer',
    initials: 'SI',
    role: 'supervisor',
    team: 'Kolkata circle · Care operations',
  },
];

// Numbers the customer app will accept. Any other number is rejected the way a
// real system would reject a number that is not on the network.
export const DEMO_NUMBERS = [
  { number: '9830104471', customerId: 'C-88214', name: 'Ananya Sen' },
];

export function findUser(email, password) {
  const u = DEMO_USERS.find(
    (x) => x.email.toLowerCase() === String(email).trim().toLowerCase() && x.password === password
  );
  if (!u) return null;
  const { password: _drop, ...safe } = u;
  return safe;
}

export function findNumber(number) {
  const clean = String(number).replace(/\D/g, '').slice(-10);
  return DEMO_NUMBERS.find((n) => n.number === clean) ?? null;
}

// --- Cookie signing ---------------------------------------------------------
// Web Crypto so the same code runs in edge middleware and in node route
// handlers without a second implementation.

function b64url(bytes) {
  let s = '';
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i += 1) s += String.fromCharCode(arr[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(str) {
  const pad = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(pad + '='.repeat((4 - (pad.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

async function key() {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function sign(payload) {
  const body = b64url(new TextEncoder().encode(JSON.stringify({ ...payload, exp: Date.now() + MAX_AGE * 1000 })));
  const mac = b64url(await crypto.subtle.sign('HMAC', await key(), new TextEncoder().encode(body)));
  return `${body}.${mac}`;
}

export async function verify(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, mac] = token.split('.');
  try {
    const ok = await crypto.subtle.verify(
      'HMAC',
      await key(),
      fromB64url(mac),
      new TextEncoder().encode(body)
    );
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(body)));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  maxAge: MAX_AGE,
  secure: process.env.NODE_ENV === 'production',
};
