import { describe, it, expect } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DbProvider } from '@/lib/db';
import CustomerSurface from '@/components/customer/CustomerSurface';
import CareChrome from '@/components/agent/CareChrome';
import CustomerView from '@/components/agent/CustomerView';
import {
  MEMBERS, SUBSCRIPTIONS, HOUSEHOLD, BUNDLE,
  householdSpend, usageByCategory, duplicateSubs, recommendBundle, memberSpend,
} from '@/lib/family';

describe('household arithmetic', () => {
  it('adds up the same way a customer checking their bills would', () => {
    const s = householdSpend();
    expect(s.mobile).toBe(MEMBERS.reduce((a, m) => a + m.monthly + m.topUpsMonthly, 0));
    expect(s.ott).toBe(SUBSCRIPTIONS.reduce((a, x) => a + x.monthly, 0));
    expect(s.broadband).toBe(HOUSEHOLD.broadband.monthly);
    expect(s.total).toBe(s.mobile + s.ott + s.broadband);
  });

  it('reconciles the saving against the bundle price and what is kept', () => {
    const r = recommendBundle();
    // The figure on screen has to survive being checked, so assert the identity
    // rather than a hardcoded number.
    expect(r.after).toBe(BUNDLE.monthly + r.keptCost);
    expect(r.saving).toBe(r.now.total - r.after);
    expect(r.savingYearly).toBe(r.saving * 12);
    expect(r.saving).toBeGreaterThan(0);
  });

  it('never counts a kept subscription as a saving', () => {
    const r = recommendBundle();
    expect(r.kept.every((k) => !k.inBundle)).toBe(true);
    expect(r.replaced.every((k) => k.inBundle)).toBe(true);
    expect(r.kept.length + r.replaced.length).toBe(SUBSCRIPTIONS.length);
    expect(r.caveat).toContain('Spotify');
  });

  it('splits usage into shares that total 100', () => {
    const cats = usageByCategory();
    expect(cats.reduce((a, c) => a + c.share, 0)).toBeGreaterThanOrEqual(99);
    expect(cats.reduce((a, c) => a + c.share, 0)).toBeLessThanOrEqual(101);
    expect(cats[0].category).toBe('Video');
  });

  it('finds the duplicate subscription in the household', () => {
    const d = duplicateSubs();
    expect(d).toHaveLength(1);
    expect(d[0].service).toBe('Netflix');
    expect(d[0].wasted).toBe(199);
  });

  it('recomputes when the household changes rather than reciting fixed numbers', () => {
    const smaller = MEMBERS.slice(0, 2);
    const a = recommendBundle();
    const b = recommendBundle({ members: smaller });
    expect(b.now.total).toBeLessThan(a.now.total);
    expect(b.saving).not.toBe(a.saving);
  });

  it('handles a household with no duplicates and nothing to keep', () => {
    const subs = [{ id: 'x', name: 'Prime Video', heldBy: 'F-2', monthly: 179, inBundle: true }];
    const r = recommendBundle({ subs });
    expect(r.dupes).toEqual([]);
    expect(r.caveat).toBeNull();
    expect(r.keptCost).toBe(0);
  });
});

describe('family section', () => {
  const app = () => render(<DbProvider><CustomerSurface /></DbProvider>);
  const open = async (user) => {
    await screen.findByText(/You ran out on day 24 of 28/, {}, { timeout: 4000 });
    await user.click(screen.getByRole('button', { name: 'See the household bundle' }));
  };

  it('shows every member with their plan and spend before the offer', async () => {
    const user = userEvent.setup();
    const { container } = app();
    await open(user);
    // The account holder's name is also in the phone header, so scope to the
    // member list rather than the whole screen.
    for (const m of MEMBERS) {
      const row = [...container.querySelectorAll('.fam-member')].find((el) =>
        el.textContent.includes(m.name)
      );
      expect(row, m.name).toBeTruthy();
      expect(within(row).getByText(new RegExp(m.relation))).toBeInTheDocument();
      expect(row.textContent).toContain(`₹${memberSpend(m).toLocaleString('en-IN')}`);
    }
    const order = [...container.querySelectorAll('.fam-total, .fam-member, .fam-rec')];
    expect(order[0]).toHaveClass('fam-total');
    expect(order[order.length - 1]).toHaveClass('fam-rec');
  });

  it('shows the combined spend and the bundle price it is compared against', async () => {
    const user = userEvent.setup();
    app();
    await open(user);
    const r = recommendBundle();
    // The combined figure counts up, so wait for it to land rather than
    // catching it mid-animation.
    await waitFor(
      () => expect(document.querySelector('.fam-total strong').textContent)
        .toBe(`₹${r.now.total.toLocaleString('en-IN')}`),
      { timeout: 3000 }
    );
    expect(document.querySelector('.fam-price strong').textContent)
      .toBe(`₹${BUNDLE.monthly.toLocaleString('en-IN')}`);
    expect(document.querySelector('.fam-saving').textContent)
      .toContain(`₹${r.saving.toLocaleString('en-IN')}`);
  });

  it('shows on-device usage with the privacy limit stated', async () => {
    const user = userEvent.setup();
    app();
    await open(user);
    expect(screen.getByText(/no per-app record leaves your phone/)).toBeInTheDocument();
    expect(screen.getByText('Video')).toBeInTheDocument();
  });

  it('names every OTT app the bundle includes', async () => {
    const user = userEvent.setup();
    const { container } = app();
    await open(user);
    const chips = within(container.querySelector('.fam-ott'));
    for (const o of BUNDLE.ott) expect(chips.getByText(o)).toBeInTheDocument();
  });

  it('calls out the duplicate subscription', async () => {
    const user = userEvent.setup();
    app();
    await open(user);
    expect(screen.getByText(/You are paying twice for the same thing/)).toBeInTheDocument();
  });

  it('raises the request and reaches the distributor queue', async () => {
    const user = userEvent.setup();
    const a = app();
    await open(user);
    await user.click(screen.getByRole('button', { name: 'Move the household to this bundle' }));
    expect(screen.getByText('We have raised a request for this to customer support.')).toBeInTheDocument();
    a.unmount();

    render(<DbProvider><CareChrome><CustomerView /></CareChrome></DbProvider>);
    await screen.findByText(/conversations open/, {}, { timeout: 4000 });
    expect(await screen.findByText(/Hot lead · Sanyam Gupta/)).toBeInTheDocument();
    expect(screen.getByText(/household lines onto Airtel Black Family/)).toBeInTheDocument();
  });
});
