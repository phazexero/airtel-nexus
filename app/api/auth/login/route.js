import { NextResponse } from 'next/server';
import { findUser, findNumber, sign, cookieOptions, CARE_COOKIE, MY_COOKIE } from '@/lib/auth';

// Demo login. See the warning at the top of lib/auth.js before treating any of
// this as production authentication.

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  // --- care console: email and password ------------------------------------
  if (body.app === 'care') {
    await new Promise((r) => setTimeout(r, 550)); // matches a real round trip
    const user = findUser(body.email, body.password);
    if (!user) {
      return NextResponse.json({ error: 'That email and password do not match an operator account.' }, { status: 401 });
    }
    const res = NextResponse.json({ user });
    res.cookies.set(CARE_COOKIE, await sign(user), cookieOptions);
    return res;
  }

  // --- customer app: number then OTP ---------------------------------------
  if (body.app === 'my') {
    const match = findNumber(body.number);
    if (!match) {
      return NextResponse.json({ error: 'That number is not on the network in this demo.' }, { status: 401 });
    }

    if (body.step === 'request') {
      await new Promise((r) => setTimeout(r, 700));
      // A real build sends this over SMS and never returns it. Here it comes
      // back in the response so the demo can be driven by one person.
      const otp = '481902';
      return NextResponse.json({ sent: true, demoOtp: otp, masked: `••••• ${match.number.slice(-4)}` });
    }

    await new Promise((r) => setTimeout(r, 500));
    if (String(body.otp).trim() !== '481902') {
      return NextResponse.json({ error: 'That code is not right. Check it and try again.' }, { status: 401 });
    }
    const session = { id: match.customerId, name: match.name, number: match.number, role: 'customer' };
    const res = NextResponse.json({ user: session });
    res.cookies.set(MY_COOKIE, await sign(session), cookieOptions);
    return res;
  }

  return NextResponse.json({ error: "Send app: 'care' or app: 'my'." }, { status: 400 });
}
