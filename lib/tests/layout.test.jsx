import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DbProvider } from '@/lib/db';
import CareChrome from '@/components/agent/CareChrome';
import FeatureNav from '@/components/agent/FeatureNav';
import FeaturePane from '@/components/agent/FeaturePane';
import CustomerView from '@/components/agent/CustomerView';
import CampaignStudio from '@/components/agent/CampaignStudio';
import Performance from '@/components/agent/Performance';
import JourneyView from '@/components/agent/JourneyView';

// Mirrors app/care/(workspace)/layout.jsx. If that layout changes, this should
// change with it.
function workspace(feature) {
  return render(
    <DbProvider>
      <CareChrome>
        <div className="console">
          <FeatureNav />
          {feature}
        </div>
      </CareChrome>
    </DbProvider>
  );
}

const ready = () => screen.findByText(/conversations open/, {}, { timeout: 4000 });

describe('grid structure', () => {
  // A nested .console declares its own columns and only fills the first two of
  // them, which pins the workspace to a fixed narrow width and leaves a dead
  // column on the right. It looks fine until the viewport is wide enough for
  // the gap to be obvious, so it needs asserting rather than eyeballing.
  it('has exactly one grid container per feature', async () => {
    for (const feature of [
      <CustomerView key="c" />,
      <FeaturePane key="s" title="Campaign studio" lede="x"><CampaignStudio /></FeaturePane>,
      <FeaturePane key="p" title="Performance" lede="x"><Performance /></FeaturePane>,
      <FeaturePane key="j" title="Journey" lede="x" waitForData={false}><JourneyView /></FeaturePane>,
    ]) {
      const { container, unmount } = workspace(feature);
      await ready();
      expect(container.querySelectorAll('.console')).toHaveLength(1);
      unmount();
    }
  });

  it('puts the nav, queue and workspace side by side as direct grid children', async () => {
    const { container } = workspace(<CustomerView />);
    await ready();
    const grid = container.querySelector('.console');
    const kids = [...grid.children];
    expect(kids).toHaveLength(3);
    expect(kids[0]).toHaveClass('feature-nav');
    expect(kids[1]).toHaveClass('queue');
    expect(kids[2]).toHaveClass('workspace');
  });

  it('has two grid children on the features without a queue', async () => {
    const { container } = workspace(
      <FeaturePane title="Performance" lede="x"><Performance /></FeaturePane>
    );
    await ready();
    const kids = [...container.querySelector('.console').children];
    expect(kids).toHaveLength(2);
    expect(kids[1]).toHaveClass('workspace');
    expect(container.querySelector('.queue')).toBeNull();
  });

  it('never nests a workspace inside another workspace', async () => {
    const { container } = workspace(<CustomerView />);
    await ready();
    for (const w of container.querySelectorAll('.workspace')) {
      expect(w.parentElement.closest('.workspace')).toBeNull();
    }
  });
});

describe('column mechanism', () => {
  const css = require('node:fs').readFileSync('app/globals.css', 'utf8');

  it('declares as many columns as the queue layout actually has children', () => {
    const withQueue = css.match(/\.console:has\(\.queue\)\s*{([^}]*)}/)[1];
    expect(withQueue.split('minmax').length - 1 + withQueue.split('var(--').length - 1).toBe(3);
  });

  it('drives both rail widths from custom properties rather than repeating them', () => {
    expect(css).toContain('--nav-w');
    expect(css).toContain('--queue-w');
    expect(css).toMatch(/\.console\s*{[^}]*grid-template-columns: var\(--nav-w\), ?|\.console\s*{[^}]*var\(--nav-w\)/);
  });

  it('sizes the content grids from their container, not a viewport guess', () => {
    for (const g of ['.grid-2', '.grid-3', '.grid-4']) {
      const rule = css.match(new RegExp(`\\${g} { display: grid; grid-template-columns: ([^;]*);`))[1];
      expect(rule, g).toContain('auto-fit');
    }
  });
});
