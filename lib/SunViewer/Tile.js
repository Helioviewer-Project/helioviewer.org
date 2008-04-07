/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 * @author Keith Hughitt keith.hughitt@gmail.com
 */

/**
 * @class Tile Represents one tile in the tile container.
 */
 /*global Class, $H, Element */
var Tile = Class.create();

Tile.prototype = {
	// Default options
	defaultOptions: $H({
	}),
	
	/**
	 * @constructor
	 * @param {TileContainer} tileContainer The corresponding TileContainer object.
	 * @param {Hash} options				Available options: xIndex, yIndex, posx, posy, qx, qy
	 */
	initialize: function (tileContainer, options) {
		this.tileContainer = tileContainer;
		this.layers = [];

		Object.extend(this, this.defaultOptions.toObject());
		Object.extend(this, options);
		
		var tile = new Element('div', {'class': 'tile'});
		tile.setStyle({
		    width: this.tileContainer.tileSize + 'px',
		    height: this.tileContainer.tileSize + 'px'
		});
		this.domNode = this.tileContainer.domNode.appendChild(tile);
	},

	/**
	 * @method assignLayers	(Re-)assign the complete tile (all layers).
	 */
	assignLayers: function () {
		this.position();
		this.tileContainer.assignTile(this);
		
		return this;
	},
	
	/**
	 * @method assignLayer							(Re-)assign exactly one layer and leave others untouched.
	 * @param {TileLayerProvider} tileLayerProvider	The TileLayerProvider object that provides the layer.
	 */
	assignLayer: function (tileLayerProvider) {
		tileLayerProvider.addTileLayerCached(this);
		this.position();
		return this;
	},
	
	/**
	 * @method position				Position the tile (or another object) depending on its posx/posy properties.
	 * @param {DOM Node} domNode	If set, another element is positioned as if it was this tile. Useful for
	 * 								positioning another element and then replacing the current one with it.
	 */
	position: function (domNode) {
		if (!domNode) {
		    domNode = this.domNode;
		}
		if (domNode) {
			domNode.setStyle({ left: this.posx + 'px', top: this.posy + 'px' });
		}
		return this;
	}
};
