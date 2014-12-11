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

        this.options = {};

        // Setup menu UI components
        this._setupUI();

        // Initialize accordion
        this.domNode = $('#EventLayerAccordion-Container');
        this.domNode.dynaccordion({startClosed: true});

        // Event-handlers
        $(document).bind("create-event-layer-accordion-entry", $.proxy(this.addLayer, this))
                   .bind("update-event-layer-accordion-entry", $.proxy(this._updateAccordionEntry, this))
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
    addLayer: function (event, index, id, name, date, startOpened, markersVisible, labelsVisible) {
        this._createAccordionEntry(index, id, name, markersVisible, labelsVisible, startOpened);
        this._setupEventHandlers(id);
        this._updateTimeStamp(id, date);
    },

    /**
     *
     */
    _createAccordionEntry: function (index, id, name, markersVisible, labelsVisible, startOpened) {

        var visibilityBtn, labelsBtn/*, removeBtn*/, markersHidden, labelsHidden, head, body, self=this;

        // initial visibility
        markersHidden = (markersVisible ? "" : " hidden");
        labelsHidden  = ( labelsVisible ? "" : " hidden");

        visibilityBtn = '<span class="fa fa-eye fa-fw layerManagerBtn visible'
                      + markersHidden + '" '
                      + 'id="visibilityBtn-' + id + '" '
                      + 'title="Toggle visibility of event marker pins" '
                      + '></span>';
        /*
        removeBtn = "<span class='ui-icon ui-icon-closethick removeBtn' id='removeBtn-" + id +
                    "' title='Remove layer'></span>";
        */

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
             +        '<span class="timestamp"></span>'
             +        visibilityBtn
             +        labelsBtn
          /* +        removeBtn */
             +     '</div>'
             + '</div>';

        // Create accordion entry body
        body  = '<div class="row" style="text-align: left;"><div class="buttons"><div id="checkboxBtn-On-'+id+'" title="Toggle All Event Checkboxes On" class="text-button inline-block"><div class="fa fa-check-square fa-fw"></div>check all</div>';
        body += '<div id="checkboxBtn-Off-'+id+'" title="Toggle All Event Checkboxes Off" class="text-button inline-block"><div class="fa fa-square fa-fw"></div>check none</div></div>';
        body += '<div id="eventJSTree" style="margin-bottom: 5px;"></div></div>';


        //Add to accordion
        this.domNode.dynaccordion("addSection", {
            id:     id,
            header: head,
            cell:   body,
            index:  index,
            open:   startOpened
        });

        this.getEventGlossary();

        this.domNode.find("#checkboxBtn-"+id).click( function() {
            $(document).trigger("toggle-checkboxes");
        });

        this.domNode.find("#checkboxBtn-On-"+id).click( function() {
            $(document).trigger("toggle-checkboxes-to-state", ['on']);
        });

        this.domNode.find("#checkboxBtn-Off-"+id).click( function() {
            $(document).trigger("toggle-checkboxes-to-state", ['off']);
        });

        this.domNode.find("#labelsBtn-"+id).click( function(e) {
            $(document).trigger("toggle-event-labels", [$("#labelsBtn-"+id)]);
            e.stopPropagation();
        });

        this.domNode.find(".timestamp").click( function(e) {
            e.stopPropagation();
        });

    },


    /**
     * Queries data to build the EventType and EventFeatureRecognitionMethod
     * classes.
     *
     */
    getEventGlossary: function () {
        var params = {
            "action": "getEventGlossary"
        };
        $.get(Helioviewer.api, params, $.proxy(this._setEventGlossary, this), "json");
    },


    _setEventGlossary: function(response) {
        this._eventManager = new EventManager(response, this._date);
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

            domNode = $(document).find("#event-container");
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

        // Function for handling layer remove button
//        removeLayer = function (e) {
//            $(document).trigger("remove-event-layer", [id]);
//            self._removeTooltips(id);
//            self.domNode.dynaccordion('removeSection', {id: id});
//            $(document).trigger("save-event-layers");
//            e.stopPropagation();
//        };

        visibilityBtn.bind('click', this, toggleVisibility);
//        removeBtn.bind('click', this, removeLayer);
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
        var actualDate, weight, domNode, self = this;
        this._date = requestDate;

        // Refresh Event/FRM checkbox hierarchy and EventMarkers
        this._eventManager.updateRequestTime();

        // Update value/color of timestamp(s)
        // For HEK events, we can _always_ use the exact same date as the requestDate
        $("#EventLayerAccordion-Container .timestamp").each(function (i, item) {
            domNode = $(this);
            domNode.html(self._date.toUTCDateString() + " " + self._date.toUTCTimeString())
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

        $("#" + id).find('.timestamp').html(date.toUTCDateString() + " " + date.toUTCTimeString())
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

