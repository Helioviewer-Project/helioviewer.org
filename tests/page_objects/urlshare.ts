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

class MobileURLShare {
  /** Playwright page instance */
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Clicks the button for making shared urls
   * @return void
   */
  async triggerShareURL(): Promise<void> {
    // Open the sidebar
    await this.page.locator("#hvmobilemenu_btn").tap();
    // Click the url share button
    await this.page.getByText("Share the current viewport").tap();
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

export { URLShare, MobileURLShare };
