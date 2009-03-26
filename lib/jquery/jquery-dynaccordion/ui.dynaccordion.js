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
		this.idQueue = 1;
		
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
		var inputID = (this.options.autoID ? this.idQueue : o.id);

		var arrow = "";
		if (this.options.displayArrows) {
			if (o.open)
				arrow = "<div class='accordion-arrow menu-open'></div>";
			else
				arrow = "<div class='accordion-arrow menu-closed'></div>";
		}

		jQuery('#' + this.element[0].id).append(jQuery('<div class="dynaccordion-section" id="' + inputID + '"><div class="dynaccordion-tab">' + arrow + o.header + '</div><div class="dynaccordion-cell">' + o.cell +'</div></div>'));

		var self = this;
		jQuery('#' + inputID + ' > div.dynaccordion-tab').unbind().click(function() {
			if (self.options.displayArrows) {
				var arrowIcon = jQuery(this).find('.accordion-arrow')[0]; 
				jQuery(arrowIcon).toggleClass('menu-closed');
				jQuery(arrowIcon).toggleClass('menu-open');
			}
			jQuery(this).next().slideToggle('fast');
		});
		
		if (this.options.startClosed && (!o.open)) jQuery('#' + inputID + ' > div.dynaccordion-cell').hide();
		
		this.idQueue++;
	}
});

jQuery.extend(jQuery.ui.dynaccordion, {
	defaults: {
		autoID: false,
		displayArrows: true,
		startClosed: true
	}
});
})(jQuery);
