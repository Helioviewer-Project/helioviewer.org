$(document).ready(function() {
	
	$('#stereo_a-psp-tree-trajectory .button, #soho-psp-tree-trajectory .button').click(function(){
		
		$.getJSON("https://api.beta.helioviewer.org/resources/JSON/celestial-objects/soho/psp/soho_psp_dictionary.json?rndnm=<?php echo (rand(9999,9999999)); ?>", function(pspdata){
			
				var pspencnum=0;
				
				// loop through each encounter
				$.each(pspdata, function(pspvalue, pspkey){
					//console.log(pspkey, pspvalue);
					
					pspencnum++;
					
					$('#showjsondata').append('<span style="font-weight:bold;">Dates: '+JSON.stringify(pspvalue)+'</span><br>');
					
					 //JSON.stringify(pspkey.start);
					
					// parse the JSON data: get the "start" value
					var myPSPObj = JSON.parse(pspkey.start);
					var pspstartenc = myPSPObj;
					
					
					// if the very first appropriate encounter div exists
					if($('#soho-psp-container-hover-date-'+pspstartenc).length > 0 || $('#stereo_a-psp-trajectory-hover-date-'+pspstartenc).length > 0) {
						
						if($('#soho-psp-container-hover-date-'+pspstartenc).length > 0) {
							var numEncPoints= $('#soho-psp-trajectory .hover-date-container').length;
						else if($('#stereo_a-psp-trajectory-hover-date-'+pspstartenc).length > 0) {
							var numEncPoints= $('#soho-psp-trajectory .hover-date-container').length;
						}
						
						
						// go through each encounter unix time and append the Encounter to each label
						for(var psp_subenc=1;psp_subenc<=numEncPoints;psp_subenc++) {
							$('#soho-psp-trajectory .hover-date-container, #stereo_a-psp-trajectory .hover-date-container').css('height','33px');
							$('#soho-psp-trajectory .hover-date-container, #stereo_a-psp-trajectory .hover-date-container').append('<br>Encounter '+pspencnum);
							$('#showjsondata').append('#stereo_a-psp-trajectory-hover-date-'+pspstartenc+' //  Encounter '+pspencnum+'<br>');
							pspstartenc+=21600000;
						}

					
					}
					
				});
			
			
			
				
		}).fail(function(){
			//console.log('');
		});
	
	
	});
	
});
