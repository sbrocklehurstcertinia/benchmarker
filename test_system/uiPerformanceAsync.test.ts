/**
 * Copyright (c) 2024 Certinia Inc. All rights reserved.
 */
import { expect } from 'chai';
import { spawn } from 'child_process';
import * as path from 'path';
import { TransactionProcess } from '../src/';
import {
  saveUiTestResult,
  loadUiTestResults,
} from '../src/database/uiTestResult';
import { UiTestResult } from '../src/database/entity/uiTestResult';
import { cleanDatabase } from './database';

describe('System Test UI Performance', () => {
  before(async function () {
    await cleanDatabase();
    await TransactionProcess.build('MockProduct');
  });

  describe('Artillery UI Performance', function () {
    it('should execute real project record load test and save results to database', async function () {
      this.timeout(120000);

      console.log('Starting real Artillery UI performance test...');

      const testPath = path.join(
        __dirname,
        '../autotests/ui/performance/project-gantt/load-project-record.test.ts'
      );

      // Execute Artillery test
      const artilleryResults = await new Promise<any>((resolve, reject) => {
        const artilleryProcess = spawn('npx', ['artillery', 'run', testPath], {
          cwd: process.cwd(),
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env, DEBUG: 'true' },
        });

        let stderr = '';

        artilleryProcess.stdout.on('data', data => {
          console.log('Artillery:', data.toString());
        });

        artilleryProcess.stderr.on('data', data => {
          stderr += data.toString();
          console.error('Artillery Error:', data.toString());
        });

        const timeout = setTimeout(() => {
          artilleryProcess.kill('SIGTERM');
          reject(new Error('Artillery test timed out'));
        }, 90000);

        artilleryProcess.on('close', code => {
          clearTimeout(timeout);
          console.log(`Artillery process exited with code ${code}`);

          if (code === 0) {
            try {
              const fs = require('fs');
              const resultsPath = '/tmp/custom-performance-results.json';

              if (fs.existsSync(resultsPath)) {
                const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
                console.log('Successfully loaded custom performance results');
                resolve(data);
              } else {
                reject(new Error('Custom performance results file not found'));
              }
            } catch (error) {
              reject(
                new Error(`Failed to read custom performance results: ${error}`)
              );
            }
          } else {
            reject(
              new Error(`Artillery failed with code ${code}. Stderr: ${stderr}`)
            );
          }
        });

        artilleryProcess.on('error', error => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      // Convert to UI test results
      const uiTestResults: UiTestResult[] = [];
      const { summaries } = artilleryResults.aggregate;

      console.log('Available step metrics:', Object.keys(summaries));

      for (const stepKey of Object.keys(summaries)) {
        if (stepKey.startsWith('browser.step.')) {
          const stepName = stepKey.replace('browser.step.', '');
          const metrics = summaries[stepKey];

          const result = new UiTestResult();

          // Set the new fields
          result.testSuiteName =
            metrics.testSuiteName || 'Project Record Load Test Suite';
          result.individualTestName = metrics.individualTestName || stepName;
          result.componentLoadTime = Math.round(metrics.componentLoadTime || 0);
          result.salesforceLoadTime = Math.round(
            metrics.salesforceLoadTime || 0
          );
          result.overallLoadTime = Math.round(metrics.overallLoadTime || 0);

          uiTestResults.push(result);
        }
      }

      // Save and verify
      console.log(
        `Saving ${uiTestResults.length} UI test results to database...`
      );
      await saveUiTestResult(uiTestResults);
      console.log('All UI test results saved successfully');

      const savedResults = await loadUiTestResults();
      console.log(`Total UI test results in database: ${savedResults.length}`);

      // Basic assertions
      expect(uiTestResults.length).to.be.greaterThan(0);
      expect(savedResults.length).to.be.greaterThan(0);

      const loginResult = uiTestResults.find(
        r => r.individualTestName === 'Salesforce Login Test'
      );
      const navigationResult = uiTestResults.find(
        r => r.individualTestName === 'Lightning Navigation Test'
      );

      expect(loginResult).to.exist;
      expect(navigationResult).to.exist;

      if (loginResult) {
        expect(loginResult.testSuiteName).to.equal(
          'Project Record Load Test Suite'
        );
        expect(loginResult.individualTestName).to.equal(
          'Salesforce Login Test'
        );
        expect(loginResult.salesforceLoadTime).to.be.greaterThan(0);
        expect(loginResult.componentLoadTime).to.equal(0);
        expect(loginResult.overallLoadTime).to.be.greaterThan(0);
      }

      if (navigationResult) {
        expect(navigationResult.testSuiteName).to.equal(
          'Project Record Load Test Suite'
        );
        expect(navigationResult.individualTestName).to.equal(
          'Lightning Navigation Test'
        );
        expect(navigationResult.componentLoadTime).to.be.greaterThan(0);
        expect(navigationResult.salesforceLoadTime).to.equal(0);
        expect(navigationResult.overallLoadTime).to.be.greaterThan(0);
      }

      console.log('UI performance test completed successfully');
    });
  });
});
