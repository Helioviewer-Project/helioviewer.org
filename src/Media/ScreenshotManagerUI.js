/**
 * ScreenshotManagerUI class definition
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: false, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, setTimeout, window, Media, extractLayerName, addIconHoverEventListener */
"use strict";
var ScreenshotManagerUI = Class.extend(
    /** @lends ScreenshotManagerUI */
    {
    /**
     * @constructs
     * Creates a new ScreenshotManagerUI instance
     * 
     * @param {ScreenshotManager} model ScreenshotManager instance
     */    
    init: function (model) {
        this._screenshots = model;
        
        this._container = null;
        this._history   = null;
        this._btn       = $("#screenshot-button");

        this._initUI();
        this._initEvents();
        
        this._loadScreenshots();
    },
    
    /**
     * Initializes ScreenshotManager-related event handlers
     */
    _initEvents: function () {
        var self = this;

        this._btn.click(function () {
           self._container.toggle(); 
        });
        
        addIconHoverEventListener(this._fullViewportBtn);
        addIconHoverEventListener(this._selectAreaBtn);
        addIconHoverEventListener(this._clearBtn);
    },
    
    /**
     * Initializes the ScreenshotManager user interface
     */
    _initUI: function () {
        var html = "<div id='screenshot-manager-container' style='position: absolute; top: 25px; right: 20px; width: 190px; background: #2A2A2A; font-size: 11px; padding: 10px; -moz-border-radius:5px; color: white;'>" +
                   "<div id='screenshot-manager-full-viewport' class='text-btn'>" +
                       "<span class='ui-icon ui-icon-arrowthick-2-se-nw' style='float:left;'></span>" +
                       "<span style='line-height: 1.6em'>Full Viewport</span>" +
                   "</div>" +
                   "<div id='screenshot-manager-select-area' class='text-btn' style='float:right;'>" +
                       "<span class='ui-icon ui-icon-scissors' style='float:left;'></span>" +
                       "<span style='line-height: 1.6em'>Select Area</span>" + 
                   "</div><br /><br />" +
                   "<div id='screenshot-history-title' style='line-height:1.6em; font-weight: bold; padding: 9px 0px; border-top: 1px solid;'>" +
                       "Screenshot History" + 
                       "<div id='screenshot-clear-history-button' class='text-btn' style='float:right;'>" +
                           "<span class='ui-icon ui-icon-trash' style='float:left;' />" +
                           "<span style='font-weight:normal'><i>Clear</i></span>" +
                       "</div>" + 
                   "</div>" +
                   "<div id='screenshot-history'></div>"
                   "</div>";
        
        this._container = $(html).appendTo("#helioviewer-viewport-container-inner");
        this._history   = $("#screenshot-history");
        
        this._fullViewportBtn = $("#screenshot-manager-full-viewport");
        this._selectAreaBtn   = $("#screenshot-manager-select-area");
        this._clearBtn        = $("#screenshot-clear-history-button");
    },
    
    /**
     * Adds a single screenshot entry to the history
     */
    _addScreenshot: function (screenshot) {
        var html = "<div class='history-entry'>" +
        		   "<div id='" + screenshot.id + "' class='text-btn' style='float:left'>" + screenshot.name + "</div>" +
                   "<div style='float:right; font-size: 8pt;'><i>" + screenshot.getTimeDiff() + "</i></div><br /><br />" +
                   "</div>";
        
        this._history.prepend(html);
    },
    
    /**
     * Removes a single screenshot from the bottom of the history
     */
    _removeScreenshot: function () {
        this._history.find(".history-entry").last().remove();
    },
    
    /**
     * Creates HTML for screenshot history entries
     */
    _loadScreenshots: function () {
        var self = this;

        $.each(this._screenshots.toArray(), function (i, screenshot) {
            self._addScreenshot(screenshot);
        });
    }
});
