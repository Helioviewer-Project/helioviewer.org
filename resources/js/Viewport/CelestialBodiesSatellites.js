/**
 * @fileoverview Contains the functionality to display Celestial Bodies and Satelites Labels and Trajectories.
 * @author <a href="mailto:kirill.g.vorobyev@nasa.gov">Kirill Vorobyev</a>
 */
"use strict";

var CelestialBodiesSatellites = Class.extend(
{
    init: function(){
        
        this.enableTrajectories = 1;// 0 = disable, 1 = partial, 2 = full trajectories
        // array of body names as they appear in the glossary, used with partial mode.
        this.enabledTrajectoriesNames;

        // Modify API glossary to contain any non-planet bodies and their additional metrics
        this.glossary = {};

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

    /**
     *  Returns a string of available celestial bodies
     * 
     *  @return {String} currently selected celestial bodies from the sidebar
     */ 
    serializeCelestialBodiesLabels: function(){
        var savedState = Helioviewer.userSettings.get("state.celestialBodiesChecked");
        var serializedString = '';
        var observers = Object.keys(savedState);
        for(var observer of observers){
            var bodies = savedState[observer];
            for(var body of bodies){
                var indexOfLabel = body.indexOf('-tree-label');
                var indexOfBranch = body.indexOf('-tree-branch');
                if(indexOfLabel != -1){
                    var bodyName = body.slice(0,indexOfLabel);
                    serializedString += bodyName+',';
                }else if(indexOfBranch != -1){
                    var bodyName = body.slice(0,indexOfBranch);
                    serializedString += bodyName+',';
                }
            }
        }
        serializedString = serializedString.slice(0,-1);
        return serializedString;
    },

    /**
     *  Returns a string of available celestial bodies
     * 
     *  @return {String} currently selected celestial bodies from the sidebar
     */ 
    // TO DO: parse and serialize trajectory string
    serializeCelestialBodiesTrajectories: function(){
        var savedState = Helioviewer.userSettings.get("state.celestialBodiesChecked");
        var serializedString = '';
        var observers = Object.keys(savedState);
        for(var observer of observers){
            var bodies = savedState[observer];
            for(var body of bodies){
                var indexOfLabel = body.indexOf('-tree-trajectory');
                var indexOfBranch = body.indexOf('-tree-branch');
                if(indexOfLabel != -1){
                    var bodyName = body.slice(0,indexOfLabel);
                    serializedString += bodyName+',';
                }else if(indexOfBranch != -1){
                    var bodyName = body.slice(0,indexOfBranch);
                    serializedString += bodyName+',';
                }
            }
        }
        serializedString = serializedString.slice(0,-1);
        return serializedString;
    },

    _initEventListeners: function(){
        $(document).bind("helioviewer-ready", $.proxy(this._hvReady,this));
        $(document).bind("observation-time-changed", $.proxy(this._onTimeChanged,this));
        $(document).bind("replot-celestial-objects", $.proxy(this._replotCoordinates,this));
        //$(document).bind("replot-celestial-objects", $.proxy(this._outputSolarBodies, this, false));
        $(document).bind("replot-event-markers",   $.proxy(this._refresh, this));
        $(document).bind("toggle-checkboxes-to-state", $.proxy(this._treeToggleAllToState, this));
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
        this.glossary = glossary;
        //this.observerBodies = glossary['observers'];
        this.glossaryMods = glossary['mods'];
        this.enabledTrajectoriesNames = glossary['enabledTrajectories'];
        this.glossaryModsKeys = Object.keys(glossary['mods']);

        this._createUserSettings(glossary);

        this._buildSidebarTemplate(this.glossary,this.glossaryMods);
    },

    _createUserSettings: function(glossary) {
        //checks to make sure user settings exist based on glossary received and creates them if they do not.
        var observers = Object.keys(glossary['observers']);
        var celestialBodiesCheckedState = Helioviewer.userSettings.get('state.celestialBodiesChecked');
        if( celestialBodiesCheckedState === {} || Array.isArray(celestialBodiesCheckedState) || celestialBodiesCheckedState === null ){
            Helioviewer.userSettings.set('state.celestialBodiesChecked',{});
            for( var observer of observers ){
                var newSetting = "state.celestialBodiesChecked."+observer;
                Helioviewer.userSettings.set(newSetting,null);
            }
        }else{
            for( var observer of observers ){
                var setting = "state.celestialBodiesChecked."+observer;
                Helioviewer.userSettings.get(setting);
                if(setting === undefined){
                    Helioviewer.userSettings.set(setting,null);
                }
            }
        }
        var celestialBodiesAvailableVisibleState = Helioviewer.userSettings.get('state.celestialBodiesAvailableVisible');
        if( celestialBodiesAvailableVisibleState === {} || typeof(celestialBodiesAvailableVisibleState) === typeof(true) ){
            Helioviewer.userSettings.set('state.celestialBodiesAvailableVisible',{});
        }
        var celestialBodiesLabelsVisibleState = Helioviewer.userSettings.get('state.celestialBodiesLabelsVisible');
        if( celestialBodiesLabelsVisibleState === {} || typeof(celestialBodiesLabelsVisibleState) === typeof(true) ){
            Helioviewer.userSettings.set('state.celestialBodiesLabelsVisible',{});
        }
        var celestialBodiesTrajectoriesVisibleState = Helioviewer.userSettings.get('state.celestialBodiesTrajectoriesVisible');
        if( celestialBodiesTrajectoriesVisibleState === {} || typeof(celestialBodiesTrajectoriesVisibleState) === typeof(true) ){
            Helioviewer.userSettings.set('state.celestialBodiesTrajectoriesVisible',{});
        }
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

    _changeTimeTrajectory: function(direction,newTimestamp){
        if(direction == 'next'){
            if(newTimestamp["time"] != null){
                var newDate = new Date();
                newDate.setTime(newTimestamp["time"]+1000);//set the real date from the data + 1 second
                newDate = Date.parseUTCDate(newDate.toISOString());//re-parse to truncate milliseconds before changing date
                //after parse, the date will be in the transit within 1 second of the start.
                helioviewer.timeControls.setDate(newDate);
            }
        }else if(direction == 'last'){
            if(newTimestamp["time"] != null){
                var newDate = new Date();
                newDate.setTime(newTimestamp["time"]);//set the real date from the data
                newDate = Date.parseUTCDate(newDate.toISOString());//re-parse to truncate milliseconds before changing date
                //after parse, the date will be in the transit within 1 second of the end.
                helioviewer.timeControls.setDate(newDate);
            }
        }
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
            this._disableTreeItems(data,observer);
            var observerTrajectoriesContainerName = observer + '-trajectories-container';
            var observerTrajectoriesContainer = $('#'+observerTrajectoriesContainerName);
            if(observerTrajectoriesContainer.length == 0){//label container div does not exist yet
                observerTrajectoriesContainer = $('<div/>');//new observer container for the trajectories
                observerTrajectoriesContainer.attr('id',observerTrajectoriesContainerName).css({'position' : 'absolute', 'z-index' : '250'}).appendTo(this.trajectoriesContainer);
            }
            var bodies = Object.keys(trajectories[observer]);
            for(var body of bodies){
                var bodyCapitalized = body.charAt(0).toUpperCase() + body.substr(1);
                if(this.glossaryModsKeys.includes(body)){
                    bodyCapitalized = this.glossaryMods[body].name;
                }
                var containerName = observer+'-'+body+"-trajectory";
                if($('#'+containerName).length == 0){//label container div does not exist yet
                    var trajectoryContainer = $('<div/>');//make a new div
                    trajectoryContainer.attr('id',containerName);//set the id
                    observerTrajectoriesContainer.append(trajectoryContainer);//append it to the bodiesContainer div
                }else{//label ontainer div exists
                    var trajectoryContainer = $('#'+containerName);//locate the container div
                    trajectoryContainer.empty();//empty the container, remove all child nodes
                }
                var coordinates = Object.keys(trajectories[observer][body]);
                //console.log(coordinates);
                var numCoordinates = coordinates.length;
                if(numCoordinates != 0){
                    var previousPositionCoordinateTime = 0;
                    var firstCoordinate = true;
                    for(var point of coordinates){
                        //console.log(observer, body, point);
                        var currentPositionCoordinateTime = point;
                        var temporalCadence = 86400000;
                        if(this.glossaryModsKeys.includes(body)){
                            temporalCadence = this.glossaryMods[body].cadence;
                        }
                        if(Math.abs(currentPositionCoordinateTime-previousPositionCoordinateTime) >= temporalCadence || point == coordinates[coordinates.length-1]){
                            var correctedCoordinates = this._convertHPCtoHCC(trajectories[observer][body][point],body,true);
                            var currentPoint = {
                                x: Math.round( correctedCoordinates.x ),
                                y: Math.round( correctedCoordinates.y ),
                                b: trajectories[observer][body][point].behind_plane_of_sun == 'True',
                                t: Math.abs(currentPositionCoordinateTime-currentRequestTime) <= 1000
                            };
                            //console.log(Math.abs(currentPositionCoordinateTime-currentRequestTime) <= 1000,Math.abs(currentPositionCoordinateTime-currentRequestTime));
                            /*var currentPoint = {
                                x: Math.round( trajectories[observer][body][point].x / Helioviewer.userSettings.settings.state.imageScale),
                                y: Math.round( -trajectories[observer][body][point].y / Helioviewer.userSettings.settings.state.imageScale),
                                b: trajectories[observer][body][point].behind_plane_of_sun == 'True',
                                t: currentRequestTime == currentPositionCoordinateTime
                            };*/
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
                            var timeAttribute;
                            if(firstCoordinate){
                                timeAttribute = parseInt(point)+1000;
                                firstCoordinate = false;
                            }else{
                                timeAttribute = point;
                            }
                            var svgPointContainer = $(document.createElementNS('http://www.w3.org/2000/svg','svg')).attr({
                                id : containerName+'-svg-point-'+point,
                                width : pointBoundingBox,
                                height : pointBoundingBox,
                                'time' : timeAttribute,
                                'target':'#'+containerName+'-hover-date-'+point,
                                'behind':currentPoint.b
                            }).css({
                                'position'  : 'absolute',
                                'left'      :  ( currentPoint.x - Math.floor(pointBoundingBox/2) + 1 ) + 'px',
                                'top'       :  ( currentPoint.y - Math.floor(pointBoundingBox/2) + 1 ) + 'px',
                                'z-index'   :  210+(pointRadius*2)
                            }).addClass('celestial-pointer').appendTo(trajectoryContainer);
                            var textDate = new Date();
                            textDate.setTime(timeAttribute);
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
                            if(!currentPoint.t){
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
                                    newDate.setTime( $( this ).attr('time') );//set the real date from the data
                                    newDate = Date.parseUTCDate(newDate.toISOString());//re-parse to truncate milliseconds before changing date
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
                                var previousCorrectedCoordinates = this._convertHPCtoHCC(trajectories[observer][body][loc],body,true);
                                var previousPoint = {
                                    x: Math.round( previousCorrectedCoordinates.x ),
                                    y: Math.round( previousCorrectedCoordinates.y ),
                                    b: trajectories[observer][body][loc].behind_plane_of_sun == 'True'
                                };
                                /*var previousPoint = {
                                    x: Math.round( trajectories[observer][body][loc].x / Helioviewer.userSettings.settings.state.imageScale),
                                    y: Math.round( -trajectories[observer][body][loc].y / Helioviewer.userSettings.settings.state.imageScale),
                                    b: trajectories[observer][body][loc].behind_plane_of_sun == 'True'
                                };*/
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
        var backToFrontObservers = observers.reverse();
        for(var observer of backToFrontObservers){
            var observerLabelsContainerName = observer + '-labels-container';
            var observerLabelsContainer = $('#'+observerLabelsContainerName);
            if(observerLabelsContainer.length == 0){//label container div does not exist yet
                observerLabelsContainer = $('<div/>');//new observer container for the labels
                observerLabelsContainer.attr('id',observerLabelsContainerName).css({'position' : 'absolute', 'z-index' : '250'}).appendTo(this.labelsContainer);
            }
            var bodies = Object.keys(coordinates[observer]);//extract body names (planets + satellites)
            var backToFrontBodies = bodies.reverse();
            for(var body of backToFrontBodies){
                var containerName = observer+'-'+body+"-container";
                if($('#'+containerName).length == 0){//label container div does not exist yet
                    var labelContainer = $('<div/>');//make a new div
                    labelContainer.attr({'id':containerName, 'time':currentTime});//set the id
                    labelContainer.addClass('celestial-bodies-label');
                    observerLabelsContainer.append(labelContainer);//append it to the observerLabelsContainer div
                }else{//label ontainer div exists
                    firstRun = false;
                    var labelContainer = $('#'+containerName);//locate the container div
                    labelContainer.attr({'time': currentTime});
                    var labelContainerVisible = labelContainer.is(":visible");
                }
                if(coordinates[observer][body] != null){//values exist
                    var correctedCoordinates = this._convertHPCtoHCC(coordinates[observer][body],body,true);
                    // var correctedCoordinates = {
                    //     x: Math.round( coordinates[observer][body].x / Helioviewer.userSettings.settings.state.imageScale),
                    //     y: Math.round( -coordinates[observer][body].y / Helioviewer.userSettings.settings.state.imageScale)
                    // };
                    //console.log(correctedCoordinates.x,correctedCoordinates.y);
                    var bodyCapitalized = body.charAt(0).toUpperCase() + body.substr(1);
                    if(this.glossaryModsKeys.includes(body)){
                        bodyCapitalized = this.glossaryMods[body].name;
                        if(this.glossaryMods[body].arrow){
                            bodyCapitalized = '↖'+bodyCapitalized;
                        }
                    }
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
            observerLabelsContainer.children().each(function(){
                if($(this).attr('time') != currentTime){
                    $(this).hide();
                }
            });
        }
        this._outputTrajectories(ajax,data);

        for(var observer of observers){
            var trajectoryTree = $('#'+observer+'-jstree');
            trajectoryTree.trigger("change_state.jstree");
        }
        // this.labelsContainer.children().each(function(){
        //     if($(this).attr('time') != currentTime){
        //         $(this).hide();
        //     }
        // });
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
                var containerName = observer+'-'+body+"-container";
                if(this.coordinates[observer][body] != null){
                    var bodyCapitalized = body.charAt(0).toUpperCase() + body.substr(1);
                    if(this.glossaryModsKeys.includes(body)){
                        bodyCapitalized = this.glossaryMods[body].name;
                        if(this.glossaryMods[body].arrow){
                            bodyCapitalized = '↖'+bodyCapitalized;
                        }
                    }
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
        
        var observers = Object.keys(this.trajectories);
        for(var observer of observers){
            var bodies = Object.keys(this.trajectories[observer]);
            for(var body of bodies){
                var containerName = observer+'-'+body+"-container";
                var coordinates = Object.keys(this.trajectories[observer][body]);
                var trajectoryContainer = $('#'+observer+'-'+body+'-trajectory');
                trajectoryContainer.empty();
                var numCoordinates = coordinates.length;
                var previousPositionCoordinateTime = 0;
                bodyCapitalized = body.charAt(0).toUpperCase() + body.substr(1);
                if(this.glossaryModsKeys.includes(body)){
                    bodyCapitalized = this.glossaryMods[body].name;
                }
                var firstCoordinate = true;
                for(var point of coordinates){
                    var currentPositionCoordinateTime = point;
                    var temporalCadence = 86400000;
                    if(this.glossaryModsKeys.includes(body)){
                        temporalCadence = this.glossaryMods[body].cadence;
                    }
                    if(Math.abs(currentPositionCoordinateTime-previousPositionCoordinateTime) >= temporalCadence || point == coordinates[coordinates.length-1]){
                        var currentPoint = {
                            x: Math.round( this.trajectories[observer][body][point].x / Helioviewer.userSettings.settings.state.imageScale),
                            y: Math.round( -this.trajectories[observer][body][point].y / Helioviewer.userSettings.settings.state.imageScale),
                            b: this.trajectories[observer][body][point].behind_plane_of_sun == 'True',
                            t: Math.abs(currentPositionCoordinateTime-currentRequestTime) <= 1000
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
                        var timeAttribute;
                        if(firstCoordinate){
                            timeAttribute = parseInt(point)+1000;
                            firstCoordinate = false;
                        }else{
                            timeAttribute = point;
                        }
                        var svgPointContainer = $(document.createElementNS('http://www.w3.org/2000/svg','svg')).attr({
                            id : containerName+'-svg-point-'+point,
                            width : pointBoundingBox,
                            height : pointBoundingBox,
                            'time' : timeAttribute,
                            'target':'#'+containerName+'-hover-date-'+point,
                            'behind': currentPoint.b 
                        }).css({
                            'position'  :   'absolute',
                            'left'      :  ( currentPoint.x - Math.floor(pointBoundingBox/2) + 1 ) + 'px',
                            'top'       :  ( currentPoint.y - Math.floor(pointBoundingBox/2) + 1 ) + 'px',
                            'z-index'   :  210+(pointRadius*2)
                        }).addClass('celestial-pointer').appendTo(trajectoryContainer);
                        var textDate = new Date();
                        textDate.setTime(timeAttribute);
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
                        if(!currentPoint.t){
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
                                newDate.setTime( $( this ).attr('time') ); //set the real date from the data
                                newDate = Date.parseUTCDate(newDate.toISOString()); //re-parse to truncate milliseconds before changing date
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
            if(this.glossaryModsKeys.includes(body)){
                bodyCapitalized = this.glossaryMods[body].name;
            }
            var observerCapitalized = observer.toUpperCase()
            var raw_distance_sun_to_body_au = this.coordinates[observer][body].distance_sun_to_body_au;
            var raw_distance_observer_to_body_au = this.coordinates[observer][body].distance_observer_to_body_au;
            var raw_distance_sun_to_observer_au = this.coordinates[observer][body].distance_sun_to_observer_au;
            var displayDistances = false;
            if(raw_distance_sun_to_body_au != null || raw_distance_observer_to_body_au != null || raw_distance_sun_to_observer_au != null){
                var distance_sun_to_body_au_rounded = this.coordinates[observer][body].distance_sun_to_body_au.toString().slice(0,10);
                var distance_observer_to_body_au_rounded = this.coordinates[observer][body].distance_observer_to_body_au.toString().slice(0,10);
                var distance_sun_to_observer_au = this.coordinates[observer][body].distance_sun_to_observer_au.toString().slice(0,10);
                var behind_plane_of_sun = (this.coordinates[observer][body].behind_plane_of_sun == "True");
                displayDistances = true;
            }
            var url = 'https://solarsystem.nasa.gov/planets/'+body+'/overview/';
            if(this.glossaryModsKeys.includes(body)){
                url = this.glossaryMods[body].url;
            }
            var content = '';
            content     += '<div class="close-button ui-icon ui-icon-closethick" title="Close PopUp Window"></div>'+"\n"
                        +  '<h1 class="user-selectable">'+bodyCapitalized+' as seen from '+observerCapitalized+'</h1>'+"\n";
            if(displayDistances){
                //Distance Sun to Body
                content += '<div class="container">'+"\n"
                        +   "\t"+'<div class="param-container"><div class="param-label user-selectable">Distance from '+ bodyCapitalized +' to Sun:</div></div>'+"\n"
                        +   "\t"+'<div class="value-container"><div class="param-value user-selectable">'+distance_sun_to_body_au_rounded+' AU</div></div>'
                        +   '</div>'+"\n";
                //Distance Observer to Body
                content += '<div class="container">'+"\n"
                        +   "\t"+'<div class="param-container"><div class="param-label user-selectable">Distance from '+observerCapitalized+' to '+bodyCapitalized+':</div></div>'+"\n"
                        +   "\t"+'<div class="value-container"><div class="param-value user-selectable">'+distance_observer_to_body_au_rounded+' AU</div></div>'
                        +   '</div>'+"\n";
                //Distance Sun to Observer
                content += '<div class="container">'+"\n"
                        +   "\t"+'<div class="param-container"><div class="param-label user-selectable">Distance from the Sun to '+observerCapitalized+':</div></div>'+"\n"
                        +   "\t"+'<div class="value-container"><div class="param-value user-selectable">'+distance_sun_to_observer_au+' AU</div></div>'
                        +   '</div>'+"\n";

                //Additional Metrics modifications to include from glossary mods list
                if(this.glossaryModsKeys.includes(body)){
                    for(var metric in this.glossaryMods[body].metrics){
                        var raw_metric = this.coordinates[observer][body][metric];
                        if(raw_metric != null){
                            var metricTitle = this.glossaryMods[body].metrics[metric].title; //Prefix title before data metric display
                            var metricUnit = this.glossaryMods[body].metrics[metric].unit; //Postfix unit after data metric display
                            var metricValue = raw_metric.toString().slice(0,10 - (metricUnit.length-2));
                            content += '<div class="container">'+"\n"
                                    +   "\t"+'<div class="param-container"><div class="param-label user-selectable">'+metricTitle+':</div></div>'+"\n"
                                    +   "\t"+'<div class="value-container"><div class="param-value user-selectable">'+metricValue+' '+metricUnit+'</div></div>'
                                    +   '</div>'+"\n";
                        }
                    }
                }

                //Front/Behind plane of the sun
                content += '<div class"container">'+"\n"
                        +   "\t"+'<div class="plane-position-container" '+(behind_plane_of_sun ? 'style="color: Silver"' : 'style="color: Gainsboro"')+'>'
                        +   bodyCapitalized+' is '+(behind_plane_of_sun ? ' behind ' : ' in front of ')+' the plane of the sun.'
                        +   '</div></div>'+"\n";
            }
            
            //URL
            content += '<div class="btn-label btn event-search-external text-btn" data-url=\"'+url+'\" target="_blank"><i class="fa fa-search fa-fw"></i>Learn more about '+bodyCapitalized+'<i class="fa fa-external-link fa-fw"></i></div>\
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

    _buildSidebarTemplate: function (glossary, glossaryMods) {

        var index = 0;
        var idDescriptor = "-dynaccordion";
        //console.log("index:",index, "id:",id, "name:",name, "markersVisible:",markersVisible, "labelsVisible:", labelsVisible, "startOpened:", startOpened);
        this.domNode.dynaccordion({startClosed: true});

        var observers = Object.keys(glossary['observers']);
        for(var observer of observers){
            var visibilityBtn, labelsBtn, availableBtn/*, removeBtn*/, trajectoriesHidden, labelsHidden, availableHidden, head, body,checkboxBtnOn, checkboxBtnOff,jsTreeDiv, self=this;
            
            var availableVisible = Helioviewer.userSettings.get("state.celestialBodiesAvailableVisible."+observer);
            if ( typeof availableVisible == 'undefined' ) {
                Helioviewer.userSettings.set("state.celestialBodiesAvailableVisible."+observer, true);
                availableVisible = true;
            }
            var labelsVisible = Helioviewer.userSettings.get("state.celestialBodiesLabelsVisible."+observer);
            if ( typeof labelsVisible == 'undefined' ) {
                Helioviewer.userSettings.set("state.celestialBodiesLabelsVisible."+observer, true);
                labelsVisible = true;
            }
            var trajectoriesVisible = Helioviewer.userSettings.get("state.celestialBodiesTrajectoriesVisible."+observer);
            if ( typeof trajectoriesVisible == 'undefined' ) {
                Helioviewer.userSettings.set("state.celestialBodiesTrajectoriesVisible."+observer, true);
                trajectoriesVisible = true;
            }
            var accordionOpen = Helioviewer.userSettings.get("state.celestialBodiesAccordionOpen."+observer);
            if( typeof accordionOpen == 'undefined' ){
                Helioviewer.userSettings.set("state.celestialBodiesAccordionOpen."+observer, false);
                accordionOpen = false;
            }

            // initial visibility
            trajectoriesHidden = (trajectoriesVisible ? "" : " hidden");
            labelsHidden  = ( labelsVisible ? "" : " hidden");
            availableHidden  = ( availableVisible ? "" : " hidden");
            
            availableBtn = '<span class="fa fa-bullseye fa-fw layerAvailableBtn visible'
                            + availableHidden + '" '
                            + 'id="visibilityAvailableBtn-' + observer + '" '
                            + 'title="Toggle visibility of checkboxes for planets not currently in viewport" '
                            + 'observer="'+observer+'"'
                            + '></span>';
            
            visibilityBtn = '<span class="fa fa-eye fa-fw layerManagerBtn visible'
                            + trajectoriesHidden + '" '
                            + 'id="visibilityTrajectories-' + observer + '" '
                            + 'title="Toggle visibility of Celestial Body Trajectories" '
                            + 'observer="'+observer+'"'
                            + '></span>';

            labelsBtn = '<span class="fa fa-tags fa-fw labelsBtn'
                        + labelsHidden + '" '
                        + 'id="visibilityLabels-' + observer + '" '
                        + 'title="Toggle Visibility of Celestial Body Text Labels" '
                        + 'observer="'+observer+'"'
                        + '></span>';

            head = '<div class="layer-Head ui-accordion-header ui-helper-reset ui-state-default ui-corner-all">'
                    +     '<div class="left">'
                    +      ' [' + observer.toUpperCase() + ']'
                    +     '</div>'
                    +     '<div class="right">'
                    +        '<span class="timestamp user-selectable"></span>'
                    +        availableBtn
                    +		  visibilityBtn
                    +        labelsBtn
                    +     '</div>'
                    + '</div>';

            // Create accordion entry body
            checkboxBtnOn  = '<div id="checkboxBtn-On-'+observer+'" '
                            +'title="Toggle All Planet Checkboxes On" '
                            +'class="text-button inline-block" '
                            +'observer="'+observer+'">'
                            +    '<div class="fa fa-check-square fa-fw"></div>'
                            +'check all</div>';
            checkboxBtnOff = '<div id="checkboxBtn-Off-'+observer+'" '
                             +'title="Toggle All Planet Checkboxes Off" '
                             +'class="text-button inline-block" '
                             +'observer="'+observer+'">'
                             +    '<div class="fa fa-square fa-fw"></div>'
                             +'check none</div>';
            jsTreeDiv      = '<div id="'+observer+'-jstree" style="margin-bottom: 5px;" class="jstree-focused observer-jstree"></div>';

            body  = '<div class="row" style="text-align: left;">'
                  + '<div class="buttons">'
                  + checkboxBtnOn
                  + checkboxBtnOff
                  + '</div>'
                  + jsTreeDiv
                  + '</div>'
            
            //Add to accordion
            this.domNode.dynaccordion("addSection", {
                id:     observer+idDescriptor,
                header: head,
                cell:   body,
                index:  index,
                open:   accordionOpen,
                observer: observer
            });

            // this.domNode.find("#checkboxBtn-"+observer).click( function() {
            //     $(document).trigger("toggle-checkboxes");
            // });

            this.domNode.find("#checkboxBtn-On-"+observer).click( function() {
                var myObserver = $(this).attr('observer');
                $(document).trigger("toggle-checkboxes-to-state", [myObserver,'on']);
            });

            this.domNode.find("#checkboxBtn-Off-"+observer).click( function() {
                var myObserver = $(this).attr('observer');
                $(document).trigger("toggle-checkboxes-to-state", [myObserver,'off']);
            });

            this.domNode.find("#visibilityLabels-"+observer).click( function(e) {
                var myObserver = $(this).attr('observer');
                var labelsVisible = Helioviewer.userSettings.get("state.celestialBodiesLabelsVisible."+myObserver);
                if(labelsVisible == true){
                    Helioviewer.userSettings.set("state.celestialBodiesLabelsVisible."+myObserver, false);
                    $(this).addClass('hidden');
                    $(document).trigger("toggle-all-labels", [myObserver,false]);
                }else{
                    Helioviewer.userSettings.set("state.celestialBodiesLabelsVisible."+myObserver, true);
                    $(this).removeClass('hidden');
                    $(document).trigger("toggle-all-labels", [myObserver,true]);
                }
                e.stopPropagation();
            });

            this.domNode.find("#visibilityTrajectories-"+observer ).click( function(e){
                var myObserver = $(this).attr('observer');
                var trajectoriesVisible = Helioviewer.userSettings.get("state.celestialBodiesTrajectoriesVisible."+myObserver);
                if(trajectoriesVisible == true){
                    Helioviewer.userSettings.set("state.celestialBodiesTrajectoriesVisible."+myObserver, false);
                    $(this).addClass('hidden');
                    $(document).trigger("toggle-all-trajectories", [myObserver,false]);
                }else{
                    Helioviewer.userSettings.set("state.celestialBodiesTrajectoriesVisible."+myObserver, true);
                    $(this).removeClass('hidden');
                    $(document).trigger("toggle-all-trajectories", [myObserver,true]);
                }
                e.stopPropagation();
            })

            this.domNode.find("#visibilityAvailableBtn-"+observer).click( function(e) {
                var myObserver = $(this).attr('observer');
                var availableVisible = Helioviewer.userSettings.get("state.celestialBodiesAvailableVisible."+myObserver);
                if(availableVisible == true){
                    Helioviewer.userSettings.set("state.celestialBodiesAvailableVisible."+myObserver, false);
                    $(this).addClass('hidden');
                    $('#'+myObserver+'-jstree .empty-element').hide();
                }else{
                    Helioviewer.userSettings.set("state.celestialBodiesAvailableVisible."+myObserver, true);
                    $(this).removeClass('hidden');
                    $('#'+myObserver+'-jstree .empty-element').show();
                }
                e.stopPropagation();
            });

            this.domNode.find(".timestamp").click( function(e) {
                e.stopPropagation();
            });

            this._buildJSTree(observer,glossary,glossaryMods);

            index++;
        }
        this._onTimeChanged();
    },

    _buildJSTree: function(observer,glossary,glossaryMods){
        var self = this;
        var treeData = this._buildJSTreeData(observer,glossary,glossaryMods);

        var trajectoryTree = $('#'+observer+'-jstree');
        trajectoryTree.empty();
        trajectoryTree.jstree({
            "json_data" : { "data": treeData },
            "core" : { "data": treeData },
            "themes"    : { "theme":"default", "dots":true, "icons":false },
            "plugins"   : [ "json_data", "themes", "ui", "checkbox" ],
        });
        
        //this.trajectoryTree.jstree("check_all");
        //restore tree state
        var stateObserver = "state.celestialBodiesChecked."+observer;
        var savedState = Helioviewer.userSettings.get(stateObserver);
        if(savedState == null){//new visitor all checked
            trajectoryTree.jstree("check_all");
        }else{
            $.each(savedState, function(i, bodyNode){
                var node = '#'+bodyNode;
                trajectoryTree.jstree("check_node",node);
            });
        }

        
        var bodies = glossary['observers'][observer];
        for(var body of bodies){
            var treeNode = $('#'+observer+"-"+body+'-tree-trajectory');
            var leftBracketDomNode = $('<span/>').addClass("decoration").text("[");
            var nextTrajectoryDomNode = $('<span/>').addClass("button").text("Next↪").attr({
                "request-observer": observer,
                "request-body": body
            }).bind('click',function(){
                var currentDomNode = $( this );
                self._requestNextOrLastTrajectoryTime(currentDomNode, 'next');
            });
            var slashDomNode = $('<span/>').addClass("decoration").text("/");
            var lastTrajectoryDomNode = $('<span/>').addClass("button").text("↩Last").attr({
                "request-observer": observer,
                "request-body": body
            }).bind('click',function(){
                var currentDomNode = $( this );
                self._requestNextOrLastTrajectoryTime(currentDomNode, 'last');
            });
            var rightBracketDomNode = $('<span/>').addClass("decoration").text("]");
            treeNode.append(leftBracketDomNode);
            treeNode.append(lastTrajectoryDomNode);
            treeNode.append(slashDomNode);
            treeNode.append(nextTrajectoryDomNode);
            treeNode.append(rightBracketDomNode);
        }

        trajectoryTree.on("change_state.jstree",$.proxy(this._treeChangedState,this,observer));
        //trajectoryTree.trigger("change_state.jstree");
        /*
        this.trajectoryTree.bind("change_state.jstree", function(e,data) {
            $('#'+data.rslt[0].attributes[1].nodeValue).toggle();
        });*/
    },

    _requestNextOrLastTrajectoryTime: function(currentDomNode, direction){
        var self = this;
        var params = {
            "action"    : "getTrajectoryTime",
            "observer"  : currentDomNode.attr("request-observer"),
            "body"      : currentDomNode.attr("request-body"),
            "time"      : helioviewer.timeControls.getTimestamp(),
            "direction" : direction
        }
        $.get(Helioviewer.api, params, $.proxy(self._changeTimeTrajectory,this,direction), "json");
    },

    _treeChangedState: function(observer, e, data){
        //hide all the layers
        var observerLabelsContainerName = observer + '-labels-container';
        var observerLabelsContainer = $('#'+observerLabelsContainerName);
        observerLabelsContainer.children().each(function(){
            $(this).hide();
        });
        var observerTrajectoriesContainerName = observer + '-trajectories-container';
        var observerTrajectoriesContainer = $('#'+observerTrajectoriesContainerName);
        observerTrajectoriesContainer.children().each(function(){
            $(this).hide();
        });
        /*for(var body of this.treeBodies){
            $('#'+body+'-trajectory').hide();
            $('#'+body+'-container').hide();
        }*/
        var checked = [];
        var trajectoryTree = $('#'+observer+'-jstree');
        //show all the checked layers
        trajectoryTree.jstree("get_checked",null,false).each(
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
        Helioviewer.userSettings.set("state.celestialBodiesChecked."+observer,checked);
    },

    _treeToggleAllToState: function(e,observer,state){
        var trajectoryTree = $('#'+observer+'-jstree');
        trajectoryTree.unbind("change_state.jstree");
        if(state == "on"){
            trajectoryTree.jstree("check_all",null,true);
        }else if(state == "off"){
            trajectoryTree.jstree("uncheck_all",null,true);
        }
        trajectoryTree.on("change_state.jstree",$.proxy(this._treeChangedState,this,observer));
        trajectoryTree.trigger("change_state.jstree");
    },

    _treeToggleLabels: function(e,observer,visible){
        var self = this;
        var trajectoryTree = $('#'+observer+'-jstree');
        trajectoryTree.unbind("change_state.jstree");
        if(visible==true){
            trajectoryTree.find("[id$='-tree-label'] .checkbox").each(function(){
                trajectoryTree.jstree("check_node",this);
            });
        }else{
            trajectoryTree.find("[id$='-tree-label'] .checkbox").each(function(){
                trajectoryTree.jstree("uncheck_node",this);
            });
        }
        trajectoryTree.on("change_state.jstree",$.proxy(this._treeChangedState,this,observer));
        trajectoryTree.trigger("change_state.jstree");
    },

    _treeToggleTrajectories: function(e,observer,visible){
        var self = this;
        var trajectoryTree = $('#'+observer+'-jstree');
        trajectoryTree.unbind("change_state.jstree");
        if(visible==true){
            trajectoryTree.find("[id$='-tree-trajectory'] .checkbox").each(function(){
                trajectoryTree.jstree("check_node",this);
            });
        }else{
            trajectoryTree.find("[id$='-tree-trajectory'] .checkbox").each(function(){
                trajectoryTree.jstree("uncheck_node",this);
            });
        }
        trajectoryTree.on("change_state.jstree",$.proxy(this._treeChangedState,this,observer));
        trajectoryTree.trigger("change_state.jstree");
    },

    _buildJSTreeData: function(observer,glossary,glossaryMods){
        if(this.enableTrajectories === 0){
            var trajectoryTreeData = [];
            var glossaryModsKeys = Object.keys(glossaryMods);
            var bodies = glossary['observers'][observer];
            this.treeBodies = bodies;
            for(var body of bodies){
                var bodyCapitalized = body.charAt(0).toUpperCase() + body.substr(1);
                if(glossaryModsKeys.includes(body)){
                    bodyCapitalized = glossaryMods[body].name;
                }
                var bodyObject = Object();
                var attributeID = {
                    id: observer+"-"+body+"-tree-label",//revert to "-tree-branch" later for trajectories
                    target: observer+"-"+body+"-container",//revert to body for trajectories
                    type: "leaf"//revert to branch for trajectories
                }
                bodyObject.attr = attributeID;
                bodyObject.data = bodyCapitalized;
                trajectoryTreeData.push(bodyObject);
            }
        }else if(this.enableTrajectories === 1){
            var trajectoryTreeData = [];
            var glossaryModsKeys = Object.keys(glossaryMods);
            var bodies = glossary['observers'][observer];
            this.treeBodies = bodies;
            for(var body of bodies){
                if(this.enabledTrajectoriesNames.includes(body)){
                    var bodyCapitalized = body.charAt(0).toUpperCase() + body.substr(1);
                    if(glossaryModsKeys.includes(body)){
                        bodyCapitalized = glossaryMods[body].name;
                    }
                    var bodyObject = Object();
                    var attributeID = {
                        id: observer+"-"+body+"-tree-branch",//revert to "-tree-branch" later for trajectories
                        target: body,//revert to body for trajectories
                        type: "branch"//revert to branch for trajectories
                    }
                    bodyObject.attr = attributeID;
                    bodyObject.data = bodyCapitalized;
                    //trajectories+labels block
                    bodyObject.state = "open";
                    bodyObject.children = [];
                    var labelObject = Object();
                    var trajectoryObject = Object();
                    labelObject.attr = { id : observer+"-"+body+"-tree-label", target: observer+'-'+body+"-container", type: "leaf"};
                    trajectoryObject.attr = { id : observer+"-"+body+"-tree-trajectory", target: observer+'-'+body+"-trajectory", type: "leaf"};
                    labelObject.data = "Label";
                    trajectoryObject.data = "Trajectory";
                    bodyObject.children.push(labelObject);
                    bodyObject.children.push(trajectoryObject);
                    //end trajectories+labels block
                    trajectoryTreeData.push(bodyObject);
                }
                else{
                    var bodyCapitalized = body.charAt(0).toUpperCase() + body.substr(1);
                    if(glossaryModsKeys.includes(body)){
                        bodyCapitalized = glossaryMods[body].name;
                    }
                    var bodyObject = Object();
                    var attributeID = {
                        id: observer+"-"+body+"-tree-label",//revert to "-tree-branch" later for trajectories
                        target: observer+'-'+body+'-container',//revert to body for trajectories
                        type: "leaf"//revert to branch for trajectories
                    }
                    bodyObject.attr = attributeID;
                    bodyObject.data = bodyCapitalized;
                    trajectoryTreeData.push(bodyObject);
                }
            }            
        }else{//full trajectories
            var trajectoryTreeData = [];
            var glossaryModsKeys = Object.keys(glossaryMods);
            //trajectories+labels grouping block
            var observerCapitalized = observer.charAt(0).toUpperCase() + observer.substr(1);
            var observerObject = Object();
            observerObject.attr = { id: observer+"-tree-branch", target: observer, type: "branch"};
            observerObject.data = observerCapitalized + " Perspective";
            observerObject.state = "open"; 
            observerObject.children = [];
            //end trajectories+labels grouping block
            var bodies = glossary['observers'][observer];
            this.treeBodies = bodies;
            for(var body of bodies){
                var bodyCapitalized = body.charAt(0).toUpperCase() + body.substr(1);
                if(glossaryModsKeys.includes(body)){
                    bodyCapitalized = glossaryMods[body].name;
                }
                var bodyObject = Object();
                var attributeID = {
                    id: observer+"-"+body+"-tree-branch",//revert to "-tree-branch" later for trajectories
                    target: body,//revert to body for trajectories
                    type: "branch"//revert to branch for trajectories
                }
                bodyObject.attr = attributeID;
                bodyObject.data = bodyCapitalized;
                //trajectories+labels block
                bodyObject.state = "open";
                bodyObject.children = [];
                var labelObject = Object();
                var trajectoryObject = Object();
                labelObject.attr = { id : observer+"-"+body+"-tree-label", target: observer+'-'+body+"-container", type: "leaf"};
                trajectoryObject.attr = { id : observer+"-"+body+"-tree-trajectory", target: observer+'-'+body+"-trajectory", type: "leaf"};
                labelObject.data = "Label";
                trajectoryObject.data = "Trajectory";
                bodyObject.children.push(labelObject);
                bodyObject.children.push(trajectoryObject);
                //end trajectories+labels block
                trajectoryTreeData.push(bodyObject);
            }
            
        }
        return trajectoryTreeData;
    },

    _disableTreeItems: function(data,observer){
        var visState = Helioviewer.userSettings.get("state.celestialBodiesAvailableVisible");
        $('#'+observer+'-jstree .empty-element').each(function(){
            $(this).show();
            $(this).removeClass('empty-element');
            $(this).css({'opacity':'1.0'});
        });
        var trajectories = data['trajectories'];
        var labels = data['labels'];
        var treeLabelBodies = [];

        var labelObservers = Object.keys(labels);
        for(var observer of labelObservers){
            var bodies = Object.keys(labels[observer]);
            for(var body of bodies){
                if(labels[observer][body] == null){
                    //console.log("disabling: "+body+"-tree-label");
                    var treeLabel = $('#'+observer+"-"+body+"-tree-label");
                    treeLabel.css({'opacity':'0.5'}).addClass('empty-element');
                    if(this.enabledTrajectoriesNames.includes(body) || this.enableTrajectories == 2){//body in partial trajectory list or full trajectories enabled
                        treeLabelBodies.push(body);
                    }
                }
            }
        }
        
        var trajectoryObservers = Object.keys(trajectories);
        for(var observer of trajectoryObservers){
            var bodies = Object.keys(trajectories[observer]);
            for(var body of bodies){
                if(trajectories[observer][body].length == 0){
                    //console.log("disabling: "+body+"-tree-trajectory");
                    if(treeLabelBodies.includes(body)){
                        var treeBranch = $('#'+observer+"-"+body+"-tree-branch");
                        treeBranch.css({'opacity':'0.5'}).addClass('empty-element');
                        var treeLabel = $('#'+observer+"-"+body+"-tree-label");
                        treeLabel.css({'opacity':'1.0'}).removeClass('empty-element');
                    }else{
                        var treeTrajectory = $('#'+observer+"-"+body+"-tree-trajectory");
                        treeTrajectory.css({'opacity':'0.5'}).addClass('empty-element');
                    }
                }
            }
        }
        
        if(visState == false){
            $(this).addClass('hidden');
            $('#'+observer+'-jstree .empty-element').hide();

        }else{
            $(this).removeClass('hidden');
            $('#'+observer+'-jstree .empty-element').show();
        }
    },

    _convertHPCtoHCC:function(inputBody,body,useTan){
        // console.log(body,'========================');
        // console.log('HPC', inputBody.x, inputBody.y);
        var screenSpace = {
            x: inputBody.x / Helioviewer.userSettings.settings.state.imageScale,
            y: -inputBody.y / Helioviewer.userSettings.settings.state.imageScale
        };
        // console.log('Screen',screenSpace.x,screenSpace.y);

        var distanceInMeters = inputBody.distance_sun_to_observer_au * 149597000000;
        var metersPerArcsecond = 724910;  //695500000 / 959.705;
        var helioprojectiveCartesian = {
            x: ( inputBody.x / 3600 ) * ( Math.PI/180 ) ,
            y: ( inputBody.y / 3600 ) * ( Math.PI/180 )
        };
        if(!useTan){
            var heliocentricCartesianReprojection = {
                x: distanceInMeters*Math.cos( helioprojectiveCartesian.y )*Math.sin( helioprojectiveCartesian.x ),
                y: distanceInMeters*Math.sin( helioprojectiveCartesian.y )
            }
        }else{
            var heliocentricCartesianReprojection = {
                x: distanceInMeters*Math.tan( helioprojectiveCartesian.x ),
                y: distanceInMeters*( Math.tan( helioprojectiveCartesian.y ) / Math.cos( helioprojectiveCartesian.x ) )
            };
        }
        // console.log('HCC',heliocentricCartesianReprojection.x,heliocentricCartesianReprojection.y);
        var correctedCoordinates = {
            x: ( heliocentricCartesianReprojection.x / metersPerArcsecond ) / Helioviewer.userSettings.settings.state.imageScale,
            y: -( heliocentricCartesianReprojection.y / metersPerArcsecond ) / Helioviewer.userSettings.settings.state.imageScale
        }
        // console.log('HCC Screen',correctedCoordinates.x,correctedCoordinates.y);
        // console.log('ratio ==================');
        // console.log('HPC/HCC x:',inputBody.x/heliocentricCartesianReprojection.x);
        // console.log('HPC/HCC y:',inputBody.y/heliocentricCartesianReprojection.y);
        // console.log('screen x:',screenSpace.x/correctedCoordinates.x);
        // console.log('screen y:',screenSpace.y/correctedCoordinates.y);
        return correctedCoordinates;
    }
});