/**
 * MovieManager class definition
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * 
 * TODO 2011/03/14: Choose a reasonable limit for the number of entries based on whether or not
 * localStorage is supported: if supported limit can be large (e.g. 100), otherwise should be
 * closer to 3 entries.
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: false, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, setTimeout, window, Media, extractLayerName, layerStringToLayerArray */
"use strict";
var MovieManager = MediaManager.extend(
    /** @lends MovieManager.prototype */
    {
    /**
     * @constructs
     * Creates a new MovieManager instance 
     */    
    init: function (movies) {
        this._history = movies;
    },
    
    /**
     * Adds a new movie
     * 
     * @param {Int}     id            Movie id
     * @param {Float}   duration      Movie duration in seconds
     * @param {Float}   imageScale    Image scale for the movie
     * @param {String}  layers        Layers in the movie serialized as a string
     * @param {String}  dateRequested Date string for when the movie was requested
     * @param {String}  startDate     Observation date associated with the first movie frame
     * @param {String}  endDate       Observation date associated with the last movie frame
     * @param {Float}   frameRate     Movie frame-rate in frames/sec
     * @param {Int}     numFrames     Total number of frames in the movie
     * @param {Float}   x1            Top-left corner x-coordinate
     * @param {Float}   y1            Top-left corner y-coordinate
     * @param {Float}   x2            Bottom-right corner x-coordinate
     * @param {Float}   y2            Bottom-right corner y-coordinate
     * @param {Int}     width         Movie width
     * @param {Int}     height        Movie height
     * @param {Bool}    ready         Whether or not the movie has finished processing
     * 
     * @return {Movie} A Movie object
     */
    add: function (
            id, duration, imageScale, layers, dateRequested, startDate, endDate, 
            frameRate, numFrames, x1, x2, y1, y2, width, height, ready
    ) {
        var movie = {
            "id"            : id,
            "duration"      : duration,
            "imageScale"    : imageScale,
            "layers"        : layers,
            "dateRequested" : dateRequested,
            "startDate"     : startDate,
            "endDate"       : endDate,
            "frameRate"     : frameRate,
            "numFrames"     : numFrames,
            "x1"            : x1,
            "x2"            : x2,
            "y1"            : y1,
            "y2"            : y2,
            "width"         : width,
            "height"        : height,
            "status"        : status,
            "name"          : this._getName(layers)
        }; 

        if (this._history.unshift(movie) > 12) {
            this._history = this._history.slice(0, 12);            
        };

        this._save();
        return movie;
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
     * Removes all movies
     */
    empty: function () {
        var self = this;

        $.each(this._history, function (i, movie) {
            self._history[i] = null;
        });
        
        self._history = [];
        self._save();
    },
    
    /**
     * Removes a movie
     * 
     * @param {String} id Movie to be removed
     */
    remove: function (id) {
        var self = this;

        $.each(this._history, function (i, movie) {
            if (movie.id === id) {
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
     * Returns an array containing Movie objects for the movies currently being tracked
     */
    toArray: function () {
        return this._history;
    },
    
    /**
     * Saves the current list of movies
     */
    _save: function () {
        Helioviewer.userSettings.set("movies", this._history);
    }
});
