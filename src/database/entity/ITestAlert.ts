/**
 * Common interface for alert entities.
 */
export interface ITestAlert {
  [key: string]: any;
  testResultId: number;
  action: string;
  flowName: string;
  cpuTimeDegraded: number;
  dmlRowsDegraded: number;
  dmlStatementsDegraded: number;
  heapSizeDegraded: number;
  queryRowsDegraded: number;
  soqlQueriesDegraded: number;
}
