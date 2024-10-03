import { Page, PageScreenshotOptions, TestInfo } from "@playwright/test";
import { Helioviewer } from "./helioviewer";
import { HelioviewerEmbed } from "./helioviewer_embed";
import { HelioviewerMinimal } from "./helioviewer_minimal";
import { HvMobile } from "./mobile_hv";
import { ImageLayer } from "./image_layer";

/**
 * Represents the common functions that should be available in the Embed view
 * and above (Embed, Minimal, Mobile, and Desktop)
 */
interface EmbedInterface {
  /**
   * Loads the given page url.
   * This function should also wait until the HV application has finished loading.
   */
  Load(url?: string): Promise<void>;

  /**
   * Waits for everything on the page to finish loading.
   * That is, waits for all images and events to load.
   *
   * @note Embed doesn't have a loading spinner, so loading may be flaky.
   */
  WaitForLoadingComplete(): Promise<void>;

  /**
   * Closes all Helioviewer notifications.
   */
  CloseAllNotifications(): Promise<void>;

  /**
   * Zoom in by using the zoom in button
   * @param steps Number of steps to zoom in. Each step is approximately 2x zoom.
   */
  ZoomIn(steps: number): Promise<void>;

  /**
   * Zoom out using the zoom out button.
   * @param steps Number of steps to zoom out. Each step is approximately 1/2 zoom.
   */
  ZoomOut(steps: number): Promise<void>;
}

/**
 * Minimal view functionality.
 * Supports all functions in EmbedView.
 */
interface MinimalInterface extends EmbedInterface {}

/**
 * Mobile specific functionality
 * Supports all functions in Minimal and Embed
 */
interface MobileInterface extends MinimalInterface {
  /**
   * Opens the section of the UI which contains image layer information
   */
  OpenImageLayerDrawer(): Promise<void>;

  /**
   * Close any open drawer
   */
  CloseDrawer(): Promise<void>;

  /**
   * Get a reference to an image layer's controls
   */
  getImageLayer(index: number): Promise<ImageLayer>

  /**
   * Get the current observation date
   * @returns {Date} Current Observation Date
   */
  GetLoadedDate(): Promise<Date>

  /**
   * Sets observation datetime of Helioviewer from given Date object,
   * @param {Date} Date The date object to be used to load observation datetime.
   */
  SetObservationDateTimeFromDate(date: Date): Promise<void>

  /**
   * Jump forward with jump button, with given seconds layer
   * @param {number} seconds interval in seconds
   * @returns {void}
   */
  JumpForwardDateWithSelection(seconds: number): Promise<void>

  /**
   * Attach base64 screnshot with a given filename to trace report
   * also returns the screenshot string
   * @param {string} filename name of file in trace report
   * @param {PageScreenshotOptions} options pass options to playwright screenshot function
   * @returns {Promise<string>} base64 string screenshot
   */
  saveScreenshot(filename: string, options: PageScreenshotOptions): Promise<string>;

  /**
   * Select option to use the newest image for the currently selected image layer
   */
  UseNewestImage(): Promise<void>;

  /**
   * Jump backwards with jump button, with given seconds layer
   * @param {number} seconds interval in seconds
   * @returns {void}
   */
  JumpBackwardsDateWithSelection(seconds: number): Promise<void>;

}

/**
 * Desktop specific functionality.
 * Supports all functions in Mobile, Minimal, and Embed
 */
interface DesktopInterface extends MobileInterface {}

/** View types available for helioviewer */
type HelioviewerView = {
  name: string;
  tag: string;
};
const DesktopView: HelioviewerView = {
  name: "Desktop",
  tag: "@Desktop"
};

const MinimalView: HelioviewerView = {
  name: "Minimal",
  tag: "@Minimal"
};

const EmbedView: HelioviewerView = {
  name: "Embed",
  tag: "@Embed"
};

const MobileView: HelioviewerView = {
  name: "Mobile",
  tag: "@Mobile"
};

class HelioviewerFactory {
  /**
   * Returns an implementation for interacting with the desired helioviewer
   * interface. This is useful for writing one test case that applies to all views.
   *
   * @note If you are targeting a specific view, use that view's constructor directly.
   *       Only use this for a view-agnostic test that can be run for all views.
   *       The scope of available functions is limited using the generic interface.
   * @param view
   */
  static Create(
    view: HelioviewerView,
    page: Page,
    info: TestInfo
  ): EmbedInterface | MinimalInterface | MobileInterface | DesktopInterface {
    switch (view) {
      case EmbedView:
        return new HelioviewerEmbed(page, info);
      case MinimalView:
        return new HelioviewerMinimal(page, info);
      case DesktopView:
        return new Helioviewer(page, info);
      case MobileView:
        return new HvMobile(page, info);
      default:
        throw "Invalid View";
    }
  }
}

export {
  DesktopView,
  MinimalView,
  EmbedView,
  MobileView,
  EmbedInterface,
  MinimalInterface,
  MobileInterface,
  DesktopInterface,
  HelioviewerFactory
};
