/**
 * @author Patrick Schmiedel patrick.schmiedel@gmx.net
 */

/**
 * @classDescription The UIElement class enables inheriting 
 * classes to use the "event/notification" system.
 */
var UIElement = Class.create({
  addObserver: function(eventName, callback) {
    if (!this.observers) this.observers = [];
    if (!this.observers[eventName])
      this.observers[eventName] = [];
    this.observers[eventName].push(callback);
    return this;
  },

  fire: function(eventName, eventParameters) {
//$('output').innerHTML = eventName + ': ' + eventParameters;
    if (!this.observers
      || !this.observers[eventName] || this.observers[eventName].length == 0)
      return this;
    this.observers[eventName].each(function(callback) {
      callback(eventParameters);
    });
    return this;
  }
});

var OutputReceiver = Class.create({
  initialize: function(elementId) {
    this.domNode = $(elementId);    
  },
  
  output: function(text) {
    this.domNode.innerHTML = text;
  }
});

var Viewport = Class.create(UIElement, {
  defaultOptions: {
    zoomLevel: 0
  },
  isMoving: false,
  currentPosition: { x: 0, y: 0 },
  containerPosition: { x: 0, y: 0 },
  dimensions: { width: 0, height: 0 },
  
  initialize: function(controller, options /*elementId, controller, zoomLevel, outputReceiver, layers*/) {
    Object.extend(this, this.defaultOptions);
    Object.extend(this, options);

    this.domNode = $(this.id);
    this.controller = controller;
    this.layers = [];
    this.ViewportHandlers = new ViewportHandlers(this);

//    this.movingContainer = this.domNode.select('div.movingContainer')[0];
    var movingContainer = document.createElement('div');
    movingContainer.className = 'movingContainer';
    this.movingContainer = this.domNode.appendChild(movingContainer);
    this.resize();
  },
  
  addLayer: function(layer) {
    this.layers.push(layer);
    layer.setZIndex(this.layers.length - 1);
    //layer.reload();
  },
  
  output: function(text) {
    if (this.outputReceiver && this.outputReceiver.output) this.outputReceiver.output(text);
  },
  
  center: function() {
    if (this.layers.length == 0 || !this.layers[0].getFullSize) return this;
    this.moveTo(0, 0);
    return this;
  },
  
  moveTo: function(x, y) {
    this.currentPosition = {
      x: x,
      y: y
    };
    //this.moveContainer();
//this.output(x + ',' + y);
    this.fire('move', { x: x, y: y });
  },

  moveBy: function(x, y) {
    this.currentPosition = {
      x: this.startMovingPosition.x + x,
      y: this.startMovingPosition.y + y
    };
    //this.moveTo(this.startMovingPosition.x + x, this.startMovingPosition.y + y);  
    this.moveContainerBy(-x, -y);
    this.fire('move', { x: this.currentPosition.x, y: this.currentPosition.y });
  },
  
  startMoving: function() {
    this.startMovingPosition = this.currentPosition;
    this.containerStartMovingPosition = this.containerPosition;
  },
  
  endMoving: function() {
      
  },
  
  getContainerOffset: function() {
    return {
      x: Math.round(this.dimensions.width / 2 - this.currentPosition.x) - this.containerPosition.x,
      y: Math.round(this.dimensions.height / 2 - this.currentPosition.y) - this.containerPosition.y
    };  
  },

  getContainerRelativeCoordinates: function(x, y) {
    var offset = this.getContainerOffset();
    return {
      x: x + offset.x,
      y: y + offset.y
    };
  },
  
  moveContainerBy: function(x, y) {
    this.containerPosition = {
      x: this.containerStartMovingPosition.x + x,
      y: this.containerStartMovingPosition.y + y
    };
    this.movingContainer.setStyle({
      left: this.containerPosition.x + 'px',
      top:  this.containerPosition.y + 'px'  
    });
  },
  
//  setDate: function(date) {
//    this.layers.each(function(layer) { layer.setDate(date); } );
//  },

  zoomToAt: function(zoomLevel, zoomPointCoordinates) {
    // multiplicator
    var m = Math.pow(2, -zoomLevel + this.zoomLevel);
    // zoom
    this.zoomLevel = zoomLevel;
    
    // remove the tiles
    //this.clearLayers();
    // move the viewport so that its center is on the same point as before
    newZoomPointCoordinates = {
      x: m * zoomPointCoordinates.x,
      y: m * zoomPointCoordinates.y
    };
    this.moveTo(
      newZoomPointCoordinates.x,
      newZoomPointCoordinates.y
    );
    // reset the layers
    this.resetLayers();
  },
  
  zoomInAt: function(zoomPointCoordinates) {
    this.zoomToAt(this.zoomLevel - 1, zoomPointCoordinates);
  },
  
  zoomOutAt: function(zoomPointCoordinates) {
    this.zoomToAt(this.zoomLevel + 1, zoomPointCoordinates);
  },
  
  zoomTo: function(zoomLevel) {
    this.zoomToAt(zoomLevel, this.currentPosition);
  },
  
  zoomIn: function() {
    this.zoomTo(this.zoomLevel - 1);
  },
    
  zoomOut: function() {
    this.zoomTo(this.zoomLevel + 1);
  },

  resize: function() {
    // get dimensions
    var oldDimensions = this.dimensions;
    this.dimensions = this.domNode.getDimensions();
    if (this.dimensions.width != oldDimensions.width || this.dimensions.height != oldDimensions.height) {
      this.reload();
      //this.moveContainer();
    }
  },

  clearLayers: function() {
    this.layers.each(function(layer) {
      layer.removeTiles();
    });
    //alert('layers clear');
  },

  reload: function() {
    this.layers.each(function(layer) {
      layer.reload();
    });
  },

  resetLayers: function() {
    this.layers.each(function(layer) {
      layer.resetTiles();
    });
  },
  
  getMaxZoomLevel: function() {
    if (this.layers[0].maxZoomLevel) return this.layers[0].maxZoomLevel;
    return 0;
  },
  
  getMinZoomLevel: function() {
    if (this.layers[0].minZoomLevel) return this.layers[0].minZoomLevel;
    return 0;
  }
});

var ViewportHandlers = Class.create({
  startingPosition: { x: 0, y: 0 },
  mouseStartingPosition: { x: 0, y: 0 },
  mouseCurrentPosition: { x: 0, y: 0 },
  moveCounter: 0,
  moveThrottle: 2,

  initialize: function(viewport) {
    this.viewport = viewport;
    this.bMouseMove = this.mouseMove.bindAsEventListener(this);
    this.bMouseDown = this.mouseDown.bindAsEventListener(this);
    this.bMouseUp = this.mouseUp.bindAsEventListener(this);

    Event.observe(window, 'mousemove', this.bMouseMove);
    Event.observe(document, 'mousemove', this.bMouseMove);
    Event.observe(this.viewport.domNode, 'mousedown', this.bMouseDown);
    Event.observe(window, 'mouseup', this.bMouseUp);
    Event.observe(document, 'mouseup', this.bMouseUp);
  },

  mouseDown: function(event) {
    //this.viewport.output('down');
    this.viewport.isMoving = true;
    this.startingPosition = this.viewport.currentPosition;
    this.mouseStartingPosition = {
      x: Event.pointerX(event), 
      y: Event.pointerY(event)
    };
    this.viewport.domNode.setStyle({ cursor: 'all-scroll' });
    if (this.viewport.domNode.setCapture) {
      this.viewport.domNode.setCapture();
    }
    this.viewport.startMoving();
  },
  
  mouseUp: function(event) {
    //this.viewport.output('up');
    this.viewport.isMoving = false;
    this.viewport.domNode.setStyle({ cursor: 'pointer' });
    if (this.viewport.domNode.releaseCapture) {
      this.viewport.domNode.releaseCapture();
    }
    this.viewport.endMoving();
  },
  
  mouseMove: function(event) {
    //this.viewport.output('move');
    if (!this.viewport.isMoving) return;
    this.moveCounter = (this.moveCounter + 1) % this.moveThrottle;
    if (this.moveCounter != 0) return;
    
    this.mouseCurrentPosition = {
      x: Event.pointerX(event), 
      y: Event.pointerY(event)
    };
    
    this.viewport.moveBy(
      this.mouseStartingPosition.x - this.mouseCurrentPosition.x,
      this.mouseStartingPosition.y - this.mouseCurrentPosition.y
    );
    /*
    this.viewport.moveTo(
      this.startingPosition.x + this.mouseStartingPosition.x - this.mouseCurrentPosition.x,
      this.startingPosition.y + this.mouseStartingPosition.y - this.mouseCurrentPosition.y
    );
    */
  }
});

var Counter = Class.create();

Object.extend(Counter, {
  items: $H({}),
  
  getNext: function(category) {
    if (!this.items[category])
      this.items[category] = 0;
    else 
      this.items[category]++;
    return this.items[category];
  }
});

var Layer = Class.create(UIElement, {
  tileSize: 256,
  maxZoomLevel: 20, // ZoomLevel where FullSize = 1px
  minZoomLevel: 10,
  visible: true,

  initialize: function(viewport) {
    this.viewport = viewport;
    var div = document.createElement('div');
    this.domNode = $(viewport.movingContainer.appendChild(div));
    this.viewport.addObserver('move', this.viewportMove.bind(this));
    this.tiles = [];
    this.id = 'layer' + Counter.getNext['layer'];
  },
  
  setZIndex: function(v) {
    this.domNode.setStyle({ zIndex: v });
  },
  
  getStartIdx: function() {
    var ts = this.tileSize;
    var v = {
      x: this.viewport.currentPosition.x - this.viewport.dimensions.width / 2,
      y: this.viewport.currentPosition.y - this.viewport.dimensions.height / 2,
      w: this.viewport.dimensions.width,
      h: this.viewport.dimensions.height
    };

    var borderIdx = {
      left: Math.floor(v.x / ts),
      right: Math.floor((v.x + v.w) / ts),
      top: Math.floor(v.y / ts),
      bottom: Math.floor((v.y + v.h) / ts)
    };
    
    if (borderIdx.right - borderIdx.left < this.numTiles.x - 1) {
      if ((v.x % ts) < (ts - (v.x + v.w) % ts))
        borderIdx.left -= 1;
      else
        borderIdx.right += 1;
    }
    if (borderIdx.bottom - borderIdx.top < this.numTiles.y - 1) {
      if ((v.y % ts) < (ts - (v.y + v.h) % ts))
        borderIdx.top -= 1;
      else
        borderIdx.bottom += 1;
    }

    return { x: borderIdx.left, y: borderIdx.top };
  },
    
  viewportMove: function(position) {
    var oldStartIdx = this.startIdx;
    var m, newTile;
    
    this.startIdx = this.getStartIdx();
//if (this.startIdx.x != oldStartIdx.x || this.startIdx.y != oldStartIdx.y)
//  this.viewport.output(Math.random() + 'tiles: move ' + position.x + ',' + position.y);
    
    // has the index of the left / top image changed?
    if (this.startIdx.x != oldStartIdx.x) {
      var startIx, endIx;
      if (this.startIdx.x > oldStartIdx.x) {
        // remove left, add right
//this.viewport.output('remove left, add right: ' + oldStartIdx.x + ' -> ' + this.startIdx.x);
        startIx = oldStartIdx.x; // Max(this.startIdx.x - this.numTiles.x , oldStartIdx.x) ?
        endIx = this.startIdx.x;  
        m = 1;
      } else if (this.startIdx.x < oldStartIdx.x) {
        // remove right, add left
//this.viewport.output('remove right, add left: ' + this.startIdx.x + ',' + this.startIdx.y);
        startIx = this.startIdx.x + this.numTiles.x;
        endIx = oldStartIdx.x + this.numTiles.x;
        m = -1;
      }

      for(ix = startIx; ix < endIx; ix++) {
        for (iy = oldStartIdx.y; iy < oldStartIdx.y + this.numTiles.y; iy++) {
          if (this.tiles[ix] && this.tiles[ix][iy] && $(this.tiles[ix][iy]).parentNode) $(this.tiles[ix][iy]).remove();
          var newIx = ix + m * this.numTiles.x;
          if (!this.tiles[newIx]) this.tiles[newIx] = [];
          newTile = this.getTile(newIx, iy, this.viewport.zoomLevel);
          this.tiles[newIx][iy] = $(this.domNode.appendChild(newTile)); 
          if (this.tiles[ix] && this.tiles[ix][iy]) delete this.tiles[ix][iy];
        }
      }
    }

    if (this.startIdx.y != oldStartIdx.y) {
      var startIy, endIy;
      if (this.startIdx.y > oldStartIdx.y) {
        // remove top, add bottom
        startIy = oldStartIdx.y;
        endIy = this.startIdx.y;
        m = 1;
      } else if (this.startIdx.y < oldStartIdx.y) {
        // remove bottom, add top
        startIy = this.startIdx.y + this.numTiles.y;
        endIy = oldStartIdx.y + this.numTiles.y;
        m = -1;
      }
      for (iy = startIy; iy < endIy; iy++) {
        for(ix = this.startIdx.x; ix < this.startIdx.x + this.numTiles.x; ix++) {
          if (this.tiles[ix] && this.tiles[ix][iy] && $(this.tiles[ix][iy]).parentNode) $(this.tiles[ix][iy]).remove();
          var newIy = iy + m * this.numTiles.y;
          newTile = this.getTile(ix, newIy, this.viewport.zoomLevel);
          this.tiles[ix][newIy] = $(this.domNode.appendChild(newTile)); 
          if (this.tiles[ix] && this.tiles[ix][iy]) delete this.tiles[ix][iy];
        }
      }
    }
  },

  removeTiles: function() {
    // remove old Tiles (only when loading complete?)
    this.domNode.childElements().each(function(tile) { tile.remove(); });
    if (this.startIdx) {
      for (ix = this.startIdx.x; ix < this.startIdx.x + this.numTiles.x; ix++) {
        for (iy = this.startIdx.y; iy < this.startIdx.y + this.numTiles.y; iy++) {
          if (this.tiles[ix][iy]) {
            //this.tiles[ix][iy].remove();
            delete this.tiles[ix][iy];
          }
        }
      }
    }  
  },

  reload: function() {
    this.resetTiles();
  },

  resetTiles: function() {
//this.viewport.output(Math.random() + 'resetting tiles');
    this.removeTiles();
      
    this.numTiles = {
      x: Math.ceil(this.viewport.dimensions.width / this.tileSize) + 1,
      y: Math.ceil(this.viewport.dimensions.height / this.tileSize) + 1
    };
    
    this.startIdx = this.getStartIdx();
    
    // Add tiles
    for (iy = this.startIdx.y; iy < this.startIdx.y + this.numTiles.y; iy++) {
      for (ix = this.startIdx.x; ix < this.startIdx.x + this.numTiles.x; ix++) {
        var tile = this.getTile(ix, iy, this.viewport.zoomLevel);
        if (!this.tiles[ix]) this.tiles[ix] = [];
        if (this.tiles[ix][iy]) this.viewport.output(this.tiles[ix][iy]);
        this.tiles[ix][iy] = $(this.domNode.appendChild(tile));
      }
    }
  },
  
  setVisible: function(visible) {
    this.visible = visible;
    this.domNode.setStyle({ visibility: (visible ? 'visible' : 'hidden') });
    return this.visible;
  },
  
  toggleVisible: function() {
    return this.setVisible(!this.visible);
  }
});

/*
var TestGridLayer = Class.create(Layer, {
  getTile: function(x, y) {
    var left = x * this.tileSize;
    var top = y * this.tileSize;
    var div = $(document.createElement('div'));
    div.toggleClassName('testGrid');
    div.setStyle({
      left: left + 'px',
      top: top + 'px',
      width: this.tileSize + 'px',
      height: this.tileSize + 'px'
    });
    var rf = function() { return false; };
    div.onmousedown = rf;
    div.ondrag = rf;
    div.onmouseover = rf;
    div.oncontextmenu = rf;
    var span = $(document.createElement('span'));
    span.toggleClassName('text1');
    span.innerHTML = x + ',' + y;
    div.appendChild(span);
    return div;
  }
});
*/

var UrlTileLayer = Class.create(Layer, {
  defaultOptions: {
    type: 'Tilelayer',
    opacity: 1
  },
  
  initialize: function(viewport, options) {
    Object.extend(this, this.defaultOptions);
    Object.extend(this, options);
    this.viewport = viewport;
    this.id = 'urltilelayer' + Counter.getNext['urltilelayer'];

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
  
  setImageProperties: function(imageProperties) {
    if (imageProperties.imageId == this.imageId) return;
    Object.extend(this, imageProperties);
    this.fire('change', this);
    this.resetTiles();
  },

  loadImageProperties: function() {
    var urlPrefix = this.viewport.controller.imageUrlPrefix;
    var url = urlPrefix + '?action=getProperties&imageId=' + this.imageId;
    
    var processResponse = function(transport) {
      this.setImageProperties(transport.responseJSON);
    };
    new Ajax.Request(url, {
      method: 'get',
      onSuccess: processResponse.bind(this)
    });
  },
  
  setImage: function(imageId) {
    if (imageId == this.imageId) return;
    this.imageId = imageId;
    this.loadImageProperties();
    this.resetTiles();
  },
  
  loadClosestImage: function() {
    var date = this.viewport.controller.date;
    var urlPrefix = this.viewport.controller.imageUrlPrefix;
    var url = urlPrefix + '?action=getClosest&observatory=' + this.observatory + '&instrument=' + this.instrument + '&detector=' + this.detector + '&measurement=' + this.measurement + '&timestamp=' + (date.getTime() / 1000);
    var processResponse = function(transport) {
      this.setImageProperties(transport.responseJSON);
    };
    new Ajax.Request(url, {
      method: 'get',
      onSuccess: processResponse.bind(this)
    });
  },
  
  getTileUrl: function(x, y, zoom, imageId) {
    if (imageId == undefined) imageId = '';
    return this.tileUrlPrefix + '?x=' + x + '&y=' + y + '&zoom=' + zoom + '&imageId=' + imageId;
  },
  
  getFullSize: function() {
    return Math.max(this.tileSize * 2, Math.pow(2, this.maxZoomLevel - this.viewport.zoomLevel));
  },
  
  getTile: function(x, y) {
    var tilePos = this.viewport.getContainerRelativeCoordinates(x * this.tileSize, y * this.tileSize);
    var left = tilePos.x;
    var top = tilePos.y;
    //var img = $(document.createElement('img'));
    //var div = $(document.createElement('div'));
    var img = $(new Image());
    img.toggleClassName('tile');
    img.setStyle({
//      position: 'absolute',
//      color: '#fff',
//      borderLeft: '1px dashed #666',
//      borderTop: '1px dashed #666',
//      width: '256px',
//      height: '256px',
      left: left + 'px',
      top: top + 'px'
    });
    img.unselectable = 'on';
    var rf = function() { return false; };
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

var ZoomControl = Class.create(UIElement, {
  initialize: function(controller, options) {
    Object.extend(this, options);
    this.domNode = $(this.id);
    this.handle = $(this.id + 'Handle');
    this.controller = controller;
    var range = $R(this.minZoomLevel, this.maxZoomLevel);
    this.slider = new Control.Slider(this.handle, this.id + 'Track', {
      axis: 'vertical',
      values: range,
      sliderValue: this.zoomLevel,
      range: range,
      onSlide: this.updateHandle.bind(this),
      onChange: this.changed.bind(this)
    });
    //this.handle.innerHTML = this.zoomLevel;
    Event.observe($(this.id + 'ZoomIn'), 'click', this.zoomButtonClicked.bind(this, -1));
    Event.observe($(this.id + 'ZoomIn'), 'mousedown', function(e) { Event.stop(e); });
    Event.observe($(this.id + 'ZoomOut'), 'mouseup', this.zoomButtonClicked.bind(this, 1));
    Event.observe($(this.id + 'ZoomOut'), 'mousedown', function(e) { Event.stop(e); });
    //this.addObserver('changed', viewport.zoomTo.bind(viewport));
  },
  
  zoomButtonClicked: function(dir) {
    this.slider.setValue(this.slider.value + dir);
    //this.changed(this.slider.value);
  },
  
  updateHandle: function(v) {
    //this.handle.innerHTML = v;
  },
  
  changed: function(v) {
    this.updateHandle(v);
    this.fire('change', v);
  }
});

var TimeBrowserControl = Class.create(UIElement, {
  toggling: false,
  numDays: 5,
  minHeight: 55,

  initialize: function(elementId, viewport) {
    this.domNode = $(elementId);
    this.descriptionsDomNode = $(elementId + 'Descriptions');
    this.leftDomNode = $(elementId + 'Left');
    this.rightDomNode = $(elementId + 'Right');
    //this.spacerDomNode = $(elementId + 'Spacer');
    //this.separateTimeLinesDomNode = $(elementId + 'SeparateTimeLines');
    this.toggleDomNode = $(elementId + 'Toggle');
    this.viewport = viewport;
    Event.observe(elementId + 'Toggle', 'click', this.toggle.bindAsEventListener(this));
    
    var url = TimeBrowserControl.descriptionHtmlUrl(this.viewport.sources.events);
    new Ajax.Updater(this.descriptionsDomNode, url);
    this.resetDayElements();
  },
  
  resetDayElements: function() {
    if (!this.dayElements) {
      this.dayElements = new Array();
    }
    var max = Math.max(this.dayElements.length, this.numDays + 2);
    for (i = 0; i < max; i++) {
      var d = i - (this.numDays + 1) / 2;
      var p = Math.round(100 / this.numDays);
      var w = (i == this.numDays - 1
        ? 100 - p * (this.numDays - 1)
        : p
      );
      var date = new Date(this.viewport.controller.date.getTime() + d*24*60*60*1000);

      if (i >= this.numDays) {
        if (this.dayElements[i] && this.dayElements[i].parentNode) this.dayElements[i].remove();
        delete this.dayElements[i];
      }
      if (i >= this.dayElements.length) {
        this.dayElements[i] = this.addDayElement(date, (d == 0));
      }
      this.dayElements[i].setStyle({
        width: w + '%',
        left: p * (i-1) + '%'
      });
//      this.dayElements[i].date;
      //this.dayElements[i].innerHTML = date.getUTCFullYear() + '-' + date.getUTCMonth() + '-' + date.getUTCDate();
    }
    this.dayElements.length = this.numDays;
  },
  
  addDayElement: function(date, active) {
    var newDayElement = $(document.createElement('div'));
    newDayElement.addClassName('timeLineDay');
    if (active) newDayElement.addClassName('activeDay');
    newDayElement.innerHTML = date.getUTCFullYear() + '-' + (date.getUTCMonth()+1) + '-' + date.getUTCDate();
    var url = TimeBrowserControl.dayHtmlUrl(this.viewport.controller.sources.events, date);
    
//$('output').innerHTML += date.getUTCFullYear() + '-' + date.getUTCMonth() + '-' + date.getUTCDate() + '=> ' + url + '\n'; 

    new Ajax.Updater(newDayElement, url);
    
    return this.rightDomNode.appendChild(newDayElement);
  },
  
  toggle: function(e) {
    if (this.toggling) return;
    
    var moveUp = (this.rightDomNode.getHeight() > this.minHeight);
    var before = function() { this.toggling = true; }
    var after = function() {
      this.toggling = false;
      $(this.toggleDomNode).firstDescendant().src = (moveUp ? TimeBrowserControl.img.down : TimeBrowserControl.img.up);
    };
    
    parameters = {
      duration: 0.5,
      beforeStart: before.bind(this),
      afterFinish: after.bind(this) 
    };
    if (moveUp) {
      //new Effect.BlindUp(this.spacerDomNode, parameters);
      parameters.style = { height: this.minHeight + 'px' };
      new Effect.Parallel(
        [ new Effect.Morph(this.leftDomNode, parameters),
          new Effect.Morph(this.rightDomNode, parameters) ],
        parameters
      );
    } else {
      parameters.style = { height: this.minHeight + this.descriptionsDomNode.getHeight() + 10 + 'px' };
//      new Effect.Morph(this.rightDomNode, { style: { height: 42 + this.descriptionsDomNode.getHeight() + 'px' } });
      //this.spacerDomNode.setStyle({ height: this.descriptionsDomNode.getHeight() + 'px' });
      //new Effect.BlindDown(this.spacerDomNode, parameters);
      new Effect.Parallel(
        [ new Effect.Morph(this.leftDomNode, parameters),
          new Effect.Morph(this.rightDomNode, parameters) ],
        parameters
      );
    }

    Event.stop(e);
  }
});

Object.extend(TimeBrowserControl, {
  img: { down: 'images/TimeBrowser/down.gif', up: 'images/TimeBrowser/up.gif' },
  dayHtmlPrefix: 'timeBrowser.php?action=getDayHtml',
  descriptionHtmlPrefix: 'timeBrowser.php?action=getDescriptionHtml',

  descriptionHtmlUrl: function(srcs) {
    var str = TimeBrowserControl.descriptionHtmlPrefix;
    var i = 0;
    $H(srcs).each(function(pair) {
      str += '&src[' + i++ + ']=' + pair.key;
    });
    
    return str;
  },

  dayHtmlUrl: function(srcs, date) {
    var str = TimeBrowserControl.dayHtmlPrefix;
    var i = 0;
    $H(srcs).each(function(pair) {
      str += '&src[' + i++ + ']=' + pair.key;
    });
        
    str += '&date=' + (date.getTime() / 1000); 
    
    return str;
  }
});

var Coordinates = Class.create({});
Coordinates.getOffset = function(fullSize, tileSize) {
//  return (fullSize < tileSize ? Math.round((tileSize - fullSize) / 2) : 0);
  return 0;
};

Coordinates.worldAbs2rel = function(coords, fullSize, tileSize) {
  var offset = Coordinates.getOffset(fullSize, tileSize);
  return {
    x: (coords.x - offset) / fullSize,
    y: (coords.y - offset) / fullSize
  }
};
  
Coordinates.worldRel2abs = function(coords, fullSize, tileSize) {
  var offset = Coordinates.getOffset(fullSize, tileSize);
  return {
    x: Math.round(coords.x * fullSize) + offset,
    y: Math.round(coords.y * fullSize) + offset
  }
};

String.prototype.padLeft = function(padding, minLength) {
  var str = this;
  var strPad = '' + padding;
  while (str.length < minLength) {
    str = strPad + str;
  }
  return str;
};

String.prototype.trimLeft = function(padding) {
  var str = this;
  var strPad = '' + padding;
  while (str[0] == strPad) {
    str = str.substr(1);
  }
  return str;
};

Date.prototype.toYmdUTCString = function() {
  var year = this.getUTCFullYear() + '';
  var month = (this.getUTCMonth() + 1) + '';
  var day = this.getUTCDate() + '';
  return year + '/' + month.padLeft(0, 2) + '/' + day.padLeft(0, 2);
}

Date.prototype.toHmUTCString = function() {
  var hour = this.getUTCHours() + '';
  var min = this.getUTCMinutes() + '';
  var sec = this.getUTCSeconds() + '';
  return hour.padLeft(0, 2) + ':' + min.padLeft(0, 2) + ':' + sec.padLeft(0, 2);
}