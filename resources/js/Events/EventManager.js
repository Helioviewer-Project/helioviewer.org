/**
 * @author Jeff Stys <jeff.stys@nasa.gov>
 * @author Keith Hughitt <keith.hughitt@nasa.gov>
 * @author Jonathan Harper
 * @fileOverview Handles event queries, data formatting, and storage
 *
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global $, window, LayerManager, EventType, EventFeatureRecognitionMethod, Event,
  EventTimeline, EventTree, getUTCTimestamp */

"use strict";

var EventManager = Class.extend({
    /**
     * Class to manage event queries and data storage.<br><br>
     *
     * Creates a class which queries the HEK API for event data as the
     * application date and time step changes.  This data is stored in
     * the EventType, EventFeatureRecognitionMethod, and Event classes.
     * Queries are optimized to minimize first the number of queries and
     * second the time window/filesize.<br><br>
     *
     * @constructs
     */
    init: function (eventGlossary, date, treeid, apiSource) {
        var visState, scale;

        this._apiSource = apiSource;
        this._eventLayers    = [];
        this._events         = [];
        this._eventMarkers   = [];
        this._eventTypes     = {};
        this._treeContainer  = $('#'+treeid);
        this._jsTreeData     = [];
        this._date           = date;
        this._queEvents      = false;
        this._eventLabelsVis = Helioviewer.userSettings.get("state.eventLabels");
        this._eventGlossary  = eventGlossary;
        this._eventContainer = $('<div id="'+treeid+'-event-container" class="event-container"></div>');
        this._uniqueId = treeid

        scale = new ImageScale();

        this.updateRequestTime();
		setTimeout($.proxy(this._queryEventFRMs, this), 100);

        // Set up javascript event handlers
        $(document).bind("fetch-eventFRMs", $.proxy(this._queryEventFRMs, this));
        $(document).bind('toggle-event-labels',  $.proxy(this.toggleEventLabels, this));
        $(document).bind('reinit-events-list',  $.proxy(this.trigger_reinit, this));
    },

    trigger_reinit: function (e, date) {
        this.reinit(date);
    },

    reinit: function(date) {
        var visState;

        this._eventContainer.remove();
        this._eventContainer.appendTo("#moving-container");

        visState = Helioviewer.userSettings.get("state.eventLayerVisible");
        if ( typeof visState == 'undefined') {
            Helioviewer.userSettings.set("state.eventLayerVisible", true);
            visState = true;
        }

        if ( visState === false && this._eventContainer.css('display') != 'none' ) {
            $('span[id^="visibilityBtn-event-layer-"]').click();
        }
        else if ( visState === true && this._eventContainer.css('display') == 'none' ) {
            $('span[id^="visibilityBtn-event-layer-"]').click();
        }


        this._eventLayers   = [];
        this._events        = [];
        this._eventMarkers  = [];
        this._eventTypes    = {};
        this._date          = date;
        this._eventContainer.empty();
        this._resetEventTree();

        this._queryEventFRMs();
    },

    _getCheckedEvents: function () {
        return Helioviewer.userSettings.get("state.events." + this._uniqueId + ".layers");
    },

    /**
     * Queries data to build the EventType and EventFeatureRecognitionMethod
     * classes.
     *
     */
    _queryDefaultEventTypes: function () {
        var params = {
            "action"     : "getDefaultEventTypes"
        };
        this._queEvents = false;
        $.get(Helioviewer.api, params, $.proxy(this._parseEventFRMs, this), "json");
    },

    /**
     * Queries data to build the EventType and EventFeatureRecognitionMethod
     * classes.
     *
     */
    _queryEventFRMs: function () {
        if (this._events.length == 0 ) {
            var params = {
                "startTime"  : new Date(this._date.getTime()).toISOString()
            };
            params = Object.assign(params, this._apiSource);
            this._queEvents = true;
            $.get(Helioviewer.api, params, $.proxy(this._parseEventFRMs, this), "json");
        }
    },

    /**
     * Handles data returned from _queryEventFRMs, parsing the HEK search and
     * creating the EventTypes and EventFeatureRecognitionMethods from the JSON
     * data and then calling generateTreeData to build the jsTree.
     */
    _parseEventFRMs: function (result) {
        var self = this, domNode, eventAbbr;

        this._eventContainer.empty();

        self._eventTypes = {};
        result.forEach((event_group) => {
            let eventAbbr = event_group.pin;

            // Create and store an EventType
            self._eventTypes[eventAbbr] = new EventType(eventAbbr);

            // Process event FRMs
            event_group.groups.forEach((group) => {
                self._eventTypes[eventAbbr]._eventFRMs[group.name]
                    = new EventFeatureRecognitionMethod(group.name, self.eventGlossary);

                domNode = '<div class="event-layer" id="'
                        + eventAbbr + '__' + group.name.replace(/ /g,'_')
                        + '" style="position: absolute;">';

                self._eventTypes[eventAbbr]._eventFRMs[group.name].setDomNode(
                    $(domNode).appendTo('#' + self._eventContainer.attr('id')) );
            });
        });

        this._generateTreeData(result);
        this._parseEvents(result);
    },

    /**
     * Queries event data from API
     *
     */
    _queryEvents: function () {
        var params;

        params = {
            "action"     : "getEvents",
            "startTime"  : new Date(this._date.getTime()).toISOString(),
            "eventType"  : '**'
        };
        $.get(Helioviewer.api, params, $.proxy(this._parseEvents, this), "json");
    },

    /**
     * Save data returned from _queryEvents
     */
    _parseEvents: function (result) {
        var self=this, eventGlossary;

        eventGlossary = this._eventGlossary;

        $.each( this._eventMarkers, function(i, eventMarker) {
            eventMarker.remove();
        });
        this._eventMarkers = [];
        // combine all events into one giant event list
        let all_events = [];
        result.forEach((event_category) => {
            event_category.groups.forEach((group) => {
                group.data.forEach((item) => {
                    item['pin'] = event_category['pin'];
                    item['name'] = group['name'];
                    item['category'] = event_category['name'];
                })
                all_events = all_events.concat(group.data);
            });
        });
        this._events = all_events;

        $.each( this._events, function(i, event) {
            if ( typeof self._eventTypes[event['pin']] != 'undefined' ) {
                self._eventMarkers.push(
                    new EventMarker(eventGlossary,
                        self._eventTypes[event['pin']]._eventFRMs[event['name']],
                        event, i+1)
                );
            }
        });
        this._toggleEvents();
    },

    /**
     * Generates jsTree structure from HEK search data and then constructs
     * a new tree if one does not exist, or reloads the existing one if
     * it does.
     *
     */
    _generateTreeData: function (data) {

        var self = this, obj, index=0, event_type_arr, type_count=0, count_str;

        // Re-initialize _jsTreeData in case it contains old values
        self._jsTreeData = [];

        data.forEach((event_category) => {
        // $.each(data, function (event_type, event_type_obj) {
            // Split event_type into a text label and an abbreviation
            event_type_arr = [event_category.name, event_category.pin];

            // Remove trailing space from "concept" property, if necessary
            if (event_type_arr[0].charAt(event_type_arr[0].length-1) == " ") {
                event_type_arr[0] = event_type_arr[0].slice(0,-1);
            }

            obj = Object();
            obj['data']     = event_type_arr[0];
            obj['attr']     = { 'id' : event_type_arr[1] };
            obj['state']    = 'open';
            obj['children'] = [];

            self._jsTreeData.push(obj);

            type_count = 0;
            event_category.groups.forEach((group) => {
                let group_count = group.data.length;
                type_count += group_count;

                count_str = '';
                if ( group_count > 0 ) {
                    count_str = " ("+group_count+")";
                    self._jsTreeData[index].children.push(
                        {
                            'data': group.name+count_str,
                            'attr':
                                {
                                    'id': event_type_arr[1]
                                        + '--'
                                        + self._escapeInvalidCssChars(group.name)
                                }
                        }
                    );
                }
            });

            count_str = '';
            if ( type_count > 0 ) {
                count_str = " ("+type_count+")";
            }
            obj['data'] = obj['data']+count_str;

            index++;
        });


        // Create a new EventTree object only if one hasn't already been created
        if (!self._eventTree) {
            self._eventTree = new EventTree(this._uniqueId, this._jsTreeData, this._treeContainer, self);
        }

        self._eventTree.reload(this._jsTreeData);
        self._jsTreeData = this._jsTreeData;
    },

    _resetEventTree: function () {
        if (this._eventTree) {
            // Reset each item in the list to an empty list.
            // This preserves the overall skeleton structure without completely removing it.
            this._jsTreeData.forEach(element => {
                let label = element['data'];
                // replace the trailing number in parentheses with nothing
                label = label.replace(/\s\(\d+\)$/, "");
                element['data'] = label;
                element['children'] = [];
            });
            this._eventTree.reload(this._jsTreeData);
        }
    },

    _escapeInvalidCssChars: function (selector) {
        selector = selector.replace(/ /g, "_");
        selector = selector.replace(/([\+\.\(\)])/g, '\\$1');

        return selector;
    },

    /**
     * Queries for new tree structure data and events.
     *
     */
    updateRequestTime: function () {
        this.reinit(new Date($("#date").val().replace(/\//g,"-") +"T"+ $("#time").val()+"Z"));
    },


    /**
     * @description Add a new event layer
     */
    addEventLayer: function (eventLayer) {
        this._eventLayers.push(eventLayer);
    },

    /**
     * @description Gets the number of event layers currently loaded
     * @return {Integer} Number of event layers present.
     */
    size: function () {
        return this._eventLayers.length;
    },

    /**
     * Returns the index of the given layer if it exists, and -1 otherwise
     */
    indexOf: function (id) {
        var index = -1;

        $.each(this._eventLayers, function (i, item) {
            if (item.id === id) {
                index = i;
            }
        });

        return index;
    },

    /**
     * @description Iterates through event layers
     */
    each: function (fn) {
        $.each(this._eventLayers, fn);
    },

    /**
     * @description Returns a JSON representation of the event layers currently being displayed
     */
    toJSON: function () {
        var eventLayers = [];

        $.each(this._eventLayers, function () {
            eventLayers.push(this.toJSON());
        });

        return eventLayers;
    },

    _toggleEvents: function () {
        var newState, checkedEventTypes = [], checkedFRMs = {}, self = this;

        newState = this._getCheckedEvents();

        // Populate checkedEventTypes and checkedFRMs to make it easier to
        // compare the state of the checkbox hierarchy with the all stored
        // event type / frm DOM nodes.
        $.each( newState, function(i, checkedTypeObj) {
            checkedEventTypes.push(checkedTypeObj['event_type']);

            checkedFRMs[checkedTypeObj['event_type']] = [];
            $.each ( checkedTypeObj['frms'], function(j, frmName) {
	            var frmNameChanged = frmName.replace(/\\/g,'');
                checkedFRMs[checkedTypeObj['event_type']].push(frmNameChanged);
            });
        });

        $.each( this._eventTypes, function(eventTypeName, eventTypeObj) {
            $.each( eventTypeObj._eventFRMs, function(frmName, frmObj) {

                // eventTypeName not found in newState, so this FRMs can't be checked
                // so .hide() this FRM's event layer
                if ( $.inArray(eventTypeName, checkedEventTypes) == -1 ) {
                    self._eventTypes[eventTypeName]._eventFRMs[frmName].domNode.hide();
                }
                else {
                    // eventTypeName/frmName pair is checked
                    // so .show() this FRM's event layer
                    if ( checkedFRMs[eventTypeName][0] == 'all' ||
                          $.inArray(frmName.replace(/ /g,'_'), checkedFRMs[eventTypeName]) != -1 ) {

                        self._eventTypes[eventTypeName]._eventFRMs[frmName].domNode.show();
                    }
                    // eventTypeName/frmName pair is NOT checked
                    // so .hide() this FRM's event layer
                    else {
                        self._eventTypes[eventTypeName]._eventFRMs[frmName].domNode.hide();
                    }
                }
            });
        });

        this.eventLabels();
    },

    toggleEventLabels: function (event, labelsBtn) {

        if (typeof labelsBtn == 'undefined') {
            labelsBtn = $('span[id^="labelsBtn-event-layer-"]');
        }

        if ( this._eventLabelsVis ) {
            $(document).trigger('toggle-event-label-off');
            labelsBtn.addClass('hidden');
        }
        else {
            $(document).trigger('toggle-event-label-on');
            labelsBtn.removeClass('hidden');
        }

        this._eventLabelsVis = !this._eventLabelsVis;
        return true;
    },

    eventLabels: function (event) {
        this._eventLabelsVis = Helioviewer.userSettings.get("state.eventLabels");

        if ( this._eventLabelsVis ) {
            $(document).trigger('toggle-event-label-on');
        }
        else {
            $(document).trigger('toggle-event-label-off');
        }

        return true;
    }

});
