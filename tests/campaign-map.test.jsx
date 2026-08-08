import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DbProvider } from '@/lib/db';
import CareChrome from '@/components/agent/CareChrome';
import FeaturePane from '@/components/agent/FeaturePane';
import CampaignStudio from '@/components/agent/CampaignStudio';
import { LOCALITIES, USER_LOCATION } from '@/lib/data';
import { marketingDirections, areaBrief, growthProspect, allProspects, bestLine, PRODUCT_LINES, PROSPECT_BANDS } from '@/lib/ai';

const studio = () =>
  render(
    <DbProvider>
      <CareChrome>
        <FeaturePane title="Campaign studio" lede="x">
          <CampaignStudio />
        </FeaturePane>
      </CareChrome>
    </DbProvider>
  );

const ready = () => screen.findByRole('button', { name: 'Select Santoshpur and Survey Park' }, { timeout: 4000 });

describe('the map', () => {
  it('is centred on the campus, with every cluster within a few km of it', () => {
    // A city-wide frame would show mostly empty water and suburbs. Everything
    // here should sit close enough to the campus to be walkable or a short ride.
    const km = (a, b) => {
      const R = 6371;
      const dLat = ((b.lat - a.lat) * Math.PI) / 180;
      const dLng = ((b.lng - a.lng) * Math.PI) / 180;
      const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(h));
    };
    for (const l of LOCALITIES) {
      expect(km(USER_LOCATION, l), `${l.id} is ${km(USER_LOCATION, l).toFixed(1)} km away`).toBeLessThan(9);
    }
  });

  it('places the campus inside one of the mapped clusters', () => {
    expect(LOCALITIES.map((l) => l.id)).toContain(USER_LOCATION.locality);
  });

  it('puts one zone on screen per micro-market', async () => {
    const { container } = studio();
    await ready();
    expect(container.querySelectorAll('.geo-zone')).toHaveLength(LOCALITIES.length);
    expect(container.querySelectorAll('.geo-shape')).toHaveLength(LOCALITIES.length);
  });

  it('is the first thing in the feature, above everything else', async () => {
    const { container } = studio();
    await ready();
    const blocks = [...container.querySelectorAll('.ws-body > *')];
    expect(blocks[0]).toHaveClass('geo');
  });

  it('marks the account owner at a fixed live location', async () => {
    const { container } = studio();
    await ready();
    const me = container.querySelector('.geo-me');
    expect(me).toBeTruthy();
    expect(me.textContent).toContain(USER_LOCATION.name);
    expect(me.textContent).toContain(USER_LOCATION.place);
    expect(USER_LOCATION.place).toContain('IIFT Kolkata');
  });

  it('names every product line in the legend, with no tabs to switch', async () => {
    const { container } = studio();
    await ready();
    const legend = container.querySelector('.geo-legend').textContent;
    expect(legend).toContain('Best growth prospect');
    for (const l of Object.values(PRODUCT_LINES)) expect(legend).toContain(l.label);
    // The whole map answers at once now, so there is nothing to switch between.
    for (const l of Object.values(PRODUCT_LINES)) {
      expect(screen.queryByRole('button', { name: l.label }), `${l.label} is still a tab`).toBeNull();
    }
  });

  it('gives each line a colour of its own', () => {
    const hues = Object.values(PRODUCT_LINES).map((l) => l.hue);
    // Two lines sharing a swatch would make the legend meaningless.
    expect(new Set(hues).size).toBe(hues.length);
    for (const h of hues) expect(h).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('colours each circle by the line it is actually worth working', async () => {
    const { zoneColour } = await import('@/components/agent/AreaMap');
    for (const l of LOCALITIES) {
      expect(zoneColour(l), l.id).toBe(PRODUCT_LINES[bestLine(l).line].hue);
    }
  });

  it('varies circle size with the subscriber base', async () => {
    const { zoneRadius } = await import('@/components/agent/AreaMap');
    const biggest = Math.max(...LOCALITIES.map((l) => l.subscribers));
    const sorted = [...LOCALITIES].sort((a, b) => a.subscribers - b.subscribers);
    const small = zoneRadius(sorted[0], biggest);
    const large = zoneRadius(sorted.at(-1), biggest);
    expect(small).toBeGreaterThan(300);
    // Visibly different, not a rounding difference.
    expect(large / small).toBeGreaterThan(1.5);
  });

  it('scores every area on every line, independently', () => {
    for (const l of LOCALITIES) {
      const p = allProspects(l);
      expect(p, l.id).toHaveLength(3);
      for (const x of p) {
        expect(x.score, `${l.id}/${x.line}`).toBeGreaterThanOrEqual(0);
        expect(x.score, `${l.id}/${x.line}`).toBeLessThanOrEqual(100);
        expect(PROSPECT_BANDS[x.band], `${l.id}/${x.line}`).toBe(x.label);
      }
    }
  });

  it('does not collapse the three lines into one number', () => {
    // The whole reason for splitting them: an area can be weak on one line and
    // the best on the map for another. If every area ranked the same way on all
    // three, the split would be decoration.
    const bests = new Set(LOCALITIES.map((l) => bestLine(l).line));
    expect(bests.size, 'every area favours the same line').toBeGreaterThan(1);
    const jodhpur = LOCALITIES.find((l) => l.id === 'jodhpur-park');
    expect(growthProspect(jodhpur, 'bank').score).toBeGreaterThan(
      growthProspect(jodhpur, 'broadband').score + 20
    );
  });
});

describe('the three-line area summary', () => {
  it('is exactly three lines for every area', () => {
    for (const l of LOCALITIES) expect(areaBrief(l), l.id).toHaveLength(3);
  });

  it('appears when an area is picked and carries the real figures', async () => {
    const user = userEvent.setup();
    const { container } = studio();
    await user.click(await ready());
    const mini = container.querySelectorAll('.area-mini li');
    expect(mini).toHaveLength(3);
    const value = LOCALITIES.find((l) => l.id === 'santoshpur');
    expect(mini[0].textContent).toContain(value.subscribers.toLocaleString('en-IN'));
    expect(mini[1].textContent).toContain(`${value.prepaidShare}% prepaid`);
  });
});

describe('AltAI suggestion box', () => {
  it('offers three directions, not one recommendation', async () => {
    const user = userEvent.setup();
    const { container } = studio();
    await user.click(await ready());
    const box = container.querySelector('.altai');
    expect(box.textContent).toContain('AltAI suggestion box');
    expect(box.querySelectorAll('.altai-list > li')).toHaveLength(3);
  });

  it('gives every area three directions, each with moves and a trade-off', () => {
    for (const l of LOCALITIES) {
      const d = marketingDirections(l);
      expect(d, l.id).toHaveLength(3);
      for (const x of d) {
        expect(x.name && x.thrust && x.tradeoff, `${l.id}/${x.id}`).toBeTruthy();
        expect(x.moves.length, `${l.id}/${x.id}`).toBeGreaterThanOrEqual(2);
      }
      expect(new Set(d.map((x) => x.id)).size, l.id).toBe(3);
    }
  });

  it('opens a direction to show its moves and what it trades away', async () => {
    const user = userEvent.setup();
    const { container } = studio();
    await user.click(await ready());
    const first = container.querySelectorAll('.altai-list button')[0];
    expect(first.getAttribute('aria-expanded')).toBe('false');
    await user.click(first);
    expect(first.getAttribute('aria-expanded')).toBe('true');
    expect(within(first).getByText('Moves')).toBeInTheDocument();
    expect(within(first).getByText('Trade')).toBeInTheDocument();
  });

  it('carries the chosen direction into the generated brief', async () => {
    const user = userEvent.setup();
    const { container } = studio();
    await user.click(await ready());
    const chosen = marketingDirections(LOCALITIES.find((l) => l.id === 'santoshpur'))[1];
    await user.click(container.querySelectorAll('.altai-list button')[1]);
    await user.click(screen.getByRole('button', { name: 'Build the campaign' }));

    const thinking = await screen.findByText(
      (_, el) => el?.className === 'thinking' && el.textContent.includes('direction'),
      {},
      { timeout: 4000 }
    );
    expect(thinking.textContent).toContain(chosen.id);
    expect(container.querySelector('.creative-top').textContent).toContain(chosen.name);
  });

  it('falls back to the engine default when no direction is chosen', async () => {
    const user = userEvent.setup();
    const { container } = studio();
    await user.click(await ready());
    await user.click(screen.getByRole('button', { name: 'Build the campaign' }));
    await screen.findByText(/Recharge once/, {}, { timeout: 4000 });
    expect(container.querySelector('.thinking').textContent).toContain('engine default');
  });
});

describe('live tiles with a schematic fallback', () => {
  it('renders the schematic when live tiles are switched off', async () => {
    // NEXT_PUBLIC_LIVE_MAP is 'false' throughout the suite, which is the same
    // switch to use at a venue with no reliable connection.
    const { container } = studio();
    await ready();
    expect(container.querySelector('.geo-live')).toBeNull();
    expect(container.querySelectorAll('.geo-shape')).toHaveLength(LOCALITIES.length);
    expect(container.querySelectorAll('.geo-shape')).toHaveLength(LOCALITIES.length);
    expect(container.querySelector('.geo-me')).toBeTruthy();
  });

  it('keeps every interaction working in the fallback', async () => {
    const user = userEvent.setup();
    const { container } = studio();
    await user.click(await ready());
    expect(container.querySelector('.area-mini')).toBeTruthy();
    expect(container.querySelector('.geo-legend').textContent).toContain('Payments Bank');
    await user.click(screen.getByRole('button', { name: 'Select Madurdaha and Chowbaga' }));
    expect(screen.getByRole('heading', { name: 'Madurdaha and Chowbaga' })).toBeInTheDocument();
  });

  it('colours a zone identically whichever map is drawing it', async () => {
    // Both maps read the same function, so a colour cannot drift between them.
    const { zoneColour } = await import('@/components/agent/AreaMap');
    for (const l of LOCALITIES) {
      expect(zoneColour(l), l.id).toBe(PRODUCT_LINES[bestLine(l).line].hue);
    }
  });
});

describe('live tiles with a schematic fallback', () => {
  it('renders the schematic when live tiles are switched off', async () => {
    // NEXT_PUBLIC_LIVE_MAP is 'false' throughout the suite, which is the same
    // switch to use at a venue with no reliable connection.
    const { container } = studio();
    await ready();
    expect(container.querySelector('.geo-live')).toBeNull();
    expect(container.querySelectorAll('.geo-shape')).toHaveLength(LOCALITIES.length);
    expect(container.querySelectorAll('.geo-shape')).toHaveLength(LOCALITIES.length);
    expect(container.querySelector('.geo-me')).toBeTruthy();
  });

  it('keeps every interaction working in the fallback', async () => {
    const user = userEvent.setup();
    const { container } = studio();
    await user.click(await ready());
    expect(container.querySelector('.area-mini')).toBeTruthy();
    expect(container.querySelector('.geo-legend').textContent).toContain('Payments Bank');
    await user.click(screen.getByRole('button', { name: 'Select Madurdaha and Chowbaga' }));
    expect(screen.getByRole('heading', { name: 'Madurdaha and Chowbaga' })).toBeInTheDocument();
  });

  it('colours a zone identically whichever map is drawing it', async () => {
    // Both maps read the same function, so a colour cannot drift between them.
    const { zoneColour } = await import('@/components/agent/AreaMap');
    for (const l of LOCALITIES) {
      expect(zoneColour(l), l.id).toBe(PRODUCT_LINES[bestLine(l).line].hue);
    }
  });
});

describe('zone sizing', () => {
  it('gives every cluster a radius that reads as an area, scaled by size', async () => {
    // The live map draws in metres. Too small and a designated area reads as a
    // dot on a street map, which is what it did before.
    const { zoneRadius } = await import('@/components/agent/AreaMap');
    const biggest = Math.max(...LOCALITIES.map((l) => l.subscribers));
    const radii = LOCALITIES.map((l) => zoneRadius(l, biggest));
    for (const r of radii) expect(r).toBeGreaterThan(600);
    const bySubs = [...LOCALITIES].sort((a, b) => b.subscribers - a.subscribers);
    expect(zoneRadius(bySubs[0], biggest)).toBeGreaterThan(zoneRadius(bySubs.at(-1), biggest));
  });
});
