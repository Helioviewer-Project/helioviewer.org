/**
 * MediaManager class definition
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: false, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, setTimeout, window, Media, extractLayerName, layerStringToLayerArray */
"use strict";
var MediaManager = Class.extend(
    /** @lends MediaManager.prototype */
    {
    /**
     * @constructs
     * @param {Array} history Items saved in the user's history
     */
    init: function (savedItems) {
        this._history = savedItems;

        if ($.support.localStorage) {
            this._historyLimit = 25;
        } else {
            this._historyLimit = 10;
        }

    },

    /**
     * Creates the name that will be displayed in the history.
     * Groups layers together by detector, e.g. "EIT 171/304, LASCO C2/C3"
     * Will crop names that are too long and append ellipses.
     */
    _getName: function (layerString) {
        var layer, layerArray, currentGroup, name = "";

        layerArray = layerStringToLayerArray(layerString).sort();

        $.each(layerArray, function (i, layer) {
            layer = extractLayerName(this);

            // Add instrument or detector if its not already present, otherwise
            // add a backslash and move onto the right-hand side
            if (currentGroup === layer[1] || currentGroup === layer[2]) {
                name += "/";
            } else {
                // For STEREO use detector for the Left-hand side
                if (layer[1] === "SECCHI") {
                    currentGroup = layer[2];
                    // Add "A" or "B" to differentiate spacecraft
                    name += ", " + layer[2] + "-" +
                            layer[0].substr(-1) + " ";
                } else {
                    // Otherwise use the instrument name
                    currentGroup = layer[1];
                    name += ", " + layer[1] + " ";
                }
            }

            // For LASCO, use the detector for the right-hand side
            if (layer[1] === "LASCO") {
                name += layer[2];
            } else if (layer[2].substr(0, 3) === "COR") {
                // For COR1 & 2 images

            } else {
                // For AIA
                name += layer[2];
            }
        });

        return name.slice(2); // Get rid of the extra ", " at the front
    },

    /**
     * Adds an item
     */
    add: function (item) {
        if (this._history.unshift(item) > this._historyLimit) {
            this._history = this._history.slice(0, this._historyLimit);
        }

        this._save();
    },

    /**
     * Returns the item with the specified id if it exists
     */
    get: function (id) {
        var index = null;

        // Find the index in the history array
        $.each(this._history, function (i, item) {
            if (item.id === id) {
                index = i;
            }
        });

        return this._history[index];
    },

    /**
     * Removes all items
     */
    empty: function () {
        var self = this;

        $.each(this._history, function (i, item) {
            self._history[i] = null;
        });

        self._history = [];
        self._save();
    },

    /**
     * Check to see if an entry exists
     */
    has: function (id) {
        var exists = false;

        $.each(this._history, function (i, item) {
            if (item.id === id) {
                exists = true;
            }
        });

        return exists;
    },

    /**
     * Removes a item
     *
     * @param {String} id Item to be removed
     */
    remove: function (id) {
        var self = this;

        $.each(this._history, function (i, item) {
            if (item.id === id) {
                self._history[i] = null;
                self._history.splice(i, 1);
                self._save();
                return;
            }
        });
    },

    /**
     * Returns an array containing objects for the items currently being tracked
     */
    toArray: function () {
        return $.extend([], this._history);
    }
});
