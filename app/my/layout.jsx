import { cookies } from 'next/headers';
import { verify, MY_COOKIE } from '@/lib/auth';
import { DbProvider } from '@/lib/db';

export const metadata = {
  title: 'Airtel One — your account',
  description: 'Recharge, plans, Payments Bank and offers picked for you.',
};

export default async function MyLayout({ children }) {
  const session = await verify(cookies().get(MY_COOKIE)?.value);
  if (!session) return <>{children}</>;
  return <DbProvider>{children}</DbProvider>;
}
