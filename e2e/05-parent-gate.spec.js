import { test, expect } from '@playwright/test';

/**
 * Helper: open the parent gate by pressing the cog.
 * The cog (".cog-corner", labelled PARENTS) listens for `pointerup` and goes
 * straight to the parent-gate screen — a short press, no long hold. (It used to
 * be a 1500ms long-press; commit f96f25c replaced that with a tap and added a 5s
 * lockout after two wrong answers as the anti-kid guard instead.)
 */
async function openParentGate(page) {
  await page.locator('.cog-corner').dispatchEvent('pointerup');
  await expect(page.locator('.parent-gate-card')).toBeVisible({ timeout: 4000 });
}

test('short-press cog opens parent gate', async ({ page }) => {
  await page.goto('/');
  await openParentGate(page);
  await expect(page.locator('.parent-gate-card')).toBeVisible();
  await expect(page.locator('h2.display')).toHaveText('PARENTS ONLY');
});

test('parent gate: wrong answer shows error', async ({ page }) => {
  await page.goto('/');
  await openParentGate(page);

  // Find the question text and compute correct answer to identify wrong buttons
  const questionText = await page.locator('#pg-q').textContent();
  // Parse "a + b + c = ?" format
  const match = questionText.match(/(\d+)\s*\+\s*(\d+)\s*\+\s*(\d+)/);
  const correctAnswer = match ? parseInt(match[1]) + parseInt(match[2]) + parseInt(match[3]) : null;
  expect(correctAnswer).not.toBeNull();

  // Click a wrong button (first button that is not the correct answer)
  const buttons = page.locator('.pg-buttons button');
  const count = await buttons.count();
  let clicked = false;
  for (let i = 0; i < count; i++) {
    const btnText = await buttons.nth(i).textContent();
    if (parseInt(btnText) !== correctAnswer) {
      await buttons.nth(i).dispatchEvent('pointerup');
      clicked = true;
      break;
    }
  }
  expect(clicked).toBe(true);

  await expect(page.locator('.pg-error')).not.toHaveClass(/hidden/);
});

test('parent gate: correct answer opens settings card', async ({ page }) => {
  await page.goto('/');
  await openParentGate(page);

  // Parse the sum from the question
  const questionText = await page.locator('#pg-q').textContent();
  const match = questionText.match(/(\d+)\s*\+\s*(\d+)\s*\+\s*(\d+)/);
  const correctAnswer = match ? parseInt(match[1]) + parseInt(match[2]) + parseInt(match[3]) : null;
  expect(correctAnswer).not.toBeNull();

  // Click the correct answer button
  const buttons = page.locator('.pg-buttons button');
  const count = await buttons.count();
  for (let i = 0; i < count; i++) {
    const btnText = await buttons.nth(i).textContent();
    if (parseInt(btnText) === correctAnswer) {
      await buttons.nth(i).dispatchEvent('pointerup');
      break;
    }
  }

  // Settings card should be visible
  await expect(page.locator('.settings-card')).toBeVisible({ timeout: 2000 });
  await expect(page.locator('.settings-card h2')).toHaveText('SETTINGS');
});
