class ScrollZoom {
    constructor() {
        this._scrolling = false;
        this._delta = 0;
        this._timeout = undefined;
        document.getElementById('sandbox').addEventListener("wheel", this._wheeling.bind(this));
    }

    /**
     * Executed when the mousewheel is used
     * @param {WheelEvent} event 
     */
    _wheeling(event) {
        this._ClearTimeout();
        this._SetTimeout();
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
    }

    /**
     * @param {WheelEvent} event 
     */
    _UpdateScrolling(event) {
        this._delta += event.deltaY;
        if (this._onupdate) {
            this._onupdate(this._delta);
        }
    }

    _ClearTimeout() {
        if (this._timeout) {
            clearTimeout(this._timeout);
        }
    }

    _SetTimeout() {
        this._timeout = setTimeout(() => {
            this._scrolling = false;
            this._timeout = undefined;
            this._delta = 0;
        }, 250);
    }

    onstart(fn) {
        this._onstart = fn;
    }

    onupdate(fn) {
        this._onupdate = fn;
    }
}