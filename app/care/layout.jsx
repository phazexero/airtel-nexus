import { cookies } from 'next/headers';
import { verify, CARE_COOKIE } from '@/lib/auth';
import { DbProvider } from '@/lib/db';
import CareChrome from '@/components/agent/CareChrome';

export const metadata = {
  title: 'Nexus Care — operator console',
  description: 'Queue, customer 360, next best action and the geocentric campaign studio.',
};

export default async function CareLayout({ children }) {
  const session = await verify(cookies().get(CARE_COOKIE)?.value);

  // The login page renders inside this layout too, before a session exists.
  if (!session) return <>{children}</>;

  return (
    <DbProvider>
      <CareChrome user={session}>{children}</CareChrome>
    </DbProvider>
  );
}
