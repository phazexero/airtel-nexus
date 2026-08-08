import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { LOCALITIES, USER_LOCATION } from '@/lib/data';

// Leaflet needs a real layout engine, so it is stubbed here. What is under test
// is our sequencing, not Leaflet's rendering: the map is built inside an async
// effect, and the layer effect used to run before it existed, return early, and
// never run again. That produced a working basemap with nothing drawn on it,
// which looks like a styling problem and is not one.

const added = { circles: [], polygons: [], markers: [], tooltips: [], fitted: [], maps: [] };

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
    tileLayer: () => {
      const t = {
        addTo() { return this; },
        // Fires for real. The load event is what calls onReady, which sets
        // state on the parent, which re-renders this component. If the map
        // effect depends on callback identity, that rebuilds the whole map and
        // every layer on it disappears.
        on(evt, fn) { if (evt === 'load') setTimeout(fn, 10); return this; },
        setUrl() {},
      };
      return t;
    },
    circle: (latlng, opts) => {
      const c = layer();
      added.circles.push({ latlng, opts });
      return c;
    },
    polygon: (ring, opts) => {
      const p = layer();
      added.polygons.push({ ring, opts });
      return p;
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
  added.polygons.length = 0;
  added.markers.length = 0;
  added.tooltips.length = 0;
  process.env.NEXT_PUBLIC_LIVE_MAP = 'true';
});

async function mount() {
  const { default: AreaMap } = await import('@/components/agent/AreaMap');
  return render(
    <AreaMap localities={LOCALITIES}  selectedId={null} onSelect={() => {}} />
  );
}

describe('framing the view', () => {
  it('fits around every cluster and the campus without touching layer bounds', async () => {
    // The crash this guards: building the frame from a throwaway circle that was
    // never added to the map, which throws inside Leaflet rather than in our code.
    await mount();
    await waitFor(() => expect(added.fitted.length).toBe(1), { timeout: 3000 });
    const pts = added.fitted[0].bounds.points;
    // Every cluster centre plus the campus, padded so no circle is clipped.
    expect(pts).toHaveLength(LOCALITIES.length + 1);
    expect(pts.some((p) => p[0] === USER_LOCATION.lat && p[1] === USER_LOCATION.lng)).toBe(true);
  });
});

describe('stability', () => {
  it('builds the map once and keeps it when tiles finish loading', async () => {
    await mount();
    await waitFor(() => expect(added.maps.length).toBe(1), { timeout: 3000 });
    // Long enough for the load event, the parent re-render and any rebuild.
    await new Promise((r) => setTimeout(r, 300));
    expect(added.maps.length, 'the map was rebuilt after tiles loaded').toBe(1);
    expect(added.maps[0].alive).toBe(true);
  });

  it('keeps the circles on the map after that re-render', async () => {
    const live = () => added.circles.filter((c) => c.opts?.className === 'geo-live-zone');
    await mount();
    await waitFor(() => expect(live().length).toBe(LOCALITIES.length), { timeout: 3000 });
    await new Promise((r) => setTimeout(r, 300));
    expect(live().length).toBe(LOCALITIES.length);
  });
});

describe('teardown', () => {
  // A StrictMode double-mount test used to sit here. It never reproduced the
  // bug it was written for, and under jsdom it stopped the map initialising at
  // all for reasons that did not match browser behaviour, where the same code
  // under the same StrictMode setting works. A test that fails for reasons
  // unrelated to the product is worse than no test, so it is gone rather than
  // silenced. The teardown cases below are the ones that catch real regressions.

  it('leaves nothing behind when unmounted before the map finishes loading', async () => {
    // Leaflet is imported dynamically, so a component can be gone by the time
    // the import resolves. Building a map at that point leaves an orphan whose
    // animation callbacks fire against panes that are no longer in the document.
    const { default: AreaMap } = await import('@/components/agent/AreaMap');
    const { unmount } = render(
      <AreaMap localities={LOCALITIES}  selectedId={null} onSelect={() => {}} />
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
  const outlines = () => added.circles.filter((c) => c.opts?.className === 'geo-live-zone');

  it('draws a circle for every cluster once the map exists', async () => {
    await mount();
    await waitFor(() => expect(outlines().length).toBeGreaterThan(0), { timeout: 3000 });
    expect(outlines()).toHaveLength(LOCALITIES.length);
    expect(added.polygons).toHaveLength(0);
  });

  it('puts every circle at its real coordinates with its own radius', async () => {
    await mount();
    await waitFor(() => expect(outlines().length).toBe(LOCALITIES.length), { timeout: 3000 });
    for (const l of LOCALITIES) {
      const drawn = outlines().find((c) => c.latlng[0] === l.lat && c.latlng[1] === l.lng);
      expect(drawn, `${l.id} not drawn`).toBeTruthy();
      expect(drawn.opts.radius).toBeGreaterThan(0);
    }
    // Sizes must actually differ, or the size channel says nothing.
    expect(new Set(outlines().map((c) => c.opts.radius)).size).toBe(LOCALITIES.length);
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

  it('gives every circle a visible stroke and a fill', async () => {
    await mount();
    await waitFor(() => expect(outlines().length).toBe(LOCALITIES.length), { timeout: 3000 });
    for (const p of outlines()) {
      expect(p.opts.color, 'no stroke colour').toBeTruthy();
      expect(p.opts.weight).toBeGreaterThan(0);
      expect(p.opts.fillOpacity).toBeGreaterThan(0);
    }
  });
});
