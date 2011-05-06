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
        
        // ROI selection buttons
        this._fullViewportBtn.click(function () {
            self.hide();
            self._buildMovie();
        });
        
        this._selectAreaBtn.click(function () {
            self.hide();
            $(document).trigger("enable-select-tool", $.proxy(self._buildMovie, self));
        });
        
        // Setup hover and click handlers for movie history items
        $("#movie-history .history-entry")
           .live('click', $.proxy(this._onMovieClick, this))
           .live('mouseover mouseout', $.proxy(this._onMovieHover, this));
    },
    
    /**
     * If the movie is ready, play the movie in a popup dialog. Otherwise do
     * nothing.
     */
    _onMovieClick: function (event) {
        var id, movie, dialog, action;
        
        id    = $(event.currentTarget).data('id'),
        movie = this._manager.get(id);
        
        // If the movie is ready, open movie player
        if (movie.status === "FINISHED") {
            dialog = $("movie-player-" + id);

            // If the dialog has already been created, toggle display
            if (dialog.length > 0) {
                action = dialog.dialog('isOpen') ? "close" : "open";
                dialog.dialog(action);
                
            // Otherwise create and display the movie player dialog
            } else {
                this._createMoviePlayerDialog(movie);
            }
        } else {
            return;
        }
    },
   
   /**
    * Shows movie details and preview.
    */
    _onMovieHover: function (event) {
        if (event.type == 'mouseover') {
            //console.log('hover on'); 
        } else {
            //console.log('hover off'); 
        }
    },
   
    /**
     * @description Opens a pop-up with the movie player in it.
     */
    _createMoviePlayerDialog: function (movie) {
        var dimensions, movieTitle, uploadURL, datasources, tags, html, 
            dialog, self = this;
        
        // 2011/01/06 Temporary work-around: compute default title & tags 
        // (nicer implementation to follow)
        tags        = [];
        datasources = [];

        // Tags
        $.each(movie.layers.split("],["), function (i, layerStr) {
            var parts = layerStr.replace(']', "").replace('[', "")
                        .split(",").slice(0, 4);
            
            // Add observatories, instruments, detectors and 
            // measurements to tag list
            $.each(parts, function (i, item) {
                if ($.inArray(item, tags) === -1) {
                    tags.push(item);
                }                
            });
        });
        
        // Datasources
        $.each(movie.name.split(", "), function (i, name) {
            var inst = name.split(" ")[0];
            
            if ((inst === "AIA") || (inst === "HMI")) {
                datasources.push("SDO " + name);
            } else {
                datasources.push("SOHO " + name);
            }
        });
        
        // Suggested movie title
        movieTitle = datasources.join(", ") + " (" + movie.startDate + " UTC)";
        
        uploadURL =  "api/index.php?action=uploadMovieToYouTube&id=" + movie.id;
        uploadURL += "&title=" + movieTitle;
        uploadURL += "&tags="  + tags.join(", ");
        
        // Make sure dialog fits nicely inside the browser window
        dimensions = this.getVideoPlayerDimensions(movie.width, movie.height);
        
        // Movie player HTML
        html = self.getVideoPlayerHTML(movie.id, dimensions.width, 
                                       dimensions.height, uploadURL);
                                       
        dialog = $("<div id='movie-player-" + movie.id + "'></div>")
                 .append(html);
        
        // Have to append the video player here, otherwise adding it to the div
        // beforehand results in the browser attempting to download it. 
        dialog.dialog({
            title     : "Movie Player: " + movieTitle,
            width     : dimensions.width  + 34,
            height    : dimensions.height + 104,
            resizable : $.support.h264 || $.support.vp8,
            close     : function () {
                            $(this).empty();
                        },
            zIndex    : 9999,
            show      : 'fade'
        });
        
        // TODO 2011/01/04: Disable keyboard shortcuts when in text fields! 
        // (already done for input fields...)
       
        // Initialize YouTube upload button
        $('#youtube-upload-' + movie.id).click(function () {
            var auth = false;

            // Synchronous request (otherwise Google will not allow opening of 
            // request in a new tab)
            $.ajax({
                async: false,
                url : "api/index.php?action=checkYouTubeAuth",
                type: "GET",
                success: function (response) {
                    auth = response;
                }
            });

            // If user is already authenticated we can simply display the 
            // upload form in a dialog
            if (auth) {
                self.showYouTubeUploadDialog(uploadURL);
                return false;
            }            
        });
    },
    
    /**
     * Determines dimensions for which movie should be displayed
     */
    getVideoPlayerDimensions: function (width, height) {
        var maxWidth    = $(window).width() * 0.80,
            maxHeight   = $(window).height() * 0.80,
            scaleFactor = Math.max(1, width / maxWidth, height / maxHeight);
        
        return {
            "width"  : Math.floor(width  / scaleFactor),
            "height" : Math.floor(height / scaleFactor)
        };
    },
    
    /**
     * Decides how to display video and returns HTML corresponding to that method
     */
    getVideoPlayerHTML: function (id, width, height, uploadURL) {
        var url, downloadLink, youtubeBtn;

        url = "api/index.php?action=downloadMovie&id=" + id + 
              "&format=" + this._manager.format;

        downloadLink = "<a target='_parent' href='" + url + "'>" +
                       "<img class='video-download-icon' src='resources/images/icons/001_52.png' " +
                       "alt='Download high-quality video' />Download</a>";
        
        youtubeBtn = "<a id='youtube-upload-" + id + "'  href='" + uploadURL + "' target='_blank'>" + 
                     "<img class='youtube-icon' src='resources/images/Social.me/24 by 24 pixels/youtube.png' " +
                     "alt='Upload video to YouTube' />Upload</a>";
        
        // HTML5 Video (H.264 or WebM)
        if ($.support.vp8 || $.support.vp8) {
            return "<video id='movie-player-" + id + "' src='" + url +
                   "' controls preload autoplay width='100%' " + "height='95%'></video>" + 
                   "<span class='video-links'>" + downloadLink + youtubeBtn + "</span>";
        }

        // Fallback (flash player)
        else {
            url = 'api/index.php?action=playMovie&id=' + id + '&format=flv';
            
            return "<div id='movie-player-" + id + "'>" + 
                   "<iframe src=" + url + " width=" + width + " height=" + height + " marginheight=0 marginwidth=0 " +
                   "scrolling=no frameborder=0 /><br />" + 
                   "<span class='video-links'>" + downloadLink + youtubeBtn + "</span></div>";
        }
    },
    
    /**
     * Refreshes status information for movies in the history
     */
    _refresh: function () {
        // Update the status information for each row in the history
        $.each(this._manager.toArray(), function (i, item) {
            var status = $("#movie-" + item.id).find(".status");

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
