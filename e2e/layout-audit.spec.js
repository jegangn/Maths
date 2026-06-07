import { test, expect } from '@playwright/test';
import { unlockAll, goToLevel } from './helpers/math.js';

/**
 * Programmatic layout audit — proves every screen is clean on every device.
 *
 * For each (device × screen) it checks two invariants against the live DOM:
 *   1. NO-CLIP   — each key element's box sits fully inside the #stage box
 *                  (the stage is overflow:hidden, so anything past its edge is
 *                  silently clipped — that's the "stars overflow the top" bug).
 *   2. NO-OVERLAP — pairs that must never collide don't (e.g. splash title vs
 *                  mascot, map world-title vs level nodes — the foldable bugs).
 *
 * Run on an isolated port so a stale :5173 squatter can't poison it:
 *   PORT=5273 bun ./dev.js          # in one shell (background)
 *   PORT=5273 bun run e2e layout-audit
 */

// CSS-px viewports across the whole spectrum (dpr 1).
const DEVICES = [
  { tag: 'iphone-se', w: 320, h: 568 },     // shortest common phone
  { tag: 'iphone-14', w: 390, h: 844 },
  { tag: 'pixel-xl', w: 412, h: 915 },
  { tag: 'ipad-port', w: 810, h: 1080 },
  { tag: 'ipad-pro-port', w: 1024, h: 1366 },
  { tag: 'tab-port', w: 800, h: 1280 },
  { tag: 'foldN5-open', w: 1240, h: 1124 },  // near-square → landscape (the fix)
  { tag: 'foldN5-rot', w: 1124, h: 1240 },   // near-square rotated → landscape
  { tag: 'ipad-land', w: 1080, h: 810 },
  { tag: 'tab-land', w: 1280, h: 800 },
];

const SCREENS = [
  {
    name: 'splash',
    go: (p) => p.evaluate(() => window.__router.go('splash')),
    mustFit: ['.splash-title', '.splash-mascot', '.splash-play', '.cog-corner'],
    // The mascot must not sit on the PLAY button (that was the foldable bug).
    // Title/mascot is NOT checked — the mascot SVG has transparent top padding
    // its box includes, so a box-overlap there is invisible on screen.
    noOverlap: [['.splash-mascot', '.splash-play']],
  },
  {
    name: 'map',
    go: (p) => p.evaluate(() => window.__router.go('map')),
    mustFit: ['.home-btn', '.star-meter.total', '.world-panel', '.world-title', '.level-node'],
    noOverlap: [['.world-title', '.level-node']],
  },
  // Worksheet box is intentionally taller than its content (grid align-content:
  // start), so the box bottom can reach the tray with no visible collision —
  // we check the actual answer SLOTS against the tray instead of the box.
  {
    name: 'add-l1',
    go: (p) => goToLevel(p, 'add', 1),
    mustFit: ['.topbar', '.worksheet', '.digit-tray', '.corner-mascot'],
    noOverlap: [['.worksheet .slot', '.digit-tray'], ['.topbar', '.worksheet']],
  },
  {
    name: 'add-l3-carry',
    go: (p) => goToLevel(p, 'add', 3),
    mustFit: ['.topbar', '.worksheet', '.digit-tray', '.corner-mascot'],
    noOverlap: [['.worksheet .slot', '.digit-tray'], ['.topbar', '.worksheet']],
  },
  {
    name: 'sub-l1',
    go: (p) => goToLevel(p, 'sub', 1),
    mustFit: ['.topbar', '.worksheet', '.digit-tray', '.corner-mascot'],
    noOverlap: [['.worksheet .slot', '.digit-tray'], ['.topbar', '.worksheet']],
  },
  {
    name: 'mult-tap-l3',
    go: (p) => goToLevel(p, 'mult', 3),
    mustFit: ['.mult-problem', '.firefly-area', '.digit-tray'],
    noOverlap: [['.mult-problem', '.firefly-area'], ['.firefly-area', '.digit-tray']],
  },
  {
    name: 'mult-drag-l6',
    go: (p) => goToLevel(p, 'mult', 6),
    // Answer goes into the dashed slot inside .mult-problem (a×b=▢); the always-
    // present pieces are the problem row, the group trays, the mango pile, tray.
    mustFit: ['.mult-problem', '.group-row', '.block-pile', '.digit-tray'],
    noOverlap: [['.group-row', '.block-pile']],
  },
  {
    name: 'complete',
    go: (p) => p.evaluate(() => window.__router.go('complete', { world: 'mult', level: 3, wrongCount: 0 })),
    settle: 2600,
    mustFit: ['.complete-title', '.star-meter.big', '.complete-mascot', '.complete-buttons'],
    noOverlap: [['.complete-title', '.star-meter.big'], ['.complete-mascot', '.complete-buttons']],
  },
  {
    name: 'settings',
    go: (p) => p.evaluate(() => window.__router.go('settings')),
    mustFit: ['.parent-gate-card'],
    noOverlap: [],
  },
];

// Freeze animations so getBoundingClientRect reads settled positions.
async function freeze(page) {
  await page.evaluate(() => {
    let st = document.getElementById('kill-anim');
    if (!st) {
      st = document.createElement('style');
      st.id = 'kill-anim';
      st.textContent = '*,*::before,*::after{animation:none!important;transition:none!important;}';
      document.head.appendChild(st);
    }
    document.getAnimations().forEach((a) => { try { a.finish(); } catch (e) { try { a.cancel(); } catch (_) {} } });
  });
}

// Runs entirely in the page; returns an array of human-readable violation strings.
async function audit(page, screen) {
  return page.evaluate(({ name, mustFit, noOverlap }) => {
    const TOL = 2; // physical px — absorbs sub-pixel rounding from the stage transform
    const stage = document.getElementById('stage');
    const sr = stage.getBoundingClientRect();
    const out = [];
    const round = (r) => `${Math.round(r.left)},${Math.round(r.top)}→${Math.round(r.right)},${Math.round(r.bottom)}`;

    const visible = (sel) => Array.from(document.querySelectorAll(sel)).filter((el) => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0.5 && r.height > 0.5;
    });

    for (const sel of mustFit || []) {
      const els = visible(sel);
      if (!els.length) { out.push(`${name}: "${sel}" — no visible element found`); continue; }
      for (const el of els) {
        const r = el.getBoundingClientRect();
        if (r.left < sr.left - TOL || r.right > sr.right + TOL || r.top < sr.top - TOL || r.bottom > sr.bottom + TOL) {
          out.push(`${name}: "${sel}" clipped — el[${round(r)}] outside stage[${round(sr)}]`);
        }
      }
    }

    const hit = (a, b) => !(a.right <= b.left + TOL || a.left >= b.right - TOL || a.bottom <= b.top + TOL || a.top >= b.bottom - TOL);
    for (const [selA, selB] of noOverlap || []) {
      const A = visible(selA), B = visible(selB);
      for (const ea of A) for (const eb of B) {
        if (ea === eb) continue;
        const ra = ea.getBoundingClientRect(), rb = eb.getBoundingClientRect();
        if (hit(ra, rb)) { out.push(`${name}: "${selA}"[${round(ra)}] overlaps "${selB}"[${round(rb)}]`); break; }
      }
    }
    return out;
  }, { name: screen.name, mustFit: screen.mustFit, noOverlap: screen.noOverlap });
}

for (const dev of DEVICES) {
  test(`layouts clean @ ${dev.tag} ${dev.w}x${dev.h}`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: dev.w, height: dev.h });
    await page.goto('/');
    await unlockAll(page);

    const violations = [];
    for (const screen of SCREENS) {
      await screen.go(page);
      await page.waitForTimeout(screen.settle ?? 300);
      await freeze(page);
      await page.waitForTimeout(60);
      violations.push(...(await audit(page, screen)));
    }
    expect(violations, `\n${violations.join('\n')}\n`).toEqual([]);
  });
}
