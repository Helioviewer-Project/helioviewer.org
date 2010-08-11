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
     * @param {Object} urlParams        Settings specified via URL
     * @param {Object} serverSettings   Server settings
     */
    init: function (urlParams, serverSettings) {
        this.urlParams = urlParams;

        // Determine browser support
        this._checkBrowser();
        
        this.serverSettings = serverSettings; 
        this.userSettings   = SettingsLoader.loadSettings(urlParams, serverSettings);

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
            urlStringLayers: this.urlParams.imageLayers  || "",
            tileServers    : this.serverSettings.tileServers,
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
     * @description Checks browser support for various features used in
     *              Helioviewer
     */
    _checkBrowser: function () {
        $.support.nativeJSON = (typeof (JSON) !== "undefined") ? true : false;
        $.support.localStorage = !!window.localStorage;
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
                                             this.serverSettings.minImageScale, 
                                             this.serverSettings.maxImageScale);

        this.fullScreenMode = new FullscreenControl("#fullscreen-btn", 500);
    }
});