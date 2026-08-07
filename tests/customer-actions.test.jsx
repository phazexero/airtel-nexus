import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DbProvider } from '@/lib/db';
import CustomerSurface from '@/components/customer/CustomerSurface';
import CareChrome from '@/components/agent/CareChrome';
import CustomerView from '@/components/agent/CustomerView';

const app = () => render(<DbProvider><CustomerSurface /></DbProvider>);
const onHome = () => screen.findByText(/You ran out on day 24 of 28/, {}, { timeout: 4000 });

describe('data exhaustion panel', () => {
  it('states the usage before either alert offers a response to it', async () => {
    const { container } = app();
    await onHome();
    expect(screen.getByText('99% used')).toBeInTheDocument();
    expect(screen.getByText(/41.6 GB/)).toBeInTheDocument();

    // The number comes first, then the three responses to it, in the order
    // they escalate: change the plan, add a line, bundle the household.
    const order = [...container.querySelectorAll('.usage-panel, .alert-card')];
    expect(order).toHaveLength(4);
    expect(order[0]).toHaveClass('usage-panel');
    expect(order[1]).toHaveClass('alert-primary');
    expect(order[1].textContent).toContain('Switch to postpaid');
    expect(order[2].textContent).toContain('broadband');
    expect(order[3].textContent).toContain('Bundle the whole household');
  });
});

describe('switch to postpaid', () => {
  it('opens the KYC imaging flow', async () => {
    const user = userEvent.setup();
    app();
    await onHome();
    await user.click(screen.getByRole('button', { name: 'Switch to postpaid' }));
    expect(screen.getByRole('heading', { name: 'Complete your KYC' })).toBeInTheDocument();
    expect(screen.getByText('Front of your ID')).toBeInTheDocument();
  });

  it('captures three images, allows a retake, and verifies', { timeout: 20000 }, async () => {
    const user = userEvent.setup();
    app();
    await onHome();
    await user.click(screen.getByRole('button', { name: 'Switch to postpaid' }));

    // front, with a retake in the middle to prove the failure path works
    await user.click(screen.getByRole('button', { name: 'Capture' }));
    await user.click(await screen.findByRole('button', { name: 'Retake' }, { timeout: 3000 }));
    expect(screen.getByText('Front of your ID')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Capture' }));
    await user.click(await screen.findByRole('button', { name: 'Looks good' }, { timeout: 3000 }));
    expect(screen.getByText('Back of your ID')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Capture' }));
    await user.click(await screen.findByRole('button', { name: 'Looks good' }, { timeout: 3000 }));
    expect(screen.getByText('A live photo of you')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Capture' }));
    await user.click(await screen.findByRole('button', { name: 'Submit for verification' }, { timeout: 3000 }));
    expect(screen.getByText(/Verifying against the ID database/)).toBeInTheDocument();

    expect(await screen.findByRole('heading', { name: 'KYC verified' }, { timeout: 4000 })).toBeInTheDocument();
  });

  it('remembers that KYC is done instead of offering the switch again', { timeout: 20000 }, async () => {
    const user = userEvent.setup();
    app();
    await onHome();
    await user.click(screen.getByRole('button', { name: 'Switch to postpaid' }));
    for (let i = 0; i < 3; i += 1) {
      await user.click(screen.getByRole('button', { name: 'Capture' }));
      await user.click(await screen.findByRole('button', { name: /Looks good|Submit for verification/ }, { timeout: 3000 }));
    }
    await screen.findByRole('heading', { name: 'KYC verified' }, { timeout: 4000 });
    await user.click(screen.getByRole('button', { name: 'Back to home' }));

    expect(await screen.findByText(/KYC verified · starts next cycle/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Switch to postpaid' })).not.toBeInTheDocument();
  });
});

describe('broadband request', () => {
  it('confirms in the words the customer was promised', async () => {
    const user = userEvent.setup();
    app();
    await onHome();
    await user.click(screen.getByRole('button', { name: 'Request a broadband connection' }));

    expect(
      screen.getByText('We have raised a request for this to customer support.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Request a broadband connection' })).not.toBeInTheDocument();
  });

  it('updates the service list rather than leaving it contradicting the alert', async () => {
    const user = userEvent.setup();
    app();
    await onHome();
    await user.click(screen.getByRole('button', { name: 'Request a broadband connection' }));
    expect(screen.getByText(/Customer support will confirm your install slot/)).toBeInTheDocument();
  });

  it('reaches the distributor queue as a lead', async () => {
    const user = userEvent.setup();
    const a = app();
    await onHome();
    await user.click(screen.getByRole('button', { name: 'Request a broadband connection' }));
    a.unmount();

    render(<DbProvider><CareChrome><CustomerView /></CareChrome></DbProvider>);
    await screen.findByText(/conversations open/, {}, { timeout: 4000 });
    const lead = await screen.findByText(/Hot lead · Ananya Sen/);
    expect(lead).toBeInTheDocument();
    expect(screen.getByText(/Asked for a broadband connection from the app/)).toBeInTheDocument();
  });
});

describe('branding', () => {
  it('says AltCare and never Nexus Care', async () => {
    render(<DbProvider><CareChrome><CustomerView /></CareChrome></DbProvider>);
    await screen.findByText(/conversations open/, {}, { timeout: 4000 });
    expect(screen.getByText('AltCare')).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('Nexus Care');
  });
});
