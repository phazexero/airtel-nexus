import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DbProvider } from '@/lib/db';
import CareChrome from '@/components/agent/CareChrome';
import CustomerView from '@/components/agent/CustomerView';
import CampaignStudio from '@/components/agent/CampaignStudio';
import Performance from '@/components/agent/Performance';
import CareHub from '@/components/agent/CareHub';
import FeatureNav from '@/components/agent/FeatureNav';
import FeaturePane from '@/components/agent/FeaturePane';
import JourneyView from '@/components/agent/JourneyView';
import CustomerSurface from '@/components/customer/CustomerSurface';

function console_(ui) {
  return render(
    <DbProvider>
      <CareChrome>{ui}</CareChrome>
    </DbProvider>
  );
}

const ready = () => waitFor(() => expect(screen.queryByText(/Loading the working set/)).not.toBeInTheDocument(), { timeout: 4000 });

// The queue clearing and the workspace painting are not the same moment, and
// React 19 schedules them further apart than React 18 did. Anything that needs
// the customer panel should wait for the panel, not for the loader to go.
const workspaceReady = () => screen.findByRole('heading', { name: 'Sanyam Gupta' }, { timeout: 4000 });

describe('console shell', () => {
  it('loads the working set and lands on the first conversation', async () => {
    console_(<CustomerView />);
    expect(screen.getByText('Loading')).toBeInTheDocument();
    await ready();
    expect(await screen.findByRole('heading', { name: 'Sanyam Gupta' })).toBeInTheDocument();
    expect(screen.getByText(/6 waiting/)).toBeInTheDocument();
  });

  it('shows a retry rather than an empty screen when the seed fails', async () => {
    globalThis.__ALLOW_CONSOLE__ = true;
    globalThis.__SEED_FAILS__ = true;
    console_(<CustomerView />);
    expect(await screen.findByText(/Could not load the working set/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try again/ })).toBeInTheDocument();
  });

  it('drops edit rights when switched to the agent account', async () => {
    const user = userEvent.setup();
    console_(<CustomerView />);
    await ready();
    await user.click(screen.getByRole('button', { name: 'Edit data' }));
    expect(screen.getByRole('button', { name: 'Done editing' })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Working as'), 'AG-2041');
    expect(screen.queryByRole('button', { name: /Edit data|Done editing/ })).not.toBeInTheDocument();
    expect(screen.getByText(/read only/)).toBeInTheDocument();
  });
});

describe('editing recomputes the recommendation', () => {
  it('rewrites the script when temperament changes', async () => {
    const user = userEvent.setup();
    console_(<CustomerView />);
    await ready();
    await user.click(screen.getByRole('button', { name: 'Edit data' }));

    expect(screen.getByText(/Lead with the arithmetic/)).toBeInTheDocument();

    const selects = screen.getAllByRole('combobox');
    const temperament = selects.find((s) => Array.from(s.options).some((o) => o.value === 'frustrated'));
    await user.selectOptions(temperament, 'frustrated');

    expect(screen.getByText(/Start by naming the old problem/)).toBeInTheDocument();
    expect(screen.queryByText(/Lead with the arithmetic/)).not.toBeInTheDocument();
  });

  it('keeps a numeric field usable when it is cleared', async () => {
    const user = userEvent.setup();
    console_(<CustomerView />);
    await ready();
    await user.click(screen.getByRole('button', { name: 'Edit data' }));

    const spin = screen.getAllByRole('spinbutton');
    await user.clear(spin[0]);
    expect(await screen.findByRole('heading', { name: 'Sanyam Gupta' })).toBeInTheDocument();
    await user.type(spin[0], '900');
  });

  it('can add and remove a signal', async () => {
    const user = userEvent.setup();
    console_(<CustomerView />);
    await ready();
    await user.click(screen.getByRole('button', { name: 'Edit data' }));

    const before = screen.getAllByRole('button', { name: /^Remove line/ }).length;
    await user.click(screen.getByRole('button', { name: 'Add a signal' }));
    expect(screen.getAllByRole('button', { name: /^Remove line/ })).toHaveLength(before + 1);
    await user.click(screen.getAllByRole('button', { name: /^Remove line/ })[0]);
    expect(screen.getAllByRole('button', { name: /^Remove line/ })).toHaveLength(before);
  });
});

describe('the cross-app loop', () => {
  it('sends an offer, receives it in the app, and raises a hot lead back', async () => {
    const user = userEvent.setup();
    const { unmount } = console_(<CustomerView />);
    await workspaceReady();

    await user.click(screen.getByRole('button', { name: 'Send to customer app' }));
    expect(await screen.findByRole('button', { name: 'Offer sent to app' })).toBeInTheDocument();
    unmount();

    render(<DbProvider><CustomerSurface /></DbProvider>);
    // The badge on Home is the arrival signal; the card itself is on Offers.
    await user.click(await screen.findByRole('button', { name: /See what changed/ }, { timeout: 4000 }));
    await user.click(await screen.findByRole('button', { name: 'Tell me more' }));

    expect(await screen.findByText(/Confirm what we already hold/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Confirm and activate' }));
    expect(await screen.findByText(/is active/)).toBeInTheDocument();
  });

  it('shows the hot lead on the console queue after the customer taps through', async () => {
    const user = userEvent.setup();
    const first = console_(<CustomerView />);
    await workspaceReady();
    await user.click(screen.getByRole('button', { name: 'Send to customer app' }));
    await screen.findByRole('button', { name: 'Offer sent to app' });
    first.unmount();

    const app = render(<DbProvider><CustomerSurface /></DbProvider>);
    await user.click(await screen.findByRole('button', { name: /See what changed/ }, { timeout: 4000 }));
    await user.click(await screen.findByRole('button', { name: 'Tell me more' }));
    app.unmount();

    console_(<CustomerView />);
    await ready();
    expect(await screen.findByText(/Hot lead/)).toBeInTheDocument();
  });
});

describe('campaign studio', () => {
  it('requires an area, then builds a brief', async () => {
    const user = userEvent.setup();
    console_(<FeaturePane title="Campaign studio" lede="x"><CampaignStudio /></FeaturePane>);
    await ready();

    // The controls appear with the area, so before a pick there is a prompt
    // rather than a dead button.
    expect(await screen.findByText(/Pick a micro-market/, {}, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Build the campaign' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Select Santoshpur and Survey Park' }));
    await user.click(screen.getByRole('button', { name: 'Build the campaign' }));

    expect(await screen.findByText(/Recharge once/, {}, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.getByText('Cost per acquisition')).toBeInTheDocument();
  });

  it('keeps the brief on screen after editing its evidence', async () => {
    const user = userEvent.setup();
    console_(<FeaturePane title="Campaign studio" lede="x"><CampaignStudio /></FeaturePane>);
    await ready();
    await user.click(screen.getByRole('button', { name: 'Edit data' }));
    await user.click(screen.getByRole('button', { name: 'Select Santoshpur and Survey Park' }));
    await user.click(screen.getByRole('button', { name: 'Build the campaign' }));
    await screen.findByText(/Recharge once/, {}, { timeout: 4000 });

    await user.click(screen.getByRole('button', { name: 'Add evidence' }));
    expect(screen.getByText(/Recharge once/)).toBeInTheDocument();
  });

  it('launches into a cluster once', async () => {
    const user = userEvent.setup();
    console_(<FeaturePane title="Campaign studio" lede="x"><CampaignStudio /></FeaturePane>);
    await ready();
    await user.click(screen.getByRole('button', { name: 'Select Madurdaha and Chowbaga' }));
    await user.click(screen.getByRole('button', { name: 'Build the campaign' }));
    const launch = await screen.findByRole('button', { name: /Launch in this cluster/ }, { timeout: 4000 });
    await user.click(launch);
    expect(await screen.findByRole('button', { name: 'Campaign is live' })).toBeDisabled();
  });
});

describe('other surfaces', () => {
  it('renders the hub with all four features', async () => {
    console_(<CareHub />);
    await ready();
    for (const n of ['Distributor journey', 'Customer', 'Campaign studio', 'Performance']) {
      expect(screen.getByRole('heading', { name: n, level: 2 })).toBeInTheDocument();
    }
  });

  it('renders the nav with a link per feature', async () => {
    console_(<FeatureNav />);
    await ready();
    for (const href of ['/care/journey', '/care/customer', '/care/campaigns', '/care/performance']) {
      expect(document.querySelector(`a[href="${href}"]`)).toBeTruthy();
    }
  });

  it('renders the journey without waiting for data', async () => {
    render(<DbProvider><FeaturePane title="Distributor journey" lede="x" waitForData={false}><JourneyView /></FeaturePane></DbProvider>);
    expect(screen.getByText('Prioritise the right leads')).toBeInTheDocument();
    await act(() => new Promise((r) => setTimeout(r, 900)));
  });

  it('switches journey stages', async () => {
    const user = userEvent.setup();
    render(<DbProvider><FeaturePane title="j" lede="x" waitForData={false}><JourneyView /></FeaturePane></DbProvider>);
    await user.click(screen.getByRole('button', { name: /Track and improve/ }));
    expect(screen.getByText(/How am I doing today/)).toBeInTheDocument();
    await act(() => new Promise((r) => setTimeout(r, 900)));
  });

  it('renders performance without dividing by zero', async () => {
    console_(<FeaturePane title="Performance" lede="x"><Performance /></FeaturePane>);
    await ready();
    expect(await screen.findByText('Queue conversion score')).toBeInTheDocument();
    expect(screen.queryByText(/NaN|Infinity/)).not.toBeInTheDocument();
  });

  it('walks every tab of the customer app', async () => {
    const user = userEvent.setup();
    const { container } = render(<DbProvider><CustomerSurface /></DbProvider>);
    await screen.findByRole('heading', { name: 'Sanyam Gupta', level: 1 }, { timeout: 4000 });
    const nav = within(container.querySelector('.tabbar'));
    for (const tab of ['Recharge', 'Offers', 'Money', 'Help', 'Home']) {
      await user.click(nav.getByRole('button', { name: new RegExp(`${tab}$`) }));
    }
    expect(screen.getByRole('heading', { name: 'Sanyam Gupta', level: 1 })).toBeInTheDocument();
  });
});
