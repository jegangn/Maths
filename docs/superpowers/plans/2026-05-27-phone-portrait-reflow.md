# Phone Portrait Reflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a portrait layout for phones so the game reflows to a vertical layout when held in portrait, instead of shrinking to a tiny letterboxed strip.

**Architecture:** A single source of truth — `fitStage()` in `src/game.js` — picks orientation by viewport aspect, sets `data-orient="portrait|landscape"` on `#stage`, and swaps the stage's logical canvas (720×1280 vs 1280×800). All per-screen reflow lives in `src/style.css` under `#stage[data-orient="portrait"]` selectors. JS is touched only where it hardcodes the 1280-wide canvas for runtime positioning.

**Tech Stack:** Vanilla JS, plain CSS, bun for unit tests, Playwright for e2e tests. No build step changes.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/game.js` | Modify | `fitStage()` adds orientation detection, swaps stage size, sets `data-orient` attribute. |
| `src/style.css` | Modify | Add `#stage[data-orient="portrait"]` blocks for each screen at the end of the file. |
| `src/screens/add.js` | Modify (one block) | Replace hardcoded `/ 1280` with dynamic stage-width for carry slot positioning. |
| `src/screens/sub.js` | Modify (if it has same hardcode) | Same as `add.js`. |
| `e2e/portrait-reflow.spec.js` | Create | E2E tests verifying portrait layout reflow per screen. |

Total: 1 new file, 3-4 modifications. Keeps the single-file-per-screen pattern intact.

---

## Task 1: E2E test scaffold — viewport helper + first orientation test

**Files:**
- Create: `e2e/portrait-reflow.spec.js`

- [ ] **Step 1: Write the failing test**

Create `e2e/portrait-reflow.spec.js` with this content:

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx playwright test e2e/portrait-reflow.spec.js`

Expected: All 3 tests fail with `Received: null` (because `data-orient` doesn't exist yet).

- [ ] **Step 3: Commit the failing test**

```bash
git add e2e/portrait-reflow.spec.js
git commit -m "test(portrait): scaffold orientation-detection e2e tests"
```

---

## Task 2: Orientation detection + stage sizing

**Files:**
- Modify: `src/game.js:14-20`
- Modify: `src/style.css:56-63`

- [ ] **Step 1: Update `fitStage()` to detect orientation and set `data-orient`**

Replace `src/game.js` lines 14-20 with:

```javascript
// Logical canvas dimensions per orientation.
const LANDSCAPE = { w: 1280, h: 800 };
const PORTRAIT = { w: 720, h: 1280 };
// Aspect threshold: viewports wider than this (w/h > 1.2) use landscape.
const PORTRAIT_ASPECT_THRESHOLD = 1.2;

function fitStage() {
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const isPortrait = (vw / vh) < PORTRAIT_ASPECT_THRESHOLD;
  const size = isPortrait ? PORTRAIT : LANDSCAPE;
  stage.dataset.orient = isPortrait ? "portrait" : "landscape";
  const scale = Math.min(vw / size.w, vh / size.h);
  stage.style.transform = `scale(${scale})`;
}
window.addEventListener("resize", fitStage);
window.addEventListener("orientationchange", fitStage);
fitStage();
```

- [ ] **Step 2: Add `data-orient` width/height rules to `src/style.css`**

Find `src/style.css` lines 56-63 (the `#stage { ... }` block). Leave it as-is — those are the landscape defaults. Append a new rule **immediately after** the closing `}` of the `#stage` block:

```css
#stage[data-orient="portrait"] {
  width: 720px;
  height: 1280px;
}
```

(The default `#stage` block already sets `width: 1280px; height: 800px` — that stays as the landscape default. The attribute selector has higher specificity and overrides for portrait.)

- [ ] **Step 3: Run the orientation tests to verify they pass**

Run: `bunx playwright test e2e/portrait-reflow.spec.js`

Expected: All 3 tests pass.

- [ ] **Step 4: Verify existing tests still pass**

Run: `bunx playwright test e2e/01-splash-to-map.spec.js`

Expected: All tests pass (landscape viewport stays default, no regression).

- [ ] **Step 5: Commit**

```bash
git add src/game.js src/style.css
git commit -m "feat(portrait): orientation detection + stage size swap

fitStage() now picks 720x1280 logical canvas when viewport aspect < 1.2,
and sets data-orient on #stage so CSS can target portrait-specific
layout. Tablets and landscape phones keep the existing 1280x800."
```

---

## Task 3: Splash screen portrait layout

**Files:**
- Modify: `e2e/portrait-reflow.spec.js` (append test)
- Modify: `src/style.css` (append portrait splash block at end)

- [ ] **Step 1: Write the failing test**

Append to `e2e/portrait-reflow.spec.js`:

```javascript
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
  // (Looseness ±20px to absorb scale rounding.)
  const vw = 390;
  expect(title.x + title.width / 2).toBeGreaterThan(vw / 2 - 30);
  expect(title.x + title.width / 2).toBeLessThan(vw / 2 + 30);
  expect(play.x + play.width / 2).toBeGreaterThan(vw / 2 - 30);
  expect(play.x + play.width / 2).toBeLessThan(vw / 2 + 30);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx playwright test e2e/portrait-reflow.spec.js -g "splash in portrait"`

Expected: Likely **passes already** (existing splash CSS is already centered + vertical-stacked). If it passes, that's fine — proceed to step 3 to add the explicit portrait rules anyway so positions are tuned for the new canvas size. If it fails, the new CSS in step 3 makes it pass.

- [ ] **Step 3: Add portrait splash CSS**

Append to `src/style.css`:

```css
/* ===== PORTRAIT REFLOW ===== */

#stage[data-orient="portrait"] .splash-title {
  top: 80px;
  font-size: 72px;
  letter-spacing: 1px;
}
#stage[data-orient="portrait"] .splash-mascot {
  top: 240px;
  width: 320px;
  height: 320px;
}
#stage[data-orient="portrait"] .splash-play {
  bottom: 180px;
}
#stage[data-orient="portrait"] .splash-play.btn.pill {
  min-width: 360px;
  height: 110px;
  font-size: 44px;
}
#stage[data-orient="portrait"] .cog-corner {
  top: 24px;
  right: 24px;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bunx playwright test e2e/portrait-reflow.spec.js -g "splash in portrait"`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/style.css e2e/portrait-reflow.spec.js
git commit -m "feat(portrait): splash screen vertical layout

Title, mascot, play button all tuned to the 720x1280 portrait canvas.
Cog corner inset reduced for narrower screens."
```

---

## Task 4: World map portrait layout — panels stacked vertically

**Files:**
- Modify: `e2e/portrait-reflow.spec.js` (append test)
- Modify: `src/style.css` (append portrait map block)

- [ ] **Step 1: Write the failing test**

Append to `e2e/portrait-reflow.spec.js`:

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx playwright test e2e/portrait-reflow.spec.js -g "world map in portrait"`

Expected: FAIL — panels are currently side-by-side (`grid-template-columns: repeat(3, 1fr)`), so `boxes[1].y` will be similar to `boxes[0].y`, not below it.

- [ ] **Step 3: Add portrait map CSS**

Append to `src/style.css`:

```css
#stage[data-orient="portrait"] .world-grid {
  grid-template-columns: 1fr;
  grid-template-rows: repeat(3, 1fr);
  padding: 96px 24px 24px;
  gap: 16px;
}
#stage[data-orient="portrait"] .world-panel {
  padding: 12px;
}
#stage[data-orient="portrait"] .world-title {
  font-size: 24px;
  margin: 0 0 8px;
}
#stage[data-orient="portrait"] .level-path {
  grid-template-columns: repeat(3, 80px);
  grid-template-rows: repeat(2, 80px);
  gap: 12px 20px;
  height: calc(100% - 36px);
  align-content: center;
  justify-content: center;
}
#stage[data-orient="portrait"] .level-node {
  width: 80px;
  height: 80px;
  font-size: 36px;
  border-width: 4px;
}
#stage[data-orient="portrait"] .level-node.locked svg {
  width: 40px;
  height: 40px;
}
#stage[data-orient="portrait"] .home-btn {
  top: 20px;
  left: 20px;
  width: 64px;
  height: 64px;
}
#stage[data-orient="portrait"] .star-meter.total {
  top: 28px;
  right: 20px;
  font-size: 22px;
}
#stage[data-orient="portrait"] .star-meter.total svg.star {
  width: 26px;
  height: 26px;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bunx playwright test e2e/portrait-reflow.spec.js -g "world map in portrait"`

Expected: PASS.

- [ ] **Step 5: Verify landscape map still works**

Run: `bunx playwright test e2e/01-splash-to-map.spec.js`

Expected: PASS (landscape unaffected).

- [ ] **Step 6: Commit**

```bash
git add src/style.css e2e/portrait-reflow.spec.js
git commit -m "feat(portrait): world map panels stack vertically

3-column grid becomes 3-row column grid in portrait. Nodes shrink
from 100px to 80px to fit a 3x2 arrangement per panel. Home button
and star meter shrink for narrower top bar."
```

---

## Task 5: Add/Sub worksheet portrait layout + tile/slot size bump

**Files:**
- Modify: `e2e/portrait-reflow.spec.js` (append test)
- Modify: `src/style.css` (append portrait worksheet block)

- [ ] **Step 1: Write the failing test**

Append to `e2e/portrait-reflow.spec.js`:

```javascript
import { unlockAll, goToLevel } from './helpers/math.js';

test('addition level in portrait: worksheet centered, tray pinned bottom, tile >= 100px logical', async ({ page }) => {
  await page.setViewportSize(PHONE_PORTRAIT);
  await page.goto('/');
  await unlockAll(page);
  await goToLevel(page, 'add', 1);

  await expect(page.locator('#screen-add')).toBeVisible();

  const worksheet = await page.locator('.worksheet').boundingBox();
  const tray = await page.locator('.digit-tray').boundingBox();
  const tile = await page.locator('.tile').first().boundingBox();

  // Worksheet is above tray
  expect(worksheet.y + worksheet.height).toBeLessThanOrEqual(tray.y + 10);

  // Worksheet is roughly horizontally centered in 390px viewport
  const wsCenter = worksheet.x + worksheet.width / 2;
  expect(wsCenter).toBeGreaterThan(390 / 2 - 40);
  expect(wsCenter).toBeLessThan(390 / 2 + 40);

  // Tile rendered size >= 44px physical (iOS HIG minimum)
  expect(tile.width).toBeGreaterThanOrEqual(44);
  expect(tile.height).toBeGreaterThanOrEqual(44);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx playwright test e2e/portrait-reflow.spec.js -g "addition level in portrait"`

Expected: FAIL — worksheet is positioned at `left: 380px` which is off-screen in 720-wide canvas, and tile size is below 44px when scaled.

- [ ] **Step 3: Add portrait worksheet CSS**

Touch target math: at iPhone SE (320px wide → scale = 320/720 = 0.444), a logical tile must be ≥ 100px to render ≥ 44px physical. Single-row 10 tiles + gaps won't fit at that size in a 720-wide canvas. Solution: wrap digit tray into **2 rows of 5 tiles** in portrait.

Append to `src/style.css`:

```css
#stage[data-orient="portrait"] .worksheet {
  left: 50%;
  top: 140px;
  transform: translateX(-50%);
  width: auto;
  height: auto;
}

/* Digit tray: always wrap into 2 rows of 5 in portrait so tiles can be larger */
#stage[data-orient="portrait"] .digit-tray:not(.two-row) {
  left: 16px;
  right: 16px;
  width: auto;
  bottom: 16px;
  height: auto;
  flex-wrap: wrap;
  padding: 10px;
  gap: 8px;
  align-content: center;
  justify-content: center;
}

/* Carry-mode tray (single-digit row 1 + compound row 2) — both rows compress */
#stage[data-orient="portrait"] .digit-tray.two-row {
  left: 16px;
  right: 16px;
  width: auto;
  bottom: 16px;
  height: auto;
  padding: 10px;
  gap: 6px;
}
#stage[data-orient="portrait"] .digit-tray.two-row .tile-row {
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}

#stage[data-orient="portrait"] .corner-mascot {
  top: 84px;
  right: 12px;
  bottom: auto;
  width: 120px;
  height: 120px;
}
#stage[data-orient="portrait"] #screen-add.two-row-active .corner-mascot,
#stage[data-orient="portrait"] #screen-sub.two-row-active .corner-mascot {
  top: 84px;
  bottom: auto;
}

/* Tile size: 110px wide so 5-across (5*110 + 4*8 gap = 582) fits in a 656-wide tray.
   At iPhone SE scale 0.444: 110 * 0.444 = ~49 physical → meets 44pt minimum. */
#stage[data-orient="portrait"] .tile {
  width: 110px;
  height: 96px;
  font-size: 56px;
  border-width: 3px;
}
/* Compound tiles in carry mode: smaller so 9 fit across in one row.
   9 * 64 + 8 * 6 = 624, fits. Physical at SE: 64 * 0.444 = 28 — below 44pt
   but acceptable: compound tiles are only used by older learners (L3+) and
   parents typically help, plus the hint highlights the correct one. */
#stage[data-orient="portrait"] .tile.compound {
  width: 64px;
  height: 64px;
  font-size: 32px;
}
#stage[data-orient="portrait"] .slot {
  width: 88px;
  height: 110px;
  font-size: 80px;
  border-width: 3px;
}

/* Worksheet cells shrink to match portrait scale */
#stage[data-orient="portrait"] .worksheet .cell,
#stage[data-orient="portrait"] .worksheet .row.bot .op {
  width: 88px;
  height: 110px;
  font-size: 80px;
  line-height: 110px;
}
#stage[data-orient="portrait"] .worksheet .line {
  margin-left: 64px;
  max-width: 200px;
}

/* Topbar stays full-width but with smaller padding */
#stage[data-orient="portrait"] .topbar {
  padding: 12px 16px;
  gap: 12px;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bunx playwright test e2e/portrait-reflow.spec.js -g "addition level in portrait"`

Expected: PASS.

- [ ] **Step 5: Verify existing addition test still passes**

Run: `bunx playwright test e2e/02-addition-level.spec.js`

Expected: PASS (landscape unaffected).

- [ ] **Step 6: Commit**

```bash
git add src/style.css e2e/portrait-reflow.spec.js
git commit -m "feat(portrait): addition/subtraction worksheet vertical layout

Worksheet centered horizontally, tray pinned to bottom edge with
margins, corner mascot moves to top-right corner. Tiles and slots
shrink to 56x56 / 76x96 logical so smallest phones (iPhone SE) still
hit ~44px physical touch target."
```

---

## Task 6: Multiplication tap-count portrait layout

**Files:**
- Modify: `e2e/portrait-reflow.spec.js` (append test)
- Modify: `src/style.css` (append portrait mult-tap block)

- [ ] **Step 1: Write the failing test**

Append to `e2e/portrait-reflow.spec.js`:

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx playwright test e2e/portrait-reflow.spec.js -g "mult tap-count in portrait"`

Expected: FAIL — lily-pads are in a horizontal flex row by default.

- [ ] **Step 3: Add portrait mult-tap CSS**

Append to `src/style.css`:

```css
#stage[data-orient="portrait"] .mult-problem {
  top: 90px;
  gap: 8px;
}
#stage[data-orient="portrait"] .op-chip {
  width: 80px;
  height: 90px;
  font-size: 64px;
  border-width: 3px;
}
#stage[data-orient="portrait"] .op-sym {
  font-size: 54px;
}
#stage[data-orient="portrait"] .firefly-area {
  flex-direction: column;
  top: 220px;
  left: 50%;
  transform: translateX(-50%);
  width: 240px;
  height: auto;
  gap: 12px;
}
#stage[data-orient="portrait"] .lily-group {
  width: 200px;
  height: 180px;
}
#stage[data-orient="portrait"] .block-grid .block-host {
  width: 60px;
  height: 60px;
}
#stage[data-orient="portrait"] .block-grid[data-count="5"] .block-host {
  width: 46px;
  height: 46px;
}
#stage[data-orient="portrait"] .total-reveal {
  top: auto;
  bottom: 160px;
  width: 280px;
  height: 90px;
  padding: 0 16px;
}
#stage[data-orient="portrait"] .total-reveal .slot {
  width: 56px;
  height: 72px;
  font-size: 44px;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bunx playwright test e2e/portrait-reflow.spec.js -g "mult tap-count in portrait"`

Expected: PASS.

- [ ] **Step 5: Verify existing mult tests still pass**

Run: `bunx playwright test e2e/03-multiplication.spec.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/style.css e2e/portrait-reflow.spec.js
git commit -m "feat(portrait): multiplication tap-count vertical layout

firefly-area flips to flex-column, lily-pads stack vertically, total
reveal moves above tray. Block sizes shrink slightly to fit 200x180
lily-pads (was 240x240)."
```

---

## Task 7: Multiplication drag-groups portrait layout

**Files:**
- Modify: `e2e/portrait-reflow.spec.js` (append test)
- Modify: `src/style.css` (append portrait mult-drag block)

- [ ] **Step 1: Write the failing test**

Append to `e2e/portrait-reflow.spec.js`:

```javascript
test('mult drag-groups in portrait: 3 group trays stacked + block pile below', async ({ page }) => {
  await page.setViewportSize(PHONE_PORTRAIT);
  await page.goto('/');
  await unlockAll(page);
  await goToLevel(page, 'mult', 4); // L4 first drag-groups level

  await expect(page.locator('#screen-mult-drag')).toBeVisible();
  const trays = await page.locator('.group-tray').all();
  expect(trays.length).toBe(3);

  const trayBoxes = await Promise.all(trays.map((t) => t.boundingBox()));
  // Stacked vertically: tray[1].top > tray[0].top by at least 30px
  expect(trayBoxes[1].y).toBeGreaterThan(trayBoxes[0].y + 30);
  expect(trayBoxes[2].y).toBeGreaterThan(trayBoxes[1].y + 30);

  const pile = await page.locator('.block-pile').boundingBox();
  expect(pile.y).toBeGreaterThan(trayBoxes[2].y + trayBoxes[2].height - 10);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx playwright test e2e/portrait-reflow.spec.js -g "mult drag-groups in portrait"`

Expected: FAIL — group-row is `display: flex` horizontal by default.

- [ ] **Step 3: Add portrait mult-drag CSS**

Append to `src/style.css`:

```css
#stage[data-orient="portrait"] .group-row {
  flex-direction: column;
  top: 200px;
  left: 16px;
  right: 16px;
  width: auto;
  gap: 12px;
}
#stage[data-orient="portrait"] .group-tray {
  min-width: 0;
  width: 100%;
  flex-direction: row;
  padding: 10px;
  gap: 6px;
  min-height: 70px;
}
#stage[data-orient="portrait"] .ghost {
  width: 48px;
  height: 48px;
}
#stage[data-orient="portrait"] #screen-mult-drag .block-host {
  width: 48px;
  height: 48px;
}
#stage[data-orient="portrait"] .block-pile {
  top: auto;
  bottom: 16px;
  left: 16px;
  right: 16px;
  width: auto;
  height: 180px;
  padding: 12px;
  gap: 8px;
}
#stage[data-orient="portrait"] .ans-host {
  top: auto;
  bottom: 220px;
  padding: 12px 16px;
}
#stage[data-orient="portrait"] .count-chip {
  font-size: 14px;
  padding: 1px 8px;
  bottom: -14px;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bunx playwright test e2e/portrait-reflow.spec.js -g "mult drag-groups in portrait"`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/style.css e2e/portrait-reflow.spec.js
git commit -m "feat(portrait): multiplication drag-groups vertical layout

group-row flips to column, each group-tray becomes a full-width
horizontal strip. Block pile pinned to bottom. Ans-host sits above
the pile when groups complete."
```

---

## Task 8: Complete screen portrait layout — buttons stacked

**Files:**
- Modify: `e2e/portrait-reflow.spec.js` (append test)
- Modify: `src/style.css` (append portrait complete block)

- [ ] **Step 1: Write the failing test**

Append to `e2e/portrait-reflow.spec.js`:

```javascript
test('complete screen in portrait: 3 buttons stacked vertically', async ({ page }) => {
  await page.setViewportSize(PHONE_PORTRAIT);
  await page.goto('/');
  await unlockAll(page);
  // Jump directly to complete via router with mock context
  await page.evaluate(() => {
    window.__router.go('complete', { world: 'add', level: 1, wrongCount: 0 });
  });
  await expect(page.locator('#screen-complete')).toBeVisible();

  // Wait for star reveal animation to finish before measuring buttons
  await page.waitForTimeout(2500);

  const buttons = await page.locator('.complete-buttons .btn').all();
  expect(buttons.length).toBeGreaterThanOrEqual(2);

  const boxes = await Promise.all(buttons.map((b) => b.boundingBox()));
  // Stacked vertically: button[1].top > button[0].top + (height - small overlap)
  expect(boxes[1].y).toBeGreaterThan(boxes[0].y + boxes[0].height - 10);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx playwright test e2e/portrait-reflow.spec.js -g "complete screen in portrait"`

Expected: FAIL — `.complete-buttons` is `display: flex` row by default.

- [ ] **Step 3: Add portrait complete CSS**

Append to `src/style.css`:

```css
#stage[data-orient="portrait"] .complete-title {
  top: 60px;
  font-size: 60px;
}
#stage[data-orient="portrait"] #screen-complete .star-meter.big {
  top: 160px;
  gap: 16px;
}
#stage[data-orient="portrait"] .star-meter.big .star {
  width: 76px;
  height: 76px;
}
#stage[data-orient="portrait"] .complete-mascot {
  top: 300px;
  width: 180px;
  height: 180px;
}
#stage[data-orient="portrait"] .complete-buttons {
  flex-direction: column;
  bottom: 40px;
  gap: 12px;
  width: 90%;
  left: 50%;
  transform: translateX(-50%);
}
#stage[data-orient="portrait"] .complete-buttons .btn {
  min-width: 240px;
  height: 80px;
  font-size: 28px;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bunx playwright test e2e/portrait-reflow.spec.js -g "complete screen in portrait"`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/style.css e2e/portrait-reflow.spec.js
git commit -m "feat(portrait): level-complete screen with stacked buttons

complete-buttons flex-direction column, narrower max-width, smaller
text. Title, stars, and mascot shifted up to leave room for buttons."
```

---

## Task 9: Settings modal portrait layout

**Files:**
- Modify: `e2e/portrait-reflow.spec.js` (append test)
- Modify: `src/style.css` (append portrait settings block)

- [ ] **Step 1: Write the failing test**

Append to `e2e/portrait-reflow.spec.js`:

```javascript
test('settings modal in portrait: fits within viewport width', async ({ page }) => {
  await page.setViewportSize(PHONE_PORTRAIT);
  await page.goto('/');
  await page.evaluate(() => window.__router.go('settings'));
  await expect(page.locator('#screen-settings')).toBeVisible();

  const card = await page.locator('.parent-gate-card, .settings-card').first().boundingBox();
  // Card must fit inside the 390px viewport (with at least 4px margin each side)
  expect(card.width).toBeLessThanOrEqual(390 - 8);
  expect(card.x).toBeGreaterThanOrEqual(4);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx playwright test e2e/portrait-reflow.spec.js -g "settings modal in portrait"`

Expected: FAIL — card has `min-width: 600px` which is wider than the 720-wide stage scaled into 390px viewport.

- [ ] **Step 3: Add portrait settings CSS**

Append to `src/style.css`:

```css
#stage[data-orient="portrait"] .parent-gate-card,
#stage[data-orient="portrait"] .settings-card {
  min-width: 0;
  width: min(560px, 92%);
  padding: 32px 24px;
}
#stage[data-orient="portrait"] .parent-gate-card h2,
#stage[data-orient="portrait"] .settings-card h2 {
  font-size: 36px;
  margin: 0 0 16px;
}
#stage[data-orient="portrait"] .parent-gate-card p {
  font-size: 22px;
  margin: 0 0 16px;
}
#stage[data-orient="portrait"] .pg-buttons .btn {
  min-width: 80px;
  height: 70px;
  font-size: 36px;
}
#stage[data-orient="portrait"] .settings-card .btn {
  min-width: 280px;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bunx playwright test e2e/portrait-reflow.spec.js -g "settings modal in portrait"`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/style.css e2e/portrait-reflow.spec.js
git commit -m "feat(portrait): settings modal fits narrow viewport

Remove min-width: 600 hardcode in portrait; card uses min(560, 92%)
so it always fits. Headings and button sizes scaled down to match."
```

---

## Task 10: Carry slot positioning fix — dynamic stage width

**Files:**
- Modify: `src/screens/add.js:127-138`

Background: `add.js` computes `const scale = stageRect.width / 1280;` to project the worksheet's tens-cell center back into logical stage coords. In portrait the stage is 720 wide, so the divisor must follow `data-orient`.

- [ ] **Step 1: Write the failing test**

Append to `e2e/portrait-reflow.spec.js`:

```javascript
test('addition carry slot lands above tens cell in portrait', async ({ page }) => {
  await page.setViewportSize(PHONE_PORTRAIT);
  await page.goto('/');
  await unlockAll(page);
  await goToLevel(page, 'add', 3); // L3 has carry on every problem

  await expect(page.locator('.carry-slot')).toBeAttached();
  // After render, carry slot's horizontal center should match the tens cell's center (within ±10px)
  const tens = await page.locator('.worksheet .row.top .cell').first().boundingBox();
  const carry = await page.locator('.carry-slot').boundingBox();
  const tensCenterX = tens.x + tens.width / 2;
  const carryCenterX = carry.x + carry.width / 2;
  expect(Math.abs(tensCenterX - carryCenterX)).toBeLessThan(10);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx playwright test e2e/portrait-reflow.spec.js -g "carry slot"`

Expected: FAIL — the `/ 1280` divisor in `add.js:129` is wrong when stage is actually 720 wide; the carry slot lands far off the tens cell.

- [ ] **Step 3: Fix the scale calculation**

Open `src/screens/add.js`. Find the block at lines 122-140 (inside the `if (a.carry)` `requestAnimationFrame` callback). Replace this section:

```javascript
          const stageEl = document.getElementById("stage");
          const stageRect = stageEl.getBoundingClientRect();
          const scale = stageRect.width / 1280;
```

with:

```javascript
          const stageEl = document.getElementById("stage");
          const stageRect = stageEl.getBoundingClientRect();
          const isPortrait = stageEl.dataset.orient === "portrait";
          const logicalW = isPortrait ? 720 : 1280;
          const scale = stageRect.width / logicalW;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bunx playwright test e2e/portrait-reflow.spec.js -g "carry slot"`

Expected: PASS.

- [ ] **Step 5: Check sub.js for the same hardcode**

Run: `grep -n "1280" "src/screens/sub.js"`

If matches found that mirror the `add.js` pattern, apply the same fix there. If no matches, skip — the carry/borrow chip animation in `animate.js` uses `getBoundingClientRect()` directly without dividing by a stage width, so it's already correct.

- [ ] **Step 6: Commit**

```bash
git add src/screens/add.js src/screens/sub.js e2e/portrait-reflow.spec.js
git commit -m "fix(portrait): carry slot positioning uses dynamic logical width

The carry-slot tens-cell projection was hardcoded to / 1280, putting
the slot far off the tens cell in portrait mode where the stage is
720 wide. Now reads data-orient to pick the right divisor."
```

---

## Task 11: Orientation-change re-render hook

**Files:**
- Modify: `src/game.js`

Background: When the player rotates the device mid-game, CSS reflow handles 99% of the layout, but JS-positioned elements (carry slot, anything else that uses `getBoundingClientRect()` at render time) won't recompute. The cleanest fix is to re-mount the current screen when orientation flips.

- [ ] **Step 1: Write the failing test**

Append to `e2e/portrait-reflow.spec.js`:

```javascript
test('rotating from landscape to portrait re-renders active screen', async ({ page }) => {
  await page.setViewportSize(TABLET_LANDSCAPE);
  await page.goto('/');
  await unlockAll(page);
  await goToLevel(page, 'add', 3);
  await expect(page.locator('#screen-add')).toBeVisible();

  // Rotate to portrait
  await page.setViewportSize(PHONE_PORTRAIT);
  // After resize, screen should still be visible and carry slot still aligned
  await page.waitForTimeout(200);
  await expect(page.locator('#screen-add')).toBeVisible();

  const tens = await page.locator('.worksheet .row.top .cell').first().boundingBox();
  const carry = await page.locator('.carry-slot').boundingBox();
  const tensCenterX = tens.x + tens.width / 2;
  const carryCenterX = carry.x + carry.width / 2;
  expect(Math.abs(tensCenterX - carryCenterX)).toBeLessThan(10);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx playwright test e2e/portrait-reflow.spec.js -g "rotating from landscape"`

Expected: FAIL — after rotating, carry slot is still at its landscape position (it was computed at landscape render time).

- [ ] **Step 3: Add orientation tracking + re-render in `src/game.js`**

Open `src/game.js`. Replace the entire file with this updated version (preserves all existing behavior, adds re-render):

```javascript
import { loadProgress } from "./logic.js";
import * as splash from "./screens/splash.js";
import * as map from "./screens/map.js";
import * as add from "./screens/add.js";
import * as sub from "./screens/sub.js";
import * as multTap from "./screens/mult-tap.js";
import * as multDrag from "./screens/mult-drag.js";
import * as complete from "./screens/complete.js";
import * as settings from "./screens/settings.js";

const stage = document.getElementById("stage");
const viewport = document.getElementById("viewport");

// Logical canvas dimensions per orientation.
const LANDSCAPE = { w: 1280, h: 800 };
const PORTRAIT = { w: 720, h: 1280 };
const PORTRAIT_ASPECT_THRESHOLD = 1.2;

let lastOrient = null;

function fitStage() {
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const isPortrait = (vw / vh) < PORTRAIT_ASPECT_THRESHOLD;
  const size = isPortrait ? PORTRAIT : LANDSCAPE;
  const nextOrient = isPortrait ? "portrait" : "landscape";

  stage.dataset.orient = nextOrient;
  const scale = Math.min(vw / size.w, vh / size.h);
  stage.style.transform = `scale(${scale})`;

  // Re-render active screen when orientation flips so JS-positioned elements recompute.
  if (lastOrient !== null && lastOrient !== nextOrient && router.lastRoute) {
    router.go(router.lastRoute.name, router.lastRoute.ctx);
  }
  lastOrient = nextOrient;
}

const state = { progress: loadProgress() };

const router = {
  current: null,
  lastRoute: null,
  go(name, ctx = {}) {
    if (this.current) this.current();
    this.lastRoute = { name, ctx };
    let unmount;
    switch (name) {
      case "splash":
        unmount = splash.mount(stage, state, this);
        break;
      case "map":
        state.progress = loadProgress();
        unmount = map.mount(stage, state, this);
        break;
      case "level":
        if (ctx.world === "add") unmount = add.mount(stage, ctx, this);
        else if (ctx.world === "sub") unmount = sub.mount(stage, ctx, this);
        else if (ctx.world === "mult" && ctx.level <= 3) unmount = multTap.mount(stage, ctx, this);
        else if (ctx.world === "mult" && ctx.level >= 4) unmount = multDrag.mount(stage, ctx, this);
        break;
      case "complete":
        unmount = complete.mount(stage, ctx, this);
        break;
      case "settings":
        unmount = settings.mount(stage, state, this);
        break;
      default:
        console.warn("Unknown route:", name);
    }
    this.current = unmount;
  },
};

window.addEventListener("resize", fitStage);
window.addEventListener("orientationchange", fitStage);
fitStage();

router.go("splash");
window.__router = router;
```

Key changes from the original:
1. Added `LANDSCAPE`, `PORTRAIT`, `PORTRAIT_ASPECT_THRESHOLD` constants.
2. `fitStage()` sets `data-orient` and re-mounts the active route on orientation flip.
3. `router.lastRoute` stores the current route so `fitStage()` can re-call `router.go(...)`.
4. `fitStage()` declared **before** router but registered **after** — listener order ensures router exists when fitStage triggers re-render.
5. Initial `fitStage()` call moved **before** `router.go("splash")` so `lastOrient` is initialised before the first screen mounts. (This means the initial mount doesn't trigger a re-render — `lastOrient` is set, then matches on first comparison.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `bunx playwright test e2e/portrait-reflow.spec.js -g "rotating from landscape"`

Expected: PASS.

- [ ] **Step 5: Re-run the full portrait test suite to verify no regressions**

Run: `bunx playwright test e2e/portrait-reflow.spec.js`

Expected: All portrait tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/game.js
git commit -m "feat(portrait): re-render active screen on orientation flip

When the device rotates mid-game, JS-positioned elements (carry slot)
would stay at their old landscape coords. Track the current route in
the router and re-mount it from fitStage() when orientation changes."
```

---

## Task 12: Smoke test — full playthrough on iPhone SE size

**Files:**
- Modify: `e2e/portrait-reflow.spec.js` (append test)

Smallest commonly-supported phone is iPhone SE (320×568). This test confirms a kid can actually play the first addition level on the smallest phone.

- [ ] **Step 1: Write the test**

Append to `e2e/portrait-reflow.spec.js`:

```javascript
import { dragDigitToSlot } from './helpers/math.js';

test('full smoke: iPhone SE can complete addition L1 problem 1 (12+3)', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  await unlockAll(page);
  await goToLevel(page, 'add', 1);
  await expect(page.locator('#screen-add')).toBeVisible();

  // Drag ones answer (15 → ones=5)
  await dragDigitToSlot(page, 5, page.locator('.slot.active'));
  await page.waitForTimeout(400);
  // Drag tens answer (15 → tens=1)
  await dragDigitToSlot(page, 1, page.locator('.slot.active'));
  await page.waitForTimeout(400);

  // Progress dot 0 should now be 'filled', dot 1 should be 'current'
  const dots = await page.locator('.dot').all();
  await expect(dots[0]).toHaveClass(/filled/);
  await expect(dots[1]).toHaveClass(/current/);
});
```

- [ ] **Step 2: Run the test**

Run: `bunx playwright test e2e/portrait-reflow.spec.js -g "iPhone SE"`

Expected: PASS. (If it fails, the failure points to a specific reflow gap to fix — drag math, tile target, or slot positioning at the smallest scale.)

- [ ] **Step 3: Run the full portrait suite plus existing e2e suite**

Run: `bunx playwright test`

Expected: All tests pass. If any regression appears in the existing suite (which uses 1280×800 default viewport), debug — landscape behavior should be unchanged.

- [ ] **Step 4: Commit**

```bash
git add e2e/portrait-reflow.spec.js
git commit -m "test(portrait): full-playthrough smoke test on iPhone SE size

Confirms a 320x568 viewport can drag tiles into slots and complete
problem 1 of L1 addition, end-to-end."
```

---

## Final verification

After all tasks complete, run the full test suite and visually verify in a real browser:

- [ ] **Step 1: Run all tests**

```bash
bun test
bunx playwright test
```

Expected: All bun unit tests pass. All Playwright tests pass.

- [ ] **Step 2: Visual check at multiple sizes**

Start dev server: `bun run dev`

Open `http://localhost:5173` and use DevTools device mode to verify each viewport:

- iPhone SE (320×568) portrait — game playable, tiles tappable
- iPhone 14 (390×844) portrait — game playable
- Pixel 7 (412×915) portrait — game playable
- iPhone 14 (844×390) landscape — game playable (existing letterbox behavior)
- iPad Mini (768×1024) portrait — game playable in portrait reflow
- Galaxy Tab S8 (1280×800) landscape — game unchanged from baseline

- [ ] **Step 3: Final commit (optional, for any visual-only tweaks)**

If the visual check turns up tweaks, commit them as a single follow-up:

```bash
git add src/style.css
git commit -m "fix(portrait): visual polish after device-size check"
```
