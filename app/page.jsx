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
              AltCare
              <small>Altura dual surface</small>
            </span>
          </div>
          <ThemeToggle scope="landing" />
        </div>

        <h1>Two apps, one system.</h1>
        <p className="landing-lede">
          The distributor console and the customer app run independently and share a data layer,
          so an offer sent from one arrives in the other. Open them in two tabs to watch it happen.
        </p>

        <div className="landing-grid">
          <Link href="/care" className="door door-care">
            <span className="eyebrow">For distributors</span>
            <h2>AltCare</h2>
            <p>
              The five-stage distributor journey, the queue, customer 360, next best action and the
              geocentric campaign studio. Supervisors can edit the underlying data and watch every
              recommendation move with it.
            </p>
            <span className="door-cta">Open the console</span>
          </Link>

          <Link href="/my" className="door door-my">
            <span className="eyebrow">For customers</span>
            <h2>AltCare</h2>
            <p>
              Recharge, plans, Payments Bank and the offers the console sends, on the account that
              sits first in the distributor queue.
            </p>
            <span className="door-cta">Open the app</span>
          </Link>
        </div>

        <div className="landing-note">
          <span className="eyebrow">Working as</span>
          <p>
            Both apps open straight into the product. The distributor console carries an operator
            switcher in its header: work as the supervisor to edit the underlying data, or switch
            to the agent to see the same console read only.
          </p>
        </div>
      </div>
    </main>
  );
}
