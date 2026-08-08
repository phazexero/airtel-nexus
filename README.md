# Airtel Nexus

Two independent applications sharing one data layer.

- **AltCare** at `/care` — the distributor console. It opens on a hub of the four main
  features; opening one puts them in a sidebar so you can move between them without going
  back out. Supervisors can edit the underlying data live from inside any feature.
  - `/care/journey` — the five-stage distributor journey, each stage linking into its tool
  - `/care/customer` — queue, customer 360, next best action
  - `/care/campaigns` — geocentric campaign studio
  - `/care/performance` — what the features are meant to move
- **Airtel One** at `/my` — the customer app. Recharge, plans, Payments Bank, offers,
  in-app onboarding.

They open straight into the product. They share state, so an offer sent from the console
arrives in the customer app without a refresh, and a tap in the customer app raises a hot
lead back on the queue.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000 and pick an app.

## Working as

There is nothing in front of either app. The console header carries an operator switcher:
**Shalini Iyer (supervisor)** can edit every record, **Arindam Roy (agent)** sees the same
console read only. Switching drops edit rights immediately, so the permission split stays
demonstrable without a gate in front of the product.

`lib/operators.js` holds the two operators. If a user directory is ever added, that is the
file it replaces, and `role` is what the edit gate should read from it instead of component
state.

## The demo path

1. Open **AltCare** in one tab. You land on the feature hub, working as the supervisor.
2. Open **Airtel One** in a second tab.
3. Open **Customer** from the hub, pick Sanyam Gupta, and send the recommended offer.
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
  brief, capturing a KYC image.

Failure has a path too. If the seed request fails, both apps show a retry rather than an
empty screen.

## Tests

```bash
npm test
```

103 tests across ten files, no watch mode needed:

- `tests/engine.test.jsx` — the decision engine against every customer, every
  temperament and language combination a supervisor can select, every locality and
  objective, plus the degenerate cases an edit can create (a zeroed-out area, a cleared
  number).
- `tests/flows.test.jsx` — the real journeys: load, edit and watch the script rewrite, send
  an offer, receive it in the customer app, complete onboarding, and see the hot lead come
  back on the queue.
- `tests/resilience.test.jsx` — cached state from an older build, corrupt cache, blocked
  `localStorage`, missing `matchMedia`, missing `BroadcastChannel`, failed reseed.
- `tests/customer-actions.test.jsx` — the exhaustion panel and the two alerts under it: the
  KYC imaging flow including a retake, the broadband request and the exact confirmation
  wording, and the request arriving on the distributor queue as a lead.
- `tests/family.test.jsx` — the household arithmetic and the family section. The saving is
  asserted as an identity against the bundle price and what is kept, not against a hardcoded
  figure, so the numbers stay checkable when the household data changes.
- `tests/vacation.test.jsx` — the Vacation Shield entry point, the locked fiber row, the
  saving calculation, the 90 day limit, scheduling, and resuming early.
- `tests/script-features.test.jsx` — the beats the launch film shoots: the SafeGuard banner
  and its wording, the self-arriving NBA push, the one-tap upgrade, the absence of an account
  name on either card, the phone stage with no rail, and the propensity score on the portal.
- `tests/live-map.test.jsx` — Leaflet is stubbed, and the stub refuses `getBounds()` on a
  layer that was never added to a map, exactly as the real library does. The sequencing is
  asserted, along with teardown: one map per container however many times the effect runs,
  animation cancelled before panes are removed, nothing left running after an unmount that
  lands mid-import, and the frame set without animation. React StrictMode double-invokes
  effects in development, and Leaflet reads element positions inside animation callbacks, so
  a map torn down mid-animation crashes on a pane that is no longer in the document. The
  sequencing asserted: zones drawn
  for every cluster, every one labelled, the owner marker placed. The map is built in an
  async effect, and a layer effect that runs before it exists produces a working basemap with
  nothing on it, which looks like a styling problem and is not one.
- `tests/boundaries.test.jsx` — the geometry itself: valid coordinate pairs in [lat, lng]
  order, no self-intersecting edges, consistent winding, each ring enclosing its own
  centroid, sane area, no ring overlapping another, and the campus inside its own cluster.
- `tests/campaign-map.test.jsx` — the population map, both colour modes, the live location
  marker, the three-line area summary and the AltAI suggestion box.
- `tests/imports.test.jsx` — every named import checked against what its target actually
  exports. This is what catches a half-applied update, where a component has been replaced
  but a module it imports from has not. Nothing else in the suite sees it: the failing screen
  throws at build time in the app, while the tests import those modules directly and find
  them fine.
- `tests/routes.test.jsx` — every screen assembled the way Next assembles it, layout wrapping
  layout wrapping page. Rendering a page on its own cannot catch a provider missing from a
  layout, because the test supplies its own. This is the file that catches
  "useDb must be used inside DbProvider". It also covers context identity across a second
  module evaluation, and the error boundaries.
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

Both apps have a light and dark switch in the top bar, and so does the landing page. The
defaults stay opposite on purpose: the console opens dark, the customer app opens light.
Each app remembers its own choice, so setting the console to light does not change the
customer app.

Implementation is two token families in `app/globals.css`. `--d-*` drives console surfaces
and `--ink / --paper / --canvas / --line` drives customer surfaces; a theme swaps the values
in both. No component knows a theme exists. An inline script in `app/layout.jsx` applies the
stored theme before first paint so there is no flash of the wrong one.

The map in the campaign studio stays dark in both themes. It is a display panel rather than
page chrome, and the pin contrast is tuned for a dark field.

## The customer app home screen

The home screen states the exhaustion first and then offers two responses to it, in that
order, because an offer only makes sense once the number behind it is on screen.

1. **Data this cycle** — 41.6 GB of 42 GB used, when it ran out, and what the top-ups cost.
2. **Switch to postpaid for unlimited data** — opens the KYC imaging flow. Three captures
   (ID front, ID back, live photo), each with a quality gate and a retake path, then
   verification. Capture is simulated; the camera integration point is marked in
   `components/customer/KycFlow.jsx`. The awkward part of KYC is not the camera, it is what
   happens when an image fails, which is why the retake path is built rather than implied.
3. **Bundle the whole household** — opens the Family section.
4. **Get a broadband connection** — raises a request and says so plainly: *We have raised a
   request for this to customer support*, with a reference and a timestamp. It does not
   pretend to provision anything, because that is not what this path does.

## One account

The app is Sanyam Gupta's account and only his. Pragya's and Debshishu's lines sit under it
rather than being accounts of their own, which is what makes a single SafeGuard window, a
single bill and a single bundle coherent. `ACCOUNT_OWNER` in `lib/family.js` is the one
place the owner is named.

His own line is the one still outside the bundle. That is deliberate: it is what the Family
recommendation exists to fix, and it is why the postpaid and KYC path on the home screen
still has something to do.

## Family bundling

`components/customer/FamilyTab.jsx`, reached from the Family tab or the household alert on
home. It runs in a fixed order, and the order is the argument:

1. **Combined every month** — one number, split across mobile lines, home broadband and
   subscriptions.
2. **Who is on what** — four members, four plans, four payment dates, with the top-up leak
   flagged on the line that has it.
3. **Where your data goes** — category shares and top apps across the household, read on the
   device. Only category totals are used, and the screen says so, because a household that
   is being told their app usage picked this offer will ask.
4. **What you are paying twice for** — two Netflix subscriptions in one house, found by
   `duplicateSubs()` rather than asserted.
5. **The recommendation** — the bundle price, the saving, every OTT app included, and the
   list of subscriptions it replaces.

Every figure reconciles against something shown above it, which is the point. `lib/family.js`
computes the saving as `current total − (bundle price + what you still pay for separately)`,
and the one subscription the bundle does not cover is named rather than quietly dropped. A
saving that survives being checked against real bills is worth more than a bigger one that
does not.

The recommendation is rules-derived like everything else here, with the AI integration point
marked in `recommendBundle()`. A model should choose the wording, never the arithmetic.

Moving the household to the bundle raises a request that lands on the distributor queue as a
hot lead. The broadband request also lands on the distributor queue as a hot lead, so the loop runs in
both directions: the console pushes offers to the app, and the app pushes intent back.

## Vacation Shield

`components/customer/VacationCare.jsx`, reached from a small card inside the Money tab.
Pauses billing on the home connection and the mobile pack for a set of dates.

It is a retention feature dressed as a convenience. The churn it prevents is the customer
who cancels before a long trip and never comes back, so the screen is built around removing
the reasons to cancel: the number stays, the plan stays, there is no reconnection charge,
and the saving is stated before they commit rather than after.

Two decisions worth knowing. The fiber row is shown but disabled until a connection exists
on the account, because a pause-only feature would be dead on a prepaid-only account and
hiding it entirely would waste the discovery. And the break is capped at 90 days a year with
the limit stated in the error, not enforced silently.

The console records the pause as retention rather than raising a lead. A customer who paused
is a customer who did not cancel, and putting them on a sales queue is the wrong response.

## Built for the launch film

Three surfaces exist because the film shows them full-frame, and each is written so the
words on screen match the words in the script.

**SafeGuard Grace-Day Shield** (`components/customer/SafeGuard.jsx`). A failed autopay on a
bundle is the worst kind of failed payment: one declined card takes down broadband, OTT and
two lines at once. That is the objection to bundling, so SafeGuard is the answer to it and
appears above everything else on the home screen when it fires. The window is flat: everything
bundled gets the same four days, whether that is one service or ten, because a customer
should not have to work out their own grace period.

**The next best action push** (`components/customer/NbaPush.jsx`). Carries exactly two things,
the trigger that produced it and one action, and arrives on its own rather than waiting for
an agent, because the claim is that the system noticed first. The arrival animates on mount
so the moment can be filmed on demand instead of waited for.

**Vacation Shield** one-tap. The full date picker is still underneath, but the common case is
a single button producing the exact confirmation the script needs.

Neither the SafeGuard banner nor the NBA card shows an account name. The film shoots two
characters' phones on one device, and a name on either card would break continuity in a
full-frame capture.

The customer app renders without the explainer rail, so the phone fills the stage cleanly for
screen capture.

## The campaign map

`/care/campaigns` opens on a map that takes the full workspace width, because on this
feature the map is the screen and everything below it answers a question the map raises.

The frame is centred on **IIFT Kolkata, Madurdaha (700107)**, and all six clusters sit within
7 km of it, most within 4. That is deliberate: a city-wide frame shows mostly water and
suburbs, while a campus-tight frame means every zone on screen is somewhere a distributor
could actually walk or ride to that afternoon. `USER_LOCATION` in `lib/data.js` is the one
place the centre is set, so moving the demo to another campus is a two-line change.

The clusters, and why each one is there:

| Cluster | Pin | Population | Play |
| --- | --- | --- | --- |
| Madurdaha and Chowbaga | 700107 | Students | Shared-flat fiber |
| Ruby and Kasba | 700078 | Traders and SMB | Merchant collect |
| Salt Lake Sector V | 700091 | IT workforce | Black bundle |
| Ballygunge | 700019 | Affluent families | Black bundle |
| Santoshpur and Survey Park | 700075 | Value households | Annual pack |
| Jodhpur Park and Dhakuria | 700068 | Retirees | Payments Bank deposit |

Every cluster is drawn as a **circle**, sized in metres from its subscriber base and coloured
by the product line it is the strongest prospect for. Circles rather than polygons on
purpose: a hand-drawn polygon looks like an official ward boundary without being one, and
that is a claim worth not making. A circle reads as "roughly here, roughly this big", which
is what this data supports.

There are no mode tabs. Colour answers which line, size answers how many subscribers, and the
legend names the three colours, so the whole map answers both questions at once instead of
making someone switch between them. Selecting a circle shows all three prospect scores with
the strongest marked, which is the one giving that circle its colour.

It is a real map. Tiles are CARTO basemaps over OpenStreetMap data, which need no API key
and no billing, and the basemap follows the light or dark theme. Attribution is rendered on
the map because the licence requires it.

**It falls back on its own.** Tiles are fetched at runtime from a third party, and the one
place this gets demonstrated is a venue with contended wifi. If the import fails or tiles
start erroring, the map switches to a schematic of the same clusters with every overlay and
interaction intact. Both draw their colours from the same function, so a zone cannot look
different depending on which map is running.

To skip live tiles entirely, set `NEXT_PUBLIC_LIVE_MAP=false`. Worth doing if you already
know the connection is bad, since it avoids the loading beat.

Three colour modes, one per product line: **Postpaid**, **Payments Bank**, **Broadband**.
Each line has its own colour family and four steps of intensity within it. The family says
which line you are looking at, the intensity says how good the prospect is; using one visual
channel for both questions would collapse them into one answer.

Each line is scored separately from headroom, value and a willingness proxy, so a cluster
that is already saturated scores low however rich it is. That separation is the point.
Jodhpur Park scores 92 for Payments Bank and 51 for Broadband, and a single blended
opportunity number would have averaged that difference away. Selecting an area shows all
three side by side with the best line named, because the line worth working is rarely the one
you arrived to sell.

The account owner's handset sits on the map as the only blue thing on screen, so it never
competes with a population colour or an opportunity band. Its position is fixed in
`USER_LOCATION` rather than read from the browser, because a demo that asks for location
permission on stage is a demo that stalls on stage.

Picking a zone opens two panels. The left is three lines on what the area actually holds,
and it is three because any more competes with the map above it. The right is the **AltAI
suggestion box**: three directions the campaign could take, each with its thrust, two
concrete moves, and what it trades away.

Those are directions, not a ranking dressed up as a choice. A distributor standing in front
of a cluster usually has several legitimate plays and is choosing between them, so handing
over a single option reads as a black box. The first listed is the one the rules engine would
have taken on its own, which keeps the default honest, and whichever is chosen carries into
the generated brief and shows up in the derivation trace.

## Checking a copy is complete

```bash
npm run check
```

Verifies every local import resolves and every named import exists in its target, across the
whole project, in about a second. If files from two different versions have been mixed, this
names them. Run it before anything else when a screen fails to build.

## When something breaks

Every level has an error boundary: `app/error.jsx`, one per app under `app/care` and
`app/my`, and `app/global-error.jsx` for a failure that takes the root layout with it. Each
shows the actual message with a retry that re-renders the section without reloading, plus a
reload and a way back. A demo that white-screens is over; a demo that shows one broken panel
with a working retry is recoverable in front of a room. `app/not-found.jsx` handles unknown
addresses.

**There is no React context anywhere in this app.**

A context is identified by object reference, and a bundler is free to place the same module
in more than one chunk. Turbopack does exactly that here: `DbProvider` ended up in one server
chunk and `useDb` in another, each with its own copy of the module and therefore its own
context object. Every screen then died with "must be used inside DbProvider" while sitting
plainly inside one. No provider placement fixes that, because the two copies were never going
to meet.

So the data store and the console's session and edit state are plain external stores held on
`globalThis` under shared symbols, read through `useSyncExternalStore`. Two copies of a module
resolve to the same store, and the provider is a convenience rather than a requirement:
`useDb()` starts the store itself if nothing has. There is no code path left that can throw
for want of a provider.

The console state matters as much as the data. With context, a chunk split there would not
have thrown, which is worse: edit mode would have silently stopped working and the operator
would have quietly reverted to the default, with nothing on screen to say why.

**The data provider sits in the root layout**, not in each app's layout. Per-app providers
meant every new route, error boundary and not-found page was one oversight away from
rendering a consumer outside the provider, which throws and takes the screen down. One
provider at the root removes the class of mistake, and the working set is warm by the time
either app is opened. `tests/routes.test.jsx` derives its provider by walking the root
layout's element tree, so it cannot supply a provider the app forgot, and it fails if an app
layout adds a second one — two stores would mean an offer sent on one surface never arriving
on the other.

React contexts are also keyed on the global registry rather than held in module scope. A context
is identified by object reference, so a module evaluated twice in one page, which is what
Fast Refresh does on edit and what a stale `.next` directory does on start, leaves the
provider publishing on one context while consumers read from another. The symptom is
"must be used inside" thrown from a component that is plainly inside the provider.

If you ever do see that message, the fix is almost always: stop the dev server, delete
`.next`, start again. The error text says so.

## Versions

Next 14.2.35, React 18.3.1, Vitest 2.1.9, jsdom 26.1.0, Leaflet 1.9.4. Every version is pinned
exactly, not with carets, so an incidental `npm install` cannot pull a major version in behind
you.

`engines` declares Node 18.18 or newer, and the dependency set is chosen to hold to that.
Newer jsdom releases require Node 22.13 or above and drag in an `undici` that wants 20.18.1,
which produces `EBADENGINE` warnings on a perfectly reasonable Node 22.14. jsdom 26 needs only
Node 18, pulls no `undici` at all, and behaves identically for these tests. A dependency that
narrows who can run the project is a poor trade for a version number.

This is deliberately not the newest stack. Next 16 defaults to Turbopack in development, and
Turbopack was splitting a shared module across two server chunks, which is what produced the
"must be used inside DbProvider" failures. Next 14.2 uses webpack, is on the patched 14.2 line,
and is the version this project has been demonstrated on. The dev overlay in Next 16 will call
14.2 outdated; it is patched, and "pinned to the patched 14.2 line" is a perfectly good answer
to a question about it.

The store rewrite from that episode is kept. It removed React context from the application
entirely in favour of external stores on `globalThis`, which behaves identically under webpack
and removes a whole class of bundler-dependent failure. Nothing about it is tied to Next 16.

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
