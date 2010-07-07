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
    init: function (params) {
        $.extend(this, params);
        this.width  = Math.floor((this.x2 - this.x1) / this.imageScale);
        this.height = Math.floor((this.y2 - this.y1) / this.imageScale);
    },
    
    /**
     * Sets the url and name
     */
    setURL: function (url, id) {
        this.url  = url;
        this.id   = id;
        this.name = this.parseName();
    },
    
    parseLayer: function (layer) {
        var layerArray = layer.split("_");
        if (layerArray[0] === "LASCO") {
            return layerArray[0] + " " + layerArray[1];
        }
        return layerArray[1] + " " + layerArray[2];
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
                    y: 0
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
