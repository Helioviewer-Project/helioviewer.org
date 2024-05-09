/**
 * @fileOverview Contains the class definition for a HelioviewerTileLayer class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
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
     * @description
     * @param {Object} viewport Viewport to place the events in
     * <br>
     * <br><div style='font-size:16px'>Options:</div><br>
     * <div style='margin-left:15px'>
     *      <b>type</b>        - The type of the layer (used by layer manager to differentiate event vs.
     *                           tile layers)<br>
     *      <b>tileSize</b>    - Tilesize to use<br>
     *      <b>source</b>      - Tile source ["database" | "filesystem"]<br>
     *      <b>opacity</b>     - Default opacity<br>
     * </div>
     */
    init: function (index, date, viewportScale, name, markersVisible, labelsVisible, availabilityVisible, apiSource) {

        // Create a random id which can be used to link event layer with its corresponding event layer accordion entry
        this.id = "event-layer-" + name;

        $(document).trigger("create-event-layer-accordion-entry",
            [index, this.id, name, date, true, markersVisible, labelsVisible,availabilityVisible, apiSource]
        );
    }
});
