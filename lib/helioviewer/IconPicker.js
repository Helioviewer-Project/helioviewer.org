/**
 * @fileoverview Contains the IconPicker class.
 */
/**
 * @author Keith Hughitt keith.hughitt@gmail.com
 * @class IconPicker
 * 
 * syntax: Prototype, jQuery
 *
 */
var IconPicker = Class.create({
	/**
	 * @constructor
	 * @param {String} id - The identifier to use for the icon-picker dom-node.
	 */
	initialize: function (id) {
		this.id = id;
		
		// Available Icon options
		this.AVAILABLE_ICON_SHAPES = $A(["circle", "square", "diamond"]);
		this.AVAILABLE_ICON_COLORS = $A(["red", "orange", "green", "yellow", "blue", "lightblue"]);
		
		// Keep track of which event-layer is being targeted.
		this.focus = null;
		
		// Build icon-list
		this._buildIconList();
	},
	
	
	/**
	 * @function
	 * @param {Object} layer
	 */
	_buildIconList: function () {
		var self = this;
		var menu = jQuery("<div id='" + this.id + "' style='display: none;'></div>");				
		menu.append(jQuery('<div id=event-icon-menu-title><span style="vertical-align: middle">Chose an icon:</span></div><div id="event-icon-menu-body">'));

		var i = 1;
		this.AVAILABLE_ICON_COLORS.each(function (color) {
			self.AVAILABLE_ICON_SHAPES.each(function(shape){
				var icon = jQuery('<img class="event-icon-menu-icon" src="images/events/small-' + color + "-" + shape + '.png" alt="' + color + '-' + shape + '">');
				icon.click(function() {
					self.focus.updateIcon(this.alt);
					jQuery('#event-icon-menu').fadeOut();
				});
				menu.append(icon);
				if (i % 3 == 0) {
					menu.append(jQuery("<br>"));
				}
				i++;
			});			
		});
		
		var closeBtn = jQuery('<a class="event-url" href="#" style="margin-right: 2px;">[Close]</a>').click(function(){jQuery('#event-icon-menu').fadeOut()});
		menu.append(jQuery('<br><div style="text-align: right"></div>').append(closeBtn));
		menu.append("</div>");
		
		jQuery('body').append(menu);
	},
	
	toggle: function (layer, pos) {
		this.focus = layer;
		jQuery('#' + this.id).css({'left': pos.left + 16, 'top': pos.top + 16}).slideToggle();
	}
});
