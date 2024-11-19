import { Page, expect } from "@playwright/test";

/**
 * Interface for interacting with elements related to a specific
 * image layer on Heliovewer.org
 */
class Screenshot {
  /** Playwright page instance */
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Clicks the button for toggling screenshot drawer
   * @return void
   */
  async toggleScreenshotDrawer() {
    await this.page.locator("#screenshots-button").click();
    await this.page.mouse.move(200, 200);
    await this.page.mouse.up();
  }

  /**
   * Create screenshot with pressing fullscreen button
   * @return void
   */
  async createFullScreenshot() {
    await this.page.locator("#screenshot-manager-full-viewport").click();
    await this.page.mouse.move(200, 200);
    await this.page.mouse.up();
  }

  /**
   * Open screenshot from screenshot history drawer
   * @param index of the screenshot to show
   * @param wait Wait for the image to load. Set this to false if the image
   *             is going to be loaded from cache.
   * @return void
   */
  async viewScreenshotFromScreenshotHistory(index: number, wait: boolean = false) {
    if (wait) {
      var request = this.page.waitForResponse(/downloadScreenshot/);
    }

    await this.page.locator(`#screenshot-history .history-entry:nth-child(${index}) a.text-btn`).click();
    await this.page.mouse.move(200, 200);
    await this.page.mouse.up();

    if (wait) {
      // @ts-ignore
      await request;
      // On firefox, waiting for the img to be returned from the API is not enough.
      // Here we're waiting for the img tag itself to report that it's complete,
      // which should indicate that the image is fully rendered.
      // According to MDN, complete is set when the image is only queued for
      // rendering, so this check still may not be perfect...
      await this.page.locator("#react-modal-image-img").evaluate((e) => {
        let img = e as HTMLImageElement;
        return img.complete || new Promise((resolve) => (img.onload = resolve));
      });
    }
  }

  /**
   * Close screenshot view from X in screenshot menu
   * @return void
   */
  async closeScreenshotView() {
    await this.page.locator(".__react_modal_image__icon_menu > a:nth-of-type(2)").click();
    await this.page.mouse.move(200, 200);
    await this.page.mouse.up();
  }

  /**
   * Downloads screenshot from jgrowl notification
   * @return string base64 version of the downloaded screenshot
   */
  async downloadScreenshotFromNotification(): Promise<string> {
    const downloadButton = this.page.getByRole("link", {
      name: "Your AIA 304 screenshot is ready! Click here to download."
    });

    const [download] = await Promise.all([this.page.waitForEvent("download"), downloadButton.click()]);

    const readStream = await download.createReadStream();

    const chunks = [];
    for await (let chunk of readStream) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks).toString("base64");
  }

  /**
   * Downloads screenshot from screenshot view ( when you press screenshot history links )
   * @return string base64 version of the downloaded screenshot
   */
  async fetchScreenshotFromViewScreenshotFeature() {
    const downloadPromise = this.page.waitForEvent("download");
    await this.page.locator(".__react_modal_image__icon_menu > a:nth-of-type(1)").click();
    return await downloadPromise;
  }

  /**
   * Downloads screenshot from screenshot view ( when you press screenshot history links )
   * @return string base64 version of the downloaded screenshot
   */
  async downloadScreenshotFromViewScreenshotFeature() {
    const downloadPromise = this.page.waitForEvent("download");
    await this.page.locator(".__react_modal_image__icon_menu > a:nth-of-type(1)").click();
    const download = await downloadPromise;
    const readStream = await download.createReadStream();

    const chunks = [];
    for await (let chunk of readStream) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks).toString("base64");
  }

  /**
   * Counts the screenshots inside drawer screenshot history drawer
   * @param how many screenshots to assert
   * @return void
   */
  async assertScreenshotCountFromDrawer(count: number) {
    const list = this.page.locator("#screenshot-history > .history-entry");
    await expect(list).toHaveCount(count);
  }

  /**
   * Waits for your screenshot ready notification message (jgrowl message)
   * @return void
   */
  async waitForScreenshotCompleteNotifitication() {
    await expect(this.page.getByText("Your AIA 304 screenshot is ready! Click here to download.")).toBeVisible({
      timeout: 10000
    });
  }
}

type AsyncFn = () => Promise<void>;
/**
 * Mobile specific implementation of screenshot features
 */
class MobileScreenshot extends Screenshot {
  /** Checks if the screenshot dialog is already open. */
  private IsScreenshotDialogOpen: () => Promise<boolean>;
  /** This function should open the screenshot menu to allow users to take screenshots. */
  public OpenScreenshotDialog: AsyncFn;
  /** This function should close the menu to view the main viewport. */
  private CloseMenu: AsyncFn;
  constructor(page: Page, { IsScreenshotDialogOpen, OpenScreenshotDialog, CloseMenu }) {
    super(page);
    this.IsScreenshotDialogOpen = IsScreenshotDialogOpen;
    this.OpenScreenshotDialog = OpenScreenshotDialog;
    this.CloseMenu = CloseMenu;
  }

  async toggleScreenshotDrawer() {
    if (await this.IsScreenshotDialogOpen()) {
      await this.CloseMenu();
    } else {
      await this.OpenScreenshotDialog();
    }
  }

  async downloadScreenshotFromNotification(): Promise<string> {
    await this.CloseMenu();
    return await super.downloadScreenshotFromNotification();
  }

  async viewScreenshotFromScreenshotHistory(index: number, wait: boolean = false) {
    await this.OpenScreenshotDialog();
    return await super.viewScreenshotFromScreenshotHistory(index, wait);
  }

  async waitForScreenshotCompleteNotifitication() {
    await this.CloseMenu();
    await super.waitForScreenshotCompleteNotifitication();
  }

  async assertScreenshotCountFromDrawer(count: number) {
    await this.OpenScreenshotDialog();
    super.assertScreenshotCountFromDrawer(count);
  }
}

export { Screenshot, MobileScreenshot };
