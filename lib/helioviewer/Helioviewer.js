/**
 * @fileOverview Contains the main application class and controller for Helioviewer.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 */
/*global Helioviewer, Class, $, $A, Builder, Calendar, Event, EventLayerAccordion, EventTimeline, LayerManager, MessageConsole,TileLayer, TileLayerAccordion, TimeControls, UserSettings, ZoomControl, jQuery, LoadingIndicator, Viewport, document, window */
var Helioviewer = Class.create(
	/** @lends Helioviewer.prototype */
	{
	/**
	 * @constructs
	 * @description Creates a new Helioviewer instance.
	 * @param {Object} options Custom application settings.
	 * <br>
	 * <br><div style='font-size:16px'>Options:</div><br>
	 * <div style='margin-left:15px'>
	 * 		<b>defaultZoomLevel</b>	- The initial zoom-level to display.<br>
	 *		<b>defaultPrefetchSize</b> - The radius outside of the visible viewport to prefetch.<br>
	 *		<b>timeIncrementSecs</b>	- The default amount of time to move when the time navigation arrows are pressed.<br>
	 *		<b>minZoomLevel</b>		- Minimum zoom level allowed.<br>
	 *		<b>maxZoomLevel</b>		- Maximum zoom level allowed.<br>
	 *		<b>api</b>              - Primary API for querying image and event information.
	 * </div>
	 * @see Helioviewer#defaultOptions for a list of the available parameters.
	 */
	initialize: function (viewportId, api, view, defaults) {
       	Object.extend(this, defaults);
        this.load        = view;
        this.api         = api;
        this.viewportId  = viewportId;

		// Loading indication
		this.loadingIndicator = new LoadingIndicator();

		// Load user-settings
		this.loadUserSettings();

		// Starting date
		this.date = new Date(this.userSettings.get('obs-date'));
		$('date').writeAttribute('value', this.date.toYmdUTCString());
		$('time').writeAttribute('value', this.date.toHmUTCString());

		this.layerManager =  new LayerManager(this);
		this._initViewport();
		this._initUI();
		this._initEvents();
		this._initKeyBoardListeners();
				
		this.movieBuilder = new MovieBuilder(this);

		// Add initial layers
		this.userSettings.get('tile-layers').each((function (settings) {
			this.layerManager.addLayer(new TileLayer(this.viewport, settings));
		}).bind(this));

		//Shadow-box
//		Shadowbox.init({skipSetup: true});
	},

	/**
	 * @description Initialize Helioviewer's user interface (UI) components
	 */
	_initUI: function () {
		var centerBtn, outsideBox, mouseCoords;

		//Calendar
		this.calendar = new Calendar(this, 'date', 'time');

		//Zoom-control
		this.zoomControl = new ZoomControl(this, {
			id: 'zoomControl',
			zoomLevel:    this.userSettings.get('zoom-level'),
			minZoomLevel: this.minZoomLevel,
			maxZoomLevel: this.maxZoomLevel
		});

		//Time-navigation controls
		this.timeControls = new TimeControls(this, 'timestep-select', 'timeBackBtn', 'timeForwardBtn', this.timeIncrementSecs);

		//Message console
		this.messageConsole = new MessageConsole(this, 'message-console', 'helioviewer-viewport-container-outer');

		//Tile & Event Layer Accordions (accordions must come before LayerManager instance...)
		this.tileLayerAccordion = new TileLayerAccordion(this.layerManager, 'tileLayerAccordion');
		this.eventLayerAccordion = new EventLayerAccordion(this.viewport, 'eventAccordion');

		//Tooltips
		this._initToolTips();

        //Fullscreen button
        this._createFullscreenBtn();

		this._createScreenshotButton();	
			
		//Mouse coordinates
		mouseCoords =  Builder.node('div', {id: 'mouse-coords', style: 'display: none'});

		// IE will choke here if we don't manually extend mouseCoords... see last paragraph at http://prototypejs.org/learn/extensions
		Element.extend(mouseCoords);

		mouseCoords.insert(Builder.node('div', {id: 'mouse-coords-x', style: 'width:50%; float: left'}));
		mouseCoords.insert(Builder.node('div', {id: 'mouse-coords-y', style: 'width:50%; float: left'}));
		this.viewport.innerNode.insert(mouseCoords);

        // Setup dialog event listeners
        this._setupDialogs();
        
		//Movie builder
		//this.movieBuilder = new MovieBuilder({id: 'movieBuilder', controller: this});

		// Timeline
		//this.timeline = new EventTimeline(this, "timeline");
	},
    
    /**
     * @description Sets up event-handlers for dialog components
     */
    _setupDialogs: function () {
        
        // About dialog
        jQuery("#helioviewer-about").click(function() {
            if (jQuery(this).hasClass("dialog-loaded")) {
                var d = jQuery('#about-dialog');
                if (d.dialog('isOpen')) {
    				d.dialog('close');
    			}
    			else {
    				d.dialog('open');
    			}
            } else {
        		jQuery('#about-dialog').load(this.href).dialog({
    	    		autoOpen: true,
        			title: "Helioviewer - About",
        			width: 480,
        			height: 300,
        			draggable: true
        		});
                jQuery(this).addClass("dialog-loaded");
            }
            return false; 
        });

		//Keyboard shortcuts dialog
        jQuery("#helioviewer-usage").click(function() {
            if (jQuery(this).hasClass("dialog-loaded")) {
                var d = jQuery('#usage-dialog');
                if (d.dialog('isOpen')) {
    				d.dialog('close');
    			}
    			else {
    				d.dialog('open');
    			}
            } else {
        		jQuery('#usage-dialog').load(this.href).dialog({
    	    		autoOpen: true,
        			title: "Helioviewer - Usage Tips",
        			width: 480,
        			height: 480,
        			draggable: true
        		});
                jQuery(this).addClass("dialog-loaded");
            }
            return false; 
        });
    },

	/**
	 * @description Loads user settings from URL, cookies, or defaults if no settings have been stored.
	 */
	loadUserSettings: function () {
    	this.userSettings = new UserSettings(this);
		
		// Load any view parameters specified via API
		if (this.load["date"]) {
            var timestamp = getUTCTimestamp(this.load["date"]);
            this.userSettings.set('obs-date', timestamp);
		}

		if (this.load["img-scale"]) {
			this.userSettings.set('zoom-level', this.scaleToZoomLevel(img_scale)); //(parseInt(this.load["img-scale"], 10)));
		}

        // Process and load and layer strings specified
		if (this.load.layers) {
			var serverNum, api, layer, self = this, layers =  [];
            
			$A(this.load.layers).each(function (layerString) {
                // Select tiling server if distributed tiling is enabling
                if ((self.distributed === true) && ((layers.length % 2) == 0)) {
                    serverNum = 2;
                    api = self.tileServer2;
                }
                else {
                    serverNum = 1;
                    api = self.tileServer1;
                }
                
                // Parse layer string
                layer = self.parseLayerString(layerString);
                
                // Load layer
				layers.push({
                    tileAPI: api,
                    server: serverNum,
                    observatory: layer.observatory,
                    instrument : layer.instrument,
                    detector   : layer.detector,
                    measurement: layer.measurement
               });
			});
			this.userSettings.set('tile-layers', layers);
		}

	},
    
    /**
     * @description Creates an HTML button for toggling between regular and fullscreen display
     * Syntax: jQuery
     */
    _createFullscreenBtn: function () {
        var btn, footer, vp, sb, speed, marginSize, origOutsideMarginLeft, 
            origOutsideMarginRight, origHeaderHeight, origViewportHeight, $_fx_step_default, self;
        
        // get dom-node
        btn = jQuery("#fullscreen-btn");
        
        // CSS Selectors
        outsideBox = jQuery('#outsideBox');
        vp         = jQuery('#helioviewer-viewport-container-outer');
        sb         = jQuery('#sandbox');
        footer     = jQuery('#footer-links-container-outer');
        header     = jQuery('#middle-col-header');
        panels     = jQuery("#left-col, #right-col, #footer-links-container-outer");
       
        // animation speed
        speed = 500;
        
        // margin-size
        marginSize = 5;

        // Overide jQuery's animation method
        // http://acko.net/blog/abusing-jquery-animate-for-fun-and-profit-and-bacon
        self  = this;
        var $_fx_step_default = jQuery.fx.step._default;
        jQuery.fx.step._default = function (fx) {
            if (!(fx.elem.id === "sandbox")) {
                return $_fx_step_default(fx);
            }
            self.viewport.updateSandbox();
            fx.elem.updated = true;
        };
        
        // setup event-handler
        btn.click(function() {
            if (!btn.hasClass('requests-disabled')) {
                            
                // toggle fullscreen class
                outsideBox.toggleClass('fullscreen-mode');
                
                // make sure action finishes before starting a new one
                btn.addClass('requests-disabled');
                
                // fullscreen mode
                if (outsideBox.hasClass('fullscreen-mode')) {
    
                    // keep track of original dimensions
                    origOutsideMarginLeft  = outsideBox.css("margin-left");
                    origOutsideMarginRight = outsideBox.css("margin-right");
                    origHeaderHeight       = header.height();
                    origViewportHeight     = vp.height();
                
                    outsideBox.animate({ 
                        marginLeft:  marginSize,
                        marginRight: marginSize
                        }, speed,
                    function () {
                        self.viewport.checkTiles();
                        self.layerManager.resetLayers(self.viewport.visible);
                        panels.hide();
                        btn.removeClass('requests-disabled');
                    });
                       
                    header.animate({
                        height: marginSize
                    }, speed);
    
                    vp.animate({
                        height: jQuery(window).height() - (marginSize * 3)
                    }, speed);
     
                    sb.animate({
                        right: 1 // Trash
                    }, speed);                
               
                // regular mode      
                } else {
                    panels.show();
    
                    outsideBox.animate({ 
                        marginLeft:  origOutsideMarginLeft,
                        marginRight: origOutsideMarginRight
                        }, speed,
                    function () {
                        btn.removeClass('requests-disabled');    
                    });
    
                    vp.animate({
                        height: origViewportHeight
                    }, speed);
                    header.animate({
                        height: origHeaderHeight
                    }, speed);
                    sb.animate({
                        right: 0
                    }, speed);
                }
            }
        })
    },

	/**
	 * @description Creates a button that allows the user to take screenshots of what is in their viewport.
	 * @TODO: make most of the things in here a function that moviebuilder can use too.
	 */
	_createScreenshotButton: function() {
        this.button = jQuery("#screenshot-button");
		this.url = "api/index.php";
		this.sharpen = false;
		this.edgeEnhance = false;
		this.building = false;
		
		self = this;
		this.button.click(function() {
			if (self.building) 
				self.messageConsole.info("A link to your screenshot will be available shortly.");
			
			else {
				var zoomLevel, obsDate, layers = $A(), layerNames = $A(), layerOpacities = $A(), layerXRanges = $A(), layerYRanges = $A(), xhr;
				zoomLevel = self.viewport.zoomLevel;
				obsDate = self.date.getTime()/1000;
				self.building = true;
				
				// Get all of the layer information
				var layers 		= self.getViewportInformation(), layerNames, layerOpacities, layerXRanges, layerYRanges, hcOffset;
				layerNames 		= layers.layerNames;
				layerOpacities 	= layers.layerOpacities;
				layerXRanges 	= layers.layerXRanges;
				layerYRanges 	= layers.layerYRanges;
				hcOffset 		= layers.hcOffset;
			
				xhr = new Ajax.Request(self.url, {
					method: 'POST',
					parameters: {
						action: 	"takeScreenshot",
						layers: 	layerNames.join(),
						obsDate: 	obsDate,
						zoomLevel: 	zoomLevel,
						edges: 		self.edgeEnhance,
						sharpen: 	self.sharpen,
						opacity: 	layerOpacities.join(),
						hcOffset: 	hcOffset.x + "," + hcOffset.y,
						
						// Joining these with the "/" delimiter because the x and yRanges are already separated by commas.
						xRange: layerXRanges.join("/"),
						yRange: layerYRanges.join("/")
					},
					
					onComplete: function(transport){
						self.building = false;
						var url = transport.responseJSON.replace("/Library/WebServer/Documents/", "http://localhost/"); 
						
				        Shadowbox.open({
				            content: 	'<img src=\"' + url + '\"><br />' +
										'<div id="helioviewer-url-box">' +
										'Here is the url for your screenshot:' +
                    					'<form style="margin-top: 5px;"><input type="text" id="helioviewer-url-input-box" style="width:98%;" value="' + url + '"></form>' +
                    					'</div>',
							player:		"html",
				            title:      "Helioviewer Screenshot Viewer",
				            height:     600,
				            width:      600
				        });
					}
				});
			}
		});
	},
		   
	/**
	 * @description Initialize Helioviewer's viewport(s).
	 */
	_initViewport: function () {
		this.viewport =	new Viewport(this, {
            id: this.viewportId,
            zoomLevel: this.userSettings.get('zoom-level'),
            prefetch: this.prefetchSize,
            debug: false
        });

		// Dynamically resize the viewport when the browser window is resized.
		Event.observe(window, 'resize', this.viewport.resize.bind(this.viewport));
	},

	/**
	 * @description Initialize event-handlers for UI components controlled by the Helioviewer class
	 */
	_initEvents: function () {
        var self = this;
        
		this.observe(this.zoomControl, 'zoom-slider-change', this.handlers.zoom);
		this.observe(this.calendar, 'observationDateChange', this.handlers.observationDateChange);
		Event.observe(this.calendar.timeField, 'change', this.handlers.observationTimeChange.bindAsEventListener(this));
  		Event.observe(this.calendar.dateField, 'change', this.handlers.observationDateChange.bindAsEventListener(this));
        jQuery('#center-button').click(function() {
            self.viewport.center.call(self.viewport);
        });
        jQuery('#link-button').click(function() {
            self.displayURL();
        });
        jQuery('#email-button').click(function() {
        	self.displayMailForm();
        });
	},

	/**
	 * @description Initialize keyboard-related event handlers.
	 * @see Based off method by <a href="http://www.quirksmode.org/js/events_properties.html#key">PPK</a>
	 */
	_initKeyBoardListeners: function () {
		var self = this;
		Event.observe(document, 'keypress', function (e) {

			//Ignore event if user is type in an input form field
			if (e.target.tagName !== "INPUT") {
				var code, character;
				if (!e) {
					e = window.event;
				}
				if (e.keyCode) {
					code = e.keyCode;
				}
				else if (e.which) {
					code = e.which;
				}

				character = String.fromCharCode(code);

				//TODO: use events or public method instead of zoomControl's (private) method.
				if (character === "-" || character === "_") {
					self.zoomControl.zoomButtonClicked(+1);
				}
				else if (character === "=" || character === "+") {
					self.zoomControl.zoomButtonClicked(-1);
				}
				else if (character === "c") {
                    self.viewport.center();
				}
				// event label visibility toggle
				else if (character === "d") {
                    self.layerManager.toggleLabels();
				}
                
				// toggle mouse-coords display
				else if (character === "m") {
    				self.viewport.viewportHandlers.toggleMouseCoords();
				}
                
                // toggle full-screen display
                else if (character === "f") {
                    jQuery("#fullscreen-btn").click();
                }
                
                // step back in time
                else if (character === ",") {
                    self.timeControls.timePrevious();
                }
                
                // step forward in time
                else if (character === ".") {
                    self.timeControls.timeNext();
                }                          
			}
		});
	},

	/**
	 * @description Adds tooltips to all elements that are loaded everytime (buttons, etc) using default tooltip options.
	 */
	_initToolTips: function () {
		var items = $A([
			'#zoomControlZoomOut',
			'#zoomControlHandle',
			'#timeBackBtn',
			'#timeForwardBtn'
		]),

		self = this;
		items.each(function (item) {
			self.addToolTip(item, {yOffset: -125});
		});

		//Handle some special cases separately
		//this.addToolTip('#movieBuilder', {position: 'topleft'});
        this.addToolTip('#zoomControlZoomIn', {position: 'topleft'});
        this.addToolTip('#fullscreen-btn', {position: 'topright', yOffset: 10, xOffset: -185});

	},

	/**
	 * @description Adds a tooltip with specified settings to a given component.
	 * @param {String} CSS selector of th element to add ToolTip to.
	 * @param {Hash}   A hash containing any options configuration parameters to use.
	 */
	addToolTip: function (id, params) {
		var options = params || [],
			classname = "tooltip-" + (options.position || "bottomleft") + "-" + (options.tooltipSize || "medium");

		jQuery(id).tooltip({
			delay: (options.delay ? options.delay : 1000),
			track: (options.track ? options.track : false),
			showURL: false,
			opacity: 1,
			fixPNG: true,
			showBody: " - ",
			extraClass: classname,
			top:  (options.yOffset ? options.yOffset : 0),
			left: (options.xOffset ? options.xOffset : 12)
		});
	},

	/**
	 * @description Add an event-handler to a given component.
	 * @param {Object} uielement The UI component to attach the event to
	 * @param {String} eventName The name of the event to monitor for
	 * @param {Function} eventHandler A reference to the event-handler
	 * @see UIElement
	 */
	observe: function (uielement, eventName, eventHandler) {
		uielement.addObserver(eventName, eventHandler.bind(this));
	},

    /**
     * @description Updates the observation date
     * @param {Object} dateStr
     */
    updateDate: function (dateStr) {
        var date, time, hours, minutes, seconds, utcDate;
        
        date = Date.parse(dateStr);
        time = this.calendar.timeField.value;
    	
		//Factor in time portion of timestamp
		hours =   parseInt(time.substring(0, 2), 10);
    	minutes = parseInt(time.substring(3, 5), 10);
    	seconds = parseInt(time.substring(6, 8), 10);
    
    	//Convert to UTC
    	utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, seconds));    
        
    	this.setDate(utcDate);
		this.calendar.updateFields();
    },

	/**
	 * @description Sets the desired viewing date and time.
	 * @param {Date} date A JavaScript Date object with the new time to use
	 */
	setDate: function (date) {
		this.date = date;
		var ts = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
		this.userSettings.set('obs-date', parseInt(ts, 10));
        this.layerManager.reloadLayers();
        
	},

	/**
	 * @description Finds the closest support zoom-level to a given pixel scale (arcseconds per pixel)
	 * @param {Float} imgScale The image scale in arcseconds per pixel
	 */
	scaleToZoomLevel: function (imgScale) {
		var zoomOffset = Math.round(Math.lg((imgScale / this.baseScale)));
		return this.baseZoom + zoomOffset;
	},
    
    /**
	 * @description Translates a given zoom-level into an image plate scale.
	 * @param {int} zoomLevel A zoom level.
	 */
	zoomLevelToScale: function (zoomLevel) {
		var zoomOffset = zoomLevel - this.baseZoom;
        return this.baseScale * (Math.pow(2, zoomOffset));
	},
    
    /**
     * @description Breaks up a given layer identifier (e.g. SOH_LAS_0C2_0WL) into
     *              it's component parts and returns a javascript representation.
	 * @param {String} The layer identifier as an underscore-concatenated string
	 * @returns {Object} a simple javascript object representing the layer params
	 * @see LayerManager#generateLayerString
     */
    parseLayerString: function (str) {
        var params = str.split("_");
        return {
            observatory: params[0],
            instrument : params[1],
            detector   : params[2],
            measurement: params[3]            
        };
    },
    
    /**
     * @description Builds a URL for the current view
     * @param {Object} level
     * @TODO: Add support for viewport offset, event layers, opacity
     */
    generateURL: function () {
        var url, date, zoom, layers, self = this;
        
        // Base URL
        url = "http://www.helioviewer.org/?";
        
        // Add timestamp
  		// Work-around: In Firefox 3.1+, Date.toISOString() Returns single-quoted strings
		// http://code.google.com/p/datejs/issues/detail?id=54
		if (navigator.userAgent.search(/3\.[1-9]/) !== -1) {
			date = this.date.toISOString();
		}
		else {
			date = this.date.toISOString().slice(1, -1);
		}

        // Add zoomlevel
        zoom = this.zoomLevelToScale(this.viewport.zoomLevel);
        
        // Add layers
        layers="";
        $A(this.layerManager.tileLayers()).each(function(l) {
            layers += self.layerManager.generateLayerString(l) + ",";
        });
        
        // Remove trailing comma in layers list
        layers = layers.slice(0,-1);
        
        // Build URL
        url += "date=" + date + "&img-scale=" + zoom + "&layers=" + layers;

        return url;
    },

    /**
     * displays a dialog containing a link to the current page
     * @param {Object} url
     */
    displayURL: function () {
        var url, w;
        
        // Get URL
        url = this.generateURL();
        
        // Shadowbox width
        var w = jQuery('html').width() * 0.5;
        
        Shadowbox.open({
            content:    '<div id="helioviewer-url-box">' +
                        'Use the following link to refer to current page:' + 
                        '<form style="margin-top: 5px;"><input type="text" id="helioviewer-url-input-box" style="width:98%;" value="' + url + '"></form>' +
                        '</div>',
            player:     "html",
            title:      "URL",
            height:     80,
            width:      w
        });
    },
    
    /**
     * @description Displays a form to allow the user to mail the current view to someone
     */
    displayMailForm: function () {
        // Get URL
        var url = this.generateURL();
        
        Shadowbox.open({
            content:    '<div id="helioviewer-url-box">' +
                        'Who would you like to send this page to?<br>' + 
                        '<form style="margin-top:15px;">' +
                        '<label>From:</label>' +
                        '<input type="text" class="email-input-field" id="email-from" value="Your Email Address"></input><br>' +
                        '<label>To:</label>' +
                        '<input type="text" class="email-input-field" id="email-from" value="Recipient\'s Email Address"></input>' +
                        '<label style="float:none; margin-top: 10px;">Message: </label>' + 
                        '<textarea style="width: 370px; height: 270px; margin-top: 8px;">Check this out:\n\n' + url + '</textarea>' + 
                        '<span style="float: right; margin-top:8px;"><input type="submit" value="Send"></input></span>' +
                        '</form>' +
                        '</div>',
            player:     "html",
            title:      "Email",
            height:     455,
            width:      400
        });
        
    },

	/**
	 * @namespace
	 * @description Helioviewer application-level event handlers
	 */
	handlers: {
		/**
		 * @description Changes the zoom-level to a new value
		 * @param {Int} level The new zoom-level to use
		 */
		zoom: function (level) {
			this.viewport.zoomTo(level);
		},

		observationDateChange: function (e) {
            this.updateDate(e.target.value);
		},

		observationTimeChange: function (e) {
			var time = e.target.value,
				regex, newTime, hours, mins, secs;

			//make sure time entered in correct format
			regex = /^\d{2}:\d{2}:\d{2}?/;

			//Check to see if the input is a valid time
			if (time.match(regex)) {
				//Get the difference in times and add to this.date
				newTime = time.split(':');
				hours = parseInt(newTime[0], 10) - this.date.getUTCHours();
				mins  = parseInt(newTime[1], 10) - this.date.getUTCMinutes();
				secs  = parseInt(newTime[2], 10) - this.date.getUTCSeconds();

				this.date.addHours(hours);
				this.date.addMinutes(mins);
				this.date.setSeconds(secs);

				this.setDate(this.date);

			} else {
				this.messageConsole.warn('Invalid time. Please enter a time in of form HH:MM:SS');
			}
		},

		newToolTip: function (tooltip) {
			this.addToolTip(tooltip.id, tooltip.params);
		}
	},
	
	/*
	 * Figures out where the heliocenter is in terms of viewport coordinates. The viewport can be divided into 
	 * 9 regions, 3 along the x-axis (West, Center, Right), and 3 along the y-axis (North, Center, South).
	 * Returns the region that the heliocenter falls into (or the nearest region, if the heliocenter is outside the viewport). 
	 */	
	getHCOffset: function(visibleCoords) {
		var left, right, top, bottom, leftX, middleX, upperY, middleY, width, height, xDiff, yDiff, hcOffset, xDirection, yDirection;

		left 	= visibleCoords["left"];
		right 	= visibleCoords["right"];
		top 	= visibleCoords["top"];
		bottom 	= visibleCoords["bottom"];
		
		// How far away from the top left corner, and in which direction.
		// Note that the convert command reverses + and - for the x-direction, 
		// so + means push the image to the left, - means push it to the right.
		// The center coordinates do not need to be modified because of this,
		// since a +x means the heliocenter (0,0) is on the left, and a +y means
		// the heliocenter is above.
		offset = {
			x: left,
			y: top,	
		}
			
		return offset;
	},
	
	getViewportInformation: function() {
		var visibleCoords, layers, hcOffset, tileLayers;
		
		// Get the top, left, bottom, and right coordinates of what is currently visible in the viewport			
		visibleCoords = this.viewport.getHCViewportPixelCoords(); 
		centerX = visibleCoords["left"] + (visibleCoords["right"] - visibleCoords["left"]) / 2;
		centerY = visibleCoords["top"]  + (visibleCoords["bottom"] - visibleCoords["top"]) / 2;

		// Adjust so that visibleCoords points to the 512x512 region in the center of the viewport (until aspect ratios are put in)		
		visibleCoords["left"] 	= centerX - 256;
		visibleCoords["top"] 	= centerY - 256;
		visibleCoords["right"] 	= centerX + 256;
		visibleCoords["bottom"] = centerY + 256;
		
		hcOffset = this.getHCOffset(visibleCoords);
		
		// Get all tileLayers
		tileLayers = this.layerManager.tileLayers();

		// Arrays to hold layer data to send to API.php
		var layerNames = $A(), layerOpacities = $A(), layerXRanges = $A(), layerYRanges = $A();
		
		// Only add visible tile layers to the array.
		tileLayers.each(function(t){
			if (t.visible) {
				var left, top, right, bottom, width, height, sizeOffset;
				
                // TODO: find a way to not hard-code these that doesn't take much time.
                 var jp2Width = t.width;
                 if(t.detector == "0C2")
                         jp2Width = 1174;
                 else if(t.detector == "0C3")
                         jp2Width = 1418;
						 
				sizeOffset = jp2Width / t.relWidth;

				// Convert viewport heliocentric coordinates into image coordinates
				left 	= Math.floor(visibleCoords["left"] + t.relWidth / 2);
				top 	= Math.floor(visibleCoords["top"] + t.relHeight / 2);
				right 	= Math.floor(visibleCoords["right"] + t.relWidth / 2);
				bottom 	= Math.floor(visibleCoords["bottom"] + t.relHeight / 2);
				
				/* 
				 * Need to adjust for when 1 px on the jp2 image is not the same as 1 px on the viewport image.
				 * Example: "left" is the pixel coordinate relative to the image in the viewport, which may be twice as large
				 * as its corresponding jp2 image. The sizeOffset for this image would be (image width)/(2x image width) or 0.5,
				 * so to get the pixel coordinate relative to the jp2 image, multiply "left" by 0.5, the sizeOffset.
				 * zoomOffset cannot be used here because images like LASCO C2 and C3 have different sizeOffsets than EIT images
				 * at the same zoomLevel.
				 * If "left" or "top" is less than 0, just use 0.
				 */
				left 	= Math.max(left * sizeOffset, 0);
				top 	= Math.max(top * sizeOffset, 0);
				right 	= right * sizeOffset;
				bottom 	= bottom * sizeOffset;

				// If the calculated width is greater than the possible width, just use the possible width. 							
				width  = Math.min((right - left), t.width - left);
				height = Math.min((bottom - top), t.height - top);

				// Make it a square region (until aspect ratios are figured out).				
				imagesize = Math.max(width, height);
				width 	  = imagesize;
				height 	  = imagesize;

				// If the captured image just shows the black circular region of LASCO C2 or C3, don't even use that layer.		
				if(t.detector == "0C2" && left >=437 && right <= 737 && top >=437 && bottom < 737) 
					width = -1;
				
				if(t.detector == "0C3" && left >= 637 && right <= 781 && top >= 637 && bottom <= 781)
					width = -1;
							
				// If at least some of the image is currently visible, add that layer
				if (width > 0 && height > 0 && top < t.height && left < t.width) {
					var xRange = {
						start: left,
						size: width
					};
					
					var yRange = {
						start: top,
						size: height
					};
					
					// Add layer name, opacity, and ranges to the appropriate arrays.
					// Layer names are in the format OBS_INST_DET_MEAS to allow for variable-length names 
					var name = $A([t.observatory, t.instrument, t.detector, t.measurement])

					layerNames.push(name.join("_"));
					layerOpacities.push(t.opacity);
					layerXRanges.push(xRange.start + "," + xRange.size);
					layerYRanges.push(yRange.start + "," + yRange.size);
				}
			}
		});
		
		var layers = {
			layerNames: 	layerNames,
			layerOpacities: layerOpacities,
			layerXRanges: 	layerXRanges,
			layerYRanges: 	layerYRanges,
			hcOffset: 		hcOffset
		};
	
		return layers;
	}
});

