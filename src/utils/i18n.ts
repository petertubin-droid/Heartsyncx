// Multi-language Translation Engine for Heartsync SaaS.
//
// International edition: 33 languages, full UI dictionaries, per-visitor
// persistence (hs_lang), admin-manageable enabled/default language lists,
// and RTL support for Arabic, Hebrew, Persian and Urdu.
//
// Previously this module pinned the whole site to English: getSavedLanguage
// returned 'en' regardless of storage, saveLanguage persisted 'en', and
// isRTL always returned false. That made the dictionary dead weight.
import { readVisitorPref, writeVisitorPref } from '../store';
import { latinDictionaries } from './data/dictionary-latin';
import { afroasiaDictionaries } from './data/dictionary-afroasia';
import { africanDictionaries } from './data/dictionary-african';

export type Language =
  | 'en' | 'es' | 'de' | 'fr' | 'it' | 'pt' | 'ar' | 'zh' | 'ja' | 'ru'
  | 'tr' | 'hi' | 'yo' | 'ig' | 'ha' | 'sw' | 'nl' | 'pl' | 'ko' | 'vi'
  | 'uk' | 'sv' | 'el' | 'he' | 'th' | 'id' | 'fa' | 'no' | 'fi' | 'da'
  | 'cs' | 'bn' | 'ur';

export interface LanguageInfo {
  code: Language;
  /** English name (admin lists) */
  name: string;
  /** Native name (language switcher) */
  native: string;
  rtl: boolean;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', native: 'English', rtl: false },
  { code: 'es', name: 'Spanish', native: 'Español', rtl: false },
  { code: 'fr', name: 'French', native: 'Français', rtl: false },
  { code: 'de', name: 'German', native: 'Deutsch', rtl: false },
  { code: 'it', name: 'Italian', native: 'Italiano', rtl: false },
  { code: 'pt', name: 'Portuguese', native: 'Português', rtl: false },
  { code: 'nl', name: 'Dutch', native: 'Nederlands', rtl: false },
  { code: 'sv', name: 'Swedish', native: 'Svenska', rtl: false },
  { code: 'no', name: 'Norwegian', native: 'Norsk', rtl: false },
  { code: 'da', name: 'Danish', native: 'Dansk', rtl: false },
  { code: 'fi', name: 'Finnish', native: 'Suomi', rtl: false },
  { code: 'pl', name: 'Polish', native: 'Polski', rtl: false },
  { code: 'cs', name: 'Czech', native: 'Čeština', rtl: false },
  { code: 'el', name: 'Greek', native: 'Ελληνικά', rtl: false },
  { code: 'uk', name: 'Ukrainian', native: 'Українська', rtl: false },
  { code: 'ru', name: 'Russian', native: 'Русский', rtl: false },
  { code: 'tr', name: 'Turkish', native: 'Türkçe', rtl: false },
  { code: 'ar', name: 'Arabic', native: 'العربية', rtl: true },
  { code: 'he', name: 'Hebrew', native: 'עברית', rtl: true },
  { code: 'fa', name: 'Persian', native: 'فارسی', rtl: true },
  { code: 'ur', name: 'Urdu', native: 'اردو', rtl: true },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', rtl: false },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', rtl: false },
  { code: 'zh', name: 'Chinese', native: '中文', rtl: false },
  { code: 'ja', name: 'Japanese', native: '日本語', rtl: false },
  { code: 'ko', name: 'Korean', native: '한국어', rtl: false },
  { code: 'th', name: 'Thai', native: 'ไทย', rtl: false },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', rtl: false },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', rtl: false },
  { code: 'sw', name: 'Swahili', native: 'Kiswahili', rtl: false },
  { code: 'yo', name: 'Yoruba', native: 'Yorùbá', rtl: false },
  { code: 'ig', name: 'Igbo', native: 'Igbo', rtl: false },
  { code: 'ha', name: 'Hausa', native: 'Hausa', rtl: false },
];

export const LANGUAGE_CODES: Language[] = LANGUAGES.map((l) => l.code);

export const isLanguageCode = (code: unknown): code is Language =>
  typeof code === 'string' && (LANGUAGE_CODES as string[]).includes(code);

/** True for right-to-left scripts - flips document direction in App. */
export const RTL_LANGUAGES: Language[] = LANGUAGES.filter((l) => l.rtl).map((l) => l.code);

export function isRTL(lang: Language): boolean {
  return (RTL_LANGUAGES as string[]).includes(lang);
}

export function getLanguageInfo(lang: Language): LanguageInfo | undefined {
  return LANGUAGES.find((l) => l.code === lang);
}

// ---------------------------------------------------------------------------
// Dictionaries: full per-language blocks merged from the data files. English
// is the base; getTranslation falls back to it when a language is missing a
// key, and to the key itself when even English lacks it (honest absence).
// ---------------------------------------------------------------------------

const dictionaries: Partial<Record<Language, Record<string, string>>> = {
  ...latinDictionaries,
  ...afroasiaDictionaries,
  ...africanDictionaries,
};

/** Kept as a named export for tooling/tests: per-language dictionaries. */
export const translations = dictionaries;

/** getTranslation + runtime placeholder fill ({count}, {topic}, ...). */
export function formatTranslation(key: string, lang: Language, params: Record<string, string | number>): string {
  return getTranslation(key, lang).replace(/\{(\w+)\}/g, (_, p) => String(params[p] ?? ''));
}

export function getTranslation(key: string, lang: Language = 'en'): string {
  if (!key) return '';
  // Admin-authored overrides (Localization pane) win over the built-in
  // dictionaries for that language and key.
  const override = heartsync.translation_overrides?.[`${lang}::${key}`.toLowerCase()];
  if (typeof override === 'string' && override.length > 0) {
    return override;
  }
  const entry = dictionaries[lang];
  if (entry && typeof entry[key] === 'string' && entry[key].length > 0) {
    return entry[key];
  }
  return dictionaries.en?.[key] || key;
}

// ---------------------------------------------------------------------------
// Persistence. Keys: hs_lang (visitor choice), hs_enabled_languages (admin),
// hs_default_language (admin). Values pass through writeVisitorPref
// which stringifies internally - pre-stringifying would double-encode.
// ---------------------------------------------------------------------------

const readLangList = (key: string): Language[] | null => {
  try {
    // readVisitorPref JSON-parses internally.
    const parsed = readVisitorPref<unknown>(key, '');
    if (!Array.isArray(parsed)) return null;
    const valid = parsed.filter(isLanguageCode);
    return valid.length ? valid : null;
  } catch (e) {
    return null;
  }
};

const writeLangList = (key: string, langs: Language[]): void => {
  try {
    writeVisitorPref(key, langs);
  } catch (e) {}
};

/** Visitor's saved language; falls back to the admin default, then 'en'. */
export const getSavedLanguage = (): Language => {
  try {
    const parsed = readVisitorPref<unknown>('hs_lang', '');
    if (isLanguageCode(parsed)) return parsed;
  } catch (e) {}
  const fallback = getSiteDefaultLanguage();
  return fallback;
};

export const saveLanguage = (lang: Language): void => {
  if (!isLanguageCode(lang)) return;
  try {
    writeVisitorPref('hs_lang', lang);
  } catch (e) {}
};

/** Languages the admin has enabled in the site's language panel. Default:
 *  every supported language (worldwide audience). */
export const getEnabledLanguages = (): Language[] => {
  const saved = readLangList('hs_enabled_languages');
  return saved || [...LANGUAGE_CODES];
};

export const setEnabledLanguages = (langs: Language[]): void => {
  const valid = Array.isArray(langs) ? langs.filter(isLanguageCode) : [];
  if (valid.length === 0) return; // never let the admin save an empty site
  writeLangList('hs_enabled_languages', valid);
};

export const getSiteDefaultLanguage = (): Language => {
  try {
    const parsed = readVisitorPref<unknown>('hs_default_language', '');
    if (isLanguageCode(parsed)) return parsed;
  } catch (e) {}
  return 'en';
};

export const setSiteDefaultLanguage = (lang: Language): void => {
  if (!isLanguageCode(lang)) return;
  try {
    writeVisitorPref('hs_default_language', lang);
  } catch (e) {}
};
