/**
 * @fileOverview Contains the class definition for an EventLayerManager class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @see LayerManager, EventLayer
 * @requires LayerManager
 * Syntax: Prototype ()
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
        this._layers = $A([]);
	    this._showLabels = false;
    },
    
    /**
     * @description Returns the current label visibility
     */
    getLabelVisibility: function () {
        return (this._showLabels == true) ? "inline" : "none";
    },
    
    /**
     * @description Toggle event label visibility
     */
    toggleLabels: function () {
        this._showLabels = !this._showLabels;
        $$('.event-label').each(function(label) {
            label.toggle();
        });
    },
    
	/**
	 * @description Checks for presence of a specific event catalog
	 * @param {String} catalog Catalog ID
	 */
	contains: function (catalog) {
		return (this._layers.find(function (l) {
			return l.catalog === catalog;
		}) ? true : false);
	}    
});