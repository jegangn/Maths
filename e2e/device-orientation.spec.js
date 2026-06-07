import { test, expect } from '@playwright/test';

/**
 * Orientation contract — which fixed layout each device resolves to.
 *
 * The stage runs ONE of two layouts, chosen by aspect ratio:
 *   - "portrait"  → 720-wide canvas stretched to the screen height (tall phones,
 *                    tablet-portrait). Menu screens are authored for ~720×1280.
 *   - "landscape" → the 1280×800 canvas scaled-to-fit and centered (tablet-
 *                    landscape, near-square foldables). Letterboxed, never cramped.
 *
 * Near-square foldables (Oppo Find N5 unfolded, ~1.10 / ~0.91 rotated) MUST use
 * landscape — in portrait they collapse to a ~650px-tall canvas the menu screens
 * overlap inside. This is the regression guard for that.
 */
const CASES = [
  // tall phones + tablet-portrait stay portrait (fill the screen, no bars)
  { w: 320, h: 568, orient: 'portrait', note: 'iPhone SE' },
  { w: 390, h: 844, orient: 'portrait', note: 'iPhone 14' },
  { w: 810, h: 1080, orient: 'portrait', note: 'iPad portrait (0.75)' },
  { w: 800, h: 1280, orient: 'portrait', note: 'Samsung Tab portrait (0.625)' },
  // near-square foldable — BOTH orientations must be landscape
  { w: 1240, h: 1124, orient: 'landscape', note: 'Find N5 unfolded (1.10)' },
  { w: 1124, h: 1240, orient: 'landscape', note: 'Find N5 unfolded, rotated (0.91)' },
  // landscape tablets stay landscape
  { w: 1080, h: 810, orient: 'landscape', note: 'iPad landscape (1.33)' },
  { w: 1280, h: 800, orient: 'landscape', note: 'Samsung Tab landscape (1.6)' },
];

for (const c of CASES) {
  test(`${c.note} @ ${c.w}x${c.h} → ${c.orient}`, async ({ page }) => {
    await page.setViewportSize({ width: c.w, height: c.h });
    await page.goto('/');
    await expect(page.locator('#stage')).toHaveAttribute('data-orient', c.orient);
  });
}
