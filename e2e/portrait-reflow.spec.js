import { test, expect } from '@playwright/test';
import { unlockAll, goToLevel } from './helpers/math.js';

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

test('world map in portrait: 3 panels stacked vertically (not side-by-side)', async ({ page }) => {
  await page.setViewportSize(PHONE_PORTRAIT);
  await page.goto('/');
  await page.locator('.splash-play').click();
  await expect(page.locator('#screen-map')).toBeVisible();

  const panels = await page.locator('.world-panel').all();
  expect(panels.length).toBe(3);

  const boxes = await Promise.all(panels.map((p) => p.boundingBox()));
  // Stacked vertically: panel[1].top > panel[0].bottom (with small overlap tolerance).
  expect(boxes[1].y).toBeGreaterThan(boxes[0].y + boxes[0].height - 10);
  expect(boxes[2].y).toBeGreaterThan(boxes[1].y + boxes[1].height - 10);
  // All panels have similar widths (within 10px of each other).
  expect(Math.abs(boxes[0].width - boxes[1].width)).toBeLessThan(10);
});

test('addition level in portrait: worksheet centered, tray pinned bottom, tile >= 44px physical', async ({ page }) => {
  await page.setViewportSize(PHONE_PORTRAIT);
  await page.goto('/');
  await unlockAll(page);
  await goToLevel(page, 'add', 1);

  await expect(page.locator('#screen-add')).toBeVisible();

  const worksheet = await page.locator('.worksheet').boundingBox();
  const tray = await page.locator('.digit-tray').boundingBox();
  const tile = await page.locator('.tile').first().boundingBox();

  // Worksheet is above tray (allow up to 10px overlap to absorb scale rounding)
  expect(worksheet.y + worksheet.height).toBeLessThanOrEqual(tray.y + 10);

  // Worksheet roughly horizontally centered in 390px viewport
  const wsCenter = worksheet.x + worksheet.width / 2;
  expect(wsCenter).toBeGreaterThan(390 / 2 - 40);
  expect(wsCenter).toBeLessThan(390 / 2 + 40);

  // Tile rendered size >= 44px physical (iOS HIG minimum)
  expect(tile.width).toBeGreaterThanOrEqual(44);
  expect(tile.height).toBeGreaterThanOrEqual(44);
});

test('mult tap-count in portrait: 3 lily-pads stacked vertically', async ({ page }) => {
  await page.setViewportSize(PHONE_PORTRAIT);
  await page.goto('/');
  await unlockAll(page);
  await goToLevel(page, 'mult', 2); // L2 = 3xN, so the screen has 3 lily-pads

  await expect(page.locator('#screen-mult-tap')).toBeVisible();
  const pads = await page.locator('.lily-group').all();
  expect(pads.length).toBe(3);

  const boxes = await Promise.all(pads.map((p) => p.boundingBox()));
  // Stacked vertically: pad[1].top > pad[0].top + some delta
  expect(boxes[1].y).toBeGreaterThan(boxes[0].y + 20);
  expect(boxes[2].y).toBeGreaterThan(boxes[1].y + 20);
});
