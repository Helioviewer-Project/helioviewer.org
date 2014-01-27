/**
 * @fileOverview Contains the class definition for a HelioviewerTileLayerManager class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @see LayerManager, TileLayer
 * @requires TileLayerManager
 *
 * TODO (12/3/2009): Provide support for cases where solar center isn't the best
 * sandbox-center, e.g. sub-field images.
 *
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Helioviewer, HelioviewerTileLayer, TileLayerManager, parseLayerString, $ */
"use strict";
var HelioviewerTileLayerManager = TileLayerManager.extend(
/** @lends HelioviewerTileLayerManager.prototype */
{
    /**
     * @constructs
     * @description Creates a new TileLayerManager instance
     */
    init: function (observationDate, dataSources, tileSize, viewportScale, maxTileLayers,
                    startingLayers, urlLayers) {
        this._super(observationDate, dataSources, tileSize, viewportScale, maxTileLayers,
                    startingLayers, urlLayers);

        // The order in which new layers are added
        this._queue = [ "SDO,AIA,AIA,304", "SOHO,LASCO,C2,white-light",
                        "SOHO,LASCO,C3,white-light", "SOHO,MDI,MDI,magnetogram",
                        "SOHO,MDI,MDI,continuum" ];

        // Handle STEREO separately
        this._stereoAQueue = [ "STEREO_A,SECCHI,EUVI,304",
                               "STEREO_A,SECCHI,COR1,white-light",
                               "STEREO_A,SECCHI,COR2,white-light",
                               "STEREO_A,SECCHI,EUVI,171",
                               "STEREO_A,SECCHI,EUVI,195" ];

        this._stereoBQueue = [ "STEREO_B,SECCHI,EUVI,304",
                               "STEREO_B,SECCHI,COR1,white-light",
                               "STEREO_B,SECCHI,COR2,white-light",
                               "STEREO_B,SECCHI,EUVI,171",
                               "STEREO_B,SECCHI,EUVI,195" ];

        this._loadStartingLayers(startingLayers);

        this._layersLoaded = 0;
        this._finishedLoading = false;

        $(document).bind("viewport-max-dimensions-updated", $.proxy(this._onViewportUpdated, this))
                   .bind('tile-layer-data-source-changed', $.proxy(this._updateDataSource, this));
    },

    /**
     * @description Adds a layer that is not already displayed
     */
    addNewLayer: function () {
        var currentLayers, next, params, opacity, queue, ds,
            queueChoiceIsValid = false, i = 0, defaultLayer = "SDO,AIA,AIA,171";

        // If new layer exceeds the maximum number of layers allowed,
        // display a message to the user
        if (this.size() >= this.maxTileLayers) {
            $(document).trigger(
                "message-console-warn",
                [ "Maximum number of layers reached. Please remove an existing layer before adding a new one." ]
            );
            return;
        }

        // current layers in above form
        currentLayers = [];
        $.each(this._layers, function () {
            currentLayers.push(this.image.getLayerName());
        });

        // Remove existing layers from queue
        if (!!currentLayers.length) {
            // STEREO A
            if (currentLayers[0].substr(0, 8) === "STEREO_A") {
                queue = $.grep(this._stereoAQueue, function (item, i) {
                    return ($.inArray(item, currentLayers) === -1);
                });
            } else if (currentLayers[0].substr(0, 8) === "STEREO_B") {
                // STEREO B
                queue = $.grep(this._stereoBQueue, function (item, i) {
                    return ($.inArray(item, currentLayers) === -1);
                });
            } else {
                // SOHO, SDO, etc
                queue = $.grep(this._queue, function (item, i) {
                    return ($.inArray(item, currentLayers) === -1);
                });
            }
        } else {
            queue = this._queue.slice(); // make a copy
        }

        // Pull off the next layer on the queue
        while (!queueChoiceIsValid) {
            next = queue[i] || defaultLayer;
            params = parseLayerString(next + ",1,100");

            if (this.checkDataSource(params.observatory, params.instrument, params.detector, params.measurement)) {
                queueChoiceIsValid = true;
            }
            i += 1;
        }

        ds = this.dataSources[params.observatory][params.instrument][params.detector][params.measurement];
        $.extend(params, ds);

        opacity = this._computeLayerStartingOpacity(params.layeringOrder, false);

        // Add the layer
        this.addLayer(
            new HelioviewerTileLayer(this._layers.length, this._observationDate, this.tileSize, this.viewportScale,
                          this.tileVisibilityRange, params.observatory,
                          params.instrument, params.detector, params.measurement, params.sourceId, params.nickname,
                          params.visible, opacity, params.layeringOrder)
        );

        this.save();
    },

    /**
     * Loads initial layers either from URL parameters, saved user settings, or the defaults.
     */
    _loadStartingLayers: function (layers) {
        var layer, basicParams, self = this;

        $.each(layers, function (index, params) {
            basicParams = self.dataSources[params.observatory][params.instrument][params.detector][params.measurement];
            $.extend(params, basicParams);

            layer = new HelioviewerTileLayer(index, self._observationDate, self.tileSize, self.viewportScale,
                                  self.tileVisibilityRange,
                                  params.observatory, params.instrument, params.detector, params.measurement,
                                  params.sourceId, params.nickname, params.visible, params.opacity,
                                  params.layeringOrder);

            self.addLayer(layer);
        });
    },

    /**
     * Checks to see if all of the layers have finished loading for the first time,
     * and if so, loads centering information from previous session
     */
    _onViewportUpdated: function () {
        var numLayers = Helioviewer.userSettings.get("state.tileLayers").length;
        this._layersLoaded += 1;

        if (!this._finishedLoading && this._layersLoaded === numLayers) {
            $(document).trigger("load-saved-roi-position");
        }
    },

    /**
     * Updates the data source for a tile layer after the user changes one
     * of its properties (e.g. observatory or instrument)
     */
    /**
     * Changes data source and fetches image for new source
     */
    _updateDataSource: function (
        event, id, observatory, instrument, detector, measurement, sourceId, name, layeringOrder
    ) {
        var opacity, layer;

        // Find layer that is being acted on
        $.each(this._layers, function () {
            if (this.id === id) {
                layer = this;
            }
        });

        // Update name
        layer.name = name;

        // Update layering order and z-index
        layer.layeringOrder = layeringOrder;
        layer.domNode.css("z-index", parseInt(layer.layeringOrder, 10) - 10);

        // Update associated JPEG 2000 image
        layer.image.updateDataSource(observatory, instrument, detector, measurement, sourceId );

        // Update opacity (also triggers save-tile-layers event)
        opacity = this._computeLayerStartingOpacity(layer.layeringOrder, true);
        $("#opacity-slider-track-" + id).slider("value", opacity);
    },

    /**
     * Checks to make sure requested data source exists
     *
     * Note: Once defaults provided by getDataSource are used, this function will
     * no longer be necessary.
     */
    checkDataSource: function (obs, inst, det, meas) {
        if (this.dataSources[obs] !== undefined) {
            if (this.dataSources[obs][inst] !== undefined) {
                if (this.dataSources[obs][inst][det] !== undefined) {
                    if (this.dataSources[obs][inst][det][meas] !== undefined) {
                        return true;
                    }
                }
            }
        }

        return false;
    },

    /**
     * @description Generate a string of URIs for use by JHelioviewer
     */
    toURIString: function () {
        var str = "";

        $.each(this._layers, function () {
            str += this.uri + ",";
        });

        // Remove trailing comma
        str = str.slice(0, -1);

        return str;
    }
});