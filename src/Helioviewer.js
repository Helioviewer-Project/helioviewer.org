/**
 * @fileOverview Contains the main application class and controller for Helioviewer.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
  bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global document, window, $, Class, ImageSelectTool, MovieBuilder, 
  TooltipHelper, ViewportController, ScreenshotBuilder, ScreenshotHistory,
  MovieHistory, addIconHoverEventListener, UserVideoGallery, MessageConsole,
  KeyboardManager, SettingsLoader, TimeControls, FullscreenControl,
  ZoomControls, ScreenshotManagerUI, MovieManagerUI, assignTouchHandlers */
"use strict";
var Helioviewer = Class.extend(
    /** @lends Helioviewer.prototype */
    {
    /**
     * Creates a new Helioviewer instance.
     * @constructs
     * 
     * @param {Object} urlSettings Client-specified settings to load.
     *  Includes imageLayers, date, and imageScale. May be empty.
     * @param {Object} serverSettings Server settings loaded from Config.ini
     */
    init: function (urlSettings, serverSettings) {
        this._checkBrowser(); // Determines browser support
        
        this.serverSettings = serverSettings;
        this.api            = "api/index.php";
        
        // User settings are globally accessible
        Helioviewer.userSettings = SettingsLoader.loadSettings(urlSettings, 
            serverSettings);
        
        this._initLoadingIndicator();
        this._initTooltips();
        
        // Use URL date if specified
        var urlDate = urlSettings.date ? Date.parseUTCDate(urlSettings.date) : false;

        this.timeControls = new TimeControls('#date', '#time', 
            '#timestep-select', '#timeBackBtn', '#timeForwardBtn', urlDate);

        // Get available data sources and initialize viewport
        this._initViewport();

        this.messageConsole = new MessageConsole();
        this.keyboard       = new KeyboardManager();
        
        // User Interface components
        this.zoomControls   = new ZoomControls('#zoomControls', Helioviewer.userSettings.get('state.imageScale'),
                                               this.serverSettings.minImageScale, this.serverSettings.maxImageScale); 

        this.fullScreenMode = new FullscreenControl("#fullscreen-btn", 500);
        
        this.displayBlogFeed("api/?action=getNewsFeed", 3, false);
        
        this._userVideos = new UserVideoGallery(this.serverSettings.videoFeed);
        
        this.imageSelectTool = new ImageSelectTool();
        
        this._screenshotManagerUI = new ScreenshotManagerUI();
        this._movieManagerUI      = new MovieManagerUI();

        this._setupDialogs();
        this._initEventHandlers();
        this._displayGreeting();
    },
    
    
    /**
     * @description Checks browser support for various features used in Helioviewer
     */
    _checkBrowser: function () {
        // Base support
        $.extend($.support, {
            "localStorage" : ('localStorage' in window) && window['localStorage'] !== null,
            "nativeJSON"   : typeof (JSON) !== "undefined",
            "video"        : !!document.createElement('video').canPlayType,
            "h264"         : false,
            "ogg"          : false,
            "vp8"          : false
        });
        
        // HTML5 Video Support
        if ($.support.video) {
            var v = document.createElement("video");
            
            // VP8/WebM
            if (v.canPlayType('video/webm; codecs="vp8"')) {
                $.support.vp8 = true;
            }
            
            // Ogg Theora
            if (v.canPlayType('video/ogg; codecs="theora"')) {
                $.support.ogg = true;
            }
            
            // H.264
            if (v.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"')) {
                $.support.h264 = true;
            }
            
        }
    },
    
    /**
     * @description Sets up a simple AJAX-request loading indicator
     */
    _initLoadingIndicator: function () {
        $(document).ajaxStart(function () {
            $('#loading').show();
        })
        .ajaxStop(function () {
            $('#loading').hide();
        });  
    },
    
    /**
     * Add tooltips to static HTML buttons and elements
     */
    _initTooltips: function () {
        // Overide qTip defaults
        $.fn.qtip.defaults = $.extend(true, {}, $.fn.qtip.defaults, {
            show: {
                delay: 1000
            },
            style: {
                classes: 'ui-tooltip-light ui-tooltip-shadow ui-tooltip-rounded'
            }
        });
        
        $("*[title]:not(#fullscreen-btn,.text-btn)").qtip();
        
        // Fullscreen
        $("#fullscreen-btn, .text-btn").qtip({
            position: {
                my: "top right",
                at: "bottom middle"
            }
        });
    },

    /**
     * Initializes Helioviewer's viewport
     */
    _initViewport: function () {
        this.viewport = new ViewportController({
            id             : '#helioviewer-viewport',
            api            : this.api,
            requestDate    : this.timeControls.getDate(),
            timestep       : this.timeControls.getTimeIncrement(),
            servers        : this.serverSettings.servers,
            maxTileLayers  : this.serverSettings.maxTileLayers,
            minImageScale  : this.serverSettings.minImageScale,
            maxImageScale  : this.serverSettings.maxImageScale,
            prefetch       : this.serverSettings.prefetchSize,
            tileLayers     : Helioviewer.userSettings.get('state.tileLayers'),
            imageScale     : Helioviewer.userSettings.get('state.imageScale'),
            warnMouseCoords: Helioviewer.userSettings.get('notifications.coordinates')
        });   
    },
    
    /**
     * @description Sets up event-handlers for dialog components
     */
    _setupDialogs: function () {
        var self = this;
        
        // About dialog
        this._setupDialog("#helioviewer-about", "#about-dialog", {
            "title": "Helioviewer - About",
            height : 300
        });

        // Keyboard shortcuts dialog
        this._setupDialog("#helioviewer-usage", "#usage-dialog", {
            "title": "Helioviewer - Usage Tips"
        });
        
        // Settings dialog
        this._setupDialog("#settings-button", "#settings-dialog", {
            "buttons": {
                "Ok": function () {
                    $(this).dialog("close");
                }
            },
            "title": "Helioviewer - Settings",
            "width": 400,
            "height": 'auto',
            "resizable": false,
            "create": function (e) {
                var currentValue = Helioviewer.userSettings.get(
                    "defaults.movies.duration"),
                    select = $(this).find("#settings-movie-length");

                // Select default value and bind event listener
                select.find("[value = " + currentValue + "]").attr("selected", "selected");
                select.bind('change', function (e) {
                    Helioviewer.userSettings.set("defaults.movies.duration",
                        parseInt(this.value, 10));
                });                              
            }
        });
    },
    
    /**
     * Sets up event handlers for a single dialog
     */
    _setupDialog: function (btn, dialog, options) {
        // Default options
        var defaults = {
            title     : "Helioviewer.org",
            autoOpen  : true,
            draggable : true,
            width     : 480,
            height    : 480            
        };        
        
        // Button click handler
        $(btn).click(function () {
            var d   = $(dialog),
                btn = $(this);

            if (btn.hasClass("dialog-loaded")) {
                if (d.dialog('isOpen')) {
                    d.dialog('close');
                }
                else {
                    d.dialog('open');
                }
            } else {
                d.load(this.href).dialog($.extend(defaults, options));
                btn.addClass("dialog-loaded");
            }
            return false; 
        });
    },

    /**
     * @description Initialize event-handlers for UI components controlled by the Helioviewer class
     */
    _initEventHandlers: function () {
        var self = this;
        
        $('#link-button').click($.proxy(this.displayURL, this));
        //$('#email-button').click($.proxy(this.displayMailForm, this));
        
        // 12/08/2010: Disabling JHelioviewer JNLP launching until better support is added
        //$('#jhelioviewer-button').click($.proxy(this.launchJHelioviewer, this));
        
        $('#social-buttons .text-btn').each(function (i, item) {
            addIconHoverEventListener($(this)); 
        });
        
        // Fix drag and drop for mobile browsers
        $("#helioviewer-viewport, .ui-slider-handle").each(function () {
            assignTouchHandlers(this);
        });
    },
    
    /**
     * displays a dialog containing a link to the current page
     * @param {Object} url
     */
    displayURL: function () {
        var url     = this.toURL(),
            input   = $("#helioviewer-url-input-box");
        
        $("#url-dialog").dialog({
            dialogClass: 'helioviewer-modal-dialog',
            height    : 100,
            width     : $('html').width() * 0.7,
            modal     : true,
            resizable : false,
            title     : "URL",
            open      : function (e) {
                $('.ui-widget-overlay').hide().fadeIn();
                input.attr('value', url).select();
            }
        });
    },
    
    /**
     * @description Displays a form to allow the user to mail the current view to someone
     * 
     * http://www.w3schools.com/php/php_secure_mail.asp
     * http://www.datahelper.com/mailform_demo.phtml
     */
    displayMailForm: function () {
        // Get URL
        var html, url = this.toURL();
        
        html = '<div id="helioviewer-url-box">' +
               'Who would you like to send this page to?<br>' + 
               '<form style="margin-top:15px;">' +
               '<label>From:</label>' +
               '<input type="email" placeholder="from@example.com" class="email-input-field" ' +
               'id="email-from" value="Your Email Address"></input><br>' +
               '<label>To:</label>' +
               '<input type="email" placeholder="to@example.com" class="email-input-field" id="email-from" ' + 
               'value="Recipient\'s Email Address"></input>' +
               '<label style="float:none; margin-top: 10px;">Message: </label>' + 
               '<textarea style="width: 370px; height: 270px; margin-top: 8px;">Check this out:\n\n' + url +
               '</textarea>' + 
               '<span style="float: right; margin-top:8px;">' + 
               '<input type="submit" value="Send"></input>' +
               '</span></form>' +
               '</div>';
        
    },
    
    /**
     * Displays recent news from the Helioviewer Project blog
     */
    displayBlogFeed: function (feed, n, showDescription, descriptionWordLength) {
        var url = this.serverSettings.newsURL, html = "";
        
        $.getFeed({
            url: feed,
            success: function (feed) {
                var link, date, more, description;
                
                // Display message if there was an error retrieving the feed
                if (!feed.items) {
                    $("#social-panel").append("Unable to retrieve news feed...");
                    return;
                }

                // Grab the n most recent articles
                $.each(feed.items.slice(0, n), function (i, a) {
                    link = "<a href='" + a.link + "' alt='" + a.title + "' target='_blank'>" + a.title + "</a><br />";
                    date = "<div class='article-date'>" + a.updated.slice(0, 26) + "UTC</div>";
                    html += "<div class='blog-entry'>" + link + date;
                    
                    // Include description?
                    if (showDescription) {
                        description = a.description;

                        // Shorten if requested
                        if (typeof descriptionWordLength === "number") {
                            description = description.split(" ").slice(0, descriptionWordLength).join(" ") + " [...]";
                        }
                        html += "<div class='article-desc'>" + description + "</div>";
                    }
                    
                    html += "</div>";
                });
                
                more = "<div id='more-articles'><a href='" + url +
                       "' alt='The Helioviewer Project Blog'>More...</a></div>";
                
                $("#social-panel").append(html + more);
            }
        });
    },
    
    /**
     * Launches an instance of JHelioviewer
     * 
     * Helioviewer attempts to choose a 24-hour window around the current observation time. If the user is
     * currently browsing near the end of the available data then the window for which the movie is created
     * is shifted backward to maintain it's size.
     */
    launchJHelioviewer: function () {
        var endDate, params;
        
        // If currently near the end of available data, shift window back
        endDate = new Date(Math.min(this.timeControls.getDate().addHours(12), new Date()));

        params = {
            "action"    : "launchJHelioviewer",
            "endTime"   : endDate.toISOString(),
            "startTime" : endDate.addHours(-24).toISOString(),
            "imageScale": this.viewport.getImageScaleInKilometersPerPixel(),
            "layers"    : this.viewport.serialize()
        };
        window.open(this.api + "?" + $.param(params), "_blank");
    },

    /**
     * Displays welcome message on user's first visit
     */
    _displayGreeting: function () {
        if (!Helioviewer.userSettings.get("notifications.welcome")) {
            return;
        }

        $(document).trigger("message-console-info", 
            ["<b>Welcome to Helioviewer.org</b>, a solar data browser. First time here? Be sure to check out our " +
             "<a href=\"http://wiki.helioviewer.org/wiki/Helioviewer.org_User_Guide\" " +
             "class=\"message-console-link\" target=\"_blank\"> User Guide</a>.", {life: 20000}]
        );
        
        Helioviewer.userSettings.set("notifications.welcome", false);
    },
    
    /**
     * Returns the current observation date
     * 
     * @return {Date} observation date
     */
    getDate: function () {
        return this.timeControls.getDate();
    },
    
    /**
     * Returns the currently loaded layers
     * 
     * @return {String} Serialized layer string
     */
    getLayers: function () {
        return this.viewport.serialize();
    },
    
    /**
     * Returns the currently displayed image scale
     *
     * @return {Float} image scale in arc-seconds/pixel
     */
    getImageScale: function () {
        return this.viewport.getImageScale();
    },
    
    /**
     * Returns an array of the Helioviewer servers that should be used for requests
     * 
     * @return {Array} Helioviewer servers to use
     */
    getServers: function () {
        return this.serverSettings.servers;
    },
    
    /**
     * Returns the top-left and bottom-right coordinates for the viewport region of interest
     * 
     * @return {Object} Current ROI 
     */
    getViewportRegionOfInterest: function () {
        return this.viewport.getRegionOfInterest();
    },
    
    /**
     * Builds a URL for the current view
     *
     * @TODO: Add support for viewport offset, event layers, opacity
     * 
     * @returns {String} A URL representing the current state of Helioviewer.org.
     */
    toURL: function () {
        var url, date, imageScale, imageLayers;
        
        // Add timestamp
        date = this.timeControls.toISOString();
    
        // Add image scale
        imageScale = this.viewport.getImageScale();
        
        // Image layers
        imageLayers = this.viewport.serialize();
        
        // Build URL
        url = this.serverSettings.rootURL + "/?date=" + date + "&imageScale=" + imageScale +
              "&imageLayers=" + imageLayers;

        return url;
    },
    
    /**
     * Sun-related Constants
     */
    constants: {
        au: 149597870700, // 1 au in meters (http://maia.usno.navy.mil/NSFA/IAU2009_consts.html)
        rsun: 695700000  // radius of the sun in meters (JHelioviewer)
    }
});
