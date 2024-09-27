import { Page, Locator, expect } from "@playwright/test";

/**
 * Provides functionality to interact with image header display dialog box
 */
class ImageHeaderDialog {
  /** Playwright dialog box body instance */
  private box: Locator;

  constructor(box: Locator) {
    this.box = box;
  }

  /**
   * Assert dialog box is visible.
   * @return void
   */
  async assertVisible(): Promise<void> {
    await expect(this.box).toBeVisible();
  }

  /**
   * Assert dialog box is visible and have the title.
   * @param {string} title , selected tab name
   * @return void
   */
  async assertTitle(title: string): Promise<void> {
    await expect(this.box.locator(".ui-dialog-title")).toHaveText(title);
  }

  /**
   * Assert tab headers are visible and validate the selected one is visible in its selected form.
   * @param {Array<string>} tags ,     list of tab name
   * @param {string}        selected , selected tab name
   * @return void
   */
  async assertTabs(tags: Array<string>, selected: string): Promise<void> {
    for (let t of tags) {
      await expect(this.box.locator(".image-info-dialog-menu").getByText(t)).toBeVisible();
    }

    await expect(this.box.locator(".image-info-dialog-menu").getByText("[" + selected + "]")).toBeVisible();
  }

  /**
   * Assert image headers is visible with their title and value
   * @param {Array<[string, string]>} imageHeaders, tuple of headertag and headervalue
   * @return void
   */
  async assertImageHeaders(imageHeaders: Array<[string, string]>): Promise<void> {
    await Promise.all(
      imageHeaders.map(async (_, index) => {
        const headerTag = await this.box.locator("visible=true").getByRole("listitem").nth(index);
        await expect(headerTag).toHaveText(imageHeaders[index].join(": "));
      })
    );
  }

  /**
   * Trigger sorting of the shown headers.
   * @return void
   */
  async toggleSortHeaders(): Promise<void> {
    await this.box.locator(".image-info-sort-btn").click();
  }

  /**
   * Trigger switch to tab.
   * @param {string} tab, tabname to swich to
   * @return void
   */
  async switchTab(tabname: string): Promise<void> {
    await this.box.locator(".image-info-dialog-menu").getByText(tabname).click();
  }
}

export { ImageHeaderDialog };
