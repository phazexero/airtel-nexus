import { describe, it, expect } from 'vitest';
import { CUSTOMERS, LOCALITIES, PRODUCTS } from '@/lib/data';
import { nextBestAction, buildCampaign, propensity, formatINR } from '@/lib/ai';
import { JOURNEY } from '@/lib/journey';
import { OPERATORS, DEFAULT_OPERATOR, ACCOUNT } from '@/lib/operators';

const loc = (c) => LOCALITIES.find((l) => l.id === c.locality);

describe('decision engine', () => {
  it('returns a complete decision for every customer in the queue', () => {
    for (const c of CUSTOMERS) {
      const d = nextBestAction(c, loc(c), PRODUCTS);
      expect(d.product, c.id).toBeTruthy();
      expect(d.product.name, c.id).toBeTruthy();
      expect(typeof d.product.price, c.id).toBe('number');
      expect(d.headline, c.id).toBeTruthy();
      expect(d.risk, c.id).toBeTruthy();
      expect(d.why.length, c.id).toBeGreaterThan(0);
      expect(d.confidence, c.id).toBeGreaterThanOrEqual(6);
      expect(d.confidence, c.id).toBeLessThanOrEqual(96);
      expect(d.tone.opener, c.id).toBeTruthy();
      expect(d.tone.closer, c.id).toBeTruthy();
      expect(d.tone.language, c.id).toBeTruthy();
      expect(d.tone.pace, c.id).toBeTruthy();
      expect(d.inputs).toHaveLength(4);
    }
  });

  it('produces an opener for every temperament and language a supervisor can pick', () => {
    const temperaments = ['warm', 'analytical', 'skeptical', 'anxious', 'impatient', 'frustrated'];
    const languages = ['English', 'Bengali', 'Hindi'];
    const experiences = ['good', 'neutral', 'mixed', 'poor'];
    const comms = ['high', 'medium', 'low'];
    const base = CUSTOMERS[0];
    for (const t of temperaments) {
      for (const l of languages) {
        for (const e of experiences) {
          for (const cm of comms) {
            const c = { ...base, profile: { ...base.profile, temperament: t, language: l, pastExperience: e, communication: cm } };
            const d = nextBestAction(c, loc(base), PRODUCTS);
            expect(d.tone.opener, `${t}/${l}`).toBeTruthy();
            expect(d.tone.closer, `${t}/${l}`).toBeTruthy();
            expect(d.tone.language, `${t}/${l}`).toBeTruthy();
            expect(Number.isFinite(d.confidence)).toBe(true);
          }
        }
      }
    }
  });

  it('survives an edited profile with an empty or unexpected value', () => {
    const c = { ...CUSTOMERS[0], profile: { ...CUSTOMERS[0].profile, temperament: 'warm', language: 'English' }, arpu: 0, tenure: 0, signals: [] };
    const d = nextBestAction(c, loc(CUSTOMERS[0]), PRODUCTS);
    expect(Number.isFinite(d.confidence)).toBe(true);
    expect(propensity(c)).toBeGreaterThanOrEqual(6);
  });

  it('builds a campaign for every locality and objective', () => {
    for (const l of LOCALITIES) {
      for (const o of ['acquisition', 'upsell', 'retention']) {
        const b = buildCampaign(l, o, 250000, PRODUCTS);
        expect(b.headline, l.id).toBeTruthy();
        expect(b.channels.length, l.id).toBeGreaterThan(0);
        expect(b.channels.reduce((s, c) => s + c.split, 0), l.id).toBe(100);
        expect(Number.isFinite(b.projection.reach)).toBe(true);
        expect(Number.isFinite(b.projection.conversions)).toBe(true);
        expect(Number.isFinite(b.projection.cac)).toBe(true);
        expect(b.projection.cac, l.id).not.toBe(Infinity);
        expect(b.projection.payback, l.id).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('does not divide by zero when an edit zeroes out the area', () => {
    const dead = { ...LOCALITIES[0], subscribers: 0, arpu: 0, prepaidShare: 0, fiberPenetration: 0, savingsIndex: 0 };
    const b = buildCampaign(dead, 'upsell', 250000, PRODUCTS);
    expect(Number.isFinite(b.projection.cac)).toBe(true);
    expect(Number.isFinite(b.projection.payback)).toBe(true);
  });

  it('accepts a locality id as well as a locality object', () => {
    expect(buildCampaign('santoshpur', 'retention').headline).toBeTruthy();
  });

  it('formats rupees across magnitudes', () => {
    expect(formatINR(500)).toBe('₹500');
    expect(formatINR(12000)).toBe('₹12.0k');
    expect(formatINR(250000)).toBe('₹2.50 L');
    expect(formatINR(30000000)).toBe('₹3.00 Cr');
  });
});

describe('static content', () => {
  it('numbers the journey stages 1..5 with no gaps', () => {
    expect(JOURNEY.map((s) => s.n)).toEqual([1, 2, 3, 4, 5]);
  });

  it('points every journey stage at a route that exists', () => {
    const routes = ['/care/journey', '/care/customer', '/care/campaigns', '/care/performance'];
    for (const s of JOURNEY) expect(routes, s.title).toContain(s.feature.href);
  });

  it('gives every journey stage its full row of content', () => {
    for (const s of JOURNEY) {
      expect(s.title && s.sub && s.action && s.asks && s.helps, s.n).toBeTruthy();
      expect(s.enabler.name && s.enabler.detail, s.n).toBeTruthy();
      expect(s.proof.length, s.n).toBeGreaterThan(0);
    }
  });

  it('keeps every customer pointed at a real locality and every locality at a real product', () => {
    for (const c of CUSTOMERS) expect(LOCALITIES.map((l) => l.id), c.id).toContain(c.locality);
    for (const l of LOCALITIES) expect(Object.keys(PRODUCTS), l.id).toContain(l.product);
  });

  it('has exactly one supervisor and a default that can edit', () => {
    expect(OPERATORS.filter((o) => o.role === 'supervisor')).toHaveLength(1);
    expect(DEFAULT_OPERATOR.role).toBe('supervisor');
    expect(CUSTOMERS.map((c) => c.id)).toContain(ACCOUNT.id);
  });
});
