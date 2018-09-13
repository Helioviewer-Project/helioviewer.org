"use strict";

var CelestialBodiesSatellites = Class.extend(
{
    init: function(){
        this.domNode = $('#SolarBodiesAccordion-Container');
        this.getSolarBodies = true;
        this.mercuryReceivedPos = { x: 0, y: 0 };
        this.currentTime = 0;
        this.pointSizes = {
            small: 1.5,
            medium: 2.5,
            large: 4.5
        }
        this.colors = {
            behind: "Gray",
            front: "#BEBEBE",
            current: "white",
            black: "black",
        }
        this.strokeColor = this.colors.behind;
        this.fillColor = "black";
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
        if(this.getSolarBodies){
            this.currentTime = helioviewer.timeControls.getTimestamp();
            var params = {
                "action"    : "getSolarBodies",
                "time"      : this.currentTime
            };
            $.get(Helioviewer.api, params, $.proxy(this._outputCoordinates, this), "json");
        }else{
            this._outputCoordinates(null);
        }
        this.currentTime = helioviewer.timeControls.getTimestamp();
        var params = {
            "action"    : "getTrajectories",
            "time"      : this.currentTime
        };
        $.get(Helioviewer.api, params, $.proxy(this._outputTrajectories, this), "json");
    },

    _outputTrajectories: function(trajectories){
        var self = this;
        var currentRequestTime = helioviewer.timeControls.getTimestamp();
        this.trajectories = trajectories;
        var observers = Object.keys(trajectories);
        for(var observer of observers){
            var bodies = Object.keys(trajectories[observer]);
            for(var body of bodies){
                var containerName = body+"-trajectory";
                if($('#'+containerName).length == 0){//label container div does not exist yet
                    var trajectoryContainer = $('<div/>');//make a new div
                    trajectoryContainer.attr('id',containerName);//set the id
                    this.bodiesContainer.append(trajectoryContainer);//append it to the bodiesContainer div
                }else{//label ontainer div exists
                    var trajectoryContainer = $('#'+containerName);//locate the container div
                    trajectoryContainer.empty();
                }
                var coordinates = Object.keys(trajectories[observer][body]);
                var numCoordinates = coordinates.length;
                for(var point in coordinates){
                    var currentPositionCoordinateTime = trajectories[observer][body][point].t;
                    var currentPoint = {
                        x: Math.round( trajectories[observer][body][point].x / Helioviewer.userSettings.settings.state.imageScale),
                        y: Math.round( -trajectories[observer][body][point].y / Helioviewer.userSettings.settings.state.imageScale)
                    };
                    //create points for the trajectory
                    if(currentRequestTime == currentPositionCoordinateTime){
                        var pointRadius = this.pointSizes.large;
                        this.fillColor = this.colors.current;
                    }else{
                        var pointRadius = this.pointSizes.small;
                        this.fillColor = this.colors.behind;
                    }
                    var pointBorderDiameter = 10;
                    var pointBoundingBox = pointRadius*2 + pointBorderDiameter;
                    var svgPointContainer = $(document.createElementNS('http://www.w3.org/2000/svg','svg')).attr({
                        id : containerName+'-svg-point-'+point,
                        width : pointBoundingBox,
                        height : pointBoundingBox,
                        'time' : currentPositionCoordinateTime
                    }).css({
                        'position'  : 'absolute',
                        'left'      :  ( currentPoint.x - Math.floor(pointBoundingBox/2) + 1 ) + 'px',
                        'top'       :  ( currentPoint.y - Math.floor(pointBoundingBox/2) + 1 ) + 'px',
                        'z-index'   :  25+(pointRadius*2)
                    }).appendTo(trajectoryContainer);
                    if(currentRequestTime != currentPositionCoordinateTime){
                        svgPointContainer.bind('mouseenter',function(){
                            $( this ).children().attr({ r: 3 , 'fill' : self.colors.current});
                        }).bind('mouseleave',function(){
                            $( this ).children().attr({ r: 1.5 , 'fill' : self.colors.behind});
                        }).bind('click',function(){
                            var newDate = new Date();
                            newDate.setTime( $( this ).attr('time') );
                            helioviewer.timeControls.setDate(newDate);
                            $( this ).children().attr({ r: 6 , 'fill' : self.colors.current, 'stroke-width' : 2});
                            $( this ).unbind('mouseleave');
                        });
                    }
                    $(document.createElementNS('http://www.w3.org/2000/svg','circle')).attr({
                        id:containerName+'-point-'+point,
                        cx: Math.floor(pointBoundingBox/2),
                        cy: Math.floor(pointBoundingBox/2),
                        r: pointRadius,
                        "stroke": this.strokeColor,
                        "stroke-width": currentRequestTime == currentPositionCoordinateTime ? 2 : 1,
                        "fill": this.fillColor
                    }).appendTo(svgPointContainer);
                    //assemble lines for the trajectory
                    if(point < numCoordinates - 1){
                        var loc = parseInt(point) + 1;
                        var nextPoint = {
                            x: Math.round( trajectories[observer][body][loc].x / Helioviewer.userSettings.settings.state.imageScale),
                            y: Math.round( -trajectories[observer][body][loc].y / Helioviewer.userSettings.settings.state.imageScale)
                        };
                        var svgLine = {
                            width: (nextPoint.x - currentPoint.x),
                            height: (nextPoint.y - currentPoint.y)
                        }
                        var line = {//normalize line to local coordinate for svg
                            x1: Math.sign(svgLine.width)==1 ? 1 : Math.abs(svgLine.width)+1,
                            y1: Math.sign(svgLine.height)==1 ? 1 : Math.abs(svgLine.height)+1,
                            x2: Math.sign(svgLine.width)==1 ? svgLine.width+1 : 1,
                            y2: Math.sign(svgLine.height)==1 ? svgLine.height+1 : 1
                        }
                        var svgLineContainer = $(document.createElementNS('http://www.w3.org/2000/svg','svg')).attr({
                            id:containerName+'-svg-line-'+point,
                            width: Math.abs(svgLine.width)+2,
                            height: Math.abs(svgLine.height)+2
                        }).css({
                            'position'  : 'absolute',
                            'left'      :  Math.sign(svgLine.width)==1 ? (currentPoint.x) + 'px' :  (currentPoint.x + svgLine.width) + 'px',
                            'top'       :  Math.sign(svgLine.height)==1 ? (currentPoint.y) + 'px' : (currentPoint.y + svgLine.height) + 'px'
                        }).appendTo(trajectoryContainer);
                        $(document.createElementNS('http://www.w3.org/2000/svg','line')).attr({
                            id:containerName+'-line-'+point,
                            x1:line.x1,
                            y1:line.y1,
                            x2:line.x2,
                            y2:line.y2,
                            "stroke":this.strokeColor
                        }).appendTo(svgLineContainer);
                    }
                }
            }
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
                    labelContainer.attr('id',containerName);//set the id
                    this.bodiesContainer.append(labelContainer);//append it to the bodiesContainer div
                }else{//label ontainer div exists
                    var labelContainer = $('#'+containerName);//locate the container div
                }
                var correctedCoordinates = {
                    x: Math.round( coordinates[observer][body].x / Helioviewer.userSettings.settings.state.imageScale),
                    y: Math.round( -coordinates[observer][body].y / Helioviewer.userSettings.settings.state.imageScale)
                };
                var bodyCapitalized = body.charAt(0).toUpperCase() + body.substr(1);
                labelContainer.text(bodyCapitalized);
                labelContainer.css({
                    'position'  : 'absolute',
                    'left'      :  correctedCoordinates.x + 'px',
                    'top'       :  correctedCoordinates.y + 'px',
                    'z-index'   :  100,
                    'text-shadow'   : '0px 0px 2px #000, 0px 0px 4px #000, 0px 0px 6px #000'
                });
                this._buildPopupTemplate(observer,body,labelContainer);
            }
        }
    },

    _replotCoordinates: function(){
        var self = this;
        var currentRequestTime = helioviewer.timeControls.getTimestamp();
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
                var coordinates = Object.keys(this.trajectories[observer][body]);
                var trajectoryContainer = $('#'+body+'-trajectory');
                trajectoryContainer.empty();
                var numCoordinates = coordinates.length;
                for(var point in coordinates){
                    var currentPositionCoordinateTime = this.trajectories[observer][body][point].t;
                    var currentPoint = {
                        x: Math.round( this.trajectories[observer][body][point].x / Helioviewer.userSettings.settings.state.imageScale),
                        y: Math.round( -this.trajectories[observer][body][point].y / Helioviewer.userSettings.settings.state.imageScale)
                    };
                    //create points for the trajectory
                    if(currentRequestTime == currentPositionCoordinateTime){
                        var pointRadius = this.pointSizes.large;
                        this.fillColor = this.colors.current;
                    }else{
                        var pointRadius = this.pointSizes.small;
                        this.fillColor = this.colors.behind;
                    }
                    var pointBorderDiameter = 10;
                    var pointBoundingBox = pointRadius*2 + pointBorderDiameter;
                    var svgPointContainer = $(document.createElementNS('http://www.w3.org/2000/svg','svg')).attr({
                        id : containerName+'-svg-point-'+point,
                        width : pointBoundingBox,
                        height : pointBoundingBox,
                        'time' : currentPositionCoordinateTime
                    }).css({
                        'position'  : 'absolute',
                        'left'      :  ( currentPoint.x - Math.floor(pointBoundingBox/2) + 1 ) + 'px',
                        'top'       :  ( currentPoint.y - Math.floor(pointBoundingBox/2) + 1 ) + 'px',
                        'z-index'   :  25
                    }).appendTo(trajectoryContainer);
                    if(currentRequestTime != currentPositionCoordinateTime){
                        svgPointContainer.bind('mouseenter',function(){
                            $( this ).children().attr({ r: 3 , 'fill' : self.colors.current });
                        }).bind('mouseleave',function(){
                            $( this ).children().attr({ r: 1.5 , 'fill' : self.colors.behind });
                        }).bind('click',function(){
                            var newDate = new Date();
                            newDate.setTime( $( this ).attr('time') );
                            helioviewer.timeControls.setDate(newDate);
                            $( this ).children().attr({ r: 6 , 'fill' : self.colors.current, 'stroke-width' : 2});
                            $( this ).unbind('mouseleave');
                        });
                    }
                    $(document.createElementNS('http://www.w3.org/2000/svg','circle')).attr({
                        id:containerName+'-point-'+point,
                        cx: Math.floor(pointBoundingBox/2),
                        cy: Math.floor(pointBoundingBox/2),
                        r: pointRadius,
                        "stroke": this.strokeColor,
                        "stroke-width": currentRequestTime == currentPositionCoordinateTime ? 2 : 1,
                        "fill": this.fillColor
                    }).appendTo(svgPointContainer);
                    
                    if(point < numCoordinates - 1){
                        var loc = parseInt(point) + 1;
                        var nextPoint = {
                            x: Math.round( this.trajectories[observer][body][loc].x / Helioviewer.userSettings.settings.state.imageScale),
                            y: Math.round( -this.trajectories[observer][body][loc].y / Helioviewer.userSettings.settings.state.imageScale)
                        };
                        var svg = {
                            width: (nextPoint.x - currentPoint.x),
                            height: (nextPoint.y - currentPoint.y)
                        }
                        var line = {//normalize line to local coordinate for svg
                            x1: Math.sign(svg.width)==1 ? 1 : Math.abs(svg.width)+1,
                            y1: Math.sign(svg.height)==1 ? 1 : Math.abs(svg.height)+1,
                            x2: Math.sign(svg.width)==1 ? svg.width+1 : 1,
                            y2: Math.sign(svg.height)==1 ? svg.height+1 : 1
                        }
                        var svgContainer = $(document.createElementNS('http://www.w3.org/2000/svg','svg')).attr({
                            id:containerName+'-svg-'+point,
                            width: Math.abs(svg.width)+2,
                            height: Math.abs(svg.height)+2
                        }).css({
                            'position'  : 'absolute',
                            'left'      :  Math.sign(svg.width)==1 ? (currentPoint.x) + 'px' :  (currentPoint.x + svg.width) + 'px',
                            'top'       :  Math.sign(svg.height)==1 ? (currentPoint.y) + 'px' : (currentPoint.y + svg.height) + 'px'
                        }).appendTo(trajectoryContainer);
                        $(document.createElementNS('http://www.w3.org/2000/svg','line')).attr({
                            id:containerName+'-line-'+point,
                            x1:line.x1,
                            y1:line.y1,
                            x2:line.x2,
                            y2:line.y2,
                            "stroke":this.strokeColor
                        }).appendTo(svgContainer);
                    }
                }
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
                    +   "\t"+'<div class="param-container"><div class="param-label user-selectable">Distance from '+ bodyCapitalized +' to Sun:</div></div>'+"\n"
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