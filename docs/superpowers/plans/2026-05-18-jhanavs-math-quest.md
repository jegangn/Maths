# Jhanav's Math Quest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-file HTML/CSS/JS math-practice game for a 5-year-old on a Samsung Galaxy Tab S8, covering column-method addition/subtraction (with auto-animated carry/borrow) and multiplication via block-counting, structured as a 3-world × 6-level world map with drag-and-drop digit tiles and animated feedback.

**Architecture:** ES module source in `src/` developed against a Bun dev server, with pure logic (problem generation, validation, scoring, persistence) TDD'd via `bun:test`. Visual UI built per `design.md` (the design spec) with manual browser verification per checkpoint. Optional final bundle step concatenates everything into a single `dist/index.html` for offline / file:// use.

**Tech Stack:** Vanilla HTML + CSS + ES Modules. No frameworks. Web Audio API for sounds. PointerEvents API for drag. localStorage for progress. Bun for dev server and test runner. Google Fonts: Lilita One + Nunito.

---

## Source of Truth

The design spec at `design.md` (in the project root) is authoritative for layout coordinates, color hex values, font sizes, animation timings, and component states. This plan provides the **build sequence** and **code structure**; it references `design.md §X.Y` for tuning details rather than restating every measurement. Read `design.md` once end-to-end before starting Task 1.

## Project Structure

```
Maths For Jhanav/
├── design.md                              (source of truth — pre-existing)
├── claude-design-prompt.md                (pre-existing reference)
├── package.json                           (Task 1)
├── .gitignore                             (Task 1)
├── dev.js                                 (Task 1 — Bun static server)
├── docs/superpowers/plans/
│   └── 2026-05-18-jhanavs-math-quest.md   (this plan)
├── src/
│   ├── index.html                         (Task 7)
│   ├── style.css                          (Task 7)
│   ├── game.js                            (Task 32 — entry + state + routing)
│   ├── logic.js                           (Tasks 2-6 — pure logic, TDD'd)
│   ├── drag.js                            (Task 15)
│   ├── audio.js                           (Task 11)
│   ├── svg.js                             (Tasks 8-10 — inline SVG strings)
│   ├── animate.js                         (Tasks 16-23)
│   └── screens/
│       ├── splash.js                      (Task 24)
│       ├── map.js                         (Task 25)
│       ├── add.js                         (Task 26)
│       ├── sub.js                         (Task 27)
│       ├── mult-tap.js                    (Task 28)
│       ├── mult-drag.js                   (Task 29)
│       └── complete.js                    (Task 30)
├── tests/
│   ├── logic.test.js                      (Tasks 2-6)
│   └── drag.test.js                       (Task 15)
└── dist/
    └── index.html                         (Task 35 — single-file bundle)
```

## Test Strategy

- **Pure logic** (problems, validation, scoring, storage): strict TDD with `bun:test`. Write failing test → run → implement → run → commit.
- **UI / animation / audio**: manual browser verification after each task. Open `http://localhost:5173`, exercise the feature, confirm visually and audibly. Spec compliance is the bar (compare with `design.md`).
- **End-to-end**: at Task 34, a full playthrough from splash to all 18 levels complete, on the actual tablet if available, in Chrome desktop otherwise.

## Phases

| Phase | Tasks | Focus |
|---|---|---|
| 0. Setup | 1 | Project scaffold |
| 1. Pure logic (TDD) | 2-6 | Problems, validation, scoring, storage |
| 2. Skeleton | 7 | HTML + design tokens + stage scaling |
| 3. SVG assets | 8-10 | Mascots, blocks, UI shapes |
| 4. Audio | 11 | Web Audio synth + sound palette |
| 5. Core components | 12-15 | Tile, slot, block, button, drag |
| 6. Animations | 16-23 | All motion routines |
| 7. Screens | 24-30 | All 7 screens |
| 8. Polish | 31 | Wrong-answer + hint + smart dim |
| 9. Wiring | 32-34 | Routing, persistence, parent gate, QA |
| 10. Deploy | 35 | Optional single-file bundle + deploy |

---

## Phase 0: Project Setup

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `dev.js`
- Create: `src/index.html` (stub)
- Create: `src/style.css` (empty)
- Create: `src/game.js` (stub)
- Create: `tests/.gitkeep`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "jhanavs-math-quest",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "bun dev.js",
    "test": "bun test"
  }
}
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
dist/
.DS_Store
*.log
.bun
```

- [ ] **Step 3: Create `dev.js` (Bun static server on port 5173)**

```js
import { file } from "bun";
import { join, normalize } from "node:path";

const ROOT = new URL("./src/", import.meta.url).pathname;
const PORT = 5173;

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let path = decodeURIComponent(url.pathname);
    if (path === "/") path = "/index.html";
    const safe = normalize(path).replace(/^(\.\.[\/\\])+/, "");
    const f = file(join(ROOT, safe));
    if (!(await f.exists())) return new Response("Not found", { status: 404 });
    return new Response(f);
  },
});

console.log(`Dev server: http://localhost:${PORT}`);
```

- [ ] **Step 4: Create `src/index.html` (minimal stub)**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <title>Jhanav's Math Adventure</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div id="stage"></div>
  <script type="module" src="game.js"></script>
</body>
</html>
```

- [ ] **Step 5: Create `src/game.js` (stub)**

```js
console.log("Jhanav's Math Quest — booting");
```

- [ ] **Step 6: Create `src/style.css` (empty for now)**

```css
/* design tokens added in Task 7 */
```

- [ ] **Step 7: Verify dev server starts**

Run: `bun run dev`
Expected: console prints `Dev server: http://localhost:5173`
Open http://localhost:5173 in a browser. Expect a blank page, no console errors. Open DevTools → Console: should see "Jhanav's Math Quest — booting".

- [ ] **Step 8: Initialize git (if not already) and commit**

```bash
git init
git add .
git commit -m "feat: project scaffold with Bun dev server"
```

---

## Phase 1: Pure Logic (TDD)

All logic in `src/logic.js` as named exports. Tests in `tests/logic.test.js`. Strict TDD: failing test first, then code.

### Task 2: Problem Generator + Level Seed Tables

**Files:**
- Create: `src/logic.js`
- Create: `tests/logic.test.js`

The data: 3 worlds (`add`, `sub`, `mult`), 6 levels each, 5 problems per level. Multiplication splits into tap-count (L1-3) and drag-groups (L4-6) — the `mode` field captures this.

- [ ] **Step 1: Write failing test for `getProblems(world, level)`**

Create `tests/logic.test.js`:

```js
import { test, expect } from "bun:test";
import { getProblems } from "../src/logic.js";

test("addition L1: no-carry 2-digit + 1-digit, 5 problems", () => {
  const probs = getProblems("add", 1);
  expect(probs).toHaveLength(5);
  expect(probs[0]).toEqual({ op: "+", a: 12, b: 3, answer: 15 });
  expect(probs[4]).toEqual({ op: "+", a: 41, b: 5, answer: 46 });
});

test("addition L3: introduces carry on ones", () => {
  const probs = getProblems("add", 3);
  expect(probs[0]).toEqual({ op: "+", a: 15, b: 6, answer: 21 });
  for (const p of probs) {
    expect(p.a % 10 + p.b % 10).toBeGreaterThanOrEqual(10);
  }
});

test("subtraction L4: borrow always required", () => {
  const probs = getProblems("sub", 4);
  expect(probs).toHaveLength(5);
  for (const p of probs) {
    expect(p.op).toBe("-");
    expect(p.a % 10).toBeLessThan(p.b % 10);
    expect(p.a).toBeGreaterThanOrEqual(p.b);
  }
});

test("multiplication L1: tap-count mode, 2 x N", () => {
  const probs = getProblems("mult", 1);
  expect(probs).toHaveLength(5);
  for (const p of probs) {
    expect(p.op).toBe("×");
    expect(p.a).toBe(2);
    expect(p.mode).toBe("tap");
  }
});

test("multiplication L4: drag-groups mode", () => {
  const probs = getProblems("mult", 4);
  for (const p of probs) {
    expect(p.mode).toBe("drag");
  }
});

test("all multiplication problems within 5x5 ceiling", () => {
  for (let l = 1; l <= 6; l++) {
    for (const p of getProblems("mult", l)) {
      expect(p.a).toBeLessThanOrEqual(5);
      expect(p.b).toBeLessThanOrEqual(5);
      expect(p.answer).toBe(p.a * p.b);
    }
  }
});

test("all addition answers stay <= 99 (2-digit slot ceiling)", () => {
  for (let l = 1; l <= 6; l++) {
    for (const p of getProblems("add", l)) {
      expect(p.answer).toBeLessThanOrEqual(99);
      expect(p.answer).toBe(p.a + p.b);
    }
  }
});

test("all subtraction problems have non-negative answer", () => {
  for (let l = 1; l <= 6; l++) {
    for (const p of getProblems("sub", l)) {
      expect(p.answer).toBe(p.a - p.b);
      expect(p.answer).toBeGreaterThanOrEqual(0);
    }
  }
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `bun test`
Expected: all tests fail with `getProblems is not a function` (module not found).

- [ ] **Step 3: Implement `getProblems` with seed tables in `src/logic.js`**

```js
const SEEDS = {
  add: {
    1: [[12,3],[21,4],[13,5],[32,6],[41,5]],
    2: [[12,13],[21,34],[25,22],[41,15],[33,24]],
    3: [[15,6],[18,4],[23,8],[27,5],[19,7]],
    4: [[16,25],[27,18],[35,27],[48,23],[56,27]],
    5: [[14,22],[17,8],[36,27],[25,13],[48,19]],
    6: [[47,38],[56,24],[39,27],[65,18],[49,36]],
  },
  sub: {
    1: [[15,3],[24,2],[19,4],[38,5],[47,3]],
    2: [[45,23],[38,17],[76,34],[59,26],[88,45]],
    3: [[22,7],[31,4],[24,9],[32,5],[43,8]],
    4: [[32,15],[41,23],[52,28],[65,37],[81,44]],
    5: [[45,23],[32,15],[56,28],[67,45],[82,47]],
    6: [[51,28],[73,46],[84,37],[92,58],[65,29]],
  },
  mult: {
    1: { mode: "tap", pairs: [[2,1],[2,2],[2,3],[2,4],[2,5]] },
    2: { mode: "tap", pairs: [[3,1],[3,2],[3,3],[3,4],[3,5]] },
    3: { mode: "tap", pairs: [[4,1],[4,2],[4,3],[4,4],[4,5]] },
    4: { mode: "drag", pairs: [[2,3],[3,2],[3,3],[4,2],[2,4]] },
    5: { mode: "drag", pairs: [[3,4],[4,3],[3,5],[5,3],[4,4]] },
    6: { mode: "drag", pairs: [[5,4],[4,5],[5,5],[3,5],[4,4]] },
  },
};

export function getProblems(world, level) {
  if (world === "mult") {
    const { mode, pairs } = SEEDS.mult[level];
    return pairs.map(([a, b]) => ({ op: "×", a, b, answer: a * b, mode }));
  }
  const op = world === "add" ? "+" : "-";
  return SEEDS[world][level].map(([a, b]) => ({
    op, a, b, answer: op === "+" ? a + b : a - b,
  }));
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `bun test tests/logic.test.js`
Expected: all 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/logic.js tests/logic.test.js
git commit -m "feat(logic): problem generator with hand-curated seed tables"
```

---

### Task 3: Carry / Borrow Analysis

For each addition or subtraction problem, the level UI needs to know whether the ones column triggers a carry (addition) or borrow (subtraction), and the regrouped digits for the borrow animation.

- [ ] **Step 1: Write failing tests for `analyze(problem)`**

Append to `tests/logic.test.js`:

```js
import { analyze } from "../src/logic.js";

test("analyze: addition with no carry", () => {
  const r = analyze({ op: "+", a: 12, b: 3, answer: 15 });
  expect(r).toEqual({
    aTens: 1, aOnes: 2, bTens: 0, bOnes: 3,
    answerTens: 1, answerOnes: 5,
    carry: false,
  });
});

test("analyze: addition with carry on ones", () => {
  const r = analyze({ op: "+", a: 15, b: 6, answer: 21 });
  expect(r).toEqual({
    aTens: 1, aOnes: 5, bTens: 0, bOnes: 6,
    answerTens: 2, answerOnes: 1,
    carry: true,
  });
});

test("analyze: subtraction without borrow", () => {
  const r = analyze({ op: "-", a: 45, b: 23, answer: 22 });
  expect(r).toEqual({
    aTens: 4, aOnes: 5, bTens: 2, bOnes: 3,
    answerTens: 2, answerOnes: 2,
    borrow: false,
  });
});

test("analyze: subtraction with borrow", () => {
  const r = analyze({ op: "-", a: 32, b: 15, answer: 17 });
  expect(r).toEqual({
    aTens: 3, aOnes: 2, bTens: 1, bOnes: 5,
    answerTens: 1, answerOnes: 7,
    borrow: true,
    borrowFromTens: 2,    // new tens digit shown above (was 3)
    borrowedOnes: 12,     // new ones value (was 2)
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `bun test`
Expected: 4 new tests fail with `analyze is not a function`.

- [ ] **Step 3: Implement `analyze` in `src/logic.js`**

```js
export function analyze(p) {
  const aTens = Math.floor(p.a / 10);
  const aOnes = p.a % 10;
  const bTens = Math.floor(p.b / 10);
  const bOnes = p.b % 10;
  const answerTens = Math.floor(p.answer / 10);
  const answerOnes = p.answer % 10;
  if (p.op === "+") {
    return { aTens, aOnes, bTens, bOnes, answerTens, answerOnes,
             carry: aOnes + bOnes >= 10 };
  }
  if (p.op === "-") {
    const needsBorrow = aOnes < bOnes;
    const out = { aTens, aOnes, bTens, bOnes, answerTens, answerOnes,
                  borrow: needsBorrow };
    if (needsBorrow) {
      out.borrowFromTens = aTens - 1;
      out.borrowedOnes = aOnes + 10;
    }
    return out;
  }
  return { aTens, aOnes, bTens, bOnes, answerTens, answerOnes };
}
```

- [ ] **Step 4: Run, verify pass; commit**

Run: `bun test`
Expected: all tests pass.

```bash
git add src/logic.js tests/logic.test.js
git commit -m "feat(logic): analyze() returns digit decomposition + carry/borrow flags"
```

---

### Task 4: Answer Validation + Right-to-Left State Machine

Manages active-slot tracking and validates drops. Two-digit answers fill ones first, then tens. One-digit answers fill the single slot.

- [ ] **Step 1: Write failing tests**

Append to `tests/logic.test.js`:

```js
import { createAnswerState, dropDigit, isComplete } from "../src/logic.js";

test("answer state for 2-digit answer: ones is active first", () => {
  const s = createAnswerState(15);
  expect(s.slots).toEqual([null, null]);
  expect(s.activeIndex).toBe(1);
});

test("answer state for 1-digit answer: single slot", () => {
  const s = createAnswerState(8);
  expect(s.slots).toEqual([null]);
  expect(s.activeIndex).toBe(0);
});

test("dropping correct ones digit advances to tens", () => {
  let s = createAnswerState(21);
  s = dropDigit(s, 1);
  expect(s.slots).toEqual([null, 1]);
  expect(s.activeIndex).toBe(0);
  expect(s.lastDropCorrect).toBe(true);
});

test("dropping wrong digit rejects and increments wrongCount", () => {
  let s = createAnswerState(21);
  s = dropDigit(s, 7);
  expect(s.slots).toEqual([null, null]);
  expect(s.activeIndex).toBe(1);
  expect(s.lastDropCorrect).toBe(false);
  expect(s.wrongCount).toBe(1);
});

test("dropping on inactive slot is rejected", () => {
  let s = createAnswerState(21);
  s = dropDigit(s, 2, 0);
  expect(s.slots).toEqual([null, null]);
  expect(s.lastDropCorrect).toBe(false);
  expect(s.wrongCount).toBe(1);
});

test("isComplete returns true only when all slots filled", () => {
  let s = createAnswerState(21);
  expect(isComplete(s)).toBe(false);
  s = dropDigit(s, 1);
  expect(isComplete(s)).toBe(false);
  s = dropDigit(s, 2);
  expect(isComplete(s)).toBe(true);
});
```

- [ ] **Step 2: Run, verify fail**

Run: `bun test`
Expected: 6 new tests fail.

- [ ] **Step 3: Implement in `src/logic.js`**

```js
export function createAnswerState(answer) {
  const digits = answer < 10 ? [answer] : [Math.floor(answer / 10), answer % 10];
  const slots = digits.map(() => null);
  return {
    expected: digits,
    slots,
    activeIndex: slots.length - 1,
    wrongCount: 0,
    lastDropCorrect: null,
  };
}

export function dropDigit(state, digit, targetIndex = state.activeIndex) {
  if (targetIndex !== state.activeIndex || state.slots[targetIndex] !== null) {
    return { ...state, lastDropCorrect: false, wrongCount: state.wrongCount + 1 };
  }
  if (digit !== state.expected[targetIndex]) {
    return { ...state, lastDropCorrect: false, wrongCount: state.wrongCount + 1 };
  }
  const slots = state.slots.slice();
  slots[targetIndex] = digit;
  const nextActive = targetIndex - 1;
  return {
    ...state,
    slots,
    activeIndex: nextActive >= 0 ? nextActive : -1,
    lastDropCorrect: true,
  };
}

export function isComplete(state) {
  return state.slots.every((s) => s !== null);
}
```

- [ ] **Step 4: Run, verify pass; commit**

```bash
bun test
git add src/logic.js tests/logic.test.js
git commit -m "feat(logic): answer state machine with right-to-left enforcement"
```

---

### Task 5: Star Scoring

3 stars for 0-1 wrong drops, 2 stars for 2-4, 1 star for 5+. Per design.md section 3.3.

- [ ] **Step 1: Failing tests**

```js
import { starsFor } from "../src/logic.js";

test("starsFor returns 3 stars for 0 or 1 wrongs", () => {
  expect(starsFor(0)).toBe(3);
  expect(starsFor(1)).toBe(3);
});

test("starsFor returns 2 stars for 2-4 wrongs", () => {
  expect(starsFor(2)).toBe(2);
  expect(starsFor(3)).toBe(2);
  expect(starsFor(4)).toBe(2);
});

test("starsFor returns 1 star for 5+ wrongs", () => {
  expect(starsFor(5)).toBe(1);
  expect(starsFor(20)).toBe(1);
});
```

- [ ] **Step 2: Implement, run, commit**

```js
export function starsFor(wrongCount) {
  if (wrongCount <= 1) return 3;
  if (wrongCount <= 4) return 2;
  return 1;
}
```

```bash
bun test
git add src/logic.js tests/logic.test.js
git commit -m "feat(logic): star scoring rules"
```

---

### Task 6: localStorage Persistence

- [ ] **Step 1: Failing tests with fake storage**

```js
import { loadProgress, recordStars, isLevelUnlocked, totalStars } from "../src/logic.js";

const fakeStorage = () => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, v),
    removeItem: (k) => m.delete(k),
  };
};

test("loadProgress returns empty map on fresh storage", () => {
  expect(loadProgress(fakeStorage())).toEqual({ add: {}, sub: {}, mult: {} });
});

test("recordStars writes new high-water mark; loadProgress reads it", () => {
  const s = fakeStorage();
  recordStars(s, "add", 1, 2);
  expect(loadProgress(s).add[1]).toBe(2);
});

test("recordStars does not overwrite a higher prior score", () => {
  const s = fakeStorage();
  recordStars(s, "add", 1, 3);
  recordStars(s, "add", 1, 1);
  expect(loadProgress(s).add[1]).toBe(3);
});

test("L1 always unlocked; L2+ requires prior level cleared", () => {
  expect(isLevelUnlocked({ add: {}, sub: {}, mult: {} }, "add", 1)).toBe(true);
  expect(isLevelUnlocked({ add: {}, sub: {}, mult: {} }, "add", 2)).toBe(false);
  expect(isLevelUnlocked({ add: { 1: 2 }, sub: {}, mult: {} }, "add", 2)).toBe(true);
});

test("totalStars sums across worlds", () => {
  expect(totalStars({ add: { 1: 3, 2: 2 }, sub: { 1: 1 }, mult: {} })).toBe(6);
});
```

- [ ] **Step 2: Implement**

```js
export const KEY_PREFIX = "bm.stars";

export function loadProgress(storage = globalThis.localStorage) {
  const out = { add: {}, sub: {}, mult: {} };
  if (!storage) return out;
  for (const w of ["add", "sub", "mult"]) {
    for (let l = 1; l <= 6; l++) {
      const v = storage.getItem(`${KEY_PREFIX}.${w}.${l}`);
      if (v) out[w][l] = parseInt(v, 10);
    }
  }
  return out;
}

export function recordStars(storage, world, level, stars) {
  if (!storage) return;
  const key = `${KEY_PREFIX}.${world}.${level}`;
  const prior = parseInt(storage.getItem(key) || "0", 10);
  if (stars > prior) storage.setItem(key, String(stars));
}

export function isLevelUnlocked(progress, world, level) {
  if (level === 1) return true;
  return (progress[world][level - 1] || 0) > 0;
}

export function totalStars(progress) {
  let n = 0;
  for (const w of ["add", "sub", "mult"]) {
    for (const k in progress[w]) n += progress[w][k];
  }
  return n;
}
```

- [ ] **Step 3: Run, commit**

```bash
bun test
git add src/logic.js tests/logic.test.js
git commit -m "feat(logic): localStorage persistence with high-water mark stars"
```

---

## Phase 2: Skeleton

### Task 7: HTML + CSS Design Tokens + Stage Scaling

Implements the 1280×800 logical viewport that scales to fill the device. All design tokens from design.md section 2.

**Files:** Modify `src/index.html`, `src/style.css`, `src/game.js`.

- [ ] **Step 1: Replace `src/index.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="theme-color" content="#FFF3DC" />
  <title>Jhanav's Math Adventure</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@700;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div id="viewport">
    <div id="stage" data-world="add"></div>
  </div>
  <script type="module" src="game.js"></script>
</body>
</html>
```

- [ ] **Step 2: Replace `src/style.css` with design tokens**

```css
:root {
  --bg-paper: #FFF3DC;
  --bg-card: #FFFAF0;
  --ink: #2A1B0A;
  --ink-soft: #6A4B28;
  --success: #4AD66D;
  --success-deep: #1F8A3E;
  --gentle-no: #FF7A40;
  --star: #FFC83A;
  --star-glow: #FFF1A8;
  --lock: #A89878;

  --world-primary: #FFB933;
  --world-accent: #FF7A40;
  --world-sky: #7DD2F0;
  --world-ground: #4AAE3F;

  --s-1: 4px; --s-2: 8px; --s-3: 12px; --s-4: 16px;
  --s-5: 24px; --s-6: 32px; --s-7: 48px; --s-8: 64px;
  --s-9: 96px; --s-10: 128px; --s-11: 160px;

  --r-sm: 12px; --r-md: 20px; --r-lg: 32px; --r-xl: 48px; --r-pill: 9999px;

  --sh-1: 0 3px 0 #C8985A, 0 4px 10px rgba(120,70,20,.18);
  --sh-2: 0 6px 0 #B07A40, 0 8px 18px rgba(120,70,20,.24);
  --sh-3: 0 8px 0 #B07A40, 0 14px 26px rgba(120,70,20,.28);
  --sh-pressed: 0 2px 0 #B07A40, 0 3px 6px rgba(120,70,20,.2);

  --ease-pop: cubic-bezier(0.34, 1.6, 0.5, 1);
  --ease-soft: cubic-bezier(0.45, 0.05, 0.25, 1);
  --ease-snap: cubic-bezier(0.25, 0.9, 0.3, 1.4);
  --ease-elastic: cubic-bezier(0.7, -0.5, 0.3, 1.5);
  --ease-arc: cubic-bezier(0.4, 0, 0.6, 1);
}

#stage[data-world="add"]  { --world-primary:#FFB933; --world-accent:#FF7A40; --world-sky:#7DD2F0; --world-ground:#4AAE3F; }
#stage[data-world="sub"]  { --world-primary:#3DC5C5; --world-accent:#4A9EFF; --world-sky:#A8E5E5; --world-ground:#5FAF9A; }
#stage[data-world="mult"] { --world-primary:#E89A2A; --world-accent:#7AB344; --world-sky:#F8D27A; --world-ground:#8A6A2E; }

* { box-sizing: border-box; }
html, body {
  margin: 0; padding: 0; height: 100%; overflow: hidden;
  background: var(--bg-paper); color: var(--ink);
  font-family: 'Nunito', 'Avenir Next', system-ui, sans-serif;
  font-feature-settings: "tnum" 1, "lnum" 1;
  user-select: none; -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

#viewport {
  position: fixed; inset: 0;
  display: flex; align-items: center; justify-content: center;
}

#stage {
  position: relative;
  width: 1280px; height: 800px;
  transform-origin: center center;
  background: var(--world-sky);
  overflow: hidden;
}

.screen { position: absolute; inset: 0; display: none; }
.screen.active { display: block; }
.display { font-family: 'Lilita One', 'Bungee', system-ui; font-weight: 400; }
```

- [ ] **Step 3: Update `src/game.js`**

```js
const stage = document.getElementById("stage");
const viewport = document.getElementById("viewport");

function fitStage() {
  const scale = Math.min(viewport.clientWidth / 1280, viewport.clientHeight / 800);
  stage.style.transform = `scale(${scale})`;
}

window.addEventListener("resize", fitStage);
window.addEventListener("orientationchange", fitStage);
fitStage();
```

- [ ] **Step 4: Manual verify**

`bun run dev`. Open `http://localhost:5173`. Resize the browser window in both directions. The cream stage should remain centered with proper 1280:800 aspect ratio. No scrollbars. DevTools → inspect `#stage` → confirm `transform: scale(X)` updates on resize.

- [ ] **Step 5: Commit**

```bash
git add src/index.html src/style.css src/game.js
git commit -m "feat(skeleton): design tokens, fonts, and 1280x800 stage scaling"
```

---

## Phase 3: SVG Assets

All inline SVG strings exported from `src/svg.js`. Each function returns the SVG markup string.

### Task 8: Mascot SVGs (Banji, Mo, Pip)

**Files:** Create `src/svg.js`.

Mascots have grouped sub-parts (wing, head, body) so animations in Task 21 can target each `<g>`.

- [ ] **Step 1: Create `src/svg.js` with Banji**

```js
export const banji = (state = "idle") => `
<svg viewBox="0 0 540 540" xmlns="http://www.w3.org/2000/svg" class="mascot banji ${state}">
  <defs>
    <linearGradient id="beak-g" x1="0" x2="1">
      <stop offset="0" stop-color="#FFC83A"/>
      <stop offset=".5" stop-color="#FF7A40"/>
      <stop offset="1" stop-color="#FF3E6B"/>
    </linearGradient>
  </defs>
  <g class="tail">
    <path d="M380,320 q60,40 30,100 q-40,10 -70,-20 z" fill="#1F1A12" stroke="#000" stroke-width="3"/>
  </g>
  <g class="body">
    <ellipse cx="270" cy="320" rx="150" ry="160" fill="#2A1B0A" stroke="#000" stroke-width="4"/>
    <ellipse cx="240" cy="370" rx="90" ry="80" fill="#FFFAF0"/>
  </g>
  <g class="wing-l">
    <path d="M170,300 q-50,30 -30,90 q60,10 90,-40 z" fill="#1F1A12" stroke="#000" stroke-width="3"/>
  </g>
  <g class="wing-r">
    <path d="M370,300 q50,30 30,90 q-60,10 -90,-40 z" fill="#1F1A12" stroke="#000" stroke-width="3"/>
  </g>
  <g class="bandana">
    <path d="M180,200 q90,-30 180,0 l-10,30 q-80,-25 -160,0 z" fill="#E03E3E"/>
    <circle cx="200" cy="215" r="6" fill="#FFFAF0"/>
    <circle cx="270" cy="205" r="6" fill="#FFFAF0"/>
    <circle cx="340" cy="215" r="6" fill="#FFFAF0"/>
  </g>
  <g class="head">
    <circle cx="270" cy="180" r="105" fill="#2A1B0A" stroke="#000" stroke-width="4"/>
    <g class="eye-l">
      <circle cx="235" cy="160" r="20" fill="#FFFAF0"/>
      <circle cx="240" cy="162" r="10" fill="#2A1B0A"/>
      <circle cx="243" cy="158" r="4" fill="#FFFAF0"/>
    </g>
    <g class="eye-r">
      <circle cx="310" cy="160" r="20" fill="#FFFAF0"/>
      <circle cx="315" cy="162" r="10" fill="#2A1B0A"/>
      <circle cx="318" cy="158" r="4" fill="#FFFAF0"/>
    </g>
  </g>
  <g class="beak">
    <path d="M255,195 q60,5 110,40 q-30,30 -90,30 q-30,0 -30,-30 z" fill="url(#beak-g)" stroke="#7A2A04" stroke-width="3"/>
    <path d="M260,225 q40,5 90,15" stroke="#7A2A04" stroke-width="2" fill="none"/>
  </g>
</svg>`;
```

- [ ] **Step 2: Append Mo (sloth) and Pip (mouse)**

```js
export const mo = (state = "idle") => `
<svg viewBox="0 0 360 480" xmlns="http://www.w3.org/2000/svg" class="mascot mo ${state}">
  <g class="branch"><rect x="40" y="40" width="280" height="22" rx="11" fill="#5C3A1A"/></g>
  <g class="arm-l"><path d="M120,60 q-25,80 0,150" stroke="#8A6A4A" stroke-width="22" stroke-linecap="round" fill="none"/></g>
  <g class="arm-r"><path d="M240,60 q25,80 0,150" stroke="#8A6A4A" stroke-width="22" stroke-linecap="round" fill="none"/></g>
  <g class="body">
    <ellipse cx="180" cy="280" rx="100" ry="120" fill="#A38762"/>
    <ellipse cx="180" cy="290" rx="70" ry="90" fill="#D3B98C"/>
  </g>
  <g class="head">
    <circle cx="180" cy="200" r="78" fill="#A38762"/>
    <ellipse cx="180" cy="210" rx="62" ry="48" fill="#E6D4AC"/>
    <ellipse cx="155" cy="195" rx="22" ry="14" fill="#5C3A1A"/>
    <ellipse cx="205" cy="195" rx="22" ry="14" fill="#5C3A1A"/>
    <circle cx="155" cy="195" r="6" fill="#2A1B0A"/>
    <circle cx="205" cy="195" r="6" fill="#2A1B0A"/>
    <ellipse cx="180" cy="225" rx="10" ry="6" fill="#2A1B0A"/>
    <path d="M165,240 q15,12 30,0" stroke="#2A1B0A" stroke-width="3" fill="none"/>
  </g>
</svg>`;

export const pip = (state = "idle") => `
<svg viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg" class="mascot pip ${state}">
  <g class="tail"><path d="M260,250 q60,30 80,-20" stroke="#C97070" stroke-width="6" fill="none"/></g>
  <g class="body">
    <ellipse cx="180" cy="230" rx="110" ry="85" fill="#D9A5A5"/>
    <ellipse cx="180" cy="245" rx="80" ry="55" fill="#FFE8E8"/>
    <circle cx="140" cy="200" r="14" fill="#C97070"/>
    <circle cx="220" cy="240" r="10" fill="#C97070"/>
    <circle cx="170" cy="280" r="8" fill="#C97070"/>
  </g>
  <g class="ear-l"><circle cx="130" cy="120" r="40" fill="#D9A5A5"/><circle cx="130" cy="125" r="22" fill="#FFCCCC"/></g>
  <g class="ear-r"><circle cx="230" cy="120" r="40" fill="#D9A5A5"/><circle cx="230" cy="125" r="22" fill="#FFCCCC"/></g>
  <g class="head">
    <circle cx="180" cy="165" r="80" fill="#D9A5A5"/>
    <circle cx="155" cy="160" r="9" fill="#2A1B0A"/>
    <circle cx="205" cy="160" r="9" fill="#2A1B0A"/>
    <ellipse cx="180" cy="195" rx="14" ry="9" fill="#C97070"/>
    <path d="M170,205 q10,8 20,0" stroke="#2A1B0A" stroke-width="3" fill="none"/>
  </g>
</svg>`;
```

- [ ] **Step 3: Manual preview (optional)**

To preview, temporarily edit `src/index.html` adding `<div id="preview"></div>` inside `#stage`, and in `src/game.js` use `document.getElementById("preview").insertAdjacentHTML("beforeend", banji() + mo() + pip())` with `import { banji, mo, pip } from "./svg.js"`. Open `http://localhost:5173`, confirm all three render distinctly. Revert these preview lines before committing.

- [ ] **Step 4: Commit**

```bash
git add src/svg.js
git commit -m "feat(svg): mascot illustrations (Banji, Mo, Pip)"
```

---

### Task 9: Block SVGs (Banana, Coconut, Mango, Firefly)

96×96 countable objects for multiplication.

- [ ] **Step 1: Append to `src/svg.js`**

```js
export const banana = (state = "default") => `
<svg viewBox="0 0 96 96" class="block banana ${state}">
  <path d="M20,75 q-10,-50 35,-65 q15,5 5,15 q-30,15 -25,55 z" fill="#FFD13A" stroke="#7A4A08" stroke-width="3"/>
  <path d="M55,12 q3,-5 8,-2 q3,3 -2,7 z" fill="#4AAE3F" stroke="#2A1B0A" stroke-width="2"/>
</svg>`;

export const coconut = (state = "default") => `
<svg viewBox="0 0 96 96" class="block coconut ${state}">
  <circle cx="48" cy="50" r="36" fill="#6A3A1A" stroke="#2A1B0A" stroke-width="3"/>
  <g stroke="#3A1F08" stroke-width="2" fill="none">
    <path d="M20,40 q10,8 20,2"/><path d="M55,38 q10,6 22,4"/>
    <path d="M25,55 q12,8 24,2"/><path d="M55,60 q12,6 22,2"/>
  </g>
  <circle cx="40" cy="35" r="3" fill="#FFFAF0"/>
  <circle cx="56" cy="36" r="3" fill="#FFFAF0"/>
</svg>`;

export const mango = (state = "default") => `
<svg viewBox="0 0 96 96" class="block mango ${state}">
  <path d="M48,12 q35,8 32,45 q-3,28 -32,30 q-29,-2 -32,-30 q-3,-37 32,-45 z" fill="#FF7A1A" stroke="#7A2A04" stroke-width="3"/>
  <path d="M30,30 q15,-6 30,2" stroke="#FF3E6B" stroke-width="6" fill="none" stroke-linecap="round"/>
  <ellipse cx="48" cy="13" rx="3" ry="6" fill="#4AAE3F" stroke="#2A1B0A" stroke-width="2"/>
</svg>`;

export const firefly = (state = "default") => `
<svg viewBox="0 0 96 96" class="block firefly ${state}">
  <g class="glow"><circle cx="48" cy="50" r="42" fill="#FFF8C8" opacity="0"/></g>
  <g class="wing-l"><ellipse cx="32" cy="40" rx="22" ry="14" fill="#FFFAF0" opacity=".75"/></g>
  <g class="wing-r"><ellipse cx="64" cy="40" rx="22" ry="14" fill="#FFFAF0" opacity=".75"/></g>
  <g class="body">
    <ellipse cx="48" cy="55" rx="18" ry="22" fill="#FFE680" stroke="#6A4A08" stroke-width="3"/>
    <ellipse cx="48" cy="68" rx="14" ry="10" fill="#FFD13A"/>
    <circle cx="44" cy="48" r="3" fill="#2A1B0A"/>
    <circle cx="52" cy="48" r="3" fill="#2A1B0A"/>
  </g>
</svg>`;
```

- [ ] **Step 2: Commit**

```bash
git add src/svg.js
git commit -m "feat(svg): countable block illustrations"
```

---

### Task 10: UI SVGs (Star, Padlock, Lily-pad, Leaf, Confetti, Home, Cog)

- [ ] **Step 1: Append to `src/svg.js`**

```js
export const star = (filled = true) => `
<svg viewBox="0 0 80 80" class="star ${filled ? 'filled' : 'empty'}">
  <path d="M40,6 L49,29 L73,32 L55,49 L60,73 L40,61 L20,73 L25,49 L7,32 L31,29 Z"
        fill="${filled ? '#FFC83A' : 'transparent'}"
        stroke="#2A1B0A" stroke-width="3" stroke-linejoin="round"
        opacity="${filled ? 1 : 0.35}"/>
</svg>`;

export const padlock = () => `
<svg viewBox="0 0 48 48" class="padlock">
  <g class="shackle"><path d="M14,22 v-6 a10,10 0 0 1 20,0 v6" stroke="#5C4A2A" stroke-width="5" fill="none" stroke-linecap="round"/></g>
  <g class="body">
    <rect x="9" y="20" width="30" height="22" rx="4" fill="#8A6A4A" stroke="#2A1B0A" stroke-width="2"/>
    <circle cx="24" cy="30" r="3" fill="#2A1B0A"/>
    <rect x="22" y="30" width="4" height="8" fill="#2A1B0A"/>
  </g>
</svg>`;

export const lilypad = (tint = "var(--world-sky)") => `
<svg viewBox="0 0 320 280" class="lilypad" preserveAspectRatio="none">
  <ellipse cx="160" cy="140" rx="150" ry="120" fill="${tint}" stroke="#6A4A28" stroke-width="3" opacity=".95"/>
</svg>`;

export const leaf = (rot = 0) => `
<svg viewBox="0 0 60 100" class="leaf" style="transform:rotate(${rot}deg)">
  <path d="M30,5 q25,40 0,90 q-25,-50 0,-90 z" fill="#4AAE3F" stroke="#2A1B0A" stroke-width="2"/>
  <path d="M30,15 v75" stroke="#2A1B0A" stroke-width="1.5" fill="none"/>
</svg>`;

export const confettiShape = (kind = "rect", color = "#FFC83A") => {
  const shapes = {
    rect:   `<rect x="-6" y="-3" width="12" height="6" fill="${color}"/>`,
    tear:   `<path d="M0,-8 q6,5 0,16 q-6,-11 0,-16 z" fill="${color}"/>`,
    circle: `<circle cx="0" cy="0" r="5" fill="${color}"/>`,
    zig:    `<polyline points="-6,-3 -2,3 2,-3 6,3" stroke="${color}" stroke-width="3" fill="none"/>`,
  };
  return `<svg viewBox="-10 -10 20 20" class="confetti">${shapes[kind] || shapes.rect}</svg>`;
};

export const home = () => `
<svg viewBox="0 0 48 48" class="icon home"><path d="M24,6 L42,22 V42 H30 V28 H18 V42 H6 V22 Z" fill="none" stroke="#2A1B0A" stroke-width="4" stroke-linejoin="round"/></svg>`;

export const cog = () => `
<svg viewBox="0 0 48 48" class="icon cog"><g fill="none" stroke="#6A4B28" stroke-width="3"><circle cx="24" cy="24" r="6"/><path d="M24,4 v6 M24,38 v6 M4,24 h6 M38,24 h6 M10,10 l4,4 M34,34 l4,4 M10,38 l4,-4 M34,14 l4,-4"/></g></svg>`;
```

- [ ] **Step 2: Commit**

```bash
git add src/svg.js
git commit -m "feat(svg): UI elements (star, padlock, lily-pad, leaf, confetti, icons)"
```

---

## Phase 4: Audio

### Task 11: Web Audio Synth + Sound Palette

Per design.md section 6. All synthesized, single AudioContext, lazily created on first user interaction.

**Files:** Create `src/audio.js`.

- [ ] **Step 1: Create `src/audio.js` core**

```js
let ctx = null, masterGain = null, enabled = true;

function init() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = ctx.createGain();
  masterGain.gain.value = 0.7;
  masterGain.connect(ctx.destination);
}

export function unlockAudio() {
  init();
  if (ctx.state === "suspended") ctx.resume();
}
export function setEnabled(on) { enabled = !!on; }
export function isEnabled() { return enabled; }

function tone({ freq = 440, type = "sine", dur = 0.2, attack = 0.005, decay, gain = 0.3, freqEnd, lp }) {
  if (!enabled || !ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd != null) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  const decayTime = decay ?? dur - attack;
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decayTime);
  let node = osc;
  if (lp) {
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = lp;
    osc.connect(f); node = f;
  }
  node.connect(g).connect(masterGain);
  osc.start(t); osc.stop(t + dur + 0.05);
}

function noise({ dur = 0.2, gain = 0.2, lp, bpFreq, bpEnd }) {
  if (!enabled || !ctx) return;
  const t = ctx.currentTime;
  const samples = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, samples, ctx.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < samples; i++) ch[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = buf;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node = src;
  if (lp != null) { const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = lp; src.connect(f); node = f; }
  if (bpFreq != null) {
    const f = ctx.createBiquadFilter(); f.type = "bandpass";
    f.frequency.setValueAtTime(bpFreq, t);
    if (bpEnd != null) f.frequency.linearRampToValueAtTime(bpEnd, t + dur);
    node.connect(f); node = f;
  }
  node.connect(g).connect(masterGain);
  src.start(t); src.stop(t + dur);
}
```

- [ ] **Step 2: Append the sound palette**

```js
export const sfx = {
  tilePickup:       () => tone({ freq: 200, type: "triangle", dur: 0.06, gain: 0.18 }),
  tileDropCorrect: () => { tone({ freq: 520, type: "triangle", dur: 0.08, gain: 0.22 });
                            setTimeout(() => tone({ freq: 1318, type: "sine", dur: 0.2, gain: 0.18 }), 50); },
  tileDropWrong:    () => tone({ freq: 180, freqEnd: 90, type: "triangle", dur: 0.25, gain: 0.22, lp: 800 }),
  slotFill:         () => tone({ freq: 1568, type: "sine", dur: 0.12, gain: 0.2 }),
  carryWhoosh:     () => { noise({ dur: 0.5, gain: 0.15, bpFreq: 300, bpEnd: 800 });
                            setTimeout(() => tone({ freq: 1760, type: "sine", dur: 0.08, gain: 0.15 }), 450); },
  borrowWhoosh:    () => { noise({ dur: 0.6, gain: 0.18, lp: 1000, bpFreq: 600, bpEnd: 200 });
                            tone({ freq: 440, freqEnd: 220, type: "triangle", dur: 0.6, gain: 0.15 }); },
  blockTap: (count = 1) => {
    const freq = Math.min(2093, 523 + count * 60);
    tone({ freq, type: "sine", dur: 0.18, gain: 0.2 });
  },
  trayFull: () => { tone({ freq: 523, type: "sine", dur: 0.1, gain: 0.2 });
                    setTimeout(() => tone({ freq: 659, type: "sine", dur: 0.12, gain: 0.2 }), 100); },
  starDing: (n = 1) => {
    const notes = n === 1 ? [659] : n === 2 ? [659, 784] : [659, 784, 1047];
    notes.forEach((f, i) => setTimeout(() => tone({ freq: f, type: "sine", dur: 0.25, gain: 0.25 }), i * 150));
  },
  levelComplete:    () => { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) =>
                              setTimeout(() => tone({ freq: f, type: "triangle", dur: 0.18, gain: 0.18 }), i * 90)); },
  nodeUnlockPop:    () => tone({ freq: 220, type: "square", dur: 0.08, gain: 0.2 }),
  lockedTap:        () => tone({ freq: 110, freqEnd: 70, type: "triangle", dur: 0.2, gain: 0.15, lp: 600 }),
  mascotChirp:     () => { tone({ freq: 1568, type: "triangle", dur: 0.06, gain: 0.15 });
                            setTimeout(() => tone({ freq: 1976, type: "triangle", dur: 0.06, gain: 0.15 }), 70); },
  hintHmm:          () => tone({ freq: 659, type: "sine", dur: 0.6, gain: 0.1, attack: 0.15 }),
  transition:       () => noise({ dur: 0.28, gain: 0.15, lp: 1500 }),
};
```

- [ ] **Step 3: Manual ear-check**

To audition, temporarily wire a test panel into `src/index.html` using buttons that call `sfx[key]()` on click (and `unlockAudio()` first). Confirm each sound matches design.md section 6 — warm, soft, no clipping. Adjust `gain` values if any feel too loud. Revert the test panel before commit.

- [ ] **Step 4: Commit**

```bash
git add src/audio.js
git commit -m "feat(audio): Web Audio synth and complete sound palette"
```

---

## Phase 5: Core Components

### Task 12: DigitTile + AnswerSlot Components (HTML + CSS)

Per design.md sections 4.1 and 4.2.

**Files:** Modify `src/style.css` (append).

- [ ] **Step 1: Append component styles to `src/style.css`**

```css
.tile {
  width: 96px; height: 96px;
  border-radius: var(--r-md);
  background: var(--bg-card);
  border: 4px solid var(--ink);
  box-shadow: var(--sh-2);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Lilita One', system-ui;
  font-size: 64px; color: var(--ink);
  cursor: grab; user-select: none;
  transition: transform .12s var(--ease-pop), box-shadow .12s var(--ease-pop);
  position: relative;
}
.tile.dragging {
  transform: scale(1.15) translateY(-8px);
  box-shadow: var(--sh-3);
  z-index: 200; cursor: grabbing;
  transition: none;
}
.tile.dim     { opacity: .3; transform: scale(.94); pointer-events: auto; }
.tile.hint-dim{ opacity: .18; transform: scale(.92); }
.tile.hint-target { animation: hintPulse 2s var(--ease-soft) infinite; }
@keyframes hintPulse {
  0%,100% { transform: scale(1); box-shadow: 0 0 0 0 var(--star-glow); }
  50%     { transform: scale(1.05); box-shadow: 0 0 24px 8px var(--star-glow); }
}

.slot {
  width: 100px; height: 120px;
  border-radius: var(--r-md);
  border: 4px dashed var(--ink-soft);
  background: transparent;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Lilita One', system-ui;
  font-size: 96px; color: var(--ink);
  position: relative;
}
.slot.inactive  { opacity: .5; }
.slot.active    { border-style: solid; border-color: var(--world-primary); animation: slotPulse 1.8s var(--ease-soft) infinite; }
.slot.filled    { border-style: solid; border-color: var(--ink); animation: none; }
.slot.flash-no  { border-color: var(--gentle-no); animation: slotShake .3s var(--ease-elastic); }
@keyframes slotPulse {
  0%   { box-shadow: 0 0 0 0 var(--world-primary); }
  60%  { box-shadow: 0 0 0 16px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
}
@keyframes slotShake {
  0%,100% { transform: rotate(0); }
  25% { transform: rotate(5deg); }
  50% { transform: rotate(-5deg); }
  75% { transform: rotate(3deg); }
}
```

- [ ] **Step 2: Smoke-test in a sandbox screen**

Temporarily add to `src/index.html` inside `#stage`:

```html
<section class="screen active" id="screen-sandbox">
  <div style="display:flex;gap:16px;padding:40px">
    <div class="tile">4</div>
    <div class="tile">2</div>
    <div class="tile dim">7</div>
    <div class="slot inactive">5</div>
    <div class="slot active"></div>
    <div class="slot filled">8</div>
  </div>
</section>
```

`bun run dev` → confirm visuals match design.md sections 4.1/4.2 (chunky tiles, dashed/solid slots, pulse on active slot).

- [ ] **Step 3: Remove sandbox; commit**

Revert the sandbox section from index.html.

```bash
git add src/style.css src/index.html
git commit -m "feat(components): DigitTile and AnswerSlot styles"
```

---

### Task 13: Block and GroupTray Styles

Per design.md sections 4.3 and 4.4.

- [ ] **Step 1: Append to `src/style.css`**

```css
.block-host {
  width: 96px; height: 96px;
  display: inline-block;
  cursor: grab;
  transition: transform .2s var(--ease-pop);
  filter: drop-shadow(0 4px 0 rgba(120,70,20,0.25));
}
.block-host.idle-wobble { animation: blockWobble 2s ease-in-out infinite; }
@keyframes blockWobble { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
.block-host.untapped { opacity: .55; filter: none; }
.block-host.tapped   { opacity: 1; animation: blockPop .35s var(--ease-pop); }
.block-host.dragging { transform: scale(1.15); animation: none; z-index: 200; cursor: grabbing; }
.block-host.in-group { transform: scale(1); animation: none; }
@keyframes blockPop {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.4); }
  100% { transform: scale(1.05); }
}

.block-host .glow circle { transition: opacity .35s var(--ease-pop); }
.block-host.tapped .glow circle { opacity: .7; }

.count-badge {
  position: absolute;
  width: 32px; height: 32px;
  background: #fff;
  border: 3px solid var(--ink);
  border-radius: var(--r-pill);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Lilita One', system-ui; font-size: 22px; color: var(--ink);
  transform: scale(0); transition: transform .25s var(--ease-pop);
  pointer-events: none;
}
.count-badge.show { transform: scale(1); }

.group-tray {
  width: 320px; height: 280px;
  border-radius: var(--r-xl);
  background: var(--bg-card);
  border: 5px dashed var(--world-accent);
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 12px; padding: 24px 24px 56px;
  transition: border-color .4s var(--ease-soft), box-shadow .4s var(--ease-soft);
}
.group-tray .ghost {
  width: 96px; height: 96px;
  border: 3px dashed var(--ink-soft);
  border-radius: var(--r-pill);
  opacity: .3;
  justify-self: center; align-self: center;
}
.group-tray .count-chip {
  position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
  font-family: 'Nunito', sans-serif; font-weight: 900; font-size: 22px;
  background: var(--bg-card); padding: 4px 12px; border-radius: var(--r-pill);
  border: 2px solid var(--ink); color: var(--ink);
}
.group-tray.full {
  border-style: solid; border-color: var(--success-deep);
  box-shadow: 0 0 0 6px rgba(74,214,109,.25);
}
.group-tray.full .count-chip { background: var(--star); font-family: 'Lilita One', system-ui; font-size: 28px; }
```

- [ ] **Step 2: Manual sandbox check (optional)**

Same approach as Task 12 — drop blocks and a group-tray into a temporary screen, visually confirm states.

- [ ] **Step 3: Commit**

```bash
git add src/style.css
git commit -m "feat(components): Block and GroupTray styles"
```

---

### Task 14: PrimaryButton and StarMeter Styles

Per design.md sections 4.7 and 4.8.

- [ ] **Step 1: Append to `src/style.css`**

```css
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 12px;
  min-width: 280px; height: 110px;
  border-radius: var(--r-pill);
  border: 4px solid var(--ink);
  background: var(--world-primary); color: var(--ink);
  font-family: 'Lilita One', system-ui; font-size: 36px;
  cursor: pointer; user-select: none;
  box-shadow: var(--sh-3);
  transition: transform .08s var(--ease-pop), box-shadow .08s var(--ease-pop), filter .15s;
  padding: 0 32px;
}
.btn:active { transform: translateY(6px); box-shadow: var(--sh-pressed); }
.btn.pill   { min-width: 480px; height: 120px; font-size: 56px; }
.btn.ghost  { background: var(--bg-card); }
.btn.success{ background: var(--success); color: #fff; }
.btn:disabled, .btn.disabled {
  opacity: .55; cursor: not-allowed; box-shadow: none;
  background: var(--ink-soft);
}

.star-meter { display: inline-flex; gap: 8px; align-items: center; }
.star-meter .star { width: 32px; height: 32px; }
.star-meter.big .star { width: 160px; height: 160px; }
.star-meter .star.empty path { opacity: .25; }
.star-meter .star.earned {
  filter: drop-shadow(0 0 12px var(--star-glow));
  animation: starReveal .5s var(--ease-pop);
}
@keyframes starReveal {
  0%   { transform: translateY(-80px) scale(0); opacity: 0; }
  60%  { transform: translateY(0) scale(1.3); opacity: 1; }
  100% { transform: translateY(0) scale(1); }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/style.css
git commit -m "feat(components): PrimaryButton and StarMeter styles"
```

---

### Task 15: Drag-and-Drop System (Pointer Events)

Reusable drag manager. TDD the hit-test math; manual-verify the integrated drag in a sandbox.

**Files:** Create `src/drag.js`, `tests/drag.test.js`.

- [ ] **Step 1: Failing test for hit-test math**

Create `tests/drag.test.js`:

```js
import { test, expect } from "bun:test";
import { findDropTarget, withinTolerance } from "../src/drag.js";

test("withinTolerance: point inside expanded rect", () => {
  const rect = { left: 100, top: 100, right: 200, bottom: 200 };
  expect(withinTolerance(rect, 150, 150, 0)).toBe(true);
  expect(withinTolerance(rect, 250, 250, 0)).toBe(false);
  expect(withinTolerance(rect, 240, 240, 60)).toBe(true);
});

test("findDropTarget picks closest active target within tolerance", () => {
  const targets = [
    { id: "a", rect: { left: 0,   top: 0,   right: 50,  bottom: 50  }, active: true },
    { id: "b", rect: { left: 100, top: 100, right: 200, bottom: 200 }, active: true },
    { id: "c", rect: { left: 200, top: 200, right: 300, bottom: 300 }, active: false },
  ];
  expect(findDropTarget(targets, 150, 150, 60)?.id).toBe("b");
  expect(findDropTarget(targets, 250, 250, 60)?.id).toBe(null ?? undefined);
  expect(findDropTarget(targets, 25, 25, 60)?.id).toBe("a");
});
```

- [ ] **Step 2: Implement `src/drag.js`**

```js
export function withinTolerance(rect, x, y, tol = 0) {
  return x >= rect.left - tol && x <= rect.right + tol
      && y >= rect.top  - tol && y <= rect.bottom + tol;
}

function rectCenter(r) { return { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 }; }

export function findDropTarget(targets, x, y, tol = 0) {
  let best = null, bestD = Infinity;
  for (const t of targets) {
    if (!t.active) continue;
    if (!withinTolerance(t.rect, x, y, tol)) continue;
    const c = rectCenter(t.rect);
    const d = (c.x - x) ** 2 + (c.y - y) ** 2;
    if (d < bestD) { bestD = d; best = t; }
  }
  return best;
}

export function createDragManager({ getTargets, onPickup, onDrop }) {
  let dragging = null;

  function start(e, sourceEl, payload) {
    e.preventDefault();
    const rect = sourceEl.getBoundingClientRect();
    const origin = { x: rect.left, y: rect.top };
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    dragging = { sourceEl, payload, origin, offsetX, offsetY, pointerId: e.pointerId };
    sourceEl.setPointerCapture?.(e.pointerId);
    sourceEl.classList.add("dragging");
    onPickup?.(payload, sourceEl);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  }

  function move(e) {
    if (!dragging || e.pointerId !== dragging.pointerId) return;
    const { sourceEl, offsetX, offsetY } = dragging;
    sourceEl.style.position = "absolute";
    sourceEl.style.left = `${e.clientX - offsetX}px`;
    sourceEl.style.top  = `${e.clientY - offsetY}px`;
  }

  function end(e) {
    if (!dragging || e.pointerId !== dragging.pointerId) return;
    const { sourceEl, payload, origin } = dragging;
    const targets = getTargets();
    const target = findDropTarget(targets, e.clientX, e.clientY, 40);
    sourceEl.classList.remove("dragging");
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", end);
    dragging = null;
    onDrop?.(payload, target, sourceEl, origin);
  }

  return { start };
}
```

- [ ] **Step 3: Run tests, verify pass; commit**

```bash
bun test
git add src/drag.js tests/drag.test.js
git commit -m "feat(drag): pointer-event drag manager + TDD'd hit-test"
```

---

## Phase 6: Animations

All animation utilities live in `src/animate.js` — pure functions that mutate DOM/CSS or return Promise-based completion. Per design.md section 5.

### Task 16: Tile Animations (Pickup, Bounce-Back, Snap-In)

**Files:** Create `src/animate.js`.

- [ ] **Step 1: Create `src/animate.js` with three tile motion helpers**

```js
import { sfx } from "./audio.js";

export function tilePickup(el) {
  el.classList.add("dragging");
  sfx.tilePickup();
}

export function tileBounceBack(el, origin) {
  return new Promise((resolve) => {
    const start = el.getBoundingClientRect();
    const dx = origin.x - start.left;
    const dy = origin.y - start.top;
    const apex = -24;
    el.style.transition = "none";
    el.classList.remove("dragging");
    el.animate(
      [
        { transform: `translate(0,0) rotate(0)` },
        { transform: `translate(${dx/2}px, ${dy/2 + apex}px) rotate(-8deg)` },
        { transform: `translate(${dx}px, ${dy}px) rotate(0)` },
      ],
      { duration: 450, easing: "cubic-bezier(0.7,-0.5,0.3,1.5)" }
    ).onfinish = () => {
      el.style.position = "";
      el.style.left = "";
      el.style.top = "";
      el.style.transform = "";
      resolve();
    };
    sfx.tileDropWrong();
  });
}

export function tileSnapIn(el, targetEl) {
  return new Promise((resolve) => {
    const start = el.getBoundingClientRect();
    const target = targetEl.getBoundingClientRect();
    const dx = target.left + (target.width - start.width)/2 - start.left;
    const dy = target.top  + (target.height - start.height)/2 - start.top;
    el.classList.remove("dragging");
    el.animate(
      [
        { transform: `translate(0,0) scale(1.15)` },
        { transform: `translate(${dx}px,${dy}px) scale(0.96)`, offset: 0.8 },
        { transform: `translate(${dx}px,${dy}px) scale(1)` },
      ],
      { duration: 220, easing: "cubic-bezier(0.25,0.9,0.3,1.4)" }
    ).onfinish = () => {
      el.remove();
      targetEl.classList.remove("active");
      targetEl.classList.add("filled");
      targetEl.textContent = el.textContent;
      resolve();
    };
    sfx.tileDropCorrect();
    setTimeout(() => sfx.slotFill(), 200);
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/animate.js
git commit -m "feat(animate): tile pickup, bounce-back, snap-in"
```

---

### Task 17: Carry Chip Animation

Per design.md section 5.4. The "1" arcs from the ones answer slot up to the carry slot above the tens-top digit.

- [ ] **Step 1: Append to `src/animate.js`**

```js
export function flyCarry(carrySlotEl, fromEl) {
  return new Promise((resolve) => {
    const chip = document.createElement("div");
    chip.className = "carry-chip";
    chip.textContent = "1";
    document.body.appendChild(chip);

    const start = fromEl.getBoundingClientRect();
    const end = carrySlotEl.getBoundingClientRect();
    const startX = start.left + start.width / 2;
    const startY = start.top + start.height / 2;
    const endX = end.left + end.width / 2;
    const endY = end.top + end.height / 2;
    const apexX = (startX + endX) / 2;
    const apexY = Math.min(startY, endY) - 80;

    chip.style.left = `${startX - 30}px`;
    chip.style.top = `${startY - 30}px`;
    chip.style.transform = "scale(0)";

    sfx.carryWhoosh();
    requestAnimationFrame(() => {
      // birth
      chip.animate([{ transform: "scale(0)" }, { transform: "scale(1)" }],
        { duration: 200, easing: "cubic-bezier(0.34,1.6,0.5,1)", fill: "forwards" });
      // arc using cubic-bezier waypoints
      setTimeout(() => {
        chip.animate(
          [
            { left: `${startX - 30}px`, top: `${startY - 30}px`, transform: "scale(1) rotate(0)" },
            { left: `${apexX - 30}px`,  top: `${apexY - 30}px`,  transform: "scale(1.05) rotate(6deg)", offset: 0.5 },
            { left: `${endX - 30}px`,   top: `${endY - 30}px`,   transform: "scale(1) rotate(0)" },
          ],
          { duration: 500, easing: "cubic-bezier(0.4,0,0.6,1)", fill: "forwards" }
        ).onfinish = () => {
          chip.animate([{ transform: "scale(1.1)" }, { transform: "scale(1)" }],
            { duration: 200, easing: "cubic-bezier(0.25,0.9,0.3,1.4)", fill: "forwards" });
          carrySlotEl.textContent = "1";
          carrySlotEl.classList.add("filled");
          setTimeout(() => { chip.remove(); resolve(); }, 220);
        };
      }, 200);
    });
  });
}
```

- [ ] **Step 2: Append carry-chip CSS to `src/style.css`**

```css
.carry-chip, .borrow-chip {
  position: fixed;
  width: 60px; height: 60px;
  border-radius: var(--r-md);
  background: var(--world-primary);
  border: 3px solid var(--ink);
  font-family: 'Lilita One', system-ui; font-size: 40px;
  display: flex; align-items: center; justify-content: center;
  color: var(--ink);
  pointer-events: none;
  z-index: 500;
}
.borrow-chip { background: var(--world-accent); }
.carry-slot {
  position: absolute; width: 60px; height: 60px;
  border-radius: var(--r-md);
  border: 3px dashed var(--ink-soft);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Lilita One', system-ui; font-size: 40px;
  color: var(--ink);
  opacity: 0;
  transition: opacity .3s var(--ease-pop);
}
.carry-slot.filled { opacity: 1; border-style: solid; }
```

- [ ] **Step 3: Commit**

```bash
git add src/animate.js src/style.css
git commit -m "feat(animate): carry chip arc animation + carry slot styles"
```

---

### Task 18: Borrow Animation

Per design.md section 5.5. Strikethrough the tens-top digit, show the new (one less) digit above, drop a "10" chip into the ones column, morph the ones digit to its new value.

- [ ] **Step 1: Append to `src/animate.js`**

```js
export function animateBorrow({ tensTopEl, onesTopEl, newTensDigit, newOnesValue }) {
  return new Promise((resolve) => {
    sfx.borrowWhoosh();

    // Phase A (0-0.3s): strike-through + new tens digit floats in above
    const strike = document.createElement("div");
    strike.className = "strike";
    tensTopEl.appendChild(strike);

    const newTens = document.createElement("div");
    newTens.className = "borrow-replacement";
    newTens.textContent = String(newTensDigit);
    tensTopEl.parentElement.appendChild(newTens);

    const tensRect = tensTopEl.getBoundingClientRect();
    newTens.style.left = `${tensRect.left}px`;
    newTens.style.top = `${tensRect.top - 70}px`;
    newTens.animate([{ opacity: 0, transform: "translateY(20px)" }, { opacity: 1, transform: "translateY(0)" }],
      { duration: 200, easing: "ease-out", fill: "forwards" });

    // Phase B (0.3-0.9s): "10" chip drops from tens column to ones column
    setTimeout(() => {
      const chip = document.createElement("div");
      chip.className = "borrow-chip";
      chip.textContent = "10";
      document.body.appendChild(chip);

      const tens = tensTopEl.getBoundingClientRect();
      const ones = onesTopEl.getBoundingClientRect();
      const sx = tens.left + tens.width/2;
      const sy = tens.top + tens.height/2;
      const ex = ones.left + ones.width/2;
      const ey = ones.top + ones.height/2;
      chip.style.left = `${sx - 30}px`;
      chip.style.top  = `${sy - 30}px`;

      chip.animate(
        [
          { left: `${sx - 30}px`, top: `${sy - 30}px`, transform: "scale(1)" },
          { left: `${(sx+ex)/2 - 30}px`, top: `${(sy+ey)/2 - 30}px`, transform: "scale(1.1)", offset: 0.6 },
          { left: `${ex - 30}px`, top: `${ey - 30}px`, transform: "scale(1)" },
        ],
        { duration: 600, easing: "cubic-bezier(0.4,0,0.6,1)", fill: "forwards" }
      ).onfinish = () => {
        // Phase C: merge — ones digit fades out, new ones value fades in
        const oldText = onesTopEl.textContent;
        onesTopEl.animate([{ opacity: 1 }, { opacity: 0 }],
          { duration: 150, fill: "forwards" }).onfinish = () => {
            onesTopEl.textContent = String(newOnesValue);
            onesTopEl.animate([{ opacity: 0 }, { opacity: 1 }],
              { duration: 150, fill: "forwards" }).onfinish = () => {
                chip.remove();
                resolve();
              };
          };
      };
    }, 300);
  });
}
```

- [ ] **Step 2: CSS for strikethrough + replacement (append `src/style.css`)**

```css
.strike {
  position: absolute; inset: 0;
  pointer-events: none;
  background: linear-gradient(to bottom right, transparent 47%, var(--gentle-no) 48%, var(--gentle-no) 52%, transparent 53%);
  animation: strikeDraw .25s var(--ease-soft) forwards;
}
@keyframes strikeDraw { from { opacity: 0; } to { opacity: 1; } }
.borrow-replacement {
  position: absolute;
  width: 60px; height: 60px;
  font-family: 'Lilita One', system-ui;
  font-size: 56px; color: var(--ink);
  display: flex; align-items: center; justify-content: center;
  pointer-events: none;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/animate.js src/style.css
git commit -m "feat(animate): borrow descent with strikethrough and chip drop"
```

---

### Task 19: Block Tap-Count Light-Up + Fly-In

Per design.md sections 5.6 and 5.7.

- [ ] **Step 1: Append to `src/animate.js`**

```js
export function tapBlock(blockEl, count) {
  blockEl.classList.remove("untapped");
  blockEl.classList.add("tapped");
  // Reveal count badge
  let badge = blockEl.querySelector(".count-badge");
  if (!badge) {
    badge = document.createElement("div");
    badge.className = "count-badge";
    blockEl.appendChild(badge);
  }
  badge.textContent = String(count);
  requestAnimationFrame(() => badge.classList.add("show"));
  sfx.blockTap(count);
}

export function blockFlyIn(blocks) {
  blocks.forEach((el, i) => {
    el.style.opacity = "0";
    el.style.transform = `translate(${(Math.random()-0.5)*120}px, -200px) rotate(${(Math.random()-0.5)*40}deg)`;
    setTimeout(() => {
      el.animate(
        [
          { opacity: 0, transform: el.style.transform },
          { opacity: 1, transform: "translate(0,0) rotate(0)" },
        ],
        { duration: 600, easing: "cubic-bezier(0.34,1.6,0.5,1)", fill: "forwards" }
      ).onfinish = () => { el.classList.add("idle-wobble"); el.style.opacity = ""; el.style.transform = ""; };
    }, i * 40);
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/animate.js
git commit -m "feat(animate): block tap-count and fly-in"
```

---

### Task 20: Star Reveal Animation

Per design.md section 5.8.

- [ ] **Step 1: Append to `src/animate.js`**

```js
export function revealStars(starEls, earnedCount) {
  const delays = [400, 1100, 1900];
  const overshoots = [1.3, 1.5, 1.7];
  return new Promise((resolve) => {
    starEls.forEach((el, i) => {
      if (i >= earnedCount) {
        el.classList.add("empty");
        return;
      }
      setTimeout(() => {
        el.classList.add("earned");
        sfx.starDing(i + 1);
        el.animate(
          [
            { transform: "translateY(-80px) scale(0)", opacity: 0 },
            { transform: `translateY(0) scale(${overshoots[i]})`, opacity: 1, offset: 0.6 },
            { transform: "translateY(0) scale(1)", opacity: 1 },
          ],
          { duration: 500 + i * 100, easing: "cubic-bezier(0.34,1.6,0.5,1)", fill: "forwards" }
        );
        if (i === earnedCount - 1) {
          setTimeout(resolve, 500 + i * 100 + 200);
        }
      }, delays[i]);
    });
    if (earnedCount === 0) setTimeout(resolve, 600);
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/animate.js
git commit -m "feat(animate): star reveal with escalating ding"
```

---

### Task 21: Mascot Idle + Celebrate

Per design.md section 5.9.

- [ ] **Step 1: Append CSS for mascot animations (`src/style.css`)**

```css
.mascot { display: block; }
.mascot.idle { animation: mascotBreath 4s var(--ease-soft) infinite; }
.mascot.idle .eye-l circle:first-child,
.mascot.idle .eye-r circle:first-child { animation: mascotBlink 4s steps(1) infinite; }
.mascot.celebrate { animation: mascotCelebrate .8s var(--ease-pop) 3; }
.mascot.celebrate .wing-l, .mascot.celebrate .wing-r { animation: wingFlap .8s ease-in-out 3; }

@keyframes mascotBreath { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(1.015); } }
@keyframes mascotBlink  { 0%,53%,57%,100% { opacity: 1; } 54%,56% { opacity: .1; } }
@keyframes mascotCelebrate {
  0%   { transform: translateY(0); }
  25%  { transform: translateY(-12px) rotate(-3deg); }
  50%  { transform: translateY(0); }
  75%  { transform: translateY(-8px) rotate(3deg); }
  100% { transform: translateY(0); }
}
@keyframes wingFlap {
  0%,100% { transform: rotate(0); }
  50% { transform: rotate(-20deg); transform-origin: 50% 90%; }
}
```

- [ ] **Step 2: Append helpers to `src/animate.js`**

```js
export function mascotIdle(svgRoot) {
  svgRoot.classList.add("idle");
  svgRoot.classList.remove("celebrate");
}
export function mascotCelebrate(svgRoot) {
  svgRoot.classList.remove("idle");
  svgRoot.classList.add("celebrate");
  setTimeout(() => mascotIdle(svgRoot), 2400);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/animate.js src/style.css
git commit -m "feat(animate): mascot idle and celebrate animations"
```

---

### Task 22: Confetti Particles

Per design.md section 3.7. JS particle system (no library).

- [ ] **Step 1: Append to `src/animate.js`**

```js
import { confettiShape } from "./svg.js";

const CONFETTI_COLORS = ["#FFC83A", "#FF7A40", "#4AAE3F", "#3DC5C5", "#E03E3E", "#FFB933"];
const CONFETTI_KINDS = ["rect", "tear", "circle", "zig"];

export function burstConfetti(container, count = 80) {
  for (let i = 0; i < count; i++) {
    const wrap = document.createElement("div");
    wrap.className = "confetti-particle";
    const kind = CONFETTI_KINDS[i % 4];
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    wrap.insertAdjacentHTML("beforeend", confettiShape(kind, color));
    const startX = container.clientWidth / 2 + (Math.random() - 0.5) * 200;
    const endX = startX + (Math.random() - 0.5) * 800;
    const endY = container.clientHeight + 100;
    wrap.style.left = `${startX}px`;
    wrap.style.top = "0px";
    wrap.style.transform = `rotate(${Math.random() * 360}deg)`;
    container.appendChild(wrap);
    wrap.animate(
      [
        { transform: `translate(0,0) rotate(0deg)` },
        { transform: `translate(${endX - startX}px, ${endY}px) rotate(${720 + Math.random()*720}deg)` },
      ],
      { duration: 2500 + Math.random()*500, easing: "cubic-bezier(0.4,0,0.6,1)", fill: "forwards" }
    ).onfinish = () => wrap.remove();
  }
}
```

- [ ] **Step 2: CSS (`src/style.css`)**

```css
.confetti-particle { position: absolute; pointer-events: none; }
.confetti-particle svg { width: 20px; height: 20px; }
```

- [ ] **Step 3: Commit**

```bash
git add src/animate.js src/style.css
git commit -m "feat(animate): confetti particle burst"
```

---

### Task 23: Node Unlock Animation

Per design.md section 5.10.

- [ ] **Step 1: Append to `src/animate.js`**

```js
export function unlockNode(nodeEl) {
  return new Promise((resolve) => {
    nodeEl.classList.add("unlocking");
    sfx.nodeUnlockPop();
    setTimeout(() => {
      const padlock = nodeEl.querySelector(".padlock");
      if (padlock) {
        padlock.animate(
          [
            { transform: "rotate(0) translateY(0)", opacity: 1 },
            { transform: "rotate(40deg) translateY(80px)", opacity: 0 },
          ],
          { duration: 500, easing: "ease-in", fill: "forwards" }
        ).onfinish = () => padlock.remove();
      }
      sfx.starDing(1);
    }, 400);
    setTimeout(() => {
      nodeEl.classList.remove("locked", "unlocking");
      nodeEl.classList.add("unlocked");
      resolve();
    }, 1400);
  });
}
```

- [ ] **Step 2: CSS for unlock state (`src/style.css`)**

```css
.level-node.unlocking { animation: nodeShake .4s var(--ease-elastic); }
@keyframes nodeShake { 0%,100% { transform: scale(1); } 25% { transform: scale(1.06) rotate(6deg); } 75% { transform: scale(1.06) rotate(-6deg); } }
```

- [ ] **Step 3: Commit**

```bash
git add src/animate.js src/style.css
git commit -m "feat(animate): node unlock with padlock break"
```

---

## Phase 7: Screens

Each screen lives in its own file under `src/screens/`. Every screen exports `mount(stage, state, router)` and (optionally) `unmount()`. The router (built in Task 32) calls these as it switches screens.

### Task 24: Splash Screen

Per design.md section 3.1.

**Files:** Create `src/screens/splash.js`.

- [ ] **Step 1: Create `src/screens/splash.js`**

```js
import { banji, cog } from "../svg.js";
import { unlockAudio, sfx } from "../audio.js";

export function mount(stage, state, router) {
  const sec = document.createElement("section");
  sec.className = "screen active";
  sec.id = "screen-splash";

  const cogWrap = document.createElement("div");
  cogWrap.className = "cog-corner";
  cogWrap.insertAdjacentHTML("beforeend", cog());
  sec.appendChild(cogWrap);

  const title = document.createElement("h1");
  title.className = "splash-title display";
  title.textContent = "JHANAV'S MATH";
  sec.appendChild(title);

  const mascot = document.createElement("div");
  mascot.className = "splash-mascot";
  mascot.insertAdjacentHTML("beforeend", banji("idle"));
  sec.appendChild(mascot);

  const btn = document.createElement("button");
  btn.className = "btn pill splash-play";
  btn.innerHTML = "TAP TO PLAY ▶";
  sec.appendChild(btn);

  function go() {
    unlockAudio();
    sfx.transition();
    router.go("map");
  }
  btn.addEventListener("pointerup", go);
  sec.addEventListener("pointerup", (e) => {
    if (e.target.closest(".cog-corner")) return;
    if (!e.target.closest("button")) go();
  });

  let holdTimer = null;
  cogWrap.addEventListener("pointerdown", () => {
    holdTimer = setTimeout(() => router.go("settings"), 1500);
  });
  cogWrap.addEventListener("pointerup", () => clearTimeout(holdTimer));
  cogWrap.addEventListener("pointerleave", () => clearTimeout(holdTimer));

  stage.appendChild(sec);
  return () => sec.remove();
}
```

- [ ] **Step 2: Splash CSS (append `src/style.css`)**

```css
#screen-splash {
  background: linear-gradient(to bottom, var(--world-sky) 0%, var(--world-sky) 60%, var(--world-ground) 60%, var(--world-ground) 100%);
}
.splash-title {
  position: absolute; top: 80px; left: 50%; transform: translateX(-50%);
  font-size: 96px; color: var(--ink);
  text-shadow: 0 4px 0 var(--star);
  letter-spacing: 2px;
}
.splash-mascot {
  position: absolute; top: 180px; left: 50%; transform: translateX(-50%);
  width: 380px; height: 380px;
}
.splash-mascot svg { width: 100%; height: 100%; }
.splash-play {
  position: absolute; bottom: 120px; left: 50%; transform: translateX(-50%);
  animation: playPulse 2s var(--ease-soft) infinite;
}
@keyframes playPulse {
  0%,100% { box-shadow: var(--sh-3), 0 0 0 0 var(--world-primary); }
  50%     { box-shadow: var(--sh-3), 0 0 0 18px transparent; }
}
.cog-corner { position: absolute; top: 32px; right: 32px; width: 80px; height: 80px; cursor: pointer; }
.cog-corner svg { width: 100%; height: 100%; }
```

- [ ] **Step 3: Wire to game.js stub router (temporary)**

In `src/game.js`, add a minimal router so the screen can mount:

```js
import * as splash from "./screens/splash.js";
const router = {
  current: null,
  go(name) {
    if (this.current) this.current();
    if (name === "map") {
      const div = document.createElement("div");
      div.style.cssText = "padding:40px;font:bold 32px sans-serif;color:#2A1B0A;";
      div.textContent = "Map screen — Task 25 will replace this.";
      stage.appendChild(div);
      this.current = () => div.remove();
    } else if (name === "settings") {
      alert("Settings panel — Task 33");
    } else {
      this.current = splash.mount(stage, {}, this);
    }
  }
};
router.go("splash");
```

- [ ] **Step 4: Manual verify**

`bun run dev`. Splash renders with title, Banji, big yellow "TAP TO PLAY" button pulsing. Tapping anywhere advances to the placeholder map. Long-pressing the cog triggers the settings alert.

- [ ] **Step 5: Commit**

```bash
git add src/screens/splash.js src/style.css src/game.js
git commit -m "feat(screens): splash with mascot, title, and tap-to-play"
```

---

### Task 25: World Map Screen

Per design.md section 3.2.

**Files:** Create `src/screens/map.js`.

- [ ] **Step 1: Create `src/screens/map.js`**

```js
import { home, star, padlock } from "../svg.js";
import { loadProgress, isLevelUnlocked, totalStars } from "../logic.js";
import { sfx } from "../audio.js";

const WORLDS = [
  { id: "add",  name: "BANANA HILLS"    },
  { id: "sub",  name: "MISTY RIVER"     },
  { id: "mult", name: "FIREFLY MEADOW"  },
];

export function mount(stage, state, router) {
  const sec = document.createElement("section");
  sec.className = "screen active";
  sec.id = "screen-map";

  const progress = loadProgress();

  const homeBtn = document.createElement("button");
  homeBtn.className = "home-btn";
  homeBtn.insertAdjacentHTML("beforeend", home());
  homeBtn.addEventListener("pointerup", () => router.go("splash"));
  sec.appendChild(homeBtn);

  const meter = document.createElement("div");
  meter.className = "star-meter total display";
  meter.insertAdjacentHTML("beforeend", `STARS: ${star(true)} ${totalStars(progress)} / 18`);
  sec.appendChild(meter);

  const grid = document.createElement("div");
  grid.className = "world-grid";
  sec.appendChild(grid);

  WORLDS.forEach((w) => {
    stage.dataset.world = w.id;
    const panel = document.createElement("div");
    panel.className = `world-panel world-${w.id}`;
    panel.innerHTML = `<h2 class="world-title display">${w.name}</h2>`;
    const path = document.createElement("div");
    path.className = "level-path";
    panel.appendChild(path);

    for (let l = 1; l <= 6; l++) {
      const stars = progress[w.id][l] || 0;
      const unlocked = isLevelUnlocked(progress, w.id, l);
      const node = document.createElement("button");
      node.className = `level-node ${unlocked ? "unlocked" : "locked"} stars-${stars}`;
      node.dataset.world = w.id;
      node.dataset.level = String(l);

      if (!unlocked) {
        node.insertAdjacentHTML("beforeend", padlock());
      } else {
        node.innerHTML = `<span class="display">${l}</span>`;
        if (stars > 0) {
          const ribbon = document.createElement("div");
          ribbon.className = "node-ribbon";
          for (let s = 0; s < 3; s++) ribbon.insertAdjacentHTML("beforeend", star(s < stars));
          node.appendChild(ribbon);
        }
      }
      node.addEventListener("pointerup", () => {
        if (!unlocked) { sfx.lockedTap(); node.animate([{transform:"rotate(0)"},{transform:"rotate(6deg)"},{transform:"rotate(-6deg)"},{transform:"rotate(0)"}],{duration:300}); return; }
        sfx.transition();
        router.go("level", { world: w.id, level: l });
      });
      path.appendChild(node);
    }
    grid.appendChild(panel);
  });

  stage.dataset.world = "add";
  stage.appendChild(sec);
  return () => sec.remove();
}
```

- [ ] **Step 2: Append CSS**

```css
#screen-map {
  background: linear-gradient(to bottom, #FFF3DC 0%, #F7E2B0 100%);
  padding: 80px 24px 24px;
}
.home-btn {
  position: absolute; top: 32px; left: 32px;
  width: 80px; height: 80px;
  border-radius: var(--r-md);
  background: var(--bg-card);
  border: 4px solid var(--ink);
  box-shadow: var(--sh-1);
  cursor: pointer;
}
.home-btn svg { width: 100%; height: 100%; padding: 12px; }

.star-meter.total {
  position: absolute; top: 40px; right: 32px;
  font-family: 'Nunito', sans-serif; font-weight: 900; font-size: 28px;
  display: flex; align-items: center; gap: 8px;
}
.star-meter.total svg.star { width: 32px; height: 32px; vertical-align: middle; }

.world-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 24px; height: 100%; padding-top: 24px;
}
.world-panel {
  background: var(--bg-card);
  border: 5px solid var(--ink);
  border-radius: var(--r-lg);
  padding: 16px; position: relative; overflow: hidden;
}
.world-title { text-align: center; font-size: 28px; margin: 0 0 12px; }
.world-add  .world-title { color: #B07020; }
.world-sub  .world-title { color: #2C8585; }
.world-mult .world-title { color: #B26818; }

.level-path {
  display: grid; grid-template-columns: repeat(2, 100px);
  justify-content: center; align-content: space-around;
  gap: 24px 32px; height: calc(100% - 40px);
}
.level-node {
  width: 100px; height: 100px;
  border-radius: 50%;
  border: 5px solid var(--ink);
  background: var(--world-primary);
  color: #fff;
  font-family: 'Lilita One', system-ui; font-size: 48px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; position: relative;
  box-shadow: var(--sh-1);
}
.level-node.locked { background: var(--lock); cursor: default; }
.level-node.locked svg { width: 56px; height: 56px; }
.level-node.unlocked { animation: nodePulse 1.8s var(--ease-soft) infinite; }
.level-node.stars-1, .level-node.stars-2, .level-node.stars-3 { animation: none; }
@keyframes nodePulse {
  0%,100% { box-shadow: var(--sh-1), 0 0 0 0 var(--world-primary); }
  50%     { box-shadow: var(--sh-1), 0 0 0 16px transparent; }
}
.node-ribbon {
  position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 2px;
  background: var(--ink); padding: 2px 6px; border-radius: var(--r-pill);
}
.node-ribbon svg { width: 18px; height: 18px; }
```

- [ ] **Step 3: Update game.js router to handle map**

```js
import * as map from "./screens/map.js";
// ...
if (name === "map") this.current = map.mount(stage, {}, this);
```

- [ ] **Step 4: Manual verify**

`bun run dev`. Splash → tap → map shows 3 world panels with 6 nodes each. L1 of "add" is unlocked, all others locked. Tapping locked shakes + boing. Tapping L1 navigates to placeholder.

- [ ] **Step 5: Commit**

```bash
git add src/screens/map.js src/style.css src/game.js
git commit -m "feat(screens): world map with 3 worlds, locked/unlocked nodes"
```

---

### Task 26: Addition Level (Column Method)

Per design.md section 3.3. The most involved screen — drives drag, right-to-left, carry animation.

**Files:** Create `src/screens/add.js`.

- [ ] **Step 1: Create `src/screens/add.js`**

```js
import { getProblems, analyze, createAnswerState, dropDigit, isComplete, starsFor } from "../logic.js";
import { createDragManager } from "../drag.js";
import { tilePickup, tileBounceBack, tileSnapIn, flyCarry } from "../animate.js";
import { sfx } from "../audio.js";
import { home, banji, star } from "../svg.js";

export function mount(stage, ctx, router) {
  const { world, level } = ctx;
  stage.dataset.world = world;
  const problems = getProblems(world, level);
  let idx = 0;
  let totalWrong = 0;
  let activeState = null;
  let dragMgr = null;
  let trayWrongOnCurrentSlot = 0;

  const sec = document.createElement("section");
  sec.className = "screen active";
  sec.id = "screen-add";

  sec.innerHTML = `
    <div class="topbar">
      <button class="home-btn small"></button>
      <div class="progress-dots"></div>
      <div class="star-meter run"></div>
    </div>
    <div class="worksheet"></div>
    <div class="digit-tray"></div>
    <div class="corner-mascot"></div>
  `;
  sec.querySelector(".home-btn").insertAdjacentHTML("beforeend", home());
  sec.querySelector(".home-btn").addEventListener("pointerup", () => router.go("map"));
  sec.querySelector(".corner-mascot").insertAdjacentHTML("beforeend", banji("idle"));

  renderProgressDots();
  renderTray();
  renderProblem();
  setupDrag();

  function renderProgressDots() {
    const d = sec.querySelector(".progress-dots");
    d.innerHTML = "";
    for (let i = 0; i < 5; i++) {
      const dot = document.createElement("span");
      dot.className = "dot" + (i < idx ? " filled" : i === idx ? " current" : "");
      d.appendChild(dot);
    }
  }

  function renderTray() {
    const tray = sec.querySelector(".digit-tray");
    tray.innerHTML = "";
    for (let n = 0; n <= 9; n++) {
      const t = document.createElement("div");
      t.className = "tile";
      t.dataset.digit = String(n);
      t.textContent = String(n);
      tray.appendChild(t);
    }
  }

  function renderProblem() {
    trayWrongOnCurrentSlot = 0;
    const p = problems[idx];
    const a = analyze(p);
    activeState = createAnswerState(p.answer);
    const ws = sec.querySelector(".worksheet");
    ws.innerHTML = `
      <div class="carry-slot ${a.carry ? "" : "hidden"}"></div>
      <div class="row top">
        <div class="cell ${a.aTens === 0 ? "empty" : ""}">${a.aTens || ""}</div>
        <div class="cell">${a.aOnes}</div>
      </div>
      <div class="row bot">
        <div class="op">${p.op}</div>
        <div class="cell ${a.bTens === 0 ? "empty" : ""}">${a.bTens || ""}</div>
        <div class="cell">${a.bOnes}</div>
      </div>
      <div class="line"></div>
      <div class="row ans">
        ${activeState.slots.length === 2 ? '<div class="slot inactive" data-index="0"></div>' : ""}
        <div class="slot active" data-index="${activeState.slots.length - 1}"></div>
      </div>
    `;
    sec.dataset.problem = `${p.a}${p.op}${p.b}`;
    syncTrayDim();
  }

  function syncTrayDim() {
    // Smart dim: dim tiles that can't be the active digit.
    const expected = activeState.expected[activeState.activeIndex];
    sec.querySelectorAll(".tile").forEach((tile) => {
      tile.classList.remove("dim", "hint-dim", "hint-target");
      if (parseInt(tile.dataset.digit, 10) !== expected) tile.classList.add("dim");
    });
  }

  function setupDrag() {
    dragMgr = createDragManager({
      getTargets() {
        return Array.from(sec.querySelectorAll(".slot")).map((el, i) => ({
          el,
          rect: el.getBoundingClientRect(),
          active: el.classList.contains("active"),
          id: el.dataset.index,
        }));
      },
      onPickup(payload, el) { tilePickup(el); },
      async onDrop(payload, target, sourceEl, origin) {
        if (!target) return tileBounceBack(sourceEl, origin);
        const targetIndex = parseInt(target.id, 10);
        const next = dropDigit(activeState, payload.digit, targetIndex);
        if (!next.lastDropCorrect) {
          totalWrong++;
          activeState = next;
          trayWrongOnCurrentSlot++;
          await tileBounceBack(sourceEl, origin);
          target.el.classList.add("flash-no");
          setTimeout(() => target.el.classList.remove("flash-no"), 200);
          if (trayWrongOnCurrentSlot >= 2) applyHint();
          return;
        }
        const oldIndex = activeState.activeIndex;
        activeState = next;
        await tileSnapIn(sourceEl, target.el);

        const a = analyze(problems[idx]);
        if (oldIndex === activeState.expected.length - 1 && a.carry) {
          const fromEl = target.el;
          const carrySlot = sec.querySelector(".carry-slot");
          await flyCarry(carrySlot, fromEl);
        }
        // Activate next slot
        if (!isComplete(activeState)) {
          sec.querySelectorAll(".slot").forEach((el, _i, _arr) => {
            const i = parseInt(el.dataset.index, 10);
            el.classList.remove("active", "inactive");
            if (i === activeState.activeIndex) el.classList.add("active");
            else if (el.classList.contains("filled")) {} else el.classList.add("inactive");
          });
          trayWrongOnCurrentSlot = 0;
          syncTrayDim();
        } else {
          await advanceProblem();
        }
        renderTray();
        setupDrag();
        attachTileListeners();
      },
    });
    attachTileListeners();
  }

  function attachTileListeners() {
    sec.querySelectorAll(".tile").forEach((tile) => {
      tile.onpointerdown = (e) => {
        const digit = parseInt(tile.dataset.digit, 10);
        dragMgr.start(e, tile, { digit });
      };
    });
  }

  function applyHint() {
    const expected = activeState.expected[activeState.activeIndex];
    sec.querySelectorAll(".tile").forEach((tile) => {
      if (parseInt(tile.dataset.digit, 10) === expected) {
        tile.classList.remove("dim");
        tile.classList.add("hint-target");
      } else {
        tile.classList.add("hint-dim");
      }
    });
    sfx.hintHmm();
  }

  async function advanceProblem() {
    idx++;
    renderProgressDots();
    if (idx >= problems.length) {
      router.go("complete", { world, level, wrongCount: totalWrong });
      return;
    }
    sfx.transition();
    setTimeout(() => {
      renderProblem();
      attachTileListeners();
    }, 500);
  }

  stage.appendChild(sec);
  return () => sec.remove();
}
```

- [ ] **Step 2: CSS for worksheet layout (append `src/style.css`)**

```css
#screen-add, #screen-sub {
  background: var(--world-sky);
  padding: 0;
}
.topbar {
  position: absolute; top: 0; left: 0; right: 0; height: 72px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 32px;
}
.home-btn.small { width: 56px; height: 56px; padding: 0; }
.home-btn.small svg { width: 100%; height: 100%; }
.progress-dots { display: flex; gap: 8px; }
.dot { width: 16px; height: 16px; border-radius: 50%; background: var(--bg-card); border: 3px solid var(--ink); }
.dot.current { background: var(--world-primary); }
.dot.filled  { background: var(--success); }
.star-meter.run { font-size: 24px; font-family: 'Nunito', sans-serif; font-weight: 900; }

.worksheet {
  position: absolute; left: 380px; top: 100px; width: 520px; height: 540px;
  display: grid; grid-template-rows: auto auto auto 6px auto;
  gap: 16px;
  justify-content: center; align-content: start;
  font-family: 'Lilita One', system-ui;
}
.worksheet .row { display: flex; gap: 16px; justify-content: flex-end; }
.worksheet .row.bot .op { font-size: 96px; line-height: 120px; width: 60px; text-align: center; }
.worksheet .cell { width: 100px; height: 120px; font-size: 96px; line-height: 120px; text-align: center; }
.worksheet .cell.empty { opacity: 0; }
.worksheet .line { background: var(--ink); height: 6px; border-radius: 3px; margin: 0 0 0 76px; max-width: 232px; }
.worksheet .row.ans { gap: 16px; justify-content: flex-end; }
.carry-slot { position: absolute; top: 32px; right: 132px; width: 60px; height: 60px; }
.carry-slot.hidden { display: none; }

.digit-tray {
  position: absolute; bottom: 20px; left: 80px; width: 1120px; height: 120px;
  background: var(--bg-card);
  border: 4px solid var(--ink);
  border-radius: var(--r-lg);
  box-shadow: var(--sh-2);
  display: flex; align-items: center; justify-content: center; gap: 16px;
}

.corner-mascot {
  position: absolute; bottom: 160px; right: 32px; width: 180px; height: 180px;
  pointer-events: none;
}
.corner-mascot svg { width: 100%; height: 100%; }
```

- [ ] **Step 3: Update router to handle level + complete**

In `src/game.js`:

```js
import * as add from "./screens/add.js";
// inside router.go:
if (name === "level") {
  if (ctx.world === "add" || ctx.world === "sub") {
    this.current = add.mount(stage, ctx, this);
  }
  // mult variants handled in Tasks 28/29
}
if (name === "complete") {
  // placeholder for Task 30
  alert(`Complete! Wrongs: ${ctx.wrongCount}`);
  this.current = null;
  this.go("map");
}
```

- [ ] **Step 4: Manual verify (most critical playthrough)**

`bun run dev`. From splash → tap → map → tap "1" under Banana Hills → addition level loads. Drag a wrong digit → bounces back, soft boing. Drag two wrong digits → hint dims everything except the correct tile. Drop correct ones digit → snaps in, slot turns solid. If carry needed, "1" arcs up to the carry slot with whoosh. Drop correct tens digit → row settles → next problem flies in. After 5 problems → placeholder complete alert → back to map.

Compare every visual detail to design.md section 3.3.

- [ ] **Step 5: Commit**

```bash
git add src/screens/add.js src/style.css src/game.js
git commit -m "feat(screens): addition level with column method and carry animation"
```

---

### Task 27: Subtraction Level

Per design.md section 3.4. Reuses much of the addition level; the borrow animation replaces the carry. The mascot in the corner is Mo (sloth) instead of Banji.

**Files:** Create `src/screens/sub.js`.

- [ ] **Step 1: Create `src/screens/sub.js`**

The subtraction screen mirrors `src/screens/add.js` with these differences:
- Imports `animateBorrow` instead of `flyCarry`.
- Renders Mo (sloth) in the corner mascot, hanging from a branch.
- After the ones slot becomes active and `a.borrow` is true, runs `animateBorrow` BEFORE allowing drops. After completion, the worksheet's tens-top digit visually shows the new (decremented) value and the ones-top shows the +10 value; the player then drops digits using THOSE numbers.

```js
import { getProblems, analyze, createAnswerState, dropDigit, isComplete, starsFor } from "../logic.js";
import { createDragManager } from "../drag.js";
import { tilePickup, tileBounceBack, tileSnapIn, animateBorrow } from "../animate.js";
import { sfx } from "../audio.js";
import { home, mo } from "../svg.js";

// (Mirror of add.js below — only the differences are highlighted)
// 1. corner mascot: insertAdjacentHTML(mo("idle"))
// 2. In renderProblem(): if a.borrow, after layout settles, call:
//      await animateBorrow({
//        tensTopEl: ws.querySelector(".row.top .cell:nth-child(1)"),
//        onesTopEl: ws.querySelector(".row.top .cell:nth-child(2)"),
//        newTensDigit: a.borrowFromTens,
//        newOnesValue: a.borrowedOnes,
//      });
// 3. No carry-slot needed (omit that markup).
//
// Copy add.js verbatim, apply the 3 differences above, save as src/screens/sub.js.
```

The engineer copies `src/screens/add.js` to `src/screens/sub.js`, then:
- Replaces `banji` import with `mo`; replaces `banji("idle")` insertion with `mo("idle")`.
- Removes the `<div class="carry-slot ...">` from `renderProblem`'s template.
- After building the worksheet HTML, if `a.borrow` is true, calls `animateBorrow({...})` (per code block above) before `setupDrag()`. Wrap in async/await so drag setup waits.
- Replaces the carry block in `onDrop` (the `flyCarry` call) with: nothing — the borrow is shown upfront, before any drops.

- [ ] **Step 2: Update router**

In `src/game.js`:

```js
import * as sub from "./screens/sub.js";
// inside router.go for "level":
if (ctx.world === "sub") this.current = sub.mount(stage, ctx, this);
```

- [ ] **Step 3: Manual verify**

From map → tap into Misty River L1. (Note: L1 is locked initially until Banana Hills L1 is cleared. To test, temporarily set `localStorage.setItem("bm.stars.add.1", "1")` in DevTools and reload, OR test by playing through Banana Hills first.) Subtraction worksheet loads with Mo in corner. Borrow problems show strikethrough + new tens digit + "10" chip drop. Player drops digits per the regrouped values.

- [ ] **Step 4: Commit**

```bash
git add src/screens/sub.js src/game.js
git commit -m "feat(screens): subtraction level with borrow animation"
```

---

### Task 28: Multiplication Tap-Count Screen

Per design.md section 3.5.

**Files:** Create `src/screens/mult-tap.js`.

- [ ] **Step 1: Create `src/screens/mult-tap.js`**

```js
import { getProblems, createAnswerState, dropDigit, isComplete } from "../logic.js";
import { createDragManager } from "../drag.js";
import { tilePickup, tileBounceBack, tileSnapIn, tapBlock, blockFlyIn } from "../animate.js";
import { home, pip, lilypad, firefly } from "../svg.js";
import { sfx } from "../audio.js";

export function mount(stage, ctx, router) {
  const { world, level } = ctx;
  stage.dataset.world = "mult";
  const problems = getProblems(world, level);
  let idx = 0;
  let totalWrong = 0;
  let state = null;
  let dragMgr = null;
  let globalCount = 0;
  let tappedSet = new Set();

  const sec = document.createElement("section");
  sec.className = "screen active";
  sec.id = "screen-mult-tap";

  sec.innerHTML = `
    <div class="topbar">
      <button class="home-btn small"></button>
      <div class="progress-dots"></div>
    </div>
    <div class="mult-problem"></div>
    <div class="firefly-area"></div>
    <div class="total-reveal hidden"><span class="display">TOTAL</span><div class="ans-slot-host"></div></div>
    <div class="digit-tray"></div>
    <div class="corner-mascot"></div>
  `;
  sec.querySelector(".home-btn").insertAdjacentHTML("beforeend", home());
  sec.querySelector(".home-btn").addEventListener("pointerup", () => router.go("map"));
  sec.querySelector(".corner-mascot").insertAdjacentHTML("beforeend", pip("idle"));

  renderProgressDots();
  renderProblem();

  function renderProgressDots() {
    const d = sec.querySelector(".progress-dots");
    d.innerHTML = "";
    for (let i = 0; i < 5; i++) {
      const dot = document.createElement("span");
      dot.className = "dot" + (i < idx ? " filled" : i === idx ? " current" : "");
      d.appendChild(dot);
    }
  }

  function renderProblem() {
    const p = problems[idx];
    state = createAnswerState(p.answer);
    globalCount = 0;
    tappedSet.clear();

    const probEl = sec.querySelector(".mult-problem");
    probEl.innerHTML = `
      <div class="op-chip display">${p.a}</div>
      <div class="op-sym display">×</div>
      <div class="op-chip display">${p.b}</div>
      <div class="op-sym display">=</div>
      <div class="op-chip q display">?</div>
    `;

    const area = sec.querySelector(".firefly-area");
    area.innerHTML = "";
    const blockEls = [];
    for (let g = 0; g < p.a; g++) {
      const pad = document.createElement("div");
      pad.className = "lily-group";
      pad.insertAdjacentHTML("beforeend", lilypad());
      const blocks = document.createElement("div");
      blocks.className = "block-grid";
      for (let i = 0; i < p.b; i++) {
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
    blockFlyIn(blockEls);

    const reveal = sec.querySelector(".total-reveal");
    reveal.classList.add("hidden");
    sec.querySelector(".digit-tray").innerHTML = "";
  }

  function onBlockTap(wrap) {
    const id = `${wrap.dataset.groupIndex}-${wrap.dataset.blockIndex}`;
    if (tappedSet.has(id)) { sfx.mascotChirp(); return; }
    tappedSet.add(id);
    globalCount++;
    tapBlock(wrap, globalCount);

    const total = problems[idx].answer;
    if (globalCount === total) {
      showReveal();
    }
  }

  function showReveal() {
    const reveal = sec.querySelector(".total-reveal");
    const host = reveal.querySelector(".ans-slot-host");
    host.innerHTML = "";
    if (state.slots.length === 2) host.insertAdjacentHTML("beforeend", '<div class="slot inactive" data-index="0"></div>');
    host.insertAdjacentHTML("beforeend", `<div class="slot active" data-index="${state.slots.length - 1}"></div>`);
    reveal.classList.remove("hidden");
    reveal.animate([{ opacity: 0, transform: "translateY(20px) scale(0.9)" }, { opacity: 1, transform: "translateY(0) scale(1)" }],
      { duration: 400, easing: "cubic-bezier(0.34,1.6,0.5,1)", fill: "forwards" });

    const tray = sec.querySelector(".digit-tray");
    tray.innerHTML = "";
    for (let n = 0; n <= 9; n++) {
      const t = document.createElement("div");
      t.className = "tile";
      t.dataset.digit = String(n);
      t.textContent = String(n);
      tray.appendChild(t);
    }
    setupDrag();
  }

  function setupDrag() {
    dragMgr = createDragManager({
      getTargets() {
        return Array.from(sec.querySelectorAll(".slot")).map((el) => ({
          el, rect: el.getBoundingClientRect(),
          active: el.classList.contains("active"),
          id: el.dataset.index,
        }));
      },
      onPickup(payload, el) { tilePickup(el); },
      async onDrop(payload, target, sourceEl, origin) {
        if (!target) return tileBounceBack(sourceEl, origin);
        const next = dropDigit(state, payload.digit, parseInt(target.id, 10));
        if (!next.lastDropCorrect) {
          totalWrong++; state = next;
          await tileBounceBack(sourceEl, origin);
          return;
        }
        state = next;
        await tileSnapIn(sourceEl, target.el);
        if (isComplete(state)) {
          idx++;
          renderProgressDots();
          if (idx >= problems.length) {
            router.go("complete", { world, level, wrongCount: totalWrong });
            return;
          }
          sfx.transition();
          setTimeout(renderProblem, 500);
        } else {
          sec.querySelectorAll(".slot").forEach((el) => {
            const i = parseInt(el.dataset.index, 10);
            el.classList.remove("active", "inactive");
            if (i === state.activeIndex) el.classList.add("active");
            else if (!el.classList.contains("filled")) el.classList.add("inactive");
          });
        }
        renderTrayListeners();
      },
    });
    renderTrayListeners();
  }

  function renderTrayListeners() {
    sec.querySelectorAll(".tile").forEach((tile) => {
      tile.onpointerdown = (e) => dragMgr.start(e, tile, { digit: parseInt(tile.dataset.digit, 10) });
    });
  }

  stage.appendChild(sec);
  return () => sec.remove();
}
```

- [ ] **Step 2: CSS (append `src/style.css`)**

```css
#screen-mult-tap, #screen-mult-drag { background: var(--world-sky); }
.mult-problem {
  position: absolute; top: 100px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 16px; align-items: center;
  font-family: 'Lilita One', system-ui;
}
.op-chip {
  width: 120px; height: 130px; background: var(--bg-card);
  border: 4px solid var(--ink); border-radius: var(--r-lg);
  display: flex; align-items: center; justify-content: center;
  font-size: 96px; box-shadow: var(--sh-2);
}
.op-chip.q { border-style: dashed; background: transparent; animation: slotPulse 1.8s var(--ease-soft) infinite; }
.op-sym { font-size: 80px; color: var(--ink); }
.firefly-area {
  position: absolute; top: 270px; left: 80px; width: 1120px; height: 280px;
  display: flex; gap: 80px; justify-content: center; align-items: center;
}
.lily-group { position: relative; width: 320px; height: 280px; }
.lily-group svg.lilypad { position: absolute; inset: 0; }
.block-grid {
  position: absolute; inset: 0;
  display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr);
  place-items: center; gap: 12px; padding: 40px;
}
.total-reveal {
  position: absolute; top: 580px; left: 50%; transform: translateX(-50%);
  width: 380px; height: 110px;
  background: var(--bg-card); border: 4px solid var(--ink); border-radius: var(--r-lg);
  display: flex; align-items: center; justify-content: center; gap: 16px;
  box-shadow: var(--sh-2);
}
.total-reveal.hidden { display: none; }
.total-reveal .display { font-size: 36px; }
.ans-slot-host { display: flex; gap: 8px; }
```

- [ ] **Step 3: Update router**

```js
import * as multTap from "./screens/mult-tap.js";
// inside "level":
if (ctx.world === "mult" && ctx.level <= 3) this.current = multTap.mount(stage, ctx, this);
```

- [ ] **Step 4: Manual verify**

(Force-unlock by setting bm.stars in localStorage.) Open mult L1. 2 lily-pads each with 1 firefly. Tap each → count badge appears, glow blooms, count rises (1, 2). Reveal panel appears. Drag "2" into the slot → correct → next problem. Re-tap a lit firefly → soft chirp, no recount.

- [ ] **Step 5: Commit**

```bash
git add src/screens/mult-tap.js src/style.css src/game.js
git commit -m "feat(screens): multiplication tap-count level"
```

---

### Task 29: Multiplication Drag-Groups Screen

Per design.md section 3.6.

**Files:** Create `src/screens/mult-drag.js`.

- [ ] **Step 1: Create `src/screens/mult-drag.js`**

```js
import { getProblems, createAnswerState, dropDigit, isComplete } from "../logic.js";
import { createDragManager } from "../drag.js";
import { tilePickup, tileBounceBack, tileSnapIn } from "../animate.js";
import { home, pip, mango } from "../svg.js";
import { sfx } from "../audio.js";

export function mount(stage, ctx, router) {
  const { world, level } = ctx;
  stage.dataset.world = "mult";
  const problems = getProblems(world, level);
  let idx = 0;
  let totalWrong = 0;
  let state = null;
  let dragMgr = null;
  const groupContents = []; // [{filled: number, needed: number}, ...]

  const sec = document.createElement("section");
  sec.className = "screen active";
  sec.id = "screen-mult-drag";
  sec.innerHTML = `
    <div class="topbar">
      <button class="home-btn small"></button>
      <div class="progress-dots"></div>
    </div>
    <div class="mult-problem"></div>
    <div class="group-row"></div>
    <div class="block-pile"></div>
    <div class="ans-host hidden"><span class="display">HOW MANY TOTAL?</span><div class="ans-slot-host"></div></div>
    <div class="digit-tray hidden"></div>
    <div class="corner-mascot"></div>
  `;
  sec.querySelector(".home-btn").insertAdjacentHTML("beforeend", home());
  sec.querySelector(".home-btn").addEventListener("pointerup", () => router.go("map"));
  sec.querySelector(".corner-mascot").insertAdjacentHTML("beforeend", pip("idle"));

  renderProgressDots();
  renderProblem();

  function renderProgressDots() {
    const d = sec.querySelector(".progress-dots"); d.innerHTML = "";
    for (let i = 0; i < 5; i++) {
      const dot = document.createElement("span");
      dot.className = "dot" + (i < idx ? " filled" : i === idx ? " current" : "");
      d.appendChild(dot);
    }
  }

  function renderProblem() {
    const p = problems[idx];
    state = createAnswerState(p.answer);
    groupContents.length = 0;

    sec.querySelector(".mult-problem").innerHTML = `
      <div class="op-chip display">${p.a}</div>
      <div class="op-sym display">×</div>
      <div class="op-chip display">${p.b}</div>
      <div class="op-sym display">=</div>
      <div class="op-chip q display">?</div>
    `;

    const row = sec.querySelector(".group-row");
    row.innerHTML = "";
    for (let g = 0; g < p.a; g++) {
      const tray = document.createElement("div");
      tray.className = "group-tray";
      tray.dataset.idx = String(g);
      for (let i = 0; i < p.b; i++) {
        const ghost = document.createElement("div");
        ghost.className = "ghost";
        tray.appendChild(ghost);
      }
      const chip = document.createElement("div");
      chip.className = "count-chip";
      chip.textContent = `0 / ${p.b}`;
      tray.appendChild(chip);
      row.appendChild(tray);
      groupContents.push({ filled: 0, needed: p.b });
    }

    const pile = sec.querySelector(".block-pile");
    pile.innerHTML = "";
    const extra = 3;
    for (let i = 0; i < p.a * p.b + extra; i++) {
      const wrap = document.createElement("div");
      wrap.className = "block-host idle-wobble";
      wrap.style.transform = `rotate(${(Math.random()-0.5)*16}deg)`;
      wrap.insertAdjacentHTML("beforeend", mango());
      wrap.onpointerdown = (e) => dragMgr.start(e, wrap, { kind: "block" });
      pile.appendChild(wrap);
    }

    sec.querySelector(".ans-host").classList.add("hidden");
    sec.querySelector(".digit-tray").classList.add("hidden");

    dragMgr = createDragManager({
      getTargets() {
        return Array.from(sec.querySelectorAll(".group-tray")).map((el) => ({
          el, rect: el.getBoundingClientRect(),
          active: groupContents[parseInt(el.dataset.idx, 10)].filled < groupContents[parseInt(el.dataset.idx, 10)].needed,
          id: el.dataset.idx,
        })).concat(Array.from(sec.querySelectorAll(".slot")).map((el) => ({
          el, rect: el.getBoundingClientRect(),
          active: el.classList.contains("active"),
          id: "slot-" + el.dataset.index,
        })));
      },
      onPickup(_p, el) { sfx.tilePickup(); el.classList.add("dragging"); },
      async onDrop(payload, target, sourceEl, origin) {
        if (payload.kind === "block") {
          if (!target || !target.id || target.id.startsWith("slot-")) {
            sourceEl.classList.remove("dragging");
            return tileBounceBack(sourceEl, origin);
          }
          const gIdx = parseInt(target.id, 10);
          const gc = groupContents[gIdx];
          if (gc.filled >= gc.needed) {
            sourceEl.classList.remove("dragging");
            return tileBounceBack(sourceEl, origin);
          }
          // Snap into next ghost slot
          const tray = target.el;
          const ghosts = tray.querySelectorAll(".ghost");
          const slot = ghosts[gc.filled];
          const slotRect = slot.getBoundingClientRect();
          sourceEl.classList.remove("dragging", "idle-wobble");
          sourceEl.classList.add("in-group");
          sourceEl.style.position = "absolute";
          sourceEl.style.left = `${slotRect.left}px`;
          sourceEl.style.top = `${slotRect.top}px`;
          tray.appendChild(sourceEl);
          gc.filled++;
          tray.querySelector(".count-chip").textContent = `${gc.filled} / ${gc.needed}`;
          sfx.trayFull();
          if (gc.filled === gc.needed) {
            tray.classList.add("full");
            tray.querySelector(".count-chip").innerHTML = `★ ${gc.needed}`;
          }
          if (groupContents.every((g) => g.filled === g.needed)) {
            setTimeout(showAnswerPhase, 800);
          }
        } else if (payload.kind === "digit") {
          if (!target || !target.id?.startsWith("slot-")) return tileBounceBack(sourceEl, origin);
          const slotIndex = parseInt(target.id.replace("slot-", ""), 10);
          const next = dropDigit(state, payload.digit, slotIndex);
          if (!next.lastDropCorrect) {
            totalWrong++; state = next;
            return tileBounceBack(sourceEl, origin);
          }
          state = next;
          await tileSnapIn(sourceEl, target.el);
          if (isComplete(state)) {
            idx++; renderProgressDots();
            if (idx >= problems.length) {
              router.go("complete", { world, level, wrongCount: totalWrong });
            } else {
              sfx.transition();
              setTimeout(renderProblem, 500);
            }
          } else {
            sec.querySelectorAll(".slot").forEach((el) => {
              const i = parseInt(el.dataset.index, 10);
              el.classList.remove("active", "inactive");
              if (i === state.activeIndex) el.classList.add("active");
              else if (!el.classList.contains("filled")) el.classList.add("inactive");
            });
          }
        }
      },
    });
  }

  function showAnswerPhase() {
    sec.querySelector(".group-row").animate([{ opacity: 1 }, { opacity: 0.4 }],
      { duration: 400, fill: "forwards" });
    const host = sec.querySelector(".ans-host");
    const slotHost = host.querySelector(".ans-slot-host");
    slotHost.innerHTML = "";
    if (state.slots.length === 2) slotHost.insertAdjacentHTML("beforeend", '<div class="slot inactive" data-index="0"></div>');
    slotHost.insertAdjacentHTML("beforeend", `<div class="slot active" data-index="${state.slots.length - 1}"></div>`);
    host.classList.remove("hidden");

    const tray = sec.querySelector(".digit-tray");
    tray.classList.remove("hidden");
    tray.innerHTML = "";
    for (let n = 0; n <= 9; n++) {
      const t = document.createElement("div");
      t.className = "tile"; t.dataset.digit = String(n); t.textContent = String(n);
      t.onpointerdown = (e) => dragMgr.start(e, t, { kind: "digit", digit: n });
      tray.appendChild(t);
    }
  }

  stage.appendChild(sec);
  return () => sec.remove();
}
```

- [ ] **Step 2: CSS (append `src/style.css`)**

```css
.group-row {
  position: absolute; top: 220px; left: 100px; width: 1080px;
  display: flex; gap: 60px; justify-content: center;
}
.block-pile {
  position: absolute; top: 540px; left: 100px; width: 1080px; height: 160px;
  display: flex; flex-wrap: wrap; gap: 12px;
  background: var(--bg-card); border: 4px solid var(--ink); border-radius: var(--r-lg);
  padding: 24px; align-items: center; justify-content: center;
}
.ans-host {
  position: absolute; top: 220px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 16px; align-items: center;
  background: var(--bg-card); border: 4px solid var(--ink); border-radius: var(--r-lg);
  padding: 16px 24px; box-shadow: var(--sh-2);
}
.ans-host.hidden { display: none; }
.digit-tray.hidden { display: none; }
```

- [ ] **Step 3: Update router**

```js
import * as multDrag from "./screens/mult-drag.js";
if (ctx.world === "mult" && ctx.level >= 4) this.current = multDrag.mount(stage, ctx, this);
```

- [ ] **Step 4: Manual verify**

Force unlock to mult L4. "Make 3 groups of 4" appears. 15 mangoes in pile. Drag mango → snaps into next empty ghost. Tray flips to "★ 4" when full. All trays full → answer panel rises, digit tray fades in. Drag digits to complete.

- [ ] **Step 5: Commit**

```bash
git add src/screens/mult-drag.js src/style.css src/game.js
git commit -m "feat(screens): multiplication drag-groups level"
```

---

### Task 30: Level Complete Screen

Per design.md section 3.7.

**Files:** Create `src/screens/complete.js`.

- [ ] **Step 1: Create `src/screens/complete.js`**

```js
import { starsFor, recordStars } from "../logic.js";
import { revealStars, burstConfetti, mascotCelebrate } from "../animate.js";
import { sfx } from "../audio.js";
import { star, banji, mo, pip, home } from "../svg.js";

export function mount(stage, ctx, router) {
  const { world, level, wrongCount } = ctx;
  stage.dataset.world = world;
  const stars = starsFor(wrongCount);
  recordStars(localStorage, world, level, stars);

  const sec = document.createElement("section");
  sec.className = "screen active";
  sec.id = "screen-complete";

  sec.innerHTML = `
    <h1 class="complete-title display">LEVEL CLEAR!</h1>
    <div class="star-meter big">
      ${star(false)}${star(false)}${star(false)}
    </div>
    <div class="complete-mascot"></div>
    <div class="complete-buttons">
      <button class="btn ghost" data-act="again">↻ AGAIN</button>
      <button class="btn success" data-act="next">▶ NEXT</button>
      <button class="btn ghost" data-act="map">🏠 MAP</button>
    </div>
    <div class="confetti-host"></div>
  `;
  const mascotEl = sec.querySelector(".complete-mascot");
  const m = world === "add" ? banji : world === "sub" ? mo : pip;
  mascotEl.insertAdjacentHTML("beforeend", m("idle"));

  // Disable next if no next level
  if (level >= 6) sec.querySelector('[data-act="next"]').classList.add("disabled");

  sec.querySelector(".complete-buttons").addEventListener("pointerup", (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "again") { sfx.transition(); router.go("level", { world, level }); }
    if (act === "next" && level < 6) { sfx.transition(); router.go("level", { world, level: level + 1 }); }
    if (act === "map")  { sfx.transition(); router.go("map"); }
  });

  stage.appendChild(sec);

  // Sequence: confetti immediately, stars reveal, mascot celebrate
  const confettiHost = sec.querySelector(".confetti-host");
  burstConfetti(confettiHost, 80);
  sfx.levelComplete();
  const starEls = sec.querySelectorAll(".star-meter .star");
  starEls.forEach((s) => s.classList.remove("filled", "earned"));
  revealStars(starEls, stars).then(() => mascotCelebrate(mascotEl.querySelector("svg")));

  return () => sec.remove();
}
```

- [ ] **Step 2: CSS (append `src/style.css`)**

```css
#screen-complete { background: var(--world-sky); }
.complete-title {
  position: absolute; top: 80px; left: 50%; transform: translateX(-50%);
  font-size: 96px; text-shadow: 0 4px 0 var(--world-primary);
}
#screen-complete .star-meter.big {
  position: absolute; top: 200px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 48px;
}
.complete-mascot {
  position: absolute; top: 380px; left: 50%; transform: translateX(-50%);
  width: 320px; height: 320px;
}
.complete-mascot svg { width: 100%; height: 100%; }
.complete-buttons {
  position: absolute; bottom: 60px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 24px;
}
.confetti-host { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
```

- [ ] **Step 3: Update router**

```js
import * as complete from "./screens/complete.js";
if (name === "complete") this.current = complete.mount(stage, ctx, this);
```

- [ ] **Step 4: Manual verify**

Play through any 5-problem level. Complete screen shows: title, 3 star slots, mascot, 3 buttons, confetti. Stars reveal one-by-one with dings. Next button advances if not L6. Again replays the same level. Map returns to world map.

- [ ] **Step 5: Commit**

```bash
git add src/screens/complete.js src/style.css src/game.js
git commit -m "feat(screens): level complete with star reveal and confetti"
```

---

## Phase 8: Polish

### Task 31: Wrong-Answer Hint Across All Level Screens

Task 26 (addition) implemented the hint pattern (`trayWrongOnCurrentSlot`, `applyHint()`, dim-other-tiles after 2 wrongs). Subtraction and multiplication screens need the same pattern.

**Files:** Modify `src/screens/sub.js`, `src/screens/mult-tap.js`, `src/screens/mult-drag.js`.

- [ ] **Step 1: Port hint logic to sub.js**

Copy the `trayWrongOnCurrentSlot`, `syncTrayDim()`, and `applyHint()` functions from `src/screens/add.js` into `src/screens/sub.js`. Call `syncTrayDim()` after every problem render and after each correct drop. Increment `trayWrongOnCurrentSlot` in the wrong-drop branch and call `applyHint()` when it reaches 2.

- [ ] **Step 2: Port hint logic to mult-tap.js and mult-drag.js**

Same pattern. In `src/screens/mult-tap.js`, hint only kicks in during the answer-entry phase (after `showReveal()`). In `src/screens/mult-drag.js`, hint only during the digit-answer phase (after `showAnswerPhase()`).

- [ ] **Step 3: Manual verify**

Play subtraction L1, deliberately drop wrong digits twice — hint should dim non-matching tiles. Same for both multiplication variants.

- [ ] **Step 4: Commit**

```bash
git add src/screens/sub.js src/screens/mult-tap.js src/screens/mult-drag.js
git commit -m "feat(polish): two-wrongs hint across all level screens"
```

---

## Phase 9: Wiring

### Task 32: Final Router + State Model + Persistence Integration

Replace the inline router stub in `src/game.js` with a clean router that loads progress on each map mount and handles all routes.

**Files:** Modify `src/game.js`.

- [ ] **Step 1: Replace `src/game.js` body**

```js
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

function fitStage() {
  const scale = Math.min(viewport.clientWidth / 1280, viewport.clientHeight / 800);
  stage.style.transform = `scale(${scale})`;
}
window.addEventListener("resize", fitStage);
window.addEventListener("orientationchange", fitStage);
fitStage();

const state = { progress: loadProgress() };

const router = {
  current: null,
  go(name, ctx = {}) {
    if (this.current) this.current();
    let unmount;
    switch (name) {
      case "splash":   unmount = splash.mount(stage, state, this); break;
      case "map":      state.progress = loadProgress();
                       unmount = map.mount(stage, state, this); break;
      case "level":
        if (ctx.world === "add") unmount = add.mount(stage, ctx, this);
        else if (ctx.world === "sub") unmount = sub.mount(stage, ctx, this);
        else if (ctx.world === "mult" && ctx.level <= 3) unmount = multTap.mount(stage, ctx, this);
        else if (ctx.world === "mult" && ctx.level >= 4) unmount = multDrag.mount(stage, ctx, this);
        break;
      case "complete": unmount = complete.mount(stage, ctx, this); break;
      case "settings": unmount = settings.mount(stage, state, this); break;
      default: console.warn("Unknown route:", name);
    }
    this.current = unmount;
  },
};

router.go("splash");
window.__router = router;
```

- [ ] **Step 2: Manual verify**

Full route exercise: splash → map → addition L1 → complete → map → subtraction L1 (force-unlocked) → complete → mult L1 → complete. Stars persist across reloads (DevTools → Application → Local Storage shows `bm.stars.*` keys).

- [ ] **Step 3: Commit**

```bash
git add src/game.js
git commit -m "feat(wiring): clean router with all screens and persistence"
```

---

### Task 33: Settings Panel + Parent Gate

Per design.md section 3.1.

**Files:** Create `src/screens/settings.js`.

- [ ] **Step 1: Create `src/screens/settings.js`**

```js
import { isEnabled, setEnabled } from "../audio.js";

export function mount(stage, state, router) {
  const sec = document.createElement("section");
  sec.className = "screen active";
  sec.id = "screen-settings";
  sec.innerHTML = `
    <div class="parent-gate-card">
      <h2 class="display">PARENTS ONLY</h2>
      <p>Tap the answer to <span id="pg-q"></span></p>
      <div class="pg-buttons"></div>
      <div class="pg-error hidden">Try again</div>
    </div>
  `;
  const a = 2 + Math.floor(Math.random() * 7);
  const b = 1 + Math.floor(Math.random() * 6);
  const c = 1 + Math.floor(Math.random() * 5);
  const answer = a + b + c;
  sec.querySelector("#pg-q").textContent = `${a} + ${b} + ${c} = ?`;
  const btnHost = sec.querySelector(".pg-buttons");
  const options = new Set([answer]);
  while (options.size < 4) options.add(answer + (Math.floor(Math.random() * 7) - 3) || answer + 1);
  [...options].sort(() => Math.random() - 0.5).forEach((n) => {
    const b2 = document.createElement("button");
    b2.className = "btn ghost"; b2.textContent = String(n);
    b2.addEventListener("pointerup", () => {
      if (n === answer) showSettings();
      else { sec.querySelector(".pg-error").classList.remove("hidden"); b2.classList.add("disabled"); }
    });
    btnHost.appendChild(b2);
  });

  function showSettings() {
    sec.innerHTML = `
      <div class="settings-card">
        <h2 class="display">SETTINGS</h2>
        <button class="btn" id="toggle-sound">SOUND: ${isEnabled() ? "ON" : "OFF"}</button>
        <button class="btn ghost" id="reset-progress">RESET PROGRESS</button>
        <button class="btn ghost" id="close-settings">CLOSE</button>
      </div>
    `;
    sec.querySelector("#toggle-sound").addEventListener("pointerup", (e) => {
      setEnabled(!isEnabled());
      e.target.textContent = `SOUND: ${isEnabled() ? "ON" : "OFF"}`;
    });
    sec.querySelector("#reset-progress").addEventListener("pointerup", () => {
      if (confirm("Reset all progress? This cannot be undone.")) {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && k.startsWith("bm.stars.")) localStorage.removeItem(k);
        }
        router.go("splash");
      }
    });
    sec.querySelector("#close-settings").addEventListener("pointerup", () => router.go("splash"));
  }

  stage.appendChild(sec);
  return () => sec.remove();
}
```

- [ ] **Step 2: CSS (append `src/style.css`)**

```css
#screen-settings { background: rgba(0,0,0,.4); display: flex; align-items: center; justify-content: center; }
.parent-gate-card, .settings-card {
  background: var(--bg-card);
  border: 5px solid var(--ink);
  border-radius: var(--r-lg);
  padding: 48px 64px; text-align: center;
  min-width: 600px; box-shadow: var(--sh-3);
}
.parent-gate-card h2, .settings-card h2 { font-size: 48px; margin: 0 0 24px; }
.parent-gate-card p { font-size: 28px; margin: 0 0 24px; font-weight: 700; }
.pg-buttons { display: flex; gap: 16px; justify-content: center; }
.pg-buttons .btn { min-width: 120px; height: 90px; font-size: 48px; }
.pg-error { margin-top: 16px; color: var(--gentle-no); font-weight: 900; }
.pg-error.hidden { display: none; }
.settings-card .btn { display: block; margin: 16px auto; min-width: 400px; }
```

- [ ] **Step 3: Manual verify**

From splash, long-press cog 1.5s → parent gate appears. Tap wrong answer → "Try again", button greys. Tap correct → settings panel. Sound toggle silences sfx. Reset progress → confirm → all bm.stars cleared, returns to splash.

- [ ] **Step 4: Commit**

```bash
git add src/screens/settings.js src/style.css
git commit -m "feat(wiring): settings panel with parent gate"
```

---

### Task 34: Full Playthrough QA + Bug Fixes

The engineer plays the game end-to-end and fixes anything that doesn't match design.md or feel right. Each defect → focused commit.

- [ ] **Step 1: Desktop Chrome playthrough**

`bun run dev`. Play 6 addition → 6 subtraction → 6 multiplication. For each, note any:
- Layout overflow or misalignment
- Audio glitches or missing sounds
- Animation timing too slow / too fast
- Drag breaks (stuck tile, slot not activating)
- Carry/borrow misfires
- Star scoring inconsistent with thresholds
- Persistence not surviving reload

- [ ] **Step 2: Tablet verification (if available)**

Edit `dev.js` to bind to `0.0.0.0` and print the LAN IP. From the tablet's Chrome visit `http://<lan-ip>:5173`. Verify:
- Touch + S Pen both drag correctly
- Audio plays after first tap (Chrome's autoplay gate)
- Letterboxing centers properly in landscape
- No accidental text-select or zoom

- [ ] **Step 3: Fix each defect with a focused commit**

For each issue: find root cause, fix, verify, commit. Don't bundle unrelated fixes.

- [ ] **Step 4: Final QA commit when clean**

```bash
git commit --allow-empty -m "qa: full playthrough verified end-to-end"
```

---

## Phase 10: Deploy

### Task 35: Single-File Bundle + Deployment

Optional but recommended: produce a single `dist/index.html` for offline / file:// use.

**Files:** Create `build.js`, `DEPLOY.md`.

- [ ] **Step 1: Create `build.js` (inliner)**

Use `bunx esbuild` for the JS bundling (robust handling of ES modules) and inline the resulting bundle + CSS into the HTML shell:

```js
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const SRC = "src";
const OUT = "dist";
mkdirSync(OUT, { recursive: true });

// Bundle JS via esbuild
const bundled = spawnSync("bunx", ["esbuild", "src/game.js", "--bundle", "--format=iife", "--target=es2020"], { encoding: "utf8" });
if (bundled.status !== 0) {
  console.error(bundled.stderr);
  process.exit(1);
}
const js = bundled.stdout;

const html = readFileSync(join(SRC, "index.html"), "utf8");
const css  = readFileSync(join(SRC, "style.css"), "utf8");

let out = html;
out = out.replace(/<link rel="stylesheet" href="style\.css"\s*\/>/, `<style>\n${css}\n</style>`);
out = out.replace(/<script type="module" src="game\.js"><\/script>/, `<script>\n${js}\n</script>`);

writeFileSync(join(OUT, "index.html"), out, "utf8");
console.log(`Wrote ${OUT}/index.html (${Math.round(out.length / 1024)} KB)`);
```

Install esbuild as a dev dep: `bun add -d esbuild`.

- [ ] **Step 2: Run the build and verify**

```bash
bun build.js
```

Expected: `dist/index.html` created, around 150-300 KB. Open it directly via `file://` in Chrome to confirm it works offline (audio still requires the user-tap unlock).

- [ ] **Step 3: Create `DEPLOY.md`**

```markdown
# Deployment

## Option A — Cloudflare Pages (recommended)
1. Push repo to GitHub.
2. cloudflare.com → Pages → Create → connect repo.
3. Build command: `bun build.js`. Output dir: `dist`.
4. Bookmark `https://<your-pages>.pages.dev` on the tablet.
5. Chrome → "Add to home screen" for app-like launch.

## Option B — Local file (offline)
1. `bun build.js` locally.
2. Transfer `dist/index.html` to the tablet via USB, Drive, or email.
3. Open in Chrome — works offline since everything is inlined.

## Option C — LAN dev (for testing)
1. Edit `dev.js`: bind to `0.0.0.0` and print your LAN IP.
2. `bun run dev`. From the tablet's Chrome, visit `http://<lan-ip>:5173`.
```

- [ ] **Step 4: Commit**

```bash
git add build.js DEPLOY.md dist/ package.json
git commit -m "feat(build): single-file bundle and deployment guide"
```

---

## Plan Self-Review Checklist

Before marking complete, confirm:

- [ ] Every section of design.md (1-8) maps to at least one task implementing it
- [ ] Right-to-left answer entry works in addition, subtraction, and both multiplication variants
- [ ] Carry triggers only when ones-sum ≥ 10; borrow only when top-ones < bottom-ones
- [ ] Star scoring uses tuned thresholds (0-1/2-4/5+ → 3/2/1)
- [ ] localStorage persists across browser refresh
- [ ] Audio synthesis matches design.md section 6
- [ ] All 3 mascots render and animate
- [ ] All 4 block types exist (banana, coconut, mango, firefly)
- [ ] Smart tray dimming + two-wrongs hint works everywhere
- [ ] Settings panel is parent-gated; reset and sound-toggle work
- [ ] Confetti, star reveal, level-complete fanfare play on completion
- [ ] World map shows lock/unlock correctly and pulses unlocked nodes
- [ ] No console errors at any point during a full playthrough

