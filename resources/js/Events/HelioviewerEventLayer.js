/**
 * @fileOverview Contains the class definition for a HelioviewerTileLayer class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @author Kasim Necdet Percinel <kasim.n.percinel@nasa.gov>
 * @see TileLayerAccordion, Layer
 * @requires Layer
 *
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, Layer, $, JP2Image, Image, console, getUTCTimestamp, TileLayer,
    TileLoader, tileCoordinatesToArcseconds, Helioviewer */
"use strict";
var HelioviewerEventLayer = Class.extend(
    /** @lends HelioviewerEventLayer.prototype */
    {
    /**
     * @constructs
     * @description Just a class to trigger addition of event layer to event layer accordion
     *
     * @param {integer} index , used in queries to fetch FRM data
     * @param {string} date
     * @param {float} viewportScale
     * @param {string} name , name of the event  layer used in tree and event managers
     * @param {boolean} markersVisible, are we going to hide markers for this event layer initially, coming from the state 
     * @param {boolean} labelsVisible, are we going to hide labels of markers for this event layer initially, coming from the state 
     * @param {boolean} availabilityVisible, are we going to hide unavailable FRMs in checkbox tree branches 
     * @param {JSON} apiSource, initial query params for api request to fetch the data, highly attached with event source, HEK or CCMC (will be RESSI in the future) 
     *
     */
    init: function (index, date, viewportScale, name, markersVisible, labelsVisible, availabilityVisible, apiSource) {

        // Create a random id which can be used to link event layer with its corresponding event layer accordion entry
        this.id = "event-layer-" + name;

        $(document).trigger("create-event-layer-accordion-entry",
            [index, this.id, name, date, true, markersVisible, labelsVisible,availabilityVisible, apiSource]
        );
    }
});
