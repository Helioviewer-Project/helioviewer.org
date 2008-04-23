/**
 * @author Keith Hughitt     keith.hughitt@gmail.com
 */
/**
 * @class LayerManager Manages a collection of layers, and allows basic operations such as adding
 *                     a new layer, removing a layer, toggling visibility, etc.
 * @see   LayerManagerUI
/*global Class, document, $ */
var LayerManager = Class.create();

LayerManager.prototype = {
    /**
     * @constructor
     */
    initialize: function (tileContainer) {
        this.className = "LayerManager";
        this.tileContainer = tileContainer;
        this.layers = new Hash();
        
        // Event Handlers
        document.layerAdded.subscribe(this.onLayerAdded, this, true);
        document.layerRemoved.subscribe(this.onLayerRemoved, this, true);
    },
    
    /**
     * @function addLayer Adds a layer (provider) to the list.
     * @param {TileLayerProvider} layerProvider The layer provider to be added.
     */
    addLayer: function (layerProvider) {
        this.layers.set(layerProvider.id, layerProvider);
    },
        
    /**
     * @function removeLayer Removes a layer (provider) from the list.
     * @param {TileLayerProvider} layerProvider The layer provider to remove.
     */
    removeLayer: function (layerProvider) {
        this.layers.unset(layerProvider.id);
    },
    
    /**
     * Event handler: layer added
     * @param {TileLayerProvider} layerProvider The added layer provider.
     */
    onLayerAdded: function (type, args) {
        this.addLayer(args[0]);
    },
    
    /**
     * Event handler: layer removed
     * @param {TileLayerProvider} layerProvider The removed layer provider.
     */
    onLayerRemoved: function (type, args) {
        this.removeLayer(args[0]);
    },
};
