/**
 * @fileOverview Contains the class definition for an UserSettings class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author Kasim Necdet Percinel <kasim.n.percinel@nasa.gov>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, InputValidator, CookieJar, $, localStorage, parseLayerString, getUTCTimestamp */
"use strict";
var UserSettings = Class.extend(
    /** @lends UserSettings.prototype */
    {
    /**
     * Class to manage user preferences.<br><br>
     *
     * Creates a class which handles the storing the retrieving of custom user settings. This includes things
     * like the requested observation time, image zoom level, and the layers currently loaded. The UserSettings
     * class has the ability to use both HTML5 local storage and cookies for saving information.
     *
     * TODO 2010/04/09: Generalize the validation step by passing in an array of validation criteria instead
     * of passing in parameters individually.
     *
     * @constructs
     *
     * @see <a href="https://developer.mozilla.org/en/DOM/Storage">https://developer.mozilla.org/en/DOM/Storage</a>
     */
    init: function (defaults, urlSettings, constraints) {
        this._defaults    = defaults;
        this._constraints = constraints;

        // Input validator
        this._validator = new InputValidator();

        // Initialize storage
        this._initStorage();

        // Process URL parameters
        this._processURLSettings(urlSettings);
    },

    /**
     * Check if the localstorage is supported by browser
     *
     * @returns {bool} true supported, false not
     */
    checkLocalStorageSupport: function() {
        try {
            return ('localStorage' in window) && window['localStorage'] !== null;
        } catch (e) {
            return false;
        }
    }, 

    /**
     * Gets a specified setting
     *
     * @param {String} key The setting to retrieve
     *
     * @returns {Object} The value of the desired setting
     */
    get: function (key) {
        // Nesting depth is limited to three levels
        try {
            let tentative_value = this._get(key);
            if (tentative_value == null) {
                throw "Use default key";
            }
            return tentative_value;
        } catch (ex) {
            // If an error is encountered, then settings are likely outdated;
            // use the default value
            var value = this._getDefault(key);
            this.set(key, value)
            return value;
        }
    },

    /**
     * Gets a specified setting
     *
       @param {String} key The setting to retrieve
     *
     * @returns {Object} The value of the desired setting
     */
    _get: function (key) {
        var lookup = key.split(".");

        if (lookup.length === 1) {
            return this.settings[key];
        }
        else if (lookup.length === 2) {
            return this.settings[lookup[0]][lookup[1]];
        }
        else if (lookup.length === 3) {
            return this.settings[lookup[0]][lookup[1]][lookup[2]];
        }
        else if (lookup.length === 4) {
            return this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]];
        }
        else if (lookup.length === 5) {
            return this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]];
        }
        else if (lookup.length === 6) {
            return this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]][lookup[5]];
        }

        return this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]][lookup[5]][lookup[6]];
    },

    /**
     * Returns the default value associated with the specified key
     */
    _getDefault: function (key) {
        var lookup = key.split(".");

        if (lookup.length === 1) {
            return this._defaults[key];
        }
        else if (lookup.length === 2) {
            return this._defaults[lookup[0]][lookup[1]];
        }
        else if (lookup.length === 3) {
            return this._defaults[lookup[0]][lookup[1]][lookup[2]];
        }
        else if (lookup.length === 4) {
            return this._defaults[lookup[0]][lookup[1]][lookup[2]][lookup[3]];
        }
        else if (lookup.length === 5) {
            return this._defaults[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]];
        }
        else if (lookup.length === 6) {
            return this._defaults[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]][lookup[5]];
        }

        return this._defaults[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]][lookup[5]][lookup[6]];
    },

    /**
     * Saves a specified setting
     *
     * @param {String} key   The setting to update
     * @param {Object} value The new value for the setting
     */
    set: function (key, value) {
        try {
            this._validate(key, value);
        } catch (e) {
            return;
        }

        // Update settings
        var lookup = key.split(".");

        if (lookup.length === 1) {
            this.settings[key] = value;
        }
        else if (lookup.length === 2) {
            if(typeof this.settings[lookup[0]] == 'undefined'){ this.settings[lookup[0]] = {}; }
            if(typeof this.settings[lookup[0]][lookup[1]] == 'undefined'){ this.settings[lookup[0]][lookup[1]] = ''; }
            this.settings[lookup[0]][lookup[1]] = value;
        }
        else if (lookup.length === 3) {
            if(typeof this.settings[lookup[0]] == 'undefined'){ this.settings[lookup[0]] = {}; }
            if(typeof this.settings[lookup[0]][lookup[1]] == 'undefined'){ this.settings[lookup[0]][lookup[1]] = {}; }
            if(typeof this.settings[lookup[0]][lookup[1]][lookup[2]] == 'undefined'){ this.settings[lookup[0]][lookup[1]][lookup[2]] = ''; }

            this.settings[lookup[0]][lookup[1]][lookup[2]] = value;
        }
        else if (lookup.length === 4) {
            if(typeof this.settings[lookup[0]] == 'undefined'){ this.settings[lookup[0]] = {}; }
            if(typeof this.settings[lookup[0]][lookup[1]] == 'undefined'){ this.settings[lookup[0]][lookup[1]] = {}; }
            if(typeof this.settings[lookup[0]][lookup[1]][lookup[2]] == 'undefined'){ this.settings[lookup[0]][lookup[1]][lookup[2]] = {}; }
            if(typeof this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]] == 'undefined'){ this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]] = ''; }

            this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]] = value;
        }
        else if (lookup.length === 5) {
            if(typeof this.settings[lookup[0]] == 'undefined'){ this.settings[lookup[0]] = {}; }
            if(typeof this.settings[lookup[0]][lookup[1]] == 'undefined'){ this.settings[lookup[0]][lookup[1]] = {}; }
            if(typeof this.settings[lookup[0]][lookup[1]][lookup[2]] == 'undefined'){ this.settings[lookup[0]][lookup[1]][lookup[2]] = {}; }
            if(typeof this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]] == 'undefined'){ this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]] = {}; }
            if(typeof this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]] == 'undefined'){ this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]] = ''; }

            this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]] = value;
        }
        else if (lookup.length === 6) {
            if(typeof this.settings[lookup[0]] == 'undefined'){ this.settings[lookup[0]] = {}; }
            if(typeof this.settings[lookup[0]][lookup[1]] == 'undefined'){ this.settings[lookup[0]][lookup[1]] = {}; }
            if(typeof this.settings[lookup[0]][lookup[1]][lookup[2]] == 'undefined'){ this.settings[lookup[0]][lookup[1]][lookup[2]] = {}; }
            if(typeof this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]] == 'undefined'){ this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]] = {}; }
            if(typeof this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]] == 'undefined'){ this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]] = {}; }
            if(typeof this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]][lookup[5]] == 'undefined'){ this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]][lookup[5]] = ''; }

            this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]][lookup[5]] = value;
        }
        else {
            if(typeof this.settings[lookup[0]] == 'undefined'){ this.settings[lookup[0]] = {}; }
            if(typeof this.settings[lookup[0]][lookup[1]] == 'undefined'){ this.settings[lookup[0]][lookup[1]] = {}; }
            if(typeof this.settings[lookup[0]][lookup[1]][lookup[2]] == 'undefined'){ this.settings[lookup[0]][lookup[1]][lookup[2]] = {}; }
            if(typeof this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]] == 'undefined'){ this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]] = {}; }
            if(typeof this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]] == 'undefined'){ this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]] = {}; }
            if(typeof this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]][lookup[5]] == 'undefined'){ this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]][lookup[5]] = {}; }
			if(typeof this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]][lookup[5]][lookup[6]] == 'undefined'){ this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]][lookup[5]][lookup[6]] = ''; }

            this.settings[lookup[0]][lookup[1]][lookup[2]][lookup[3]][lookup[4]][lookup[5]][lookup[6]] = value;
        }

        this._save();
    },

    /**
     * Saves the user settings after changes have been made
     */
    _save: function () {
        // localStorage
        if (this.checkLocalStorageSupport()) {
            localStorage.setItem("settings", $.toJSON(this.settings));
        }
        // cookies
        else {
            this.cookies.set("settings", this.settings);
        }
    },

    /**
     * Removes all existing settings
     */
    _empty: function () {
        if (this.checkLocalStorageSupport()) {
            localStorage.removeItem("settings");
        } else {
            $.cookieJar("empty");
        }
    },

    /**
     * Checks to see if there are any existing stored user settings
     *
     * @returns {Boolean} Returns true if stored Helioviewer.org settings are detected
     */
    _exists: function () {
        return (this.checkLocalStorageSupport() ? (localStorage.getItem("settings") !== null)
                : (this.cookies.toString().length > 2));
    },

    /**
     * Decides on best storage format to use, and initializes it
     */
    _initStorage: function () {
        // Initialize CookieJar if localStorage isn't supported
        if (!this.checkLocalStorageSupport()) {
            this.cookies = $.cookieJar("settings");
        }

        // If no stored user settings exist, load defaults
        if (!this._exists()) {
            this._loadDefaults();
        }
        else {
            this._loadSavedSettings();
        }

        // If version is out of date, load defaults
        if (this.get('version') < this._defaults.version) {
            this._updateSettings(this.get('version'));
        }
    },

    /**
     * Attempts to update user settings to reflect recent changes
     */
    _updateSettings: function (version) {
        var statuses, self = this;

        // 2.2.1 and under - Load defaults
        if (version < 567) {
            this._loadDefaults();
        } else if (version < 700) {
            // 2.3.0 - Movie statuses changed to ints
            statuses = {
                "QUEUED": 0,
                "PROCESSING": 1,
                "FINISHED": 2,
                "ERROR": 3
            };

            // Convert string status to integer status
            $.each(this.settings.history.movies, function (i, movie) {
                self.settings.history.movies[i].status = statuses[movie.status];
            });

            // 2.3.0 - "defaults" section renamed "options"
            this.settings.options = this.settings.defaults;
            delete this.settings.defaults;

            // Updated version number and save
            this.set('version', this._defaults.version);
        }
    },

    /**
     * Loads defaults user settings
     */
    _loadDefaults: function () {
        this._empty();

        if (this.checkLocalStorageSupport()) {
            localStorage.setItem("settings", $.toJSON(this._defaults));
        }
        else {
            this.cookies.set("settings", this._defaults);
        }

        this.settings = this._defaults;
    },

    /**
     * Retrieves the saved user settings and saved them locally
     */
    _loadSavedSettings: function () {
        if (this.checkLocalStorageSupport()) {
            this.settings = $.evalJSON(localStorage.getItem("settings"));
        }
        // Otherwise, check type and return
        else {
            this.settings = this.cookies.get("settings");
        }
    },


    /**
     * Processes and validates any URL parameters that have been set
     *
     * Note that date is handled separately in TimeControls
     */
    _processURLSettings: function (urlSettings) {

        if (urlSettings.imageScale) {
            this.set("state.imageScale", parseFloat(urlSettings.imageScale));
        }

        if (urlSettings.centerX) {
            this.set("state.centerX", parseFloat(urlSettings.centerX));
        }

        if (urlSettings.centerY) {
            this.set("state.centerY", parseFloat(urlSettings.centerY));
        }

        if (typeof urlSettings.imageLayers != 'undefined' && urlSettings.imageLayers != '') {
            this.set("state.tileLayers", this._parseURLStringLayers(urlSettings.imageLayers));
        }

        if (typeof urlSettings.eventLayers != 'undefined' && urlSettings.eventLayers == 'None') {
            Object.keys(this.get("state.events_v2")).forEach((section) => {
                this.set("state.events_v2." + section + ".layers", [])
            });
        } else if (typeof urlSettings.eventLayers != 'undefined' && urlSettings.eventLayers != '') {
            Object.keys(this.get("state.events_v2")).forEach((section) => {
                this.set("state.events_v2." + section + ".layers", this._parseURLStringEvents(urlSettings.eventLayers));
            });
        }

        // If any historical shared url turns off event labels, we also respect that 
        if ( typeof urlSettings.eventLabels != 'undefined' && urlSettings.eventLabels == false) {
            // We also turning labels off for all layers
            Object.keys(this.get("state.events_v2")).forEach((section) => {
                this.set("state.events_v2." + section + ".labels_visible", false)
            });
        }

        if(typeof urlSettings.celestialBodiesChecked != 'undefined' && urlSettings.celestialBodiesChecked != ''){
            this.set("state.celestialBodiesChecked", JSON.parse(urlSettings.celestialBodiesChecked));
        }


    },

    /**
     * Processes a string containing one or more layers and converts them into
     * JavaScript objects
     */
    _parseURLStringLayers: function (urlLayers) {
        var layers = [], self = this;

        $.each(urlLayers, function (i, layerString) {
            layers.push(parseLayerString(layerString));
        });

        return layers;
    },

    /**
     * Processes an array of objects representing selected event types and FRMs
     * and convert it into a string for passing through URLs
     */
    parseLayersURLString: function (layerArray) {
        var layerString = '';

        if ( typeof layerArray == "undefined" ) {
            layerArray = this.get("state.tileLayers");
        }

        $.each(layerArray, function (i, layerObj) {
            layerString += "[";

            $.each(layerObj.uiLabels, function (i, labelObj) {
                layerString += labelObj.name + ",";
            });

            if(typeof layerObj.layeringOrder == 'undefined'){
	            layerString += "1,";
            }else{
	            layerString += parseInt(layerObj.layeringOrder) + ",";
            }
            layerString += parseInt(layerObj.opacity) + ",";

            if(typeof layerObj.difference != 'undefined'){
	            layerString += parseInt(layerObj.difference) + ",";
            }else{
	            layerString += "0,";
            }

            if(typeof layerObj.diffCount != 'undefined'){
	            layerString += parseInt(layerObj.diffCount) + ",";
            }else{
	            layerString += "0,";
            }

            if(typeof layerObj.diffTime != 'undefined'){
	            layerString += parseInt(layerObj.diffTime) + ",";
            }else{
	            layerString += "0,";
            }

            if(typeof layerObj.baseDiffTime != 'undefined'){
	            var layerDateStr = layerObj.baseDiffTime;
	            if(typeof layerDateStr == 'number' || layerDateStr == null){
					var baseDiffTime = $('#date').val()+' '+$('#time').val();
				}

	            layerString += layerDateStr.replace(' ', 'T').replace(/\//g, '-') + '.000Z';
            }else{
	            layerString += "";
            }

            layerString += "],";
        });
        return layerString.slice(0, -1);
    },

    /**
     * Processes a string containing one or more event types and FRMs and
     * converts them into JavaScript objects
     */
    _parseURLStringEvents: function (urlEventLayers) {
        var events = [], self = this;

        $.each(urlEventLayers, function (i, eventLayerString) {
            events.push(parseEventString(eventLayerString));
        });
        return events;
    },

    /**
     * Processes an array of objects representing selected event types and FRMs
     * and convert it into a string for passing through URLs
     */
    parseEventsURLString: function (eventLayerArray) {

        if ( typeof eventLayerArray == "undefined" ) {
            eventLayerArray = [];
            let events = this.get("state.events_v2");
            Object.keys(events).forEach((section) => {
                if (events[section].hasOwnProperty('layers')) {
                    eventLayerArray = eventLayerArray.concat(events[section].layers)
                }
            })
        }

        var eventLayerString = '';

        $.each(eventLayerArray, function (i, eventLayerObj) {
            eventLayerString += "[" + eventLayerObj.event_type     + ","
                                    + eventLayerObj.frms.join(';') + ","
                                    + eventLayerObj.open           + "],";
        });

        return eventLayerString.slice(0, -1);
    },

    /**
     * Validates a setting (Currently checks observation date and image scale)
     *
     * @param {String} setting The setting to be validated
     * @param {String} value   The value of the setting to check
     *
     * @returns {Boolean} Returns true if the setting is valid
     */
    _validate: function (setting, value) {
        var self = this;

        switch (setting) {
        case "state.date":
            this._validator.checkTimestamp(value);
            break;
        case "state.imageScale":
            this._validator.checkFloat(value, {
                "min": this._constraints.minImageScale,
                "max": this._constraints.maxImageScale
            });
            break;
        case "history.movies":
            $.each(value, function (i, movie) {
                self._validator.checkDateString(movie["dateRequested"]);
            });
            break;
        case "history.screenshots":
            $.each(value, function (i, screenshot) {
                self._validator.checkDateString(screenshot["dateRequested"]);
            });
            break;
        case "options.movies.duration":
            this._validator.checkInt(value, {
                "min": this._constraints.minMovieLength,
                "max": this._constraints.maxMovieLength
            });
            break;
        default:
            break;
        }
    },

    /*
     * @description This function is used to update/add state variables to this event_layer state, 
     * @param {string} id of the event layer
     * @param {string} key
     * @param {any} value
     * @return {JSON} event layer state conf
     */
    setHelioViewerEventLayerSettings: function (treeID, key, value) {
        let treeConf = this.getHelioViewerEventLayerSettings(treeID);
        treeConf[key] = value;
        this.set(treeID, treeConf);
        return treeConf;
    },

    /*
     * @description This function is used to get/read state variables to this event_layer state, 
     * @param {string} id of the event layer
     * @param {string} key
     * @return {any} 
     */
    getHelioViewerEventLayerSettingsValue: function (treeID, key) {
        let treeConf = this.getHelioViewerEventLayerSettings(treeID);
        return treeConf[key];
    },

    /*
     * @description This function is used to get/read all state variables to this event_layer state, 
     * it also keeps existing states aligned with the new states, it adds keys with default values if they are not in old state
     * @param {string} id of the event layer
     * @param {string} key
     * @return {JSON}   
     */
    getHelioViewerEventLayerSettings: function (treeID) {

        let treeKey = `state.events_v2.tree_${treeID}`;
        let treeConf = this.get(treeKey);

        let hasMarkersVisible = treeConf.hasOwnProperty("markers_visible");
        let hasLabelsVisible = treeConf.hasOwnProperty("labels_visible");
        let hasLayerAvailabilityVisible = treeConf.hasOwnProperty("layer_available_visible");
        let hasID = treeConf.hasOwnProperty("id");

        if(hasMarkersVisible && hasLabelsVisible && hasLayerAvailabilityVisible && hasID) {
            return treeConf;
        }

        // no new key markers_visible
        if(!hasMarkersVisible) {
            treeConf["markers_visible"] = true;
        }

        if(!hasLabelsVisible) {
            treeConf["labels_visible"] = true;
        }

        if(!hasLayerAvailabilityVisible) {
            treeConf["layer_available_visible"] = true;
        }

        if(!hasID) {
            treeConf["id"] = treeID;
        }

        this.set(treeKey, treeConf);
        return treeConf;
    },

    /*
     * @description Supplies iterator to traverse all event_layer configuration with given function
     * @param {func} it , iterator function, will be executed for each event layer
     * @return {void} 
     */
    iterateOnHelioViewerEventLayerSettings: function(it) {
        Object.values(Helioviewer.userSettings.get('state.events_v2')).forEach(it);
    }

});
