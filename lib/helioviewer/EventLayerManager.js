/**
 * @fileOverview Contains the class definition for an EventLayerManager class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @see LayerManager, EventLayer
 * @requires LayerManager
 * Syntax: jQuery (x)
 * 
 */
/*global EventLayerManager, LayerManager, Class, Layer, Ajax, Event, $, Element, Image */
var EventLayerManager = Class.create(LayerManager,
    /** @lends EventLayerManager.prototype */
    {
    
    /**
     * @constructs
     * @description Creates a new EventLayerManager instance
     */
    initialize: function($super, controller) {
        $super(controller);
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

        jQuery('.event-label').each(function () {
	        visible ? jQuery(this).show() : jQuery(this).hide();
        });
    },
    
	/**
	 * @description Checks for presence of a specific event catalog
	 * @param {String} catalog Catalog ID
	 */
	contains: function (catalog) {
        var catalogs = [];
        jQuery.each(this._layers, function () {
            catalogs.push(this.catalog);
        });
        
        return (jQuery.inArray(catalog, catalogs) !== -1);
	}    
});