# Multiplication: Answer-in-Equation, Grouping Flip, Landing Sound — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Three tutor-requested changes to both multiplication screens — (1) drop the answer straight into the box right after the `=` and remove the "how many total?" panel; (2) play a rising counting sound when each counting unit lands in its box; (3) render `a × b` as **a items shown b times** (e.g. `4 × 2` = two groups of four).

**Architecture:** Both mult screens already build an `a × b = ?` equation row (`.mult-problem`) plus a separate answer panel (`.total-reveal` in tap, `.ans-host` in drag) and a `.digit-tray` of draggable tiles. We make the equation's `?` box (`.op-chip.q`) the actual drop slot by also giving it the `.slot.active` classes the drag manager already targets, then delete the separate panels and their layout/CSS. We flip the two render loops so the first operand is items-per-group and the second is number-of-groups, and add a 5-group size tier to the landscape tap area. We move the drag screen's existing pickup blip to the moment the flown unit lands.

**Tech Stack:** Vanilla ES modules, WAAPI animations, Web Audio (`src/audio.js`), Bun + Playwright e2e. Dev server: `PATH="/c/Users/JeganGN/.bun/bin:$PATH" bun ./dev.js` on :5173. Run e2e: `PATH="/c/Users/JeganGN/.bun/bin:$PATH" bun run e2e <spec> --reporter=line`. **Before trusting any e2e run, confirm the live server serves current code:** `curl -s http://localhost:5173/drag.js | grep 'const drags'` (see the verify-workflow memory — a stale :5173 process can serve old files).

**Operand convention (locked):** `a × b` → **`a` = items per group, `b` = number of groups.** So `4 × 2` = 2 groups of 4. Group count therefore = `b`, which ranges 1–5 across every level (the `×5` problems make 5 groups), so the layout must fit up to 5 groups.

---

## File Structure

- **Modify** `src/screens/mult-tap.js` — flip render loop (groups = `b`, items = `a`); set `firefly-area` `data-groups`; make the equation `?` box the active answer slot; delete the `.total-reveal` panel; build the digit tray without that panel.
- **Modify** `src/screens/mult-drag.js` — flip render loop (trays = `b`, ghosts = `a`); make the equation `?` box the active answer slot; delete the `.ans-host` panel; move the pickup blip to the unit's landing (`onfinish`), with a running rising pitch.
- **Modify** `src/layout.js` — `layoutMultTap` / `layoutMultDrag`: stop positioning the removed panels; centre the play band between the equation row and the digit tray.
- **Modify** `src/style.css` — add `.mult-problem .op-chip.q.slot` sizing (fits two digits, landscape + portrait); add `.firefly-area[data-groups="5"]` shrink tier (landscape); delete now-dead `.total-reveal`, `.ans-host`, `.ans-slot-host` rules (landscape + portrait).
- **Modify tests** `e2e/03-multiplication.spec.js`, `e2e/mult-tap-layout.spec.js`, `e2e/followup-fixes.spec.js`, `e2e/portrait-reflow.spec.js` — update to the flipped grouping and the new answer box. Opportunistically fix selectors in the already-broken `e2e/full-playthrough.spec.js` and `e2e/math-audit-multiplication.spec.js` (not oracles; see memory).

---

## Task 1: Flip the grouping (change #3)

`a × b` should render `b` groups of `a`. Today both screens loop `for g < p.a` (groups) then `for i < p.b` (items). Swap them.

**Files:**
- Modify: `src/screens/mult-tap.js:81-100` (group/block render loop) and `:87` (`dataset.count`)
- Modify: `src/screens/mult-drag.js:125-140` (tray/ghost render loop), `:136` (chip), `:139` (`groupContents`)
- Modify: `src/style.css` — landscape `.firefly-area` 5-group tier
- Test: `e2e/03-multiplication.spec.js`, `e2e/portrait-reflow.spec.js`

- [ ] **Step 1: Update tap-screen tests to the flipped mapping**

In `e2e/03-multiplication.spec.js`, the first problem is `2 × 1`. New mapping → `b = 1` group of `a = 2` fireflies.

Replace lines 16-18:
```js
  // 2 × 1 → b = 1 group of a = 2 fireflies (a items, b times)
  await expect(page.locator('.lily-group')).toHaveCount(1);
```
The `total === 2` fireflies assertion (line 44) stays correct (2×1 = 2 fireflies total).

In `e2e/portrait-reflow.spec.js` "lily-pads wrap into a 2-wide grid" (line 107), drive to a 3-group problem instead of relying on the first problem. Replace the body from the `goToLevel` line through the `pads.length` assertion:
```js
  await goToLevel(page, 'mult', 2); // L2 = 3×N
  await expect(page.locator('#screen-mult-tap')).toBeVisible();
  // First problems now make 1 then 2 groups; drive to 3×3 → 3 groups (b=3).
  await dragValueToSlot(page, 3); // 3×1
  await dragValueToSlot(page, 6); // 3×2
  await page.waitForTimeout(300);
  const pads = await page.locator('.lily-group').all();
  expect(pads.length).toBe(3);
```
(`dragValueToSlot` is already defined later in this file at line 262 — hoist it above this test, or duplicate the 6-line helper locally. Hoisting is cleaner: move the `async function dragValueToSlot` definition to just below the imports.)

In `e2e/portrait-reflow.spec.js` "3 group trays stacked" (line 126): L5 first problem is `3 × 4` → new mapping makes `b = 4` groups. Replace lines 130-139:
```js
  await goToLevel(page, 'mult', 5); // L5 first problem 3×4 → b = 4 group trays
  await expect(page.locator('#screen-mult-drag')).toBeVisible();
  const trays = await page.locator('.group-tray').all();
  expect(trays.length).toBe(4);
  const trayBoxes = await Promise.all(trays.map((t) => t.boundingBox()));
  // Stacked vertically, each below the last.
  expect(trayBoxes[1].y).toBeGreaterThan(trayBoxes[0].y + 30);
  expect(trayBoxes[2].y).toBeGreaterThan(trayBoxes[1].y + 30);
  expect(trayBoxes[3].y).toBeGreaterThan(trayBoxes[2].y + 30);
```
And the pile assertion (line 141-142) becomes `trayBoxes[3]`:
```js
  const pile = await page.locator('.block-pile').boundingBox();
  expect(pile.y).toBeGreaterThan(trayBoxes[3].y + trayBoxes[3].height - 10);
```

- [ ] **Step 2: Run the tests, verify they FAIL against current (un-flipped) code**

Run: `bun run e2e 03-multiplication portrait-reflow --reporter=line`
Expected: the lily/tray-count assertions FAIL (current code makes `a` groups, not `b`).

- [ ] **Step 3: Flip the tap-screen render loop**

In `src/screens/mult-tap.js`, replace the loop at lines 81-97 (`for (let g = 0; g < p.a; g++)` … through the inner `for (let i = 0; i < p.b; i++)` body) so groups = `p.b` and items = `p.a`:
```js
    for (let g = 0; g < p.b; g++) {            // b groups
      const pad = document.createElement("div");
      pad.className = "lily-group";
      pad.insertAdjacentHTML("beforeend", lilypad());
      const blocks = document.createElement("div");
      blocks.className = "block-grid";
      blocks.dataset.count = String(p.a);       // a items per group
      for (let i = 0; i < p.a; i++) {           // a items
        const wrap = document.createElement("div");
        wrap.className = "block-host untapped";
        wrap.dataset.groupIndex = String(g);
        wrap.dataset.blockIndex = String(i);
        wrap.insertAdjacentHTML("beforeend", firefly());
        wrap.addEventListener("pointerup", () => onBlockTap(wrap));
        blocks.appendChild(wrap);
        blockEls.push(wrap);
      }
      pad.appendChild(blocks);
      area.appendChild(pad);
    }
    area.dataset.groups = String(p.b);           // drives the 5-group CSS tier
```

- [ ] **Step 4: Flip the drag-screen render loop**

In `src/screens/mult-drag.js`, replace the loop at lines 125-140 so trays = `p.b` and ghosts = `p.a`:
```js
    for (let g = 0; g < p.b; g++) {              // b groups (trays)
      const tray = document.createElement("div");
      tray.className = "group-tray";
      tray.dataset.idx = String(g);
      for (let i = 0; i < p.a; i++) {            // a items per tray
        const ghost = document.createElement("div");
        ghost.className = "ghost";
        tray.appendChild(ghost);
      }
      const chip = document.createElement("div");
      chip.className = "count-chip";
      chip.textContent = `0 / ${p.a}`;
      tray.appendChild(chip);
      groupRow.appendChild(tray);
      groupContents.push({ filled: 0, needed: p.a });
    }
```
(The `★ ${gc.needed}` / `${gc.filled} / ${gc.needed}` chip logic at lines 213 already reads `gc.needed`, now `p.a` — no change there.)

- [ ] **Step 5: Add the landscape 5-group size tier**

In `src/style.css`, immediately after the `.block-grid[data-count="5"] > :nth-child(5)` rule (ends line 716), add:
```css
/* After the grouping flip, ×5 problems make 5 lily-pads. The landscape
   firefly-area is a fixed 1120px no-wrap row, so shrink pads + fireflies for
   5 groups to fit one row (5×196 + 4×24 = 1076 ≤ 1120). ≤4 groups unchanged. */
.firefly-area[data-groups="5"] { gap: 24px; }
.firefly-area[data-groups="5"] .lily-group { width: 196px; height: 196px; }
.firefly-area[data-groups="5"] .block-grid .block-host { width: 60px; height: 60px; }
.firefly-area[data-groups="5"] .block-grid[data-count="5"] .block-host { width: 48px; height: 48px; }
```
Portrait already wraps the firefly-area into a 432px 2-wide grid and the layout engine scales it, so 5 pads need no extra portrait rule.

- [ ] **Step 6: Run the tests, verify they PASS**

Run: `bun run e2e 03-multiplication portrait-reflow --reporter=line`
Expected: PASS (lily/tray counts now match the flipped mapping). If a portrait `dragValueToSlot` can't find `.slot.active`, that's Task 2's territory — note it and continue; re-run after Task 2.

- [ ] **Step 7: Commit**

```bash
git add src/screens/mult-tap.js src/screens/mult-drag.js src/style.css e2e/03-multiplication.spec.js e2e/portrait-reflow.spec.js
git commit -m "feat(mult): render a×b as a items shown b times (flip grouping)"
```

---

## Task 2: Answer drops into the box after the `=` (change #1)

Make the equation's `?` box (`.op-chip.q`) the live drop slot by adding the `.slot.active` classes the drag manager already targets (`getTargets()` queries `.slot`). Delete the separate `.total-reveal` / `.ans-host` panels and their layout + CSS. The `.digit-tray` (drag source) stays.

**Files:**
- Modify: `src/screens/mult-tap.js` (equation HTML, `showReveal` → tray-only, slot host removal)
- Modify: `src/screens/mult-drag.js` (equation build, `ansHost` removal, `setupAnswerArea` → tray-only)
- Modify: `src/layout.js` (`layoutMultTap`, `layoutMultDrag`)
- Modify: `src/style.css` (new answer-box sizing; delete dead panel rules)
- Test: `e2e/mult-tap-layout.spec.js`, `e2e/followup-fixes.spec.js`, `e2e/03-multiplication.spec.js`, `e2e/portrait-reflow.spec.js`

- [ ] **Step 1: Rewrite the tap-layout test for the in-equation answer box**

Replace the whole body of `e2e/mult-tap-layout.spec.js` (keep imports):
```js
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
```

- [ ] **Step 2: Retarget the two-digit-fit tests**

In `e2e/followup-fixes.spec.js`, the mult-drag test (line 18): delete the `.ans-host .display` label assertion (no label any more) and retarget the fit check. Replace lines 24-31 with:
```js
  // "20" must sit inside the answer box (the box after "="), not spill out.
  expect(await slotFits(page, '.mult-problem .op-chip.q.slot', '20')).toBe(true);
```
The mult-tap test (line 35-41): replace line 41 with:
```js
  expect(await slotFits(page, '.mult-problem .op-chip.q.slot', '20')).toBe(true);
```

- [ ] **Step 3: Update 03-multiplication answer-panel assertions**

In `e2e/03-multiplication.spec.js`:
- Line 31 (`.op-chip.q` text `'?'`): the box is now an empty active slot, not a `?`. Replace with:
```js
  await expect(page.locator('.mult-problem .op-chip.q.slot.active')).toBeVisible();
```
- Lines 50-54 (tap-all-blocks → total-reveal): replace the total-reveal assertion with the in-equation box + tray population:
```js
  // Answer box (after "=") is the active drop target; digit tray is populated.
  await expect(page.locator('.mult-problem .op-chip.q.slot.active')).toBeVisible();
  await expect(page.locator('.digit-tray .tile')).toHaveCount(10);
```

- [ ] **Step 4: Update the portrait answer-box reflow tests**

In `e2e/portrait-reflow.spec.js`:
- "mult tap-count ≥10: TOTAL box clears the tray" (line 274): the box is in the equation now. Replace lines 283-289 with:
```js
  // 4×3 = 12 → compound options. The answer box (after "=") clears the tray.
  const box = await page.locator('.mult-problem .op-chip.q.slot').boundingBox();
  const tray = await page.locator('.digit-tray').boundingBox();
  expect(box.y + box.height).toBeLessThanOrEqual(tray.y + 1);
```
- "mult drag-groups: answer box clears the 16-tile tray" (line 295): replace lines 300-302 with:
```js
  const box = await page.locator('.mult-problem .op-chip.q.slot').boundingBox();
  const tray = await page.locator('.digit-tray').boundingBox();
  expect(box.y + box.height).toBeLessThanOrEqual(tray.y + 1);
```
(`dragValueToSlot` in this file drags onto `.slot.active`, which now resolves to the equation box — no helper change needed.)

- [ ] **Step 5: Run the tests, verify they FAIL against current code**

Run: `bun run e2e mult-tap-layout followup-fixes 03-multiplication portrait-reflow --reporter=line`
Expected: FAIL — `.mult-problem .op-chip.q.slot` doesn't exist yet; `.total-reveal`/`.ans-host` still present.

- [ ] **Step 6: Make the tap-screen `?` box the answer slot; delete `.total-reveal`**

In `src/screens/mult-tap.js`:

(a) In the `sec.innerHTML` template (lines 33-43), remove the `.total-reveal` div entirely:
```js
  sec.innerHTML = `
    <div class="topbar">
      <button class="home-btn small"></button>
      <div class="progress-dots"></div>
    </div>
    <div class="mult-problem"></div>
    <div class="firefly-area"></div>
    <div class="digit-tray"></div>
    <div class="corner-mascot"></div>
  `;
```

(b) In `renderProblem`, make the equation's last chip the active slot. Replace the `probEl.innerHTML` (lines 70-76):
```js
    probEl.innerHTML = `
      <div class="op-chip display">${p.a}</div>
      <div class="op-sym display">×</div>
      <div class="op-chip display">${p.b}</div>
      <div class="op-sym display">=</div>
      <div class="op-chip q slot active display" data-index="0"></div>
    `;
```

(c) Replace `showReveal()` (lines 118-165) with a tray-only builder (no panel, no slot host — the slot lives in the equation):
```js
  function buildTray() {
    const p = problems[idx];
    const tray = sec.querySelector(".digit-tray");
    tray.innerHTML = "";
    tray.classList.remove("two-row");
    if (p.answer >= 10) {
      const values = compoundOptions(p.answer);
      const buildTile = (n) => {
        const t = document.createElement("div");
        t.className = "tile compound mult-option";
        t.dataset.value = String(n);
        t.textContent = String(n);
        return t;
      };
      if (values.length > 11) {
        tray.classList.add("two-row");
        const half = Math.ceil(values.length / 2);
        const row1 = document.createElement("div"); row1.className = "tile-row";
        const row2 = document.createElement("div"); row2.className = "tile-row";
        values.forEach((n, i) => (i < half ? row1 : row2).appendChild(buildTile(n)));
        tray.appendChild(row1); tray.appendChild(row2);
      } else {
        values.forEach((n) => tray.appendChild(buildTile(n)));
      }
    } else {
      for (let n = 0; n <= 9; n++) {
        const t = document.createElement("div");
        t.className = "tile";
        t.dataset.value = String(n);
        t.textContent = String(n);
        tray.appendChild(t);
      }
    }
    setupDrag();
  }
```
Update the call site in `renderProblem` (line 106) from `showReveal();` to `buildTray();`. `setupDrag()`/`getTargets()` already query `.slot` and find the equation box unchanged.

- [ ] **Step 7: Make the drag-screen `?` box the answer slot; delete `.ans-host`**

In `src/screens/mult-drag.js`:

(a) Delete the `ansHost`/`ansLabel`/`ansSlotHost` block (lines 50-58) and its `sec.appendChild(ansHost)` (line 78). Keep `ansSlotHost` references out entirely.

(b) In `renderProblem`, after building `chipQ`, give it the slot classes. Replace lines 114-116:
```js
    const chipQ = document.createElement("div");
    chipQ.className = "op-chip q slot active display";
    chipQ.dataset.index = "0";
```
(remove the old `chipQ.textContent = "?"`).

(c) Replace `setupAnswerArea()` (lines 257-298) with a tray-only builder (the slot is the equation box; no `ansHost`):
```js
  function buildTray() {
    const p = problems[idx];
    digitTray.classList.remove("hidden", "two-row");
    digitTray.textContent = "";
    if (p.answer >= 10) {
      const values = compoundOptions(p.answer);
      const buildTile = (n) => {
        const t = document.createElement("div");
        t.className = "tile compound mult-option";
        t.dataset.value = String(n);
        t.textContent = String(n);
        t.onpointerdown = (e) => dragMgr.start(e, t, { kind: "digit", value: n });
        return t;
      };
      if (values.length > 11) {
        digitTray.classList.add("two-row");
        const half = Math.ceil(values.length / 2);
        const row1 = document.createElement("div"); row1.className = "tile-row";
        const row2 = document.createElement("div"); row2.className = "tile-row";
        values.forEach((n, i) => (i < half ? row1 : row2).appendChild(buildTile(n)));
        digitTray.appendChild(row1); digitTray.appendChild(row2);
      } else {
        values.forEach((n) => digitTray.appendChild(buildTile(n)));
      }
    } else {
      for (let n = 0; n <= 9; n++) {
        const t = document.createElement("div");
        t.className = "tile";
        t.dataset.value = String(n);
        t.textContent = String(n);
        t.onpointerdown = (e) => dragMgr.start(e, t, { kind: "digit", value: n });
        digitTray.appendChild(t);
      }
    }
  }
```
Note `buildTray` references `dragMgr`, which is assigned just below in `renderProblem`. Move the `dragMgr = createDragManager({...})` assignment ABOVE the `buildTray()` call, then call `buildTray()`. Update the call site (line 161) `setupAnswerArea();` → `buildTray();` placed after `dragMgr` is created.

(d) `showAnswerPhase()` (lines 303-308) fades `groupRow` only — keep as is (still valid).

- [ ] **Step 8: Update `layout.js` to drop the removed panels**

In `src/layout.js` `layoutMultTap` (lines 149-173): the `.total-reveal` is gone. Replace the function body so the firefly band sits between the equation/mascot header and the digit tray:
```js
export function layoutMultTap(stage, sec) {
  if (!sec || !sec.isConnected) return;
  const tray = sec.querySelector(".digit-tray");
  const firefly = sec.querySelector(".firefly-area");
  if (!isPortrait(stage)) {
    if (tray) { clearTileSizes(tray.querySelectorAll(".tile")); tray.style.height = ""; }
    clearInline(firefly, ["position", "left", "top", "transform"]);
    return;
  }
  const H = stage.offsetHeight;
  if (H < 400 || !tray) return;
  const trayH = fitTray(stage, tray, maxTrayHeight(H));
  const bandTop = headerBottom(stage, sec) + BAND_PAD;
  const bandBottom = H - TRAY_BOTTOM - trayH - BAND_PAD;
  centerPlay(stage, firefly, bandTop, bandBottom, true);
}
```
In `layoutMultDrag` (lines 175-201): `.ans-host` is gone. Replace its body:
```js
export function layoutMultDrag(stage, sec) {
  if (!sec || !sec.isConnected) return;
  const tray = sec.querySelector(".digit-tray");
  const playCol = sec.querySelector(".play-col");
  if (!isPortrait(stage)) {
    if (tray) { clearTileSizes(tray.querySelectorAll(".tile")); tray.style.height = ""; }
    clearInline(playCol, ["position", "left", "top", "transform"]);
    return;
  }
  const H = stage.offsetHeight;
  if (H < 400 || !tray) return;
  const trayHidden = tray.classList.contains("hidden");
  const trayH = trayHidden ? 0 : fitTray(stage, tray, maxTrayHeight(H));
  const bandTop = headerBottom(stage, sec) + BAND_PAD;
  const bandBottom = H - TRAY_BOTTOM - trayH - BAND_PAD;
  centerPlay(stage, playCol, bandTop, bandBottom, true);
}
```

- [ ] **Step 9: Add answer-box CSS; delete dead panel CSS**

In `src/style.css`:

(a) After the `.op-chip.q` rule (line 663), add the answer-slot sizing (scoped to the equation so the global `.slot` used by add/sub is untouched):
```css
/* The "?" box after "=" is the answer drop slot. Keep op-chip dimensions but
   shrink the glyph so a two-digit answer (e.g. "20") fits. Dashed pulsing while
   active (from .op-chip.q + .slot.active); solid once filled. */
.mult-problem .op-chip.q.slot { width: 120px; height: 130px; font-size: 64px; }
.mult-problem .op-chip.q.slot.filled { border-style: solid; border-color: var(--ink); }
```

(b) Delete the now-dead landscape rules: `.total-reveal` (717-726), the shared `.total-reveal .slot, .ans-host .slot` (731-736), `.ans-host .display` (738), `.ans-slot-host` (739), `.ans-host` (797-803). Leave `.digit-tray.hidden` (804).

(c) In the portrait section, delete `.total-reveal` (1084-1091), `.total-reveal .slot, .ans-host .slot` (1092-1097), `.ans-host .display` (1098-1100), `.ans-host` (1150-1157). Add portrait sizing for the answer box (match the portrait op-chip 80×90, glyph fits two digits):
```css
#stage[data-orient="portrait"] .mult-problem .op-chip.q.slot { width: 80px; height: 90px; font-size: 44px; }
```

- [ ] **Step 10: Run all change-#1/#3 tests, verify PASS**

Run: `bun run e2e mult-tap-layout followup-fixes 03-multiplication portrait-reflow --reporter=line`
Expected: PASS. Also re-run Task 1 specs if any portrait `dragValueToSlot` was deferred — they should now pass (the equation box is `.slot.active`).

- [ ] **Step 11: Commit**

```bash
git add src/screens/mult-tap.js src/screens/mult-drag.js src/layout.js src/style.css e2e/mult-tap-layout.spec.js e2e/followup-fixes.spec.js e2e/03-multiplication.spec.js e2e/portrait-reflow.spec.js
git commit -m "feat(mult): drop the answer into the box after =, remove how-many-total panel"
```

---

## Task 3: Counting sound when a unit lands in its box (change #2)

On the drag screen, the unit currently blips at pickup (`sfx.tilePickup()` at the start of the flight). Move that to the moment it lands in the box, with a rising pitch as the count climbs. The tap screen already blips on each firefly tap (`sfx.blockTap` inside `tapBlock`) — no change there.

**Files:**
- Modify: `src/screens/mult-drag.js` (`onPileTap` sound timing; add a per-problem placed counter)
- Test: manual via dev server + console assertion (Web Audio has no DOM artifact to assert; verify the call site)

- [ ] **Step 1: Add a per-problem placed counter**

In `src/screens/mult-drag.js` `mount` scope (near line 23, by `groupContents`), add:
```js
  let placedCount = 0;
```
In `renderProblem` (near line 99, where `groupContents.length = 0`), reset it:
```js
    placedCount = 0;
```

- [ ] **Step 2: Move the blip to the landing, with rising pitch**

In `onPileTap` (lines 199-252): delete `sfx.tilePickup();` at line 233 (the pickup blip). In the clone's `.onfinish` (line 239-251), play the rising counting blip when the unit arrives, before planting:
```js
    ).onfinish = () => {
      clone.remove();
      placedCount++;
      sfx.blockTap(placedCount); // rising pitch each time a unit lands in its box
      const planted = document.createElement("div");
      planted.className = "block-host in-group";
      planted.insertAdjacentHTML("beforeend", mango());
      planted.style.position = "absolute";
      planted.style.left = `${slot.offsetLeft}px`;
      planted.style.top = `${slot.offsetTop}px`;
      tray.appendChild(planted);
      if (groupContents.every((g) => g.filled === g.needed)) {
        setTimeout(showAnswerPhase, 600);
      }
    };
```
(`sfx.blockTap` already exists in `src/audio.js:90` — `freq = min(2093, 523 + count*60)`.)

- [ ] **Step 3: Verify the call site and that nothing else references the removed pickup**

Run: `grep -n "tilePickup\|blockTap\|placedCount" src/screens/mult-drag.js`
Expected: `blockTap` appears once (in `onfinish`); no stray `tilePickup` left in `onPileTap`; `placedCount` declared, reset, and incremented.

- [ ] **Step 4: Manual check on the dev server**

Start `bun ./dev.js`, open `http://localhost:5173`, go to mult L4, tap pile mangoes. Confirm: each mango blips when it LANDS in a tray (not on tap), pitch rising 1→2→3…. Confirm tap screen (L1) still blips on each firefly tap.

- [ ] **Step 5: Commit**

```bash
git add src/screens/mult-drag.js
git commit -m "feat(mult): play rising counting blip when a unit lands in its box"
```

---

## Task 4: Full verification + screenshots + push

**Files:** none (verification only), plus opportunistic selector fixes in already-broken specs.

- [ ] **Step 1: Run the full drag/mult/layout e2e set**

Run: `bun run e2e drag-multitouch touch-drag drag-visibility 03-multiplication mult-tap-layout followup-fixes portrait-reflow compound-tile 04-persistence --reporter=line`
Expected: all PASS. Fix any real regressions before continuing (use systematic-debugging).

- [ ] **Step 2: Capture before/after screenshots**

Run: `SHOT_TAG=after bun run e2e zz-capture`
Inspect `test-results/shots/after-*-multdrag-*` and `*-multtap-*` (phone, se, tablet): answer box sits after `=`, no "how many total?" panel, groups show `a` items `b` times, up to 5 groups fit. Adjust CSS if anything overlaps or overflows; re-run.

- [ ] **Step 3: Opportunistically fix the already-broken specs' selectors**

`e2e/full-playthrough.spec.js` (lines 355, 414, 697) and `e2e/math-audit-multiplication.spec.js` (lines 90, 137-168, 206) reference `.total-reveal` / `.ans-host` / group-tray counts under the old mapping. These are pre-existing-broken (see memory) and not oracles, but update the selectors to `.mult-problem .op-chip.q.slot` and the flipped group counts so they don't rot further. If they remain red for unrelated reasons, leave a one-line note — do not chase pre-existing failures here.

- [ ] **Step 4: Run unit tests (sanity)**

Run: `bun test ./tests/`
Expected: same as baseline — `drag.test.js` green; the one pre-existing `loadProgress` failure is unrelated (already flagged separately).

- [ ] **Step 5: Final commit + push**

```bash
git add -A
git commit -m "test(mult): refresh playthrough/audit selectors for new answer box + grouping"
git push origin main
```
Auto-deploys to GitHub Pages (~15s).

---

## Self-Review

- **Spec coverage:** #1 (Task 2: equation box becomes the slot, panels deleted, layout/CSS updated). #2 (Task 3: blip moved to landing with rising pitch; tap screen already covered). #3 (Task 1: loops flipped, 5-group CSS tier). ✓
- **Type/selector consistency:** answer box is `.op-chip.q.slot` everywhere (renderProblem in both screens, all tests, both CSS sizing rules). `getTargets()` targets `.slot` — unchanged, matches. `readMultOperands` uses `.op-chip:not(.q)` = `[a,b]` — answer box keeps `.q`, so unaffected. ✓
- **Operand convention:** groups = `b`, items = `a`, applied identically in both render loops and in every updated test. ✓
- **Layout fit:** portrait wraps + scales (engine) for ≤5 groups; landscape tap gets an explicit 5-group shrink tier; landscape drag already handled 5 trays. ✓
- **No placeholders:** every code/CSS/test change shown inline. ✓
