/**
 * @copyright 2025 Certinia Inc. All rights reserved.
 */

import dotenv from 'dotenv';
import { defaultConfig } from '../artillery';
import {
  ArtilleryTest,
  getCurrentTestFileName,
  gotoSF,
  logIn,
  stepErrorCapture,
} from '../utils';
import type { EventEmitter, ScenarioContext } from 'artillery';
import {
  navigateToTimesheetEntry,
  pageReload,
} from './timesheet-entry-test-utils';
import type { Page } from '@playwright/test';

dotenv.config({ path: 'autotests/ui/.env' });

const { DEBUG, SALESFORCE_URL } = process.env;

const CURRENT_TEST_FILE_NAME = getCurrentTestFileName(__filename);

export const config = defaultConfig({
  target: SALESFORCE_URL,
  engines: {
    playwright: {
      launchOptions: {
        headless: !DEBUG,
      },
    },
  },
});

export const scenarios = [
  {
    engine: 'playwright',
    testFunction: loadTimesheetEntry,
  },
];

async function loadTimesheetEntry(
  page: Page,
  vuContext: ScenarioContext,
  events: EventEmitter,
  test: ArtilleryTest
) {
  await test.step('setup_test', async () => {
    await stepErrorCapture('setup_test', CURRENT_TEST_FILE_NAME, async () => {
      await gotoSF(page, events, async () => await logIn(page));
    });
  });

  await test.step('open_timesheet_entry', async () => {
    await stepErrorCapture(
      'open_timesheet_entry',
      CURRENT_TEST_FILE_NAME,
      async () => {
        await gotoSF(
          page,
          events,
          async () => await navigateToTimesheetEntry(page)
        );
      }
    );
  });

  await test.step('load_time_to_capture', async () => {
    await stepErrorCapture(
      'load_time_to_capture',
      CURRENT_TEST_FILE_NAME,
      async () => {
        await gotoSF(page, events, async () => await pageReload(page));
      }
    );
  });

  if (DEBUG) {
    // A promise that never resolves to prevent the browser from closing
    process.stdout.write('Debug enabled. Browser will not close.');
    await new Promise(() => {});
  }
}
