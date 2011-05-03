/**
 * MovieManagerUI class definition
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: false, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global $, MovieManager, MediaManagerUI, Helioviewer */
"use strict";
var MovieManagerUI = MediaManagerUI.extend(
    /** @lends MovieManagerUI */
    {
    /**
     * @constructs
     * Creates a new MovieManagerUI instance
     * 
     * @param {MovieManager} model MovieManager instance
     */    
    init: function (movieManager) {
        this._manager = new MovieManager(Helioviewer.userSettings.get('movies'));;
        this._super("movie");
        this._initEvents();
    },
    
    /**
     * Displays a jGrowl notification to the user informing them that their download has completed
     */
    _displayDownloadNotification: function (id) {
        var jGrowlOpts, link, self = this;
        
        // Options for the jGrowl notification
        jGrowlOpts = {
            sticky: true,
            header: "Your movie is ready!",
            open:    function () {
                self.hide();

                // open callback now called before dom-nodes are added to screen so $.live used
//                $("#movie-" + id).live('click', function () {
//                    $(".jGrowl-notification .close").click();
//                    window.open('api/index.php?action=downloadMovie&id=' + id, '_parent');
//                });
            }
        };
        
        // Download link
        //link = "<div id='movie-" + id + "' style='cursor: pointer'>Click here to download. </div>";
        link = "<a href='api/index.php?action=downloadMovie&id=" + id + "' target='_parent' style=''>Click here to download. </a>";

        // Create the jGrowl notification.
        $(document).trigger("message-console-info", [link, jGrowlOpts]);
    },
    
    /**
     * Uses the layers passed in to send an Ajax request to api.php, to have it build a movie.
     * Upon completion, it displays a notification that lets the user click to view it in a popup. 
     */
    _buildMovie: function (roi) {
        var params, imageScale, layers, roi, currentTime, now, diff, movieLength, self = this;

        if (typeof roi === "undefined") {
            roi = helioviewer.getViewportRegionOfInterest();
        }

        imageScale = helioviewer.getImageScale();
        layers = helioviewer.getLayers();

        // Make sure selection region and number of layers are acceptible
        if (!this._validateRequest(roi, layers)) {
            return;
        };

        this.building = true;

        movieLength = Helioviewer.userSettings.get("movieLength");
        
        // Webkit doesn't like new Date("2010-07-27T12:00:00.000Z")
        currentTime = helioviewer.getDate();
        
        // We want shift start and end time if needed to ensure that entire
        // duration will be used. For now, we will assume that the most
        // recent data available is close to now() to make things simple
        now = new Date();
        diff = new Date(currentTime.getTime()).addSeconds(movieLength / 2).getTime() - now.getTime();
        currentTime.addSeconds(Math.min(0, -diff / 1000));
        
        // Ajax Request Parameters
        params = $.extend({
            action        : "queueMovie",
            imageScale    : imageScale,
            layers        : layers,
            startTime     : currentTime.addSeconds(-movieLength / 2).toISOString(),
            endTime       : currentTime.addSeconds(movieLength).toISOString(),
            format        : this._manager.format
        }, this._toArcsecCoords(roi, imageScale));
        
        // AJAX Responder
        $.getJSON("api/index.php", params, function (response) {
            if ((response === null) || response.error) {
                $(document).trigger("message-console-info", "Unable to create movie. Please try again later.");
                return;
            }

            var movie = self._manager.queue(
                response.id, response.eta, params.imageScale, params.layers, 
                new Date().toISOString(), params.startTime, params.endTime, 
                params.x1, params.x2, params.y1, params.y2
            );
            self._addItem(movie);
        });

        //this.hideDialogs();
        this.building = false;
    },
    
    /**
     * Initializes MovieManager-related event handlers
     */
    _initEvents: function () {
        var self = this;
       
        this._super();
        
        this._fullViewportBtn.click(function () {
            self.hide();
            self._buildMovie();
        });
        
        this._selectAreaBtn.click(function () {
            self.hide();
            $(document).trigger("enable-select-tool", $.proxy(self._buildMovie, self));
        });
    },
    
    /**
     * Refreshes status information for movies in the history
     */
    _refresh: function () {
        // Update the status information for each row in the history
        $.each(this._manager.toArray(), function (i, item) {
            var status = $("#" + item.id).find(".status");

            // For completed entries, display elapsed time
            if (item.status == "FINISHED") {
                var elapsedTime = Date.parseUTCDate(item.dateRequested).getElapsedTime();
                status.html(elapsedTime);                
            // For failed movie requests, display an error
            } else if (item.status == "ERROR") {
                status.html("Error")
            // Otherwise show the item as processing
            } else {
                status.html("<span class='processing'>Processing</span>");
            }
        });
    },
    
    /**
     * Validates the request and returns false if any of the requirements are not met
     */
    _validateRequest: function (roi, layerString) {
        var visibleLayers = $.grep(layerStringToLayerArray(layerString), function (layer, i) {
            var parts=layer.split(",");
            return (parts[4] === "1" && parts[5] !== "0");
        });

        if (visibleLayers.length > 3) {
            $(document).trigger("message-console-warn", ["Movies cannot have more than three layers. " +
        		"Please hide/remove layers until there are no more than three layers visible."]);
            return false;
        }
        return this._super(roi, layerString);
    }
});
