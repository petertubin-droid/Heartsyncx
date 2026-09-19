import { useConsentContext } from './ConsentProvider';

export const useCookieConsent = () => {
  const {
    hasConsented,
    isInitialLoaded,
    preferences,
    acceptAll,
    rejectAll,
    savePreferences,
    resetConsent,
    acceptConsent,
  } = useConsentContext();

  return {
    hasConsented,
    isInitialLoaded,
    preferences,
    acceptAll,
    rejectAll,
    savePreferences,
    resetConsent,
    acceptConsent,
  };
};
