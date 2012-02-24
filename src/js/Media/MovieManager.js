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
/*global Helioviewer, MediaManager, $, setTimeout */
"use strict";
var MovieManager = MediaManager.extend(
    /** @lends MovieManager.prototype */
    {
    /**
     * @constructs
     * Creates a new MovieManager instance 
     */    
    init: function (movies) {
        this._super(movies);
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
            frameRate, numFrames, x1, x2, y1, y2, width, height, thumbnail, url
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
            "name"          : this._getName(layers),
            "status"        : "FINISHED",
            "thumbnail"     : thumbnail,
            "url"           : url
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

        if (this._history.unshift(movie) > this._historyLimit) {
            this._history = this._history.slice(0, this._historyLimit);            
        }
        
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
    update: function (id, frameRate, numFrames, startDate, endDate, width, 
        height, thumbnails, url) {

        var movie = this.get(id);
        
        // Add the new values
        $.extend(movie, {
            "frameRate" : frameRate,
            "numFrames" : numFrames,
            "startDate" : startDate,
            "endDate"   : endDate,
            "width"     : width,
            "height"    : height,
            "status"    : "FINISHED",
            "thumbnail" : thumbnails.small,
            "url"       : url
        });
        
        this._save();
        
        // Update preview tooltip
        $(document).trigger("movie-ready", [movie]);
        
        // Notify user
        this._displayDownloadNotification(movie);
    },
    
    /**
     * Displays a jGrowl notification to the user informing them that their 
     * download has completed
     */
    _displayDownloadNotification: function (movie) {
        var jGrowlOpts, message, self = this;
        
        // Options for the jGrowl notification
        jGrowlOpts = {
            sticky: true,
            header: "Just now",
            open:    function (msg) {
                msg.find(".message-console-movie-ready").data("movie", movie);
            }
        };
        message = "<span class='message-console-movie-ready'>" + 
                  "Your " + movie.name + " movie is ready! " + 
                  "Click here to watch or download it.</span>";

        // Create the jGrowl notification.
        $(document).trigger("message-console-log", 
                            [message, jGrowlOpts, true, true]);
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
                if (response.status === "QUEUED" || 
                    response.status === "PROCESSING") {
                    self._monitorQueuedMovie(id, response.eta);
                } else if (response.error) {
                    self._abort(id);
                }  else {
                    self.update(id, response.frameRate, response.numFrames,
                                response.startDate, response.endDate,
                                response.width, response.height,
                                response.thumbnails, response.url);
                }
            };
            
            params = {
                "action" : "getMovieStatus", 
                "id"     : id,
                "format" : self.format
            };
            $.get(Helioviewer.api, params, callback, Helioviewer.dataType);
        };
        setTimeout(queryMovieStatus, Math.max(eta, 5) * 1000);
    },
    
    /**
     * Aborts a failed movie request
     */
    _abort: function (id) {
        var error, movie = this.get(id);

        // Mark as failed
        movie["status"] = "ERROR";        
        this._save();

        // Notify user
        error = "Sorry, we were unable to create the movie you requested. " +
                "This usually means that there are not enough images for the " +
                "time range requested. Please try adjusting the observation " + 
                "date or movie duration and try creating a new movie.";

        $(document).trigger("message-console-error", [error, {"sticky": true}]);
    },
    
    /**
     * Saves the current list of movies
     */
    _save: function () {
        Helioviewer.userSettings.set("history.movies", this._history);
    }
});
