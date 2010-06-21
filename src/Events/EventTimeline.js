/**
 * @author Jonathan Harper
 * @fileOverview TO BE ADDED
 *
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, window, Timeline */

"use strict";

var EventTimeline = Class.extend({
	
    init: function (data, controller) {
        this._data = data;
        this.build(this._data);
    },
    
    build: function (data) {
        var _bandInfo, _timeline, _eventSource;
        
        this._eventSource = new Timeline.DefaultEventSource();
        
        _bandInfo = [
            Timeline.createBandInfo({
                eventSource : this._eventSource,
                width: "50%",
                intervalUnit: Timeline.DateTime.HOUR,
                intervalPixels: 100
            }),
            Timeline.createBandInfo({
                eventSource : this._eventSource,
                width: "30%",
                intervalUnit: Timeline.DateTime.WEEK,
                intervalPixels: 100
            }),
            Timeline.createBandInfo({
                eventSource : this._eventSource,
                width: "20%",
                intervalUnit: Timeline.DateTime.YEAR,
                intervalPixels: 100
            })
        ];
        
        _bandInfo[1].syncWith = 0;
        _bandInfo[2].syncWith = 0;
        
        this._timeline = Timeline.create(document.getElementById("event-timeline"), _bandInfo);
        
        this._timeline.showLoadingMessage();
        this._eventSource.loadJSON(data, '.');
        this._timeline.hideLoadingMessage();
	},
	
	reload: function (updateData) {
        this._timeline.showLoadingMessage();
        this._eventSource.clear();
        this._eventSource.loadJSON(updateData, '.');
        this._timeline.hideLoadingMessage();
	}
});
