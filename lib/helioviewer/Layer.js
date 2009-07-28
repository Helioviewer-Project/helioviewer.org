/**
 * @fileOverview "Abstract" Layer class.
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 *
 * syntax: prototype, jQuery ()
 */
/*global Layer, Class, Element, $ */
var Layer = Class.create(
	/** @lends Layer.prototype */
	{
	maxZoomLevel: 20, // ZoomLevel where FullSize = 1px
	minZoomLevel: 10,
	visible: true,

	/**
	 * @constructs
	 * @description Creates a new Layer
	 * @param {Object} viewport Viewport to place the layer in
	 * <br>
	 * <br><div style='font-size:16px'>Options:</div><br>
	 * <div style='margin-left:15px'>
	 * 		<b>maxZoomLevel</b>	-  Maximum zoom level supported by the layer<br>
	 *      <b>minZoomLevel</b>	- Minimum zoom level supported by the layer<br>
	 *		<b>visible</b> - The default layer visibility<br>
	 * </div>
	 */
	initialize: function (viewport) {
		this.viewport = viewport;
		this.domNode = $(viewport.movingContainer.appendChild(new Element('div')));
		this.viewport.addObserver('move', this.viewportMove.bind(this));
		this.id = 'layer' + Math.floor(Math.random() * 100000 + 1);
	},

	/**
	 * @description Adjust the Layer's z-index 
	 * @param {Object} val Z-index to use
	 */
	setZIndex: function (val) {
		this.domNode.setStyle({ zIndex: val });
	},

	/**
	 * @description Sets the Layer's visibility
	 * @param {Boolean} visible Hide/Show layer 
	 * @returns {Boolean} Returns new setting
	 */
	setVisibility: function (visible) {
		this.visible = visible;
		this.domNode.setStyle({ visibility: (visible ? 'visible' : 'hidden') });
		return this.visible;
	},

	/**
	 * @description Toggle layer visibility
	 */
	toggleVisibility: function () {
		return this.setVisibility(!this.visible);
	}
});