import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StrictMode } from 'react';
import { render, waitFor } from '@testing-library/react';
import { LOCALITIES, USER_LOCATION } from '@/lib/data';

// Leaflet needs a real layout engine, so it is stubbed here. What is under test
// is our sequencing, not Leaflet's rendering: the map is built inside an async
// effect, and the layer effect used to run before it existed, return early, and
// never run again. That produced a working basemap with nothing drawn on it,
// which looks like a styling problem and is not one.

const added = { circles: [], markers: [], tooltips: [], fitted: [], maps: [] };

vi.mock('leaflet/dist/leaflet.css', () => ({}));

vi.mock('leaflet', () => {
  // Mirrors the real failure mode: a layer only knows its bounds once it has
  // been added to a map. Anything that asks earlier throws, here as there.
  const layer = () => {
    let attached = false;
    return {
      addTo() { attached = true; return this; },
      remove() {},
      on() { return this; },
      bindTooltip(html, opts) { added.tooltips.push({ html, opts }); return this; },
      getBounds() {
        if (!attached) {
          throw new TypeError("Cannot read properties of undefined (reading 'layerPointToLatLng')");
        }
        return { _bounds: true };
      },
    };
  };
  const L = {
    map: () => {
      // Tracks its own lifecycle, so a test can assert that teardown cancels
      // animation before removing panes, and that nothing touches a dead map.
      const m = {
        alive: true,
        stopped: false,
        remove() { m.alive = false; },
        stop() { m.stopped = true; },
        invalidateSize() {
          if (!m.alive) throw new TypeError("Cannot read properties of undefined (reading '_leaflet_pos')");
        },
        fitBounds(bounds, opts) {
          if (!m.alive) throw new TypeError("Cannot read properties of undefined (reading '_leaflet_pos')");
          added.fitted.push({ bounds, opts });
        },
      };
      added.maps.push(m);
      return m;
    },
    tileLayer: () => ({ addTo() { return this; }, on() { return this; }, setUrl() {} }),
    circle: (latlng, opts) => {
      const c = layer();
      if (opts?.className !== undefined || opts?.color) added.circles.push({ latlng, opts });
      return c;
    },
    marker: (latlng) => {
      const m = layer();
      added.markers.push({ latlng });
      return m;
    },
    divIcon: (o) => o,
    featureGroup: (layers) => ({
      getBounds() {
        // Delegates, so a group holding an unattached layer fails the same way.
        layers.forEach((l) => l.getBounds());
        return { _bounds: true };
      },
    }),
    latLngBounds: (points) => ({ points, pad: () => ({ points, padded: true }) }),
  };
  return { default: L };
});

beforeEach(() => {
  added.maps.length = 0;
  added.fitted.length = 0;
  added.circles.length = 0;
  added.markers.length = 0;
  added.tooltips.length = 0;
  process.env.NEXT_PUBLIC_LIVE_MAP = 'true';
});

async function mount() {
  const { default: AreaMap } = await import('@/components/agent/AreaMap');
  return render(
    <AreaMap localities={LOCALITIES} mode="population" selectedId={null} onSelect={() => {}} />
  );
}

describe('framing the view', () => {
  it('fits around every cluster and the campus without touching layer bounds', async () => {
    // The crash this guards: building the frame from a throwaway circle that was
    // never added to the map, which throws inside Leaflet rather than in our code.
    await mount();
    await waitFor(() => expect(added.fitted.length).toBe(1), { timeout: 3000 });
    const pts = added.fitted[0].bounds.points;
    expect(pts).toHaveLength(LOCALITIES.length + 1);
    for (const l of LOCALITIES) {
      expect(pts.some((p) => p[0] === l.lat && p[1] === l.lng), l.id).toBe(true);
    }
    expect(pts.some((p) => p[0] === USER_LOCATION.lat && p[1] === USER_LOCATION.lng)).toBe(true);
  });
});

describe('teardown', () => {
  it('builds exactly one map even when the effect runs twice', async () => {
    // React StrictMode mounts, unmounts and remounts in development. Two maps
    // on one container is how you end up with animation callbacks firing
    // against panes that are no longer in the document.
    const { default: AreaMap } = await import('@/components/agent/AreaMap');
    const { unmount } = render(
      <StrictMode>
        <AreaMap localities={LOCALITIES} mode="population" selectedId={null} onSelect={() => {}} />
      </StrictMode>
    );
    await waitFor(() => expect(added.maps.length).toBeGreaterThan(0), { timeout: 3000 });
    // However many times the effect ran, only one map may be left holding the
    // container. Two is how animation callbacks end up firing on a dead pane.
    expect(added.maps.filter((m) => m.alive)).toHaveLength(1);
    unmount();
    await waitFor(() => expect(added.maps.every((m) => !m.alive)).toBe(true));
  });

  it('leaves nothing behind when unmounted before the map finishes loading', async () => {
    // Leaflet is imported dynamically, so a component can be gone by the time
    // the import resolves. Building a map at that point leaves an orphan whose
    // animation callbacks fire against panes that are no longer in the document.
    const { default: AreaMap } = await import('@/components/agent/AreaMap');
    const { unmount } = render(
      <AreaMap localities={LOCALITIES} mode="population" selectedId={null} onSelect={() => {}} />
    );
    unmount(); // synchronously, before the dynamic import can resolve
    await new Promise((r) => setTimeout(r, 400));
    expect(added.maps.filter((m) => m.alive), 'orphaned map left running').toHaveLength(0);
  });

  it('cancels animation before removing the map', async () => {
    const { unmount } = await mount();
    await waitFor(() => expect(added.maps.length).toBe(1), { timeout: 3000 });
    unmount();
    await waitFor(() => expect(added.maps[0].alive).toBe(false));
    expect(added.maps[0].stopped, 'stop() must run before remove()').toBe(true);
  });

  it('sets the frame without animating it', async () => {
    await mount();
    await waitFor(() => expect(added.fitted.length).toBe(1), { timeout: 3000 });
    expect(added.fitted[0].opts.animate).toBe(false);
  });
});

describe('live map layers', () => {
  it('draws a zone for every cluster once the map exists', async () => {
    await mount();
    await waitFor(() => expect(added.circles.length).toBeGreaterThan(0), { timeout: 3000 });
    // One outline plus one halo per cluster, plus the campus circle used for framing.
    const outlines = added.circles.filter((c) => c.opts.className === 'geo-live-zone');
    expect(outlines).toHaveLength(LOCALITIES.length);
  });

  it('labels every zone permanently rather than on hover', async () => {
    await mount();
    await waitFor(() => expect(added.tooltips.length).toBeGreaterThan(0), { timeout: 3000 });
    expect(added.tooltips).toHaveLength(LOCALITIES.length);
    for (const t of added.tooltips) expect(t.opts.permanent).toBe(true);
    for (const l of LOCALITIES) {
      expect(added.tooltips.some((t) => t.html.includes(l.name)), l.name).toBe(true);
    }
  });

  it('places the account owner marker on the map', async () => {
    await mount();
    await waitFor(() => expect(added.markers.length).toBe(1), { timeout: 3000 });
  });

  it('puts every zone at its real coordinates', async () => {
    await mount();
    await waitFor(() => expect(added.circles.length).toBeGreaterThan(0), { timeout: 3000 });
    const outlines = added.circles.filter((c) => c.opts.className === 'geo-live-zone');
    for (const l of LOCALITIES) {
      expect(outlines.some((c) => c.latlng[0] === l.lat && c.latlng[1] === l.lng), l.id).toBe(true);
    }
  });
});
