/**
 * @description Valides settings before saving them
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: false, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, Shadowbox, setTimeout, window, Media, extractLayerName, layerStringToLayerArray */
"use strict";
var InputValidator = Class.extend(
    /** @lends InputValidator.prototype */
    {
    /**
     * @constructs
     */
    init: function () {        
    },
    
    /**
     * checkDate
     */
    checkDate: function (value, opts) {
        
    },
    
    /**
     * Checks value to make sure it is a valid float and that it falls within specified constraints
     */
    checkFloat: function (value, opts) {
        var options = {
            "min": -Infinity,
            "max": Infinity
        };
        $.extend(options, opts || {});
        
        if (isNaN(value) || value < options.min || value > options.max) {
            throw "Unacceptable float value specified.";
        }
    },
    
    /**
     * Checks a timestamp to make sure it is reasonable
     */
    checkTimestamp: function (value, opts) {
        var options = {
            "min": 0,
            "max": Math.round(new Date().getTime() / 1000) + (24 * 60 * 60) // Now + 24 hours
        };
        $.extend(options, opts || {});
        
        // convert from milliseconds
        if (value.toString().length > 10) {
            value = value / 1000;
        }
        
        if (isNaN(value) || value < options.min || value > options.max) {
            throw "Unacceptable timestamp value specified.";
        }
    }
});