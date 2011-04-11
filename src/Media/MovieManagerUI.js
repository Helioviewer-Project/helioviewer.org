/**
 * MovieManagerUI class definition
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: false, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global $, MovieManager, MediaManagerUI, Helioviewer */
"use strict";
var MovieManagerUI = MediaManagerUI.extend(
    /** @lends MovieManagerUI */
    {
    /**
     * @constructs
     * Creates a new MovieManagerUI instance
     * 
     * @param {MovieManager} model MovieManager instance
     */    
    init: function (movieManager) {
        this._manager = new MovieManager(Helioviewer.userSettings.get('movies'));;
        this._super("movie");
        
        this._format = $.support.vp8 ? "webm" : "mp4";

        this._initEvents();
    },
    
    /**
     * Displays a jGrowl notification to the user informing them that their download has completed
     */
    _displayDownloadNotification: function (id) {
        var jGrowlOpts, link, self = this;
        
        // Options for the jGrowl notification
        jGrowlOpts = {
            sticky: true,
            header: "Your movie is ready!",
            open:    function () {
                self.hide();

                // open callback now called before dom-nodes are added to screen so $.live used
//                $("#movie-" + id).live('click', function () {
//                    $(".jGrowl-notification .close").click();
//                    window.open('api/index.php?action=downloadMovie&id=' + id, '_parent');
//                });
            }
        };
        
        // Download link
        //link = "<div id='movie-" + id + "' style='cursor: pointer'>Click here to download. </div>";
        link = "<a href='api/index.php?action=downloadMovie&id=" + id + "' target='_parent' style=''>Click here to download. </a>";

        // Create the jGrowl notification.
        $(document).trigger("message-console-info", [link, jGrowlOpts]);
    },
    
    /**
     * Initializes MovieManager-related event handlers
     */
    _initEvents: function () {
        var self = this;
       
        this._super();
        
        this._fullViewportBtn.click(function () {
            self.hide();
            self._buildMovie();
        });
        
        this._selectAreaBtn.click(function () {
            self.hide();
            //$(document).trigger("enable-select-tool", $.proxy(self._takeMovie, self));
        });
    },

    /**
     * Uses the layers passed in to send an Ajax request to api.php, to have it build a movie.
     * Upon completion, it displays a notification that lets the user click to view it in a popup. 
     */
    _buildMovie: function (roi) {
        var options, params, currentTime, now, diff, arcsecCoords, realVPSize, vpHeight, coordinates, movieHeight, 
            movie, movieLength, url, self = this;

        if (typeof roi === "undefined") {
            roi = helioviewer.getViewportRegionOfInterest();
        }

        imageScale = helioviewer.getImageScale();
        layers     = helioviewer.getLayers();
        
        // Make sure selection region and number of layers are acceptible
        if (!this._validateRequest(roi, layers)) {
            return;
        };

        // If more than three layers are currently loaded prompt the user to pick the layers they wish to include
        if (layers.length > 3) {
            this.promptForLayers(layers);
            return;
        }    

        this.building = true;
        this.button.addClass("working");


        
        movieLength = Helioviewer.userSettings.get("movieLength");
        
        // Webkit doesn't like new Date("2010-07-27T12:00:00.000Z")
        currentTime = new Date(getUTCTimestamp(viewportInfo.time));
        
        // We want shift start and end time if needed to ensure that entire
        // duration will be used. For now, we will assume that the most
        // recent data available is close to now() to make things simple
        now = new Date();
        diff = new Date(currentTime.getTime()).addSeconds(movieLength / 2).getTime() - now.getTime();
        currentTime.addSeconds(Math.min(0, -diff / 1000));
        
        // Ajax Request Parameters
        params = $.extend({
            action        : "queueMovie",
            imageScale    : imageScale,
            layers        : layers,
            startTime     : currentTime.addSeconds(-movieLength / 2).toISOString(),
            endTime       : currentTime.addSeconds(movieLength).toISOString(),
            format        : this._format
        }, this._toArcsecCoords(roi, imageScale));
        
        // AJAX Responder
        $.getJSON("api/index.php", params, function (response) {
            if ((response === null) || response.error) {
                $(document).trigger("message-console-info", "Unable to create movie. Please try again later.");
                return;
            }

            movie = self._manager.add(
                response.id, params.imageScale, params.layers, new Date().toISOString(), params.startTime,
                params.endTime, params.x1, params.x2, params.y1, params.y2
            );
            self._addItem(movie);
        });

        this.hideDialogs();
        this.button.removeClass("working");
        this.building = false;
    },
    
    /**
     * Creates a table that will pop up if too many layers are requested.
     * The table looks approximately like this:
     * <checkbox>Layername
     * <checkbox>Layername
     * ...
     * <okButton>
     */
    createLayerSelectionTable: function (layers) {
        var table, rawName, name, layerNum, checked;
        table = 'Please select at most 3 layers from the choices below for the movie: <br /><br />' +
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
                        '<button id="ok-button" class="ui-button ui-widget ui-state-default ' +
                        'ui-corner-all ui-button-text-only">OK</button>' +
                    '</div>';

        return table;
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
            $("#layer-choice-dialog").dialog("close");
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
     * Opens a dialog and prompts the user to pick only 3 layers.
     */
    promptForLayers: function (viewportInfo, layers) {
        var self = this;
        
        $("#layer-choice-dialog").dialog({
            dialogClass: 'helioviewer-layer-choice-dialog',
            width:     450,
            // Adjust height depending on how much space the text takes up (roughly 20 pixels per 
            // layer name, and a base height of 160)
            height: 160 + layers.length * 20,
            open: function (e) {
                // Put a table of possible layers + check boxes in dialog.
                $('.ui-widget-overlay').hide().fadeIn();
                $(this).html(self.createLayerSelectionTable(layers));
                $("#ok-button").hover(function (e) {
                    $(this).addClass('ui-state-hover').removeClass('ui-state-default');
                },
                function (e) {
                    $(this).removeClass('ui-state-hover').addClass('ui-state-default');
                });
            },
            modal: true,
            title: "Layer selection",
            resizable: false,
            close: function () {
                // Set up event handler for the button
                $('#ok-button').click(function () {
                    self.finalizeLayersAndBuild(viewportInfo);
                });
            }
        });
    }
});
