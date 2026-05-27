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
