/**
 * Google Translate integration - unit tests.
 */
import { describe, it, expect } from 'vitest';
import { mapToGoogleLanguage } from '../GoogleTranslate';

describe('mapToGoogleLanguage', () => {
  it('maps our codes to Google widget codes where they differ', () => {
    expect(mapToGoogleLanguage('zh')).toBe('zh-CN');
    expect(mapToGoogleLanguage('he')).toBe('iw');
  });

  it('passes every supported site language through unchanged otherwise', () => {
    for (const code of ['en', 'es', 'fr', 'ar', 'hi', 'sw', 'yo', 'ig', 'ha', 'ko', 'th', 'no', 'fa', 'ur']) {
      expect(mapToGoogleLanguage(code as any)).toBe(code);
    }
  });

  it('restores English by targeting en', () => {
    expect(mapToGoogleLanguage('en')).toBe('en');
  });
});
