'use client';

import ErrorPanel from '@/components/ui/ErrorPanel';

export default function Boundary({ error, reset }) {
  return <ErrorPanel error={error} reset={reset} scope="the customer app" home="/my" />;
}
