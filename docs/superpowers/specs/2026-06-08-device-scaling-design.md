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

On near-square screens, show the **full landscape layout centered**, with the
surrounding space filled by a **themed background** so the bars read as an
intentional frame (this is how iPad landscape already looks). Chosen over a
full menu-screen reflow because it is robust, never overlaps, and is low-risk.

### Changes

1. **Lower the portrait threshold to 0.9** (`src/game.js`). Only genuinely tall
   screens use portrait stretch; near-square and wider use landscape letterbox.
   - Rationale: logical height = `720 / aspect`. Below ~750 logical px the tall
     menu screens overlap. Aspect 0.9 → 800 logical px (safe margin).
   - Effect: phones (≤0.63) and tablet-portrait (≤0.75) stay portrait, unchanged.
     Foldable-unfolded (~1.10, and ~0.91 when rotated) and every landscape tablet
     go landscape, intact and centered.

2. **Theme the letterbox area** so the bars look deliberate on big/near-square
   screens. The `#viewport` frame around the centered stage gets a soft themed
   fill (paper/sky tone) rather than a flat default. (Bars already show the paper
   tone; this just makes it intentional and consistent.)

3. **No max-scale cap.** Landscape continues to scale *up* to fill large tablets,
   which is desirable — the game uses the whole screen there.

### Out of scope (YAGNI)

- Rebuilding splash/map/menu screens to fill near-square screens edge-to-edge.
- Per-screen fluid layouts or a new orientation lock.

## Acceptance criteria

- **Find N5 unfolded** (1240×1124 and rotated 1124×1240): splash, map, gameplay,
  complete, and settings all render with no overlap/clipping — full landscape,
  centered, themed bars.
- **iPad** portrait (810×1080) + landscape (1080×810): unchanged-good.
- **Samsung tablet** portrait (800×1280) + landscape (1280×800): unchanged-good.
- **Phones** (320×568 SE … 430×932): unchanged-good (portrait stretch, no bars).
- Existing e2e suite still green — especially `e2e/portrait-reflow.spec.js` and the
  modernized mult specs.
- Confirmed with before/after screenshots at every device size above.

## Testing

- Extend `e2e/zz-devices.spec.js` (the device-fit capture harness) to also cover
  the complete and settings screens.
- Capture before/after at each target device; eyeball each frame.
- Run the existing portrait-reflow oracle + the green mult specs for regression.
- Build, commit, push (auto-deploy to live site).

## Files touched

- `src/game.js` — threshold constant + explaining comment.
- `src/index.html` (`#viewport` rule) — themed letterbox background.
- `e2e/zz-devices.spec.js` — extended device-fit coverage (test asset).
