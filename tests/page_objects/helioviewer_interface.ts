import { Page, PageScreenshotOptions, TestInfo } from "@playwright/test";
import { Helioviewer } from "./helioviewer";
import { HelioviewerEmbed } from "./helioviewer_embed";
import { HelioviewerMinimal } from "./helioviewer_minimal";
import { HvMobile } from "./mobile_hv";
import { ImageLayer } from "./image_layer";
import { URLShare, MobileURLShare } from "./urlshare";
import { Screenshot } from "./screenshot";
import { EventTree } from "./event_tree";

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
interface MinimalInterface extends EmbedInterface {
  /**
   * Opens the drawer which contains image layer information
   */
  OpenImageLayerDrawer(): Promise<void>;
}

/**
 * Mobile specific functionality
 * Supports all functions in Minimal and Embed
 */
interface MobileInterface extends MinimalInterface {
  urlshare: URLShare | MobileURLShare;
  screenshot: Screenshot;

  /**
   * Opens the drawer which contains image layer information
   */
  OpenImageLayerDrawer(): Promise<void>;

  /**
   * Opens the screenshot UI
   */
  OpenScreenshotsDialog(): Promise<void>;

  /**
   * Opens the drawer which contains featres & events selections
   */
  OpenEventsDrawer(): Promise<void>;

  /**
   * Close any open drawer
   */
  CloseDrawer(): Promise<void>;

  /**
   * Get a reference to an image layer's controls
   */
  getImageLayer(index: number): Promise<ImageLayer>;

  /**
   * Get the current observation date
   * @returns {Date} Current Observation Date
   */
  GetLoadedDate(): Promise<Date>;

  /**
   * Sets observation datetime of Helioviewer from given Date object,
   * @param {Date} Date The date object to be used to load observation datetime.
   */
  SetObservationDateTimeFromDate(date: Date): Promise<void>;

  /**
   * Jump forward with jump button, with given seconds layer
   * @param {number} seconds interval in seconds
   * @returns {void}
   */
  JumpForwardDateWithSelection(seconds: number): Promise<void>;

  /**
   * Attach base64 screnshot with a given filename to trace report
   * also returns the screenshot string
   * @param {string} filename name of file in trace report
   * @param {PageScreenshotOptions} options pass options to playwright screenshot function
   * @returns {Promise<string>} base64 string screenshot
   */
  saveScreenshot(filename?: string, options?: PageScreenshotOptions): Promise<string>;

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

  /**
   * Add a new image layer to the viewport.
   */
  AddImageLayer(): Promise<void>;

  /**
   * Remove an image layer from the viewport by its
   * order in the UI.
   * @param {number} index Layer to remove (0 is first, 1 is second, ...)
   */
  RemoveImageLayer(index: number): Promise<void>;

  /**
   * Expects that the given image layer index matches the given values
   * @param index Image layer index
   * @param observatory
   * @param instrument
   * @param measurement
   */
  ExpectLayer(index: number, name: string, observatory: string, instrument: string, measurement: string);

  /**
   * Returns a handle to interact with event tree in UI
   * @param source string, ex: HEK, CCMC, RHESSI
   * @return EventTree
   */
  parseTree(source: string): EventTree;
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
