 /**
 * jQuery Dynamic "Accordion" Plugin
 * By Michael Lynch
 * Code template by Keith Hughitt
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

		jQuery('#' + this.element[0].id).append(jQuery('<div class="dynaccordion-section" id="' + inputID + '"><div class="dynaccordion-tab">' + o.header + '</div><div class="dynaccordion-cell">' + o.cell +'</div></div>'));

		jQuery('#' + inputID + ' > div.dynaccordion-tab').unbind().click(function() {
			jQuery(this).next().slideToggle('fast');
		});
		
		if (this.options.startClosed && (!o.open)) jQuery('#' + inputID + ' > div.dynaccordion-cell').hide();
		
		this.idQueue++;
	}
});

jQuery.extend(jQuery.ui.dynaccordion, {
	defaults: {
		autoID: false,
		startClosed: true
	}
});
})(jQuery);
