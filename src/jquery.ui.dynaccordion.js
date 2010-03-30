 /**
 * @class
 * @description jQuery Dynamic "Accordion" Plugin
 * @author Michael Lynch
 * @author Keith Hughitt
 *
 * Depends:
 * ui.core.js
 */
(function($) {

$.widget("ui.dynaccordion", {
    options: {
        displayArrows: true,
        startClosed: true
    },
    
	init: function() {
		var options = this.options;	
		return this.element;
	},
	
	updateHeader: function (o) {
		$('#' + this.element[0].id + '> .dynaccordion-section#' + o.id + ' > div.dynaccordion-tab').text(o.content);
	},
	updateCell: function (o) {
		$('#' + this.element[0].id + ' > .dynaccordion-section#' + o.id + ' > div.dynaccordion-cell').text(o.content);
	},
	removeSection: function (o) {
		$('#' + this.element[0].id + ' > .dynaccordion-section#' + o.id).remove();
	},
	addSection: function (o) {
		var inputID = o.id;

        // Open/closed arrow
		var arrow = "";
		if (this.options.displayArrows) {
			if (o.open)
				arrow = "<div class='accordion-arrow ui-icon ui-icon-triangle-1-s'></div>";
			else
				arrow = "<div class='accordion-arrow ui-icon ui-icon-triangle-1-e'></div>";
		}
        
        // Build HTML
        var header = $('<div class="dynaccordion-tab">' + arrow + o.header + '</div>');
        var body   = $('<div class="dynaccordion-cell ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom ui-corner-top">' + o.cell +'</div>');
        var domNode = $('<div class="dynaccordion-section" id="' + inputID + '"></div>').append(header).append(body);
		$('#' + this.element[0].id).append(domNode);
        
        // Mouse-over effects
        header.find(".layer-Head").hover(
            function () {
               $(this).addClass("ui-state-hover-bgonly");
            }, 
	        function () {
               $(this).removeClass("ui-state-hover-bgonly");
	        }
        );

        // Open/Close animation
		var self = this;
		$('#' + inputID + ' > div.dynaccordion-tab').unbind().click(function() {
			if (self.options.displayArrows) {
				var arrowIcon = $(this).find('.accordion-arrow')[0]; 
				$(arrowIcon).toggleClass('ui-icon-triangle-1-s');
				$(arrowIcon).toggleClass('ui-icon-triangle-1-e');
			}
			$(this).next().slideToggle('fast');
		});
		
        // Chose initial view
		if (this.options.startClosed && (!o.open)) {
            $('#' + inputID + ' > div.dynaccordion-cell').hide();
        };
	}
});
})(jQuery);