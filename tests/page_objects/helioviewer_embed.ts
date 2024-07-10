import { test, expect, Page } from '@playwright/test';
import { Helioviewer } from './helioviewer';
import { HelioviewerInterface } from './helioviewer_interface';

/**
 * Interface for Helioviewer's Embedded view
 */
class HelioviewerEmbed implements HelioviewerInterface {
    /** Playwright page */
    private page: Page;

    /** Reference to Helioviewer main view for shared code */
    private hv: Helioviewer;

    constructor(page: Page) {
        this.page = page;
        this.hv = new Helioviewer(page);
    }

    async Load(url: string = "/"): Promise<void> {
        // Try to add "output=embed" to the given url string.
        // If there's already a query string, then add output=embed to the end
        if (url.indexOf("?") != -1) {
            url = `${url}&output=embed`;
        }
        // If there's not a query string, assume we can add one.
        else {
            url = `${url}?output=embed`;
        }

        await this.page.goto(url);
        await this.page.waitForTimeout(1000);
        await this.WaitForLoadingComplete();
    }

    async WaitForLoadingComplete(): Promise<void> {
        await this.hv.WaitForImageLoad();
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

export { HelioviewerEmbed }
