/**
 * @fileOverview Contains the class definition for an TileLayerManager class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @see LayerManager, TileLayer
 * @requires LayerManager
 * 
 * TODO (12/3/2009): Provide support for cases where solar center isn't the best
 * sandbox-center, e.g. sub-field images.
 * 
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global LayerManager, TileLayer, Layer, $ */
"use strict";
var TileLayerManager = LayerManager.extend(
/** @lends TileLayerManager.prototype */
{

    /**
     * @constructs
     * @description Creates a new TileLayerManager instance
     */
    init: function (api, observationDate, dataSources, tileSize, viewportScale, maxTileLayers, 
                    tileServers, savedLayers, urlLayers, loadDefaults) {
        this._super();

        this.api           = api;
        this.dataSources   = dataSources;
        this.tileSize      = tileSize;
        this.viewportScale = viewportScale;
        this.maxTileLayers = maxTileLayers;
        this.tileServers   = tileServers;        
     
        this.tileVisibilityRange  = {xStart: 0, xEnd: 0, yStart: 0, yEnd: 0};
      
        this._observationDate = observationDate;

        $(document).bind("tile-layer-finished-loading", $.proxy(this.updateMaxDimensions, this))
                   .bind("save-tile-layers",            $.proxy(this.save, this))
                   .bind("add-new-tile-layer",          $.proxy(this.addNewLayer, this))
                   .bind("remove-tile-layer",           $.proxy(this._onLayerRemove, this));
        
        if (loadDefaults) {
            var startingLayers = this._parseURLStringLayers(urlLayers) || savedLayers;
            this._loadStartingLayers(startingLayers);
        }
    },

    /**
     * @description Updates the list of loaded tile layers stored in
     *              cookies
     */
    save: function () {
        var layers = this.toJSON();
        $(document).trigger("save-setting", [ "tileLayers", layers ]);
    },
    
    /**
     * 
     */
    updateTileVisibilityRange: function (vpCoords) {
        var ts, self, vp;
        // Expand to fit tile increment
        ts = this.tileSize;
        vp = {
            top:    vpCoords.top    - ts - (vpCoords.top    % ts),
            left:   vpCoords.left   - ts - (vpCoords.left   % ts),
            bottom: vpCoords.bottom + ts - (vpCoords.bottom % ts),
            right:  vpCoords.right  + ts - (vpCoords.right  % ts)
        };

        // Indices to display (one subtracted from ends to account for "0th" tiles).
        this.tileVisibilityRange = {
            xStart : vp.left / ts,
            yStart : vp.top  / ts,
            xEnd   : (vp.right  / ts) - 1,
            yEnd   : (vp.bottom / ts) - 1
        };

        self = this;
        $.each(this._layers, function () {
            this.updateTileVisibilityRange(self.tileVisibilityRange); 
        });
    },
    
    /**
     * 
     */
    adjustImageScale: function (scale) {
        this.viewportScale = scale;
        var self = this;
        
        $.each(this._layers, function () {
            this.updateImageScale(scale, self.tileVisibilityRange);
        });
    },

    /**
     * Determines initial opacity to use for a new layer based on which
     * layers are currently loaded
     */
    /**
     * @description Sets the opacity for the layer, taking into account
     *              layers which overlap one another.
     */
    _computeLayerStartingOpacity: function (layeringOrder) {
        var counter = 1;

        $.each(this._layers, function () {
            if (this.layeringOrder === layeringOrder) {
                counter += 1;
            }
        });

        return 100 / counter;
    },
    
    /**
     * Loads any layers which were set via URL string
     */
    _parseURLStringLayers: function (urlLayers) {
        if (!urlLayers) {
            return;
        }
        var layerSettings, layers = [], self = this;
        
        $.each(urlLayers, function () {
            layerSettings        = self.parseLayerString(this);
            layerSettings.server = self._selectTilingServer();
            layers.push(layerSettings);
        });
        $(document).trigger("save-setting", ["tileLayers", layers]);
        
        return layers;
    },

    /**
     * Loads initial layers either from URL parameters, saved user settings, or the defaults.
     */
    _loadStartingLayers: function (layers) {
        var layer, self = this;

        $.each(layers, function (index, params) {
            layer = new TileLayer(index, self._observationDate, self.tileSize, self.viewportScale, 
                                  self.tileVisibilityRange, self.api, params.name, params.visible, 
                                  params.opacity, params.server, true);

            self.addLayer(layer);
        });
    },
    
    /**
     * Remove a specified layer
     */
    _onLayerRemove: function (event, id) {
        this.removeLayer(id);
    },
    
    /**
     * Handles observation time changes
     */
    updateRequestTime: function (date) {
        this._observationDate = date;
        $.each(this._layers, function (i, layer) {
            this.updateRequestTime(date);
        });
    }
});