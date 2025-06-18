/**
 * @fileOverview Contains the class definition for a SettingsLoader class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 * @author Kasim Necdet Percinel <kasim.n.percinel@nasa.gov>
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
    loadSettings: async function (urlSettings, serverSettings) {

        let defaults    = this._getDefaultSettings(serverSettings);

        let constraints = {
            "minImageScale" : serverSettings.minImageScale,
            "maxImageScale" : serverSettings.maxImageScale,
            "minMovieLength": 300,
            "maxMovieLength": 16934400
        };

        let userSettings = new UserSettings(defaults, urlSettings, constraints);

        // If State is seeded from api, with an shared url
        // we load with making
        if (urlSettings.loadState) {
            var settings = await this._fetchStateFromApiAndApply(urlSettings.loadState, userSettings);
        } else {
            var settings = userSettings;
        }

        return this._migrate(settings);
    },

    /**
     * Performs steps to migrate from old states to newer states as-needed.
     */
    _migrate: function (userSettings) {
        // GOES-R was renamed to GOES. Any setting with GOES-R must be
        // renamed to GOES.
        return this._patch_goes_r(userSettings);
    },

    _patch_goes_r: function(userSettings) {
        for (const layer of userSettings.settings.state.tileLayers) {
            if (layer["Observatory"] === "GOES-R") {
                layer["Observatory"] = "GOES";
                layer["uiLabels"][0]["name"] = "GOES";
            }
        };
        return userSettings;
    },


    /**
     * Load the existing state from our api , and apply it to user settings
     *
     * @param {string} stateId, sha256 hash of front end state id, primary key in api's client_states table
     * @param {UserSettings} userSettings, is the loaded userSettings , we will update it if we can read from backend
     * @return {Promise} this will resolve or reject the modified userSettings
     */
    _fetchStateFromApiAndApply: function(stateId, userSettings) {

        return $.ajax({

            type: "GET",
            url: Helioviewer.api,
            dataType: 'json',
            data: {
                "action": "getWebClientState",
                "state_id": stateId
            },

        }).then(function(clientState) {

            userSettings.set("state.imageScale", parseFloat(clientState.data.imageScale));
            userSettings.set("state.centerX", parseFloat(clientState.data.centerX));
            userSettings.set("state.centerY", parseFloat(clientState.data.centerY));
            userSettings.set("state.tileLayers", clientState.data.imageLayers);
            userSettings.set("state.events_v2", clientState.data.eventLayers);
            userSettings.set("state.celestialBodiesChecked", clientState.data.celestialBodies);
            userSettings.set("state.date", parseInt(clientState.data.date));
            userSettings.set("state.enable3d", clientState.data.hasOwnProperty("enable3d") ? clientState.data.enable3d : false);

            return Promise.resolve(userSettings);


        }, (error) => {
            return Promise.reject(userSettings);
        });

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
                "events_v2": {
                    "tree_HEK": {
                        "id": "HEK",
                        "visible": true,
                        "markers_visible":true,
                        "labels_visible":true,
                        "layer_available_visible":true,
                        "layers": [],
                        "layers_v2": [],
                    },
                    "tree_CCMC": {
                        "id": "CCMC",
                        "visible": true,
                        "markers_visible":true,
                        "labels_visible":true,
                        "layer_available_visible":true,
                        "layers": [],
                        "layers_v2": [],
                    },
                    "tree_RHESSI": {
                        "id": "RHESSI",
                        "visible": true,
                        "markers_visible":true,
                        "labels_visible":true,
                        "layer_available_visible":true,
                        "layers": [],
                        "layers_v2": [],
                    },
                },
                "eventLabels": true,
                "imageScale" : serverSettings.defaultImageScale,
                "refScale"   : serverSettings.refImageScale,
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
                    "baseDiffTime" : dateDiff.toUTCDateString()+' '+dateDiff.toUTCTimeString(),
                    "uiLabels"   : [ {'label':'Observatory',
                                    'name' :'SDO'},
                                   {'label':'Instrument',
                                    'name' :'AIA'},
                                   {'label':'Measurement',
                                    'name' :'304'} ]
                }],
                "userTileLayers": [],
                "dropdownLayerSelectID": 0,
                "timeStep"   : 86400,
                "celestialBodiesChecked" : {},
                "celestialBodiesAccordionOpen" : {},
                "celestialBodiesAvailableVisible" : {},
                "celestialBodiesLabelsVisible" : {},
                "celestialBodiesTrajectoriesVisible" : {},
                "enable3d": false
            },
            zoom: {
                type: 'continuous',
                focus: 'cursor'
            },
            version: serverSettings.version
        };
    }
});
