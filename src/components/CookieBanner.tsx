import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCookieConsent } from './useCookieConsent';
import { useDialogA11y } from '../utils/a11y';
import { SlidersHorizontal, Cookie, Lock, Check, X } from 'lucide-react';

interface CookieBannerProps {
  onLearnMore: () => void;
}

/**
 * Heartsync Cookie Consent - first layer is a compact, brand-matched card
 * that docks to the bottom of the screen (bottom-left on desktop, full-width
 * on mobile). The detailed "how we use cookies" explanation lives one tap
 * away in the preferences modal, so the first impression stays light while
 * full GDPR disclosure remains a single interaction away.
 *
 * Both layers adapt to the site theme (light glass / dark glass).
 */
export const CookieBanner: React.FC<CookieBannerProps> = ({ onLearnMore }) => {
  const {
    hasConsented,
    isInitialLoaded,
    preferences,
    acceptAll,
    rejectAll,
    savePreferences
  } = useCookieConsent();

  const [isModalOpen, setIsModalOpen] = useState(false);
  // WAI-ARIA dialog behavior: Escape closes, Tab trapped, focus restored.
  const dialogRef = useDialogA11y(isModalOpen, () => setIsModalOpen(false));

  // Modal local toggle states
  const [analyticsEnabled, setAnalyticsEnabled] = useState(preferences.analytics);
  const [marketingEnabled, setMarketingEnabled] = useState(preferences.marketing);
  const [functionalEnabled, setFunctionalEnabled] = useState(preferences.functional);

  // Sync state if preferences load later
  useEffect(() => {
    setAnalyticsEnabled(preferences.analytics);
    setMarketingEnabled(preferences.marketing);
    setFunctionalEnabled(preferences.functional);
  }, [preferences]);

  // Global event listener to easily reopen preferences modal from other files
  useEffect(() => {
    const handleReopen = () => {
      setAnalyticsEnabled(preferences.analytics);
      setMarketingEnabled(preferences.marketing);
      setFunctionalEnabled(preferences.functional);
      setIsModalOpen(true);
    };
    window.addEventListener('heartsync-open-cookie-preferences', handleReopen);
    return () => {
      window.removeEventListener('heartsync-open-cookie-preferences', handleReopen);
    };
  }, [preferences]);

  if (!isInitialLoaded) {
    return null;
  }

  const handleSavePreferences = () => {
    savePreferences({
      necessary: true,
      analytics: analyticsEnabled,
      marketing: marketingEnabled,
      functional: functionalEnabled,
    });
    setIsModalOpen(false);
  };

  const handleAcceptAll = () => {
    acceptAll();
    setIsModalOpen(false);
  };

  const handleRejectAll = () => {
    rejectAll();
    setIsModalOpen(false);
  };

  const handleOpenModal = () => {
    setAnalyticsEnabled(preferences.analytics);
    setMarketingEnabled(preferences.marketing);
    setFunctionalEnabled(preferences.functional);
    setIsModalOpen(true);
  };

  // Shared glass-panel styling: light theme + dark theme variants, matching
  // the site's editorial look (soft blur, hairline border, rose accent).
  const panelClass =
    'bg-white/95 dark:bg-zinc-950/92 backdrop-blur-xl border border-zinc-200/80 dark:border-white/10 text-zinc-800 dark:text-zinc-100';

  return (
    <>
      <AnimatePresence>
        {!hasConsented && (
          <div className="fixed inset-x-4 bottom-4 z-[999999] flex justify-center sm:inset-x-auto sm:bottom-5 sm:left-5 sm:justify-start">
            <motion.div
              id="heartsync-cookie-consent-banner"
              role="dialog"
              aria-modal="false"
              aria-label="Heartsync Cookie Consent"
              aria-describedby="heartsync-cookie-consent-desc"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={`pointer-events-auto w-full max-w-md rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.22)] p-5 md:p-6 flex flex-col gap-4 ${panelClass}`}
            >
              {/* Compact header */}
              <div className="flex items-center gap-3 text-left">
                <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                  <Cookie className="w-4.5 h-4.5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-sans font-semibold text-[15px] md:text-base text-zinc-900 dark:text-white tracking-tight">
                    Before you continue to Heartsync
                  </h3>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 dark:text-zinc-500 mt-0.5">
                    Privacy &amp; Cookie Consent
                  </p>
                </div>
              </div>

              {/* One short, human line - the full disclosure lives one tap
                  away ("More options" modal) and in the Cookie Policy. */}
              <p
                id="heartsync-cookie-consent-desc"
                className="text-[13px] md:text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 text-left"
              >
                We use cookies to keep Heartsync running, keep you secure, and
                improve what you see. Choose what you're comfortable with - you
                can change this anytime.{' '}
                <button
                  onClick={onLearnMore}
                  className="text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer outline-none inline bg-transparent border-none p-0 transition-colors focus-visible:ring-2 focus-visible:ring-rose-500 rounded"
                >
                  Cookie Policy
                </button>
              </p>

              {/* Actions - thumb friendly on mobile, compact on desktop */}
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <button
                  type="button"
                  onClick={handleRejectAll}
                  className="h-11 px-5 rounded-xl bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition-all cursor-pointer outline-none active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-rose-500 sm:flex-1"
                >
                  Reject all
                </button>

                <button
                  type="button"
                  onClick={handleOpenModal}
                  aria-label="Customize cookie options and preferences"
                  className="h-11 px-5 rounded-xl bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition-all cursor-pointer outline-none active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-rose-500 sm:flex-1"
                >
                  More options
                </button>

                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="h-11 px-6 rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-500 hover:from-rose-400 hover:to-fuchsia-400 text-white font-bold text-xs transition-all cursor-pointer outline-none active:scale-[0.98] shadow-[0_10px_30px_-10px_rgba(244,63,94,0.6)] focus-visible:ring-2 focus-visible:ring-rose-500 sm:flex-1"
                >
                  Accept all
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preferences Management Modal - holds the full disclosure text plus
          the granular toggles. */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="heartsync-modal-title"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className={`relative w-full max-w-md rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col gap-5 z-10 ${panelClass}`}
            >
              <div className="flex justify-between items-center pb-3 border-b border-zinc-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-rose-600 dark:text-rose-400" aria-hidden="true" />
                  <h2 id="heartsync-modal-title" className="text-base font-serif font-bold text-zinc-900 dark:text-white">
                    Cookie Preferences
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors focus:ring-2 focus:ring-rose-500 outline-none"
                  aria-label="Close preferences"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable body: full disclosure + preference items */}
              <div className="flex flex-col gap-5 max-h-[55vh] md:max-h-[60vh] overflow-y-auto pr-1">
                {/* Full disclosure (moved from the old banner) */}
                <div className="space-y-3 text-xs md:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed text-left">
                  <p className="font-semibold text-zinc-800 dark:text-zinc-100">We use cookies and data to:</p>
                  <ul className="list-disc list-inside pl-2 space-y-1">
                    <li>Deliver and maintain our premium relationship self-care services</li>
                    <li>Track outages and protect against spam, bad practice, and abuse</li>
                    <li>Measure reader engagement and site statistics to understand how our services are used and enhance the quality of those services</li>
                  </ul>

                  <p className="pt-2">
                    If you choose <span className="font-semibold text-zinc-800 dark:text-zinc-100">"Accept all"</span>, we will also use cookies and data to:
                  </p>
                  <ul className="list-disc list-inside pl-2 space-y-1">
                    <li>Develop and improve new emotional wellness features and tools</li>
                    <li>Deliver and measure the effectiveness of Adsense partner campaigns</li>
                    <li>Show personalized content, depending on your wellness settings</li>
                    <li>Show personalized ads, depending on your choices</li>
                  </ul>

                  <p className="pt-2 text-zinc-500 dark:text-zinc-400">
                    If you choose <span className="font-semibold text-zinc-700 dark:text-zinc-200">"Reject all"</span>, we will not use cookies for these additional purposes. Non-personalized content and ads are influenced by things like the essays you are currently viewing, activity in your active reading session, and your general location. You can learn more in our{' '}
                    <button
                      onClick={onLearnMore}
                      className="text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer outline-none inline bg-transparent border-none p-0 transition-colors focus-visible:ring-2 focus-visible:ring-rose-500 rounded"
                    >
                      Cookie Policy
                    </button>
                    .
                  </p>
                </div>

                {/* Preference Items */}
                <div className="flex flex-col gap-3">
                  {/* 1. Necessary (Always Checked) */}
                  <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-150 dark:border-white/10">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-900 dark:text-white">Necessary Cookies</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
                          Required
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                        Required for authentic administrative logons, security checks, and keeping your standard selections active.
                      </p>
                    </div>
                    <div className="flex items-center shrink-0">
                      <div className="relative inline-flex h-6 w-11 cursor-not-allowed rounded-full bg-rose-600 opacity-60 items-center justify-end px-1.5">
                        <Lock className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* 2. Analytics */}
                  <div className="flex items-start justify-between gap-4 p-4 rounded-2xl border border-zinc-150 dark:border-white/10 hover:bg-zinc-50/50 dark:hover:bg-white/5 transition-all">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">Analytics Cookies</span>
                      <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                        Helps us analyze traffic metrics and co-reflect on visitor patterns to improve our relationship guidance essays.
                      </p>
                    </div>
                    <div className="flex items-center shrink-0">
                      <button
                        role="switch"
                        aria-checked={analyticsEnabled}
                        onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-950 ${
                          analyticsEnabled ? 'bg-rose-600' : 'bg-zinc-200 dark:bg-zinc-700'
                        }`}
                        aria-label="Analytics cookies"
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            analyticsEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* 3. Marketing */}
                  <div className="flex items-start justify-between gap-4 p-4 rounded-2xl border border-zinc-150 dark:border-white/10 hover:bg-zinc-50/50 dark:hover:bg-white/5 transition-all">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">Marketing &amp; Advertising</span>
                      <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                        Enables personalized AdSense banners and Meta campaigns that match your self-care and emotional healing interests.
                      </p>
                    </div>
                    <div className="flex items-center shrink-0">
                      <button
                        role="switch"
                        aria-checked={marketingEnabled}
                        onClick={() => setMarketingEnabled(!marketingEnabled)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-950 ${
                          marketingEnabled ? 'bg-rose-600' : 'bg-zinc-200 dark:bg-zinc-700'
                        }`}
                        aria-label="Marketing cookies"
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            marketingEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* 4. Functional */}
                  <div className="flex items-start justify-between gap-4 p-4 rounded-2xl border border-zinc-150 dark:border-white/10 hover:bg-zinc-50/50 dark:hover:bg-white/5 transition-all">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">Functional Cookies</span>
                      <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                        Remembers custom dashboard widgets, translation configurations, text-to-speech toggles, and user interfaces.
                      </p>
                    </div>
                    <div className="flex items-center shrink-0">
                      <button
                        role="switch"
                        aria-checked={functionalEnabled}
                        onClick={() => setFunctionalEnabled(!functionalEnabled)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-950 ${
                          functionalEnabled ? 'bg-rose-600' : 'bg-zinc-200 dark:bg-zinc-700'
                        }`}
                        aria-label="Functional cookies"
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            functionalEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save / Save All Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-2 border-t border-zinc-100 dark:border-white/10 pt-4">
                <button
                  onClick={handleSavePreferences}
                  className="py-2.5 px-4 font-bold text-xs rounded-xl cursor-pointer bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/15 text-zinc-800 dark:text-zinc-100 active:scale-[0.98] transition-all text-center focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-950 outline-none h-11 flex items-center justify-center"
                >
                  Save Settings
                </button>

                <button
                  onClick={handleAcceptAll}
                  className="py-2.5 px-4 font-bold text-xs rounded-xl cursor-pointer bg-gradient-to-r from-rose-500 to-fuchsia-500 hover:from-rose-400 hover:to-fuchsia-400 text-white active:scale-[0.98] transition-all text-center focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-950 outline-none h-11 flex items-center justify-center gap-1.5 shadow-sm shadow-rose-500/15"
                >
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  Allow All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* The floating cookie button was moved to the footer: Footer.tsx's
          "Cookie Settings" link dispatches 'heartsync-open-cookie-preferences',
          which the listener above catches to reopen this modal. */}
    </>
  );
};
