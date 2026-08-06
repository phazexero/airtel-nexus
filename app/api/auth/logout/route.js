import { NextResponse } from 'next/server';
import { CARE_COOKIE, MY_COOKIE } from '@/lib/auth';

export async function POST(request) {
  const { app } = await request.json().catch(() => ({}));
  const res = NextResponse.json({ ok: true });
  res.cookies.set(app === 'my' ? MY_COOKIE : CARE_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
