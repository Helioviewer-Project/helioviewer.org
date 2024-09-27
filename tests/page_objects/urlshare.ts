import { Page, Locator, expect } from "@playwright/test";

/**
 * Interface for interacting with url sharing elements
 */
class URLShare {
  /** Playwright page instance */
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Clicks the button for making shared urls
   * @return void
   */
  async triggerShareURL() {
    await this.page.locator("#share-button").click();
  }

  /**
   * Assert share url is visible
   * @return void
   */
  async sharedURLIsVisibleAndDone() {
    await expect(this.page.locator("#helioviewer-share-url")).toBeInViewport();
    await expect(this.page.locator("#helioviewer-share-url")).toHaveValue(
      new RegExp("https?://[a-z0-9-.:]+/load/[a-z0-9A-Z]+")
    );
  }
}

export { URLShare };
