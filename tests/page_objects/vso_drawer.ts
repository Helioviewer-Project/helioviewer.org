import { Page, Locator, expect } from "@playwright/test";

/**
 * Interface for interacting with elements related to vso data drawer
 */
class VSODrawer {
  /** Playwright page instance */
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Clicks the button for toggling vso drawer
   * @return void
   */
  async toggleVisibility(): Promise<void> {
    await this.page.locator("#data-button").click();
  }

  /**
   * Asserts drawer is open
   * @return void
   */
  async assertDrawerOpen(): Promise<void> {
    await expect(this.page.locator("#hv-drawer-data")).toBeVisible();
  }

  /**
   * Asserts drawer is closed
   * @return void
   */
  async assertDrawerClose(): Promise<void> {
    await expect(this.page.locator("#hv-drawer-data")).not.toBeVisible();
  }

  /**
   * Trigger SSW Sunpy download button
   * @return void
   */
  async triggerSunPyScriptDownload(): Promise<void> {
    await expect(this.page.locator("#vso-sunpy")).not.toHaveClass(/inactive/);
    await this.page.locator("#vso-sunpy").click();
  }

  /**
   * Downloads sunpy script from jgrowl notification
   * @return string base64 version of the downloaded screenshot
   */
  async downloadSunpyScriptFromNotification(): Promise<string> {
    const downloadButton = this.page.getByRole("link", {
      name: "Your Python/SunPy script for requesting science data from the VSO is ready"
    });

    const [download] = await Promise.all([this.page.waitForEvent("download"), downloadButton.click()]);

    const readStream = await download.createReadStream();

    const chunks = [];
    for await (let chunk of readStream) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks).toString();
  }
}

export { VSODrawer };
