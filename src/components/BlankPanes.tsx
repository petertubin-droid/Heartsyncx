// Heartsyncx Admin — Six activated panes, all wired to real backend systems.
// 1. LocalizationPane   → /api/translation-overrides (DB table translation_overrides)
// 2. PageBuilderPane    → siteSettings.draft_page_builder_sections (staging + publish)
// 3. MultiSitePane      → /api/tenant-domains (DB table tenant_domains)
// 4. SentimentGuardPane → /api/sentiment/scan + /api/sentiment/scans (Gemini)
// 5. AcousticPulsePane  → real Web Audio synthesis + siteSettings.acoustic_pulse_presets
// 6. AiFeaturesPane     → /api/ai/status + siteSettings.ai_feature_toggles
import React, { useEffect, useRef, useState } from 'react';
import {
  Globe, Layers, ArrowUp, ArrowDown, Trash2, Plus, Play, Square, RefreshCw,
  Eye, EyeOff, ExternalLink, CheckCircle2, AlertTriangle, Volume2
} from 'lucide-react';
import { heartsync } from '../store';
import { LANGUAGES } from '../utils/i18n';

export interface PaneProps {
  triggerToast: (msg: string) => void;
  siteSettings: any;
  setSiteSettings: (next: any) => void;
  saveSettings: (next?: any) => Promise<boolean>;
}

async function adminJsonFetch(url: string, init?: RequestInit): Promise<any> {
  const res = await fetch(url, { credentials: 'include', ...init });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

const cardClass = 'bg-white dark:bg-zinc-900 border border-zinc-200/85 dark:border-zinc-800/80 rounded-3xl p-6 shadow-xs space-y-4 text-left';
const headingClass = 'text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400';
const inputClass = 'p-3 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl text-xs w-full';
const primaryBtn = 'bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl px-4 py-2.5 cursor-pointer shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const secondaryBtn = 'bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-2.5 font-bold text-xs cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

// ---------------------------------------------------------------------------
// 1. LOCALIZATION — Translation Override Manager
// ---------------------------------------------------------------------------
export function LocalizationPane({ triggerToast }: PaneProps) {
  const [overrides, setOverrides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [form, setForm] = useState({ language_code: 'en', string_key: '', custom_text: '' });
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    try {
      setError('');
      const data = await adminJsonFetch('/api/translation-overrides');
      setOverrides(data.overrides || []);
      heartsync.applyTranslationOverrides(data.overrides || []);
    } catch (e: any) {
      setError(e.message || 'Could not load overrides.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const addOverride = async () => {
    if (!form.string_key.trim() || !form.custom_text.trim()) {
      setError('Pick a string key and provide the replacement text.');
      return;
    }
    setSaving(true);
    try {
      await adminJsonFetch('/api/translation-overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      setForm({ language_code: form.language_code, string_key: '', custom_text: '' });
      await reload();
      triggerToast('Override saved & live');
    } catch (e: any) {
      setError(e.message || 'Could not save the override.');
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async (id: string) => {
    try {
      await adminJsonFetch(`/api/translation-overrides/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_text: editText })
      });
      setEditingId(null);
      await reload();
      triggerToast('Override updated');
    } catch (e: any) {
      setError(e.message || 'Could not update the override.');
    }
  };

  const removeOverride = async (id: string) => {
    try {
      await adminJsonFetch(`/api/translation-overrides/${encodeURIComponent(id)}`, { method: 'DELETE' });
      await reload();
      triggerToast('Override removed — built-in text restored');
    } catch (e: any) {
      setError(e.message || 'Could not delete the override.');
    }
  };

  const langName = (code: string) => LANGUAGES.find(l => l.code === code)?.name || code;

  return (
    <div className="space-y-5">
      <div className={cardClass}>
        <h3 className={headingClass}>Translation Override Manager</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Overrides take priority over the built-in translation for that language on the live site —
          perfect for tuning tone, localizing names, or fixing a dictionary string without a deploy.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
          <select
            className={inputClass}
            value={form.language_code}
            onChange={e => setForm({ ...form, language_code: e.target.value })}
          >
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name} ({l.code})</option>)}
          </select>
          <div>
            <input
              className={inputClass}
              placeholder="String key (e.g. navHome)"
              list="hs-override-keys"
              value={form.string_key}
              onChange={e => setForm({ ...form, string_key: e.target.value })}
            />
            <datalist id="hs-override-keys">
              {['navHome', 'readArticle', 'joinPremium', 'newsletterTitle', 'trendingNow', 'latestPublications', 'exploreTopics', 'aboutUs', 'footerTagline', 'subscribeNow'].map(k => (
                <option key={k} value={k} />
              ))}
            </datalist>
          </div>
          <input
            className={inputClass}
            placeholder="Your custom text"
            value={form.custom_text}
            onChange={e => setForm({ ...form, custom_text: e.target.value })}
          />
        </div>
        <button type="button" className={primaryBtn} onClick={addOverride} disabled={saving}>
          <span className="inline-flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Override</span>
        </button>
        {error && <p className="text-xs text-rose-500">{error}</p>}
      </div>

      <div className={cardClass}>
        <h3 className={headingClass}>Active Overrides ({overrides.length})</h3>
        {loading ? (
          <p className="text-xs text-zinc-400">Loading…</p>
        ) : overrides.length === 0 ? (
          <p className="text-xs text-zinc-400">No overrides yet. The site uses its built-in translations for every language.</p>
        ) : (
          <div className="space-y-2">
            {overrides.map(o => (
              <div key={o.id} className="border border-zinc-100 dark:border-zinc-800 rounded-2xl p-3.5 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-black text-rose-500">{langName(o.language_code)}</span>
                  <span className="font-mono text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{o.string_key}</span>
                </div>
                {editingId === o.id ? (
                  <div className="flex gap-2">
                    <textarea className={inputClass} rows={2} value={editText} onChange={e => setEditText(e.target.value)} />
                    <button type="button" className={primaryBtn} onClick={() => saveEdit(o.id)}>Save</button>
                    <button type="button" className={secondaryBtn} onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs text-zinc-600 dark:text-zinc-300">{o.custom_text}</p>
                    <div className="flex gap-1.5 shrink-0">
                      <button type="button" className={secondaryBtn + ' !px-3 !py-1.5'} onClick={() => { setEditingId(o.id); setEditText(o.custom_text); }}>Edit</button>
                      <button type="button" className={secondaryBtn + ' !px-3 !py-1.5 hover:!bg-rose-50 dark:hover:!bg-rose-950/40'} onClick={() => removeOverride(o.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. PAGE BUILDER — Draft/Staging layout editor with publish
// ---------------------------------------------------------------------------
const DEFAULT_SECTIONS = [
  { id: 'sec-hero', type: 'hero', title: 'Heartsync', is_active: true },
  { id: 'sec-featured', type: 'featured_stories', title: 'Featured Insights', is_active: true },
  { id: 'sec-trending', type: 'trending', title: 'Trending Now', is_active: true },
  { id: 'sec-categories', type: 'categories', title: 'Explore by Topic', is_active: true },
  { id: 'sec-latest', type: 'latest_articles', title: 'Latest Articles', is_active: true },
  { id: 'sec-premium', type: 'premium_articles', title: 'Premium', is_active: true },
  { id: 'sec-about', type: 'about', title: 'About', is_active: true },
  { id: 'sec-newsletter', type: 'newsletter', title: 'Newsletter', is_active: true }
];

export function PageBuilderPane({ triggerToast, siteSettings, setSiteSettings, saveSettings }: PaneProps) {
  const draftRaw = siteSettings?.draft_page_builder_sections as any[];
  const live = (siteSettings?.page_builder_sections as any[]) || [];
  const draft = (draftRaw && draftRaw.length > 0) ? draftRaw : (live.length > 0 ? live : DEFAULT_SECTIONS);

  const commitDraft = (next: any[]) => {
    setSiteSettings({ ...siteSettings, draft_page_builder_sections: next });
  };

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...draft];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    commitDraft(next);
  };

  const patchSection = (idx: number, patch: any) => {
    const next = draft.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    commitDraft(next);
  };

  const saveDraft = async () => {
    const ok = await saveSettings({ ...siteSettings, draft_page_builder_sections: draft });
    if (ok) triggerToast('Draft layout saved');
    else triggerToast('Draft save failed');
  };

  const publish = async () => {
    if (!window.confirm('Replace the LIVE homepage layout with this draft?')) return;
    const next = { ...siteSettings, page_builder_sections: draft, draft_page_builder_sections: draft };
    const ok = await saveSettings(next);
    triggerToast(ok ? 'Draft published to live homepage' : 'Publish failed');
  };

  const pullLive = () => {
    if (live.length === 0) { triggerToast('No live layout stored yet'); return; }
    if (!window.confirm('Replace the current draft with the live layout?')) return;
    commitDraft([...live]);
    triggerToast('Live layout copied into draft');
  };

  return (
    <div className="space-y-5">
      <div className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className={headingClass}>Visual Layout Builder</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Stage a homepage layout here, preview it safely, then publish it to every visitor.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={primaryBtn} onClick={saveDraft}>Save Draft</button>
            <button type="button" className={secondaryBtn} onClick={() => window.open('/?draft=true', '_blank')}>
              <span className="inline-flex items-center gap-1.5"><ExternalLink className="w-3.5 h-3.5" /> Preview Draft</span>
            </button>
            <button type="button" className={secondaryBtn} onClick={pullLive}>Pull Live Into Draft</button>
            <button type="button" className={primaryBtn} onClick={publish}>Publish Draft to Live</button>
          </div>
        </div>
        <p className="text-[10px] text-zinc-400">
          Visitors always see the live layout. The preview link (?draft=true) shows the staged draft only.
        </p>
      </div>

      <div className={cardClass}>
        <h3 className={headingClass}><span className="inline-flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Draft Sections</span></h3>
        <div className="space-y-2">
          {draft.map((sec, idx) => (
            <div key={sec.id || idx} className="border border-zinc-100 dark:border-zinc-800 rounded-2xl p-3.5 flex flex-wrap items-center gap-3">
              <div className="flex flex-col gap-0.5">
                <button type="button" className="text-zinc-400 hover:text-rose-500 cursor-pointer disabled:opacity-30" onClick={() => move(idx, -1)} disabled={idx === 0} title="Move up">
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button type="button" className="text-zinc-400 hover:text-rose-500 cursor-pointer disabled:opacity-30" onClick={() => move(idx, 1)} disabled={idx === draft.length - 1} title="Move down">
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="font-mono text-[9px] bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-500">{sec.type}</span>
              <input
                className={inputClass + ' flex-1 min-w-[160px]'}
                value={sec.title || ''}
                onChange={e => patchSection(idx, { title: e.target.value })}
                placeholder="Section title"
              />
              <button
                type="button"
                className={secondaryBtn + ' !px-3 !py-1.5'}
                onClick={() => patchSection(idx, { is_active: sec.is_active === false })}
                title={sec.is_active === false ? 'Hidden — click to show' : 'Visible — click to hide'}
              >
                {sec.is_active === false
                  ? <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                  : <Eye className="w-3.5 h-3.5 text-emerald-500" />}
                <span className="ml-1.5">{sec.is_active === false ? 'Hidden' : 'Visible'}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. MULTI-SITE — Tenant Domains registry
// ---------------------------------------------------------------------------
export function MultiSitePane({ triggerToast }: PaneProps) {
  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ domain: '', site_name: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    try {
      setError('');
      const data = await adminJsonFetch('/api/tenant-domains');
      setDomains(data.domains || []);
    } catch (e: any) {
      setError(e.message || 'Could not load tenant domains.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const addDomain = async () => {
    setSaving(true);
    try {
      await adminJsonFetch('/api/tenant-domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      setForm({ domain: '', site_name: '', notes: '' });
      await reload();
      triggerToast('Domain registered');
    } catch (e: any) {
      setError(e.message || 'Could not register the domain.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (d: any) => {
    try {
      await adminJsonFetch(`/api/tenant-domains/${d.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: d.status === 'active' ? 'paused' : 'active' })
      });
      await reload();
      triggerToast(d.status === 'active' ? 'Domain paused' : 'Domain resumed');
    } catch (e: any) {
      setError(e.message || 'Could not update the domain.');
    }
  };

  const removeDomain = async (d: any) => {
    try {
      await adminJsonFetch(`/api/tenant-domains/${d.id}`, { method: 'DELETE' });
      await reload();
      triggerToast('Domain removed');
    } catch (e: any) {
      setError(e.message || 'Could not delete the domain.');
    }
  };

  return (
    <div className="space-y-5">
      <div className={cardClass}>
        <h3 className={headingClass}>Register a Domain</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className={inputClass} placeholder="example.com" value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} />
          <input className={inputClass} placeholder="Site name" value={form.site_name} onChange={e => setForm({ ...form, site_name: e.target.value })} />
          <input className={inputClass} placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>
        <button type="button" className={primaryBtn} onClick={addDomain} disabled={saving}>
          <span className="inline-flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Domain</span>
        </button>
        {error && <p className="text-xs text-rose-500">{error}</p>}
        <p className="text-[10px] text-zinc-400">
          Registered domains must also have DNS pointed at this deployment to serve traffic. This registry is the
          single source of truth the server checks for accepted host names.
        </p>
      </div>

      <div className={cardClass}>
        <h3 className={headingClass}>Domains ({domains.length})</h3>
        {loading ? (
          <p className="text-xs text-zinc-400">Loading…</p>
        ) : domains.length === 0 ? (
          <p className="text-xs text-zinc-400">No domains registered yet.</p>
        ) : (
          <div className="space-y-2">
            {domains.map(d => (
              <div key={d.id} className="border border-zinc-100 dark:border-zinc-800 rounded-2xl p-3.5 flex flex-wrap items-center gap-3 text-xs">
                <span className="font-mono font-bold text-zinc-800 dark:text-zinc-100">{d.domain}</span>
                <span className="text-zinc-500">{d.site_name}</span>
                <span className={`px-2 py-0.5 rounded-full font-bold ${d.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                  {d.status}
                </span>
                {d.notes && <span className="text-zinc-400 text-[10px]">{d.notes}</span>}
                <div className="flex gap-1.5 ml-auto">
                  <button type="button" className={secondaryBtn + ' !px-3 !py-1.5'} onClick={() => toggleStatus(d)}>
                    {d.status === 'active' ? 'Pause' : 'Resume'}
                  </button>
                  <button type="button" className={secondaryBtn + ' !px-3 !py-1.5 hover:!bg-rose-50 dark:hover:!bg-rose-950/40'} onClick={() => removeDomain(d)}>
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. SENTIMENT GUARD — AI tone & risk scanner
// ---------------------------------------------------------------------------
export function SentimentGuardPane({ triggerToast }: PaneProps) {
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState<'post' | 'comment' | null>(null);
  const [error, setError] = useState('');

  const reload = async () => {
    try {
      setError('');
      const data = await adminJsonFetch('/api/sentiment/scans');
      setScans(data.scans || []);
    } catch (e: any) {
      setError(e.message || 'Could not load scan history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const runScan = async (target_type: 'post' | 'comment') => {
    setScanning(target_type);
    try {
      const data = await adminJsonFetch('/api/sentiment/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_type })
      });
      triggerToast(`Scanned ${data.scanned} ${target_type === 'post' ? 'articles' : 'comments'}`);
      await reload();
    } catch (e: any) {
      setError(e.message || 'The scan failed.');
      triggerToast(e.message || 'The scan failed.');
    } finally {
      setScanning(null);
    }
  };

  const clearHistory = async () => {
    if (!window.confirm('Delete the entire scan history?')) return;
    try {
      await adminJsonFetch('/api/sentiment/scans', { method: 'DELETE' });
      await reload();
      triggerToast('Scan history cleared');
    } catch (e: any) {
      setError(e.message || 'Could not clear history.');
    }
  };

  const sentimentBadge = (s: string) => ({
    positive: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    neutral: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    negative: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    crisis: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
  } as any)[s] || 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300';

  const riskBadge = (r: string) => ({
    low: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
    moderate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
  } as any)[r] || 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400';

  return (
    <div className="space-y-5">
      <div className={cardClass}>
        <h3 className={headingClass}>Clinical Sentiment Guard</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Scans recent articles and comments for emotional tone and reader-safety risk (including crisis
          signals that need professional-help referral). Every scan is stored so you keep an audit trail.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={primaryBtn} onClick={() => runScan('post')} disabled={scanning !== null}>
            <span className="inline-flex items-center gap-1.5">
              {scanning === 'post' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Scan recent articles
            </span>
          </button>
          <button type="button" className={primaryBtn} onClick={() => runScan('comment')} disabled={scanning !== null}>
            <span className="inline-flex items-center gap-1.5">
              {scanning === 'comment' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Scan recent comments
            </span>
          </button>
          {scans.length > 0 && (
            <button type="button" className={secondaryBtn} onClick={clearHistory}>Clear history</button>
          )}
        </div>
        {error && <p className="text-xs text-rose-500">{error}</p>}
      </div>

      <div className={cardClass}>
        <h3 className={headingClass}>Scan History ({scans.length})</h3>
        {loading ? (
          <p className="text-xs text-zinc-400">Loading…</p>
        ) : scans.length === 0 ? (
          <p className="text-xs text-zinc-400">No scans yet. Run one of the scans above — results appear here.</p>
        ) : (
          <div className="space-y-2">
            {scans.map(s => (
              <div key={s.id} className="border border-zinc-100 dark:border-zinc-800 rounded-2xl p-3.5 space-y-1.5 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-zinc-800 dark:text-zinc-100">{s.target_title}</span>
                  <span className="font-mono text-[9px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-500">{s.target_type}</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold ${sentimentBadge(s.sentiment)}`}>{s.sentiment}</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold ${riskBadge(s.risk_level)}`}>risk: {s.risk_level}</span>
                  <span className="ml-auto text-[10px] text-zinc-400">{new Date(s.created_at).toLocaleString()}</span>
                </div>
                {s.summary && <p className="text-zinc-500 dark:text-zinc-400 line-clamp-2">{s.summary}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. ACOUSTIC PULSE — real Web Audio soundscape player
// ---------------------------------------------------------------------------
type RecipeKey = 'rain' | 'ocean' | 'drone' | 'heartbeat';
const RECIPES: { key: RecipeKey; name: string; desc: string }[] = [
  { key: 'rain', name: 'Rain Blanket', desc: 'Soft filtered noise with slow breathing motion.' },
  { key: 'ocean', name: 'Ocean Swell', desc: 'Low, slow-washing surf.' },
  { key: 'drone', name: 'Deep Drone', desc: 'Two detuned sines — a calm, focused hum.' },
  { key: 'heartbeat', name: 'Soft Heartbeat', desc: 'A slow 55 Hz pulse at resting heart rate.' }
];

function makeNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

export function AcousticPulsePane({ triggerToast, siteSettings, setSiteSettings, saveSettings }: PaneProps) {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const nodesRef = useRef<{ stop: () => void } | null>(null);
  const timerRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState<RecipeKey | null>(null);
  const [volume, setVolume] = useState(50);
  const [elapsed, setElapsed] = useState(0);
  const [presetName, setPresetName] = useState('');
  const presets: any[] = Array.isArray(siteSettings?.acoustic_pulse_presets) ? siteSettings.acoustic_pulse_presets : [];

  const ensureCtx = () => {
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      const master = ctx.createGain();
      master.gain.value = volume / 100;
      master.connect(ctx.destination);
      ctxRef.current = ctx;
      masterRef.current = master;
    }
    return ctxRef.current;
  };

  const stopAll = () => {
    if (nodesRef.current) { nodesRef.current.stop(); nodesRef.current = null; }
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    setPlaying(null);
    setElapsed(0);
  };

  const playRecipe = (key: RecipeKey) => {
    stopAll();
    const ctx = ensureCtx();
    const master = masterRef.current!;
    const stops: (() => void)[] = [];
    const start = ctx.currentTime;

    const noiseChain = (filterType: BiquadFilterType, freq: number, gain: number) => {
      const src = ctx.createBufferSource();
      src.buffer = makeNoiseBuffer(ctx);
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = gain;
      src.connect(filter).connect(g).connect(master);
      src.start();
      stops.push(() => { try { src.stop(); src.disconnect(); } catch { /* already stopped */ } });
      return g;
    };

    if (key === 'rain') {
      const g = noiseChain('lowpass', 1200, 0.5);
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.05;
      lfoGain.gain.value = 0.1;
      lfo.connect(lfoGain).connect(g.gain);
      lfo.start();
      stops.push(() => { try { lfo.stop(); lfo.disconnect(); } catch { /* already stopped */ } });
    } else if (key === 'ocean') {
      const g = noiseChain('lowpass', 600, 0.4);
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.08;
      lfoGain.gain.value = 0.35;
      lfo.connect(lfoGain).connect(g.gain);
      lfo.start();
      stops.push(() => { try { lfo.stop(); lfo.disconnect(); } catch { /* already stopped */ } });
    } else if (key === 'drone') {
      [110, 110.7].forEach(f => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = f;
        const g = ctx.createGain();
        g.gain.value = 0.25;
        osc.connect(g).connect(master);
        osc.start();
        stops.push(() => { try { osc.stop(); osc.disconnect(); } catch { /* already stopped */ } });
      });
    } else if (key === 'heartbeat') {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 55;
      const g = ctx.createGain();
      g.gain.value = 0;
      osc.connect(g).connect(master);
      osc.start();
      const pulse = () => {
        const t = ctx.currentTime;
        g.gain.cancelScheduledValues(t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.5, t + 0.06);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      };
      pulse();
      const interval = window.setInterval(pulse, 1000);
      stops.push(() => {
        window.clearInterval(interval);
        try { osc.stop(); osc.disconnect(); } catch { /* already stopped */ }
      });
    }

    nodesRef.current = { stop: () => stops.forEach(fn => fn()) };
    setPlaying(key);
    const startedAt = Date.now();
    setElapsed(0);
    timerRef.current = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    void start;
  };

  useEffect(() => {
    if (masterRef.current) masterRef.current.gain.value = volume / 100;
  }, [volume]);

  useEffect(() => () => stopAll(), []);

  const toggle = (key: RecipeKey) => (playing === key ? stopAll() : playRecipe(key));

  const savePreset = async () => {
    if (!playing || !presetName.trim()) {
      triggerToast('Pick a recipe, play it, then name the preset');
      return;
    }
    const next = [...presets, { name: presetName.trim(), recipe: playing, volume, saved_at: new Date().toISOString() }];
    const ok = await saveSettings({ ...siteSettings, acoustic_pulse_presets: next });
    if (ok) { setPresetName(''); triggerToast('Preset saved'); }
    else triggerToast('Preset save failed');
  };

  const deletePreset = async (idx: number) => {
    const next = presets.filter((_, i) => i !== idx);
    const ok = await saveSettings({ ...siteSettings, acoustic_pulse_presets: next });
    triggerToast(ok ? 'Preset deleted' : 'Delete failed');
  };

  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  return (
    <div className="space-y-5">
      <div className={cardClass}>
        <h3 className={headingClass}><span className="inline-flex items-center gap-1.5"><Volume2 className="w-3.5 h-3.5" /> Sensory Focus Synth</span></h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Playback is synthesized locally in your browser — nothing is streamed, no AI involved.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold text-zinc-500 flex items-center gap-2">
            Volume
            <input type="range" min={0} max={100} value={volume} onChange={e => setVolume(Number(e.target.value))} className="accent-rose-500" />
          </label>
          {playing && <span className="font-mono text-[10px] text-rose-500 font-bold">{mmss}</span>}
          {playing && <button type="button" className={secondaryBtn} onClick={stopAll}><span className="inline-flex items-center gap-1.5"><Square className="w-3 h-3" /> Stop all</span></button>}
        </div>

        <div className="space-y-2">
          {RECIPES.map(r => (
            <div key={r.key} className={`border rounded-2xl p-3.5 flex items-center gap-3 transition-colors ${playing === r.key ? 'border-rose-300 dark:border-rose-500/40 bg-rose-50/50 dark:bg-rose-950/20' : 'border-zinc-100 dark:border-zinc-800'}`}>
              <button type="button" className={playing === r.key ? primaryBtn : secondaryBtn} onClick={() => toggle(r.key)}>
                {playing === r.key ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <div>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100">{r.name}</p>
                <p className="text-[10px] text-zinc-400">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={cardClass}>
        <h3 className={headingClass}>Saved Presets ({presets.length})</h3>
        <div className="flex flex-wrap gap-2">
          <input className={inputClass + ' flex-1 min-w-[160px]'} placeholder="Preset name" value={presetName} onChange={e => setPresetName(e.target.value)} />
          <button type="button" className={primaryBtn} onClick={savePreset}>Save current as preset</button>
        </div>
        {presets.length === 0 ? (
          <p className="text-xs text-zinc-400">No saved presets yet. Presets persist to the database and are available on every admin device.</p>
        ) : (
          <div className="space-y-2">
            {presets.map((p, i) => (
              <div key={i} className="border border-zinc-100 dark:border-zinc-800 rounded-2xl p-3.5 flex items-center gap-3 text-xs">
                <span className="font-bold text-zinc-800 dark:text-zinc-100">{p.name}</span>
                <span className="font-mono text-[9px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-500">{p.recipe}</span>
                <span className="text-zinc-400">vol {p.volume}</span>
                <div className="ml-auto flex gap-1.5">
                  <button type="button" className={secondaryBtn + ' !px-3 !py-1.5'} onClick={() => { setVolume(p.volume ?? 50); playRecipe(p.recipe as RecipeKey); }}>Load</button>
                  <button type="button" className={secondaryBtn + ' !px-3 !py-1.5 hover:!bg-rose-50 dark:hover:!bg-rose-950/40'} onClick={() => deletePreset(i)}>
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6. AI FEATURES — honest registry with live status + toggles
// ---------------------------------------------------------------------------
export function AiFeaturesPane({ triggerToast, siteSettings, setSiteSettings, saveSettings }: PaneProps) {
  const [status, setStatus] = useState<{ gemini_configured: boolean; elevenlabs_configured: boolean } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminJsonFetch('/api/ai/status')
      .then(setStatus)
      .catch(e => setError(e.message || 'Could not load AI status.'));
  }, []);

  const toggles = (siteSettings?.ai_feature_toggles as any) || {};
  const isEnabled = (id: string) => toggles[id] !== false;

  const FEATURES = [
    { id: 'writer', name: 'AI Article Writer', desc: 'Generates complete article drafts (title, SEO, body) from a topic, inside the post editor.', requires: 'gemini' },
    { id: 'inserts', name: 'In-Article Insert Generator', desc: 'Creates custom relationship exercises, quizzes and reflective prompts inside articles.', requires: 'gemini' },
    { id: 'guide', name: 'Reader Advice Guide', desc: 'The ask-a-question advice widget for readers, grounded in the published library.', requires: 'gemini' },
    { id: 'translation', name: 'Article Translation Engine', desc: 'Translates articles into the 33 supported site languages.', requires: null },
    { id: 'sentiment', name: 'Sentiment Guard Scanner', desc: 'Tone and reader-safety scans of recent articles and comments.', requires: 'gemini' },
    { id: 'tts', name: 'Voice Narration', desc: 'Neural text-to-speech narration of articles for readers.', requires: 'elevenlabs' }
  ] as const;

  const configured = (requires: string | null) =>
    requires === null ? true : (requires === 'gemini' ? status?.gemini_configured : status?.elevenlabs_configured);

  const flip = async (id: string, next: boolean) => {
    const updated = { ...siteSettings, ai_feature_toggles: { ...toggles, [id]: next } };
    const ok = await saveSettings(updated);
    if (ok) triggerToast('Feature toggle saved');
    else triggerToast('Toggle save failed');
  };

  return (
    <div className="space-y-5">
      <div className={cardClass}>
        <h3 className={headingClass}>AI Intelligence Suite</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          The real AI capabilities wired into Heartsync, with live configuration status. Toggles control
          where each feature appears in the editor and on the site.
        </p>
        {error && <p className="text-xs text-rose-500">{error}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {FEATURES.map(f => {
          const ok = status ? configured(f.requires) : null;
          return (
            <div key={f.id} className="border border-zinc-100 dark:border-zinc-800 rounded-3xl p-5 space-y-2 bg-white dark:bg-zinc-900">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-black text-zinc-800 dark:text-zinc-100">{f.name}</p>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isEnabled(f.id)}
                  disabled={ok === false}
                  onClick={() => flip(f.id, !isEnabled(f.id))}
                  className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer shrink-0 ${ok === false ? 'opacity-40 cursor-not-allowed' : ''} ${isEnabled(f.id) ? 'bg-rose-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                  title={ok === false ? 'Configure the required API key first' : ''}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${isEnabled(f.id) ? 'left-4.5' : 'left-0.5'}`} style={{ left: isEnabled(f.id) ? '18px' : '2px' }} />
                </button>
              </div>
              <p className="text-[10px] text-zinc-400">{f.desc}</p>
              {status && (ok ? (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Operational
                </p>
              ) : (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold inline-flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Needs API key in Integrations
                </p>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
