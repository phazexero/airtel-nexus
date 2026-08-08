import { DbProvider } from '@/lib/db';

export const metadata = {
  title: 'Airtel One — your account',
  description: 'Recharge, plans, Payments Bank and offers picked for you.',
};

export default function MyLayout({ children }) {
  return <DbProvider>{children}</DbProvider>;
}
