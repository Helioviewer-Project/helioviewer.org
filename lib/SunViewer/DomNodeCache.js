/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 */
/**
 * @class DomNodeCache This class manages a cache of DOM nodes to improve loading times.
 */
var DomNodeCache = Class.create();

DomNodeCache.prototype = {
	/**
	 * @constructor
	 */
	initialize: function() {
		this.cache = new Array();
	},
	list: function()
	{
		return this.cache;
	},

	/**
	 * @function add				Adds a new DOM Node to the cache.
	 * @param {DOM Node} element	The DOM Node to add.
	 * @param {Number} zoomLevel	The zoom level of the element.
	 * @param {Number} xIndex		The x index of the element.
	 * @param {Number} yIndex		The y index of the element.
	 */
	add: function(element, zoomLevel, xIndex, yIndex) {
		if (!this.cache[zoomLevel]) this.cache[zoomLevel] = [];
		if (!this.cache[zoomLevel][xIndex]) this.cache[zoomLevel][xIndex] = [];
		this.cache[zoomLevel][xIndex][yIndex] = element;
	},

	/**
	 * @method				Returns a DOM Node in the cache.
	 * @param {Number} zoomLevel	The zoom level of the element.
	 * @param {Number} xIndex		The x index of the element.
	 * @param {Number} yIndex		The y index of the element.
	 * @return (DOM Node}		The DOM Node in the cache.
	 */
	get: function(zoomLevel, xIndex, yIndex) {
		if (this.cache[zoomLevel]
		 && this.cache[zoomLevel][xIndex]
		 && this.cache[zoomLevel][xIndex][yIndex]) return this.cache[zoomLevel][xIndex][yIndex];
		return null;
	},

	/**
	 * @method contains			Returns whether the cache contains an element at the given position.
	 * @param {Number} zoomLevel	The zoom level of the element.
	 * @param {Number} xIndex		The x index of the element.
	 * @param {Number} yIndex		The y index of the element.
	 * @return {Boolean}			Whether the cache contains an element at the given position.
	 */
	contains: function(zoomLevel, xIndex, yIndex) {
		return (this.cache[zoomLevel]
			 && this.cache[zoomLevel][xIndex]
			 && this.cache[zoomLevel][xIndex][yIndex] ? true : false);
	},
	
	/**
	 * @method zoomLevels	Returns the number of zoom levels in the cache.
	 * @return {Number}		The number of zoom levels.
	 */
	zoomLevels: function() {
		return this.cache.length;
	},
	
	/**
	 * @method clear	Clears the cache.
	 */
	clear: function() {
		this.cache = new Array();
		return this;
	},
	
	/**
	 * @method remove	Removes all elements from the DOM.
	 */
	remove: function() {
		this.cache.flatten().each(function(element) { if (element && element.parentNode) element.remove(); });
		return this;
	},
	
	/**
	 * @method removeAndClear	Removes all elements from the DOM and clears the cache.
	 */
	removeAndClear: function() {
		this.remove().clear();
	},
	
	/**
	 * @method setStyle		Sets CSS style properties on all elements in the cache.
	 * @param {Hash} style	A Hash of CSS property/value pairs.
	 */
	setStyle: function(style) {
    //Debug.output('setting style', this.cache.flatten().pluck('style').pluck('zIndex'), $H(style).inspect());
		this.cache.flatten().each(function(domNode) { if (domNode && domNode.style) $(domNode).setStyle(style); });
    //Debug.output('style set', this.cache.flatten().pluck('style').pluck('zIndex'), $H(style).inspect());
	}
};

/*
var TileCache = Class.create();

TileCache.prototype = Object.extend(new DomNodeCache(), {
	initialize: function() {
		this.cache = new Array();
	},
	
	remove: function() {
		this.cache.flatten().each(function(element) { if (element && element.domNode) element.domNode.remove(); });
		return this;
	}
});
*/
