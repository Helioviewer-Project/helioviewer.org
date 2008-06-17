//Calendar
var Calendar = Class.create(UIElement, {
    initialize:function (id) {
        var self = this;
        this.cal = jQuery("#date").datepicker({
            buttonImage: 'images/blackGlass/glass_button_calendar.png',
            buttonImageOnly: true,
            dateFormat: 'yy/mm/dd',
            showOn: 'both',
            yearRange:  '1998:2008',
            onSelect: function (date) {
                 self.fire('observationDateChange', Date.parse(date));
            }
        })
    }
});
