import { test, expect } from '@playwright/test';

test('Admin dashboard loads successfully', async ({ page }) => {
  // Set the admin auth token in localStorage before navigating to the admin panel
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('admin_auth', 'true');
  });

  await page.goto('/admin');

  // Check the title
  await expect(page.getByRole('heading', { name: /Command Center/i })).toBeVisible({ timeout: 10000 });

  // Verify that the Analytics tab is present
  await expect(page.getByText('Scan Activity')).toBeVisible();
  
  // Verify that recent alerts section is present
  await expect(page.getByText('Live Incident')).toBeVisible();
});
