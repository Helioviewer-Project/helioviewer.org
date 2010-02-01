/**
 * @fileOverview Contains the class definition for an EventLayerManager class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @see LayerManager, EventLayer
 * @requires LayerManager
 * 
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global LayerManager, Layer, $, Image */
"use strict";
var EventLayerManager = LayerManager.extend(
    /** @lends EventLayerManager.prototype */
    {
    
    /**
     * @constructs
     * @description Creates a new EventLayerManager instance
     */
    init: function (controller) {
        this._super(controller);
        this._layers = [];
        this._showLabels = false;
    },
    
    /**
     * @description Returns the current label visibility
     */
    getLabelVisibility: function () {
        return (this._showLabels === true) ? "inline" : "none";
    },
    
    /**
     * @description Toggle event label visibility
     */
    toggleLabels: function () {
        this._showLabels = !this._showLabels;
        
        var visible = this._showLabels;

        $('.event-label').each(function () {
            if (visible) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    },
    
    /**
     * @description Checks for presence of a specific event catalog
     * @param {String} catalog Catalog ID
     */
    contains: function (catalog) {
        var catalogs = [];
        $.each(this._layers, function () {
            catalogs.push(this.catalog);
        });
        
        return ($.inArray(catalog, catalogs) !== -1);
    }    
});