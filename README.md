# Airtel Nexus

Two independent applications sharing one data layer.

- **Nexus Care** at `/care` — the distributor console. It opens on a hub of the four main
  features; opening one puts them in a sidebar so you can move between them without going
  back out. Supervisors can edit the underlying data live from inside any feature.
  - `/care/journey` — the five-stage distributor journey, each stage linking into its tool
  - `/care/customer` — queue, customer 360, next best action
  - `/care/campaigns` — geocentric campaign studio
  - `/care/performance` — what the features are meant to move
- **Airtel One** at `/my` — the customer app. Recharge, plans, Payments Bank, offers,
  in-app onboarding.

They have separate sign-ins and separate sessions: signing into one does not sign you into
the other. They share state, so an offer sent from the console arrives in the customer app
without a refresh, and a tap in the customer app raises a hot lead back on the queue.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000 and pick an app.

## No sign-in

Both apps open straight into the product. The console header has an operator switcher
instead: **Shalini Iyer (supervisor)** can edit every record, **Arindam Roy (agent)** sees
the same console read only. Switching accounts drops edit rights immediately, so the
permission split is still demonstrable without a login step in front of it.

If authentication goes back in, `lib/operators.js` is what a user table replaces, and
`role` is what an edit gate should read from a session instead of component state.

## The demo path

1. Open **Nexus Care** in one tab. You land on the feature hub, working as the supervisor.
2. Open **Airtel One** in a second tab.
3. Open **Customer** from the hub, pick Ananya Sen, and send the recommended offer.
4. Watch it land in the other tab, with no refresh. Tap "Tell me more".
5. Back on the console, a hot lead is now sitting above the queue.
6. Turn on **Edit data** and change her temperament from analytical to frustrated. The
   script rewrites itself while you watch.

Step 6 is the one worth rehearsing. It is the clearest evidence that the recommendation is
reasoning over the four profile parameters rather than reciting a fixed script.

## The distributor journey

`/care/journey` holds the five stages from the journey artefact: understand my market,
prioritise the right leads, engage and convert, grow the business, track and improve. Each
stage carries what the distributor does, what they are actually asking at that moment, the
enabler that answers it, and the target it moves.

The stages are not a poster. Each one links straight into the feature that runs it, so the
journey doubles as the map of the console. Stage one opens the campaign studio, stages two
through four open the queue and customer 360, stage five opens performance.

The figures on each stage are targets the pitch argues for, not measured results, and the
page says so.

## Editing

Edit mode is supervisor-only and lives in the console header. It turns these into live
fields: customer name, plan, monthly value, tenure, reason for contact, all four profile
parameters and their notes, the signal list, area statistics, campaign evidence, and product
name, price and offer copy. Every change recomputes the recommendation, the confidence
score and the campaign projection immediately.

Changes persist to `localStorage` and broadcast to other open tabs. **Reset demo data** in
the header puts everything back to the seed.

## Loading states

Three layers, all real rather than decorative:

- `app/care/loading.jsx` and `app/my/loading.jsx` stream while the route resolves.
- `DbProvider` fetches `/api/data` and holds `status: 'loading'` until it lands. The seed
  route has a deliberate 700 ms delay so the skeletons are visible.
- Individual actions have their own busy states: sending an offer, building a campaign
  brief, signing in.

Failure has a path too. If the seed request fails, both apps show a retry rather than an
empty screen.

## Tests

```bash
npm test
```

59 tests across six files, no watch mode needed:

- `tests/engine.test.jsx` — the decision engine against every customer, every
  temperament and language combination a supervisor can select, every locality and
  objective, plus the degenerate cases an edit can create (a zeroed-out area, a cleared
  number).
- `tests/flows.test.jsx` — the real journeys: load, edit and watch the script rewrite, send
  an offer, receive it in the customer app, complete onboarding, and see the hot lead come
  back on the queue.
- `tests/resilience.test.jsx` — cached state from an older build, corrupt cache, blocked
  `localStorage`, missing `matchMedia`, missing `BroadcastChannel`, failed reseed.
- `tests/layout.test.jsx` — grid structure. The console is the only grid container, and each
  feature contributes exactly the children its column count expects. A nested grid container
  is invisible on a laptop and obvious on a monitor, so it gets asserted rather than eyeballed.
- `tests/api.test.jsx` — both API routes including malformed bodies and unknown ids.
- `tests/styles.test.jsx` — brace balance, undefined custom properties, classes with no
  matching rule, and imports of deleted modules.

The setup file fails any test that logs a React warning, which is what catches hydration
mismatches and missing keys rather than leaving them in the console for someone to notice
during a demo.

## Deploy to Vercel

`vercel.json` is included, so framework, build command and region are set. Serverless
functions run from `bom1` (Mumbai).

```bash
npx vercel          # preview URL
npx vercel --prod   # permanent URL
```

No environment variables are required.

## Where the AI goes later

Nothing calls a model today. The demo runs on a transparent rules engine so it works
offline and gives the same answer twice, which is what you want when presenting.

| File | What to change |
| --- | --- |
| `app/api/ai/route.js` | Fill in `callModel()`. The request and response contract is documented at the top. |
| `lib/ai.js` | Flip `USE_REMOTE_MODEL` and uncomment the fetch inside `nextBestAction()` and `buildCampaign()`. |
| `lib/db.jsx` | Replace the `localStorage` read and write with API calls when a database goes in. |

One design decision worth keeping: **the model writes the wording, the rules choose the
offer.** The product recommendation stays rule-derived so it is auditable and a bad
generation cannot become a bad offer. Tone, script and creative copy are the parts that
genuinely benefit from generation.

## Structure

```
app/
  page.jsx            landing, picks an app
  care/
    page.jsx          feature hub, the landing page inside the console
    (workspace)/      the four features, all sharing the sidebar layout
  my/                 customer app
  api/data/           seed endpoint
  api/ai/             the single seam for a real model
lib/
  operators.js        console operators and the customer account
  journey.js          the five-stage distributor journey
  db.jsx              async load, edits, persistence, cross-tab sync
  data.js             synthetic CRM, telemetry and area data
  ai.js               scoring, next best action, campaign builder
components/
  agent/  customer/  ui/
```

## Themes

Both apps have a light and dark switch, in the top bar and on each login screen. The
defaults stay opposite on purpose: the console opens dark, the customer app opens light.
Each app remembers its own choice, so setting the console to light does not change the
customer app.

Implementation is two token families in `app/globals.css`. `--d-*` drives console surfaces
and `--ink / --paper / --canvas / --line` drives customer surfaces; a theme swaps the values
in both. No component knows a theme exists. An inline script in `app/layout.jsx` applies the
stored theme before first paint so there is no flash of the wrong one.

The map in the campaign studio stays dark in both themes. It is a display panel rather than
page chrome, and the pin contrast is tuned for a dark field.

## Layout

`app/care/(workspace)/layout.jsx` owns the only grid. Features contribute children to it and
never wrap themselves in another `.console`, because a nested grid declares its own columns,
fills only the first few, and strands the rest as dead space on wide screens.

Rail widths come from `--nav-w` and `--queue-w` on `.console`, so a breakpoint changes two
custom properties rather than repeating a whole `grid-template-columns`. Above 1500px the
queue grows with the viewport up to a ceiling and the workspace keeps a readable measure;
below 1340px the sidebar drops to icons; below 1000px everything stacks.

The content grids use `repeat(auto-fit, minmax(...))` so they size from whatever container
they land in rather than from a viewport guess. That is what keeps a wrong container width
from collapsing four stat cards into four vertical strips.

## Design notes

Palette is Airtel's own and nothing else: red, black, white. The intelligence layer is
marked by a red glow and a gradient edge rather than a second colour.

The console and the customer app are deliberately different by default. The console is a
tool someone stares at for eight hours; the customer app is a consumer product. They should
not feel like two tabs of one thing.

## What is fake

All customer records, area statistics and projections are synthetic. The numbers on the
Performance tab are stated assumptions, not measured results, and they sit in one array
(`BEFORE_AFTER` in `components/agent/Performance.jsx`) so they are easy to find and easy to
argue with.
