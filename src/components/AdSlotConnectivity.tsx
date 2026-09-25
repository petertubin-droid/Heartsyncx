import React, { useState } from 'react';
import { heartsync } from '../store';
import { adsterraDomainFromUrlField, normalizeAdsterraUnit, type AdsterraUnitRef } from './AdPlacement';

/**
 * Ad-slot connectivity checker (admin "Placements" tab).
 *
 * Mirrors AdPlacement.tsx's per-slot provider chain - AdSense -> Adsterra
 * (banner / native banner) -> Monetag (native banner) -> nothing - and shows,
 * for every physical slot on the website, WHICH provider is configured to
 * fill it and whether that provider's unit is actually reachable/serving.
 *
 * Live reachability checks (admin-only convenience, run on button press):
 * - Adsterra: GET https://<domain>/<key>/invoke.js (CORS: ACAO * confirmed)
 *   200 = serving, 403 = unit refused (paused/banned/site not approved),
 *   redirect = unit id does not exist, network error = domain unreachable.
 * - Monetag: fetch of the zone tag.min.js with mode 'no-cors' (opaque) -
 *   resolved = tag reachable, rejected = unreachable.
 * - AdSense: approval status cannot be queried from the browser; the panel
 *   shows configuration only (client id + slot id).
 */

type SlotFamily = 'header' | 'sidebar' | 'in_article' | 'footer' | 'homepage' | 'article_bottom';

const SLOTS: Array<{ slot: SlotFamily; label: string; where: string }> = [
  { slot: 'header', label: 'Header (728x90)', where: 'Below navbar - desktop only' },
  { slot: 'sidebar', label: 'Sidebar (300x250)', where: 'Article sidebar' },
  { slot: 'in_article', label: 'In-article (300x250)', where: 'Inside article body' },
  { slot: 'footer', label: 'Footer (468x60)', where: 'Site-wide footer' },
  { slot: 'homepage', label: 'Homepage (300x250)', where: 'Homepage feed' },
  { slot: 'article_bottom', label: 'Article bottom (300x250)', where: 'End of every article' }
];

type CheckStatus = 'idle' | 'checking' | 'ok' | 'refused' | 'missing' | 'unreachable' | 'unconfigured';

interface SlotCheck {
  status: CheckStatus;
  detail: string;
}

function settings(): Record<string, unknown> {
  return heartsync.site_settings as Record<string, unknown>;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

interface ResolvedProvider {
  provider: 'adsense' | 'adsterra' | 'monetag' | 'none';
  label: string;
  probeUrl: string | null;
}

function resolveSlotProvider(slot: SlotFamily): ResolvedProvider {
  const s = settings();
  const adsenseActive = s.adsense_active !== false;
  const adsenseSlotId = str(s[`adsense_slot_${slot}`]);
  const publisherId = str(s.adsense_client_id);
  if (adsenseActive && /^ca-pub-\d{10,}$/.test(publisherId) && /^\d{9,16}$/.test(adsenseSlotId)) {
    return { provider: 'adsense', label: `AdSense slot ${adsenseSlotId}`, probeUrl: null };
  }

  const adsterraActive = s.adsterra_active !== false;
  const keyField = str(s[`adsterra_key_${slot}`]);
  const urlField = str(s[`adsterra_url_${slot}`]);
  // Same parser the renderer uses (single source of truth): understands
  // bare keys, atOptions banner snippets, and Native Banner tags
  // (native.js, or invoke.js + container-<key> on the account subdomain).
  const unit: AdsterraUnitRef | null =
    normalizeAdsterraUnit(keyField) || normalizeAdsterraUnit(urlField);
  if (adsterraActive && unit) {
    const key = unit.key;
    const domain = unit.native
      ? unit.domain
      : adsterraDomainFromUrlField(urlField) || unit.domain;
    const script = unit.native ?? 'invoke';
    return {
      provider: 'adsterra',
      label: `Adsterra ${unit.native ? 'native banner' : 'banner'} unit ${key}`,
      probeUrl: `https://${domain}/${key}/${script}.js`
    };
  }

  const monetagActive = s.monetag_active !== false;
  const zoneField = str(s[`monetag_zone_${slot}`]);
  const zoneSrc = zoneField.match(/https?:\/\/[^"'\s\\]+\/tag\.min\.js/i)?.[0];
  const zoneMatch =
    zoneField.match(/data-zone=["']?(\d{4,12})/i) ||
    zoneField.match(/\/(\d{4,12})\/tag\.min\.js/i) ||
    (/^\d{4,12}$/.test(zoneField) ? [zoneField, zoneField] : null);
  if (monetagActive && (zoneSrc || zoneMatch)) {
    const zone = (zoneMatch?.[1] || '').trim();
    return { provider: 'monetag', label: zone ? `Monetag native banner zone ${zone}` : 'Monetag native banner', probeUrl: zoneSrc || null };
  }

  return { provider: 'none', label: 'No provider configured', probeUrl: null };
}

async function probeAdsterra(url: string): Promise<SlotCheck> {
  try {
    const res = await fetch(url, { method: 'GET', cache: 'no-store' });
    if (res.ok) return { status: 'ok', detail: 'Unit reachable and serving (HTTP 200)' };
    if (res.status === 403) return { status: 'refused', detail: 'HTTP 403 - Adsterra refuses to serve this unit. Check in the Adsterra dashboard: unit active (not paused/banned) and heartsyncx.netlify.app approved for it.' };
    if (res.type === 'opaqueredirect' || res.status === 301 || res.status === 302) return { status: 'missing', detail: 'Redirected - this unit id does not exist at Adsterra. Re-copy the snippet from the dashboard.' };
    return { status: 'unreachable', detail: `HTTP ${res.status} from the unit endpoint.` };
  } catch {
    return { status: 'unreachable', detail: 'Network request failed - serving domain unreachable.' };
  }
}

async function probeMonetag(url: string): Promise<SlotCheck> {
  try {
    // no-cors: Monetag's tag endpoint does not send CORS headers, so the
    // response is opaque - resolution itself proves reachability.
    await fetch(url, { method: 'GET', mode: 'no-cors', cache: 'no-store' });
    return { status: 'ok', detail: 'Zone tag reachable (opaque check passed)' };
  } catch {
    return { status: 'unreachable', detail: 'Zone tag unreachable - check the zone/domain in the Monetag dashboard.' };
  }
}

export const AdSlotConnectivity: React.FC = () => {
  const [, force] = useState(0);
  const [checks, setChecks] = useState<Partial<Record<SlotFamily, SlotCheck>>>({});
  const [running, setRunning] = useState(false);

  const runChecks = async () => {
    setRunning(true);
    const next: Partial<Record<SlotFamily, SlotCheck>> = {};
    for (const { slot } of SLOTS) {
      const resolved = resolveSlotProvider(slot);
      if (resolved.provider === 'adsterra' && resolved.probeUrl) {
        next[slot] = await probeAdsterra(resolved.probeUrl);
      } else if (resolved.provider === 'monetag' && resolved.probeUrl) {
        next[slot] = await probeMonetag(resolved.probeUrl);
      } else if (resolved.provider === 'adsense') {
        next[slot] = { status: 'ok', detail: 'Configured - AdSense serves only after Google approves the site and the unit id is valid.' };
      } else {
        next[slot] = { status: 'unconfigured', detail: 'Empty slot - visitors see no ad for this placement. Configure AdSense, an Adsterra banner/native banner unit, or a Monetag native banner zone.' };
      }
      setChecks({ ...next });
    }
    setRunning(false);
    force((v) => v + 1);
  };

  const badge = (c?: SlotCheck) => {
    if (!c) return <span className="text-[10px] text-zinc-400">-</span>;
    const map: Record<CheckStatus, { cls: string; text: string }> = {
      idle: { cls: 'bg-zinc-100 text-zinc-500', text: '-' },
      checking: { cls: 'bg-blue-100 text-blue-600', text: 'checking...' },
      ok: { cls: 'bg-emerald-100 text-emerald-700', text: 'OK' },
      refused: { cls: 'bg-red-100 text-red-700', text: '403 refused' },
      missing: { cls: 'bg-amber-100 text-amber-700', text: 'unit missing' },
      unreachable: { cls: 'bg-red-100 text-red-700', text: 'unreachable' },
      unconfigured: { cls: 'bg-zinc-100 text-zinc-500', text: 'unconfigured' }
    };
    const m = map[c.status];
    return <span className={`px-2 py-0.5 rounded-full font-bold font-mono text-[9px] whitespace-nowrap ${m.cls}`}>{m.text}</span>;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Slot to Provider connectivity (chain per slot: AdSense, then Adsterra, then Monetag, then reserved)
        </span>
        <button
          type="button"
          disabled={running}
          onClick={runChecks}
          className="px-3 py-1.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
        >
          {running ? 'Checking...' : 'Run live checks'}
        </button>
      </div>
      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-950 text-zinc-400 text-left">
              <th className="p-2 font-bold uppercase tracking-wider text-[9px]">Slot</th>
              <th className="p-2 font-bold uppercase tracking-wider text-[9px]">Position</th>
              <th className="p-2 font-bold uppercase tracking-wider text-[9px]">Serving provider</th>
              <th className="p-2 font-bold uppercase tracking-wider text-[9px]">Reachability</th>
              <th className="p-2 font-bold uppercase tracking-wider text-[9px]">Detail</th>
            </tr>
          </thead>
          <tbody>
            {SLOTS.map(({ slot, label, where }) => {
              const resolved = resolveSlotProvider(slot);
              const c = checks[slot];
              return (
                <tr key={slot} className="border-t border-zinc-100 dark:border-zinc-900">
                  <td className="p-2 font-semibold text-zinc-700 dark:text-zinc-200 whitespace-nowrap">{label}</td>
                  <td className="p-2 text-zinc-400 whitespace-nowrap">{where}</td>
                  <td className="p-2 font-mono whitespace-nowrap">
                    {resolved.provider === 'adsense' && <span className="text-blue-600 dark:text-blue-400">AdSense</span>}
                    {resolved.provider === 'adsterra' && <span className="text-amber-600 dark:text-amber-400">Adsterra</span>}
                    {resolved.provider === 'monetag' && <span className="text-sky-600 dark:text-sky-400">Monetag</span>}
                    {resolved.provider === 'none' && <span className="text-zinc-400">none</span>}
                    <span className="block text-[9px] text-zinc-400">{resolved.label}</span>
                  </td>
                  <td className="p-2">{badge(c)}</td>
                  <td className="p-2 text-zinc-400 leading-snug">{c?.detail || (resolved.provider === 'none' ? 'Configure this slot on the AdSense / Adsterra / Monetag tabs.' : 'Press "Run live checks".')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-zinc-400 leading-relaxed">
        Checks run from your browser against each provider's serving endpoint. Adsterra 403 = the unit exists but serving is refused (paused/banned or the website is not approved for the unit) - fix that in the Adsterra dashboard, then re-run. All ad serving still requires visitor cookie consent with marketing accepted.
      </p>
    </div>
  );
};

export default AdSlotConnectivity;
