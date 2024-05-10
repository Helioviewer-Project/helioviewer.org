/**
 * @fileOverview Contains the class definition for a HelioviewerEventLayerManager class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author Kasim Necdet Percinel <kasim.n.percinel@nasa.gov>
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
        let hekTreeConf = Helioviewer.userSettings.getHelioViewerEventLayerSettings('HEK');

        this.addEventLayer(
            new HelioviewerEventLayer(this._eventLayers.length, this._requestDate, this.viewportScale,
                'HEK', hekTreeConf['markers_visible'], hekTreeConf['labels_visible'], hekTreeConf['layer_available_visible'],{"action": "events", "sources": "HEK", "ar_filter": true})
        );
    },

    /**
     * Loads initial layers either from URL parameters, saved user settings, or the defaults.
     */
    _loadStartingLayers: function (layers) {

        // load HEK configuration from events_v2
        let hekTreeConf = Helioviewer.userSettings.getHelioViewerEventLayerSettings('HEK');

        // Add the event layer HEK , with the state visibility variables
        this.addEventLayer(
            new HelioviewerEventLayer(this._eventLayers.length, this._requestDate, this.viewportScale,
                'HEK', hekTreeConf['markers_visible'], hekTreeConf['labels_visible'], hekTreeConf['layer_available_visible'],{"action": "events", "sources": "HEK", "ar_filter": true})
        );

        // load CCMC only if output minimal, configuration from events_v2
        if (outputType != 'minimal') {
            let ccmcTreeConf = Helioviewer.userSettings.getHelioViewerEventLayerSettings('CCMC');
            this.addEventLayer(
                new HelioviewerEventLayer(this._eventLayers.length, this._requestDate, this.viewportScale,
                    'CCMC', ccmcTreeConf['markers_visible'], ccmcTreeConf['labels_visible'], ccmcTreeConf['layer_available_visible'], {"action": "events", "sources": "CCMC"})
            );
        }
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
