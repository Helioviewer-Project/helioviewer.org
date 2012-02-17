/**
 * @author Jonathan Harper
 * @fileOverview This class represents a single event from a query.
 *
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, window */

"use strict";

var Event = Class.extend({

    init: function (id, coordinates, startTime, endTime) {
        this._id = id;
        this._coordinates = coordinates;
        this._startTime = startTime;
        this._endTime = endTime;
    }
});
