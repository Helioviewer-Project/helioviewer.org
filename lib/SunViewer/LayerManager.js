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
    initialize: function (tileContainer, zoomLevel) {
        this.className =    "LayerManager";
        this.tileContainer = tileContainer;
        this.layers =        $A([]);
        this.zoomLevel =     zoomLevel;
        
        // Event Handlers
        document.addLayer.subscribe(this.onAddLayer, this, true);
        document.layerPrepared.subscribe(this.onLayerPrepared, this, true);
        document.removeLayer.subscribe(this.onRemoveLayer, this, true);
        document.toggleLayerEnabled.subscribe(this.onToggleLayerEnabled, this, true);
        document.zoomLevelChange.subscribe(function(type, args) {this.zoomLevel = args[0];}, this, true);
    },
    
    /**
     * @function addLayer Adds a layer (provider) to the list.
     * @param {TileLayerProvider} layerProvider The layer provider to be added.
     */
    addLayer: function (layerProvider) {
        if (layerProvider.type === 'TileLayerProvider') {
            numberOfTileLayers++;
        }
        else if (layerProvider.type === 'MarkerLayerProvider') {
            numberOfMarkerLayers++;
        }

        this.layers.push(layerProvider);
    },
        
    /**
     * @function removeLayer Removes a layer (provider) from the list.
     * @param {TileLayerProvider} layerProvider The layer provider to remove.
     */
    removeLayer: function (id) {
        var layer = this.layers[id];
        
        if (layer.type === 'TileLayerProvider') {
            numberOfTileLayers--;
        }
        else if (layer.type === 'MarkerLayerProvider') {
            numberOfMarkerLayers--;
        }
        
        layer.removeFromTileContainer();
        this.layers[id] = null;
        this.layers.compact();
    },
    /**
     * @method onAddLayer
     */
    onAddLayer: function () {
        // Set opacity of a new layer to be half of the most recent layer's opacity
        var id = this.layers.size();
        try {
            var opacity = 1; //markerlayer id = 1.. need to adjust algorithm.
            //if (this.layers.get(0)) {
            //    opacity = (this.layers.get(0).type === "TileLayerProvider" ? this.layers.get(0).opacity * 0.5 : 1);
            //}
        }
        catch (ex) {
            Debug.output ('Error: LayerManager.js: 60. Unable to set opacity for new layer.');
        }
        var newLayer = new TileLayerProvider(this.tileContainer, { 'id': id, 'opacity': opacity, 'zoomLevel': this.zoomLevel });  
    },
    
    /**
     * Event handler: onLayerPrepared
     * @param {TileLayerProvider} layerProvider The added layer provider.
     */
    onLayerPrepared: function (type, args) {
        this.addLayer(args[0]);
    },
    
    /**
     * Event handler: layer removed
     * @param {TileLayerProvider} layerProvider The removed layer provider.
     */
    onRemoveLayer: function (type, args) {
        this.removeLayer(args[0]);
    },

    onToggleLayerEnabled: function (type, args) {
        var id = args[0];
        var show = args[1];
        this.layers[id].toggleVisible(show);
    }
};
