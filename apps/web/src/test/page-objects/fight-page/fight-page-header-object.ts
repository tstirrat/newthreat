/**
 * Page object for fight page header links and metadata.
 */
import { type Locator, type Page } from '@playwright/test'

type RegionName = string | RegExp

export class FightPageHeaderObject {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  section(title: RegionName): Locator {
    return this.page.getByRole('region', { name: title })
  }

  backToReportLink(title: RegionName): Locator {
    return this.section(title).getByRole('link', { name: 'Back to report' })
  }

  warcraftLogsReportLink(title: RegionName): Locator {
    return this.section(title).getByRole('link', {
      name: 'Report',
      exact: true,
    })
  }

  warcraftLogsFightLink(title: RegionName): Locator {
    return this.section(title).getByRole('link', {
      name: 'Fight',
      exact: true,
    })
  }
}
