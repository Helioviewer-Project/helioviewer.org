/**
 * @fileOverview Contains the class definition for an UserVideoGallery class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * 
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, 
eqeqeq: true, plusplus: true, bitwise: true, regexp: false, strict: true,
newcap: true, immed: true, maxlen: 80, sub: true */
/*global $, window, Class, addIconHoverEventListener */
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
        this._nextPageBtn = $("#user-video-gallery-next");
        this._prevPageBtn = $("#user-video-gallery-prev");

        this._working     = false;
        
        // Feed URL
        this.url = url || "api/?action=getUserVideos";
        
        // Local
        this._pageSize = this._choosePageSize();
        this._startIndex = 0;
        
        // Remote (may differ from local due to deleted videos, etc)
        this._numVideos = 40;
        
        this._videos = [];

        this._setupEventHandlers();
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
        var endIndex = Math.min(this._startIndex + this._pageSize, 
                                this._videos.length);

        this._buildHTML(this._videos.slice(this._startIndex, endIndex));
    },
    
    /**
     * Retrieves a single page of video results and displays them to the user
     */
    _fetchVideos: function () {
        // Query parameters
        var params = {
            "num" : this._numVideos
        };
        
        // Show loading indicator
        this._container.find("a").empty();
        this._loader.show();            

        this._working = true;

        // Fetch videos
        $.getJSON(this.url, params, $.proxy(this._processResponse, this));
    },
    
    /**
     * Checks to see if any new movies have been uploaded over the past couple
     * minutes.
     */
    _checkForNewMovies: function () {
        // Query parameters
        var params = {
            "num"   : this._numVideos
        };
        
        // Use publish date for last video retrieved
        if (this._videos.length > 0) {
            params.since = this._videos[0].published.replace(" ", "T") + 
                           ".000Z";
        }
        
        this._working = true;

        // Fetch videos
        $.getJSON(this.url, params, $.proxy(this._processResponse, this));
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
                    "<div class='user-video-thumbnail-container'>" +
                    "<div style='text-align: left; margin-left: 25px;'>" + 
                    when + "</div>" +
                    "<img src='" + img + "' alt='user video thumbnail' />" + 
                    "</div></a><br />";
        });
        
        // Drop tailing line break
        html = html.slice(0, -6);

        this._loader.hide();
        this._container.append(html);
        //this._container.fadeIn();
        
        this._working = false;
    },
    
    /**
     * Go to the previous page
     */
    _prevPage: function () {
        if (this._working) {
            return false;
        }
        
        if (this._startIndex + this._pageSize < this._videos.length) {
            this._startIndex += this._pageSize;
            this._updateGallery();
        }
        
        return false;
    },
    
    /**
     * Go to the next page
     */
    _nextPage: function () {
        if (this._working) {
            return false;
        }

        if (this._startIndex > 0) {
            this._startIndex = Math.max(0, this._startIndex - this._pageSize);
            this._updateGallery();
        }
        
        return false;
    },
    
    /**
     * Performs a quick check on the browser height to decide how many video 
     * thumbnails to show at once
     */
    _choosePageSize: function () {
        var height = $(window).height();

        if (height > 1035) {
            return 3;
        } else if (height > 780) {
            return 2;
        }        
        return 1;
    },
    
    /**
     * Enables scrolling through video gallery pages using the mouse wheel
     */
    _onMouseWheelMove: function (e, delta) {
        if (delta > 0) {
            this._nextPage();
        } else {
            this._prevPage();
        }
        return false;
    },
    
    /**
     * Resize user video gallery to use up any available space
     */
    _onResize: function (e) {
        var oldPageSize = this._pageSize;
        
        // Determine new optimal pageSize
        this._pageSize = this._choosePageSize();
        
        // Don't update HTML no videos have been retrieved yet
        if (this._videos.length === 0) {
            return;
        }
        
        // Only update HTML if the page size has changed
        if (this._pageSize !== oldPageSize) {
            // Expand gallery size when currently displaying last page and 
            // resizing
            if (this._startIndex + this._pageSize > this._videos.length) {
                this._startIndex = this._videos.length - this._pageSize;
            }
            this._updateGallery();            
        }
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
     * Setup event handlers
     */
    _setupEventHandlers: function () {
        // TODO 2011/01/10 Apply hover listen at .ui-icon level?
        addIconHoverEventListener(this._nextPageBtn);
        addIconHoverEventListener(this._prevPageBtn);
        
        this._nextPageBtn.click($.proxy(this._nextPage, this));
        this._prevPageBtn.click($.proxy(this._prevPage, this));
        
        $(window).resize($.proxy(this._onResize, this));
        
        // Setup hover event handler
        //this._container.find("a")
        //    .live('mouseover mouseout', this._onVideoHover);

        this._container.mousewheel($.proxy(this._onMouseWheelMove, this));
    }    
});
