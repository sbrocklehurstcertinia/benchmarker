/*
 * @copyright 2025 Certinia Inc. All rights reserved.
 */

import { getRecord, setLocalStorage } from '../utils';
import type { Page } from '@playwright/test';

/**
 * Sets the zoom level for the project Gantt view by updating the local storage value.
 *
 * @param page - The Playwright Page object representing the browser page.
 * @param zoomLevel - The desired zoom level to set for the Gantt chart.
 * @returns A promise that resolves when the zoom level has been set.
 */
export async function setProjectGanttView(
  page: Page,
  zoomLevel: string
): Promise<void> {
  await setLocalStorage(page, {
    key: 'BRYNTUM_SCHEDULER_ZOOM_LEVEL',
    value: {
      ['GNT_projectRecordGantt']: zoomLevel,
    },
  });
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

/**
 * Navigates to the Project Gantt page for a specific project.
 *
 * @param page - The Playwright Page object representing the browser page.
 * @param timeout - The maximum time to wait for the navigation to complete, in milliseconds (default: 120,000 ms (2 mins)).
 * @returns A promise that resolves when the navigation is complete and the loading spinner is no longer visible.
 */
export async function navigateToProjectGantt(
  page: Page,
  timeout = 120_000
): Promise<void> {
  const { ACCESS_TOKEN } = process.env;
  const project = await getRecord(
    'pse__Proj__c',
    "Name='Cosmic Containers - Standard Implementation'"
  );
  await page.goto(
    `/secur/frontdoor.jsp?sid=${ACCESS_TOKEN}&retURL=lightning/r/pse__Proj__c/${project.Id}/view`,
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
