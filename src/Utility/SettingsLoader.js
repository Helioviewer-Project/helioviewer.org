/**
 * @fileOverview Contains the class definition for a SettingsLoader class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global $, Class, getUTCTimestamp, parseFloat, UserSettings */
"use strict";
var SettingsLoader = (
    /** @lends SettingsLoader.prototype */
    {    
    /**
     * Loads default settings and URL settings.
     * 
     * @returns {Object} A UserSettings object
     */
    loadSettings: function (urlParams, serverSettings) {
        var userSettings, timestamp;
        this.urlParams = urlParams;
        
        userSettings = new UserSettings(this._getDefaultUserSettings(serverSettings), serverSettings);

        if (this.urlParams.date) {
            timestamp = getUTCTimestamp(this.urlParams.date);
            $(document).trigger("save-setting", ["date", timestamp]);
        }

        if (this.urlParams.imageScale) {
            $(document).trigger("save-setting", ["imageScale", parseFloat(this.urlParams.imageScale)]);
        }
        
        return userSettings;
    },

    /**
     * Creates a hash containing the default settings to use. Change default settings here.
     * 
     * @returns {Object} The default Helioviewer.org settings
     */
    _getDefaultUserSettings: function (serverSettings) {
        return {
            date            : getUTCTimestamp(serverSettings.defaultObsTime),
            imageScale      : serverSettings.defaultImageScale,
            version         : serverSettings.version,
            warnMouseCoords : true,
            showWelcomeMsg  : true,
            //minImageScale   : this.minImageScale,
            //maxImageScale   : this.maxImageScale,
            //maxTileLayers   : this.maxTileLayers,
            //prefetchSize    : this.prefetchSize,
            //tileServers     : this.tileServers,
            //timeIncrementSecs: this.timeIncrementSecs,
            //rootURL         : this.rootURL,
            tileLayers : [{
                server     : 0,
                observatory: 'SOHO',
                instrument : 'EIT',
                detector   : 'EIT',
                measurement: '304',
                visible    : true,
                opacity    : 100
            }]
        };
    }
});
