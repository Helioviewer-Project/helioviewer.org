//Calendar
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
                    var timeOffset = self.timeField.value;
                    
                    //TODO: Factor in time portion of timestamp
                    var date = Date.parse(dateStr);
                    var offset = date.getUTCOffset();
                    //date = date.addHours(offset);
                    
                    //TODO: DYNAMICALLY ADJUST OFFSET
                    date = date.addHours(-4);
                    self.fire('observationDateChange', date);
                }, 500);
                
            }
        });
    },
    
    updateFields: function () {
        // Set text-field to the new date
        //this.dateField.value = this.controller.date.toString("yyyy/MM/dd");
        this.dateField.value = this.controller.date.toYmdUTCString() + ' ' + this.controller.date.toHmUTCString();
        this.timeField.value = this.controller.date.toString("HH:mm:ss");
    }
});
