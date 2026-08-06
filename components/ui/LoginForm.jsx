'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/lib/theme';

// One component, two flows. The care console signs in with email and password.
// The customer app signs in with a number and a one-time code, which is what a
// telco customer actually expects and takes about four seconds to demo.

export default function LoginForm({ app }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [number, setNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [stage, setStage] = useState('number');
  const [hint, setHint] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function post(payload) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app, ...payload }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Something went wrong. Try again.');
    return data;
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (app === 'care') {
        await post({ email, password });
        router.replace(next ?? '/care');
        router.refresh();
        return;
      }
      if (stage === 'number') {
        const data = await post({ step: 'request', number });
        setHint(data);
        setStage('otp');
      } else {
        await post({ step: 'verify', number, otp });
        router.replace(next ?? '/my');
        router.refresh();
        return;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const care = app === 'care';

  return (
    <div className={`auth ${care ? 'auth-care' : 'auth-my'}`}>
      <div className="auth-card">
        <div className="auth-top">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <span>
              {care ? 'Nexus Care' : 'Airtel One'}
              <small>{care ? 'Operator console' : 'Your account'}</small>
            </span>
          </div>
          <ThemeToggle scope={app} />
        </div>

        <h1>{care ? 'Sign in to the console' : stage === 'number' ? 'Enter your number' : 'Enter the code'}</h1>
        <p className="auth-lede">
          {care
            ? 'Use your operator account. Supervisors get edit access to customer and area data.'
            : stage === 'number'
              ? 'We will send a one-time code to your Airtel number.'
              : `Sent to ${hint?.masked ?? 'your number'}. It expires in ten minutes.`}
        </p>

        <form onSubmit={submit} className="auth-form">
          {care ? (
            <>
              <label className="field">
                <span>Work email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@airtel.demo"
                  autoComplete="username"
                  required
                />
              </label>
              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>
            </>
          ) : stage === 'number' ? (
            <label className="field">
              <span>Mobile number</span>
              <div className="input-prefix">
                <em>+91</em>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="98301 04471"
                  maxLength={14}
                  required
                />
              </div>
            </label>
          ) : (
            <>
              <label className="field">
                <span>Six digit code</span>
                <input
                  className="otp-input mono"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  maxLength={6}
                  required
                />
              </label>
              {hint?.demoOtp && (
                <div className="otp-hint">
                  <b>Demo</b> no SMS is sent, the code is <code>{hint.demoOtp}</code>
                </div>
              )}
              <button type="button" className="btn ghost" onClick={() => { setStage('number'); setOtp(''); setError(null); }}>
                Use a different number
              </button>
            </>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button className="btn primary block" disabled={busy}>
            {busy ? 'Checking…' : care ? 'Sign in' : stage === 'number' ? 'Send the code' : 'Verify and continue'}
          </button>
        </form>

        <div className="auth-demo">
          <span className="eyebrow">Demo accounts</span>
          {care ? (
            <ul>
              <li><code>a.roy@airtel.demo</code> / <code>care1234</code> · agent, read only</li>
              <li><code>s.iyer@airtel.demo</code> / <code>super1234</code> · supervisor, can edit</li>
            </ul>
          ) : (
            <ul>
              <li><code>9830104471</code> · Ananya Sen, first in the care queue</li>
            </ul>
          )}
        </div>

        <Link href="/" className="auth-back">Back to both apps</Link>
      </div>
    </div>
  );
}
