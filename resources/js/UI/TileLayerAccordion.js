/**
 * @fileOverview Contains the class definition for an TileLayerAccordion class.
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
var TileLayerAccordion = Layer.extend(
    /** @lends TileLayerAccordion.prototype */
    {
    /**
     * Creates a new Tile Layer accordion user interface component
     *
     * @param {Object} tileLayers Reference to the application layer manager
     * @param {String} containerId ID for the outermost continer where the layer
     *                 manager user interface should be constructed
     */
    init: function (containerId, dataSources, observationDate) {
        this.container        = $(containerId);
        this._dataSources     = dataSources;
        this._observationDate = observationDate;
        this._maximumTimeDiff = 12 * 60 * 60 * 1000; // 12 hours (milliseconds)

        this.options = {};

        // Setup menu UI components
        this._setupUI();

        // Initialize accordion
        this.domNode = $('#TileLayerAccordion-Container');
        this.domNode.dynaccordion({startClosed: false});


        // Event-handlers
        $(document).bind("create-tile-layer-accordion-entry",
                        $.proxy(this.addLayer, this))
                   .bind("update-tile-layer-accordion-entry",
                        $.proxy(this._updateAccordionEntry, this))
                   .bind("observation-time-changed",
                        $.proxy(this._onObservationTimeChange, this));

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
     * Adds a new entry to the tile layer accordion
     *
     * @param {Object} layer The new layer to add
     */
    addLayer: function (event, index, id, name, sourceId, hierarchy, date, startOpened,
        opacity, visible, onOpacityChange) {

        if (typeof(index) === "undefined") {
            index = 1000;
        }

        this._createAccordionEntry(index, id, name, sourceId, visible, startOpened);

        this._initTreeSelect(id, hierarchy);
        this._initOpacitySlider(id, opacity, onOpacityChange);
        this._setupEventHandlers(id);
        this._updateTimeStamp(id, date);
    },

    /**
     *
     */
    _createAccordionEntry: function (index, id, name, sourceId, visible, startOpened) {
        var visibilityBtn, removeBtn, hidden, head, body;

        // initial visibility
        hidden = (visible ? "fa fa-eye fa-fw layerManagerBtn visible" : "fa fa-eye-slash fa-fw layerManagerBtn visible hidden");

        visibilityBtn = '<span class="'
                      + hidden + '" '
                      + 'id="visibilityBtn-' + id + '" '
                      + 'title="Toggle Image Layer Visibility" '
                      + '></span>';

        removeBtn = '<span class="fa fa-times-circle fa-fw removeBtn" '
                  + 'id="removeBtn-' + id + '" '
                  + 'title="Remove Image Layer" '
                  + '></span>';

        head = '<div class="layer-Head ui-accordion-header ui-helper-reset ui-state-default ui-corner-all">'
             +     '<div class="tile-accordion-header-left" '
             +           'title="' + name + '" data-sourceid="'+sourceId+'">'
             +         name
             +     '</div>'
             +     '<div class="right">'
             +         '<span class="timestamp user-selectable"></span>'
             +         visibilityBtn
             +         removeBtn
             +     '</div>'
             + '</div>';

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
    _initTreeSelect: function (id, hierarchy) {
        var ids      = new Array(),
            selected = new Array(),
            letters  = ['a','b','c','d','e'],
            self     = this;

        $.each( letters, function (i, letter) {
            ids.push('#'+letter+'-select-'+id);
            if (typeof hierarchy != 'undefined' && typeof hierarchy[i] != 'undefined') {
                selected[i] = hierarchy[i]['name'];
            }
            else {
                selected[i] = null;
            }
        });

        this.selectMenus = new TreeSelect(ids, this._dataSources, selected,
            function (leaf) {
                var hierarchySelected = Array();
                $.each(leaf['uiLabels'], function (i, obj) {
                    hierarchySelected[i] = {
                        'label': obj['label'],
                        'name' : obj['name'] };
                });

                $(document).trigger("tile-layer-data-source-changed",
                    [id, hierarchySelected, leaf.sourceId, leaf.nickname,
                     leaf.layeringOrder]);
            }
        );
    },

    /**
     *
     */
    _initOpacitySlider: function (id, opacity, onOpacityChange) {
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
                $(document).trigger("save-tile-layers");
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
        var hierarchy, display, info, jp2, label, letters, opacitySlide,
            popups='', body;

        // Opacity slider placeholder
        opacitySlide  = '<div class="layer-select-label">Opacity: </div>'
                      + '<div class="opacity-slider-track" '
                      +      'id="opacity-slider-track-' + id + '">'
                      + '</div>';

        // Default labels
        letters = ['a','b','c','d','e'];
        hierarchy = Helioviewer.userSettings._defaults.state.tileLayers[0]['uiLabels'];
        $.each(letters, function (i, letter) {
            if ( typeof hierarchy[i]          != 'undefined' &&
                 typeof hierarchy[i]['label'] != 'undefined' ) {

                display = '';
                label = hierarchy[i]['label']+': ';
            }
            else {
                display = 'display: none;';
                label = '';
            }
            popups += '<div style="' + display + '" '
                   +       'class="layer-select-label" '
                   +       'id="' + letter + '-label-' + id +'">'
                   +     label
                   +  '</div> '
                   +  '<select style="' + display + '" '
                   +          'name="' + letter + '" '
                   +          'class="layer-select" '
                   +          'id="' + letter + '-select-' + id + '">'
                   +  '</select>';
        });

        jp2 = '<div id="image-' + id + '-download-btn" '
            +       'class="image-download-btn fa fa-file-image-o fa-fw" '
            +       'title="Download full JPEG 2000 image (grayscale)."'
            +       'style="position: absolute; top: 1.8em; right: 0;">'
            + '</div>';

        info = '<div id="image-' + id + '-info-btn" '
             +       'class="image-info-dialog-btn fa fa-h-square fa-fw" '
             +       'title="Display FITS image header."'
             +       'style="position: absolute; top: 0.2em; right: 0;">'
             + '</div>';

        body = '<div style="position: relative; margin-bottom: 1em;">'
             + jp2
             + info
             + opacitySlide
             + popups
             + '</div>';

        return (body);
    },

    /**
     * @description Handles setting up an empty tile layer accordion.
     */
    _setupUI: function () {
        // Event-handlers
        $('#add-new-tile-layer-btn').click(function () {
            var accordionClosed;

            $(document).trigger("add-new-tile-layer");

            accordionClosed = $('#accordion-images .disclosure-triangle').hasClass('closed');
            if ( accordionClosed ) {
                $('#accordion-images .disclosure-triangle').click();
            }
        });
    },

    /**
     * @description Sets up event-handlers for a TileLayerAccordion entry
     * @param {Object} layer The layer being added
     */
    _setupEventHandlers: function (id) {
        var toggleVisibility, opacityHandle, removeLayer, self = this,
            visibilityBtn = $("#visibilityBtn-" + id),
            removeBtn     = $("#removeBtn-" + id),
            timestamps    = $("#accordion-images .timestamp");

        // Function for toggling layer visibility
        toggleVisibility = function (e) {
            $(document).trigger("toggle-layer-visibility", [id]);
            $("#visibilityBtn-" + id).toggleClass('hidden');
            $("#visibilityBtn-" + id).toggleClass('fa-eye');
            $("#visibilityBtn-" + id).toggleClass('fa-eye-slash');
            $(document).trigger("save-tile-layers");
            e.stopPropagation();
        };

        // Function for handling layer remove button
        removeLayer = function (e) {
            $(document).trigger("remove-tile-layer", [id]);
            self._removeTooltips(id);
            self.domNode.dynaccordion('removeSection', {id: id});
            $(document).trigger("save-tile-layers");
            e.stopPropagation();
        };

        // Fix drag and drop for mobile browsers\
        opacityHandle = $("#" + id + " .ui-slider-handle")[0];
        assignTouchHandlers(opacityHandle);

        visibilityBtn.bind('click', this, toggleVisibility);
        removeBtn.bind('click', removeLayer);
        timestamps.bind('click', function(e) {
            e.stopPropagation();
        });
    },

    /**
     * @description Displays the Image meta information and properties associated with a given image
     * @param {Object} layer
     */
    _showImageInfoDialog: function (id, name, imageId) {
        var params, dtype, self = this, dialog = $("#image-info-dialog-" + id);

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

        // Request parameters
        params = {
            action : "getJP2Header",
            id     : imageId
        };

        // For remote queries, retrieve XML using JSONP
        if (Helioviewer.dataType === "jsonp") {
            dtype = "jsonp text xml";
        } else {
            dtype = "xml";
        }

        $.get(Helioviewer.api, params, function (response) {
            self._buildImageInfoDialog(name, id, response);
        }, dtype);
    },

    /**
     * Creates a dialog to display image properties and header tags
     */
    _buildImageInfoDialog: function (name, id, response) {
        var dialog, sortBtn, tabs, html, tag, json;

        // Convert from XML to JSON
        json = $.xml2json(response);

        // Format results
        dialog =  $("<div id='image-info-dialog-" + id +  "' class='image-info-dialog' />");

        // Header section
        html = "<div class='image-info-dialog-menu'>" +
               "<a class='show-fits-tags-btn selected'>[FITS]</a>" +
               "<a class='show-helioviewer-tags-btn'>Helioviewer</a>" +
               "<span class='image-info-sort-btn'>Abc</span>" +
               "</div>";

        // Separate out Helioviewer-specific tags if not already done
        //(older data may have HV_ tags mixed in with FITS tags)
        if (!json.helioviewer) {
            json.helioviewer = {};

            $.each(json.fits, function (key, value) {
                if (key.substring(0, 3) === "HV_") {
                    json.helioviewer[key.slice(3)] = value;
                    delete json.fits[key];
                }
            });
        }

        // Add FITS and Helioviewer header tag blocks
        html += "<div class='image-header-fits'>"        + this._generateImageKeywordsSection(json.fits) + "</div>" +
                "<div class='image-header-helioviewer' style='display:none;'>" +
                this._generateImageKeywordsSection(json.helioviewer) + "</div>";

        dialog.append(html).appendTo("body").dialog({
            autoOpen : true,
            title    : "Image Information: " + name,
            minWidth : 546,
            width    : 546,
            height   : 350,
            draggable: true,
            create   : function (event, ui) {
                var fitsBtn = dialog.find(".show-fits-tags-btn"),
                    hvBtn   = dialog.find(".show-helioviewer-tags-btn"),
                    sortBtn = dialog.find(".image-info-sort-btn");

                fitsBtn.click(function () {
                    fitsBtn.html("[FITS]");
                    hvBtn.html("Helioviewer");
                    dialog.find(".image-header-fits").show();
                    dialog.find(".image-header-helioviewer").hide();
                });

                hvBtn.click(function () {
                    fitsBtn.html("FITS");
                    hvBtn.html("[Helioviewer]");
                    dialog.find(".image-header-fits").hide();
                    dialog.find(".image-header-helioviewer").show();
                });

                // Button to toggle sorting
                sortBtn.click(function () {
                    var sorted = !$(this).hasClass("italic");
                    $(this).toggleClass("italic");

                    if (sorted) {
                        dialog.find(".unsorted").css('display', 'none');
                        dialog.find(".sorted").css('display', 'block');
                    } else {
                        dialog.find(".sorted").css('display', 'none');
                        dialog.find(".unsorted").css('display', 'block');
                    }
                });

            }
        });
    },

    /**
     * Takes a JSON list of image header tags and returns sorted/unsorted HTML
     */
    _generateImageKeywordsSection: function (list) {
        var unsorted, sortFunction, sorted, tag, tags = [];

        // Unsorted list
        unsorted = "<div class='unsorted'>";
        $.each(list, function (key, value) {
            tag = "<span class='image-header-tag'>" + key + ": </span>" +
                  "<span class='image-header-value'>" + value + "</span>";
            tags.push(tag);
            unsorted += tag + "<br>";
        });
        unsorted += "</div>";

        // Sort function
        sortFunction = function (a, b) {
            // <span> portion is 31 characters long
            if (a.slice(31) < b.slice(31)) {
                return -1;
            } else if (a.slice(31) > b.slice(31)) {
                return 1;
            }
            return 0;
        };

        // Sorted list
        sorted = "<div class='sorted' style='display: none;'>";
        $.each(tags.sort(sortFunction), function () {
            sorted += this + "<br>";
        });
        sorted += "</div>";

        return unsorted + sorted;
    },

    /**
     * @description Unbinds event-handlers relating to accordion header tooltips
     * @param {String} id
     */
    _removeTooltips: function (id) {
        $("#" + id + " *[oldtitle]").qtip("destroy");
    },

    /**
     * Keeps track of requested date to use when styling timestamps
     */
    _onObservationTimeChange: function (event, requestDate) {
        var actualDate, weight, domNode, self = this;

        this._observationDate = requestDate;

        // Update timestamp colors
        $("#TileLayerAccordion-Container .timestamp").each(function (i, item) {
            domNode    = $(this);
            actualDate = new Date(getUTCTimestamp(domNode.text()));
            weight = self._getScaledTimeDifference(actualDate, requestDate);
            domNode.css("color", self._chooseTimeStampColor(weight, 0, 0, 0));
        });
    },

    /**
     *
     */
    _updateAccordionEntry: function (event, id, name, sourceId, opacity, date, imageId,
        hierarchy) {

        var entry=$("#"+id), self=this, letters=['a','b','c','d','e'],
            label, select;

        this._updateTimeStamp(id, date);

        entry.find(".tile-accordion-header-left").html(name);
        entry.find(".tile-accordion-header-left").attr('title', name);
        entry.find(".tile-accordion-header-left").attr('data-sourceid', sourceId);

        $.each( letters, function(i, letter) {
            label  = entry.find("#"+letters[i]+"-label-"+id);
            select = entry.find("#"+letters[i]+"-select-"+id);
            if ( typeof hierarchy != 'undefined' && typeof hierarchy[i] != 'undefined' ) {
                label.html(hierarchy[i]['label']+':').show();
                select.show();
            }
            else {
                label.empty().hide();
                select.empty().hide();
            }
        });

        // Refresh Image header event listeners
        $("#image-info-dialog-" + id).remove();

        entry.find("#image-" + id + "-info-btn").unbind().bind('click',
            function () {
                self._showImageInfoDialog(id, name, imageId);
            });

        // JPEG 2000 download button
        $("#image-" + id + "-download-btn").unbind().bind('click', function () {
            window.open(Helioviewer.api + "?action=getJP2Image&id=" + imageId);
            return false;
        });

        $(document).trigger('update-external-datasource-integration');
    },

    /**
     * @description Updates the displayed timestamp for a given tile layer
     * @param {Object} layer The layer being updated
     */
    _updateTimeStamp: function (id, date) {
        var weight = this._getScaledTimeDifference(date, this._observationDate);

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

