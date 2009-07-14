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
			var send_email, email_input_field, email_field_visible;
			jQuery(document).ready(function(){
				jQuery("#select-options-accordion").accordion({
					header: 'h3',
					autoHeight: false,
					clearStyle: true
				});
				
				jQuery("#select-options-tabs").tabs();

				email_field_visible = false;
				send_email = jQuery('#emailLink');
				email_input_div = jQuery('#email-input-div');
				
				email_input_field = '<span id="email-field" style="padding-left: 2em;">' + 
									'Email address: &nbsp' + 
									'<input type=text id="emailAddress" name="emailAddress" value="" />' + 
									'</span>';
									
				send_email.click(function() {
					email_field_visible = !email_field_visible;
					if (email_field_visible) {
						email_input_div.append(email_input_field);	
					}
					
					else {
						jQuery('#email-field').remove();
					}
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
	<body style="padding: 10px; margin: 0px"> <!-- class="ui-widget ui-widget-content ui-corner-all"> -->
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
		<div id="shadowbox-form" class="ui-widget ui-widget-content ui-corner-all ui-helper-clearfix" style="padding: 1px; width: 401px;">		
			<form>	
				<div id="select-options-tabs">
					<ul>
						<li><a href="#default-settings">Default Settings</a></li>
						<li><a href="#advanced-settings">Advanced Settings</a></li>
					</ul>
					
					<div id="default-settings">
						<!-- table: 
								Number of Frames:  	[input]
								Time step: 			[input]
						-->
						<table class="select-options-table">
							<tr>
								<td style="font-size: 10pt;">Number of frames: </td>
								<td><input type=text id="numFrames" name="numFrames" value=40 style="width: 2em;"/></td>
							</tr>
							
							<tr>
								<td style="font-size: 10pt;">Time step: </td>
								<!-- option values are the selected time step in seconds -->
								<td><select id="timeStep" name="timeStep">
										<option id=1 value=86400>1 day</option>
										<option id=2 value=43200>12 hours</option>
										<option id=3 value=3600 >1 hour</option>
									</select>
								</td>
							</tr>
						</table><br />
						
						<!-- table:  Used here because it lines up the checkbox and name horizontally. Otherwise they do not quite match up.
								Layers Included:
									[check] <layername>
									[check] <layername>
									etc...
						-->
						<table>
							<tr>
								<td colspan=2>Layers Included: </td>
							</tr>
							<tr>
								<td class="layers-checkbox"><input type=checkbox id="1" name="layers" checked=true /></td>
								<td class="layers-name">SOHO EIT EIT 304</td>
							</tr>
							<tr>
								<td class="layers-checkbox"><input type=checkbox id="1" name="layers" checked=true /></td>
								<td class="layers-name">SOHO LASCO C2 WL</td>
							</tr>
						</table>
					</div>
					
					<div id="advanced-settings">
						<!-- table: 
								Start Time				End Time
								Date:	[input]			Date:	 [input]
								Time:	[input]			Time:	 [input]
								<empty row>
								<empty row>
								Dimensions				Other
								Width:	[input]			Quality: [input]
								Height:	[input]			Format:  [input]
						-->
						<table class="select-options-table" style="width: 100%;">
							<tr>
								<th colspan=2 style="width: 50%;">Start Time</th>
								<th colspan=2>End Time</th>
							</tr>
							
							<tr>
								<td class="time-input-field" style="width: 15%;">Date:</td>
								<td class="time-input-field"><input type=text id="startDate" name="StartDate" value="01/15/2003" /></td>
								<td class="time-input-field" style="width: 15%;">Date:</td>
								<td class="time-input-field"><input type=text id="endDate" 	name="endDate"   value="01/15/2003" /></td>
							</tr>
							
							<tr>
								<td class="time-input-field">Time:</td>
								<td class="time-input-field"><input type=text id="startTime" name="startTime" value="00:00:00" /></td>
								<td class="time-input-field">Time:</td>
								<td class="time-input-field"><input type=text id="endTime"   name="endTime"   value="00:00:00" /></td>
							</tr>
							
							<tr>
								<td>&nbsp</td>
							</tr>
							<tr>
								<td>&nbsp</td>
							</tr>
							
							<tr>
								<th colspan=2>Dimensions</th>
								<th colspan=2>Other</th>
							</tr>
							
							<tr>
								<td>Width:</td>
								<td><input type=text id="width" name="width" style="width: 2.6em;" value=512 />&nbsp pixels</td>
								<td>Quality:</td>
								<td><input type=text id="quality" name="quality" style="width: 1.4em" value=8 /></td>
							</tr>
							
							<tr>
								<td>Height: </td>
								<td><input type=text id="height" name="height" style="width: 2.6em;" value=512 />&nbsp pixels</td>
								<td>Format:</td>
								<td>
									<select id="hqFormat" name="hqFormat" style="padding: 0;">
										<option id=1 value="mov" >mov</option>
										<option id=2 value="wmv" >wmv</option>
										<option id=3 value="mpeg">mpeg</option>
									</select>
								</td>						
							</tr>
						</table><br /><br />

						Filename: &nbsp<input type=text id="filename" name="filename" value=""/><br /><br />

						<input type=checkbox  id="dataGaps"  name="dataGaps" checked=true value="true"/>&nbsp Show layers even if there are data gaps.<br />
						<input type=checkbox  id="emailLink" name="emailLink" value="true" />&nbsp Email me a link to the video.<br />
						<div id="email-input-div">&nbsp</div>
					</div>
				</div>
		
				<button type=submit class="ui-state-default ui-corner-all">Submit</button>
			</form>
		</div>
	</body>
</html>






