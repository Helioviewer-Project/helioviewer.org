/**
 * @fileOverview Contains the class definition for an UserVideoGallery class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 *
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false,
eqeqeq: true, plusplus: true, bitwise: true, regexp: false, strict: true,
newcap: true, immed: true, maxlen: 80, sub: true */
/*global $, window, Class */
"use strict";
var UserVideoGallery = Class.extend(
    /** @lends UserVideoGallery.prototype */
    {
    /**
     * @constructs
     * @description Creates a new UserVideoGallery component
     */
    init : function (url) {
        this._container   			= $("#user-video-gallery-main");
        this._containerCurrent   	= $("#user-video-gallery-main-current");
        this._loader      			= $("#user-video-gallery-spinner");
        this._loaderCurrent      	= $("#user-video-gallery-spinner-current");

        this._working     = false;

        // Feed URL
        this.url = url || Helioviewer.api;

        // Remote (may differ from local due to deleted videos, etc)
        this._numVideos = 20;

        this._videos = [];
        this._videosCurrent = [];

        this._fetchCurrentVideos();

        // Auto-refresh every couple minutes
        var self = this;

        window.setInterval(function () {
	        if(Helioviewer.userSettings.get("state.drawers.#hv-drawer-youtube.open")){
		        self._checkForNewMovies();
	        }
        }, 120000);
        
        $(document).on('observation-time-changed', function(e){
	        if(Helioviewer.userSettings.get("state.drawers.#hv-drawer-youtube.open")){
	        	self._fetchCurrentVideos();
	        }	
        });
    },

    /**
     * Retrieves a single page of video results and displays them to the user
     */
    _fetchCurrentVideos: function () {
        // check if we need to update movies list
        if(this._lastTimeCurrentVideosUpdated == parseInt(Helioviewer.userSettings.get("state.date"))){
	        return;
        }
        
        // Query parameters
        this._lastTimeCurrentVideosUpdated = parseInt(Helioviewer.userSettings.get("state.date"));
        var params = {
            "action": "getObservationDateVideos",
            "num"   : this._numVideos,
            "date"   : new Date(this._lastTimeCurrentVideosUpdated).toISOString()
        };

        // Show loading indicator
        this._containerCurrent.find("a").remove();
        this._loaderCurrent.show();

        this._working = true;

        // Fetch videos
        $.get(this.url, params, $.proxy(this._processResponseCurrent, this), Helioviewer.dataType);
    },

    /**
     * Checks to see if any new movies have been uploaded over the past couple
     * minutes.
     */
    _checkForNewMovies: function () {
        // Query parameters
        var params = {
            "action": "getUserVideos",
            "num"   : this._numVideos
        };

        // Use publish date for last video retrieved
        if (this._videos.length > 0) {
            params.since = this._videos[0].published.replace(" ", "T") + ".000Z";
        }

        this._working = true;

        // Fetch videos
        $.get(this.url, params, $.proxy(this._processResponse, this), Helioviewer.dataType);
    },

    /**
     * Processes response and stores video information locally
     */
    _processResponse: function (response) {
        var videos, error;

        if (response.error) {
            error = "<b>Error:</b> Did you specify a valid YouTube API key in Config.ini?";
            $("#user-video-gallery-main").html(error);
            return;
        }

        // Yahoo Pipes output
        if (response.count) {
            videos = response.value.items;
        } else {
            // Local feed
            videos = response;
        }

        this._videos = videos.concat(this._videos);
        this._updateGallery();
    },

    /**
     * Processes response and stores video information locally
     */
    _processResponseCurrent: function (response) {
        var videos, error;

        if (response.error) {
            error = "<b>Error:</b> Did you specify a valid YouTube API key in Config.ini?";
            $("#user-video-gallery-main-current").html(error);
            return;
        }

        // Yahoo Pipes output
        if (response.count) {
            videos = response.value.items;
        } else {
            // Local feed
            videos = response;
        }

        this._videosCurrent = videos;
        this._updateGalleryCurrent();
    },

    /**
     * Updates video gallery to show new entries
     */
    _updateGallery: function () {
        this._buildHTML(this._videos);
    },

    /**
     * Updates video gallery to show new entries
     */
    _updateGalleryCurrent: function () {
        this._buildHTMLCurrent(this._videosCurrent);
    },

    /**
     * Builds video gallery HTML
     */
    _buildHTML: function (videos) {
        var html = "", self = this;

        // Remove old thumbmails
        this._container.find("a, br").remove();
		
		this._loader.hide();
		
        $.each(videos, function (i, vid) {
            var when = new Date.parseUTCDate(vid.published) .getElapsedTime() + ' ago', img = vid.thumbnails['small'], html = '';

            html += "<a target='_blank' href='" + vid.url + "' " +
                    "alt='video thumbnail' id='youtube-movie-"+vid.id+"'>" +
                    "<div class='user-video-thumbnail-container'>" +
                    "<img class='user-video-thumbnail' src='" + img + "' alt='user video thumbnail' />" +
                    "<div style='text-align: center;'>" +
                    when + "</div>" +
                    "</div></a><br />";
                    
            // Drop tailing line break
			html = html.slice(0, -6);  
			
			self._container.append(html);
			
			// Create a preview tooltip
			$("#youtube-movie-" + vid.id).qtip({
	            content: {
	                title: {
	                    text: vid.title
	                },
	                text: self._buildPreviewTooltipHTML(vid)
	            },
	            position: {
	                adjust: {
	                    x: -10,
	                    y: -1
	                },
	                my: "right top",
	                at: "left center"
	            },
	            show: {
	                delay: 140
	            }
	        });    
        });

        this._working = false;
    },

    /**
     * Builds video gallery HTML
     */
    _buildHTMLCurrent: function (videos) {
        var html = "", self = this;

        // Remove old thumbmails
        this._containerCurrent.find("a, br").remove();
		
		this._loaderCurrent.hide();
		
        $.each(videos, function (i, vid) {
            var img = vid.thumbnails['small'];

            html = "<a target='_blank' href='" + vid.url + "' " +
                    "alt='video thumbnail' id='youtube-movie-current-"+vid.id+"'>" +
                    "<div class='user-video-thumbnail-container'>" +
                    "<img class='user-video-thumbnail' src='" + img + "' alt='user video thumbnail' />" +
                    "<div style='text-align: center;padding:0px 10px;'>" +
                    vid.title + "</div>" +
                    "</div></a><br />";
                    
            // Drop tailing line break
			html = html.slice(0, -6);  
			
			self._containerCurrent.append(html);
			
			// Create a preview tooltip
			$("#youtube-movie-current-" + vid.id).qtip({
	            content: {
	                title: {
	                    text: vid.title
	                },
	                text: self._buildPreviewTooltipHTML(vid)
	            },
	            position: {
	                adjust: {
	                    x: -10,
	                    y: -1
	                },
	                my: "right top",
	                at: "left center"
	            },
	            show: {
	                delay: 140
	            }
	        });    
        });

        this._working = false;
    },

    /**
     * Hover event handler
     */
    _onVideoHover: function (event) {
        if (event.type === 'mouseover') {
            $(this).find("img").addClass("video-glow");
        } else {
            $(this).find("img").removeClass("video-glow");
        }
    },

    /**
     * Creates HTML for a preview tooltip with a preview thumbnail,
     * if available, and some basic information about the screenshot or movie
     */
    _buildPreviewTooltipHTML: function (movie) {
        var width, height, thumbnail, html = "";
		
		var imageScale = parseFloat(movie.imageScale);
		
        html += "<div style='text-align: center;'>" +
	            	"<img src='" + movie.thumbnails.medium + "' width='95%' alt='preview thumbnail' />" +
	            "</div>" + 
	            "<table class='preview-tooltip'>" +
	            	"<tr><td><b>Start:</b></td><td>" + movie.startDate + "</td></tr>" +
					"<tr><td><b>End:</b></td><td>"   + movie.endDate   + "</td></tr>" +
					"<tr><td><b>Scale:</b></td><td>" + imageScale.toFixed(2) + " arcsec/px</td></tr>" +
					"<tr><td><b>Dimensions:</b></td><td>" + movie.width + "x" + movie.height + " px</td></tr>" +
	            "</table>";

        return html;
    },

});
