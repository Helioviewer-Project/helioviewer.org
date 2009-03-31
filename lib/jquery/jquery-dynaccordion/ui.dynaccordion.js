 /**
 * @class
 * @description jQuery Dynamic "Accordion" Plugin
 * @author Michael Lynch
 * @author Keith Hughitt
 *
 * Depends:
 * ui.core.js
 */
(function(jQuery) {

jQuery.widget("ui.dynaccordion", {
	init: function() {
		var options = this.options;
		
		return this.element;
	},
	
	updateHeader: function (o) {
		jQuery('#' + this.element[0].id + '> .dynaccordion-section#' + o.id + ' > div.dynaccordion-tab').text(o.content);
	},
	updateCell: function (o) {
		jQuery('#' + this.element[0].id + ' > .dynaccordion-section#' + o.id + ' > div.dynaccordion-cell').text(o.content);
	},
	removeSection: function (o) {
		jQuery('#' + this.element[0].id + ' > .dynaccordion-section#' + o.id).remove();
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
        var header = jQuery('<div class="dynaccordion-tab">' + arrow + o.header + '</div>');
        var body   = jQuery('<div class="dynaccordion-cell ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom ui-corner-top">' + o.cell +'</div>');
        var domNode = jQuery('<div class="dynaccordion-section" id="' + inputID + '"></div>').append(header).append(body);
		jQuery('#' + this.element[0].id).append(domNode);
        
        // Mouse-over effects
        header.find(".layer-Head").hover(
            function () {
               jQuery(this).addClass("ui-state-hover-bgonly");
            }, 
	        function () {
               jQuery(this).removeClass("ui-state-hover-bgonly");
	        }
        );

        // Open/Close animation
		var self = this;
		jQuery('#' + inputID + ' > div.dynaccordion-tab').unbind().click(function() {
			if (self.options.displayArrows) {
				var arrowIcon = jQuery(this).find('.accordion-arrow')[0]; 
				jQuery(arrowIcon).toggleClass('ui-icon-triangle-1-s');
				jQuery(arrowIcon).toggleClass('ui-icon-triangle-1-e');
			}
			jQuery(this).next().slideToggle('fast');
		});
		
        // Chose initial view
		if (this.options.startClosed && (!o.open)) {
            jQuery('#' + inputID + ' > div.dynaccordion-cell').hide();
        };
	}
});

jQuery.extend(jQuery.ui.dynaccordion, {
	defaults: {
		displayArrows: true,
		startClosed: true
	}
});
})(jQuery);
