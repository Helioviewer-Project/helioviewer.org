/**
 * MovieManager class definition
 * 
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
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
        this._history = [];

        if (movies) {
            this._loadSavedMovies(movies);
        }
    },
    
    /**
     * Adds a new movie
     * 
     * @param {Int}     id            Movie id
     * @param {Float}   imageScale    Image scale for the movie
     * @param {String}  layers        Layers in the movie serialized as a string
     * @param {String}  dateRequested Date string for when the movie was requested
     * @param {String}  date          The observation date for which the movie was generated
     * @param {Float}   x1            Top-left corner x-coordinate
     * @param {Float}   y1            Top-left corner y-coordinate
     * @param {Float}   x2            Bottom-right corner x-coordinate
     * @param {Float}   y2            Bottom-right corner y-coordinate
     * 
     * @return {Movie} A Movie object
     */
    add: function (id, imageScale, layers, dateRequested, date, x1, x2, y1, y2) {
        var movie = new Movie(id, imageScale, layers, dateRequested, date, x1, x2, y1, y2);

        if (this._history.unshift(movie) > 12) {
            this._history = this._history.slice(0, 12);            
        };

        this._save();
        return movie;
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
        return $.map(this._history, function (item, i) {
            return item.serialize();
        });
    },
    
    /**
     * Returns an array containing Movie objects for the movies currently being tracked
     */
    toArray: function () {
        return this._history;
    },
    
    /**
     * Takes in an array of history gotten from UserSettings and creates Movie objects from it.
     * Slices the array down to 12 objects.
     * 
     * @input {Array} history An array of saved movie histories
     */
    _loadSavedMovies: function (movies) {
        var self = this;
        
        $.each(movies, function (i, movie) {
            self._history.push(new Movie(
                movie.id, movie.imageScale, movie.layers, movie.dateRequested, 
                movie.date, movie.x1, movie.x2, movie.y1, movie.y2
            ));
        });
    },
    
    /**
     * Saves the current list of movies
     */
    _save: function () {
        Helioviewer.userSettings.set("movies", this.serialize());
    }
});
