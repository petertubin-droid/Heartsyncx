// @vitest-environment jsdom
// Regression test for the "$0.00 membership page" bug (2026-10-01):
// raw `plans` table rows carry a single `price` + `billing_cycle` column -
// not price_monthly/price_yearly. normalizeDbPlans must derive the
// monthly/yearly pair so the public /subscription page and the Admin
// Console tier editor see real prices instead of falling back to 0.
import { describe, it, expect } from 'vitest';
import { normalizeDbPlans } from '../../store';

describe('normalizeDbPlans (plans table -> app Plan shape)', () => {
  it('derives monthly and yearly prices from the DB price column', () => {
    const raw: any[] = [
      { id: 'p1', name: 'HeartSync Premium', price: 9.99, interval: 'month', billing_cycle: 'monthly', features: ['Full access'] },
      { id: 'p2', name: 'Pro Couple', price: 19, interval: 'month', billing_cycle: 'monthly', features: null }
    ];
    const plans = normalizeDbPlans(raw);
    expect(plans[0].price_monthly).toBe(9.99);
    expect(plans[0].price_yearly).toBe(99.9);
    expect(plans[1].price_monthly).toBe(19);
    expect(plans[1].price_yearly).toBe(190);
  });

  it('keeps an explicit price_monthly/price_yearly when present', () => {
    const plans = normalizeDbPlans([
      { id: 'p3', name: 'Custom', price: 5, price_monthly: 14.99, price_yearly: 120, billing_cycle: 'monthly', features: [] }
    ]);
    expect(plans[0].price_monthly).toBe(14.99);
    expect(plans[0].price_yearly).toBe(120);
    // canonical price follows the edited monthly value for server upserts
    expect((plans[0] as any).price).toBe(14.99);
  });

  it('handles free tiers and missing/invalid prices without NaN', () => {
    const plans = normalizeDbPlans([
      { id: 'p4', name: 'Free Explorer', price: 0, billing_cycle: 'monthly', features: [] },
      { id: 'p5', name: 'Broken Row', price: null, billing_cycle: 'monthly' }
    ]);
    expect(plans[0].price_monthly).toBe(0);
    expect(plans[0].price_yearly).toBe(0);
    expect(Number.isFinite(plans[1].price_monthly)).toBe(true);
    expect(plans[1].features).toEqual([]);
  });

  it('treats a yearly-billed DB price as the yearly price', () => {
    const plans = normalizeDbPlans([
      { id: 'p6', name: 'Annual Pass', price: 99.99, interval: 'year', billing_cycle: 'yearly', features: [] }
    ]);
    expect(plans[0].price_monthly).toBe(10);
    expect(plans[0].price_yearly).toBe(99.99);
  });

  it('always returns an array-safe features list', () => {
    const plans = normalizeDbPlans([{ id: 'p7', name: 'No Features', price: 1, billing_cycle: 'monthly' }]);
    expect(plans[0].features).toEqual([]);
  });
});
