/** @ignore */
/* UI test result DB helpers */
import { UiTestResult } from './entity/uiTestResult';
import { getConnection } from './connection';

export async function saveUiTestResult(testStepResults: UiTestResult[]) {
  const connection = await getConnection();
  return connection.manager.save(testStepResults);
}

export async function loadUiTestResults(): Promise<UiTestResult[]> {
  const connection = await getConnection();
  return connection.manager.find(UiTestResult);
}
