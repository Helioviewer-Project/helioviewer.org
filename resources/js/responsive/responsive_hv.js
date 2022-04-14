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
		$('.hvmodbstabs').css('background-image','url(https://develop.helioviewer.org/resources/images/backmobilemenubg2.png)');
		var hvmobtabid = $(this).attr('id');
		$('#'+hvmobtabid).css({'background-image':'url(https://develop.helioviewer.org/resources/images/mobiletabbgwhite1.png)','color':'black'});
		var thisdrawersect= this.attr('drawersec'); //$(this)
		// if it's not already open, close currently open drawer and open correct one
		if(thisdrawersect != currdsopen) {
			$('#'+currdsopen).slideDown("slow");
			$('#'+thisdrawersect).slideUp("slow");
			currdsopen= thisdrawersect;
		}

	});

});
