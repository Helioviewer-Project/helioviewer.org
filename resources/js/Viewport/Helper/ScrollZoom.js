class ScrollZoom {
    constructor() {
        this._MIN_SPEED = 2;
        this._MAX_DURATION_MS = 25;
        this._scrolling = false;
        this._no_change_count = 0;
        document.getElementById('sandbox').addEventListener("wheel", this._wheeling.bind(this));
    }

    /**
     * Executed when the mousewheel is used
     * @param {WheelEvent} event 
     */
    _wheeling(event) {
        if (!this._scrolling) {
            this._StartScrolling(event);
        } else {
            this._UpdateScrolling(event);
        }
    }

    /**
     * @param {WheelEvent} event 
     */
    _StartScrolling(event) {
        this._scrolling = true;
        if (this._onstart) {
            let position = { left: event.pageX, top: event.pageY };
            this._onstart(position);
        }
        this._currentZoom = 0;
        this._target = 0;
        this._delta = 0;
        this._UpdateScrolling(event);
        this._interval = setInterval(this._rectifyScroll.bind(this), 1);
    }

    /**
     * Smooths the scroll amount for a consistent scroll experience using
     * different mice which send different deltas
     */
    _rectifyScroll() {
        this._currentZoom += this._delta;
        // This smooths out fine-grained zooming if you're moving very slowly
        // on a high resolution touchpad like the mac's.
        if (Math.abs(this._delta) > Math.abs(this._target)) {
            this._delta = Math.abs(this._delta) - Math.abs(this._target);
        }
        if (this._delta == 0) {
            this._no_change_count += 1;
        }
        if (this._onupdate) {
            this._onupdate(this._currentZoom);
        }
        // Finish scrolling when the zoom crosses the target.
        if (((this._delta > 0) && (this._currentZoom >= this._target))
           || ((this._delta < 0) && (this._currentZoom <= this._target))
            // Scrolling hasn't changed in 30 ticks, break out of infinite loop
            // This can happen if the mouse sends a 0 delta scroll and nothing else.
           || (this._no_change_count >= 30)) {
            this._FinishScrolling();
        }
    }

    /**
     * @param {WheelEvent} event 
     */
    _UpdateScrolling(event) {
        // Update the target with the amount of delta sent by the wheel input.
        this._target -= event.deltaY;
        // The rectify function is scheduled to run every 1ms.
        // We would like the animation to complete in less than 50ms, so the zoom
        // should change by 1/250 each 'frame'.
        this._delta = (this._target - this._currentZoom) / this._MAX_DURATION_MS;
        
        // Enforce a minimum scroll speed.
        // Otherwise small scrolls will do a painfully slow animation.
        if ((this._delta < 0) && (this._delta > -this._MIN_SPEED)) {
            this._delta = -2;
        }
        if ((this._delta > 0) && (this._delta < this._MIN_SPEED)) {
            this._delta = 2;
        }
    }

    _FinishScrolling() {
        this._scrolling = false;
        this._delta = 0;
        this._no_change_count = 0;
        clearInterval(this._interval);
    }

    onstart(fn) {
        this._onstart = fn;
    }

    onupdate(fn) {
        this._onupdate = fn;
    }
}