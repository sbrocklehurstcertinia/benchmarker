/**
 * @copyright 2025 Certinia Inc. All rights reserved.
 */

import { Page } from '@playwright/test';

/**
 * Navigates to the Timesheet Entry page using the provided Playwright Page instance.
 *
 * @param page - The Playwright Page object to perform navigation and assertions.
 * @param timeout - Optional timeout in milliseconds to wait for the loading spinner to disappear. Defaults to 120_000 ms (2 mins).
 * @returns A promise that resolves when the navigation is complete and the loading spinner is no longer visible.
 */
export async function navigateToTimesheetEntry(
  page: Page,
  timeout = 120_000
): Promise<void> {
  const { ACCESS_TOKEN } = process.env;
  await page.goto(
    `/secur/frontdoor.jsp?sid=${ACCESS_TOKEN}&retURL=lightning/n/pse__Timesheet_Entry`,
    {
      waitUntil: 'load',
    }
  );
  await waitForLoadingSpinnerFinish(page, timeout);
}

/**
 * Waits for the loading spinner to finish on the page.
 *
 * @param page - The Playwright Page object representing the browser page.
 * @param timeout - The maximum time to wait for the spinner to disappear, in milliseconds (default: 120,000 ms (2 mins)).
 * @returns A promise that resolves when the loading spinner is no longer visible.
 */
async function waitForLoadingSpinnerFinish(
  page: Page,
  timeout = 120_000
): Promise<void> {
  const loadSpinner = page.locator('lightning-spinner').last();
  await loadSpinner.waitFor({ timeout });
  await loadSpinner.waitFor({ state: 'hidden', timeout });
}

/**
 * Reloads the current page and waits for the loading spinner to finish.
 *
 * @param page - The Playwright Page object representing the browser page.
 * @returns A promise that resolves when the page reload is complete and the loading spinner is no longer visible.
 */
export async function pageReload(page: Page): Promise<void> {
  await page.goto(page.url(), { waitUntil: 'load' });
  await waitForLoadingSpinnerFinish(page);
}
