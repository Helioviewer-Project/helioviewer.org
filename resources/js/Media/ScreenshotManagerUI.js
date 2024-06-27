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

import { createRoot } from 'react-dom/client';
import React from 'react';
import { MediaManagerUI } from './MediaManagerUI';
import ImageViewer from './ImageViewer';

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
        Helioviewer.messageConsole.success(body, jGrowlOpts);
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

            if ( helioviewerWebClient.drawerLeftOpened ) {
                self._cleanupFunctions.push('helioviewerWebClient.drawerLeftClick()');
                helioviewerWebClient.drawerLeftClick();
            }
            self._cleanupFunctions.push('helioviewerWebClient.drawerScreenshotsClick()');
            helioviewerWebClient.drawerScreenshotsClick();

            $(document).trigger("enable-select-tool",
                                [$.proxy(self._takeScreenshot, self),
                                 $.proxy(self._cleanup, self)]);
        });

        // Setup click handler for history items
        $("#screenshot-history .history-entry").on('click', $.proxy(this._onScreenshotClick, this));
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
        let id = $(event.currentTarget).data('id');
        let name = $(event.currentTarget).data('name');
        let url = Helioviewer.api + "?action=downloadScreenshot&id=" + id;

        let dom = $("<div></div>").appendTo('body');

        const root = createRoot(dom[0]);

        let removeScreenshotView = () => {
            root.unmount(); 
            dom.remove()
        }

        root.render(<ImageViewer alt={name} imageURL={url} onCloseCallback={removeScreenshotView}/>);

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
        var params, imageScale, layers, events, eventLabels, celestialBodiesLabels,
        celestialBodiesTrajectories, screenshot, self = this;

        if (typeof roi === "undefined") {
            roi = helioviewerWebClient.getViewportRegionOfInterest();
        }

        imageScale  = helioviewerWebClient.getZoomedImageScale();
        layers      = helioviewerWebClient.getVisibleLayers(roi);
        celestialBodiesLabels = helioviewerWebClient.getCelestialBodiesLabels();
        celestialBodiesTrajectories = helioviewerWebClient.getCelestialBodiesTrajectories();

        // Make sure selection region and number of layers are acceptible
        if (!this._validateRequest(roi, layers)) {
            return;
        }

        var switchSources = false;
        if(outputType == 'minimal'){
            switchSources = true;
        }

        params = $.extend({
            imageScale    : imageScale,
            layers        : layers,
            eventsState   : Helioviewer.userSettings.get("state.events_v2"),
            scale         : Helioviewer.userSettings.get("state.scale"),
            scaleType     : Helioviewer.userSettings.get("state.scaleType"),
            scaleX        : Helioviewer.userSettings.get("state.scaleX"),
            scaleY        : Helioviewer.userSettings.get("state.scaleY"),
            movieIcons    : Helioviewer.userSettings.get("options.showinviewport"),
            date          : helioviewerWebClient.getDate().toISOString(),
            display       : false,
            switchSources : switchSources,
            celestialBodiesLabels : celestialBodiesLabels,
            celestialBodiesTrajectories : celestialBodiesTrajectories
        }, this._toArcsecCoords(roi, imageScale));


        // AJAX Responder
        let successCallback = function (response) {
            screenshot = self._manager.add(
                response.id, params.imageScale, params.layers,
                new Date().toISOString(), params.date,
                params.x1, params.x2, params.y1, params.y2
            );
            self._addItem(screenshot);
            self._displayDownloadNotification(screenshot);
            self._refresh();
        };

        let failCallback = function (errResp) {
            Helioviewer.messageConsole.error("Unable to create screenshot. Please try again later.");
            console.error(errResp);
        }

        return postJSON("postScreenshot", params).then(successCallback, failCallback);

    },

    _cleanup: function () {
        $.each(this._cleanupFunctions, function(i, func) {
            eval(func);
        });
    }

});

export { ScreenshotManagerUI }
