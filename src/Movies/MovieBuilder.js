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

    /**
     * @constructs
     * @description Loads default options, grabs mediaSettings, sets up event listener for the movie button
     * @TODO Add error checking for startTime in case the user asks for a time that isn't in the database.
     * @param {Object} controller -- the helioviewer class 
     */    
    init: function (viewport) {
        this._super(viewport);
        this.button  = $("#movie-button");
        this.percent = 0;
        this.id      = "movie";
        this._setupDialog();
    },
    
    _setupEventListeners: function () {
        var self = this, viewportInfo;
        this.fullVPButton     = $("#" + this.id + "-full-viewport");
        this.selectAreaButton = $("#" + this.id + "-select-area");
    
        this.fullVPButton.click(function () {
            self.hideDialogs();
            if (self.building) {
                $(document).trigger("message-console-log", ["A link to your video will be available shortly."]);
            }
            else {
                viewportInfo = self.viewport.getViewportInformation();
                self.checkMovieLayers(viewportInfo);
            }
        });
    
        this.selectAreaButton.click(function () {
            self.hideDialogs();
            if (self.building) {
                $(document).trigger("message-console-log", ["A link to your video will be available shortly."]);
            }
            else {
                $(document).trigger("enable-select-tool", $.proxy(self.checkMovieLayers, self));
            }
        });
        
        this.historyBar = new MovieHistoryBar(this.id);
    },
    
    hideDialogs: function () {
        this.button.qtip("hide");
        this.historyBar.hide();
    },
    
    /**
     * @description Checks to make sure there are 3 or less layers in the movie. If there are more, 
     *              user is presented with pop-up in Shadowbox asking them to pick 3 layers.
     * @param {Object} self 
     * @param {Object} visibleCoords -- An array containing the top, left, bottom, right coordinates of:
     *                      1) what is currently visible in the viewport, or
     *                      2) a selected region within the viewport.
     *                     Note that these coordinates are heliocentric, with the center of the sun being (0,0).
     *                     
     */
    checkMovieLayers: function (viewportInfo) {
        var finalLayers, self, layers, table, info, rawName, name, tableValues, checkboxes, newInfo;
        
        layers = viewportInfo.layers.split("]");
        // If there are between 1 and 3 layers, continue building.
        if (layers.length <= 3 && layers.length >= 1) {
            this.buildMovie(viewportInfo);
        }    
        
        // Otherwise, prompt the user to pick 3 layers.
        else {
            finalLayers = [];
            self = this;
            Shadowbox.open({
                player:    "html",
                width:     450,
                // Adjust height depending on how much space the text takes up (roughly 20 pixels per 
                // layer name, and a base height of 150)
                height: 150 + layers.length * 20,

                // Put an empty table into shadowbox. Rows of layers need to be dynamically added through javascript.
                content: '<div id="shadowbox-form" class="ui-widget ui-widget-content ui-corner-all ' + 
                         'ui-helper-clearfix" style="margin: 10px; padding: 20px; font-size: 12pt;" >' +
                            'Please select only 3 layers from the choices below for the movie: <br />' +
                            '<table id="layers-table">' + 
                            '</table>' + 
                            '<div id="buttons" style="text-align: left; float: right;">' +
                                '<button id="ok-button" class="ui-state-default ui-corner-all">OK</button>' +
                            '</div>' +
                        '</div>',
                        
                options:    {
                    onFinish: function () {

                        //table = $('layers-table');
                        table = $('#layers-table');
                        tableValues = "";
                        
                        // Get a user-friendly name for each layer. each layer in "layers" is a string: 
                        // "obs,inst,det,meas,visible,opacity'x'XStart,XEnd,YStart,YEnd,offsetX,offsetY"    
                        $.each(viewportInfo.layers, function (i, l) {
                            info = l.split('x');
                            // Extract the first part of the layer string (obs,inst,det,meas,visible,opacity) and
                            // slice off the last two values.
                            rawName = (info[0]).split(',').slice(0, -1);
                            name = rawName.join(" ");
                            tableValues += '<tr>' +
                                    '<td class="layers-checkbox"><input type=checkbox name="layers" ' + 
                                    'checked=true value="' + l + '"/></td>' +
                                    '<td class="layers-name">' + name + '</td>' + 
                                '</tr>';
                        });    
                        
                        //table.innerHTML += tableValues;
                        table.append(tableValues);
                        
                        // Set up event handler for the button
                        $('#ok-button').click(function () {
                            checkboxes = $('td.layers-checkbox');
                            
                            // checkboxes is an array of each <td.layers-checkbox> that exists in the table
                            // "this" represents an individual element in the array.
                            // So "this" would be one <td.layers-checkbox>, and this.firstChild 
                            // is its <input type=checkbox>
                            $.each(checkboxes, function () {
                                // If the checkbox is selected, add that layer. The value is the full 
                                // name of the layer as found in the array "layers".
                                if (this.firstChild.checked) {
                                    finalLayers.push(this.firstChild.value);
                                }
                            });

                            if (finalLayers.length <= 3 && finalLayers.length >= 1) {
                                newInfo = {
                                    layers      : finalLayers,
                                    time        : viewportInfo.time,
                                    imageScale  : viewportInfo.imageScale,
                                    coordinates : viewportInfo.coordinates
                                };
                                self.buildMovie(newInfo);
                                Shadowbox.close();
                            }
                            
                            // If the user still hasn't entered a valid number of layers, 
                            // keep the prompt open and warn them
                            else {
                                // clear out finalLayers and try again
                                finalLayers = [];
                                var msg = "Please select between 1 and 3 layer choices.";
                                $(document).trigger("message-console-error", [msg]);
                            }
                        });
                    }
                }
            });
        }
    },        

    /**
     * @description Uses the layers passed in to send an Ajax request to api.php, to have it build a movie.
     *                 Upon completion, it displays a notification that lets the user click to view it in Shadowbox
     *                 or download the high quality version. 
     * @param {Object} self
     * @param {Object} layers -- An array of layer strings in the format: "obs,inst,det,meas,opacity"    
     */
    buildMovie: function (viewportInfo) {
        var timeout, options, params, callback, arcsecCoords, self = this;
        
        this.building = true;

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
            
            id = (data).slice(-14,-4);
            self.building = false;
            // chop off the flv at the end of the file and replace it with mov/asf/mp4
            hqfile = (data).slice(0, -3) + "mp4";
            
            // If the response is an error message instead of a url, show the message
            if (data === null) {
                //mediaSettings.shadowboxWarn("Error Creating Movie.");
            }    
            
            else {
                // Options for the jGrowl notification. After it has opened, it will create
                // event listeners for the download and watch links                                
                options = {
                    sticky: true,
                    header: "Your movie is ready!",
                    open:    function () {
                        var watch, dialog;
                        watch       = $('#watch-' + id);
                       // watchDialog = $('#watch-dialog-' + id);

                        movie.setURL(data, id);
                        self.historyBar.addToHistory(movie);
                        
                        // Open pop-up and display movie
                        watch.click(function () {
                            movie.playMovie();
                        });
                    }
                };

                // Make the jGrowl notification with the options above.
                $(document).trigger("message-console-info", [
                            "<a href='#' id='watch-" + id + "'>Click here to watch it</a> (opens in a pop-up)<br />" +
                            "-or-<br />" + 
                            "<a href='api/index.php?action=downloadFile&url=" + hqfile + "'>" +
                            		"Click here to download a high-quality version." +
                            "</a>", options]);
            }
        };

        arcsecCoords = this.toArcsecCoords(viewportInfo);
        
        // Ajax Request Parameters
        params = {
            action     : "buildMovie",
            layers     : viewportInfo.layers,
            startTime  : viewportInfo.time,
            imageScale : viewportInfo.imageScale,
            x1         : arcsecCoords.x1,
            x2         : arcsecCoords.x2,
            y1         : arcsecCoords.y1,
            y2         : arcsecCoords.y2
        };
        
        movie = new Movie(params);

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
