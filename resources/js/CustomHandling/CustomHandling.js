$(document).ready(function() {

	function HVcustomHandling(thisHVcomponent) {

		function hvtutorialHandling(thisHVtutSection) {
			// custom close button function
			$("#tool #close").click(function(){
				
				// revert back to saved state of userSettings
				
			});	
			
			switch(thisHVtutSection) {
				
				case 'hvtutorial_CB_click':
				// if the Featured Events section is showing, hide it
					if($("#accordion-events .disclosure-triangle:first").hasClass("closed")===false){
						$("#accordion-events .disclosure-triangle:first").addClass("closed");
						$("#accordion-events .content, #soho-dynaccordion .dynaccordion-cell, #stereo_a-dynaccordion .dynaccordion-cell, #stereo_b-dynaccordion .dynaccordion-cell").css("display","none");
					}
				
					break;
			}
			
		}



		switch(thisHVcomponent) {
			case 'hvtutorial_CB_click':
				hvtutorialHandling(thisHVcomponent);
				break;
		}
		

	}


	// START Encounter Count
	
	function showEncounter() {
		
		
		
		var thishvurlstr = window.location.href;
		
		
		if(thishvurlstr.search('beta.helioviewer')==-1) {
			thishvapiurl= "https://api.helioviewer.org";
		}
		else {
			thishvapiurl= "https://api.beta.helioviewer.org";
		}
		
		setTimeout(function() {

		
			$.getJSON(thishvapiurl+"/resources/JSON/celestial-objects/soho/psp/soho_psp_dictionary.json", function(pspdata){

				var pspenctotal= Object.keys(pspdata).length;
				
				
				var pspencnum=0;
				
				// loop through each encounter
				$.each(pspdata, function(pspvalue, pspkey){
					
					
					pspencnum++;
					
					
					 //JSON.stringify(pspkey.start);
					
					// parse the JSON data: get the "start" value
					var myPSPObj = JSON.parse(pspkey.start);
					var pspstartenc = myPSPObj;
					
					
					
					// if the very first appropriate encounter div exists
					if($('#soho-psp-container-hover-date-'+pspstartenc).length > 0 || $('#stereo_a-psp-trajectory-hover-date-'+pspstartenc).length > 0) {
						$(".hover-date-container").removeClass("hvenclabels");
						
						
						$('.hover-date-container').css('height','33px');




						const hvencelems = document.getElementsByClassName('hvenclabels');
					    	while(hvencelems.length > 0){
							hvencelems[0].parentNode.removeChild(hvencelems[0]);
					    	}
						
						/*if($("#hvencpagination").length > 0) {
							const hvencpaginationelem = document.getElementById('hvencpagination');
							hvencpaginationelem.remove();
						}*/						

						//hvencpaginationelem[0].parentNode.removeChild(hvencpaginationelem[0]);
						
						$(".hover-date-container").removeClass("hvenclabels");
						
						$('.hover-date-container').append('<span class="hvenclabels"></span>');
						//$('#soho-psp-tree-trajectory').append('<span id="hvencpagination">'+pspencnum+'</span>');
						
						$('.hvenclabels').html('<br>Encounter '+pspencnum);
						//document.getElementsByClassName("hover-date-container").innerHTML+= '<br>Encounter '+pspencnum;
						
						// START generate encounter "pagination"
						
						
						$('#soho-psp-tree-trajectory .decoration').eq(1).html(' - '+pspencnum+' - ');
						
						$('#soho-psp-tree-trajectory .decoration:first, #soho-psp-tree-trajectory .decoration:last').html('');
						
						// get previous encounter
						if(pspencnum != 1) {
							encpagprev=pspencnum-1;
							$('#soho-psp-tree-trajectory .button:first').html('< '+encpagprev);
						}
						else if(pspencnum == 1) {
							$('#soho-psp-tree-trajectory .button:first').html('&nbsp;&nbsp;');
						}
						
						// get next encounter
						if(pspencnum != pspenctotal) {
							encpagnxt=pspencnum+1;
							$('#soho-psp-tree-trajectory .button:last').html(encpagnxt+' >');
						}
						else if(pspencnum == pspenctotal) {
							$('#soho-psp-tree-trajectory .button:last').html('&nbsp;&nbsp;');
						}
						
						// END generate encounter "pagination"
					}
					
				});
			
			
			
				
			}).fail(function(){
				console.log('Parker Solar Probe JSON failed');
			});
	
		}, 500);
		
	}
	
	
	$(document).on('click', '#stereo_a-psp-tree-trajectory .button, #soho-psp-tree-trajectory .button, #zoom-out-button, #zoom-in-button', function () {
		showEncounter();
	});
	
	$("#helioviewer-viewport").bind("mousewheel", function(){showEncounter()});
	
	showEncounter();
	
	// END Encounter Count
	
	
	// interactive tutorial Celestial Bodies positioning
	$(document).on('click','#bvmodal_4', function() {
		HVcustomHandling('hvtutorial_CB_click');
	});
	
	// line break underneath Parker Solar Probe's Trajectory checkbox
	$('#soho-psp-tree-trajectory a:first').append('<br>&nbsp;');
	
	
}); // end of doc ready





