import { test, expect } from '@playwright/test';
import { unlockAll, goToLevel } from './helpers/math.js';

/**
 * Kid-fun affordances added in the UX pass:
 *  - poking the splash mascot plays a cheer instead of leaving the screen
 *  - a praise word pops when a problem is solved
 *  - mult screens give the same two-wrongs hint as add/sub
 */

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { localStorage.clear(); localStorage.setItem('bm.playerName', 'JHANAV'); });
  await page.goto('/');
  await unlockAll(page);
});

// Drag a mult tile (data-value) onto a target locator.
async function dragValueTo(page, value, targetLocator) {
  const tile = page.locator(`.tile[data-value="${value}"]`).first();
  const tBox = await tile.boundingBox();
  const sBox = await targetLocator.boundingBox();
  await page.mouse.move(tBox.x + tBox.width / 2, tBox.y + tBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(sBox.x + sBox.width / 2, sBox.y + sBox.height / 2, { steps: 8 });
  await page.mouse.up();
}

test('poking the splash mascot cheers without leaving the splash', async ({ page }) => {
  await page.goto('/');
  await page.locator('.splash-mascot').click();
  await page.waitForTimeout(300);
  await expect(page.locator('#screen-splash')).toBeVisible();
  await expect(page.locator('#screen-map')).not.toBeAttached();
});

test('solving a mult-tap problem pops a praise word', async ({ page }) => {
  await goToLevel(page, 'mult', 1); // first problem 2×1 = 2
  await dragValueTo(page, 2, page.locator('.slot.active'));
  await expect(page.locator('.praise-pop')).toBeAttached();
});

test('two wrong drops on a mult problem highlight the correct tile', async ({ page }) => {
  await goToLevel(page, 'mult', 1); // first problem 2×1 = 2
  await dragValueTo(page, 5, page.locator('.slot.active'));
  await page.waitForTimeout(700); // bounce-back
  await dragValueTo(page, 7, page.locator('.slot.active'));
  await page.waitForTimeout(700);
  await expect(page.locator('.tile.hint-target[data-value="2"]')).toBeAttached();
  await expect(page.locator('.tile.hint-dim').first()).toBeAttached();
});

test('solving an addition problem pops a praise word', async ({ page }) => {
  await goToLevel(page, 'add', 1); // first problem 12+3=15: ones 5, tens 1
  const drag = async (digit) => {
    const tile = page.locator(`.tile[data-digit="${digit}"]`).first();
    const tBox = await tile.boundingBox();
    const sBox = await page.locator('.slot.active').boundingBox();
    await page.mouse.move(tBox.x + tBox.width / 2, tBox.y + tBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(sBox.x + sBox.width / 2, sBox.y + sBox.height / 2, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(450);
  };
  await drag(5);
  await drag(1);
  await expect(page.locator('.praise-pop')).toBeAttached();
});
