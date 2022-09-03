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
    }

    _initializePinchListeners() {
        this.pinchDetector.addPinchStartListener(this.pinchStart);
        this.pinchDetector.addPinchUpdateListener(this.pinchUpdate);
        this.pinchDetector.addPinchEndListener(this.pinchEnd);
    }

    /**
     * Fired when 2 fingers touch the screen
     */
    pinchStart(center) {
        console.log("Pinch starting at position: ", center);
    }

    /**
     * Fires as a user pinches/stretches
     */
    pinchUpdate(size) {
        console.log("Pinch detected with size: ", size);
    }

    pinchEnd() {
        console.log("Pinch is over");
    }
};
