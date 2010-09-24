/**
 * @fileOverview Contains the main application class and controller for Helioviewer.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
  bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global document, window, $, UIController, ImageSelectTool, MovieBuilder, TooltipHelper, ViewportController, 
  ScreenshotBuilder, ScreenshotHistory, MovieHistory, Shadowbox */
"use strict";
var Helioviewer = UIController.extend(
    /** @lends Helioviewer.prototype */
    {
    /**
     * Creates a new Helioviewer instance.
     * @constructs
     * 
     * @param {Object} urlSettings    Client-specified settings to load. Includes imageLayers,
     *                                date, and imageScale. May be empty.
     * @param {Object} serverSettings Server settings loaded from Config.ini
     */
    init: function (urlSettings, serverSettings) {
        // Calling super will load settings, init viewport, and call _loadExtensions()
        this._super(urlSettings, serverSettings);
        
        this._setupDialogs();
        this._initEventHandlers();
        this._displayGreeting();
    },
    
    /**
     * Loads the message console, keyboard shortcut manager, tooltips, zoom controls, and
     * full screen controls. the movie builder, screenshot builder, and image select tool.
     */
    _loadExtensions: function () {
        this._super(); // Call super method in UIController to load a few extensions
        
        this._initTooltips();

        var screenshotHistory = new ScreenshotHistory(this.userSettings.get('screenshot-history')),
            movieHistory      = new MovieHistory(this.userSettings.get('movie-history'));

        this.movieBuilder      = new MovieBuilder(this.viewport, movieHistory);
        this.imageSelectTool   = new ImageSelectTool(this.viewport);
        this.screenshotBuilder = new ScreenshotBuilder(this.viewport, this.serverSettings.servers, screenshotHistory);
    },
    
    /**
     * Initializes tooltip manager and adds custom tooltips for basic navigation elements
     */
    _initTooltips: function () {
        this.tooltips = new TooltipHelper(true);
        $(document).trigger('create-tooltip', ["#timeBackBtn, #timeForwardBtn, #center-button"])
                   .trigger('create-tooltip', ["#fullscreen-btn", "topRight"]);
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
            tileLayers     : this.userSettings.get('tileLayers'),
            imageScale     : this.userSettings.get('imageScale'),
            warnMouseCoords: this.userSettings.get('warnMouseCoords')
        });   
    },
    
    /**
     * @description Sets up event-handlers for dialog components
     */
    _setupDialogs: function () {
        
        // About dialog
        $("#helioviewer-about").click(function () {
            var d   = $('#about-dialog'),
                btn = $(this);
            
            if (btn.hasClass("dialog-loaded")) {
                if (d.dialog('isOpen')) {
                    d.dialog('close');
                }
                else {
                    d.dialog('open');
                }
            } else {
                d.load(this.href).dialog({
                    autoOpen: true,
                    title: "Helioviewer - About",
                    width: 480,
                    height: 300,
                    draggable: true
                });
                btn.addClass("dialog-loaded");
            }
            return false; 
        });

        //Keyboard shortcuts dialog
        $("#helioviewer-usage").click(function () {
            var d   = $('#usage-dialog'),
                btn = $(this);
            if (btn.hasClass("dialog-loaded")) {
                if (d.dialog('isOpen')) {
                    d.dialog('close');
                }
                else {
                    d.dialog('open');
                }
            } else {
                d.load(this.href).dialog({
                    autoOpen: true,
                    title: "Helioviewer - Usage Tips",
                    width: 480,
                    height: 480,
                    draggable: true
                });
                btn.addClass("dialog-loaded");
            }
            return false; 
        });
    },

    /**
     * @description Initialize event-handlers for UI components controlled by the Helioviewer class
     */
    _initEventHandlers: function () {
        $('#link-button').click($.proxy(this.displayURL, this));
        $('#email-button').click($.proxy(this.displayMailForm, this));
        $('#jhelioviewer-button').click($.proxy(this.launchJHelioviewer, this));

        // Hover effect for text/icon buttons        
        $('#social-buttons .text-btn').hover(
            function () {
                $(this).children(".ui-icon").addClass("ui-icon-hover");
            },
            function () {
                $(this).children(".ui-icon").removeClass("ui-icon-hover");
            }
        );
    },
    
    /**
     * displays a dialog containing a link to the current page
     * @param {Object} url
     */
    displayURL: function () {
        var url, w;
        
        // Get URL
        url = this.toURL();
        
        // Shadowbox width
        w = $('html').width() * 0.7;
        
        Shadowbox.open({
            content:    '<div id="helioviewer-url-box">' +
                        'Use the following link to refer to current page:' + 
                        '<form style="margin-top: 5px;">' +
                        '<input type="text" id="helioviewer-url-input-box" style="width:98%;" value="' + url + '">' +
                        '</form>' +
                        '</div>',
            options: {
                enableKeys : false,
                onFinish   : function () {
                    $("#helioviewer-url-input-box").select();
                }
            },
            player:     "html",
            title:      "URL",
            height:     80,
            width:      w
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
        var url = this.toURL();
        
        Shadowbox.open({
            content:    '<div id="helioviewer-url-box">' +
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
                        '</div>',
            options: {
                enableKeys : false,
                onFinish: function () {
                    $(".email-input-field").one("click", function (e) {
                        this.value = "";
                    });
                }
            },
            player:     "html",
            title:      "Email",
            height:     455,
            width:      400
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
        if (!this.userSettings.get('showWelcomeMsg')) {
            return;
        }

        $(document).trigger("message-console-info", 
            ["<b>Welcome to Helioviewer.org</b>, a solar data browser. First time here? Be sure to check out our " +
             "<a href=\"http://helioviewer.org/wiki/index.php?title=Helioviewer.org_User_Guide\" " +
             "class=\"message-console-link\" target=\"_blank\"> User Guide</a>.", {life: 15000}]
        ).trigger("save-setting", ["showWelcomeMsg", false]);
    },
    
    /**
     * Builds a URL for the current view
     *
     * @TODO: Add support for viewport offset, event layers, opacity
     * @TODO: Make into a static method for use by Jetpack, etc? http://www.ruby-forum.com/topic/154386
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
    }
});

