import { Page, Locator, expect, Download } from "@playwright/test";

import { ImageHeaderDialog } from "./image_headers_dialog";

/**
 * Interface for interacting with elements related to a specific
 * image layer on Heliovewer.org
 */
class ImageLayer {
  /** Playwright page instance */
  private page: Page;
  /** Helioviewer Tile Layer id used to reference layer specific elements */
  readonly id: string;
  /** Locator for the image layer's opacity slider */
  private opacity_slider: Locator;
  private opacity_slider_handle: Locator;
  /** Tile layer div which contains all the controls unique to this layer */
  private layer_controls: Locator;

  constructor(page: Page, id: string) {
    this.page = page;
    this.id = id;
    this.opacity_slider = this.page.locator("#opacity-slider-track-tile-layer-" + id);
    this.opacity_slider_handle = this.opacity_slider.locator(".ui-slider-handle");
    this.layer_controls = this.page.locator("#tile-layer-" + id);
  }

  /**
   * Sets the layer opacity via the slider track
   * This also expects that the image opacity is within 0.1 units
   * @param opacity Value between 0 and 1
   */
  async setOpacity(opacity: number) {
    // Get the desired target position for the specified opacity.
    let box = await this.opacity_slider.boundingBox();
    // since boundingBox() can potentially return null, assert that it is not null.
    expect(box).not.toBeNull();
    // Target y is the middle of the slider
    let target_y = (box!.y + (box!.y + box!.height)) / 2;
    // Target x points to the desired opacity. i.e. opacity = 0 will click the left of the slider
    // and opacity=1 will click the right side of the slider.
    // Add a tiny offset since clicking the left side doesn't register.
    let target_x = box!.x + opacity * box!.width + 0.5;

    // Get the position of the slider handle.
    let slider_handle_box = await this.opacity_slider_handle.boundingBox();
    // since boundingBox() can potentially return null, assert that it is not null.
    expect(slider_handle_box).not.toBeNull();
    let slider_center = {
      x: slider_handle_box!.x + slider_handle_box!.width / 2,
      y: slider_handle_box!.y + slider_handle_box!.height / 1.5
    };

    // Move mouse to slider handle
    await this.page.mouse.move(slider_center.x, slider_center.y);
    // Click and hold the slider handle
    await this.page.mouse.down();
    // Drag the slider to the desired position for the given opacity
    await this.page.mouse.move(target_x, target_y);
    // Release the mouse button
    await this.page.mouse.up();
    // Expect that the image opacity is near the slider opacity.
    await expect(await this.getOpacity()).toBeCloseTo(opacity, 1);
  }

  /**
   * Returns the apparent opacity that is observed on the image tiles.
   */
  async getOpacity(): Promise<number> {
    // Get the opacity on the first tile that matches this layer.
    return await this.getTile(0).evaluate((e) => parseFloat(e.style.opacity));
  }

  /**
   * Sets a value in the image layer controls.
   * i.e. set('Observatory:', 'SOHO') to set the observatory field to SOHO
   * @param {string} label, which field to set the value for
   * @param {string} value, to set the control
   * @return {Promise<void>} , no return just doing things
   */
  async set(label: string, value: string): Promise<void> {
    let selection = await this.layer_controls.getByLabel(label, { exact: true });
    await selection.selectOption(value);
    await this.page.waitForTimeout(500);
  }

  /**
   * Gets any form field value in layer selection control
   * @param {string} label, which field we are looking for the get the value
   * @return {Promise<string>} , value of the form field
   */
  async get(label: string): Promise<string> {
    let selection = await this.layer_controls.getByLabel(label, { exact: true });
    return selection.inputValue();
  }

  /**
   * Asserts a value for the given image layer controls
   * @param {string} label, which field to assert
   * @param {string} value, making asserting with this value
   * @return {Promise<void>} , no return just doing things
   */
  async assert(label: string, value: string): Promise<void> {
    const layerControlValue = await this.get(label);
    expect(layerControlValue).toBe(value);
  }

  /**
   * Sets the value of the running difference field.
   * @param value
   */
  async setRunningDifferenceValue(value: number) {
    // This action will trigger some API requests, so we'll wait for
    // at least one of those to finish before returning from this function.
    let request = this.page.waitForResponse(/difference=1/);
    let input = this.layer_controls.getByLabel("Running difference", { exact: true });
    await input.fill(value.toString());
    await input.blur();
    // Wait for difference image requests to be made.
    await request;
  }

  async setBaseDifferenceDate(date: string, time: string) {
    await this.layer_controls.getByLabel("Base difference").fill(date);
    await this.layer_controls.getByLabel("Base difference").press("Enter");
    await this.layer_controls.getByLabel("Time", { exact: true }).fill(time);
    await this.layer_controls.getByLabel("Time", { exact: true }).press("Enter");
  }

  async getBaseDifferenceDate(): Promise<string> {
    return await this.layer_controls.getByLabel("Base difference").inputValue();
  }

  async getBaseDifferenceTime(): Promise<string> {
    return await this.layer_controls.getByLabel("Time", { exact: true }).inputValue();
  }

  /**
   * @description Get the layer's base difference date as a Date object with correct timezone UTC.
   * @return {Date} date , base difference date
   */
  async getBaseDifferenceDateObject(): Promise<Date> {
    let differenceDate = await this.getBaseDifferenceDate();
    let differenceTime = await this.getBaseDifferenceTime();
    return new Date(differenceDate + " " + differenceTime + " UTC");
  }

  /**
   * Returns the given image tile (img tag)
   */
  getTile(index: number): Locator {
    return this.page.locator(`.tile-layer-container[rel=tile-layer-${this.id}] .tile`).nth(index);
  }

  /**
   * Asserts if the given date matches the available image date for this layer.
   * @param {Date} date , given date tobe matched to the image date for this layer
   * @return void
   */
  async assertImageDate(date: Date): Promise<void> {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Months are zero-indexed in JS
    const day = String(date.getUTCDate()).padStart(2, "0");
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const seconds = String(date.getUTCSeconds()).padStart(2, "0");

    await expect(this.layer_controls.locator(".timestamp")).toHaveText(
      `${year}/${month}/${day} ${hours}:${minutes}:${seconds} UTC`
    );
  }

  /**
   * Asserts if available image date is green.
   * @return void
   */
  async assertImageDateAvailable(): Promise<void> {
    await expect(this.layer_controls.locator(".timestamp")).toHaveCSS("color", "rgb(0, 255, 0)");
  }

  /**
   * Asserts if layer has next image available.
   * @return void
   */
  async assertHasNextImage(): Promise<void> {
    await expect(this.layer_controls.locator(".next-image-btn")).toHaveCSS("cursor", "pointer");
    await expect(this.layer_controls.locator(".next-image-btn")).toHaveCSS("color", "rgb(0, 128, 0)");
  }

  /**
   * Asserts if layer has not any next image available.
   * @return void
   */
  async assertHasNoNextImage(): Promise<void> {
    await expect(this.layer_controls.locator(".next-image-btn")).toHaveCSS("cursor", "default");
    await expect(this.layer_controls.locator(".next-image-btn")).toHaveCSS("color", "rgb(255, 0, 0)");
  }

  /**
   * Asserts if layer has prev image available.
   * @return void
   */
  async assertHasPreviousImage(): Promise<void> {
    await expect(this.layer_controls.locator(".prev-image-btn")).toHaveCSS("cursor", "pointer");
    await expect(this.layer_controls.locator(".prev-image-btn")).toHaveCSS("color", "rgb(0, 128, 0)");
  }

  /**
   * Asserts if layer has not any prev image available.
   * @return void
   */
  async assertHasNoPreviousImage(): Promise<void> {
    await expect(this.layer_controls.locator(".prev-image-btn")).toHaveCSS("cursor", "default");
    await expect(this.layer_controls.locator(".prev-image-btn")).toHaveCSS("color", "rgb(255, 0, 0)");
  }

  /**
   * Go previous available image for this layer.
   * @return void
   */
  async gotoPreviousImage(): Promise<void> {
    await this.assertHasPreviousImage();
    await this.layer_controls.locator(".prev-image-btn").click();
  }

  /**
   * Go next available image for this layer.
   * @return void
   */
  async gotoNextImage(): Promise<void> {
    await this.assertHasNextImage();
    await this.layer_controls.locator(".next-image-btn").click();
  }

  /**
   * Press layers show image header button.
   * @return void
   */
  async showImageHeader(): Promise<void> {
    await this.layer_controls.locator(".image-info-dialog-btn").click();
  }

  /**
   * Triggers download jp2 image process and returns download promise.
   * @return {Promise<Download>} dowload promise to be fullfileed with await
   */
  async downloadJp2(): Promise<Download> {
    const downloadPromise = this.page.waitForEvent("download");
    await this.layer_controls.getByTitle("Download full JPEG 2000 image (grayscale).").click();
    return downloadPromise;
  }

  /**
   * Parse image header dialog box for assertions.
   * @return {ImageHeaderDialog} , parsed image header dialog box
   */
  async getImageHeaderDialog(): Promise<ImageHeaderDialog> {
    const box = await this.page.locator("//div[contains(@aria-describedby, 'image-info-dialog-tile-layer')]");
    return new ImageHeaderDialog(box);
  }
}

export { ImageLayer };
