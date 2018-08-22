/**
 * @fileOverview Contains the class definition for a SettingsLoader class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
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
		var dateDiff = new Date(+new Date() - 60*60*1000);
		
        return {
            // Default settings
            options: {
                date: "latest", // "previous" | "latest"
                movies: {
                    cadence: "auto", // "auto" | number of seconds
                    duration: 86400,
                    dialog: 'default',
                    format: "mp4"
                },
                autorefresh: false,
                movieautoplay: false,
                showinviewport: false
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
                "centerX"    : 0,
                "centerY"    : 0,
                "date"       : date.getTime(),
                "drawers": {
                    "#hv-drawer-left": {
                        "open": false,
                        "accordions": {
                            "#accordion-date": {
                                "open": true
                            },
                            "#accordion-images": {
                                "open": true
                            },
                            "#accordion-events": {
                                "open": true
                            },
                            "#accordion-bodies": {
                                "open": true
                            }
                        }
                    },
                    "#hv-drawer-news": {
                        "open": false,
                        "accordions": {
                            "#accordion-news": {
                                "open": true
                            }
                        }
                    },
                    "#hv-drawer-youtube": {
                        "open": false,
                        "accordions": {
                            "#accordion-youtube": {
                                "open": true
                            },
                            "#accordion-youtube-current": {
                                "open": false
                            }
                        }
                    },
                    "#hv-drawer-movies": {
                        "open": false,
                        "accordions": {
                            "#accordion-movies": {
                                "open": true
                            }
                        }
                    },
                    "#hv-drawer-screenshots": {
                        "open": false,
                        "accordions": {
                            "#accordion-screenshots": {
                                "open": true
                            }
                        }
                    },
                    "#hv-drawer-data": {
                        "open": false,
                        "accordions": {
                            "#accordion-vso": {
                                "open": true
                            },
                            "#accordion-sdo": {
                                "open": true
                            }
                        }
                    },
                    "#hv-drawer-share": {
                        "open": false,
                        "accordions": {
                            "#accordion-link": {
                                "open": true
                            },
                            "#accordion-social": {
                                "open": true
                            }
                        }
                    },
                    "#hv-drawer-help": {
                        "open": false,
                        "accordions": {
                            "#accordion-help-links": {
                                "open": true
                            }
                        }
                    },
                    "#hv-drawer-timeline": {
                        "open": false
                    },
                    "#hv-drawer-timeline-events": {
                        "open": false
                    }
                },
                "eventLayers": [],
                "eventLabels": true,
                "imageScale" : serverSettings.defaultImageScale,
                "scale"      : true,
                "scaleType"  :'earth',
                "scaleX"     : 0,
                "scaleY"     : 0,
                "tileLayers" : [{
                    "visible"    : true,
                    "opacity"    : 100,
                    "difference" : 0,//0 - normal, 1 - running difference, 2 - base difference
                    "diffCount"  : 60,
                    "diffTime"   : 1,// 0-seconds, 1-minutes, 2-hours, 3-days, 4-weeks, 5-month, 6-years
                    "baseDiffTime" : dateDiff.toDateString()+' '+dateDiff.toTimeString(),
                    "uiLabels"   : [ {'label':'Observatory',
                                    'name' :'SDO'},
                                   {'label':'Instrument',
                                    'name' :'AIA'},
                                   {'label':'Measurement',
                                    'name' :'304'} ]
                }],
                "userTileLayers": [],
                "dropdownLayerSelectID": 0,
                "timeStep"   : 86400
            },
            version: serverSettings.version
        };
    }
});
