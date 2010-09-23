/**
 * @fileOverview Contains the main application class and controller.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
  bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, Calendar, FullscreenControl, 
  KeyboardManager, ImageSelectTool, LayerManager, MediaSettings, MovieBuilder, MessageConsole, Shadowbox, TileLayer,
  TileLayerAccordion, TileLayerManager, TimeControls, TooltipHelper, UserSettings, ZoomControls, Viewport, 
  ScreenshotBuilder, document, window, localStorage, extendLocalStorage, getUTCTimestamp, Time, SettingsLoader */
"use strict";
var UIController = Class.extend(
    /** @lends UIController.prototype */
    {
    /**
     * Creates a new UIController instance.
     * @constructs
     * 
     * @param {Object} urlSettings    Settings specified via URL
     * @param {Object} serverSettings Server settings
     */
    init: function (urlSettings, serverSettings) {
        this.urlSettings = urlSettings;

        this._checkBrowser(); // Determines browser support
        
        this.serverSettings = serverSettings; 
        this.userSettings   = SettingsLoader.loadSettings(urlSettings, serverSettings);

        this._initLoadingIndicator();
        
        this.timeControls = new TimeControls(this.userSettings.get('date'), this.serverSettings.timeIncrementSecs,
                                            '#date', '#time', '#timestep-select', '#timeBackBtn', '#timeForwardBtn');

        this.api = "api/index.php";
        
        // Get available data sources and initialize viewport
        this._initViewport();
        this._loadExtensions();
    },
 
    /**
     * Initializes a default viewport. Overridden in Helioviewer.js
     */
    _initViewport: function () {    
        this.viewport = new Viewport({
            api            : this.api,
            id             : '#helioviewer-viewport',
            requestDate    : this.timeControls.getDate(),
            timestep       : this.timeControls.getTimeIncrement(),
            urlStringLayers: this.urlSettings.imageLayers  || "",
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
     * Loads the message console and keyboard shortcuts by default. Loading of extra
     * event handlers/UI elements such as time controls, zoom controls, and tooltips
     * can go here. Overridden in Helioviewer.js but this method is called by that one.
     */
    _loadExtensions: function () {
        this.messageConsole = new MessageConsole();
        this.keyboard       = new KeyboardManager();
        
        // User Interface components
        this.zoomControls   = new ZoomControls('#zoomControls', this.userSettings.get('imageScale'),
                                               this.serverSettings.minImageScale, this.serverSettings.maxImageScale); 
                                             

        this.fullScreenMode = new FullscreenControl("#fullscreen-btn", 500);
    }
});