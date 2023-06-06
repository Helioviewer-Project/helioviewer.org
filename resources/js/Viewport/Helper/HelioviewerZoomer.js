/**
 * This module helps with handling smooth zoom scaling via
 * CSS transforms.
 */
 class HelioviewerZoomer {
    /**
     * @constructs
     * @param {PinchDetector} pinchDetector lib for detecting pinches
     */
    constructor(pinchDetector) {
        this.pinchDetector = pinchDetector;
        this._initializePinchListeners();
        this._zoomInBtn = document.getElementById('zoom-in-button');
        this._zoomOutBtn = document.getElementById('zoom-out-button');
        this._mc = document.getElementById('moving-container');
        this._sandbox = document.getElementById('sandbox');
        this._scale = 1;
        this._anchor = {left: 0, top: 0};
        this._last_size = 0;
        Helioviewer.userSettings.set('mobileZoomScale', 1);
        $(document).bind("update-viewport", $.proxy(this.onUpdateViewport, this))
    }

    _initializePinchListeners() {
        this.pinchDetector.addPinchStartListener($.proxy(this.pinchStart, this));
        this.pinchDetector.addPinchUpdateListener($.proxy(this.pinchUpdate, this));
        this.pinchDetector.addPinchEndListener($.proxy(this.pinchEnd, this));
    }

    /**
     * Triggers the helioviewer zoom. This requires readjusting the entire viewport
     * so that the 2x image is shown identically to what it appeared to be before
     * triggering the zoom.
     * @param {number} triggerScale scale value that triggered the zoom
     * @param {number} isZoomIn Whether we're zooming in or out
     */
    _zoomHelioviewer(triggerScale, isZoomIn) {
        let targetScale = isZoomIn ? triggerScale / 2 : triggerScale * 2;

        // Get the apparent position that the container should be for the scale that triggered
        // the zoom. This is still the desired apparent position since the container should appear
        // as though it does not move.
        let apparent_x = this.getApparentPosition(parseFloat(this._mc.style.left), triggerScale, this._anchor.left);
        let apparent_y = this.getApparentPosition(parseFloat(this._mc.style.top), triggerScale, this._anchor.top);

        // Compute the new anchor point
        let new_anchor_x = isZoomIn ? this._anchor.left * 2 : this._anchor.left / 2;
        let new_anchor_y = isZoomIn ? this._anchor.top * 2 : this._anchor.top / 2;

        // Compute the new left/top for the zoom
        let new_left = apparent_x + (targetScale - 1) * new_anchor_x;
        let new_top = apparent_y + (targetScale - 1) * new_anchor_y;

        // Sandbox may shift, account for this by tracking its position.
        // TODO: I'll have to deal with this later.
        let initial_sandbox_position = $(this._sandbox).position();

        let closure = () => {
            // Set new parameters
            let new_sandbox_position = $(this._sandbox).position();
            this.setAnchor({left: new_anchor_x, top: new_anchor_y});
            this._mc.style.left = (new_left + (initial_sandbox_position.left - new_sandbox_position.left)) + "px";
            this._mc.style.top = (new_top + (initial_sandbox_position.top - new_sandbox_position.top)) + "px";
            this.setScale(targetScale);
            // Unbind closure so this function never executes again.
            $(document).off('image-scale-changed', null, closure);
        }
        // Bind to the image scale change event, so that nothing happens if the image scale doesn't change
        $(document).on('image-scale-changed', null, null, closure);
        // Trigger the zoom
        if (isZoomIn) {
            this._zoomInBtn.click();
        } else {
            this._zoomOutBtn.click();
        }
    }

    _updateScaleForElementWithId(id, scale) {
        let el = document.getElementById(id);
        el.style.transform = "scale(" + scale + ")";
    }

    /**
     * Updates the size of the bounding box that contains the earth image
     */
    _updateScaleBoxSize(boxId, imgId) {
        let el = document.getElementById(boxId);
        let img = document.getElementById(imgId);
        let rect = img.getBoundingClientRect();
        el.style.minHeight = rect.height + 'px';
    }

    /**
     * Updates the size of the earth scale/bar scale
     * These elements are added dynamically, so can't be cached.
     */
    _updateReferenceScale(scale) {
        this._updateScaleForElementWithId('js-bar-scale', scale);
        this._updateScaleForElementWithId('earthScale', scale);
        this._updateScaleBoxSize('js-earth-scale', 'earthScale');
    }

    setScale(scale) {
        // Limit scale to 2.5 and 0.25
        if (0.25 <= scale && scale <= 2.5) {
            if (scale >= 1.5) {
                this._zoomHelioviewer(scale, true);
            } else if (scale <= 0.5) {
                this._zoomHelioviewer(scale, false);
            } else {
                Helioviewer.userSettings.set('mobileZoomScale', scale);
                this._scale = scale;
                this._mc.style.transform = "scale(" + this._scale + ")";
                this._updateReferenceScale(scale)
            }
        }
    }

    shiftViewportForNewAnchor(anchor) {
        let apparent_x = this.getApparentPosition(parseFloat(this._mc.style.left), this._scale, this._anchor.left);
        let apparent_y = this.getApparentPosition(parseFloat(this._mc.style.top), this._scale, this._anchor.top);

        let new_left = this.getRealPosition(apparent_x, this._scale, anchor.left);
        let new_top = this.getRealPosition(apparent_y, this._scale, anchor.top);

        this._mc.style.left = new_left + "px";
        this._mc.style.top = new_top + "px";
    }

    setAnchor(anchor) {
        this.shiftViewportForNewAnchor(anchor);
        this._anchor = anchor;
        this._mc.style.transformOrigin = anchor.left + "px " + anchor.top + "px";
    }

    setAnchorForCenter(center) {
        let container_pos = $(this._mc).position();

        let x = center.left - parseInt(this._sandbox.style.left) - container_pos.left;
        let y = center.top - parseInt(this._sandbox.style.top) - container_pos.top;
        x = x / this._scale;
        y = y / this._scale;
        this.setAnchor({left: x, top: y});
    }

    /**
     * Fired when 2 fingers touch the screen
     */
    pinchStart(center) {
        this.setAnchorForCenter(center);
        this._last_size = 0;
    }

    /**
     * Fires as a user pinches/stretches
     */
    pinchUpdate(size) {
        let change = (size - this._last_size) / 200;
        this.setScale(this._scale + change);
        this._last_size = size;
    }

    pinchEnd() {
    }

    onUpdateViewport() {
        // Set anchor to center screen
        let center = {
            left: window.innerWidth / 2,
            top: window.innerHeight / 2
        }
        this.setAnchorForCenter(center);
    }

    /**
     * Returns the apparent position of the moving container
     * @note there are two types of position the "Real" position and the "Apparent" position.
     *       The real position is the programmed left/top of the container.
     *       The apparent position is the left/top with the CSS transform applied to it.
     *       These get functions all follow the formula apparent = real - (scale - 1) * anchor
     */
    getApparentPosition(real_pos, scale, anchor_point) {
        return real_pos - (scale - 1) * anchor_point;
    }

    /**
     * Returns the real position given the others
     */
    getRealPosition(apparent, scale, anchor) {
        return apparent + (scale - 1) * anchor;
    }
};
