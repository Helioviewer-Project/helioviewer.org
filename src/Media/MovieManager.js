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
        this.format   = $.support.vp8 ? "webm" : "mp4";
        
        // Check status of any previously unfinished movie requests
        var self = this;
        $.each(movies, function (i, movie) {
            if ((movie.status === "QUEUED") || (movie.status === "PROCESSING")) {
                self._monitorQueuedMovie(movie.id, 0);
            }
        });
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
     * 
     * @return {Movie} A Movie object
     */
    add: function (
            id, duration, imageScale, layers, dateRequested, startDate, endDate, 
            frameRate, numFrames, x1, x2, y1, y2, width, height
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
            "ready"         : true,
            "name"          : this._getName(layers)
        }; 
        this._super(movie);

        return movie;
    },
    
    /**
     * Adds a movie that is currently being processed
     * 
     * @param {Int}     id            Movie id
     * @param {Int}     eta           Estimated time in seconds before movie is ready
     * @param {Float}   imageScale    Image scale for the movie
     * @param {String}  layers        Layers in the movie serialized as a string
     * @param {String}  dateRequested Date string for when the movie was requested
     * @param {String}  startDate     Observation date associated with the first movie frame
     * @param {String}  endDate       Observation date associated with the last movie frame
     * @param {Float}   x1            Top-left corner x-coordinate
     * @param {Float}   y1            Top-left corner y-coordinate
     * @param {Float}   x2            Bottom-right corner x-coordinate
     * @param {Float}   y2            Bottom-right corner y-coordinate
     * 
     * @return {Movie} A Movie object
     */
    queue: function (id, eta, imageScale, layers, dateRequested, startDate, endDate, x1, x2, y1, y2) {
        var movie = {
            "id"            : id,
            "imageScale"    : imageScale,
            "layers"        : layers,
            "dateRequested" : dateRequested,
            "startDate"     : startDate,
            "endDate"       : endDate,
            "x1"            : x1,
            "x2"            : x2,
            "y1"            : y1,
            "y2"            : y2,
            "status"        : "QUEUED",
            "name"          : this._getName(layers)
        };

        if (this._history.unshift(movie) > 12) {
            this._history = this._history.slice(0, 12);            
        };
        
        this._monitorQueuedMovie(id, eta);

        this._save();  
        return movie;
    },
    
    /**
     * Updates stored information for a given movie and notify user that movie is available
     * 
     * @param {Int}     id            Movie id
     * @param {Float}   frameRate     Movie frame-rate in frames/sec
     * @param {Int}     numFrames     Total number of frames in the movie
     * @param {String}  startDate     The actual movie start date
     * @param {String}  endDate       The actual movie end date
     * @param {Int}     width         Movie width
     * @param {Int}     height        Movie height
     */
    update: function (id, frameRate, numFrames, startDate, endDate, width, height) {
        var movie = this.get(id);
        
        // Add the new values
        $.extend(movie, {
            "frameRate" : frameRate,
            "numFrames" : numFrames,
            "startDate" : startDate,
            "endDate"   : endDate,
            "width"     : width,
            "height"    : height,
            "status"    : "FINISHED"
        });
        
        this._save();
        
        // Notify user
        $(document).trigger("message-console-info", "Your movie is ready!");
    },
    
    /**
     * Monitors a queued movie and notifies the user when it becomes available
     */
    _monitorQueuedMovie: function (id, eta)
    {
        var queryMovieStatus, self = this;

        queryMovieStatus = function () {
            var params, callback;
            
            callback = function (response) {
                if (response.status == "QUEUED" || response.status == "PROCESSING") {
                    self._monitorQueuedMovie(id, response.eta);
                } else if (response.error) {
                    self._abort(id);
                }  else {
                    self.update(id, response.frameRate, response.numFrames,
                                response.startDate, response.endDate,
                                response.width, response.height);
                }
            };
            
            params = {
                "action" : "getMovieStatus", 
                "id"     : id,
                "format" : self.format
            };
            $.get("api/index.php", params, callback, "json");
        };
        setTimeout(queryMovieStatus, Math.max(eta, 5) * 1000);
    },
    
    /**
     * Aborts a failed movie request
     */
    _abort: function (id) {
        var movie = this.get(id);

        // Mark as failed
        movie["status"] = "ERROR";        
        this._save();

        // Notify user
        $error = "Sorry, we are unable to create your movie at this time. " +
                 "Please try again later.";

        $(document).trigger("message-console-info", $error);
    },
    
    /**
     * Saves the current list of movies
     */
    _save: function () {
        Helioviewer.userSettings.set("movies", this._history);
    }
});
