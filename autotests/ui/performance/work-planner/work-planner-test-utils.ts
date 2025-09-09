/*
 * @copyright 2025 Certinia Inc. All rights reserved.
 */

import {
  deleteRecord,
  getRecord,
  insertRecord,
  setLocalStorage,
} from '../utils';

import type { Page } from '@playwright/test';
import { expect as baseExpect } from '@playwright/test';

type CustomFilters = {
  customFilters: object;
};

type SkillCertFilters = {
  skillsAndCerts: object;
  desiredSkillsAndCerts: object;
  skillsOperator: 'AND' | 'OR';
};

type FilterSet = {
  resourceIds: string[];
  projectIds: string[];
  assignmentIds: string[];
  opportunityIds: string[];
  projectRegionIds: string[];
  includeProjectSubRegions: boolean;
  projectPracticeIds: string[];
  includeProjectSubPractices: boolean;
  projectGroupIds: string[];
  includeProjectSubGroups: boolean;
  skillCertFilters: SkillCertFilters;
  assignmentCustomFilters: CustomFilters;
  projectCustomFilters: CustomFilters;
  resourceCustomFilters: CustomFilters;
  resourceRequestCustomFilters: CustomFilters;
};

/**
 * Sets the work planner view in the browser's local storage
 * @param page
 * @param groupBy
 * @param viewId
 * @param zoomLevel
 */
export async function setWorkPlannerView(
  page: Page,
  groupBy: string,
  viewId: string,
  zoomLevel: string
): Promise<void> {
  await setLocalStorage(page, {
    key: 'rmwp_fullWorkPlanner',
    value: {
      ['rmwp_groupByCombobox']: groupBy,
      ['rmwp_workPlanner_selectedViewId']: viewId,
    },
  });
  await setLocalStorage(page, {
    key: 'BRYNTUM_SCHEDULER_ZOOM_LEVEL',
    value: {
      ['rmwp_fullWorkPlanner']: zoomLevel,
    },
  });
}

/**
 * Creates a filter set and inserts it to the database
 * @param options
 * @param region
 * @param practice
 * @param group
 */
export async function setFilters(
  region: string,
  practice: string,
  group: string
): Promise<void> {
  const [regionRecord, practiceRecord, groupRecord] = await Promise.all([
    getRecord('pse__Region__c', `Name='${region}'`),
    getRecord('pse__Practice__c', `Name='${practice}'`),
    getRecord('pse__Grp__c', `Name='${group}'`),
  ]);

  const filterSet: FilterSet = {
    resourceIds: [],
    projectIds: [],
    assignmentIds: [],
    opportunityIds: [],
    projectRegionIds: [regionRecord.Id],
    includeProjectSubRegions: true,
    projectPracticeIds: [practiceRecord.Id],
    includeProjectSubPractices: true,
    projectGroupIds: [groupRecord.Id],
    includeProjectSubGroups: true,
    skillCertFilters: {
      skillsAndCerts: {},
      desiredSkillsAndCerts: {},
      skillsOperator: 'AND',
    },
    assignmentCustomFilters: { customFilters: {} },
    projectCustomFilters: { customFilters: {} },
    resourceCustomFilters: { customFilters: {} },
    resourceRequestCustomFilters: { customFilters: {} },
  };

  const fieldValues = new Map<string, string>();
  fieldValues.set('Feature__c', "'Work Planner'");
  fieldValues.set('Filter_Set_Name__c', "'Generated for UI Load Test'");
  fieldValues.set('Filters__c', `'${JSON.stringify(filterSet)}'`);
  fieldValues.set('IsDefault__c', 'true');
  fieldValues.set('Is_Private__c', 'true');
  fieldValues.set('SObject__c', "'Contact'");

  await insertRecord('Filter_Set__c', fieldValues);
}

/**
 * Deletes the filter set named 'Generated for UI Load Test' after a scenario and closes the Playwright page.
 *
 * @param page - The Playwright Page object to close after deletion.
 */
export async function deleteFilterSetAfterScenario(page: Page) {
  try {
    await deleteRecord(
      'pse__Filter_Set__c',
      "pse__Filter_Set_Name__c='Generated for UI Load Test'"
    );
  } catch (e) {
    if (e instanceof Error) {
      process.stdout.write('Failed to delete record: ' + e.message);
    }
  } finally {
    await page.close();
  }
}

// Set timeout for expectations to 3 minutes
const expect = baseExpect.configure({ timeout: 60000 });

/**
 * Reloads the given Playwright page and waits until the "Filtered by" text is visible.
 *
 * @param page - The Playwright Page object to reload.
 * @param timeout - Optional timeout in milliseconds to wait for the "Filtered by" text to become visible. Defaults to 60000 ms.
 * @returns A promise that resolves when the page is reloaded and the "Filtered by" text is visible.
 */
export async function pageReload(page: Page, timeout = 60000) {
  await page.goto(page.url(), { waitUntil: 'load' });
  await expect(page.getByText('Filtered by')).toBeVisible({ timeout: timeout });
}

/**
 * Navigates to the Work Planner page using the provided Playwright Page instance.
 *
 * This function constructs a URL using the ACCESS_TOKEN from environment variables
 * and navigates to the Work Planner page in Salesforce. It waits for the page to load
 * and verifies that the "Filtered by" text is visible, indicating the page has loaded successfully.
 *
 * @param page - The Playwright Page object to perform navigation and assertions.
 * @param timeout - Optional timeout in milliseconds to wait for the "Filtered by" text to appear. Defaults to 120_000 ms (2 mins).
 * @throws Will throw an error if the "Filtered by" text does not become visible within the specified timeout.
 */
export async function navigateToWorkPlanner(page: Page, timeout = 120_000) {
  const { ACCESS_TOKEN } = process.env;
  await page.goto(
    `/secur/frontdoor.jsp?sid=${ACCESS_TOKEN}&retURL=lightning/n/pse__Work_Planner`,
    {
      waitUntil: 'load',
    }
  );
  await expect(page.getByText('Filtered by')).toBeVisible({ timeout: timeout });
}
