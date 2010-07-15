/**
 * @description Class that builds a movie from a series of images when a button is clicked, and displays the video to the user.
 * @fileoverview Contains the definition of a class for generating and displaying movies.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author Jaclyn Beck
 * 
 * @TODO: Error messages from the movie building process pop up in Shadowbox right now for debugging, but for 
 *             putting this online it might be better to just display a jGrowl notification saying there was an error. 
 * @TODO: If the user's end time is past what the database has, warn the user that their movie will be incomplete.
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, Shadowbox, setTimeout, window, MediaBuilder */
"use strict";
var MovieBuilder = MediaBuilder.extend(
    /** @lends MovieBuilder.prototype */
    {
    formats : {
        "win"   : "avi",
        "mac"   : "mov",
        "linux" : "mp4",
        "other" : "mp4"
    },
    /**
     * @constructs
     * @description Loads default options, grabs mediaSettings, sets up event listener for the movie button
     * @TODO Add error checking for startTime in case the user asks for a time that isn't in the database.
     * @param {Object} controller -- the helioviewer class 
     */    
    init: function (viewport, mediaHistoryBar) {
        this._super(viewport, mediaHistoryBar);
        this.button   = $("#movie-button");
        this.percent  = 0;
        this.id       = "movie";
        
        var os        = getOS();
        this.hqFormat = this.formats[os];

        this._setupDialogAndEventHandlers();
    },
    
    /**
     * Called after _setupDialogAndEventHandlers is finished initializing the dialog. 
     * Creates event listeners for the "Full Viewport" and "Select Area" buttons in the
     * dialog. "Full Viewport" makes a movie immediately, "Select Area" triggers 
     * the ImageSelectTool and provides it with a callback function to checkMovieLayers().
     * 
     * Finally, it also initializes the history bar, which floats beneath the dialog and
     * has a list of all movies made in this session. History bar has to be initialized here
     * because it depends on divs created in the dialog.
     */
    _setupEventListeners: function () {
        var self = this, viewportInfo;
        
        this.fullVPButton     = $("#" + this.id + "-full-viewport");
        this.selectAreaButton = $("#" + this.id + "-select-area");

        this._super();
    
        this.fullVPButton.click(function () {
            self.hideDialogs();
            
            if (self.building) {
                $(document).trigger("message-console-log", ["A link to your video will be available shortly."]);
            } else {
                viewportInfo = self.viewport.getViewportInformation();
                self.checkMovieLayers(viewportInfo);
            }
        });
    
        this.selectAreaButton.click(function () {
            self.hideDialogs();
            
            if (self.building) {
                $(document).trigger("message-console-log", ["A link to your video will be available shortly."]);
            } else {
                $(document).trigger("enable-select-tool", $.proxy(self.checkMovieLayers, self));
            }
        });
    },
    
    /**
     * @description Checks to make sure there are 3 or less layers in the movie. If there are more, 
     *              user is presented with pop-up in Shadowbox asking them to pick 3 layers. Otherwise,
     *              builds the movie.
     * @param {Object} viewportInfo -- An object containing layers, time, imageScale, and coordinates.
     *                     
     */
    checkMovieLayers: function (viewportInfo) {
        if (!this.ensureValidArea(viewportInfo)) {
            $(document).trigger("message-console-warn", ["The area you have selected is too small to create a movie. Please try again."]);
            return;
        } else if (!this.ensureValidLayers(viewportInfo)) {
            $(document).trigger("message-console-warn", ["You must have at least one layer in your movie. Please try again."]);
            return;
        }
        
        var finalLayers, self, layers, table, info, rawName, name, tableValues, checkboxes, newInfo;
        
        layers = viewportInfo.layers.split("],");

        // If there are between 1 and 3 layers, continue building.
        if (layers.length <= 3 && layers.length >= 1) {
            this.buildMovie(viewportInfo);
        }    
        
        // Otherwise, prompt the user to pick 3 layers.
        else {
            this.promptForLayers(viewportInfo, layers);
        }
    },        

    /**
     * Opens Shadowbox and prompts the user to pick only 3 layers.
     */
    promptForLayers: function (viewportInfo, layers) {
        var finalLayers, self=this;
        finalLayers = [];
        self = this;
        
        Shadowbox.open({
            player:    "html",
            width:     450,
            // Adjust height depending on how much space the text takes up (roughly 20 pixels per 
            // layer name, and a base height of 170)
            height: 170 + layers.length * 20,

            // Put a table of possible layers + check boxes in shadowbox.
            content: this.createLayerSelectionTable(layers),       
            options:    {
                onFinish: function () {
                    // Set up event handler for the button
                    $('#ok-button').click(function () {
                        checkboxes = $('td.layers-checkbox');
                    
                        // checkboxes is an array of each <td.layers-checkbox> that exists in the table
                        // this.firstChild is an <input type=checkbox> and is used to get the value.
                        $.each(checkboxes, function () {
                            // If the checkbox is selected, add that layer.
                            if (this.firstChild.checked) {
                                finalLayers.push(this.firstChild.value);
                            }
                        });

                        // Set the new layers in viewportInfo and build the movie.
                        if (finalLayers.length <= 3 && finalLayers.length >= 1) {
                            viewportInfo.layers = finalLayers.join(",");
                            self.buildMovie(viewportInfo);
                            Shadowbox.close();
                        }
                    
                        // If the user still hasn't entered a valid number of layers, 
                        // keep the prompt open and warn them
                        else {
                            // clear out finalLayers and try again
                            finalLayers = [];
                            var msg = "Please select between 1 and 3 layers.";
                            $(document).trigger("message-console-log", [msg]);
                        }
                    });
                }
            }
        });
    },
    
    /**
     * Creates a table that will pop up in Shadowbox if too many layers are requested.
     * The table looks approximately like this:
     * <checkbox>Layername
     * <checkbox>Layername
     * ...
     * <okButton>
     */
    createLayerSelectionTable: function (layers) {
        var table, rawName, name, numLayers;
        table = '<div id="shadowbox-form" class="ui-widget ui-widget-content ui-corner-all ' + 
                    'ui-helper-clearfix" style="margin: 10px; padding: 20px; font-size: 12pt;" >' +
                    'Please select at most 3 layers from the choices below for the movie: <br /><br />' +
                    '<table id="layers-table">';
        
        // Get a user-friendly name for each layer. each layer in "layers" is a string: 
        // "obs,inst,det,meas,visible,opacity". Cut off visible and opacity and get rid of
        // square brackets.
        layerNum = 1;
        $.each(layers, function () {
            rawName = this.split(',').slice(0, -2);
            name = rawName.join(" ").replace(/[\[\]]/g, "");
            // Only check the first 3 layers by default.
            checked = layerNum < 4? 'checked=true' : "";

            table +=    '<tr>' +
                            '<td class="layers-checkbox"><input type=checkbox name="layers" ' + 
                                checked + ' value="' + this.replace("]", "") + "]" + '"/></td>' +
                            '<td class="layers-name">' + name + '</td>' + 
                        '</tr>';
            layerNum += 1;
        });
        
        table +=    '</table>' + 
                    '<div id="buttons" style="text-align: left; float: right;">' +
                        '<button id="ok-button" class="ui-state-default ui-corner-all">OK</button>' +
                    '</div>' +
                '</div>';
        
        return table;
    },
    
    /**
     * @description Uses the layers passed in to send an Ajax request to api.php, to have it build a movie.
     *                 Upon completion, it displays a notification that lets the user click to view it in a popup. 
     * @param {Object} viewportInfo -- An object containing coordinates, layers, imageScale, and time 
     */
    buildMovie: function (viewportInfo) {
        var timeout, options, end, params, callback, arcsecCoords, realVPSize, vpHeight, coordinates, movieHeight, valid, scaleDown = false, self = this;
        
        this.building = true;
        arcsecCoords  = this.toArcsecCoords(viewportInfo.coordinates, viewportInfo.imageScale);
        
        realVPSize = this.viewport.getViewportInformation().coordinates;
        vpHeight   = realVPSize.bottom - realVPSize.top;
        
        coordinates = viewportInfo.coordinates;
        movieHeight = coordinates.bottom - coordinates.top;
        
        if (movieHeight >= vpHeight - 50) {
            scaleDown = true;
        }

        // Default to 24 hours after startTime.
        end = new Date(getUTCTimestamp(viewportInfo.time) + 86400000);
        end = end.toISOString().replace(/"/g, '');
        
        // Ajax Request Parameters
        params = {
            action     : "buildMovie",
            layers     : viewportInfo.layers,
            startTime  : viewportInfo.time,
            endTime    : end,
            imageScale : viewportInfo.imageScale,
            x1         : arcsecCoords.x1,
            x2         : arcsecCoords.x2,
            y1         : arcsecCoords.y1,
            y2         : arcsecCoords.y2,
            hqFormat   : this.hqFormat,
            scaleDown  : scaleDown
        };
        
        movie = new Movie(params, (new Date()).getTime(), this.hqFormat);

        /*
         * timeout is calculated to estimate the amount of time a movie will take to build. From benchmarking, 
         * I estimated about 1 second per layer, per frame, to be the general case. C2 and C3 layers sometimes 
         * take longer but this is a good general equation. It will need to be adjusted when the database scales 
         * up to account for the amount of time queries take.
         * A movie with 40 frames and 2 layers would then take 1000 ms * 2 layers * 40 frames = 80000 ms, 
         * or 80 seconds. Then we want to divide that evenly over 100% so that each 1% gets added at regular 
         * intervals. so 80000 ms / 100 = 800 ms, or .8 seconds in between adding 1% to the progress counter.
         */
//        timeout = (1000 * layerNames.length * self.numFrames) / 100; 
//        self.percent  = 0;
//        self.updateProgress(timeout);    

        // Ajax Request Callback
        callback = function (data) {
            var id, hqfile;
            $(this).trigger('video-done');

            self.building = false;
            
            if (data !== null) {
                // Finds the part of the url that is the unix timestamp of the movie and uses that for id.
                id = data.match(/\/\d+\//)[0].replace(/\//g, "");

                // chop off the flv at the end of the file and replace it with mov/asf/mp4
                hqfile = data.slice(0, -3) + this.hqFormat;
                
                // Options for the jGrowl notification. After it has opened, it will create
                // event listeners for the watch link                               
                options = {
                    sticky: true,
                    header: "Your movie is ready!",
                    open  : function () {
                        var watch = $('#watch-' + id), jgrowl = this;

                        movie.setURL(data, id);
                        self.hideDialogs();
                        self.historyBar.addToHistory(movie);
                        
                        // Open pop-up and display movie
                        watch.click(function () {
                            $(".jGrowl-notification .close").click();
                            movie.playMovie();
                        });
                    }
                };

                // Make the jGrowl notification with the options above. Add an empty div for the watch dialog in case they
                // click on the notification.
                $(document).trigger("message-console-info", [
                            "<div id='watch-" + id + "' style='cursor:pointer;'>Click here to watch or download it.<br />(opens in a pop-up)</div>" +
                            "<div id='watch-dialog-" + id + "' style='display:none'>&nbsp;</div>", options]);
            } else {
                $(document).trigger("message-console-warn", ["There are not enough images to create a video for this date. Please try a different date or different layers."]);
            }
        };

        $.post(this.url, params, callback, "json");
    },
    
    /**
     * @description Displays a percentage, starting at 0, and increments it by one every <timeout> seconds.
     *              It is here so users can tell something is going on. 
     * @param {Object} timeout -- a value in miliseconds that was calculated in buildMovie as an estimate 
     *        of how long the movie will take to build / 100.
     */    
    updateProgress: function (timeout) {
        var self = this;
        
        // If 'video-done' is fired off, self.percent will be 101 so the next if statement will fail, and
        // the process will stop.
        $(this).bind('video-done', function () {
            self.percent = 101;
        });
        
        if (this.percent <= 100) {
            //this.controller.messageConsole.progress('Movie loading: ' + this.percent + '%');
            this.percent += 1;
            // call this function after <timeout> seconds.
            setTimeout(function (thisObj) {
                thisObj.updateProgress(timeout);
            }, timeout, this);
        }    
    }
});
