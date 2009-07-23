<?php
	if(isset($_GET['mode']))
		$params = $_GET;
	else
		$params = $_POST;

	$mode 		= $params['mode'];
	$startDate 	= explode('T', $params['startDate']);
	$timeStep	= $params['timeStep'];
	
	$width		= $params['width'];
	$height		= $params['height'];
	$numFrames	= $params['numFrames'];
	
	$layers		= explode('/', $params['layers']);
	$hqformat	= $params['hqFormat'];
	$quality	= $params['quality'];

	$showImgIfGap 	= $params['showImgIfGap'];
	$emailUser		= $params['emailUser'];
	$emailAddress 	= $params['emailAddress'];	
	
	$date = $startDate[0];
	$date = str_replace("-", "/", $date);
	$time = substr($startDate[1], 0, -1);
	
//	echo "$startDate, $hqformat, $width, $height, $layers, $timeStep, $date, $time <br />";

	/**
	 * The following is all of the html markup necessary to generate the user options form. Default values are inserted in the appropriate places. 
	 * The markup itself can get a little confusing, as it involves tables and a lot of nested <div>'s, so I tried to indent everything as if the PHP
	 * were not there to show where everything goes.
	 * 
	 * The basic structure of the form is: 
	 * <div>
	 * 		<ul>
	 * 			[Tab names and href's]
	 * 		</ul>
	 * 
	 * 		<div tab1, displayed when "Default Settings" tab is active>
	 * 			if it's a movie: [Time step and number of frames aligned nicely in a table]
	 * 			[Layer names and checkboxes aligned nicely in a table]
	 * 		</div>
	 * 
	 * 		<div tab2, displayed when "Advanced Settings" tab is active>
	 * 			if it's a movie: [Start time/date and End time/date aligned in table]
	 * 			[dimensions and other aligned in a table]
	 * 			Filename
	 * 			[checkbox] Show image when data gaps
	 * 			[checkbox] email me a link
	 * 				<hidden div, only filled and visible when email checkbox is checked>email address</div>
	 * 		</div>
	 * 
	 * 		[submit button]
	 * </div>
	 */
	
	$contents =	'<div id="shadowbox-form" class="ui-widget ui-widget-content ui-corner-all ui-helper-clearfix" style="padding: 1px; margin: 10px; width: 401px;">	
					<div id="select-options-tabs">
						<ul>
							<li><a href="#default-settings">Default Settings</a></li>
							<li><a href="#advanced-settings">Advanced Settings</a></li>
						</ul>
						
						<div id="default-settings">';
						
	if($params['mode'] === 'movie') {
		$contents .=
							/*
							 * 	table: 
							 *		Number of Frames:  	[input]
							 *		Time step: 			[input]
							 */
							'<table class="select-options-table">
								<tr>
									<td style="font-size: 10pt;">Number of frames: </td>
									<td><input type=text id="numFrames" name="numFrames" value=' . $numFrames . ' style="width: 2.5em;"/></td>
								</tr>
								
								<tr>
									<td style="font-size: 10pt;">Time step: </td>
									<!-- option values are the selected time step in seconds -->
									<td><select id="timeStep" name="timeStep">';
		
		// Make an array of all options, and figure out which one matches the given timeStep. Make that one the default.
		$times = array(
			1 => "1 Sec", 
			60 => "1 Min", 
			300 => "5 Mins", 
			900 => "15 Mins",
			3600 => "1 Hour",
			21600 => "6 Hours",
			43200 => "12 Hours",
			86400 => "1 Day",
			604800 => "1 Week",
			2419200 => "28 Days",
			31556926 => "1 Year"
		);
		
		// Prints out <option value=(value)>(description)</option>, or
		//			  <option value=(value) selected="selected">(description)</option>
		foreach($times as $val => $description) {
			$contents .= '<option value="' . $val . '"';
			
			if($val == $timeStep) {
				$contents .= ' selected="selected"';
			}
			$contents .= '>' . $description . '</option>';
		}

		$contents .=
									'</select>
								</td>
							</tr>
						</table><br />';
	}
	
	$contents .= 
						/*
						 * table:  Used here because it lines up the checkbox and name horizontally. Otherwise they do not quite match up.
						 *		Layers Included:
						 *			[check] <layername>
						 *			[check] <layername>
						 *			etc...
						 */
						'<table>
							<tr>
								<td colspan=2>Layers Included: </td>
							</tr>';

	foreach($layers as $layer) {
		// Use $layer as the value of the checkbox, but just use the actual layer name for the label the user sees.
		// Break the string into pieces (0 = name,opacityGrp,opacity, 1 = xRange,yRange)
		$info = explode('x', $layer);
	
		// Get the piece with the name in it, break that into pieces around the commas
		$rawName = explode(',', $info[0]);
		$obs 	 = $rawName[0];
		$inst 	 = $rawName[1];
		$det 	 = $rawName[2];
		$meas 	 = $rawName[3];
		$name 	 = "$obs $inst $det $meas";
				
		$contents .=
							'<tr>
								<td class="layers-checkbox"><input type=checkbox name="layers" checked=true value="' . $layer . '"/></td>
								<td class="layers-name">' . $name . '</td>
							</tr>';
	}
	
	$contents .=		'</table>
					</div>
					
					<div id="advanced-settings" style="width: 400px;">';
						/*
						 * table: 
						 *		Start Time				End Time
						 *		Date:	[input]			Date:	 [input]
						 *		Time:	[input]			Time:	 [input]
						 *		<empty row>
						 *		Dimensions				Other
						 *		Width:	[input]			Quality: [input]
						 *		Height:	[input]			Format:  [input]
						 */
	$contents .=			'<table class="select-options-table" style="width: 80%;">';

	if($params['mode'] === 'movie') {
		$contents .= 
								'<tr>
									<th colspan=2 style="width: 60%;">Start Time</th>
									<th colspan=2>End Time</th>
								</tr>
								
								<tr>
									<td class="time-input-field" style="width: 15%;">Date:</td>
									<td class="time-input-field"><input type=text id="startDate" name="StartDate" value="' . str_replace("/", "-", $date) . '" /></td>
									<td class="time-input-field" style="width: 15%;">Date:</td>
									<td class="time-input-field"><input type=text id="endDate" 	name="endDate"   value="' . $date . '" /></td>
								</tr>
								
								<tr>
									<td class="time-input-field">Time:</td>
									<td class="time-input-field"><input type=text id="startTime" name="startTime" value="' . $time . '" /></td>
									<td class="time-input-field">Time:</td>
									<td class="time-input-field"><input type=text id="endTime"   name="endTime"   value="' . $time . '" /></td>
								</tr>
								
								<tr>
									<td>&nbsp</td>
								</tr>';
	}
	
	$contents .= 
							'<tr>
								<th colspan=2>Dimensions</th>
								<th colspan=2>Other</th>
							</tr>
							
							<tr>
								<td>Width:</td>
								<td><input type=text id="width" name="width" style="width: 3em;" value=' . $width. ' />&nbsp pixels</td>
								<td>Quality:</td>
								<td><input type=text id="quality" name="quality" style="width: 2em" value=' . $quality . ' /></td>
							</tr>
							
							<tr>
								<td>Height: </td>
								<td><input type=text id="height" name="height" style="width: 3em;" value=' . $height . ' />&nbsp pixels</td>
								<td>Format:</td>
								<td>
									<select id="hqFormat" name="hqFormat" style="padding: 0;">
										<option id=1 value="mov" >mov</option>
										<option id=2 value="asf" >asf</option>
										<option id=3 value="mp4" >mp4</option>
									</select>
								</td>						
							</tr>
						</table><br /><br />

						Filename: &nbsp<input type=text disabled="disabled" id="filename" name="filename" value=""/><br /><br />

						<input type=checkbox  id="dataGaps"  name="dataGaps"';
	if($showImgIfGap == "true") {
		$contents .= ' checked=true';
	} 
	$contents .=		
						'/>&nbsp Show layers even if there are data gaps.<br />
						<input type=checkbox  id="emailLink" name="emailLink"';
	if($emailUser == "true") {
		$contents .= ' checked=true';
		$display = true;
	}
	else {
		$display = false;
	}		
	$contents .=			
						'/>&nbsp Email me a link to the video.<br />
						<div id="email-input-div">
							<span id="email-field" style="padding-left: 2em;';
	if($display == false) {						
		$contents .= 'display: none;';
	}
	$contents .=
							 '">
								Email address: &nbsp
								<input type=text id="emailAddress" name="emailAddress" value="' . $emailAddress . '" /> 
							</span>
						</div>
					</div>
				</div>

				<input type=hidden name="mode" value="' . $mode . '" />
				<button id="submit-options-button" class="ui-state-default ui-corner-all">Submit</button>
	
		</div>';
	print $contents;
?>
