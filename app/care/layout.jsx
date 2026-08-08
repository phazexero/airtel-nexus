import CareChrome from '@/components/agent/CareChrome';

export const metadata = {
  title: 'AltCare — operator console',
  description: 'Queue, customer 360, next best action and the geocentric campaign studio.',
};

export default function CareLayout({ children }) {
  // Data comes from the provider in the root layout.
  return <CareChrome>{children}</CareChrome>;
}
