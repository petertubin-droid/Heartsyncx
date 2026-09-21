import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

// Build-time guard: a Supabase service_role key must NEVER be inlined
// into the public client bundle. If the anon-key env slot contains a
// service_role JWT (easy paste mistake), fail the build LOUDLY here —
// otherwise Netlify's deploy-time secrets scanning silently blocks it.
function assertAnonOnly(name: string, value: string): string {
  if (!value || value.split('.').length !== 3) return value;
  try {
    const payload = JSON.parse(
      Buffer.from(value.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'),
    );
    if (payload?.role === 'service_role') {
      throw new Error(
        `[vite.config] ${name} is set to a Supabase SERVICE_ROLE key. ` +
          'It would be inlined into the public bundle and Netlify blocks the deploy. ' +
          'Set it to the ANON (public) publishable key; the service_role key ' +
          'belongs only in SUPABASE_SERVICE_ROLE_KEY on the server.',
      );
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes('SERVICE_ROLE')) throw e;
  }
  return value;
}


export default defineConfig(({ mode }) => {
  // Load environment variables from the current working directory, including .env.local
  const env = loadEnv(mode || 'development', process.cwd(), '');

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      // Inject Supabase PUBLIC config into the client bundle — anon key only.
      // assertAnonOnly makes a service_role paste mistake fail the build
      // here, where the error is readable, instead of Netlify secrets
      // scanning silently blocking the deploy.
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || env.SUPABASE_URL || ''),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
        assertAnonOnly(
          'SUPABASE_ANON_KEY',
          process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '',
        ),
      ),
      'import.meta.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL || env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || ''),
      'import.meta.env.SUPABASE_ANON_KEY': JSON.stringify(
        assertAnonOnly(
          'SUPABASE_ANON_KEY',
          process.env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || '',
        ),
      ),
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
