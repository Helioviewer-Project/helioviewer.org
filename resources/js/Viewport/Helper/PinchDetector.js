/**
 * @fileOverview Implements smooth, mobile friendly pinch to zoom functionality.
 * @auther <a href="mailto:daniel.garciabriseno@nasa.gov">Daniel Garcia-Briseno</a>
 * Since Helioviewer manages the viewport on its own in order to position images,
 * we also need to handle manual zooming on said viewport.
 * This is accomplished by:
 *   - Tracking touch events
 *   - Measuring the distance between 2 touches to calculate a pinch or stretch
 *   - Determine how much to scale the helioviewer based on the pinch or stretch
 *   - Integrate with the built-in zoom-in/out functionality which loads different resolution images.
 */
"use strict";

/**
 * The pinch detector encapsulates logic that detects when a user is pinching
 * or stretching on the screen by listening to the touch events and determining
 * the change in distance between the fingers.
 *
 * You can register listeners to respond to these changes.
 * - addPinchStartListener(fn, {left, top}) fn will be called when the beginning of a pinch/stretch is detected
 *      The position relative to the page is also given as a parameter (pageX, pageY) of center of the two touch events that make up the pinch
 * - addPinchUpdateListener(fn(pixels, {left, top})) fn will be called when the user is pinching. The pinch size in pixels is given as a parameter
 * - addPinchEndListener(fn) fn will be called when less than 2 fingers are on the screen
 *   a negative value is a pinch, a positive value is a stretch
 * - resetReference() At any point in time you can reset what the detector considers the reference point (starting pinch difference)
 */
class PinchDetector {
    /**
     * @constructs Initialize pinch monitor
     * @param {str} HTML ID of the element that touch events will be registered on.
     */
    constructor(id) {
        this.element = document.getElementById(id);
        this._InitializePinchListeners(this.element);
        // Store event listeners
        this._on_start_listeners = [];
        this._on_pinch_listeners = [];
        this._on_end_listeners = [];
        this._referenceDistance = 0;
        this._lastDistance = 0;
    }

    /**
     * Adds callback to be executed when pinches end
     * @param {function} callback executed when a pinch ends
     */
    addPinchEndListener(fn) {
        this._on_end_listeners.push(fn);
    }

    /**
     * Adds callback to be executed when pinches start
     * @param {function} callback executed when a pinch starts
     */
    addPinchStartListener(fn) {
        this._on_start_listeners.push(fn);
    }

    /**
     * Adds callback to be executed when pinches are happening
     * @param {function} callback executed when a pinch updates
     */
    addPinchUpdateListener(fn) {
        this._on_pinch_listeners.push(fn);
    }

    /**
     * Executes pinch start listeners
     */
    _onPinchStart(center) {
        for (const fn of this._on_start_listeners) {
            fn(center);
        }
    }

    /**
     * Executes pinch update listeners
     * @param {number} distance The amount the pinch has moved since pinch start
     */
    _onPinchUpdate(distance) {
        for (const fn of this._on_pinch_listeners) {
            fn(distance);
        }
    }

    /**
     * Executes pinch end listeners
     */
    _onPinchEnd() {
        for (const fn of this._on_end_listeners) {
            fn();
        }
    }

    /**
     * Initializes touch listeners on the specified element
     * @param {HTMLElement} element to add listeners to.
     */
    _InitializePinchListeners(element) {
        let instance = this;
        element.addEventListener("touchstart", (e) => {instance.onTouchStart(e.touches);}, true);
        element.addEventListener("touchmove",  (e) => {instance.onTouchMove(e.touches);}, true);
        element.addEventListener("touchend",  (e) => {instance.onTouchEnd(e.touches);}, true);
    }

    /**
     * Fired when touches end. If user isn't pinching, fires the pinch end event
     */
    onTouchEnd(touchList) {
        if (touchList.length < 2) {
            this._onPinchEnd();
        }
    }

    /**
     * Fired when touches begin. This function checks if 2 fingers are present to begin the zoom flow.
     * @param {TouchList} touch list containing all points of contact
     */
    onTouchStart(touchList) {
        // When a two finger touch begins, use the distance between them
        // as a reference point that we can use to determine if the user is pinching
        // or stretching
        if (touchList.length == 2) {
            // Add top layer so anything we do to the DOM doesn't effect out pinch
            this._storePinchReferencePoint(touchList[0], touchList[1]);
            // Calculate the focus of the pinch once, then use it for the remaining pinch
            let pinchCenter = this._calculatePinchCenter(touchList[0], touchList[1]);
            // Fire the pinch start listener to the callbacks
            this._onPinchStart(pinchCenter);
        }
    }

    /**
     * Fired when touches move. This function
     * @param {TouchList} touch list containing all points of contact
     */
    onTouchMove(touchList) {
        if (touchList.length == 2) {
            this._updatePinch(touchList[0], touchList[1]);
        }
    }

    /**
     * Updates the zoom based on the supplied touch points.
     * This assumes a touchstart event has already come in. I'm trusting the browser
     * to supply touchstart before touchmove
     * @param {Touch} touch_a First touch point
     * @param {Touch} touch_b Second touch point
     */
    _updatePinch(touch_a, touch_b) {
        // Get the difference between the current finger distance and the reference
        // point set by touchStart
        let touch_change = this._calculateDifferenceFromReference(touch_a, touch_b);
        // Fire the pinch change listener to the callbacks
        this._onPinchUpdate(touch_change);
    }

    /**
     * Calculates the distance between two touch points and returns how far that distance
     * is from the stored reference point.
     * @param {Touch} touch_a First touch point
     * @param {Touch} touch_b Second touch point
     */
    _calculateDifferenceFromReference(touch_a, touch_b) {
        let distance = this._calculateTouchDistance(touch_a, touch_b);
        this._lastDistance = distance;
        return distance - this._referenceDistance;
    }

    /**
     * Stores a reference point created from the distance between two touches
     * @param {Touch} touch_a First touch point
     * @param {Touch} touch_b Second touch point
     */
    _storePinchReferencePoint(touch_a, touch_b) {
        let distance = this._calculateTouchDistance(touch_a, touch_b);
        this._referenceDistance = distance;
    }

    /**
     * Calculates the distance between two touch points.
     * @param {Touch} touch_a First touch point
     * @param {Touch} touch_b Second touch point
     */
    _calculateTouchDistance(touch_a, touch_b) {
        let dx = touch_b.screenX - touch_a.screenX;
        let dy = touch_b.screenY - touch_a.screenY;
        return this._calculateDistance(dx, dy);
    }

    /**
     * Calculates the diagonal distance between two points given x and y distances
     * This is just a^2 + b^2 = c^2
     * @param {number} dx X distance
     * @param {number} dy Y distance
     */
    _calculateDistance(dx, dy) {
        return Math.sqrt(dx*dx + dy*dy);
    }

    /**
     * Calculates the center of the pinch via pageX/pageY
     * @param {Touch} touch_a First touch point
     * @param {Touch} touch_b Second touch point
     */
    _calculatePinchCenter(touch_a, touch_b) {
        let x = (touch_b.pageX + touch_a.pageX) / 2;
        let y = (touch_b.pageY + touch_a.pageY) / 2;
        return {left: x, top: y};
    }

    resetReference() {
        this._referenceDistance = this._lastDistance;
    }
}
