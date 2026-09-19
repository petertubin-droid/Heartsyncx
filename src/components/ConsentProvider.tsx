import React, { createContext, useContext, useState, useEffect } from 'react';
import { heartsync } from '../store';

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export interface ConsentState {
  hasConsented: boolean;
  isInitialLoaded: boolean;
  preferences: CookiePreferences;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (prefs: CookiePreferences) => void;
  resetConsent: () => void;
  acceptConsent: () => void; // alias for acceptAll
}

const ConsentContext = createContext<ConsentState | undefined>(undefined);

// Define gtag on window for TypeScript
declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

const getInitialConsentState = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return !!heartsync.getLocalStorage('heartsync_cookie_consent', null);
  } catch (e) {
    return false;
  }
};

const getInitialPreferences = (): CookiePreferences => {
  const defaults: CookiePreferences = {
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false,
  };
  if (typeof window === 'undefined') return defaults;
  try {
    const storedConsent = heartsync.getLocalStorage('heartsync_cookie_consent', null);
    const storedPrefsStr = heartsync.getLocalStorage('heartsync_cookie_preferences', null);
    if (storedPrefsStr) {
      return JSON.parse(storedPrefsStr);
    } else if (storedConsent === 'accepted') {
      return { necessary: true, analytics: true, marketing: true, functional: true };
    }
  } catch (e) {}
  return defaults;
};

export const ConsentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasConsented, setHasConsented] = useState<boolean>(getInitialConsentState);
  const [isInitialLoaded, setIsInitialLoaded] = useState<boolean>(true);
  const [preferences, setPreferences] = useState<CookiePreferences>(getInitialPreferences);

  useEffect(() => {
    // 1. Initialize dataLayer and window.gtag if not already preset
    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
      window.gtag = function (...args: any[]) {
        window.dataLayer.push(args);
      };
    }

    // 2. Read stored consent and preferences
    const storedConsent = localStorage.getItem('heartsync_cookie_consent');
    const activePrefs = getInitialPreferences();

    setPreferences(activePrefs);

    const hasSelection = !!storedConsent;
    setHasConsented(hasSelection);
    setIsInitialLoaded(true);

    if (hasSelection) {
      // If already accepted/configured, update consent mode v2
      updateConsentMode(activePrefs);
      injectProductionScripts(activePrefs);
    } else {
      // Otherwise, set strict denial defaults (Consent Mode v2)
      if (window.gtag) {
        window.gtag('consent', 'default', {
          ad_storage: 'denied',
          analytics_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          wait_for_update: 500
        });
      }
    }
  }, []);

  const updateConsentMode = (prefs: CookiePreferences) => {
    if (window.gtag) {
      window.gtag('consent', 'update', {
        ad_storage: prefs.marketing ? 'granted' : 'denied',
        analytics_storage: prefs.analytics ? 'granted' : 'denied',
        ad_user_data: prefs.marketing ? 'granted' : 'denied',
        ad_personalization: prefs.marketing ? 'granted' : 'denied'
      });
    }
  };

  const injectProductionScripts = (prefs: CookiePreferences) => {
    // Inject Google Analytics code if analytics is granted and measurement ID exists
    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID || heartsync?.site_settings?.ga_measurement_id;
    if (prefs.analytics && gaId) {
      if (!document.getElementById('heartsync-gtag-script')) {
        const gTagScript = document.createElement('script');
        gTagScript.id = 'heartsync-gtag-script';
        gTagScript.async = true;
        gTagScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        document.head.appendChild(gTagScript);

        // Initialize gtag configuration
        const initScript = document.createElement('script');
        initScript.id = 'heartsync-gtag-init';
        initScript.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', { 'anonymize_ip': true });
        `;
        document.head.appendChild(initScript);
      }
    }

    // Inject Google AdSense code if marketing is granted and publisher client ID exists
    if (prefs.marketing) {
      const clientPubId = 
        import.meta.env.VITE_ADSENSE_PUBLISHER_ID || 
        import.meta.env.VITE_PUBLIC_ADSENSE_CLIENT || 
        import.meta.env.VITE_ADSENSE_CLIENT || 
        heartsync?.site_settings?.adsense_client_id;

      if (clientPubId && !document.getElementById('heartsync-adsense-script')) {
        const adSenseScript = document.createElement('script');
        adSenseScript.id = 'heartsync-adsense-script';
        adSenseScript.async = true;
        adSenseScript.crossOrigin = 'anonymous';
        adSenseScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientPubId}`;
        document.head.appendChild(adSenseScript);
      }

      // Inject Meta Pixel (Meta Ads Integration) if pixel ID exists
      const metaPixelId = import.meta.env.VITE_META_PIXEL_ID || heartsync?.site_settings?.meta_pixel_id;
      if (metaPixelId && !document.getElementById('heartsync-meta-pixel-script')) {
        const metaPixelScript = document.createElement('script');
        metaPixelScript.id = 'heartsync-meta-pixel-script';
        metaPixelScript.innerHTML = `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${metaPixelId}');
          fbq('track', 'PageView');
        `;
        document.head.appendChild(metaPixelScript);
      }
    }
  };

  const acceptAll = () => {
    const fullPrefs = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    heartsync.setLocalStorage('heartsync_cookie_consent', 'accepted');
    heartsync.setLocalStorage('heartsync_cookie_preferences', JSON.stringify(fullPrefs));
    document.cookie = "heartsync_cookie_consent=accepted; max-age=31536000; path=/; SameSite=Lax";
    
    setPreferences(fullPrefs);
    setHasConsented(true);

    updateConsentMode(fullPrefs);
    injectProductionScripts(fullPrefs);
  };

  const rejectAll = () => {
    const minPrefs = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    heartsync.setLocalStorage('heartsync_cookie_consent', 'rejected');
    heartsync.setLocalStorage('heartsync_cookie_preferences', JSON.stringify(minPrefs));
    document.cookie = "heartsync_cookie_consent=rejected; max-age=31536000; path=/; SameSite=Lax";
    
    setPreferences(minPrefs);
    setHasConsented(true);

    updateConsentMode(minPrefs);
  };

  const savePreferences = (prefs: CookiePreferences) => {
    heartsync.setLocalStorage('heartsync_cookie_consent', 'custom');
    heartsync.setLocalStorage('heartsync_cookie_preferences', JSON.stringify(prefs));
    
    const consentValue = prefs.analytics && prefs.marketing && prefs.functional ? 'accepted' : 'custom';
    document.cookie = `heartsync_cookie_consent=${consentValue}; max-age=31536000; path=/; SameSite=Lax`;
    
    setPreferences(prefs);
    setHasConsented(true);

    updateConsentMode(prefs);
    injectProductionScripts(prefs);
  };

  const resetConsent = () => {
    localStorage.removeItem('heartsync_cookie_consent');
    localStorage.removeItem('heartsync_cookie_preferences');
    document.cookie = "heartsync_cookie_consent=; max-age=0; path=/; SameSite=Lax";
    
    setPreferences({
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    });
    setHasConsented(false);
  };

  return (
    <ConsentContext.Provider value={{
      hasConsented,
      isInitialLoaded,
      preferences,
      acceptAll,
      rejectAll,
      savePreferences,
      resetConsent,
      acceptConsent: acceptAll
    }}>
      {children}
    </ConsentContext.Provider>
  );
};

export const useConsentContext = () => {
  const context = useContext(ConsentContext);
  if (context === undefined) {
    throw new Error('useConsentContext must be used within a ConsentProvider');
  }
  return context;
};
