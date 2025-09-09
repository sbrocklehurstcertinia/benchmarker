/**
 * @copyright 2025 Certinia Inc. All rights reserved.
 */

import type { EventEmitter, ScenarioContext } from 'artillery';
import dotenv from 'dotenv';
import type { Page } from '@playwright/test';

import {
  setProjectGanttView,
  pageReload,
  navigateToProjectGantt,
} from './project-gantt-test-utils';
import {
  gotoSF,
  logIn,
  getCurrentTestFileName,
  stepErrorCapture,
  type ArtilleryTest,
} from '../utils';
import { defaultConfig } from '../artillery';

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
    testFunction: loadProjectGantt,
  },
];

async function loadProjectGantt(
  page: Page,
  vuContext: ScenarioContext,
  events: EventEmitter,
  test: ArtilleryTest
) {
  await test.step('setup_test', async () => {
    await stepErrorCapture('setup_test', CURRENT_TEST_FILE_NAME, async () => {
      await gotoSF(page, events, async () => await logIn(page));
      await setProjectGanttView(page, 'monthsCustom');
    });
  });

  await test.step('open_project_gantt', async () => {
    await stepErrorCapture(
      'open_project_gantt',
      CURRENT_TEST_FILE_NAME,
      async () => {
        await gotoSF(
          page,
          events,
          async () => await navigateToProjectGantt(page)
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
