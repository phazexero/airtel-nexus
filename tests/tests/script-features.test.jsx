import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DbProvider } from '@/lib/db';
import CustomerSurface from '@/components/customer/CustomerSurface';
import CareChrome from '@/components/agent/CareChrome';
import CustomerView from '@/components/agent/CustomerView';
import { BUNDLED_SERVICES, MEMBERS } from '@/lib/family';
import { TRIGGER, OFFER } from '@/components/customer/NbaPush';

const app = () => render(<DbProvider><CustomerSurface /></DbProvider>);
const onHome = () => screen.findByText(/You ran out on day 24 of 28/, {}, { timeout: 4000 });

describe('SafeGuard grace-day shield', () => {
  it('greets the customer with the failure and the protection in one line', async () => {
    const { container } = app();
    await onHome();
    const banner = container.querySelector('.sg-banner');
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('Autopay failed — Grace-Day Shield active');
    expect(banner.textContent).toContain(`All ${BUNDLED_SERVICES.length} bundled services protected for 4 more days`);
  });

  it('is the first thing on the home screen, above the balance', async () => {
    const { container } = app();
    await onHome();
    const blocks = [...container.querySelectorAll('.sg-banner, .balance-card')];
    expect(blocks[0]).toHaveClass('sg-banner');
  });

  it('names every protected service and keeps the window flat at four days', async () => {
    const user = userEvent.setup();
    const { container } = app();
    await onHome();
    await user.click(container.querySelector('.sg-banner'));

    expect(screen.getByRole('heading', { name: 'Grace-Day Shield' })).toBeInTheDocument();
    for (const b of BUNDLED_SERVICES) expect(screen.getByText(b.name)).toBeInTheDocument();
    // Everything bundled gets the same window; it does not scale with count.
    expect(screen.getByText(/the same 4 days, whether that is one service or ten/)).toBeInTheDocument();
  });

  it('squares off without interrupting anything', async () => {
    const user = userEvent.setup();
    const { container } = app();
    await onHome();
    await user.click(container.querySelector('.sg-banner'));
    await user.click(screen.getByRole('button', { name: 'Pay now and square off' }));
    expect(await screen.findByRole('heading', { name: 'Everything is settled' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to home' }));
    expect(document.querySelector('.sg-banner')).toBeNull();
  });
});

describe('AI next best action push', () => {
  it('shows the trigger and the offer in the words the film uses', async () => {
    const { container } = app();
    await onHome();
    const push = container.querySelector('.nba-push');
    expect(push.textContent).toContain(TRIGGER);
    expect(push.textContent).toContain(OFFER);
    expect(within(push).getByRole('button', { name: '1-Tap Upgrade' })).toBeInTheDocument();
  });

  it('arrives on its own rather than waiting for an agent to send it', async () => {
    const { container } = app();
    await onHome();
    // No console interaction happened in this test at all.
    expect(container.querySelector('.nba-push')).toBeTruthy();
    expect(container.querySelector('.offer-card')).toBeNull();
  });

  it('upgrades in one tap with no confirmation screen in between', async () => {
    const user = userEvent.setup();
    app();
    await onHome();
    await user.click(screen.getByRole('button', { name: '1-Tap Upgrade' }));
    expect(await screen.findByText('Unlimited Fiber is on')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '1-Tap Upgrade' })).not.toBeInTheDocument();
  });

  it('carries no account name, so both beats can be filmed on one device', async () => {
    const { container } = app();
    await onHome();
    for (const sel of ['.nba-push', '.sg-banner']) {
      for (const m of MEMBERS) {
        expect(container.querySelector(sel).textContent, `${sel} names ${m.name}`).not.toContain(m.name);
      }
    }
  });
});

describe('the phone stage', () => {
  it('renders without the explainer rail beside it', async () => {
    const { container } = app();
    await onHome();
    expect(container.querySelector('.rail')).toBeNull();
    expect(container.querySelector('.app-stage-solo')).toBeTruthy();
    expect(container.querySelector('.phone')).toBeTruthy();
  });
});

describe('distributor portal', () => {
  it('shows a propensity score on the hot lead', async () => {
    const user = userEvent.setup();
    const a = app();
    await onHome();
    await user.click(screen.getByRole('button', { name: 'Request a broadband connection' }));
    a.unmount();

    const { container } = render(<DbProvider><CareChrome><CustomerView /></CareChrome></DbProvider>);
    await screen.findByText(/conversations open/, {}, { timeout: 4000 });
    const strip = container.querySelector('.intent-strip');
    expect(strip.textContent).toContain('Hot lead · Sanyam Gupta');
    expect(strip.querySelector('.intent-score')).toBeTruthy();
    expect(strip.textContent).toMatch(/Propensity\s*\d+%/);
  });

  it('names the Black bundle as the recommended offer for this household', async () => {
    render(<DbProvider><CareChrome><CustomerView /></CareChrome></DbProvider>);
    await screen.findByText(/conversations open/, {}, { timeout: 4000 });
    // The stage sits inside the panel's label, so match on the container text.
    const tag = [...document.querySelectorAll('.ai-tag')].find((e) =>
      e.textContent.includes('Next best action')
    );
    expect(tag.textContent).toContain('Ready for Black bundle');
  });
});

describe('one account, one owner', () => {
  it('names Sanyam Gupta as the owner and nobody else', async () => {
    const user = userEvent.setup();
    const { container } = app();
    await onHome();
    expect(container.querySelector('.app-header h1').textContent).toBe('Sanyam Gupta');

    await user.click(within(container.querySelector('.tabbar')).getByRole('button', { name: /Family$/ }));
    const owner = await screen.findByText(
      (_, el) => el?.className === 'eyebrow' && /Everything on Sanyam Gupta/.test(el.textContent)
    );
    expect(owner).toBeInTheDocument();
    // The other two are lines on this account, not account holders of their own.
    // The relation renders alongside the plan, so read the rows.
    const rows = [...container.querySelectorAll('.fam-member')].map((el) => el.textContent);
    expect(rows.filter((t) => t.includes('Line on your account'))).toHaveLength(2);
    expect(rows.filter((t) => t.includes('Account owner'))).toHaveLength(1);
    expect(rows.some((t) => t.includes('Flatmate'))).toBe(false);
    expect(rows.some((t) => t.includes('Account holder'))).toBe(false);
  });

  it('carries no other persona anywhere in the app', async () => {
    const user = userEvent.setup();
    const { container } = app();
    await onHome();
    const nav = within(container.querySelector('.tabbar'));
    for (const t of ['Family', 'Recharge', 'Offers', 'Money', 'Help', 'Home']) {
      await user.click(nav.getByRole('button', { name: new RegExp(`${t}$`) }));
      expect(document.body.textContent, `${t} tab`).not.toContain('Ananya');
    }
  });
});
