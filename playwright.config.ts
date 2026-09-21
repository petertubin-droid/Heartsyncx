import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

/**
 * E2E suite for the Heartsync site.
 * Runs against a production build served by `vite preview` (dist/).
 *
 * Usage:
 *   npm run build && npx playwright test
 *
 * NOTE on sandboxed/minimal Linux environments where `playwright install-deps`
 * cannot reach apt mirrors: extract the needed system debs (nspr, nss, atk1.0,
 * at-spi2-core, libxcomposite, libxdamage, glib2.0) into a folder and point
 * PLAYWRIGHT_LIB_DIR at the extracted usr/lib/<arch> dir; the browser will be
 * launched with that LD_LIBRARY_PATH. On normal machines and CI runners
 * (`npx playwright install --with-deps`) this is unnecessary.
 */
const libDir =
  process.env.PLAYWRIGHT_LIB_DIR ||
  (existsSync('/tmp/chromium-libs/extracted/usr/lib/x86_64-linux-gnu')
    ? '/tmp/chromium-libs/extracted/usr/lib/x86_64-linux-gnu'
    : undefined);

const launchOptions = libDir
  ? { env: { ...process.env, LD_LIBRARY_PATH: libDir } }
  : undefined;

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  workers: 2,
  fullyParallel: true,
  // One shared preview server: parallel tabs can starve fixed-sleep assertions,
  // so allow a single retry to absorb timing noise.
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...(launchOptions ? { launchOptions } : {}),
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npx vite preview --port 4173 --strictPort',
        url: 'http://localhost:4173',
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
