/**
 * @fileOverview Contains the main application class and controller for Helioviewer.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
  bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, Calendar, EventLayerAccordion, EventLayerManager, EventTimeline, FullscreenControl, 
  KeyboardManager, ImageSelectTool, LayerManager, MediaSettings, MovieBuilder, MessageConsole, Shadowbox, TileLayer,
  TileLayerAccordion, TileLayerManager, TimeControls, TooltipHelper, UserSettings, ZoomControls, Viewport, 
  ScreenshotBuilder, document, window, localStorage, extendLocalStorage, getUTCTimestamp, Time */
"use strict";
var Helioviewer = Class.extend(
    /** @lends Helioviewer.prototype */
    {
    /**
     * Creates a new Helioviewer instance.
     * @constructs
     * 
     * @param {String} viewportId Viewport container selector.
     * @param {Object} urlParams  Client-specified settings to load
     * @param {Object} settings   Server settings
     */
    init: function (viewportId, urlParams, settings) {
        $.extend(this, settings);
        this.load        = urlParams;
        this.api         = "api/index.php";
        this.viewportId  = viewportId;

        // Determine browser support
        this._checkBrowser();
        
        // Load user-settings
        this._loadUserSettings();
        
        // Loading indicator
        this._initLoadingIndicator();
        
        // Get available data sources
        this._getDataSources();
        
        // Tooltip helper
        this.tooltips = new TooltipHelper(true);

        // Layer Managers
        this.tileLayers  = new TileLayerManager(this);
        this.eventLayers = new EventLayerManager(this);
        
        this._initViewport();
        this._initUI();
        this._initEvents();
        
        this.mediaSettings     = new MediaSettings(this);                
        this.movieBuilder      = new MovieBuilder(this);
        this.imageSelectTool   = new ImageSelectTool(this);
        this.screenshotBuilder = new ScreenshotBuilder(this);
        
        // Display welcome message on user's first visit
        if (this.userSettings.get('showWelcomeMsg')) {
            $(document).trigger("message-console-info", ["<b>Welcome to Helioviewer.org</b>, a solar data browser." + 
            " First time here? Be sure to check out our <a class=\"message-console-link\" " +
            "href=\"http://helioviewer.org/wiki/index.php?title=Helioviewer.org_User_Guide\" target=\"_blank\">" +
            "User Guide</a>.", {life: 15000}]);
            $(document).trigger("save-setting", ["showWelcomeMsg", false]);
        }
    },
    
    /**
     * @description Returns the current observation date as a JavaScript Date object
     */
    getDate: function () {
        return this.date.getDate();  
    },

    /**
     * @description Initialize Helioviewer's user interface (UI) components
     */
    _initUI: function () {
        var mouseCoords;

        // Observation date & controls
        this.date = new Time(this);

        //Zoom-controls
        this.zoomControls = new ZoomControls(this, {
            id: '#zoomControls',
            imageScale    : this.userSettings.get('imageScale'),
            minImageScale : this.minImageScale,
            maxImageScale : this.maxImageScale
        });

        //Time-navigation controls
        this.timeControls = new TimeControls(this, this.timeIncrementSecs, '#date', '#time', '#timestep-select',
                                             '#timeBackBtn', '#timeForwardBtn');

        //Message console
        this.messageConsole = new MessageConsole();

        //Tile & Event Layer Accordions (accordions must come before LayerManager instance...)
        this.tileLayerAccordion  = new TileLayerAccordion(this,  '#tileLayerAccordion');
        this.eventLayerAccordion = new EventLayerAccordion(this, '#eventAccordion');

        //Fullscreen button
        this.fullScreenMode = new FullscreenControl(this, "#fullscreen-btn", 500);

        // Setup dialog event listeners
        this._setupDialogs();
        
        // Tooltips
        this.tooltips.createTooltip($("#timeBackBtn, #timeForwardBtn, #center-button"));
        this.tooltips.createTooltip($("#fullscreen-btn"), "topRight");
        
        //Movie builder
        //this.movieBuilder = new MovieBuilder({id: 'movieBuilder', controller: this});

        // Timeline
        //this.timeline = new EventTimeline(this, "timeline");
    },   
    
    /**
     * @description Checks browser support for various features used in Helioviewer
     * TODO: Check for IE: localStorage exists in IE8, but works differently
     */
    _checkBrowser: function () {
       // Native JSON (2009/07/02: Temporarily disabled: see notes in UserSettings.js)
       $.support.nativeJSON = (typeof(JSON) !== "undefined") ? true: false;
       // $.support.nativeJSON = false;
        
        // Web storage (local)
        $.support.localStorage = !!window.localStorage;
        
        // (2009/07/02) Temporarily disabled on IE (works differently)
        if ($.browser.msie) {
            $.support.localStorage = false;
        }
        
        // CSS3 text-shadows
        // (2009/07/16 Temporarily disabled while re-arranging social buttons & meta links)
        //$.support.textShadow = 
        //    ((navigator.userAgent.search(/Firefox\/[1-3]\.[0-1]/) === -1) && (!$.browser.msie)) ? true : false;
        $.support.textShadow = false;
        

        // Add JSON support to local storage
        if ($.support.nativeJSON && $.support.localStorage) {
            extendLocalStorage();
        }

    },
    
    /**
     * @description Returns a tree representing available data sources
     */
    _getDataSources: function () {
        var callback, self = this;
        
        callback = function (data) {
            self.dataSources = data;
            
            // Add initial layers
            $.each(self.userSettings.get('tileLayers'), function () {
                self.tileLayers.addLayer(new TileLayer(self, this));
            });
        };
        $.post(this.api, {action: "getDataSources"}, callback, "json");
    },
    
    /**
     * @description Sets up event-handlers for dialog components
     */
    _setupDialogs: function () {
        
        // About dialog
        $("#helioviewer-about").click(function () {
            if ($(this).hasClass("dialog-loaded")) {
                var d = $('#about-dialog');
                if (d.dialog('isOpen')) {
                    d.dialog('close');
                }
                else {
                    d.dialog('open');
                }
            } else {
                $('#about-dialog').load(this.href).dialog({
                    autoOpen: true,
                    title: "Helioviewer - About",
                    width: 480,
                    height: 300,
                    draggable: true
                });
                $(this).addClass("dialog-loaded");
            }
            return false; 
        });

        //Keyboard shortcuts dialog
        $("#helioviewer-usage").click(function () {
            if ($(this).hasClass("dialog-loaded")) {
                var d = $('#usage-dialog');
                if (d.dialog('isOpen')) {
                    d.dialog('close');
                }
                else {
                    d.dialog('open');
                }
            } else {
                $('#usage-dialog').load(this.href).dialog({
                    autoOpen: true,
                    title: "Helioviewer - Usage Tips",
                    width: 480,
                    height: 480,
                    draggable: true
                });
                $(this).addClass("dialog-loaded");
            }
            return false; 
        });
    },
    
    /**
     * Selects a server to handle all tiling and image requests for a given layer
     */
    selectTilingServer: function () {
        var rand;
        
        // Choose server to use
        if (this.distributed === true) {
            if (this.localQueriesEnabled) {
                rand = Math.floor(Math.random() * (this.tileServers.length));
            } else {
                rand = Math.floor(Math.random() * (this.tileServers.length - 1)) + 1;
            }                    
            return rand;                    
        }
        // If distribted tiling is disabled, local tiling must be enabled
        else {
            return 0;
        }
    },

    /**
     * @description Loads user settings from URL, cookies, or defaults if no settings have been stored.
     */
    _loadUserSettings: function () {
        var defaults, timestamp, layerSettings, layers, rand, self = this;
        
        // Optional debugging information
        // TODO 01/20/2010: Provide finer control over what should be logged, e.g. "debug=[tiles,keyboard]"
        if (this.load.debug && (this.load.debug.toLowerCase() === "true")) {
            this.debug = true;
        }
        
        defaults = this._getDefaultUserSettings();
        
        this.userSettings = new UserSettings(defaults, this.minImageScale, this.maxImageScale);
        
        // Load any view parameters specified via API
        if (this.load.date) {
            timestamp = getUTCTimestamp(this.load.date);
            $(document).trigger("save-setting", ["date", timestamp]);
        }

        if (this.load.imageScale) {
            $(document).trigger("save-setting", ["imageScale", parseFloat(this.load.imageScale)]);
        }

        // Process and load and layer strings specified
        if (this.load.imageLayers) {
            layers = [];
            
            $.each(this.load.imageLayers, function () {
                layerSettings        = TileLayerManager.parseLayerString(this);
                layerSettings.server = self.selectTilingServer();
                
                // Load layer
                layers.push(layerSettings);
            });
            $(document).trigger("save-setting", ["tileLayers", layers]);
        }

    },

    /**
     * @description Initialize Helioviewer's viewport(s).
     */
    _initViewport: function () {
        this.viewport =    new Viewport(this, {
            id: this.viewportId,
            imageScale: this.userSettings.get('imageScale'),
            prefetch: this.prefetchSize,
            debug: false
        });
        
        this.updateShadows();
    },

    /**
     * @description Initialize event-handlers for UI components controlled by the Helioviewer class
     */
    _initEvents: function () {
        var self = this;
        
        // Initiallize keyboard shortcut manager
        this.keyboard = new KeyboardManager(this);
        
        $('#center-button').click($.proxy(this.viewport.center, this.viewport));
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
     * @description Translates a given zoom-level into an image plate scale.
     */
    getImageScale: function () {
        return this.viewport.imageScale;
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
        w = $('html').width() * 0.5;
        
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
     * @description Adds an animated text shadow based on the position and size of the Sun (Firefox 3.5+)
     * Added 2009/06/26
     * TODO: Apply to other text based on it's position on screen? Adjust blue based on zoom-level?
     *       Use viewport size to determine appropriate scales for X & Y offsets (normalize)
     *       Re-use computeCoordinates?
     */
    updateShadows: function () {
        // Not supported in older versions of Firefox, or in IE
        if (!$.support.textShadow) {
            return;
        }
        
        var viewportOffset, sunCenterOffset, coords, viewportCenter, offsetX, offsetY;
        
        viewportOffset  = $("#helioviewer-viewport").offset();
        sunCenterOffset = $("#moving-container").offset();

        // Compute coordinates of heliocenter relative to top-left corner of the viewport
        coords = {
            x: sunCenterOffset.left - viewportOffset.left,
            y: sunCenterOffset.top - viewportOffset.top
        };
        
        // Coordinates of heliocenter relative to the viewport center
        viewportCenter = this.viewport.getCenter();
        coords.x = coords.x - viewportCenter.x;
        coords.y = coords.y - viewportCenter.y;
        
        // Shadow offset
        offsetX = ((500 - coords.x) / 100) + "px";
        offsetY = ((500 - coords.y) / 150) + "px";

        //console.log("x: " + coords.x + ", y: " + coords.y);
        $("#footer-links > .light").css("text-shadow", offsetX + " " + offsetY + " 3px #000");
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
                server     : this.selectTilingServer(),
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
        date = this.date.toISOString();
    
        // Add image scale
        imageScale = this.getImageScale();
        
        // Image layers
        imageLayers = this.tileLayers.serialize();
        
        // Build URL
        url = this.rootURL + "/?date=" + date + "&imageScale=" + imageScale + "&imageLayers=" + imageLayers;

        return url;
    }
});

