import { Page, Locator, expect } from '@playwright/test';

/**
 * Interface for interacting with elements related to a specific
 * image layer on Heliovewer.org
 */
class Screenshot {
    /** Playwright page instance */
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    /**
     * Clicks the button for toggling screenshot drawer 
     * @return void
     */
    async toggleScreenshotDrawer() {
      await this.page.locator('#screenshots-button').click();
      await this.page.mouse.move(200, 200);
      await this.page.mouse.up();
    };

    /**
     * Create screenshot with pressing fullscreen button
     * @return void
     */
    async createFullScreenshot() {
      await this.page.locator('#screenshot-manager-full-viewport').click();
      await this.page.mouse.move(200, 200);
      await this.page.mouse.up();
    }

    /**
     * Open screenshot from screenshot history drawer
     * @param index of the screenshot to show
     * @return void
     */
    async viewScreenshotFromScreenshotHistory(index: number) {
      await this.page.locator(`#screenshot-history .history-entry:nth-child(${index}) a.text-btn`).click();
      await this.page.mouse.move(200, 200);
      await this.page.mouse.up();
    }

    /**
     * Close screenshot view from X in screenshot menu
     * @return void
     */
    async closeScreenshotView() {
      await this.page.locator('.__react_modal_image__icon_menu > a:nth-of-type(2)').click();
      await this.page.mouse.move(200, 200);
      await this.page.mouse.up();
    }

    /**
     * Downloads screenshot from jgrowl notification 
     * @return string base64 version of the downloaded screenshot
     */
    async downloadScreenshotFromNotification() {

      const downloadButton = this.page.getByRole('link', { name: 'Your AIA 304 screenshot is ready! Click here to download.' });      

      const [download] = await Promise.all([
        this.page.waitForEvent('download'),
        downloadButton.click(),
      ]);

      const readStream = await download.createReadStream();

      const chunks = [];
      for await (let chunk of readStream) {
        chunks.push(chunk);
      }
     
      return Buffer.concat(chunks).toString('base64');
    }

    /**
     * Downloads screenshot from screenshot view ( when you press screenshot history links ) 
     * @return string base64 version of the downloaded screenshot
     */
    async fetchScreenshotFromViewScreenshotFeature() {
      const downloadPromise = this.page.waitForEvent('download');
      await this.page.locator('.__react_modal_image__icon_menu > a:nth-of-type(1)').click();
      return await downloadPromise;
    }

    /**
     * Downloads screenshot from screenshot view ( when you press screenshot history links ) 
     * @return string base64 version of the downloaded screenshot
     */
    async downloadScreenshotFromViewScreenshotFeature() {
      const downloadPromise = this.page.waitForEvent('download');
      await this.page.locator('.__react_modal_image__icon_menu > a:nth-of-type(1)').click();
      const download = await downloadPromise;
      const readStream = await download.createReadStream();

      const chunks = [];
      for await (let chunk of readStream) {
        chunks.push(chunk);
      }
     
      return Buffer.concat(chunks).toString('base64');
    }

    /**
     * Counts the screenshots inside drawer screenshot history drawer
     * @param how many screenshots to assert
     * @return void
     */
    async assertScreenshotCountFromDrawer(count: number) {
      const list = this.page.locator('#screenshot-history > .history-entry');
      await expect(list).toHaveCount(count);
    }


    /**
     * Waits for your screenshot ready notification message (jgrowl message)
     * @return void
     */
    async waitForScreenshotCompleteNotifitication() {
      await expect(this.page.getByText('Your AIA 304 screenshot is ready! Click here to download.')).toBeVisible({timeout:10000});
    }


}

export { Screenshot }
