/**
 * Single source of truth for "does an administrator exist?"
 *
 * The server recognizes an admin through TWO channels, and they must agree:
 *   1. the authoritative DB: a profiles row whose role is an admin role;
 *   2. the persisted server state cache: serverCacheState.admin_users /
 *      profiles (the same cache login/sync-profile trusts to authorize the
 *      console).
 *
 * Bug this fixes (2026-09-26): an admin elected through the cache-only path
 * logged into the console fine, but /api/setup/status consulted ONLY the DB,
 * concluded no admin existed, and re-offered the First-Run Setup Wizard on
 * every admin visit - and /api/setup/register could then mint a SECOND
 * admin. Every consumer must use these helpers so the definition can never
 * fork again.
 */

export interface AdminCacheLike {
  admin_users?: Array<{ email?: string; role?: string }>;
  profiles?: Array<{ email?: string; role?: string }>;
}

/** Emails the server already treats as administrators (cache channel). */
export function adminEmailsInCache(state: AdminCacheLike | null | undefined): Set<string> {
  const emails = new Set<string>();
  if (!state) return emails;
  const roles = ['admin', 'superadmin', 'Administrator', 'Editor', 'Super Admin'];
  for (const a of state.admin_users || []) {
    if (a && typeof a.email === 'string' && a.email) emails.add(a.email.trim().toLowerCase());
  }
  for (const p of state.profiles || []) {
    if (p && p.email && roles.includes(p.role || '')) emails.add(p.email.trim().toLowerCase());
  }
  return emails;
}

/** Does the cache channel contain any administrator? */
export function cacheHasAdmins(state: AdminCacheLike | null | undefined): boolean {
  return adminEmailsInCache(state).size > 0;
}

/**
 * Setup-status answer: an admin exists if EITHER channel has one. Mirrors
 * sync-profile's isAdmin exactly (cache admins are real admins).
 */
export function resolveHasAdmins(
  dbHasAdmins: boolean,
  state: AdminCacheLike | null | undefined
): boolean {
  return dbHasAdmins || cacheHasAdmins(state);
}

/**
 * Should /api/setup/register refuse this registration?
 *
 * The wizard is the designated FIRST-admin (or owner-recovery) path only.
 * Refuse when any admin already exists via either channel UNLESS the
 * registering email is that admin's own (owner recovery with password reset).
 */
export function shouldBlockSetupRegister(
  dbAdminEmail: string | null | undefined,
  state: AdminCacheLike | null | undefined,
  registerEmail: string
): boolean {
  const email = (registerEmail || '').trim().toLowerCase();
  const dbAdmin = (dbAdminEmail || '').trim().toLowerCase();
  if (dbAdmin) return dbAdmin !== email;
  return cacheHasAdmins(state) && !adminEmailsInCache(state).has(email);
}
