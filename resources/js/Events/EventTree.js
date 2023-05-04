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

    init: function (id, data, container, eventManager) {
        this._id = id;
        this._container = container;
        this._EventManager = eventManager;
        this._visibleEventLayerKey = "state.events." + this._id + ".visible";
        this._activeEventLayersKey = "state.events." + this._id + ".layers";
        this._selectedEventCache = new SelectedEventsCache();

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

    getVisibleEventState: function () {
        return Helioviewer.userSettings.get(this._visibleEventLayerKey);
    },

    setVisibleEventState: function (state) {
        Helioviewer.userSettings.set(this._visibleEventLayerKey, state);
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

            $('#'+event_type['attr'].id+' a').hover($.proxy(self.hoverOn,this), $.proxy(self.hoverOff,this));

            // Dim rows that don't have associated features/events
            if ( event_type.children.length == 0 ) {
                $('#'+event_type['attr'].id).css({'opacity':'0.5'});
                $('#'+event_type['attr'].id).addClass('empty-element');

                var visState = self.getVisibleEventState();
	            if(visState != true){
                    self.setVisibleEventState(false)
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
        saved = self.getSavedEventLayers().concat(this._selectedEventCache.get());

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
                        self._selectedEventCache.remove(eventLayer.event_type, frm);
                        self.jstreeFunc("check_node", node);
                    } else {
                        // It's possible that we had a specific event type selected,
                        // then the observation time changes so that we have nothing selected.
                        // The user had this specific FRM selected, so we should remember it for next time its available instead of defaulting to "all"
                        self._selectedEventCache.add(eventLayer.event_type, frm);
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
                var eventLayer, event_type, frms;
                // If there is no current data in this checked event dropdown, then default to all
                if (this.classList.contains("empty-element")) {
                    frms = ["all"];
                } else {
                    // If the selected item is for a specific FRM, then specify that FRM here.
                    let frm = EventTree._getFrmFromId(this.id);
                    if (frm != null) {
                        frms = [frm];
                    }
                    else {
                        // At this point the selected item is not empty, and since it's not a specific FRM, it means all FRMs are selected.
                        // In this case we want to specify each individual FRM. This handles the case where all items shown in the UI are checked, which may be different from all items available when a movie is created.
                        // Check for checked subitems that are checked in the group
                        frms = [];
                        $(this).find(".jstree-checked").each(((idx, el) => {
                            // Grab the FRM on each checked subitem
                            frms.push(EventTree._getFrmFromId(el.id));
                        }))
                    }
                }
                event_type = EventTree._getEventTypeFromId(this.id);

                frms.forEach((frm) => {
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
     * Hides all events that are not related to the item being hovered over.
     * i.e. if the viewport shows CMEs and Solar flares, this hoverOn may trigger when
     * hovering over the Solar Flare label. This will hide all CMEs and other events so that
     * only Solar Flares are visible in the viewport while the mouse is hovering over the Solar Flares label.
     *
     * This should only happen if the item being hovered over is checked, otherwise this function will have no effect.
     * @param {Event} event
     */
    hoverOn: function (event) {
        // Find the list item that is being hovered over
        let trigger = $(event.target).parents('li');
        if (trigger.length > 0) {
            let hoverItem = trigger[0];
            // Get the id of the DIV containing target event markers
            let targetId = hoverItem.id.replace('--', '__');
            // Get the div containing the target event markers
            var emphasisNodes = $(`[id^=${targetId}]`);
            // If the item is checked, then proceed to hide all other event marker divs.
            // jstree-undetermined handles the case where the group label is hovered over instead of an individual event type.
            if (hoverItem.classList.contains('jstree-checked') || hoverItem.classList.contains('jstree-undetermined')) {
                var eventLayerNodes, found;
                eventLayerNodes = $(".event-container > div.event-layer");

                $.each( eventLayerNodes, function(i, obj) {
                    found = false;
                    $.each( emphasisNodes, function(j, emphObj) {
                        if ( $(obj)[0].id == $(emphObj)[0].id ) {
                            found = true;
                        }
                    });

                    if ( found === false && emphasisNodes.length > 0 ) {
                        $(obj).css({'opacity':'0'});
                        $('.movie-viewport-icon').hide();
                    }
                    else {
                        $(obj).css({'opacity':'1.00'});
                    }
                });
                var className = 'point_type_'+this['attr'].id;
                if(timelineRes == 'm'){
                    $(".highcharts-series > rect:not(."+className+")").hide();
                }
            }
        }
    },

    hoverOff: function (event) {
        $(".event-container > div.event-layer").css({'opacity':'1.0'});
		$(".highcharts-series > rect").show();
		$('.movie-viewport-icon').show();
    },

    hoverOnFRM: function (event) {
        let $target = $('#'+this['attr'].id);

        if ($target.hasClass('jstree-checked')) {
            var emphasisNode, deEmphasisNodes, eventTypeAbbr, eventLayerNodes, found, eventTypeAbbrName;
            eventTypeAbbr = this['attr'].id.split("--")[0];
            eventTypeAbbrName = this['attr'].id.split("--")[1];

            emphasisNode  = $("#"+this['attr'].id.replace("--", "__"));
            deEmphasisNodes = $("[id^="+eventTypeAbbr+"__]");

            eventLayerNodes = $(".event-container > div.event-layer");

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
                        $(obj).css({'opacity':'0'});
                    }
                    else {
                        $(obj).css({'opacity':'0'});
                    }
                    $('.movie-viewport-icon').hide();
                }
            });
            if(timelineRes == 'm'){
                $(".highcharts-series > rect:not(.point_name_"+eventTypeAbbrName+")").hide();
            }
        }
    },

    hoverOffFRM: function (event) {
        let $target = $('#'+this['attr'].id);
        if ($target.hasClass('jstree-checked')) {
            var emphasisNode, deEmphasisNodes, eventTypeAbbr, eventLayerNodes, found;
            eventTypeAbbr = this['attr'].id.split("--")[0];

            emphasisNode  = $("#"+this['attr'].id.replace("--", "__"));
            deEmphasisNodes = $("[id^="+eventTypeAbbr+"__]");

            eventLayerNodes = $(".event-container > div.event-layer");

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
                    $('.movie-viewport-icon').show();
                }
            });
            $(".highcharts-series > rect").show();
        }
    }
});
