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
        this._container   = $("#user-video-gallery-main");
        this._loader      = $("#user-video-gallery-spinner");

        this._working     = false;

        // Feed URL
        this.url = url || Helioviewer.api;

        // Remote (may differ from local due to deleted videos, etc)
        this._numVideos = 20;

        this._videos = [];

        this._fetchVideos();

        // Auto-refresh every couple minutes
        var self = this;

        window.setInterval(function () {
            self._checkForNewMovies();
        }, 120000);
    },

    /**
     * Updates video gallery to show new entries
     */
    _updateGallery: function () {
        this._buildHTML(this._videos);
    },

    /**
     * Retrieves a single page of video results and displays them to the user
     */
    _fetchVideos: function () {
        // Query parameters
        var params = {
            "action": "getUserVideos",
            "num"   : this._numVideos
        };

        // Show loading indicator
        this._container.find("a").empty();
        this._loader.show();

        this._working = true;

        // Fetch videos
        $.get(this.url, params, $.proxy(this._processResponse, this),
              Helioviewer.dataType);
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
            params.since = this._videos[0].published.replace(" ", "T") +
                           ".000Z";
        }

        this._working = true;

        // Fetch videos
        $.get(this.url, params, $.proxy(this._processResponse, this),
              Helioviewer.dataType);
    },

    /**
     * Processes response and stores video information locally
     */
    _processResponse: function (response) {
        var videos, error;

        if (response.error) {
            error = "<b>Error:</b> Did you specify a valid YouTube API key " +
                    "in Config.ini?";
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
     * Builds video gallery HTML
     */
    _buildHTML: function (videos) {
        var html = "";

        // Remove old thumbmails
        this._container.find("a, br").remove();

        $.each(videos, function (i, vid) {
            var when = new Date.parseUTCDate(vid.published)
                               .getElapsedTime() + " ago",
                img = vid.thumbnails['small'];

            html += "<a target='_blank' href='" + vid.url + "' " +
                    "alt='video thumbnail'>" +
                    "<div id='user-video-thumbnail-container'>" +
                    "<div style='text-align: center;'>" +
                    when + "</div>" +
                    "<img class='user-video-thumbnail' src='" + img + "' alt='user video thumbnail' />" +
                    "</div></a><br />";
        });

        // Drop tailing line break
        html = html.slice(0, -6);

        this._loader.hide();
        this._container.append(html);

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
    }

});
