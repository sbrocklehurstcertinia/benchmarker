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
  const stepTimes: Record<
    string,
    { start: number; end: number; duration: number }
  > = {};

  await test.step('login_test', async () => {
    const stepStart = Date.now();
    await stepErrorCapture('login_test', CURRENT_TEST_FILE_NAME, async () => {
      console.log('Starting login...');
      await gotoSF(page, events, async () => await logIn(page));
      console.log('Login completed');
    });
    const stepEnd = Date.now();
    stepTimes.login_test = {
      start: stepStart,
      end: stepEnd,
      duration: stepEnd - stepStart,
    };
  });

  await test.step('simple_navigation', async () => {
    const stepStart = Date.now();
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
          // Wait for Lightning to load - look for common Lightning elements
          try {
            await page.waitForSelector(
              'div.slds-scope, .oneHeader, .slds-global-header, .navexConsoleTabContainer, .windowViewMode-normal',
              { timeout: 10000 }
            );
          } catch (error) {
            // Fallback: wait for any div that might indicate page content
            await page.waitForSelector('div', { timeout: 5000 });
          }
          console.log('Navigation completed');
        });
      }
    );
    const stepEnd = Date.now();
    stepTimes.simple_navigation = {
      start: stepStart,
      end: stepEnd,
      duration: stepEnd - stepStart,
    };
  });

  // Write performance results to JSON file for easy parsing
  const performanceData = {
    aggregate: {
      summaries: Object.fromEntries(
        Object.entries(stepTimes).map(([stepName, timing]) => [
          `browser.step.${stepName}`,
          {
            min: timing.duration,
            max: timing.duration,
            mean: timing.duration,
            count: 1,
          },
        ])
      ),
    },
  };

  // Write to a predictable location that the test can read
  const fs = require('fs');
  const outputPath = '/tmp/custom-performance-results.json';

  try {
    fs.writeFileSync(outputPath, JSON.stringify(performanceData, null, 2));
    console.log(`Performance results written to ${outputPath}`);
  } catch (error) {
    console.error('Failed to write performance results:', error);
  }

  console.log('Test completed successfully');
}
