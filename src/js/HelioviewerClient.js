/**
 * @fileOverview Contains base Helioviewer client JavaScript
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
  bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global document, window, $, Class, TooltipHelper, HelioviewerViewport,
  KeyboardManager, SettingsLoader, addthis,
  ZoomControls, assignTouchHandlers */
"use strict";

var Helioviewer = {}; // Helioviewer global namespace

var HelioviewerClient = Class.extend(
    /** @lends HelioviewerClient.prototype */
    {
    /**
     * Base Helioviewer client class
     * @constructs
     * 
     * @param {Object} urlSettings Client-specified settings to load.
     *  Includes imageLayers, date, and imageScale. May be empty.
     * @param {Object} serverSettings Server settings loaded from Config.ini
     */
    init: function (api, urlSettings, serverSettings, zoomLevels) {
        this._checkBrowser(); // Determines browser support

        this.serverSettings = serverSettings;
        this.api            = api;

        Helioviewer.userSettings = SettingsLoader.loadSettings(urlSettings, serverSettings);
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
            "vp8"          : false
        });
        
        // HTML5 Video Support
        if ($.support.video) {
            var v = document.createElement("video");
            
            // VP8/WebM
            if (v.canPlayType('video/webm; codecs="vp8"')) {
                // 2011/11/07: Disabling vp8 support until encoding time
                // can be greatly reduced. WebM/VP8 movies will still be
                // generated on the back-end when resources are available,
                // but Flash/H.264 will be used in the mean-time to decrease
                // response time and queue waits.
                
                //$.support.vp8 = true;
                $.support.vp8 = false;
            }
            
            // H.264
            if (v.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"')) {
                // 2011/11/07: Also disabling H.264 in-browser video for now:
                // some versions of Chrome report support when it does not
                // actually work. 
                
                //$.support.h264 = true;
                $.support.h264 = false;
            }
        }
    },

    /**
     * Initializes Helioviewer's viewport
     */
    _initViewport: function (container, date, marginTop, marginBottom) {
        this.viewport = new HelioviewerViewport({
            id             : '#helioviewer-viewport',
            api            : this.api,
            container      : container,
            requestDate    : date,
            servers        : this.serverSettings.servers,
            maxTileLayers  : this.serverSettings.maxTileLayers,
            minImageScale  : this.serverSettings.minImageScale,
            maxImageScale  : this.serverSettings.maxImageScale,
            prefetch       : this.serverSettings.prefetchSize,
            tileLayers     : Helioviewer.userSettings.get('state.tileLayers'),
            imageScale     : Helioviewer.userSettings.get('state.imageScale'),
            centerX        : Helioviewer.userSettings.get('state.centerX'),
            centerY        : Helioviewer.userSettings.get('state.centerY'),
            marginTop      : marginTop,
            marginBottom   : marginBottom,
            warnMouseCoords: Helioviewer.userSettings.get('notifications.coordinates')
        });   
    },
    
    /**
     * Chooses an acceptible image scale to use based on the default or
     * requested imageScale the list of allowed increments 
     */
    _chooseInitialImageScale: function (imageScale, increments) {
        // For exact match, use image scale as-is
        if ($.inArray(imageScale, increments) !== -1) {
            return imageScale;
        }
        // Otherwise choose closest acceptible image scale
        var diff, closestScale, bestMatch = Infinity;
        
        $.each(increments, function (i, scale) {
            diff = Math.abs(scale - imageScale);

            if (diff < bestMatch) {
                bestMatch = diff;
                closestScale = scale;
            }
        });
        
        // Store closest matched image scale
        Helioviewer.userSettings.set('state.imageScale', closestScale);

        return closestScale;
    },
});