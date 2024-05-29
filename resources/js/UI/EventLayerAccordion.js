/**
 * @fileOverview Contains the class definition for an EventLayerAccordion class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author Kasim Necdet Percinel <kasim.n.percinel@nasa.gov>
 * @see TileLayerManager, TileLayer
 * @requires ui.dynaccordion.js
 *
 * TODO (2009/08/03) Create a TreeSelect object to handle hierarchical select fields?
 * (can pass in a single tree during init)
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, Layer, TreeSelect, TileLayer, getUTCTimestamp, assignTouchHandlers */
"use strict";
var EventLayerAccordion = Layer.extend(
    /** @lends EventLayerAccordion.prototype */
    {
    /**
     * Creates a new Tile Layer accordion user interface component
     *
     * @param {Object} Events Reference to the application layer manager
     * @param {String} containerId ID for the outermost continer where the layer
     *                 manager user interface should be constructed
     */
    init: function (containerId, eventTypes, date) {

        this.container        = $(containerId);
        this._eventTypes      = eventTypes;
        this._date            = date;
        this._maximumTimeDiff = 12 * 60 * 60 * 1000; // 12 hours in miliseconds
		this._eventManagers = [];

        this.options = {};

        // Setup menu UI components
        this._setupUI();

        // Initialize accordion
        if(outputType != 'minimal'){
            this.domNode = $('#EventLayerAccordion-Container');
        }else{
            this.domNode = $('#image-layer-select-container');
        }
        this.domNode.dynaccordion({startClosed: true});

        // Event-handlers
        $(document).unbind("create-event-layer-accordion-entry").bind("create-event-layer-accordion-entry", $.proxy(this.addLayer, this))
                   .unbind("update-event-layer-accordion-entry").bind("update-event-layer-accordion-entry", $.proxy(this._updateAccordionEntry, this))
                   .bind("observation-time-changed",           $.proxy(this._onObservationTimeChange, this));

        // Tooltips
        this.container.delegate("span[title]", 'mouseover', function (event) {
            $(this).qtip({
                overwrite: false,
                show: {
                    event: event.type,
                    ready: true
                }
            }, event);
        })
        .each(function (i) {
            $.attr(this, 'oldtitle', $.attr(this, 'title'));
            this.removeAttribute('title');
        });

    },

    /**
     * Adds a new entry to the event accordion
     *
     * @param {Object} layer The new layer to add
     */
    addLayer: function (event, index, id, name, date, startOpened, markersVisible, labelsVisible, availabilityVisible, apiSource) {
        if(outputType!='minimal') {
            this._createAccordionEntry(index, id, name, markersVisible, labelsVisible, availabilityVisible, startOpened, apiSource);
            this._updateTimeStamp(id, date);
        } else {
            this._createK12VisibilityBtn(index, id, name, markersVisible, labelsVisible, availabilityVisible, startOpened, apiSource);
        }
    },

    /**
     * @description check if the labels visibility of all event layers are turned off or on
     * @return {boolean} 
     */
    isAllEventLayersTurnedOff: function() {

        let weHaveAtLeastOneEvLabelsOn = false;

        Helioviewer.userSettings.iterateOnHelioViewerEventLayerSettings(tC => {
            weHaveAtLeastOneEvLabelsOn = weHaveAtLeastOneEvLabelsOn || tC['labels_visible']; 
        });

        return weHaveAtLeastOneEvLabelsOn;
    },

    /**
     * @description Creates event layer sections like HEK or CCMC
     *
     * @param {integer} index , used in queries to fetch FRM data
     * @param {string} id of the tree
     * @param {float} viewportScale
     * @param {string} name , name of the event  layer used in tree and event managers
     * @param {boolean} markersVisible, are we going to hide markers for this event layer initially, coming from the state 
     * @param {boolean} labelsVisible, are we going to hide labels of markers for this event layer initially, coming from the state 
     * @param {boolean} availabilityVisible, are we going to hide unavailable FRMs in checkbox tree branches 
     * @param {boolean} startOpened, 
     * @param {JSON} apiSource, initial request params for fetching tree data , managing event layers 
     *
     */
    _createAccordionEntry: function (index, id, name, markersVisible, labelsVisible, availabilityVisible, startOpened, apiSource) {

        var visibilityBtn, labelsBtn, availableBtn/*, removeBtn*/, markersHidden, labelsHidden, availableHidden, head, body, self=this;

		let treeid = 'tree_'+name;

        // initial visibility of the tree buttons, 
        availableHidden  = ( availabilityVisible ? "" : " hidden");
        markersHidden = (markersVisible ? " fa-eye " : " fa-eye-slash hidden");
        labelsHidden  = ( labelsVisible ? "" : " hidden");

		availableBtn = '<span class="fa fa-bullseye fa-fw layerAvailableBtn visible'
                      + availableHidden + '" '
                      + 'id="visibilityAvailableBtn-' + id + '" '
                      + 'title="Toggle visibility of empty elements inside Features and Events list" '
                      + '></span>';

        visibilityBtn = '<span class="fa fa-fw layerManagerBtn visible'
                      + markersHidden + '" '
                      + 'id="visibilityBtn-' + id + '" '
                      + 'title="Toggle visibility of event marker pins" '
                      + '></span>';

        labelsBtn = '<span class="fa fa-tags fa-fw labelsBtn'
                  + labelsHidden + '" '
                  + 'id="labelsBtn-' + id + '" '
                  + 'title="Toggle Visibility of Feature and Event Text Labels" '
                  + '></span>';

        head = '<div class="layer-Head ui-accordion-header ui-helper-reset ui-state-default ui-corner-all">'
             +     '<div class="left">'
             +        name
             +     '</div>'
             +     '<div class="right">'
             +        '<span class="timestamp user-selectable"></span>'
             +        availableBtn
             +		  visibilityBtn
             +        labelsBtn
             +     '</div>'
             + '</div>';

        // Create accordion entry body
        body  = '<div class="row" style="text-align: left;"><div class="buttons"><div id="checkboxBtn-On-'+id+'" title="Toggle All Event Checkboxes On" class="text-button inline-block"><div class="fa fa-check-square fa-fw"></div>check all</div>';
        body += '<div id="checkboxBtn-Off-'+id+'" title="Toggle All Event Checkboxes Off" class="text-button inline-block"><div class="fa fa-square fa-fw"></div>check none</div></div>';
        body += '<div id="'+treeid+'" style="margin-bottom: 5px;"></div></div>';


        //Add to accordion
        this.domNode.dynaccordion("addSection", {
            id:     id, 
            header: head,
            cell:   body,
            index:  index,
            open:   startOpened
        });

        // create event_layer_manager for this event layer
        this._loadEvents(treeid, apiSource, markersVisible, labelsVisible, availabilityVisible);

        this.domNode.find("#checkboxBtn-On-"+id).click( function() {
            $(document).trigger("toggle-checkboxes-to-state", [treeid, 'on']);
        });

        this.domNode.find("#checkboxBtn-Off-"+id).click( function() {
            $(document).trigger("toggle-checkboxes-to-state", [treeid, 'off']);
        });

        // click event for the label button, turns off and ons marker labels
        this.domNode.find("#labelsBtn-"+id).click( function(e) {
            // get label state for this event layer
            let currentLabelVisible = Helioviewer.userSettings.getHelioViewerEventLayerSettingsValue(name,'labels_visible');
            let newCurrentLabelVisible = !currentLabelVisible;

            // populate new label visibility to those event layer
            self._eventManagers.filter(m => m.filterID(name)).forEach(m => m.toggleLabels(newCurrentLabelVisible))

            // toggle label visibility state for this event layer
            Helioviewer.userSettings.setHelioViewerEventLayerSettings(name, 'labels_visible', newCurrentLabelVisible);

            // if labels are visible in new state remove hidden class
            if(newCurrentLabelVisible) {
	            $(this).removeClass('hidden');
            } else {
	            $(this).addClass('hidden');
            }

            // This specifically trigger to update shared url
            $(document).trigger("change-feature-events-state");

            e.stopPropagation();
        });

        // click event for the eye button, turns off and ons marker entirely
        this.domNode.find("#visibilityBtn-"+id).click( function(e) {

            // get marker visibility conf of layer markers
            let currentMarkersVisible = Helioviewer.userSettings.getHelioViewerEventLayerSettingsValue(name,'markers_visible');
            let newCurrentMarkersVisible = !currentMarkersVisible;

            // set marker visbility of the event_manager for this event
            self._eventManagers.filter(m => m.filterID(name)).forEach(m => m.toggleMarkers(newCurrentMarkersVisible))

            // toggle markers visibility state for this event layer
            Helioviewer.userSettings.setHelioViewerEventLayerSettings(name, 'markers_visible', newCurrentMarkersVisible);

            // manage button , make it red or green, depend on the state
            if(newCurrentMarkersVisible) {
                $(this).removeClass('hidden');
                $(this).removeClass('fa-eye-slash');
                $(this).addClass('fa-eye');
            } else {
                $(this).addClass('hidden');
                $(this).removeClass('fa-eye');
                $(this).addClass('fa-eye-slash');
            }

            // This specifically trigger to update shared url
            $(document).trigger("change-feature-events-state");

            e.stopPropagation();
        });

        // This is the place , managing 'd' keyboard command, 
        // see KeyboardManager firing toggle-event-labels for the 'd' key, 
        // this boolean decides , initial behaviour of the 'd'
        // if all labels of all layers turned off , 'd' initially makes them visible
        // if all labels of all layers are turned on, 'd' inittialy hides them
        let all_levels_dictated = this.isAllEventLayersTurnedOff();

        $(document).bind("toggle-event-labels", (event) => {
             
            all_levels_dictated = !all_levels_dictated;

            // We are going to force what it dictates
            let newCurrentLabelVisible = all_levels_dictated;

            // populate new label visibility to those event layer
            self._eventManagers.filter(m => m.filterID(name)).forEach(m => m.toggleLabels(newCurrentLabelVisible))

            // toggle label visibility state for this event layer
            Helioviewer.userSettings.setHelioViewerEventLayerSettings(name, 'labels_visible', newCurrentLabelVisible);

            // if labels are visible in new state remove hidden class
            if(newCurrentLabelVisible) {
	            self.domNode.find("#labelsBtn-"+id).removeClass('hidden');
            } else {
	            self.domNode.find("#labelsBtn-"+id).addClass('hidden');
            }


            // This specifically trigger to update shared url
            $(document).trigger("change-feature-events-state");
        });

        // click event for hiding empty frm sources button
        this.domNode.find("#visibilityAvailableBtn-"+id).click( function(e) {

            // get layer availability state for this event layer
            let currentLayerAvailableVisible = Helioviewer.userSettings.getHelioViewerEventLayerSettingsValue(name,'layer_available_visible');
            let newCurrentLayerAvailableVisible = !currentLayerAvailableVisible;

            // populate new label visibility to those event layer
            self._eventManagers.filter(m => m.filterID(name)).forEach(m => m.toggleNonAvailableLayers(newCurrentLayerAvailableVisible))

            // toggle label visibility state for this event layer
            Helioviewer.userSettings.setHelioViewerEventLayerSettings(name, 'layer_available_visible', newCurrentLayerAvailableVisible);

            // if labels are visible in new state remove hidden class
            if(newCurrentLayerAvailableVisible) {
                $(this).removeClass('hidden');
            } else {
	            $(this).addClass('hidden');
            }


            // This specifically trigger to update shared url
            $(document).trigger("change-feature-events-state");

            e.stopPropagation();

        });

        this.domNode.find(".timestamp").click( function(e) {
            e.stopPropagation();
        });

        
    },

    /**
     * Begins the process of loading events
     * @param {string} id
     */
    _loadEvents: function (id, apiSource, markersVisible, labelsVisible, availabilityVisible) {
        this.getEventGlossary(id, $.proxy(this._createEventManager, this, id, apiSource, markersVisible, labelsVisible, availabilityVisible));
    },

    /**
     * @description Just for output mininal , created EVENTS ON and EVENTS OFF button
     *
     * @param {integer} index , used in queries to fetch FRM data
     * @param {string} id of the tree
     * @param {boolean} markersVisible, are we going to hide markers for this event layer initially, coming from the state 
     * @param {boolean} labelsVisible, are we going to hide labels of markers for this event layer initially, coming from the state 
     * @param {boolean} availabilityVisible, are we going to hide unavailable FRMs in checkbox tree branches 
     * @param {boolean} startOpened, 
     * @param {JSON} apiSource, initial request params for fetching tree data , managing event layers 
     *
     */
    _createK12VisibilityBtn: function(index, id, name, markersVisible, labelsVisible, availabilityVisible, startOpened, apiSource) {

        var visibilityBtn, labelsBtn, availableBtn/*, removeBtn*/, markersHidden, labelsHidden, availableHidden, eventsDiv, self=this;

		let treeid = 'tree_'+name;

        // initial visibility
        markersHidden = (markersVisible ? "" : " hidden");

        visibilityBtn = '<span class="fa fa-eye fa-fw layerManagerBtn visible'
                      + markersHidden + '" '
                      + 'id="visibilityBtn-' + id + '" '
                      + 'title="Toggle visibility of event marker pins" '
		      + 'style="margin-top:0.5em;" '
                      + '></span>';

        eventsDiv = '<div id="k12-events-visibility-btn-'+id+'" class="k12-eventsVisBtn" title="Toggle visibility of event marker pins" style="display: flex;cursor: pointer;">'
                    + visibilityBtn
                    + '<p id="k12-events-btn-text" style="margin-left:0.3em;">EVENTS ARE ON<p></div>';
        
        let jstree = '<div id=' + treeid + ' style="display: none"></div>';

        //Add to accordion
        this.domNode.append(eventsDiv);
        this.domNode.append(jstree);

        this._loadEvents(treeid, apiSource, markersVisible, labelsVisible, availabilityVisible);

        this.domNode.find("#k12-events-visibility-btn-"+id).click( function(e) {

            // get label state for this event layer
            let currentMarkersVisible = Helioviewer.userSettings.getHelioViewerEventLayerSettingsValue(name,'markers_visible');
            let newCurrentMarkersVisible = !currentMarkersVisible;

            // populate new label visibility to those event layer
            self._eventManagers.filter(m => m.filterID(name)).forEach(m => m.toggleMarkers(newCurrentMarkersVisible))

            // toggle label visibility state for this event layer
            Helioviewer.userSettings.setHelioViewerEventLayerSettings(name, 'markers_visible', newCurrentMarkersVisible);

            // if labels are visible in new state remove hidden class
            if(newCurrentMarkersVisible) {
                $("#visibilityBtn-" + id).removeClass('hidden');
                $("#visibilityBtn-" + id).removeClass('fa-eye-slash');
                $("#visibilityBtn-" + id).addClass('fa-eye');
                $("#k12-events-btn-text").text("EVENTS ARE ON");
            } else {
                $("#visibilityBtn-" + id).addClass('hidden');
                $("#visibilityBtn-" + id).removeClass('fa-eye');
                $("#visibilityBtn-" + id).addClass('fa-eye-slash');
                $("#k12-events-btn-text").text("EVENTS ARE OFF");
            }

            e.stopPropagation();

        });

        let all_levels_dictated = true;
        $(document).bind("toggle-event-labels", (event) => {
            all_levels_dictated = !all_levels_dictated;

            // We are going to force what it dictates
            let newCurrentLabelVisible = all_levels_dictated;

            // populate new label visibility to those event layer
            self._eventManagers.filter(m => m.filterID(name)).forEach(m => m.toggleLabels(newCurrentLabelVisible))

            // toggle label visibility state for this event layer
            Helioviewer.userSettings.setHelioViewerEventLayerSettings(name, 'labels_visible', newCurrentLabelVisible);

        });
    },


    /**
     * Queries data to build the EventType and EventFeatureRecognitionMethod
     * classes.
     *
     */
    getEventGlossary: function (id, callback) {
        var params = {
            "action": "getEventGlossary"
        };
        $.get(Helioviewer.api, params, callback, "json");
    },

    _createEventManager: function(id, apiSource, markersVisible, labelsVisible, availabilityVisible, eventGlossary) {
        this._eventManagers.push(new EventManager(eventGlossary, this._date, id, apiSource, markersVisible, labelsVisible, availabilityVisible));
    },

    /**
     * @description Handles setting up an empty tile layer accordion.
     */
    _setupUI: function () {
        return;
    },

    /**
     * @description Unbinds event-handlers relating to accordion header tooltips
     * @param {String} id
     */
    _removeTooltips: function (id) {
        $("#" + id + " *[oldtitle]").qtip("destroy");
    },


    /**
     * Keeps track of requested date to use when styling timestamps and
     * requests a reload of the event type checkbox hierarchy for the new timestamp
     */
    _onObservationTimeChange: function (event, requestDate) {
        var domNode, self = this;
        this._date = requestDate;

        // Refresh Event/FRM checkbox hierarchy and EventMarkers
        this._eventManagers.forEach((eventManager) => {
            eventManager.updateRequestTime();
        })

        // Update value/color of timestamp(s)
        // For HEK events, we can _always_ use the exact same date as the requestDate
        $("#EventLayerAccordion-Container .timestamp").each(function (i, item) {
            domNode = $(this);
            domNode.html(self._date.toUTCDateString() + " " + self._date.toUTCTimeString()
           		 +" <span class=\"user-selectable dateSelector\" data-tip-pisition=\"right\" data-date-time=\""+self._date.toUTCDateString() + " " + self._date.toUTCTimeString()+"\">UTC</span>")
                    .css("color", self._chooseTimeStampColor(0, 0, 0, 0));

        });
    },


    /**
     *
     */
    _updateAccordionEntry: function (event, id, name, opacity, date, imageId) {
        var entry = $("#" + id), self = this;

        // Update value/color of .timeStamp in accordion header
        this._updateTimeStamp(id, date);

        // Update 'name' in accordion header
        entry.find(".tile-accordion-header-left").html(name);
    },

    /**
     * @description Updates the displayed timestamp for a given tile layer
     * @param {Object} layer The layer being updated
     */
    _updateTimeStamp: function (id, date) {

        var weight = this._getScaledTimeDifference(date, this._date);

        $("#" + id).find('.timestamp').html(date.toUTCDateString() + " " + date.toUTCTimeString()
        		+" <span class=\"user-selectable dateSelector\" data-tip-pisition=\"right\" data-date-time=\""+date.toUTCDateString() + " " + date.toUTCTimeString()+"\">UTC</span>")
					.css("color", this._chooseTimeStampColor(weight, 0, 0, 0));

    },

    /**
     * Returns a value from 0 to 1 representing the amount of deviation from the requested time
     */
    _getScaledTimeDifference: function (t1, t2) {
        return Math.min(1, Math.abs(t1.getTime() - t2.getTime()) / this._maximumTimeDiff);
    },

    /**
     * Returns a CSS RGB triplet ranging from green (close to requested time) to yellow (some deviation from requested
     * time) to red (requested time differs strongly from actual time).
     *
     * @param float weight  Numeric ranging from 0.0 (green) to 1.0 (red)
     * @param int   rOffset Offset to add to red value
     * @param int   gOffset Offset to add to green value
     * @param int   bOffset Offset to add to blue value
     */
    _chooseTimeStampColor: function (w, rOffset, gOffset, bOffset) {
        var r = Math.min(255, rOffset + parseInt(2 * w * 255, 10)),
            g = Math.min(255, gOffset + parseInt(2 * 255 * (1 - w), 10)),
            b = bOffset + 0;

        return "rgb(" + r + "," + g + "," + b + ")";
    }
});

