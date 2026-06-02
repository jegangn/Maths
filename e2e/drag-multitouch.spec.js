import { test, expect } from '@playwright/test';
import { unlockAll, goToLevel } from './helpers/math.js';

// Regression: a child playing on a touchscreen presses two tiles at once.
// The drag manager must track each pointer independently — a second concurrent
// touch must NOT orphan the first drag's clone (which would leave "stuck"
// number tiles piling up on the stage) or leave a source tile hidden.
//
// Before the fix this left 1+ orphaned `.drag-clone` on the stage and the first
// tile stranded at visibility:hidden.

async function dispatchMultiTouch(page) {
  await page.evaluate(() => {
    // Synthetic pointers can't be captured; stub it so start() doesn't throw.
    const origCapture = Element.prototype.setPointerCapture;
    Element.prototype.setPointerCapture = function () {};
    try {
      const tiles = document.querySelectorAll('#screen-mult-drag .digit-tray .tile');
      const a = tiles[0], b = tiles[1];
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      const down = (el, id, r) => el.dispatchEvent(new PointerEvent('pointerdown', {
        pointerId: id, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true, cancelable: true,
      }));
      const winMove = (id, x, y) => window.dispatchEvent(new PointerEvent('pointermove', { pointerId: id, clientX: x, clientY: y, bubbles: true }));
      const winUp = (id, x, y) => window.dispatchEvent(new PointerEvent('pointerup', { pointerId: id, clientX: x, clientY: y, bubbles: true }));

      // Finger 1 grabs tile A, finger 2 grabs tile B while A is still held.
      down(a, 1, ra);
      down(b, 2, rb);
      winMove(1, ra.left + 40, ra.top - 30);
      winMove(2, rb.left + 40, rb.top - 30);
      // Finger 1 lifts first (the orphan trigger), then finger 2 lifts.
      winUp(1, ra.left + 40, ra.top - 30);
      winUp(2, rb.left + 40, rb.top - 30);
    } finally {
      Element.prototype.setPointerCapture = origCapture;
    }
  });
}

async function settledState(page) {
  return await page.evaluate(() => {
    const stage = document.getElementById('stage');
    const orphanClones = stage.querySelectorAll('.drag-clone').length;
    const hiddenTiles = Array.from(document.querySelectorAll('#screen-mult-drag .digit-tray .tile'))
      .filter((t) => t.style.visibility === 'hidden').map((t) => t.dataset.value);
    return { orphanClones, hiddenTiles };
  });
}

test('two concurrent touches never leave a tile clone stuck on the stage', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await unlockAll(page);
  await page.goto('/');
  await page.waitForTimeout(200);
  await goToLevel(page, 'mult', 6); // 5×4=20, drag mode
  await page.waitForTimeout(400);

  await dispatchMultiTouch(page);
  // Let both bounce-back animations finish (≈450ms). The buggy version left the
  // first drag's clone stuck FOREVER (no animation) and its tile hidden; the
  // fixed version cleans up both pointers, so nothing remains once settled.
  await page.waitForTimeout(700);
  const res = await settledState(page);

  expect(res.orphanClones, 'orphaned .drag-clone left on stage').toBe(0);
  expect(res.hiddenTiles, 'tiles left visibility:hidden').toEqual([]);
});
