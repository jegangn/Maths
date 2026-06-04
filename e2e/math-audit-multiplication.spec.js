/**
 * math-audit-multiplication.spec.js
 *
 * Rigorous math-correctness audit for all 6 multiplication levels (30 problems).
 *   L1-L3: tap-count mode — tap all firefly blocks (counting practice), then
 *          drop the answer tile into the box after "=".
 *   L4-L6: drag-groups mode — tap pile mangoes to fill the group trays, then
 *          drop the answer tile into the box after "=".
 *
 * 2026-06 mult model: `a × b` renders as **b groups of a items** (b lily-pads /
 * group-trays, each holding a units). The answer is a SINGLE tile whose
 * data-value equals the product (a digit tile for <10, a compound tile for ≥10),
 * dropped into `.mult-problem .op-chip.q.slot` (which carries `.slot.active`).
 * The old `.total-reveal` / `.ans-host` ("HOW MANY TOTAL?") panels were removed.
 *
 * Operands are verified against SEEDS before every problem via .op-chip elements.
 */

import { test, expect } from "@playwright/test";
import {
  SEEDS,
  computeAnswer,
  unlockAll,
  goToLevel,
  readMultOperands,
} from "./helpers/math.js";

// ---------------------------------------------------------------------------
// Shared setup
// ---------------------------------------------------------------------------
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await unlockAll(page);
  await page.goto("/");
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Drop the answer: a SINGLE tile whose data-value is the product (a digit tile
// for <10, a compound tile for ≥10) onto the answer box after "=" — the active
// `.slot` inside `.mult-problem`.
async function dragValueToSlot(page, value) {
  const tile = page.locator(`.tile[data-value="${value}"]`).first();
  const slot = page.locator(".slot.active").first();
  // Wait for both to render before measuring — boundingBox() returns null for a
  // not-yet-attached element, which crashes the drag under render lag.
  await tile.waitFor({ state: "visible" });
  await slot.waitFor({ state: "visible" });
  const tb = await tile.boundingBox();
  const sb = await slot.boundingBox();
  await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2);
  await page.mouse.down();
  await page.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(800); // snap-in (~380ms) + buffer before advance
}

const enterMultAnswer = (page, answer) => dragValueToSlot(page, answer);

// Tap a pile mango on the drag screen: onPileTap flies a unit into the NEXT
// empty group slot. Groups fill left-to-right, one full group at a time, so
// `a` taps complete tray g once groups < g are already full.
// We dispatch pointerup directly on the mango (what the game listens for)
// rather than clicking coordinates — in dense layouts (e.g. 5×5 with a tall
// two-row digit tray) the tray overlaps the pile, so coordinate taps would
// land on the wrong element and silently miss.
async function tapPileMango(page) {
  await page.locator(".block-pile .block-host").first().dispatchEvent("pointerup");
  await page.waitForTimeout(450); // 380ms flight + settle
}

// ---------------------------------------------------------------------------
// Tap-count levels L1-L3
// ---------------------------------------------------------------------------

for (let level = 1; level <= 3; level++) {
  test(`mult tap L${level}: all 5 problems verified`, async ({ page }) => {
    test.setTimeout(150_000);

    await goToLevel(page, "mult", level);
    await expect(page.locator("#screen-mult-tap")).toBeVisible({ timeout: 5000 });

    const seeds = SEEDS.multTap[level];

    for (let i = 0; i < seeds.length; i++) {
      const [seedA, seedB] = seeds[i];
      const expected = computeAnswer("mult", seedA, seedB);

      // blockFlyIn animation takes ~800ms; problem transition adds 500ms
      await page.waitForTimeout(i === 0 ? 900 : 1100);

      // --- Verify operands ---
      const { a, b } = await readMultOperands(page);
      expect(a, `L${level} P${i + 1}: expected a=${seedA}, got ${a}`).toBe(seedA);
      expect(b, `L${level} P${i + 1}: expected b=${seedB}, got ${b}`).toBe(seedB);

      // --- Verify block count = a × b (b groups of a items) ---
      const blockCount = await page.locator(".block-host.untapped").count();
      expect(
        blockCount,
        `L${level} P${i + 1}: expected ${seedA * seedB} untapped blocks, got ${blockCount}`
      ).toBe(seedA * seedB);

      // --- Tap all blocks (counting practice; no longer required) ---
      let remaining = await page.locator(".block-host.untapped").count();
      while (remaining > 0) {
        await page.locator(".block-host.untapped").first().click({ force: true });
        await page.waitForTimeout(160);
        remaining = await page.locator(".block-host.untapped").count();
      }

      // Answer box (after "=") is the active drop target — present from the start.
      await expect(
        page.locator(".mult-problem .op-chip.q.slot.active"),
        `L${level} P${i + 1}: answer box should be active`
      ).toBeVisible({ timeout: 3000 });
      await page.waitForTimeout(300);

      // --- Enter the answer ---
      await enterMultAnswer(page, expected);

      await page.waitForTimeout(400);
    }

    // Level complete
    await expect(page.locator("#screen-complete")).toBeVisible({ timeout: 8000 });
    await expect(page.locator(".complete-title")).toHaveText("LEVEL CLEAR!");
    await expect(
      page.locator(".star-meter.big .star.earned"),
      `L${level}: expected 3 stars`
    ).toHaveCount(3, { timeout: 5000 });
  });
}

// ---------------------------------------------------------------------------
// Drag-groups levels L4-L6
// ---------------------------------------------------------------------------

for (let level = 4; level <= 6; level++) {
  test(`mult drag L${level}: all 5 problems verified`, async ({ page }) => {
    test.setTimeout(180_000);

    await goToLevel(page, "mult", level);
    await expect(page.locator("#screen-mult-drag")).toBeVisible({ timeout: 5000 });

    const seeds = SEEDS.multDrag[level];

    for (let i = 0; i < seeds.length; i++) {
      const [seedA, seedB] = seeds[i];
      const expected = computeAnswer("mult", seedA, seedB);

      // Problem transition: 500ms setTimeout in renderProblem + render time
      await page.waitForTimeout(i === 0 ? 400 : 800);

      // --- Verify operands ---
      const { a, b } = await readMultOperands(page);
      expect(a, `L${level} P${i + 1}: expected a=${seedA}, got ${a}`).toBe(seedA);
      expect(b, `L${level} P${i + 1}: expected b=${seedB}, got ${b}`).toBe(seedB);

      // --- Verify tray count = b (a × b renders as b groups of a items) ---
      const trayCount = await page.locator(".group-tray").count();
      expect(
        trayCount,
        `L${level} P${i + 1}: expected ${seedB} group trays, got ${trayCount}`
      ).toBe(seedB);

      // --- Fill the b trays, a items each, by tapping pile mangoes ---
      // Auto-fill goes to the next empty group, so seedA taps complete tray g
      // once groups < g are already full.
      for (let g = 0; g < seedB; g++) {
        for (let fill = 0; fill < seedA; fill++) {
          await tapPileMango(page);
        }
        // Tray chip should show the filled state (needed = a)
        await expect(
          page.locator(`.group-tray[data-idx="${g}"] .count-chip`),
          `L${level} P${i + 1} tray ${g}: expected "★ ${seedA}"`
        ).toHaveText(`★ ${seedA}`, { timeout: 3000 });
      }

      // Answer box (after "=") is the active drop target.
      await expect(
        page.locator(".mult-problem .op-chip.q.slot.active"),
        `L${level} P${i + 1}: answer box should be active`
      ).toBeVisible({ timeout: 3000 });
      await page.waitForTimeout(300);

      // --- Enter the answer ---
      await enterMultAnswer(page, expected);

      await page.waitForTimeout(400);
    }

    // Level complete
    await expect(page.locator("#screen-complete")).toBeVisible({ timeout: 8000 });
    await expect(page.locator(".complete-title")).toHaveText("LEVEL CLEAR!");
    await expect(
      page.locator(".star-meter.big .star.earned"),
      `L${level}: expected 3 stars`
    ).toHaveCount(3, { timeout: 5000 });
  });
}

// ---------------------------------------------------------------------------
// Wrong-digit rejection for multiplication tap mode
// ---------------------------------------------------------------------------
test("mult tap L1 P1: wrong digit bounces back, correct digit accepted", async ({ page }) => {
  test.setTimeout(30_000);

  await goToLevel(page, "mult", 1);
  await expect(page.locator("#screen-mult-tap")).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(900);

  // L1 P1: 2×1=2. Tap the 2 fireflies first (counting practice).
  let remaining = await page.locator(".block-host.untapped").count();
  while (remaining > 0) {
    await page.locator(".block-host.untapped").first().click({ force: true });
    await page.waitForTimeout(160);
    remaining = await page.locator(".block-host.untapped").count();
  }
  // The answer box (after "=") is the active drop target.
  await expect(page.locator(".mult-problem .op-chip.q.slot.active")).toBeVisible({ timeout: 3000 });
  await page.waitForTimeout(300);

  // Answer = 2. Drop wrong tile 7 first → bounces back, box stays empty/active.
  await dragValueToSlot(page, 7);
  await expect(page.locator(".mult-problem .op-chip.q.slot.active")).toBeVisible();
  await expect(page.locator(".slot.filled")).toHaveCount(0);

  // Drop correct tile 2 → accepted; the problem advances (first progress dot fills).
  await dragValueToSlot(page, 2);
  await expect(page.locator(".dot.filled")).toHaveCount(1);
});
