/**
 * @description Object representing a screenshot. Handles tooltip creation for its entry in the history bar
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, Shadowbox, setTimeout, window */
"use strict";
var Screenshot = Media.extend(
    /** @lends Screenshot.prototype */
    {
    /**
     * @constructs
     * @description Holds on to meta information 
     */    
    init: function (params) {
        this._super(params);
        this.time = this.obsDate.replace("T", " ").slice(0,-5);
    },
    
    /**
     * Creates a tooltip that pops up with information about the screenshot
     * and a thumbnail when its link is moused over. Also sets up an event 
     * listener for the link to trigger downloading the screenshot.
     */
    setupTooltip: function () {      
        this._super();
        
        var self = this;
        this.button.click(function () {
            self.button.qtip("hide");
            self.download();
        });
    },

    parseName: function () {
        var rawName, layerArray, name, self = this;
        rawName    = this.url.match(/[a-zA-Z]+_+.*/)[0].slice(0,-15);
        layerArray = rawName.split("__");
        name = "";
        $.each(layerArray, function () {
            name = name + self.parseLayer(this) + " / ";
        });
        return name.slice(0,-3);
    },

    /**
     * Creates a table element with information about the screenshot
     */
    getInformationTable: function () {
        var layerArray, table;
        layerArray = this.layers.split("],");
        table = "<table>" +
                    "<tr valign='top'>" + 
                        "<td><b>Layers: </b></td>" +
                        "<td>";
        $.each(layerArray, function () {
            table = table + "<dt>" + this.replace(/[\[\]]/g, " ").split(",").slice(0,-2).join(" ") + "</dt>";
        });
        table = table + "</td>" + 
                    "</tr>" +
                    "<tr>&nbsp;</tr>" +
                    "<tr>" +
                        "<td><b>Time: </b></td>" +
                        "<td>" + this.time + "</td>" + 
                    "</tr>" +
                    "<tr>&nbsp;</tr>" +
                    "<tr>" + 
                        "<td><b>Image Scale:&nbsp;&nbsp;</b></td>" +
                        "<td>" + this.imageScale + " arcsec/px</td>" + 
                    "</tr>" +
                    "<tr>&nbsp;</tr>" +
                    "<tr>" + 
                        "<td><b>Dimensions: </b></td>" + 
                        "<td>" + this.width + "x" + this.height + " px</td>" + 
                    "</tr>" + 
                    "<tr>&nbsp;</tr>" +
                    "<tr valign='top'>" + 
                        "<td><b>Preview: </b></td>" + 
                        "<td><img src=" + this.url + " width=150 /></td>" + 
                 "</table>";
        return table;
    },
    
    /**
     * @description Opens the download dialog
     */
    download: function () {
        window.open('api/index.php?action=downloadFile&url=' + this.url, '_parent');
    }
});
