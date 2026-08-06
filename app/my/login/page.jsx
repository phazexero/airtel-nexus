import { Suspense } from 'react';
import LoginForm from '@/components/ui/LoginForm';

export const metadata = { title: 'Sign in — Airtel One' };

export default function MyLogin() {
  return (
    <Suspense fallback={<div className="auth auth-my" />}>
      <LoginForm app="my" />
    </Suspense>
  );
}
