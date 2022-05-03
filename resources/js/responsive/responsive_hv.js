// onload 
$(function() {


	// add an anchor to topbar of datasource window on mobile
	$('#hv-drawer-right').prepend('<span id="mobmenutopanchor"></span>');

	// add closing X to #hv-drawer-right
	$('#hv-drawer-right').prepend('<div id="hvmobmenuclose_div"><div id="hvmobmenutitle_div"></div><img id="hvmobmenuclose" src="https://develop.helioviewer.org/resources/images/mobile/mobdsclose2.png">&nbsp;&nbsp;</div>');

	//
	$("#hvmobmenuclose").click(function(){
		$('#hvmobmenuclose_div').css('display','none');
		$('#hv-drawer-right').css('display','none');
		$('#hv-drawer-right').attr('style', 'display: none');
	});


	// current datasource that's open
	var currdsopen= 'nonexistentds';

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


	// open drawer by tab click
	
	$(".hvmobdstabs").click(function(){
		
		document.getElementById("mobdrawertopanchor").scrollIntoView();
		
		//showEncounter();
		
		//$('.hvmobdstabs').css({'background-image':'url(https://develop.helioviewer.org/resources/images/backmobilemenubg2.png)'});
		//var hvmobtabid = $(this).attr('drawersec')+'_mobtab';
		// console.log(hvmobtabid);
		//$('#'+hvmobtabid).css({'background-image':'url(https://develop.helioviewer.org/resources/images/mobiletabbgwhite1.png)','color':'black'});
		var thisdrawersect= $(this).attr('drawersec');
		
		$('.hvmobdstabs .hvmobds_icon').css('filter','invert(81%) sepia(7%) saturate(4%) hue-rotate(6deg) brightness(95%) contrast(91%)');
		$('.hvmobdstabs span').css({'color':'silver'});

		$(this).children('.hvmobds_icon').css('filter','invert(91%) sepia(89%) saturate(602%) hue-rotate(331deg) brightness(102%) contrast(94%)');
		$(this).children('span').css({'color':'#f7e057','filter':'none'});
		
		// if it's not already open, close currently open drawer and open correct one
		if(thisdrawersect != currdsopen) {
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
		}

	});
	
	
	/*
		#hv-drawer-news
		#hv-drawer-youtube
		#hv-drawer-movies
		#hv-drawer-screenshots
		#hv-drawer-data
		#hv-drawer-share
	*/
	$(".hvmobmenuitems").click(function(){
		$(".hamburger").removeClass("is-active");
		zeynep.close();
		$('#hv-drawer-right').css({'display':'none'});
		var thisdrawersect= $(this).attr('drawersec');
		$('#'+thisdrawersect).css('display','block');
		document.getElementById("mobmenutopanchor").scrollIntoView();
		
		
		
	});
	

});




// START media query 

// Create a condition that targets viewports at most 991px wide
const mediaQuery = window.matchMedia('(max-width: 991px)');

function handleTabletChange(e) {
  // Check if the media query is true
  if (e.matches) {
    // Then log the following message to the console
    /*
	console.log('Media Query Matched!');
	$('#hv-drawer-left').attr('style', 'display: none !important');
	$('#hv-drawer-left').css({'display':'none'});
	*/
	showEncounter();
	
  }
}

// Register event listener
mediaQuery.addListener(handleTabletChange);

// Initial check
handleTabletChange(mediaQuery);


// END media query 
