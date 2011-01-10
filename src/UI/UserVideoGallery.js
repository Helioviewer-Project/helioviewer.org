/**
 * @fileOverview Contains the class definition for an UserVideoGallery class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * 
 * TODO 2011/01/10: Add a loading indicator
 * 
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global $, window, Class, addIconHoverEventListener */
"use strict";
var UserVideoGallery = Class.extend(
    /** @lends UserVideoGallery.prototype */
    {
    /**
     * @constructs
     * @description Creates a new UserVideoGallery component
     */
    init : function (id, next, prev) {
        this._container = $(id);
        this._nextPage  = $(next);
        this._prevPage  = $(prev);
        
        this._pageSize  = this._choosePageSize();

        this._setupEventHandlers();
        this._fetchVideos(1, this._pageSize);
      
        // TODO 2011/01/10: Add resize handler
    },
    
    /**
     * Retrieves a single page of video results and displays them to the user
     */
    _fetchVideos: function (pageNum, pageSize) {
        // Query parameters
        params = {
            "action"   : "getUserVideos",
            "pageSize" : pageSize,
            "pageNum"  : pageNum
        };

        // Fetch videos
        $.getJSON("api/index.php", params, $.proxy(this._buildHTML, this));
    },
    
    /**
     * Builds video gallery HTML
     */
    _buildHTML: function (videos) {
        var html = "",
            now  = new Date().getTime();
        
        $.each(videos, function (i, vid) {
            var when = toFuzzyTime((now - getUTCTimestamp(vid.published)) / 1000) + " ago";
            
            html += "<a target='_blank' href='" + vid.watch + "' alt='video thumbnail'>" +
                    "<div class='user-video-thumbnail-container'>" +
                    "<div style='text-align: left; margin-left: 25px;'>" + when + "</div>" +
                    "<img src='" + vid.thumbnails[4].url + "' alt='user video thumbnail' /></div></a><br />";                        
        });
        
        // Drop tailing line break
        html = html.slice(0, -6);

        this._container.append(html);
    },
    
    /**
     * Go to the previous page
     */
    _prevPage: function () {
    },
    
    /**
     * Go to the next page
     */
    _nextPage: function () {
    },
    
    /**
     * Performs a quick check on the browser height to decide how many video thumbnails to show at once
     */
    _choosePageSize: function () {
        var height = $(window).height();

        if (height > 935) {
            return 3;
        } else if (height > 730) {
            return 2;
        }        
        return 1;
    },
    
    /**
     * Setup event handlers
     */
    _setupEventHandlers: function () {
        // TODO 2011/01/10 Apply hover listen at .ui-icon level?
        addIconHoverEventListener(this._nextPage);
        addIconHoverEventListener(this._prevPage);
    }    
});
