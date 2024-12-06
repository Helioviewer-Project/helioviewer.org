import { expect, Page, TestInfo } from "@playwright/test";
import { Helioviewer } from "./helioviewer";
import { MinimalInterface } from "./helioviewer_interface";

/**
 * Interface for Helioviewer's Embedded view
 */
class HelioviewerMinimal implements MinimalInterface {
  /** Playwright page */
  private page: Page;
  private info: TestInfo | null;

  /** Reference to Helioviewer main view for shared code */
  private hv: Helioviewer;

  constructor(page: Page, info: TestInfo | null = null) {
    this.page = page;
    this.info = info;
    this.hv = new Helioviewer(page, info);
  }
  /**
   * In minimal view, there's nothing to do since the controls are always visible.
   */
  async OpenImageLayerDrawer(): Promise<void> {
    return;
  }

  async Load(url: string = "/"): Promise<void> {
    // Try to add "output=embed" to the given url string.
    // If there's already a query string, then add output=embed to the end
    if (url.indexOf("?") != -1) {
      url = `${url}&output=minimal`;
    }
    // If there's not a query string, assume we can add one.
    else {
      url = `${url}?output=minimal`;
    }

    await this.page.goto(url);
    await expect(this.page.locator(".tile")).toHaveCount(4);
    await this.WaitForLoadingComplete();
  }

  async WaitForLoadingComplete(): Promise<void> {
    await this.hv.WaitForLoadingComplete();
  }

  async CloseAllNotifications(): Promise<void> {
    await this.hv.CloseAllNotifications();
  }

  async ZoomIn(steps: number): Promise<void> {
    await this.hv.ZoomIn(steps);
  }

  async ZoomOut(steps: number): Promise<void> {
    await this.hv.ZoomOut(steps);
  }
}

export { HelioviewerMinimal };
