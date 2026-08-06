import { Suspense } from 'react';
import LoginForm from '@/components/ui/LoginForm';

export const metadata = { title: 'Sign in — Nexus Care' };

export default function CareLogin() {
  return (
    <Suspense fallback={<div className="auth auth-care" />}>
      <LoginForm app="care" />
    </Suspense>
  );
}
