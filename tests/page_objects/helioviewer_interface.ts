import { Page } from "@playwright/test";
import { Helioviewer } from "./helioviewer";
import { HelioviewerEmbed } from "./helioviewer_embed";
import { HelioviewerMinimal } from "./helioviewer_minimal";

/**
 * Represents the common functions that should be available in all Helioviewer
 * interfaces (mobile, embed, minimal, desktop)
 */
interface HelioviewerInterface {
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

/** View types available for helioviewer */
type HelioviewerView = "Normal" | "Minimal" | "Embed";

// Add some constants for the strings so we don't need to deal with string
// literals.
const NormalView = "Normal";
const MinimalView = "Minimal";
const EmbedView = "Embed";

/**
 * List of all available Helioviewer views.
 * Iterate over this to create tests that apply to all views.
 */
let HelioviewerViews: HelioviewerView[] = [
    NormalView,
    MinimalView,
    EmbedView
]

/**
 * Returns an implementation for interacting with the desired helioviewer
 * interface. This is useful for writing one test case that applies to all views.
 *
 * @note If you are targeting a specific view, use that view's constructor directly.
 *       Only use this for a view-agnostic test that can be run for all views.
 *       The scope of available functions is limited using the generic interface.
 * @param view
 */
function InterfaceFor(view: HelioviewerView, page: Page): HelioviewerInterface {
    switch (view) {
        case EmbedView:
            return new HelioviewerEmbed(page);
        case MinimalView:
            return new HelioviewerMinimal(page);
        case NormalView:
            return new Helioviewer(page);
        default:
            throw "Invalid View";
    }
}

export {
    NormalView,
    MinimalView,
    EmbedView,
    HelioviewerViews,
    InterfaceFor,
    HelioviewerInterface
}
