/**
 * Basic smoke test for frontend app startup.
 */
import { expect, test } from '@playwright/test'

test('loads landing page', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Load report')).toBeVisible()
})
