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
    init: function (history) {

    },
    
    /**
     * Creates the name that will be displayed in the history.
     * Groups layers together by detector, ex: 
     * EIT 171/304, LASCO C2/C3
     * Will crop names that are too long and append ellipses.
     */
    _getName: function (layerString) {
        var layer, layerArray, currentInstrument, name = "";
        
        layerArray = layerStringToLayerArray(layerString).sort();
        
        $.each(layerArray, function (i, layer) {
            layer = extractLayerName(this).slice(1);

            if (layer[0] !== currentInstrument) {
                currentInstrument = layer[0];
                name += ", " + currentInstrument + " ";
            } else {
                name += "/";
            }

            // For LASCO include detector in name, otherwise include measurement
            if (layer[0] === "LASCO") {
                name += layer[1];
            } else {
                name += layer[2];
            }
        });
        
        return name.slice(2); // Get rid of the extra ", " at the front
    },
    
    /**
     * Adds an item
     */
    add: function (item) {
        if (this._history.unshift(item) > 12) {
            this._history = this._history.slice(0, 12);            
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
     * Iterates through its history and gets a serialized array of each object's
     * information that needs to be saved. Adds it to serialHistory and returns
     * that for saving in UserSettings.
     */
    serialize: function () {
        return this._history;
    },
    
    /**
     * Returns an array containing objects for the items currently being tracked
     */
    toArray: function () {
        return this._history;
    }
});
