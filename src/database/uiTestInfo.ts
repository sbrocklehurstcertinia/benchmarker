/** @ignore */
/* UI test info DB helper */
import { UiTestInfo } from './entity/uiTestInfo';
import { getConnection } from './connection';

export async function saveUiTestInfoRecords(testStepResults: UiTestInfo[]) {
  const connection = await getConnection();
  return connection.manager.save(testStepResults);
}
