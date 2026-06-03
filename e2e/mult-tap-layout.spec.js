import { test, expect } from '@playwright/test';
import { unlockAll } from './helpers/math.js';

test('mult tap-count: answer box sits in the equation, clear of the digit tray', async ({ page }) => {
  test.setTimeout(30_000);
  await page.goto('/');
  await unlockAll(page);
  await page.goto('/');
  await page.locator('.splash-play').click();
  await page.locator('.world-panel').nth(2).locator('.level-node[data-level="1"]').click();
  await page.waitForTimeout(800);

  // The box right after "=" is the active drop slot.
  const box = page.locator('.mult-problem .op-chip.q.slot');
  await expect(box).toBeVisible();
  const boxBox = await box.boundingBox();
  const tray = await page.locator('.digit-tray').boundingBox();
  const eqChip = await page.locator('.mult-problem .op-chip').first().boundingBox();

  // Answer box is on the equation row (same y band as the operand chips).
  expect(Math.abs(boxBox.y - eqChip.y)).toBeLessThan(20);
  // Equation row sits fully above the digit tray (no overlap).
  expect(boxBox.y + boxBox.height).toBeLessThan(tray.y);
  // The separate "how many total?" panel is gone.
  await expect(page.locator('.total-reveal, .ans-host')).toHaveCount(0);
});
