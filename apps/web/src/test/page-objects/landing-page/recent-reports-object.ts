/**
 * Page object for landing-page recent reports and zero-state examples.
 */
import { type Locator, type Page } from '@playwright/test'

export class RecentReportsObject {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  recentReportsSection(): Locator {
    return this.page.getByRole('region', { name: 'Recent reports' })
  }

  noRecentReportsText(): Locator {
    return this.recentReportsSection().getByText('No recent reports yet.')
  }

  recentReportsList(): Locator {
    return this.recentReportsSection().getByRole('list', {
      name: 'Recent reports',
    })
  }

  recentReportLink(name: string): Locator {
    return this.recentReportsSection().getByRole('link', {
      name,
      exact: true,
    })
  }

  exampleReportsSection(): Locator {
    return this.page.getByRole('region', { name: 'Example reports' })
  }

  exampleReportsList(): Locator {
    return this.exampleReportsSection().getByRole('list', {
      name: 'Example reports',
    })
  }

  exampleReportLink(name: string): Locator {
    return this.exampleReportsSection().getByRole('link', {
      name,
      exact: true,
    })
  }
}
