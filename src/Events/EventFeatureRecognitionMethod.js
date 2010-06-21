/**
 * @author Jonathan Harper
 * @fileOverview This class represents a single event from a query.
 *
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, window */

"use strict";

var EventFeatureRecognitionMethod = Class.extend({

    init: function (name, eventManager) {
        this._events = [];
        this._name = name;
        this._visible = false;
        this.eventManager = eventManager;
        
        //Time range in the form
        // [ [startTimeA, endTimeA], [startTimeB, endTimeB], ... ]
        this._queriedRanges = [];
    },
    
    isQueried: function (startTime, endTime) {
        var rangeIsQueried = false;
        $.each(this._queriedRanges, function (i, range) {
            //if startTime >= range start time and endTime <= range end time
            if (startTime >= range[0] && endTime <= range[1]) {
                //range requested is contained in current data, so return true
                rangeIsQueried = true;
                return false;
            }
        });
        return rangeIsQueried;
    },
    
    rangeToQuery: function (startTime, endTime) {
        //If there is data already queried at the beginning or end of the range,
        //move the query start or end time forward or backward as necessary
        //If there is data already queried in the middle but not reaching the edge of the
        //query time, remove it
        
        var newStartTime = startTime, newEndTime = endTime, self=this;
        
        $.each(this._queriedRanges, function(i, range) {
            //If range start time > startTime and range end time < endTime, delete
            if (range[0] > startTime && range[1] < endTime) {
                self._queriedRanges.splice(i,1);
            }
            
            //If range start time <= startTime and range end time > startTime, move forward newStartTime
            else if (range[0] <= startTime && range[1] > startTime) {
                //NOTE
                //This shouldn't happen, but if range end time > endTime, we would want to make sure nothing is queried
                newStartTime = range[1];
            }
            
            //If range start time < endTime and range end time >= endTime, move forward newStartTime
            else if (range[0] < endTime && range[1] >= endTime) {
                //NOTE
                //This shouldn't happen, but if range start time < startTime, we would want to make sure nothing is queried
                newEndTime = range[0];
            }
        });
        return [newStartTime, newEndTime];
    },
    
    addRange: function (startTime, endTime) {
        var addCompleted = false, self = this;
        $.each(self._queriedRanges, function (i, range) {
            //Cases.
            //1) Range is entirely inside an existing range or is equal to it
            if (startTime >= range[0] && endTime <= range[1]) {
                addCompleted = true;
                return false;
            }
            else if (startTime <= range[1] && startTime >= range[0]) {
                //2) Range covers the space between two existing ranges
                //We'll have to check all of them now to make sure this isn't the case before continuing on
                $.each(self._queriedRanges, function (j, range2) {
                    if (endTime >= range2[0] && endTime <= range2[1]) {
                        //It is, so fix this up by extending the first range, and then deleting range2
                        range[1] = range2[1];
                        self._queriedRanges.splice(j,1);
                        addCompleted = true;
                        return false;
                    }
                });
                //3) Range ends at the beginning of an existing range
                range[1] = endTime;
                addCompleted = true;
                return false;
            }
            else if (endTime >= range[0] && endTime <= range[1]) {
                //2) Range covers the space between two existing ranges
                //We'll have to check all of them now to make sure this isn't the case before continuing on
                $.each(self._queriedRanges, function (j, range2) {
                    if (startTime <= range2[1] && startTime >= range2[0]) {
                        //It is, so fix this up by extending the first range, and then deleting range2
                        range2[1] = range[1];
                        self._queriedRanges.splice(i,1);
                        addCompleted = true;
                        return false;
                    }
                });
                //4) Range extends from the end of an existing range
                range[0] = startTime;
                addCompleted = true;
                return false;
            }
        });
        //5) None of the above, so range is outside all ranges existing and is independent
        if (addCompleted === false) {
            self._queriedRanges.push([startTime, endTime]);
        }
    },
    
    contains: function (startTime) {
        var frmContains = false;
        $.each(this._queriedRanges, function (i, range) {
            if (range[0] <= startTime && range[1] >= startTime) {
                frmContains = true;
            }
        });
        return frmContains;
    },
    
    getName: function () {
        return this._name;
    },
    
    addEvent: function (newEvent) {
        var rsun = this.eventManager.controller.viewport.getRSun();
        this._events.push(new EventMarker(this, newEvent, newEvent.event_starttime, rsun, {offset: {top : 10, left : 0}}));
    },
    
    refreshEvents: function () {
        var rsun = this.eventManager.controller.viewport.getRSun();
        $.each(this._events, function (i, event) {
            event.refresh(rsun);
        });
    },
    
    setDomNode: function (domNode) {
        this.domNode = domNode;
    },
    
    setVisibility: function (visible) {
        this._visible = visible;
        
        if (visible) {
            this.domNode.show();
        }
        else {
            this.domNode.hide();
        }
    },
    
    toggleVisibility: function () {
        this._visible = !this._visible;
        if(this._visible) {
            this.domNode.show();
        }
        else {
            this.domNode.hide();
        }
    }
});
