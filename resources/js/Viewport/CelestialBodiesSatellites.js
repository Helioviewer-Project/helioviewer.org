"use strict";

var CelestialBodiesSatellites = Class.extend(
{
    init: function(){
        this.domNode = $('#SolarBodiesAccordion-Container');//php index template dom node
        this.currentTime = 0;
        this.pointSizes = {
            small: 2,
            medium: 2.5,
            large: 4.5
        }
        this.colors = {
            behind: '#808080',
            front: '#A0A0A0',
            current: 'white',
            black: 'black',
        }
        this.fillColor = 'black';
        this.dashSize = '3 2';

        this._initEventListeners();
        this._buildDOM();
    },

    _initEventListeners: function(){
        $(document).bind("helioviewer-ready", $.proxy(this._hvReady,this));
        $(document).bind("observation-time-changed", $.proxy(this._onTimeChanged,this));
        $(document).bind("replot-celestial-objects", $.proxy(this._replotCoordinates,this));
        $(document).bind("replot-event-markers",   $.proxy(this._refresh, this));
        $(document).bind("toggle-trajectory-checkboxes-to-state", $.proxy(this._treeToggleAllToState, this));
        $(document).bind("toggle-all-labels", $.proxy(this._treeToggleLabels, this));
        $(document).bind("toggle-all-trajectories", $.proxy(this._treeToggleTrajectories, this));
    },

    _buildDOM: function() {
        this.movingContainer = $("#moving-container");//upper level dom node that supports dragging
        
        this.bodiesContainer = $('<div/>');//new container for the solar bodies
        this.bodiesContainer.attr('id','bodies-container').css({'position' : 'absolute'}).appendTo(this.movingContainer);

        this.labelsContainer = $('<div/>');//new container for the labels
        this.labelsContainer.attr('id','labels-container').css({'position' : 'absolute', 'z-index' : '250'}).appendTo(this.bodiesContainer);

        this.trajectoriesContainer = $('<div/>');//new container for the trajectories
        this.trajectoriesContainer.attr('id','trajectories-container').css({'position' : 'absolute'}).appendTo(this.bodiesContainer);

        this.popupsContainer = $('<div/>');//new container for info popups
        this.popupsContainer.attr('id','popups-container').css({'position' : 'absolute', 'z-index' : '350'}).appendTo(this.bodiesContainer);
    },

    _hvReady: function() {
        this._requestGlossary();
    },

    _requestGlossary: function() {
        //assemble the request parameters
        var params = {
            "action"    : "getSolarBodiesGlossary"
        };
        //request data from the api
        $.get(Helioviewer.api, params, $.proxy(this._receiveGlossary, this), "json");
    },

    _receiveGlossary: function(glossary){
        this._buildSidebarTemplate(1,"celestial-bodies-sidebar","Planets",true,glossary);
    },

    _onTimeChanged: function(){
        this.currentTime = helioviewer.timeControls.getTimestamp();
        //assemble the request parameters
        var params = {
            "action"    : "getSolarBodies",
            "time"      : this.currentTime
        };
        //request data from the api
        $.get(Helioviewer.api, params, $.proxy(this._outputSolarBodies, this, true), "json");
    },

    _outputTrajectories: function(ajax,data){
        var self = this;
        var currentRequestTime = helioviewer.timeControls.getTimestamp();
        if(ajax){//this was a response from the api
            var trajectories = data['trajectories'];
            this.trajectories = trajectories;
        }else{//this was a local response to refresh
            var trajectories = this.trajectories;
        }
        this._disableTreeItems(data);
        /**
         * create or find the svgUnderlineContainer DOM Object
         * this underline object is reused and its coordinates updated to move around the page
        */
        if($('#point-date-underline-container').length == 0){//svgUnderlineContainer does not exist yet
            this._buildUnderlineSVG();
            var svgUnderlineContainer = $('#point-date-underline-container');
        }else{//label ontainer div exists
            var svgUnderlineContainer = $('#point-date-underline-container');//locate the container div
            svgUnderlineContainer.hide();
        }

        var observers = Object.keys(trajectories);
        for(var observer of observers){
            var bodies = Object.keys(trajectories[observer]);
            for(var body of bodies){
                var bodyCapitalized = body.charAt(0).toUpperCase() + body.substr(1);
                var containerName = body+"-trajectory";
                if($('#'+containerName).length == 0){//label container div does not exist yet
                    var trajectoryContainer = $('<div/>');//make a new div
                    trajectoryContainer.attr('id',containerName);//set the id
                    this.trajectoriesContainer.append(trajectoryContainer);//append it to the bodiesContainer div
                }else{//label ontainer div exists
                    var trajectoryContainer = $('#'+containerName);//locate the container div
                    trajectoryContainer.empty();//empty the container, remove all child nodes
                }
                var coordinates = Object.keys(trajectories[observer][body]);
                //console.log(coordinates);
                var numCoordinates = coordinates.length;
                if(numCoordinates != 0){
                    var previousPositionCoordinateTime = 0;
                    for(var point of coordinates){
                        //console.log(observer, body, point);
                        var currentPositionCoordinateTime = point;
                        if(Math.abs(currentPositionCoordinateTime-previousPositionCoordinateTime) >= 86400000 || point == coordinates[coordinates.length-1]){
                            var currentPoint = {
                                x: Math.round( trajectories[observer][body][point].x / Helioviewer.userSettings.settings.state.imageScale),
                                y: Math.round( -trajectories[observer][body][point].y / Helioviewer.userSettings.settings.state.imageScale),
                                b: trajectories[observer][body][point].behind_plane_of_sun == 'True',
                                t: currentRequestTime == currentPositionCoordinateTime
                            };
                            //create points for the trajectory
                            if(currentPoint.t){
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
                                'time' : currentPositionCoordinateTime,
                                'target':'#'+containerName+'-hover-date-'+point,
                                'behind':currentPoint.b
                            }).css({
                                'position'  : 'absolute',
                                'left'      :  ( currentPoint.x - Math.floor(pointBoundingBox/2) + 1 ) + 'px',
                                'top'       :  ( currentPoint.y - Math.floor(pointBoundingBox/2) + 1 ) + 'px',
                                'z-index'   :  210+(pointRadius*2)
                            }).appendTo(trajectoryContainer);
                            var textDate = new Date();
                            textDate.setTime(currentPositionCoordinateTime);
                            textDate = textDate.toUTCString().slice(5);
                            textDate = textDate.slice(0,textDate.length-3);
                            textDate += "UTC";
                            var bodyTextDate = bodyCapitalized + ' on <br/>' + textDate; 
                            var hoverDateContainer = $('<div/>').attr({
                                'id' : containerName+'-hover-date-'+point
                            }).addClass('hover-date-container').css({
                                'left'              : currentPoint.x + 'px',
                                'bottom'            : -currentPoint.y + 'px'
                            }).html(bodyTextDate).hide().appendTo(trajectoryContainer);
                            /*var svgHoverDateContainer = $(document.createElementNS('http://www.w3.org/2000/svg','svg')).attr({
                                id : containerName+'-svg-date-'+point,
                                width : pointBoundingBox,
                                height : '100px',
                                'time' : currentPositionCoordinateTime
                            }).appendTo(hoverDateContainer);*/
                            $(document.createElementNS('http://www.w3.org/2000/svg','circle')).attr({
                                id:containerName+'-point-'+point,
                                cx: Math.floor(pointBoundingBox/2),
                                cy: Math.floor(pointBoundingBox/2),
                                r: pointRadius,
                                "stroke": (currentPoint.b ? this.colors.behind : this.colors.front) ,
                                "stroke-width": (currentPoint.t ? 2 : 1),
                                "fill": (currentPoint.t ? this.colors.current : (currentPoint.b ? this.colors.behind : this.colors.front))
                            }).appendTo(svgPointContainer);
                            //bind events
                            if(currentRequestTime != currentPositionCoordinateTime){
                                svgPointContainer.bind('mouseenter',function(){//mouse enter event
                                    $( this ).children().attr({ r: 3 , 'fill' : self.colors.current});
                                    var  target = $( $(this).attr('target') );
                                    target.show();
                                    svgUnderlineContainer.css({
                                        'left'  : target.css('left'),
                                        'bottom': target.css('bottom')
                                    }).show();
                                }).bind('mouseleave',function(){//mouse leave event
                                    $( this ).children().attr({ r: 1.5 , 'fill' : ( $( this ).attr('behind')=='true' ? self.colors.behind : self.colors.front)});
                                    $( $(this).attr('target') ).hide();
                                    svgUnderlineContainer.hide();
                                }).bind('click',function(){//click event
                                    var newDate = new Date();
                                    newDate.setTime( $( this ).attr('time') );
                                    helioviewer.timeControls.setDate(newDate);
                                    $( this ).children().attr({ r: 6 , 'fill' : self.colors.current, 'stroke-width' : 2});
                                    $( this ).unbind('mouseleave');
                                });
                            }else{
                                svgPointContainer.bind('mouseenter',function(){
                                    var  target = $( $(this).attr('target') );
                                    target.show();
                                    svgUnderlineContainer.css({
                                        'left'  : target.css('left'),
                                        'bottom': target.css('bottom')
                                    }).show();
                                }).bind('mouseleave',function(){
                                    $( $(this).attr('target') ).hide();
                                    svgUnderlineContainer.hide();
                                });
                            }
                            //assemble lines for the trajectory
                            if(previousPositionCoordinateTime>0){
                                var loc = previousPositionCoordinateTime;
                                var previousPoint = {
                                    x: Math.round( trajectories[observer][body][loc].x / Helioviewer.userSettings.settings.state.imageScale),
                                    y: Math.round( -trajectories[observer][body][loc].y / Helioviewer.userSettings.settings.state.imageScale),
                                    b: trajectories[observer][body][loc].behind_plane_of_sun == 'True'
                                };
                                var svgLine = {
                                    width: (currentPoint.x - previousPoint.x),
                                    height: (currentPoint.y - previousPoint.y)
                                }
                                var line = {//normalize line to local coordinate for svg
                                    x1: Math.sign(svgLine.width)==1 ? 1 : Math.abs(svgLine.width) + 1,
                                    y1: Math.sign(svgLine.height)==1 ? 1 : Math.abs(svgLine.height) + 1,
                                    x2: Math.sign(svgLine.width)==1 ? svgLine.width+1 : 1,
                                    y2: Math.sign(svgLine.height)==1 ? svgLine.height+1 : 1
                                }
                                var svgLineContainer = $(document.createElementNS('http://www.w3.org/2000/svg','svg')).attr({
                                    id:containerName+'-svg-line-'+point,
                                    width: Math.abs(svgLine.width)+2,
                                    height: Math.abs(svgLine.height)+2
                                }).css({
                                    'position'  : 'absolute',
                                    'left'      :  Math.sign(svgLine.width)==1 ? (previousPoint.x) + 'px' :  (previousPoint.x + svgLine.width) + 'px',
                                    'top'       :  Math.sign(svgLine.height)==1 ? (previousPoint.y) + 'px' : (previousPoint.y + svgLine.height) + 'px'
                                }).appendTo(trajectoryContainer);
                                $(document.createElementNS('http://www.w3.org/2000/svg','line')).attr({
                                    id:containerName+'-line-'+point,
                                    x1:line.x1,
                                    y1:line.y1,
                                    x2:line.x2,
                                    y2:line.y2,
                                    "stroke" : previousPoint.b ? this.colors.behind : this.colors.front,
                                    "stroke-dasharray" : (previousPoint.b ? this.dashSize : '0')
                                }).appendTo(svgLineContainer);
                            }
                            previousPositionCoordinateTime = currentPositionCoordinateTime;
                        }//end time diff > 1 day
                    }//end for each coordinate
                }//end if numCoords != 0
            }
        }
    },
    /**
     * Main callback on receiving data from the api. Can be called locally with the use of the ajax boolean flag
     * 
     * Input:   @data - (object) all the data from the api
     * 
     */
    _outputSolarBodies: function(ajax,data){
        var firstRun = true;
        var coordinates = data['labels'];//extract labels data
        this.coordinates = coordinates;
        var currentTime = Date.now();
        var observers = Object.keys(coordinates);//extract observer names
        for(var observer of observers){
            var bodies = Object.keys(coordinates[observer]);//extract body names (planets + satellites)
            for(var body of bodies){
                var containerName = body+"-container";
                if($('#'+containerName).length == 0){//label container div does not exist yet
                    var labelContainer = $('<div/>');//make a new div
                    labelContainer.attr({'id':containerName, 'time':currentTime});//set the id
                    labelContainer.addClass('celestial-bodies-label');
                    this.labelsContainer.append(labelContainer);//append it to the bodiesContainer div
                }else{//label ontainer div exists
                    firstRun = false;
                    var labelContainer = $('#'+containerName);//locate the container div
                    labelContainer.attr({'time': currentTime});
                    var labelContainerVisible = labelContainer.is(":visible");
                }
                if(coordinates[observer][body] != null){//values exist
                    var correctedCoordinates = {
                        x: Math.round( coordinates[observer][body].x / Helioviewer.userSettings.settings.state.imageScale),
                        y: Math.round( -coordinates[observer][body].y / Helioviewer.userSettings.settings.state.imageScale)
                    };
                    //console.log(correctedCoordinates.x,correctedCoordinates.y);
                    var bodyCapitalized = body.charAt(0).toUpperCase() + body.substr(1);
                    labelContainer.text(bodyCapitalized);
                    labelContainer.css({
                        'left'      :  correctedCoordinates.x + 'px',
                        'top'       :  correctedCoordinates.y + 'px'
                    });
                    this._buildPopupTemplate(observer,body,labelContainer);
                }else{//values don't exist, move offscreen.
                    var correctedCoordinates = {
                        x: -99999,
                        y: -99999
                    };
                    //console.log(correctedCoordinates.x,correctedCoordinates.y);
                    var bodyCapitalized = body.charAt(0).toUpperCase() + body.substr(1);
                    labelContainer.text(bodyCapitalized);
                    labelContainer.css({
                        'left'      :  correctedCoordinates.x + 'px',
                        'top'       :  correctedCoordinates.y + 'px'
                    });
                    this._buildPopupTemplate(observer,body,labelContainer);
                }
            }
            
            
        }
        this._outputTrajectories(ajax,data);
        //if(!firstRun){
            this._treeChangedState();
        //}
        this.labelsContainer.children().each(function(){
            if($(this).attr('time') != currentTime){
                $(this).hide();
            }
        });
        this._closeOldPopups(this.currentTime);
    },

    _replotCoordinates: function(){
        var self = this;
        var currentRequestTime = helioviewer.timeControls.getTimestamp();

        //create underline svg
        var svgUnderlineContainer = $("#point-date-underline-container");
        svgUnderlineContainer.hide();

        var observers = Object.keys(this.coordinates);
        for(var observer of observers){
            var bodies = Object.keys(this.coordinates[observer]);
            for(var body of bodies){
                var containerName = body+"-container";
                if(this.coordinates[observer][body] != null){
                    var bodyCapitalized = body.charAt(0).toUpperCase() + body.substr(1);
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
                }else{
                    var labelContainer = $('#'+containerName);//locate the container div
                    labelContainer.css({
                        'left'      :  -99999 + 'px',
                        'top'       :  -99999 + 'px'
                    });
                }
            }
        }
        this._treeChangedState();

        var observers = Object.keys(this.trajectories);
        for(var observer of observers){
            var bodies = Object.keys(this.trajectories[observer]);
            for(var body of bodies){
                var containerName = body+"-container";
                var coordinates = Object.keys(this.trajectories[observer][body]);
                var trajectoryContainer = $('#'+body+'-trajectory');
                trajectoryContainer.empty();
                var numCoordinates = coordinates.length;
                var previousPositionCoordinateTime = 0;
                for(var point of coordinates){
                    var currentPositionCoordinateTime = point;
                    if(Math.abs(currentPositionCoordinateTime-previousPositionCoordinateTime) > 86400000){
                        var currentPoint = {
                            x: Math.round( this.trajectories[observer][body][point].x / Helioviewer.userSettings.settings.state.imageScale),
                            y: Math.round( -this.trajectories[observer][body][point].y / Helioviewer.userSettings.settings.state.imageScale),
                            b: this.trajectories[observer][body][point].behind_plane_of_sun == 'True',
                            t: currentRequestTime == currentPositionCoordinateTime
                        };
                        //create points for the trajectory
                        if(currentPoint.t){
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
                            'time' : currentPositionCoordinateTime,
                            'target':'#'+containerName+'-hover-date-'+point,
                            'behind': currentPoint.b 
                        }).css({
                            'position'  :   'absolute',
                            'left'      :  ( currentPoint.x - Math.floor(pointBoundingBox/2) + 1 ) + 'px',
                            'top'       :  ( currentPoint.y - Math.floor(pointBoundingBox/2) + 1 ) + 'px',
                            'z-index'   :  210+(pointRadius*2)
                        }).appendTo(trajectoryContainer);
                        var textDate = new Date();
                        textDate.setTime(currentPositionCoordinateTime);
                        textDate = textDate.toUTCString().slice(5);
                        textDate = textDate.slice(0,textDate.length-3);
                        textDate += "UTC";
                        var bodyTextDate = bodyCapitalized + ' on <br/>' + textDate; 
                        var hoverDateContainer = $('<div/>').attr({
                            'id' : containerName+'-hover-date-'+point
                        }).addClass('hover-date-container').css({
                            'left'              : currentPoint.x + 'px',
                            'bottom'            : -currentPoint.y + 'px'
                        }).html(bodyTextDate).hide().appendTo(trajectoryContainer);
                        //bind events
                        //TODO: make a method to reduce code duplication
                        if(currentRequestTime != currentPositionCoordinateTime){
                            svgPointContainer.bind('mouseenter',function(){
                                $( this ).children().attr({ r: 3 , 'fill' : self.colors.current });
                                var  target = $( $(this).attr('target') );
                                target.show();
                                svgUnderlineContainer.css({
                                    'left'  : target.css('left'),
                                    'bottom': target.css('bottom')
                                }).show();
                            }).bind('mouseleave',function(){
                                $( this ).children().attr({ r: 1.5 , 'fill' : ($( this ).attr('behind')=='true' ? self.colors.behind : self.colors.front) });
                                $( $(this).attr('target') ).hide();
                                svgUnderlineContainer.hide();
                            }).bind('click',function(){
                                var newDate = new Date();
                                newDate.setTime( $( this ).attr('time') );
                                helioviewer.timeControls.setDate(newDate);
                                $( this ).children().attr({ r: 6 , 'fill' : self.colors.current, 'stroke-width' : 2});
                                $( this ).unbind('mouseleave');
                            });
                        }else{
                            svgPointContainer.bind('mouseenter',function(){
                                var  target = $( $(this).attr('target') );
                                target.show();
                                svgUnderlineContainer.css({
                                    'left'  : target.css('left'),
                                    'bottom': target.css('bottom')
                                }).show();
                            }).bind('mouseleave',function(){
                                $( $(this).attr('target') ).hide();
                                svgUnderlineContainer.hide();
                            });
                        }
                        
                        $(document.createElementNS('http://www.w3.org/2000/svg','circle')).attr({
                            id:containerName+'-point-'+point,
                            cx: Math.floor(pointBoundingBox/2),
                            cy: Math.floor(pointBoundingBox/2),
                            r: pointRadius,
                            "stroke": (currentPoint.b ? this.colors.behind : this.colors.front) ,
                            "stroke-width": (currentPoint.t ? 2 : 1 ),
                            "fill": (currentPoint.t ? this.colors.current : (currentPoint.b ? this.colors.behind : this.colors.front))
                        }).appendTo(svgPointContainer);
                        //draw the line
                        if(previousPositionCoordinateTime>0){
                            var loc = previousPositionCoordinateTime;
                            var previousPoint = {
                                x: Math.round( this.trajectories[observer][body][loc].x / Helioviewer.userSettings.settings.state.imageScale),
                                y: Math.round( -this.trajectories[observer][body][loc].y / Helioviewer.userSettings.settings.state.imageScale),
                                b: this.trajectories[observer][body][loc].behind_plane_of_sun == 'True'
                            };
                            var svgLine = {
                                width: (currentPoint.x - previousPoint.x),
                                height: (currentPoint.y - previousPoint.y)
                            }
                            var line = {//normalize line to local coordinate for svg
                                x1: Math.sign(svgLine.width)==1 ? 1 : Math.abs(svgLine.width) + 1,
                                y1: Math.sign(svgLine.height)==1 ? 1 : Math.abs(svgLine.height) + 1,
                                x2: Math.sign(svgLine.width)==1 ? svgLine.width+1 : 1,
                                y2: Math.sign(svgLine.height)==1 ? svgLine.height+1 : 1
                            }
                            var svgLineContainer = $(document.createElementNS('http://www.w3.org/2000/svg','svg')).attr({
                                id:containerName+'-svg-line-'+point,
                                width: Math.abs(svgLine.width)+2,
                                height: Math.abs(svgLine.height)+2
                            }).css({
                                'position'  : 'absolute',
                                'left'      :  Math.sign(svgLine.width)==1 ? (previousPoint.x) + 'px' :  (previousPoint.x + svgLine.width) + 'px',
                                'top'       :  Math.sign(svgLine.height)==1 ? (previousPoint.y) + 'px' : (previousPoint.y + svgLine.height) + 'px'
                            }).appendTo(trajectoryContainer);
                            $(document.createElementNS('http://www.w3.org/2000/svg','line')).attr({
                                id:containerName+'-line-'+point,
                                x1:line.x1,
                                y1:line.y1,
                                x2:line.x2,
                                y2:line.y2,
                                "stroke" : previousPoint.b ? this.colors.behind : this.colors.front,
                                "stroke-dasharray" : (previousPoint.b ? this.dashSize : '0')
                            }).appendTo(svgLineContainer);
                        }
                        previousPositionCoordinateTime = currentPositionCoordinateTime;
                    }//end time diff > 1 day
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
        if(this.coordinates[observer][body] != null){
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
                        +   "\t"+'<div class="plane-position-container" '+(behind_plane_of_sun ? 'style="color: Silver"' : 'style="color: Gainsboro"')+'>'
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
                'class' : "body-popup",
                'time' : this.currentTime
            });
            eventPopupDomNode.css({
                'left' : labelContainer.css('left'),
                'top' : labelContainer.css('top'),
                'z-index' : 1000
            });

            eventPopupDomNode.html(content);

            this.popupsContainer.append(eventPopupDomNode);

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
            });

            labelContainer.bind('click', $.proxy(this._toggleBodyInfoPopup, this, eventPopupDomNode));
        }
    },

    _closeOldPopups: function(currentTime){
        this.popupsContainer.children().each(function(index,child){
            var isOpen = !$(child).attr(':hidden');
            var myTime = $(child).attr('time');
            if(isOpen && myTime!=currentTime){
                $(child).hide();
            }
        });
    },

    _toggleBodyInfoPopup: function(eventPopupDomNode){
        if(eventPopupDomNode.is(':hidden')){
            eventPopupDomNode.show("fast");
        }else{
            eventPopupDomNode.hide("fast");
        }
    },

    _buildUnderlineSVG: function(){
        //create unline svg
        var svgUnderlineContainer = $(document.createElementNS('http://www.w3.org/2000/svg','svg')).attr({
            id      : "point-date-underline-container",
            width   : '200',
            height  : '200',
        }).addClass('svg-underline').hide().appendTo(this.bodiesContainer);
        //vertical line
        $(document.createElementNS('http://www.w3.org/2000/svg','line')).attr({
            x1: 1,
            y1: 199,
            x2: 1,
            y2: 180,
            stroke: 'white'
        }).appendTo(svgUnderlineContainer);
        //diagonal line
        $(document.createElementNS('http://www.w3.org/2000/svg','line')).attr({
            x1: 1,
            y1: 180,
            x2: 150,
            y2: 31,
            stroke: 'white'
        }).appendTo(svgUnderlineContainer);
    },

    _buildSidebarTemplate: function (index, id, name, startOpened, glossary) {

        //console.log("index:",index, "id:",id, "name:",name, "markersVisible:",markersVisible, "labelsVisible:", labelsVisible, "startOpened:", startOpened);

        this.domNode.dynaccordion({startClosed: true});

        var visibilityBtn, labelsBtn, availableBtn/*, removeBtn*/, trajectoriesHidden, labelsHidden, availableHidden, head, body, self=this;
        
        var availableVisible = Helioviewer.userSettings.get("state.celestialBodiesAvailableVisible");
        if ( typeof availableVisible == 'undefined') {
            Helioviewer.userSettings.set("state.celestialBodiesAvailableVisible", true);
            availableVisible = true;
        }
        var labelsVisible = Helioviewer.userSettings.get("state.celestialBodiesLabelsVisible");
        if ( typeof labelsVisible == 'undefined') {
            Helioviewer.userSettings.set("state.celestialBodiesLabelsVisible", true);
            labelsVisible = true;
        }
        var trajectoriesVisible = Helioviewer.userSettings.get("state.celestialBodiesTrajectoriesVisible");
        if ( typeof trajectoriesVisible == 'undefined') {
            Helioviewer.userSettings.set("state.celestialBodiesTrajectoriesVisible", true);
            trajectoriesVisible = true;
        }

        // initial visibility
        trajectoriesHidden = (trajectoriesVisible ? "" : " hidden");
        labelsHidden  = ( labelsVisible ? "" : " hidden");
        availableHidden  = ( availableVisible ? "" : " hidden");
        
        availableBtn = '<span class="fa fa-bullseye fa-fw layerAvailableBtn visible'
                        + availableHidden + '" '
                        + 'id="visibilityAvailableBtn-' + id + '" '
                        + 'title="Toggle visibility of empty elements inside Celestial Bodies list" '
                        + '></span>';
        
        visibilityBtn = '<span class="fa fa-eye fa-fw layerManagerBtn visible'
                        + trajectoriesHidden + '" '
                        + 'id="visibilityTrajectories-' + id + '" '
                        + 'title="Toggle visibility of Celestial Body Trajectories" '
                        + '></span>';

        labelsBtn = '<span class="fa fa-tags fa-fw labelsBtn'
                    + labelsHidden + '" '
                    + 'id="visibilityLabels-' + id + '" '
                    + 'title="Toggle Visibility of Celestial Body Text Labels" '
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
        body  = '<div class="row" style="text-align: left;"><div class="buttons"><div id="checkboxBtn-On-'+id+'" title="Toggle All Planet Checkboxes On" class="text-button inline-block"><div class="fa fa-check-square fa-fw"></div>check all</div>';
        body += '<div id="checkboxBtn-Off-'+id+'" title="Toggle All Planet Checkboxes Off" class="text-button inline-block"><div class="fa fa-square fa-fw"></div>check none</div></div>';
        body += '<div id="trajectory-jstree" style="margin-bottom: 5px;" class="jstree-focused"></div></div>';
        
        //Add to accordion
        this.domNode.dynaccordion("addSection", {
            id:     id,
            header: head,
            cell:   body,
            index:  index,
            open:   startOpened
        });
        

        //this.getEventGlossary();

        this.domNode.find("#checkboxBtn-"+id).click( function() {
            $(document).trigger("toggle-trajectory-checkboxes");
        });

        this.domNode.find("#checkboxBtn-On-"+id).click( function() {
            $(document).trigger("toggle-trajectory-checkboxes-to-state", ['on']);
        });

        this.domNode.find("#checkboxBtn-Off-"+id).click( function() {
            $(document).trigger("toggle-trajectory-checkboxes-to-state", ['off']);
        });

        this.domNode.find("#visibilityLabels-"+id).click( function(e) {
            var labelsVisible = Helioviewer.userSettings.get("state.celestialBodiesLabelsVisible");
            if(labelsVisible == true){
                Helioviewer.userSettings.set("state.celestialBodiesLabelsVisible", false);
                $(this).addClass('hidden');
                $(document).trigger("toggle-all-labels", false);
            }else{
                Helioviewer.userSettings.set("state.celestialBodiesLabelsVisible", true);
                $(this).removeClass('hidden');
                $(document).trigger("toggle-all-labels", true);
            }
            e.stopPropagation();
        });

        this.domNode.find("#visibilityTrajectories-"+id ).click( function(e){
            var trajectoriesVisible = Helioviewer.userSettings.get("state.celestialBodiesTrajectoriesVisible");
            if(trajectoriesVisible == true){
                Helioviewer.userSettings.set("state.celestialBodiesTrajectoriesVisible", false);
                $(this).addClass('hidden');
                $(document).trigger("toggle-all-trajectories", false);
            }else{
                Helioviewer.userSettings.set("state.celestialBodiesTrajectoriesVisible", true);
                $(this).removeClass('hidden');
                $(document).trigger("toggle-all-trajectories", true);
            }
            e.stopPropagation();
        })

        this.domNode.find("#visibilityAvailableBtn-"+id).click( function(e) {
            var availableVisible = Helioviewer.userSettings.get("state.celestialBodiesAvailableVisible");
            if(availableVisible == true){
                Helioviewer.userSettings.set("state.celestialBodiesAvailableVisible", false);
                $(this).addClass('hidden');
                $('#trajectory-jstree .empty-element').hide();
            }else{
                Helioviewer.userSettings.set("state.celestialBodiesAvailableVisible", true);
                $(this).removeClass('hidden');
                $('#trajectory-jstree .empty-element').show();
            }
            e.stopPropagation();
        });

        this.domNode.find(".timestamp").click( function(e) {
            e.stopPropagation();
        });

        this._buildJSTree(glossary);
    },

    _buildJSTree: function(glossary){
        var self = this;
        var treeData = this._buildJSTreeData(glossary);

        this.trajectoryTree = $('#trajectory-jstree');
        this.trajectoryTree.empty();
        this.trajectoryTree.jstree({
            "json_data" : { "data": treeData },
            "core" : { "data": treeData },
            "themes"    : { "theme":"default", "dots":true, "icons":false },
            "plugins"   : [ "json_data", "themes", "ui", "checkbox" ],
        });
        
        //this.trajectoryTree.jstree("check_all");
        var savedState = Helioviewer.userSettings.get("state.celestialBodiesChecked");
        if(savedState == null){//new visitor all checked
            this.trajectoryTree.jstree("check_all");
        }else{
            $.each(savedState, function(i, bodyNode){
                var node = '#'+bodyNode;
                self.trajectoryTree.jstree("check_node",node);
            });
        }

        this.trajectoryTree.on("change_state.jstree",$.proxy(this._treeChangedState,this));
        this._onTimeChanged();
        /*
        this.trajectoryTree.bind("change_state.jstree", function(e,data) {
            $('#'+data.rslt[0].attributes[1].nodeValue).toggle();
        });*/
    },

    _treeChangedState: function(e, data){
        //hide all the layers
        this.labelsContainer.children().each(function(){
            $(this).hide();
        });
        this.trajectoriesContainer.children().each(function(){
            $(this).hide();
        });
        /*for(var body of this.treeBodies){
            $('#'+body+'-trajectory').hide();
            $('#'+body+'-container').hide();
        }*/
        var checked = [];
        //show all the checked layers
        this.trajectoryTree.jstree("get_checked",null,false).each(
            function(){
                var myNodeId = $(this).attr('id');
                checked.push(myNodeId);
                var myTarget = $(this).attr('target');
                var myType = $(this).attr('type');
                if(myType == "leaf"){
                    $('#'+myTarget).show();
                }else if(myType == "branch"){
                    $(this).find("[type='leaf']").each(
                        function(){
                            var myTarget = $(this).attr('target');
                            $('#'+myTarget).show();
                        }
                    );
                }
            }
        );
        Helioviewer.userSettings.set("state.celestialBodiesChecked",checked);
    },

    _treeToggleAllToState: function(e,state){
        this.trajectoryTree.unbind("change_state.jstree");
        if(state == "on"){
            this.trajectoryTree.jstree("check_all",null,true);
        }else if(state == "off"){
            this.trajectoryTree.jstree("uncheck_all",null,true);
        }
        this.trajectoryTree.on("change_state.jstree",$.proxy(this._treeChangedState,this));
        this.trajectoryTree.trigger("change_state.jstree");
    },

    _treeToggleLabels: function(e,visible){
        var self = this;
        this.trajectoryTree.unbind("change_state.jstree");
        if(visible==true){
            $("[id$='-tree-label'] .checkbox").each(function(){
                self.trajectoryTree.jstree("check_node",this);
            });
        }else{
            $("[id$='-tree-label'] .checkbox").each(function(){
                self.trajectoryTree.jstree("uncheck_node",this);
            });
        }
        this.trajectoryTree.on("change_state.jstree",$.proxy(this._treeChangedState,this));
        this.trajectoryTree.trigger("change_state.jstree");
    },

    _treeToggleTrajectories: function(e,visible){
        var self = this;
        this.trajectoryTree.unbind("change_state.jstree");
        if(visible==true){
            $("[id$='-tree-trajectory'] .checkbox").each(function(){
                self.trajectoryTree.jstree("check_node",this);
            });
        }else{
            $("[id$='-tree-trajectory'] .checkbox").each(function(){
                self.trajectoryTree.jstree("uncheck_node",this);
            });
        }
        this.trajectoryTree.on("change_state.jstree",$.proxy(this._treeChangedState,this));
        this.trajectoryTree.trigger("change_state.jstree");
    },

    _buildJSTreeData: function(glossary){
        var trajectoryTreeData = [];
        var observers = Object.keys(glossary);
        this.treeObservers = observers;
        for(var observer of observers){
            //trajectories+labels grouping block
            var observerCapitalized = observer.charAt(0).toUpperCase() + observer.substr(1);
            var observerObject = Object();
            observerObject.attr = { id: observer+"-tree-branch", target: observer, type: "branch" };
            observerObject.data = observerCapitalized + " Perspective";
            observerObject.state = "open"; 
            observerObject.children = [];
            //end trajectories+labels grouping block
            var bodies = glossary[observer];
            this.treeBodies = bodies;
            for(var body of bodies){
                var bodyCapitalized = body.charAt(0).toUpperCase() + body.substr(1);
                var bodyObject = Object();
                var attributeID = {
                    id: body+"-tree-branch",//revert to "-tree-label" later for labels only
                    target: body,//revert to "body+'-container'"" for labels only
                    type: "branch"//revert to leaf for labels only
                }
                bodyObject.attr = attributeID;
                bodyObject.data = bodyCapitalized;
                //trajectories+labels block
                bodyObject.state = "open";
                bodyObject.children = [];
                var labelObject = Object();
                var trajectoryObject = Object();
                labelObject.attr = { id : body+"-tree-label", target: body+"-container", type: "leaf"};
                trajectoryObject.attr = { id : body+"-tree-trajectory", target: body+"-trajectory", type: "leaf"};
                labelObject.data = "Label";
                trajectoryObject.data = "Trajectory";
                bodyObject.children.push(labelObject);
                bodyObject.children.push(trajectoryObject);
                //end trajectories+labels block
                trajectoryTreeData.push(bodyObject);
            }
            //trajectoryTreeData.push(observerObject);
        }
        return trajectoryTreeData;
    },

    _disableTreeItems: function(data){
        var visState = Helioviewer.userSettings.get("state.celestialBodiesAvailableVisible");
        $('#trajectory-jstree .empty-element').each(function(){
            $(this).show();
            $(this).removeClass('empty-element');
            $(this).css({'opacity':'1.0'});
        });
        var trajectories = data['trajectories'];
        var labels = data['labels'];

        var labelObservers = Object.keys(labels);
        for(var observer of labelObservers){
            var bodies = Object.keys(labels[observer]);
            for(var body of bodies){
                if(labels[observer][body] == null){
                    //console.log("disabling: "+body+"-tree-label");
                    var treeLabel = $('#'+body+"-tree-label");
                    treeLabel.css({'opacity':'0.5'}).addClass('empty-element');
                }
            }
        }

        var trajectoryObservers = Object.keys(trajectories);
        for(var observer of trajectoryObservers){
            var bodies = Object.keys(trajectories[observer]);
            for(var body of bodies){
                if(trajectories[observer][body].length == 0){
                    //console.log("disabling: "+body+"-tree-trajectory");
                    var treeTrajectory = $('#'+body+"-tree-trajectory");
                    treeTrajectory.css({'opacity':'0.5'}).addClass('empty-element');
                }
            }
        }

        if(visState == false){
            $(this).addClass('hidden');
            $('#trajectory-jstree .empty-element').hide();
        }else{
            $(this).removeClass('hidden');
            $('#trajectory-jstree .empty-element').show();
        }
    }
});