/**
 * @fileOverview Contains the class definition for an Timeline class.
 * @author <a href="mailto:serge.zahniy@nasa.gov">Serge Zahniy</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false,
eqeqeq: true, plusplus: true, bitwise: true, regexp: false, strict: true,
newcap: true, immed: true, maxlen: 80, sub: true */
/*globals $, Class */
"use strict";
var timelineExtremesChanged = false;
var timelineTick = 'minute';
var zoomTickTime = 0;
var isShared = true;
var timelineRes = 'm';
var timelineMouseCoordX = 0;
var timelineMouseCoordY = 0;
var timelineMouseValueX = 0;
var timelineMouseValueY = 0;

$(function () {
	
		/**
	 * Highcharts X-range series plugin
	 */
	(function (H) {
		var defaultPlotOptions = H.getOptions().plotOptions,
			columnType = H.seriesTypes.column,
			each = H.each;

		defaultPlotOptions.xrange = H.merge(defaultPlotOptions.column, {});
		H.seriesTypes.xrange = H.extendClass(columnType, {
			type: 'xrange',
			parallelArrays: ['x', 'x2', 'y'],
			animate: H.seriesTypes.line.prototype.animate,

			/**
			 * Borrow the column series metrics, but with swapped axes. This gives free access
			 * to features like groupPadding, grouping, pointWidth etc.
			 */  
			getColumnMetrics: function () {
				var metrics,
					chart = this.chart,
					swapAxes = function () {
						each(chart.series, function (s) {
							var xAxis = s.xAxis;
							s.xAxis = s.yAxis;
							s.yAxis = xAxis;
						});
					};

				swapAxes();

				this.yAxis.closestPointRange = 1;
				metrics = columnType.prototype.getColumnMetrics.call(this);

				swapAxes();
				
				return metrics;
			},
			translate: function () {
				columnType.prototype.translate.apply(this, arguments);
				var series = this,
					xAxis = series.xAxis,
					yAxis = series.yAxis,
					metrics = series.columnMetrics;

				H.each(series.points, function (point) {
					var barWidth = xAxis.translate(H.pick(point.x2, point.x + (point.len || 0))) - point.plotX;
					point.shapeArgs = {
						x: point.plotX,
						y: point.plotY, // + metrics.offset,
						width: barWidth,
						height: metrics.width
					};
					point.tooltipPos[0] += barWidth / 2;
					point.tooltipPos[1] -= metrics.width / 2;
				});
			}
		});

		/**
		 * Max x2 should be considered in xAxis extremes
		 */
		H.wrap(H.Axis.prototype, 'getSeriesExtremes', function (proceed) {
			var axis = this,
				dataMax = Number.MIN_VALUE;

			proceed.call(this);
			if (this.isXAxis) {
				each(this.series, function (series) {
					each(series.x2Data || [], function (val) {
						if (val > dataMax) {
							dataMax = val;
						}
					});
				});
				if (dataMax > Number.MIN_VALUE) {
					axis.dataMax = dataMax;
				}
			}				
		});
	}(Highcharts));
});

var TimelineEvents = Class.extend({
	
	minNavDate:0,
	maxNavDate:0,
	
	init: function () {
		var layers = [];

		this._container		= $('#data-coverage-timeline-events-events');
		this._seriesOptions	= [];
		this._timeline = null;
		
		//Set Hightcharts options
		this.setHighchartsOptions();
		//Set Hightcharts Theme
		this.setHighchartsTheme();
		//Set Timeline options
		this.setTimelineOptions();
		//Render
		this.render();
		//Set events
		this._setupEventHandlers();
	},

	loadingIndicator: function (show) {
		if ( show || show === undefined ) {
			this._timeline.showLoading('Loading data from server...');
		}
		else {
			this._timeline.hideLoading();
		}
	},

	setTimelineOptions: function (options) {
		var self = this;
		
		if ( options !== undefined ) {
			this._timelineOptions = options;
			return true;
		}

		this._timelineOptions = {
			chart : {
				type: 'xrange',
				//inverted: true,
				//zoomType: 'x',
				panning: true,
				//panKey: 'shift',
				events:{
					selection: function(event) {
						if (event.xAxis) {
							timelineExtremesChanged = false;
							var chart = $('#data-coverage-timeline-events').highcharts();
							chart.xAxis[0].setExtremes(event.xAxis[0].min, event.xAxis[0].max);
							
							var span	 = event.xAxis[0].max - event.xAxis[0].min;
			
							if(span < 180 * 60 * 1000){
								return false;
							}
								
							if(event.xAxis[0].min < 0) event.xAxis[0].min = 0;
							
							self.afterSetExtremes({min:event.xAxis[0].min, max:event.xAxis[0].max});
						}else{
							//console.log('drag');
						}
						return true;	
					}
				},
				resetZoomButton: {
					theme: {
						display: 'none'
					}
				}
			},

			title: {
				text: '',
				useHTML: true
			},

			credits: {
				enabled: false
			},

			rangeSelector : {
				enabled: false,
				buttons: [{
					type: 'hour',
					count: 1,
					text: '1h'
				}, {
					type: 'day',
					count: 1,
					text: '1d'
				}, {
					type: 'month',
					count: 1,
					text: '1m'
				}, {
					type: 'year',
					count: 1,
					text: '1y'
				}, {
					type: 'all',
					text: 'All'
				}],
				inputEnabled: false, // it supports only days
				selected : 4 // all
			},

			xAxis : {
				//tickInterval: 1000,
				//minRange: 1000,
				//tickmarkPlacement: 'between',
				type: 'datetime',
				plotLines: [],
				ordinal: false,
				gridLineWidth:0,
				events : {
					afterSetExtremes : function (e) {
						timelineExtremesChanged = true;
					}
				},
				tickPositioner: function () {
					var positions = [];
					var columnOffset = this.minPointOffset;
					var info = this.tickPositions.info;
					timelineTick = this.tickPositions.info.unitName;
					
					if(timelineRes == 'm'){
						columnOffset = 0;
					}
					
					$.each(this.tickPositions, function(k,v){
						positions[k] = (v-columnOffset);
					});
					
					positions.info = info;
					
					return positions;
				},
				labels: {
					formatter: function () {
						var dateTimeLabelFormats = {
							millisecond: '%H:%M:%S.%L',
			                second: '%e. %b<br/>%H:%M:%S',
			                minute: '%e. %b<br/>%H:%M',
			                hour: '%e. %b<br/>%H:%M',
			                day: '%e. %b',
			                week: '%e. %b',
			                month: '%b \'%y',
			                year: '%Y'
						};
			            
			            //Add new grid lines (boundaries)
			            var minutes = new Date(this.value+this.axis.minPointOffset).getMinutes()
			            if(minutes == 0){
				            this.chart.xAxis[0].addPlotLine({
					            value: this.value,
					            width: 0.5,
					            color: '#C0C0C0',
					            zIndex: 1
					        });
			            }
						
						if(timelineRes == 'm'){
							return Highcharts.dateFormat(dateTimeLabelFormats[timelineTick], this.value);
						}else{
							return Highcharts.dateFormat(dateTimeLabelFormats[timelineTick], this.value+this.axis.minPointOffset);
						}
					}
				},
				minRange: 180 * 60 * 1000 // 30 minutes
			},

			yAxis: {
				startOnTick: false,
				endOnTick: false,
				tickInterval: 1,
				gridLineWidth: 1,
				//type: 'linear',
				floor: 0,
				allowDecimals: false,
				labels: {
					enabled:false
				},
				title: {
					text: null
				}
			},

			loading: {
				style: {
					position: 'absolute',
					backgroundColor: 'black',
					color: 'white',
					opacity: 0.5,
					textAlign: 'center'
				}
			},

			plotOptions: {
				column: {
					stacking: 'normal',
					//pointPlacement: 'between',
					animation: false,
					pointPadding: 0,
					borderWidth: 0.5,
					borderColor: '#000',
					groupPadding: 0,
					shadow: false,
					dataLabels: {
						enabled: false,
						color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'black'
					},
					dataGrouping: {
						groupPixelWidth: 20
					},
					point: {
						events: {
							dblclick: function(e){
								var minRange = 180 * 60 * 1000;
								
								var minTime = this.x;
								var maxTime = this.x + this.series.closestPointRange;
								
								var columnCenter = this.x + (this.series.closestPointRange / 2);
								
								var date = new Date(columnCenter);
								helioviewer.timeControls.setDate(date, true);
								self.btnCenter();
								return true;
							}
						}
					}
				},
	
				xrange: {
					cropThreshold: 1000,
					pointPadding: 0.25,
					//pointWidth: 4,
					borderRadius:3,
					grouping: false,
					stickyTracking: false,
					borderColor: '#000',
					borderWidth:1,
					point: {
						events: {
							dblclick: function(e){
								var date = new Date(timelineMouseValueX);

								if(typeof this.zeroSeconds != 'undefined'){
									var date = new Date(this.x + this.modifier);
								}
								
								helioviewer.timeControls.setDate(date);	
							},
							mouseOver: function(e){
								this.selected = true;
								this.graphic.attr('fill', '#fff');
								
								if(typeof this.kb_archivid != 'undefined'){
									var id = this.kb_archivid;
									id = id.replace(/\(|\)|\.|\+|\:/g, "");
									if($("#marker_" + id).length != 0) {
										$("#event-container .event-layer > div[id!='marker_"+id+"']").css({'opacity':'0'});
										$("#event-container .event-layer > div[id!='marker_"+id+"']").parent().css({'opacity':'0'});
										$("#event-container .event-layer > div[id='marker_"+id+"']").parent().css({'opacity':'1'});
										$("#event-container .event-layer > div[id='marker_"+id+"']").css({'z-index':'1000'}); 
										$("#event-container .event-layer > div[id='region_"+id+"']").css({'opacity':'1'});
										$('.movie-viewport-icon').hide();
									}
								}
							},
							mouseOut: function(e){
								var point = this;
								if(this.graphic){
									this.graphic.attr('fill', this.color);
									
									setTimeout(function() { point.selected = false; }, 100);
									if(typeof this.kb_archivid != 'undefined'){
										var id = this.kb_archivid;
										id = id.replace(/\(|\)|\.|\+|\:/g, "");
										$("#event-container .event-layer > div[id!='marker_"+id+"']").parent().css({'opacity':'1'});
									 	$("#event-container .event-layer > div").css({'opacity':'1.0', 'z-index':'997'});
									 	$('.movie-viewport-icon').show();
								 	}
								}	
							}
						}
					}
				},
				
				series:{
					animation: false,
					turboThreshold: 100000000,
					dataGrouping:{
						enabled: false
						//forced: true,
						//groupPixelWidth: 20,
					}
				}
			},

			tooltip: {
				pointFormat: '<span style="color:{series.color}; font-weight: bold;">{series.name}:</span> {point.y} images<br/>',
				valueDecimals: 0,
				hideDelay: 100,
				crosshairs: false,
				followPointer: false,
				enabled: true,
				shared: true,
				useHTML: true,
				style: {
					zIndex: 100
				},
				backgroundColor: 'rgba(0,0,0,0)',
				borderWidth: 0,
				shadow: false,
				xDateFormat: "%A, %b %e, %H:%M UTC",
				outside: true,
				myID: 'eventTimeline-tooltip-'+Date.now(),
				formatter: function(e) {
					var str = '<div id='+this.myID+' class="event-popup" style="border:1px solid #80ffff; background:#000;padding:5px;z-index:999;">';

					if(typeof this.points != "undefined"){
						var from = this.x;
						
						var index = this.points[0].series.xData.indexOf(this.x);
						//var to = this.x+this.points[0].series.closestPointRange;
						var to = (this.points[0].series.xData[index + 1] - 1);
						
						zoomTickTime = parseInt( (from + to) * 0.5 );
						
						str += '<div style="width:340px;">\
									<b>'+Highcharts.dateFormat('%Y/%m/%d %H:%M:%S', from)+' - '+Highcharts.dateFormat('%Y/%m/%d %H:%M:%S', to)+' UTC</b>\
								</div>';

						$.each(this.points, function(i, point) {
							var ext = 'entry';
							if(point.y != 1){
								ext = 'entries';
							}
							
							str += '<p style="font-size:10px;line-height:12px;padding-left:5px;"><span style="color:'+point.series.color+';">'+point.series.name+'</span>: <b>'+Highcharts.numberFormat(point.y,0,'.',',')+' '+ext+'</b></p>';
						});
						
					}else{//return false;
						var point = this.point;
						
						var headingText = '';
						if ( point.hasOwnProperty('hv_labels_formatted') && Object.keys(point.hv_labels_formatted).length > 0 ) {
							headingText = point.concept+': ' + point.hv_labels_formatted[Object.keys(point.hv_labels_formatted)[0]];
						}
						else {
							headingText = point.concept + ': ' + point.frm_name + ' ' + point.frm_specificid;
						}
						
						headingText = headingText.replace(/u03b1/g, "α");
				        headingText = headingText.replace(/u03b2/g, "β");
				        headingText = headingText.replace(/u03b3/g, "γ");
						headingText = headingText.replace(/u00b1/g, "±");
						headingText = headingText.replace(/u00b2/g, "²");
						
						str	 += '<h1 class="user-selectable" style="font-size:13px;margin-bottom:0px;">'+headingText+'</h1>'+"\n";
				
						if ( point.event_peaktime != null && point.event_peaktime != '' && point.event_peaktime != '0000-00-00 00:00:00') {
							point.event_peaktime = point.event_peaktime.replace(/-/g, "/");
							str += '<div class="container">'+"\n"
									+	  "\t"+'<div class="param-container"><div class="param-label user-selectable">Peak Time:</div></div>'+"\n"
									+	  "\t"+'<div class="value-container"><div class="param-value user-selectable">'+point.event_peaktime+' UTC</div><div class="ui-icon ui-icon-arrowstop-1-n" title="Jump to Event Peak Time"></div></div>'+"\n"
									+  '</div>'+"\n";
						}
						
						str	 += '<div class="container">'+"\n"
									+	  "\t"+'<div class="param-container"><div class="param-label user-selectable">Start Time: </div></div>'+"\n"
									+	  "\t"+'<div class="value-container"><div class="param-value user-selectable">'+Highcharts.dateFormat('%Y/%m/%d %H:%M:%S UTC', (this.x + point.modifier))+'</div><div class="ui-icon ui-icon-arrowstop-1-w" title="Jump to Event Start Time"></div></div>'+"\n"
									+  '</div>'+"\n"
									+  '<div class="container">'+"\n"
									+	  "\t"+'<div class="param-container"><div class="param-label user-selectable">End Time: </div></div>'+"\n"
									+	  "\t"+'<div class="value-container"><div class="param-value user-selectable">'+Highcharts.dateFormat('%Y/%m/%d %H:%M:%S UTC', (point.x2 - point.modifier))+'</div><div class="ui-icon ui-icon-arrowstop-1-e" title="Jump to Event End Time"></div>'+"\n"
									+  '</div>'+"\n";
				
						if ( point.hasOwnProperty('hv_labels_formatted') && Object.keys(point.hv_labels_formatted).length > 0 ) {
							$.each( point.hv_labels_formatted, function (param, value) {
								value = value.replace(/u03b1/g, "α");
						        value = value.replace(/u03b2/g, "β");
						        value = value.replace(/u03b3/g, "γ");
								value = value.replace(/u00b1/g, "±");
								value = value.replace(/u00b2/g, "²");
								str += '<div class="container">'+"\n"
										+	  "\t"+'<div class="param-container"><div class="param-label user-selectable">'+param+': </div></div>'+"\n"
										+	  "\t"+'<div class="value-container"><div class="param-value user-selectable">'+value+'</div></div>'+"\n"
										+  '</div>'+"\n";
							});
						}
						
						var noaaSearch = '';
						if( point.frm_name == "NOAA SWPC Observer" || point.frm_name == "HMI SHARP"){
							var eventName = point.hv_labels_formatted[Object.keys(point.hv_labels_formatted)[0]];
							noaaSearch = '<div class="btn-label btn event-search-external text-btn" style="line-height: 14px;" data-url=\'https://ui.adsabs.harvard.edu/#search/q="'+eventName+'"&sort=date desc\' target="_blank"><i class="fa fa-search fa-fw"></i>ADS search for '+eventName+'<i class="fa fa-external-link fa-fw"></i></div>\
										<div style=\"clear:both\"></div>\
										<div class="btn-label btn event-search-external text-btn" style="line-height: 14px;" data-url="https://arxiv.org/search/?query='+eventName+'&searchtype=all" target="_blank"><i class="fa fa-search fa-fw"></i>arXiv search for '+eventName+'<i class="fa fa-external-link fa-fw"></i></div>\
										<div style=\"clear:both\"></div>';
						}
						
						str	 += '<div class="btn-container">'+"\n"
									+	   "\t"+'<div class="btn-label btn event-info-event text-btn" style="line-height: 14px;" data-kbarchivid="'+ point.kb_archivid +'"><i class="fa fa-info-circle fa-fw"></i> View HEK data</div>'+"\n"
									+ 		"<div style=\"clear:both\"></div>\n"
									+	   "\t"+'<div class="btn-label btn event-create-movie-event text-btn" style="line-height: 14px;" data-start="'+Highcharts.dateFormat('%Y/%m/%dT%H:%M:%S', this.x)+'" data-end="'+Highcharts.dateFormat('%Y/%m/%dT%H:%M:%S', point.x2)+'"><i class="fa fa-video-camera fa-fw"></i> Make movie using event times and current field of view</div>'+"\n"
									+ 		"<div style=\"clear:both\"></div>\n"
									+		noaaSearch
									+		"\t"+'<div class="btn-label btn copy-to-data-event text-btn" style="line-height: 14px;" data-start="'+Highcharts.dateFormat('%Y/%m/%d %H:%M:%S', this.x)+'" data-end="'+Highcharts.dateFormat('%Y/%m/%d %H:%M:%S', point.x2)+'"><i class="fa fa-copy fa-fw"></i> Copy start / end times to data download</div>'+"\n"
									+  '</div>'+"\n";
						
						
						$("body").off('click', '.copy-to-data-event');
						$("body").off('click', '.event-create-movie-event');
						$("body").off('click', '.event-info-event');
						$("body").off('click', '.event-search-external');
						$("body").off('click', '.ui-icon-arrowstop-1-w');
						$("body").off('click', '.ui-icon-arrowstop-1-n');
						$("body").off('click', '.ui-icon-arrowstop-1-e');
						
						// Event bindings
						$("body").on('click', ".ui-icon-arrowstop-1-w", function () {
							helioviewer.timeControls.setDate( new Date(point.event_starttime+".000Z") );
						});
						$("body").on('click', ".ui-icon-arrowstop-1-n", function () {
							helioviewer.timeControls.setDate( new Date(point.event_peaktime+".000Z") );
						});
						$("body").on('click', ".ui-icon-arrowstop-1-e", function () {
							helioviewer.timeControls.setDate( new Date(point.event_endtime+".000Z") );
						});
						
						$("body").on('click', '.copy-to-data-event',function() {
							var start = $(this).data('start');
							var end = $(this).data('end');
							
							var startArr = start.split(" ");
							var endArr = end.split(" ");
							
							//Set dates
							if(Helioviewer.userSettings.get("state.drawers.#hv-drawer-data.open") == false){
								helioviewer.drawerDataClick(true);
							}
							$('#vso-start-date, #sdo-start-date').val(startArr[0]);
							$('#vso-start-time, #sdo-start-time').val(startArr[1]).change();
							$('#vso-end-date, #sdo-end-date').val(endArr[0]);
							$('#vso-end-time, #sdo-end-time').val(endArr[1]).change();
						});
						
						//Create Movie from event popup
						$("body").on('click', '.event-create-movie-event', function() {
							var start = $(this).data('start') + '.000Z';
							var end = $(this).data('end') + '.000Z';
							
							//build an movie settings object
							var formSettings = [
								{name : 'speed-method', value : 'framerate'},
								{name : 'framerate', value : 15},
								{name : 'startTime', value : start},
								{name : 'endTime', value : end},
							];
							
							helioviewer._movieManagerUI._buildMovieRequest(formSettings);
						});
						
						$("body").on('click', '.event-info-event', function(){
							var kb_archivid = $(this).data('kbarchivid');
							self._showEventInfoDialog(kb_archivid);
						});
						
						$("body").on('click', '.event-search-external',  function() {
							var url = $(this).data('url');
							window.open(url, '_blank');
						});
						
						//str += '<center><span style="color:'+this.points[0].series.color+'">'+this.points[0].series.name+'</span><br><b>'+Highcharts.dateFormat('%Y/%m/%d %H:%M:%S UTC', this.x)+' - '+Highcharts.dateFormat('%Y/%m/%d %H:%M:%S UTC', this.points[0].x2)+'</b></center>';
					}
					return str + '</div>';
				},
				positioner: function (boxWidth, boxHeight, point, e) {
					var tooltipX = 0, tooltipY = 0;
					if(typeof this.chart == 'undefined' || 
						typeof this.chart.mouseCoords == 'undefined' || 
						typeof this.chart.mouseCoords.x == 'undefined' || 
						typeof this.chart.mouseCoords.y == 'undefined'
					){
						return {x: 0, y: 0}
					}

					var x = this.chart.mouseCoords.x;
					var y = this.chart.mouseCoords.y;
					//var containerTop = $('#data-coverage-timeline-events').position().top;
					var xOffset = 15;
					var eventPopUpWidth = 350;
					//var eventPopUpHeight = 150;
					var eventPopUpHeight = $('#'+this.myID).outerHeight(true);
					//console.log(eventPopUpHeight);
					var timelineRectHeight = 20;
					var chartGridTop = $('.highcharts-grid').position().top;

					if (x + xOffset + eventPopUpWidth > this.chart.plotWidth) {
						tooltipX = x - eventPopUpWidth - xOffset;
					} else {
						tooltipX = x-5;
					}

					if(y < this.chart.plotHeight){
						tooltipY = y - (eventPopUpHeight/2);
					}else{
						tooltipY = y - (eventPopUpHeight - timelineRectHeight) - 19;
					}
					
					if(isShared){
						tooltipY = 17;
					}

					/*
					console.log(containerTop);
					return {
						x: this.chart.plotWidth - eventPopUpWidth,
						y: containerTop - eventPopUpHeight
					};
					*/
					return {
						x: tooltipX,
						y: tooltipY
					};
				}
			},
			
			navigator: {
				adaptToUpdatedData: false,
				enabled: false,
				baseSeries: 0,
				maskFill: 'rgba(100, 100, 100, 0.5)',
				series: {
					type: 'column',
					color: '#ddd',
					fillOpacity: 0.4
				},
				xAxis: {
					dateTimeLabelFormats: {
						millisecond: '%H:%M:%S.%L',
						second: '%H:%M:%S',
						minute: '%H:%M',
						hour: '%H:%M',
						day: '%e. %b',
						week: '%e. %b',
						month: '%b %Y',
						year: '%Y'
					},
					ordinal: false
				}
			},
			
			scrollbar: {
				enabled: false,
				liveRedraw: false
			},

			legend: {
				enabled: true,
				itemDistance: 12,
				y:20
			},

		};

		return true;
	},
	
	setHighchartsOptions: function(){
		Highcharts.setOptions({
			global: {
				useUTC: true,
				timezoneOffset: 0 * 60
			},
			lang: {
				loading: 'Loading Timeline Data...',
				rangeSelectorZoom: 'Zoom:',
				rangeSelectorFrom: 'Displaying:  ',
				rangeSelectorTo: 'through:  '
			}
		});
	},
	
	setHighchartsTheme: function(){
		// Custom Fonts
		Highcharts.createElement('link', {
		   href: '//fonts.googleapis.com/css?family=Source+Code+Pro:200,300,400,700',
		   rel: 'stylesheet',
		   type: 'text/css'
		}, null, document.getElementsByTagName('head')[0]);

		// Custom Theme
		Highcharts.theme = {
		   chart: {
			  backgroundColor: 'rgba(0,0,0,0)',
			  style: {
				 fontFamily: "'Source Code Pro', monospace",
				 fontWeight: '300'
			  },
			  plotBorderColor: '#606063',
			  selectionMarkerFill: 'rgba(69,185,243,0.5)'
		   },
		   title: {
			  style: {
				 color: '#E0E0E3',
				 //textTransform: 'uppercase',
				 fontSize: '20px',
				 fontFamily: "'Source Code Pro', monospace",
				 fontWeight: '200'
			  }
		   },
		   subtitle: {
			  style: {
				 color: '#E0E0E3',
				 //textTransform: 'uppercase'
				 fontFamily: "'Source Code Pro', monospace",
				 fontWeight: '200'
			  }
		   },
		   loading: {
			  labelStyle: {
				color: '#fff',
				position: 'relative',
				top: '1em',
				fontSize: '1.5em',
				fontFamily: "'Source Code Pro', monospace",
				fontWeight: '200'
			  }
		   },
		   xAxis: {
			  gridLineColor: '#707073',
			  labels: {
				 style: {
					color: '#E0E0E3',
					fontFamily: "'Source Code Pro', monospace",
					fontWeight: '200'
				 }
			  },
			  lineColor: '#707073',
			  minorGridLineColor: '#505053',
			  tickColor: '#707073',
			  title: {
				 style: {
					color: '#A0A0A3'

				 }
			  }
		   },
		   yAxis: {
			  gridLineColor: '#707073',
			  labels: {
				 enabled: false,
				 style: {
					color: '#E0E0E3'
				 }
			  },
			  lineColor: '#707073',
			  minorGridLineColor: '#505053',
			  tickColor: '#707073',
			  tickWidth: 1,
			  title: {
				 style: {
					color: '#A0A0A3'
				 }
			  }
		   },
		   tooltip: {
			  backgroundColor: 'rgba(0, 0, 0, 0.85)',
			  style: {
				 color: '#F0F0F0'
			  }
		   },
		   plotOptions: {
			  series: {
				 dataLabels: {
					color: '#B0B0B3'
				 },
				 marker: {
					lineColor: '#333'
				 }
			  },
			  boxplot: {
				 fillColor: '#505053'
			  },
			  candlestick: {
				 lineColor: 'white'
			  },
			  errorbar: {
				 color: 'white'
			  }
		   },
		   legend: {
			  itemStyle: {
				 color: '#E0E0E3',
					fontFamily: "'Source Code Pro', monospace",
					fontWeight: '200'
			  },
			  itemHoverStyle: {
				 color: '#FFF'
			  },
			  itemHiddenStyle: {
				 color: '#606063'
			  },
			  verticalAlign: 'top'
		   },
		   credits: {
			  style: {
				 color: '#666'
			  }
		   },
		   labels: {
			  style: {
				 color: '#707073'
			  }
		   },

		   drilldown: {
			  activeAxisLabelStyle: {
				 color: '#F0F0F3'
			  },
			  activeDataLabelStyle: {
				 color: '#F0F0F3'
			  }
		   },

		   navigation: {
			  buttonOptions: {
				 symbolStroke: '#DDDDDD',
				 theme: {
					fill: '#505053'
				 }
			  }
		   },

		   // scroll charts
		   rangeSelector: {
			  buttonTheme: {
				 fill: '#505053',
				 stroke: '#000000',
				 style: {
					color: '#CCC'
				 },
				 states: {
					hover: {
					   fill: '#707073',
					   stroke: '#000000',
					   style: {
						  color: 'white'
					   }
					},
					select: {
					   fill: '#000003',
					   stroke: '#000000',
					   style: {
						  color: 'white',
						  fontWeight: 700
					   }
					}
				 }
			  },
			  inputBoxBorderColor: '#505053',
			  inputStyle: {
				 backgroundColor: '#333',
				 color: 'silver'
			  },
			  labelStyle: {
				 color: 'silver'
			  },
			  inputBoxWidth: 175,
			  inputDateFormat: '%Y-%m-%d %H:%M:%S UTC',
			  inputEditDateFormat: '%Y-%m-%d %H:%M:%S UTC',
			  inputEnabled: false
		   },

		   navigator: {
			  handles: {
				 backgroundColor: '#666',
				 borderColor: '#AAA'
			  },
			  outlineColor: '#CCC',
			  maskFill: 'rgba(255,255,255,0.1)',
			  series: {
				 color: '#7798BF',
				 lineColor: '#A6C7ED'
			  },
			  xAxis: {
				 gridLineColor: '#505053'
			  }
		   },

		   scrollbar: {
			  barBackgroundColor: '#808083',
			  barBorderColor: '#808083',
			  buttonArrowColor: '#CCC',
			  buttonBackgroundColor: '#606063',
			  buttonBorderColor: '#606063',
			  rifleColor: '#FFF',
			  trackBackgroundColor: '#404043',
			  trackBorderColor: '#404043'
		   },

		   legendBackgroundColor: 'rgba(0, 0, 0, 0.5)',
		   background2: '#505053',
		   dataLabelsColor: '#B0B0B3',
		   textColor: '#C0C0C0',
		   contrastTextColor: '#F0F0F3',
		   maskColor: 'rgba(255,255,255,0.3)'
		};
		// Apply the theme
		Highcharts.setOptions(Highcharts.theme);
	},
	
	_setupEventHandlers: function(){
		var self = this;
		
		$('#timeline-events-btn-zoom-in').on('click', $.proxy(this.btnZoomIn, this));
		$('#timeline-events-btn-zoom-out').on('click', $.proxy(this.btnZoomOut, this));
		$('#timeline-events-btn-prev').on('click', $.proxy(this.btnPrev, this));
		$('#timeline-events-btn-next').on('click', $.proxy(this.btnNext, this));
		$('#timeline-events-btn-center').on('click', $.proxy(this.btnCenter, this));

		$(document).on('observation-time-changed-update-timeline', $.proxy(this._updateTimelineDate, this));
		//$(document).on('update-external-datasource-integration', $.proxy(this._updateTimeline, this));
		$(document).on('change-feature-events-state', $.proxy(this._updateTimeline, this));
		$("#hv-drawer-timeline-events-logarithmic").on('click', $.proxy(this._updateTimeline, this));
		
		
	},
	
	btnZoomIn: function() {
		var extremes, center, newMin, newMax, offsetMin, offsetMax, centerOffset, span, scaleFactor = 0.25;

		var chart = $('#data-coverage-timeline-events').highcharts();

		extremes = chart.xAxis[0].getExtremes();
		span	 = extremes.max - extremes.min;
		center 	 = extremes.min + (span * 0.5);
		var oldOffset = zoomTickTime - center;
		var newOffset = oldOffset * 0.5;
		
		if(span > 180 * 60 * 1000){
			//zoom offset
			extremes.min = zoomTickTime - (span * 0.5);
			extremes.max = zoomTickTime + (span * 0.5);		
		
			newMin   = extremes.min + (span * scaleFactor);
			newMax   = extremes.max - (span * scaleFactor);
			
			//keep same timestamp on where mouse pointer is
			if(centerOffset > 0){
				newMin   = newMin + newOffset;
				newMax   = newMax + newOffset;
			}else{
				newMin   = newMin - newOffset;
				newMax   = newMax - newOffset;
			}
		}else{
			newMin	 = extremes.min;
			newMax	 = extremes.max;
		}
		
		if(newMin < 0)  newMin = 0;

		chart.xAxis[0].setExtremes(newMin, newMax);
		this.afterSetExtremes({min:newMin, max:newMax});
	},


	btnZoomOut: function() {
		var extremes, newMin, newMax, span, scaleFactor = 2;

		var chart = $('#data-coverage-timeline-events').highcharts();

		extremes = chart.xAxis[0].getExtremes();
		span   = extremes.max - extremes.min;
		var center 	 = extremes.min + Math.round(span * 0.5);
		var oldOffset = zoomTickTime - center;
		var newOffset = oldOffset * 2;

		//zoom offset
		newMin = zoomTickTime - span;
		newMax = zoomTickTime + span;
		
		//keep same timestamp on where mouse pointer is
		if(newOffset > 0){
			newMin   = newMin - newOffset;
			newMax   = newMax - newOffset;
		}else{
			newMin   = newMin - newOffset;
			newMax   = newMax - newOffset;
		}
			
		var today = Date.now() + 24 * 60 * 60 * 1000;
		if(newMax > today){
			newMax = today;
		}
		
		var minDay = new Date(1991, 9, 11, 0, 0, 0).getTime();
		if(newMin < minDay){
			newMin = minDay;
		}
		
		chart.xAxis[0].setExtremes(newMin, newMax);
		this.afterSetExtremes({min:newMin, max:newMax});
	},
	
	btnPrev: function() {
		var extremes, newMin, newMax, span;

		var chart = $('#data-coverage-timeline-events').highcharts();

		extremes = chart.xAxis[0].getExtremes();
		
		span	 = parseInt((extremes.max - extremes.min)/2);
		newMin   = extremes.min - span;
		newMax   = extremes.max - span;
		
		if(newMin < 0){
			newMin = 0;
		}
		
		chart.xAxis[0].setExtremes(newMin, newMax);
		this.afterSetExtremes({min:newMin, max:newMax});
	},
	
	btnNext: function() {
		var extremes, newMin, newMax, span;

		var chart = $('#data-coverage-timeline-events').highcharts();

		extremes = chart.xAxis[0].getExtremes();
		
		span	 = parseInt((extremes.max - extremes.min)/2);
		newMin   = extremes.min + span;
		newMax   = extremes.max + span;
		
		if(newMin < 0){
			newMin = 0;
		}

		chart.xAxis[0].setExtremes(newMin, newMax);
		this.afterSetExtremes({min:newMin, max:newMax});
	},
	
	btnCenter: function() {
		var extremes, newMin, newMax, span;

		var chart = $('#data-coverage-timeline-events').highcharts();
		//Get current HV time
		var date = parseInt(Helioviewer.userSettings.get("state.date"));

		extremes = chart.xAxis[0].getExtremes();
		
		span	 = parseInt((extremes.max - extremes.min)/2);
		newMin   = date - span;
		newMax   = date + span;

		chart.xAxis[0].setExtremes(newMin, newMax);
		this.afterSetExtremes({min:newMin, max:newMax});
	},
	
	render: function(){
		var _url, eventLayersStr = '', layers = [], eventLayers=[], date, startDate, endDate, self, chartTypeX = 'xrange', isShared = false;
		
		self = this;
		
		//Get current HV time
		date = parseInt(Helioviewer.userSettings.get("state.date"));
		timelineMouseValueX = date;
		//startDate = date - (7 * 24 * 60 * 60 * 1000);//7 DAYS
		//endDate = date + (7 * 24 * 60 * 60 * 1000);//7 DAYS
		startDate = date - (10 * 60 * 60 * 1000);//7 DAYS
		endDate = date + (10 * 60 * 60 * 1000);//7 DAYS
		
		zoomTickTime = date;
		
		//Build instruments string for url
		eventLayersStr = helioviewer.getEvents();
		
		if(startDate < 0 || endDate < 0 || startDate > endDate){
			return false;
		}
		
		if(timelineStartDate > 0 && timelineEndDate > 0){
			startDate = timelineStartDate;
			endDate = timelineEndDate;
		}else{
			timelineStartDate = startDate;
			timelineEndDate = endDate;
		}
		
		self._timelineOptions.series = [];
			
		//Draggble start and end dates
		var visibleAreaInSeconds = endDate - startDate;
		var draggbleStart = (startDate - visibleAreaInSeconds * 5);
		var draggbleEnd = (endDate + visibleAreaInSeconds * 5);
		
		var series = [];
		series.unshift({
			'x': draggbleStart-1,
			'x2': draggbleStart,
			'y': 0,
			'kb_archivid': '',
			'hv_labels_formatted': '',
			'event_type': '',
			'frm_name': '',
			'frm_specificid': '',
			'event_peaktime': '',
			'event_starttime': '',
			'event_endtime': ''
		});
		series.push({
			'x': draggbleEnd,
			'x2': draggbleEnd+1,
			'y': 0,
			'kb_archivid': '',
			'hv_labels_formatted': '',
			'event_type': '',
			'frm_name': '',
			'frm_specificid': '',
			'event_peaktime': '',
			'event_starttime': '',
			'event_endtime': ''
		});
		
		self._timelineOptions.series[0] = {
			name: 'Empty',
			data: series,
			showInLegend: false,
			color: '#ffffff'
		};
		
		// create the chart
		$('#data-coverage-timeline-events').highcharts( self._timelineOptions,function(chart){
			$('#data-coverage-timeline-events').on('mouseup',function(){
				if (timelineExtremesChanged) {
					
					var extremes, newMin, newMax, span;
			
					extremes = chart.xAxis[0].getExtremes();
					
					newMin   = extremes.min;
					newMax   = extremes.max;
					
					if(newMin < 0)  newMin = 0;
					if(newMax < 0)  newMax = 0;
					
					self.afterSetExtremes({min:newMin, max:newMax});
					timelineExtremesChanged = false;
				}
			}),
			$('#data-coverage-timeline-events').on('mousedown',function(){
				timelineExtremesChanged = false;
			});

			$('#data-coverage-timeline-events').on('mousewheel', function(event) {
				var container = $(chart.container),
					offset = container.offset(),
					x, y, isInside;
				
				if(scrollLock){
					return false;
				}
				//Lock the scroll
				scrollLock = true;
				window.setTimeout(function(){
					scrollLock = false;
				},500);
				
				x = event.clientX - chart.plotLeft - offset.left;
				y = event.clientY - chart.plotTop - offset.top;
				isInside = chart.isInsidePlot(x, y);
				
				event.preventDefault();
				if (event.originalEvent.deltaY < 0 || event.originalEvent.detail < 0) {
					self.btnZoomIn();
				} else {
					self.btnZoomOut();
				}
			});
		   	
		    //$('#data-coverage-timeline-events').on('dblclick',function(e){
			//	if(timelineRes == 'm'){
			//		var date = new Date(timelineMouseValueX);
			//		helioviewer.timeControls.setDate(date);
			//	}
			//});
		   	 
			chart.container.addEventListener('mouseover', function(e) {
				chart.container.addEventListener('mousemove', chartEventsContainerMouseMove);
			});
			chart.container.addEventListener('mouseout', function(e) {
				chart.container.removeEventListener('mousemove', chartEventsContainerMouseMove);
			});
			
			function chartEventsContainerMouseMove(event) {
				var containerCoords = $(chart.container).position();//element_position(chart.container);
				var relativeMouseX = event.pageX - containerCoords.x;
				var relativeMouseY = event.pageY - containerCoords.y;
				chart.mouseCoords = { x: event.chartX, y: event.chartY };
				
				if(chart.isInsidePlot(event.chartX - chart.plotLeft, event.chartY - chart.plotTop)){
					event = chart.pointer.normalize(event);
					timelineMouseCoordX = event.chartX - chart.plotLeft;
					timelineMouseCoordY = event.chartY - chart.plotTop;
					timelineMouseValueX = chart.xAxis[0].toValue(event.chartX);
					timelineMouseValueY = chart.yAxis[0].toValue(event.chartY);
				}
			}
			
			self.drawPlotLine(chartTypeX);
			self.drawCarringtonLines(startDate, endDate, chartTypeX);
					
			var chart = $('#data-coverage-timeline-events').highcharts();
			chart.pointer.cmd = chart.pointer.onContainerMouseDown;
			chart.pointer.onContainerMouseDown = function (a){
				this.zoomX=this.zoomHor=this.hasZoom=a.shiftKey;
				this.cmd(a);
			}; 
			chart.tooltip.shared = isShared;
			
			$('div.highcharts-tooltip, div.highcharts-tooltip span').css({'z-index': '99999', 'background-color':'#000'});
			
			self.minNavDate = startDate;
			self.maxNavDate = endDate;
				
			self.setTitle({min:startDate,max:endDate});
			self.setNavigationButtonsTitles({min:startDate, max:endDate});
			
			$('#data-coverage-timeline-events').highcharts().xAxis[0].setExtremes(startDate, endDate);
			self.afterSetExtremes({min:startDate, max:endDate});
		});
		
		
	},
	
	drawCarringtonLines: function(Start, End, chartTypeX){
		if(typeof chartTypeX == "undefined"){
			var chartTypeX = 'column';
		}
		
		var chart = $('#data-coverage-timeline-events').highcharts();

		if(chartTypeX == 'xrange'){
			var offset = 0;
		}else{
			var offset = chart.xAxis[0].minPointOffset;
		}
		
		
		var Period = End - Start;
		var From = Start - Period;
		var To = End + Period;
		
		
		var carringtons = get_carringtons_between_timestamps(From, To);
		var timestamps = carringtons_to_timestamps(carringtons);

		carringtons.forEach(function( carrington ){
			
			var t = carrington_to_timestamp(carrington);
			
			chart.xAxis[0].removePlotLine('viewport-plotline-carrington-' + carrington);
			
			if(Period < 60 * 60 * 24 * 365 * 2 * 1000){
				chart.xAxis[0].addPlotLine({
					value: t.getTime() - offset,
					width: 1,
					color: '#C0C0C0',
					zIndex: 5,
					id: 'viewport-plotline-carrington-' + carrington,
					dashStyle: 'ShortDot',
					label: {
						useHTML:true,
						text: '&uarr; CR ' + carrington,
						style: {
							color: 'white',
							fontSize: '10px',
							fill:'white',
							stroke:'white',
							background: 'black'
						}
					}
				});
			}
		});
	},
	
	drawPlotLine: function(chartTypeX){
		
		if(typeof chartTypeX == "undefined"){
			var chartTypeX = 'column';
		}
		
		var chart = $('#data-coverage-timeline-events').highcharts();
		
		//Get current HV time
		if(chartTypeX == 'xrange'){
			var date = Helioviewer.userSettings.get("state.date");
		}else{
			var date = Helioviewer.userSettings.get("state.date") - chart.xAxis[0].minPointOffset;
		}
		
		chart.xAxis[0].removePlotLine('viewport-plotline');
		
		chart.xAxis[0].addPlotLine({
			value: date,
			width: 2,
			color: '#fff',
			zIndex: 6,
			id: 'viewport-plotline',
			label: {
				useHTML:true,
				text: 'Observation date',
				verticalAlign: 'top',
				align: 'center',
				y: 56,
				x: -4,
				rotation: 270,
				style: {
					fontFamily: '"Source Code Pro", monospace',
					fontWeight: 'bold',
					fontSize: '10px',
					color: 'black',
					background: 'white',
					padding: '1px 10px 1px 10px',
					fill:'white',
					stroke:'white'
				}
			}
		});
	},
	
	_updateTimelineDate: function(){
		var extremes, newMin, newMax, span;
		
		var chart = $('#data-coverage-timeline-events').highcharts();
		
		//Get current HV time
		var date = parseInt(Helioviewer.userSettings.get("state.date"));
		zoomTickTime = date;
		
		extremes = chart.xAxis[0].getExtremes();
		
		span	 = parseInt((extremes.max - extremes.min)/2);
		newMin   = date - span;
		newMax   = date + span;
		
		timelineStartDate = Math.round(newMin);
        timelineEndDate = Math.round(newMax);
		
		if($('#hv-drawer-timeline-events').is(":visible") != true){
			return;
		}
		
		chart.xAxis[0].setExtremes(newMin, newMax);
		this.afterSetExtremes({min:newMin, max:newMax});
	},
	
	_updateTimeline: function(){
		var extremes, newMin, newMax, span;
		
		if($('#hv-drawer-timeline-events').is(":visible") != true){
			return;
		}
		
		var chart = $('#data-coverage-timeline-events').highcharts();

		
		if(typeof chart == "undefined"){
			return;
		}
		
		extremes = chart.xAxis[0].getExtremes();
		newMin   = extremes.min;
		newMax   = extremes.max;

		chart.xAxis[0].setExtremes(newMin, newMax);
		this.afterSetExtremes({min:newMin, max:newMax});
	},
	
	/**
	 * Load new data depending on the selected min and max
	 */
	afterSetExtremes: function(e) {
		var self = this;
		
		var chart = $('#data-coverage-timeline-events').highcharts();
		var chartTypeX = 'column';
		var chartTypeY = 'linear';
		
		if($("#hv-drawer-timeline-events-logarithmic").is(':checked')){
			chartTypeY = 'logarithmic';
		}
		
		var eventLayersStr = helioviewer.getEvents();
		
		if(eventLayersStr == ''){
			chart.showLoading('No event types selected.<br/>Use the Feature and Event selector to choose event types.');
			while(chart.series.length > 0) {
				chart.series[0].remove(false);
			}
			return;
		}else{
		   	chart.showLoading('Loading data from server...'); 
		}
		
		if(e.min < 0 || e.max < 0 || e.min > e.max){
			return false;
		}
		
		if((e.max - e.min) / 1000 / 60 < 180){
			var center = (e.max + e.min) / 2;
			e.min = center - (90 * 60 * 1000);
			e.max = center + (90 * 60 * 1000);
		}
		
		timelineStartDate = Math.round(e.min);
		timelineEndDate = Math.round(e.max);
		var date = parseInt(Helioviewer.userSettings.get("state.date"));
		
		var _url = Helioviewer.api+'?action=getDataCoverage&eventLayers='+ eventLayersStr +'&currentDate='+ date +'&startDate='+ Math.round(e.min) +'&endDate='+ Math.round(e.max) +'&callback=?';
		$.getJSON(_url, function(data) {
		
			//Remove previosly generated plot lines
			chart.xAxis[0].removePlotBand();
			
			var seriesVisability = [];
			
			if(typeof data.error != 'undefined'){
				alert(data.error);
			}	
			
			while(chart.series.length > 0) {
				seriesVisability[ chart.series[0].name ] = chart.series[0].visible;
				chart.series[0].remove(false);
			}
			
			
			//Draggble start and end dates
			var visibleAreaInSeconds = Math.round(e.max) - Math.round(e.min);
			var draggbleStart = Math.round(e.min) - visibleAreaInSeconds;
			var draggbleEnd = Math.round(e.max) + visibleAreaInSeconds;
			
			var count = 0;
			$.each(data, function (sourceId, series) {
				if(series['res'] == 'm' && !series['showInLegend']){
					series['data'].push({
						'x': draggbleStart,
						'x2': draggbleEnd,
						'y': 0,
						'kb_archivid': '',
						'hv_labels_formatted': '',
						'event_type': '',
						'frm_name': '',
						'frm_specificid': '',
						'event_peaktime': '',
						'event_starttime': '',
						'event_endtime': ''
					});
				}
				
				chart.addSeries({
					name: (typeof _eventsSeries[series.event_type] == 'undefined' ? series['name']: _eventsSeries[series.event_type].name ),
					data: series['data'],
					data_type: series['event_type'],
					showInLegend: series['showInLegend'],
					color: _eventsSeries[series.event_type].color
				}, false, false);
				
				count++;
				
				timelineRes = series.res;
				if(series.res == 'm'){
					isShared = false;
					chartTypeX = 'xrange';
				}else{
					isShared = true;
					chartTypeX = 'column';
				}
			});
			
			if(chartTypeX == 'xrange'){
				$('#hv-drawer-timeline-events-logarithmic-holder').hide();
				chartTypeY = 'linear';
			}else{
				$('#hv-drawer-timeline-events-logarithmic-holder').show();
			}

			$.each(chart.series, function (id, series) {
				if(typeof seriesVisability[series.name] != "undefined"){
					if(seriesVisability[series.name] == false){
						chart.series[id].setVisible(false);
					}
				}
				chart.series[id].update({type: chartTypeX}, false);
			});
			
			chart.yAxis[0].update({ type: chartTypeY}, false);
			chart.tooltip.shared = isShared;
			
			self.minNavDate = e.min;
			self.maxNavDate = e.max;
			
			self.setNavigationButtonsTitles(e);
				
			
			chart.redraw();
			self.drawPlotLine(chartTypeX);
			self.drawCarringtonLines(e.min, e.max, chartTypeX);
			e = self.setTitle(e);
			chart.hideLoading();

			//Assign points classes
			if(timelineRes == 'm'){
				$.each(chart.series, function (id, series) {
					var pointIndex = 0;
					$.each(series.data, function (idp, point) {
						if(series.data.hasOwnProperty(idp)){
							var pointClass= point.kb_archivid.replace(/\(|\)|\.|\+|\:/g, "");
							var pointClassName= point.frm_name.replace(/ /g,'_');
							var pointClassType= point.event_type;
							$( '.highcharts-series-' + id ).find( "rect" ).eq( pointIndex ).addClass( 'point_' + pointClass ).addClass( 'point_name_' + pointClassName ).addClass( 'point_type_' + pointClassType );
							pointIndex++;
						}   
					});
				});
			}
		});
		return true;
	},
	
	setTitle: function(e){
		var chart = $('#data-coverage-timeline-events').highcharts();
		
		if(timelineRes != 'm'){
			if(
				typeof chart.xAxis == 'undefined' ||
				typeof chart.xAxis[0] == 'undefined' ||
				typeof chart.xAxis[0].series == 'undefined' || 
				typeof chart.xAxis[0].series[0] == 'undefined' || 
				typeof chart.xAxis[0].series[0].points == 'undefined' || 
				typeof chart.xAxis[0].series[0].points[0] == 'undefined' || 
				chart.xAxis[0].series[0].points[0].x < 0){
				return false;	
			}
	
			var minTime = chart.xAxis[0].series[0].points[0].x;
			
			if(typeof chart.xAxis[0].closestPointRange != 'undefined'){
				e.max = e.max + chart.xAxis[0].closestPointRange;
			}
			
			if(minTime > e.min){
				e.min = minTime;
			}
		}
		
		chart.setTitle({ 
			text: 
				Highcharts.dateFormat('%Y/%m/%d %H:%M:%S',e.min) +' - ' + Highcharts.dateFormat('%Y/%m/%d %H:%M:%S',e.max)
				+' <span class="dateSelector" data-tip-pisition="right" data-date-time="'+Highcharts.dateFormat('%Y/%m/%d %H:%M:%S',e.min)+'"'
				+' data-date-time-end="'+Highcharts.dateFormat('%Y/%m/%d %H:%M:%S',e.max)+'">UTC</span>' });
		
		helioviewer._timeSelector = new TimeSelector();
		
		return e;
	},
	
	setNavigationButtonsTitles: function(e) {
		var msPerMinute = 60 * 1000;
		var msPerHour = msPerMinute * 60;
		var msPerDay = msPerHour * 24;
		var msPerMonth = msPerDay * 30;
		var msPerYear = msPerDay * 365;
	
		var elapsed = parseInt((e.max - e.min) / 2);
		
		var extension = '';
		var time = 0;
		if (elapsed < msPerMinute) {
			time = Math.round(elapsed/1000);
			extension =  time + ' second' + (time > 1 ? 's' : '');   
		}
	
		else if (elapsed < msPerHour) {
			time = Math.round(elapsed/msPerMinute);
			extension =  time + ' minute' + (time > 1 ? 's' : '');	
		}
	
		else if (elapsed < msPerDay ) {
			time = Math.round(elapsed/msPerHour );
			extension =  time + ' hour' + (time > 1 ? 's' : '');	
		}
	
		else if (elapsed < msPerMonth) {
			time = Math.round(elapsed/msPerDay);
			extension =  time + ' day' + (time > 1 ? 's' : '');	 
		}
	
		else if (elapsed < msPerYear) {
			time = Math.round(elapsed/msPerMonth);
			extension =  time + ' month' + (time > 1 ? 's' : '');	 
		}
	
		else {
			time = Math.round(elapsed/msPerYear );
			extension =  time + ' year' + (time > 1 ? 's' : '');	 
		}
		
		$('#timeline-events-btn-prev').html('&larr; ' + extension);
		$('#timeline-events-btn-next').html(extension + ' &rarr;');
	},
	/**
	 * @description Displays the Image meta information and properties associated with a given image
	 *
	 */
	_showEventInfoDialog: function (kb_archivid) {
		var self = this;
		
		$.ajax({
			url: Helioviewer.api,
			dataType: Helioviewer.dataType,
			data: {
				"action": "getEvent",
				"kb_archivid": kb_archivid
			},
			success: function(data){
				self._buildEventInfoDialog(data, self);
			}
		});
	},


	/**
	 * @description
	 *
	 */
	_buildEventInfoDialog: function (data,self) {
		var dialog, sortBtn, tabs, html='', tag, json, headingText;
		
		

		// Format results
		dialog =  $("<div id='event-info-dialog' class='event-info-dialog' />");

		if ( data.hasOwnProperty('hv_labels_formatted') && Object.keys(data.hv_labels_formatted).length > 0 ) {
			headingText = data.concept+': ' + data.hv_labels_formatted[Object.keys(data.hv_labels_formatted)[0]];
		}
		else {
			headingText = data.concept + ' ' + data.frm_name + ' ' + data.frm_specificid;
		}
		headingText = headingText.replace(/u03b1/g, "α");
        headingText = headingText.replace(/u03b2/g, "β");
        headingText = headingText.replace(/u03b3/g, "γ");
		headingText = headingText.replace(/u00b1/g, "±");
		headingText = headingText.replace(/u00b2/g, "²");

		// Header Tabs
		html += '<div class="event-info-dialog-menu">'
			 +	 '<a class="show-tags-btn event-type selected">'+data.concept+'</a>'
			 +	 '<a class="show-tags-btn obs">Observation</a>'
			 +	 '<a class="show-tags-btn frm">Recognition Method</a>'
			 +	 '<a class="show-tags-btn ref">References</a>'
			 +	 '<a class="show-tags-btn all right">All</a>'
			 + '</div>';

		// Tab contents
		html += '<div class="event-header event-type" style="height: 400px; overflow: auto;">'
			 +   this._generateEventKeywordsSection(data.event_type, data) + '</div>'
			 +  '<div class="event-header obs" style="display: none; height: 400px; overflow: auto;">'
			 +   this._generateEventKeywordsSection("obs", data) + '</div>'
			 +  '<div class="event-header frm" style="display: none; height: 400px; overflow: auto;">'
			 +   this._generateEventKeywordsSection("frm", data) + '</div>'
			 +  '<div class="event-header ref" style="display: none; height: 400px; overflow: auto;">'
			 +   this._generateEventKeywordsSection("ref", data) + '</div>'
			 +  '<div class="event-header all" style="display: none; height: 400px; overflow: auto;">'
			 +   this._generateEventKeywordsSection("all", data) + '</div>';

		dialog.append(html).appendTo("body").dialog({
			autoOpen : true,
			title	: headingText,
			minWidth : 746,
			width	: 746,
			maxWidth : 746,
			height   : 550,
			draggable: true,
			resizable: false,
			buttons  : [ {  text  : 'Hide Empty Rows',
						  'class' : 'toggle_empty',
						   click  : function () {

						var text = $(this).parent().find('.toggle_empty span.ui-button-text');

						$.each( $(this).find("div.empty"), function (index,node) {
							if ( $(node).css('display') == 'none' ) {
								$(node).css('display', 'block');
							}
							else {
								$(node).css('display', 'none');
							}
						});

						if ( text.html() == 'Hide Empty Rows' ) {
							text.html('Show Empty Rows');
						}
						else {
							text.html('Hide Empty Rows');
						}
				}} ],
			create   : function (event, ui) {

				dialog.css('overflow', 'hidden');

				var eventTypeTab  = dialog.find(".show-tags-btn.event-type"),
					obsTab		= dialog.find(".show-tags-btn.obs"),
					frmTab		= dialog.find(".show-tags-btn.frm"),
					refTab		= dialog.find(".show-tags-btn.ref"),
					allTab		= dialog.find(".show-tags-btn.all");


				eventTypeTab.click( function() {
					eventTypeTab.addClass("selected");
					obsTab.removeClass("selected");
					frmTab.removeClass("selected");
					refTab.removeClass("selected");
					allTab.removeClass("selected");
					dialog.find(".event-header.event-type").show();
					dialog.find(".event-header.obs").hide();
					dialog.find(".event-header.frm").hide();
					dialog.find(".event-header.ref").hide();
					dialog.find(".event-header.all").hide();
				});

				obsTab.click( function() {
					eventTypeTab.removeClass("selected");
					obsTab.addClass("selected");
					frmTab.removeClass("selected");
					refTab.removeClass("selected");
					allTab.removeClass("selected");
					dialog.find(".event-header.event-type").hide();
					dialog.find(".event-header.obs").show();
					dialog.find(".event-header.frm").hide();
					dialog.find(".event-header.ref").hide();
					dialog.find(".event-header.all").hide();
				});

				frmTab.click( function() {
					eventTypeTab.removeClass("selected");
					obsTab.removeClass("selected");
					frmTab.addClass("selected");
					refTab.removeClass("selected");
					allTab.removeClass("selected");
					dialog.find(".event-header.event-type").hide();
					dialog.find(".event-header.obs").hide();
					dialog.find(".event-header.frm").show();
					dialog.find(".event-header.ref").hide();
					dialog.find(".event-header.all").hide();
				});

				refTab.click( function() {
					eventTypeTab.removeClass("selected");
					obsTab.removeClass("selected");
					frmTab.removeClass("selected");
					refTab.addClass("selected");
					allTab.removeClass("selected");
					dialog.find(".event-header.event-type").hide();
					dialog.find(".event-header.obs").hide();
					dialog.find(".event-header.frm").hide();
					dialog.find(".event-header.ref").show();
					dialog.find(".event-header.all").hide();
				});

				allTab.click( function() {
					eventTypeTab.removeClass("selected");
					obsTab.removeClass("selected");
					frmTab.removeClass("selected");
					refTab.removeClass("selected");
					allTab.addClass("selected");
					dialog.find(".event-header.event-type").hide();
					dialog.find(".event-header.obs").hide();
					dialog.find(".event-header.frm").hide();
					dialog.find(".event-header.ref").hide();
					dialog.find(".event-header.all").show();
				});
			}
		});
		
		// Format numbers for human readability
		$('.event-header-value.integer').number(true);
		$('.event-header-value.float').each( function (i, num) {
			var split = num.innerHTML.split('.')
			if ( typeof split[1] != 'undefined' ) {
				num.innerHTML = $.number(num.innerHTML, split[1].length);
			}
			else {
				num.innerHTML = $.number(num.innerHTML);
			}

		});
	},


	_generateEventKeywordsSection: function (tab, event) {
		var formatted, tag, tags = [], lookup, attr, domClass, icon, list= {}, self=this;
		
		var _eventGlossary = helioviewer._eventLayerAccordion._eventManager._eventGlossary;
		
		if ( tab == 'obs' ) {
			$.each( event, function (key, value) {
				if ( key.substring(0, 4) == 'obs_' ) {

					lookup = _eventGlossary[key];
					if ( typeof lookup != 'undefined' ) {
						list[key] = lookup;
						list[key]["value"] = value;
					}
					else {
						list[key] = { "value" : value };
					}
				}
			});
		}
		else if ( tab == 'frm' ) {
				$.each( event, function (key, value) {
					if ( key.substring(0, 4) == 'frm_' ) {

						lookup = _eventGlossary[key];
						if ( typeof lookup != 'undefined' ) {
							list[key] = lookup;
							list[key]["value"] = value;
						}
						else {
							list[key] = { "value" : value };
						}
					}
				});
		}
		else if ( tab == 'ref' ) {
				$.each( event['refs'], function (index, obj) {
					lookup = _eventGlossary[obj['ref_name']];
					if ( typeof lookup != 'undefined' ) {
						list[obj['ref_name']] = lookup;
						list[obj['ref_name']]["value"] = obj['ref_url'];
					}
					else {
						list[obj['ref_name']] = { "value" : obj['ref_url'] };
					}
				});
		}
		else if ( tab == 'all' ) {
				$.each( event, function (key, value) {
					if ( key.substring(0, 3) != 'hv_' && key != 'refs' ) {

						lookup = _eventGlossary[key];
						if ( typeof lookup != 'undefined' ) {
							list[key] = lookup;
							list[key]["value"] = value;
						}
						else {
							list[key] = { "value" : value };
						}
					}
				});
		}
		else if ( tab.length == 2 ) {
				$.each( event, function (key, value) {
					if ( key.substring(0, 3) == tab.toLowerCase()+'_'
					  || key.substring(0, 5) == 'event'
					  || key == 'concept'
					  || key.substring(0,3) == 'kb_' ) {

						lookup = _eventGlossary[key];
						if ( typeof lookup != 'undefined' ) {
							list[key] = lookup;
							list[key]["value"] = value;
						}
						else {
							list[key] = { "value" : value };
						}
					}
				});
		}
		else {
			console.warn('No logic for unexpected tab "'+tab+'".');
		}

		// Format the output
		formatted = '<div>';
		$.each(list, function (key, obj) {
			attr = '';
			domClass = '';
			icon = '';

			if ( tab != 'all' && typeof obj['hv_label'] != 'undefined' && obj['hv_label'] !== null ) {
				key = obj['hv_label'];
			}

			if ( typeof obj['hek_desc'] != 'undefined' && obj['hek_desc'] !== null  ) {
				attr += ' title="' + obj['hek_desc'] + '"';
			}


			if ( obj.value != '' && obj.value != 'N/A' && obj.value != 'n/a'
				&& typeof obj['hv_type'] != 'undefined'
				&& (obj['hv_type'] == 'url' || obj['hv_type'] == 'image_url') ) {

				if ( obj.value.indexOf('://') == -1) {
					obj.value = 'http://'+obj.value;
				}
				obj.value = '<a href="'+obj.value+'" target="_blank">'+obj.value+'</a>';
			}


			if ( obj.value != '' && obj.value != 'N/A' && obj.value != 'n/a'
				&& typeof obj['hv_type'] != 'undefined' && obj['hv_type'] == 'email_or_url' ) {

				if ( obj.value.indexOf('://') == -1 && obj.value.indexOf('/')	!== -1
					&& obj.value.indexOf('@') == -1 && obj.value.indexOf(' at ')  == -1 ) {

					obj.value = 'http://'+obj.value;
					obj.value = '<a href="'+obj.value+'" target="_blank">'+obj.value+'</a>';
				}
				else if ( obj.value.indexOf('://') !== -1 ) {
					obj.value = '<a href="'+obj.value+'" target="_blank">'+obj.value+'</a>';
				}
				else if ( obj.value.indexOf('@') > -1 && obj.value.indexOf(' ') == -1 ) {
					obj.value = '<a href="mailto:'+obj.value+'">'+obj.value+'</a>';
				}
			}

			if ( obj.value != '' && obj.value != 'N/A' && obj.value != 'n/a'
				&& typeof obj['hv_type'] != 'undefined'
				&& obj['hv_type'] == 'thumbnail_url' ) {

				if ( obj.value.indexOf('://') == -1 ) {
					obj.value = 'http://'+obj.value;
				}
				obj.value = '<img src="'+obj.value+'"/>';
			}

			if ( typeof obj['hv_type'] != 'undefined' && obj['hv_type'] == 'date' ) {
				domClass += ' date';
			}

			if ( typeof obj['hek_type'] != 'undefined' && obj['hek_type'] == 'float' ) {
				domClass += ' float';
			}

			if ( typeof obj['hek_type'] != 'undefined'
				&& (obj['hek_type'] == 'integer' || obj['hek_type'] == 'long') ) {

				domClass += ' integer';
			}

			if ( typeof obj['hv_type'] != 'undefined' && obj['hv_type'] == 'boolean' ) {
				domClass += ' boolean';
				if ( obj.value.toUpperCase() == "T" || obj.value == 1
					|| obj.value.toLowerCase() == 'true' ) {

					domClass += ' true';
				}
				if ( obj.value.toUpperCase() == "F" || obj.value == 0
					|| obj.value.toLowerCase() == 'false') {

					domClass += ' false';
				}
			}

			if (  typeof obj['hv_type']  != 'undefined' && obj['hv_type'] != 'date'
			   && typeof obj['hek_type'] != 'undefined' && obj['hek_type'] == 'string' ) {

				domClass += ' string';
			}


			if (  typeof obj.value === 'undefined' || obj.value === null
			   || obj.value === 'null' || obj.value === '' ) {

				tag = '<div class="empty"><span class="event-header-tag empty"'+attr+'>' + key + ': </span>' +
					  '<span class="event-header-value empty">' + obj.value + '</span></div>';
			}
			else {
				tag = '<div><span class="event-header-tag"'+attr+'>' + key + ': </span>' +
					  '<span class="event-header-value'+domClass+'">' + obj.value + '</span></div>';
			}
			tags.push(tag);
			formatted += tag;
		});
		formatted += '</div>';

		return formatted;
	}
});	


var _eventsSeries  = {
	AR: {color: '#ff8f97', name: 'Active Region'},
	CE: {color: '#ffb294', name: 'CME'},
	CME: {color: '#ffb294', name: 'CME'},
	CD: {color: '#ffd391', name: 'Coronal Dimming'},
	CH: {color: '#fef38e', name: 'Coronal Hole'},
	CW: {color: '#ebff8c', name: 'Coronal Wave'},
	FI: {color: '#c8ff8d', name: 'Filament'},
	FE: {color: '#a3ff8d', name: 'Filament Eruption'},
	FA: {color: '#7bff8e', name: 'Filament Activation'},
	FL: {color: '#7affae', name: 'Flare'},
	LP: {color: '#7cffc9', name: 'Loop'},
	OS: {color: '#81fffc', name: 'Oscillation'},
	SS: {color: '#8ce6ff', name: 'Sunspot'},
	EF: {color: '#95c6ff', name: 'Emerging Flux'},
	CJ: {color: '#9da4ff', name: 'Coronal Jet'},
	PG: {color: '#ab8cff', name: 'Plage'},
	OT: {color: '#d4d4d4', name: 'Other'},
	NR: {color: '#d4d4d4', name: 'Nothing Reported'},
	SG: {color: '#e986ff', name: 'Sigmoid'},
	SP: {color: '#ff82ff', name: 'Spray Surge'},
	CR: {color: '#ff85ff', name: 'Coronal Rain'},
	CC: {color: '#ff8acc', name: 'Coronal Cavity'},
	ER: {color: '#ff8dad', name: 'Eruption'},
	TO: {color: '#ca89ff', name: 'Topological Object'},
	HY: {color: '#00ffff', name: 'Hypothesis'},
	BO: {color: '#a7e417', name: 'Bomb'},
	EE: {color: '#fec00a', name: 'Explosive Event'},
	PB: {color: '#b3d5e4', name: 'Prominence Bubble'},
	PT: {color: '#494a37', name: 'Peacock Tail'},
	UNK: {color: '#d4d4d4', name: 'Unknown'}
};