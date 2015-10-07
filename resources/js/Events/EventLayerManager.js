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
    init: function (requestDate, defaultEventTypes, viewportScale, rsun,
                    savedEventLayers, urlEventLayers) {

        this._eventLayers   = [];
        this._events        = [];
        this._eventMarkers  = [];
        this._treeContainer = $("#eventJSTree");
        this._eventTypes    = {};
        this._jsTreeData    = [];

        if ( typeof date == 'undefined' ) {
            var date = requestDate;
        }
        this._date = date;

        this._requestDate      = requestDate;
        this.defaultEventTypes = defaultEventTypes;
        this.viewportScale     = viewportScale;


        $(document).bind("event-layer-finished-loading", $.proxy(this.updateMaxDimensions, this))
                   .bind("save-event-layers",            $.proxy(this.save, this))
                   .bind("add-new-event-layer",          $.proxy(this.addNewLayer, this))
                   .bind("remove-event-layer",           $.proxy(this._onLayerRemove, this));
    },

    /**
     * @description Updates the list of loaded event layers stored in
     *              localStorage and cookies
     */
    save: function () {
        var eventLayers = this.toJSON();
        Helioviewer.userSettings.set("state.eventLayers", eventLayers);
    },

    /**
     * Remove a specified layer
     */
    _onLayerRemove: function (event, id) {
        this.removeLayer(id);
    },

    getRequestDateAsISOString: function () {
        return this._requestDate.toISOString();
    }
});
