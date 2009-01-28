/**
 * @author <a href="mailto:keith.hughitt@gmail.com">Keith Hughitt</a> 
 * @fileOverview This class extends the base jQuery UI datepicker to provide some basic data-binding and enable the class to work more efficiently with Helioviewer.
 * @see ui.datepicker.js
 * 
 * Syntax: jQuery, Prototype
 */
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
            buttonImage: 'images/calendar_small.png',
            buttonImageOnly: true,
			buttonText: "Select a date.",
            dateFormat: 'yy/mm/dd',
            mandatory: true,
            showOn: 'both',
            yearRange:  '1998:2008',
            onSelect: function (dateStr) {
                window.setTimeout(function () {
                    var time = self.timeField.value;
                    var date = Date.parse(dateStr);
                    
                    //Factor in time portion of timestamp
                    var hours =   parseInt(time.substring(0,2));
                    var minutes = parseInt(time.substring(3,5));
                    var seconds = parseInt(time.substring(6,8));
                    
                    //Convert to UTC
                    var utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, seconds));
                    
                    self.fire('observationDateChange', utcDate);
                }, 500);
                
            }
        });
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
