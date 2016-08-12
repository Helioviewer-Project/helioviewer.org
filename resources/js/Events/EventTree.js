/**
 * @author Jeff Stys <jeff.stys@nasa.gov>
 * @author Jonathan Harper
 * @fileOverview TO BE ADDED
 *
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, window */

"use strict";

var EventTree = Class.extend({

    init: function (data, container) {
        this._container = container;
        this._build(data);

        $(document).bind("toggle-checkboxes", $.proxy(this.toggle_checkboxes, this));
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

    toggle_checkboxes: function () {
        var numChecked;
        numChecked = Helioviewer.userSettings.get("state.eventLayers").length;
        if ( numChecked > 0 ) {
            this._container.jstree("uncheck_all",null,true);
        }
        else {
            // Unbind event handler that normally triggers when checkboxes are checked/unchecked
            // because we're about to do that a lot
            this._container.unbind("change_state.jstree", $.proxy(this._treeChangedState, this));
            
            this._container.jstree("check_all",null,true);

            $(document).trigger("fetch-eventFRMs");

            // Bind event handler that triggers whenever checkboxes are checked/unchecked
            this._container.bind("change_state.jstree", $.proxy(this._treeChangedState, this));
            $(document).trigger("change_state.jstree", this);
        }

    },

    toggle_checkboxes_state: function (e, toState) {

        // Unbind event handler that normally triggers when checkboxes are checked/unchecked
        // because we're about to do that a lot
        this._container.unbind("change_state.jstree", $.proxy(this._treeChangedState, this));
        
        if (toState == 'off') {
            this._container.jstree("uncheck_all",null,true);
        }
        else if (toState == 'on') {
            this._container.jstree("check_all",null,true);
        }
        else {
            this.toggle_checkboxes();
            return;
        }

        $(document).trigger("fetch-eventFRMs");

        // Bind event handler that triggers whenever checkboxes are checked/unchecked
        this._container.bind("change_state.jstree", $.proxy(this._treeChangedState, this));
        this._treeChangedState();
    },

    jstreeFunc: function (name, args) {
        this._container.jstree(name, args);
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

            $('#'+event_type['attr'].id+' a').hover($.proxy(self.hoverOn,this), $.proxy(self.hoverOff,this));

            // Dim rows that don't have associated features/events
            if ( event_type.children.length == 0 ) {
                $('#'+event_type['attr'].id).css({'opacity':'0.5'});
                $('#'+event_type['attr'].id).addClass('empty-element');
                
                var visState = Helioviewer.userSettings.get("state.eventLayerAvailableVisible");
	            if(visState != true){
		            Helioviewer.userSettings.set("state.eventLayerAvailableVisible", false);
					$('#'+event_type['attr'].id).hide();
	            }
            }

            $.each(event_type['children'], function(j, frm) {
                $('#'+self._escapeInvalidJQueryChars(frm['attr'].id)+' a').hover($.proxy(self.hoverOnFRM,this), $.proxy(self.hoverOffFRM,this));
            });
        });


        // Unbind event handler that normally triggers when checkboxes are checked/unchecked
        // because we're about to do that a lot
        this._container.unbind("change_state.jstree", $.proxy(this._treeChangedState, this));

        // Loop over saved eventLayer state, checking the appropriate checkboxes to match.
        saved = Helioviewer.userSettings.get("state.eventLayers");
        $.each(saved, function(i,eventLayer) {
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
                        self.jstreeFunc("check_node", node);
                    }
                });
            }
        });

        // Re-bind event handler that triggers whenever checkboxes are checked/unchecked
        this._container.bind("change_state.jstree", $.proxy(this._treeChangedState, this));
        $(document).trigger("change_state.jstree", this);
    },

    _escapeInvalidJQueryChars: function (selector) {
        // Plus Sign '+', Period/Dot '.', Parentheses '(', ')'
        selector = selector.replace(/(\+)/g, '\\\\$1');
        selector = selector.replace(/(\.)/g, '\\\\$1');
        selector = selector.replace(/(\()/g, '\\\\$1');
        selector = selector.replace(/(\))/g, '\\\\$1');

        return selector;
    },


    _treeChangedState: function (event, data) {
        var checked = [], event_types = [], index;

        this._container.jstree("get_checked",null,false).each(
            function () {
                var eventLayer, event_type, frm;
                event_type = this.id.split("--");
                if (event_type.length > 1) {
                    frm = event_type[1];
                }
                else {
                    frm = 'all';
                }
                event_type = event_type[0];

                // Determine if an entry for this event type already exists
                index = $.inArray(event_type, event_types)

                // New event type to add to array
                if ( index == -1 ) {
                    eventLayer = { 'event_type' : event_type,
                                         'frms' : [frm],
                                         'open' : 1};
                    checked.push(eventLayer);
                    event_types.push(event_type);
                }
                // Append FRM to existing event type in array
                else {
                    checked[index].frms.push(frm);
                }
            }
        );

        // Save eventLayers state to localStorage
        Helioviewer.userSettings.set("state.eventLayers", checked);

        // Show/Hide events to match new state of the checkboxes
        $(document).trigger("toggle-events");
        $(document).trigger("change-feature-events-state");
    },

    hoverOn: function (event) {
        var emphasisNodes, eventLayerNodes, found;
        emphasisNodes  = $("[id^="+this['attr'].id+"__]");
        eventLayerNodes = $("#event-container > div.event-layer");

        $.each( eventLayerNodes, function(i, obj) {
            found = false;
            $.each( emphasisNodes, function(j, emphObj) {
                if ( $(obj)[0].id == $(emphObj)[0].id ) {
                    found = true;
                }
            });

            if ( found === false && emphasisNodes.length > 0 ) {
                $(obj).css({'opacity':'0.20'});
            }
            else {
                $(obj).css({'opacity':'1.00'});
            }
        });
        var className = 'point_type_'+this['attr'].id;
        if(timelineRes == 'm'){
			$(".highcharts-series > rect:not(."+className+")").hide();
        }
    },

    hoverOff: function (event) {
        $("#event-container > div.event-layer").css({'opacity':'1.0'});
		$(".highcharts-series > rect").show();
    },

    hoverOnFRM: function (event) {
        var emphasisNode, deEmphasisNodes, eventTypeAbbr, eventLayerNodes, found, eventTypeAbbrName;
        eventTypeAbbr = this['attr'].id.split("--")[0];
        eventTypeAbbrName = this['attr'].id.split("--")[1];

        emphasisNode  = $("#"+this['attr'].id.replace("--", "__"));
        deEmphasisNodes = $("[id^="+eventTypeAbbr+"__]");

        eventLayerNodes = $("#event-container > div.event-layer");

        $.each( eventLayerNodes, function(i, obj) {

            if ( $(obj)[0].id == $(emphasisNode)[0].id ) {
                $(obj).css({'opacity':'1.00'});
            }
            else {
                found = false;
                $.each( deEmphasisNodes, function(j, deEmphObj) {
                    if ( $(obj)[0].id == $(deEmphObj)[0].id ) {
                        found = true;
                    }
                });
                if ( found === true ) {
                    //$(obj).css({'opacity':'0.50'});
                    $(obj).css({'opacity':'0.20'});
                }
                else {
                    $(obj).css({'opacity':'0.20'});
                }
            }
        });
        if(timelineRes == 'm'){
	        $(".highcharts-series > rect:not(.point_name_"+eventTypeAbbrName+")").hide();
        }
    },

    hoverOffFRM: function (event) {
        var emphasisNode, deEmphasisNodes, eventTypeAbbr, eventLayerNodes, found;
        eventTypeAbbr = this['attr'].id.split("--")[0];

        emphasisNode  = $("#"+this['attr'].id.replace("--", "__"));
        deEmphasisNodes = $("[id^="+eventTypeAbbr+"__]");

        eventLayerNodes = $("#event-container > div.event-layer");

        $.each( eventLayerNodes, function(i, obj) {

            if ( $(obj)[0].id == $(emphasisNode)[0].id ) {
                $(obj).css({'opacity':'1.0'});
            }
            else {
                found = false;
                $.each( deEmphasisNodes, function(j, deEmphObj) {
                    if ( $(obj)[0].id == $(deEmphObj)[0].id ) {
                        found = true;
                    }
                });
                if ( found === true ) {
                    //$(obj).css({'opacity':'0.50'});
                    $(obj).css({'opacity':'1.0'});
                }
                else {
                    $(obj).css({'opacity':'1.0'});
                }
            }
        });
		$(".highcharts-series > rect").show();
    }
});
