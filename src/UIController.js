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
  ScreenshotBuilder, document, window, localStorage, extendLocalStorage, getUTCTimestamp, Time */
"use strict";
var UIController = Class.extend(
    /** @lends UIController.prototype */
    {
    /**
     * Creates a new UIController instance.
     * @constructs
     * 
     * @param {Object} urlParams  Client-specified settings to load
     * @param {Object} settings   Server settings
     */
    init: function (urlParams, settings) {
        $.extend(this, settings);
        this.urlParams = urlParams;

        // Determine browser support
        this._checkBrowser();

        // Load saved user settings
        this._loadSavedSettings();
        this._loadURLSettings();

        this._initLoadingIndicator();
	this._loadExtensions();
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
     * @description Loads user settings from URL, cookies, or defaults if no settings have been stored.
     */
    _loadSavedSettings: function () {
        this.userSettings = new UserSettings(this._getDefaultUserSettings(), this.minImageScale, this.maxImageScale);
    },
    
    /**
     * Loads any parameters specified in the URL
     */
    _loadURLSettings: function () {
        var timestamp, layerSettings, layers, self = this;
        
        if (this.urlParams.date) {
            timestamp = getUTCTimestamp(this.urlParams.date);
            $(document).trigger("save-setting", ["date", timestamp]);
        }

        if (this.urlParams.imageScale) {
            $(document).trigger("save-setting", ["imageScale", parseFloat(this.urlParams.imageScale)]);
        }
    },
    
    /**
     * Override by extending this class
     */
    _getDefaultUserSettings: function () {
    	return {};
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
     * can go here.
     */
    _loadExtensions: function () {
    	this.messageConsole = new MessageConsole();
    	this.keyboard 	    = new KeyboardManager(this);
    },
});