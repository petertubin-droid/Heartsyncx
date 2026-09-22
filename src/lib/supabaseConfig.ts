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

// Dependency-free base64url decoder (works in the browser bundle AND the Node
// server bundle without relying on global `atob`/`Buffer`). Used only to read
// the unsigned `role` claim off a Supabase JWT for a config sanity check  -
// never for verifying the token's signature/authenticity.
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64UrlDecodeToString(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of normalized) {
    const idx = B64_CHARS.indexOf(ch);
    if (idx === -1) continue; // skip padding ('=') and any stray chars
    buffer = (buffer << 6) | idx;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  // Decode the byte array as UTF-8.
  let out = '';
  let i = 0;
  while (i < bytes.length) {
    const b0 = bytes[i];
    if (b0 < 0x80) {
      out += String.fromCharCode(b0);
      i += 1;
    } else if (b0 >= 0xc0 && b0 < 0xe0 && i + 1 < bytes.length) {
      out += String.fromCharCode(((b0 & 0x1f) << 6) | (bytes[i + 1] & 0x3f));
      i += 2;
    } else if (b0 >= 0xe0 && i + 2 < bytes.length) {
      out += String.fromCharCode(
        ((b0 & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f)
      );
      i += 3;
    } else {
      out += String.fromCharCode(b0);
      i += 1;
    }
  }
  return out;
}

/** Reads the unsigned `role` claim from a Supabase JWT (anon/service_role/etc).
 *  This is a config sanity check, NOT signature verification  - Supabase itself
 *  verifies the signature server-side on every request. Returns null if the
 *  key isn't a 3-part JWT or has no readable `role` claim. */
export function getJwtRoleClaim(key: string | null | undefined): string | null {
  const k = cleanConfigValue(key);
  const parts = k.split('.');
  if (parts.length !== 3) return null;
  try {
    const payloadJson = base64UrlDecodeToString(parts[1]);
    const payload = JSON.parse(payloadJson);
    return typeof payload?.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

/** True only when `key` is a JWT whose `role` claim is exactly 'service_role'.
 *  Guards against the classic misconfiguration of pasting the anon/public key
 *  into a SUPABASE_SERVICE_ROLE_KEY slot: both are well-formed JWTs, so
 *  isValidSupabaseConfig() alone can't tell them apart, but Postgres enforces
 *  whatever role is actually embedded in the token  - so that mistake doesn't
 *  fail loudly at startup, it fails later as a confusing
 *  "permission denied for table ..." once anon's revoked grants are hit. */
export function isServiceRoleKey(key: string | null | undefined): boolean {
  return getJwtRoleClaim(key) === 'service_role';
}
