# Airtel Nexus

Two independent applications sharing one data layer.

- **Nexus Care** at `/care` — the operator console. Signing in lands on a hub of the three
  main features; opening one puts them in a sidebar so you can move between them without
  going back out. Supervisors can edit the underlying data live from inside any feature.
  - `/care/customer` — queue, customer 360, next best action
  - `/care/campaigns` — geocentric campaign studio
  - `/care/performance` — what the two features are meant to move
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

## Demo credentials

| App | Sign in with | Notes |
| --- | --- | --- |
| Nexus Care | `a.roy@airtel.demo` / `care1234` | Agent. Read only. |
| Nexus Care | `s.iyer@airtel.demo` / `super1234` | Supervisor. Can edit every record. |
| Airtel One | `9830104471`, code `481902` | Ananya Sen, first in the care queue. The code is shown on screen. |

**These are demo logins, not authentication.** The credentials sit in `lib/auth.js` in plain
text. The session mechanics are already correct — HMAC-signed, httpOnly, sameSite lax,
eight-hour expiry — but before anything real goes behind this you need a user table, hashed
passwords, `SESSION_SECRET` as a required env var with no fallback, rate limiting on the
login route, and a real SMS provider for the OTP. The notes at the top of `lib/auth.js` say
the same thing next to the code.

## The demo path

1. Sign into **Nexus Care** as the supervisor, in one tab. You land on the feature hub.
2. Sign into **Airtel One** in a second tab.
3. Open **Customer** from the hub, pick Ananya Sen, and send the recommended offer.
4. Watch it land in the other tab, with no refresh. Tap "Tell me more".
5. Back on the console, a hot lead is now sitting above the queue.
6. Turn on **Edit data** and change her temperament from analytical to frustrated. The
   script rewrites itself while you watch.

Step 6 is the one worth rehearsing. It is the clearest evidence that the recommendation is
reasoning over the four profile parameters rather than reciting a fixed script.

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

- `app/care/loading.jsx` and `app/my/loading.jsx` stream while the server resolves the
  session and layout.
- `DbProvider` fetches `/api/data` and holds `status: 'loading'` until it lands. The seed
  route has a deliberate 700 ms delay so the skeletons are visible.
- Individual actions have their own busy states: sending an offer, building a campaign
  brief, signing in.

Failure has a path too. If the seed request fails, both apps show a retry rather than an
empty screen.

## Deploy to Vercel

`vercel.json` is included, so framework, build command and region are set. Serverless
functions run from `bom1` (Mumbai).

```bash
npx vercel          # preview URL
npx vercel --prod   # permanent URL
```

Set `SESSION_SECRET` in the Vercel dashboard. It falls back to a hardcoded value so the
demo runs without configuration, which is fine for a pitch and not fine for anything else.

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
middleware.js         route guards, one per app
app/
  page.jsx            landing, picks an app
  care/
    page.jsx          feature hub, the landing page inside the console
    (workspace)/      the three features, all sharing the sidebar layout
  my/                 customer app + its login
  api/auth/           login and logout
  api/data/           seed endpoint
  api/ai/             the single seam for a real model
lib/
  auth.js             demo users, signed session cookies
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
