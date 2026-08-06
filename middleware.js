import { NextResponse } from 'next/server';
import { verify, CARE_COOKIE, MY_COOKIE } from '@/lib/auth';

// Two apps, two sessions, no shared login. Signing into the care console does
// not sign you into the customer app and the other way round, which is what
// makes them independent rather than two tabs of one thing.

export async function middleware(request) {
  const { pathname, search } = request.nextUrl;

  const guards = [
    { base: '/care', cookie: CARE_COOKIE },
    { base: '/my', cookie: MY_COOKIE },
  ];

  for (const g of guards) {
    if (!pathname.startsWith(g.base)) continue;
    if (pathname.startsWith(`${g.base}/login`)) {
      // Already signed in? Skip the login screen.
      const session = await verify(request.cookies.get(g.cookie)?.value);
      if (session) return NextResponse.redirect(new URL(g.base, request.url));
      return NextResponse.next();
    }
    const session = await verify(request.cookies.get(g.cookie)?.value);
    if (!session) {
      const url = new URL(`${g.base}/login`, request.url);
      if (pathname !== g.base) url.searchParams.set('next', pathname + search);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/care/:path*', '/my/:path*'],
};
