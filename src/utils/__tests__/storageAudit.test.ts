import { describe, it, expect, beforeEach } from 'vitest';
import { isAllowedStorageKey, auditLocalStorage, clearUnauthorizedStorageKeys } from '../storageAudit';

describe('storage audit & cleanup', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('recognizes allowed preference keys and legit prefixed caches', () => {
    expect(isAllowedStorageKey('hs_theme')).toBe(true);
    expect(isAllowedStorageKey('hs_bookmarked_articles')).toBe(true);
    expect(isAllowedStorageKey('hs_v2_post_123')).toBe(true);
    expect(isAllowedStorageKey('hs_trans_welcome')).toBe(true);
    expect(isAllowedStorageKey('hs_posts')).toBe(false);       // DB-bypass dump
    expect(isAllowedStorageKey('hs_all_users')).toBe(false);   // sensitive user dump
    expect(isAllowedStorageKey('pn_staff_users')).toBe(false);
    expect(isAllowedStorageKey('random_key')).toBe(false);     // not audited
  });

  it('audits without deleting anything (non-destructive report)', () => {
    localStorage.setItem('hs_theme', 'dark');
    localStorage.setItem('hs_posts', '{}');
    const report = auditLocalStorage();
    expect(report.preservedKeys).toContain('hs_theme');
    expect(report.removedKeys).toContain('hs_posts');
    expect(report.unauthorizedCount).toBe(1);
    expect(localStorage.getItem('hs_posts')).toBe('{}'); // still there
  });

  it('clears unauthorized keys while preserving valid preferences', () => {
    localStorage.setItem('hs_theme', 'dark');
    localStorage.setItem('hs_bookmarks', '["a"]');
    localStorage.setItem('hs_posts', 'should-disappear');
    localStorage.setItem('hs_analytics', '{}');
    localStorage.setItem('unrelated_setting', 'kept (not hs_/pn_)');
    const report = clearUnauthorizedStorageKeys();
    expect(localStorage.getItem('hs_theme')).toBe('dark');
    expect(localStorage.getItem('hs_bookmarks')).toBe('["a"]');
    expect(localStorage.getItem('unrelated_setting')).toBe('kept (not hs_/pn_)');
    expect(localStorage.getItem('hs_posts')).toBeNull();
    expect(localStorage.getItem('hs_analytics')).toBeNull();
    expect(report.removedKeys.sort()).toEqual(['hs_analytics', 'hs_posts']);
  });

  it('flags known bypass keys by exact name', () => {
    localStorage.setItem('hs_workspace_bypass_user', '{}');
    const report = auditLocalStorage();
    expect(report.removedKeys).toContain('hs_workspace_bypass_user');
  });

  it('survives an empty storage', () => {
    const report = auditLocalStorage();
    expect(report.scannedCount).toBe(0);
    expect(report.unauthorizedCount).toBe(0);
    expect(report.timestamp).toBeTruthy();
  });
});
