/**
 * @fileOverview Contains the class definition for an ZoomControls class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false,
eqeqeq: true, plusplus: true, bitwise: true, regexp: false, strict: true,
newcap: true, immed: true, maxlen: 80, sub: true */
var ZoomControls = Class.extend(
    /** @lends ZoomControls.prototype */
    {
    /**
     * @constructs
     *
     * Creates a new ZoomControl
     */
    init: function (id, imageScale, increments, minImageScale, maxImageScale, tileContainerSelector) {
        this.id            = id;
        this.imageScale    = imageScale;
        this.increments    = increments;
        this.minImageScale = minImageScale;
        this.maxImageScale = maxImageScale;

        this.tileContainerSelector = tileContainerSelector;
        this.targetScale = 1;

        this.zoomInBtn  = $('#zoom-in-button');
        this.zoomSlider = $('#zoomControlSlider');
        this.zoomOutBtn = $('#zoom-out-button');

        this._initSlider();
        this._initEventHandlers();
    },

    /**
     * Initializes the transitionend event listener on the tile container.
     * The transitionend event is called when a CSS transition event ends
     * In this case it will be used to notify us when CSS completes it's
     * transform:scale transition to smooth out the zoom.
     */
    _initTileContainerListeners(container) {
        let zoomController = this;
        container.addEventListener("transitionend", function () {
            zoomController.completeZoom();
        }, false);
    },


    /**
     * Returns the tileContainer div.
     * queried via the query selector passed in through the constructor.
     * The first time this is called, it initializes event listeners.
     */
    _getTileContainers: function () {
        let containers = document.querySelectorAll(this.tileContainerSelector);
        // Initializing the listener here since this is the first time
        // the container is loaded. The container is not present in the DOM
        // when the page loads, so this was chosen as the best place to initialize
        // the container events.
        this._initTileContainerListeners(containers[0]);
        return containers;
    },

    /**
     * Resets the CSS scale back to 1.
     * This is called when the CSS transition ends, and we load the new image
     * for the desired scale.
     */
    _clearZoomClasses() {
        let containers = this._getTileContainers();
        // Disable the transition animation before setting scale to 1.
        // Otherwise the scale will try to animate back from 2 to 1. This new
        // image at scale(1) is equivalent to the old image at scale(2). So
        // seeing the new image at scale(2) is larger than the desired zoom.
        containers.forEach((container) => {
            container.style.transition = "none";
            container.style.transform = "scale(1)";
        });
        this.targetScale = 1;
    },

    /**
     * Adjusts the zoom-control slider
     *
     * @param {Integer} v The new zoom value.
     */
    _onSlide: function (v) {
        this._setImageScale(v);
    },

    /**
     * Translates from jQuery slider values to zoom-levels, and updates the
     * zoom-level.
     *
     * @param {Object} v jQuery slider value
     */
    _setImageScale: function (v) {
        $(document).trigger('image-scale-changed', [this.increments[v]]);
        $(document).trigger('replot-celestial-objects');
        $(document).trigger('replot-event-markers');
        $(document).trigger('earth-scale');
        $(document).trigger('update-external-datasource-integration');
    },

    /**
     * @description Initializes zoom level slider
     */
    _initSlider: function () {
        var description, self = this;

        // Reverse orientation so that moving slider up zooms in
        this.increments.reverse();

        // Initialize slider
        this.zoomSlider.slider({
            slide: function (event, slider) {
                self._onSlide(slider.value);
                //slider.handle = slider.value;
            },
            min: 0,
            max: this.increments.length - 1,
            step: 1,
            orientation: 'vertical',
            value: $.inArray(this.imageScale, this.increments)
        });

        // Add tooltip
        description = "Drag this handle up and down to zoom in and out of " +
                      "the displayed image.";
        $("#zoomControlSlider > .ui-slider-handle").attr('title', description)
                                                   .qtip();
    },

    /**
     * Registered event listener that is called when transitionend is called
     * on the tile container. This indicates that the CSS scaling is complete
     * which is when we should fire the imageScale update. This has the effect
     * of CSS "zooming" the image, and then when we update the imageScale, then
     * the new image resolution is rendered. The result is a smooth animated zoom.
     */
    completeZoom: function () {
        this._clearZoomClasses();
        let index = this.zoomSlider.slider("value");
        this._setImageScale(index);
    },

    /**
     * Sets the CSS transform: scale to the given value.
     * This begins the CSS zoom transition, when the transition is complete,
     * then completeZoom will be called by the transitionend listener registered
     * in _initTileContainerListeners
     */
    _setCssScale(scale) {
        let containers = this._getTileContainers();
        containers.forEach((container) => {
            if (!container.style.transition || container.style.transition.startsWith("none")) {
                container.style.transition = "transform 0.5s";
            }
            container.style.transform = "scale(" + scale + ")";
        });
    },

    /**
     * @description Responds to zoom in button click
     */
    _onZoomInBtnClick: function () {
        // Update the zoom controls to increase the zoom value,
        // but don't set the image scale until the zoom is complete.
        var index = this.zoomSlider.slider("value") + 1;

        if (this.increments[index] >= this.minImageScale) {
            this.zoomSlider.slider("value", index);

            // The slider has the desired zoom value, begin scaling to
            // 2x the current zoom. If the user clicks the zoom button again
            // before the animation is done, then the slider will be up 2 zoom
            // values from where it started, this results in a CSS scale of 4
            // from the starting point (Each slider value is a zoom factor of 2.)
            // The transitionend event is not called until the animation is done.
            // targetScale will be reset back to 1 when the animation finishes.
            this.targetScale *= 2;
            this._setCssScale(this.targetScale);
        }
    },

    /**
     * @description Responds to zoom out button click
     */
    _onZoomOutBtnClick: function (_, continuingZoom) {
        var index = this.zoomSlider.slider("value") - 1;

        if (this.increments[index] <= this.maxImageScale) {
            this.zoomSlider.slider("value", index);

            // The slider has the desired zoom value, begin scaling to
            // 1/2 the current zoom. If the user clicks the zoom button again
            // before the animation is done, then the slider will be down 2 zoom
            // values from where it started, this results in a CSS scale of 0.25 (1/4)
            // from the starting point (Each slider value is a zoom factor of 2.)
            // The transitionend event is not called until the animation is done.
            // targetScale will be reset back to 1 when the animation finishes.
            this.targetScale /= 2;
            this._setCssScale(this.targetScale);
        }
    },

    /**
     * Handles mouse-wheel movements
     *
     * @param {Event} event Event class
     */
    _onMouseWheelMove: function (e, delta) {
        if(scrollLock){
	        return false;
        }

        //Lock the scroll
        scrollLock = true;
        window.setTimeout(function(){
            scrollLock = false;
        },500);

        if (delta > 0) {
            this.zoomInBtn.click();
        } else {
            this.zoomOutBtn.click();
        }

        return false;
    },

    /**
     * @description Initializes zoom control-related event-handlers
     */
    _initEventHandlers: function () {
        this.zoomInBtn.click($.proxy(this._onZoomInBtnClick, this));
        this.zoomOutBtn.click($.proxy(this._onZoomOutBtnClick, this));

        $("#helioviewer-viewport").mousewheel(
            $.proxy(this._onMouseWheelMove, this));

        $(document).bind("zoom-in",  $.proxy(this._onZoomInBtnClick, this))
                   .bind("zoom-out", $.proxy(this._onZoomOutBtnClick, this));

    }
});
