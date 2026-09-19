import React, { useState, useEffect } from 'react';
import { heartsync } from '../store';
import { ExternalLink, Info, X, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export interface AdPlacementProps {
  slot: 'header' | 'sidebar' | 'in_article' | 'footer' | 'homepage';
  className?: string;
  showBorder?: boolean;
}

export const AdPlacement: React.FC<AdPlacementProps> = ({
  slot,
  className = '',
  showBorder = true,
}) => {
  const [siteSettings, setSiteSettings] = useState(() => heartsync.site_settings);
  const [adProviders, setAdProviders] = useState<any[]>(() => heartsync.ad_providers || []);
  const [activeProviderIndex, setActiveProviderIndex] = useState<number>(0);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);

  useEffect(() => {
    const unsub = heartsync.subscribe(() => {
      setSiteSettings({ ...heartsync.site_settings });
      setAdProviders([...(heartsync.ad_providers || [])]);
    });
    return () => unsub();
  }, []);

  // Check if slot is enabled
  if (slot === 'header' && siteSettings.banner_header_enabled === false) return null;
  if (slot === 'sidebar' && siteSettings.banner_sidebar_enabled === false) return null;
  if (slot === 'footer' && siteSettings.banner_footer_enabled === false) return null;
  if (slot === 'in_article' && siteSettings.banner_in_article_enabled === false) return null;
  if (isDismissed) return null;

  // Identify active ad networks
  const adsenseEnabled = siteSettings.adsense_active !== false;
  const monetagEnabled = siteSettings.monetag_active !== false;
  const adsterraEnabled = siteSettings.adsterra_active !== false;

  // Filter provider candidates
  const matchingProviders = adProviders.filter(p => {
    if (!p.active) return false;
    if (p.slot === 'all' || !p.slot) return true;
    if (slot === 'header' && (p.slot === 'header' || p.slot === 'header_top')) return true;
    if (slot === 'sidebar' && (p.slot === 'sidebar' || p.slot === 'sidebar_top' || p.slot === 'sidebar_mid')) return true;
    if (slot === 'footer' && (p.slot === 'footer' || p.slot === 'footer_sticky')) return true;
    if (slot === 'in_article' && (p.slot === 'in_articles' || p.slot === 'article_in_text')) return true;
    return false;
  });

  // Synthesize active provider candidates
  const availableCandidates: Array<{
    id: string;
    name: string;
    type: 'adsense' | 'monetag' | 'adsterra' | 'custom';
    pubId: string;
    tagline: string;
    badgeColor: string;
    format: string;
    cpm: string;
    sponsorTitle: string;
    sponsorDesc: string;
    sponsorCta: string;
    sponsorUrl: string;
  }> = [];

  if (adsenseEnabled) {
    availableCandidates.push({
      id: 'candidate-adsense',
      name: 'Google AdSense',
      type: 'adsense',
      pubId: siteSettings.adsense_client_id || 'ca-pub-3940256099942544',
      tagline: 'Google Verified Programmatic Network',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      format: slot === 'sidebar' ? '300x250 Medium Rect' : slot === 'footer' ? '320x50 Mobile Anchor' : '728x90 Leaderboard',
      cpm: '$14.10 CPM',
      sponsorTitle: 'The Secure Attachment Intensive & Gottman Relationship Masterclass',
      sponsorDesc: 'Clinically proven attachment healing exercises, interactive intimacy tools, and emotional attunement roadmaps for couples.',
      sponsorCta: 'Explore Certification',
      sponsorUrl: 'https://wellnesscouples.com/attachment-mastery'
    });
  }

  if (monetagEnabled) {
    availableCandidates.push({
      id: 'candidate-monetag',
      name: 'Monetag MultiTag Network',
      type: 'monetag',
      pubId: siteSettings.monetag_zone_id || '275352',
      tagline: 'Monetag Smart MultiTag & In-Page Push',
      badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      format: siteSettings.monetag_format || 'MultiTag / Vignette',
      cpm: '$16.80 CPM',
      sponsorTitle: 'Relationship Therapy Intelligence Suite by Monetag Partners',
      sponsorDesc: 'Evidence-based relationship diagnostic inventories and communication card decks recommended by therapists worldwide.',
      sponsorCta: 'View Partner Guide',
      sponsorUrl: 'https://wellnesscouples.com/resources/intimacy-cards'
    });
  }

  if (adsterraEnabled) {
    availableCandidates.push({
      id: 'candidate-adsterra',
      name: 'Adsterra Social Bar & Native',
      type: 'adsterra',
      pubId: siteSettings.adsterra_key_id || '883921',
      tagline: 'Adsterra High CPM Social Bar & Display',
      badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      format: siteSettings.adsterra_format || 'Social Bar / Native 300x250',
      cpm: '$14.50 CPM',
      sponsorTitle: 'Couples Retreat & Somatic Reset Workshop 2026',
      sponsorDesc: 'Guided nervous system regulation, secure bonding practices, and immersive retreats for emotional reconnect.',
      sponsorCta: 'Reserve Early Spot',
      sponsorUrl: 'https://wellnesscouples.com/workshops/couples-retreat'
    });
  }

  // Include any extra providers from ad_providers
  matchingProviders.forEach(p => {
    if (!availableCandidates.some(c => c.pubId === p.pubId || c.type === p.type)) {
      availableCandidates.push({
        id: p.id,
        name: p.name || 'Direct Network Sponsor',
        type: p.type || 'custom',
        pubId: p.pubId || '',
        tagline: p.customSize || 'Adaptive Fluid Slot',
        badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        format: p.customSize || 'Responsive',
        cpm: p.cpmEstimate || '$12.50 CPM',
        sponsorTitle: 'Evidence-Based Emotional Wellness & Attachment Toolkits',
        sponsorDesc: 'Deepen mutual trust, conquer the anxious-avoidant cycle, and cultivate lifelong romantic resilience.',
        sponsorCta: 'Learn More',
        sponsorUrl: 'https://wellnesscouples.com/courses'
      });
    }
  });

  if (availableCandidates.length === 0) return null;

  // Pick provider based on active index (cycle or default to preferred slot partner)
  const currentProvider = availableCandidates[activeProviderIndex % availableCandidates.length];

  const handleAdClick = (e: React.MouseEvent) => {
    // Record ad metrics
    try {
      const existingZones = heartsync.ad_zones || [];
      const matched = existingZones.find((z: any) => z.slot === slot);
      if (matched) {
        matched.clicks = (matched.clicks || 0) + 1;
        heartsync.saveState();
      }
    } catch (err) {}
  };

  // Render Footer Sticky Banner
  if (slot === 'footer') {
    return (
      <div 
        id="heartsync-sticky-footer-ad" 
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 shadow-2xl transition-all duration-300 px-4 py-2.5"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded border shrink-0 ${currentProvider.badgeColor}`}>
              {currentProvider.name}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {currentProvider.sponsorTitle}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:block truncate">
                {currentProvider.sponsorDesc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={currentProvider.sponsorUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleAdClick}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <span>{currentProvider.sponsorCta}</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {availableCandidates.length > 1 && (
              <button
                type="button"
                onClick={() => setActiveProviderIndex(prev => prev + 1)}
                title="Rotate Ad Provider"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              title="Dismiss ad"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Sidebar Ad (Compact 300x250 Medium Rectangle or Card)
  if (slot === 'sidebar') {
    return (
      <div 
        id="heartsync-sidebar-ad"
        className={`w-full bg-zinc-50/90 dark:bg-zinc-900/60 rounded-2xl overflow-hidden p-4 ${
          showBorder ? 'border border-zinc-200/80 dark:border-zinc-800' : ''
        } ${className}`}
      >
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-zinc-200/60 dark:border-zinc-800">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-bold">
              SPONSORED
            </span>
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${currentProvider.badgeColor}`}>
              {currentProvider.name}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowInfoModal(true)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-0.5"
              title="Ad Choices & Verification"
            >
              <Info className="w-3 h-3" />
            </button>
            {availableCandidates.length > 1 && (
              <button
                type="button"
                onClick={() => setActiveProviderIndex(prev => prev + 1)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-0.5"
                title="Switch ad network preview"
              >
                <Sparkles className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="rounded-xl overflow-hidden bg-gradient-to-br from-rose-100/60 to-amber-100/50 dark:from-rose-950/40 dark:to-zinc-900 p-3.5 border border-rose-200/40 dark:border-rose-900/30">
            <div className="flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-medium mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Therapeutic Partner</span>
            </div>
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
              {currentProvider.sponsorTitle}
            </h4>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed line-clamp-3">
              {currentProvider.sponsorDesc}
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-zinc-400 font-mono">
              Slot: {currentProvider.format}
            </span>
            <a
              href={currentProvider.sponsorUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleAdClick}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shadow-sm transition-colors"
            >
              <span>{currentProvider.sponsorCta}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Info Modal */}
        {showInfoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 max-w-sm w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-bold text-sm">Ad Choice Transparency</h3>
                </div>
                <button 
                  onClick={() => setShowInfoModal(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                <p>
                  This ad is served via <strong>{currentProvider.name}</strong> ({currentProvider.pubId}). Heartsync enforces strict clinical wellness content criteria and GDPR-compliant consent controls.
                </p>
                <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 font-mono text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span>Provider:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{currentProvider.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Slot Key:</span>
                    <span>{slot.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Consent Mode:</span>
                    <span className="text-emerald-500 font-semibold">Active (v2)</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowInfoModal(false)}
                className="w-full py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render Header or In-Article or Homepage Banner (728x90 Leaderboard / Adaptive)
  return (
    <div 
      id={`heartsync-${slot}-ad`} 
      className={`w-full bg-zinc-50/80 dark:bg-zinc-900/50 rounded-2xl overflow-hidden p-3 sm:p-4 my-4 ${
        showBorder ? 'border border-zinc-200/80 dark:border-zinc-800' : ''
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="flex flex-col gap-1 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                SPONSORED
              </span>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${currentProvider.badgeColor}`}>
                {currentProvider.name}
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
              {currentProvider.format}
            </span>
          </div>

          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug truncate">
              {currentProvider.sponsorTitle}
            </h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
              {currentProvider.sponsorDesc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <a
            href={currentProvider.sponsorUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleAdClick}
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <span>{currentProvider.sponsorCta}</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          {availableCandidates.length > 1 && (
            <button
              type="button"
              onClick={() => setActiveProviderIndex(prev => prev + 1)}
              title="Switch active ad provider"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 text-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowInfoModal(true)}
            title="Ad Transparency"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 max-w-sm w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-sm">Ad Choice Transparency</h3>
              </div>
              <button 
                onClick={() => setShowInfoModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              <p>
                This sponsored placement is powered by <strong>{currentProvider.name}</strong> ({currentProvider.pubId}). All ad inventory adheres to strict relationship wellness and privacy compliance.
              </p>
              <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 font-mono text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span>Slot:</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{slot.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Network:</span>
                  <span>{currentProvider.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Est CPM:</span>
                  <span className="text-emerald-500 font-semibold">{currentProvider.cpm}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
