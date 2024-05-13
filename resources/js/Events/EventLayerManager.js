/**
 * @fileOverview Contains the class definition for an EventLayerManager class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @see EventManager
 * @requires EventManager
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Helioviewer, LayerManager, TileLayer, Layer, $ */
"use strict";
var EventLayerManager = EventManager.extend(
/** @lends EventLayerManager.prototype */
{
    /**
     * @constructs
     * @description Creates a new EventLayerManager instance
     */
    init: function (requestDate, defaultEventTypes, viewportScale) {
        this._eventLayers   = [];
        this._events        = [];
        this._eventMarkers  = [];
        this._eventTypes    = {};
        this._jsTreeData    = [];

        if ( typeof date == 'undefined' ) {
            var date = requestDate;
        }
        this._date = date;

        this._requestDate      = requestDate;
        this.defaultEventTypes = defaultEventTypes;
        this.viewportScale     = viewportScale;

    },

    getRequestDateAsISOString: function () {
        return this._requestDate.toISOString();
    }
});
