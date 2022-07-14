// onload 
$(function() {

	// Change verbiage for Create a Screenshot menu button       span:nth-child(2)
	$('#screenshot-manager-full-viewport').html('<span class="fa fa-arrows-alt fa-fw"></span>&nbsp;<span style="line-height: 1.6em">Take a Screenshot</span>');
	
	// Change verbiage for Create a Movie menu button
	$('#movie-manager-full-viewport').html('<span class="fa fa-arrows-alt fa-fw"></span>&nbsp;<span style="line-height: 1.6em">Create a Movie</span>');

	// add an anchor to topbar of pull-out menu windows on mobile
	$('.hv-drawer-right').prepend('<span class="mobmenutopanchor"></span>');

	// add closing X to #hv-drawer-right
	$('.hv-drawer-right').prepend('<div class="hvmobmenuclose_div"><div class="hvmobmenutitle_div"></div><img class="hvmobmenuclose" src="https://develop.helioviewer.org/resources/images/mobile/mobdsclose2.png">&nbsp;&nbsp;</div>');

	// force-close right drawers (add drawers as necessary)
	$('#hv-drawer-movies').css('display','none');
	$('#hv-drawer-movies').attr('style', 'display: none');


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
      //console.log('the side menu is opened')
    }
  })

  // dynamically bind 'closing' event
  zeynep.on('closing', function () {
    //console.log('this event is dynamically binded')
	
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
	}
  })


	// click datasource items
	
	$(".hvmobdstabs").click(function(){
		
		console.log('Currently open: '+currdsopen);
		console.log('Just clicked: '+$(this).attr('drawersec'));
		
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
			//$('#hv-drawer-left').fadeOut("fast");
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
		
		$('.hvmobdstabs .hvmobds_icon').css('filter','invert(81%) sepia(7%) saturate(4%) hue-rotate(6deg) brightness(95%) contrast(91%)');
		$('.hvmobdstabs span').css({'color':'silver'});
		
		var thisdrawersect2= $(this).attr('drawersec');
		$('#'+thisdrawersect2+' .hvmobmenuclose_div').css('display','block');
		$('#'+thisdrawersect2).css('display','block');
			switch(thisdrawersect2) {
				case 'hv-drawer-news':
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
			}
		document.getElementById(thisdrawersect2).scrollIntoView();
		
		
		
	});
	

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

	
	//$('#moving-container').draggable("destroy");

	// move zoom controls to the body
	$($("#zoom").detach()).appendTo("body");
	$("#center-button, #zoom-out-button, #zoom-in-button").css({'display':'none'});
	$("#zoom, #zoomControls, #zoomSliderContainer").css({'display':'block'});


	//testing: tie time to desktop time
	/*
	$("#hvmobtime_input").change(function(){
	  $("#time").val($(this).val()).trigger('change');
	});
	
	$("#time").change(function(){
	  $("#hvmobtime_input").val($(this).val());
	});
	*/
	
	
	
	// clone the #date element and make it readonly so the keyboard doesn't show
	$("#date").clone().appendTo("#hvmobdate_td");
	$("#date").attr('readonly', 'readonly');
	
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
	$("#scale").clone().appendTo("#hvmobscale_li");
	
	// clone #center-button element into the mobile menu
	$("#center-button").clone().appendTo("#scale");
	$("#center-button").css('display','inline-block');	
	
	// close mobile menu when earth/scale buttons pressed
	$("#earth-button, #scalebar-button, #center-button").click(function(){
		$(".hamburger").removeClass("is-active");
		zeynep.close();
	});
	


	// testing: features & events marker tracking
	$(".event-marker").click(function(){
		console.log("event-marker clicked");
		alert("event-marker clicked");
	});

	// on orientation change [portait / landscape]
	$(window).on('orientationchange resize', function () {
		//$(".periodpicker_timepicker_dialog.visible").css('display','none');
		$(".periodpicker_timepicker_dialog").removeClass("visible");
		$("#time").blur(); 
	});

});




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
		//console.log(hvdateelemval+' '+hvtimeelemval);
		//console.log(hvmobmonth+' '+hvmobday+' '+hvmobyear);	
	}
	
	const hvmobdateobj_init = new Date();
	$('#dt_month_td').html(hvmonthnames[hvmobdateobj_init.getMonth()]);
	$('#dt_day_td').html(hvmobdateobj_init.getDate());
	$('#dt_year_td').html(hvmobdateobj_init.getFullYear());
	
	$('#hvmobtime_input').val(hvmobdateobj_init.getHours()+':'+hvmobdateobj_init.getMinutes()+':'+hvmobdateobj_init.getSeconds());
	
	setTimeout(function(){datetimemobModule();},2000);
	






/* -------------- START pinch-to-zoom functionality -------------- */

$('#hv-header').css('background','black');
var hvmobdist1=0;
var twofingersdown='no';

$('html').on('touchend', function(hvmobev) {
	$('#hv-header').css('background','black');
});

$('html').on('touchstart', function(hvmobev) {
	if (hvmobev.targetTouches.length == 2) {
		$('#hv-header').css('background','navy');
		$('#toptouchlayer').css({'z-index':'20','opacity':'0.20','background':'green'});
		$('html').trigger('touchend');
		//$('#toptouchlayer').trigger('touchstart');
		
	}
});

/*
$('#toptouchlayer').on('touchstart', function(hvmobev) {
	pinchStart(hvmobev);
});

$('#toptouchlayer').on('touchmove', function(hvmobev) {
	pinchMove(hvmobev);
});


$('#toptouchlayer').on('touchend', function(hvmobev) {
	pinchEnd(hvmobev);
});
*/


	function pinchStart(hvmobev) {
           //check if two fingers touched screen
		   if (hvmobev.targetTouches.length == 2) {
		   
				// place invisible div layer on top of all of the content
				//$('#toptouchlayer').css('z-index','20');
				//$('#toptouchlayer').css('background','navy');
				
				twofingersdown='yes';
				
				if(twofingersdown=='yes') {
					hvmobdist1 = Math.hypot( //get rough estimate of distance between two fingers
					hvmobev.touches[0].clientX - hvmobev.touches[1].clientX,
					hvmobev.touches[0].clientY - hvmobev.touches[1].clientY);
				}
				else {
					pinchStart(hvmobev);
				}
				
           }
    }
	
    function pinchMove(hvmobev) {
		
		// Check if the two target touches are the same ones that started
	   if (hvmobev.targetTouches.length == 2 && hvmobev.changedTouches.length == 2) {
			 
		   //get rough estimate of new distance between fingers
		   var hvmobdist2 = Math.hypot(hvmobev.touches[0].clientX - hvmobev.touches[1].clientX,hvmobev.touches[0].clientY - hvmobev.touches[1].clientY);
			//alert(dist);
			//if fingers are further apart than when they first touched the screen, they are making the zoomin gesture
			if(hvmobdist1<hvmobdist2) {
				$('#zoom-in-button').trigger('click');
				//alert('zoom in: because 1st finger position '+hvmobdist1+' is less than 2nd finger position ('+hvmobdist2+')');
			}
			//if fingers are closer now than when they first touched screen, they are pinching
			else if(hvmobdist1>hvmobdist2) {
				$('#zoom-out-button').trigger('click');
				//alert('zoom out: because 1st finger position '+hvmobdist1+' is greater than 2nd finger position ('+hvmobdist2+')');
			}				
	   } 
     
    }
	
	function pinchEnd(hvmobev) {
		$('#toptouchlayer').css('z-index','-5');
		twofingersdown='no';
	}
	
		
	var detecttilestry=0;
	var imgtilefound='no';
	function detectTilesExist() {
		if($('.tile-layer-container:first').length > 0 && imgtilefound=='no') {
			$(function() {
				
				// HTML IDs tested: sandbox, tile-layer-container, helioviewer-viewport, helioviewer-viewport-container-outer
				
				document.getElementById('toptouchlayer').addEventListener('touchstart', pinchStart, false);
				document.getElementById('toptouchlayer').addEventListener('touchmove', pinchMove, false);
				document.getElementById('toptouchlayer').addEventListener('touchend', pinchEnd, false);
				
				//document.getElementsByTagName("html")[0]
				
			});
			imgtilefound='yes';
		}
		else {
			if(detecttilestry<11) {
				setTimeout(detectTilesExist,2000);
			}
			else {
				location.reload();
			}
		}
		detecttilestry++;
	}
	
	detectTilesExist();
	

/* -------------- END pinch-to-zoom functionality -------------- */

