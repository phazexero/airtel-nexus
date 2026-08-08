import { describe, it, expect } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DbProvider } from '@/lib/db';
import CustomerSurface from '@/components/customer/CustomerSurface';
import CareChrome from '@/components/agent/CareChrome';
import CustomerView from '@/components/agent/CustomerView';

const app = () => render(<DbProvider><CustomerSurface /></DbProvider>);

async function openMoney(user, container) {
  await screen.findByText(/You ran out on day 24 of 28/, {}, { timeout: 4000 });
  await user.click(within(container.querySelector('.tabbar')).getByRole('button', { name: /Money$/ }));
}

async function openVacation(user, container) {
  await openMoney(user, container);
  await user.click(screen.getByRole('button', { name: /Going on vacation\?/ }));
}

describe('entry point in the payments tab', () => {
  it('sits inside Money and uses the launch wording', async () => {
    const user = userEvent.setup();
    const { container } = app();
    await openMoney(user, container);
    const teaser = container.querySelector('.vac-teaser');
    expect(teaser).toBeTruthy();
    expect(teaser.textContent).toContain('Going on vacation?');
    expect(teaser.textContent).toContain('Introducing Vacation Shield');
  });

  it('is not on the home screen, which is already carrying three alerts', async () => {
    app();
    await screen.findByText(/You ran out on day 24 of 28/, {}, { timeout: 4000 });
    expect(document.querySelector('.vac-teaser')).toBeNull();
  });
});

describe('scheduling a break', () => {
  it('offers both the home line and the mobile pack, pre-selected', async () => {
    const user = userEvent.setup();
    const { container } = app();
    await openVacation(user, container);
    const fiber = screen.getByRole('checkbox', { name: /Xstream Fiber/ });
    const mobile = screen.getByRole('checkbox', { name: /Mobile pack validity/ });
    expect(fiber).toBeEnabled();
    expect(fiber).toBeChecked();
    expect(mobile).toBeChecked();
  });

  it('activates in a single tap with the wording the film needs', async () => {
    const user = userEvent.setup();
    const { container } = app();
    await openVacation(user, container);
    await user.click(screen.getByRole('button', { name: /Activate for 10 days/ }));
    expect(await screen.findByText('Vacation Shield Activated')).toBeInTheDocument();
    expect(screen.getByText(/₹0 rental · 10 days/)).toBeInTheDocument();
  });

  it('prices the break before asking anyone to commit to it', async () => {
    const user = userEvent.setup();
    const { container } = app();
    await openVacation(user, container);
    await waitFor(() => expect(screen.getByText('14 days')).toBeInTheDocument());
    // 14 days of 200 Mbps fiber at 699/30 plus a 299 / 28 day pack
    expect(container.querySelector('.vac-saving strong').textContent).toBe('₹476');
  });

  it('will not schedule with nothing selected', async () => {
    const user = userEvent.setup();
    const { container } = app();
    await openVacation(user, container);
    await user.click(screen.getByRole('checkbox', { name: /Mobile pack validity/ }));
    await user.click(screen.getByRole('checkbox', { name: /Xstream Fiber/ }));
    expect(screen.getByRole('button', { name: 'Schedule the break' })).toBeDisabled();
  });

  it('refuses a break longer than the yearly allowance', async () => {
    const user = userEvent.setup();
    const { container } = app();
    await openVacation(user, container);
    const to = container.querySelectorAll('.vac-dates input')[1];
    await user.clear(to);
    await user.type(to, '2027-12-31');
    expect(await screen.findByText(/covers up to 90 days a year/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Schedule the break' })).toBeDisabled();
  });

  it('confirms the break and can resume early', async () => {
    const user = userEvent.setup();
    const { container } = app();
    await openVacation(user, container);
    await user.click(await screen.findByRole('button', { name: 'Schedule the break' }));

    expect(await screen.findByRole('heading', { name: 'Paused, not cancelled' })).toBeInTheDocument();
    expect(screen.getByText(/₹0 rental · 14 days/)).toBeInTheDocument();
    expect(screen.getByText('No reconnection charge when the break ends')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Resume everything now' }));
    expect(await screen.findByRole('heading', { name: 'Introducing Vacation Shield' })).toBeInTheDocument();
  });

  it('shows the live break on the payments teaser afterwards', async () => {
    const user = userEvent.setup();
    const { container } = app();
    await openVacation(user, container);
    await user.click(await screen.findByRole('button', { name: 'Schedule the break' }));
    await screen.findByRole('heading', { name: 'Paused, not cancelled' });
    await user.click(screen.getByRole('button', { name: 'Back to payments' }));
    expect(container.querySelector('.vac-teaser').textContent).toContain('Vacation Shield is on');
  });
});

describe('the console sees it as retention', () => {
  it('records the pause rather than letting it look like a cancellation', async () => {
    const user = userEvent.setup();
    const a = app();
    await openVacation(user, a.container);
    await user.click(await screen.findByRole('button', { name: 'Schedule the break' }));
    await screen.findByRole('heading', { name: 'Paused, not cancelled' });
    a.unmount();

    render(<DbProvider><CareChrome><CustomerView /></CareChrome></DbProvider>);
    await screen.findByText(/conversations open/, {}, { timeout: 4000 });
    expect(screen.queryByText(/Hot lead/)).not.toBeInTheDocument();
  });
});
