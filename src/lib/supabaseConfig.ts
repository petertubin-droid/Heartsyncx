// Shared Supabase connection-config helpers.
// Single source of truth used by BOTH the client store (src/store.ts) and the
// Express server (server.ts). Keep this file dependency-free: it must load in
// the browser bundle and in the Node server bundle.

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/** Single factory for EVERY Supabase client in the app (client store + server).
 *  Values are cleaned here; an optional authToken adds a global Authorization
 *  header so user-scoped clients run under RLS session policies, never anon. */
export function createSupabaseClient(
  url: string | null | undefined,
  key: string | null | undefined,
  authToken?: string | null
): SupabaseClient {
  const u = cleanConfigValue(url);
  const k = cleanConfigValue(key);
  const authOptions = {
    // PKCE flow: the OAuth callback returns a single-use ?code= exchange on the
    // same origin, which survives browser storage restrictions better than
    // implicit hash tokens and is Google's recommended flow.
    flowType: 'pkce' as const,
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  };
  return createClient(u, k, authToken
    ? { global: { headers: { Authorization: `Bearer ${authToken}` } }, auth: authOptions }
    : { auth: authOptions });
}

export function cleanConfigValue(val: string | null | undefined): string {
  if (!val) return '';
  let cleaned = val.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.substring(1, cleaned.length - 1).trim();
  }
  if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
    cleaned = cleaned.substring(1, cleaned.length - 1).trim();
  }
  if (cleaned.includes('.')) {
    const parts = cleaned.split('.');
    if (parts.length > 3) {
      cleaned = parts.slice(0, 3).join('.');
    }
  }
  return cleaned;
}

export function isValidSupabaseConfig(
  url: string | null | undefined,
  key: string | null | undefined
): boolean {
  const u = cleanConfigValue(url).toLowerCase();
  const k = cleanConfigValue(key);
  if (u === '' || k === '') return false;
  if (
    u.includes('your-project') ||
    u.includes('your_supabase_url') ||
    u.includes('your-supabase-url') ||
    u.includes('your_project') ||
    u.includes('placeholder') ||
    u.includes('example.com') ||
    u.includes('jvjzrfcbwkwgtjuwhuyj')
  ) {
    return false;
  }
  if (
    k.includes('your_anon_key') ||
    k.includes('your-supabase-anon-key') ||
    k.includes('your_anon') ||
    k.includes('placeholder')
  ) {
    return false;
  }
  if (!u.startsWith('http://') && !u.startsWith('https://')) return false;
  return true;
}
