import { test } from '@playwright/test';
import { unlockAll, goToLevel } from './helpers/math.js';

/**
 * Device-fit diagnosis harness (not an assertion test).
 * Captures the most layout-revealing screens at the exact devices the user
 * named: a control phone, the Oppo Find N5 UNFOLDED (near-square inner screen),
 * iPad portrait + landscape, and a Samsung tablet portrait.
 * Run: SHOT_TAG=before bunx playwright test zz-devices --project=chromium
 */
const TAG = process.env.SHOT_TAG || 'before';
const DIR = `test-results/devices`;

// CSS-px viewports (dpr 1). Physical px ÷ dpr → CSS px.
const DEVICES = [
  { width: 390, height: 844, tag: 'phone', note: 'iPhone 14 (control, aspect 0.46)' },
  { width: 1240, height: 1124, tag: 'foldN5-open', note: 'Oppo Find N5 unfolded (aspect 1.10, near-square)' },
  { width: 810, height: 1080, tag: 'ipad-port', note: 'iPad portrait (aspect 0.75)' },
  { width: 1080, height: 810, tag: 'ipad-land', note: 'iPad landscape (aspect 1.33)' },
  { width: 800, height: 1280, tag: 'tab-port', note: 'Samsung Tab portrait (aspect 0.625)' },
];

async function shot(page, name, vp) {
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
  await page.waitForTimeout(120);
  await page.screenshot({ path: `${DIR}/${TAG}-${vp.tag}-${name}.png` });
}

for (const vp of DEVICES) {
  test(`devices ${vp.tag} (${vp.note})`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize(vp);
    await page.goto('/');
    await unlockAll(page);

    await page.goto('/');
    await page.waitForTimeout(200);
    await shot(page, '01-splash', vp);

    await page.locator('.splash-play').click();
    await page.waitForTimeout(300);
    await shot(page, '02-map', vp);

    await goToLevel(page, 'add', 1);
    await shot(page, '03-add-l1', vp);

    await goToLevel(page, 'mult', 3);
    await shot(page, '04-multtap-l3', vp);

    await page.evaluate(() => window.__router.go('complete', { world: 'mult', level: 3, wrongCount: 0 }));
    await page.waitForTimeout(2600);
    await shot(page, '05-complete', vp);

    await page.evaluate(() => window.__router.go('settings'));
    await page.waitForTimeout(200);
    await shot(page, '06-settings', vp);
  });
}
