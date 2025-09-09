/**
 * @copyright 2025 Certinia Inc. All rights reserved.
 */

import type { EventEmitter, ScenarioContext } from 'artillery';
import dotenv from 'dotenv';
import type { Page } from '@playwright/test';

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
  phases: [
    {
      duration: '15s', // Very short test duration
      arrivalRate: 1,
      maxVusers: 1,
    },
  ],
});

export const scenarios = [
  {
    engine: 'playwright',
    testFunction: simpleTest,
  },
];

async function simpleTest(
  page: Page,
  vuContext: ScenarioContext,
  events: EventEmitter,
  test: ArtilleryTest
) {
  await test.step('login_test', async () => {
    await stepErrorCapture('login_test', CURRENT_TEST_FILE_NAME, async () => {
      console.log('Starting login...');
      await gotoSF(page, events, async () => await logIn(page));
      console.log('Login completed');
    });
  });

  await test.step('simple_navigation', async () => {
    await stepErrorCapture(
      'simple_navigation',
      CURRENT_TEST_FILE_NAME,
      async () => {
        console.log('Starting navigation...');
        await gotoSF(page, events, async () => {
          const { ACCESS_TOKEN } = process.env;
          if (!ACCESS_TOKEN) {
            throw new Error('ACCESS_TOKEN environment variable is required');
          }
          // Just navigate to the home page
          await page.goto(
            `/secur/frontdoor.jsp?sid=${ACCESS_TOKEN}&retURL=lightning/page/home`,
            { waitUntil: 'load', timeout: 30000 }
          );
          // Wait for any content to load
          await page.waitForSelector('body', { timeout: 10000 });
          console.log('Navigation completed');
        });
      }
    );
  });

  console.log('Test completed successfully');
}
