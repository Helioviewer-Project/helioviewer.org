/**
 * @fileoverview Contains the class definition for an extended jQuery datepicker component.
 */
/**
 * @author Keith Hughitt keith.hughitt@gmail.com
 * @class Calendar
 * 
 */
/*global Class, UIElement, jQuery, window */
var Calendar = Class.create(UIElement, {
    initialize: function (controller, dateFieldId, timeFieldId) {
        this.controller = controller;
        this.dateField = $(dateFieldId);
        this.timeField = $(timeFieldId);
        
        var self = this;
        this.cal = jQuery("#" + dateFieldId).datepicker({
            buttonImage: 'images/blackGlass/glass_button_calendar.png',
            buttonImageOnly: true,
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
    
    updateFields: function () {
        // Set text-field to the new date
        this.dateField.value = this.controller.date.toYmdUTCString();
        this.timeField.value = this.controller.date.toHmUTCString();
    }
});
