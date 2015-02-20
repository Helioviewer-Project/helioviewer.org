/**
 * @fileOverview Contains the main application class and controller for Helioviewer.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
  bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global document, window, $, HelioviewerClient, ImageSelectTool, MovieBuilder,
  TooltipHelper, HelioviewerViewport, ScreenshotBuilder, ScreenshotHistory,
  MovieHistory, UserVideoGallery, MessageConsole, Helioviewer,
  KeyboardManager, SettingsLoader, TimeControls,
  ZoomControls, ScreenshotManagerUI, MovieManagerUI, assignTouchHandlers,
  TileLayerAccordion, VisualGlossary, _gaq */
"use strict";
var HelioviewerWebClient = HelioviewerClient.extend(
    /** @lends HelioviewerWebClient.prototype */
    {
    /**
     * Creates a new Helioviewer.org instance.
     * @constructs
     *
     * @param {Object} urlSettings Client-specified settings to load.
     *  Includes imageLayers, date, and imageScale. May be empty.
     * @param {Object} serverSettings Server settings loaded from Config.ini
     */
    init: function (urlSettings, serverSettings, zoomLevels) {
        var urlDate, imageScale, paddingHeight, accordionsToOpen, self=this;

        this.header                   = $('#helioviewer-header');
        this.viewport                 = $('#helioviewer-viewport');
        this.drawerSpeed              = 0;
        this.drawerLeft               = $('#helioviewer-drawer-left');
        this.drawerLeftOpened         = false;
        this.drawerLeftOpenedWidth    = '25em';
        this.drawerNews               = $('#hv-drawer-news');
        this.drawerNewsOpenedHeight   = 'auto';
        this.drawerNewsOpenedWidth    = '25em';
        this.drawerMovies             = $('#hv-drawer-movies');
        this.drawerMoviesOpenedHeight = 'auto';
        this.drawerMoviesOpenedWidth  = '25em';
        this.drawerScreenshots             = $('#hv-drawer-screenshots');
        this.drawerScreenshotsOpenedHeight = 'auto';
        this.drawerScreenshotsOpenedWidth  = '25em';
        this.drawerYoutube             = $('#hv-drawer-youtube');
        this.drawerYoutubeOpenedHeight = '55em';
        this.drawerYoutubeOpenedWidth  = '25em';
        this.drawerData                = $('#hv-drawer-data');
        this.drawerDataOpenedHeight    = 'auto';
        this.drawerDataOpenedWidth     = '25em';
        this.drawerShare               = $('#hv-drawer-share');
        this.drawerShareOpenedHeight   = 'auto';
        this.drawerShareOpenedWidth    = '25em';

        this.tabbedDrawers = ['#hv-drawer-news', '#hv-drawer-movies',
                              '#hv-drawer-screenshots', '#hv-drawer-youtube',
                              '#hv-drawer-data', '#hv-drawer-share'];
        this.tabbedDrawerButtons = {
            '#hv-drawer-news'        : '#news-button',
            '#hv-drawer-youtube'     : '#youtube-button',
            '#hv-drawer-movies'      : '#movies-button',
            '#hv-drawer-screenshots' : '#screenshots-button',
            '#hv-drawer-data'        : '#data-button',
            '#hv-drawer-share'       : '#share-button'};

        this._super(urlSettings, serverSettings, zoomLevels);

        // Debugging helpers
        if (urlSettings.debug) {
            this._showDebugHelpers();
        }

        this._initLoadingIndicator();
        this._initTooltips();

        // Determine image scale to use
        imageScale = this._chooseInitialImageScale(Helioviewer.userSettings.get('state.imageScale'), zoomLevels);

        // Use URL date if specified
        urlDate = urlSettings.date ? Date.parseUTCDate(urlSettings.date) : false;

        this.timeControls = new TimeControls('#date', '#time',
            '#timestep-select', '#timeBackBtn', '#timeForwardBtn', urlDate);

        // Get available data sources and initialize viewport
        this._initViewport(this.timeControls.getDate(), 0, 0);

        this.messageConsole = new MessageConsole();
        this.keyboard       = new KeyboardManager();

        // User Interface components
        this.zoomControls   = new ZoomControls('#zoomControls', imageScale, zoomLevels,
                                               this.serverSettings.minImageScale,
                                               this.serverSettings.maxImageScale);

        this.earthScale = new ImageScale();
        this.earthScale.earthMinimize();

        this.displayBlogFeed(6, false);

        this._userVideos = new UserVideoGallery(this.serverSettings.videoFeed);

        this.imageSelectTool = new ImageSelectTool();

        this._screenshotManagerUI = new ScreenshotManagerUI();
        this._movieManagerUI      = new MovieManagerUI();

        this._glossary = new VisualGlossary(this._setupDialog);

        this._setupDialogs();
        this._initEventHandlers();
        this._setupSettingsUI();

        this._displayGreeting();

        this.updateHeightsInsideViewportContainer();

        /* Open Left and Right Drawers */
        setTimeout(
            function () {
                self.drawerLeftClick(true);

                $('#accordion-date   .disclosure-triangle').click();
                $('#accordion-images .disclosure-triangle').click();
                //$('#accordion-events .disclosure-triangle').click();

                setTimeout(
                    function () {
                        self.drawerYoutubeClick(true);
                    },
                    250
                );

                $('#accordion-youtube     .disclosure-triangle').click();
                $('#accordion-news        .disclosure-triangle').click();
                $('#accordion-screenshots .disclosure-triangle').click();
                $('#accordion-movies      .disclosure-triangle').click();
                $('#accordion-vso         .disclosure-triangle').click();
                $('#accordion-sdo         .disclosure-triangle').click();
            },
            500
        );

    },

    /**
     * @description Sets up a simple AJAX-request loading indicator
     */
    _initLoadingIndicator: function () {
        $(document).ajaxStart(function () {
            $('#loading').show();
        })
        .ajaxStop(function () {
            $('#loading').hide();
        });
    },

    /**
     * Add tooltips to static HTML buttons and elements
     */
    _initTooltips: function () {
        // Overide qTip defaults
        $.fn.qtip.defaults = $.extend(true, {}, $.fn.qtip.defaults, {
            show: {
                delay: 1000
            },
            style: {
                classes: 'ui-tooltip-light ui-tooltip-shadow ui-tooltip-rounded'
            }
        });

        // Bottom-right tooltips
        $("*[title]:not(.qtip-left)").qtip();

        // Bottom-left tooltips
        $(".qtip-left").qtip({
            position: {
                my: "top right",
                at: "bottom middle"
            }
        });

        // Top-left tooltips
        $(".qtip-topleft").qtip({
            position: {
                my: "bottom right",
                at: "top middle"
            }
        });
    },

    /**
     * Initializes the viewport
     */
    _initViewport: function (date, marginTop, marginBottom) {
        var self = this;

        $(document).bind("datasources-initialized", function (e, dataSources) {
            var tileLayerAccordion = new TileLayerAccordion('#tileLayerAccordion', dataSources, date);
        });

        $(document).bind("event-types-initialized", function (e, eventTypes, date) {
            var eventLayerAccordion = new EventLayerAccordion('#eventLayerAccordion', eventTypes, date);
        });

        this._super("#helioviewer-viewport-container-outer", date, marginTop, marginBottom);
    },

    /**
     * Adds a movie to the user's history and displays the movie
     *
     * @param string movieId Identifier of the movie to be shown
     */
    loadMovie: function (movieId) {
        if (!this._movieManagerUI.has(movieId)) {
            this._movieManagerUI.addMovieUsingId(movieId);
        } else {
            this._movieManagerUI.playMovie(movieId);
        }
    },

    /**
     * @description Sets up event-handlers for dialog components
     */
    _setupDialogs: function () {
        var self = this;

        // About dialog
        this._setupDialog("#helioviewer-about", "#about-dialog", {
            "title"  : "Helioviewer - About",
            "height" : 400
        });

        // Keyboard shortcuts dialog
        this._setupDialog("#helioviewer-usage", "#usage-dialog", {
            "title": "Helioviewer - Usage Tips"
        });

        // Settings dialog
        this._setupDialog("#settings-button", "#settings-dialog", {
            "buttons": {
                "Ok": function () {
                    $(this).dialog("close");
                }
            },
            "title": "Helioviewer - Settings",
            "width": 400,
            "height": 'auto',
            "resizable": false,
            "create": function (e) {

            }
        });
    },

    /**
     * Sets up event handlers for a single dialog
     */
    _setupDialog: function (btn, dialog, options, onLoad) {
        // Default options
        var defaults = {
            title     : "Helioviewer.org",
            autoOpen  : true,
            draggable : true,
            width     : 480,
            height    : 400
        };

        // Button click handler
        $(btn).click(function () {
            var d   = $(dialog),
                btn = $(this);

            if (btn.hasClass("dialog-loaded")) {
                if (d.dialog('isOpen')) {
                    d.dialog('close');
                }
                else {
                    d.dialog('open');
                }
            } else {
                d.load(this.href, onLoad).dialog($.extend(defaults, options));
                btn.addClass("dialog-loaded");
            }
            return false;
        });
    },

    /**
     * Enables some debugging helpers that display extra information to help
     * during development
     */
    _showDebugHelpers: function () {
        var dimensions, win = $(window);

        dimensions = $("<div id='debug-dimensions'></div>").appendTo("body");

        win.resize(function (e) {
            dimensions.html(win.width() + "x" + win.height());
        });
    },

    /**
     * Configures the user settings form to match the stored values and
     * initializes event-handlers
     */
    _setupSettingsUI: function () {
        var form, dateLatest, datePrevious, autorefresh, self = this;

        form         = $("#helioviewer-settings");
        dateLatest   = $("#settings-date-latest");
        datePrevious = $("#settings-date-previous");
        autorefresh  = $("#settings-latest-image");

        // Starting date
        if (Helioviewer.userSettings.get("options.date") === "latest") {
            dateLatest.attr("checked", "checked");
        } else {
            datePrevious.attr("checked", "checked");
        }

        // Auto-refresh
        if (Helioviewer.userSettings.get("options.autorefresh")) {
            autorefresh.attr("checked", "checked");
            this.timeControls.enableAutoRefresh();
        } else {
            autorefresh.removeAttr("checked");
            this.timeControls.disableAutoRefresh();
        }

        // Event-handlers
        dateLatest.change(function (e) {
            Helioviewer.userSettings.set("options.date", "latest");
        });
        datePrevious.change(function (e) {
            Helioviewer.userSettings.set("options.date", "previous");
        });
        autorefresh.change(function (e) {
            Helioviewer.userSettings.set("options.autorefresh", e.target.checked);
            if (e.target.checked) {
                self.timeControls.enableAutoRefresh();
            } else {
                self.timeControls.disableAutoRefresh();
            }
        });

    },

    /**
     * @description Initialize event-handlers for UI components controlled by the Helioviewer class
     */
    _initEventHandlers: function () {
        var self = this,
            msg  = "Link directly to the current state of Helioviewer:",
            btns;


        $(document).bind('update-external-datasource-integration', $.proxy(this.updateExternalDataSourceIntegration, this));

        $('#accordion-vso input[type=text]').bind('change', $.proxy(this.updateExternalDataSourceIntegration, this));

        $('#accordion-sdo input[type=text]').bind('change', $.proxy(this.updateExternalDataSourceIntegration, this));

        $('.drawer-tab', this.drawerLeft).bind('click', $.proxy(this.drawerLeftClick, this));
        this.drawerLeft.bind('mouseover', function (event) { event.stopPropagation(); });

        $('#news-button').bind('click', $.proxy(this.drawerNewsClick, this));
        $('#youtube-button').bind('click', $.proxy(this.drawerYoutubeClick, this));
        $('#movies-button').bind('click', $.proxy(this.drawerMoviesClick, this));
        $('#screenshots-button').bind('click', $.proxy(this.drawerScreenshotsClick, this));
        $('#data-button').bind('click', $.proxy(this.drawerDataClick, this));
        $('#share-button').bind('click', $.proxy(this.drawerShareClick, this));

        $('.drawer-contents .header').bind('click', $.proxy(this.accordionHeaderClick, this));
        $('.contextual-help').bind('click', $.proxy(this.contextualHelpClick, this));
        $(document).bind("updateHeightsInsideViewportContainer", $.proxy(this.updateHeightsInsideViewportContainer, this));


        $('#link-button').click(function (e) {
            // Google analytics event
            if (typeof(_gaq) !== "undefined") {
                _gaq.push(['_trackEvent', 'Shares', 'Homepage - URL']);
            }
            self.displayURL(self.toURL(), msg);
        });


        // Highlight both text and icons for text buttons

        btns = $("#social-buttons .text-btn, " +
                 "#movie-manager-container .text-btn, " +
                 "#image-area-select-buttons > .text-btn, " +
                 "#screenshot-manager-container .text-btn, " +
                 "#event-container .text-btn");
        btns.live("mouseover",
            function () {
                $(this).find(".ui-icon").addClass("ui-icon-hover");
            });
        btns.live("mouseout",
            function () {
                $(this).find(".ui-icon").removeClass("ui-icon-hover");
            });

        // Fix drag and drop for mobile browsers
        $("#helioviewer-viewport, .ui-slider-handle").each(function () {
            assignTouchHandlers(this);
        });

        $("#helioviewer-url-shorten").click(function (e) {
            var url;

            if (e.target.checked) {
                url = $("#helioviewer-short-url").attr("value");
            } else {
                url = $("#helioviewer-long-url").attr("value");
            }

            $("#helioviewer-url-input-box").attr('value', url).select();
        });

        $('#facebook-button').bind('click', $.proxy(this.facebook, this));
        $('#pinterest-button').bind('click', $.proxy(this.pinterest, this));
    },

    /**
     * displays a dialog containing a link to the current page
     * @param {Object} url
     */
    displayURL: function (url, msg) {
        // Get short URL before displaying
        var callback = function (response) {
            $("#helioviewer-long-url").attr("value", url);
            $("#helioviewer-short-url").attr("value", response.data.url);

            // Display URL
            $("#helioviewer-url-box-msg").text(msg);
            $("#url-dialog").dialog({
                dialogClass: 'helioviewer-modal-dialog',
                height    : 125,
                maxHeight : 125,
                width     : $('html').width() * 0.5,
                minWidth  : 350,
                modal     : true,
                resizable : true,
                title     : "Helioviewer - Direct Link",
                open      : function (e) {
                    $("#helioviewer-url-shorten").removeAttr("checked");
                    $('.ui-widget-overlay').hide().fadeIn();
                    $("#helioviewer-url-input-box").attr('value', url).select();
                }
            });
        };

        // Get short version of URL and open dialog
        $.ajax({
            url: Helioviewer.api,
            dataType: Helioviewer.dataType,
            data: {
                "action": "shortenURL",
                "queryString": url.substr(this.serverSettings.rootURL.length + 2)
            },
            success: callback
        });
    },


    /**
     * Displays a URL to a Helioviewer.org movie
     *
     * @param string Id of the movie to be linked to
     */
    displayMovieURL: function (movieId) {
        var msg = "Use the following link to refer to this movie:",
            url = this.serverSettings.rootURL + "/?movieId=" + movieId;

        // Google analytics event
        if (typeof(_gaq) !== "undefined") {
            _gaq.push(['_trackEvent', 'Shares', 'Movie - URL']);
        }
        this.displayURL(url, msg);
    },

    /**
     * Displays recent news from the Helioviewer Project blog
     */
    displayBlogFeed: function (n, showDescription, descriptionWordLength) {
        var url, dtype, html = "";

        url = this.serverSettings.newsURL;

        // For remote queries, retrieve XML using JSONP
        if (Helioviewer.dataType === "jsonp") {
            dtype = "jsonp text xml";
        } else {
            dtype = "xml";
        }

        $.getFeed({
            url: Helioviewer.api,
            data: {"action": "getNewsFeed"},
            dataType: dtype,
            success: function (feed) {
                var link, date, more, description;

                // Display message if there was an error retrieving the feed
                if (!feed.items) {
                    $("#social-panel").append("Unable to retrieve news feed...");
                    return;
                }

                // Grab the n most recent articles
                $.each(feed.items.slice(0, n), function (i, a) {
                    link = "<a href='" + a.link + "' alt='" + a.title + "' target='_blank'>" + a.title + "</a><br />";
                    date = "<div class='article-date'>" + a.updated.slice(0, 26) + "UTC</div>";
                    html += "<div class='blog-entry'>" + link + date;

                    // Include description?
                    if (showDescription) {
                        description = a.description;

                        // Shorten if requested
                        if (typeof descriptionWordLength === "number") {
                            description = description.split(" ").slice(0, descriptionWordLength).join(" ") + " [...]";
                        }
                        html += "<div class='article-desc'>" + description + "</div>";
                    }

                    html += "</div>";
                });

                more = "<div id='more-articles'><a href='" + url +
                       "' title='The Helioviewer Project Blog'>Visit Blog...</a></div>";

                $("#social-panel").append(html + more);
            }
        });
    },

    /**
     * Launches an instance of JHelioviewer
     *
     * Helioviewer attempts to choose a 24-hour window around the current observation time. If the user is
     * currently browsing near the end of the available data then the window for which the movie is created
     * is shifted backward to maintain it's size.
     */
    launchJHelioviewer: function () {
        var endDate, params;

        // If currently near the end of available data, shift window back
        endDate = new Date(Math.min(this.timeControls.getDate().addHours(12), new Date()));

        params = {
            "action"    : "launchJHelioviewer",
            "endTime"   : endDate.toISOString(),
            "startTime" : endDate.addHours(-24).toISOString(),
            "imageScale": this.viewport.getImageScaleInKilometersPerPixel(),
            "layers"    : this.viewport.serialize()
        };
        window.open(Helioviewer.api + "?" + $.param(params), "_blank");
    },

    /**
     * Displays welcome message on user's first visit
     */
    _displayGreeting: function () {
        if (!Helioviewer.userSettings.get("notifications.welcome")) {
            return;
        }

        $(document).trigger("message-console-info",
            ["<b>Welcome to Helioviewer.org</b>, a solar data browser. First time here? Be sure to check out our " +
             "<a href=\"http://wiki.helioviewer.org/wiki/Helioviewer.org_User_Guide_2.4.0\" " +
             "class=\"message-console-link\" target=\"_blank\"> User Guide</a>.</br>", {sticky: true}]
        );

        Helioviewer.userSettings.set("notifications.welcome", false);
    },

    /**
     * Returns the current observation date
     *
     * @return {Date} observation date
     */
    getDate: function () {
        return this.timeControls.getDate();
    },

    /**
     * Returns the currently loaded layers
     *
     * @return {String} Serialized layer string
     */
    getLayers: function () {
        return this.viewport.serialize();
    },

    /**
     * Returns the currently selected event layers
     *
     * @return {String} Serialized event layer string
     */
    getEvents: function () {
        return this.viewport.serializeEvents();
    },

    /**
     * Returns the currently selected event layers
     *
     * @return {String} Serialized event layer string
     */
    getEventsLabels: function () {
        return Helioviewer.userSettings.get("state.eventLabels");
    },

    /**
     * Returns a string representation of the layers which are visible and
     * overlap the specified region of interest
     */
    getVisibleLayers: function (roi) {
        return this.viewport.getVisibleLayers(roi);
    },

    /**
     * Returns the currently displayed image scale
     *
     * @return {Float} image scale in arc-seconds/pixel
     */
    getImageScale: function () {
        return this.viewport.getImageScale();
    },

    /**
     * Returns the top-left and bottom-right coordinates for the viewport region of interest
     *
     * @return {Object} Current ROI
     */
    getViewportRegionOfInterest: function () {
        return this.viewport.getRegionOfInterest();
    },

    /**
     * Builds a URL for the current view
     *
     * @TODO: Add support for viewport offset, event layers, opacity
     *
     * @returns {String} A URL representing the current state of Helioviewer.org.
     */
    toURL: function (shorten) {
        // URL parameters
        var params = {
            "date"        : this.viewport._tileLayerManager.getRequestDateAsISOString(),
            "imageScale"  : this.viewport.getImageScale(),
            "centerX"     : Helioviewer.userSettings.get("state.centerX"),
            "centerY"     : Helioviewer.userSettings.get("state.centerY"),
            "imageLayers" : encodeURI(this.viewport.serialize()),
            "eventLayers" : encodeURI(this.viewport.serializeEvents()),
            "eventLabels" : Helioviewer.userSettings.get("state.eventLabels")
        };

        return this.serverSettings.rootURL + "/?" + decodeURIComponent($.param(params));
    },


    drawerLeftClick: function(openNow) {
        var self = this;

        if ( this.drawerLeftOpened || openNow === false ) {
            this.drawerLeft.css('width', 0);
            // $('.drawer-tab-left', this.drawerLeft.parent()).css('left', 0);
            $('.drawer-contents', this.drawerLeft).hide();
            this.drawerLeft.css('padding', 0);
            this.updateHeightsInsideViewportContainer();

            this.drawerLeftOpened = false;
        }
        else if ( !this.drawerLeftOpened || openNow === true ) {
            this.drawerLeft.css('width', this.drawerLeftOpenedWidth);
            $(this.drawerLeft.parent()).css('left', this.drawerLeftOpenedWidth);
            setTimeout(function () {
                $('.drawer-contents', this.drawerLeft).show();
                self.updateHeightsInsideViewportContainer();
            }, this.drawerSpeed);

            this.drawerLeftOpened = true;
        }

        return;
    },

    drawerNewsClick: function() {
        var self = this,
            buttonId = '#news-button';

        this.closeTabDrawersExcept(buttonId, '#'+this.drawerNews.attr('id'));

        if ( $(buttonId).hasClass('opened') ) {
            $('.drawer-contents', self.drawerNews).fadeOut(100);
            self.drawerNews.css('height', 0);
            self.drawerNews.css('padding', 0);
            self.drawerNews.hide();
            self.updateHeightsInsideViewportContainer();
            $(buttonId).removeClass('opened');
        }
        else if ( !$(buttonId).hasClass('opened') ) {
            self.drawerNews.css('height', self.drawerNewsOpenedHeight);
            setTimeout(function () {
                self.drawerNews.show();
                $('.drawer-contents', self.drawerNews).fadeIn(500);
                self.updateHeightsInsideViewportContainer();
            }, self.drawerSpeed);
            $(buttonId).addClass('opened');
        }

        return;
    },

    drawerYoutubeClick: function() {
        var self = this,
            buttonId = '#youtube-button';

        this.closeTabDrawersExcept(buttonId, '#'+this.drawerYoutube.attr('id'));

        if ( $(buttonId).hasClass('opened') ) {
            $('.drawer-contents', this.drawerYoutube).fadeOut(100);
            this.drawerYoutube.css('height', 0);
            this.drawerYoutube.css('padding', 0);
            this.drawerYoutube.css({'display':'none'});
            this.updateHeightsInsideViewportContainer();
            $(buttonId).removeClass('opened');
        }
        else if ( !$(buttonId).hasClass('opened') ) {
            this.drawerYoutube.css('height', this.drawerYoutubeOpenedHeight);
            setTimeout(function () {
                self.drawerYoutube.show();
                $('.drawer-contents', this.drawerYoutube).fadeIn(500);
                self.updateHeightsInsideViewportContainer();
            }, this.drawerSpeed);
            $(buttonId).addClass('opened');
        }

        return;
    },

    drawerMoviesClick: function() {
        var self = this,
            buttonId = '#movies-button';

        this.closeTabDrawersExcept(buttonId, '#'+this.drawerMovies.attr('id'));

        if ( $(buttonId).hasClass('opened') ) {
            $('.drawer-contents', this.drawerMovies).fadeOut(100);
            this.drawerMovies.css('height', 0);
            this.drawerMovies.css('padding', 0);
            this.drawerMovies.css({'display':'none'});
            this.updateHeightsInsideViewportContainer();
            $(buttonId).removeClass('opened');
        }
        else if ( !$(buttonId).hasClass('opened') ) {
            this.drawerMovies.css('height', this.drawerMoviesOpenedHeight);
            setTimeout(function () {
                self.drawerMovies.show();
                $('.drawer-contents', this.drawerMovies).fadeIn(500);
                self.updateHeightsInsideViewportContainer();
            }, this.drawerSpeed);
            $(buttonId).addClass('opened');
        }

        return;
    },

    drawerScreenshotsClick: function() {
        var self = this,
            buttonId = '#screenshots-button';

        this.closeTabDrawersExcept(buttonId, '#'+this.drawerScreenshots.attr('id'));

        if ( $(buttonId).hasClass('opened') ) {
            $('.drawer-contents', this.drawerScreenshots).fadeOut(100);
            this.drawerScreenshots.css('height', 0);
            this.drawerScreenshots.css('padding', 0);
            this.drawerScreenshots.css({'display':'none'});
            this.updateHeightsInsideViewportContainer();
            $(buttonId).removeClass('opened');
        }
        else if ( !$(buttonId).hasClass('opened') ) {
            this.drawerScreenshots.css('height', this.drawerScreenshotsOpenedHeight);
            setTimeout(function () {
                self.drawerScreenshots.show();
                $('.drawer-contents', this.drawerScreenshots).fadeIn(500);
                self.updateHeightsInsideViewportContainer();
            }, this.drawerSpeed);
            $(buttonId).addClass('opened');
        }

        return;
    },

    drawerDataClick: function() {
        var self = this,
            buttonId = '#data-button';

        this.closeTabDrawersExcept(buttonId, '#'+this.drawerData.attr('id'));

        if ( $(buttonId).hasClass('opened') ) {
            $('.drawer-contents', this.drawerData).fadeOut(100);
            this.drawerData.css('height', 0);
            this.drawerData.css('padding', 0);
            this.drawerData.css({'display':'none'});
            this.updateHeightsInsideViewportContainer();
            $(buttonId).removeClass('opened');
        }
        else if ( !$(buttonId).hasClass('opened') ) {
            this.drawerData.css('height', this.drawerDataOpenedHeight);
            setTimeout(function () {
                self.drawerData.show();
                $('.drawer-contents', this.drawerData).fadeIn(500);
                self.updateHeightsInsideViewportContainer();
            }, this.drawerSpeed);
            $(buttonId).addClass('opened');
        }

        return;
    },

    drawerShareClick: function() {
        var self = this,
            buttonId = '#share-button';

        this.closeTabDrawersExcept(buttonId, '#'+this.drawerShare.attr('id'));

        if ( $(buttonId).hasClass('opened') ) {
            $('.drawer-contents', this.drawerShare).fadeOut(100);
            this.drawerShare.css('height', 0);
            this.drawerShare.css('padding', 0);
            this.drawerShare.css({'display':'none'});
            this.updateHeightsInsideViewportContainer();
            $(buttonId).removeClass('opened');
        }
        else if ( !$(buttonId).hasClass('opened') ) {
            this.drawerShare.css('height', this.drawerShareOpenedHeight);
            setTimeout(function () {
                self.drawerShare.show();
                $('.drawer-contents', this.drawerShare).fadeIn(500);
                self.updateHeightsInsideViewportContainer();
            }, this.drawerSpeed);
            $(buttonId).addClass('opened');
        }

        return;
    },

    updateHeightsInsideViewportContainer: function() {
        var newHeight, sidebars, windowHeight = parseInt($(window).height()),
            header, viewport, drawerLeft;

        header       = $('#helioviewer-header');
        viewport     = $('#helioviewer-viewport');
        drawerLeft   = $('#helioviewer-drawer-left');

        sidebars = [drawerLeft];

        $.each(sidebars, function(i, sidebar) {
            newHeight = windowHeight
                      - parseInt(header.css('border-top-width'))
                      - parseInt(header.css('margin-top'))
                      - parseInt(header.css('padding-top'))
                      - parseInt(header.css('height'))
                      - parseInt(header.css('padding-bottom'))
                      - parseInt(header.css('margin-bottom'))
                      - parseInt(header.css('border-bottom-width'))
                      - parseInt(sidebar.css('border-top-width'))
                      - parseInt(sidebar.css('margin-top'))
                      - parseInt(sidebar.css('padding-top'))
                      - parseInt(sidebar.css('padding-bottom'))
                      - parseInt(sidebar.css('margin-bottom'))
                      - parseInt(sidebar.css('border-bottom-width'));
            sidebar.css('height', newHeight);
        });

        newHeight = windowHeight
                  - parseInt(viewport.css('padding-top'))
                  - parseInt(viewport.css('padding-bottom'));
        $('#helioviewer-viewport').css('height', newHeight);

        newHeight = windowHeight
                  - parseInt($('#helioviewer-header').css('height'));
        $('#helioviewer-viewport-container').css('height', newHeight);
    },


    accordionHeaderClick: function(event) {
        var obj = $(event.target).parent().find('.disclosure-triangle');

        if ( obj.attr('class').indexOf('closed') != -1 ) {
            obj.html('▼');
            obj.addClass('opened');
            obj.removeClass('closed');
            $('.content', obj.parent().parent()).show();
            $('.contextual-help', obj.parent().parent()).show();
        }
        else {
            obj.html('►');
            obj.addClass('closed');
            obj.removeClass('opened');
            $('.content', obj.parent().parent()).hide();
            $('.contextual-help', obj.parent().parent()).hide();
        }

        event.stopPropagation();
    },


    closeTabDrawersExcept: function (buttonId, drawerId) {
        self = this;

        $.each( this.tabbedDrawers, function (i, drawer) {
            if ( drawer != drawerId ) {

                $('.drawer-contents', drawer).fadeOut(100);
                $(drawer).css('height', 0);
                $(drawer).css('padding', 0);
                $(self.tabbedDrawerButtons[drawer]).removeClass('opened');
            }
        });

    },

    contextualHelpClick: function (event) {
        var alertText = $(event.target).attr('title');
        alertText = alertText.replace(/<\/?[^>]+(>|$)/g, "");
        alert( alertText );
        event.stopPropagation();
    },

    twitter: function() {
        self = this;
        $(this).prop('data-url', encodeURIComponent(self.toURL()) );
        $('#twitter-button').bind('click', $.proxy(this.twitter, this));
        return;
    },

    facebook: function(e) {

        var href   = $(e.target).attr('href')
                   + '&u='
                   + encodeURIComponent(this.toURL()),
            target = $(e.target).attr('target');
        e.stopPropagation();

        window.open(href, target);
        return false;
    },

    pinterest: function() {
        self = this;
        $('#pinterest-button').unbind('click');

        var url = encodeURIComponent(self.toURL());
        var media = encodeURIComponent('http://api.helioviewer.org/v2/downloadScreenshot/?id=3240748');
        var desc = $(this).attr('data-desc')+' '+encodeURIComponent(self.toURL());
        window.open("//www.pinterest.com/pin/create/button/"+
        "?url="+url+
        "&media="+media+
        "&description="+desc, "hv_pinterest");

        $('#pinterest-button').bind('click', $.proxy(this.pinterest, this));
        return;
    },

    updateExternalDataSourceIntegration: function (event) {
        var params         = Array(),
            vsoLinks       = $('#vso-links'),
            vsoPreviews    = $('#vso-previews'),
            vsoButtons     = $('#vso-buttons'),
            sdoPreviews    = $('#sdo-previews'),
            sdoButtons     = $('#sdo-buttons'),
            instruments    = Array(),
            wavesAll       = Array(),
            wavesSDO       = Array(),
            sourceIDsAll   = Array(),
            sourceIDsSDO   = Array(),
            startDate,
            endDate,
            vport,
            imageScale,
            x0, y0, width, height,
            x1, y1, x2, y2,
            width, height,
            jGrowlOpts = {sticky:true, header:'Just now'},
            url, body,
            self = this;

        vport = this.viewport.getViewportInformation();

        // Arc seconds per pixel
        imageScale = vport['imageScale'];

        // Arc seconds
        x1 = vport['coordinates']['left']   * vport['imageScale'];
        x2 = vport['coordinates']['right']  * vport['imageScale'];
        y1 = vport['coordinates']['top']    * vport['imageScale'];
        y2 = vport['coordinates']['bottom'] * vport['imageScale'];
        x0 = (x1 + x2) / 2;
        y0 = (y1 + y2) / 2;
        width  =  (  vport['coordinates']['right']
                   - vport['coordinates']['left'] ) * imageScale;
        height = (  vport['coordinates']['bottom']
                  - vport['coordinates']['top'] )   * imageScale;


        // If this method is triggered by a change to the Tile Layer dates,
        // then update the values in the export tool.
        // (Otherwise, user updated the export dates themselves)
        if ( event['type'] == 'update-external-datasource-integration' ) {
            $('#vso-start-date').val(
            this.viewport.getEarliestLayerDate().toUTCDateString());
            $('#vso-start-time').val(
                this.viewport.getEarliestLayerDate().toUTCTimeString());
            $('#vso-end-date').val(
                this.viewport.getLatestLayerDate().toUTCDateString());
            $('#vso-end-time').val(
                this.viewport.getLatestLayerDate().toUTCTimeString());

            $('#sdo-start-date').val(
                this.viewport.getEarliestLayerDate().toUTCDateString());
            $('#sdo-start-time').val(
                this.viewport.getEarliestLayerDate().toUTCTimeString());
            $('#sdo-end-date').val(
                this.viewport.getLatestLayerDate().toUTCDateString());
            $('#sdo-end-time').val(
                this.viewport.getLatestLayerDate().toUTCTimeString());

            $('#sdo-center-x').val( x0.toFixed(2) );
            $('#sdo-center-y').val( y0.toFixed(2) );

            $('#sdo-width').val(width.toFixed(2));
            $('#sdo-height').val(height.toFixed(2));
        }

        // Remove Old Links
        vsoLinks.html('');

        // Remove Old Previews
        vsoPreviews.html('');
        sdoPreviews.html('');

        // Disable Buttons
        $.each( vsoButtons.children(), function (i, button) {
            button = $(button);
            button.removeAttr('href');
            button.unbind('click');
            button.addClass('inactive');
        });
        $.each( sdoButtons.children(), function (i, button) {
            button = $(button);
            button.removeAttr('href');
            button.unbind('click');
            button.addClass('inactive');
        });

        $.each( $('#accordion-images .dynaccordion-section'), function(i,accordion) {

            var html, url, nickname,
                sourceId, hardcodedScale, imageLayer;

            nickname  = $(accordion).find('.tile-accordion-header-left').html();
            sourceId  = $(accordion).find('.tile-accordion-header-left').attr('data-sourceid');
            date      = $(accordion).find('.timestamp').html();


            startDate = $('#vso-start-date').val()
                      + 'T'
                      + $('#vso-start-time').val()
                      + 'Z';
            endDate   = $('#vso-end-date').val()
                      + 'T'
                      + $('#vso-end-time').val()
                      + 'Z';

            imageLayer = '['+sourceId+',1,100]';
            sourceIDsAll.push(sourceId);
            instruments.push(nickname.split(' ')[0]);
            if ( parseInt(nickname.split(' ')[1], 10) ) {
                wavesAll.push(parseInt(nickname.split(' ')[1], 10));
            }

            url  = 'http://virtualsolar.org/cgi-bin/vsoui.pl'
                 + '?startyear='   + startDate.split('/')[0]
                 + '&startmonth='  + startDate.split('/')[1]
                 + '&startday='    + startDate.split('/')[2].split('T')[0]
                 + '&starthour='   + startDate.split('T')[1].split(':')[0]
                 + '&startminute=' + startDate.split('T')[1].split(':')[1]
                 + '&endyear='     + endDate.split('/')[0]
                 + '&endmonth='    + endDate.split('/')[1]
                 + '&endday='      + endDate.split('/')[2].split('T')[0]
                 + '&endhour='     + endDate.split('T')[1].split(':')[0]
                 + '&endminute='   + endDate.split('T')[1].split(':')[1]
                 + '&instrument='  + nickname.split(' ')[0];
            if ( parseInt(nickname.split(' ')[1], 10) ) {
                url += '&wave='        + 'other'
                    +  '&wavemin='     + nickname.split(' ')[1]
                    + '&wavemax='     + nickname.split(' ')[1]
                    + '&waveunit='    + 'Angstrom';
            }

            html = '<a href="' + url + '" target="_blank">'
                 + nickname
                 + ' '
                 + date
                 + ' UTC <i class="fa fa-external-link-square fa-fw"></i></a>';
            vsoLinks.append(html);

            hardcodedScale = '10';
            if ( nickname.toUpperCase() == 'LASCO C2' ) {
                hardcodedScale = '50';
            }
            else if ( nickname.toUpperCase() == 'LASCO C3' ) {
                hardcodedScale = '250';
            }
            else if ( nickname.toUpperCase() == 'COR1-A' ) {
                hardcodedScale = '35';
            }
            else if ( nickname.toUpperCase() == 'COR1-B' ) {
                hardcodedScale = '35';
            }
            else if ( nickname.toUpperCase() == 'COR2-A' ) {
                hardcodedScale = '130';
            }
            else if ( nickname.toUpperCase() == 'COR2-B' ) {
                hardcodedScale = '130';
            }

            html = '';
            html = '<div class="header">'
                 // +     '<input type="checkbox" checked /> '
                 +     nickname
                 + '</div>'
                 + '<div class="previews">'
                 +     '<img src="http://api.helioviewer.org/v2/takeScreenshot/?'
                 + 'imageScale=' + hardcodedScale
                 + '&layers=[' + sourceId + ',1,100]'
                 + '&events=&eventLabels=false'
                 + '&scale=false&scaleType=earth&scaleX=0&scaleY=0'
                 + '&date=' + startDate
                 + '&x0=0&y0=0&width=256&height=256&display=true&watermark=false" class="preview start" /> '
                 +     '<img src="http://api.helioviewer.org/v2/takeScreenshot/?'
                 + 'imageScale=' + hardcodedScale
                 + '&layers=[' + sourceId + ',1,100]'
                 + '&events=&eventLabels=false'
                 + '&scale=false&scaleType=earth&scaleX=0&scaleY=0'
                 + '&date=' + endDate
                 + '&x0=0&y0=0&width=256&height=256&display=true&watermark=false" class="preview end" /> '
                 + '</div>';
            vsoPreviews.append(html);


            if ( nickname.search('AIA ') != -1 ||
                 nickname.search('HMI ') != -1 ) {

                startDate = $('#sdo-start-date').val()
                          + 'T'
                          + $('#sdo-start-time').val()
                          + 'Z';
                endDate   = $('#sdo-end-date').val()
                          + 'T'
                          + $('#sdo-end-time').val()
                          + 'Z';

                sourceIDsSDO.push(sourceId);

                wavesSDO.push(nickname.split(' ')[1].padLeft('0',3));

                html = '';
                html = '<div class="header">'
                     // +     '<input type="checkbox" checked /> '
                     +     nickname
                     + '</div>'
                     + '<div class="previews">'
                     +     '<img src="http://api.helioviewer.org/v2/takeScreenshot/?'
                     + 'imageScale=' + imageScale
                     + '&layers=' + imageLayer
                     + '&events=&eventLabels=false'
                     + '&scale=false&scaleType=earth&scaleX=0&scaleY=0'
                     + '&date=' + startDate
                     + '&x0=' + $('#sdo-center-x').val()
                     + '&y0=' + $('#sdo-center-y').val()
                     + '&width=' + Math.round($('#sdo-width').val()/imageScale)
                     + '&height=' + Math.round($('#sdo-height').val()/imageScale)
                     + '&display=true&watermark=false" class="preview start" '
                     + 'style="width:' + 128 + '; '
                     +        'height:' + Math.round(128/(width/height)) + ';"'
                     + ' />'
                     +     '<img src="http://api.helioviewer.org/v2/takeScreenshot/?'
                     + 'imageScale=' + imageScale
                     + '&layers=' + imageLayer
                     + '&events=&eventLabels=false'
                     + '&scale=false&scaleType=earth&scaleX=0&scaleY=0'
                     + '&date=' + endDate
                     + '&x0=' + $('#sdo-center-x').val()
                     + '&y0=' + $('#sdo-center-y').val()
                     + '&width=' + Math.round($('#sdo-width').val()/imageScale)
                     + '&height=' + Math.round($('#sdo-height').val()/imageScale)
                     + '&display=true&watermark=false" class="preview end" '
                     + 'style="width:' + 128 + '; '
                     +        'height:' + Math.round(128/(width/height)) + ';"'
                     + ' />'
                     + '</div>';
                sdoPreviews.append(html);
            }

        });


        startDate = $('#vso-start-date').val().replace(/\//g,'-')
                  + 'T'
                  + $('#vso-start-time').val()
                  + 'Z';
        endDate   = $('#vso-end-date').val().replace(/\//g,'-')
                  + 'T'
                  + $('#vso-end-time').val()
                  + 'Z';


        // VSO SunPy Script Button
        $('#vso-sunpy').removeClass('inactive');
        $('#vso-sunpy').bind('click', function (e) {
            url = Helioviewer.api + '/'
                + '?action=getSciDataScript'
                + '&imageScale=' + imageScale
                + '&sourceIds=[' + sourceIDsAll.join(',')+']'
                + '&startDate=' + startDate
                + '&endDate=' + endDate
                + '&lang=sunpy'
                + '&provider=vso';
            body = '<a href="' + url + '">'
                 +     'Your Python/SunPy script for requesting science data '
                 +     'from the VSO is ready.<br /><br />'
                 +     '<b>Click here to download.</b>'
                 + '</a>';
            $(document).trigger("message-console-log",
                                [body, jGrowlOpts, true, true]);
        });


        // VSO SolarSoft Script Button
        $('#vso-ssw').removeClass('inactive');
        $('#vso-ssw').bind('click', function (e) {
            url = Helioviewer.api + '/'
                + '?action=getSciDataScript'
                + '&imageScale=' + imageScale
                + '&sourceIds=[' + sourceIDsAll.join(',')+']'
                + '&startDate=' + startDate
                + '&endDate=' + endDate
                + '&lang=sswidl'
                + '&provider=vso'
                + '&x1=' + x1
                + '&y1=' + y1
                + '&x2=' + x2
                + '&y2=' + y2;
            body = '<a href="' + url + '">'
                 +     'Your IDL/SolarSoft script for requesting science data '
                 +     'from the VSO is ready.<br /><br />'
                 +     '<b>Click here to download.</b>'
                 + '</a>';
            $(document).trigger("message-console-log",
                                [body, jGrowlOpts, true, true]);
        });

        // VSO Website Button
        $('#vso-www').attr('href', 'http://virtualsolar.org/cgi-bin/vsoui.pl'
            + '?startyear='   +   startDate.split('-')[0]
            + '&startmonth='  +   startDate.split('-')[1]
            + '&startday='    +   startDate.split('-')[2].split('T')[0]
            + '&starthour='   +   startDate.split('T')[1].split(':')[0]
            + '&startminute=' +   startDate.split('T')[1].split(':')[1]
            + '&endyear='     +     endDate.split('-')[0]
            + '&endmonth='    +     endDate.split('-')[1]
            + '&endday='      +     endDate.split('-')[2].split('T')[0]
            + '&endhour='     +     endDate.split('T')[1].split(':')[0]
            + '&endminute='   +     endDate.split('T')[1].split(':')[1]
            + '&instrument='  + instruments.join('&instrument=')
            + '&wave='        +            'other'
            + '&wavemin='     +    Math.min.apply(Math,wavesAll)
            + '&wavemax='     +    Math.max.apply(Math,wavesAll)
            + '&waveunit='    +            'Angstrom'
        );
        $('#vso-www').removeClass('inactive');



        if ( wavesSDO.length > 0 ) {

            // SDO SolarSoft Script Button
            $('#sdo-ssw').removeClass('inactive');
            $('#sdo-ssw').bind('click', function (e) {
                url = Helioviewer.api+'/'
                + '?action=getSciDataScript'
                + '&imageScale=' + imageScale
                + '&sourceIds=[' + sourceIDsSDO.join(',')+']'
                + '&startDate=' + startDate
                + '&endDate=' + endDate
                + '&lang=sswidl'
                + '&provider=sdo'
                + '&x1=' + x1
                + '&y1=' + y1
                + '&x2=' + x2
                + '&y2=' + y2;
                body = '<a href="' + url + '">'
                     +     'Your IDL/SolarSoft script for requesting science '
                     +     'data from the AIA/HMI Cut-out Serivce is ready.'
                     +     '<br /><br />'
                     +     '<b>Click here to download.</b>'
                     + '</a>';
                $(document).trigger("message-console-log",
                                    [body, jGrowlOpts, true, true]);
            });

            // SDO Website Button
            $('#sdo-www').attr('href', 'http://www.lmsal.com/get_aia_data/'
                + '?width='  + $('#sdo-width').val()
                + '&height=' + $('#sdo-height').val()
                + '&xCen='   +  $('#sdo-center-x').val()
                + '&yCen='   + ($('#sdo-center-y').val()*-1)
                + '&wavelengths=' + wavesSDO.join(',')
                + '&startDate=' + $('#vso-start-date').val().replace(/\//g,'-')
                + '&startTime=' + $('#vso-start-time').val().slice(0,-3)
                + '&stopDate='  + $('#vso-end-date').val().replace(/\//g,'-')
                + '&stopTime='  + $('#vso-end-time').val().slice(0,-3)
                + '&cadence=12'
            );
            $.each( $('#accordion-sdo').find('.label, .suffix'), function (i, text) {
                $(text).removeClass('inactive');
            });
            $.each( $('#accordion-sdo').find('input[disabled]'), function (i, input) {
                $(input).attr('disabled', false);
            });
            $('#sdo-www').removeClass('inactive');
        }

    },


    /**
     * Sun-related Constants
     */
    constants: {
        au: 149597870700, // 1 au in meters (http://maia.usno.navy.mil/NSFA/IAU2009_consts.html)
        rsun: 695700000  // radius of the sun in meters (JHelioviewer)
    }
});
