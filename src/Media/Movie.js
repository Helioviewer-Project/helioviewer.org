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
    formats : {
        "win"   : "mp4",
        "mac"   : "mp4",
        "linux" : "mp4",
        "other" : "mp4"
    },
    /**
     * @constructs
     * @description Calculates its dimensions and handles movie display. Holds on to information used 
     *  to create the movie.
     */    
    init: function (params) {
        this.dateRequested = null;
        this.duration      = null;
        this.id            = null;
        this.width         = null;
        this.height        = null;
        this.hqFormat      = null;
        this.imageScale    = null;
        this.layers        = null;
        this.name          = null;
        this.startTime     = null;
        this.url           = null;
        this.x1            = null;
        this.x2            = null;
        this.y1            = null;
        this.y2            = null;
        this.complete      = null;
        
        // Call parent constructor
        this._super(params);
        
        this.time = this.startTime.replace("T", " ");
        
        // Get rid of the extra .000 if there is one
        if (this.time.length > 20) {
            this.time = this.time.slice(0, -5);
        }

        this.hqFormat = params.hqFormat || this.formats[getOS()];
        this.complete = params.complete || false;
        this.url      = params.url      || "";
    },
    
    /**
     * Sets the URL and completed status
     */
    setURL: function (url) {
        this._super(url, this.id);
        this.complete = true;
    },
    
    setDuration: function (duration) {
        this.duration = duration;
    },
    
    setId: function (id) {
        this.id = id;
    },

    getTimeDiff: function () {
        if (!this.complete) {
            return "<span style='color: #aaf373;'>Processing</span>";
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
            //self.button.parents('.qtip')
            //self.button.qtip("hide");
            if (self.complete) {
                $(".qtip").not("#qtip-4").qtip("hide"); // Hide history dialog (qtip-4 is image area select confirm)
                self.playMovie();                
            }
        });
    },
    
    /**
     * @description Opens a pop-up with the movie player in it.
     */
    playMovie: function () {
        var file, hqFile, uploadURL, dimensions, movieDialog, self = this;
        
        //$("#movie-button").click();
        
        movieDialog = $("#watch-dialog-" + this.id);
        
        // Make sure dialog fits nicely inside the browser window
        dimensions = this.getVideoPlayerDimensions();
        
        // Have to append the video player here, otherwise adding it to the div beforehand results in the browser
        // trying to download it. 
        movieDialog.dialog({
            title     : "Helioviewer Movie Player",
            width     : dimensions.width  + 34,
            height    : dimensions.height + 104,
            resizable : $.support.h264,
            close     : function () {
                            movieDialog.empty();
                        },
            zIndex    : 9999,
            show      : 'fade'
        }).append(self.getVideoPlayerHTML(dimensions.width, dimensions.height));
        
        // Work-around: re-process file information for YouTube uploads
        file   = this.url.match(/[\w-]*\/[\w-\.]*.mp4$/).pop(); // Relative path to movie        
        hqFile = file.replace(".mp4", "-hq." + this.hqFormat);
        
        // TODO 2011/01/04: Disable keyboard shortcuts when in text fields! (already done for input fields...)
        
        // Initialize YouTube upload button
        $('#youtube-upload-' + this.id).click(function () {
            // Close movie dialog (Flash player blocks upload form)
            movieDialog.dialog("close");
            uploadURL = "api/index.php?action=uploadMovieToYouTube&file=" + hqFile;
            
            var uploadHTML = "<div id='youtube-upload-dialog-" + self.id + "'>" +
                             "<iframe src='" + uploadURL + "' scrolling='no' width='100%' height='100%' style='border: none' />";

            //$("<div id='youtube-upload-dialog-" + self.id + "' />").load(uploadURL).dialog({
            $(uploadHTML).dialog({
                "title": "Upload video to YouTube",
                width : 1038, // Optimized for YouTube Login dimensions
                height: 600
            });
        });
    },
    
    /**
     * Generates HTML to display a Helioviewer movie
     */
//    getVideoPlayerHTML: function (width, height) {
//        var css     = "margin-left: auto; margin-right: auto;",
//            relpath = this.url.match(/cache.*/).pop().slice(0, -4);
//        
//        if ($.support.video) {
//            width  = "100%";
//            height = "99%";
//        }
//        
//        return '<div style="text-align: center;">' +
//               //'<div style="margin-left:auto; margin-right:auto; width:' + width + 'px; height:' + height + 'px;";>' +
//               '<div style="margin-left:auto; margin-right:auto; width:' + width + '; height:' + height + ';">' +
//               '<video style="' + css + '" poster="' + relpath + '.jpg" durationHint="' + this.duration + '">' +
//                    '<source src="' + relpath + '.mp4" />' + 
//                    '<source src="' + relpath + '.flv" />' + 
//               '</video></div></div>';
//    },
    
//    /**
//     * Decides how to display video and returns HTML corresponding to that method
//     * 
//     * 08/31/2010: Kaltura does not currently support jQuery UI 1.8, and even with 1.7.1
//     * some bugs are present. Try again in future.
//     */
//    getVideoPlayerHTML: function (width, height) {
//        // Base URL
//        var path = this.url.match(/cache.*/).pop().slice(0,-3);
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
        var path, file, hqFile, flashFile, url, youtubeBtn;

        file = this.url.match(/[\w-]*\/[\w-\.]*.mp4$/).pop(); // Relative path to movie
        
        hqFile    = file.replace(".mp4", "-hq." + this.hqFormat);
        flashFile = file.replace("mp4", "flv");
        
        youtubeBtn = "<a id='youtube-upload-" + this.id + "'  href='#'><img class='youtube-icon' " +
        "src='resources/images/Social.me/24 by 24 pixels/youtube.png' alt='Upload video to YouTube' /></a>";
        
        // HTML5 Video (Currently only H.264 supported)
        if ($.support.h264) {
            path = this.url.match(/cache.*/).pop();
//            return "<video id='movie-player-" + this.id + "' src='" + path +
//                   "' controls preload autoplay width='100%' " + "height='99%'></video>";
            return "<video id='movie-player-" + this.id + "' src='" + path +
            "' controls preload autoplay width='100%' " + "height='95%'></video>" +
            "<a target='_parent' href='api/index.php?action=downloadFile&uri=movies/" + hqFile + "'>" +
            "Click here to download a high-quality version.</a>" + youtubeBtn;
        }

        // Fallback (flash player)
        else {
            url = 'api/index.php?action=playMovie&file=' + flashFile + 
                  '&width=' + width + '&height=' + height + '&duration=' + this.duration;
            
            return "<div id='movie-player-" + this.id + "'>" + 
            "<iframe src=" + url + " width=" + width + " height=" + 
                height + " marginheight=0 marginwidth=0 scrolling=no " +
                "frameborder=0 /><br />" +
                "<a target='_parent' href='api/index.php?action=downloadFile&uri=movies/" + hqFile + "'>" +
                    "Click here to download a high-quality version." +
                "</a>" + youtubeBtn + "</div>";
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
            "width"  : Math.floor(this.width  / scaleFactor),
            "height" : Math.floor(this.height / scaleFactor)
        };
    },
    
    /**
     * Puts information about the movie into an array for storage in UserSettings.
     */
    serialize: function () {
        return {
            complete      : this.complete,
            dateRequested : this.dateRequested,
            duration      : this.duration,
            id            : this.id,
            imageScale    : this.imageScale,
            layers        : this.layers,
            name          : this.name,
            startTime     : this.startTime,
            url           : this.url,
            x1            : this.x1,
            x2            : this.x2,
            y1            : this.y1,
            y2            : this.y2
        };
    },
    
    /**
     * Creates a table element with information about the movie.
     */
    getInformationTable: function () {        
        var layerArray, table, previewFrame;
        previewFrame = this.url.slice(0, -3) + "png";
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
