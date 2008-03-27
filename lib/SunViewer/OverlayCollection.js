/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 * @author Keith Hughitt keith.hughitt@gmail.com
 */

/**
 * @class OverlayCollection     Overlay Collection class.
 * @see 				        Overlay
 */
var OverlayCollection = Class.create();

OverlayCollection.prototype = Object.extend(
  Object.extend($A([]), new SunViewerWidget()), {
  	
	/**
	 * @constructor
	 */
	initialize: function() {
		this.quadTree = [];
		this.quadTree.endsHere = true;
	},
	
	/**
	 * @method createOverlay		Creates a new Overlay and adds it to the collection.
	 * @param {String} html			The HTML code that makes up the overlay.
	 * @param {SunImage} sunImage	The sunImage the overlay belongs to. Set date to null to indicate it belongs to all images.
	 * @param {Hash} options		Available options: position, offset, scaleWhenZooming, scaleFactor, dimensions
	 * @see Overlay
	 */
	createOverlay: function(html, sunImage, options) {
		var overlay = new Overlay(html, sunImage, options);
		this.addOverlay(overlay);

		// Notify listeners
		this.notifyListeners('NewOverlay', overlay);
	},
	
	/**
	 * @method getOverlays		Returns the overlays for a tile at the given x and y index and zoom level.
	 * 							Utilizes a Quad Tree for storing them in sub-quadrants, so that they can be
	 * 							easily retrieved.
	 * @param {Number} xIndex	The x index of the tile.
	 * @param {Number} yIndex	The y index of the tile.
	 * @param {Number} level	The zoom level.
	 * @return {Overlay[]}		An Array of overlays on this tile.
	 */
	getOverlays: function(xIndex, yIndex, level) {
		if (level < 0			// Do not display overlays for zoom levels < 0
		 || xIndex < 0
		 || (xIndex > 0 && xIndex >= Math.max(0, 1 << level))
		 || yIndex < 0
		 || (yIndex > 0 && yIndex >= Math.max(0, 1 << level)))
		    return [];

    	var branch = this.quadTree;

		for(var l = 0; l < level; l++) {
		    //Debug.output("l= " + l);
		    
			if (branch.endsHere) {
				if (branch.length == 0)	return [];
				// Put all the overlays for this quadrant into their corresponding sub-quadrants
				// divide this quadrant into 4 sub-quadrants
				var subQuads = [new branchEnd(),new branchEnd(),new branchEnd(),new branchEnd()];
				// the position and size of the quadrant
				var size = 1 / (1 << l);
				var x = (xIndex >> (level - l)) / (1 << l);
				var y = (yIndex >> (level - l)) / (1 << l);
				// each overlay is put into the corresponding sub-quadrant
				branch.each(function(overlay) {
					var q = overlay.getQuadrant(x,y,size);
					//Debug.output("q= " + q);
					subQuads[q].push(overlay);
				});
				branch.length = 4;
				branch[0] = subQuads[0];
				branch[1] = subQuads[1];
				branch[2] = subQuads[2];
				branch[3] = subQuads[3];
				// now we have sub-quadrants
				branch.endsHere = false;
			}

			// Determine next quadrant
			var quadrant = ((xIndex >> (level - l - 1)) & 1) | ((yIndex >> (level - l - 1) << 1) & 2);

			// Step down the Quad-Tree
			branch = branch[quadrant];
		}

		// Return all the overlays in this quadrant (or its sub-quadrants)
		return branch.flatten();
	},
	
	/**
	 * @method addOverlay		Adds a new overlay to the collection.
	 * 							Also adds it in the correct place in the Quad Tree.
	 * @param {Overlay} overlay	The overlay to add.
	 */
	addOverlay: function(overlay) {
	    //Debug.output("OVERLAYCOLLECTION.addOverlay() ... overlay.x: " + overlay.x + "overlay.y: " + overlay.y);
	    
		this.push(overlay);
		
		var branch = this.quadTree;
		// Until we reach the end
		for(l = 0; !branch.endsHere; l++) {
			// Determine next quadrant
			var quadrant = (overlay.x * (1 << (l + 1)) & 1) | ((overlay.y * (1 << (l + 1)) << 1) & 2);
			Debug.output("quadrant: " + quadrant);
			// Step down the Quad-Tree
			branch = branch[quadrant];
		}
		// Add the overlay to this branch
		branch.push(overlay);
		//Debug.output("BRANCH.length = " + branch.length);
		//console.dir(overlay);

	},
	
	/**
	 * @method addOverlays			Adds a number of overlays to the collection.
	 * @param {Overlay[]} overlays	The overlays to add.
	 * @see OverlayCollection.addOverlays()
	 */
	addOverlays: function(overlays) {
		overlays.each(this.addOverlay.bind(this));
	},
	
	/**
	 * @method clear	Removes all overlays from the collection.
	 */
	clear: function() {
		this.quadTree = new branchEnd();
	}
});

/**
 * @classDescription Helper class for the quadTree.
 * Specifies a branch. Defaults to a tree leaf (endsHere=true).
 */
var branchEnd = Class.create();

branchEnd.prototype = Object.extend([], {
	initialize: function() { this.endsHere=true; } 
});