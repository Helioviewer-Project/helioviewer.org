/**
 * @author Jeff Stys <jeff.stys@nasa.gov>
 * @author Jonathan Harper
 * @author Kasim Necdet Percinel <kasim.n.percinel@nasa.gov>
 * @fileOverview TO BE ADDED
 *
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, window */

"use strict";

var EventTree = Class.extend({

    /**
     * @constructs
     * @description Creates an EventTree
     * @param {string} id, ID of the tree
     * @param {JSON} data, all the data to build tree 
     * @param {dom} container , dom piece to append event tree dom
     * @param {EventManager} eventManager, event manager this tree is managed by
     * @param {integer} zIndex, zIndex as you know , visibility hierarchy of this marker in html
     * @param {boolean} showEmptyBranches, decides if tree should hide empty frm branches
     */
    init: function (id, data, container, eventManager, showEmptyBranches) {
        this._id = id;
        this._container = container;
        this._EventManager = eventManager;
        this._activeEventLayersKey = "state.events_v2." + this._id + ".layers";
        this._selectedEventCache = new SelectedEventsCache();
        this._showEmptyBranches = showEmptyBranches; 

        this._build(data);
        $(document).bind("toggle-checkboxes-to-state", $.proxy(this.toggle_checkboxes_state, this));
    },

    destroy: function (data) {
        this._container.empty();
    },

    reload: function (newData) {
        this.destroy();
        this._build(newData);
    },

    close_all: function () {
        this._container.jstree("close_all",null,true);
    },

    open_all: function () {
        this._container.jstree("open_all",null,true);
    },

    toggle_checkboxes_state: function (e, trigger_id, toState) {
        if (trigger_id == this._id) {
            // Unbind event handler that normally triggers when checkboxes are checked/unchecked
            // because we're about to do that a lot
            this._container.unbind("change_state.jstree", $.proxy(this._treeChangedState, this));

            if (toState == 'off') {
                this._container.jstree("uncheck_all",null,true);
            }
            else if (toState == 'on') {
                this._container.jstree("check_all",null,true);
            }

            $(document).trigger("fetch-eventFRMs");

            // Bind event handler that triggers whenever checkboxes are checked/unchecked
            this._container.bind("change_state.jstree", $.proxy(this._treeChangedState, this));
            this._treeChangedState();
        }
    },

    jstreeFunc: function (name, args) {
        this._container.jstree(name, args);
    },

    getSavedEventLayers: function () {
        return Helioviewer.userSettings.get(this._activeEventLayersKey);
    },

    setSavedEventLayers: function (checked) {
        Helioviewer.userSettings.set(this._activeEventLayersKey, checked);
    },

    _build: function (jsTreeData) {

        var self = this, saved, node;

        this._container.jstree({
            "json_data" : { "data": jsTreeData },
            "core" : { "data": jsTreeData },
            "themes"    : { "theme":"default", "dots":true, "icons":false },
            "plugins"   : [ "json_data", "themes", "ui", "checkbox" ],
        });

        // Bind an event handler to each row that will trigger on hover
        $.each(jsTreeData, function(index, event_type) {

            // This is most upper level, event_type (like C3) in tree , we are attaching hover functionality from event_manager, 
            // which will redirect it to concerning markers to emphisize themselves
            $('#'+event_type['attr'].id+' > a').hover(self._EventManager.emphasizeMarkers(event_type['attr'].id), self._EventManager.deEmphasizeMarkers(event_type['attr'].id));

            // Dim rows that don't have associated features/events
            if ( event_type.children.length == 0 ) {
                $('#'+event_type['attr'].id).css({'opacity':'0.5'});
                $('#'+event_type['attr'].id).addClass('empty-element');

                if(!self._showEmptyBranches) {
                    $('#'+event_type['attr'].id).hide();
                }
            }

            $.each(event_type['children'], function(j, frm) {

                let frmID = self._escapeInvalidJQueryChars(frm['attr'].id);
                $(`#${frmID} > a`).hover(self._EventManager.emphasizeMarkers(frmID), self._EventManager.deEmphasizeMarkers(frmID));

                $.each(frm['children'], function(j, frmChild) {
                    let frmChildrenID = self._escapeInvalidJQueryChars(frmChild['attr'].id);
                    $(`#${frmChildrenID} > a`).hover(self._EventManager.emphasizeMarkers(frmChildrenID), self._EventManager.deEmphasizeMarkers(frmChildrenID));
                });


            });
        });

        // Unbind event handler that normally triggers when checkboxes are checked/unchecked
        // because we're about to do that a lot
        this._container.unbind("change_state.jstree", $.proxy(this._treeChangedState, this));

        // Loop over saved eventLayer state, checking the appropriate checkboxes to match.
        let savedEventLayers = this.getSavedEventLayers();
        let cachedEventLayers = this._selectedEventCache.get();

        saved = savedEventLayers.concat(cachedEventLayers);

        saved.forEach(eventLayer => {
            if (eventLayer.frms[0] == 'all') {
                node = "#"+eventLayer.event_type;
                if ( $(node).length != 0 ) {
                    self.jstreeFunc("check_node", node);
                }
            }
            else {

                $.each(eventLayer.frms, function(j,frm) {
                    node = "#"+eventLayer.event_type+"--"+frm;
                    if ( $(node).length != 0 ) {
                        // If the node is there ,we don't need to remember it is checked 
                        // just remove it from the cached checked frms
                        self._selectedEventCache.removeFRM(eventLayer.event_type, frm);
                        self.jstreeFunc("check_node", node);
                    } else {
                        // It's possible that we had a specific event_type and FRM selected,
                        // then the observation time changes , we still have the event_type node but not FRM node
                        // The user had this specific FRM selected, so we should remember it for next time its available instead of defaulting to "all"
                        self._selectedEventCache.addFRM(eventLayer.event_type, frm);
                    }
                });

                // These are the event_instances, which are belongs to some frm, but not fully selected
                // We are here checking them in jstree and also we are opening their parent frm, to be able to show them selected
                eventLayer.event_instances.forEach(eI => {

                    let eventInstanceNodeID = "#"+eI;
                    let splitted = eI.split("--");
                    let parentFrmNode = "#"+splitted[0]+"--"+splitted[1];

                    if( $(eventInstanceNodeID).length != 0) {

                        // console.log(`${eventInstanceNodeID} is there removing from cache`);

                        // first get frm from id and parentFrmNode to open it
                        self.jstreeFunc("open_node", parentFrmNode);

                        // If the node is there ,we don't need to remember it is checked 
                        // just remove it from the cached checked frms
                        self._selectedEventCache.removeEventInstance(eventLayer.event_type, eI);

                        // Now check that node and open its parent frm node
                        self.jstreeFunc("check_node", eventInstanceNodeID);

                    } else {

                        // console.log(`${eventInstanceNodeID} is not there, adding to the cache`);

                        // It's possible that we had a specific event_type and Event Instance selected,
                        // then the observation time changes , we still have the event_type node but not Event Instance node
                        // The user had this specific Event Instance selected, so we should remember it for next time
                        self._selectedEventCache.addEventInstance(eventLayer.event_type, eI);
                    }
                });
            }
        });

        // Re-bind event handler that triggers whenever checkboxes are checked/unchecked
        this._container.bind("change_state.jstree", $.proxy(this._treeChangedState, this));
        this._treeChangedState();
    },

    _escapeInvalidJQueryChars: function (selector) {
        // Plus Sign '+', Period/Dot '.', Parentheses '(', ')'
        selector = selector.replace(/(\+)/g, '\\\\$1');
        selector = selector.replace(/(\.)/g, '\\\\$1');
        selector = selector.replace(/(\()/g, '\\\\$1');
        selector = selector.replace(/(\))/g, '\\\\$1');

        return selector;
    },

    /**
     * Returns the FRM portion of the given ID
     * @param {string} id HTML id of element that contains FRM information
     * @returns {string|null} The FRM portion or null if it doesn't exist in the ID.
     */
    _getFrmFromId: function (id) {
        let data = id.split("--");
        if (data.length > 1) {
            return data[1];
        } else {
            return null;
        }
    },

    /**
     * Returns the Event Type portion of the given ID
     * @param {string} id HTML id of element that contains Event information
     * @returns {string} The Event portion of the ID.
     */
    _getEventTypeFromId: function (id) {
        let data = id.split("--");
        return data[0];
    },

    _treeChangedState: function (event, data) {
        var checked = [], event_types = [], index;
        let EventTree = this;

        this._container.jstree("get_checked",null,false).each(
            function () {
                var eventLayer, event_type, frms, frmsChildrens;
                frms = [];
                frmsChildrens = [];
                // If there is no current data in this checked event dropdown, then default to all
                if (this.classList.contains("empty-element")) {
                    frms = ["all"];
                } else {

                    // Event type is checked
                    if ($(this).attr('hvtype') == "event_type") {
                        // add all frms below it
                        $(this).find(".jstree-checked").each(((idx, el) => {
                            // Grab the FRM on each checked subitem
                            if ($(el).attr('hvtype') == "frm") {
                                frms.push(EventTree._getFrmFromId(el.id));
                            }
                        }))
                    }

                    // If this is a frm just get the frm
                    if ($(this).attr('hvtype') == "frm") {
                        frms.push(EventTree._getFrmFromId(this.id));
                    }

                    // If this is a event_instance
                    if ($(this).attr('hvtype') == "event_instance") {
                        // Lets get the checked ones
                        frmsChildrens.push(this.id);
                    }
                }

                event_type = EventTree._getEventTypeFromId(this.id);

                frms.forEach((frm) => {
                    // Determine if an entry for this event type already exists
                    index = $.inArray(event_type, event_types)

                    // New event type to add to array
                    if ( index == -1 ) {
                        eventLayer = { 
                            'event_type' : event_type,
                            'frms' : [frm],
                            'event_instances' : [],
                            'open' : 1
                        };
                        checked.push(eventLayer);
                        event_types.push(event_type);
                    }
                    // Append FRM to existing event type in array
                    else {
                        // Only put if it is not there
                        if(!checked[index].frms.includes(frm)) {
                            checked[index].frms.push(frm);
                        }
                    }
                })

                frmsChildrens.forEach((fc) => {
                    // Determine if an entry for this event type already exists
                    index = $.inArray(event_type, event_types)

                    // New event type to add to array
                    if ( index == -1 ) {
                        eventLayer = { 
                            'event_type' : event_type,
                            'frms' : [],
                            'event_instances' : [fc],
                            'open' : 1
                        };
                        checked.push(eventLayer);
                        event_types.push(event_type);
                    }
                    // Append FRM to existing event type in array
                    else {
                        checked[index].event_instances.push(fc);
                    }
                })
            }
        );

        // Save eventLayers state to localStorage
        this.setSavedEventLayers(checked)

        // Show/Hide events to match new state of the checkboxes
        this._EventManager._toggleEvents(checked);

        $(document).trigger("change-feature-events-state");
    },

    /**
     * @description toggles the visibility of frm nodes is tree , if they are not have any child nides
     * @param {boolean} showEmptyBranches
     * @returns void
     */
    toggleEmptyBranches: function(showEmptyBranches) {
        this._showEmptyBranches = showEmptyBranches;
        this._container.find(".empty-element").each(function() {
            showEmptyBranches ? $(this).show() : $(this).hide()
        });
    }
});
