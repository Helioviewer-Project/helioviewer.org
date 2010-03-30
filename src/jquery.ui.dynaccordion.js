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
		return this.element;
	},
	
	updateHeader: function (o) {
	    $(this.element).find('#' + o.id + ' > .dynaccordion-tab').text(o.content);
	},
	updateCell: function (o) {
	    $(this.element).find('#' + o.id + ' > .dynaccordion-cell').text(o.content);
	},
	removeSection: function (o) {
	    $(this.element).find('#' + o.id).remove();
	},
	addSection: function (o) {
		var index, id, arrow, header, body, domNode, container, sections, self = this;; 
		
		id        = o.id;
		container = $(this.element);
        sections  = container.find(".dynaccordion-section");

        // Open/closed arrow
		if (this.options.displayArrows) {
			if (o.open)
				arrow = "<div class='accordion-arrow ui-icon ui-icon-triangle-1-s'></div>";
			else
				arrow = "<div class='accordion-arrow ui-icon ui-icon-triangle-1-e'></div>";
		} else {
		    arrow = "";
		}
        
        // Build HTML
        header  = $('<div class="dynaccordion-tab">' + arrow + o.header + '</div>');
        body    = $('<div class="dynaccordion-cell ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom ui-corner-top">' + o.cell +'</div>');
        domNode = $('<div class="dynaccordion-section" id="' + id + '"></div>').append(header).append(body);
           
        // Add new section to appropriate location
        if ((o.index !== "undefined") && (o.index < sections.length)) {
            $(container.find(".dynaccordion-section")[o.index]).before(domNode);
        } else {
            container.append(domNode);
        }
        
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
		$('#' + id + ' > div.dynaccordion-tab').unbind().click(function() {
			if (self.options.displayArrows) {
				var arrowIcon = $(this).find('.accordion-arrow')[0]; 
				$(arrowIcon).toggleClass('ui-icon-triangle-1-s');
				$(arrowIcon).toggleClass('ui-icon-triangle-1-e');
			}
			$(this).next().slideToggle('fast');
		});
		
        // Chose initial view
		if (this.options.startClosed && (!o.open)) {
            $('#' + id + ' > div.dynaccordion-cell').hide();
        };
	}
});
})(jQuery);