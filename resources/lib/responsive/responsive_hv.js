// START onload 
$(function() {

	// positioning movie player
	$('.ui-dialog:has(div.movie-player-dialog)').css({'width':'100%','top':'37px'});

	// Change verbiage for Create a Screenshot menu button 
	$('#screenshot-manager-full-viewport').html('<span class="fa fa-arrows-alt fa-fw"></span>&nbsp;<span style="line-height: 1.6em">Take a Screenshot</span>');
	
	// Change verbiage for Create a Movie menu button
	$('#movie-manager-full-viewport').html('<span class="fa fa-arrows-alt fa-fw"></span>&nbsp;<span style="line-height: 1.6em">Create a Movie</span>');

	// add an anchor to topbar of pull-out menu windows on mobile
	$('.hv-drawer-right').prepend('<span class="mobmenutopanchor"></span>');

	// add closing X to #hv-drawer-right
	$('.hv-drawer-right').prepend('<div class="hvmobmenuclose_div"><div class="hvmobmenutitle_div"></div><img class="hvmobmenuclose" src="https://develop.helioviewer.org/resources/images/mobile/mobdsclose2.png">&nbsp;&nbsp;</div>');

	// show updated HEK top nav
	$('.event-info').on('click', function(){
		console.log('event info clicked');
		$('.event-info-dialog-menu').delay(1000).html('<a class="show-tags-btn event-type selected">Active Region</a><a class="show-tags-btn obs">Observation</a><a class="show-tags-btn frm">Recognition Method</a><a class="show-tags-btn ref">References</a><a class="show-tags-btn all right">All</a>');
		$('.event-info-dialog-menu').css('display','block');
	});



	// force-close right drawers (add drawers as necessary)
	function closeallHVwindows() {
		$('#hv-drawer-left').css('display','none');
		$('#hv-drawer-data').css('display','none');
		$('.hv-drawer-right').css('display','none');
		$('#hv-drawer-movies').css('display','none');
		$('#hv-drawer-movies').attr('style', 'display: none');
		$('.ui-icon-closethick').trigger('click');
	}
	
	setTimeout(function(){closeallHVwindows()},100);


	// closing pull-out menu windows
	$(".hvmobmenuclose").click(function(){
		$('.hvmobmenuclose_div').css('display','none');
		$('.hv-drawer-right').css('display','none');
		$('.hv-drawer-right').attr('style', 'display: none');
	});
	
	$(".hvmobmenuclose").click();


	// current datasource that's open
	var currdsopen= 'nonexistentds';
	
	// datasource window open
	var dswindowopen='no';

	// add an anchor to topbar of datasource window on mobile
	$('#hv-drawer-left').prepend('<span id="mobdrawertopanchor"></span>');

	// add closing X to #hv-drawer-left
	$('#hv-drawer-left').prepend('<div id="hvmobdrawerclose_div"><div id="hvmobdrawertitle_div"></div><img id="hvmobdrawerclose" src="https://develop.helioviewer.org/resources/images/mobile/mobdsclose2.png">&nbsp;&nbsp;</div>');

	// closing drawer function
	$("#hvmobdrawerclose").click(function(){
		$('#accordion-date, #accordion-images, #accordion-events, #accordion-bodies').css('display','none');
		$('#hvmobdrawerclose_div').css('display','none');
		$('#hv-drawer-left').css('display','none');
		$('#hv-drawer-left').attr('style', 'display: none');
		$('.hvmobdstabs .hvmobds_icon').css('filter','invert(81%) sepia(7%) saturate(4%) hue-rotate(6deg) brightness(95%) contrast(91%)');
		$('.hvmobdstabs span').css({'color':'silver'});
		currdsopen= 'nonexistentds';
	});

	// hide triangle disclosure
	$('#accordion-images .header h1').css('margin-left','80px');
	$('#accordion-images .accordion-header').append('&nbsp;&nbsp;&nbsp;');

  var zeynep = $('.zeynep').zeynep({
    opened: function () {
    }
  })

  // dynamically bind 'closing' event
  zeynep.on('closing', function () {
	
  })

  // handle zeynepjs overlay click
  $('.zeynep-overlay').on('click', function () {
    $(".hamburger").removeClass("is-active");
	zeynep.close();
  })

  // open zeynepjs side menu
  $('.btn-open, .hamburger').on('click', function () {
    if($(".hamburger").hasClass("is-active")) {
		$(".hamburger").removeClass("is-active");
		zeynep.close();
	}
	else {
		zeynep.open();
		$(".hamburger").addClass("is-active");
		$(".hv-drawer-right").css('display','none');
	}
  })

	// close event pop-ups
	let mobpopupopen= 'no';


	// click datasource items
	
	$(".hvmobdstabs").click(function(){
		
		// close all ui-dialog windows
		$('.ui-dialog').css('display','none');
		$('.ui-icon-closethick').trigger('click');
		
		// close event-popup window
		$('#event-popup_mob').css('display','none');
		$('#event-popup_mob').html('');
		mobpopupopen= 'no';
		
		document.getElementById("mobdrawertopanchor").scrollIntoView();
		
		var thisdrawersect= $(this).attr('drawersec');
		

		
		$('.hvmobdstabs .hvmobds_icon').css('filter','invert(81%) sepia(7%) saturate(4%) hue-rotate(6deg) brightness(95%) contrast(91%)');
		$('.hvmobdstabs span').css({'color':'silver'});

		$(this).children('.hvmobds_icon').css('filter','invert(91%) sepia(89%) saturate(602%) hue-rotate(331deg) brightness(102%) contrast(94%)');
		$(this).children('span').css({'color':'#f7e057','filter':'none'});
		
		// if a data source button is clicked while its screen is already open, close it
		if(currdsopen == thisdrawersect) {
			
			if(dswindowopen=='yes') {
				$('#'+currdsopen).css('display','none');
				$('#hv-drawer-left').attr('style', 'display: none');
				$('.hvmobdstabs .hvmobds_icon').css('filter','invert(81%) sepia(7%) saturate(4%) hue-rotate(6deg) brightness(95%) contrast(91%)');
				$('.hvmobdstabs span').css({'color':'silver'});
				dswindowopen='no';
			}
			else {
				$('#'+currdsopen).css('display','block');
				$('#hv-drawer-left').attr('style', 'display: block');
				$(this).children('.hvmobds_icon').css('filter','invert(91%) sepia(89%) saturate(602%) hue-rotate(331deg) brightness(102%) contrast(94%)');
				$(this).children('span').css({'color':'#f7e057','filter':'none'});
				dswindowopen='yes';
			}
			
		}		
		
		// if it's not already open, close currently open drawer and open correct one
		if(thisdrawersect != currdsopen) {
			$('.hv-drawer-right').css({'display':'none'});
			$('#hv-drawer-left').attr('style', 'display: none');
			$('#'+currdsopen).css('display','none');
			$('#'+thisdrawersect).css('display','block');
			$('#hv-drawer-left').css({'display':'block','height':'100%'});
			$('#hvmobdrawerclose_div').css('display','block');
			var thisdrmobtitle= $('#'+thisdrawersect+' .header h1:first').text();
			switch(thisdrawersect) {
				case 'accordion-images':
					$('#hvmobdrawertitle_div').html('Images & Layers');
					break;
				case 'accordion-events':
					$('#hvmobdrawertitle_div').html('Features & Events');
					break;
				case 'accordion-bodies':
					$('#hvmobdrawertitle_div').html('Celestial Bodies');
					break;
			}
			currdsopen= thisdrawersect;
			dswindowopen='yes';
		}

	});
	
	// click mobile menu items
	$(".hvmobmenuitems").click(function(){
		
		currdsopen= 'nonexistentds';
		$(".hamburger").removeClass("is-active");
		zeynep.close();
		$('.hv-drawer-right').css({'display':'none'});
		$('#hv-drawer-left').css('display','none');
		$('#hv-drawer-left').attr('style', 'display: none');
		$('.ui-dialog').css('display','none');
		$('.ui-icon-closethick').trigger('click');
		
		$('.hvmobdstabs .hvmobds_icon').css('filter','invert(81%) sepia(7%) saturate(4%) hue-rotate(6deg) brightness(95%) contrast(91%)');
		$('.hvmobdstabs span').css({'color':'silver'});
		
		var thisdrawersect2= $(this).attr('drawersec');
		
		$('#'+thisdrawersect2).css('display','block');
		$('#'+thisdrawersect2+' .hvmobmenuclose_div').css('display','block');

		
			switch(thisdrawersect2) {
				case 'hv-drawer-news':
					console.log('#'+thisdrawersect2+' .hvmobmenutitle_div');
					$('#'+thisdrawersect2+' .hvmobmenutitle_div').html('Helioviewer Project Announcements');
					break;
				case 'hv-drawer-youtube':
					$('#'+thisdrawersect2+' .hvmobmenutitle_div').html('Shared To Youtube');
					break;
				case 'hv-drawer-movies':
					$('#'+thisdrawersect2+' .hvmobmenutitle_div').html('Create A Movie');
					break;
				case 'hv-drawer-screenshots':
					$('#'+thisdrawersect2+' .hvmobmenutitle_div').html('Create A Screenshot');
					break;
				case 'hv-drawer-data':
					$('#'+thisdrawersect2+' .hvmobmenutitle_div').html('Request Science Data Download');
					break;
				case 'hv-drawer-share':
					$('#'+thisdrawersect2+' .hvmobmenutitle_div').html('Share Viewport On Social Media');
					break;
				case 'hv-drawer-about':
					//$('.ui-dialog[aria-describedby="about-dialog"]').css('display','block');
					$('#help-links-about').trigger('click');
					$('#'+thisdrawersect2+' .hvmobmenutitle_div').html('About Helioviewer');
					break;
				case 'hv-drawer-glossary':
					//$('.ui-dialog[aria-describedby="glossary-dialog"]').css('display','block'); //aria-describedby="glossary-dialog"
					$('#help-links-glossary').trigger('click');
					$('#'+thisdrawersect2+' .hvmobmenutitle_div').html('Visual Glossary');
					break;
			}
		document.getElementById(thisdrawersect2).scrollIntoView();
		
		
		
	});
	
	
	// click mobile Get Help With Helioviewer menu items
	// drawersec="hv-drawer-glossary"
	/*
	$(".hvmobmenuitems").click(function(){
		let testytesterson='test';
		
		currdsopen= 'nonexistentds';
		$(".hamburger").removeClass("is-active");
		zeynep.close();
		$('.hv-drawer-right').css({'display':'none'});
		$('#hv-drawer-left').css('display','none');
		$('#hv-drawer-left').attr('style', 'display: none');
		
		$('.hvmobdstabs .hvmobds_icon').css('filter','invert(81%) sepia(7%) saturate(4%) hue-rotate(6deg) brightness(95%) contrast(91%)');
		$('.hvmobdstabs span').css({'color':'silver'});
		
		
		switch() {
			case 
		}
		
	});
*/	
	

	// when datetime arrows are clicked
	$('.dtcycle_arrows_td').click(function(){

		
		var thismobdtbtn= $(this).attr('hvdtcontrol');
		
		
		// determine which btn was pressed
		switch(thismobdtbtn) {
			case 'year_up':
				
				break;
			case 'month_up':
				
				break;
			case 'day_up':
				$('#timeForwardBtn').trigger('click');
				break;
			case 'day_down':
				$('#timeBackBtn').trigger('click');
				break;
		}
		
		datetimemobModule();
		
	});



	// move zoom controls to the body
	$($("#zoom").detach()).appendTo("body");
	$("#center-button, #zoom-out-button, #zoom-in-button").css({'display':'none'});
	$("#zoom, #zoomControls, #zoomSliderContainer").css({'display':'block'});
	
	
	
	// clone the #date element and make it readonly so the keyboard doesn't show
	$("#date").clone().appendTo("#hvmobdate_td");
	//$("#date").attr('readonly', 'readonly');
	
	// take the time element out of focus after changed
	$("#date").change(function(){
		$("#date").blur(); 
	});
	
	/*
	$("#date").focus(function(){
		$("#date").removeAttr("readonly");
	});	
	
	$("#date").blur(function(){
		$("#date").attr('readonly', 'readonly');
	});	
	*/
	
	
	// clone the #time element and make it readonly so the keyboard doesn't show
	$("#time").clone().appendTo("#hvmobtime_td");
	$("#time").attr('readonly', 'readonly');
	
	// take the time element out of focus after changed
	$("#time").change(function(){
		$("#time").blur(); 
	});
	
	
	
	
	// clone JUMP drop-down
	$('#timestep-select').css('float','none');
	$("#timestep-select").clone().appendTo("#hvmobjump_div");
	
	// testing: tie JUMP to desktop jump select field
	$("#hvmobjump_sel").change(function(){
	  $("#timestep-select").val($(this).val()).trigger('change');
	});
	
	// clone #scale element into the mobile menu
	$("#scale").clone().appendTo("#hvmobscale_div");
	
	// clone #center-button element into the mobile menu
	$("#center-button").clone().appendTo("#scale");
	$("#center-button").css('display','inline-block');	
	
	// close mobile menu when earth/scale buttons pressed
	$("#earth-button, #scalebar-button, #center-button").click(function(){
		$(".hamburger").removeClass("is-active");
		zeynep.close();
	});


// Event Popups

function closeMobEventPopup() {
	$('#event-popup_mob').css('display','none');
	$('#event-popup_mob').html('');
	mobpopupopen= 'no';
}

$(document.body).on('click', '.close-button' ,function(){
	if(mobpopupopen == 'yes') {
		//$('#invispopupbg').css('display','none');
		closeMobEventPopup();
	}
});



// START detect event pop-ups and paste content into redesigned mobile pop-up
let evpopupid=1;
let evpopuphtml='';
let evrelattr='';
let evpoprelattr='';

// when event markers are clicked
$(document.body).on('click','.event-marker', function(){
	
	// get this event marker's rel attribute
	evrelattr = $(this).attr('rel');
	console.log('evrelattr = '+evrelattr);
	
	// cycle each of the accessed popups
	$(".event-popup").each(function(i, obj) {
		evpoprelattr = $(obj).attr('rel');
		console.log('evpoprelattr = '+evpoprelattr);
		
		// if popup doesn't have a rel attribute, assign it one associated with this marker's rel attribute
		if(evpoprelattr === undefined || evpoprelattr === false || evpoprelattr === null) {
			console.log('detected undefined');
			evpoprelattr=evrelattr;
			$(this).attr('rel',evpoprelattr);
			$(this).attr('id','event-popup-'+evpopupid);
			evpopupid++;
		}
		
		// if this popup is in the DOM and is bound to the event marker
		if($(this).length && evrelattr == evpoprelattr) {
			console.log('event marker clicked');
			//$('.event-popup[rel="'+evpoprelattr+'"]').show();
			evpopuphtml= $('.event-popup[rel="'+evpoprelattr+'"]').html();
			$('#event-popup_mob').html('<div>'+evpopuphtml+'</div>');
			if(mobpopupopen== 'no') {
				//$('#invispopupbg').css('display','block');
				$('#event-popup_mob').css('display','block');
				$('#event-popup_mob').attr('rel',$(this).attr('id'));
				mobpopupopen= 'yes';
			}
			else if(mobpopupopen== 'yes') {
				//$('#invispopupbg').css('display','none');
				closeMobEventPopup();
			}
			//observer.observe(obj);
			return false;
		}
	});
});
// END detect event pop-ups and paste content into redesigned mobile pop-up


// trigger clicks to original popups
// .event-info, .event-create-movie, .event-search-external, .copy-to-data

// trigger event popup click to HEK info
$(document.body).on('click','#event-popup_mob .event-info', function(){
	let evIDtoaccess= $('#event-popup_mob').attr('rel');
	console.log('#'+evIDtoaccess+' .event-info');
	$('#'+evIDtoaccess+' .event-info').trigger("click");
	closeMobEventPopup();
});

// trigger event popup click to create movie 
$(document.body).on('click','#event-popup_mob .event-create-movie', function(){
	let evIDtoaccess= $('#event-popup_mob').attr('rel');
	$('#'+evIDtoaccess+' .event-create-movie').trigger("click");
	closeMobEventPopup();
});

// trigger event popup click to search (1) 
$(document.body).on('click','#event-popup_mob .event-search-external', function(){
	window.open($(this).attr('data-url'), '_blank');
});

// trigger event popup click to copy start/end times to data download 
$(document.body).on('click','#event-popup_mob .copy-to-data', function(){
	let evIDtoaccess= $('#event-popup_mob').attr('rel');
	$('#'+evIDtoaccess+' .copy-to-data').trigger("click");
	closeMobEventPopup();
});


// START Celestial Bodies popups celestial-bodies-label

$('.celestial-bodies-label').css('z-index','11');

let cbpopuphtml= '';
let thiscblabelid='';
let cbgetpopupid='';
let thiscbtype='';

// when celestial bodies are clicked
$(document.body).on('mousedown','.celestial-bodies-label', function(){
	console.log('cb clicked');
	/*
	closeMobEventPopup();
	
	// this celestial body label ID
	thiscblabelid= $(this).attr('id');
	
	// get the celestial body
	if(thiscblabelid.search("mercury")>0){ thiscbtype='mercury'; }
	else if(thiscblabelid.search("venus")>0) { thiscbtype='venus'; }
	else if(thiscblabelid.search("earth")>0) { thiscbtype='earth'; }
	else if(thiscblabelid.search("mars")>0) { thiscbtype='mars'; }
	else if(thiscblabelid.search("jupiter")>0) { thiscbtype='jupiter'; }
	else if(thiscblabelid.search("saturn")>0) { thiscbtype='saturn'; }
	else if(thiscblabelid.search("uranus")>0) { thiscbtype='uranus'; }
	else if(thiscblabelid.search("psp")>0) { thiscbtype='psp'; }
	
	// if soho
	if(thiscblabelid.search("soho")) {
		cbgetpopupid= 'soho_'+thiscbtype+'_popup';
	}
	
	// if stereo-a
	else if(thiscblabelid.search("stereo_a")) {
		cbgetpopupid= 'stereo_a_'+thiscbtype+'_popup';
	}
	
	// if stereo-b
	else if(thiscblabelid.search("stereo_b")) {
		cbgetpopupid= 'stereo_b_'+thiscbtype+'_popup';
	}

	cbpopuphtml= $('#'+cbgetpopupid).html();
	$('#event-popup_mob').html(cbpopuphtml);
	*/
});


// END Celestial Bodies popups 



	// on orientation change [portait / landscape]
	$(window).on('orientationchange resize', function () {
		$(".periodpicker_timepicker_dialog").removeClass("visible");
		$("#time").blur(); 
	});




}); // END onload





// START media query 

function hvOnResize() {
	if (window.matchMedia("(max-width: 991px)").matches) {
	  // Viewport is less or equal to 991 pixels wide
		$('#hv-drawer-left').attr('style', 'display: none !important');
		$('#hv-drawer-left').css({'display':'none'});
		enctimeoutmobile = setTimeout(showEncounter, 3000);
	} else {
	  // Viewport is greater than 991 pixels wide
	  $('.hamburger').css('display','none');
	  
	}
}

// END media query 


	// mobile datetime module
	
	var hvmonthnames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];	
	
	function datetimemobModule() {
		var hvdateelemval= $('#date').val();
		var hvtimeelemval= $('#time').val();

		var hvmobdateobj = new Date(hvdateelemval+' '+hvtimeelemval); // ' 00:00:00'
		var hvmobyear = hvmobdateobj.getFullYear();
		var hvmobmonth = hvmonthnames[hvmobdateobj.getMonth()];
		var hvmobday = hvmobdateobj.getDate();

		$('#dt_month_td').html(hvmobmonth);
		$('#dt_day_td').html(hvmobday);
		$('#dt_year_td').html(hvmobyear);	
	}
	
	const hvmobdateobj_init = new Date();
	$('#dt_month_td').html(hvmonthnames[hvmobdateobj_init.getMonth()]);
	$('#dt_day_td').html(hvmobdateobj_init.getDate());
	$('#dt_year_td').html(hvmobdateobj_init.getFullYear());
	
	$('#hvmobtime_input').val(hvmobdateobj_init.getHours()+':'+hvmobdateobj_init.getMinutes()+':'+hvmobdateobj_init.getSeconds());
	
	setTimeout(function(){datetimemobModule();},2000);
