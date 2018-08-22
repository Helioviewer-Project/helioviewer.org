"use strict";

var CelestialBodiesSatellites = Class.extend(
{
    init: function(){
        this.getMercuryData = true;
        this.mercuryReceivedPos = { x: 0, y: 0 };
        this._initEventListeners();
        this._buildDOM();
        //this._onTimeChanged();
    },
    _initEventListeners: function(){
        $(document).bind("observation-time-changed", $.proxy(this._onTimeChanged,this));
        $(document).bind("replot-event-markers",   $.proxy(this._refresh, this));
    },
    _buildDOM: function() {
        this.movingContainer = $("#moving-container");
        this.bodiesContainer = $('<div/>');
        this.bodiesContainer.attr('id','bodies-container');
        this.bodiesContainer.css({'position' : 'absolute'});
        this.movingContainer.append(this.bodiesContainer);
        this.mercuryContainer = $('<div/>');
        this.mercuryContainer.attr('id','mercury-container');
        this.bodiesContainer.append(this.mercuryContainer);
    },
    _onTimeChanged: function(){
        if(this.getMercuryData){
            var currentTime = helioviewer.timeControls.getTimestamp();
            //console.log(currentTime);

            var params = {
                "action"    : "getSolarBodies",
                "body"      : "mercury",
                "time"      : currentTime
            };
            $.get(Helioviewer.api, params, $.proxy(this._outputCoordinates, this, 'mercury'), "json");
        }else{
            this._outputCoordinates(null,null);
        }
    },
    _refresh: function() {

    },
    _outputCoordinates: function(solarObject,coordinates){
        //console.log(solarObject);
        //console.log(coordinates);
        if(solarObject == 'mercury' && this.getMercuryData){
            this.mercuryCoordinates = coordinates;
            this.getMercuryData = false;
        }
        var dates = Object.keys(this.mercuryCoordinates['mercury']['earth']);
        //console.log(dates);
        //console.log(new Date(dates[0]));
        var currentTimeSelectorJsDate = helioviewer.timeControls.getDate();
        for(date of dates){
            var dateJs = new Date();
            dateJs.setTime(date * 1000);//requires millis 
            //console.log(dateJs.getTime(),helioviewer.timeControls.getTimestamp());
            //console.log(date,dateJs,currentTimeSelectorJsDate);
            if(currentTimeSelectorJsDate.getTime() == dateJs.getTime()){
                //console.log('matching date');
                this.mercuryReceivedPos = this.mercuryCoordinates['mercury']['earth'][date];
            }
        }
        //var mercuryReceivedPos = coordinates['mercury']['earth'][dates[0]];
        //console.log(coordinates['mercury']['earth'][dates[0]]);
        //console.log(Helioviewer.userSettings.settings.state.imageScale);

        this.mercuryCorrectedPos = {
            x: Math.round( this.mercuryReceivedPos.x / Helioviewer.userSettings.settings.state.imageScale),
            y: Math.round( -this.mercuryReceivedPos.y / Helioviewer.userSettings.settings.state.imageScale)
        };

        this.mercuryContainer.text('Mercury');
        this.mercuryContainer.css({
            'position'  : 'absolute',
            'left'      :  this.mercuryCorrectedPos.x + 'px',
            'top'       :  this.mercuryCorrectedPos.y + 'px',
            'z-index'   :  1000,
        });
    }
});