import { expect, test } from 'playwright/test';

test('privacy policy is public and linked from registration', async ({
  page,
}) => {
  await page.goto('/privacy-policy');
  await expect(
    page.getByRole('heading', { name: 'Privacy Policy' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Information we collect' }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Return to sign in' }).click();
  await expect(page.getByRole('tab', { name: 'Sign In' })).toBeVisible();
  await page.getByRole('tab', { name: 'Create Account' }).click();
  await page.getByRole('link', { name: 'Privacy Policy' }).click();

  await expect(
    page.getByRole('heading', { name: 'Privacy Policy' }),
  ).toBeVisible();
});
