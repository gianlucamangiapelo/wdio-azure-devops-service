import { IAzureConfig, ITestResult } from './interface'
import { AzureTestPlanReporter } from '@gmangiapelo/azuredevops-test-reporter'
import { Frameworks, Services } from '@wdio/types'
import { PickleTag } from '@cucumber/messages'
import { ITestCaseHookParameter } from '@cucumber/cucumber'
import { Test, TestResult } from '@wdio/types/build/Frameworks'

export default class AzureDevopsService implements Services.ServiceInstance {
  private readonly _azureReporter: AzureTestPlanReporter

  constructor(
    private readonly _options: IAzureConfig
  ) {
    _options = Object.assign(_options, { stdout: true })
    this._azureReporter = new AzureTestPlanReporter(this._options)
  }

  async onPrepare(): Promise<void> {
    await this._azureReporter.init()
    await this._azureReporter.starTestRun()
  }

  async onComplete(): Promise<void> {
    await this._azureReporter.stopTestRun()
  }

  async afterTest(test: Test, context: any, result: TestResult): Promise<void> {
    let caseId = this.parseCaseIDString(test.parent)

    if (caseId == 'notDefined') {
      caseId = this.parseCaseIDString(test.title)
      if (caseId == 'notDefined') {
        return new Promise((resolve) => {
          resolve()
        })
      }
    }

    const testResult: ITestResult = {
      testCaseId: caseId,
      result: result.passed ? 'Passed' : 'Failed',
      message: '', // pass a substring of result.error
    }

    await this._azureReporter.init()
    const runId = await this._azureReporter.getCurrentTestRunId()

    await this._azureReporter.sendTestResult(testResult, runId)
  }

  async afterScenario(
    world: ITestCaseHookParameter,
    result: Frameworks.PickleResult
  ): Promise<void> {
    const caseId = this.parseCaseID(world.pickle.tags)

    if (caseId == 'notDefined') {
      return new Promise((resolve) => {
        resolve()
      })
    }

    const testResult: ITestResult = {
      testCaseId: caseId,
      result: result.passed ? 'Passed' : 'Failed',
      message: result.error || '',
    }

    await this._azureReporter.init()
    const runId = await this._azureReporter.getCurrentTestRunId()

    await this._azureReporter.sendTestResult(testResult, runId)
  }

  private parseCaseID(pickleTags: readonly PickleTag[]): string {
    const caseID = 'notDefined'
    let patt = /@?[cC](\d+)/g

    if (this._options.caseIdRegex) {
      patt = new RegExp(this._options.caseIdRegex, 'g')
    }
    for (const tag of pickleTags) {
      const matchInfo = patt.exec(tag.name)

      if (matchInfo != null) {
        return matchInfo[1]
      }
    }
    return caseID
  }

  private parseCaseIDString(title: string): string {
    const caseID = 'notDefined'
    let patt = /@?[cC](\d+)/g

    if (this._options.caseIdRegex) {
      patt = new RegExp(this._options.caseIdRegex, 'g')
    }

    const matchInfo = patt.exec(title)

    if (matchInfo != null) {
      return matchInfo[1]
    }

    return caseID
  }
}
