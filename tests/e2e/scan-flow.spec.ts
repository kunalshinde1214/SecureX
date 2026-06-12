import { test, expect } from '@playwright/test';

test('Initiate a scan UI flow', async ({ page }) => {
  // Intercept the audit API call to prevent actual long-running scans in E2E
  await page.route('/api/audit/start', async (route) => {
    const json = { scanId: 'e2e-scan-123', status: 'STARTED' };
    await route.fulfill({ json });
  });

  await page.goto('/');
  
  // Fill the URL input
  const input = page.getByPlaceholder(/Enter URL to audit/i);
  await input.fill('example.com');

  // Click Run Audit
  await page.getByRole('button', { name: /Run Audit/i }).click();

  // Wait for the scan progress component to appear (appState transitions to 'scanning')
  await expect(page.getByText('Initializing threat engine...')).toBeVisible({ timeout: 10000 });
});
