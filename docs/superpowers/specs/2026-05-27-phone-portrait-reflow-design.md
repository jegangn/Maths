# Phone Portrait Reflow — Design

Make Jhanav's Math Adventure playable on phones of all sizes by adding a portrait layout. The game was designed for a Galaxy Tab S8 (1280×800 landscape) and currently scales via `transform: scale()` with letterboxing — which on a phone in portrait collapses the entire game to ~30% of the screen and makes touch targets unusable.

## Goal

When the device is held in portrait, the game reflows to a vertical layout instead of shrinking to a tiny letterboxed strip. Landscape (tablets, phones rotated sideways) continues working unchanged.

## Detection

`fitStage()` in `src/game.js` is the single source of truth for layout sizing. On load and on `resize` / `orientationchange`:

1. Compute `aspect = viewport.clientWidth / viewport.clientHeight`.
2. If `aspect < 1.2` → portrait. Set `#stage` to 720 × 1280, set `data-orient="portrait"` on `#stage`.
3. Else → landscape. Set `#stage` to 1280 × 800, set `data-orient="landscape"` on `#stage` (default, existing).
4. Compute scale: `min(vw / stageW, vh / stageH)`. Apply `transform: scale(scale)`.

If orientation changes after a screen is mounted, the active screen re-mounts so layout-sensitive code (anchored mascots, runtime-positioned chips) recomputes from the new canvas size.

## Logical canvas sizes

| Mode | Width | Height | Aspect | Rationale |
|---|---|---|---|---|
| Landscape (existing) | 1280 | 800 | 1.6 | Galaxy Tab S8 native fit |
| Portrait (new) | 720 | 1280 | 0.5625 (9:16) | Universal phone aspect. Modern phones (9:19+) letterbox top/bottom slightly. iPhone SE (9:16) fills exactly. |

## Per-screen reflow

All measurements below are in **portrait logical pixels** (720 wide × 1280 tall).

### Splash (`#screen-splash`)
- Title `BANJI MATH` — y=80, font-size 88 (unchanged), centered horizontally on 720 wide.
- Mascot — 320×320, centered, y=320.
- TAP TO PLAY button — pill variant, narrower (`min-width: 360`), centered, y=900.
- Settings cog — top-right, same 32px inset.

### World Map (`#screen-map`)
- Home button top-left, star meter top-right (same as landscape).
- World grid: switch from `grid-template-columns: repeat(3, 1fr)` (horizontal) to `repeat(1, 1fr)` (vertical), 3 rows.
- Each world panel: ~624 × 360 (16px margins, 24px row gap). Header bar 64px on top with world name; below it a horizontal 3×2 node grid (each node 80×80, gap 20px) instead of vertical 2×3.
- Path lines now run horizontally within each panel; total height fits 3 stacked panels + top bar (72) + bottom margin (32) = 1208 of 1280.

### Addition / Subtraction (`#screen-add`, `#screen-sub`)
- Top bar full-width at top (unchanged shape, fewer right-side items if needed).
- Worksheet centered horizontally; vertical column math is naturally portrait-friendly. Position: y=140, height ~540.
- Corner mascot moves from `bottom: 160; right: 32` to `top: 100; right: 24`, size 120×120 (was 180×180).
- Digit tray: same full-width pinned to bottom, height unchanged (120 single-row, 232 two-row).
- Two-row-active offset for corner mascot recalculated for portrait (`top` stays; tray height grows upward, no overlap).

### Multiplication tap-count (`#screen-mult-tap`)
- Problem chip row at top, y=120.
- 3 lily-pads stacked vertically: each 280×220, centered horizontally, gap 24px. Total area: y=260 to y=992.
- Fireflies inside lily-pads keep current sizes (block-grid already responsive to count).
- Total-reveal panel: y=1010, scaled to fit (340×100).
- Tray at bottom y=1140.

### Multiplication drag-groups (`#screen-mult-drag`)
- Problem at top, y=120.
- 3 group trays stacked vertically: each ~560×140 wide, gap 16px. Total y=240 to y=712.
- Block pile fills wider area: y=740, width=624, height=320, wraps blocks across multiple rows.
- Answer host (after groups complete): centered, y=1020.

### Complete (`#screen-complete`)
- Title at top y=80.
- 3 stars row centered, y=200, gap 24px.
- Mascot centered, 220×220, y=440.
- Buttons stacked vertically (was horizontal row): 3 buttons each 280×100, gap 16px, bottom-anchored. Total ~360 vertical.

### Settings (`#screen-settings`)
- Modal card `min-width: 600` becomes responsive: `width: min(600px, 92%)`. Padding shrinks at small sizes.

## Touch target sizing

Min iOS HIG target: 44pt physical. Min Android Material: 48dp.

On a 390px-wide phone, portrait scale = 390/720 = 0.54. A 96px digit tile renders at ~52px physical → above target. On smallest phones (iPhone SE, 320px wide), scale = 0.44 → tile = 42px physical → **below target**.

**Fix:** in portrait mode only, bump tiles and answer slots:
- `.tile` → 110×110 (was 96×96)
- `.slot` → 110×130 (was 100×120)
- Tray gap → 12px (was 16px) to fit 10 tiles across 720 wide.

On smallest phones this gives 110 × 0.44 = ~48px physical touch — meets target.

## Animation positions

Carry/borrow chips use `getBoundingClientRect()` for source/target positions at runtime, so they automatically follow whatever layout is active. No code change needed; just verify after reflow that the chip's `position: fixed` + viewport-space coords still land correctly when the stage is scaled differently.

## Out of scope

- Phones held in landscape (e.g. 844×390) — fall through to existing landscape mode. They will be small (~0.49 scale) but playable, same as today.
- Tablets in portrait — tablets aren't the target; if a tablet is held portrait, it gets the portrait reflow (which is fine, it'll be generous-sized).
- "Rotate me" prompts — not used. Game works in any orientation.
- Reflowing carry/borrow animations themselves (they already adapt).

## Implementation outline

1. **`src/game.js`** — extend `fitStage()` to compute orientation, set stage dimensions + `data-orient`, and re-mount active screen on orientation change.
2. **`src/style.css`** — add portrait blocks scoped by `#stage[data-orient="portrait"]` selectors for each screen. Bump `.tile` and `.slot` sizes inside portrait selector.
3. **No JS screen file changes expected** (CSS-only reflow) unless the corner mascot, world-panel grid, or block-grid lily-pads need explicit re-render hooks — verify per screen during implementation.
4. **Verify** on representative widths via DevTools device emulation: iPhone SE (320×568), iPhone 14 (390×844), Pixel 7 (412×915), iPad Mini portrait (768×1024).

## Confirmed decisions

1. Reflow to portrait layout (vs auto-rotate or "rotate me" overlay).
2. Portrait canvas: 720 × 1280.
3. Switch threshold: viewport aspect < 1.2.
4. Tiles/slots get larger in portrait so touch target lands above 44pt on smallest phones.
5. Landscape mode unchanged.
6. No orientation prompt; game flips layouts seamlessly on rotation.
