/**
 * @fileOverview Contains the class definition for an EventLayerAccordion class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
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
    addLayer: function (event, index, id, name, date, startOpened, markersVisible, labelsVisible, apiSource) {
        if(outputType!='minimal'){
            this._createAccordionEntry(index, id, name, markersVisible, labelsVisible, startOpened, apiSource);
            this._setupEventHandlers(id);
            this._updateTimeStamp(id, date);
        }else{
            this._createK12VisibilityBtn(index, id, name, markersVisible, labelsVisible, startOpened, apiSource);
            this._setupK12EventHandlers(id);
        }
    },

    /**
     *
     */
    _createAccordionEntry: function (index, id, name, markersVisible, labelsVisible, startOpened, apiSource) {

        var visibilityBtn, labelsBtn, availableBtn/*, removeBtn*/, markersHidden, labelsHidden, availableHidden, head, body, self=this;

		let treeid = 'tree_'+name;

		var visState = Helioviewer.userSettings.get("state.eventLayerAvailableVisible");
        if ( typeof visState == 'undefined') {
            Helioviewer.userSettings.set("state.eventLayerAvailableVisible", true);
            visState = true;
        }

        // initial visibility
        markersHidden = (markersVisible ? "" : " hidden");
        labelsHidden  = ( labelsVisible ? "" : " hidden");
        availableHidden  = ( visState ? "" : " hidden");

		availableBtn = '<span class="fa fa-bullseye fa-fw layerAvailableBtn visible'
                      + availableHidden + '" '
                      + 'id="visibilityAvailableBtn-' + id + '" '
                      + 'title="Toggle visibility of empty elements inside Features and Events list" '
                      + '></span>';

        visibilityBtn = '<span class="fa fa-eye fa-fw layerManagerBtn visible'
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

        this._loadEvents(treeid, apiSource);

        this.domNode.find("#checkboxBtn-On-"+id).click( function() {
            $(document).trigger("toggle-checkboxes-to-state", [treeid, 'on']);
        });

        this.domNode.find("#checkboxBtn-Off-"+id).click( function() {
            $(document).trigger("toggle-checkboxes-to-state", [treeid, 'off']);
        });

        this.domNode.find("#labelsBtn-"+id).click( function(e) {
            $(document).trigger("toggle-event-labels", [$("#labelsBtn-"+id)]);
            e.stopPropagation();
        });

        this.domNode.find("#visibilityAvailableBtn-"+id).click( function(e) {
            var visState = Helioviewer.userSettings.get("state.eventLayerAvailableVisible");
            if(visState == true){
	            Helioviewer.userSettings.set("state.eventLayerAvailableVisible", false);
	            $(this).addClass('hidden');
				$('#'+treeid+' .empty-element').hide();
            }else{
	            Helioviewer.userSettings.set("state.eventLayerAvailableVisible", true);
	            $(this).removeClass('hidden');
	            $('#'+treeid+' .empty-element').show();
            }
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
    _loadEvents: function (id, apiSource) {
        this.getEventGlossary(id, $.proxy(this._createEventManager, this, id, apiSource));
    },

    _createK12VisibilityBtn: function(index, id, name, markersVisible, labelsVisible, startOpened, apiSource) {
        var visibilityBtn, labelsBtn, availableBtn/*, removeBtn*/, markersHidden, labelsHidden, availableHidden, eventsDiv, self=this;

		let treeid = 'tree-'+id;

		var visState = Helioviewer.userSettings.get("state.eventLayerAvailableVisible");
        if ( typeof visState == 'undefined') {
            Helioviewer.userSettings.set("state.eventLayerAvailableVisible", true);
            visState = true;
        }

        // initial visibility
        markersHidden = (markersVisible ? "" : " hidden");
        labelsHidden  = ( labelsVisible ? "" : " hidden");
        availableHidden  = ( visState ? "" : " hidden");

        visibilityBtn = '<span class="fa fa-eye fa-fw layerManagerBtn visible'
                      + markersHidden + '" '
                      + 'id="visibilityBtn-' + id + '" '
                      + 'title="Toggle visibility of event marker pins" '
		      + 'style="margin-top:0.5em;" '
                      + '></span>';

        eventsDiv = '<div id="k12-events-visibility-btn-'+id+'" class="k12-eventsVisBtn" title="Toggle visibility of event marker pins" style="display: flex;">'
                    + visibilityBtn
                    + '<p id="k12-events-btn-text" style="margin-left:0.3em;">EVENTS ARE ON<p></div>';

        //Add to accordion
        this.domNode.append(eventsDiv);

        this._loadEvents(treeid, apiSource);

        //this.domNode.find("#visibilityAvailableBtn-"+id).click( function(e) {
        this.domNode.find("#k12-events-visibility-btn-"+id).click( function(e) {
            var visState = Helioviewer.userSettings.get("state.eventLayerAvailableVisible");
            if(visState == true){
	            Helioviewer.userSettings.set("state.eventLayerAvailableVisible", false);
	            $(this).addClass('hidden');
				$('#'+treeid+' .empty-element').hide();
            }else{
	            Helioviewer.userSettings.set("state.eventLayerAvailableVisible", true);
	            $(this).removeClass('hidden');
	            $('#'+treeid+' .empty-element').show();
            }
            e.stopPropagation();
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

    _createEventManager: function(id, apiSource, eventGlossary) {
        this._eventManagers.push(new EventManager(eventGlossary, this._date, id, apiSource));
    },

    /**
     * @description Handles setting up an empty tile layer accordion.
     */
    _setupUI: function () {
        return;
    },

    /**
     * @description Sets up event-handlers for a EventLayerAccordion entry
     * @param {String} id
     */
    _setupEventHandlers: function (id) {
        var toggleVisibility, opacityHandle, removeLayer, visState, self = this,
            visibilityBtn = $("#visibilityBtn-" + id)/*,
            removeBtn     = $("#removeBtn-" + id)*/;

        // Function for toggling layer visibility
        toggleVisibility = function (e) {
            var domNode;

            domNode = $(document).find(".event-container");
            if ( domNode.css('display') == 'none') {
                domNode.show();
                Helioviewer.userSettings.set("state.eventLayerVisible", true);
                $("#visibilityBtn-" + id).removeClass('hidden');
                $("#visibilityBtn-" + id).removeClass('fa-eye-slash');
                $("#visibilityBtn-" + id).addClass('fa-eye');
            }
            else {
                domNode.hide();
                Helioviewer.userSettings.set("state.eventLayerVisible", false);
                $("#visibilityBtn-" + id).addClass('hidden');
                $("#visibilityBtn-" + id).removeClass('fa-eye');
                $("#visibilityBtn-" + id).addClass('fa-eye-slash');
            }

            e.stopPropagation();
        };

        visibilityBtn.unbind('click').bind('click', this, toggleVisibility);
    },

    /**
     * @description Sets up event-handlers for a EventLayerAccordion entry
     * @param {String} id
     */
    _setupK12EventHandlers: function (id) {
        var toggleVisibility, opacityHandle, removeLayer, visState, self = this,
            visibilityBtn = $("#k12-events-visibility-btn-" + id)/*,
            removeBtn     = $("#removeBtn-" + id)*/;

        // Function for toggling layer visibility
        toggleVisibility = function (e) {
            var domNode;

            domNode = $(document).find(".event-container");
            if ( domNode.css('display') == 'none') {
                domNode.show();
                Helioviewer.userSettings.set("state.eventLayerVisible", true);
                $("#visibilityBtn-" + id).removeClass('hidden');
                $("#visibilityBtn-" + id).removeClass('fa-eye-slash');
                $("#visibilityBtn-" + id).addClass('fa-eye');
		$("#k12-events-btn-text").text("EVENTS ARE ON");
            }
            else {
                domNode.hide();
                Helioviewer.userSettings.set("state.eventLayerVisible", false);
                $("#visibilityBtn-" + id).addClass('hidden');
                $("#visibilityBtn-" + id).removeClass('fa-eye');
                $("#visibilityBtn-" + id).addClass('fa-eye-slash');
		$("#k12-events-btn-text").text("EVENTS ARE OFF");
            }

            e.stopPropagation();
        };

        visibilityBtn.unbind('click').bind('click', this, toggleVisibility);
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

            //helioviewer._timeSelector = new TimeSelector();
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

		//helioviewer._timeSelector = new TimeSelector();
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

