import { expect, test } from 'playwright/test';

test('authenticated user can create, edit, and reload a note', async ({
  page,
}) => {
  const email = `core-notes-${Date.now()}@example.com`;
  const password = 'correct-horse-battery-staple';

  await page.goto('/');
  await page.getByRole('tab', { name: 'Create Account' }).click();
  await page.getByLabel('Account Email').fill(email);
  await page.getByLabel('Master Key / Password').fill(password);
  await page.getByRole('button', { name: 'Create Account' }).click();

  await expect(
    page.getByText('Account created. Sign in to unlock your workspace.'),
  ).toBeVisible();
  await page.getByLabel('Master Key / Password').fill(password);
  await page.getByRole('button', { name: 'Unlock Workspace' }).click();

  await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
  await page.getByRole('button', { name: '+ New note' }).click();
  await page.getByLabel('Note title').fill('Browser journey');
  await page
    .getByLabel('Note content')
    .fill('Created through the authenticated UI.');

  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Browser journey/ }),
  ).toBeVisible();

  const notesResponse = await page.evaluate(() =>
    fetch('/api/v1/notes').then((response) => response.json()),
  );
  expect(notesResponse.data[0]).toMatchObject({
    title: 'Browser journey',
    state: 'active',
    revision: 1,
  });
  expect(notesResponse.data[0].createdAt).toMatch(/T/);
  expect(notesResponse.data[0].updatedAt).toMatch(/T/);

  await page.reload();
  await expect(page.getByLabel('Note title')).toHaveValue('Browser journey');
  await expect(page.getByLabel('Note content')).toHaveText(
    'Created through the authenticated UI.',
  );

  page.on('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Move to Trash' }).click();
  await page.getByRole('button', { name: 'Trash' }).click();
  await expect(
    page.getByText('Browser journey', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Restore' }).click();
  await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
  await expect(page.getByLabel('Note title')).toHaveValue('Browser journey');
});
