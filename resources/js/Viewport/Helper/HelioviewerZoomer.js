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
        this._mc = document.getElementById('moving-container');
        this._sandbox = document.getElementById('sandbox');
        this._scale = 1;
        this._anchor = {left: 0, top: 0};
        this._last_size = 0;
    }

    _initializePinchListeners() {
        this.pinchDetector.addPinchStartListener($.proxy(this.pinchStart, this));
        this.pinchDetector.addPinchUpdateListener($.proxy(this.pinchUpdate, this));
        this.pinchDetector.addPinchEndListener($.proxy(this.pinchEnd, this));
    }

    setScale(scale) {
        // Limit scale to 2.5 and 0.25
        if (0.25 <= scale && scale <= 2.5) {
            this._scale = scale;
            this._mc.style.transform = "scale(" + this._scale + ")";
            console.log("Applying scale ", this._scale);
        }
    }

    shiftViewportForNewAnchor(anchor) {
        let apparent_x = this.getApparentPosition(parseFloat(this._mc.style.left), this._scale, this._anchor.left);
        let apparent_y = this.getApparentPosition(parseFloat(this._mc.style.top), this._scale, this._anchor.top);

        let new_left = this.getRealPosition(apparent_x, this._scale, anchor.left);
        let new_top = this.getRealPosition(apparent_y, this._scale, anchor.top);

        console.log("Shifting viewport for new anchor position", new_left, new_top);
        this._mc.style.left = new_left + "px";
        this._mc.style.top = new_top + "px";
    }

    setAnchor(anchor) {
        this.shiftViewportForNewAnchor(anchor);
        this._anchor = anchor;
        this._mc.style.transformOrigin = anchor.left + "px " + anchor.top + "px";
        console.log("Applying anchor ", anchor);
    }

    setAnchorForCenter(center) {
        let container_pos = $(this._mc).position();

        let x = center.left - parseInt(this._sandbox.style.left) - container_pos.left;
        let y = center.top - parseInt(this._sandbox.style.top) - container_pos.top;
        x = x / this._scale;
        y = y / this._scale;
        /** for visualizing clicks 
         let sandbox_pos = $('#sandbox').position();
         let div = document.createElement('div');
         div.style.width = "25px";
         div.style.height = "25px";
         div.style.position = "absolute";
         div.style.left = (x)  + "px";
         div.style.top = (y) + "px";
         div.style.background = "purple";
         div.style.transform = "translateX(-50%) translateY(-50%)";
         $('#moving-container')[0].appendChild(div);
         /**/
        // return {left: 0, top: 0};
        this.setAnchor({left: x, top: y});
    }

    /**
     * Fired when 2 fingers touch the screen
     */
    pinchStart(center) {
        console.log("Pinch starting at position: ", center);
        this.setAnchorForCenter(center);
        this._last_size = 0;
    }

    /**
     * Fires as a user pinches/stretches
     */
    pinchUpdate(size) {
        let change = (size - this._last_size) / 100;
        this.setScale(this._scale + change);
        this._last_size = size;
    }

    pinchEnd() {
        console.log("Pinch is over");
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
     * Gets the anchor point (or transform origin)
     */
    getAnchorPoint(real, apparent, scale) {
        return ((real - apparent) / (scale - 1));
    }

    /**
     * Returns the real position given the others
     */
    getRealPosition(apparent, scale, anchor) {
        return apparent + (scale - 1) * anchor;
    }
};
