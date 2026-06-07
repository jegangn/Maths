import { defineConfig } from '@playwright/test';

// Port is overridable so an e2e run can sidestep a stale or foreign server
// squatting on the default :5173 (e.g. a dev server left running from a git
// worktree — see the port-war note in project memory). Start your own server
// with `PORT=5273 bun ./dev.js`, then run `PORT=5273 bun run e2e`; `dev.js`
// reads the same PORT env, so the dev server and the tests stay in sync.
const PORT = Number(process.env.PORT) || 5173;
const BASE = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: BASE,
    headless: true,
    viewport: { width: 1280, height: 800 },
    actionTimeout: 10_000,
  },
  webServer: {
    command: 'bun run dev',
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
