/**
 * @fileOverview JP2 Image class
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $ */
"use strict";
var JP2Image = Class.extend(
    /** @lends JP2Image.prototype */
    {

    /**
     * @constructs
     */
    init: function (hierarchy, sourceId, date, difference, onChange) {
        this.hierarchy   = hierarchy;
        this.sourceId    = sourceId;
        this.requestDate = date;
        this.difference  = difference;
        this._onChange   = onChange;

        this._requestImage();
    },

    /**
     * Loads the closest image in time to that requested
     */
    _requestImage: function () {
        var params, dataType, source_id;

        var switchSources = false;
        if(outputType == 'minimal'){
            switchSources = true;
        }

        params = {
            action:   'getClosestImage',
            sourceId: this.sourceId,
            date:     this.requestDate.toISOString(),
            difference:this.difference,
            switchSources:switchSources
        };
        $.get(Helioviewer.api, params, $.proxy(this._onImageLoad, this), Helioviewer.dataType);
    },

    /**
     * Changes image data source
     */
    updateDataSource: function (hierarchy, sourceId, difference) {
        this.hierarchy = hierarchy;
        this.sourceId  = sourceId;
        this.difference= difference;

        this._requestImage();
    },

    /**
     * Updates time and loads closest match
     */
    updateTime: function (requestDate) {
        this.requestDate = requestDate;
        this._requestImage();
    },

    /**
     * Checks to see if image has been changed and calls event-handler passed in during initialization
     * if a new image should be displayed.
     *
     * The values for offsetX and offsetY reflect the x and y coordinates with the origin
     * at the bottom-left corner of the image, not the top-left corner.
     */
    _onImageLoad: function (result) {
        // We load the image closest to the observation time, which may or
        // may not be close to that time.
        this._notifyIfStaleImage(result);
        // Only load image if it is different form what is currently displayed
        if(result.error){
            var jGrowlOpts = {
                sticky: true,
                header: "Just now"
            };
            return;
        }
        //if (this.id === result.id && this.difference == 0) {
        //    return;
        //}
        $.extend(this, result);

        // Reference pixel offset at the original JP2 image scale (with respect to top-left origin)
        // This formula below computes the coordinate of the reference pixel relative to the center of the image.
        // This means if we consider X to be the x position of the center of the image.
        // Then offsetX is the coordinate of the reference pixel in pixels.
        // Similarly offsetY is the coordinate in pixels. The negative sign is needed to account for the direction change.
        // in FITS, the value of Y increases upwards. In web coordinates, the value of Y increases downwards.
        // So the - sign is needed to set the direction to be upwards.
        this.offsetX =   parseFloat((this.refPixelX - (this.width  / 2)).toPrecision(8));
        this.offsetY = - parseFloat((this.refPixelY - (this.height / 2)).toPrecision(8));

        this._onChange();
    },

    /**
     * Compares the image metadata's timestamp to the current observation time
     * and alerts the user if the distance is larger than a predefined
     * threshold.
     * @param {getClosestImageResponse} metadata
     */
    _notifyIfStaleImage: function (metadata) {
        // Get the image's timestamp and the current observation time
        let imageDate = Date.parseUTCDate(metadata.date);
        let obstTime = helioviewerWebClient.timeControls.getDate();
        // Get the time difference between the two times in seconds
        let delta = Math.abs(imageDate.getTime() - obstTime.getTime()) / 1000;
        // Get the preset threshold in seconds
        // Default to 21600 (6 hours) if the value isn't present in the configuration
        let threshold = Helioviewer.serverSettings["obstime_alert_dt"] ?? 21600;
        // Compare the time difference to the threshold
        // If the time difference is over the threshold, create an alert.
        if (delta >= threshold) {
            this._notifyStaleImage(metadata.name, delta, metadata.date);
        } else {
            // If the newest image isn't stale, but the notification is showing
            // then it should be closed
            this._hideStaleNotification(metadata.name);
        }
    },

    /**
     * This will close the "Stale Image" notification for the given image layer.
     * @param {string} name Name of the image layer.
     */
    _hideStaleNotification: async function (name) {
        // Attempt to get the existing notification
        let notification = this._notification ? await this._notification : null;
        if (notification) {
            notification.find('.jGrowl-close').trigger('click');
        }
    },

    /**
     * Notifies the user that the given image layer is far away from the
     * chosen observation time.
     * @param {string} name Name of the image layer.
     * @param {number} delta Number of seconds away from the observation time.
     */
    _notifyStaleImage: async function(name, delta, closestImageDate) {
        // Attempt to get the existing notification before continuing
        // Without this, the code could run multiple times and show many
        // notifications for the same layer.
        let notification = this._notification ? await this._notification : null;

        // This promise resolves to the jgrowl message in the DOM that is
        // associated with this notification.
        this._notification = new Promise(async (resolve) => {
            // Create the notification message
            let message = "<span style='cursor:pointer;'>The " + name + " layer is " + humanReadableNumSeconds(delta) + " away from your observation time. <br/> Click this message to go to newest image. </span>";
            // Create the css class that will be assigned to this notification
            let group = name.replace(" ", "-");
            // If the notification exists already and its on screen, then
            // re-use it.
            if (notification && notification.is(":visible")) {
                let text = $(notification).find('.jGrowl-message');
                notification.stop().fadeOut(250, () => {
                    // Update the tet after the old notification has faded out.
                    text.text(message);
                    notification.fadeIn(250);
                    // Return the notification instance
                })
                resolve(notification);
            } else {
                Helioviewer.messageConsole.warn(
                    message,
                    {
                        header: 'Note',
                        group: group,
                        sticky: true,
                        // Return the notification instance
                        afterOpen: function (msg) {
                            // Remove any other duplicate notifications
                            $("." + group).not(msg).remove();
                            resolve(msg);
                        }, 
                        click: (e, m, o) => {
                            return helioviewerWebClient.timeControls.setDate(Date.parseUTCDate(closestImageDate)) && true;
                        }
                    }
                );
            }
        });
    },

    getLayerName: function () {
        var layerName = '';
        $.each( this.hierarchy, function (uiOrder, obj) {
            layerName += obj['name'] + ',';
        });
        return layerName.substring(0, layerName.length-1);
    },

    getSourceId: function () {
        return this.sourceId;
    }
});
