/**
 * @fileOverview Contains the class definition for an UserVideoGallery class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 *
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false,
eqeqeq: true, plusplus: true, bitwise: true, regexp: false, strict: true,
newcap: true, immed: true, maxlen: 80, sub: true */
/*global $, window, Class */
"use strict";
var UserVideoGallery = Class.extend(
    /** @lends UserVideoGallery.prototype */
    {
	observationDateMovies: {},
    /**
     * @constructs
     * @description Creates a new UserVideoGallery component
     */
    init : function (url) {
        this._container   			= $("#user-video-gallery-main");
        this._containerCurrent   	= $("#user-video-gallery-main-current");
        this._noSharedMoviesFound   = $("#user-video-gallery-current .js-no-movies");
        this._loader      			= $("#user-video-gallery-spinner");
        this._loaderCurrent      	= $("#user-video-gallery-spinner-current");

        this._working     = false;

		//create empty container
		$('<div id="movies-container"></div>').appendTo("#moving-container");
		this._moviesContainer      	= $("#movies-container");

        // Feed URL
        this.url = url || Helioviewer.api;

        // Remote (may differ from local due to deleted videos, etc)
        this._numVideos = 20;
        this._numVideosCurrent = 20;

        this._videos = [];
        this._videosCurrent = [];

        this._fetchCurrentVideos();

        // Auto-refresh every couple minutes
        var self = this;

        window.setInterval(function () {
	        if(Helioviewer.userSettings.get("state.drawers.#hv-drawer-youtube.open")){
		        self._checkForNewMovies();
	        }
        }, 120000);

        $(document).on('observation-time-changed', function(e){
	        if(Helioviewer.userSettings.get("state.drawers.#hv-drawer-youtube.open") || Helioviewer.userSettings.get("options.showinviewport")){
	        	self._fetchCurrentVideos();
	        }
        });

        $('#user-video-gallery-current').on('click', '.user-video-label', function(){
	        var rel = $(this).data('time');
	        helioviewerWebClient.timeControls.setDate( new Date(rel).toUTCDate() );
        });

        $('#user-video-gallery-current').on('click', '.user-video-current-show-more', function(){
	        $(this).remove();
	        self._containerCurrent.append(self._loaderCurrent);
	        self._fetchCurrentVideosShowMore();
        });

        $(document).bind("image-scale-changed", $.proxy(this.changeScale, this));

        //Show in viewport button initialization
        if(Helioviewer.userSettings.get("options.showinviewport")){
	        $('#movies-show-in-viewport').prop( "checked", true );
	        this._moviesContainer.show();
        }else{
	        $('#movies-show-in-viewport').prop( "checked", false );
	        this._moviesContainer.hide();
        }

        $('#movies-show-in-viewport').change(function(){
	        if($(this).is(":checked")) {
	            Helioviewer.userSettings.set("options.showinviewport", true);
	            self._moviesContainer.show();
	        }else{
	            Helioviewer.userSettings.set("options.showinviewport", false);
	            self._moviesContainer.hide();
	        }
	    });
    },

    /**
     * Retrieves a single page of video results and displays them to the user
     */
    _fetchCurrentVideos: function () {
        // check if we need to update movies list
        if(this._lastTimeCurrentVideosUpdated == parseInt(Helioviewer.userSettings.get("state.date"))){
	        return;
        }

        // Query parameters
        this._lastTimeCurrentVideosUpdated = parseInt(Helioviewer.userSettings.get("state.date"));
        var params = {
            "action": "getObservationDateVideos",
            "date"   : new Date(this._lastTimeCurrentVideosUpdated).toISOString()
        };
		// Remove old thumbmails
        $('.user-video-thumbnail-container-current').remove();
        $('.user-video-current-show-more').remove();
        this._containerCurrent.find("p, div").remove();

        // Show loading indicator
        this._loaderCurrent.show();

        this._working = true;

        // Fetch videos
        $.get(this.url, params, $.proxy(this._processResponseCurrent, this), Helioviewer.dataType);
    },

    /**
     * Load More videos
     */
    _fetchCurrentVideosShowMore: function () {
        // Query parameters
        this._lastTimeCurrentVideosUpdated = parseInt(Helioviewer.userSettings.get("state.date"));
        var params = {
            "action": "getObservationDateVideos",
            "num"   : this._numVideosCurrent,
            "skip"   : $('.user-video-thumbnail-container-current').length,
            "date"   : new Date(this._lastTimeCurrentVideosUpdated).toISOString()
        };

        // Show loading indicator
        this._loaderCurrent.show();

        this._working = true;

        // Fetch videos
        $.get(this.url, params, $.proxy(this._processResponseCurrent, this), Helioviewer.dataType);
    },

    /**
     * Checks to see if any new movies have been uploaded over the past couple
     * minutes.
     */
    _checkForNewMovies: function () {
        // Query parameters
        var params = {
            "action": "getUserVideos",
            "num"   : this._numVideos
        };

        // Use publish date for last video retrieved
        if (this._videos.length > 0) {
            params.since = this._videos[0].published.replace(" ", "T") + ".000Z";
        }

        // Remove old thumbmails
        this._container.find("p, div").remove();

        this._working = true;

        // Fetch videos
        $.get(this.url, params, $.proxy(this._processResponse, this), Helioviewer.dataType);
    },

    /**
     * Processes response and stores video information locally
     */
    _processResponse: function (response) {
        var videos, error;

        if (response.error) {
            error = "<b>Error:</b> Did you specify a valid YouTube API key in Config.ini?";
            $("#user-video-gallery-main").html(error);
            return;
        }

        // Yahoo Pipes output
        if (response.count) {
            videos = response.value.items;
        } else {
            // Local feed
            videos = response;
        }

        this._videos = videos.concat(this._videos);
        //Updates video gallery to show new entries
        this._buildHTML(this._videos);
    },

    /**
     * Processes response and stores video information locally
     */
    _processResponseCurrent: function (response) {
        var videos, error;

        if (response.error) {
            error = "<b>Error:</b> Did you specify a valid YouTube API key in Config.ini?";
            $("#user-video-gallery-main-current").html(error);
            return;
        }

        // Yahoo Pipes output
        if (response.count) {
            videos = response.value.items;
        } else {
            // Local feed
            videos = response;
        }

        this._videosCurrent = videos;
        //Updates video gallery to show new entries
        this._buildHTMLCurrent(this._videosCurrent);
    },

    /**
     * Builds video gallery HTML
     */
    _buildHTML: function (videos) {
        var html = "", self = this, count = 0;

		this._loader.hide();

        $.each(videos, function (i, vid) {
            var when = new Date.parseUTCDate(vid.published) .getElapsedTime() + ' ago', img = vid.thumbnails['small'], html = '';

			html = "<div class='user-video-thumbnail-container user-video-thumbnail-container-recent'>\
                    	<a target='_blank' href='" + vid.url + "' alt='video thumbnail' id='youtube-movie-current-"+vid.id+"'>\
							<img class='user-video-thumbnail' src='" + img + "' alt='user video thumbnail' />\
                    	</a>\
                    	<div style='text-align: center;'>" + when + "</div>\
                    </div>";

            // Drop tailing line break
			html = html.slice(0, -6);

			self._container.append(html);

			// Create a preview tooltip
			$("#youtube-movie-" + vid.id).qtip({
	            content: {
	                title: {
	                    text: vid.title
	                },
	                text: self._buildPreviewTooltipHTML(vid)
	            },
	            position: {
	                adjust: {
	                    x: -10,
	                    y: -1
	                },
	                my: "right top",
	                at: "left center"
	            },
	            show: {
	                delay: 140
	            }
	        });
	        count++;
        });

		if($('.user-video-thumbnail-container-recent').length == 0){
            this._noSharedMoviesFound.show();
		} else {
            this._noSharedMoviesFound.hide();
        }

        this._working = false;
    },

    /**
     * Builds video gallery HTML
     */
    _buildHTMLCurrent: function (videos) {
        var html = "", self = this, count = 0;

		this._loaderCurrent.hide();
		var currentScale = Helioviewer.userSettings.get("state.imageScale");
		self._moviesContainer.html('');

        $.each(videos, function (i, vid) {
            var img = vid.thumbnails['small'];

			var videoStartDate = new Date(vid.startDate);
			var videoEndDate = new Date(vid.endDate);
			var videoMiddleDate = new Date((videoStartDate.getTime() + videoEndDate.getTime()) / 2);

			//Viewport movie box
			var iconTop = ((vid.roi.top + vid.roi.bottom)/2) / currentScale * vid.imageScale;
			var iconLeft = ((vid.roi.right + vid.roi.left)/2) / currentScale * vid.imageScale;
			var boxTop = vid.roi.top / currentScale * vid.imageScale;
			var boxLeft = vid.roi.left / currentScale * vid.imageScale;
			var boxHeight = vid.roi.height / currentScale * vid.imageScale;
			var boxWidth = vid.roi.width / currentScale * vid.imageScale;
			var title = vid.keywords;
			title = vid.title.substring(0, vid.title.indexOf('('));

			var vidTitle = '<span class="qtip-left user-video-label" data-time="'+videoMiddleDate.getTime()+'" title="Set observation date to '+videoMiddleDate.toDateString()+' '+videoMiddleDate.toTimeString()+' UTC">'+title+' ('+vid.startDate+' '+vid.endDate+'</span>'
							+' <span class="dateSelector" data-tip-pisition="left" data-date-time="'+vid.startDate+'"'
							+' data-date-time-end="'+vid.endDate+'">UTC</span>)';

			self._moviesContainer.append('<a id="youtube-movie-viewport-icon-'+vid.id+'" class="movie-viewport-icon event-label"\
					href="'+ vid.url +'" target="_blank"\
					data-id="'+vid.id+'" data-scale="'+vid.imageScale+'" data-top="'+((vid.roi.top + vid.roi.bottom)/2)+'" data-left="'+((vid.roi.right + vid.roi.left)/2)+'" \
					style="left: '+iconLeft+'px;top: '+iconTop+'px;"><i class="fa fa-video-camera"></i> '+title+'\
				</a>');

	        $("#youtube-movie-viewport-icon-" + vid.id).qtip({
	            content: {
	                title: {
	                    text: vid.title
	                },
	                text: self._buildPreviewTooltipHTML(vid)
	            },
	            show: {
	                delay: 140
	            },
	            position : {
		            //my : 'right center',
					//at : 'left center',
				    viewport: $('#helioviewer-viewport-container-inner'),
				    adjust : {
				        //method: 'none shift',
				        screen : true
				    }
				}
	        });

            html = "<div class='user-video-thumbnail-container user-video-thumbnail-container-current' data-id='"+vid.id+"'>\
                    	<a target='_blank' href='" + vid.url + "' " + "alt='video thumbnail' id='youtube-movie-current-"+vid.id+"'>\
							<img class='user-video-thumbnail' src='" + img + "' alt='user video thumbnail' />\
                    	</a>\
                    	<div style='text-align: center;padding:0px 10px; cursor:pointer' >" + vidTitle + "</div>\
                    </div>";


            // Drop tailing line break
			html = html.slice(0, -6);

			self._containerCurrent.append(html);

			// Create a preview tooltip
			$("#youtube-movie-current-" + vid.id).qtip({
	            content: {
	                title: {
	                    text: vid.title
	                },
	                text: self._buildPreviewTooltipHTML(vid)
	            },
	            position: {
	                adjust: {
	                    x: -10,
	                    y: -1
	                },
	                my: "right top",
	                at: "left center"
	            },
	            show: {
	                delay: 140
	            }
	        });
	        count++;
        });

        if(typeof helioviewerWebClient !== 'undefined'){
	        helioviewerWebClient._timeSelector = new TimeSelector();
        }

		if($('.user-video-thumbnail-container-current').length == 0){
            this._noSharedMoviesFound.show();
		} else {
            this._noSharedMoviesFound.hide();
            if(count == this._numVideosCurrent){
                this._containerCurrent.append('<span class="user-video-current-show-more">SHOW MORE</span>');
            }
        }

	    $('#user-video-gallery-main-current > div').off();
	    $('#user-video-gallery-main-current > div').hover(function(){
            var id = $(this).data('id');
            $('.movie-viewport-icon').hide();
            $('.event-marker').hide();
            $('.event-region').hide();
            $('#youtube-movie-viewport-icon-'+id).show();
        },function(){
            $('.movie-viewport-icon').show();
            $('.event-marker').show();
            $('.event-region').show();
        });

        this._working = false;
    },

    /**
     * Hover event handler
     */
    _onVideoHover: function (event) {
        if (event.type === 'mouseover') {
            $(this).find("img").addClass("video-glow");
        } else {
            $(this).find("img").removeClass("video-glow");
        }
    },

    /**
     * Creates HTML for a preview tooltip with a preview thumbnail,
     * if available, and some basic information about the screenshot or movie
     */
    _buildPreviewTooltipHTML: function (movie) {
        var width, height, thumbnail, html = "";

		var imageScale = parseFloat(movie.imageScale);

        html += "<div style='text-align: center;'>" +
	            	"<img src='" + movie.thumbnails.medium + "' width='95%' alt='preview thumbnail' />" +
	            "</div>" +
	            "<table class='preview-tooltip'>" +
	            	"<tr><td><b>Start:</b></td><td>" + movie.startDate + "</td></tr>" +
					"<tr><td><b>End:</b></td><td>"   + movie.endDate   + "</td></tr>" +
					"<tr><td><b>Scale:</b></td><td>" + imageScale.toFixed(2) + " arcsec/px</td></tr>" +
					"<tr><td><b>Dimensions:</b></td><td>" + movie.width + "x" + movie.height + " px</td></tr>" +
	            "</table>";

        return html;
    },

	changeScale: function (event, imageScale) {
        $('.movie-viewport-icon').each(function(i, obj){
	        var id = $(obj).data('id');
	        var scale = $(obj).data('scale');
	        var iconTop = $(obj).data('top') / imageScale * scale;
			var iconLeft = $(obj).data('left') / imageScale * scale;

			$('#youtube-movie-viewport-icon-'+id).css({
				top: iconTop + 'px',
				left: iconLeft + 'px'
			});
        });
    }
});
