/**
 * Root page object for fight-page route interactions.
 */
import { type Page } from '@playwright/test'

import { FightPageHeaderObject } from './fight-page-header-object'
import { FightQuickSwitchObject } from './fight-quick-switch-object'
import { FocusedPlayerSummaryObject } from './focused-player-summary-object'
import { ThreatChartObject } from './threat-chart-object'

export class FightPageObject {
  readonly chart: ThreatChartObject
  readonly header: FightPageHeaderObject
  readonly quickSwitch: FightQuickSwitchObject
  readonly summary: FocusedPlayerSummaryObject

  constructor(readonly page: Page) {
    this.header = new FightPageHeaderObject(page)
    this.quickSwitch = new FightQuickSwitchObject(page)
    this.chart = new ThreatChartObject(page)
    this.summary = new FocusedPlayerSummaryObject(page)
  }

  async goto(url: string): Promise<void> {
    await this.page.goto(url)
  }

  async searchParam(paramName: string): Promise<string | null> {
    return this.page.evaluate((name: string) => {
      return new URLSearchParams(window.location.search).get(name)
    }, paramName)
  }

  async searchString(): Promise<string> {
    return this.page.evaluate(() => window.location.search)
  }
}
