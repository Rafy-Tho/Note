import { expect, test } from 'playwright/test';

test('mobile navigation can be opened and closed with the keyboard', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile-only journey');
  const email = `responsive-${Date.now()}@example.com`;
  const password = 'correct-horse-battery-staple';

  await page.goto('/');
  await page.getByRole('tab', { name: 'Create Account' }).click();
  await page.getByLabel('Account Email').fill(email);
  await page.getByLabel('Master Key / Password').fill(password);
  await page.getByRole('button', { name: 'Create Account' }).click();
  await page.getByLabel('Master Key / Password').fill(password);
  await page.getByRole('button', { name: 'Unlock Workspace' }).click();

  await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
  const menu = page.getByRole('button', { name: 'Menu' });
  await menu.click();
  await expect(
    page.getByRole('button', { name: 'Close navigation' }).first(),
  ).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Open navigation' }),
  ).toHaveAttribute('aria-expanded', 'false');
});
