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
    // Seed a player name so every spec lands on the ready-to-play splash.
    // The first-run "WHO'S PLAYING?" flow is covered by 00-name-entry.spec.js,
    // which overrides this with an empty storageState.
    storageState: {
      cookies: [],
      origins: [
        { origin: BASE, localStorage: [{ name: 'bm.playerName', value: 'JHANAV' }] },
      ],
    },
  },
  webServer: {
    command: 'bun run dev',
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
