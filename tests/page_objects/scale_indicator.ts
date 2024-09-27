import { expect, Locator, Page } from "@playwright/test";

class ScaleIndicator {
  private page: Page;
  /** img of Earth inside the earth scale div */
  private earth_scale_img: Locator;
  /** Bar scale container */
  private bar_scale: Locator;
  /** Button which enables/disables the earth scale div */
  private mobile_earth_scale_btn: Locator;
  /** Button which enables/disables the bar scale div */
  private mobile_bar_scale_btn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.earth_scale_img = this.page.locator("#earthScale");
    this.bar_scale = this.page.locator("#barScaleBlock");
    this.mobile_earth_scale_btn = this.page.locator("#hvmobscale_div #earth-button");
    this.mobile_bar_scale_btn = this.page.locator("#hvmobscale_div #scalebar-button");
  }

  /**
   * Asserts that the earth scale is visible and the bar scale is not.
   * Only one can be visible at a time
   */
  async assertEarthIsVisible() {
    await expect(this.earth_scale_img).toBeVisible();
    await expect(this.earth_scale_img).toBeInViewport();
    await expect(this.bar_scale).not.toBeVisible();
    await expect(this.bar_scale).not.toBeInViewport();
  }

  /**
   * Asserts that the bar scale is visible and the earth scale is not.
   * Only one can be visible at a time
   */
  async assertBarIsVisible() {
    await expect(this.bar_scale).toBeVisible();
    await expect(this.bar_scale).toBeInViewport();
    await expect(this.earth_scale_img).not.toBeVisible();
    await expect(this.earth_scale_img).not.toBeInViewport();
  }

  /**
   * Asserts that none of the scales are visible
   */
  async assertHidden() {
    await expect(this.bar_scale).not.toBeVisible();
    await expect(this.bar_scale).not.toBeInViewport();
    await expect(this.earth_scale_img).not.toBeVisible();
    await expect(this.earth_scale_img).not.toBeInViewport();
  }

  /**
   * Assert the earth scale css size matches the given size
   */
  async assertSizeMatches(width: number, height: number) {
    await expect(this.earth_scale_img).toHaveCSS("width", `${width}px`);
    await expect(this.earth_scale_img).toHaveCSS("height", `${height}px`);
  }

  /**
   * Assert the bar scale label has the given string
   */
  async assertBarScaleLabelMatches(label: string) {
    await expect(this.page.getByText(`${label} km`)).toBeVisible();
  }

  async TapBarScale() {
    await this.mobile_bar_scale_btn.tap();
  }

  async TapEarthScale() {
    await this.mobile_earth_scale_btn.tap();
  }
}

export { ScaleIndicator };
