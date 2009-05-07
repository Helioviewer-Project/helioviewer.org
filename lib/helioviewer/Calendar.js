/**
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a> 
 * @fileOverview This class extends the base jQuery UI datepicker to provide some basic data-binding and enable the class to work more efficiently with Helioviewer.
 * @see ui.datepicker.js
 * 
 * Syntax: jQuery, Prototype
 */
/*global Class, Calendar, $, UIElement, jQuery, window */
var Calendar = Class.create(UIElement,
	/** @lends Calendar.prototype */
	{
	/**
	 * @description Creates a new Calendar. 
	 * @param {Object} controller Reference to the controller class (Helioviewer).
	 * @param {String} dateFieldId The ID of the date form field associated with the Calendar.
	 * @param {String} timeFieldId The ID of the time form field associated with the Calendar.
	 * @constructs 
	 */ 
    initialize: function (controller, dateFieldId, timeFieldId) {
        this.controller = controller;
        this.dateField = $(dateFieldId);
        this.timeField = $(timeFieldId);
        
        var self = this;
        this.cal = jQuery("#" + dateFieldId).datepicker({
            buttonImage: 'images/blackGlass/calendar_small.png',
            buttonImageOnly: true,
			buttonText: "Select a date.",
            changeYear: true,
            dateFormat: 'yy/mm/dd',
            mandatory: true,
            showOn: 'button',
            yearRange:  '1998:2009',
            onSelect: function (dateStr) {
                window.setTimeout(function () {
                    //self.fire('observationDateChange', dateStr);
                    self.controller.updateDate(dateStr);
                }, 500);
                
            }
        });
        
        // Add tooltip
        jQuery('.ui-datepicker-trigger').attr("title", " - Select an observation date.");
        this.controller.addToolTip('.ui-datepicker-trigger', {yOffset: -125});
        
        // Mouse-over effect
        jQuery('.ui-datepicker-trigger').hover(
            function() {
                jQuery(this).attr("src", "images/blackGlass/calendar_small-hover.png");
            },
            function () {
                jQuery(this).attr("src", "images/blackGlass/calendar_small.png");                
            }
        );
    },
    
	/**
	 * @description Updates the HTML form fields associated with the calendar.
	 */
    updateFields: function () {
        // Set text-field to the new date
        this.dateField.value = this.controller.date.toYmdUTCString();
        this.timeField.value = this.controller.date.toHmUTCString();
    }
});
