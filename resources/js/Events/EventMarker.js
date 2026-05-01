/**
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:kasim.n.percinel@nasa.gov">Kasim Necdet Percinel</a>
 * @fileoverview Contains the class definition for an EventMarker class.
 * @see EventLayer
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, getUTCTimestamp */
// "use strict";

import { createRoot } from "react-dom/client";
import React from "react";
import EventViewer from "./EventViewer";
import { renderToString } from "react-dom/server";

// Marker pin icon is 24x38 px. Offsets place the tip of the pin at the event point:
// X = half-width (centers icon horizontally), Y = full height (anchors tip at bottom).
const MARKER_OFFSET_X = 12;
const MARKER_OFFSET_Y = 38;

var EventMarker = Class.extend(
  /** @lends EventMarker.prototype */
  {
    /**
     * @constructs
     * @description Creates an EventMarker
     * @param {JSON} eventGlossary
     * @param {string} parentFRM
     * @param {JSON} event Event details
     * @param {integer} zIndex, zIndex as you know, visibility hierarchy of this marker in html
     * @param {boolean} labelVisible, set if the labels of this marker is hidden
     * @param {boolean} markerVisible, set if the marker is visible
     */
    init: function (eventGlossary, parentFRM, event, zIndex, labelVisible, markerVisible) {
      $.extend(this, event);
      this.event = event;
      this.behindSun = false;
      this.parentFRM = parentFRM;
      this._popupVisible = false;
      this._zIndex = zIndex;
      this._eventGlossary = eventGlossary;
      this._uniqueId = Math.random().toString().substring(2);

      // Format LabelText (for mouse-over and "d")
      this.formatLabels();

      // Create DOM nodes for Event Regions and Event Markers
      this.createRegion(0);
      this.createMarker(zIndex);

      // Create the DOM of this marker, and set the visibility
      this.setVisibility(markerVisible);
      this.setLabelVisibility(labelVisible);

      $(document).bind("replot-event-markers", $.proxy(this.refresh, this));
    },

    /**
     * Returns true if this event data contains footprint polygon information
     * footprint is an array of polygons, where each polygon is an array of [x, y] HPC coordinates
     */
    hasFootprint: function () {
      return this.hasOwnProperty("footprint") && Array.isArray(this.footprint) && this.footprint.length > 0;
    },

    /**
     * @description Creates the marker pin icon and adds it to the viewport.
     *              The marker is positioned differently depending on whether
     *              the event has a polygon region (bounding box) or not.
     *
     * @param {integer} zIndex - CSS z-index for layering markers in the DOM
     *
     * COORDINATE SYSTEM:
     * - hv_hpc_x, hv_hpc_y: Helioprojective Cartesian coordinates (arcseconds from Sun center)
     * - imageScale: Current zoom level (arcseconds per pixel)
     *
     * SCALING FORMULA:
     * - screenPixels = arcseconds / imageScale
     * - Y is negated (screen Y grows downward, HPC Y grows upward)
     * - Re-runs on zoom via refresh(), so positions track imageScale changes
     *
     * MARKER OFFSET:
     * - MARKER_OFFSET_X / MARKER_OFFSET_Y position the marker pin's tip at the event location
     * - The marker icon is 24x38 pixels, so offset centers the tip at bottom-center
     */
    createMarker: function (zIndex) {
      var markerURL;

      // Create event marker DOM node (the pin icon)
      this.eventMarkerDomNode = $("<div/>");
      this.eventMarkerDomNode.attr({
        class: "event-marker constant-size"
      });

      // Sanitize the event ID for use in DOM (remove special characters)
      var id = this.id;
      id = id.replace(/ivo:\/\/helio-informatics.org\//g, "");
      id = id.replace(/\(|\)|\.|\:/g, "");

      const eventMarkerTestId = "event-marker-" + (this.event.short_label ?? this.event.label);

      this.eventMarkerDomNode.attr({
        rel: id,
        id: "marker_" + id,
        "data-testid": eventMarkerTestId.replaceAll("\n", "")
      });

      // Calculate marker position based on whether event has a footprint polygon
      if (this.hasFootprint()) {
        // EVENT HAS FOOTPRINT POLYGON
        // Position marker at the centroid (center) of the footprint

        // imageScale: Current view's image scale (arcsec/pixel)
        let imageScale = Helioviewer.userSettings.settings.state.imageScale;

        // Calculate centroid of all footprint points
        // Centroid = average of all polygon vertices in HPC coordinates
        // footprint is an array of {x, y} point objects
        let totalX = 0, totalY = 0;

        this.footprint.forEach((point) => {
          // point.x = x in arcseconds, point.y = y in arcseconds
          totalX += point.x;
          totalY += point.y;
        });

        // Calculate centroid in HPC arcseconds
        let centroidX = totalX / this.footprint.length;
        let centroidY = totalY / this.footprint.length;

        // Convert centroid to screen pixels
        // Negate Y because screen Y is inverted (positive down)
        var markerX = Math.round(centroidX / imageScale);
        var markerY = Math.round(-centroidY / imageScale);

        // Apply pin icon offset to position tip at centroid
        this.pos = {
          x: markerX - MARKER_OFFSET_X,
          y: markerY - MARKER_OFFSET_Y
        };
      } else {
        // EVENT WITHOUT FOOTPRINT - Simple point marker
        // Position directly at hv_hpc_x, hv_hpc_y coordinates

        // hv_hpc_x: X position in arcseconds (positive = West/right)
        // hv_hpc_y: Y position in arcseconds (positive = North/up, hence negated for screen coords)
        this.pos = {
          x: Math.round(this.hv_hpc_x / Helioviewer.userSettings.settings.state.imageScale) - MARKER_OFFSET_X,
          y: Math.round(-this.hv_hpc_y / Helioviewer.userSettings.settings.state.imageScale) - MARKER_OFFSET_Y
        };
      }

      // Set marker icon based on event type (AR, FL, CH, etc.)
      markerURL =
        serverSettings["rootURL"] + "/resources/images/eventMarkers/" + this.type.toUpperCase() + "@2x" + ".png";

      // Apply position and styling to marker DOM node
      this.eventMarkerDomNode.css({
        left: this.pos.x + "px",
        top: this.pos.y + "px",
        "z-index": zIndex,
        "background-image": "url('" + markerURL + "')"
        // Additional styles found in events.css
      });

      // Append marker to parent FRM (Feature Recognition Method) container
      if (typeof this.parentFRM != "undefined") {
        this.parentFRM.append(this.eventMarkerDomNode);
      } else {
        return;
      }

      // Bind event handlers for marker interaction
      this.eventMarkerDomNode.bind("click", $.proxy(this.toggleEventPopUp, this));
      this.eventMarkerDomNode.mouseenter($.proxy(this.toggleEventLabel, this));
      this.eventMarkerDomNode.mouseleave($.proxy(this.toggleEventLabel, this));
    },

    /**
     * @description Creates the polygon region overlay for events that have footprint data.
     *              The region is rendered as an SVG polygon directly from HPC coordinates.
     *
     * @param {integer} zIndex - CSS z-index for layering regions in the DOM
     *
     * HOW SVG FOOTPRINT RENDERING WORKS:
     * 1. The API provides footprint as an array of polygons
     * 2. Each polygon is an array of [x, y] points in HPC coordinates (arcseconds)
     * 3. We convert HPC coordinates to screen pixels and render as SVG polygons
     *
     * DATA STRUCTURE:
     * event.footprint = [
     *   [                           // First polygon
     *     [x1, y1],                 // Point 1: HPC coordinates in arcseconds
     *     [x2, y2],                 // Point 2
     *     [x3, y3],                 // Point 3
     *     ...
     *   ],
     *   [                           // Second polygon (if any)
     *     [x1, y1],
     *     ...
     *   ]
     * ]
     *
     * COORDINATE CONVERSION:
     * - HPC X (arcseconds) -> Screen X (pixels): x / imageScale
     * - HPC Y (arcseconds) -> Screen Y (pixels): -y / imageScale (negated because screen Y is inverted)
     *
     * ADVANTAGE OVER PNG:
     * - No pre-rendered images needed
     * - Can be updated dynamically for differential rotation
     * - Smaller data transfer (coordinates vs image)
     * - Scalable without quality loss
     */
    createRegion: function (zIndex) {
      // Only create region if event has footprint polygon data
      if (this.hasFootprint()) {
        // imageScale: Current view's zoom level (arcsec/pixel)
        // Used to convert HPC arcseconds to screen pixels
        let imageScale = Helioviewer.userSettings.settings.state.imageScale;

        // Sanitize the event ID for use in DOM (remove special characters)
        var id = this.id;
        id = id.replace(/ivo:\/\/helio-informatics.org\//g, "");
        id = id.replace(/\(|\)|\.|\:/g, "");

        // Create SVG namespace element for proper SVG rendering
        const svgNS = "http://www.w3.org/2000/svg";
        let svg = document.createElementNS(svgNS, "svg");

        // Set SVG attributes
        svg.setAttribute("class", "event-region");
        svg.setAttribute("id", "region_" + id);
        svg.setAttribute("rel", id);
        svg.style.position = "absolute";
        svg.style.overflow = "visible";
        svg.style.zIndex = zIndex;
        svg.style.pointerEvents = "none"; // Allow clicks to pass through to markers

        // Calculate bounding box from all footprint points to position the SVG
        // footprint is an array of {x, y} point objects
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        this.footprint.forEach((point) => {
          // Convert HPC coordinates to screen pixels
          // point.x = x in arcseconds, point.y = y in arcseconds
          let screenX = point.x / imageScale;
          let screenY = -point.y / imageScale; // Negate Y for screen coordinates

          minX = Math.min(minX, screenX);
          minY = Math.min(minY, screenY);
          maxX = Math.max(maxX, screenX);
          maxY = Math.max(maxY, screenY);
        });

        // Position SVG at the bounding box origin
        svg.style.left = minX + "px";
        svg.style.top = minY + "px";
        svg.style.width = (maxX - minX) + "px";
        svg.style.height = (maxY - minY) + "px";

        // Store region position for refresh calculations
        this.region_pos = { x: minX, y: minY };

        // Convert footprint points to SVG points string
        // Points are relative to SVG origin (minX, minY)
        let pointsStr = this.footprint.map((point) => {
          let screenX = point.x / imageScale - minX;
          let screenY = -point.y / imageScale - minY;
          return `${screenX},${screenY}`;
        }).join(" ");

        // Create SVG polygon element
        let svgPolygon = document.createElementNS(svgNS, "polygon");
        svgPolygon.setAttribute("points", pointsStr);
        svgPolygon.setAttribute("class", "event-region-polygon");

        // Styling mirrors the legacy backend HEK polygon renderer:
        // fill: event-type color at 0x66 (0.4) alpha, stroke: black at 0x88 (0.533) alpha, 4px round joins.
        let baseColor = EventLoader.getEventTypeColor(this.type);
        svgPolygon.style.fill = hexToRgba(baseColor, 0.4);
        svgPolygon.style.stroke = "rgba(0, 0, 0, 0.533)";
        svgPolygon.style.strokeWidth = "1.5px";
        svgPolygon.style.strokeLinejoin = "round";

        svg.appendChild(svgPolygon);

        // Store reference to SVG element
        this.eventRegionDomNode = $(svg);

        // Append region to parent FRM (Feature Recognition Method) container
        if (typeof this.parentFRM != "undefined") {
          this.parentFRM.append(this.eventRegionDomNode);
        }
      }
    },

    /**
     * @description Choses the text to display in the details label based on the type of event
     * @param {String} eventType The type of event for which a label is being created
     */
    formatLabels: function () {
      var self = this;

      if (this.hasOwnProperty("label") && Object.keys(this.label).length > 0) {
        this.labelText = "";

        let labels = this.label.split("\n");
        labels.forEach((line) => {
          self.labelText += self.fixTitles(line) + "<br/>\n";
        });
      }
    },

    /**
     * @description Removes the Event Marker (and Event Region)
     */
    remove: function () {
      this.eventMarkerDomNode.qtip("destroy");
      this.eventMarkerDomNode.unbind();
      this.eventMarkerDomNode.remove();

      if (this.hasFootprint()) {
        this.eventRegionDomNode.qtip("destroy");
        this.eventRegionDomNode.unbind();
        this.eventRegionDomNode.remove();
      }
    },

    /**
     * @description Re-positions event markers/regions when zoom level changes.
     *              Recalculates positions from HPC coordinates using new imageScale.
     */
    refresh: function () {
      let imageScale = Helioviewer.userSettings.settings.state.imageScale;

      // Re-position Event Marker pin
      if (this.hasFootprint()) {
        // Recalculate centroid from footprint coordinates
        // footprint is an array of {x, y} point objects
        let totalX = 0, totalY = 0;

        this.footprint.forEach((point) => {
          totalX += point.x;
          totalY += point.y;
        });

        let centroidX = totalX / this.footprint.length;
        let centroidY = totalY / this.footprint.length;

        var markerX = Math.round(centroidX / imageScale);
        var markerY = Math.round(-centroidY / imageScale);

        this.pos = {
          x: markerX - MARKER_OFFSET_X,
          y: markerY - MARKER_OFFSET_Y
        };
      } else {
        // Simple point marker without footprint
        this.pos = {
          x: Math.round(this.hv_hpc_x / imageScale) - MARKER_OFFSET_X,
          y: Math.round(-this.hv_hpc_y / imageScale) - MARKER_OFFSET_Y
        };
      }

      this.eventMarkerDomNode.css({
        left: this.pos.x + "px",
        top: this.pos.y + "px"
      });

      // Re-position and re-render SVG footprint region
      if (this.hasFootprint() && this.eventRegionDomNode) {
        // Calculate new bounding box for current zoom level
        // footprint is an array of {x, y} point objects
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        this.footprint.forEach((point) => {
          let screenX = point.x / imageScale;
          let screenY = -point.y / imageScale;

          minX = Math.min(minX, screenX);
          minY = Math.min(minY, screenY);
          maxX = Math.max(maxX, screenX);
          maxY = Math.max(maxY, screenY);
        });

        // Update SVG position and size
        this.region_pos = { x: minX, y: minY };
        this.eventRegionDomNode.css({
          left: minX + "px",
          top: minY + "px",
          width: (maxX - minX) + "px",
          height: (maxY - minY) + "px"
        });

        // Update polygon points in SVG
        let svgPolygon = this.eventRegionDomNode.find("polygon")[0];
        if (svgPolygon) {
          let pointsStr = this.footprint.map((point) => {
            let screenX = point.x / imageScale - minX;
            let screenY = -point.y / imageScale - minY;
            return `${screenX},${screenY}`;
          }).join(" ");

          svgPolygon.setAttribute("points", pointsStr);
        }
      }

      // Re-position Event Popup
      if (this._popupVisible) {
        this.popup_pos = {
          x: this.hv_hpc_x / imageScale + MARKER_OFFSET_X,
          y: -this.hv_hpc_y / imageScale - MARKER_OFFSET_Y
        };
        if (this.hv_hpc_x > 400) {
          this.popup_pos.x -= this.eventPopupDomNode.width() + MARKER_OFFSET_Y;
        }
        this.eventPopupDomNode.css({
          left: this.popup_pos.x + "px",
          top: this.popup_pos.y + "px"
        });
      }
    },

    /**
     * @description Creates the event marker label domnode if it is not already set
     * @returns void
     * */
    _makeLabel: function () {
      const eventLabelTestId = "event-label-" + (this.event.short_label ?? this.event.label);

      if (!this._label) {
        this._label = $("<div/>");
        this._label.hide();
        this._label.attr({
          class: "event-label",
          "data-testid": eventLabelTestId.replaceAll("\n", "")
          // Styles found in events.css
        });
        this._label.html(this.labelText);
        this._label.click(function (event) {
          event.stopImmediatePropagation();
        });
        this._label.mousedown(function (event) {
          event.stopImmediatePropagation();
        });
        this._label.dblclick(function (event) {
          event.stopImmediatePropagation();
        });
        this._label.enableSelection();

        this.eventMarkerDomNode.append(this._label);
      }
    },

    /**
     * @description create label of marker if it is not created, and sets its visibility,
     * @param {boolean} labelVisibility, hide or show
     * @return {void}
     */
    setLabelVisibility: function (labelVisibility) {
      this._makeLabel();

      if (labelVisibility === true) {
        this._labelVisible = true;
        this._label.show();
      }

      if (labelVisibility === false) {
        this._labelVisible = false;
        this._label.hide();
      }
    },

    /**
     * @description sets marker visibility,
     * @param {boolean} markerVisible, hide or show
     * @return {void}
     */
    setVisibility: function (markerVisible) {
      if (markerVisible) {
        if (this.eventRegionDomNode) {
          this.eventRegionDomNode.show();
        }
        this.eventMarkerDomNode.show();
        this._markerVisible = markerVisible;
      } else {
        if (this.eventRegionDomNode) {
          this.eventRegionDomNode.hide();
        }
        this.eventMarkerDomNode.hide();
        this._markerVisible = markerVisible;
      }
    },

    /**
     * @description shows label visibility with mouseenter and leave events, this function does not change visibility state,
     * just shows labels for temporary events and situations
     * @param {Event} event
     * @return {bool}
     */
    toggleEventLabel: function (event) {
      this._makeLabel();

      if (event.type == "mouseenter") {
        this._label.show();
        this.emphasize();

        if (
          Helioviewer.userSettings.get("state.drawers.#hv-drawer-timeline-events.open") == true &&
          timelineRes == "m"
        ) {
          var eventID = $(event.currentTarget).attr("rel");
          $(".highcharts-series > rect").hide();
          $(".highcharts-series > rect[data-eventid='" + eventID + "']").show();
        }
      }

      if (event.type == "mouseleave") {
        if (this._labelVisible == false) {
          this._label.hide();
        }
        this.deEmphasize();

        if (
          Helioviewer.userSettings.get("state.drawers.#hv-drawer-timeline-events.open") == true &&
          timelineRes == "m"
        ) {
          $(".highcharts-series > rect").show();
        }
      }

      return true;
    },

    toggleEventPopUp: function () {
      if (!this.eventPopupDomNode) {
        this._populatePopup();
      }

      if (this._popupVisible) {
        this.eventPopupDomNode.hide();
        this.eventMarkerDomNode.css("z-index", this._zIndex);
      } else {
        this.popup_pos = {
          x: this.hv_hpc_x / Helioviewer.userSettings.settings.state.imageScale + MARKER_OFFSET_X,
          y: -this.hv_hpc_y / Helioviewer.userSettings.settings.state.imageScale - MARKER_OFFSET_Y
        };
        if (this.hv_hpc_x > 400) {
          this.popup_pos.x -= this.eventPopupDomNode.width() + MARKER_OFFSET_Y;
        }
        this.eventPopupDomNode.css({
          left: this.popup_pos.x + "px",
          top: this.popup_pos.y + "px",
          "z-index": "1000"
          // Additional styles found in events.css
        });
        this.eventMarkerDomNode.css("z-index", "998");
        //$('.event-popup').hide();
        this.eventPopupDomNode.show();
      }

      this._popupVisible = !this._popupVisible;
      return true;
    },

    /**
     * @description Displays the Image meta information and properties associated with a given image
     *
     */
    _showEventInfoDialog: function () {
      var params,
        dtype,
        split,
        self = this,
        dialog = $("#event-info-dialog");

      this._buildEventInfoDialog();

      // Format numbers for human readability
      $(".event-header-value.integer").number(true);
      $(".event-header-value.float").each(function (i, num) {
        split = num.innerHTML.split(".");
        if (typeof split[1] != "undefined") {
          num.innerHTML = $.number(num.innerHTML, split[1].length);
        } else {
          num.innerHTML = $.number(num.innerHTML);
        }
      });
    },

    /**
     * @description
     *
     */
    _buildEventInfoDialog: function () {
      var dialog,
        sortBtn,
        tabs,
        html = "",
        tag,
        json,
        headingText,
        self = this;

      // Format results
      dialog = $("<div id='event-info-dialog' class='event-info-dialog' />");

      // Generate heading text from label
      const eventTypeLabel = EventLoader.getEventTypeName(this.type);
      headingText = eventTypeLabel + ": " + this.fixTitles(this.label.split("\n")[0]);

      // Render React EventViewer for all event sources (HEK, CCMC, RHESSI)
      html += renderToString(<div id={this._uniqueId}></div>);

      let hidingEmpty = false;

      function updateHiddenClasses() {
        $.each($(dialog).find("div.empty"), function (index, node) {
          if (hidingEmpty) {
            $(node).css("display", "none");
          } else {
            $(node).css("display", "block");
          }
        });
      }

      dialog
        .append(html)
        .appendTo("body")
        .dialog({
          autoOpen: true,
          title: headingText,
          minWidth: 746,
          width: 746,
          maxWidth: 746,
          height: 550,
          draggable: true,
          resizable: false,
          buttons: [
            {
              text: "Hide Empty Rows",
              class: "toggle_empty",
              click: function () {
                hidingEmpty = !hidingEmpty;

                var text = $(this).parent().find(".toggle_empty span.ui-button-text");

                updateHiddenClasses();

                if (text.html() == "Hide Empty Rows") {
                  text.html("Show Empty Rows");
                } else {
                  text.html("Hide Empty Rows");
                }
              }
            }
          ],
          create: function (event, ui) {
            dialog.css("overflow", "hidden");

            // Render React EventViewer for all event sources
            let reactContainer = dialog.find("#" + self._uniqueId);
            if (reactContainer.length == 1) {
              const root = createRoot(reactContainer[0]);
              root.render(<EventViewer views={self.views} source={self.source} onChange={updateHiddenClasses} />);
            }
          }
        });
    },

    _populatePopup: function () {
      var content = "",
        headingText = "",
        self = this;

      const eventTypeLabel = EventLoader.getEventTypeName(this.type);

      headingText = eventTypeLabel + ": " + this.fixTitles(this.label.split("\n")[0]);

      content +=
        '<div class="close-button ui-icon ui-icon-closethick" title="Close PopUp Window"></div>' +
        "\n" +
        '<h1 class="user-selectable">' +
        headingText +
        "</h1>" +
        "\n";

      if (this.event_peaktime != null && this.event_peaktime != "") {
        content +=
          '<div class="container">' +
          "\n" +
          "\t" +
          '<div class="param-container"><div class="param-label user-selectable">Peak Time:</div></div>' +
          "\n" +
          "\t" +
          '<div class="value-container"><div class="param-value user-selectable">' +
          this.event_peaktime.replace("T", " ") +
          ' <span class="dateSelector" data-tip-pisition="right" data-date-time="' +
          this.event_peaktime.replace("T", " ") +
          '">UTC</span></div>' +
          (embedView ? "" : '<div class="ui-icon ui-icon-arrowstop-1-n" title="Jump to Event Peak Time"></div></div>') +
          "\n" +
          "</div>" +
          "\n";
      }
      content +=
        '<div class="container">' +
        "\n" +
        "\t" +
        '<div class="param-container"><div class="param-label user-selectable">Start Time: </div></div>' +
        "\n" +
        "\t" +
        '<div class="value-container"><div class="param-value user-selectable">' +
        this.start.replace("T", " ") +
        ' <span class="dateSelector" data-tip-pisition="right" data-date-time="' +
        this.start.replace("T", " ") +
        '">UTC</span></div>' +
        (embedView ? "" : '<div class="ui-icon ui-icon-arrowstop-1-w" title="Jump to Event Start Time"></div></div>') +
        "\n" +
        "</div>" +
        "\n" +
        '<div class="container">' +
        "\n" +
        "\t" +
        '<div class="param-container"><div class="param-label user-selectable">End Time: </div></div>' +
        "\n" +
        "\t" +
        '<div class="value-container"><div class="param-value user-selectable">' +
        this.end.replace("T", " ") +
        ' <span class="dateSelector" data-tip-pisition="right" data-date-time="' +
        this.end.replace("T", " ") +
        '">UTC</span></div>' +
        (embedView ? "" : '<div class="ui-icon ui-icon-arrowstop-1-e" title="Jump to Event End Time"></div>') +
        "\n" +
        "</div>" +
        "\n";

      // Display label in popup
      if (this.hasOwnProperty("label") && this.label.length > 0) {
        let lines = this.label.replace("\n", " ");
        content +=
          '<div class="container">' +
          "\n" +
          "\t" +
          '<div class="param-container"><div class="param-label user-selectable">Label: </div></div>' +
          "\n" +
          "\t" +
          '<div class="value-container"><div class="param-value user-selectable">' +
          this.fixTitles(lines) +
          "</div></div>" +
          "\n" +
          "</div>" +
          "\n";
      }

      var noaaSearch = "";
      if (this.path == "HEK>>Active Region>>NOAA SWPC Observer" || this.path == "HEK>>Active Region>>HMI SHARP") {
        var eventName = this.fixTitles(this.label.split("\n")[0]);
        noaaSearch =
          '<div class="btn-label btn event-search-external text-btn" data-url=\'https://ui.adsabs.harvard.edu/#search/q="' +
          eventName +
          '"&sort=date desc\' target="_blank"><i class="fa fa-search fa-fw"></i>ADS search for ' +
          eventName +
          '<i class="fa fa-external-link fa-fw"></i></div>\
						<div style="clear:both"></div>\
						<div class="btn-label btn event-search-external text-btn" data-url="https://arxiv.org/search/?query=' +
          eventName +
          '&searchtype=all" target="_blank"><i class="fa fa-search fa-fw"></i>arXiv search for ' +
          eventName +
          '<i class="fa fa-external-link fa-fw"></i></div>\
						<div style="clear:both"></div>';
      }

      let sourceLink = "";
      if (this.hasOwnProperty("link") && this.link !== null) {
        sourceLink +=
          '\
            <div class="btn-label btn event-search-external text-btn" data-url="' +
          this.link.url +
          '" target="_blank">' +
          this.link.text +
          ' <i class="fa fa-external-link fa-fw"></i></div>\
            <div style="clear:both"></div>';
      }

      //Only add buttons to main site event pop-ups, remove buttons from k12
      if (outputType != "minimal" && this.hasOwnProperty("start") && this.hasOwnProperty("end")) {
        content +=
          '<div class="btn-container">' +
          "\n" +
          "\t" +
          '<div class="btn-label btn event-info text-btn"><i class="fa fa-info-circle fa-fw"></i> View source data</div>' +
          "\n" +
          '<div style="clear:both"></div>\n' +
          "\t" +
          (embedView
            ? ""
            : '<div class="btn-label btn event-create-movie text-btn" data-start="' +
              this.start +
              '" data-end="' +
              this.end +
              '"><i class="fa fa-video-camera fa-fw"></i> Make movie using event times and current field of view</div>') +
          "\n" +
          '<div style="clear:both"></div>\n' +
          //+       "\t"+'<div class="ui-icon ui-icon-copy btn copy-to-data" data-start="'+this.start.replace('T',' ').replace(/-/gi,'/')+'" data-end="'+this.end.replace('T',' ').replace(/-/gi,'/')+'"></div>'
          noaaSearch +
          "\t" +
          (embedView
            ? ""
            : '<div class="btn-label btn copy-to-data text-btn" data-start="' +
              this.start.replace("T", " ").replace(/-/gi, "/") +
              '" data-end="' +
              this.end.replace("T", " ").replace(/-/gi, "/") +
              '"><i class="fa fa-copy fa-fw"></i> Copy start / end times to data download</div>') +
          "\n" +
          //+       "\t"+'<div class="ui-icon ui-icon-video btn event-movie"></div><div class="btn-label btn event-movie">Generate Movie</div>'+"\n"
          '<div style="clear:both"></div>\n' +
          sourceLink +
          "</div>" +
          "\n";
      }

      this.eventPopupDomNode = $("<div/>");
      this.eventPopupDomNode.hide();
      this.eventPopupDomNode.attr({
        class: "event-popup constant-size"
      });

      this.eventPopupDomNode.html(content);

      // Event bindings
      this.eventPopupDomNode.find(".ui-icon-arrowstop-1-w").bind("click", function () {
        helioviewerWebClient.timeControls.setDate(new Date(self.start + ".000Z"));
      });
      this.eventPopupDomNode.find(".ui-icon-arrowstop-1-n").bind("click", function () {
        helioviewerWebClient.timeControls.setDate(new Date(self.event_peaktime + ".000Z"));
      });
      this.eventPopupDomNode.find(".ui-icon-arrowstop-1-e").bind("click", function () {
        helioviewerWebClient.timeControls.setDate(new Date(self.end + ".000Z"));
      });
      this.eventPopupDomNode.find(".event-movie").bind("click", function () {
        alert("Event-based movie generation not yet implemented.");
      });
      this.eventPopupDomNode.find(".copy-to-data").bind("click", function () {
        var start = $(this).data("start");
        var end = $(this).data("end");

        var startArr = start.split(" ");
        var endArr = end.split(" ");

        //Set dates
        if (Helioviewer.userSettings.get("state.drawers.#hv-drawer-data.open") == false) {
          helioviewerWebClient.drawerDataClick(true);
        }
        $("#vso-start-date, #sdo-start-date").val(startArr[0]);
        $("#vso-start-time, #sdo-start-time").val(startArr[1]).change();
        $("#vso-end-date, #sdo-end-date").val(endArr[0]);
        $("#vso-end-time, #sdo-end-time").val(endArr[1]).change();
      });

      //Create Movie from event popup
      this.eventPopupDomNode.find(".event-create-movie").bind("click", function () {
        var start = $(this).data("start").replace(" ", "T") + ".000Z";
        var end = $(this).data("end").replace(" ", "T") + ".000Z";

        //build an movie settings object
        var formSettings = [
          { name: "speed-method", value: "framerate" },
          { name: "framerate", value: 15 },
          { name: "startTime", value: start },
          { name: "endTime", value: end }
        ];

        helioviewerWebClient._movieManagerUI.requestQueueMovie(formSettings);
      });

      this.eventPopupDomNode.find(".event-search-external").bind("click", function () {
        var url = $(this).data("url");
        window.open(url, "_blank");
      });
      this.eventPopupDomNode.find(".btn.event-info").bind("click", $.proxy(this._showEventInfoDialog, this));
      this.eventPopupDomNode.find(".close-button").bind("click", $.proxy(this.toggleEventPopUp, this));
      this.eventPopupDomNode.bind("mousedown", function () {
        return false;
      });
      this.eventPopupDomNode.bind("dblclick", function () {
        return false;
      });
      this.eventPopupDomNode.draggable();

      // Allow text selection (prevent drag where text exists)
      this.eventPopupDomNode.find("h1, .param-label, .param-value, .btn-container .btn").click(function (event) {
        event.stopImmediatePropagation();
      });
      this.eventPopupDomNode.find("h1, .param-label, .param-value, .btn-container .btn").mousedown(function (event) {
        event.stopImmediatePropagation();
      });
      this.eventPopupDomNode.find("h1, .param-label, .param-value, .btn-container .btn").dblclick(function (event) {
        event.stopImmediatePropagation();
      });
      this.eventPopupDomNode.find("h1, .param-label, .param-value").enableSelection();

      this.parentFRM.append(this.eventPopupDomNode);
      helioviewerWebClient._timeSelector = new TimeSelector();
    },

    fixTitles: function (s) {
      if (!s) {
        return "";
      }
      s = s.replace(/u03b1/g, "α");
      s = s.replace(/u03b2/g, "β");
      s = s.replace(/u03b3/g, "γ");
      s = s.replace(/u00b1/g, "±");
      s = s.replace(/u00b2/g, "²");

      return s;
    },

    /**
     * Emphasize label of the marker and highlight the footprint region,
     */
    emphasize: function () {
      this.eventMarkerDomNode.css("zIndex", "997");
      this._label.addClass("event-label-hover");

      if (this.hasFootprint() && this.eventRegionDomNode) {
        let baseColor = EventLoader.getEventTypeColor(this.type);
        let polygon = this.eventRegionDomNode.find("polygon")[0];
        if (polygon) {
          polygon.style.fill = hexToRgba(baseColor, 0.6);
          polygon.style.stroke = "rgba(0, 0, 0, 0.8)";
          polygon.style.strokeWidth = "3px";
          polygon.style.strokeLinejoin = "round";
        }
      }
    },

    /**
     * deEmphasize label of the marker and restore the footprint region,
     */
    deEmphasize: function () {
      this.eventMarkerDomNode.css("zIndex", this._zIndex);
      this._label.removeClass("event-label-hover");

      if (this.hasFootprint() && this.eventRegionDomNode) {
        let baseColor = EventLoader.getEventTypeColor(this.type);
        let polygon = this.eventRegionDomNode.find("polygon")[0];
        if (polygon) {
          polygon.style.fill = hexToRgba(baseColor, 0.4);
          polygon.style.stroke = "rgba(0, 0, 0, 0.533)";
          polygon.style.strokeWidth = "1.5px";
          polygon.style.strokeLinejoin = "round";
        }
      }
    },

    /**
     * Checks if the marker belongs to given FRM,
     * @param {string} frmName, name of FRM, internally handles underscored frmNames as well
     * @returns {booelan}
     */
    belongsToFrm: function (frmName) {
      // Usually frmNames has _ for space
      let frmNameNonUnderScored = frmName.replaceAll("_", " ");
      return this.event.name == frmName || this.event.name == frmNameNonUnderScored;
    },

    /**
     * Checks if the marker belongs to event type,
     * @param {string} eventType, event type is the pin of event data
     * @returns {booelan}
     */
    belongsToEventType: function (eventType) {
      return this.event.pin == eventType;
    }
  }
);

export { EventMarker };
