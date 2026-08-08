import { NextResponse } from 'next/server';
import { nextBestAction, buildCampaign } from '@/lib/ai';
import { customerById, LOCALITIES } from '@/lib/data';

// ===========================================================================
//  The single seam for a real model.
//
//  Today this route answers from the same rules engine the client uses, so the
//  demo behaves identically whether or not it is called. When a model goes in,
//  only callModel() below changes. The response contract stays the same:
//
//    POST /api/ai
//    { task: 'next-best-action', customerId }        -> decision object
//    { task: 'campaign', localityId, objective, budget } -> campaign object
//
//  Keep the contract, and neither the console nor the app needs an edit.
// ===========================================================================

async function callModel(_prompt) {
  // Wire the provider here, e.g.:
  //
  //   const res = await fetch('https://api.anthropic.com/v1/messages', {
  //     method: 'POST',
  //     headers: {
  //       'content-type': 'application/json',
  //       'x-api-key': process.env.AI_API_KEY,
  //       'anthropic-version': '2023-06-01',
  //     },
  //     body: JSON.stringify({
  //       model: process.env.AI_MODEL,
  //       max_tokens: 1200,
  //       system: SYSTEM_PROMPT,          // profile params + product catalogue + guardrails
  //       messages: [{ role: 'user', content: _prompt }],
  //     }),
  //   });
  //   return JSON.parse((await res.json()).content[0].text);
  //
  // Two things to keep when that happens: the offer itself should stay
  // rule-derived so it stays auditable, and the model should only be asked for
  // the wording. That keeps a bad generation from becoming a bad offer.
  return null;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Send a JSON body with a task field.' }, { status: 400 });
  }

  const { task } = body ?? {};

  if (task === 'next-best-action') {
    const customer = customerById(body.customerId);
    if (!customer) {
      return NextResponse.json({ error: `No customer with id ${body.customerId}.` }, { status: 404 });
    }
    const remote = await callModel(body);
    return NextResponse.json(remote ?? nextBestAction(customer));
  }

  if (task === 'campaign') {
    // An unknown id used to reach buildCampaign and throw somewhere inside it,
    // which surfaced as a 500 with no explanation. Areas get renamed; the route
    // should say so rather than fall over.
    const locality = LOCALITIES.find((l) => l.id === body.localityId);
    if (!locality) {
      return NextResponse.json(
        {
          error: `No locality with id ${body.localityId}.`,
          known: LOCALITIES.map((l) => l.id),
        },
        { status: 404 }
      );
    }
    const remote = await callModel(body);
    return NextResponse.json(
      remote ?? buildCampaign(locality, body.objective ?? 'upsell', body.budget ?? 250000)
    );
  }

  return NextResponse.json(
    { error: "task must be 'next-best-action' or 'campaign'." },
    { status: 400 }
  );
}
