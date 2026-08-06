import Link from 'next/link';
import ThemeToggle from '@/lib/theme';

export default function Landing() {
  return (
    <main className="landing">
      <div className="landing-inner">
        <div className="landing-top">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <span>
              Nexus
              <small>Airtel dual surface</small>
            </span>
          </div>
          <ThemeToggle scope="landing" />
        </div>

        <h1>Two apps, one system.</h1>
        <p className="landing-lede">
          The care console and the customer app run independently, with separate sign-ins and
          separate sessions. They share a data layer, so an offer sent from one arrives in the
          other. Open them in two tabs to watch it happen.
        </p>

        <div className="landing-grid">
          <Link href="/care" className="door door-care">
            <span className="eyebrow">For operators</span>
            <h2>Nexus Care</h2>
            <p>
              Queue, customer 360, next best action and the geocentric campaign studio. Supervisors
              can edit the underlying data and watch every recommendation move with it.
            </p>
            <span className="door-cta">Sign in with an operator account</span>
          </Link>

          <Link href="/my" className="door door-my">
            <span className="eyebrow">For customers</span>
            <h2>Airtel One</h2>
            <p>
              Recharge, plans, Payments Bank and the offers the console sends. Signs in with a
              mobile number and a one-time code, the way the real thing does.
            </p>
            <span className="door-cta">Sign in with a mobile number</span>
          </Link>
        </div>

        <div className="landing-creds">
          <span className="eyebrow">Demo credentials</span>
          <div className="cred-grid">
            <div>
              <b>Care · agent</b>
              <code>a.roy@airtel.demo</code>
              <code>care1234</code>
            </div>
            <div>
              <b>Care · supervisor</b>
              <code>s.iyer@airtel.demo</code>
              <code>super1234</code>
              <small>Editing is supervisor only</small>
            </div>
            <div>
              <b>Customer</b>
              <code>9830104471</code>
              <small>The code appears on screen</small>
            </div>
          </div>
          <p className="landing-warn">
            These credentials sit in the source. This is a demo login, not an authentication
            system. Read the notes at the top of <code>lib/auth.js</code> before putting anything
            real behind it.
          </p>
        </div>
      </div>
    </main>
  );
}
