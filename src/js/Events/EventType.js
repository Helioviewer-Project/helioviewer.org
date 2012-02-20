/**
 * @author Keith Hughitt <keith.hughitt@nasa.gov>
 * @author Jonathan Harper
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, window */

"use strict";

var EventType = Class.extend({
	
    init: function (name) {
		this._name = name;
		this._eventFRMs = {};
		this._queried = false;
	},
	
	getEventFRMs: function () {
		return this._eventFRMs;
	},
	
	getName: function () {
		return this._name;
	},
	
	addFRM: function (frm) {
		this._eventFRMs[frm._name] = frm;
	},
	
	isQueried: function (startTime, endTime) {
	    var typeIsQueried = true;
	    $.each(this._eventFRMs, function (frmName, FRM) {
	        if (!FRM.isQueried(startTime, endTime)) {
	            typeIsQueried = false;
	            return false;
	        }
	    });
	    return typeIsQueried;
	}
});
