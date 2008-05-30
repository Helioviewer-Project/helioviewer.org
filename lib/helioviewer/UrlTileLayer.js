/*global Class, $, Counter, document, Layer, Object, Ajax, Event, Image */
var UrlTileLayer = Class.create(Layer, {
    defaultOptions: {
        type: 'Tilelayer',
        opacity: 1
    },
    
    initialize: function (viewport, options) {
        Object.extend(this, this.defaultOptions);
        Object.extend(this, options);
        this.viewport = viewport;
        this.id = 'urltilelayer' + Counter.getNext.urltilelayer;

        var div = document.createElement('div');
        $(div).setOpacity(this.opacity);
        this.domNode = viewport.movingContainer.appendChild(div);

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
        //var img = $(document.createElement('img'));
        //var div = $(document.createElement('div'));
        var img = $(new Image());
        img.toggleClassName('tile');
        img.setStyle({
//            position: 'absolute',
//            color: '#fff',
//            borderLeft: '1px dashed #666',
//            borderTop: '1px dashed #666',
//            width: '256px',
//            height: '256px',
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
        //img.onerror = function() { $('output').innerHTML += this.src + '<br>'; };
    //img.onload = function() { $('output').innerHTML += this.src + '<br>'; };
    
    img.src = this.getTileUrl(x, y, this.viewport.zoomLevel, this.imageId);
    //img.innerHTML = x + ',' + y;
    //div.appendChild(img);
    //return div;
    return img;
  },
    
  reload: function() {
    this.loadClosestImage();
  }
});