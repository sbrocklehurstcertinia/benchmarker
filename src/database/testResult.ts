/** @ignore */
/**
 * Copyright (c) 2019 FinancialForce.com, inc. All rights reserved.
 */

import { TestResult } from './entity/result';
import { ITestResult } from './entity/ITestResult';
import { getConnection } from './connection';

export async function saveTestResult(testStepResults: ITestResult[]) {
  const connection = await getConnection();
  return connection.manager.save(testStepResults);
}

export async function loadTestResults(): Promise<ITestResult[]> {
  const connection = await getConnection();
  return connection.manager.find(TestResult);
}
