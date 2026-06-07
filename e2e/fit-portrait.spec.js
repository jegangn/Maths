import { test, expect } from '@playwright/test';
import { unlockAll, goToLevel, readWorksheetOperands } from './helpers/math.js';

/**
 * Functional guard for FIT-portrait mode (4:3 tablet held vertically, e.g. iPad
 * 810×1080). The scaling model differs from stretch-portrait and the carry-slot
 * position is derived from the live stage scale — so drive real drops here and
 * confirm the level completes. Uses explicit waitFor(visible) before each grab
 * (the shared helper grabs boundingBox immediately, which races the post-drop
 * tray relayout — a real child pauses between drops).
 */
const IPAD_PORTRAIT = { width: 810, height: 1080 };

async function dragTile(page, tileSel, slotSel = '.slot.active') {
  const tile = page.locator(tileSel).first();
  await tile.waitFor({ state: 'visible', timeout: 6000 });
  const slot = page.locator(slotSel).first();
  await slot.waitFor({ state: 'visible', timeout: 6000 });
  const tb = await tile.boundingBox();
  const sb = await slot.boundingBox();
  await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2);
  await page.mouse.down();
  await page.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(500);
}

async function answerProblem(page) {
  const { a, b } = await readWorksheetOperands(page);
  const answer = a + b;
  const onesSum = (a % 10) + (b % 10);
  if (answer < 10) {
    await dragTile(page, `.tile[data-digit="${answer}"]`);
    return;
  }
  const ones = answer % 10, tens = Math.floor(answer / 10);
  if (onesSum >= 10) {
    await dragTile(page, `.tile.compound[data-compound="${onesSum}"]`);
    await page.waitForTimeout(1200); // flyCarry animation
  } else {
    await dragTile(page, `.tile[data-digit="${ones}"]`);
  }
  await dragTile(page, `.tile[data-digit="${tens}"]`);
}

async function playAddLevel(page, level) {
  await goToLevel(page, 'add', level);
  await expect(page.locator('#screen-add')).toBeVisible();
  for (let i = 0; i < 5; i++) {
    await answerProblem(page);
    await page.waitForTimeout(700);
  }
  await expect(page.locator('#screen-complete')).toBeVisible({ timeout: 6000 });
  await expect(page.locator('.complete-title')).toHaveText('LEVEL CLEAR!');
}

test('fit-portrait: stage is fit-portrait @ iPad 810x1080', async ({ page }) => {
  await page.setViewportSize(IPAD_PORTRAIT);
  await page.goto('/');
  const meta = await page.evaluate(() => ({
    orient: document.getElementById('stage').dataset.orient,
    h: document.getElementById('stage').style.height,
  }));
  expect(meta.orient).toBe('portrait');
  expect(meta.h).toBe('1280px'); // fixed design height → fit, not stretch
});

test('fit-portrait: Add L1 (no carry) plays to completion @ iPad portrait', async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize(IPAD_PORTRAIT);
  await page.goto('/');
  await unlockAll(page);
  await playAddLevel(page, 1);
});

test('fit-portrait: Add L3 (carry) plays to completion @ iPad portrait', async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize(IPAD_PORTRAIT);
  await page.goto('/');
  await unlockAll(page);
  await playAddLevel(page, 3);
});
