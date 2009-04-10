/**
 * @fileOverview Contains the IconPicker class definition.
 * Syntax: Prototype, jQuery 
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*global IconPicker, Class, $, $A, jQuery*/
var IconPicker = Class.create(
	/** @lends IconPicker.prototype */
	{
	/**
	 * @constructs
	 * @description Creates a new IconPicker
	 * @param {String} id The identifier to use for the icon-picker dom-node
	 */
	initialize: function (id) {
		this.id = id;
		
		// Available Icon options
		this.AVAILABLE_ICON_SHAPES = $A(["circle", "square", "diamond"]);
		this.AVAILABLE_ICON_COLORS = $A(["red", "orange", "green", "yellow", "blue", "lightblue"]);
		
		// Keep track of which event-layer is being targeted.
		this.focus = null;
        
        // Don't build until requested
        this.loaded = false;
		
		// Build icon-list
		//this._buildIconList();
	},
	
	
	/**
	 * @description Sets up the list of available icons to chose from
	 */
	_buildIconList: function () {
		var i, closeBtn, menu, self = this;
		menu = jQuery("<div id='" + this.id + "' class='ui-widget ui-widget-content ui-corner-all' style='display: none;'></div>");				
		//menu.append(jQuery('<div id=event-icon-menu-title><span style="vertical-align: middle">Chose an icon:</span></div><div id="event-icon-menu-body">'));
        menu.append(jQuery('<div id=event-icon-menu-title><span style="vertical-align: middle">Chose an icon:</span></div><div id="event-icon-menu-body">'));

		i = 1;
		this.AVAILABLE_ICON_COLORS.each(function (color) {
			self.AVAILABLE_ICON_SHAPES.each(function (shape) {
				var icon = jQuery('<img class="event-icon-menu-icon" src="images/events/small-' + color + "-" + shape + '.png" alt="' + color + '-' + shape + '">');
				icon.click(function () {
					self.focus.updateIcon(this.alt);
					jQuery('#event-icon-menu').fadeOut();
				});
				menu.append(icon);
				if (i % 3 === 0) {
					menu.append(jQuery("<br>"));
				}
				i += 1;
			});			
		});
		
		closeBtn = jQuery('<br><div style="text-align: right"><a class="light" href="#" style="margin-right: 2px;">[Close]</a></div>').click(function () {
			jQuery('#event-icon-menu').fadeOut();
		});
		menu.append(closeBtn);
		menu.append("</div>");
		
		jQuery('body').append(menu);
	},
	
	/**
	 * @description Toggle IconPicker visibility
	 * @param {Object} layer The EventLayer icon picker is associated with.
	 * @param {Object} pos The mouse-click position
	 */
	toggle: function (layer, pos) {
        if (!this.loaded) {
            this._buildIconList();            
            this.loaded = true;
        }
   		this.focus = layer;
		jQuery('#' + this.id).css({'left': pos.left + 16, 'top': pos.top + 16}).slideToggle();

	}
});
