import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCookieConsent } from './useCookieConsent';
import { Settings, SlidersHorizontal, Cookie, Lock, Check, X } from 'lucide-react';

interface CookieBannerProps {
  onLearnMore: () => void;
}

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

  return (
    <>
      <AnimatePresence>
        {!hasConsented && (
          <div className="fixed inset-0 z-[999999] pointer-events-none flex items-start justify-center p-0 md:p-4 bg-black/5">
            <motion.div
              id="heartsync-cookie-consent-banner"
              role="dialog"
              aria-modal="false"
              aria-label="Heartsync Cookie Consent"
              aria-describedby="heartsync-cookie-consent-desc"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto w-full max-w-3xl bg-white/95 backdrop-blur-xl border-b md:border border-zinc-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)] rounded-b-3xl md:rounded-3xl p-6 md:p-8 flex flex-col gap-6 text-zinc-800"
            >
              {/* Google Style Text Block */}
              <div className="flex flex-col gap-4 text-left w-full font-sans">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 shadow-3xs shrink-0">
                    <Cookie className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="font-sans font-semibold text-lg md:text-xl text-zinc-900 tracking-tight">
                      Before you continue to Heartsync
                    </h3>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 mt-0.5">
                      Privacy & Cookie Consent Settings
                    </p>
                  </div>
                </div>

                <div id="heartsync-cookie-consent-desc" className="space-y-3 text-xs md:text-sm text-zinc-650 leading-relaxed overflow-y-auto max-h-[300px] pr-2">
                  <p>
                    We use cookies and data to:
                  </p>
                  <ul className="list-disc list-inside pl-2 space-y-1 text-zinc-600">
                    <li>Deliver and maintain our premium relationship self-care services</li>
                    <li>Track outages and protect against spam, bad practice, and abuse</li>
                    <li>Measure reader engagement and site statistics to understand how our services are used and enhance the quality of those services</li>
                  </ul>

                  <p className="pt-2">
                    If you choose to <span className="font-semibold text-zinc-800">"Accept all"</span>, we will also use cookies and data to:
                  </p>
                  <ul className="list-disc list-inside pl-2 space-y-1 text-zinc-600">
                    <li>Develop and improve new emotional wellness features and tools</li>
                    <li>Deliver and measure the effectiveness of Adsense partner campaigns</li>
                    <li>Show personalized content, depending on your wellness settings</li>
                    <li>Show personalized ads, depending on your choices</li>
                  </ul>

                  <p className="pt-2 text-zinc-500">
                    If you choose <span className="font-semibold text-zinc-750">"Reject all"</span>, we will not use cookies for these additional purposes.
                  </p>
                  
                  <p className="text-zinc-500">
                    Non-personalized content and ads are influenced by things like the essays you are currently viewing, activity in your active reading session, and your general location. Personalized content and ads can also include more relevant results, tailored recommendations, and curated resources based on past activity from this browser. You can select <span className="font-semibold text-zinc-700">"More options"</span> to customize your consent or learn more in our{' '}
                    <button
                      onClick={onLearnMore}
                      className="text-rose-600 hover:text-rose-700 underline font-semibold cursor-pointer outline-none inline bg-transparent border-none p-0 transition-colors"
                    >
                      Cookie Policy
                    </button>
                    .
                  </p>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 justify-end border-t border-zinc-100 pt-4 w-full">
                {/* Reject All Button */}
                <button
                  type="button"
                  onClick={handleRejectAll}
                  className="w-full sm:w-auto h-10 px-5 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-700 transition-all cursor-pointer outline-none active:scale-[0.98]"
                >
                  Reject all
                </button>

                {/* More Options / Customize Button */}
                <button
                  type="button"
                  onClick={handleOpenModal}
                  className="w-full sm:w-auto h-10 px-5 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-700 transition-all cursor-pointer outline-none active:scale-[0.98]"
                  aria-label="Customize cookie options and preferences"
                >
                  More options
                </button>

                {/* Accept All Button */}
                <button
                  onClick={handleAcceptAll}
                  className="w-full sm:w-auto h-10 px-6 rounded-xl bg-zinc-900 hover:bg-zinc-950 text-white font-bold text-xs transition-all cursor-pointer outline-none active:scale-[0.98] shadow-xs"
                >
                  Accept all
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preferences Management Modal */}
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
              role="dialog"
              aria-modal="true"
              aria-labelledby="heartsync-modal-title"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-zinc-200/80 p-6 md:p-8 flex flex-col gap-5 z-10 text-zinc-800"
            >
              <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-rose-600" />
                  <h2 id="heartsync-modal-title" className="text-base font-serif font-bold text-zinc-900">
                    Cookie Preferences
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors focus:ring-2 focus:ring-rose-500 outline-none"
                  aria-label="Close preferences"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Preference Items */}
              <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-1">
                {/* 1. Necessary (Always Checked) */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-150">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-zinc-900">Necessary Cookies</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-200 text-zinc-600 uppercase tracking-wider">
                        Required
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-zinc-500">
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
                <div className="flex items-start justify-between gap-4 p-4 rounded-2xl border border-zinc-150 hover:bg-zinc-50/50 transition-all">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-zinc-900">Analytics Cookies</span>
                    <p className="text-[11px] leading-relaxed text-zinc-500">
                      Helps us analyze traffic metrics and co-reflect on visitor patterns to improve our relationship guidance essays.
                    </p>
                  </div>
                  <div className="flex items-center shrink-0">
                    <button
                      role="switch"
                      aria-checked={analyticsEnabled}
                      onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 ${
                        analyticsEnabled ? 'bg-rose-600' : 'bg-zinc-200'
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
                <div className="flex items-start justify-between gap-4 p-4 rounded-2xl border border-zinc-150 hover:bg-zinc-50/50 transition-all">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-zinc-900">Marketing & Advertising</span>
                    <p className="text-[11px] leading-relaxed text-zinc-500">
                      Enables personalized AdSense banners and Meta campaigns that match your self-care and emotional healing interests.
                    </p>
                  </div>
                  <div className="flex items-center shrink-0">
                    <button
                      role="switch"
                      aria-checked={marketingEnabled}
                      onClick={() => setMarketingEnabled(!marketingEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 ${
                        marketingEnabled ? 'bg-rose-600' : 'bg-zinc-200'
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
                <div className="flex items-start justify-between gap-4 p-4 rounded-2xl border border-zinc-150 hover:bg-zinc-50/50 transition-all">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-zinc-900">Functional Cookies</span>
                    <p className="text-[11px] leading-relaxed text-zinc-500">
                      Remembers custom dashboard widgets, translation configurations, text-to-speech toggles, and user interfaces.
                    </p>
                  </div>
                  <div className="flex items-center shrink-0">
                    <button
                      role="switch"
                      aria-checked={functionalEnabled}
                      onClick={() => setFunctionalEnabled(!functionalEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 ${
                        functionalEnabled ? 'bg-rose-600' : 'bg-zinc-200'
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

              {/* Save / Save All Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-2 border-t border-zinc-100 pt-4">
                <button
                  onClick={handleSavePreferences}
                  className="py-2.5 px-4 font-bold text-xs rounded-xl cursor-pointer bg-zinc-100 hover:bg-zinc-200 text-zinc-850 active:scale-[0.98] transition-all text-center focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 outline-none h-11 flex items-center justify-center"
                >
                  Save Settings
                </button>

                <button
                  onClick={handleAcceptAll}
                  className="py-2.5 px-4 font-bold text-xs rounded-xl cursor-pointer bg-rose-600 hover:bg-rose-700 text-white active:scale-[0.98] transition-all text-center focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 outline-none h-11 flex items-center justify-center gap-1.5 shadow-sm shadow-rose-500/15"
                >
                  <Check className="w-3.5 h-3.5" />
                  Allow All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Cookie button to reopen cookie preferences at any time */}
      {hasConsented && (
        <button
          onClick={handleOpenModal}
          className="fixed bottom-5 left-5 z-[99990] w-10 h-10 rounded-full bg-white/95 backdrop-blur-md dark:bg-zinc-900/95 shadow-md hover:shadow-lg border border-zinc-200 dark:border-zinc-800 text-rose-600 hover:text-rose-700 hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer group"
          title="Cookie Preferences"
          aria-label="Manage cookie consent preferences"
        >
          <Cookie className="w-5 h-5 transition-transform group-hover:rotate-12 text-rose-600" />
        </button>
      )}
    </>
  );
};
