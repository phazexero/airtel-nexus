'use client';

import { useEffect, useRef, useState } from 'react';
import { POPULATION_TYPES, USER_LOCATION } from '@/lib/data';
import { opportunityBand } from '@/lib/ai';

// ===========================================================================
//  AREA MAP
//
//  Real tiles when the network allows, a schematic when it does not.
//
//  That is not belt and braces. Tiles are fetched at runtime from a third
//  party, and the one place this gets demonstrated is a venue with contended
//  wifi. A map that fails to a grey rectangle mid-pitch is worse than a map
//  that never claimed to be live, so the fallback is a first-class path and
//  every overlay behaves identically in both.
//
//  Tiles are CARTO basemaps over OpenStreetMap data. No API key, no billing,
//  attribution required and rendered on the map.
//
//  Set NEXT_PUBLIC_LIVE_MAP=false to force the schematic, which is what to do
//  if you are presenting somewhere with no reliable connection.
// ===========================================================================

const TILES = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
};
const ATTRIBUTION = '&copy; OpenStreetMap contributors &copy; CARTO';
// Campus first. Everything on this map is inside a few kilometres of it, so a
// tighter centre and zoom beats a city-wide view that shows mostly nothing.
const CENTRE = [USER_LOCATION.lat, USER_LOCATION.lng];
const ZOOM = 13;
const TILE_FAIL_LIMIT = 4;

// Bounds of the schematic frame. Only used when tiles are unavailable.
const BOUNDS = { minLat: 22.478, maxLat: 22.585, minLng: 88.348, maxLng: 88.446 };
const OPPORTUNITY_FILL = ['#4a2020', '#8a1c1c', '#cc1616', '#ff2e2e'];

export function zoneColour(loc, mode) {
  return mode === 'population'
    ? POPULATION_TYPES[loc.population]?.colour ?? '#6b7280'
    : OPPORTUNITY_FILL[opportunityBand(loc).band];
}

// Metres. Big enough to read as a designated area at this zoom rather than as
// a dot, scaled by subscriber base so the biggest cluster is visibly bigger.
export function zoneRadius(loc, max = 58200) {
  return 620 + (loc.subscribers / max) * 1180;
}

function project(pt) {
  return {
    x: ((pt.lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100,
    y: (1 - (pt.lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100,
  };
}

function currentTheme() {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export default function AreaMap({ localities, mode, selectedId, onSelect }) {
  const wantLive = process.env.NEXT_PUBLIC_LIVE_MAP !== 'false';
  const [live, setLive] = useState(false);
  const [failed, setFailed] = useState(!wantLive);

  if (failed || !wantLive) {
    return (
      <SchematicMap localities={localities} mode={mode} selectedId={selectedId} onSelect={onSelect} live={false} />
    );
  }

  return (
    <>
      <LeafletMap
        localities={localities}
        mode={mode}
        selectedId={selectedId}
        onSelect={onSelect}
        onReady={() => setLive(true)}
        onFail={() => setFailed(true)}
      />
      {!live && (
        <div className="geo-loading">
          <span className="kyc-spinner" aria-hidden="true" />
          <span>Loading map tiles…</span>
        </div>
      )}
    </>
  );
}

// --- live -------------------------------------------------------------------

function LeafletMap({ localities, mode, selectedId, onSelect, onReady, onFail }) {
  const host = useRef(null);
  const map = useRef(null);
  const layers = useRef({ tiles: null, zones: [], me: null });
  const tileFails = useRef(0);
  const fitted = useRef(false);
  const [theme, setTheme] = useState(currentTheme);
  // The map is built inside an async effect. Without this flag the layer effect
  // below runs first, finds no map, returns early, and never runs again,
  // because none of its dependencies change after mount. The result is a
  // perfectly working basemap with nothing drawn on it.
  const [mapReady, setMapReady] = useState(false);

  // Follow the app theme, so a light console does not get a dark basemap.
  useEffect(() => {
    const obs = new MutationObserver(() => setTheme(currentTheme()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};

    (async () => {
      let L;
      try {
        L = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');
      } catch {
        if (!cancelled) onFail();
        return;
      }
      // React StrictMode mounts, unmounts and remounts effects in development.
      // Without both of these guards you can end up building a second map on a
      // container that already has one, or building one after the component has
      // gone, and Leaflet then runs animation callbacks against a pane that is
      // no longer in the document.
      if (cancelled || !host.current || map.current) return;

      const m = L.map(host.current, {
        center: CENTRE,
        zoom: ZOOM,
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: false, // a map that hijacks the page scroll is a nuisance
      });
      map.current = m;

      const tiles = L.tileLayer(TILES[currentTheme()], { attribution: ATTRIBUTION, maxZoom: 18 });
      tiles.on('tileerror', () => {
        tileFails.current += 1;
        // A handful of misses is normal at the edge of the viewport. A wall of
        // them means the network is gone, and that is when we bail out.
        if (tileFails.current >= TILE_FAIL_LIMIT && !cancelled) onFail();
      });
      tiles.on('load', () => {
        if (!cancelled) onReady();
      });
      tiles.addTo(m);
      layers.current.tiles = tiles;

      // Leaflet measures its container on creation. If that happens a frame
      // before layout settles it centres on the wrong place, so remeasure.
      // Guarded, because a queued frame can outlive the map.
      const resize = () => {
        if (map.current === m) m.invalidateSize();
      };
      requestAnimationFrame(resize);
      window.addEventListener('resize', resize);
      setMapReady(true);

      // Fires even if `load` never does, so the spinner cannot hang forever.
      const settle = setTimeout(() => {
        if (!cancelled) onReady();
      }, 2500);

      cleanup = () => {
        clearTimeout(settle);
        window.removeEventListener('resize', resize);
        // Cancel any pan or zoom still in flight. Without this, Leaflet's
        // transition-end handler fires after the panes are gone and reads
        // position off an element that no longer exists.
        m.stop();
        m.remove();
        map.current = null;
        setMapReady(false);
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [onFail, onReady]);

  // Swap the basemap when the theme changes, without rebuilding the map.
  useEffect(() => {
    if (layers.current.tiles) layers.current.tiles.setUrl(TILES[theme]);
  }, [theme]);

  // Zones and the live marker are redrawn whenever the data or mode changes.
  useEffect(() => {
    const m = map.current;
    if (!mapReady || !m) return undefined;
    let cancelled = false;

    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || map.current !== m) return;

      layers.current.zones.forEach((z) => z.remove());
      layers.current.zones = [];
      layers.current.me?.remove();

      const biggest = Math.max(...localities.map((l) => l.subscribers), 1);

      for (const loc of localities) {
        const colour = zoneColour(loc, mode);
        const on = loc.id === selectedId;

        // A soft halo under each zone, so an area reads as a designated patch
        // of the city rather than as a circle someone drew on it.
        const halo = L.circle([loc.lat, loc.lng], {
          radius: zoneRadius(loc, biggest) * 1.5,
          stroke: false,
          fillColor: colour,
          fillOpacity: on ? 0.18 : 0.09,
          interactive: false,
          className: 'geo-live-halo',
        }).addTo(m);

        const circle = L.circle([loc.lat, loc.lng], {
          radius: zoneRadius(loc, biggest),
          color: colour,
          weight: on ? 3.5 : 2,
          fillColor: colour,
          fillOpacity: on ? 0.55 : 0.28,
          className: 'geo-live-zone',
        }).addTo(m);

        // Labelled permanently. Six areas is few enough that naming them all
        // beats making someone hover to find out what they are looking at.
        circle.bindTooltip(
          `<b>${loc.name}</b><span>${
            mode === 'population'
              ? POPULATION_TYPES[loc.population]?.label ?? ''
              : opportunityBand(loc).label
          }</span>`,
          {
            direction: 'top',
            offset: [0, -6],
            className: `geo-tip${on ? ' is-on' : ''}`,
            permanent: true,
          }
        );
        circle.on('click', () => onSelect(loc.id));
        layers.current.zones.push(halo, circle);
      }

      layers.current.me = L.marker([USER_LOCATION.lat, USER_LOCATION.lng], {
        icon: L.divIcon({
          className: 'geo-live-me',
          html: `<i></i><span><b>${USER_LOCATION.name}</b><small>${USER_LOCATION.label} · ±${USER_LOCATION.accuracyM}m</small></span>`,
          iconSize: [0, 0],
        }),
        interactive: false,
        zIndexOffset: 1000,
      }).addTo(m);

      // Frame every cluster plus the campus, so nothing can sit off screen
      // whatever the container ends up being.
      //
      // Built from coordinates rather than from the layers. A Leaflet circle
      // only knows its bounds once it is attached to a map, so asking an
      // unattached one throws, and asking a featureGroup that contains one
      // throws the same way from further down the stack.
      if (!fitted.current && localities.length) {
        const bounds = L.latLngBounds([
          ...localities.map((l) => [l.lat, l.lng]),
          [USER_LOCATION.lat, USER_LOCATION.lng],
        ]).pad(0.18);
        // Not animated. The frame is set once on load, so the animation buys
        // nothing and its transition-end callback is the thing that crashes if
        // the map is torn down while it is running.
        m.fitBounds(bounds, { padding: [44, 44], animate: false });
        fitted.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [localities, mode, selectedId, onSelect, mapReady]);

  return <div className="geo-canvas geo-live" ref={host} />;
}

// --- fallback ---------------------------------------------------------------

export function SchematicMap({ localities, mode, selectedId, onSelect }) {
  const me = project(USER_LOCATION);

  return (
    <div className="geo-canvas">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="geo-svg" aria-hidden="true">
        {[...Array(11)].map((_, i) => (
          <line key={`v${i}`} x1={i * 10} y1="0" x2={i * 10} y2="100" className="geo-grid" />
        ))}
        {[...Array(11)].map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 10} x2="100" y2={i * 10} className="geo-grid" />
        ))}
        {/* The Bypass, which is the spine every one of these clusters hangs off */}
        <path d="M64 -4 C 58 20, 52 40, 47 58 C 42 76, 34 90, 28 104" className="geo-river" />
      </svg>

      {localities.map((l) => {
        const { x, y } = project(l);
        const on = l.id === selectedId;
        return (
          <button
            key={l.id}
            className="geo-zone"
            data-on={on}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              '--zone': zoneColour(l, mode),
              '--size': `${34 + (l.subscribers / 63800) * 40}px`,
            }}
            onClick={() => onSelect(l.id)}
            aria-label={`Select ${l.name}`}
            aria-pressed={on}
          >
            <i />
            <span>
              <b>{l.name}</b>
              <small>
                {mode === 'population'
                  ? POPULATION_TYPES[l.population]?.label
                  : opportunityBand(l).label}
              </small>
            </span>
          </button>
        );
      })}

      <div className="geo-me" style={{ left: `${me.x}%`, top: `${me.y}%` }}>
        <i />
        <span>
          <b>{USER_LOCATION.name}</b>
          <small>
            {USER_LOCATION.place} · ±{USER_LOCATION.accuracyM}m
          </small>
        </span>
      </div>
    </div>
  );
}
