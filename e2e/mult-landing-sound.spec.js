import { test, expect } from '@playwright/test';
import { unlockAll, goToLevel } from './helpers/math.js';

// Guards the drag-screen counting path (onPileTap). Tapping a pile mango must
// fly a unit into the next box, plant it there, and bump that tray's count —
// the same onfinish callback that now plays the rising landing blip
// (sfx.blockTap). Audio itself can't be asserted headless, but this proves the
// landing callback runs cleanly (no throw) on every tap.
test('drag screen: tapping a pile mango lands a unit in its box and counts up', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await unlockAll(page);
  await goToLevel(page, 'mult', 4); // L4 first problem 2×3 → b=3 trays of a=2
  await expect(page.locator('#screen-mult-drag')).toBeVisible();

  // Tap the first pile mango.
  const mango = page.locator('.block-pile .block-host').first();
  const box = await mango.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(600); // 380ms flight + settle

  // A unit was planted in a tray, and the first tray's chip incremented.
  await expect(page.locator('.group-tray .block-host.in-group')).toHaveCount(1);
  await expect(page.locator('.group-tray[data-idx="0"] .count-chip')).toHaveText('1 / 2');
  expect(errors, 'no page errors during the landing callback').toEqual([]);
});
