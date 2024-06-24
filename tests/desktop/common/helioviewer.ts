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
        await this.page.getByText('NEWEST').click();
    }

    async CloseAllNotifications() {
        await this.WaitForLoadingComplete();
        await this.page.getByText('[ close all ]').click();
    }

    /**
     * Clicks the add layer button in the image sidebar
     */
    async AddImageLayer() {
        await this.page.getByRole('link', { name: 'Add Layer' }).click();
        await this.WaitForLoadingComplete();
        await expect(this.page.locator('.removeBtn')).toHaveCount(2);
    }

    /**
     * Removes an image layer at the given index if it exists.
     * Throws an error if the button can't be found
     */
    async RemoveImageLayer(index: number) {
        let count = await this.page.locator('.removeBtn').count();
        await this.page.locator('.removeBtn').nth(index).click();
        await expect(this.page.locator('.removeBtn')).toHaveCount(count - 1);
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
    }

}

export { Helioviewer }

// test('test', async ({ page }) => {
//     await page.getByRole('link', { name: ' Add Layer' }).click();
//     await page.locator('#TileLayerAccordion-Container div').filter({ hasText: 'AIA 3042021/06/01 00:01:29 UTCOpacity: Observatory: SDOSOHOInstrument:' }).locator('span').nth(3).click();
//     await page.getByRole('link', { name: ' Add Layer' }).click();
//     await page.locator('#removeBtn-tile-layer-gkf0vz45jtj').click();
//     await page.getByRole('link', { name: ' Add Layer' }).click();
//   });