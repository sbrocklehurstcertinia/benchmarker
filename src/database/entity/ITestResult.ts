/**
 * Common interface for test result entities.
 */
export interface ITestResult {
  [key: string]: any;
  duration: number;
  targetValue: number;
  action: string;
  flowName: string;
  error: string;
  product: string;
  incognitoBrowser: boolean;
  lighthouseSpeedIndex: number;
  lighthouseTimeToInteractive: number;
  dlpLines: number;
  dpDocuments: number;
  testType: string;
  cpuTime: number;
  dmlRows: number;
  dmlStatements: number;
  heapSize: number;
  queryRows: number;
  soqlQueries: number;
  queueableJobs: number;
  futureCalls: number;
  sourceRef: string;
}
