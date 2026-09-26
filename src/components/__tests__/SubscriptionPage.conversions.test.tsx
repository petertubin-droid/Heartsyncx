// @vitest-environment jsdom
// GA4 checkout conversion funnel: begin_checkout at gateway hand-off and
// purchase when the gateway redirects back with ?checkout=success.
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import SubscriptionPage from '../SubscriptionPage';
import { heartsync } from '../../store';

const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

describe('SubscriptionPage GA4 conversion funnel', () => {
  let previousUser: any;
  beforeEach(() => {
    previousUser = heartsync.current_user;
    heartsync.current_user = { id: 'u1', name: 'Payer', email: 'p@x.com', role: 'reader', created_at: new Date().toISOString() };
    heartsync.plans = [
      { id: 'plan-1', name: 'Monthly', price_monthly: 5.99, price_yearly: 49.99, features: ['a', 'b'] }
    ] as any;
    (window as any).dataLayer = [];
    delete (window as any).gtag;
    window.history.replaceState({}, '', '/subscription');
  });

  it('fires begin_checkout with plan value + gateway when the user submits checkout', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({}) })) as any);
    render(<SubscriptionPage onNavigate={() => {}} />);
    await flush();
    // Open the checkout for the first plan.
    const choose = screen.getAllByRole('button').find((b) => /activate/i.test(b.textContent || ''))!;
    expect(choose).toBeDefined();
    fireEvent.click(choose);
    await flush();
    // Submit the checkout form.
    const submit = screen.getAllByRole('button').find((b) => b.getAttribute('type') === 'submit');
    expect(submit).toBeDefined();
    fireEvent.click(submit);
    await flush();
    const dl = (window as any).dataLayer as any[];
    const begin = dl.find((e) => e.event === 'begin_checkout');
    expect(begin).toBeDefined();
    expect(begin.plan_id).toBe('plan-1');
    expect(begin.value).toBe(5.99);
    expect(begin.currency).toBe('USD');
    expect(typeof begin.gateway).toBe('string');
  });

  it('fires purchase when the gateway returns with ?checkout=success&planId=', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({}) })) as any);
    window.history.replaceState({}, '', '/subscription?checkout=success&planId=plan-1');
    render(<SubscriptionPage onNavigate={() => {}} />);
    await waitFor(() => {
      const dl = (window as any).dataLayer as any[];
      expect(dl.find((e) => e.event === 'purchase')).toBeDefined();
    });
    const dl = (window as any).dataLayer as any[];
    const purchase = dl.find((e) => e.event === 'purchase');
    expect(purchase.plan_id).toBe('plan-1');
    expect(purchase.value).toBe(5.99);
  });
});
