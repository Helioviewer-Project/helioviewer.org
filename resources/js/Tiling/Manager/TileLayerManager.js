/**
 * @fileOverview Contains the class definition for an TileLayerManager class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
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
/*global Helioviewer, LayerManager, TileLayer, Layer, $ */
"use strict";
var TileLayerManager = LayerManager.extend(
/** @lends TileLayerManager.prototype */
{
    /**
     * @constructs
     * @description Creates a new TileLayerManager instance
     */
    init: function (observationDate, dataSources, tileSize, viewportScale, maxTileLayers, savedLayers, urlLayers) {

        this._super();

        this.dataSources   = dataSources;
        this.tileSize      = tileSize;
        this.viewportScale = viewportScale;
        this.maxTileLayers = maxTileLayers;

        this.tileVisibilityRange  = {xStart: 0, xEnd: 0, yStart: 0, yEnd: 0};

        this._observationDate = observationDate;

        $(document).unbind("tile-layer-finished-loading").bind("tile-layer-finished-loading",
                        $.proxy(this.updateMaxDimensions, this))
                   .unbind("save-tile-layers").bind("save-tile-layers",
                        $.proxy(this.save, this))
                   .unbind("save-tile-layers-from-accordion").bind("save-tile-layers-from-accordion",
                        $.proxy(this.saveFromAccordion, this))
                   .unbind("add-new-tile-layer").bind("add-new-tile-layer",
                        $.proxy(this.addNewLayer, this))
                   .unbind("remove-tile-layer").bind("remove-tile-layer",
                        $.proxy(this._onLayerRemove, this))
                   .bind("observation-time-changed",
                        $.proxy(this.updateRequestTime, this));
    },

    /**
     * @description Updates the list of loaded tile layers stored in
     *              cookies
     */
    save: function () {
	    var jsonObj = this.toJSON();
	    if(jsonObj.length < 1){
		    return;
	    }
        Helioviewer.userSettings.set("state.tileLayers", jsonObj);
        $(document).trigger('update-external-datasource-integration');
    },

    /**
     * @description Updates the list of loaded tile layers stored in
     *              cookies
     */
    saveFromAccordion: function () {
        // Get hierarchy of label:name for each layer accordion
        var self = this, letters=Array('a','b','c','d','e'), layerHierarchy = {}, idOrder = {};

        $.each( $("#TileLayerAccordion-Container .dynaccordion-section"),
            function (i, accordion) {
                var idBase = $(accordion).attr('id'), label, name = [];

				idOrder[i] = idBase;

                layerHierarchy[i] = {};
                layerHierarchy[i]['visible'] = true;
                layerHierarchy[i]['opacity'] = $("#opacity-slider-track-" + idBase).slider("value");
                layerHierarchy[i]['uiLabels'] = [];
                layerHierarchy[i]['difference'] = parseInt($('#'+idBase+' .layer-select-difference').val());
                layerHierarchy[i]['diffCount'] = parseInt($('#'+idBase+' .layer-select-difference-period-count').val());
                layerHierarchy[i]['diffTime'] = parseInt($('#'+idBase+' .layer-select-difference-period').val());
                layerHierarchy[i]['baseDiffTime'] = formatLyrDateString($('#'+idBase+' .diffdate').val()+' '+$('#'+idBase+' .difftime').val());
                layerHierarchy[i]['sourceId'] = self._layers[i].image.sourceId;

                if ( $(accordion).find('.visible').hasClass('hidden') ) {
                    layerHierarchy[i]['visible'] = false;
                }

                $.each( letters, function (j, letter) {
                    if ( $('#'+letters[j]+'-select-'+idBase).css('display') != 'none' ) {
                        label = $('#'+letters[j]+'-label-'+idBase).html().slice(0,-1);
                        name  = $('#'+letters[j]+'-select-'+idBase+' option:selected').val();

                        layerHierarchy[i]['uiLabels'][j] = { 'label':label, 'name' :name }
                        layerHierarchy[i][label] = name;
                    }
                });
            }
        );

        //change Layers Order
        var startZIndex = -10;
        $.each(idOrder, function(i, id){
	        $.each($('#moving-container .tile-layer-container'), function(j, layer){
		        var rel = $(layer).attr('rel');
		        if(rel == id){
			        $(layer).css('z-index', startZIndex);
			        startZIndex = startZIndex - 1;
		        }
	        });
        });
        //change layer order inside object
        $.each(idOrder, function(i, id){
	        $.each(self._layers, function(j, layer){
		        if(layer.id == id){
			        self._layers[j].order = parseInt(i);
		        }
	        });
        });

        //save order
        Helioviewer.userSettings.set("state.tileLayers", layerHierarchy);
        $(document).trigger('update-external-datasource-integration');
    },

    /**
     *
     */
    updateTileVisibilityRange: function (vpCoords) {
        $.each(this._layers, function () {
            this.updateTileVisibilityRange(vpCoords);
        });
    },

    /**
     *
     */
    adjustImageScale: function (scale) {
        if (this.viewportScale === scale) {
            return;
        }

        this.viewportScale = scale;

        $.each(this._layers, function () {
            this.updateImageScale(scale);
        });
    },

    /**
     * Determines initial opacity to use for a new layer based on which
     * layers are currently loaded
     */
    /**
     * Sets the opacity for the layer, taking into account layers which overlap
     * one another.
     *
     * @param layeringOrder int  The layer's stacking order
     * @param layerExists   bool Whether or not the layer already exists
     */
    _computeLayerStartingOpacity: function (layeringOrder, layerExists) {
        var counter;

        // If the layer has not been added yet, start counter at 1 instead of 0
        if (layerExists) {
            counter = 0;
        } else {
            counter = 1;
        }


        $.each(this._layers, function () {
            if (this.layeringOrder === layeringOrder) {
                counter += 1;
            }
        });

        return 100 / counter;
    },

    /**
     * Loads initial layers either from URL parameters, saved user settings, or the defaults.
     */
    _loadStartingLayers: function (layers) {
        var layer, self = this;

        $.each(layers, function (index, params) {
            layer = new TileLayer(index, self._observationDate, self.tileSize, self.viewportScale,
                                  self.tileVisibilityRange, params.nickname, params.visible,
                                  params.opacity, params.difference, params.diffCount, params.diffTime, params.baseDiffTime, true);
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
    updateRequestTime: function (event, date) {
        this._observationDate = date;
        $.each(this._layers, function (i, layer) {
            this.updateRequestTime(date);
        });
        $(document).trigger('update-external-datasource-integration');
    },

    getRequestDateAsISOString: function () {
        return this._observationDate.toISOString();
    },

    getRequestDateAsTimestamp: function () {
        return this._observationDate.getTime();
    },

    /**
     * Returns a string representation of the tile layers
     */
    serialize: function () {
        return this._stringify(this._layers);
    },

    /**
     * Creates a string representation of an array of layers
     */
    _stringify: function (layers) {
        var layerString = "";

        // Get a string representation of each layer that overlaps the ROI
        $.each(layers, function () {
            layerString = "[" + this.serialize() + "]," + layerString;
        });

        // Remove trailing comma and return
        return layerString.slice(0, -1);
    },

    /**
     * Tests all four corners of the visible image area to see if they are
     * within the transparent circle region of LASCO/COR coronagraph images.
     *
     * Uses the distance formula:
     *
     *     d = sqrt( (x2 - x1)^2 + (y2 - y1)^2 )
     *
     * ...to find the distance from the center to each corner, and if that
     * distance is less than the radius, it is inside the circle region.
     *
     * @param {Object} radius -- The radius of the circle region in the image
     * @param {Object} top -- Top coordinate of the selected region
     * @param {Object} left -- Left coordinate of the selected region
     * @param {Object} width -- width of the selected region
     * @param {Object} height -- height of the selected region
     *
     * @return false as soon as it finds a distance outside the radius, or
     * true if it doesn't.
     */
    _insideCircle: function (radius, top, left, bottom, right) {
        var corners, corner, dx2, dy2;

        // Corners of region of interest
        corners = {
            topLeft     : {x: left,  y: top},
            topRight    : {x: right, y: top},
            bottomLeft  : {x: left,  y: bottom},
            bottomRight : {x: right, y: bottom}
        };

        // Check each corner to see if it lies within the circle
        for (corner in corners) {
            // dx^2, dy^2
            dx2 = Math.pow(corners[corner].x, 2);
            dy2 = Math.pow(corners[corner].y, 2);

            // dist = sqrt(dx^2 + dy^2)
            if (Math.sqrt(dx2 + dy2) > radius) {
                return false;
            }
        }

        return true;
    },

    /**
     * Returns a list of layers which are currently visible and overlap the
     * specified region of interest by at least 10px
     *
     * @param array roi Region of interest in pixels
     */
    getVisibleLayers: function (roi) {
        let layers = this.getVisibleLayerInstances(roi);
        return this._stringify(layers);
    },

    /**
     * Returns a list of layer instances which are currently visible and overlap the
     * specified region of interest by at least 10px
     *
     * @param array roi Region of interest in pixels
     */
    getVisibleLayerInstances: function(roi) {
        var rsunAS, rsun, radii, layers = {}, threshold = 10, self = this;

        // Coronagraph inner circle radii in arc-seconds
        // TODO 2012/04/11: Compute using header info? are hv-tags
        // (rocc_inner, etc) hard-coded or dynamic? Since COR images vary
        // a lot over time, conservative estimate used for now.
        radii = {
            "LASCO C2": 2.415,
            "LASCO C3": 4.62,
            "COR1-A": 1.45,
            "COR2-A": 2.6,
            "COR1-B": 1.45,
            "COR2-B": 2.6
        };

        // Solar radius at 1au (TODO: compute for layer)
        rsunAS = 959.705;

        let zoom = (Helioviewer.userSettings.get('mobileZoomScale') || 1)
        $.each(this._layers, function (i, layer) {
            // Check visibility
            if (!layer.visible || layer.opacity <= 5) {
                return;
            }

            // Check overlap
            if ((roi.right <= (layer.dimensions.left * zoom) + threshold) ||
                (roi.bottom <= (layer.dimensions.top * zoom) + threshold) ||
                (roi.left >= (layer.dimensions.right * zoom) - threshold) ||
                (roi.top >= (layer.dimensions.bottom * zoom) - threshold)) {
                return;
            }

            // Check coronagraph overlap
            if (layer.name in radii) {
                // radius of outer edge of occulting disk in pixels
                rsun = rsunAS * radii[layer.name] / layer.viewportScale;

                if (self._insideCircle(rsun, roi.top, roi.left, roi.bottom, roi.right)) {
                    return;
                }
            }

            layers[layer.order] = layer;
        });

        return layers;
    },

    /**
     * Returns the largest layer (by dimensions) that is currently displayed.
     */
    getBiggestLayer: function () {
        let maxArea = 0;
        let biggestLayer = this._layers[0];
        this._layers.forEach((layer) => {
            let layerArea = layer.getArea();
            if (layerArea > maxArea) {
                maxArea = layerArea;
                biggestLayer = layer;
            }
        })
        return biggestLayer;
    }
});
