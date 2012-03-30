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
                "maxMovieLength": 16934400
            };
        
        return new UserSettings(defaults, urlSettings, constraints);
    },
    
    /**
     * Creates a hash containing the default settings to use. Change default settings here.
     * 
     * TODO 10/01/2010: Add check when adding default layer to make sure it is available.
     * 
     * @param {Object} Helioviewer.org server-specified defaults
     * 
     * @returns {Object} The default Helioviewer.org settings
     */
    _getDefaultSettings: function (serverSettings) {
        // Use current date (UTC) for default observation time
        var date = new Date(+new Date());

        return {
            // Default settings
            options: {
                date: "latest", // "previous" | "latest"
                movies: {
                    cadence: "auto", // "auto" | number of seconds
                    duration: 86400,
                    format: "mp4"
                },
                autorefresh: false
            },
            // Saved movie and screenshots 
            history: {
                movies: [],
                screenshots: []
            },
            // Single-time notifications and warning messages
            notifications: {
                coordinates: true,
                welcome: true
            },
            // Application state
            state: {
                centerX: 0,
                centerY: 0,
                date: date.getTime(),
                eventLayers: [],
                imageScale: serverSettings.defaultImageScale,
                tileLayers: [{
                    observatory: 'SDO',
                    instrument : 'AIA',
                    detector   : 'AIA',
                    measurement: '304',
                    visible    : true,
                    opacity    : 100
                }],
                timeStep: 86400
            },
            version: serverSettings.version
        };
    }
});
