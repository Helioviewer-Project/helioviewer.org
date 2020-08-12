/**
 * @fileOverview Contains the class definition for an TimeSelector class.
 * @author <a href="mailto:serge.zahniy@nasa.gov">Serge Zahniy</a>
 */
"use strict";
var updateTimeField = false;

var TimeSelector = Class.extend({
	
	_timeSelectorPopupDomNode:false,
	_popupVisible: false,
	
    init: function () {
        var self = this;
        
        $('.dateSelector').off('click');
        $('.dateSelector').off('mouseenter');
        $('.dateSelector').removeAttr('title');
        
        
        //Set onHover effect
        this.onHover();
		$('.dateSelector').on('click', function(event, el) {
			var $el = $(this);
			
			if(
				typeof $el.attr('data-date-field') == 'undefined' || 
				typeof $el.attr('data-time-field') == 'undefined'
			){
				return false;
			}
			
			self.buildDialog(event, $el);
		});
    },
	
	getTime: function($el){
		var dateObjEnd, dateTimestampEnd, dateEnd, timeEnd, julianDateEnd, carringtonDateEnd
		
		if(typeof $el.attr('data-date-time') == 'undefined'){
			var dateField = $el.attr('data-date-field');
			var timeField = $el.attr('data-time-field');
			
			var date = $('#'+dateField).val();
			var time = $('#'+timeField).val();
		}else{
			var dateSplit = $el.attr('data-date-time').split(" ");
			var date = dateSplit[0];
			var time = dateSplit[1];
			
			if(typeof $el.attr('data-date-time-end') !== 'undefined'){
				var dateSplit = $el.attr('data-date-time-end').split(" ");
				var dateEnd = dateSplit[0];
				var timeEnd = dateSplit[1];
				
				var dateObjEnd = new Date(dateEnd+' '+timeEnd); 
				var dateTimestampEnd = getUTCTimestamp(dateEnd+'T'+timeEnd+ 'Z')
				
				var julianDateEnd = dateObjEnd.Date2Julian().toFixed(5);
				var carringtonDateEnd = timestamp_to_carrington(dateTimestampEnd).toFixed(7);
			}
		}
		
		
		var dateObj = new Date(date+' '+time); 
		var dateTimestamp = getUTCTimestamp(date+'T'+time+ 'Z')
		
		var julianDate = dateObj.Date2Julian();
		var carringtonDate = timestamp_to_carrington(dateTimestamp);
		
		return {
			dateObj: dateObj,
			date: date,
			time: time,
			julian: julianDate.toFixed(5),
			carrington: carringtonDate.toFixed(7),
			dateObjEnd: dateObjEnd,
			dateEnd: dateEnd,
			timeEnd: timeEnd,
			julianEnd: julianDateEnd,
			carringtonEnd: carringtonDateEnd
		};
	},
	
    onHover: function () {
        var self = this;
		// Create a preview tooltip
		if(outputType != "minimal"){
			$('.dateSelector').on('mouseenter', function(event){
				var tipPosition = $(this).attr('data-tip-pisition');
				
				
				var times = self.getTime($(this));
				
				var tcEnd = '';
				var tjEnd = '';
				if(typeof times.dateObjEnd !== 'undefined'){
					tcEnd = ' - '+times.carringtonEnd;
					tjEnd = ' - '+times.julianEnd;
				}
				
				var html = "<table class='preview-tooltip'>" +
						"<tr><td><b>Julian Day:</b></td><td>" + times.julian + tjEnd + "</td></tr>" +
						"<tr><td><b>Carrington:</b></td><td>"   + times.carrington + tcEnd + "</td></tr>" +
					"</table>";
					
				var tipObj = {
					overwrite: false,
					show: {
						ready: true,
						event: 'mouseover',
						delay: 500
					},
					hide: {
						event: 'mouseleave',
						delay: 500
					},
					events: {
						hide: function(event, api) {
							$(this).qtip('destroy');
							api.destroy(true);
							$(this).removeAttr('data-hasqtip');
							$(this).removeAttr('aria-describedby');
						}
					}
				};
				
				if(tipPosition == 'right'){
					tipObj.position = {
							my: "center left",
							at: "center right"
						};
					
				}else{
					tipObj.position = {
							my: "center right",
							at: "center left"
						};
				}
				
				$(this).attr('title', html).qtip(tipObj, event);

			});
		}
    },

    buildDialog: function (event, $el) {

        if ( !this._timeSelectorPopupDomNode ) {
            this._populatePopup($el);
        }

        if ( this._popupVisible ) {
            this._timeSelectorPopupDomNode.hide();
        }
        else {
	        var tipPosition = $el.attr('data-tip-pisition');

	        if(tipPosition == 'right'){
				this._timeSelectorPopupDomNode.css({
	                'left' :  (event.pageX + 12) + 'px',
	                'top' :   (event.pageY - 38) + 'px',
	                'z-index' : '1000',
	                'position' : 'absolute'
	            });
			}else{
				this._timeSelectorPopupDomNode.css({
	                'left' :  (event.pageX + 12 - 330) + 'px',
	                'top' :   (event.pageY - 38) + 'px',
	                'z-index' : '1000',
	                'position' : 'absolute'
	            });
			}
	        
            this._timeSelectorPopupDomNode.show();
            this._initEvents();
            $el.qtip('hide');
        }

        this._popupVisible = !this._popupVisible;
        return true;

    },
    
    _closePopup: function(){
	    this._timeSelectorPopupDomNode.hide();
	    this._popupVisible = !this._popupVisible;
	    return true;
    },
    
    _applyTime: function(){
	    
	    var currentDate = new Date($('.dateSelectorUTC').val() +' '+ $('.timeSelectorUTC').val());
	    var dateFiled = $('.convertDateField').val();
	    var timeFiled = $('.convertTimeField').val();

	    $('#'+dateFiled).val($('.dateSelectorUTC').val());
	    $('#'+timeFiled).val($('.timeSelectorUTC').val());
	    $('#'+timeFiled).TimePickerAlone('setValue', currentDate.toUTCTimeString());
	    
	    if(dateFiled == 'date' && timeFiled == 'time'){
		    helioviewer.timeControls.setDate( new Date($('.dateSelectorUTC').val().replace(/\//gi,'-') +'T'+ $('.timeSelectorUTC').val()+".000Z") );
	    }else{
	    	$('#'+timeFiled).val($('.timeSelectorUTC').val()).change();
	    }
	    
	    
	    this._closePopup();
	    return true;
    },
    
    _populatePopup: function ($el) {
        var content = '', self = this;
		
		var times = self.getTime($el);
		
        content     += '<div class="close-button ui-icon ui-icon-closethick" title="Close PopUp Window"></div>'+"\n"
                    +  '<h1 class="user-selectable">Time Converter</h1>'+"\n"
					+  '<div class="container">'+"\n"
                    +      "\t"+'<div class="param-container" style="width: 80px;"><div class="param-label" style="float:left;padding:5px 0px">UTC:</div></div>'+"\n"
                    +      "\t"+'<div class="value-container"><div class="param-value" style="float:left;padding:5px 0px">'
                    +  		'<input type="text" value="'+times.date+'" class="dateSelectorUTC" maxlength="10" class="hasDatepicker" style="width: 75px;">&nbsp;'
                    +		'<input type="text" value="'+times.time+'" class="timeSelectorUTC" maxlength="8" style="width: 75px;"> UTC</div></div></div>'+"\n"
                    +  '</div>'+"\n"
					+  '<div class="container">'+"\n"
                    +      "\t"+'<div class="param-container" style="width: 80px;"><div class="param-label" style="float:left;padding:5px 0px">Julian Day:</div></div>'+"\n"
                    +      "\t"+'<div class="value-container"><div class="param-value" style="float:left;padding:5px 0px"><input type="text" value="'+times.julian+'" maxlength="13" class="timeSelectorJulian" style="width: 169px;"></div></div>'+"\n"
                    +  '</div>'+"\n"
					+  '<div class="container">'+"\n"
                    +      "\t"+'<div class="param-container" style="width: 80px;"><div class="param-label" style="float:left;padding:5px 0px">Carrington:</div></div>'+"\n"
                    +      "\t"+'<div class="value-container"><div class="param-value" style="float:left;padding:5px 0px"><input type="text" value="'+times.carrington+'" class="timeSelectorCarrington" style="width: 169px;"></div></div>'+"\n"
                    +  '</div>'+"\n"
					+  '<div class="container" style="padding:10px;">'+"\n"
                    +		"\t"+'<input type="hidden" value="'+$el.attr('data-date-field')+'" class="convertDateField">'+"\n"
                    +		"\t"+'<input type="hidden" value="'+$el.attr('data-time-field')+'" class="convertTimeField">'+"\n"
                    +		"\t"+'<div class="text-btn timeSelectorApply">Set Time</div>'+"\n"
                    +		"\t"+'<div class="text-btn timeSelectorCancel">Cancel</div>'+"\n"
                    + 	   "<div style=\"clear:both\"></div>\n"
                    +  '</div>'+"\n";

        this._timeSelectorPopupDomNode = $('<div/>');
        this._timeSelectorPopupDomNode.hide();
        this._timeSelectorPopupDomNode.attr({
            'class' : "event-popup timeSelectorDialog"
        });

        this._timeSelectorPopupDomNode.html(content);

        // Event bindings
        this._timeSelectorPopupDomNode.find(".btn.event-info").bind('click', $.proxy(this._showEventInfoDialog, this));
        this._timeSelectorPopupDomNode.find('.close-button, .timeSelectorCancel').bind('click', $.proxy(this._closePopup, this));
        this._timeSelectorPopupDomNode.find('.timeSelectorApply').bind('click', $.proxy(this._applyTime, this));
        //this._timeSelectorPopupDomNode.bind("mousedown", function () { return false; });
        //this._timeSelectorPopupDomNode.bind('dblclick', function () { return false; });
        this._timeSelectorPopupDomNode.draggable();

        // Allow text selection (prevent drag where text exists)
        /*this._timeSelectorPopupDomNode.find("h1, .param-label, .param-value, .btn-container .btn").click(function(event){
            event.stopImmediatePropagation();
        });
        this._timeSelectorPopupDomNode.find("h1, .param-label, .param-value, .btn-container .btn").mousedown(function(event){
            event.stopImmediatePropagation();
        });
        this._timeSelectorPopupDomNode.find("h1, .param-label, .param-value, .btn-container .btn").dblclick(function(event){
            event.stopImmediatePropagation();
        });*/

        $('body').append(this._timeSelectorPopupDomNode);
    },
    
    /**
     * Initializes the observation time datepicker
     */
    _initEvents: function () {
        var self = this;
		$('.dateSelectorUTC').datetimepicker({
			timepicker:false,
			format:'Y/m/d',
			theme:'dark',
			onSelectDate:function(dt,$i){
				var currentDate = new Date($('.dateSelectorUTC').val() +' '+ $('.timeSelectorUTC').val());
				
				$('.timeSelectorJulian').val(dt.Date2Julian().toFixed(5));
				$('.timeSelectorCarrington').val(timestamp_to_carrington(dt.getTime()).toFixed(7));
				
				return true;
			}
		});
		
		//TimePicker
		var time = '';
		$('.timeSelectorUTC').TimePickerAlone({
			twelveHoursFormat:false,
			seconds:true,
			ampm:false,
			saveOnChange: true,
			//mouseWheel:false,
			theme:'dark',
			onHide: function ($input) {
				if(time != ''){
					updateTimeField = true;
					$input.val(time).change();
				}
				
				return true;
			},
			onChange: function (str, dt) {
				time = str;
				var currentDate = new Date($('.dateSelectorUTC').val()+' '+str);
				if(updateTimeField){
					$('.timeSelectorJulian').val(currentDate.Date2Julian().toFixed(5));
					$('.timeSelectorCarrington').val(timestamp_to_carrington(currentDate.getTime()).toFixed(8));
				}
			}
		});
		
		$("body").on('keyup', '.timeSelectorJulian',  function(event) {
			var julianDate = parseFloat($(this).val());
			var currentDate = julianDate.Julian2Date();
			$('.dateSelectorUTC').val(currentDate.toUTCDateString());
			$('.timeSelectorUTC').val(currentDate.toUTCTimeString());
			updateTimeField = false;
			$('.timeSelectorUTC').TimePickerAlone('setValue', currentDate.toUTCTimeString());
			$('.timeSelectorCarrington').val(timestamp_to_carrington(currentDate.getTime()).toFixed(8));
		});
		
		$("body").on('keyup', '.timeSelectorCarrington',  function(event) {
			var currentDate = carrington_to_timestamp($(this).val());
			$('.dateSelectorUTC').val(currentDate.toUTCDateString());
			$('.timeSelectorUTC').val(currentDate.toUTCTimeString());
			updateTimeField = false;
			$('.timeSelectorUTC').TimePickerAlone('setValue', currentDate.toUTCTimeString());
			$('.timeSelectorJulian').val(currentDate.Date2Julian().toFixed(5));
		});
		
		//Fix to hide time input popup
		/*$("body").on('click', '.timeSelectorDialog, .timeSelectorDialog input, .timeSelectorDialog .text-btn',  function(event, el) {
			$('.dateSelectorUTC').datetimepicker('hide');
			$('.timeSelectorUTC').blur();
			$('.periodpicker_timepicker_dialog').removeClass('visible');
		});
		$("body").on('focus', '.timeSelectorDialog input',  function(event, el) {
			$('.dateSelectorUTC').datetimepicker('hide');
			$('.timeSelectorUTC').blur();
			$('.periodpicker_timepicker_dialog').removeClass('visible');
		});*/
		
		//this._timeInput.bind('change', $.proxy(this._onTextFieldChange, this));
		//$('#vso-start-time').TimePickerAlone('setValue', $('#vso-start-time').val());
		//$('.periodpicker_timepicker_dialog').removeClass('visible');
		//$('#time').blur() ;
		//$('#date').datetimepicker('hide') 
		//this._timeInput.val(this._date.toUTCTimeString());
    },
});    
