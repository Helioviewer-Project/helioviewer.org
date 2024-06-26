/**
 * @file Contains functions for interacting with the Helioviewer UI
 */

import { Page, expect } from '@playwright/test';
import exp from 'constants';

/**
 * Matches an image layer selection
 * i.e. { label: Observatory, value: SOHO }
 *      { label: Energy Band, value: 3-6keV }
 */
interface LayerSelect {
    label: string,
    value: string
}

class Helioviewer {
    page: Page;

    constructor(page) {
        this.page = page;
    }

    async Load() {
        await this.page.goto('/');
        await this.WaitForLoadingComplete();
    }

    async ExpectLayerEx(index: number, name: string, selections: LayerSelect[]) {
        await expect(this.page.getByText(name, { exact: true })).toBeVisible();
        for (let i = 0; i < selections.length; i++) {
            let layer = selections[i];
            await expect(this.page.getByLabel(layer.label).nth(index)).toHaveValue(layer.value);
        }
    }

    /**
     * Expects that the given image layer index matches the given values
     * @param index Image layer index
     * @param observatory
     * @param instrument
     * @param detector
     * @param measurement
     */
    async ExpectLayer(index: number, name: string, observatory: string, instrument: string, measurement: string) {
        await this.ExpectLayerEx(index, name, [
            { label: "Observatory", value: observatory },
            { label: "Instrument", value: instrument },
            { label: "Measurement", value: measurement }
        ]);
    }

    async UseNewestImage() {
        await this.page.getByText('NEWEST', {exact : true}).click();
    }

    async WaitForImageLoad() {
        let locators = await this.page.locator('//img');
        let images = await locators.all();
        let promises = images.map(locator => locator.evaluate(img => (img as HTMLImageElement).complete || new Promise(f => img.onload = f)));
        await Promise.all(promises);
    }

    async CloseAllNotifications() {
        let close_buttons = await this.page.locator('.jGrowl-close');
        let count = await close_buttons.count()
        for (let n = 0; n < count; n++) {
            await close_buttons.nth(n).click();
        }
        // Wait for notifications to disappear
        await this.page.waitForTimeout(1000);
    }

    /**
     * Clicks the add layer button in the image sidebar
     */
    async AddImageLayer() {
        let initial_count = await this.page.locator('.removeBtn').count();
        await this.page.getByRole('link', { name: 'Add Layer' }).click();
        await this.WaitForLoadingComplete();
        await expect(this.page.locator('.removeBtn')).toHaveCount(initial_count + 1);
        await this.WaitForLoadingComplete();
    }

    /**
     * Removes an image layer at the given index if it exists.
     * Throws an error if the button can't be found
     */
    async RemoveImageLayer(index: number) {
        let count = await this.page.locator('.removeBtn').count();
        await this.page.locator('.removeBtn').nth(index).click();
        await expect(this.page.locator('.removeBtn')).toHaveCount(count - 1);
        await this.WaitForLoadingComplete();
    }

    /**
     * Clicks the datasources tab to open/close the sidebar
     */
    async ClickDataSourcesTab() {
        await this.page.locator('#hv-drawer-tab-left').click();
    }

    /**
     * Waits for the loading spinner to disappear
     */
    async WaitForLoadingComplete() {
        await this.page.waitForFunction(() => document.getElementById('loading')?.style.display == "none", null, {timeout: 60000});
        await this.WaitForImageLoad();
    }

    /**
     *
     * @param n Number of times to zoom in
     */
    async ZoomIn(n: number = 1) {
        for (let i = 0; i < n; i++) {
            await this.page.locator('#zoom-in-button').click();
            // Wait for zoom animation to complete.
            await this.page.waitForTimeout(500);
        }
    }

}

export { Helioviewer }
