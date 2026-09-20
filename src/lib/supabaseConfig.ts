// Shared Supabase connection-config helpers.
// Single source of truth used by BOTH the client store (src/store.ts) and the
// Express server (server.ts). Keep this file dependency-free: it must load in
// the browser bundle and in the Node server bundle.

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
