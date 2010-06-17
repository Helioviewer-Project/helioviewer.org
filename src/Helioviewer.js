/**
 * @fileOverview Contains the main application class and controller for Helioviewer.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
  bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, Calendar, FullscreenControl, UIController,
  KeyboardManager, ImageSelectTool, LayerManager, MediaSettings, MovieBuilder, MessageConsole, Shadowbox, TileLayer,
  TileLayerAccordion, TileLayerManager, TimeControls, TooltipHelper, UserSettings, ZoomControls, HelioviewerViewport, 
  ScreenshotBuilder, document, window, localStorage, extendLocalStorage, getUTCTimestamp, Time */
"use strict";
var Helioviewer = UIController.extend(
    /** @lends Helioviewer.prototype */
    {
    /**
     * Creates a new Helioviewer instance.
     * @constructs
     * 
     * @param {Object} urlParams  Client-specified settings to load. Includes imageLayers,
     *                            date, and imageScale
     * @param {Object} settings   Server settings loaded from Config.ini
     */
    init: function (urlParams, settings) {
        // Calling super will load settings and call _loadExtensions()
        this._super(urlParams, settings);
        this.api = "api/index.php";

        // Get available data sources and initialize viewport
        this._getDataSourcesAndLoadViewport();
        
        this._setupDialogs();
        this._initEventHandlers();
        this._displayGreeting();
    },
    
    /**
     * Loads the message console, keyboard shortcut manager, tooltips, 
     * zoom controls, time controls, and full screen controls
     */
    _loadExtensions: function () {
        this.messageConsole = new MessageConsole();
        this.keyboard       = new KeyboardManager();
        this._initTooltips();
    
        // User Interface components
        this.zoomControls   = new ZoomControls('#zoomControls', this.userSettings.get('imageScale'),
                                         this.minImageScale, this.maxImageScale);

        this.timeControls   = new TimeControls(this.userSettings.get('date'), this.timeIncrementSecs, 
                                         '#date', '#time', '#timestep-select', '#timeBackBtn', '#timeForwardBtn');
        this.fullScreenMode = new FullscreenControl("#fullscreen-btn", 500);

        //this.mediaSettings      = new MediaSettings(this);
        //this.movieBuilder       = new MovieBuilder(this);
        //this.imageSelectTool    = new ImageSelectTool(this);
        //this.screenshotBuilder  = new ScreenshotBuilder(this);
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
     * @description Returns a tree representing available data sources
     */
    _getDataSourcesAndLoadViewport: function () {
        var callback, date, timestep, self = this;
        
        date     = this.timeControls.getDate();
        timestep = this.timeControls.getTimeIncrement();
        
        callback = function (dataSources) {
            self.dataSources = dataSources;
            self.tileLayerAccordion = new TileLayerAccordion('#tileLayerAccordion', dataSources, date, timestep);
            self._initViewport(date);
        };
        $.post(this.api, {action: "getDataSources"}, callback, "json");
    },
    
    /**
     * Initializes Helioviewer's viewport
     */
    _initViewport: function (date) {
        this.viewport = new HelioviewerViewport({
            api            : this.api,
            id             : '#helioviewer-viewport',
            requestDate    : date,
            dataSources    : this.dataSources,
            tileServers    : this.tileServers,
            tileLayers     : this.userSettings.get('tileLayers'),
            urlStringLayers: this.urlParams.imageLayers,
            maxTileLayers  : this.maxTileLayers,
            imageScale     : this.userSettings.get('imageScale'),
            minImageScale  : this.minImageScale, 
            maxImageScale  : this.maxImageScale, 
            prefetch       : this.prefetchSize,
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
        $('#social-buttons .text-btn').hover(function () {
            $(this).children(".ui-icon").addClass("ui-icon-hover");
        },
            function () {
            $(this).children(".ui-icon").removeClass("ui-icon-hover");
        });
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
     */
    launchJHelioviewer: function () {
        window.open("http://www.jhelioviewer.org", "_blank");
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
     * Creates a hash containing the default settings to use
     * 
     * @returns {Object} The default Helioviewer.org settings
     */
    _getDefaultUserSettings: function () {
        return {
            date            : getUTCTimestamp(this.defaultObsTime),
            imageScale      : this.defaultImageScale,
            version         : this.version,
            warnMouseCoords : true,
            showWelcomeMsg  : true,
            tileLayers : [{
                server     : 0,
                observatory: 'SOHO',
                instrument : 'EIT',
                detector   : 'EIT',
                measurement: '304',
                visible    : true,
                opacity    : 100
            }],
            eventIcons      : {
                'VSOService::noaa'         : 'small-blue-circle',
                'GOESXRayService::GOESXRay': 'small-green-diamond',
                'VSOService::cmelist'      : 'small-yellow-square'
            }
        };
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
        imageLayers = this.tileLayers.serialize();
        
        // Build URL
        url = this.rootURL + "/?date=" + date + "&imageScale=" + imageScale + "&imageLayers=" + imageLayers;

        return url;
    }
});

