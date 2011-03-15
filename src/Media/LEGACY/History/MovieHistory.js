/**
 * @description Keeps track of movie history and can load saved history and add new items to its history.
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, setTimeout, window, Movie, History, toFuzzyTime */
"use strict";
var MovieHistory = History.extend(
    /** @lends MovieHistory.prototype */
    {
    /**
     * @constructs
     * @param history An array of saved history from UserSettings. May be null or empty.
     */    
    init: function (history) {
        this.id = "movie";
        this._super(history);
    },
    
    /**
     * Adds the item to history, then saves the setting in UserSettings.
     * 
     * @input {Object} item A Movie object
     */
    addToHistory: function (item) {
        this._super(item);
        this.save();
    },
    
    /**
     * Completely empties history and saves an empty array to UserSettings.
     */
    clear: function () {
        this._super();
        $(document).trigger("save-setting", ["movies", this.history]);
    },

    /**
     * Queues the movie and waits for a return.
     */
    queueMovie: function (params, apiUrl) {
        var callback, movieCallback, message, movie, self = this;

        movieCallback = function (movieData) {
            if (self._handleDataErrors(movieData)) {
                $("#movie-button").removeClass("working");
                return;
            }
            
            if (movieData.eta) {
                message = "Your video is processing and will be available in approximately " + 
                          Date.parseUTCDate(movieData.eta).getElapsedTime() + ". You may view it at any time after " +
                          "it is ready by clicking the 'Movie' button.";
                $(document).trigger("message-console-info", [message]);
            }
            
            movie = new Movie(params);
            movie.setId(movieData.id);
            self.addToHistory(movie);
            
            self.save();
            
            $("#movie-button").removeClass("working");
            self._waitForMovie(movieData, movie);
        };
        
        $.post("api/index.php", params, movieCallback, "json");
    },
    
    /**
     * Saves movie history
     */
    save: function () {
        $(document).trigger("save-setting", ["movies", this._serialize()]);
    },
    
    /**
     * Creates the html that will go in the jgrowl notification when the video is done.
     */
    _addJGrowlHTML: function (id) {
        return  "<div id='watch-" + id + "' style='cursor:pointer;'>Click here to watch or" +
                    " download it." + "<br />(opens in a pop-up)</div>" +
                "<div id='watch-dialog-" + id + "' style='display:none'></div>";
    },
    
    /**
     * Adds an item to the content string and also adds an emtpy div where the watch
     * dialog will be created.
     * 
     * @param {Object} item A Movie object
     */
    _addToContentString: function (item) {
        return  this._super(item) + 
                "<div id='watch-dialog-" + item.id + "' style='display:none'>" +
                "</div>";
    },
    
    /**
     * 
     */
    _handleDataErrors: function (data) {
        if (data === null) {
            $(document).trigger("message-console-info", "Unable to process request. Please try again later.");
            return true;
        } else if (data.error) {
            $(document).trigger("message-console-info", [data.error]);
            return true;
        }
        return false;
    },
    
    /**
     * Takes in an array of history gotten from UserSettings and creates Movie objects from it.
     * Slices the array down to 12 objects.
     * 
     * @input {Array} history An array of saved movie histories
     */
    _loadSavedHistory: function (history) {
        var self = this, movie;
        $.each(history, function () {
            movie = new Movie(this);
            self.history.push(movie);
            if (!movie.complete && movie.id) {
                self._waitForMovie({}, movie);
            }
        });

        this.history = this.history.reverse().slice(0, 12).reverse();
    },
    
    /**
     * Pops up a notification that lets the user know the movie is done.
     */
    _notifyUser: function (data, movie) {
        var options, self = this;

        if (data.url === null) {
            $(document).trigger("message-console-info", ["There was an error creating your video. Please" +
                                                         " try again later."]);
            self.remove(movie);
            return;        
        }

        // Options for the jGrowl notification. After it has opened, it will create
        // event listeners for the watch link                               
        options = {
            sticky: true,
            header: "Your movie is ready!",
            open  : function () {
                var watch = $('#watch-' + movie.id);

                $(".qtip").not("#qtip-4").qtip("hide"); // Hide history dialog (qtip-4 is image area select confirm)
                self.save();
                self.updateTooltips();
    
                // Open pop-up and display movie
                //watch.click(function () {
                watch.live("click", function () {
                    $(".jGrowl-notification .jGrowl-close").click();
                    movie.playMovie();
                });
            }
        };

        // Make the jGrowl notification with the options above. Add an empty div for the watch dialog in 
        //case they click on the notification.
        $(document).trigger("message-console-info", [this._addJGrowlHTML(movie.id), options]);
    },
    
    /**
     * Waits for (eta) time and tries to get the movie at that time. Will keep calling waitForMovie as long as
     * an eta is returned instead of a url. data.eta is in seconds so it needs to be converted to milliseconds
     * for setTimeout
     */
    _waitForMovie: function (data, movie) {
        var tryToGetMovie, callback, params, self = this;

        if (self._handleDataErrors(data)) {
            self.remove(movie);
            return;     
            
        } else if (data.url) {
            movie.setURL(data.url, movie.id);
            movie.setDuration(data.duration);
            this._notifyUser(data, movie);
        } else {
            tryToGetMovie = function () {
                callback = function (newData) {
                    self._waitForMovie(newData, movie);
                };
                
                params = {
                    "action": "getMovie", 
                    "id"    : movie.id
                };
                $.get("api/index.php", params, callback, "json");
            };
            
            // wait and try again
            setTimeout(tryToGetMovie, Math.max(data.eta, 15) * 1000);
        }
    }
});
