/**
 * @description Object representing a screenshot. Handles tooltip creation for its entry in the history bar
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, Shadowbox, setTimeout, window, Media, extractLayerName, layerStringToLayerArray */
"use strict";
var Screenshot = Media.extend(
    /** @lends Screenshot.prototype */
    {
    /**
     * @constructs
     * @description Holds on to meta information 
     */    
    init: function (params, dateRequested) {
        this._super(params, dateRequested);
        this.time = this.obsDate.replace("T", " ");
        // Get rid of the extra .000 if there is one
        if (this.time.length > 20) {
            this.time = this.time.slice(0, -5);
        }
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
    
    /**
     * @description Opens the download dialog
     */
    download: function () {
        if (this.url) {
            window.open('api/index.php?action=downloadFile&url=' + this.url, '_parent');
        } else {
            $(document).trigger("message-console-warn", ["There was an error retrieving your " +
                                "screenshot. Please try again later or refresh the page."]);
        }
    },
    
    /**
     * Puts information about the screenshot into an array for storage in UserSettings.
     */    
    serialize: function () {
        return {
            dateRequested : this.dateRequested,
            id            : this.id,
            width         : this.width,
            height        : this.height,
            imageScale    : this.imageScale,
            layers        : this.layers,
            name          : this.name,
            obsDate       : this.obsDate,
            url           : this.url,
            x1            : this.x1,
            x2            : this.x2,
            y1            : this.y1,
            y2            : this.y2
        };
    },
    
    /**
     * Checks to make sure that all fields required for display in the history list are correct.
     * dateRequested must be a valid date, and id, layers, and obsDate must not be empty
     * strings. imageScale must be a number. url must start with http
     */
    isValidEntry: function () {
        if (this.dateRequested && (new Date(this.dateRequested)).getTime() === this.dateRequested
                && this.id.length > 1 
                && (!isNaN(this.imageScale) || this.imageScale.length > 1)
                && this.layers.length > 1 && this.obsDate.length > 1
                && this.url.slice(0,4) === "http") {
            return true;
        }

        return false;
    },
    
    /**
     * Creates a table element with information about the screenshot
     */
    getInformationTable: function () {
        var layerArray, table;
        layerArray = layerStringToLayerArray(this.layers);
        table = "<table>" +
                    "<tr valign='top'>" + 
                        "<td><b>Layers: </b></td>" +
                        "<td>";
        $.each(layerArray, function () {
            table = table + "<dt>" + extractLayerName(this).join(" ") + "</dt>";
        });
        table = table + "</td>" + 
                    "</tr>" +
                    "<tr>" +
                        "<td>&nbsp;</td>" +
                    "</tr>" +
                    "<tr>" +
                        "<td><b>Timestamp: </b></td>" +
                        "<td>" + this.time + "</td>" + 
                    "</tr>" +
                    "<tr>" +
                        "<td>&nbsp;</td>" +
                    "</tr>" +
                    "<tr>" + 
                        "<td><b>Image Scale:&nbsp;&nbsp;</b></td>" +
                        "<td>" + this.imageScale + " arcsec/px</td>" + 
                    "</tr>" +
                    "<tr>" +
                        "<td>&nbsp;</td>" +
                    "</tr>" +
                    "<tr>" + 
                        "<td><b>Dimensions: </b></td>" + 
                        "<td>" + this.width + "x" + this.height + " px</td>" + 
                    "</tr>" + 
                    "<tr>" +
                        "<td>&nbsp;</td>" +
                    "</tr>" +
                    "<tr valign='top'>" + 
                        "<td><b>Preview: </b></td>" + 
                        "<td><img src=" + this.url + " width=150 /></td>" + 
                 "</table>";
        return table;
    }
});
