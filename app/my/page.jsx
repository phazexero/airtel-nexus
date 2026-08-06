import { cookies } from 'next/headers';
import { verify, MY_COOKIE } from '@/lib/auth';
import CustomerSurface from '@/components/customer/CustomerSurface';

export default async function MyPage() {
  const session = await verify(cookies().get(MY_COOKIE)?.value);
  return <CustomerSurface session={session} />;
}
