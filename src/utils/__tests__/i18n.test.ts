import { describe, it, expect } from 'vitest';
import { getTranslation, getSavedLanguage, saveLanguage, isRTL, getEnabledLanguages, setEnabledLanguages, getSiteDefaultLanguage, setSiteDefaultLanguage, translations } from '../i18n';

describe('i18n translation engine', () => {
  it('returns the English string for a known key', () => {
    expect(getTranslation('home')).toBe('Home');
  });

  it('returns the requested language when it exists, falling back to English otherwise', () => {
    expect(getTranslation('home', 'es')).toBe('Inicio');
    expect(getTranslation('home', 'zh')).toBe('Home'); // no zh entry → English fallback
  });

  it('returns the key itself for unknown keys (honest absence, never blank)', () => {
    expect(getTranslation('totally_unknown_key_xyz')).toBe('totally_unknown_key_xyz');
  });

  it('handles empty/undefined inputs without throwing', () => {
    expect(getTranslation('')).toBe('');
  });

  it('pins the site to English-only mode (the only language with real content)', () => {
    expect(getSavedLanguage()).toBe('en');
    expect(isRTL('ar')).toBe(false);
    expect(getEnabledLanguages()).toEqual(['en']);
    expect(getSiteDefaultLanguage()).toBe('en');
  });

  it('persists the English pin via saveLanguage/setEnabledLanguages/setSiteDefaultLanguage', () => {
    saveLanguage('de');
    setEnabledLanguages(['en', 'fr']);
    setSiteDefaultLanguage('fr');
    expect(localStorage.getItem('hs_lang')).toBe(JSON.stringify('en'));
    expect(JSON.parse(localStorage.getItem('hs_enabled_languages') || '[]')).toEqual(['en']);
    expect(JSON.parse(localStorage.getItem('hs_default_language') || '""')).toBe('en');
  });

  it('keeps every dictionary entry with a non-empty English value', () => {
    for (const [key, entry] of Object.entries(translations)) {
      expect(key.length, `key ${key}`).toBeGreaterThan(0);
      expect((entry as Record<string, string>).en, `English value for ${key}`).toBeTruthy();
    }
  });
});
