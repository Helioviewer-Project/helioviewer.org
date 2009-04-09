/**
 * @fileOverview Contains the main application class and controller for Helioviewer.
 * @author <a href="mailto:vincent.k.hughitt@nasa.gov">Keith Hughitt</a>
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
	 *		<b>imageAPI</b>			- URL to the API for retrieving image meta information.<br>
	 *		<b>tileAPI</b>				- URL to the API for retrieving tiles.<br>
	 *		<b>eventAPI</b>			- URL to the API for retrieving events and event-catalogs.<br>
	 * </div>
	 * @see Helioviewer#defaultOptions for a list of the available parameters.
	 */
	initialize: function (viewportId, api, view, defaults) {
       	Object.extend(this, defaults);
        this.load       = view;
        this.api        = api;
        this.viewportId = viewportId;

		// Loading indication
		this.loadingIndicator = new LoadingIndicator();

		// Load user-settings
		this.loadUserSettings();

		// Starting date
		this.date = new Date(this.userSettings.get('obs-date'));
		$('date').writeAttribute('value', this.date.toYmdUTCString());
		$('time').writeAttribute('value', this.date.toHmUTCString());

		this.layerManager =  new LayerManager(this);
		this.initViewports();
		this.initUI();
		this.initEvents();
		this.initKeyBoardListeners();

		// Add initial layers
		this.userSettings.get('tile-layers').each((function (settings) {
			this.layerManager.addLayer(new TileLayer(this.viewports[0], settings));
		}).bind(this));

		//Shadow-box
		//Shadowbox.init({skipSetup: true});

	},

	/**
	 * @description Initialize Helioviewer's user interface (UI) components
	 */
	initUI: function () {
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
		this.eventLayerAccordion = new EventLayerAccordion(this.viewports[0], 'eventAccordion');

		//Tooltips
		this.initToolTips();

		//Center button
		centerBtn =  Builder.node('div', {className: 'center-button'}, Builder.node('span', {}, "center"));
		Event.observe(centerBtn, 'click', this.viewports[0].center.bindAsEventListener(this.viewports[0]));
		this.viewports[0].innerNode.insert(centerBtn);
        
        //Fullscreen button
        this._createFullscreenBtn();
        
		//Mouse coordinates
		mouseCoords =  Builder.node('div', {id: 'mouse-coords', style: 'display: none'});

		// IE will choke here if we don't manually extend mouseCoords... see last paragraph at http://prototypejs.org/learn/extensions
		Element.extend(mouseCoords);

		mouseCoords.insert(Builder.node('div', {id: 'mouse-coords-x', style: 'width:50%; float: left'}));
		mouseCoords.insert(Builder.node('div', {id: 'mouse-coords-y', style: 'width:50%; float: left'}));
		this.viewports[0].innerNode.insert(mouseCoords);

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
        			height: 430,
        			draggable: true
        		});
                jQuery(this).addClass("dialog-loaded");
            }
            return false; 
        });
    },

	/**
	 * @description Loads user settings from cookies or defaults if no settings have been stored.
	 */
	loadUserSettings: function () {
		this.userSettings = new UserSettings(this);

		// Load any view parameters specified via API
		if (this.load["obs-date"]) {
			this.userSettings.set('obs-date', parseInt(this.load["obs-date"], 10) * 1000);
		}

		if (this.load["img-scale"]) {
			this.userSettings.set('zoom-level', this.scaleToZoomLevel(parseInt(this.load["img-scale"], 10)));
		}

		if (this.load.layers) {
			var layers =  [];
			$A(this.load.layers).each(function (layer) {
				layers.push({ tileAPI: "api/index.php", observatory: layer.substr(0, 3), instrument: layer.substr(3, 3), detector: layer.substr(6, 3), measurement: layer.substr(9, 3) });
			});

			this.userSettings.set('tile-layers', layers);
		}

	},
    
    /**
     * @description Creates an HTML button for toggling between regular and fullscreen display
     * Syntax: jQuery
     */
    _createFullscreenBtn: function () {
        var btn, footer, vp, speed, origOutsideMarginLeft, origOutsideMarginRight, origHeaderHeight, origViewportHeight, self;
        
        // create dom-node
        btn = jQuery("#fullscreen-btn");
        jQuery('#helioviewer-viewport-container-inner').append(btn);
        
        // CSS Selectors
        outsideBox = jQuery('#outsideBox');
        vp         = jQuery('#helioviewer-viewport-container-outer');
        footer     = jQuery('#footer-links-container-outer');
        header     = jQuery('#middle-col-header');
        panels     = jQuery("#left-col, #right-col, #footer-links-container-outer");
       
        // animation speed
        speed = 500;
        
        // keep track of original dimensions
        origOutsideMarginLeft  = outsideBox.css("margin-left");
        origOutsideMarginRight = outsideBox.css("margin-right");
        origHeaderHeight       = header.height();
        origViewportHeight     = vp.height();

        // setup event-handler
        self  = this;
        btn.click(function() {
            // toggle class
            outsideBox.toggleClass('fullscreen-mode');
            
            // fullscreen mode
            if (outsideBox.hasClass('fullscreen-mode')) {
                outsideBox.animate({ 
                    marginLeft:  "5px",
                    marginRight: "5px"
                    }, speed,
                    function () {
                        panels.hide();
                        self.viewports[0].checkTiles();
                        self.layerManager.resetLayers(self.viewports[0].visible);
                    });
                vp.animate({
                    height: jQuery(window).height() - 15
                }, speed);
                header.animate({
                    height: '5px'
                }, speed);
            
            // regular mode      
            } else {
                panels.show();
                outsideBox.animate({ 
                    marginLeft:  origOutsideMarginLeft,
                    marginRight: origOutsideMarginRight
                }, speed );
                vp.animate({
                    height: origViewportHeight
                }, speed);
                header.animate({
                    height: origHeaderHeight
                }, speed);
            }
        })
    },
    
	/**
	 * @description Initialize Helioviewer's viewport(s).
	 */
	initViewports: function () {
		this.viewports = $A([
			new Viewport(this, { id: this.viewportId, zoomLevel: this.userSettings.get('zoom-level'), prefetch: this.prefetchSize, debug: false })
		]);

		// Dynamically resize the viewport when the browser window is resized.
		this.viewports.each(function (viewport) {
			Event.observe(window, 'resize', viewport.resize.bind(viewport));
		});
	},

	/**
	 * @description Initialize event-handlers for UI components controlled by the Helioviewer class
	 */
	initEvents: function () {
		this.observe(this.zoomControl, 'change', this.handlers.zoom);
		this.observe(this.calendar, 'observationDateChange', this.handlers.observationDateChange);
		this.observe(this.layerManager, 'newLayer', this.handlers.newLayer);
		Event.observe(this.calendar.timeField, 'change', this.handlers.observationTimeChange.bindAsEventListener(this));
	},

	/**
	 * @description Initialize keyboard-related event handlers.
	 * @see Based off method by <a href="http://www.quirksmode.org/js/events_properties.html#key">PPK</a>
	 */
	initKeyBoardListeners: function () {
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
					self.viewports.each(function (viewport) {
						viewport.center();
					});
				}
				//event label visibility toggle
				else if (character === "d") {
                    self.layerManager.toggleLabels();
				}
                
				// toggle mouse-coords display
				else if (character === "m") {
					self.viewports.each(function (viewport) {
						viewport.ViewportHandlers.toggleMouseCoords();
					});
				}

			}
		});
	},

	/**
	 * @description Adds tooltips to all elements that are loaded everytime (buttons, etc) using default tooltip options.
	 */
	initToolTips: function () {
		var items = $A([
			'#zoomControlZoomIn',
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
		this.addToolTip('#movieBuilder', {position: 'topleft'});

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
			top: (options.yOffset ? options.yOffset : 0),
			left: 12
		});
	},

	/**
	 * @description Adds a new viewport to the list of maintained viewports: Usually only one will exist at a given time.
	 * @param {Object} viewport A reference to the viewport instance to add.
	 */
	addViewport: function (viewport) {
		this.viewports.push(viewport);
		return this;
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
	 * @namespace
	 * @description Helioviewer application-level event handlers
	 */
	handlers: {
		/**
		 * @description Changes the zoom-level to a new value
		 * @param {Int} level The new zoom-level to use
		 */
		zoom: function (level) {
			this.viewports.each(function (viewport) {
				viewport.zoomTo(level);
			});
		},

		observationDateChange: function (date) {
			this.setDate(date);
			this.calendar.updateFields();
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
		},

		/**
		 * @description newLayer Initializes new layer upon user request
		 * @param {Object} instrument Contains necessary information for creating a new layer
		 * @param {LayerManagerMenuEntry} menuEntry Reference to the menu entry to allow layer to be tied to the entry
		 */
		newLayer: function (data) {
			var inst = data.instrument,
				ui =   data.menuEntry,
				viewport = this.viewports[0],
				layer;

			// Inialize layer and add it to the viewport
			layer = new TileLayer(viewport, { tileAPI: this.api, observatory: inst.observatory, instrument: inst.instrument, detector: inst.detector, measurement: inst.measurement });
			viewport.addLayer(layer);

			//Update menu entry display
			ui.layer = layer;
			ui.displayTileLayerOptions();
		}
	}
});

