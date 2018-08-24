"use strict";

var CelestialBodiesSatellites = Class.extend(
{
    init: function(){
        this.getMercuryData = true;
        this.mercuryReceivedPos = { x: 0, y: 0 };
        this._initEventListeners();
        this._buildDOM();
    },
    _initEventListeners: function(){
        $(document).bind("helioviewer-ready", $.proxy(this._onTimeChanged,this));
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
    _onTimeChanged: function(){
        if(this.getMercuryData){
            var currentTime = helioviewer.timeControls.getTimestamp();
            var params = {
                "action"    : "getSolarBodies",
                "time"      : currentTime
            };
            $.get(Helioviewer.api, params, $.proxy(this._outputCoordinates, this), "json");
        }else{
            this._outputCoordinates(null,null);
        }
    },
    _refresh: function() {

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
                labelContainer.text(body.charAt(0).toUpperCase() + body.substr(1));
                labelContainer.css({
                    'position'  : 'absolute',
                    'left'      :  correctedCoordinates.x + 'px',
                    'top'       :  correctedCoordinates.y + 'px',
                    'z-index'   :  1000,
                    'text-shadow'   : '0px 0px 2px #000, 0px 0px 4px #000, 0px 0px 6px #000'
                });
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
            }
        }
    }
});