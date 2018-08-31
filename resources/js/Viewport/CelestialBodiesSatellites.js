"use strict";

var CelestialBodiesSatellites = Class.extend(
{
    init: function(){
        this.domNode = $('#SolarBodiesAccordion-Container');
        this.getMercuryData = true;
        this.mercuryReceivedPos = { x: 0, y: 0 };
        this.currentTime = 0;
        this._initEventListeners();
        this._buildDOM();
    },
    _initEventListeners: function(){
        $(document).bind("helioviewer-ready", $.proxy(this._hvReady,this));
        $(document).bind("observation-time-changed", $.proxy(this._onTimeChanged,this));
        $(document).bind("replot-celestial-objects", $.proxy(this._replotCoordinates,this));
        $(document).bind("replot-event-markers",   $.proxy(this._refresh, this));
    },
    _buildDOM: function() {
        this.movingContainer = $("#moving-container");
        this.bodiesContainer = $('<div/>');
        this.bodiesContainer.attr('id','bodies-container');
        this.bodiesContainer.css({'position' : 'absolute'});
        this.movingContainer.append(this.bodiesContainer);
    },
    _hvReady: function() {
        this._onTimeChanged();
        this._buildSidebarTemplate(1,"bodies-container-"+this.currentTime,"Planets",true,true,true);
    },
    _onTimeChanged: function(){
        if(this.getMercuryData){
            this.currentTime = helioviewer.timeControls.getTimestamp();
            var params = {
                "action"    : "getSolarBodies",
                "time"      : this.currentTime
            };
            $.get(Helioviewer.api, params, $.proxy(this._outputCoordinates, this), "json");
        }else{
            this._outputCoordinates(null,null);
        }
    },
    _outputCoordinates: function(coordinates){
        this.coordinates = coordinates;
        var observers = Object.keys(coordinates);
        for(var observer of observers){
            var bodies = Object.keys(coordinates[observer]);
            for(var body of bodies){
                var containerName = body+"-container";
                if($('#'+containerName).length == 0){//label container div does not exist yet
                    var labelContainer = $('<div/>');//make a new div
                    labelContainer.attr('id',body+"-container");//set the id
                    this.bodiesContainer.append(labelContainer);//append it to the bodiesContainer div
                }else{//label ontainer div exists
                    var labelContainer = $('#'+containerName);//locate the container div
                }
                var correctedCoordinates = {
                    x: Math.round( coordinates[observer][body].x / Helioviewer.userSettings.settings.state.imageScale),
                    y: Math.round( -coordinates[observer][body].y / Helioviewer.userSettings.settings.state.imageScale)
                };
                //TODO: store all names as we want them to appear on the site
                var bodyCapitalized = body.charAt(0).toUpperCase() + body.substr(1);
                labelContainer.text(bodyCapitalized);
                labelContainer.css({
                    'position'  : 'absolute',
                    'left'      :  correctedCoordinates.x + 'px',
                    'top'       :  correctedCoordinates.y + 'px',
                    'z-index'   :  30,
                    'text-shadow'   : '0px 0px 2px #000, 0px 0px 4px #000, 0px 0px 6px #000'
                });
                this._buildPopupTemplate(observer,body,labelContainer);
            }
        }
    },

    _replotCoordinates: function(){
        var observers = Object.keys(this.coordinates);
        for(var observer of observers){
            var bodies = Object.keys(this.coordinates[observer]);
            for(var body of bodies){
                var containerName = body+"-container";
                var labelContainer = $('#'+containerName);//locate the container div
                var correctedCoordinates = {
                    x: Math.round( this.coordinates[observer][body].x / Helioviewer.userSettings.settings.state.imageScale),
                    y: Math.round( -this.coordinates[observer][body].y / Helioviewer.userSettings.settings.state.imageScale)
                };
                labelContainer.css({
                    'left'      :  correctedCoordinates.x + 'px',
                    'top'       :  correctedCoordinates.y + 'px'
                });
                this._buildPopupTemplate(observer,body,labelContainer);
            }
        }

    },

    _buildPopupTemplate: function(observer,body,labelContainer){
        var previousInstance = $('#'+observer + '_' + body + '_popup');//get previous instance by selector
        if(previousInstance.length){//previous instance exists
            var previousInstanceClosed = previousInstance.is(':hidden');//get state of previous instance
        }else{//previous instance not found
            var previousInstanceClosed = true;//default start hidden
        }
        previousInstance.remove();
        var bodyCapitalized = body.charAt(0).toUpperCase() + body.substr(1);
        var observerCapitalized = observer.charAt(0).toUpperCase() + observer.substr(1);
        var raw_distance_body_to_sun_au = this.coordinates[observer][body].distance_body_to_sun_au;
        var raw_distance_observer_to_body_au = this.coordinates[observer][body].distance_observer_to_body_au;
        var displayDistances = false;
        if(raw_distance_body_to_sun_au != null || raw_distance_observer_to_body_au != null){
            var distance_body_to_sun_au_rounded = this.coordinates[observer][body].distance_body_to_sun_au.toFixed(8);
            var distance_observer_to_body_au_rounded = this.coordinates[observer][body].distance_observer_to_body_au.toFixed(8);
            var behind_plane_of_sun = (this.coordinates[observer][body].behind_plane_of_sun == "True");
            displayDistances = true;
        }
        var content = '';
        content     += '<div class="close-button ui-icon ui-icon-closethick" title="Close PopUp Window"></div>'+"\n"
                    +  '<h1 class="user-selectable">'+bodyCapitalized+' as seen from '+observerCapitalized+'</h1>'+"\n";
        if(displayDistances){
            content += '<div class="container">'+"\n"
                    +   "\t"+'<div class="param-container"><div class="param-label user-selectable">Distance to Sun:</div></div>'+"\n"
                    +   "\t"+'<div class="value-container"><div class="param-value user-selectable">'+distance_body_to_sun_au_rounded+' AU</div></div>'
                    +   '</div>'+"\n";
            content += '<div class="container">'+"\n"
                    +   "\t"+'<div class="param-container"><div class="param-label user-selectable">Distance from '+observerCapitalized+' to '+bodyCapitalized+':</div></div>'+"\n"
                    +   "\t"+'<div class="value-container"><div class="param-value user-selectable">'+distance_observer_to_body_au_rounded+' AU</div></div>'
                    +   '</div>'+"\n";
            content += '<div class"container">'+"\n"
                    +   "\t"+'<div class="plane-position-container" '+(behind_plane_of_sun ? 'style="color: Silver"' : 'style="color: Gainsboro')+'>'
                    +   bodyCapitalized+' is '+(behind_plane_of_sun ? ' behind ' : ' in front of ')+' the plane of the sun.'
                    +   '</div></div>'+"\n";
        }
        content += '<div class="btn-label btn event-search-external text-btn" data-url=\'https://solarsystem.nasa.gov/planets/'+body+'/overview/\' target="_blank"><i class="fa fa-search fa-fw"></i>Learn more about '+bodyCapitalized+'<i class="fa fa-external-link fa-fw"></i></div>\
                    <div style=\"clear:both\"></div>'
        var eventPopupDomNode = $('<div/>');

        if(previousInstanceClosed){
            eventPopupDomNode.hide();
        }
        eventPopupDomNode.attr({
            'id' : observer + '_' + body + '_popup',
            'class' : "body-popup"
        });
        eventPopupDomNode.css({
            'left' : labelContainer.css('left'),
            'top' : labelContainer.css('top'),
            'z-index' : 1000
        });

        eventPopupDomNode.html(content);

        this.bodiesContainer.append(eventPopupDomNode);

        eventPopupDomNode.find('.close-button').bind('click', $.proxy(this._toggleBodyInfoPopup, this, eventPopupDomNode));
        
        eventPopupDomNode.bind("mousedown", function () { return false; });
        eventPopupDomNode.bind('dblclick', function () { return false; });
        eventPopupDomNode.draggable();

        //make links work
        eventPopupDomNode.find(".event-search-external").bind('click', function() {
            var url = $(this).data('url');
            window.open(url, '_blank');
        });

        // Allow text selection (prevent drag where text exists)
        eventPopupDomNode.find("h1, .param-label, .param-value, .btn-container .btn").click(function(event){
            event.stopImmediatePropagation();
        });
        eventPopupDomNode.find("h1, .param-label, .param-value, .btn-container .btn").mousedown(function(event){
            event.stopImmediatePropagation();
        });
        eventPopupDomNode.find("h1, .param-label, .param-value, .btn-container .btn").dblclick(function(event){
            event.stopImmediatePropagation();
        });
        eventPopupDomNode.find("h1, .param-label, .param-value").enableSelection(); 

        eventPopupDomNode.click(function(event){
            event.stopImmediatePropagation();
        })

        labelContainer.bind('click', $.proxy(this._toggleBodyInfoPopup, this, eventPopupDomNode));
        
    },

    _toggleBodyInfoPopup: function(eventPopupDomNode){
        if(eventPopupDomNode.is(':hidden')){
            eventPopupDomNode.show("fast");
        }else{
            eventPopupDomNode.hide("fast");
        }
    },

    _buildSidebarTemplate: function (index, id, name, markersVisible, labelsVisible, startOpened) {

        //console.log("index:",index, "id:",id, "name:",name, "markersVisible:",markersVisible, "labelsVisible:", labelsVisible, "startOpened:", startOpened);

        this.domNode.dynaccordion({startClosed: true});

        var visibilityBtn, labelsBtn, availableBtn/*, removeBtn*/, markersHidden, labelsHidden, availableHidden, head, body, self=this;
        
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
        body += '<div id="eventJSTree" style="margin-bottom: 5px;"></div></div>';

        /*
        //Add to accordion
        this.domNode.dynaccordion("addSection", {
            id:     id,
            header: head,
            cell:   body,
            index:  index,
            open:   startOpened
        });
        */

        //this.getEventGlossary();

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

        this.domNode.find("#visibilityAvailableBtn-"+id).click( function(e) {
            var visState = Helioviewer.userSettings.get("state.eventLayerAvailableVisible");
            if(visState == true){
                Helioviewer.userSettings.set("state.eventLayerAvailableVisible", false);
                $(this).addClass('hidden');
                $('#eventJSTree .empty-element').hide();
            }else{
                Helioviewer.userSettings.set("state.eventLayerAvailableVisible", true);
                $(this).removeClass('hidden');
                $('#eventJSTree .empty-element').show();
            }
            e.stopPropagation();
        });

        this.domNode.find(".timestamp").click( function(e) {
            e.stopPropagation();
        });

        
    
    }


});