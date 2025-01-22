/**
 * @file Contains functions for interacting with the Helioviewer UI
 */

import { Locator, Page, PageScreenshotOptions, TestInfo, expect } from "@playwright/test";
import { ImageLayer } from "./image_layer";
import { Screenshot } from "./screenshot";
import { Movie } from "./movie";
import { URLShare } from "./urlshare";
import { EventTree } from "./event_tree";
import { VSODrawer } from "./vso_drawer";
import { YoutubeDrawer } from "./youtube_drawer";
import { ScaleIndicator } from "./scale_indicator";
import * as fs from "fs";
import { DesktopInterface } from "./helioviewer_interface";
import { MouseCoordinates } from "./mouse_coordinates";

/**
 * Matches an image layer selection
 * i.e. { label: Observatory, value: SOHO }
 *      { label: Energy Band, value: 3-6keV }
 */
interface LayerSelect {
  label: string;
  value: string;
}

class Helioviewer implements DesktopInterface {
  info: TestInfo | null;
  page: Page;
  sidebar: Locator;
  screenshot: Screenshot;
  movie: Movie;
  urlshare: URLShare;
  vso_drawer: VSODrawer;
  scale_indicator: ScaleIndicator;
  youtubeDrawer: YoutubeDrawer;
  coordinates: MouseCoordinates;

  constructor(page: Page, info: TestInfo | null = null) {
    this.page = page;
    this.info = info;
    this.screenshot = new Screenshot(this.page);
    this.movie = new Movie(this.page);
    this.urlshare = new URLShare(this.page);
    this.vso_drawer = new VSODrawer(this.page);
    this.scale_indicator = new ScaleIndicator(this.page);
    this.sidebar = this.page.locator("#hv-drawer-left");
    this.youtubeDrawer = new YoutubeDrawer(this.page);
    this.coordinates = new MouseCoordinates(this.page);
  }

  /**
   * Alias for CloseSidebar to support mobile tests.
   */
  CloseDrawer(): Promise<void> {
    return this.CloseSidebar();
  }

  /**
   * Alias for OpenSidebar, this is to be able to run mobile tests against
   * Desktop.
   */
  OpenImageLayerDrawer(): Promise<void> {
    return this.OpenSidebar();
  }

  OpenEventsDrawer(): Promise<void> {
    return this.OpenSidebar();
  }

  /**
   * Returns a handle to interact with event tree in UI
   * @param source string, ex: HEK, CCMC, RHESSI
   * @return EventTree
   */
  parseTree(source: string): EventTree {
    return new EventTree(source, this.page);
  }

  async Load(path: string = "/") {
    await this.page.goto(path);
    await this.WaitForLoadingComplete();
  }

  /**
   * Image layers are assigned a random ID when they are added to the DOM.
   * This returns the ID of the designated image layer.
   * @param index
   */
  async getImageLayerId(index: number): Promise<string> {
    // To create an ImageLayer, we need the layer's unique id which
    // is generated randomly when the page is loaded. To find the id
    // we get the appropriate element by its class name and extract
    // the randomly generated ID.

    // Gets the specified tile layer accordion reference in the sidebar
    let layer = await this.page.locator(".dynaccordion-section").nth(index);
    // Get the section's id "tile-layer-<random_id>"
    let section_id = await layer.evaluate((e) => e.id);
    // Extract the random id from the section id
    let random_id = section_id.split("-")[2];
    return random_id;
  }

  /**
   * Returns a handle to an Image Layer interface which can be used to
   * semantically access image layer features of helioviewer.
   * @param index Image layer index
   */
  async getImageLayer(index: number): Promise<ImageLayer> {
    return new ImageLayer(this.page, await this.getImageLayerId(index));
  }

  async ExpectLayerEx(index: number, name: string, selections: LayerSelect[]) {
    await expect(this.page.getByText(name, { exact: true })).toBeVisible();
    for (let i = 0; i < selections.length; i++) {
      let layer = selections[i];
      await expect(this.page.getByLabel(layer.label).nth(index)).toHaveValue(layer.value);
    }
  }

  /**
   * Expects that the given image layer index matches the given values
   * @param index Image layer index
   * @param observatory
   * @param instrument
   * @param measurement
   */
  async ExpectLayer(index: number, name: string, observatory: string, instrument: string, measurement: string) {
    await this.ExpectLayerEx(index, name, [
      { label: "Observatory", value: observatory },
      { label: "Instrument", value: instrument },
      { label: "Measurement", value: measurement }
    ]);
  }

  /**
   * Makes sure the given function is executed with the sidebar open.
   * This retains the current state of the sidebar before/after executing
   * function.
   *
   * If the sidebar is open, it will be open when fn is done.
   * If the sidebar is closed, it will be opened before calling fn, and closed
   * after calling fn.
   * @param fn
   */
  private async _WithSidebar(fn: () => any): Promise<any> {
    const sidebarWasClosed = await this.IsSidebarClosed();
    if (sidebarWasClosed) {
      await this.OpenSidebar();
    }
    const result = await fn();
    if (sidebarWasClosed) {
      await this.CloseSidebar();
    }
    return result;
  }

  async UseNewestImage() {
    await this._WithSidebar(async () => {
      await this.page.getByText("NEWEST", { exact: true }).click();
      await this.page.waitForTimeout(500);
    });
  }

  /**
   * This function waits for the number of tiles on the page to not change.
   */
  private async WaitForTileCountToSettle() {
    let locators = this.page.locator("img.tile");
    let count = (await locators.all()).length;
    let settled = false;
    while (!settled) {
      // Wait some time.
      await this.page.waitForTimeout(1000);
      // Check the number of img tags
      let next_count = (await locators.all()).length;
      // If it matches the previous count, then we're good.
      settled = next_count == count;
      count = next_count;
    }
  }

  async WaitForImageLoad() {
    // wait some time for the number of image tiles to update.
    await this.WaitForTileCountToSettle();
    // wait for playwright to believe the network is done loading
    await this.page.waitForLoadState("networkidle");
    // check all img tags to ensure they're done loading.
    let locators = await this.page.locator("img.tile");
    // Get all the img tags
    let images = await locators.all();
    // Create promises that resolve when the img is done loading, when
    // the img's "complete" attribute is set to true.
    let promises = images.map((locator) => {
      return locator.count().then((n) => {
        // There seems to be an issue where the locator does not exist.
        // It should exist, it was there when we executed "locators.all"
        // but now playwright is going to fail "waiting for locator".
        // So if the locator just isn't in the DOM anymore for some
        // reason, then just return instead of trying to wait.
        if (n == 0) return;

        return locator.evaluate(
          (img) => {
            return new Promise<void>((resolve) => {
              if ((img as HTMLImageElement).complete) {
                resolve();
              } else {
                // Periodically check for the image to be done loading.
                let interval = setInterval(() => {
                  if ((img as HTMLImageElement).complete) {
                    clearInterval(interval);
                    resolve();
                  }
                }, 500);
              }
            });
          },
          null,
          { timeout: 10000 }
        );
      });
    });
    await Promise.all(promises);
  }

  async CloseAllNotifications() {
    while ((await this.page.locator(".jGrowl-close").count()) > 0) {
      await this.page.locator(".jGrowl-close").first().click();
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Clicks the add layer button in the image sidebar
   */
  async AddImageLayer() {
    let initial_count = await this.page.locator(".removeBtn").count();
    await this.page.getByRole("link", { name: "Add Layer" }).click();
    await this.WaitForLoadingComplete();
    await expect(this.page.locator(".removeBtn")).toHaveCount(initial_count + 1);
    await this.WaitForLoadingComplete();
  }

  /**
   * Removes an image layer at the given index if it exists.
   * Throws an error if the button can't be found
   */
  async RemoveImageLayer(index: number) {
    let count = await this.page.locator(".removeBtn").count();
    await this.page.locator(".removeBtn").nth(index).click();
    await expect(this.page.locator(".removeBtn")).toHaveCount(count - 1);
    await this.WaitForLoadingComplete();
  }

  /**
   * Clicks the datasources tab to open/close the sidebar
   */
  async ClickDataSourcesTab() {
    await this.page.locator("#hv-drawer-tab-left").click();
  }

  /**
   * Returns true of the sidebar is open, else returns false.
   */
  async IsSidebarOpen(): Promise<boolean> {
    let width = (await this.sidebar.evaluate((html) => html.style.width)).trim();
    // If the sidebar has never been opened, the width will be ''
    // If it was opened and closed, the width will be 0px.
    if (width === "" || width === "0px") {
      return false;
    }
    return true;
  }

  /**
   * @returns True if the sidebar is closed, else False
   */
  async IsSidebarClosed(): Promise<boolean> {
    return !(await this.IsSidebarOpen());
  }

  /**
   * Opens the sidebar if it is closed.
   * If the sidebar is open, this function has no effect.
   */
  async OpenSidebar() {
    if (await this.IsSidebarClosed()) {
      await this.ClickDataSourcesTab();
      await expect(this.sidebar).toHaveAttribute("style", /^.*width: 27em.*$/);
    }
  }

  /**
   * Closes the sidebar if it is opened.
   * If the sidebar is closed, this function has no effect.
   */
  async CloseSidebar() {
    if (await this.IsSidebarOpen()) {
      this.ClickDataSourcesTab();
      await expect(this.sidebar).toHaveAttribute("style", /^.*width: 0px.*$/);
    }
  }

  /**
   * Waits for the loading spinner to disappear
   */
  async WaitForLoadingComplete() {
    await this.page.waitForFunction(() => document.getElementById("loading")?.style.display == "none", null, {
      timeout: 60000
    });
    await this.WaitForImageLoad();
  }

  /**
   *
   * @param {number} n Number of times to zoom in
   */
  async ZoomIn(n: number = 1) {
    for (let i = 0; i < n; i++) {
      await this.page.locator("#zoom-in-button").click();
      // Wait for zoom animation to complete.
      await this.page.waitForTimeout(500);
    }
  }

  async ZoomOut(n: number = 1) {
    for (let i = 0; i < n; i++) {
      await this.page.locator("#zoom-out-button").click();
      // Wait for zoom animation to complete.
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Assert some certain notification is visible to the application user
   * @param {string} type this can be one of the "warn", "error", "info", "success"
   * @param {string | RegExp} message , string or regexp to match the notification
   * @return Promise<void>
   */
  async assertNotification(type: string, message: string | RegExp): Promise<void> {
    await expect(
      this.page.locator("div.jGrowl-notification." + type + " > div.jGrowl-message").getByText(message)
    ).toBeVisible();
  }

  /**
   * Assert NO notification is visible to the application user
   * @return Promise<void>
   */
  async assertNoNotification(): Promise<void> {
    await expect(this.page.locator("#message-console")).not.toBeVisible();
  }

  /**
   * Opens the presets menu and selects the given preset and waits for layers to load.
   * @param {string} preset The name of the preset to be selected.
   * @returns {void}
   */
  async SelectImagePreset(preset: string) {
    await this.page.locator(".layersPresetsList .dropdown-main").click();
    await this.page.getByRole("link", { name: preset }).click();
  }

  /**
   * Sets observation datetime of Helioviewer from given Date object,
   * @param {Date} Date The date object to be used to load observation datetime.
   * @returns {void}
   */
  async SetObservationDateTimeFromDate(date: Date): Promise<void> {
    const dateParts = date.toISOString().split("T")[0].split("-");
    const dateString = `${dateParts[0]}/${dateParts[1]}/${dateParts[2]}`;

    const timeParts = date.toISOString().split("T")[1].split(":");
    const timeSeconds = timeParts[2].split(".")[0];
    const timeString = `${timeParts[0]}:${timeParts[1]}:${timeSeconds}`;

    await this.SetObservationDateTime(dateString, timeString);
  }

  /**
   * Sets the observation datetime and waits helioviewer to load,
   * @param {string} date The date to be entered in the format 'MM/DD/YYYY'.
   * @param {string} time The time to be entered in the format 'HH:MM'.
   * @returns {void} A promise that resolves when the date and time have been successfully entered.
   */
  async SetObservationDateTime(date: string, time: string) {
    await this.OpenSidebar();
    await this.page.getByLabel("Observation date", { exact: true }).click();
    await this.page.getByLabel("Observation date", { exact: true }).fill(date);
    await this.page.getByLabel("Observation time").click();
    await this.page.getByLabel("Observation time").fill(time);
    await this.page.getByLabel("Observation time").press("Enter");
  }

  /**
   * Hover mouse on helioviewer logo
   *  @returns {void} A promise that indicates , mouse is already hovered on our logo
   */
  async HoverOnLogo() {
    await this.page.locator("#logo").hover();
  }

  /**
   * Get the loaded date in helioviewer
   * @returns {Date} Loaded date of helioviewer, it can be null if any error.
   */
  async GetLoadedDate(): Promise<Date> {
    return await this._WithSidebar(async () => {
      const currentDate = await this.page.getByLabel("Observation date", { exact: true }).inputValue();
      const currentTime = await this.page.getByRole("textbox", { name: "Observation time" }).inputValue();
      const date = new Date(currentDate + " " + currentTime + "Z");
      expect(date.getTime()).not.toBeNaN();
      return date;
    });
  }

  /**
   * Jump backwards with jump button, with given seconds layer
   * @param {number} seconds interval in seconds
   * @returns {void}
   */
  async JumpBackwardsDateWithSelection(seconds: number): Promise<void> {
    await this.OpenSidebar();
    await this.page.getByLabel("Jump:").selectOption(seconds.toString());
    await this.page.locator("#timeBackBtn").click();
  }

  /**
   * Jump forward with jump button, with given seconds layer
   * @param {number} seconds interval in seconds
   * @returns {void}
   */
  async JumpForwardDateWithSelection(seconds: number): Promise<void> {
    await this.OpenSidebar();
    await this.page.getByLabel("Jump:").selectOption(seconds.toString());
    await this.page.locator("#timeForwardBtn").click();
  }

  /**
   * Attach base64 screnshot with a given filename to trace report
   * also returns the screenshot string
   * @param {string} filename name of file in trace report
   * @param {PageScreenshotOptions} options pass options to playwright screenshot function
   * @returns {Promise<string>} base64 string screenshot
   */
  async saveScreenshot(filename: string = "", options: PageScreenshotOptions = {}): Promise<string> {
    // get base64 screenshot
    const binaryImage = await this.page.screenshot(options);
    const base64Image = binaryImage.toString("base64");

    // if not filename given, generate one
    if (filename == "") {
      filename = (Math.random() + 1).toString(36).substring(7);
    }

    // if there is no png extension add it
    if (!filename.endsWith(".png")) {
      filename = filename + ".png";
    }

    // save file to info report and snapshot path
    const filepath = this.info.snapshotPath(filename);
    fs.mkdirSync(this.info.snapshotDir, { recursive: true });
    fs.writeFileSync(filepath, Buffer.from(base64Image, "base64"));
    await this.info.attach(filename, { path: filepath });

    // return the base64 screenshot
    return base64Image;
  }

  /**
   * Attach base64 screnshot with a given filename to trace report
   * and  exit afterwards with false assertion
   * @param {string} filename name of file in trace report
   * @param {PageScreenshotOptions} options pass options to playwright screenshot function
   * @returns {void}
   */
  async saveScreenshotAndExit(filename: string = "", options: PageScreenshotOptions = {}): Promise<void> {
    await this.saveScreenshot(filename, options);
    await expect("failed").toBe("intentionally");
  }

  /**
   * Attach base64 screnshot of just the loaded sun viewport with a given filename to trace report
   * also returns the screenshot string
   * @param {string} filename name of file in trace report
   * @param {PageScreenshotOptions} options pass options to playwright screenshot function
   * @returns {Promise<string>} base64 string screenshot
   */
  async sunScreenshot(filename: string = "", options: PageScreenshotOptions = {}): Promise<string> {
    if (!options.style) {
      options.style = "#helioviewer-viewport-container-outer {z-index:200000}";
    }

    return this.saveScreenshot(filename, options);
  }

  /**
   * Move the viewport by the given amount
   * @param {number} x Horizontal amount
   * @param {number} y Vertical amount
   * @returns {Promise<void>}
   */
  async moveViewport(x: number, y: number): Promise<void> {
    const INITIAL_POSITION = { x: 650, y: 400 };
    await this.page.mouse.move(INITIAL_POSITION.x, INITIAL_POSITION.y);
    await this.page.mouse.down();
    await this.page.mouse.move(INITIAL_POSITION.x + x, INITIAL_POSITION.y + y);
    await this.page.mouse.up();
  }

  /**
   * Center the viewport for the sun
   * @returns {Promise<void>}
   */
  async centerViewport(): Promise<void> {
    await this.page.locator("#center-button").click();
  }

  /**
   * Click news button in top controls to see news button or hide it
   * @returns {Promise<void>}
   */
  async toggleNewsAndAnnouncements(): Promise<void> {
    await this.page.locator("#news-button").click();
  }

  async OpenScreenshotsDialog(): Promise<void> {
    return await this.screenshot.toggleScreenshotDrawer();
  }

  /**
   * Click youtube button in top controls to see the shared youtube videos
   * @returns {Promise<void>}
   */
  async toggleYoutubeVideosDrawer(): Promise<void> {
    await this.page.locator("#youtube-button").click();
  }

  /**
   * Moves earth scale indicator to given x,y coordinates
   * @param {number} x Horizontal coordinate
   * @param {number} y Vertical coordinate
   * @returns {Promise<void>}
   */
  async moveEarthScaleIndicator(x: number, y: number): Promise<void> {
    await this.page.locator("#earth-container").hover();
    await this.page.mouse.down();
    await this.page.mouse.move(x, y);
    await this.page.mouse.up();
  }
}

export { Helioviewer };
