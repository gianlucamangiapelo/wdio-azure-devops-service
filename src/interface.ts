export interface IAzureConfig {
  pat: string
  organizationUrl: string
  projectId: string
  planId: number
  suiteId: number
  runName: string
  caseIdRegex?: string
}

export interface ITestResult {
  testCaseId: string
  result: string
  message: string
}
