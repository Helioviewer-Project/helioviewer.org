/**
 * @fileOverview Contains the class definition for a HelioviewerEventLayerManager class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @see EventLayerManager, EventManager
 * @requires EventLayerManager
 *
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Helioviewer, HelioviewerEventLayer, EventLayerManager, parseLayerString, $ */
"use strict";
var HelioviewerEventLayerManager = EventLayerManager.extend(
/** @lends HelioviewerEventLayerManager.prototype */
{
    /**
     * @constructs
     * @description Creates a new TileLayerManager instance
     */
    init: function (requestDate, defaultEventTypes, viewportScale) {

        this._super(requestDate, defaultEventTypes, viewportScale);

        this._loadStartingLayers(defaultEventTypes);
    },

    /**
     * @description Adds a layer that is not already displayed
     */
    addNewLayer: function () {

        // Add the event layer
        this.addEventLayer(
            new HelioviewerEventLayer(this._eventLayers.length, this._requestDate, this.viewportScale,
                'HEK', true, true)
        );
    },

    /**
     * Loads initial layers either from URL parameters, saved user settings, or the defaults.
     */
    _loadStartingLayers: function (layers) {
        var eventLayer, basicParams, self = this;

        // Add the event layer
        this.addEventLayer(
            new HelioviewerEventLayer(this._eventLayers.length, this._requestDate, this.viewportScale,
                'HEK', true, Helioviewer.userSettings.get("state.eventLabels"), {"action": "events", "sources": "HEK", "ar_filter": true})
        );

        this.addEventLayer(
            new HelioviewerEventLayer(this._eventLayers.length, this._requestDate, this.viewportScale,
                'CCMC', true, true, {"action": "events", "sources": "CCMC"})
        );
    },

    /**
     * @description Generate a string of URIs for use by JHelioviewer
     */
    toURIString: function () {
        var str = "";

        $.each(this._eventLayers, function () {
            str += this.uri + ",";
        });

        // Remove trailing comma
        str = str.slice(0, -1);
        return str;
    }
});