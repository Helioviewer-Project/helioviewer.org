/**
 * This module helps with moving the viewport in response to touch
 * events as opposed to mouse events.
 */
var simulate_pinch = false;
class TouchMover {
    /**
     * Constructs the touch mover
     * @param {Element} el Element to respond to touches
     * @param {PinchDetector} pinchDetector object for broadcasting pinches
     * @param {function} moveFn function to call when the viewport should move
     */
    constructor(el, pinchDetector, moveFn) {
        this.pinchDetector = pinchDetector;
        this.moveViewport = moveFn;
        this._initTouchListeners(el);
    }

    /**
     * Point touchevents to onTouchStart, onTouchUpdate, and onTouchEnd
     */
    _initTouchListeners(element) {
        let instance = this;
        element.addEventListener("touchstart", (e) => {instance.onTouchStart(e.touches);}, true);
        element.addEventListener("touchmove",  (e) => {instance.onTouchMove(e.touches);}, true);
        element.addEventListener("touchend",  (e) => {instance.onTouchEnd(e.touches, e.changedTouches);}, true);
        element.addEventListener("touchcancel",  (e) => {instance.onTouchEnd(e.touches, e.changedTouches);}, true);
    }

    onTouchStart(touches) {
        if (touches.length >= 2 || simulate_pinch) {
            console.log("Pinch start");
            this.pinchDetector.onTouchStart(touches);
            this._wasPinching = true;
        } else {
            this._setReferenceTouch(touches[0]);
        }
    }
    onTouchMove(touches) {
        if (touches.length >= 2 || simulate_pinch) {
            console.log("Pinch move");
            this.pinchDetector.onTouchMove(touches);
        } else {
            this._moveViewportForTouch(touches[0]);
        }
    }
    onTouchEnd(touches) {
        if ((touches.length < 2 && this._wasPinching) || (touches.length < 1 && this._wasPinching && simulate_pinch)) {
            console.log("Pinch end");
            this.pinchDetector.onTouchEnd(touches);
        } else if (touches.length == 1) {
            this._setReferenceTouch(touches[0]);
        }
    }

    _setReferenceTouch(touch) {
        this._reference_touch = touch;
    }

    /**
     * Moves the viewport depending on how much the user has moved
     */
    _moveViewportForTouch(touch) {
        // Get the x amount to move
        let x = this._reference_touch.pageX - touch.pageX;
        // Get the y amount to move
        let y = this._reference_touch.pageY - touch.pageY;
        this.moveViewport(x, y);
        // Update the reference for the next move event
        this._setReferenceTouch(touch);
    }
}
