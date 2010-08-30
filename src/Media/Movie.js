/**
 * @description Abstract class that keeps track of previous media made and controls the display 
 *              bar and tooltips associated with it.
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, Shadowbox, setTimeout, window, Media, extractLayerName, layerStringToLayerArray */
"use strict";
var Movie = Media.extend(
    /** @lends Movie.prototype */
    {
    /**
     * @constructs
     * @description Calculates its dimensions and handles movie display. Holds on to information used 
     *  to create the movie.
     */    
    init: function (params, dateRequested, hqFormat) {
        this._super(params, dateRequested);

        this.time = this.startTime.replace("T", " ");
        // Get rid of the extra .000 if there is one
        if (this.time.length > 20) {
            this.time = this.time.slice(0, -5);
        }

        this.hqFormat = params.hqFormat || hqFormat;
        
        // Resize what appears in the movie player if the movie is as big as the viewport
        if (this.scaleDown === true) {
            this.viewerWidth  = this.width  * 0.8;
            this.viewerHeight = this.height * 0.8;
        } else {
            this.viewerWidth  = this.width;
            this.viewerHeight = this.height;
        }
        
        this.complete = params.complete || false;
        this.url      = params.url      || "";
    },
    
    /**
     * Sets the url, name, and high quality file
     */
    setURL: function (url) {
        this._super(url, this.id);
        this.hqFile = (url).slice(0, -3) + this.hqFormat;
        this.complete = true;
    },
    
    setId: function (id) {
        this.id = id;
    },

    getTimeDiff: function () {
        if (!this.complete) {
            return "Processing";
        }
        return this._super();
    },
    
    /**
     * Creates a tooltip that pops up with information about the movie
     * when its link is moused over. Also sets up an event listener for the
     * link to trigger playing the movie. 
     */
    setupTooltip: function () {
        this._super();

        var self = this;
        
        this.button.click(function () {
            self.button.qtip("hide");
            self.playMovie();
        });
    },
    
    /**
     * @description Opens a pop-up with the movie player in it.
     */
    playMovie: function () {
        var file, url, self = this;

        file = this.url.match(/[\w]*\/[\w\.]*.flv$/).pop(); // Relative path to movie 
        
        url  = 'api/index.php?action=playMovie&file=' + file + '&width=' + this.viewerWidth + '&height=' 
             + this.viewerHeight;
        
        this.watchDialog = $("#watch-dialog-" + this.id);

        // Have to append the video player here, otherwise adding it to the div beforehand results in the browser
        // trying to download it. 
        this.watchDialog.dialog({
            title  : "Helioviewer Movie Player",
            width  : 'auto',
            height : 'auto',
            open   : self.watchDialog.append("<div id='movie-player-" + self.id + "'>" + 
                                            "<iframe src=" + url + " width=" + self.viewerWidth + " height=" + 
                                                self.viewerHeight + " marginheight=0 marginwidth=0 scrolling=no " +
                                                "frameborder=0 /><br /><br />" +
                                                "<a href='api/index.php?action=downloadFile&url=" + self.hqFile + "'>" +
                                                    "Click here to download a high-quality version." +
                                                "</a></div>"),
            close  : function () {  
                        $("#movie-player-" + self.id).remove();
                    },
            zIndex : 9999,
            show   : 'fade'
        });                                 
    },
    
    /**
     * Puts information about the movie into an array for storage in UserSettings.
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
            startTime     : this.startTime,
            url           : this.url,
            x1            : this.x1,
            x2            : this.x2,
            y1            : this.y1,
            y2            : this.y2,
            complete      : this.complete,
            hqFormat      : this.hqFormat,
            hqFile        : this.hqFile,
            scaleDown     : this.scaleDown
        };
    },
    
    /**
     * Checks to make sure that all fields required for display in the history list are correct.
     * dateRequested must be a valid date, and id, layers, and startTime must not be empty
     * strings. imageScale must be a number. url must start with http
     */
    isValidEntry: function () {
        if (this.dateRequested && (new Date(this.dateRequested)).getTime() === this.dateRequested
                && (!isNaN(this.imageScale) || this.imageScale.length > 1)
                && this.layers.length > 1 && this.startTime.length > 1) {
            return true;
        }

        return false;
    },
    
    /**
     * Creates a table element with information about the movie.
     */
    getInformationTable: function () {        
        var layerArray, table, previewFrame;
        previewFrame = this.url.slice(0, -3) + "jpg";
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
                        "<td><b>Start Time: </b></td>" +
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
                    "</tr>";
        if (this.complete) {
            table = table +
                    "<tr valign='top'>" + 
                        "<td><b>Preview: </b></td>" + 
                        "<td><img src=" + previewFrame + " width=150 /></td>" + 
                    "</tr>";
        }
        table = table + "</table>";
        return table;
    }
});
