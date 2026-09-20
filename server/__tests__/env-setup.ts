// Test-environment bootstrapping. This module MUST be imported before
// `../../server` so that server.ts evaluates with VERCEL set (no app.listen,
// no background state initialization) and a deterministic Supabase config.
process.env.VERCEL = '1';
process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://heartsync-test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_tests';
process.env.PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_dummy_key_for_tests';
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_dummy_test_key';
// Deliberately NOT set: SUPABASE_SERVICE_ROLE_KEY (setup-wizard honesty test relies
// on its absence) and GEMINI_API_KEY stays unset when not inherited.

export {};
