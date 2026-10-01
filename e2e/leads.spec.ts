import { test, expect } from '@playwright/test';

/**
 * Lead capture must keep working. The real API needs the production database, so these tests
 * intercept the request and assert the page sends exactly what the API expects.
 */
test('courses interest list posts the email to /api/waitlist-signup', async ({ page }) => {
  let body: unknown = null;
  await page.route('**/api/waitlist-signup', async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
  });
  await page.goto('/courses');
  const form = page.locator('#join');
  await form.getByLabel('Your email address').fill('parent@example.com');
  await form.getByRole('button', { name: 'Join the list' }).click();
  await expect(form.getByRole('status')).toContainText('You’re on the list');
  expect(body).toEqual({ email: 'parent@example.com' });
});

test('interest list validates before sending', async ({ page }) => {
  let called = false;
  await page.route('**/api/waitlist-signup', (route) => {
    called = true;
    return route.fulfill({ status: 200, body: '{}' });
  });
  await page.goto('/courses');
  const form = page.locator('#join');
  await form.getByLabel('Your email address').fill('not-an-email');
  await form.getByRole('button', { name: 'Join the list' }).click();
  await expect(form.getByRole('alert')).toContainText('Please enter an email address');
  await expect(form.getByLabel('Your email address')).toBeFocused();
  expect(called).toBe(false);
});

test('interest list shows the server error message', async ({ page }) => {
  await page.route('**/api/waitlist-signup', (route) =>
    route.fulfill({
      status: 429,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    }),
  );
  await page.goto('/courses');
  const form = page.locator('#join');
  await form.getByLabel('Your email address').fill('parent@example.com');
  await form.getByRole('button', { name: 'Join the list' }).click();
  await expect(form.getByRole('alert')).toContainText('Too many requests');
});

test('courses page shows no past or invented dates or prices while no cohort is set', async ({ page }) => {
  await page.goto('/courses');
  const text = await page.locator('main').innerText();
  expect(text).not.toMatch(/20(2[5-9]|3\d)/);
  expect(text).not.toMatch(/\$\d/);
  await expect(page.getByText('The next course is being planned')).toBeVisible();
});

test('checkout page with a broken link explains itself and links back', async ({ page }) => {
  await page.goto('/summer/checkout');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This checkout link is incomplete');
  await expect(page.getByRole('link', { name: 'Back to courses' })).toHaveAttribute('href', '/courses');
});

test('contact email is present in the footer on every page type', async ({ page }) => {
  for (const path of ['/', '/learn/letters-a-j', '/games/letter-race', '/courses']) {
    await page.goto(path);
    await expect(page.locator('footer').getByRole('link', { name: 'Delaney@TeachBraille.org' })).toHaveAttribute(
      'href',
      'mailto:Delaney@TeachBraille.org',
    );
  }
});
