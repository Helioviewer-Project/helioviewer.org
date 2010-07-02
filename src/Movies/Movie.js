/**
 * @description Abstract class that keeps track of previous media made and controls the display bar and tooltips associated with it.
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, Shadowbox, setTimeout, window */
"use strict";
var Movie = Class.extend(
    /** @lends Movie.prototype */
    {
    /**
     * @constructs
     * @description Calculates its dimensions and handles movie display. Holds on to information used 
     *  to create the movie.
     */    
    init: function (params) {
        $.extend(this, params);
        this.startTime = this.startTime.replace("T", " ").slice(0,-5);
        this.width  = Math.floor((this.x2 - this.x1) / this.imageScale);
        this.height = Math.floor((this.y2 - this.y1) / this.imageScale);
        
        $(document).bind("setup-information-tooltip", $.proxy(this.setupTooltip, this));
    },
    
    /**
     * Sets the url, name, and high quality file
     */
    setURL: function (url, id) {
        this.url    = url;
        this.name   = id;
        this.hqFile = (url).slice(0, -3) + "mp4";
    },
    
    /**
     * Creates a tooltip that pops up with information about the movie
     * when its link is moused over. Also sets up an event listener for the
     * link to trigger playing the movie. 
     */
    setupTooltip: function () {
        var info, self;
        this.button = $("#" + this.name);
        this.watchDialog = $("#watch-dialog-" + this.name);
        info = this.getInformationTable();
        self = this;
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
        
        this.button.click(function () {
            self.button.qtip("hide");
            self.playMovie();
        });
    },
    
    /**
     * Creates a table element with information about the movie.
     */
    getInformationTable: function () {
        return "<table>" +
                    "<tr>" + 
                        "<td><b>Layers: </b></td>" + 
                        "<td>" + this.layers + "</td>" + 
                    "</tr>" +
                    "<tr>" +
                        "<td><b>Start Time: </b></td>" +
                        "<td>" + this.startTime + "</td>" + 
                    "</tr>" +
                    "<tr>" + 
                        "<td><b>Image Scale:&nbsp;&nbsp;</b></td>" +
                        "<td>" + this.imageScale + " arcsec/px</td>" + 
                    "</tr>" +
                    "<tr>" + 
                        "<td><b>Dimensions: </b></td>" + 
                        "<td>" + this.width + "x" + this.height + "</td>" + 
                    "</tr>"
                "</table>";
    },
    
    /**
     * @description Opens a pop-up with the movie player in it.
     */
    playMovie: function () {
        var url, self;
        self = this;
        url  = 'api/index.php?action=playMovie&url=' + this.url + '&width=' + this.width + '&height=' + this.height;    
        
        // Have to append the video player here, otherwise adding it to the div beforehand results in the browser
        // trying to download it. 
        this.watchDialog.dialog({
            title  : "Helioviewer Movie Player",
            width  : 'auto',
            height : 'auto',
            open   : self.watchDialog.append("<div id='movie-player-" + self.name + "'>" + 
                                            "<iframe src=" + url + " width=" + self.width + " height=" + self.height + 
                                                " marginheight=0 marginwidth=0 scrolling=no frameborder=0 /><br /><br />" +
                                                "<a href='api/index.php?action=downloadFile&url=" + self.hqFile + "'>" +
                                                    "Click here to download a high-quality version." +
                                                "</a></div>"),
            close  : function () { $("#movie-player-" + self.name).remove() },
            zIndex : 9999,
            show   : 'fade'
        });                                 
    },
});
