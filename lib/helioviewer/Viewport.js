/*global Class, Object, $, UIElement, ViewportHandlers, Builder */
var Viewport = Class.create(UIElement, {
    defaultOptions: {
        zoomLevel: 0,
   		headerId: 'middle-col-header',
   		footerId: 'footer',
   		prefetch: 256 //Pre-fetch any tiles that fall within this many pixels outside the physical viewport
    },
    isMoving: false,
    currentPosition: { x: 0, y: 0 },
    containerPosition: { x: 0, y: 0 },
    dimensions: { width: 0, height: 0 },
    
    initialize: function (controller, options /*elementId, controller, zoomLevel, outputReceiver, layers*/) {
        Object.extend(this, this.defaultOptions);
        Object.extend(this, options);

        this.domNode =   $(this.id);
        this.outerNode = $(this.id + '-container-outer');
        this.controller = controller;
        this.layers = [];
        this.ViewportHandlers = new ViewportHandlers(this);
        
        //combined height of the header and footer in pixels (used for resizing viewport vertically)
        this.headerAndFooterHeight = $(this.headerId).getDimensions().height + $(this.footerId).getDimensions().height + 4;

        var movingContainer = Builder.node('div', {className: 'movingContainer'});
        this.movingContainer = $(this.domNode.appendChild(movingContainer));
        //TEST
        Event.observe(this.movingContainer, 'contextmenu', function (e) {Event.stop(e);});
        Event.observe(this.movingContainer, 'dblclick', function (e) {
            if (e.isLeftClick()) {
                Debug.output("double left-click!");
            } else {
                Debug.output("double right-click!");
            }
            
        });
        this.resize();
    },
    
    addLayer: function (layer) {
        this.layers.push(layer);
        //layer.setZIndex(this.layers.length - 1);
    },
    
    removeLayer: function (layer) {
    	//layer.removeTiles();
    	layer.domNode.remove();
    	this.layers = this.layers.without(layer);
    },
    
    output: function (text) {
        if (this.outputReceiver && this.outputReceiver.output) {
        	this.outputReceiver.output(text);
        }
    },
    
    center: function () {
        if (this.layers.length === 0 || !this.layers[0].getFullSize) {
        	return this;
        }
        this.moveTo(0, 0);
        return this;
    },
    
    moveTo: function (x, y) {
        this.currentPosition = {
            x: x,
            y: y
        };
        //this.moveContainer();
		//this.output(x + ',' + y);
        this.fire('move', { x: x, y: y });
    },

    moveBy: function (x, y) {
        this.currentPosition = {
            x: this.startMovingPosition.x + x,
            y: this.startMovingPosition.y + y
        };
        //this.moveTo(this.startMovingPosition.x + x, this.startMovingPosition.y + y);    
        this.moveContainerBy(-x, -y);
        this.fire('move', { x: this.currentPosition.x, y: this.currentPosition.y });
    },
    
    startMoving: function () {
        this.startMovingPosition = this.currentPosition;
        this.containerStartMovingPosition = this.containerPosition;
    },
    
    endMoving: function () {
            
    },
    
    // "virtual" container position necessary so we don't have to move it when zooming, which would cause a strange "tile jumping" effect    
    getContainerOffset: function () {
        return {
            x: Math.round(this.dimensions.width / 2 - this.currentPosition.x) - this.containerPosition.x - Math.round(this.prefetch / 2),
            y: Math.round(this.dimensions.height / 2 - this.currentPosition.y) - this.containerPosition.y - Math.round(this.prefetch / 2)
        };    
    },

    getContainerRelativeCoordinates: function (x, y) {
        var offset = this.getContainerOffset();
        return {
            x: x + offset.x,
            y: y + offset.y
        };
    },
    
    moveContainerBy: function (x, y) {
        this.containerPosition = {
            x: this.containerStartMovingPosition.x + x,
            y: this.containerStartMovingPosition.y + y
        };
        this.movingContainer.setStyle({
            left: this.containerPosition.x + 'px',
            top:    this.containerPosition.y + 'px'    
        });
    },
    
//    setDate: function(date) {
//        this.layers.each(function(layer) { layer.setDate(date); } );
//    },

    zoomToAt: function (zoomLevel, zoomPointCoordinates) {
        // multiplicator
        var m = Math.pow(2, -zoomLevel + this.zoomLevel);
        // zoom
        this.zoomLevel = zoomLevel;
        
        // remove the tiles
        //this.clearLayers();
        // move the viewport so that its center is on the same point as before
        var newZoomPointCoordinates = {
            x: m * zoomPointCoordinates.x,
            y: m * zoomPointCoordinates.y
        };
        this.moveTo(newZoomPointCoordinates.x, newZoomPointCoordinates.y);
        
        // reset the layers
        this.resetLayers();
    },
    
    zoomInAt: function (zoomPointCoordinates) {
        this.zoomToAt(this.zoomLevel - 1, zoomPointCoordinates);
    },
    
    zoomOutAt: function (zoomPointCoordinates) {
        this.zoomToAt(this.zoomLevel + 1, zoomPointCoordinates);
    },
    
    zoomTo: function (zoomLevel) {
        //temporarily hard-coded for testing purposes (06-10-08)...
        var LASCO_MIN_ZOOMLEVEL = 12;
        Debug.output("zoomLevel: " + zoomLevel);
        if (zoomLevel < LASCO_MIN_ZOOMLEVEL) {
            this.fire('info', "There is no more LASCO data available at this zoom-level.");
        }
        this.zoomToAt(zoomLevel, this.currentPosition);
    },
    
    zoomIn: function () {
        this.zoomTo(this.zoomLevel - 1);
    },
        
    zoomOut: function () {
        this.zoomTo(this.zoomLevel + 1);
    },

    resize: function () {
        // get dimensions
        var oldDimensions = this.dimensions;
        
		//Update viewport height
		//var viewportOuter = this.domNode.ancestors().select('#viewport-outer').grep('');
		var viewportOuter =  this.outerNode;
		viewportOuter.setStyle ({height: document.viewport.getHeight() - this.headerAndFooterHeight + 'px'});

        this.dimensions = this.domNode.getDimensions();
        
        this.dimensions.width += this.prefetch;
        this.dimensions.height += this.prefetch;
        
        if (this.dimensions.width !== oldDimensions.width || this.dimensions.height !== oldDimensions.height) {
            //this.reload();
            this.resetLayers();
            //this.moveContainer();
        }
    },

    clearLayers: function () {
        this.layers.each(function (layer) {
            layer.removeTiles();
    	});
    //alert('layers clear');
    },

	reload: function () {
	    this.layers.each(function (layer) {
	    	layer.reload();
	    });
	},

	resetLayers: function () {
		this.layers.each(function (layer) {
	    	layer.reset();
	    });
	},
  
	getMaxZoomLevel: function () {
	    if (this.layers[0].maxZoomLevel) {
	    	return this.layers[0].maxZoomLevel;
	    }
	    return 0;
	},
  
    getMinZoomLevel: function () {
	    if (this.layers[0].minZoomLevel) {
	    	return this.layers[0].minZoomLevel;
	    }
	    return 0;
    }
});
