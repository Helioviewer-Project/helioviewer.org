/*global Class, $, Counter, document, Layer, Object, Ajax, Event, Image */
var TileLayer = Class.create(Layer, {
    defaultOptions: {
        type: 'TileLayer',
        opacity: 1
    },
    
    initialize: function (viewport, options) {
        Object.extend(this, this.defaultOptions);
        Object.extend(this, options);
        this.viewport = viewport;
        this.id = 'tilelayer' + Counter.getNext('tilelayer');

        //var div = document.createElement('div');
        //$(div).setOpacity(this.opacity);
        //this.domNode = viewport.movingContainer.appendChild(div);
        this.domNode = new Element('div', {style: 'position: absolute;'})
        viewport.movingContainer.appendChild(this.domNode);

        this.viewport.addObserver('move', this.viewportMove.bind(this));
        this.tiles = [];

        if (this.imageId) {
            this.loadImageProperties();
        } else {
            this.loadClosestImage();
        }
    },
    
    setImageProperties: function (imageProperties) {
        if (imageProperties.imageId === this.imageId) {
        	return;
        }
        Object.extend(this, imageProperties);
        
        //handle opacities for any overlapping images
        this.setZIndex(parseInt(this.opacityGroupId));
        var self = this;
        var opacity = 1;
        var counter = 0;
        this.viewport.layers.each (function (layer) {
            if (parseInt(layer.opacityGroupId) == parseInt(self.opacityGroupId)) {
                counter++;
                
                //Do no need to adjust opacity of the first image
                if (counter > 1) {
                    opacity = opacity / counter;
                    layer.domNode.setOpacity(opacity);
                    Debug.output("opacity: " + opacity);
                }
            }
        });
        
        // Let others know layer has been added
        this.fire('change', this);
        this.resetTiles();
     },
     
    loadImageProperties: function () {
        var urlPrefix = this.viewport.controller.imageUrlPrefix;
        var url = urlPrefix + '?action=getProperties&imageId=' + this.imageId;
        
        var processResponse = function (transport) {
            this.setImageProperties(transport.responseJSON);
        };
        var trash = new Ajax.Request(url, {
            method: 'get',
            onSuccess: processResponse.bind(this)
        });
    },
    
    setImage: function (imageId) {
        if (imageId === this.imageId) {
        	return;
        }
        this.imageId = imageId;
        this.loadImageProperties();
        this.resetTiles();
    },
    
    loadClosestImage: function () {
        var date = this.viewport.controller.date;
        var urlPrefix = this.viewport.controller.imageUrlPrefix;
        var url = urlPrefix + '?action=getClosest&observatory=' + this.observatory + '&instrument=' + this.instrument + '&detector=' + this.detector + '&measurement=' + this.measurement + '&timestamp=' + (date.getTime() / 1000);
        var processResponse = function (transport) {
        	//alert(transport.responseJSON.imageId);
            this.setImageProperties(transport.responseJSON);
        };
        var trash = new Ajax.Request(url, {
            method: 'get',
            onSuccess: processResponse.bind(this)
        });
    },
    
    getTileUrl: function (x, y, zoom, imageId) {
        if (imageId === undefined) {
        	imageId = '';
        }
        return this.tileUrlPrefix + '?x=' + x + '&y=' + y + '&zoom=' + zoom + '&imageId=' + imageId;
    },
    
    getFullSize: function () {
        return Math.max(this.tileSize * 2, Math.pow(2, this.maxZoomLevel - this.viewport.zoomLevel));
    },
    
    getTile: function (x, y) {
        var tilePos = this.viewport.getContainerRelativeCoordinates(x * this.tileSize, y * this.tileSize);
        var left = tilePos.x;
        var top = tilePos.y;
        var img = $(new Image());
        img.toggleClassName('tile');
        img.setStyle({
            left: left + 'px',
            top: top + 'px'
        });
        img.unselectable = 'on';
        var rf = function() {
        	return false;
        };
        img.onmousedown = rf;
        img.ondrag = rf;
        img.onmouseover = rf;
        img.oncontextmenu = rf;
        img.galleryimg = 'no';
    
    img.src = this.getTileUrl(x, y, this.viewport.zoomLevel, this.imageId);
    return img;
  },
    
  reload: function() {
    this.loadClosestImage();
  }
});