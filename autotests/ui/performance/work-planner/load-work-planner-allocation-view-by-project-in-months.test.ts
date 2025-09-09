/**
 * @copyright 2025 Certinia Inc. All rights reserved.
 */

import type { EventEmitter, ScenarioContext } from 'artillery';
import dotenv from 'dotenv';
import type { Page } from '@playwright/test';

import {
  deleteFilterSetAfterScenario,
  pageReload,
  navigateToWorkPlanner,
  setFilters,
  setWorkPlannerView,
} from './work-planner-test-utils';
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

export const before = {
  engine: 'playwright',
  testFunction: beforeAll,
};

export const after = {
  engine: 'playwright',
  testFunction: deleteFilterSetAfterScenario,
};

export const scenarios = [
  {
    engine: 'playwright',
    testFunction: loadWorkPlanner,
  },
];

async function beforeAll(
  page: Page,
  vuContext: ScenarioContext,
  events: EventEmitter,
  test: ArtilleryTest
) {
  await stepErrorCapture('beforeAll', CURRENT_TEST_FILE_NAME, async () => {
    await setFilters('Global', 'P1', 'G1');
  });
}

async function loadWorkPlanner(
  page: Page,
  vuContext: ScenarioContext,
  events: EventEmitter,
  test: ArtilleryTest
) {
  await test.step('setup_test', async () => {
    await stepErrorCapture('setup_test', CURRENT_TEST_FILE_NAME, async () => {
      await gotoSF(page, events, async () => await logIn(page));
      await setWorkPlannerView(page, 'projectId', 'gridView', 'monthsCustom');
    });
  });

  await test.step('open_work_planner', async () => {
    await stepErrorCapture(
      'open_work_planner',
      CURRENT_TEST_FILE_NAME,
      async () => {
        await gotoSF(
          page,
          events,
          async () => await navigateToWorkPlanner(page)
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
