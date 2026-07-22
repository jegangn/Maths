import { test, expect } from '@playwright/test';

/**
 * First-run name prompt. The shared Playwright config seeds bm.playerName so
 * every other spec skips this flow — these tests override that with an empty
 * storageState to exercise the true first launch.
 */
test.use({ storageState: { cookies: [], origins: [] } });

test('first launch asks who is playing instead of showing the play button', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#screen-splash')).toBeVisible();
  await expect(page.locator('.splash-title')).toHaveText("WHO'S PLAYING?");
  await expect(page.locator('.name-input')).toBeVisible();
  await expect(page.locator('.splash-play')).toHaveCount(0);
});

test('entering a name personalises the splash and survives reload', async ({ page }) => {
  await page.goto('/');
  await page.locator('.name-input').fill('Alex');
  await page.locator('.name-go').click();
  await expect(page.locator('.splash-title')).toHaveText("ALEX'S MATH");
  await expect(page.locator('.splash-play')).toBeVisible();

  await page.reload();
  await expect(page.locator('.splash-title')).toHaveText("ALEX'S MATH");
  await expect(page.locator('.name-input')).toHaveCount(0);
});

test('empty or junk-only names are rejected', async ({ page }) => {
  await page.goto('/');
  await page.locator('.name-go').click();
  await expect(page.locator('.splash-title')).toHaveText("WHO'S PLAYING?");

  await page.locator('.name-input').fill('!!!###');
  await page.locator('.name-go').click();
  await expect(page.locator('.splash-title')).toHaveText("WHO'S PLAYING?");
  await expect(page.locator('.name-input')).toBeVisible();
});

test('tapping the splash during name entry does not start the game', async ({ page }) => {
  await page.goto('/');
  await page.locator('#screen-splash').click({ position: { x: 640, y: 300 } });
  await expect(page.locator('#screen-splash')).toBeVisible();
  await expect(page.locator('#screen-map')).toHaveCount(0);
});

test('CHANGE NAME in parent settings brings back the name prompt', async ({ page }) => {
  await page.goto('/');
  await page.locator('.name-input').fill('Alex');
  await page.locator('.name-go').click();
  await expect(page.locator('.splash-play')).toBeVisible();

  // Open the parent gate (short press on the cog) and solve it.
  await page.locator('.cog-corner').dispatchEvent('pointerup');
  await expect(page.locator('.parent-gate-card')).toBeVisible();
  const questionText = await page.locator('#pg-q').textContent();
  const m = questionText.match(/(\d+)\s*\+\s*(\d+)\s*\+\s*(\d+)/);
  const answer = parseInt(m[1]) + parseInt(m[2]) + parseInt(m[3]);
  const buttons = page.locator('.pg-buttons button');
  const count = await buttons.count();
  for (let i = 0; i < count; i++) {
    if (parseInt(await buttons.nth(i).textContent()) === answer) {
      await buttons.nth(i).dispatchEvent('pointerup');
      break;
    }
  }

  await page.getByText('CHANGE NAME').dispatchEvent('pointerup');
  await expect(page.locator('.splash-title')).toHaveText("WHO'S PLAYING?");
  await expect(page.locator('.name-input')).toBeVisible();
});
