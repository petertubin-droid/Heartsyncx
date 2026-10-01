/* ============================================================================
 * CROSS-PROMO AD ADMIN (Oct 2026)
 * The full admin panel for Heartsyncx's own cross-promo ad system:
 *
 *  - CrossPromoSlotManager: every physical slot position on the site
 *    (article top/mid/end, homepage, categories, trending, before-footer).
 *    The admin turns each position on/off and can override the display
 *    format per slot. Persisted as site_settings.cross_promo_slots.
 *
 *  - AdCampaignManager: full ad builder for the partner-ad rotation.
 *    Create, edit, duplicate, schedule (auto start/expire), per-ad CTA
 *    text, and three AI helpers:
 *      1. Generate an ad from a URL (fetches real title/description/logo)
 *      2. Generate an ad from a written description of the business
 *      3. AI-polish the copy of any existing ad
 *    Persisted as site_settings.external_promos, the same rotation the
 *    frontend CrossPromoSlot renders.
 * ==========================================================================*/
import React, { useState } from 'react';
import { Wand2, ChevronDown, ChevronUp, Copy, Trash2, Eye, EyeOff, Megaphone, LayoutGrid } from 'lucide-react';
import { heartsync } from '../../store';
import {
  CROSS_PROMO_SLOT_CATALOG,
  isSlotActive,
  slotFormat,
  type ExternalPromo,
  type CrossPromoFormat,
  type CrossPromoSlotOverrides,
} from '../houseAds/CrossPromoSlot';

/** Same authenticated fetch the AdminConsole uses for its AI endpoints. */
const getAdminAuthHeaders = async (): Promise<Record<string, string>> => {
  try {
    if (heartsync.supabase) {
      const { data: { session } } = await heartsync.supabase.auth.getSession();
      if (session?.access_token) return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch (_) { /* not signed in */ }
  return {};
};

const adminFetch = async (url: string, init: any = {}): Promise<Response> => {
  const headers = { ...(init.headers || {}), ...(await getAdminAuthHeaders()) };
  return fetch(url, { ...init, headers });
};

/* ---------------------------------------------------------------------------
 * SLOT MANAGER
 * -------------------------------------------------------------------------*/
export const CrossPromoSlotManager: React.FC = () => {
  const settings = (heartsync.site_settings || {}) as Record<string, unknown>;
  const overrides = (settings.cross_promo_slots as CrossPromoSlotOverrides) || {};
  const [draft, setDraft] = useState<CrossPromoSlotOverrides>(JSON.parse(JSON.stringify(overrides)));
  const [savedFlash, setSavedFlash] = useState(false);

  const currentEnabled = (id: string) =>
    typeof draft[id]?.enabled === 'boolean' ? draft[id].enabled! : isSlotActive(settings, id) && settings.cross_promo_enabled !== false;
  const currentFormat = (id: string) => draft[id]?.format || 'global';

  const save = async () => {
    await heartsync.updateSettings({ cross_promo_slots: draft });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  return (
    <div className="space-y-2 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <LayoutGrid className="w-3 h-3" /> Placement Slots
          </label>
          <p className="text-[10px] text-zinc-400 mt-0.5">
            Every position on the site that can render a promo unit. Turn positions on to add slots; each slot can also override the global display format.
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          className="shrink-0 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
        >
          Save slots
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {CROSS_PROMO_SLOT_CATALOG.map((slot) => (
          <div
            key={slot.id}
            className={`p-3 rounded-xl border transition-colors ${
              currentEnabled(slot.id)
                ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/10'
                : 'border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-950/40'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{slot.label}</span>
                <span className="block text-[10px] text-zinc-400 leading-relaxed mt-0.5">{slot.description}</span>
                <span className="block text-[9px] font-mono text-zinc-400 mt-1">
                  id: {slot.id} · live format: {currentEnabled(slot.id) ? slotFormat({ ...(settings as object), cross_promo_slots: draft } as Record<string, unknown>, slot.id) : 'off'}
                </span>
              </div>
              <label className="shrink-0 flex items-center gap-1.5 cursor-pointer" title={currentEnabled(slot.id) ? 'Slot is live' : 'Slot is off'}>
                <input
                  type="checkbox"
                  checked={currentEnabled(slot.id)}
                  onChange={(e) => setDraft((prev) => ({ ...prev, [slot.id]: { ...prev[slot.id], enabled: e.target.checked } }))}
                  className="w-4 h-4 text-emerald-500 rounded cursor-pointer"
                />
                <span className="text-[9px] font-bold uppercase text-zinc-400">On</span>
              </label>
            </div>
            <div className="mt-2">
              <select
                value={currentFormat(slot.id)}
                onChange={(e) => setDraft((prev) => ({ ...prev, [slot.id]: { ...prev[slot.id], format: e.target.value as CrossPromoFormat | 'global' } }))}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-[10px] font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="global">Use global format</option>
                <option value="display">Override: Display</option>
                <option value="card">Override: Card</option>
                <option value="banner">Override: Banner</option>
                <option value="native">Override: Native</option>
                <option value="interstitial">Override: Interstitial</option>
              </select>
            </div>
          </div>
        ))}
      </div>
      {savedFlash && <span className="text-[10px] font-bold text-emerald-600">Slots saved ✓</span>}
    </div>
  );
};

/* ---------------------------------------------------------------------------
 * AD CAMPAIGN MANAGER
 * -------------------------------------------------------------------------*/
type AdRow = Required<Pick<ExternalPromo, 'id' | 'enabled' | 'label' | 'url' | 'blurb'>> & ExternalPromo;

const newAdRow = (): AdRow => ({
  id: `ext-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  enabled: true,
  label: '',
  url: '',
  blurb: '',
  owner_name: '',
  logo_url: '',
  cta_label: '',
  start_date: '',
  end_date: '',
});

const fromStored = (r: ExternalPromo): AdRow => ({
  ...newAdRow(),
  ...r,
  id: r.id || `ext-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  enabled: r.enabled !== false,
});

/** Live mini-preview of how the ad renders in the Display format. */
const AdPreview: React.FC<{ ad: AdRow }> = ({ ad }) => (
  <div className="overflow-hidden border border-[#dadce0] dark:border-[#3c4043] bg-white dark:bg-[#202124] rounded-lg">
    <div className="flex items-center justify-center gap-1.5 pt-1.5 pb-1">
      <span className="text-[8px] font-bold uppercase tracking-widest text-[#5f6368] dark:text-[#9aa0a6]">Advertisement</span>
    </div>
    <div className="w-full h-16 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      {ad.logo_url ? (
        <img src={ad.logo_url} alt="" className="max-h-10 max-w-[60%] w-auto object-contain" />
      ) : (
        <Megaphone className="w-6 h-6 text-zinc-300 dark:text-zinc-700" />
      )}
    </div>
    <div className="px-2.5 py-2 border-t border-[#dadce0] dark:border-[#3c4043]">
      <span className="block text-[11px] font-bold text-[#1a0dab] dark:text-[#8ab4f8] truncate">{ad.label || 'Your ad headline'}</span>
      <span className="block text-[9px] text-[#3c4043] dark:text-[#9aa0a6] line-clamp-1 mt-0.5">{ad.blurb || 'Supporting sentence shown under the headline.'}</span>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="text-[8px] text-[#0d652d] truncate">{(ad.url || 'partner-site.com').replace(/^https?:\/\//, '').split('/')[0]}</span>
        <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#1a73e8] text-white text-[8px] font-bold">{ad.cta_label || 'Visit site'}</span>
      </div>
    </div>
  </div>
);

export const AdCampaignManager: React.FC = () => {
  const stored = ((heartsync.site_settings as Record<string, unknown>).external_promos as ExternalPromo[]) || [];
  const [rows, setRows] = useState<AdRow[]>(stored.map(fromStored));
  const [expanded, setExpanded] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  // AI: generate from URL
  const [aiUrl, setAiUrl] = useState('');
  const [aiUrlLoading, setAiUrlLoading] = useState(false);
  const [aiUrlError, setAiUrlError] = useState('');

  // AI: generate from a written description
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiPromptLoading, setAiPromptLoading] = useState(false);
  const [aiPromptError, setAiPromptError] = useState('');

  const [polishing, setPolishing] = useState<string | null>(null);

  const setRow = (id: string, patch: Partial<AdRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addAd = () => {
    const row = newAdRow();
    setRows((prev) => [...prev, row]);
    setExpanded(row.id);
  };

  const duplicateAd = (id: string) =>
    setRows((prev) => {
      const src = prev.find((r) => r.id === id);
      if (!src) return prev;
      const copy: AdRow = { ...src, id: `ext-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, label: `${src.label} (copy)` };
      return [...prev, copy];
    });

  const deleteAd = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  /** AI helper 1: read the real page at a URL and fill a complete ad row. */
  const runAiFromUrl = async () => {
    const target = aiUrl.trim();
    if (!target) return;
    setAiUrlLoading(true);
    setAiUrlError('');
    try {
      const res = await adminFetch('/api/gemini/ad-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Could not generate an ad from that URL.');
      const row: AdRow = {
        ...newAdRow(),
        label: body.label || '',
        url: body.url || target,
        blurb: body.blurb || '',
        owner_name: body.owner_name || '',
        logo_url: body.logo_url || '',
        cta_label: body.cta_label || '',
      };
      setRows((prev) => [...prev, row]);
      setExpanded(row.id);
      setAiUrl('');
    } catch (err: any) {
      setAiUrlError(err?.message || 'Something went wrong reaching that URL.');
    } finally {
      setAiUrlLoading(false);
    }
  };

  /** AI helper 2: describe the business in words, Gemini writes the copy. */
  const runAiFromPrompt = async () => {
    const description = aiPrompt.trim();
    if (!description) return;
    setAiPromptLoading(true);
    setAiPromptError('');
    try {
      const res = await adminFetch('/api/gemini/ad-from-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Could not generate ad copy.');
      const row: AdRow = {
        ...newAdRow(),
        label: body.label || '',
        blurb: body.blurb || '',
        cta_label: body.cta_label || '',
        owner_name: body.owner_name || '',
      };
      setRows((prev) => [...prev, row]);
      setExpanded(row.id);
      setAiPrompt('');
    } catch (err: any) {
      setAiPromptError(err?.message || 'Something went wrong.');
    } finally {
      setAiPromptLoading(false);
    }
  };

  /** AI helper 3: sharpen the copy of one existing ad. */
  const polishAd = async (id: string) => {
    const ad = rows.find((r) => r.id === id);
    if (!ad) return;
    setPolishing(id);
    try {
      const res = await adminFetch('/api/gemini/ad-from-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: `${ad.label}: ${ad.blurb}`, mode: 'improve' }),
      });
      const body = await res.json();
      if (res.ok && (body.label || body.blurb)) {
        setRow(id, {
          label: body.label || ad.label,
          blurb: body.blurb || ad.blurb,
          cta_label: body.cta_label || ad.cta_label,
        });
      }
    } catch {
      /* keep the old copy on failure */
    } finally {
      setPolishing(null);
    }
  };

  const save = async () => {
    await heartsync.updateSettings({
      external_promos: rows.filter((r) => r.label.trim() || r.url.trim()),
    });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const liveCount = rows.filter((r) => r.enabled).length;

  return (
    <div className="space-y-2 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Megaphone className="w-3 h-3" /> Ad Campaigns
          </label>
          <p className="text-[10px] text-zinc-400 mt-0.5">
            Create, edit and schedule partner ads. They rotate in every enabled slot, auto-activate on their start date and auto-expire on their end date.
          </p>
        </div>
        <span className="text-[10px] text-zinc-400">{liveCount} live · {rows.length} total</span>
      </div>

      {/* AI Assistant panel */}
      <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 space-y-3">
        <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
          <Wand2 className="w-3 h-3" /> AI Ad Assistant
        </label>

        <div className="flex gap-2">
          <input
            value={aiUrl}
            onChange={(e) => setAiUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !aiUrlLoading) runAiFromUrl(); }}
            placeholder="Create from a URL - https://partner-site.com"
            disabled={aiUrlLoading}
            className="flex-1 bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-900/60 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={runAiFromUrl}
            disabled={aiUrlLoading || !aiUrl.trim()}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold cursor-pointer"
          >
            {aiUrlLoading ? 'Reading…' : 'Generate'}
          </button>
        </div>

        <div className="flex gap-2">
          <input
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !aiPromptLoading) runAiFromPrompt(); }}
            placeholder="Or describe the business - e.g. online therapy for couples in Lagos"
            disabled={aiPromptLoading}
            className="flex-1 bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-900/60 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={runAiFromPrompt}
            disabled={aiPromptLoading || !aiPrompt.trim()}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold cursor-pointer"
          >
            {aiPromptLoading ? 'Writing…' : 'Write copy'}
          </button>
        </div>
        {(aiUrlError || aiPromptError) && (
          <p className="text-[10px] font-semibold text-rose-500">{aiUrlError || aiPromptError}</p>
        )}
        <p className="text-[10px] text-indigo-700/70 dark:text-indigo-400/60">
          From a URL we read the site's real title, description and logo. From a description, Gemini writes the headline, blurb and CTA. Every AI result lands as a reviewable draft below - nothing goes live until you save.
        </p>
      </div>

      {rows.length === 0 && (
        <p className="text-[11px] text-zinc-400 italic py-2">No ads yet. Create one manually or let the AI assistant draft it.</p>
      )}

      {rows.map((r) => {
        const open = expanded === r.id;
        return (
          <div key={r.id} className="rounded-xl border border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-950/40">
            {/* Collapsed summary row */}
            <div className="flex items-center gap-2 p-2.5">
              <input
                type="checkbox"
                checked={r.enabled}
                onChange={(e) => setRow(r.id, { enabled: e.target.checked })}
                className="w-4 h-4 text-emerald-500 rounded cursor-pointer shrink-0"
                title={r.enabled ? 'Live' : 'Paused'}
              />
              <button type="button" onClick={() => setExpanded(open ? null : r.id)} className="min-w-0 flex-1 text-left cursor-pointer">
                <span className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{r.label || 'Untitled ad'}</span>
                <span className="block text-[10px] text-zinc-400 truncate font-mono">{r.url || 'no URL yet'}</span>
              </button>
              <button type="button" onClick={() => setRow(r.id, { enabled: !r.enabled })} className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer shrink-0" title={r.enabled ? 'Pause ad' : 'Activate ad'}>
                {r.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <button type="button" onClick={() => polishAd(r.id)} disabled={polishing === r.id} className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer shrink-0 disabled:opacity-50" title="AI-polish this ad's copy">
                <Wand2 className={`w-3.5 h-3.5 ${polishing === r.id ? 'animate-pulse' : ''}`} />
              </button>
              <button type="button" onClick={() => duplicateAd(r.id)} className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer shrink-0" title="Duplicate ad">
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => deleteAd(r.id)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer shrink-0" title="Delete ad">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => setExpanded(open ? null : r.id)} className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer shrink-0">
                {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Expanded editor + live preview */}
            {open && (
              <div className="border-t border-zinc-200 dark:border-zinc-850 p-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block">Headline (what the visitor clicks)</label>
                    <input
                      value={r.label}
                      onChange={(e) => setRow(r.id, { label: e.target.value })}
                      placeholder="e.g. Couples therapy, from your phone"
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block">Destination URL</label>
                    <input
                      value={r.url}
                      onChange={(e) => setRow(r.id, { url: e.target.value })}
                      placeholder="https://partner-site.com"
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block">Blurb (shown under the headline)</label>
                    <textarea
                      value={r.blurb}
                      onChange={(e) => setRow(r.id, { blurb: e.target.value })}
                      placeholder="One supporting sentence, max ~110 characters"
                      rows={2}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block">CTA button text</label>
                      <input
                        value={r.cta_label || ''}
                        onChange={(e) => setRow(r.id, { cta_label: e.target.value })}
                        placeholder="Visit site"
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block">Ads by (owner name)</label>
                      <input
                        value={r.owner_name || ''}
                        onChange={(e) => setRow(r.id, { owner_name: e.target.value })}
                        placeholder="Partner name"
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block">Logo / image URL (shown in Display format)</label>
                    <input
                      value={r.logo_url || ''}
                      onChange={(e) => setRow(r.id, { logo_url: e.target.value })}
                      placeholder="https://partner-site.com/logo.png"
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block">Start date (optional)</label>
                      <input
                        type="date"
                        value={r.start_date || ''}
                        onChange={(e) => setRow(r.id, { start_date: e.target.value })}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block">End date (optional)</label>
                      <input
                        type="date"
                        value={r.end_date || ''}
                        onChange={(e) => setRow(r.id, { end_date: e.target.value })}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>
                  <p className="text-[9px] text-zinc-400">The ad auto-activates on its start date and auto-expires after its end date - no manual switching needed.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block">Live preview (Display format)</label>
                  <AdPreview ad={r} />
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={addAd}
          className="px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
        >
          + Create ad
        </button>
        <button
          type="button"
          onClick={save}
          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
        >
          Save ads
        </button>
        {savedFlash && <span className="text-[10px] font-bold text-emerald-600">Saved ✓</span>}
      </div>
    </div>
  );
};
