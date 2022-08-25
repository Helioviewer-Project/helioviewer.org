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
 * - addPinchStartListener(fn) fn will be called when the beginning of a pinch/stretch is detected
 * - addPinchUpdateListener(fn(pixels)) fn will be called when the user is pinching. The pinch size in pixels is given as a parameter
 *   a negative value is a pinch, a positive value is a stretch
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
    _onPinchStart() {
        for (const fn of this._on_start_listeners) {
            fn();
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
     * Initializes touch listeners on the specified element
     * @param {HTMLElement} element to add listeners to.
     */
    _InitializePinchListeners(element) {
        let instance = this;
        element.addEventListener("touchstart", (e) => {instance.onTouchStart(e.touches);}, true);
        element.addEventListener("touchmove",  (e) => {instance.onTouchMove(e.touches);}, true);
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
            this._storePinchReferencePoint(touchList[0], touchList[1]);
            // Fire the pinch start listener to the callbacks
            this._onPinchStart();
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
}
