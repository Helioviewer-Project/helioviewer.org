/**
 * ScreenshotManagerUI class definition
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false,
eqeqeq: true, plusplus: true, bitwise: true, regexp: false, strict: true,
newcap: true, immed: true, maxlen: 80, sub: true */
/*global $, window, Helioviewer, helioviewer, MediaManagerUI, ScreenshotManager
*/
"use strict";
var ScreenshotManagerUI = MediaManagerUI.extend(
    /** @lends ScreenshotManagerUI */
    {
    /**
     * @constructs
     * Creates a new ScreenshotManagerUI instance
     *
     * @param {ScreenshotManager} model ScreenshotManager instance
     */
    init: function () {
        var screenshots = Helioviewer.userSettings.get('history.screenshots');
        this._manager = new ScreenshotManager(screenshots);

        this._super("screenshot");

        this._initEvents();
        this.show();
    },

    /**
     * Returns a URL to generate a screenshot of the current viewport
     *
     * Used to generate thumbnails for the current page
     */
    getScreenshotURL: function () {
        var roi, imageScale, layers, params;

        imageScale = helioviewer.getImageScale();
        roi        = helioviewer.getViewportRegionOfInterest();

        // Remove any layers which do not lie in the reguested region
        layers = helioviewer.getLayers();

        // Make sure selection region and number of layers are acceptible
        if (!this._validateRequest(roi, layers)) {
            return;
        }

        params = $.extend({
            action        : "takeScreenshot",
            imageScale    : imageScale,
            layers        : layers,
            date          : helioviewer.getDate().toISOString(),
            display       : true
        }, this._toArcsecCoords(roi, imageScale));

        return Helioviewer.api + "?" + $.param(params);
    },

    /**
     * Displays a jGrowl notification to the user informing them that their
     * download has completed
     */
    _displayDownloadNotification: function (screenshot) {
        var jGrowlOpts, body, self = this;

        // Options for the jGrowl notification
        jGrowlOpts = {
            sticky: true,
            header: "Just now"
        };

        // Download link
        body = "<a href='" + Helioviewer.api +
               "?action=downloadScreenshot&id=" +
               screenshot.id + "'>Your " + screenshot.name +
               " screenshot is ready! Click here to download. </a>";

        // Create the jGrowl notification.
        $(document).trigger("message-console-log",
                            [body, jGrowlOpts, true, true]);
    },

    /**
     * Initializes ScreenshotManager-related event handlers
     */
    _initEvents: function () {
        var self = this;

        this._super();

        // Screenshot ROI selection buttons
        this._fullViewportBtn.click(function () {
            self._takeScreenshot();
        });

        this._selectAreaBtn.click(function () {
            self._cleanupFunctions = [];

            if ( helioviewer.drawerLeftOpened ) {
                self._cleanupFunctions.push('helioviewer.drawerLeftClick()');
                helioviewer.drawerLeftClick();
            }
            self._cleanupFunctions.push('helioviewer.drawerScreenshotsClick()');
            helioviewer.drawerScreenshotsClick();

            $(document).trigger("enable-select-tool",
                                [$.proxy(self._takeScreenshot, self),
                                 $.proxy(self._cleanup, self)]);
        });

        // Setup click handler for history items
        $("#screenshot-history .history-entry")
           .live('click', $.proxy(this._onScreenshotClick, this));
    },

    /**
     * Creates HTML for a preview tooltip with a preview thumbnail,
     * if available, and some basic information about the screenshot or movie
     */
    _buildPreviewTooltipHTML: function (screenshot) {
        var width, height, date, html;

        width  = Math.round((screenshot.x2 - screenshot.x1) /
                    screenshot.imageScale);
        height = Math.round((screenshot.y2 - screenshot.y1) /
                    screenshot.imageScale);

        date = screenshot.date.substr(0, 19).replace(/T/, " ");

        html = "<div style='text-align: center;'>" +
            "<img src='" + Helioviewer.api + "?action=downloadScreenshot&id=" + screenshot.id +
            "' alt='preview thumbnail' class='screenshot-preview' /></div>" +
            "<table class='preview-tooltip'>" +
            "<tr><td><b>Date:</b></td><td>" + date + "</td></tr>" +
            "<tr><td><b>Scale:</b></td><td>" +
            screenshot.imageScale.toFixed(2) +
            " arcsec/px</td></tr>" +
            "<tr><td><b>Dimensions:</b></td><td>" + width +
            "x" + height + " px</td></tr>" +
            "</table>";

        return html;
    },

    /**
     * When a screenshot history entry is clicked, and the screenshot has
     * finished processing, download the screenshot. Otherwise do nothing.
     */
    _onScreenshotClick: function (event) {
        var id = $(event.currentTarget).data('id'),
            url = Helioviewer.api + "?action=downloadScreenshot&id=" + id;
        window.open(url, '_parent');

        return false;
    },

    /**
     * Gathers all necessary information to generate a screenshot, and then
     * displays the image when it is ready.
     *
     * @param {Object} roi Region of interest to use in place of the current \
     * viewport roi
     */
    _takeScreenshot: function (roi) {
        var params, dataType, imageScale, layers, events, eventLabels, scale, scaleType, scaleX, scaleY, screenshot, self = this;

        if (typeof roi === "undefined") {
            roi = helioviewer.getViewportRegionOfInterest();
        }

        imageScale  = helioviewer.getImageScale();
        layers      = helioviewer.getVisibleLayers(roi);
        events      = helioviewer.getEvents();

        if ( Helioviewer.userSettings.get("state.eventLayerVisible") === false ) {
            events = '';
            eventLabels = false;
        }

        // Make sure selection region and number of layers are acceptible
        if (!this._validateRequest(roi, layers)) {
            return;
        }

        params = $.extend({
            action        : "takeScreenshot",
            imageScale    : imageScale,
            layers        : layers,
            events        : events,
            eventLabels   : Helioviewer.userSettings.get("state.eventLabels"),
            scale         : Helioviewer.userSettings.get("state.scale"),
            scaleType     : Helioviewer.userSettings.get("state.scaleType"),
            scaleX        : Helioviewer.userSettings.get("state.scaleX"),
            scaleY        : Helioviewer.userSettings.get("state.scaleY"),
            date          : helioviewer.getDate().toISOString(),
            display       : false
        }, this._toArcsecCoords(roi, imageScale));

        // AJAX Responder
        $.get(Helioviewer.api, params, function (response) {
            if ((response === null) || response.error) {
                $(document).trigger("message-console-info",
                    "Unable to create screenshot. Please try again later.");
                return;
            }

            screenshot = self._manager.add(
                response.id, params.imageScale, params.layers,
                new Date().toISOString(), params.date,
                params.x1, params.x2, params.y1, params.y2
            );
            self._addItem(screenshot);
            self._displayDownloadNotification(screenshot);
        }, Helioviewer.dataType);
    },

    _cleanup: function () {
        $.each(this._cleanupFunctions, function(i, func) {
            eval(func);
        });
    }

});
