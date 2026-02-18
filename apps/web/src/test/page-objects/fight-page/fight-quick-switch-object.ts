/**
 * Page object for the fight quick-switch navigation links.
 */
import { type Locator, type Page } from '@playwright/test'

export class FightQuickSwitchObject {
  readonly root: Locator

  constructor(page: Page) {
    this.root = page.getByRole('navigation', { name: 'Fight quick switch' })
  }

  fightLink(name: string): Locator {
    return this.root.getByRole('link', { name, exact: true })
  }

  async clickFight(name: string): Promise<void> {
    await this.fightLink(name).click()
  }

  fightText(name: string): Locator {
    return this.root.getByText(name, { exact: true })
  }
}
