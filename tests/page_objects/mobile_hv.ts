/**
 * @file Contains functions for interacting with the Helioviewer Mobile UI
 */

import { Locator, Page, expect } from '@playwright/test';
import { Helioviewer } from './helioviewer';
import { ImageLayer } from './image_layer';

class HvMobile {
    /** Helioviewer reference for shared interactions that apply to mobile and desktop */
    private hv: Helioviewer;
    /** Playwright page object for interacting with the page */
    private page: Page;
    /** #accordion-images - Reference to the image layer UI drawer */
    private _image_drawer: Locator;
    /** [drawersec=accordion-images] - Ref to the button which opens the image drawer */
    private _image_drawer_btn: Locator;
    /** #hv-drawer-left - Ref to the drawer container which contains all the control elements */
    private _drawer: Locator;
    /** #hvmobdrawerclose - Ref to button which closes the control drawer */
    private _drawer_close_btn: Locator;

    constructor(page: Page) {
        this.page = page;
        this.hv = new Helioviewer(page);
        this._image_drawer = this.page.locator('#accordion-images');
        this._image_drawer_btn = this.page.locator('[drawersec="accordion-images"]');
        this._drawer = this.page.locator('#hv-drawer-left');
        this._drawer_close_btn = this.page.locator('#hvmobdrawerclose');
    }

    /**
     * Waits for the first image layer to be loaded.
     *
     * Since mobile view doesn't have a loading spinner at this time, we need
     * other ways of checking that the page has loaded. In this case we check
     * that the first image layer has been loaded.
     */
    private async _WaitForInitialImageLayer() {
        let layerAccordion = await this.page.locator('#tileLayerAccordion');
        let imageLayers = await layerAccordion.locator(".dynaccordion-section");
        await expect(imageLayers).toHaveCount(1);
    }

    /** Navigates to the mobile helioviewer page */
    async Load() {
        await this.page.goto('/');
        // Wait for the first image layer to be loaded
        await this._WaitForInitialImageLayer();

        await this.WaitForLoad();
    }

    getImageLayer(index: number): Promise<ImageLayer> {
        return this.hv.getImageLayer(index);
    }

    /**
     * Waits for all images on the page to finish loading.
     * @note Mobile doesn't have a loading spinner, so we can't easily wait for
     *       all events to finish loading.
     */
    async WaitForLoad() {
        await this.hv.WaitForImageLoad();
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
        if (await this._IsDrawerClosed() || await this._image_drawer.isHidden()) {
            await this._image_drawer_btn.click();
        }
    }

    async CloseDrawer() {
        if (await this._IsDrawerOpen()) {
            await this._drawer_close_btn.click();
        }
    }

    AddImageLayer() {
        return this.hv.AddImageLayer();
    }
}

export { HvMobile }
