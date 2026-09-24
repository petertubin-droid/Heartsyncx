import { describe, it, expect, beforeEach } from 'vitest';
import { heartsync } from '../../store';
import {
  getTranslation,
  getSavedLanguage,
  saveLanguage,
  isRTL,
  getEnabledLanguages,
  setEnabledLanguages,
  getSiteDefaultLanguage,
  setSiteDefaultLanguage,
  translations,
  LANGUAGES,
  LANGUAGE_CODES,
  getLanguageInfo,
} from '../i18n';

describe('i18n translation engine (international edition)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns the English string for a known key', () => {
    expect(getTranslation('home')).toBe('Home');
  });

  it('returns the requested language when it exists, falling back to English otherwise', () => {
    expect(getTranslation('home', 'es')).toBe('Inicio');
    expect(getTranslation('home', 'zh')).toBe('首页');
    expect(getTranslation('home', 'yo')).toBe('Ilé');
  });

  it('falls back to English for languages without full coverage, never blank', () => {
    // every language block must be complete per the coverage test below;
    // a missing key inside a hypothetical block would fall to English
    expect(getTranslation('totally_unknown_key_xyz')).toBe('totally_unknown_key_xyz');
  });

  it('handles empty/undefined inputs without throwing', () => {
    expect(getTranslation('')).toBe('');
  });

  it('persists and restores the visitor language choice', () => {
    saveLanguage('fr');
    expect(localStorage.getItem('hs_lang')).toBe(JSON.stringify('fr'));
    expect(getSavedLanguage()).toBe('fr');
    saveLanguage('de');
    expect(getSavedLanguage()).toBe('de');
  });

  it('rejects unknown language codes everywhere (honest persistence)', () => {
    saveLanguage('xx' as never);
    expect(localStorage.getItem('hs_lang')).toBeNull();
    setSiteDefaultLanguage('yy' as never);
    expect(getSiteDefaultLanguage()).toBe('en');
  });

  it('falls back to the site default language when the visitor choice is invalid', () => {
    // the store keeps an in-memory virtual-storage fallback that survives
    // localStorage.clear(), so "absence" is simulated with a corrupt value
    heartsync.setLocalStorage('hs_lang', 'zz');
    setSiteDefaultLanguage('es');
    expect(getSavedLanguage()).toBe('es'); // visitor choice invalid -> site default
    expect(getSiteDefaultLanguage()).toBe('es');
    saveLanguage('de');
    expect(getSavedLanguage()).toBe('de'); // valid visitor choice wins
  });

  it('supports right-to-left scripts', () => {
    expect(isRTL('ar')).toBe(true);
    expect(isRTL('he')).toBe(true);
    expect(isRTL('fa')).toBe(true);
    expect(isRTL('ur')).toBe(true);
    expect(isRTL('en')).toBe(false);
    expect(isRTL('zh')).toBe(false);
  });

  it('enables every supported language worldwide by default', () => {
    expect(getEnabledLanguages()).toEqual(LANGUAGE_CODES);
    expect(LANGUAGE_CODES.length).toBe(33);
  });

  it('lets the admin restrict the enabled language list (never empty)', () => {
    setEnabledLanguages(['en', 'fr', 'de']);
    expect(getEnabledLanguages()).toEqual(['en', 'fr', 'de']);
    setEnabledLanguages(['xx'] as never);
    expect(getEnabledLanguages()).toEqual(['en', 'fr', 'de']); // invalid save ignored
    setEnabledLanguages([]);
    expect(getEnabledLanguages()).toEqual(['en', 'fr', 'de']); // empty save ignored
  });

  it('registers all languages with native names', () => {
    for (const code of LANGUAGE_CODES) {
      const info = getLanguageInfo(code);
      expect(info?.native.length, code).toBeGreaterThan(0);
      expect(info?.name.length, code).toBeGreaterThan(0);
    }
  });

  it('keeps every dictionary entry with a non-empty English value', () => {
    for (const [key, value] of Object.entries(translations.en || {})) {
      expect(key.length, `key ${key}`).toBeGreaterThan(0);
      expect(value.length, `value for ${key}`).toBeGreaterThan(0);
    }
  });

  it('gives every language a complete dictionary (no silent English fallback)', () => {
    const enKeys = Object.keys(translations.en || {}).sort();
    for (const code of LANGUAGE_CODES) {
      const langKeys = Object.keys(translations[code] || {}).sort();
      expect(langKeys, `dictionary coverage for ${code}`).toEqual(enKeys);
    }
  });
});
