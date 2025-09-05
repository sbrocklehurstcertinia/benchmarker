/** @ignore */
/* UI test info DB helper */
import { UiTestInfo } from './entity/uiTestInfo';
import { saveRecords } from './saveRecords';

export async function saveUiTestInfoRecords(testStepResults: UiTestInfo[]) {
  return saveRecords<UiTestInfo>(testStepResults);
}
