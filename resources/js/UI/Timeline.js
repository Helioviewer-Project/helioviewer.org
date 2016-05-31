/**
 * @fileOverview Contains the class definition for an Timeline class.
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false,
eqeqeq: true, plusplus: true, bitwise: true, regexp: false, strict: true,
newcap: true, immed: true, maxlen: 80, sub: true */
/*globals $, Class */
"use strict";
var timelineExtremesChanged = false;
var timelineTick = 'minute';
var zoomTickTime = 0;
var timelineStartDate = 0;
var timelineEndDate = 0;

var Timeline = Class.extend({
	
	minNavDate:0,
	maxNavDate:0,
	
    init: function () {
	    var layers = [];

        this._container        = $('#data-coverage-timeline');
        this._seriesOptions    = [];
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
				type: 'column',
                //zoomType: 'x',
                panning: true,
				//panKey: 'shift',
                events:{
	                selection: function(event) {
		                if (event.xAxis) {
			                timelineExtremesChanged = false;
			                var chart = $('#data-coverage-timeline').highcharts();
							chart.xAxis[0].setExtremes(event.xAxis[0].min, event.xAxis[0].max);
							
							var span     = event.xAxis[0].max - event.xAxis[0].min;
	        
					        if(span < 30 * 60 * 1000){
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
                text: ''
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
	            tickmarkPlacement: 'between',
	            type: 'datetime',
                plotLines: [],
                ordinal: false,
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
			                second: '%H:%M:%S',
			                minute: '%H:%M',
			                hour: '%H:%M',
			                day: '%e. %b',
			                week: '%e. %b',
			                month: '%b \'%y',
			                year: '%Y'
			            };
			        	
			        	return Highcharts.dateFormat(dateTimeLabelFormats[timelineTick], this.value+this.axis.minPointOffset);
			        }
			    },
                minRange: 30 * 60 * 1000 // 30 minutes
            },

            yAxis: {
	            type: 'linear',
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
                    //pointPlacement: 'between',
                    animation: false,
                    //stacking: 'normal',
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
	                            var minRange = 30 * 60 * 1000;
	                            
	                            var minTime = this.x;
	                            var maxTime = this.x + this.series.closestPointRange;
	                            
	                            var columnCenter = this.x + (this.series.closestPointRange / 2)
	                            
	                            if(minRange > this.series.closestPointRange){
	                            	var minSideRange = minRange / 2;
	                            	
	                            	minTime = columnCenter - minSideRange;
	                            	maxTime = columnCenter + minSideRange;
	                            }
	                            
	                            var date = new Date(columnCenter);
	                            helioviewer.timeControls.setDate(date);
	                            
	                            var chart = $('#data-coverage-timeline').highcharts();
								chart.xAxis[0].setExtremes(minTime, maxTime);
								self.afterSetExtremes({min:minTime, max:maxTime});
								return true;
                            }
                        }
                    }
                },
    
		        scatter: {
		            grouping: false,
                    point: {
                        events: {
                            dblclick: function(e){
	                         	var date = new Date(this.x);
								helioviewer.timeControls.setDate(date);    
                            }
                        }
                    }
		        },
		        
		        series:{
					stacking: 'normal',
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
                crosshairs: true,
                followPointer: false,
                shared: true,
                useHTML: true,
				style: {
					zIndex: 100
				},
				backgroundColor: 'rgba(0,0,0,0)',
				borderWidth: 0,
				shadow: false,
                xDateFormat: "%A, %b %e, %H:%M UTC",
                formatter: function(e) {
	                var str = '<div style="border:1px solid #80ffff; background:#000;padding:5px;z-index:999;">';
					var count = 0;
					var type = 'column';
					
	                if(typeof this.series == "undefined"){
		                var index = this.points[0].point.index;
		                var from = this.x;
						var to = this.points[0].series.data[index + 1].x - 1;//this.x+this.points[0].series.closestPointRange;
						var utcDate = new Date().getTime();; 
						
						zoomTickTime = parseInt( (from + to) * 0.5 );
						
		                str += '<div style="width:340px;">\
		                			<div style="width:165px;float:left;color:#ffffff;text-align:center;"><b>'+Highcharts.dateFormat('%Y/%m/%d %H:%M:%S', from)+'</b></div>\
		                			<div style="width:10px;float:left;color:#ffffff;text-align:center;"><b>-</b></div>\
		                			<div style="width:165px;float:left;color:#ffffff;text-align:center;"><b>'+Highcharts.dateFormat('%Y/%m/%d %H:%M:%S', to)+'</b></div>\
		                			<div style="clear:both;"></div>\
		                		</div>';
			            
			            if(from < utcDate){
			                str += '<div style="width:340px;">\
			                			<div style="width:170px;float:left;">'+helioviewer.getViewportScreenshotURL(from)+'</div>\
			                			<div style="width:170px;float:left;">'+helioviewer.getViewportScreenshotURL(to)+'</div>\
			                			<div style="clear:both;"></div>\
			                		</div>';
			            }
			            
		                $.each(this.points, function(i, point) {
							type = point.series.type;
							if(type == 'column'){
								var ext = '';
								if(point.y != 1){
									ext = 's';
								}
								str += '<span style="color:'+point.series.color+';padding-left:5px;">'+point.series.name+'</span>: <b>'+Highcharts.numberFormat(point.y,0,'.',',')+' image'+ext+'</b><br/>';
							}else{
								str += '<span style="color:'+point.series.color+';padding-left:5px;">'+point.series.name+'</span><br> <b>'+Highcharts.dateFormat('%Y/%m/%d %H:%M:%S UTC', point.x)+'</b>';
							}
						});
						
	                }else{
		                zoomTickTime = this.x;
		                
		                type = this.series.type;
		            	if(type == 'column'){
							var ext = '';
							if(point.y != 1){
								ext = 's';
							}
							str += '<span style="color:'+this.series.color+'">'+this.series.name+'</span>: <b>'+Highcharts.numberFormat(this.y,0,'.',',')+' image'+ext+'</b><br/>';
						}else{
							str += '<center><span style="color:'+this.series.color+'">'+this.series.name+'</span><br><b>'+Highcharts.dateFormat('%Y/%m/%d %H:%M:%S UTC', this.x)+'</b><br/>'+helioviewer.getViewportScreenshotURL(this.x, this.series.name)+'</center>';
						}
		            }
					return str + '</div>';
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
           href: 'http://fonts.googleapis.com/css?family=Source+Code+Pro:200,300,400,700',
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
	    
	    $('#btn-zoom-in').on('click', $.proxy(this.btnZoomIn, this));
        $('#btn-zoom-out').on('click', $.proxy(this.btnZoomOut, this));
        $('#btn-prev').on('click', $.proxy(this.btnPrev, this));
        $('#btn-next').on('click', $.proxy(this.btnNext, this));
        $('#btn-center').on('click', $.proxy(this.btnCenter, this));

        $(document).on('observation-time-changed', $.proxy(this._updateTimelineDate, this));
        $(document).on('update-external-datasource-integration', $.proxy(this._updateTimeline, this));
        $("#hv-drawer-timeline-logarithmic").on('click', $.proxy(this._updateTimeline, this));
        
        
    },
    
    btnZoomIn: function() {
        var extremes, center, newMin, newMax, offsetMin, offsetMax, centerOffset, span, scaleFactor = 0.25;

        var chart = $('#data-coverage-timeline').highcharts();

        extremes = chart.xAxis[0].getExtremes();
        span     = extremes.max - extremes.min;
		center 	 = extremes.min + (span * 0.5);
		var oldOffset = zoomTickTime - center;
		var newOffset = oldOffset * 0.5;
		
        if(span > 30 * 60 * 1000){
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

        var chart = $('#data-coverage-timeline').highcharts();

        extremes = chart.xAxis[0].getExtremes();
		span   = extremes.max - extremes.min;
		var center 	 = extremes.min + (span * 0.5);
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

        var chart = $('#data-coverage-timeline').highcharts();

        extremes = chart.xAxis[0].getExtremes();
        
        span     = parseInt((extremes.max - extremes.min)/2);
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

        var chart = $('#data-coverage-timeline').highcharts();

        extremes = chart.xAxis[0].getExtremes();
        
        span     = parseInt((extremes.max - extremes.min)/2);
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

        var chart = $('#data-coverage-timeline').highcharts();
		//Get current HV time
		var date = parseInt(Helioviewer.userSettings.get("state.date"));

        extremes = chart.xAxis[0].getExtremes();
        
        span     = parseInt((extremes.max - extremes.min)/2);
        newMin   = date - span;
        newMax   = date + span;

        chart.xAxis[0].setExtremes(newMin, newMax);
        this.afterSetExtremes({min:newMin, max:newMax});
    },
    
    render: function(){
	    var _url, imageLayersStr = '', layers = [], imageLayers=[], date, startDate, endDate, self;
		
		self = this;
		
		//Get current HV time
		date = parseInt(Helioviewer.userSettings.get("state.date"));
		startDate = date - (7 * 24 * 60 * 60 * 1000);//7 DAYS
		endDate = date + (7 * 24 * 60 * 60 * 1000);//7 DAYS
		
		zoomTickTime = date;
		
		//Build instruments string for url
		$.each( $('#accordion-images .dynaccordion-section'), function(i, accordion) {
	        if ( !$(accordion).find('.visible').hasClass('hidden')) {
	            var sourceId = $(accordion).find('.tile-accordion-header-left').attr('data-sourceid');
	            var opacity = parseInt($(accordion).find('.opacity-slider-track').slider("value"));
	            opacity = opacity <= 0 ? 1 : opacity;
	            imageLayersStr = '['+sourceId+',1,'+opacity+'],' + imageLayersStr;
	        }
	    });
		//imageLayersStr = Helioviewer.userSettings.parseLayersURLString();
        
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
        
        	    
	    var _url = Helioviewer.api+'?action=getDataCoverage&imageLayers='+ imageLayersStr +'&startDate='+ startDate +'&endDate='+ endDate +'&callback=?';
	    $.getJSON(_url, function (data) {
		    
		    if(typeof data.error != 'undefined'){
			    alert(data.error);
		    }
			//assign colors
            self._timelineOptions.series = [];
            $.each(data, function (id, series) {
                self._timelineOptions.series[id] = {
                    name: series['name'],
                    data: series['data'],
                    color: _colors[series.sourceId]
                };
            });
	        // create the chart
	        $('#data-coverage-timeline').highcharts( self._timelineOptions,function(chart){
			        $(document).on('mouseup',function(){
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
			        $(document).on('mousedown',function(){
			            timelineExtremesChanged = false;
			        });
			        $('#data-coverage-timeline').bind('mousewheel', function(event) {
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
				        if (event.originalEvent.wheelDelta > 0 || event.originalEvent.detail < 0) {
				            self.btnZoomIn();
						} else {
				            self.btnZoomOut();
				        }
			        });
			    });
			    
	        self.drawPlotLine('column');
	        self.drawCarringtonLines(startDate, endDate, 'column');
	        
	        $('#data-coverage-timeline').highcharts().xAxis[0].setExtremes(startDate, endDate);
	        var chart = $('#data-coverage-timeline').highcharts();
		    chart.pointer.cmd = chart.pointer.onContainerMouseDown;
		    chart.pointer.onContainerMouseDown = function (a){
		        this.zoomX=this.zoomHor=this.hasZoom=a.shiftKey;
		        this.cmd(a);
		    }; 
		    
		    $('div.highcharts-tooltip, div.highcharts-tooltip span').css({'z-index': '99999', 'background-color':'#000'});
		    //$('.highcharts-tooltip span').css({'position': 'relative'});
		    
		    self.minNavDate = startDate;
            self.maxNavDate = endDate;
		    
		    self.setTitle({min:startDate,max:endDate});
	        self.setNavigationButtonsTitles({min:startDate, max:endDate});
	    });
    },
    
    drawCarringtonLines: function(Start, End, chartTypeX){
        if(typeof chartTypeX == "undefined"){
	        var chartTypeX = 'column';
        }
        
        var chart = $('#data-coverage-timeline').highcharts();

		if(chartTypeX == 'scatter'){
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
        
        var chart = $('#data-coverage-timeline').highcharts();
        
        //Get current HV time
		if(chartTypeX == 'scatter'){
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

        var chart = $('#data-coverage-timeline').highcharts();
		
		//Get current HV time
		var date = parseInt(Helioviewer.userSettings.get("state.date"));

        extremes = chart.xAxis[0].getExtremes();
        
        span     = parseInt((extremes.max - extremes.min)/2);
        newMin   = date - span;
        newMax   = date + span;

        chart.xAxis[0].setExtremes(newMin, newMax);
        this.afterSetExtremes({min:newMin, max:newMax});
    },
    
    _updateTimeline: function(){
	    var extremes, newMin, newMax, span;

        var chart = $('#data-coverage-timeline').highcharts();

        
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
		
        var chart = $('#data-coverage-timeline').highcharts();
		var chartTypeX = 'column';
		var chartTypeY = 'linear';
		
		if($("#hv-drawer-timeline-logarithmic").is(':checked')){
			chartTypeY = 'logarithmic';
		}
		
		if(Math.round(e.max) - Math.round(e.min) <= 105 * 60 * 1000){
	        chartTypeX = 'scatter';
			chartTypeY = 'linear';
        }
        
        var imageLayersStr = '';
        $.each( $('#accordion-images .dynaccordion-section'), function(i, accordion) {
	        if ( !$(accordion).find('.visible').hasClass('hidden')) {
	            var sourceId = $(accordion).find('.tile-accordion-header-left').attr('data-sourceid');
	            var opacity = parseInt($(accordion).find('.opacity-slider-track').slider("value"));
	            opacity = opacity <= 0 ? 1 : opacity;
	            imageLayersStr = '['+sourceId+',1,'+opacity+'],' + imageLayersStr;
	        }
	    });
        //var imageLayersStr = Helioviewer.userSettings.parseLayersURLString();
        
        if(imageLayersStr == ''){
	        chart.showLoading('You must have at least one visible image layer.');
	        return;
        }else{
	       	chart.showLoading('Loading data from server...'); 
        }
        
        if(e.min < 0 || e.max < 0 || e.min > e.max){
	        return false;
        }
        
        timelineStartDate = Math.round(e.min);
        timelineEndDate = Math.round(e.max);
        
        var _url = Helioviewer.api+'?action=getDataCoverage&imageLayers='+ imageLayersStr +'&startDate='+ Math.round(e.min) +'&endDate='+ Math.round(e.max) +'&callback=?';
        $.getJSON(_url, function(data) {
			var seriesVisability = [];
			
			if(typeof data.error != 'undefined'){
			    alert(data.error);
		    }	
			
			while(chart.series.length > 0) {
				seriesVisability[ chart.series[0].name ] = chart.series[0].visible;
                chart.series[0].remove(false);
            }
			
			var categories = [];
            var count = 0;
            $.each(data, function (sourceId, series) {
                chart.addSeries({
                    name: series['name'],
                    data: series['data'],
                    color: _colors[parseInt(series.sourceId)]
                }, false, false);
                
                categories.push(series['label']);
                count++;
            });
            
            $.each(chart.series, function (id, series) {
	            if(typeof seriesVisability[series.name] != "undefined"){
		            if(seriesVisability[series.name] == false){
			            chart.series[id].setVisible(false);
		            }
	            }
                chart.series[id].update({type: chartTypeX}, false);
            });
            
            chart.yAxis[0].update({ type: chartTypeY}, false);
            
            self.minNavDate = e.min;
            self.maxNavDate = e.max;
            
            self.setNavigationButtonsTitles(e);
                
            
            chart.redraw();
            self.drawPlotLine(chartTypeX);
            self.drawCarringtonLines(e.min, e.max, chartTypeX);
            self.setTitle(e);
            chart.hideLoading();
        });
        return true;
    },
    
    setTitle: function(e){
	    var chart = $('#data-coverage-timeline').highcharts();
		
	    /*if(typeof chart.xAxis[0].series[0] == 'undefined' || typeof chart.xAxis[0].series[0].points[0] == 'undefined' || chart.xAxis[0].series[0].points[0].x < 0){
			return false;    
	    }

	    var minTime = chart.xAxis[0].series[0].points[0].x;
	    
		if(typeof chart.xAxis[0].closestPointRange != 'undefined'){
	    	var pointsCount = chart.xAxis[0].series[0].points.length;
			var lastPoint = chart.xAxis[0].series[0].points[pointsCount-1].x + chart.xAxis[0].closestPointRange;
			e.max = lastPoint;
		}*/
		
		if(typeof chart.xAxis[0].series[0] == 'undefined' || typeof chart.xAxis[0].series[0].points[0] == 'undefined' || chart.xAxis[0].series[0].points[0].x < 0){
			return false;    
	    }

	    var minTime = chart.xAxis[0].series[0].points[0].x;
	    
		if(typeof chart.xAxis[0].closestPointRange != 'undefined'){
			e.max = e.max + chart.xAxis[0].closestPointRange;
		}
		
	    if(minTime > e.min){
		    e.min = minTime;
	    }

	    chart.setTitle({ text: Highcharts.dateFormat('%Y/%m/%d %H:%M:%S',e.min)+' - '+ Highcharts.dateFormat('%Y/%m/%d %H:%M:%S UTC',e.max) });
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
	    
	    $('#btn-prev').html('&larr; ' + extension);
	    $('#btn-next').html(extension + ' &rarr;');
    }
});    



var _colors  = [
    '#008000', //  0 SOHO EIT 171
    '#408000', //  1 SOHO EIT 195
    '#00C000', //  2 SOHO EIT 284
    '#40C000', //  3 SOHO EIT 304
    '#C08080', //  4 SOHO LASCO C2
    '#FF8080', //  5 SOHO LASCO C3
    '#FF0000', //  6 SOHO MDI Mag
    '#FF4040', //  7 SOHO MDI Int
    '#008080', //  8 SDO AIA 94
    '#408080', //  9 SDO AIA 131
    '#00C0C0', // 10 SDO AIA 171
    '#80C0C0', // 11 SDO AIA 191
    '#00FFFF', // 12 SDO AIA 211
    '#80FFFF', // 13 SDO AIA 304
    '#C0FFFF', // 14 SDO AIA 335
    '#40C0C0', // 15 SDO AIA 1600
    '#80FFC0', // 16 SDO AIA 1700
    '#40C080', // 17 SDO AIA 4500
    '#80C080', // 18 SDO MDI Int
    '#80FF80', // 19 SDO MDI Mag
    '#0080C0', // 20 STEREO A EUVI 171
    '#4080C0', // 21 STEREO A EUVI 195
    '#8080C0', // 22 STEREO A EUVI 284
    '#4040FF', // 23 STEREO A EUVI 304
    '#0080FF', // 24 STEREO B EUVI 171
    '#8080FF', // 25 STEREO B EUVI 195
    '#00C0FF', // 26 STEREO B EUVI 284
    '#80C0FF', // 27 STEREO B EUVI 304
    '#C0C0FF', // 28 STEREO A COR1
    '#C080FF', // 29 STEREO A COR2
    '#C080C0', // 30 STEREO B COR1
    '#FFC0FF', // 31 STEREO B COR2
    '#C0C000', // 32 PROBA-2 SWAP 174
    '#FFC000', // 33 Yohkoh SXT AlMgMn
    '#FFFF00', // 34 Yohkoh SXT thin-Al
    '#C08040', // 35 Yohkoh SXT white-light
    '#ffffff', // 36
    '#ffffff', // 37
    '#ffffff', // 38
    '#ffffff', // 39
    '#ffffff', // 40
    '#ffffff', // 41
    '#ffffff', // 42
    '#ffffff', // 43
    '#ffffff', // 44
    '#ffffff', // 45
    '#ffffff', // 46
    '#ffffff', // 47
    '#ffffff', // 48
    '#ffffff', // 49
    '#ffffff', // 50
    '#ffffff', // 51
    '#ffffff', // 52
    '#ffffff', // 53
    '#ffffff', // 54
    '#ffffff', // 55
    '#ffffff', // 56
    '#ffffff', // 57
    '#ffffff', // 58
    '#ffffff', // 59
    '#ffffff', // 60
    '#ffffff', // 61
    '#ffffff', // 62
    '#ffffff', // 63
    '#ffffff', // 64
    '#ffffff', // 65
    '#ffffff', // 66
    '#ffffff', // 67
    '#ffffff', // 68
    '#ffffff', // 69
    '#ffffff', // 70
    '#ffffff', // 71
    '#ffffff', // 72
    '#ffffff', // 73
    '#ffffff', // 74
    '#C04000', // 75 TRACE  171
    '#FF8040', // 76 TRACE  195
    '#FFC080', // 77 TRACE  284
    '#C08040', // 78 TRACE 1216
    '#FFFF80', // 79 TRACE 1550
    '#FFFFC0', // 80 TRACE 1600
    '#C0C080', // 81 TRACE 1700
    '#ffffff', // 82
    '#ffffff', // 83
    '#ffffff', // 84
    '#ffffff', // 85
    '#ffffff', // 86
    '#ffffff', // 87
    '#ffffff', // 88
    '#ffffff', // 89
    '#ffffff', // 90
    '#ffffff', // 91
    '#ffffff', // 92
    '#ffffff', // 93
    '#ffffff', // 94
    '#ffffff', // 95
    '#ffffff', // 96
    '#ffffff'  // 97
];