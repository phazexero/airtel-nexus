# Airtel Nexus

A working demo of both sides of the Airtel relationship in one app: the customer-facing
app and the care console the agent sits in, plus the two new capabilities the pitch is
about.

1. **Next best action** — the console reads four profile parameters (past experience,
   temperament, communication effectiveness, language response) and produces both *what*
   to offer and *how to say it* to that specific person.
2. **Geocentric campaign studio** — pick a pin-code cluster instead of a city, and the
   studio builds a campaign brief off that cluster's own dominant need, with a channel
   split and a revenue projection.

The two surfaces share one state, so the loop is real: send an offer from the console,
switch to the customer app, tap through, and a hot lead appears back on the queue.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

`vercel.json` is included, so framework, build command and region are already set. Nothing
to configure in the dashboard.

```bash
npx vercel          # preview URL
npx vercel --prod   # permanent URL
```

Or push the folder to a Git repo and import it at vercel.com/new. Serverless functions run
from `bom1` (Mumbai), so the `/api/ai` route stays close to an Indian audience once a real
model is wired in.

## Design notes

Palette is Airtel's own and nothing else: red, black, white. The intelligence layer is
marked by a red glow and a gradient edge rather than a second colour, so nothing on screen
is off-brand.

The two surfaces are deliberately opposite. The care console is dark, because it is an
eight-hour tool for a professional. The customer app is white, because that is what Airtel
Thanks looks like. Switching between them in a demo should feel like switching products,
not like switching tabs.

## Where the AI goes later

Nothing calls a model today. The demo runs on a transparent rules engine so it works
offline and gives the same answer twice, which is what you want when presenting.

Three seams are already cut, each marked in the source:

| File | What to change |
| --- | --- |
| `app/api/ai/route.js` | Fill in `callModel()`. The request and response contract is documented at the top of the file. |
| `lib/ai.js` | Flip `USE_REMOTE_MODEL` and uncomment the fetch inside `nextBestAction()` and `buildCampaign()`. |
| `.env.example` | Copy to `.env.local` and add the provider key. |

One design decision worth keeping when a real model goes in: **the model should write the
wording, not choose the offer.** The product recommendation stays rule-derived so it is
auditable and a bad generation can't turn into a bad offer or a compliance problem. The
tone, script and creative copy are the parts that genuinely benefit from generation.

## Structure

```
app/
  page.jsx          surface switcher
  api/ai/route.js   the single seam for a real model
lib/
  data.js           synthetic CRM, telemetry and area data
  ai.js             decision engine — scoring, NBA, campaign builder
  store.jsx         shared state across both surfaces
components/
  customer/         the phone: home, recharge, offers, onboarding, money, help
  agent/            the console: queue, customer 360, NBA, campaign studio, performance
```

## What is fake

All customer records, area statistics and projections are synthetic. The numbers on the
Performance tab are stated assumptions, not measured results, and they are kept in one
array (`BEFORE_AFTER` in `components/agent/Performance.jsx`) so they are easy to find and
easy to argue with.
