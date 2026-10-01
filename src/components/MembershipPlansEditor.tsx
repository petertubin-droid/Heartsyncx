import React, { useEffect, useState } from 'react';
import { CheckCircle2, Plus, Trash2, Save, RefreshCw, Database, Star } from 'lucide-react';
import { heartsync } from '../store';
import type { Plan } from '../types';

/**
 * MembershipPlansEditor - the real, database-backed membership tier manager
 * for the AdminConsole Billing tab (replaces the former hardcoded display).
 *
 * Every mutation goes through the heartsync store CRUD methods
 * (createSubscriptionPlan / updateSubscriptionPlan / deleteSubscriptionPlan),
 * which persist via saveState({sections:['plans']}) -> POST /api/state ->
 * Supabase `plans` upsert. Prices edited here appear on the public
 * /subscription page after the next store refresh.
 *
 * Yearly price is intentionally derived (10x monthly, the site-wide
 * convention from the seeded tiers) because the `plans` table stores a
 * single monthly `price` column - there is no yearly column to persist.
 */
type PlanDraft = Plan & { description?: string; is_popular?: boolean; price?: number };

const uid = (): string =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : `plan-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const toDraft = (p: Plan): PlanDraft => ({ ...p, features: Array.isArray(p.features) ? [...p.features] : [] });

const MembershipPlansEditor: React.FC = () => {
  const [drafts, setDrafts] = useState<PlanDraft[]>(() => heartsync.plans.map(toDraft));
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ msg: string; error?: boolean } | null>(null);

  // Follow store updates (boot load from the database, realtime, saves)
  useEffect(() => {
    const syncFromStore = () => setDrafts(heartsync.plans.map(toDraft));
    const unsubscribe = heartsync.subscribe(syncFromStore);
    syncFromStore();
    return unsubscribe;
  }, []);

  const markDirty = (id: string) =>
    setDirtyIds(prev => (prev.has(id) ? prev : new Set(prev).add(id)));

  const updateDraft = (id: string, patch: Partial<PlanDraft>) => {
    setDrafts(prev => prev.map(d => (d.id === id ? { ...d, ...patch } : d)));
    markDirty(id);
  };

  const updateFeature = (id: string, idx: number, value: string) => {
    setDrafts(prev =>
      prev.map(d =>
        d.id === id
          ? { ...d, features: d.features.map((f, i) => (i === idx ? value : f)) }
          : d
      )
    );
    markDirty(id);
  };

  const addFeature = (id: string) => {
    setDrafts(prev =>
      prev.map(d => (d.id === id ? { ...d, features: [...d.features, ''] } : d))
    );
    markDirty(id);
  };

  const removeFeature = (id: string, idx: number) => {
    setDrafts(prev =>
      prev.map(d =>
        d.id === id ? { ...d, features: d.features.filter((_, i) => i !== idx) } : d
      )
    );
    markDirty(id);
  };

  const savePlan = (draft: PlanDraft) => {
    const monthly = Number(draft.price_monthly);
    if (!Number.isFinite(monthly) || monthly < 0) {
      setFeedback({ msg: 'Monthly price must be a number of 0 or more.', error: true });
      return;
    }
    if (!draft.name.trim()) {
      setFeedback({ msg: 'Tier name cannot be empty.', error: true });
      return;
    }
    setSavingId(draft.id);
    try {
      const cleaned: PlanDraft = {
        ...draft,
        name: draft.name.trim(),
        price_monthly: Number(monthly.toFixed(2)),
        price_yearly: Number((monthly * 10).toFixed(2)),
        features: draft.features.map(f => f.trim()).filter(Boolean),
        price: Number(monthly.toFixed(2)) // canonical column the server upserts
      };
      heartsync.updateSubscriptionPlan(draft.id, cleaned);
      setFeedback({ msg: `Saved "${cleaned.name}" to the database.` });
      setDirtyIds(prev => {
        const next = new Set(prev);
        next.delete(draft.id);
        return next;
      });
    } catch (e: any) {
      setFeedback({ msg: e?.message || 'Save failed - check the connection and retry.', error: true });
    } finally {
      setSavingId(null);
    }
  };

  const addTier = () => {
    const plan: PlanDraft = {
      id: uid(),
      name: 'New Membership Tier',
      price_monthly: 9.99,
      price_yearly: 99.9,
      price: 9.99,
      features: ['Feature one', 'Feature two'],
      is_popular: false
    };
    heartsync.createSubscriptionPlan(plan);
    setFeedback({ msg: `Created "${plan.name}" - edit the details and press Save.` });
  };

  const deleteTier = (id: string, name: string) => {
    if (!window.confirm(`Delete the "${name}" tier? Active subscribers keep their status until you move them.`)) return;
    heartsync.deleteSubscriptionPlan(id);
    setFeedback({ msg: `Deleted "${name}".` });
  };

  const resync = () => {
    setFeedback({ msg: 'Refreshing tiers from the database…' });
    try {
      if (typeof (heartsync as any).syncWithSupabase === 'function') {
        (heartsync as any).syncWithSupabase();
      }
      setDrafts(heartsync.plans.map(toDraft));
      setDirtyIds(new Set());
      setFeedback({ msg: 'Tiers refreshed from the database.' });
    } catch {
      setDrafts(heartsync.plans.map(toDraft));
      setFeedback({ msg: 'Refreshed from the current store snapshot.' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Database className="w-3 h-3" /> Live · plans table
          </span>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
            {heartsync.plans.length} tiers · yearly = 10× monthly
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resync}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold text-[10px] text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Refresh from DB
          </button>
          <button
            onClick={addTier}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] transition cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add New Tier
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`px-3 py-2 rounded-xl text-[11px] font-semibold ${
            feedback.error
              ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
          }`}
        >
          {feedback.msg}
        </div>
      )}

      {/* Tier cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {drafts.map(draft => {
          const subscribers = (heartsync.subscriptions || []).filter(
            (s: any) => s.plan_id === draft.id || s.plan_name === draft.name
          ).length;
          const dirty = dirtyIds.has(draft.id);
          return (
            <div
              key={draft.id}
              className={`p-5 border rounded-2xl bg-zinc-50/30 dark:bg-zinc-950/30 space-y-3 relative transition-all ${
                dirty
                  ? 'border-amber-400 dark:border-amber-500/60 ring-2 ring-amber-400/30'
                  : 'border-zinc-200 dark:border-zinc-800'
              }`}
            >
              {dirty && (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 uppercase">
                  Unsaved
                </span>
              )}

              {/* Name + price row */}
              <div className="flex gap-2">
                <label className="flex-1">
                  <span className="text-[9px] font-mono font-bold uppercase text-zinc-500 block mb-1">Tier name</span>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={e => updateDraft(draft.id, { name: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-rose-400 outline-none"
                  />
                </label>
                <label className="w-24">
                  <span className="text-[9px] font-mono font-bold uppercase text-zinc-500 block mb-1">Monthly $</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={draft.price_monthly}
                    onChange={e => updateDraft(draft.id, { price_monthly: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-rose-400 outline-none"
                  />
                </label>
              </div>

              {/* Derived yearly + subscriber signal */}
              <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
                <span className="font-mono">
                  Yearly: <strong className="text-zinc-700 dark:text-zinc-200">${(Number(draft.price_monthly) * 10).toFixed(2)}</strong>
                  <span className="ml-1 text-zinc-400">(auto, 10× monthly)</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Star className="w-3 h-3 text-zinc-400" />
                  <strong>{subscribers}</strong> subscriber{subscribers === 1 ? '' : 's'}
                </span>
              </div>

              {/* Features */}
              <div className="pt-2 border-t space-y-1.5">
                <span className="text-[9px] font-mono font-bold uppercase text-zinc-500">Included features</span>
                {draft.features.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <input
                      type="text"
                      value={f}
                      onChange={e => updateFeature(draft.id, idx, e.target.value)}
                      className="flex-1 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[10px] text-zinc-700 dark:text-zinc-300 focus:ring-2 focus:ring-rose-400 outline-none"
                    />
                    <button
                      onClick={() => removeFeature(draft.id, idx)}
                      className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-zinc-400 hover:text-red-500 transition cursor-pointer"
                      title="Remove feature"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addFeature(draft.id)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add feature
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <button
                  onClick={() => savePlan(draft)}
                  disabled={savingId === draft.id}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-xl font-bold text-[10px] transition cursor-pointer ${
                    dirty
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Save className="w-3 h-3" />
                  {savingId === draft.id ? 'Saving…' : dirty ? 'Save to database' : 'Saved'}
                </button>
                <button
                  onClick={() => deleteTier(draft.id, draft.name)}
                  className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-bold text-[10px] transition cursor-pointer"
                  title="Delete tier"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {drafts.length === 0 && (
        <div className="text-center py-10 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl text-xs text-zinc-500">
          No membership tiers found. Press "Add New Tier" to create your first one.
        </div>
      )}
    </div>
  );
};

export default MembershipPlansEditor;
