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
    loadSettings: function (urlSettings, serverSettings) {
        var defaults    = this._getDefaultSettings(serverSettings),
            constraints = {
                "minImageScale" : serverSettings.minImageScale,
                "maxImageScale" : serverSettings.maxImageScale,
                "minMovieLength": 300,
                "maxMovieLength": 2629744
            };
        
        return new UserSettings(defaults, urlSettings, constraints);
    },
    
    /**
     * Creates a hash containing the default settings to use. Change default settings here.
     * 
     * TODO 10/01/2010: Add check when adding default layer to make sure it is available.
     * 
     * @returns {Object} The default Helioviewer.org settings
     */
    _getDefaultSettings: function (serverSettings) {
        return {
            date            : getUTCTimestamp(serverSettings.defaultObsTime),
            imageScale      : serverSettings.defaultImageScale,
            movieLength     : 86400,
            movies          : [],
            version         : serverSettings.version,
            warnMouseCoords : true,
            screenshots     : [],
            showWelcomeMsg  : true,
            tileLayers : [{
                server     : 0,
                observatory: 'SDO',
                instrument : 'AIA',
                detector   : 'AIA',
                measurement: '304',
                visible    : true,
                opacity    : 100
            }]
        };
    }
});
