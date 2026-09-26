import { describe, it, expect, beforeEach } from 'vitest';
import { readVisitorPref, writeVisitorPref, heartsync } from '../../store';

describe('visitor preference persistence (the only allowed localStorage writes)', () => {
  beforeEach(() => {
    localStorage.clear();
    heartsync.setLocalStorage('hs_lang', null);
  });

  it('round-trips a value through real localStorage as JSON', () => {
    writeVisitorPref('heartsync_cookie_consent', 'accepted');
    expect(localStorage.getItem('heartsync_cookie_consent')).toBe(JSON.stringify('accepted'));
    expect(readVisitorPref('heartsync_cookie_consent', null)).toBe('accepted');
  });

  it('returns the fallback for missing keys and corrupt JSON', () => {
    expect(readVisitorPref('nope', 'fallback')).toBe('fallback');
    localStorage.setItem('bad', '{not json');
    expect(readVisitorPref('bad', 'safe')).toBe('safe');
  });

  it('readVisitorPref is null-safe on empty string values', () => {
    localStorage.setItem('empty', '');
    expect(readVisitorPref('empty', 'default')).toBe('default');
  });
});

describe('browser-storage removal: the store itself never writes localStorage', () => {
  beforeEach(() => localStorage.clear());

  it('setLocalStorage stays in the in-memory virtual map only', () => {
    heartsync.setLocalStorage('hs_anything', { a: 1 });
    expect(localStorage.getItem('hs_anything')).toBeNull();
    expect(heartsync.getLocalStorage('hs_anything', null)).toEqual({ a: 1 });
  });

  it('getLocalStorage returns the default for keys the virtual map does not hold', () => {
    expect(heartsync.getLocalStorage('hs_missing', 'def')).toBe('def');
  });

  it('deleting a key only clears the virtual map', () => {
    heartsync.setLocalStorage('hs_gone', 'x');
    heartsync.setLocalStorage('hs_gone', null);
    expect(heartsync.getLocalStorage('hs_gone', 'def')).toBe('def');
  });
});
