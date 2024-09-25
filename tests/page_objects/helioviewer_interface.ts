import { Page } from "@playwright/test";
import { Helioviewer } from "./helioviewer";
import { HelioviewerEmbed } from "./helioviewer_embed";
import { HelioviewerMinimal } from "./helioviewer_minimal";
import { HvMobile } from "./mobile_hv";

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
interface MinimalInterface extends EmbedInterface {};

/**
 * Mobile specific functionality
 * Supports all functions in Minimal and Embed
 */
interface MobileInterface extends MinimalInterface {
    /**
     * Opens the drawer with
     */
    OpenImageLayerDrawer(): Promise<void>;
};

/**
 * Desktop specific functionality.
 * Supports all functions in Mobile, Minimal, and Embed
 */
interface DesktopInterface extends MobileInterface {};


/** View types available for helioviewer */
type HelioviewerView = {
    name: string,
    tag: string
}
const NormalView: HelioviewerView = {
    name: "Normal",
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
    static Create(view: HelioviewerView, page: Page): EmbedInterface | MinimalInterface | MobileInterface | DesktopInterface {
        switch (view) {
            case EmbedView:
                return new HelioviewerEmbed(page);
            case MinimalView:
                return new HelioviewerMinimal(page);
            case NormalView:
                return new Helioviewer(page);
            case MobileView:
                return new HvMobile(page);
            default:
                throw "Invalid View";
        }
    }
  }
}

export {
    NormalView,
    MinimalView,
    EmbedView,
    MobileView,
    EmbedInterface,
    MinimalInterface,
    MobileInterface,
    DesktopInterface,
    HelioviewerFactory,
}
