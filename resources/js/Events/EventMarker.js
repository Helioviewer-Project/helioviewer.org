/**
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @fileoverview Contains the class definition for an EventMarker class.
 * @see EventLayer
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, getUTCTimestamp */
"use strict";
var EventMarker = Class.extend(
    /** @lends EventMarker.prototype */
    {
    /**
     * @constructs
     * @description Creates an EventMarker
     * @param {Object} eventLayer EventLayer associated with the EventMarker
     * @param {JSON} event Event details
     */
    init: function (eventGlossary, parentFRM, event, zIndex) {
        $.extend(this, event);
        this.event = event;
        this.behindSun = false;
        this.parentFRM  = parentFRM;
        this._labelVisible = false;
        this._popupVisible = false;
        this._zIndex = zIndex;
        this._eventGlossary = eventGlossary;

        // Format LabelText (for mouse-over and "d")
        this.formatLabels();

        // Create DOM nodes for Event Regions and Event Markers
        this.createRegion(0);
        this.createMarker(zIndex);

        $(document).bind("replot-event-markers",   $.proxy(this.refresh, this));
        $(document).bind('toggle-event-label-on',  $.proxy(this.toggleEventLabel, this));
        $(document).bind('toggle-event-label-off', $.proxy(this.toggleEventLabel, this));
    },

    /**
     * Returns true if this event data contains polygon information
     */
    hasBoundingBox: function () {
        return this.hasOwnProperty('hpc_boundcc') && this.hpc_boundcc != '';
    },

    /**
     * @description Creates the marker and adds it to the viewport
     */
    createMarker: function (zIndex) {
        var markerURL;

        // Create event marker DOM node
        this.eventMarkerDomNode = $('<div/>');
        this.eventMarkerDomNode.attr({
            'class' : "event-marker"
        });

        var id = this.id;
        id = id.replace(/ivo:\/\/helio-informatics.org\//g, "")
        id = id.replace(/\(|\)|\.|\:/g, "");
        this.eventMarkerDomNode.attr({
            'rel' : id,
            'id' : 'marker_'+id
        });
        if ( this.hasBoundingBox() ) {
	        var polygonCenterX = (this.hv_poly_width_max_zoom_pixels * ( Helioviewer.userSettings._constraints.minImageScale / Helioviewer.userSettings.settings.state.imageScale )) / 2;
	        var polygonCenterY = (this.hv_poly_height_max_zoom_pixels * ( Helioviewer.userSettings._constraints.minImageScale / Helioviewer.userSettings.settings.state.imageScale )) / 2;

	        var scaledMarkerX = this.hv_marker_offset_x *( Helioviewer.userSettings._constraints.minImageScale / Helioviewer.userSettings.settings.state.imageScale );
	        var scaledMarkerY = this.hv_marker_offset_y *( Helioviewer.userSettings._constraints.minImageScale / Helioviewer.userSettings.settings.state.imageScale );

	        var polygonPosX = ( this.hv_poly_hpc_x_final / Helioviewer.userSettings.settings.state.imageScale);
	        var polygonPosY = ( this.hv_poly_hpc_y_final / Helioviewer.userSettings.settings.state.imageScale);

	        var markerX = Math.round(polygonPosX + polygonCenterX + scaledMarkerX);
	        var markerY = Math.round(polygonPosY + polygonCenterY + scaledMarkerY);

	        this.pos = {
	            x: markerX - 12,
	            y: markerY - 38
	        };
        }else{
	        this.pos = {
	            x: Math.round( this.hv_hpc_x / Helioviewer.userSettings.settings.state.imageScale) -12,
	            y: Math.round(-this.hv_hpc_y / Helioviewer.userSettings.settings.state.imageScale) -38
	        };
        }



        markerURL = serverSettings['rootURL']+'/resources/images/eventMarkers/'+this.type.toUpperCase()+'@2x'+'.png';
        this.eventMarkerDomNode.css({
                         'left' :  this.pos.x + 'px',
                          'top' :  this.pos.y + 'px',
                      'z-index' :  zIndex,
             'background-image' : "url('"+markerURL+"')"
            // Additional styles found in events.css
        });

        if ( typeof this.parentFRM != 'undefined' ) {
            //if ( this.parentFRM._visible == false ) {
                //this.eventMarkerDomNode.hide();
            //}
            this.parentFRM.domNode.append(this.eventMarkerDomNode);
        }
        else {
            //console.warn('this.parentFRM does not exist!');
            //console.warn([this.event_type, this.frm_name]);
            return;
        }

        this.eventMarkerDomNode.bind("click", $.proxy(this.toggleEventPopUp, this));
        this.eventMarkerDomNode.mouseenter($.proxy(this.toggleEventLabel, this));
        this.eventMarkerDomNode.mouseleave($.proxy(this.toggleEventLabel, this));
    },


    /**
     * @description Creates the marker and adds it to the viewport
     */
    createRegion: function (zIndex) {
        if ( this.hasBoundingBox() ) {
            var regionURL;

            // Create event region DOM node
            this.eventRegionDomNode = $('<div/>');
            this.eventRegionDomNode.attr({
                'class' : "event-region"
            });

            var id = this.id;
	        id = id.replace(/ivo:\/\/helio-informatics.org\//g, "")
	        id = id.replace(/\(|\)|\.|\:/g, "");
	        this.eventRegionDomNode.attr({
	            'rel' : id,
				'id' : 'region_'+id
	        });

            this.region_scaled = {
                width:  this.hv_poly_width_max_zoom_pixels * ( Helioviewer.userSettings._constraints.minImageScale / Helioviewer.userSettings.settings.state.imageScale ),
                height: this.hv_poly_height_max_zoom_pixels * ( Helioviewer.userSettings._constraints.minImageScale / Helioviewer.userSettings.settings.state.imageScale )
            }
            this.region_pos = {
                x: ( this.hv_poly_hpc_x_final / Helioviewer.userSettings.settings.state.imageScale),
                y: ( this.hv_poly_hpc_y_final / Helioviewer.userSettings.settings.state.imageScale)
            }
            this.eventRegionDomNode.css({
                             'left' :  this.region_pos.x + 'px',
                              'top' :  this.region_pos.y + 'px',
                          'z-index' :  zIndex,
                 'background-image' : "url('"+serverSettings['rootURL']
                                          + "/" + this.hv_poly_url + "')",
                  'background-size' :  this.region_scaled.width  + 'px ' + this.region_scaled.height + 'px',
                            'width' :  this.region_scaled.width  + 'px',
                           'height' :  this.region_scaled.height + 'px'
                // Additional styles found in events.css
            });
            if ( typeof this.parentFRM != 'undefined' ) {
                this.parentFRM.domNode.append(this.eventRegionDomNode);
            }

            //this.eventRegionDomNode.bind("click", $.proxy(this.toggleEventPopUp, this));
            //this.eventRegionDomNode.mouseenter($.proxy(this.toggleEventLabel, this));
            //this.eventRegionDomNode.mouseleave($.proxy(this.toggleEventLabel, this));
        }
    },


    /**
     * @description Choses the text to display in the details label based on the type of event
     * @param {String} eventType The type of event for which a label is being created
     */
    formatLabels: function () {
        var self = this;

        if ( this.hasOwnProperty('label') && Object.keys(this.label).length > 0 ) {
            this.labelText = "";

            let labels = this.label.split("\n");
            labels.forEach((line) => {
                self.labelText += self.fixTitles(line) + "<br/>\n";
            })
        }
        else {
            this.labelText = this.fixTitles(this.name) + ' ' + this.fixTitles(this.version);
        }
    },


    /**
     * @description Removes the Event Marker (and Event Region)
     */
    remove: function () {
        this.eventMarkerDomNode.qtip("destroy");
        this.eventMarkerDomNode.unbind();
        this.eventMarkerDomNode.remove();

        if ( this.hasBoundingBox() ) {
            this.eventRegionDomNode.qtip("destroy");
            this.eventRegionDomNode.unbind();
            this.eventRegionDomNode.remove();
        }
    },

     /**
      * @description Re-positions event markers/regions, re-scales event regions
      */
    refresh: function () {

        // Re-position Event Marker pin
        if ( this.hasBoundingBox()) {
	        var polygonCenterX = (this.hv_poly_width_max_zoom_pixels * ( Helioviewer.userSettings._constraints.minImageScale / Helioviewer.userSettings.settings.state.imageScale )) / 2;
	        var polygonCenterY = (this.hv_poly_height_max_zoom_pixels * ( Helioviewer.userSettings._constraints.minImageScale / Helioviewer.userSettings.settings.state.imageScale )) / 2;

	        var scaledMarkerX = this.hv_marker_offset_x *( Helioviewer.userSettings._constraints.minImageScale / Helioviewer.userSettings.settings.state.imageScale );
	        var scaledMarkerY = this.hv_marker_offset_y *( Helioviewer.userSettings._constraints.minImageScale / Helioviewer.userSettings.settings.state.imageScale );

	        var polygonPosX = this.hv_poly_hpc_x_final / Helioviewer.userSettings.settings.state.imageScale;
	        var polygonPosY = this.hv_poly_hpc_y_final / Helioviewer.userSettings.settings.state.imageScale;

	        var markerX = Math.round(polygonPosX + polygonCenterX + scaledMarkerX);
	        var markerY = Math.round(polygonPosY + polygonCenterY + scaledMarkerY);

	        this.pos = {
	            x: markerX - 12,
	            y: markerY - 38
	        };
        }else{
	        this.pos = {
	            x: Math.round( this.hv_hpc_x / Helioviewer.userSettings.settings.state.imageScale) -12,
	            y: Math.round(-this.hv_hpc_y / Helioviewer.userSettings.settings.state.imageScale) -38
	        };
        }

        this.eventMarkerDomNode.css({
            'left': this.pos.x + 'px',
            'top' : this.pos.y + 'px'
        });

        // Re-position and re-scale Event Region polygon
        if ( this.hasBoundingBox() ) {
            this.region_scaled = {
                width: this.hv_poly_width_max_zoom_pixels * ( Helioviewer.userSettings._constraints.minImageScale /   Helioviewer.userSettings.settings.state.imageScale ),
                height: this.hv_poly_height_max_zoom_pixels * ( Helioviewer.userSettings._constraints.minImageScale /   Helioviewer.userSettings.settings.state.imageScale )
            }
            this.region_pos = {
                x: ( this.hv_poly_hpc_x_final / Helioviewer.userSettings.settings.state.imageScale),
                y: ( this.hv_poly_hpc_y_final / Helioviewer.userSettings.settings.state.imageScale)
            }
            this.eventRegionDomNode.css({
                'left': this.region_pos.x + 'px',
                'top' : this.region_pos.y + 'px'
            });
            this.eventRegionDomNode.css({
                          'width' : this.region_scaled.width,
                         'height' : this.region_scaled.height,
                'background-size' : this.region_scaled.width + 'px ' + this.region_scaled.height + 'px'
                // Additional styles found in events.css
            });
        }

        // Re-position Event Popup
        if ( this._popupVisible ) {
            this.popup_pos = {
                x: ( this.hv_hpc_x / Helioviewer.userSettings.settings.state.imageScale) +12,
                y: (-this.hv_hpc_y / Helioviewer.userSettings.settings.state.imageScale) -38
            };
            if ( this.hv_hpc_x > 400 ) {
                this.popup_pos.x -= this.eventPopupDomNode.width() + 38;
            }
            this.eventPopupDomNode.css({
                'left': this.popup_pos.x + 'px',
                'top' : this.popup_pos.y + 'px'
            });
        }
    },

    setVisibility: function (visible) {
        if (visible) {
            this.eventRegionDomNode.show();
            this.eventMarkerDomNode.show();
        }
        else {
            this.eventRegionDomNode.hide();
            this.eventMarkerDomNode.hide();
        }
    },

    toggleEventLabel: function (event) {

        if ( !this._label ) {
            this._label = $('<div/>');
            this._label.hide();
            this._label.attr({
                'class' : "event-label"
                // Styles found in events.css
            });
            this._label.html(this.labelText);
            this._label.click(function(event){
                event.stopImmediatePropagation();
            });
            this._label.mousedown(function(event){
                event.stopImmediatePropagation();
            });
            this._label.dblclick(function(event){
                event.stopImmediatePropagation();
            });
            this._label.enableSelection();

            this.eventMarkerDomNode.append(this._label);
        }

        if ( event.type == 'toggle-event-label-on' ) {
            this.eventMarkerDomNode.css('zIndex', '997');
            this._labelVisible = true;
            document.getSelection().removeAllRanges();
            this._label.show();
            Helioviewer.userSettings.set("state.eventLabels", true);
        }
        else if ( event.type == 'toggle-event-label-off' ) {
            this._labelVisible = false;
            this._label.hide();
            this.eventMarkerDomNode.css('zIndex', this._zIndex);
            document.getSelection().removeAllRanges();
            Helioviewer.userSettings.set("state.eventLabels", false);
        }
        else if ( event.type == 'mouseenter' ) {
            this.eventMarkerDomNode.css('zIndex', '997');
            this._label.addClass("event-label-hover");
            this._label.show();

            if(Helioviewer.userSettings.get("state.drawers.#hv-drawer-timeline-events.open") == true && timelineRes == 'm'){
	            var eventID = $(event.currentTarget).attr('rel');
	            $(".highcharts-series > rect:not(.point_"+eventID+")").hide();
            }
        }
        else if ( event.type == 'mouseleave' ) {
            if ( !this._labelVisible) {
                this._label.hide();
            }
            this._label.removeClass("event-label-hover");
            this.eventMarkerDomNode.css('zIndex', this._zIndex);

            if(Helioviewer.userSettings.get("state.drawers.#hv-drawer-timeline-events.open") == true && timelineRes == 'm'){
	            $(".highcharts-series > rect").show();
            }
        }

        return true;
    },

    toggleEventPopUp: function () {
        if ( !this.eventPopupDomNode ) {
            this._populatePopup();
        }

        if ( this._popupVisible ) {
            this.eventPopupDomNode.hide();
            this.eventMarkerDomNode.css('z-index', this._zIndex);
        }
        else {
            this.popup_pos = {
                x: ( this.hv_hpc_x / Helioviewer.userSettings.settings.state.imageScale) +12,
                y: (-this.hv_hpc_y / Helioviewer.userSettings.settings.state.imageScale) -38
            };
            if ( this.hv_hpc_x > 400 ) {
                this.popup_pos.x -= this.eventPopupDomNode.width() + 38;
            }
            this.eventPopupDomNode.css({
                   'left' :  this.popup_pos.x + 'px',
                    'top' :  this.popup_pos.y + 'px',
                'z-index' : '1000'
                // Additional styles found in events.css
            });
            this.eventMarkerDomNode.css('z-index', '998');
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
        var params, dtype, split, self = this, dialog = $("#event-info-dialog");

        this._buildEventInfoDialog();

        // Format numbers for human readability
        $('.event-header-value.integer').number(true);
        $('.event-header-value.float').each( function (i, num) {
            split = num.innerHTML.split('.')
            if ( typeof split[1] != 'undefined' ) {
                num.innerHTML = $.number(num.innerHTML, split[1].length);
            }
            else {
                num.innerHTML = $.number(num.innerHTML);
            }

        });
    },


    /**
     * @description
     *
     */
    _buildEventInfoDialog: function () {
        var dialog, sortBtn, tabs, html='', tag, json, headingText, self=this;


        // Format results
        dialog =  $("<div id='event-info-dialog' class='event-info-dialog' />");

        if ( this.hasOwnProperty('hv_labels_formatted') && Object.keys(this.hv_labels_formatted).length > 0 ) {
            headingText = this.concept+': ' + this.fixTitles(this.hv_labels_formatted[Object.keys(this.hv_labels_formatted)[0]]);
        }
        else {
            headingText = this.category + ' ' + this.fixTitles(this.name) + ' ' + this.fixTitles(this.version);
        }

        // Header Tabs
        if (this._IsHekEvent()) {
            html += '<div class="event-info-dialog-menu">'
            +     '<a class="show-tags-btn event-type selected">'+this.category+'</a>'
            +     '<a class="show-tags-btn obs">Observation</a>'
            +     '<a class="show-tags-btn frm">Recognition Method</a>'
            +     '<a class="show-tags-btn ref">Ref<span class="hek_ref_txt1">erences</span></a>'
            +     '<a class="show-tags-btn all right">All</a>'
            + '</div>';

            // Tab contents
            let sections = [this.type, "obs", "frm", "ref", "all"];
            sections.forEach((section, idx) => {
                let content = this._generateEventKeywordsSection(section);
                if (content != "<div></div>") {
                    let class_name = idx == 0 ? "event-type" : section;
                    let hide = idx != 0 ? "display: none;" : "";
                    html += '<div class="event-header '+class_name+'" style="'+hide+' height: 400px; overflow: auto;">'
                            + content + "</div>";
                }
            })
        } else {
            html += `<div class="event-info-dialog-menu">
                        <a class="show-tags-btn all">${this.category}</a>
                     </div>
                     <div class="event-header all" style="height: 400px; overflow: auto;">
                        ${this._generateEventKeywordsSection("all")}
                     </div>`
        }


        dialog.append(html).appendTo("body").dialog({
            autoOpen : true,
            title    : headingText,
            minWidth : 746,
            width    : 746,
            maxWidth : 746,
            height   : 550,
            draggable: true,
            resizable: false,
            buttons  : [ {  text  : 'Hide Empty Rows',
                          'class' : 'toggle_empty',
                           click  : function () {

                        var text = $(this).parent().find('.toggle_empty span.ui-button-text');

                        $.each( $(this).find("div.empty"), function (index,node) {
                            if ( $(node).css('display') == 'none' ) {
                                $(node).css('display', 'block');
                            }
                            else {
                                $(node).css('display', 'none');
                            }
                        });

                        if ( text.html() == 'Hide Empty Rows' ) {
                            text.html('Show Empty Rows');
                        }
                        else {
                            text.html('Hide Empty Rows');
                        }
                }} ],
            create   : function (event, ui) {

                dialog.css('overflow', 'hidden');

                var eventTypeTab  = dialog.find(".show-tags-btn.event-type"),
                    obsTab        = dialog.find(".show-tags-btn.obs"),
                    frmTab        = dialog.find(".show-tags-btn.frm"),
                    refTab        = dialog.find(".show-tags-btn.ref"),
                    allTab        = dialog.find(".show-tags-btn.all");


                eventTypeTab.click( function() {
                    eventTypeTab.addClass("selected");
                    obsTab.removeClass("selected");
                    frmTab.removeClass("selected");
                    refTab.removeClass("selected");
                    allTab.removeClass("selected");
                    dialog.find(".event-header.event-type").show();
                    dialog.find(".event-header.obs").hide();
                    dialog.find(".event-header.frm").hide();
                    dialog.find(".event-header.ref").hide();
                    dialog.find(".event-header.all").hide();
                });

                obsTab.click( function() {
                    eventTypeTab.removeClass("selected");
                    obsTab.addClass("selected");
                    frmTab.removeClass("selected");
                    refTab.removeClass("selected");
                    allTab.removeClass("selected");
                    dialog.find(".event-header.event-type").hide();
                    dialog.find(".event-header.obs").show();
                    dialog.find(".event-header.frm").hide();
                    dialog.find(".event-header.ref").hide();
                    dialog.find(".event-header.all").hide();
                });

                frmTab.click( function() {
                    eventTypeTab.removeClass("selected");
                    obsTab.removeClass("selected");
                    frmTab.addClass("selected");
                    refTab.removeClass("selected");
                    allTab.removeClass("selected");
                    dialog.find(".event-header.event-type").hide();
                    dialog.find(".event-header.obs").hide();
                    dialog.find(".event-header.frm").show();
                    dialog.find(".event-header.ref").hide();
                    dialog.find(".event-header.all").hide();
                });

                refTab.click( function() {
                    eventTypeTab.removeClass("selected");
                    obsTab.removeClass("selected");
                    frmTab.removeClass("selected");
                    refTab.addClass("selected");
                    allTab.removeClass("selected");
                    dialog.find(".event-header.event-type").hide();
                    dialog.find(".event-header.obs").hide();
                    dialog.find(".event-header.frm").hide();
                    dialog.find(".event-header.ref").show();
                    dialog.find(".event-header.all").hide();
                });

                allTab.click( function() {
                    eventTypeTab.removeClass("selected");
                    obsTab.removeClass("selected");
                    frmTab.removeClass("selected");
                    refTab.removeClass("selected");
                    allTab.addClass("selected");
                    dialog.find(".event-header.event-type").hide();
                    dialog.find(".event-header.obs").hide();
                    dialog.find(".event-header.frm").hide();
                    dialog.find(".event-header.ref").hide();
                    dialog.find(".event-header.all").show();
                });
            }
        });
    },

    /**
     * This is for legacy support and this method shouldn't be used more than this
     */
    _IsHekEvent() {
        return this.hasOwnProperty('hv_labels_formatted');
    },

    _generateEventKeywordsSection: function (tab) {
        var formatted, tag, tags = [], lookup, attr, domClass, icon, list= {}, self=this;

        if ( tab == 'obs' ) {
            $.each( this.event, function (key, value) {
                if ( key.substring(0, 4) == 'obs_' ) {

                    lookup = self._eventGlossary[key];
                    if ( typeof lookup != 'undefined' ) {
                        list[key] = lookup;
                        list[key]["value"] = value;
                    }
                    else {
                        list[key] = { "value" : value };
                    }
                }
            });
        }
        else if ( tab == 'frm' ) {
                $.each( this.event, function (key, value) {
                    if ( key.substring(0, 4) == 'frm_' ) {

                        lookup = self._eventGlossary[key];
                        if ( typeof lookup != 'undefined' ) {
                            list[key] = lookup;
                            list[key]["value"] = value;
                        }
                        else {
                            list[key] = { "value" : value };
                        }
                    }
                });
        }
        else if ( tab == 'ref' ) {
                $.each( this.event['refs'], function (index, obj) {
                    lookup = self._eventGlossary[obj['ref_name']];
                    if ( typeof lookup != 'undefined' ) {
                        list[obj['ref_name']] = lookup;
                        list[obj['ref_name']]["value"] = obj['ref_url'];
                    }
                    else {
                        list[obj['ref_name']] = { "value" : obj['ref_url'] };
                    }
                });
        }
        else if ( tab == 'all' ) {
                $.each( this.event, function (key, value) {
                    if ( key.substring(0, 3) != 'hv_' && key != 'refs' ) {

                        lookup = self._eventGlossary[key];
                        if ( typeof lookup != 'undefined' ) {
                            list[key] = lookup;
                            list[key]["value"] = value;
                        }
                        else {
                            list[key] = { "value" : value };
                        }
                    }
                });
        }
        else if ( tab.length == 2 ) {
                $.each( this.event, function (key, value) {
                    if ( key.substring(0, 3) == tab.toLowerCase()+'_'
                      || key.substring(0, 5) == 'event'
                      || key == 'concept'
                      || key.substring(0,3) == 'kb_' ) {

                        lookup = self._eventGlossary[key];
                        if ( typeof lookup != 'undefined' ) {
                            list[key] = lookup;
                            list[key]["value"] = value;
                        }
                        else {
                            list[key] = { "value" : value };
                        }
                    }
                });
        }
        else {
            console.warn('No logic for unexpected tab "'+tab+'".');
        }

        // Format the output
        formatted = '<div>';
        $.each(list, function (key, obj) {
            attr = '';
            domClass = '';
            icon = '';

            if ( tab != 'all' && typeof obj['hv_label'] != 'undefined' && obj['hv_label'] !== null ) {
                key = obj['hv_label'];
            }

            if ( typeof obj['hek_desc'] != 'undefined' && obj['hek_desc'] !== null  ) {
                attr += ' title="' + obj['hek_desc'] + '"';
            }


            if ( obj.value != '' && obj.value != 'N/A' && obj.value != 'n/a'
                && typeof obj['hv_type'] != 'undefined'
                && (obj['hv_type'] == 'url' || obj['hv_type'] == 'image_url') ) {

                if ( obj.value.indexOf('://') == -1) {
                    obj.value = 'http://'+obj.value;
                }
                obj.value = '<a href="'+obj.value+'" target="_blank">'+obj.value+'</a>';
            }


            if ( obj.value != '' && obj.value != 'N/A' && obj.value != 'n/a'
                && typeof obj['hv_type'] != 'undefined' && obj['hv_type'] == 'email_or_url' ) {

                if ( obj.value.indexOf('://') == -1 && obj.value.indexOf('/')    !== -1
                    && obj.value.indexOf('@') == -1 && obj.value.indexOf(' at ')  == -1 ) {

                    obj.value = 'http://'+obj.value;
                    obj.value = '<a href="'+obj.value+'" target="_blank">'+obj.value+'</a>';
                }
                else if ( obj.value.indexOf('://') !== -1 ) {
                    obj.value = '<a href="'+obj.value+'" target="_blank">'+obj.value+'</a>';
                }
                else if ( obj.value.indexOf('@') > -1 && obj.value.indexOf(' ') == -1 ) {
                    obj.value = '<a href="mailto:'+obj.value+'">'+obj.value+'</a>';
                }
            }

            if ( obj.value != '' && obj.value != 'N/A' && obj.value != 'n/a'
                && typeof obj['hv_type'] != 'undefined'
                && obj['hv_type'] == 'thumbnail_url' ) {

                if ( obj.value.indexOf('://') == -1 ) {
                    obj.value = 'http://'+obj.value;
                }
                obj.value = '<img src="'+obj.value+'"/>';
            }

            if ( typeof obj['hv_type'] != 'undefined' && obj['hv_type'] == 'date' ) {
                domClass += ' date';
            }

            if ( typeof obj['hek_type'] != 'undefined' && obj['hek_type'] == 'float' ) {
                domClass += ' float';
            }

            if ( typeof obj['hek_type'] != 'undefined'
                && (obj['hek_type'] == 'integer' || obj['hek_type'] == 'long') ) {

                domClass += ' integer';
            }

            if ( typeof obj['hv_type'] != 'undefined' && obj['hv_type'] == 'boolean' ) {
                domClass += ' boolean';
                if ( obj.value.toUpperCase() == "T" || obj.value == 1
                    || obj.value.toLowerCase() == 'true' ) {

                    domClass += ' true';
                }
                if ( obj.value.toUpperCase() == "F" || obj.value == 0
                    || obj.value.toLowerCase() == 'false') {

                    domClass += ' false';
                }
            }

            if (  typeof obj['hv_type']  != 'undefined' && obj['hv_type'] != 'date'
               && typeof obj['hek_type'] != 'undefined' && obj['hek_type'] == 'string' ) {

                domClass += ' string';
            }


            if (  typeof obj.value === 'undefined' || obj.value === null
               || obj.value === 'null' || obj.value === '' ) {

                tag = '<div class="empty"><span class="event-header-tag empty"'+attr+'>' + key + ': </span>' +
                      '<span class="event-header-value empty">' + obj.value + '</span></div>';
            }
            else if (typeof obj.value === 'object') {
                tag = '<div><span class="event-header-tag "'+attr+'>' + key + ': </span>' +
                      '<pre style="white-space: pre-wrap" class="event-header-value string">' + JSON.stringify(obj.value, null, 4) + '</pre></div>';
            }
            else {
                tag = '<div><span class="event-header-tag"'+attr+'>' + key + ': </span>' +
                      '<span class="event-header-value'+domClass+'">' + obj.value + '</span></div>';
            }
            tags.push(tag);
            formatted += tag;
        });
        formatted += '</div>';

        return formatted;
    },


    _populatePopup: function () {
        var content = '', headingText = '', self = this;

        if ( this.hasOwnProperty('label') && this.label.length > 0 ) {
            headingText = this.category+': ' + this.fixTitles(this.label.split("\n")[0]);
        }
        else {
            headingText = this.category + ': ' + this.fixTitles(this.name) + ' ' + this.fixTitles(this.version);
        }

        content     += '<div class="close-button ui-icon ui-icon-closethick" title="Close PopUp Window"></div>'+"\n"
                    +  '<h1 class="user-selectable">'+headingText+'</h1>'+"\n";

        if ( this.event_peaktime != null && this.event_peaktime != '') {
            content += '<div class="container">'+"\n"
                    +      "\t"+'<div class="param-container"><div class="param-label user-selectable">Peak Time:</div></div>'+"\n"
                    +      "\t"+'<div class="value-container"><div class="param-value user-selectable">'+this.event_peaktime.replace('T',' ')
                    +		' <span class="dateSelector" data-tip-pisition="right" data-date-time="'+this.event_peaktime.replace('T',' ')+'">UTC</span></div>'
                    +		(embedView ? '' : '<div class="ui-icon ui-icon-arrowstop-1-n" title="Jump to Event Peak Time"></div></div>')+"\n"
                    +  '</div>'+"\n";
        }
        content     += '<div class="container">'+"\n"
                    +      "\t"+'<div class="param-container"><div class="param-label user-selectable">Start Time: </div></div>'+"\n"
                    +      "\t"+'<div class="value-container"><div class="param-value user-selectable">'+this.start.replace('T',' ')
                    +	   ' <span class="dateSelector" data-tip-pisition="right" data-date-time="'+this.start.replace('T',' ')+'">UTC</span></div>'
                    +		(embedView ? '' : '<div class="ui-icon ui-icon-arrowstop-1-w" title="Jump to Event Start Time"></div></div>')+"\n"
                    +  '</div>'+"\n"
                    +  '<div class="container">'+"\n"
                    +      "\t"+'<div class="param-container"><div class="param-label user-selectable">End Time: </div></div>'+"\n"
                    +      "\t"+'<div class="value-container"><div class="param-value user-selectable">'+this.end.replace('T',' ')
                    +		' <span class="dateSelector" data-tip-pisition="right" data-date-time="'+this.end.replace('T',' ')+'">UTC</span></div>'
                    +		(embedView ? '' : '<div class="ui-icon ui-icon-arrowstop-1-e" title="Jump to Event End Time"></div>')+"\n"
                    +  '</div>'+"\n";

        if ( this.hasOwnProperty('hv_labels_formatted') && Object.keys(this.hv_labels_formatted).length > 0 ) {
            $.each( this.hv_labels_formatted, function (param, value) {
				value = self.fixTitles(value);
                content += '<div class="container">'+"\n"
                        +      "\t"+'<div class="param-container"><div class="param-label user-selectable">'+param+': </div></div>'+"\n"
                        +      "\t"+'<div class="value-container"><div class="param-value user-selectable">'+value+'</div></div>'+"\n"
                        +  '</div>'+"\n";
            });
        } else {
            let lines = this.label.replace("\n", " ");
            content += '<div class="container">'+"\n"
                        +      "\t"+'<div class="param-container"><div class="param-label user-selectable">title: </div></div>'+"\n"
                        +      "\t"+'<div class="value-container"><div class="param-value user-selectable">'+lines+'</div></div>'+"\n"
                        +  '</div>'+"\n";
        }

		var noaaSearch = '';
        if( this.name == "NOAA SWPC Observer" || this.name == "HMI SHARP"){
			var eventName = this.fixTitles(this.hv_labels_formatted[Object.keys(this.hv_labels_formatted)[0]]);
			noaaSearch = '<div class="btn-label btn event-search-external text-btn" data-url=\'https://ui.adsabs.harvard.edu/#search/q="'+eventName+'"&sort=date desc\' target="_blank"><i class="fa fa-search fa-fw"></i>ADS search for '+eventName+'<i class="fa fa-external-link fa-fw"></i></div>\
						<div style=\"clear:both\"></div>\
						<div class="btn-label btn event-search-external text-btn" data-url="https://arxiv.org/search/?query='+eventName+'&searchtype=all" target="_blank"><i class="fa fa-search fa-fw"></i>arXiv search for '+eventName+'<i class="fa fa-external-link fa-fw"></i></div>\
						<div style=\"clear:both\"></div>';
		}

        let sourceLink = '';
        if (this.hasOwnProperty('link') && this.link !== null) {
            sourceLink += '\
            <div class="btn-label btn event-search-external text-btn" data-url="'+this.link+'" target="_blank">Go to source <i class="fa fa-external-link fa-fw"></i></div>\
            <div style=\"clear:both\"></div>';
        }

        //Only add buttons to main site event pop-ups, remove buttons from k12
        if(outputType!='minimal' && this.hasOwnProperty('start') && this.hasOwnProperty('end')){
            content     += '<div class="btn-container">'+"\n"
                        +       "\t"+'<div class="btn-label btn event-info text-btn"><i class="fa fa-info-circle fa-fw"></i> View source data</div>'+"\n"
                        + 		"<div style=\"clear:both\"></div>\n"
                        +       "\t"+(embedView ? '' : '<div class="btn-label btn event-create-movie text-btn" data-start="'+this.start+'" data-end="'+this.end+'"><i class="fa fa-video-camera fa-fw"></i> Make movie using event times and current field of view</div>')+"\n"
                        + 		"<div style=\"clear:both\"></div>\n"
                        //+       "\t"+'<div class="ui-icon ui-icon-copy btn copy-to-data" data-start="'+this.start.replace('T',' ').replace(/-/gi,'/')+'" data-end="'+this.end.replace('T',' ').replace(/-/gi,'/')+'"></div>'
                        +		noaaSearch
                        +		"\t"+(embedView ? '' : '<div class="btn-label btn copy-to-data text-btn" data-start="'+this.start.replace('T',' ').replace(/-/gi,'/')+'" data-end="'+this.end.replace('T',' ').replace(/-/gi,'/')+'"><i class="fa fa-copy fa-fw"></i> Copy start / end times to data download</div>')+"\n"
                        //+       "\t"+'<div class="ui-icon ui-icon-video btn event-movie"></div><div class="btn-label btn event-movie">Generate Movie</div>'+"\n"
                        + 		"<div style=\"clear:both\"></div>\n"
                        +       sourceLink
                        +  '</div>'+"\n";
        }

        this.eventPopupDomNode = $('<div/>');
        this.eventPopupDomNode.hide();
        this.eventPopupDomNode.attr({
            'class' : "event-popup"
        });

        this.eventPopupDomNode.html(content);

        // Event bindings
        this.eventPopupDomNode.find(".ui-icon-arrowstop-1-w").bind('click', function () {
            helioviewer.timeControls.setDate( new Date(self.start+".000Z") );
        });
        this.eventPopupDomNode.find(".ui-icon-arrowstop-1-n").bind('click', function () {
            helioviewer.timeControls.setDate( new Date(self.event_peaktime+".000Z") );
        });
        this.eventPopupDomNode.find(".ui-icon-arrowstop-1-e").bind('click', function () {
            helioviewer.timeControls.setDate( new Date(self.end+".000Z") );
        });
        this.eventPopupDomNode.find(".event-movie").bind('click', function() {
            alert('Event-based movie generation not yet implemented.')
        });
        this.eventPopupDomNode.find(".copy-to-data").bind('click', function() {
            var start = $(this).data('start');
            var end = $(this).data('end');

            var startArr = start.split(" ");
            var endArr = end.split(" ");

            //Set dates
            if(Helioviewer.userSettings.get("state.drawers.#hv-drawer-data.open") == false){
				helioviewer.drawerDataClick(true);
			}
            $('#vso-start-date, #sdo-start-date').val(startArr[0]);
            $('#vso-start-time, #sdo-start-time').val(startArr[1]).change();
            $('#vso-end-date, #sdo-end-date').val(endArr[0]);
            $('#vso-end-time, #sdo-end-time').val(endArr[1]).change();
        });

		//Create Movie from event popup
		this.eventPopupDomNode.find(".event-create-movie").bind('click', function() {
	        var start = $(this).data('start') + '.000Z';
            var end = $(this).data('end') + '.000Z';

            //build an movie settings object
            var formSettings = [
	            {name : 'speed-method', value : 'framerate'},
	            {name : 'framerate', value : 15},
	            {name : 'startTime', value : start},
	            {name : 'endTime', value : end},
            ];

            helioviewer._movieManagerUI._buildMovieRequest(formSettings);
        });

        this.eventPopupDomNode.find(".event-search-external").bind('click', function() {
            var url = $(this).data('url');
            window.open(url, '_blank');
        });
        this.eventPopupDomNode.find(".btn.event-info").bind('click', $.proxy(this._showEventInfoDialog, this));
        this.eventPopupDomNode.find('.close-button').bind('click', $.proxy(this.toggleEventPopUp, this));
        this.eventPopupDomNode.bind("mousedown", function () { return false; });
        this.eventPopupDomNode.bind('dblclick', function () { return false; });
        this.eventPopupDomNode.draggable();

        // Allow text selection (prevent drag where text exists)
        this.eventPopupDomNode.find("h1, .param-label, .param-value, .btn-container .btn").click(function(event){
            event.stopImmediatePropagation();
        });
        this.eventPopupDomNode.find("h1, .param-label, .param-value, .btn-container .btn").mousedown(function(event){
            event.stopImmediatePropagation();
        });
        this.eventPopupDomNode.find("h1, .param-label, .param-value, .btn-container .btn").dblclick(function(event){
            event.stopImmediatePropagation();
        });
        this.eventPopupDomNode.find("h1, .param-label, .param-value").enableSelection();

        this.parentFRM.domNode.append(this.eventPopupDomNode);
        helioviewer._timeSelector = new TimeSelector();
    },

    fixTitles: function(s){
	    s = s.replace(/u03b1/g, "α");
        s = s.replace(/u03b2/g, "β");
        s = s.replace(/u03b3/g, "γ");
		s = s.replace(/u00b1/g, "±");
		s = s.replace(/u00b2/g, "²");

		return s;
    }

});
