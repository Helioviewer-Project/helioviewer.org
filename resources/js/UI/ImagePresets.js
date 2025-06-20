/**
 * @fileOverview Contains the class definition for an UserLayersPresets class.
 * @author <a href='mailto:serge.zahniy@nasa.gov'>Serge Zahniy</a>
 */
"use strict";

var UserLayersPresets = Class.extend({

    init: function () {
        var self = this;

        //Empty current list
        $('.layersPresetsList .dropdown-main > .sub-menu').html('');

        //Build HTML list of layers presets
        var html = this.buildList(SystemLayersPresets) + this.buildUserList();
        $('.layersPresetsList .dropdown-main > .sub-menu').html(html);

		//Init events
		this.initEvents();
    },

    initEvents: function(){
		var self = this;

		$(document).click(
            function(event){
	            event.stopPropagation();
                $('.dropdown-main').children('.sub-menu').slideUp(200);
                $('.item-add-form').hide();
				$('.userlist-add-item').show();
				$('.qtip').hide();
            }
        );

        $( '.dropdown-main' ).click(
            function(event){
	            event.stopPropagation();
                $(this).children('.sub-menu').slideDown(200);
            }
        );

        $( '.dropdown' ).hover(
            function(event){
                $(this).children('.sub-menu').slideDown(200);
            },
            function(event){
                $(this).children('.sub-menu').slideUp(200);
            }
        );

        $('.userlist-add-item').click(function(event){
	        event.stopPropagation();
	        self.setName();

	        $('.userlist-add-item').hide();
	        $('.item-add-form').show();
        });

        $('.userlist-cancel-item').click(function(event){
	        event.stopPropagation();
	        $('.item-add-form').hide();
	        $('.userlist-add-item').show();
        });

        $('.userlist-save-item').click(function(event){
	        event.stopPropagation();
	        $('.item-add-form').hide();
	        $('.userlist-add-item').show();

	        var date = helioviewerWebClient.viewport._tileLayerManager.getRequestDateAsISOString();
	        var imageLayersStr = helioviewerWebClient.viewport.serialize();
	        var eventsLayersStr = helioviewerWebClient.viewport.serializeEvents();

	        var item = {
				'name':$('.item-name').val(),
				'observationDate':'',
				'events':'',
				'events_v2':'',
				'layers':''
			};

	        //Add observation date
	        if($('input.item-date').is(':checked')){
				item.observationDate = date;
	        }

	        //Add datasources
	        if($('input.item-sources').is(':checked')){
		         item.layers = imageLayersStr;
	        }

	        //Add events
	        if($('input.item-events').is(':checked')){
		        if(eventsLayersStr != ''){
			        item.events = eventsLayersStr;
		        }else{
			        item.events = 'None';
		        }
	        }

	        if($('input.item-events').is(':checked')){
	            Helioviewer.eventLoader.ready((el) => {
	                item.events_v2 = el.getSelections();
	            });
	        }

	        var currentList = Helioviewer.userSettings.get("state.userTileLayers");
	        if(typeof currentList == 'undefined'){
		        currentList = [];
	        }
	        var nextItemId = currentList.length;
	        currentList.push(item);
	        Helioviewer.userSettings.set("state.userTileLayers", currentList);

			$('.item-add-form').hide();
			$('.userlist-add-item').show();

	        //add new item to the list
	        $('.layersPresetsList .dropdown-main > .sub-menu').find(' > li:nth-last-child(1)').before(self.listItem(nextItemId, item, true));
	        self.init();
        });

        $('.item-list-remove').click(function(event){
	        //event.stopPropagation();
	        var id = $(this).data('id');

	        var currentList = Helioviewer.userSettings.get("state.userTileLayers");
	        var newList = [];
	        $.each(currentList, function(key, item){
		        if(key != parseInt(id)){
			        newList.push(item);
		        }
	        });

	        Helioviewer.userSettings.set("state.userTileLayers", newList);
	        $('.item-list-'+id).qtip('api').toggle(false);
	        $('.item-list-'+id).qtip('destroy', true);
	        $('.item-list-'+id).remove();

	        self.init();
        });

        $('#image-layer-select').change(function(event){
	        event.stopPropagation();
			var optionSelected = $("option:selected", this);
			self._loadData(optionSelected);
        });

        $('.item-list, .image-layer-switch').click(function(event){
	        event.stopPropagation();
	        self._loadData(this);
        });

        $('.item-list').hover(
			function() {
				$('.qtip').hide();
				var id = $(this).data('id');
		        var name = $(this).data('name');
		        var date = $(this).data('date');
		        var layers = $(this).data('layers');
		        var events = $(this).data('events');

		        if(typeof id != 'undefined' && parseInt(id) >= 0){
			        if(typeof $(this).qtip('api') == 'undefined'){
				        var qt = $(this).qtip({
				            content: {
				                title: {
				                    text: name
				                },
				                text: self._buildPreviewTooltipHTML(id, name, date, layers, events)
				            },
				            position: {
				                adjust: {
				                    //x: -10,
				                    //y: -1
				                },
				                my: "left top",
				                at: "right center"
				            },
				            show: {
				                delay: 140
				            }
				        });
			        }
			        $(this).qtip('api').toggle(true);
		        }
			}, function() {
				$(this).qtip('api').toggle(false);
				//$(this).qtip('destroy', true);
			}
		);


		// Select default one if minimal
		var firstInitMinimalLayerSelection = true;
		if(Helioviewer.outputType == 'minimal'){
	        var selectValue = Helioviewer.userSettings.get('state.dropdownLayerSelectID');
	        if(typeof selectValue == 'undefined' || $('#image-layer-select option').length < selectValue){
		        selectValue = 0;
				Helioviewer.userSettings.set('state.dropdownLayerSelectID', 0);
	        }
			if(firstInitMinimalLayerSelection){
				//$("#image-layer-select").val(selectValue);
				setTimeout(function(){
					$("#image-layer-select option[value='"+selectValue+"']").attr('selected', 'selected').change();
				},250);
				firstInitMinimalLayerSelection = false;
			}else{
				$("#image-layer-select").val(selectValue);
			}
        }

	},

    _loadData: async function(el){
        var date = $(el).data('date');
        var layers = $(el).data('layers');
        var events = $(el).data('events');
        var events_v2 = $(el).data('events_v2');
        var settings = {};

        if(outputType == 'minimal'){
	        var selectValue = parseInt($(el).val());
	        Helioviewer.userSettings.set('state.dropdownLayerSelectID', selectValue);
        }


        if(typeof layers != 'undefined' && layers != ''){

	        layers = layers.slice(1, -1);
			settings['imageLayers'] = layers.split("],[");

			if (typeof helioviewerWebClient.viewport._tileLayerManager != "undefined") {
				helioviewerWebClient.viewport._tileLayerManager.each(function(){
					$(document).trigger("remove-tile-layer", [this.id]);
					$("#" + this.id + " *[oldtitle]").qtip("destroy");
					$('#TileLayerAccordion-Container').dynaccordion('removeSection', {id: this.id});
				});
			}
		    Helioviewer.userSettings._processURLSettings(settings);

		    helioviewerWebClient.viewport.tileLayers = Helioviewer.userSettings.get('state.tileLayers');

		    helioviewerWebClient.viewport._tileLayerManager = new HelioviewerTileLayerManager(
		    	helioviewerWebClient.viewport.requestDate,
		    	await helioviewerWebClient.viewport.dataSources,
		    	helioviewerWebClient.viewport.tileSize,
		    	helioviewerWebClient.viewport.imageScale,
		    	helioviewerWebClient.viewport.maxTileLayers,
		    	Helioviewer.userSettings.get('state.tileLayers')
		    );


		    $(document).trigger("update-viewport");
        }

        if(typeof date != 'undefined' && date != ''){
            // this will trigger everything about time change
            helioviewerWebClient.timeControls.setDate(Date.parseUTCDate(date));
        }

        if (typeof events_v2 != 'undefined' && events_v2 != '') {
            Helioviewer.eventLoader.ready((el) => {
                el.setFromSelections(events_v2.split(","));
            });
        } else if (typeof events != 'undefined' && events != '') {
            Helioviewer.eventLoader.ready((el) => {
                el.setFromSourceLegacyEventString(events);
            });
        }

        if($(el).qtip('api')){
	        $(el).qtip('api').toggle(false);
        }

        $('.dropdown-main').children('.sub-menu').slideUp(200);
        $('.item-add-form').hide();
		$('.userlist-add-item').show();
	},

	setName: function(){
		var dateString = '';
		var layerString = '';
		var eventsString = 'Events: ';

        //Add observation date
        if($('input.item-date').is(':checked')){
	        var date = helioviewerWebClient.viewport._tileLayerManager.getRequestDateAsISOString();
	        var dateObj = getDateFromUTCString(date);
	        dateString = dateObj.toDateString()+' '+dateObj.toTimeString();
        }

        //Add datasources
        if($('input.item-sources').is(':checked')){
	        //var imageLayersStr = Helioviewer.userSettings.parseLayersURLString();

	        var layerArray = Helioviewer.userSettings.get("state.tileLayers");


	        $.each(layerArray, function (i, layerObj) {

	            $.each(layerObj.uiLabels, function (i, labelObj) {
	                layerString += ' '+labelObj.name;
	            });

	            layerString += ",";
	        });
	        layerString = layerString.trim().replace(/,\s*$/, "");
        }

        //Add events
        if($('input.item-events').is(':checked')){
			var eventLayerArray = [];
			let events = Helioviewer.userSettings.get("state.events_v2");
	        Object.keys(events).forEach((section) => {
				eventLayerArray = eventLayerArray.concat(events[section].layers)
			});
	        if(eventLayerArray.length == 20){
		        eventsString += 'All';
	        }else{
		        $.each(eventLayerArray, function (i, eventLayerObj) {
			        if(parseInt(eventLayerObj.open) == 1){
				        eventsString += eventLayerObj.event_type+', '; //eventLayerObj.frms.join(';');
			        }
		        });
		        eventsString = eventsString.trim().replace(/,\s*$/, "");
	        }

        }

        if(layerString !== ''){
	        name = layerString;
        }else if(dateString !== ''){
	        name = dateString;
        }else if(eventsString !== 'Events: '){
	        name = eventsString;
        }

		$('.item-name').val(name);

        return;
	},

	listItem: function(k,v, user){
		let html = '<li class="item-list-'+k+' item-list" data-id="'+k+'" data-name="'+v.name+'" data-date="'+v.observationDate+'" data-layers="'+v.layers+'" data-events="'+v.events+'" ';

		if (v.hasOwnProperty('events_v2')) {
			html = html + 'data-events_v2="'+v.events_v2+'"';
		}

		html = html + '>';
		html = html + '<a href="#" class="" >';
		html = html + ((typeof user != 'undefined' && user == true) ? '<span class="fa fa-trash-o item-list-remove" data-id="'+k+'"></span>' : ''); 
		html = html + v.name;
		html = html + '</a>';
		html = html + '</li>';


		return html
	},

	buildList: function(obj){
		var self = this;
		var listHTML = '';

		//Build System layers first
		$.each(obj, function(k, v){

			if(typeof v.submenu != 'undefined'){

				listHTML += '<li class="dropdown"><a href="#">'+v.name+' <i class="arrow arrow-right"></i></a><ul class="sub-menu">';

				if(v.submenu.length > 0){
					listHTML += self.buildList(v.submenu);
				}else{
					listHTML += '<li><a href="#" class="item-list">Empty</a></li>';
				}
				listHTML += '</ul>';

				if(typeof v.items != 'undefined' && v.items.length > 0){
					listHTML += '<li class="divider"></li>';

					$.each(v.items, function(key, value){
						listHTML += self.listItem(key,value);
					});
				}

			} else {
				listHTML += self.listItem(k,v);
			}

		});

		//Build User layers
		var userTileLayers = Helioviewer.userSettings.get("state.userTileLayers");
		var userTileLayersHTML = '';
		if(typeof userTileLayers != 'undefined' && userTileLayers.length > 0){
			var userTileLayersHTML = '<li class="divider"></li>';
		}else{

		}

		return listHTML;
	},

	buildUserList: function(obj){

		var self = this;
		var listHTML = '';

		//Build User layers
		var userTileLayers = Helioviewer.userSettings.get("state.userTileLayers");
		if(typeof userTileLayers != 'undefined' && userTileLayers.length > 0){
			listHTML = '<li class="divider"></li>';
			$.each(userTileLayers, function(k, v){
				listHTML += self.listItem(k, v, true);
			});
		}else{

		}

		listHTML += '<li>\
							<div class="text-button fa fa-plus userlist-add-item"> Add Item</div>\
							<div class="item-add-form" style="display:none;">\
								<div><label for="item-name-input">Name:</label> <input id="item-name-input" type="text" value="" name="item-name" class="item-name" style="width:130px;"></div>\
								<div>\
									Data:<br/>\
									<div style="padding:0px 0px 0px 40px;">\
										<input type="checkbox" value="" name="item-date" class="item-date" checked="checked" id="item-date-input"> <label for="item-date-input">Observation Date</label><br/>\
										<input type="checkbox" value="" name="item-sources" class="item-sources" checked="checked" id="item-sources-input"> <label for="item-sources-input">Data Sources</label><br/>\
										<input type="checkbox" value="" name="item-events" class="item-events" checked="checked" id="item-events-input"> <label for="item-events-input">Events</label><br/>\
									</div>\
									<div>\
										<div class="text-button userlist-cancel-item" style="float:left;">Cancel</div>\
										<div class="text-button userlist-save-item" style="float:right;">Save</div>\
										<div style="display:block;clear:both;"></dvi>\
									</div>\
								</div>\
							</div>\
						</li>';

		return listHTML;
	},

	_buildPreviewTooltipHTML: function (id, name, date, layers, events) {
		var dateFormated = '', layersFormated = '', eventsFormated = '', urlDate = '', urlLayers = '', urlEvents = '';
        var eventLabels = 'false';


        var vport = helioviewerWebClient.viewport.getViewportInformation();
        var roi = {
	          'left': vport['coordinates']['left'],
	         'right': vport['coordinates']['right'],
	           'top': vport['coordinates']['top'],
	        'bottom': vport['coordinates']['bottom']
	    };

        var imageScale = vport['imageScale'];
		var x0 = (imageScale * (roi.left + roi.right) / 2).toFixed(2);
	    var y0 = (imageScale * (roi.bottom + roi.top) / 2).toFixed(2);
	    var width  = (( roi.right - roi.left ) * imageScale).toFixed(2);
	    var height = (( roi.bottom - roi.top ) * imageScale).toFixed(2);

		var x1 = Math.round(parseFloat(x0) - parseFloat(width / 2));
	    var x2 = Math.round(parseFloat(x0) + parseFloat(width / 2));

	    var y1 = Math.round(parseFloat(y0) - parseFloat(height / 2));
	    var y2 = Math.round(parseFloat(y0) + parseFloat(height / 2));

        if(typeof date != 'undefined' && date != ''){
	        urlDate = date;

	        dateFormated = '<tr>\
	            		<td width="100px"><b>Observation Date:</b></td>\
	            		<td>' + date.substr(0, 19).replace(/T/, " ") + '</td>\
	            	</tr>';
        }else{
	        urlDate = vport.time;
        }

        if(typeof layers != 'undefined' && layers != ''){
	        urlLayers = layers;
	        var imageLayersString = layers.slice(1, -1);
	        var imageLayersArr = imageLayersString.split("],[");
	        var layerString = '';
	        $.each(imageLayersArr, function(k, v){
		        var layerArr = v.split(",");
		        layerString += layerArr[0]+' '+ layerArr[1]+' '+ layerArr[2]+ (layerArr[3] == 1 || layerArr[3] == 0  ? '' : ' '+ layerArr[3]) +';<br/>';
	        });

	        layersFormated = '<tr>\
						<td><b>Data Sources:</b></td>\
						<td>'+layerString+'</td>\
					</tr>';
        }else{
	        urlLayers = vport.layers;
        }


        if(typeof events != 'undefined' && events != ''){
	        eventLabels = 'true';

	        if(events == 'None'){
		        urlEvents = '';
		        eventString = 'None';
	        }else{
		        urlEvents = events;

		        var eventLayersString = events.slice(1, -1);
		        var eventLayersArr = eventLayersString.split("],[");
		        var eventString = '';
		        $.each(eventLayersArr, function(k, v){
			        var layerArr = v.split(",");
			        eventString += ' '+layerArr[0]+',';
		        });

		        eventString = eventString.trim().replace(/,\s*$/, "");
	        }

	        eventsFormated = '<tr>\
						<td><b>Events:</b></td>\
						<td>'+eventString+'</td>\
					</tr>';
        }else{
	        urlEvents = vport.events;
        }



        var screenshotUrl = Helioviewer.api+'?action=takeScreenshot&imageScale='+imageScale+'&layers='+urlLayers+'&events='+urlEvents+'&eventLabels='+eventLabels+'&scale=false&scaleType=earth&scaleX=0&scaleY=0&date='+urlDate+'&x1='+x1+'&x2='+x2+'&y1='+y1+'&y2='+y2+'&display=true&watermark=false&switchSources=true';
        var html = '<div style="text-align: center;">\
            		<img style="width:200px;" src="'+screenshotUrl+'" alt="preview thumbnail" class="screenshot-preview" />\
            	</div>\
	            <table class="preview-tooltip">\
	            	'+ dateFormated + layersFormated + eventsFormated +'\
	            </table>';

        return html;
    }

});


var SystemLayersPresets = [
	{
		'name':'NOAA flares and active regions',
		'observationDate':'',
		'events':'[AR,NOAA_SWPC_Observer,1],[FL,SWPC,1]',
		'layers':'[SDO,AIA,171,1,100,0,60,1,2017-11-16T09:02:20.000Z]'
	},
	{
		'name':'Eruption Monitor',
		'observationDate':'',
		'events':'[CE,all,1],[ER,all,1],[FI,all,1],[FA,all,1],[FE,all,1]',
		'layers':'[SDO,AIA,304,1,100,0,60,1,2017-11-16T09:02:20.000Z],[SOHO,LASCO,C2,white-light,1,100,0,60,1,2017-05-18T15:35:00.000Z],[SOHO,LASCO,C3,white-light,1,100,0,60,1,2017-05-18T15:35:00.000Z]'
	},
	{
		'name':'Magnetic flux Monitor',
		'observationDate':'',
		'events':'[EF,all,1],[SS,all,1]',
		'layers':'[SDO,HMI,magnetogram,1,100,0,60,1,2017-11-16T09:02:20.000Z]'
	},
	{
		'name':'Coronal hole Monitor',
		'observationDate':'',
		'events':'[CH,all,1]',
		'layers':'[SDO,AIA,211,1,100,0,60,1,2017-11-16T09:02:20.000Z]'
	},
	{
		'name':'Sunspots',
		'observationDate':'',
		'events':'[SS,all,1]',
		'layers':'[SDO,HMI,continuum,1,100,0,60,1,2017-11-16T09:02:20.000Z]'
	},
	{
		'name':'Solar Flare Predictions',
		'observationDate':'',
		'events':'[FP,all,1]',
		'layers':'[SDO,AIA,171,1,100,0,60,1,2017-11-16T09:02:20.000Z]'
	},


];
