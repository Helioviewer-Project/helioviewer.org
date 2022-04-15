// zeynepjs initialization for demo
$(function() {

  var zeynep = $('.zeynep').zeynep({
    opened: function () {
      console.log('the side menu is opened')
    }
  })

  // dynamically bind 'closing' event
  zeynep.on('closing', function () {
    console.log('this event is dynamically binded')
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
	var currdsopen= 'nonexistentds';
	$(".hvmobdstabs").click(function(){
		$('.hvmodbstabs').css({'background-image':'url(https://develop.helioviewer.org/resources/images/backmobilemenubg2.png)'});
		var hvmobtabid = $(this).attr('drawersec')+'_mobtab';
		console.log(hvmobtabid);
		$('#'+hvmobtabid).css({'background-image':'url(https://develop.helioviewer.org/resources/images/mobiletabbgwhite1.png)','color':'black'});
		var thisdrawersect= $(this).attr('drawersec');
		// if it's not already open, close currently open drawer and open correct one
		if(thisdrawersect != currdsopen) {
			$('#hv-drawer-left').attr('style', 'display: none');
			//$('#hv-drawer-left').fadeOut("fast");
			$('#'+currdsopen).css('display','none');
			$('#'+thisdrawersect).css('display','block');
			$('#hv-drawer-left').css({'display':'block','height':'100%'});
			currdsopen= thisdrawersect;
		}

	});

});

// Create a condition that targets viewports at least 768px wide
const mediaQuery = window.matchMedia('(max-width: 790px)');

function handleTabletChange(e) {
  // Check if the media query is true
  if (e.matches) {
    // Then log the following message to the console
    console.log('Media Query Matched!');
	$('#hv-drawer-left').attr('style', 'display: none !important');
	$('#hv-drawer-left').css({'display':'none'});
  }
}

// Register event listener
mediaQuery.addListener(handleTabletChange);

// Initial check
handleTabletChange(mediaQuery);
