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
    it('should execute contact record load test and save result to database', async function () {
      this.timeout(120000);

      console.log('Starting contact record Artillery UI performance test...');

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

      // Process the single contact performance test result
      const contactTestKey = 'browser.step.contact_performance_test';
      if (summaries[contactTestKey]) {
        const metrics = summaries[contactTestKey];

        const result = new UiTestResult();

        // Set the new fields
        result.testSuiteName =
          metrics.testSuiteName || 'Contact Record Load Test Suite';
        result.individualTestName =
          metrics.individualTestName || 'Contact Record Performance Test';
        result.componentLoadTime = Math.round(metrics.componentLoadTime || 0);
        result.salesforceLoadTime = Math.round(metrics.salesforceLoadTime || 0);
        result.overallLoadTime = Math.round(metrics.overallLoadTime || 0);

        uiTestResults.push(result);
      } else {
        throw new Error(
          'Expected contact performance test result not found in Artillery output'
        );
      }

      // Save and verify
      console.log(
        `Saving ${uiTestResults.length} UI test result to database...`
      );
      await saveUiTestResult(uiTestResults);
      console.log('UI test result saved successfully');

      const savedResults = await loadUiTestResults();
      console.log(`Total UI test results in database: ${savedResults.length}`);

      // Basic assertions
      expect(uiTestResults.length).to.equal(1); // Should be exactly 1 record
      expect(savedResults.length).to.be.greaterThan(0);

      const contactResult = uiTestResults.find(
        r => r.individualTestName === 'Contact Record Performance Test'
      );

      expect(contactResult).to.exist;

      if (contactResult) {
        expect(contactResult.testSuiteName).to.equal(
          'Contact Record Load Test Suite'
        );
        expect(contactResult.individualTestName).to.equal(
          'Contact Record Performance Test'
        );
        // salesforceLoadTime should be > 0 as it includes login + org access
        expect(contactResult.salesforceLoadTime).to.be.greaterThan(0);
        // componentLoadTime should be > 0 as it includes contact record loading
        expect(contactResult.componentLoadTime).to.be.greaterThan(0);
        expect(contactResult.overallLoadTime).to.be.greaterThan(0);

        console.log(
          `Salesforce Load Time (login + org access): ${contactResult.salesforceLoadTime}ms`
        );
        console.log(
          `Component Load Time (contact record): ${contactResult.componentLoadTime}ms`
        );
        console.log(`Overall Load Time: ${contactResult.overallLoadTime}ms`);
      }

      console.log('Contact record UI performance test completed successfully');
    });
  });
});
