<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
	<head>
		<link rel="stylesheet" type="text/css" href="http://yui.yahooapis.com/combo?2.7.0/build/reset-fonts/reset-fonts.css"> 
		<!-- jQuery -->
		<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js" type="text/javascript"></script>
		<script src="http://ajax.googleapis.com/ajax/libs/jqueryui/1.7.1/jquery-ui.min.js" type="text/javascript"></script>
		<script src="../lib/jquery/jquery-tooltip/jquery.tooltip.js" type="text/javascript"></script>
        
        <!-- TODO: move jquery-dynaccordion to /lib/helioviewer with rest of custom code -->
        <!-- TODO: Include compiled versions of Kakadu? -->
		<script src="../lib/jquery/jquery-dynaccordion/ui.dynaccordion.js" type="text/javascript"></script>
		<link rel="stylesheet" href="../lib/jquery/jquery.ui-1.7.1/css/dot-luv-modified/jquery-ui-1.7.1.custom.css" type="text/css" />	
		<script type="text/javascript">
			jQuery.noConflict();
		</script>
		
		<!-- Helioviewer.org custom styles -->
		<link rel="stylesheet" type="text/css" href="../styles/main.css">
		<link rel="stylesheet" type="text/css" href="../styles/viewport.css">
		<link rel="stylesheet" type="text/css" href="../styles/events.css">
		<link rel="stylesheet" type="text/css" href="../styles/dialogs.css">
		<link rel="stylesheet" type="text/css" href="../styles/tooltips.css">
		<link rel="stylesheet" type="text/css" href="../styles/timenav.css">
		<link rel="stylesheet" type="text/css" href="../styles/accordions.css">
		<link rel="stylesheet" type="text/css" href="../styles/sliders.css">


		<!-- Theme Modifications -->
		<link rel="stylesheet" type="text/css" href="../styles/dot-luv.css">
		<script type="text/javascript">
			  jQuery(document).ready(function(){
			    jQuery("#accordion").accordion({
					header: 'h3',
					clearStyle: true
				});
			  });
		</script>		
<!--		<style type="text/css">
			.ui-widget-content button {
				cursor:pointer;
				float:right;
				line-height:1.4em;
				margin:0.5em 0.4em 0.5em 0;
				overflow:visible;
				padding:0.2em 0.6em 0.3em;
				width:auto;
				font-family:Arial,sans-serif;
				font-size:12pt;
			}
			
			.ui-widget-content button:hover {
				background:#333333 url(images/ui-bg_dots-small_20_333333_2x2.png) repeat scroll 50% 50%;
				border:1px solid #333333;
				color: #d18f61;
				font-weight:bold;
				outline-color:-moz-use-text-color;
				outline-style:none;
				outline-width:medium;
			}
			
			.ui-widget-content button:active {
				background:#0B58A2 url(images/ui-bg_dots-medium_30_0b58a2_4x4.png) repeat scroll 50% 50%;
				border:1px solid #052F57;
				color:#FFFFFF;				
			}
			
			h2 {
				font-size: 14pt;
			}
		</style> -->
	</head>
	<body style="padding: 10px;"> <!-- class="ui-widget ui-widget-content ui-corner-all"> -->
<!--		<h2>What would you like to do with the selected region?</h2>
		<br />
		<div id="shadowbox-form" class="ui-widget ui-widget-content" style="text-align: left;">
			<button id="cancel-button" 		class="ui-state-default ui-corner-all">Cancel</button>
			<button id="movie-button" 		class="ui-state-default ui-corner-all">Build Movie</button>
			<button id="screenshot-button" 	class="ui-state-default ui-corner-all">Take Screenshot</button>
		</div> -->
<!--		<div id="shadowbox-form" class="ui-widget ui-widget-content" style="text-align: left;">
			<h2 style="font-size: 14pt;">Select movie options</h2>
			<br />
			<form id="movie-options-form">
			<input id="select-option" name="select-option" type=radio value="Default">Default</input>
			<input id="select-option" name="select-option" type=radio value="Advanced">Advanced</input>
			<button id="submit-button" class="ui-state-default ui-corner-all">Submit</button>
			</form>
-->	
	<form>		
		<div id="accordion">
			<h3><a href="#">Default</a></h3>
			<div>
				<p>
					Number of frames: <input type=text name="numFrames" id="numFrames" value=40 size="1" /><br />
					Time step/cadence (in seconds): <input type=text name="timeStep" id="timeStep" value=8 size="1" /><br />
					
					
				</p>
			</div>
			
			<h3><a href="#">Advanced</a></h3>
			<div>
				<p>Advanced Options</p>
			</div>
		</div>
		<input type=submit value="Submit" />
	</form>
	</body>
</html>






