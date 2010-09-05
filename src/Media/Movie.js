/**
 * @description Abstract class that keeps track of previous media made and controls the display 
 *              bar and tooltips associated with it.
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: false, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
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
        var file, url, dimensions, self = this;
        
        $("#movie-button").click();
        
        this.watchDialog = $("#watch-dialog-" + this.id);
        
        dimensions = this.getVideoPlayerDimensions();

        // Have to append the video player here, otherwise adding it to the div beforehand results in the browser
        // trying to download it. 
        this.watchDialog.dialog({
            title     : "Helioviewer Movie Player",
            width     : dimensions.width  + 34,
            height    : dimensions.height + 104,
            resizable : $.support.h264,
            open      : self.watchDialog.append(self.getVideoPlayerHTML(dimensions.width, dimensions.height)),
            close     : function () {  
                            $("#movie-player-" + self.id).remove();
                        },
            zIndex    : 9999,
            show      : 'fade'
        });                      
    },
    
    /**
     * Decides how to display video and returns HTML corresponding to that method
     * 
     * 08/31/2010: Kaltura does not currently support jQuery UI 1.8, and even with 1.7.1
     * some bugs are present. Try again in future.
     */
//    getVideoPlayerHTML: function (width, height) {
//        // Base URL
//        var path = this.hqFile.match(/cache.*/).pop().slice(0,-3);
//        
//        // Use relative dimensions for browsers which support the video element
//        if ($.support.video) {
//            width = "100%";
//            height= "99%";
//        }
//        
//        return "<video id='movie-player-" + this.id + "' width='" + width + "' " + "height='"
//               + height + "' poster='" + path + "jpg'>"
//             + "<source src='" + path + "mp4' /><source src='" + path + "flv' />"
//             + "</video>";
//    },
    
    /**
     * Decides how to display video and returns HTML corresponding to that method
     */
    getVideoPlayerHTML: function (width, height) {
        var path, file, hqFile, url;
        
        // HTML5 Video (Currently only H.264 supported)
        if ($.support.h264) {
            path = this.hqFile.match(/cache.*/).pop();
            return "<video id='movie-player-" + this.id + "' src='" + path +
                   "' controls preload autoplay width='100%' " + "height='99%'></video>";
        }

        // Fallback (flash player)
        else {
            file   = this.url.match(/[\w]*\/[\w-\.]*.flv$/).pop(); // Relative path to movie
            hqFile = file.replace("flv", this.hqFormat);
            url    = 'api/index.php?action=playMovie&file=' + file + '&width=' + width + '&height=' + height; 
            
            return "<div id='movie-player-" + this.id + "'>" + 
            "<iframe src=" + url + " width=" + width + " height=" + 
                height + " marginheight=0 marginwidth=0 scrolling=no " +
                "frameborder=0 /><br /><br />" +
                "<a target='_parent' href='api/index.php?action=downloadFile&uri=movies/" + hqFile + "'>" +
                    "Click here to download a high-quality version." +
                "</a></div>";
        }
    },
    
    /**
     * Determines dimensions for which movie should be displayed
     */
    getVideoPlayerDimensions: function () {
        var maxWidth    = $(window).width() * 0.80,
            maxHeight   = $(window).height() * 0.80,
            scaleFactor = Math.max(1, this.width / maxWidth, this.height / maxHeight);
        
        return {
            "width"  : this.width  / scaleFactor,
            "height" : this.height / scaleFactor
        };
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
            hqFile        : this.hqFile
        };
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
