import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/data/route';
import { POST } from '@/app/api/ai/route';

const post = (body) =>
  POST(new Request('http://localhost/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }));

describe('/api/data', () => {
  it('returns a working set the client can actually use', async () => {
    const seed = await (await GET()).json();
    expect(seed.customers.length).toBeGreaterThan(0);
    expect(seed.localities.length).toBeGreaterThan(0);
    expect(Object.keys(seed.products).length).toBeGreaterThan(0);
    expect(seed.offers).toEqual([]);
    expect(seed.intents).toEqual([]);
  });
});

describe('/api/ai', () => {
  it('answers a next-best-action request', async () => {
    const res = await post({ task: 'next-best-action', customerId: 'C-40117' });
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.product.name).toBeTruthy();
    expect(d.tone.opener).toBeTruthy();
  });

  it('answers a campaign request', async () => {
    const res = await post({ task: 'campaign', localityId: 'jodhpur-park', objective: 'acquisition' });
    expect(res.status).toBe(200);
    expect((await res.json()).headline).toBeTruthy();
  });

  it('404s an unknown customer rather than throwing', async () => {
    const res = await post({ task: 'next-best-action', customerId: 'C-00000' });
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBeTruthy();
  });

  it('400s an unknown task', async () => {
    expect((await post({ task: 'nonsense' })).status).toBe(400);
  });

  it('404s an unknown locality rather than throwing a 500', async () => {
    // Areas get renamed. A stale id should get a clear answer and the list of
    // real ones, not an unexplained server error.
    const res = await post({ task: 'campaign', localityId: 'an-old-name' });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain('an-old-name');
    expect(body.known.length).toBeGreaterThan(0);
  });

  it('400s a malformed body rather than crashing the route', async () => {
    expect((await post('{not json')).status).toBe(400);
  });

  it('defaults objective and budget when they are omitted', async () => {
    const res = await post({ task: 'campaign', localityId: 'santoshpur' });
    expect(res.status).toBe(200);
    expect((await res.json()).projection.conversions).toBeGreaterThan(0);
  });
});
