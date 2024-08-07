/**
 * @author Jeff Stys <jeff.stys@nasa.gov>
 * @author Keith Hughitt <keith.hughitt@nasa.gov>
 * @author Jonathan Harper
 * @author Kasim Necdet Percinel <kasim.n.percinel@nasa.gov>
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
     * @constructs
     * @description Class to manage event queries and data storage.<br><br>
     *
     * Creates a class which queries the HEK API for event data as the
     * application date and time step changes.  This data is stored in
     * the EventType, EventFeatureRecognitionMethod, and Event classes.
     * Queries are optimized to minimize first the number of queries and
     * second the time window/filesize.<br><br>
     *
     * @param {array} eventGlossary
     * @param {string} date , used in queries to fetch FRM data
     * @param {string} treeid, id of the checkbox tree for managing events tied to this manager. 
     * @param {JSON} apiSource, initial query params for api request to fetch the data, highly attached with event source, HEK or CCMC (will be RESSI in the future) 
     * @param {boolean} markersVisible, are we going to hide markers for this event layer initially, coming from the state 
     * @param {boolean} labelsVisible, are we going to hide labels of markers for this event layer initially, coming from the state 
     * @param {boolean} layerAvailableVisible, are we going to hide unavailable FRMs in checkbox tree branches 
     *
     */
    init: function (eventGlossary, date, treeid, apiSource, markersVisible, labelsVisible, layerAvailableVisible) {
        this._apiSource = apiSource;
        this._eventLayers    = [];
        this._events         = [];
        this._eventMarkers   = [];
        this._eventTypes     = {};
        this._treeContainer  = $('#'+treeid);
        this._jsTreeData     = [];
        this._date           = date;
        this._queEvents      = false;
        this._eventGlossary  = eventGlossary;
        this._eventContainer = $('<div id="'+treeid+'-event-container" class="event-container"></div>');
        this._uniqueId = treeid

        this.layerAvailableVisible = layerAvailableVisible;
        this.labelsVisible = labelsVisible;
        this.markersVisible = markersVisible;
        if (Helioviewer.outputType != 'embed') {
            this.updateRequestTime();
        }
        setTimeout($.proxy(this._queryEventFRMs, this), 100);

        // Set up javascript event handlers
        $(document).bind("fetch-eventFRMs", $.proxy(this._queryEventFRMs, this));
        $(document).bind('reinit-events-list',  $.proxy(this.trigger_reinit, this));
    },

    trigger_reinit: function (e, date) {
        this.reinit(date);
    },

    reinit: function(date) {

        this._eventContainer.remove();
        this._eventContainer.appendTo("#moving-container");

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
        return Helioviewer.userSettings.get("state.events_v2." + this._uniqueId + ".layers");
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

                let parentFRM  = self._eventTypes[event['pin']]._eventFRMs[event['name']];

                // giving the initial state the markers, if they are going to hide themselves or their labels, or both
                let eventMarker = new EventMarker(eventGlossary, parentFRM, event, i+1, self.labelsVisible, self.markersVisible);
                
                self._eventMarkers.push(eventMarker);
            }
        });
        this._toggleEvents();
    },

    /**
     * @description generate event instance id from event variables from backend
     * @param {string} evenType of eventInstance
     * @param {string} frmName of eventInstance
     * @param {string} eventID of eventInstance, this id is not css or jquery friendly , that is why we need base64 encode it to make it friendly
     * @returns {string} generate event instance id
     */
    _makeEventInstanceTreeNodeID: function(eventType, frmName, eventID) {

        let escapedFrmName = this._escapeInvalidCssChars(frmName);
        let encodedEventID = this._escapeInvalidCssChars(btoa(eventID));

        return `${eventType}--${escapedFrmName}--${encodedEventID}`;
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
            obj['attr']     = {
                'id' : event_type_arr[1],
                'hvtype': 'event_type',
            };
            obj['state']    = 'open';
            obj['children'] = [];

            self._jsTreeData.push(obj);

            type_count = 0;
            event_category.groups.forEach((group) => {
                let group_count = group.data.length;
                type_count += group_count;

                // Generate event instances nodes for jstree
                let group_children = group.data.map(d => {
                    // See Utility/HelperFunctions for fixUnicodeChars
                    let eventInstanceLabel = d.short_label ?? d.label;
                    return {
                        'data': fixUnicodeChars(eventInstanceLabel),
                        'attr': {
                            'id': self._makeEventInstanceTreeNodeID(event_type_arr[1], group.name, d.id),
                            'hvtype': 'event_instance',
                        },
                        'children':[]
                    }
                });

                count_str = '';
                if ( group_count > 0 ) {
                    count_str = " ("+group_count+")";
                    self._jsTreeData[index].children.push(
                        {
                            'data': group.name+count_str,
                            'attr': {
                                'id': event_type_arr[1]+'--'+ self._escapeInvalidCssChars(group.name),
                                'hvtype': 'frm'
                            },
                            'children': group_children,
                            'state' : 'closed',
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
            self._eventTree = new EventTree(this._uniqueId, this._jsTreeData, this._treeContainer, self, self.layerAvailableVisible);
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
        selector = selector.replace(/=/g, "_");
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

    /**
     * @description This function syncs our internal event state with the actual markers and event layers in the dom.
     * It first calculates which frms has be shown ( including half selected frms ) 
     * Then it iterates on all of the frms of all event_types to eliminate which dom elements needs to be hidden which need to be shown, /
     * then apply jqyery show and hide operations to apply current state to our DOM,
     * @return {void}
     */
    _toggleEvents: function () {
        var newState, checkedEventTypes = [], checkedFRMs = {}, self = this;

        // This a tree structure, where keys are frms not partially selected
        // values are the ids of event instances , selected under this frm inside jstree 
        var notFullySelectedFRMSAndChildrens = {};

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

            // Iterate on partially selected events under frm
            // we are going to build above state object: notFullySelectedFRMSAndChildrens
            $.each ( checkedTypeObj['event_instances'], function(j, eventInstance) {
                var eventInstanceNewName = eventInstance.replace(/\\/g,'');
                let parsedFrm = eventInstanceNewName.split("--")[1];

                // Frm for those event_instances, should be included into the visible frm list
                if(!checkedFRMs[checkedTypeObj['event_type']].includes(parsedFrm)) {
                    checkedFRMs[checkedTypeObj['event_type']].push(parsedFrm);
                }

                // If there is no event_type to host frms and their children, we create it
                if(!notFullySelectedFRMSAndChildrens.hasOwnProperty(checkedTypeObj['event_type'])) {
                    notFullySelectedFRMSAndChildrens[checkedTypeObj['event_type']] = {};
                }

                // If we haven't already seen frm , in our fake frm and childrens data, define it or add it
                if(!notFullySelectedFRMSAndChildrens[checkedTypeObj['event_type']].hasOwnProperty(parsedFrm)) {
                    notFullySelectedFRMSAndChildrens[checkedTypeObj['event_type']][parsedFrm] = [eventInstanceNewName];
                } else {
                    notFullySelectedFRMSAndChildrens[checkedTypeObj['event_type']][parsedFrm].push(eventInstanceNewName);
                }

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
                    let underScoredFrmName = frmName.replace(/ /g,'_');

                    if ( checkedFRMs[eventTypeName][0] == 'all' || $.inArray(underScoredFrmName, checkedFRMs[eventTypeName]) != -1 ) {

                        self._eventTypes[eventTypeName]._eventFRMs[frmName].domNode.show();
    
                        // For each event markers of frm, we are making them visible if they are not hidden per user preferences via state
                        if(self.markersVisible) {
                            self._eventMarkers.filter(em => {
                                return em.belongsToFrm(frmName) && em.belongsToEventType(eventTypeName)
                            }).forEach(m => m.setVisibility(true));
                        }

                        // if this frm is not fully selected
                        // we are going to hide its children which are not in our checked event_instances
                        // event_instances are the deepest level in the jstree, they are the individual markers 
                        if(notFullySelectedFRMSAndChildrens.hasOwnProperty(eventTypeName) && notFullySelectedFRMSAndChildrens[eventTypeName].hasOwnProperty(underScoredFrmName)) {

                            let eventsToBeShownForFRM = notFullySelectedFRMSAndChildrens[eventTypeName][underScoredFrmName];

                            let concerningEventMarkers = self._eventMarkers.forEach(em => {

                                // generate jsTreeCheckBoxID from this marker
                                // TODO _makeEventInstanceTreeNodeID can be moved to EventMarker
                                let jsTreeCheckboxID = self._makeEventInstanceTreeNodeID(eventTypeName, underScoredFrmName, em.id);

                                // Clean of backslashes when we read back the ID
                                // We only add backslashes to make them HTML id
                                jsTreeCheckboxID = jsTreeCheckboxID.replace(/\\/g,'');

                                // if our id for this marker not in selected list
                                let notClickedChildOfFRM = !eventsToBeShownForFRM.includes(jsTreeCheckboxID);
                                let childToHide = em.belongsToEventType(eventTypeName) && em.belongsToFrm(frmName) && notClickedChildOfFRM;

                                // please hide it
                                if(childToHide) {
                                    em.setVisibility(false);
                                }

                            })
                        }
                    } else {
                        // eventTypeName/frmName pair is NOT checked
                        // so .hide() this FRM's event layer
                        self._eventTypes[eventTypeName]._eventFRMs[frmName].domNode.hide();
                    }
                }
            });
        });
    },

    /**
     * @description emphasize markers matching the given jsTreeNodeID, this function parses jsTreeNodeID, decides it is frm or eventtype or eventinstance , then emphasize matching markers.
     * @param {string} jsTreeNodeID. nodeIds generated when building the tree
     * @returns void
     */
    emphasizeMarkers: function (jsTreeNodeID) {


        self = this;
        return (event) => {
            jsTreeNodeID = jsTreeNodeID.replace(/\\/g,'');
            let parts = jsTreeNodeID.split('--');

            let markersToEmphasize = [];

            // this is an event instance
            if(parts.length == 3) { 
                markersToEmphasize = this._eventMarkers.filter(em => {
                    return jsTreeNodeID == self._makeEventInstanceTreeNodeID(em.pin, em.name, em.id).replace(/\\/g,'');
                });
            }

            // this is an frm
            if(parts.length == 2) { 
                markersToEmphasize = this._eventMarkers.filter(em => {
                    return em.belongsToFrm(parts[1]) && em.belongsToEventType(parts[0]);
                });
            }

            // this is an event type
            if(parts.length == 1) { 
                markersToEmphasize = this._eventMarkers.filter(em => {
                    return em.belongsToEventType(parts[0])
                });
            }

            markersToEmphasize.forEach(m => {
                m.emphasize();
            });
        }
    },

    /**
     * @description deEmphasize markers matching the given jsTreeNodeID, this function parses jsTreeNodeID, decides it is frm or eventtype or eventinstance , then deEmphasize matching markers.
     * @param {string} jsTreeNodeID. nodeIds generated when building the tree
     * @returns void
     */
    deEmphasizeMarkers: function (jsTreeNodeID) {
        return (event) => {
            jsTreeNodeID = jsTreeNodeID.replace(/\\/g,'');
            let parts = jsTreeNodeID.split('--');
            let markersToDeEmphasize = [];

            // this is an event instance
            if(parts.length == 3) { 
                markersToDeEmphasize = this._eventMarkers.filter(em => {
                    return jsTreeNodeID == self._makeEventInstanceTreeNodeID(em.pin, em.name, em.id).replace(/\\/g,'');
                });
            }

            // this is an frm
            if(parts.length == 2) { 
                markersToDeEmphasize = this._eventMarkers.filter(em => {
                    return em.belongsToFrm(parts[1]) && em.belongsToEventType(parts[0]);
                });
            }

            // this is an event type
            if(parts.length == 1) { 
                markersToDeEmphasize = this._eventMarkers.filter(em => {
                    return em.belongsToEventType(parts[0])
                });
            }

            markersToDeEmphasize.forEach(m => {
                m.deEmphasize();
            });
        }
    },

    /**
     * @description validates if this event manager is maintaining a particular , event source like CCMC and HEK
     * @param {string} name . event source name like CCMC, HEK
     * @returns {boolean}
     */
    filterID: function (name) {
        return this._uniqueId === `tree_${name}`;
    },

    /**
     * @description sets the label visibility of all markers of this event manager.
     * @param {boolean} labelsVisible, visibility of labels 
     * @returns void
     */
    toggleLabels(labelsVisible) {
        // it is not a bad thing to preserve state
        this.labelsVisible = labelsVisible;
        // populate all the markers, about the visibility change
        this._eventMarkers.forEach(m => m.setLabelVisibility(labelsVisible));
    },

    /**
     * @description sets the visibility of all markers of this event manager.
     * @param {boolean} markersVisible, visibility of markers 
     * @returns void
     */
    toggleMarkers(markersVisible) {
        // it is not a bad thing to preserve state
        this.markersVisible = markersVisible;

        // populate all the markers, about the visibility change
        this._eventMarkers.forEach(m => m.setVisibility(markersVisible));

        // apply events to the viewport
        this._toggleEvents();
    },

    /**
     * @description sets the visibility of frms that do not have any events
     * @param {boolean} layerAvailableVisible, visibility of empty frm soruces in event tree branch
     * @returns void
     */
    toggleNonAvailableLayers(layerAvailableVisible) {

        // it is not a bad thing to preserve state
        this.layerAvailableVisible = layerAvailableVisible;

        // toggle event empty nodes
        this._eventTree.toggleEmptyBranches(this.layerAvailableVisible);

    }
});
