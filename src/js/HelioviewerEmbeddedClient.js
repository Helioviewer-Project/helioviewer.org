/**
 * @fileOverview Contains JavaScript for an embedded version of Helioviewer.org
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
  bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global document, window, $, HelioviewerClient, TooltipHelper, 
  HelioviewerViewport, addIconHoverEventListener, KeyboardManager, 
  SettingsLoader, addthis, ZoomControls, assignTouchHandlers */
"use strict";
var HelioviewerEmbeddedClient = HelioviewerClient.extend(
    /** @lends HelioviewerWebClient.prototype */
    {
    /**
     * Creates a new embedded Helioviewer.org instance.
     * @constructs
     * 
     * @param {Object} urlSettings Client-specified settings to load.
     *  Includes imageLayers, date, and imageScale. May be empty.
     * @param {Object} serverSettings Server settings loaded from Config.ini
     */
    init: function (api, urlSettings, serverSettings, zoomLevels) {
        var date, imageScale;
        
        this._super(api, urlSettings, serverSettings, zoomLevels);
        
        // Determine image scale to use
        imageScale = this._chooseInitialImageScale(Helioviewer.userSettings.get('state.imageScale'), zoomLevels);
        
        // Use URL date if specified, otherwise use current time
        if (urlSettings.date) {
            date = Date.parseUTCDate(urlSettings.date);
        } else {
            date = new Date().toUTCDate();
        }
                
        // Get available data sources and initialize viewport
        this._initViewport("body", date, 0, 0);
        
        // User Interface components
        this.zoomControls   = new ZoomControls('#zoomControls', imageScale, zoomLevels,
                                               this.serverSettings.minImageScale, this.serverSettings.maxImageScale); 
    }
});