import { test, expect } from '@playwright/test';

// iPhone 14 dimensions — representative modern phone.
const PHONE_PORTRAIT = { width: 390, height: 844 };
const PHONE_LANDSCAPE = { width: 844, height: 390 };
const TABLET_LANDSCAPE = { width: 1280, height: 800 };

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test('portrait phone viewport sets data-orient="portrait" on stage', async ({ page }) => {
  await page.setViewportSize(PHONE_PORTRAIT);
  await page.goto('/');
  const orient = await page.locator('#stage').getAttribute('data-orient');
  expect(orient).toBe('portrait');
});

test('landscape phone viewport sets data-orient="landscape" on stage', async ({ page }) => {
  await page.setViewportSize(PHONE_LANDSCAPE);
  await page.goto('/');
  const orient = await page.locator('#stage').getAttribute('data-orient');
  expect(orient).toBe('landscape');
});

test('tablet viewport keeps data-orient="landscape" (default)', async ({ page }) => {
  await page.setViewportSize(TABLET_LANDSCAPE);
  await page.goto('/');
  const orient = await page.locator('#stage').getAttribute('data-orient');
  expect(orient).toBe('landscape');
});

test('splash in portrait: title top, mascot middle, play button bottom', async ({ page }) => {
  await page.setViewportSize(PHONE_PORTRAIT);
  await page.goto('/');
  await expect(page.locator('#screen-splash')).toBeVisible();

  const title = await page.locator('.splash-title').boundingBox();
  const mascot = await page.locator('.splash-mascot').boundingBox();
  const play = await page.locator('.splash-play').boundingBox();

  // Vertical stacking: title.top < mascot.top < play.top
  expect(title.y).toBeLessThan(mascot.y);
  expect(mascot.y).toBeLessThan(play.y);
  // All three are horizontally centered within the visible viewport.
  // (Looseness ±30px to absorb scale rounding.)
  const vw = 390;
  expect(title.x + title.width / 2).toBeGreaterThan(vw / 2 - 30);
  expect(title.x + title.width / 2).toBeLessThan(vw / 2 + 30);
  expect(play.x + play.width / 2).toBeGreaterThan(vw / 2 - 30);
  expect(play.x + play.width / 2).toBeLessThan(vw / 2 + 30);

  // Portrait-specific sizing: mascot is 320 (not 340 landscape), play button height is 110 (not 120).
  // At PHONE_PORTRAIT scale (~0.542) the difference is real but small — generous tolerance.
  expect(mascot.height).toBeLessThan(180); // portrait 320 * 0.542 ≈ 173; landscape 340 * 0.542 ≈ 184
  expect(play.height).toBeLessThan(63);    // portrait 110 * 0.542 ≈ 60;  landscape 120 * 0.542 ≈ 65
});
