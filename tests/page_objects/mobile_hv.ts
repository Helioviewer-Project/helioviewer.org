/**
 * @file Contains functions for interacting with the Helioviewer Mobile UI
 */

import { Locator, Page, PageScreenshotOptions, TestInfo, expect } from "@playwright/test";
import { Helioviewer } from "./helioviewer";
import { ImageLayer } from "./image_layer";
import { ScaleIndicator } from "./scale_indicator";
import { MobileInterface } from "./helioviewer_interface";
import { MobileURLShare } from "./urlshare";
import { MobileScreenshot } from "./screenshot";
import { EventTree } from "./event_tree";

class HvMobile implements MobileInterface {
  /** Helioviewer reference for shared interactions that apply to mobile and desktop */
  private hv: Helioviewer;
  /** Playwright page object for interacting with the page */
  private page: Page;
  /** Bottom control bar locator */
  private _controls: Locator;
  /** #accordion-images - Reference to the image layer UI drawer */
  private _image_drawer: Locator;
  /** [drawersec=accordion-images] - Ref to the button which opens the image drawer */
  private _image_drawer_btn: Locator;
  /** [drawersec=accordion-images] - Ref to the button which opens the events drawer */
  private _events_drawer_btn: Locator;
  /** #hv-drawer-left - Ref to the drawer container which contains all the control elements */
  private _drawer: Locator;
  /** #hvmobdrawerclose - Ref to button which closes the control drawer */
  private _drawer_close_btn: Locator;
  public urlshare: MobileURLShare;
  public screenshot: MobileScreenshot;

  constructor(page: Page, info: TestInfo | null = null) {
    this.page = page;
    this.hv = new Helioviewer(page, info);
    this.urlshare = new MobileURLShare(page);
    this.screenshot = new MobileScreenshot(page, {
      IsScreenshotDialogOpen: () => this.IsScreenshotDialogOpen(),
      OpenScreenshotDialog: () => this.OpenScreenshotsDialog(),
      CloseMenu: () => this.CloseScreenshotsDialog()
    });
    this._controls = this.page.locator(".hvbottombar");
    this._image_drawer = this.page.locator("#accordion-images");
    this._image_drawer_btn = this.page.locator('[drawersec="accordion-images"]');
    this._events_drawer_btn = this.page.getByText("Features & Events");
    this._drawer = this.page.locator("#hv-drawer-left");
    this._drawer_close_btn = this.page.locator("#hvmobdrawerclose");
  }

  async ExpectLayer(
    index: number,
    name: string,
    observatory: string,
    instrument: string,
    measurement: string
  ): Promise<void> {
    await this.hv.ExpectLayer(index, name, observatory, instrument, measurement);
  }

  /**
   * Waits for the first image layer to be loaded.
   *
   * Since mobile view doesn't have a loading spinner at this time, we need
   * other ways of checking that the page has loaded. In this case we check
   * that the first image layer has been loaded.
   */
  private async _WaitForInitialImageLayer() {
    let layerAccordion = this.page.locator("#tileLayerAccordion");
    let imageLayers = layerAccordion.locator(".dynaccordion-section");
    await expect(imageLayers).toHaveCount(1, { timeout: 30000 });
  }

  /** Navigates to the mobile helioviewer page */
  async Load() {
    await this.page.goto("/");
    await this.page.evaluate(() => console.log(localStorage.getItem("settings")));
    // Wait for the first image layer to be loaded
    await this._WaitForInitialImageLayer();

    await this.WaitForLoad();
  }

  CloseAllNotifications(): Promise<void> {
    return this.hv.CloseAllNotifications();
  }

  getImageLayer(index: number): Promise<ImageLayer> {
    return this.hv.getImageLayer(index);
  }

  get scale_indicator(): ScaleIndicator {
    return this.hv.scale_indicator;
  }

  /**
   * Waits for all images on the page to finish loading.
   * @note Mobile doesn't have a loading spinner, so we can't easily wait for
   *       all events to finish loading.
   */
  async WaitForLoad(): Promise<void> {
    await this.hv.WaitForImageLoad();
  }

  /**
   * Alias for WaitForLoad to align with MobileInterface
   */
  async WaitForLoadingComplete(): Promise<void> {
    return await this.WaitForLoad();
  }

  /**
   * @returns true if the control drawer is open, else false.
   * On mobile, all the "accordions" are individual drawers, but they're
   * still contained within the overall sidebar container.
   */
  private async _IsDrawerOpen(): Promise<boolean> {
    return await this._drawer.isVisible();
  }

  private async _IsDrawerClosed(): Promise<boolean> {
    return !(await this._IsDrawerOpen());
  }

  async OpenImageLayerDrawer() {
    // This logic might be flaky.
    if ((await this._IsDrawerClosed()) || (await this._image_drawer.isHidden())) {
      await this._image_drawer_btn.tap();
    }
  }

  async OpenEventsDrawer() {
    // This logic might be flaky.
    if ((await this._IsDrawerClosed()) || (await this._image_drawer.isHidden())) {
      await this._events_drawer_btn.tap();
    }
  }

  async CloseDrawer() {
    if (await this._IsDrawerOpen()) {
      await this._drawer_close_btn.click();
    }
  }

  /**
   * This adds an image layer.
   */
  async AddImageLayer() {
    await this.hv.AddImageLayer();
  }

  async RemoveImageLayer(index: number): Promise<void> {
    await this.hv.RemoveImageLayer(index);
  }

  /**
   * Opens or Closes the sidebar menu
   */
  async ToggleSidebar() {
    await this.page.locator("#hvmobilemenu_btn").tap();
  }

  async IsSidebarOpen(): Promise<boolean> {
    // the mobile sidebar has class "zeynep", when its open it has "opened"
    // as well. So this will return true only if the sidebar is open.
    return await this.page.evaluate(() => document.querySelector(".zeynep.opened") != null);
  }

  async OpenSidebar() {
    if (!(await this.IsSidebarOpen())) {
      await this.ToggleSidebar();
    }
  }

  async CloseSidebar() {
    if (await this.IsSidebarOpen()) {
      await this.ToggleSidebar();
    }
  }

  /**
   * Opens the announcements dialog.
   */
  async OpenAnnouncements() {
    await this.OpenSidebar();
    await this.TapIfVisible(this.page.getByText("Helioviewer Project Announcements."));
  }

  private async TapIfVisible(locator: Locator) {
    if (await locator.isVisible()) {
      await locator.tap();
    }
  }

  async CloseAnnouncements() {
    await this.TapIfVisible(this.page.locator("#hv-drawer-news .hvmobmenuclose"));
  }

  /**
   * Opens the youtube dialog.
   */
  async OpenYoutubeVideosDialog() {
    await this.OpenSidebar();
    await this.TapIfVisible(this.page.getByText("View Helioviewer MoviesShared"));
  }

  async CloseYoutubeVideosDialog() {
    await this.TapIfVisible(this.page.locator("#hv-drawer-youtube .hvmobmenuclose"));
  }

  /**
   * Open the movie creation dialog
   */
  async OpenMovieDialog() {
    await this.OpenSidebar();
    await this.TapIfVisible(this.page.getByText("Create a movie."));
  }

  async CloseMovieDialog() {
    await this.TapIfVisible(this.page.locator("#hv-drawer-movies .hvmobmenuclose"));
  }

  async IsScreenshotDialogOpen(): Promise<boolean> {
    return await this.page.getByText("Take a Screenshot").isVisible();
  }

  /**
   * Open the screenshot creation dialog
   */
  async OpenScreenshotsDialog() {
    await this.OpenSidebar();
    await this.TapIfVisible(this.page.getByText("Create a screenshot."));
    // Wait for animation to complete
    await this.page.waitForTimeout(500);
  }

  async CloseScreenshotsDialog() {
    await this.TapIfVisible(this.page.locator("#hv-drawer-screenshots .hvmobmenuclose"));
  }

  /**
   * Open the share viewport dialog
   */
  async OpenShareViewportDialog() {
    await this.OpenSidebar();
    await this.TapIfVisible(this.page.getByText("Share the current viewport on social media."));
  }

  async CloseShareViewportDialog() {
    await this.TapIfVisible(this.page.locator("#hv-drawer-share .hvmobmenuclose"));
  }

  /**
   * Open the help menu
   */
  async OpenHelpMenu() {
    await this.OpenSidebar();
    await this.TapIfVisible(this.page.getByText("Get Help with Helioviewer."));
  }

  async CloseHelpMenu() {
    await this.TapIfVisible(this.page.getByText("Main Menu"));
  }

  async CloseDialog() {
    let closers = await this.page.locator(".ui-dialog-titlebar-close").all();
    await Promise.all(
      closers.map(async (btn) => {
        await this.TapIfVisible(btn);
      })
    );
  }

  async UseNewestImage() {
    await this.page.locator("#timeNowBtn_mob_td #timeNowBtn").click();
    // TODO: A lot of things happen here. How do we consistently verify
    // that all the things happen?
    // - Date MIGHT change if the newest date is different than
    // - Notifications MIGHT disappear IF there was previously a warning, and now there's not.
    // - Images might change
    // - Event pins might change
    // Waiting for time is inherently flaky, but what's a better way?
    await this.page.waitForTimeout(1000);
  }

  private async _WaitForStyleToSettle(locator: Locator) {
    // Wait for zoom to finish (indicated by style no longer changing)
    let style = "";
    let next_style = "";
    do {
      style = next_style;
      // Wait a small amount of time
      await this.page.waitForTimeout(100);
      // Check the style
      next_style = (await locator.getAttribute("style")) as string;
    } while (next_style !== style);
  }

  async ZoomIn(steps: number) {
    for (let i = 0; i < steps; i++) {
      await this.page.keyboard.press("+");
      await this._WaitForStyleToSettle(this.page.locator("#moving-container"));
    }
  }

  async ZoomOut(steps: number) {
    for (let i = 0; i < steps; i++) {
      await this.page.keyboard.press("-");
      await this._WaitForStyleToSettle(this.page.locator("#moving-container"));
    }
  }

  async AssertNoSharedYoutubeVideos() {
    await this.OpenYoutubeVideosDialog();
    await expect(this.page.getByText("No shared movies found.")).toHaveCount(1);
    await this.CloseYoutubeVideosDialog();
  }

  /**
   * Move the viewport by the given amount
   * @param x Horizontal amount
   * @param y Vertical amount
   */
  async moveViewport(x: number, y: number) {
    const INITIAL_POSITION = { x: 150, y: 400 };
    await this.page.mouse.move(INITIAL_POSITION.x, INITIAL_POSITION.y);
    await this.page.mouse.down();
    await this.page.mouse.move(INITIAL_POSITION.x + x, INITIAL_POSITION.y + y);
    await this.page.mouse.up();
  }

  /**
   * Center the viewport
   */
  async CenterViewport() {
    await this.page.locator("#hvmobscale_div #center-button").tap();
  }

  async GetLoadedDate(): Promise<Date> {
    const currentDate = await this.page.getByLabel("Observation date", { exact: true }).inputValue();
    const currentTime = await this.page.getByRole("textbox", { name: "Observation time" }).inputValue();
    const date = new Date(currentDate + " " + currentTime + "Z");
    expect(date.getTime()).not.toBeNaN();
    return date;
  }

  async SetObservationDateTime(date: string, time: string) {
    await this._controls.getByLabel("Observation date", { exact: true }).tap();
    await this._controls.getByLabel("Observation date", { exact: true }).fill(date);
    await this._controls.getByLabel("Observation time").tap();
    // On mobile, the flatpickr controls must be used for times.
    const times = time.split(":");
    // Find the visible flatpickr instance
    const flatpickrs = await this.page.locator(".flatpickr-calendar").all();
    const timepicker = (
      await Promise.all(
        flatpickrs.map(async (locator) => {
          return { locator: locator, visible: await locator.isVisible() };
        })
      )
    ).filter((result) => result.visible)[0].locator;

    await timepicker.getByLabel("Hour").click();
    await timepicker.getByLabel("Hour").fill(times[0]);
    await timepicker.getByLabel("Minute").click();
    await timepicker.getByLabel("Minute").fill(times[1]);
    await timepicker.getByLabel("Second").click();
    await timepicker.getByLabel("Second").fill(times[2]);
    await timepicker.getByLabel("Second").press("Enter");
  }

  async SetObservationDateTimeFromDate(date: Date): Promise<void> {
    const dateParts = date.toISOString().split("T")[0].split("-");
    const dateString = `${dateParts[0]}/${dateParts[1]}/${dateParts[2]}`;

    const timeParts = date.toISOString().split("T")[1].split(":");
    const timeSeconds = timeParts[2].split(".")[0];
    const timeString = `${timeParts[0]}:${timeParts[1]}:${timeSeconds}`;
    await this.SetObservationDateTime(dateString, timeString);
  }

  async JumpForwardDateWithSelection(seconds: number): Promise<void> {
    await this._controls.getByLabel("Jump:").selectOption(seconds.toString());
    await this._controls.getByAltText("Timeframe right arrow").click();
  }

  async JumpBackwardsDateWithSelection(seconds: number): Promise<void> {
    await this._controls.getByLabel("Jump:").selectOption(seconds.toString());
    await this._controls.getByAltText("Timeframe left arrow").click();
  }

  /**
   * Attach base64 screnshot with a given filename to trace report
   * also returns the screenshot string
   * @param {string} filename name of file in trace report
   * @param {PageScreenshotOptions} options pass options to playwright screenshot function
   * @returns {Promise<string>} base64 string screenshot
   */
  saveScreenshot(filename: string = "", options: PageScreenshotOptions = {}): Promise<string> {
    return this.hv.saveScreenshot(filename, options);
  }

  /**
   * Returns a handle to interact with event tree in UI
   * @param source string, ex: HEK, CCMC, RHESSI
   * @return EventTree
   */
  parseTree(source: string): EventTree {
    return this.hv.parseTree(source);
  }
}

export { HvMobile };
