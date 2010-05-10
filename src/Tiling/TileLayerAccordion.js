/**
 * @fileOverview Contains the class definition for an TileLayerAccordion class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @see TileLayerManager, TileLayer
 * @requires ui.dynaccordion.js
 * 
 * TODO (2009/08/03) Create a TreeSelect object to handle hierarchical select fields? 
 * (can pass in a single tree during init)
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, Layer, TreeSelect, TileLayer, getUTCTimestamp */
"use strict";
var TileLayerAccordion = Layer.extend(
    /** @lends TileLayerAccordion.prototype */
    {
    /**
     * @constructs
     * @description Creates a new TileLayerAccordion
     * @param {Object} tileLayers Reference to the application layer manager
     * @param {String} containerId ID for the outermost continer where the layer 
     * manager user interface should be constructed
     */
    init: function (controller, containerId) {
        this.controller = controller;
        this.tileLayers = controller.tileLayers;
        this.container  = $(containerId);
        this.queryURL   = "api/index.php";

        this.options = {};

        //Setup menu UI components
        this._setupUI();

        //Initialize accordion
        this.domNode = $('#TileLayerAccordion-Container');
        this.domNode.dynaccordion({startClosed: true});
        
        // Event-handlers
        $(document).bind("create-tile-layer-accordion-entry", $.proxy(this.addLayer, this))
                   .bind("update-tile-layer-accordion-entry", $.proxy(this._updateAccordionEntry, this));
    },

    /**
     * @description Adds a new entry to the tile layer accordion
     * @param {Object} layer The new layer to add
     */
    addLayer: function (event, index, id, name, observatory, instrument, detector, measurement, date, 
                        startOpened, opacity, visible, onOpacityChange) {
        if (typeof(index) === "undefined") {
            index = 1000;
        }
        
        this._createAccordionEntry(index, id, name, visible, startOpened);
        this._initTreeSelect(id, observatory, instrument, detector, measurement);
        this._initOpacitySlider(id, opacity, onOpacityChange);        
        this._setupEventHandlers(id);
        this.updateTimeStamp(id, date);
        this._setupTooltips(id);
    },

    /**
     *
     */
    _createAccordionEntry: function (index, id, name, visible, startOpened) {
        var visibilityBtn, removeBtn, hidden, head, body;
        
        // initial visibility
        hidden = (visible ? "" : " hidden");
        
        visibilityBtn = "<span class='layerManagerBtn visible" + hidden + "' id='visibilityBtn-" + id +
                        "' title='Toggle layer visibility'></span>";
        removeBtn = "<span class='ui-icon ui-icon-closethick removeBtn' id='removeBtn-" + id +
                    "' title='Remove layer'></span>";
        head = "<div class='layer-Head ui-accordion-header ui-helper-reset ui-state-default ui-corner-all'>" + 
               "<span class=tile-accordion-header-left>" + name +
               "</span><span class=tile-accordion-header-right><span class=timestamp></span>" + 
               "<span class=accordion-header-divider>|</span>" + visibilityBtn + removeBtn + "</span></div>";
        
        // Create accordion entry body
        body = this._buildEntryBody(id);
        
        //Add to accordion
        this.domNode.dynaccordion("addSection", {
            id:     id,
            header: head,
            cell:   body,
            index:  index,
            open:   startOpened
        });  
    },
    
    /**
     * 
     */
    _initTreeSelect: function (id, observatory, instrument, detector, measurement) {
        var ids, selected, obs, inst, det, meas, self = this;
        
        // SELECT id's
        obs  = "#observatory-select-" + id;
        inst = "#instrument-select-"  + id;
        det  = "#detector-select-"    + id;
        meas = "#measurement-select-" + id;

        ids       = [obs, inst, det, meas];
        selected  = [observatory, instrument, detector, measurement];
        
        this.selectMenus = new TreeSelect(ids, this.controller.dataSources, selected, function (leaf) {
            $(document).trigger("tile-layer-data-source-changed",
                [id, $(obs).attr("value"), $(inst).attr("value"), $(det).attr("value"), $(meas).attr("value"), 
                leaf.sourceId, leaf.name, leaf.layeringOrder]
             );
        });
    },
    
    /**
     * 
     */
    _initOpacitySlider: function (id, opacity, onOpacityChange) {
        var self = this;
        
        $("#opacity-slider-track-" + id).slider({
            value: opacity,
            min  : 0,
            max  : 100,
            slide: function (e, ui) {
                if ((ui.value % 2) === 0) {
                    onOpacityChange(ui.value);
                }
            },
            change: function (e, ui) {
                onOpacityChange(ui.value);
                self.tileLayers.save();
            }
        });
    },

    /**
     * @description Builds the body section of a single TileLayerAccordion entry. NOTE: width and height 
     * must be hardcoded for slider to function properly.
     * @param {Object} layer The new layer to add
     * @see <a href="http://groups.google.com/group/Prototypejs/browse_thread/thread/60a2676a0d62cf4f">
     * This discussion thread</a> for explanation.
     */
    _buildEntryBody: function (id) {
        var opacitySlide, obs, inst, det, meas, fits;
        
        // Opacity slider placeholder
        opacitySlide = "<div class='layer-select-label'>Opacity: </div>";
        opacitySlide += "<div class='opacity-slider-track' id='opacity-slider-track-" + id;
        opacitySlide += "' style='width: 120px; height: 8px;'>";
        opacitySlide += "</div>";
                
        // Populate list of available observatories
        obs = "<div class=layer-select-label>Observatory: </div> ";
        obs += "<select name=observatory class=layer-select id='observatory-select-" + id + "'></select>";
       
        // Populate list of available instruments
        inst = "<div class=layer-select-label>Instrument: </div> ";
        inst += "<select name=instrument class=layer-select id='instrument-select-" + id + "'></select>";

        // Populate list of available Detectors
        det = "<div class=layer-select-label>Detector: </div> ";
        det += "<select name=detector class=layer-select id='detector-select-" + id + "'></select>";
        
        // Populate list of available Detectors
        meas = "<div class=layer-select-label>Measurement: </div> ";
        meas += "<select name=measurement class=layer-select id='measurement-select-" + id + "'>";
        meas += "</select><br><br>";
        
        fits = "<a href='#' id='showFITSBtn-" + id +
               "' style='margin-left:170px; color: white; text-decoration: none;'>FITS Header</a><br>";
        
        return (opacitySlide + obs + inst + det + meas + fits);
    },

    /**
     * @description Handles setting up an empty tile layer accordion.
     */
    _setupUI: function () {
        var title, addLayerBtn, self = this;
        
        // Create a top-level header and an "add layer" button
        title = $('<span class="section-header">Images</span>').css({'float': 'left'});
        addLayerBtn = $('<a href=# class=dark>[Add]</a>').css({'margin-right': '14px'});
        this.container.append($('<div></div>').css('text-align', 'right').append(title).append(addLayerBtn));
        this.container.append($('<div id="TileLayerAccordion-Container"></div>'));
        
        // Event-handlers
        addLayerBtn.click(function () {
            self.tileLayers.addNewLayer();
        });
    },

    /**
     * @description Sets up event-handlers for a TileLayerAccordion entry
     * @param {Object} layer The layer being added
     */
    _setupEventHandlers: function (id) {
        var toggleVisibility, removeLayer, visible, accordion, ids, self = this,
            visibilityBtn = $("#visibilityBtn-" + id),
            removeBtn     = $("#removeBtn-" + id);

        // Function for toggling layer visibility
        toggleVisibility = function (e) {
            $(document).trigger("toggle-layer-visibility", [id]);
            $("#visibilityBtn-" + id).toggleClass('hidden');
            e.stopPropagation();
        };

        // Function for handling layer remove button
        removeLayer = function (e) {
            $(document).trigger("remove-tile-layer", [id]);
            self._removeTooltips(id);
            self.domNode.dynaccordion('removeSection', {id: id});
            self.tileLayers.save();
            e.stopPropagation();
        };
        
        ids = ["#observatory-select-" + id, "#instrument-select-" + id, "#detector-select-" +
              id, "#measurement-select-" + id];

        visibilityBtn.bind('click', this, toggleVisibility);
        removeBtn.bind('click', removeLayer);
    },
    
    /**
     * 
     */
    _updateAccordionEntry: function (event, id, name, opacity, date, filepath, filename, server) {
        var entry = $("#" + id), self = this;
        
        this.updateTimeStamp(id, date);
        
        entry.find(".tile-accordion-header-left").html(name);
        entry.find("#opacity-slider-track-" + id).slider("value", opacity);
        
        // Display FITS header
        entry.find("#showFITSBtn-" + id).unbind().bind('click', function () {
            self._showFITS(id, name, filepath, filename, server);
        });
    },
    
    /**
     * @description Displays the FITS header information associated with a given image
     * @param {Object} layer
     */
    _showFITS: function (id, name, filepath, filename, server) {
        var sortBtn, formatted, params, callback, dialog;
        
        dialog = $("#fits-header-" + id);
        
        // Check to see if a dialog already exists
        if (dialog.length !== 0) {
            if (!dialog.dialog("isOpen")) {
                dialog.dialog("open");
            }
            else {
                dialog.dialog("close");
            }
                
            return;
        }
        
        // Ajax Responder
        callback = function (response) {

            // Format results
            formatted =  "<div id='fits-header-" + id + "' style='overflow: auto; position: relative; padding:0px'>";
            formatted += "<div class='fits-regular'>";
            $.each(response, function () {
                formatted += this + "<br>";
            });
            formatted += "</div>";
            
            // Store a sort version as well
            formatted += "<div class='fits-sorted' style='display: none;'>";
            $.each(response.sort(), function () {
                formatted += this + "<br>";
            });
            
            formatted += "</div></div>";
            
            $("body").append(formatted);

            // Button to toggle sorting
            sortBtn = "<span class='fits-sort-btn'>Abc</span>";
            dialog.append(sortBtn);    
            dialog.children("span").click(function () {
                $(this).toggleClass("italic");
                dialog.children(".fits-sorted").toggle();
                dialog.children(".fits-regular").toggle();
            });
                            
            dialog.dialog({
                autoOpen: true,
                title: "FITS Header: " + name,
                width: 400,
                height: 350,
                draggable: true
            });
        };
        
        // Request parameters
        params = {
            action : "getJP2Header",
            file   : filepath + "/" + filename,
            server : server
        };
        
        $.post("api/index.php", params, callback, "json");
    },
    
    /**
     * @description Initialize custom tooltips for each icon in the accordion
     */
    _setupTooltips: function (id) {
        this.controller.tooltips.createTooltip($("#visibilityBtn-tile-" + id + ", #removeBtn-tile-" + id));
    },
    
    /**
     * @description Unbinds event-hanlders relating to accordion header tooltips
     * @param {String} id
     */
    _removeTooltips: function (id) {
        $("#visibilityBtn-" + id).qtip("destroy");
        $("#removeBtn-"     + id).qtip("destroy");
    },

    
    /**
     * @description Updates the displayed timestamp for a given tile layer
     * @param {Object} layer The layer being updated
     */
    updateTimeStamp: function (id, date) {
        var domNode, date, timeDiff, timestep;
        
        //date     = new Date(getUTCTimestamp(dateString));
        timeDiff = (date.getTime() - this.controller.timeControls.getTimestamp()) / 1000;
        timestep = this.controller.timeIncrementSecs;
        
        domNode = $("#" + id).find('.timestamp').html(date.toUTCDateString() + " " + date.toUTCTimeString());
        domNode.removeClass("timeAhead timeBehind timeSignificantlyOff");
        
        if (Math.abs(timeDiff) > (4 * timestep)) {
            domNode.addClass("timeSignificantlyOff");
        }
        else if (timeDiff < 0) {
            domNode.addClass("timeBehind");
        }
        else if (timeDiff > 0) {
            domNode.addClass("timeAhead");
        }
    }
});

