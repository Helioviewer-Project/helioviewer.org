const MIN_THRESHOLD = 0.5;
const MAX_THRESHOLD = 1.5;

/**
 * This module helps with handling smooth zoom scaling via
 * CSS transforms.
 */
 class HelioviewerZoomer {
    /**
     * @constructs
     * @param {PinchDetector} pinchDetector lib for detecting pinches
     * @param {number[]} zoomLevels List of available zoom levels
     */
    constructor(pinchDetector, zoomLevels) {
        this.pinchDetector = pinchDetector;
        this.zoomLevels = zoomLevels.reverse();
        this._initZoomLevel();
        this._initializePinchListeners();
        this._zoomInBtn = document.getElementById('zoom-in-button');
        this._zoomOutBtn = document.getElementById('zoom-out-button');
        this._mc = document.getElementById('moving-container');
        this._sandbox = document.getElementById('sandbox');
        this._scale = 1;
        this._anchor = {left: 0, top: 0};
        this._last_size = 0;
        this._css_rules = [];
        this._maxImageScale = zoomLevels[0];
        this._minImageScale = zoomLevels[zoomLevels.length - 1];
        this._slider = new ZoomControls(this._maxImageScale, zoomLevels.length, this._targetCenter.bind(this), this.jumpToZoomLevel.bind(this));
        Helioviewer.userSettings.set('mobileZoomScale', 1);

        // Make sure the sun is centered when the user requests centering the viewport
        $(document).bind("center-viewport", this._resetOrigin.bind(this));

        // Register zoom in button click and zoom-in event
        this._zoomInBtn.addEventListener('click', this._smoothZoomIn.bind(this));
        $(document).bind("zoom-in", this._smoothZoomIn.bind(this));

        // Register zoom out button click and zoom-out event.
        this._zoomOutBtn.addEventListener('click', this._smoothZoomOut.bind(this));
        $(document).bind("zoom-out", this._smoothZoomOut.bind(this));
    }

    /**
     * Sets the anchor to the center of the viewport
     */
    _targetCenter() {
        let center = {left: window.innerWidth / 2, top: window.innerHeight / 2};
        this.setAnchorForCenter(center);
    }

    /**
     * Resets the transform origin property from the moving container
     * so that the transform origin is at sun center.
     */
    _resetOrigin() {
        this.setAnchor({left: 0, top: 0});
    }

    /**
     * Initializes the zoom level
     */
    _initZoomLevel() {
        let imageScale = Helioviewer.userSettings.get("state.imageScale");
        let value = $.inArray(imageScale, this.zoomLevels)
        this._zoomIndex = value;
    }

    /**
     * Updates the application's current zoom level.
     *
     * @param {number} level zoom index
     */
    _setAppImageScale(level) {
        $(document).trigger('image-scale-changed', [this.zoomLevels[level]]);
        $(document).trigger('replot-celestial-objects');
        $(document).trigger('replot-event-markers');
        $(document).trigger('earth-scale');
        $(document).trigger('update-external-datasource-integration');
    }

    _initializePinchListeners() {
        this.pinchDetector.addPinchStartListener($.proxy(this.pinchStart, this));
        this.pinchDetector.addPinchUpdateListener($.proxy(this.pinchUpdate, this));
        this.pinchDetector.addPinchEndListener($.proxy(this.pinchEnd, this));
        this._scrollzoom = new ScrollZoom();
        this._scrollzoom.onstart($.proxy(this.pinchStart, this));
        this._scrollzoom.onupdate($.proxy(this.pinchUpdate, this));
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
            this._zoomIn();
        } else {
            this._zoomOut();
        }
    }

    /**
     * Trigger application level zoom in.
     * This increases the resolution of the displayed image
     */
    _zoomIn() {
        let nextValue = this._zoomIndex + 1;
        this._setZoomLevel(nextValue);
    }

    /**
     * Trigger application level zoom out.
     * This decreases the resolution of the displayed image
     */
    _zoomOut() {
        let nextValue = this._zoomIndex - 1;
        this._setZoomLevel(nextValue);
    }

    /**
     * Forces the application zoom resolution to the given level
     * @param {number} level index into zoomLevels. Lower is lower res, higher is higher res.
     */
    _setZoomLevel(level) {
        // Enforce that the given value is an integer
        level = Math.ceil(level);
        if (0 <= level && level < this.zoomLevels.length) {
            this._zoomIndex = level;
            this._setAppImageScale(this._zoomIndex);
        }
    }

    _updateScaleForElementWithId(id, scale) {
        let el = document.getElementById(id);
        el.style.transform = "scale3d(" + scale + ", " + scale + ", 1)";
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
            if (scale >= MAX_THRESHOLD) {
                this._zoomHelioviewer(scale, true);
            } else if (scale <= MIN_THRESHOLD) {
                this._zoomHelioviewer(scale, false);
            } else {
                Helioviewer.userSettings.set('mobileZoomScale', scale);
                this._scale = scale;
                this._updateScaleForElementWithId(this._mc.id, scale);
                this._updateUIScale(scale);
                this._updateReferenceScale(scale)
                $(document).trigger('update-viewport');
            }
        }
    }

    _updateUIScale(scale) {
        let scaleFactor = 1/scale;
        /** @type {HTMLStyleElement} */
        let js_styles = document.getElementById('js-styles');
        this._css_rules.forEach((rule) => {
            js_styles.sheet.deleteRule(rule);
        });
        this._css_rules = [];
        this._css_rules.push(js_styles.sheet.insertRule(`.constant-size {
            scale: ${scaleFactor};
        }`));
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

    /**
     * Automatically animate zooming.
     * @param {number} factor The change in scale.
     * @param {number} duration Length of animation in seconds
     */
    _animateZoom(factor, duration) {
        clearInterval(this._animate_interval);
        // Compute animation frame details.
        let fps = 120;
        let frame_delay = 1/fps;
        let num_frames = fps * duration;

        // Compute the amount to change the scale each frame.
        let target_scale = this._scale * factor;
        let delta_scale = target_scale - this._scale;
        let frame_delta = delta_scale / num_frames;

        let ticks = 0;
        this._animate_interval = setInterval(() => {
            let lastScale = this._scale;
            this.setScale(this._scale + frame_delta);
            if ((factor > 1) && (this._scale < lastScale)) {
                frame_delta /= 2;
            }
            if ((factor < 1) && (this._scale > lastScale)) {
                frame_delta *= 2;
            }
            ticks += 1;
            if (ticks == num_frames) { clearInterval(this._animate_interval); }
        }, frame_delay)
    }

    /**
     * Executed when the zoom in button is clicked.
     */
    _smoothZoomIn() {
        this._animateZoom(2, 0.2);
    }

    /**
     * Executed when the zoom out button is clicked.
     */
    _smoothZoomOut() {
        this._animateZoom(0.5, 0.2);
    }

    /**
     * Sets the zoom to the given percentage without animation.
     * @note This is used by the slider in mininal view for animating zoom.
     * @param {number} level Continuous index into zoom levels (can be decimal)
     */
    jumpToZoomLevel(level) {
        while (level > this._zoomIndex) {
            this._zoomHelioviewer(2, true);
        }
        while (level < this._zoomIndex) {
            this._zoomHelioviewer(0.5, false);
        }
    }
};
