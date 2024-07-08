import { Page, Locator, expect } from '@playwright/test';

/**
 * Interface for interacting with elements related to a specific
 * image layer on Heliovewer.org
 */
class ImageLayer {
    /** Playwright page instance */
    private page: Page;
    /** Helioviewer Tile Layer id used to reference layer specific elements */
    readonly id: string;
    /** Locator for the image layer's opacity slider */
    private opacity_slider: Locator;
    private opacity_slider_handle: Locator
    /** Tile layer div which contains all the controls unique to this layer */
    private layer_controls: Locator;

    constructor(page: Page, id: string) {
        this.page = page;
        this.id = id;
        this.opacity_slider = this.page.locator('#opacity-slider-track-tile-layer-' + id);
        this.opacity_slider_handle = this.opacity_slider.locator('.ui-slider-handle');
        this.layer_controls = this.page.locator('#tile-layer-' + id);
    }

    /**
     * Sets the layer opacity via the slider track
     * This also expects that the image opacity is within 0.1 units
     * @param opacity Value between 0 and 1
     */
    async setOpacity(opacity: number) {
        // Get the desired target position for the specified opacity.
        let box = await this.opacity_slider.boundingBox();
        // Target y is the middle of the slider
        let target_y = (box!.y + (box!.y + box!.height)) / 2;
        // Target x points to the desired opacity. i.e. opacity = 0 will click the left of the slider
        // and opacity=1 will click the right side of the slider.
        // Add a tiny offset since clicking the left side doesn't register.
        let target_x = box!.x + (opacity * box!.width) + 0.5;

        // Get the position of the slider handle.
        let slider_handle_box = await this.opacity_slider_handle.boundingBox();
        let slider_center = {
            x: slider_handle_box!.x + slider_handle_box!.width / 2,
            y: slider_handle_box!.y + slider_handle_box!.height / 1.5
        };

        // Move mouse to slider handle
        await this.page.mouse.move(slider_center.x, slider_center.y);
        // Click and hold the slider handle
        await this.page.mouse.down();
        // Drag the slider to the desired position for the given opacity
        await this.page.mouse.move(target_x, target_y);
        // Release the mouse button
        await this.page.mouse.up();
        // Expect that the image opacity is near the slider opacity.
        await expect(await this.getOpacity()).toBeCloseTo(opacity, 1);
    }

    /**
     * Returns the apparent opacity that is observed on the image tiles.
     */
    async getOpacity(): Promise<number> {
        // Get the opacity on the first tile that matches this layer.
        return await this.getTile(0)
            .evaluate((e) => parseFloat(e.style.opacity));
    }

    /**
     * Sets a value in the image layer controls.
     * i.e. set('Observatory:', 'SOHO') to set the observatory field to SOHO
     */
    async set(label: string, value: string) {
        let selection = await this.layer_controls.getByLabel(label, {exact: true});
        await selection.selectOption(value);
        await this.page.waitForTimeout(500);
    }

    /**
     * Sets the value of the running difference field.
     * @param value
     */
    async setRunningDifferenceValue(value: number) {
        let input = await this.layer_controls.getByLabel("Running difference", {exact: true});
        await input.fill(value.toString());
        await input.blur();
        await this.page.waitForTimeout(500);
    }

    /**
     * Returns the given image tile (img tag)
     */
    getTile(index: number): Locator {
        return this.page.locator(`.tile-layer-container[rel=tile-layer-${this.id}] .tile`)
            .nth(index);
    }
}

export { ImageLayer }
