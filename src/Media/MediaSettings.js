/**
 * @author Jaclyn Beck
 * @fileoverview Contains the definition of a class that stores all settings relating to screenshots and movies.
 *                     This class has two jobs: 
 *                     1) store media settings, and
 *                     2) handle generation of the settings dialog that is created when the user clicks the settings button.
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global $, Class, getOS, Shadowbox */
"use strict";
var MediaSettings = Class.extend(
    /** @lends MediaSettings.prototype */
    {
    /**
     * @description Default options that user cannot change without opening media settings. 
     * These are loaded upon class creation.
     * Settings that are not affected by a change in the viewport: timeStep, url, numFrames, frameRate,
     * sharpen, edgeEnhance, movie format, showImgIfGap, emailUser, emailAddress, quality, image format.
     * Settings that ARE affected when the viewport changes: startTime/EndTime, layers, filename.
     * 
     * TimeStep currently sticks with whatever the user picks. If they change it in the viewport,
     * MediaSettings.timeStep is not changed or affected. May need to change this.
     * startTime/endTime are determined by the viewport settings, not the user's. 
     * Layers are pulled from the viewport. Whether they are checked/included or not depends on what the user entered.
     * Filename is changed every time the viewport changes. 
     * 
     * Settings that are stored but not functional yet: frameRate, sharpen, edgeEnhance,
     * image format, showImgIfGap, emailUser, emailAddress, startdate/enddate, filename
     * 
     * Maybe add a setting: "Keep user settings even if change in viewport"?
     */
    defaultOptions: {
        url         : "api/index.php",
        numFrames   : 40,
        frameRate   : 8,
        sharpen     : false,
        edgeEnhance : false,
        format      : {win: "asf", mac: "mov", linux: "mp4"},
        showImgIfGap: true,
        emailUser    : false,
        emailAddress: "",
        quality        : 8,
        filename    : "",
        layers        : null,
        timeStep    : 86400
    },

    /**
     * @constructs
     * @description Loads default options, and creates a set of settings based on what is currently in 
     *              the viewport. Also creates an event handler for the settings button.
     *              Currently customizable options are: numFrames, timeStep, layers (which ones), start date/time, 
     *              end date/time, image width, image height, quality, format, filename, show layers if data gap,
     *              email link, and email address. 
     * @param {Object} controller -- helioviewer
     */
    init: function (controller) {
        var visibleCoords, self;
        $.extend(this, this.defaultOptions);
        this.controller    = controller;
        this.button        = $("#settings-button");
        this.viewport     = this.controller.viewport;
        
        // High-quality video format
        this.hqFormat = this.format[getOS()];
        
        // Have a set of settings ready in case the user never clicks on this button.
        visibleCoords  = this.viewport.getHCViewportPixelCoords(); 
        this.timeStep  = this.controller.timeControls.getTimeIncrement(); 
        
        self = this;
        
        // Refetch the viewport coordinates in case something's changed, refresh settings, and load dialog
        this.button.click(function () {
            visibleCoords = self.controller.viewport.getHCViewportPixelCoords(); 
            self.getSettings(visibleCoords);
            self.initSettingsDialog(self);
        });
    },

    /** 
     * @description Pulls all necessary information from the viewport and time controls so that the user can customize
     *              them if they want to. These are all settings that will change whenever the viewport changes.
     * 
     * Once the information is gathered, it is stored in this object. This method is called by takeScreenshot, 
     * buildMovie, and by clicking the settings button.

     * @param {Array} visibleCoords -- heliocentric top, left, right, and bottom coordinates of either the entire 
     * viewport or a selected region.
     */
    getSettings: function (visibleCoords) {
        var helioviewer = this.controller, vpWidth, vpHeight, maxImgSize, imgWidth, imgHeight;
            
        // startTime is in unix timestamp format in seconds. date.getTime() returns milliseconds
        // so it needs to be divided by 1000.
        this.startTime  = helioviewer.timeControls.getTimestamp() / 1000;

        this.dateString = helioviewer.timeControls.toISOString();
        this.imageScale  = helioviewer.viewport.imageScale;
        
        // reset the filename. It will be built in getImageInformation()
        this.filename = "";
            
        // Get the image width and height
        vpWidth  = visibleCoords.right  - visibleCoords.left;
        vpHeight = visibleCoords.bottom - visibleCoords.top;    

        //maxImgSize = helioviewer.tileLayers.getMaxJP2Dimensions(visibleCoords.left, visibleCoords.top,
        //                                                        vpWidth, vpHeight);
        helioviewer.tileLayers.getMaxDimensions();
        
        // If the image is smaller than the visibleCoords area, then just use the image's size        
        imgWidth  = Math.round(Math.min(vpWidth,  maxImgSize.width));
        imgHeight = Math.round(Math.min(vpHeight, maxImgSize.height));        
        
        // phpvideotoolkit can only use even numbers for image dimensions               
        if (imgWidth % 2 !== 0) {
            imgWidth += 1;
        }
        if (imgHeight % 2 !== 0) {
            imgHeight += 1;
        }

        this.width  = imgWidth;
        this.height = imgHeight;

        this.hcOffset = this.getHCOffset(visibleCoords);
                                     
        // Get the layer information
        this.layerNames = this.getImageInformation(visibleCoords, vpWidth, vpHeight);
        
        // Keep track of which layers are checked (true/false). this.layerNames is modified
        // to hold only those layers marked as "true".  
        this.layers = this.checkLayers();    
    },

    /**
     * @description Finds the jp2 image width/height, relative width/height, image coordinates, 
     *              and hcOffset for each layer, and adds those layers that are visible to an array. Returns the array 
     *              of layers. The filename is also built here from each layer's detector and measurement.
     * @param {Array} visibleCoords -- heliocentric top, left, bottom, and right coordinates of either the viewport 
     *                                 or the selected region
     * @param {int} vpWidth -- width of the visibleCoords region (right-left)
     * @param {int} vpHeight -- height of the visibleCoords region (bottom-top)
     * @return {Array} layers -- array of all visible layers in string format: "obs,inst,det,meas,visible,opacity'
     *                           x'XStart,XEnd,YStart,YEnd,offsetX,offsetY"
     */
    getImageInformation: function (visibleCoords, vpWidth, vpHeight) {
        var self, layers = [], helioviewer, layerNames = [], imgCoords = [];
        helioviewer = this.controller;

        self = this;
        
        // Only add visible tile layers to the array.
        $.each(helioviewer.tileLayers, function () {
            // "this" represents the tilelayer object
            if (this.visible) {
                var left, top, right, bottom, width, height, sizeOffset, jp2Width, jp2Height,
                    xRange, yRange, relWidth, relHeight, layer = [];
                
                // Making some aliases for clarity
                jp2Width     = this.width;
                jp2Height     = this.height;
                sizeOffset     = this.width / this.relWidth;
                relWidth     = jp2Width  / sizeOffset;
                relHeight     = jp2Height / sizeOffset;

                // Convert viewport heliocentric coordinates into image coordinates
                left     = Math.floor(visibleCoords.left + relWidth  / 2);
                top     = Math.floor(visibleCoords.top  + relHeight / 2);
                right     = Math.floor(visibleCoords.right  + relWidth  / 2);
                bottom     = Math.floor(visibleCoords.bottom + relHeight / 2);
                
                /* 
                 * Need to adjust for when 1 px on the jp2 image is not the same as 1 px on the viewport image.
                 * Example: "left" is the pixel coordinate relative to the image in the viewport, which may 
                 * be twice as large  as its corresponding jp2 image. The sizeOffset for this image would be 
                 * (image width)/(2x image width) or 0.5, so to get the pixel coordinate relative to the jp2 image,
                 * multiply "left" by .5, the sizeOffset. zoomOffset cannot be used here because images like LASCO 
                 * C2 and C3 have different sizeOffsets than EIT images at the same zoomLevel.
                 * If "left" or "top" is less than 0, just use 0.
                 */
                left     = Math.max(left * sizeOffset, 0);
                top     = Math.max(top  * sizeOffset, 0);
                right     = right  * sizeOffset;
                bottom     = bottom * sizeOffset;
        
                // If the calculated width is greater than the possible width, just use the possible width.
                width  = Math.min((right - left), jp2Width - left);
                height = Math.min((bottom - top), jp2Height - top);

                // Round values off to the nearest integer, since you cannot have partial-pixels as a measurement
                width     = Math.round(width);
                height     = Math.round(height);
                left     = Math.round(left);
                top     = Math.round(top);
                
                // If the captured image just shows the black circular region of LASCO C2 
                // or C3, don't even use that layer.
                // 216 is the radius of the transparent circle in a C2 image.        
                if (this.detector.toString() === "C2" &&
                    this.insideCircle(216, jp2Width / 2, left, top, width, height)) { 
                    width = -1;
                }
                // 104 is the radius of the transparent circle in a C3 image.
                else if (this.detector.toString() === "C3" &&
                         this.insideCircle(104, jp2Width / 2, left, top, width, height)) { 
                    width = -1;
                }
                            
                // If at least some of the image is currently visible, add that layer
                if (width > 0 && height > 0 && top < this.height && left < this.width) {
                    xRange = {
                        start:     left,
                        size:     width
                    };
                    
                    yRange = {
                        start:     top,
                        size:     height
                    };
                    
                    // The -2 is there because 1 is added to odd-numbered dimensions for phpvideotoolkit, 
                    // and if the dimensions are *.5, they are rounded up, making a difference of 2.
                    // If this layer is the biggest layer, calculate the new image coords based around this layer.
                    if (relWidth >= self.width - 2 || relHeight >= self.height - 2) {
                        imgCoords = self.getImgCoords(xRange, yRange, jp2Width, jp2Height, relWidth, relHeight);
                    }

                    self.filename += this.detector.toString() + "_" + this.measurement.toString() + "_";

                    // Don't make a string out of the layer yet, because more work needs to be done on it and 
                    // making a string and breaking it apart a couple lines further down is unnecessary.
                    layer = {
                        name     : this.toString(),
                        xRange     : xRange,
                        yRange     : yRange,
                        relWidth : relWidth,
                        relHeight: relHeight,
                        jp2Width : jp2Width,
                        jp2Height: jp2Height
                    };

                    layers.push(layer);
                }
            }
        });

        // Filename should now be: "det1_meas1_det2_meas2_zimageScale_widthxheight"
        self.filename += "z" + self.imageScale + "_" + self.width + "x" + self.height;

        // Cannot do this function until the largest layer is found, so let the above loop finish and start a new one.
        // This loop finds each layer's hcOffset and then pushes all the layer info into a string.
        $.each(layers, function (i, l) {
            var distX = 0, distY = 0;
            /* 
             * If the actual image is smaller than the original extracted region, need to adjust the hcOffset 
             * to reflect this.
             * The hcOffset = (distance from center to top left corner). The top left corner may be outside the 
             * real jp2 image's top left corner.
             * To calculate the distance: Assume the top left corner of the jp2 image, relative to the center, 
             * is relWidth / 2. Next, we know that the center is a certain percent of the whole visibleCoords 
             * width/height, so let's say it's 50% to the right and 50% to the bottom. Assume the actual image 
             * width has the same proportions, but is just smaller. Therefore, the center is still 50% to the
             * right and 50% to the bottom. So to find the distance between the center of the image and the 
             * top left corner, multiply the image width/height * 50%. 
             * 
             * Next, adjust for the part of the jp2 image that already has the center in it. You don't want to pad
             * the whole distance between top left corner and center, or the jp2 image's top left corner will be 
             * where the center is. So subtract relWidth / 2 from the distance to get the final, adjusted hcOffset.
             * 
             * If the xRange.start is NOT 0, or the yRange.start is NOT 0, this adjustment doesn't even apply 
             * because the upper-left corner is already inside the image, not somewhere outside it, so the 
             * hcOffset is calculated normally.
             */    
            if (l.xRange.start === 0) {
                distX = Math.floor(imgCoords.left + l.relWidth / 2);
            }    
            
            if (l.yRange.start === 0) {
                distY = Math.floor(imgCoords.top + l.relHeight / 2);
            }            
            
            layerNames.push(l.name + "x" + l.xRange.start + "," + l.xRange.size + "," + l.yRange.start + "," + 
                            l.yRange.size + "," + distX + "," + distY);
        });

        return layerNames;    
    },
        
    /**
     * How far away the heliocenter is from the top left corner of the viewport, and in which direction.
     * Note that the convert command reverses "+" and "-" for the x-direction, 
     * so "+" means push the image to the left, "-" means push it to the right.
     * A +x means the heliocenter (0,0) is left of the top-left corner, and a +y means
     * the heliocenter is above the top-left corner.
     */    
    getHCOffset: function (visibleCoords) {
        var offset = {
            x: visibleCoords.left,
            y: visibleCoords.top
        };
            
        return offset;
    },

    /**
     * @description Layers have to stay in the order they appear in the viewport. 
     * This function checks to see if any layers that exist in this.layerNames are 
     * marked as "false" in this.layers. If they are, save them as "false". Otherwise,
     * save the layer as "true". 
     */
    checkLayers: function () {
        var matched, newLayers, baseLayers, base,
            layers = [],
            i = 0,
            self = this;
        
        if (!this.layers) {
            $.each(this.layerNames, function (i, layer) {
                
                // Get just the "obs,inst,det,meas" part of the string.
                var name = layer.split(",").slice(0, 4).join(",");
                
                // Set its checked value to true.
                i += 1;
                layers[i] = name + " true";
            });

            return layers;
        }    
        
        else {
            matched = false;
            newLayers = [];
            baseLayers = [];
            base = "";

            // Get just the "obs,inst,det,meas" part of each string. We don't want to compare
            // the whole string because opacity, xrange, etc might differ but the layers are 
            // still the same. 
            $.each(this.layerNames, function (i, l) {
                i += 1;
                baseLayers[i] = l.split(",").slice(0, 4).join(",");
            });

            // Check to see if each layer from baselayers has a pre-set checked value in layers.
            // If does, save that value. If not, set 'checked' to true. 
            $.each(baseLayers, function (i, bl) {
                var base = bl.split(",").slice(0, 4).join(",");
                
                // If it exists in layers and is set to false, add it as false to newLayers
                matched = $.grep(self.layers, function (item, i) {
                    if (item === (base + " false")) {
                        return true;
                    }
                });
                
                if (matched.length > 0) {
                    layers[i] = base + " false";
                }
                
                // Otherwise set it to true
                else {
                    layers[i] = base + " true";
                    newLayers.push(self.layerNames[i]);
                }
            });
            this.layerNames = newLayers;
        }    
        return layers;
    },
    
    /**
     * @description Finds the image coordinates of the biggest layer in the set, since all other layers will
     *                 be padded according to the biggest layer's coordinates. 
     *                 This is done because in cases where the user selects a region that is larger than the actual
     *                 image, the image willcrop by centering around the actual image. See <picture> 
     *                 for a more detailed explanation.
     * @param {Array} xRange -- xRange of biggest layer. [start, size]
     * @param {Array} yRange -- yRange of biggest layer. [start, size]
     * @param {int} jp2Width -- width of the jp2 image
     * @param {int} jp2Height -- height of the jp2 image
     * @param {int} relWidth -- relative width of the jp2 image
     * @param {int} relHeight -- relative height of the jp2 image
     */    
    getImgCoords: function (xRange, yRange, jp2Width, jp2Height, relWidth, relHeight) {
        var relXSize, relXStart, relYSize, relYStart,
            imgCoords = [], 
            xStart    = xRange.start,
            xSize     = xRange.size,
            yStart    = yRange.start,
            ySize     = yRange.size;
            
        imgCoords = {
            left   : 0,
            top    : 0,
            right  : 0,
            bottom : 0
        };
        
        // If the image starts at 0, the right side of the image is either inside the jp2 image or its border.
        // Get the image coordinates starting with the right side and going to the left.
        // See <picture>. 
        if (xStart === 0) {
            relXSize = xSize * relWidth / jp2Width;
            imgCoords.right = relXSize - relWidth / 2;
            imgCoords.left     = imgCoords.right - this.width;
        }
        // Otherwise, do the opposite, start on the left side and go toward the right.
        else {
            relXStart = xStart * relWidth / jp2Width;
            imgCoords.left = relXStart - relWidth / 2;
            imgCoords.right = imgCoords.left + this.width;
        }
        // Same with the top and bottom.
        if (yStart === 0) {
            relYSize = ySize * relHeight / jp2Height; 
            imgCoords.bottom = relYSize - relHeight / 2;
            imgCoords.top = imgCoords.bottom - this.height;
        }
        else {
            relYStart = yStart * relHeight / jp2Height;
            imgCoords.top = relYStart - relHeight / 2;
            imgCoords.bottom = imgCoords.top + this.height;
        }        

        return imgCoords;
    },
    
    /**
     * @description Passes information to settings.php so that it can print out the html markup needed for the form.
     * When done, it passes the markup to printContent to open Shadowbox.
     * @param {Object} self
     */
    initSettingsDialog: function (self) {
        var params, callback, startTime = self.startTime, endTime = new Date();

        // setTime() takes milliseconds, so multiply answer * 1000.
        endTime.setTime((startTime + self.numFrames * self.timeStep) * 1000);
        self.endDateString = endTime.toISOString();
        
        callback = function (contents) {
            self.printContent(self, contents);
        };
        
        params = {
            startDate    : self.dateString,
            endDate        : self.endDateString,
            hqFormat    : self.hqFormat,
            width        : self.width,
            height        : self.height,
            layers        : self.layers.join("/"),
            timeStep    : self.timeStep,    
            quality        : self.quality,
            numFrames    : self.numFrames,
            showImgIfGap: self.showImgIfGap,
            emailUser    : self.emailUser,
            emailAddress: self.emailAddress,
            filename    : self.filename
        };
        
        $.post('dialogs/settings.php', params, callback, "json");
    },
    
    /**
     * @description Opens shadowbox and displays the html markup sent to it. Shadowbox then runs an event 
     * handler for when the 'submit' button is pushed. It grabs all of the values from the input fields in 
     * the form and sends them off to buildMovie.
     * 
     * @TODO This is just a rough idea of how it should look, but mostly functional. The UI needs work.
     * @param {Object} contents -- html markup generated from dialogs/settings.php
     */
    printContent: function (self, contents) {
        var email_field_visible, send_email, layers, startDate, startTime, userSettings = [];
        
        // Width and heights are not good right now, need to be adjusted to look better.
        Shadowbox.open({
            player    : "html",
            width    : 430,
            height    : 263,
            content    : contents,
        
            options:    {
                // "enableKeys : false" allows the user to type things into fields in Shadowbox. (Makes no sense).
                enableKeys: false,
                onFinish: function () {
                    // Turn the divs into tabs
                    $("#select-options-tabs").tabs({ selected: 0 });
                    
                    /* 
                     * The entire form is hidden until the tabs have been activated to prevent
                     * a flash of unstyled content. Unhide it now.
                     */
                    $("#shadowbox-form")[0].style.display = "";
                    
                    // $('#emailLink')[0].checked is the same as $('emailLink').checked
                    send_email = $('#emailLink');    
                    email_field_visible = send_email[0].checked;

                    // Toggles whether the "email address" field is visible                    
                    send_email.click(function () {
                        email_field_visible = !email_field_visible;

                        if (email_field_visible) {
                            $("#email-field")[0].style.display = "";
                        }
                        
                        else {
                            $("#email-field")[0].style.display = "none";
                        }
                    });
                    
                    // Clicking the submit button gathers all information from all fields and closes shadowbox.
                    $('#submit-options-button').click(function () {
                        self.layers = [];
                        
                        layers = $('input[name=layers]');
                        $.each(layers, function () {
                            self.layers.push(this.value + " " + this.checked);
                        });
                        
                        userSettings = {
                            numFrames     : $('#numFrames').val(),
                            timeStep     : $('#timeStep').val(),
                            
                            startDate     : $('#startDate').val(),
                            startTime     : $('#startTime').val(),
                            endDate          : $('#endDate').val(),
                            endTime          : $('#endTime').val(),
                            
                            width         : $('#width').val(),
                            height         : $('#height').val(),
                            
                            quality     : $('#quality').val(),
                            hqFormat     : $('#hqFormat').val(), 

                            filename     : $('#filename').val(),
                            
                            showImgIfGap: $('#dataGaps')[0].checked,
                            emailUser    : $('#emailLink')[0].checked,
                            emailAddress: $('#emailAddress').val()
                        };

                        // Load all the settings into this object.
                        $.extend(self, userSettings);
                        
                        Shadowbox.close();
                    }); 
                }
            }
        });    
    },

    /**
     * @description Opens shadowbox and displays the error message and an ok button.
     * @param {Object} message -- string containing message, can also have html markup
     */
    shadowboxWarn: function (message) {
        Shadowbox.open({
            options:    {
                onFinish: function () {
                    $('#ok-button').click(function () {
                        Shadowbox.close();                        
                    });
                }            
            },
            player:    "html",
            width:    400,
            height:    170,
            content:    '<div id="shadowbox-form" class="ui-widget-content ui-corner-all ui-helper-clearfix" ' + 
                        'style="margin: 10px; padding: 20px; font-size: 12pt;">' + message + '<br /><br />' + 
                        '<div id="buttons" style="text-align: left; float: right;">' +
                        '<button id="ok-button" class="ui-state-default ui-corner-all">OK</button>' +
                        '</div>' + 
                        '</div>'
        });        
    }
});