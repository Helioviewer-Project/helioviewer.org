/**
 * @description Abstract class that represents either a screenshot or movie
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, Shadowbox, setTimeout, window */
"use strict";
var Media = Class.extend(
    /** @lends Media.prototype */
    {
    /**
     * @constructs
     * @description Calculates its dimensions and holds on to meta information.
     */    
    init: function (params, dateRequested) {
        $.extend(this, params);
        this.dateRequested = dateRequested;
        this.width         = Math.floor((this.x2 - this.x1) / this.imageScale);
        this.height        = Math.floor((this.y2 - this.y1) / this.imageScale);
    },
    
    /**
     * Sets the url and name
     */
    setURL: function (url, id) {
        this.url  = url;
        this.id   = id;
        this.name = this.parseName();
    },
    
    /**
     * Creates the name that will be displayed in the history.
     * Groups layers together by detector, ex: 
     * EIT 171/304, LASCO C2/C3
     * Will crop names that are too long and append ellipses
     */
    parseName: function () {
        var rawName, layerArray, name, currentInst, self = this;
        layerArray = this.layers.split("],").sort();
        name = "";
        
        currentInst = false;
        
        $.each(layerArray, function () {
            rawName = this.split(",").slice(1,-2);
            if(rawName[0] !== currentInst) {
                currentInst = rawName[0];
                name += ", " + currentInst + " " + self.parseLayer(rawName);
            } else {
                name += "/" + self.parseLayer(rawName);
            }
        });
        
        // Get rid of the extra ", " at the front
        name = name.slice(2);
        if (name.length > 16) {
            name = name.slice(0,16) + "...";
        }
        
        return name;
    },
    
    /**
     * Figures out what part of the layer name is relevant to display.
     * The layer is given as an array: {inst, det, meas}
     */
    parseLayer: function (layer) {
        if (layer[0] === "LASCO") {
            return layer[1];
        }
        return layer[2];
    },
    
    getTimeDiff: function () {
        var now, diff;
        now = new Date();
        // Translate time diff from milliseconds to seconds
        diff = (now.getTime() - this.dateRequested.getTime()) / 1000;

        return toFuzzyTime(diff);
    },
    
    /**
     * Creates a tooltip that pops up with information about the media
     * when its link is moused over.
     */
    setupTooltip: function () {
        var info;
        this.button = $("#" + this.id);

        info = this.getInformationTable();

        this.button.qtip({
            position: {
                adjust: { 
                    x: -30, 
                    screen: true 
                },
                corner : {
                    target : "leftMiddle",
                    tooltip: "rightMiddle" 
                }
            },
            style: {
                name: 'simple',
                "text-align": 'left',
                width: 'auto',
                tip : 'rightMiddle'
            },
            show: 'mouseover',
            hide: 'mouseout',
            content: info
        });
    },
    
    /**
     * Removes divs that were created by the tooltip.
     */
    removeTooltip: function () {
        this.button = $("#" + this.id);

        var api = this.button.qtip("api");
        if(api.elements && api.elements.tooltip) {
            api.elements.tooltip.remove();
        }
    }
});
