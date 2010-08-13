/**
 * @description Class that builds a movie from a series of images when a button is clicked, 
 *              and displays the video to the user.
 * @fileoverview Contains the definition of a class for generating and displaying movies.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 * 
 * @TODO: If the user's end time is past what the database has, warn the user that their movie will be incomplete.
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, Shadowbox, setTimeout, window, MediaBuilder, Movie, getOS, layerStringToLayerArray,
 extractLayerName */
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
    proxied : false,
    /**
     * @constructs
     * @description Loads default options, grabs mediaSettings, sets up event listener for the movie button
     * @TODO Add error checking for startTime in case the user asks for a time that isn't in the database.
     * @param {Object} controller -- the helioviewer class 
     */    
    init: function (viewport, history, proxyURL) {
        this._super(viewport, history, proxyURL);
        this.button   = $("#movie-button");
        this.percent  = 0;
        this.id       = "movie";

        this.hqFormat = this.formats[getOS()];

        this._setupDialogAndEventHandlers();
    },
    
    /**
     * Called after _setupDialogAndEventHandlers is finished initializing the dialog. 
     * Creates event listeners for the "Full Viewport" and "Select Area" buttons in the
     * dialog. "Full Viewport" makes a movie immediately, "Select Area" triggers 
     * the ImageSelectTool and provides it with a callback function to validateAndBuild().
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
                self.validateAndBuild(viewportInfo);
            }
        });
    
        this.selectAreaButton.click(function () {
            self.hideDialogs();
            
            if (self.building) {
                $(document).trigger("message-console-log", ["A link to your video will be available shortly."]);
            } else {
                $(document).trigger("enable-select-tool", $.proxy(self.validateAndBuild, self));
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
    validateAndBuild: function (viewportInfo) {
        if (!this.ensureValidArea(viewportInfo)) {
            $(document).trigger("message-console-warn", ["The area you have selected is too small to " +
                "create a movie. Please try again."]);
            return;
            
        } else if (!this.ensureValidLayers(viewportInfo)) {
            $(document).trigger("message-console-warn", ["You must have at least one layer in your movie. " +
                "Please try again."]);
            return;
        }
        
        var layers = layerStringToLayerArray(viewportInfo.layers);

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
        var finalLayers = [], self = this;
        
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
                        self.finalizeLayersAndBuild(viewportInfo);
                    });
                }
            }
        });
    },
    
    /**
     * Checks to see if the user has picked 3 or fewer layers and will make a movie if they have.
     * If not, does nothing and warns the user to pick 1-3 layers.
     */
    finalizeLayersAndBuild: function (viewportInfo) {
        var checkboxes, finalLayers = [], msg;
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
            this.buildMovie(viewportInfo);
            Shadowbox.close();
        }

        // If the user still hasn't entered a valid number of layers, 
        // keep the prompt open and warn them
        else {
            // clear out finalLayers and try again
            finalLayers = [];
            msg = "Please select between 1 and 3 layers.";
            $(document).trigger("message-console-log", [msg]);
        }
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
        var table, rawName, name, layerNum, checked;
        table = '<div id="shadowbox-form" class="ui-widget ui-widget-content ui-corner-all ' + 
                    'ui-helper-clearfix" style="margin: 10px; padding: 20px; font-size: 12pt;" >' +
                    'Please select at most 3 layers from the choices below for the movie: <br /><br />' +
                    '<table id="layers-table">';
        
        // Get a user-friendly name for each layer. each layer in "layers" is a string: 
        // "obs,inst,det,meas,visible,opacity". Cut off visible and opacity and get rid of
        // square brackets.
        layerNum = 1;
        $.each(layers, function () {
            rawName = extractLayerName(this);
            name = rawName.join(" ");
            // Only check the first 3 layers by default.
            checked = layerNum < 4 ? 'checked=true' : "";

            table +=    '<tr>' +
                            '<td class="layers-checkbox"><input type=checkbox name="layers" ' + 
                                checked + ' value="[' + this + ']"/></td>' +
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
        var options, params, arcsecCoords, realVPSize, vpHeight, coordinates, movieHeight, 
            movie, url, scaleDown = false, self = this;

        this.building = true;
        arcsecCoords  = this.toArcsecCoords(viewportInfo.coordinates, viewportInfo.imageScale);
        
        realVPSize = this.viewport.getViewportInformation().coordinates;
        vpHeight   = realVPSize.bottom - realVPSize.top;
        
        coordinates = viewportInfo.coordinates;
        movieHeight = coordinates.bottom - coordinates.top;
        
        if (movieHeight >= vpHeight - 50) {
            scaleDown = true;
        }
        
        // Ajax Request Parameters
        params = {
            action     : "queueMovie", //action     : "getETAForMovie",
            layers     : viewportInfo.layers,
            startTime  : viewportInfo.time,
            imageScale : viewportInfo.imageScale,
            x1         : arcsecCoords.x1,
            x2         : arcsecCoords.x2,
            y1         : arcsecCoords.y1,
            y2         : arcsecCoords.y2,
            hqFormat   : this.hqFormat,
            scaleDown  : scaleDown,
            display    : false
        };
        
        this.hideDialogs();
        this.history.queueMovie(params, this.hqFormat, this.url);
        this.building = false;
    }
});
