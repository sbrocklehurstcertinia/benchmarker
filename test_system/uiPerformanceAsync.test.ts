/**
 * Copyright (c) 2024 Certinia Inc. All rights reserved.
 */
import { expect } from 'chai';
import {
  TransactionTestTemplate,
  TransactionProcess,
  createApexExecutionTestStepFlow,
  saveResults,
} from '../src';
import { loadUiTestResults } from '../src/database/uiTestResult';
import { cleanDatabase } from './database';

describe('System Test Process UI', () => {
  let test: TransactionTestTemplate;

  before(async function () {
    await cleanDatabase();
    test = await TransactionProcess.build('MockProduct');
  });

  describe('Flow UI', function () {
    it('should execute successfully UI', async () => {
      await TransactionProcess.executeTestStep(
        test,
        await createApexExecutionTestStepFlow(
          test.connection,
          __dirname + '/async.apex',
          { flowName: 'System Test', action: 'run system test' }
        )
      );

      await saveResults(test, test.flowStepsResults, { target: 'ui' });

      const results = await loadUiTestResults();
      expect(results.length).to.be.equal(1);
      const result = results[0];
      expect(result.cpuTime).to.be.above(0);
      expect(result.dmlRows).to.be.equal(0);
      expect(result.dmlStatements).to.be.equal(0);
      expect(result.heapSize).to.be.above(0);
      expect(result.queryRows).to.be.equal(0);
      expect(result.soqlQueries).to.be.equal(0);
      expect(result.queueableJobs).to.be.equal(1);
      expect(result.futureCalls).to.be.equal(0);
    });
  });
});
