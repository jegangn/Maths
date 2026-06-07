# Device Scaling — every phone, foldable, and tablet

**Date:** 2026-06-08
**Status:** Approved approach (awaiting spec sign-off)

## Goal

The game must render correctly — no overlap, clipping, or awkward voids — on every
device, specifically including the **Oppo Find N5 unfolded** (near-square inner
screen), **iPad** (portrait + landscape), and **Samsung tablets**.

## Root cause

`fitStage()` in `src/game.js` picks one of two fixed layouts by aspect ratio:

- **Portrait** — fixes width at 720 logical px, stretches height to the screen.
  Gameplay screens reflow to fit via `src/layout.js`.
- **Landscape** — the rich 1280×800 layout, scaled to fit and centered.

The split is decided by `PORTRAIT_ASPECT_THRESHOLD = 1.2`: anything with
`width/height < 1.2` is treated as portrait.

A **near-square** screen (foldable unfolded, aspect ~1.10) falls *just under* 1.2,
so it is forced into portrait mode. Portrait stretch then produces a **short
logical canvas**: logical height = `720 / aspect` ≈ **654 px** at aspect 1.10.
The menu/splash/map/complete/settings screens are authored for a tall 720×1280
canvas and **overlap and clip** at that height. (Gameplay screens survive because
`layout.js` reflows them.)

Observed on the Find N5 unfolded (captured `test-results/devices/before-*`):
- **Splash:** the word "MATH" is hidden behind the mascot; the mascot sits on top
  of the TAP TO PLAY button.
- **Map:** world names ("BANANA HILLS" …) are buried behind the level buttons;
  the star counter overflows the top edge.

Everything else already renders well: all phones (portrait), iPad portrait (0.75),
iPad/Samsung landscape (1.33–1.6), Samsung portrait (0.625).

## Approved approach — "Centered + themed bars"

Awkward aspect ratios show the nearest fixed design **scaled to fit and centered**,
with the surrounding space filled by a **themed background** so the bars read as
an intentional frame. Implemented as a **three-way fit** in `fitStage()`:

| Aspect (w/h) | Mode | Why |
|---|---|---|
| `< 0.65` | **Stretch portrait** (width 720, height stretched) | Tall phones; fills edge-to-edge, no bars. |
| `0.65 – 0.9` | **Fit portrait** (full 720×1280 design, scale-to-fit, side bars) | 4:3 tablets in portrait (iPad 0.75) are too short to stretch without cramping; fitting the 1280-tall design keeps proportions correct. |
| `≥ 0.9` | **Fit landscape** (1280×800 design, scale-to-fit) | Near-square foldables (Find N5: 1.10 / 0.91) and all landscape tablets. |

Boundaries: **0.9** keeps a near-square foldable off the short-portrait cliff;
**0.65** sits just above the tallest tablet that still stretches cleanly (Samsung
10:16 = 0.625) and below the 4:3 tablets (0.75) that cramp.

### Changes

1. **Three-way `fitStage()`** (`src/game.js`) per the table above — replaces the
   single stretch-vs-letterbox split.
2. **Themed letterbox** (`src/style.css`) — `#viewport` gets a soft paper-vignette
   backdrop and the stage a gentle frame shadow, so bars look deliberate. Only
   visible when letterboxed; full-bleed phones are untouched.
3. **No max-scale cap** — fit modes scale *up* to fill large tablets.

### Out of scope (YAGNI)

- Rebuilding splash/map/menu screens to fill awkward aspects edge-to-edge.
- Per-screen fluid layouts or a new orientation lock.

## Acceptance criteria

- **Find N5 unfolded** (1240×1124 and rotated 1124×1240): all screens render with
  no overlap/clipping — full landscape, centered, themed bars.
- **iPad / 4:3 tablet portrait** (810×1080, 1024×1366): full portrait design,
  scaled to fit with side bars — map titles clear of nodes, carry tray clear of
  the answer slots (both were cramped before).
- **iPad / Samsung landscape** (1080×810, 1280×800): intact, centered.
- **Samsung tablet portrait** (800×1280) + **phones** (320×568 … 430×932):
  unchanged-good (stretch portrait, no bars).
- Programmatic layout audit (`e2e/layout-audit.spec.js`): no-clip + no-overlap on
  every screen across 10 devices — all green.
- Drag-drop + carry confirmed functional in fit-portrait (`e2e/fit-portrait.spec.js`).
- Orientation contract green (`e2e/device-orientation.spec.js`).
- Pre-existing, unrelated to this change (diff is `game.js` + `style.css` only):
  2 quarantined sub-borrow specs; a few stale math-audit seed specs (add L2/L5,
  sub L3/L4/L6).

## Testing

- `e2e/layout-audit.spec.js` — asserts no-clip / no-overlap invariants per screen
  across 10 devices (the primary correctness oracle for this change).
- `e2e/device-orientation.spec.js` — orientation contract per device.
- `e2e/fit-portrait.spec.js` — drag-drop + carry play to completion at iPad portrait.
- `e2e/zz-devices.spec.js` — before/after screenshot harness (eyeball).
- Run on an isolated port to dodge the :5173 worktree squatter:
  `PORT=5273 bun ./dev.js` then `PORT=5273 bun run e2e`.

## Files touched

- `src/game.js` — three-way `fitStage()` + constants/comment.
- `src/style.css` — themed `#viewport` backdrop + stage frame shadow.
- `playwright.config.js` — port-parameterized baseURL (port-war isolation).
- `e2e/layout-audit.spec.js`, `e2e/device-orientation.spec.js`,
  `e2e/fit-portrait.spec.js` — new regression guards.
- `e2e/zz-devices.spec.js` — extended device-fit coverage.
