import { describe, it, expect } from 'vitest';
import { adminEmailsInCache, cacheHasAdmins, resolveHasAdmins, shouldBlockSetupRegister } from '../setupPresence';

const cacheWithAdmin = {
  admin_users: [{ email: 'Owner@Heartsync.com', role: 'admin' }],
  profiles: [{ email: 'reader@x.com', role: 'subscriber' }]
};
const emptyCache = { admin_users: [], profiles: [] };

describe('setup wizard presence (single source of truth for "an admin exists")', () => {
  it('collects cache admin emails case-insensitively, from both admin_users and admin-role profiles', () => {
    const emails = adminEmailsInCache({
      admin_users: [{ email: 'Owner@X.com' }],
      profiles: [{ email: 'editor@x.com', role: 'Editor' }, { email: 'sub@x.com', role: 'subscriber' }]
    });
    expect(emails.has('owner@x.com')).toBe(true);
    expect(emails.has('editor@x.com')).toBe(true);
    expect(emails.has('sub@x.com')).toBe(false);
  });

  it('resolveHasAdmins: cache admin alone satisfies hasAdmins (the wizard-every-visit bug)', () => {
    expect(resolveHasAdmins(false, cacheWithAdmin)).toBe(true);
  });

  it('resolveHasAdmins: DB admin alone satisfies hasAdmins; nothing found means no admin', () => {
    expect(resolveHasAdmins(true, null)).toBe(true);
    expect(resolveHasAdmins(false, emptyCache)).toBe(false);
    expect(resolveHasAdmins(false, null)).toBe(false);
  });

  it('shouldBlockSetupRegister: blocks a stranger when a cache admin exists (second-admin mint guard)', () => {
    expect(shouldBlockSetupRegister(null, cacheWithAdmin, 'stranger@x.com')).toBe(true);
  });

  it('shouldBlockSetupRegister: owner recovery with the same email is allowed', () => {
    expect(shouldBlockSetupRegister(null, cacheWithAdmin, 'owner@heartsync.com')).toBe(false);
  });

  it('shouldBlockSetupRegister: DB admin email still blocks a different registrant', () => {
    expect(shouldBlockSetupRegister('owner@heartsync.com', emptyCache, 'stranger@x.com')).toBe(true);
    expect(shouldBlockSetupRegister('owner@heartsync.com', emptyCache, 'owner@heartsync.com')).toBe(false);
  });

  it('with no admin anywhere, the wizard stays open for the true first admin', () => {
    expect(shouldBlockSetupRegister(null, emptyCache, 'first@x.com')).toBe(false);
  });
});
