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
	        //$(document).trigger("message-console-log", [result.error, jGrowlOpts, true, true]);
	        return;
        }
        //if (this.id === result.id && this.difference == 0) {
        //    return;
        //}
        $.extend(this, result);

        // Reference pixel offset at the original JP2 image scale (with respect to top-left origin)
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
        let obstTime = helioviewer.timeControls.getDate();
        // Get the time difference between the two times in seconds
        let delta = Math.abs(imageDate.getTime() - obstTime.getTime()) / 1000;
        // Get the preset threshold in seconds (TODO: Add a user setting)
        let threshold = 10 * 60; // 10 minutes
        // Compare the time difference to the threshold
        // If the time difference is over the threshold, create an alert.
        if (delta > threshold) {
            this._notifyStaleImage(metadata.name, delta);
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
    _hideStaleNotification: function (name) {
        // Create the css class that will be assigned to this notification
        let group = name.replace(" ", "-");
        // Attempt to get the existing notification
        let notification = $('.' + group);
        if (notification.length > 0) {
            notification.find('.jGrowl-close').trigger('click');
        }
    },

    /**
     * Notifies the user that the given image layer is far away from the
     * chosen observation time.
     * @param {string} name Name of the image layer.
     * @param {number} delta Number of seconds away from the observation time.
     */
    _notifyStaleImage: function(name, delta) {
        // Create the notification message
        let message = "The " + name + " layer is " + humanReadableNumSeconds(delta) + " away from your observation time";
        // Create the css class that will be assigned to this notification
        let group = name.replace(" ", "-");
        // Attempt to get the existing notification
        let notification = $('.' + group);
        // If the notification exists already, update the message and make it
        // "flash" by fading out and back in to let the user know it changed.
        if (notification.length > 0) {
            let text = $(notification).find('.jGrowl-message');
            notification.fadeOut(250, () => {
                // Update the tet after the old notification has faded out.
                text.text(message);
                notification.fadeIn(250);
            })
        } else {
            // Else the notification didn't exist already, create a new notification.
            helioviewer.messageConsole.warn(
                message,
                {
                    header: 'Note',
                    group: group,
                    sticky: true
                }
            );
        }
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