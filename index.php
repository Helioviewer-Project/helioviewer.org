<?php require_once('settings/Config.php'); ?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
	<head>
		<?php printf("<!-- Helioviewer rev. %s, %s-->\n", Config::BUILD_NUM, Config::LAST_UPDATE);?>
		<title>Helioviewer - Solar and heliospheric image visualization tool</title>
		<link rel="shortcut icon" href="favicon.ico">
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
		<meta http-equiv="Cache-Control" content="No-Cache">
		<meta name="description" content="Helioviewer - Solar and heliospheric image visualization tool">
		<meta name="keywords" content="Helioviewer, hv, jpeg 2000, jp2, solar image viewer, sun, solar, heliosphere, solar physics, viewer, visualization, space, astronomy, SOHO, EIT, LASCO, SDO, MDI, coronagraph, ">

		<!-- YUI CSS Reset -->
		<link rel="stylesheet" type="text/css" href="http://yui.yahooapis.com/combo?2.7.0/build/reset-fonts/reset-fonts.css"> 

		<!-- jQuery -->
		<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js" type="text/javascript"></script>
		<script src="http://ajax.googleapis.com/ajax/libs/jqueryui/1.7.1/jquery-ui.min.js" type="text/javascript"></script>
		<script src="lib/jquery/jquery-tooltip/jquery.tooltip.js" type="text/javascript"></script>
		<script src="lib/jquery/jquery-dynaccordion/ui.dynaccordion.js" type="text/javascript"></script>
		<link rel="stylesheet" href="lib/jquery/jquery.ui-1.7.1/css/dot-luv-modified/jquery-ui-1.7.1.custom.css" type="text/css" />	
		<script type="text/javascript">
			jQuery.noConflict();
		</script>

		<!-- Prototype and Scriptaculous -->
		<script src="http://ajax.googleapis.com/ajax/libs/prototype/1.6.0.3/prototype.js" type="text/javascript"></script>
		<script src="http://ajax.googleapis.com/ajax/libs/scriptaculous/1.8.2/scriptaculous.js?load=effects,slider,dragdrop,builder" type="text/javascript"></script>
		<script src="lib/prototype/mouse.wheel.js" type="text/javascript"></script>
		
		<!-- Prototip -->
		<script src="lib/prototip2.0.5/js/prototip.js" type="text/javascript"></script>
		<link rel="stylesheet" href="lib/prototip2.0.5/css/prototip.css" type="text/css">

		<!-- date.js -->
		<script src="lib/date.js/date-en-US.js" type="text/javascript"></script>
		
		<!-- CookieJar -->
		<script src="lib/CookieJar/cookiejar.js" type="text/javascript"></script>
		
		<!-- Simile -->
		<!--<script src="http://static.simile.mit.edu/timeline/api-2.2.0/timeline-api.js" type="text/javascript"></script>-->
		
		<!-- Pixastic -->
		<!-- jQuery("img.tile[src!=images/transparent_512.gif]"); -->
		<script src="lib/pixastic/pixastic.custom.js" type="text/javascript"></script>

		<!-- ShadowBox -->
		<!--
		<script type="text/javascript" src="lib/shadowbox/src/adapter/shadowbox-prototype.js"></script>
		<script type="text/javascript" src="lib/shadowbox/src/shadowbox.js"></script>
		<script type="text/javascript" src="lib/shadowbox/src/skin/classic/skin.js"></script>
		<script type="text/javascript" src="lib/shadowbox/src/player/shadowbox-iframe.js"></script>
		<script type="text/javascript" src="lib/shadowbox/src/lang/shadowbox-en.js"></script>
		<link rel="stylesheet" href="lib/shadowbox/src/skin/classic/skin.css" type="text/css" media="screen">
		-->

		<!-- Helioviewer-Specific -->
		<script src="lib/helioviewer/UIElement.js" type="text/javascript"></script>
		<script src="lib/helioviewer/LoadingIndicator.js" type="text/javascript"></script>
		<script src="lib/helioviewer/Viewport.js" type="text/javascript"></script>
		<script src="lib/helioviewer/ViewportHandlers.js" type="text/javascript"></script>
		<script src="lib/helioviewer/Layer.js" type="text/javascript"></script>
		<script src="lib/helioviewer/TileLayer.js" type="text/javascript"></script>
		<script src="lib/helioviewer/EventLayer.js" type="text/javascript"></script>
		<script src="lib/helioviewer/EventMarker.js" type="text/javascript"></script>
		<script src="lib/helioviewer/ZoomControl.js" type="text/javascript"></script>
		<script src="lib/helioviewer/HelperFunctions.js" type="text/javascript"></script>
		<script src="lib/helioviewer/MessageConsole.js" type="text/javascript"></script>
		<script src="lib/helioviewer/LayerManager.js" type="text/javascript"></script>
		<script src="lib/helioviewer/EventLayerAccordion.js" type="text/javascript"></script>
		<script src="lib/helioviewer/TileLayerAccordion.js" type="text/javascript"></script>
		<script src="lib/helioviewer/Calendar.js" type="text/javascript"></script>
		<script src="lib/helioviewer/TimeControls.js" type="text/javascript"></script>
		<!--<script src="lib/helioviewer/EventTimeline.js" type="text/javascript"></script>-->
		<!--<script src="lib/helioviewer/MovieBuilder.js" type="text/javascript"></script>-->
		<script src="lib/helioviewer/IconPicker.js" type="text/javascript"></script>
		<script src="lib/helioviewer/UserSettings.js" type="text/javascript"></script>
		<script src="lib/helioviewer/Helioviewer.js" type="text/javascript"></script>
		<!--<script src="lib/helioviewer/build/helioviewer-all-min.js" type="text/javascript"></script>-->

		<!-- Helioviewer.org custom styles -->
		<link rel="stylesheet" type="text/css" href="styles/main.css">
		<link rel="stylesheet" type="text/css" href="styles/viewport.css">
		<link rel="stylesheet" type="text/css" href="styles/events.css">
		<link rel="stylesheet" type="text/css" href="styles/dialog.css">
		<link rel="stylesheet" type="text/css" href="styles/tooltips.css">
		<link rel="stylesheet" type="text/css" href="styles/timenav.css">
		<link rel="stylesheet" type="text/css" href="styles/accordions.css">
		<link rel="stylesheet" type="text/css" href="styles/sliders.css">
		
		<!-- Theme -->
		<link rel="stylesheet" type="text/css" href="styles/dot-luv.css">
		
		<!--[if IE]>
			<link href="styles/main-ie.css" rel="stylesheet" type="text/css" />
		<![endif]-->
		
		<script type="text/javascript">
			Event.observe(window, 'load', function () {
				<?php
					//API Example: index.php?obs-date=1065512000&img-scale=2.63&layers=SOHEITEIT171,SOHLAS0C20WL
					if ($_GET['layers'])
						$layers = explode(",", $_GET['layers']);
				
					// View
					$view = array(
						'obs-date'  => $_GET['obs-date'],
						'img-scale' => $_GET['img-scale'],
						'layers'    => $layers
					);
                    printf("var view = %s;\n", json_encode($view));
               
                    echo "\t\t\t\t";
					
					// Default settings
					$settings = array(
						'defaultZoomLevel'  => Config::DEFAULT_ZOOM_LEVEL,
                        'minZoomLevel'      => Config::MIN_ZOOM_LEVEL,
                        'maxZoomLevel'      => Config::MAX_ZOOM_LEVEL,
                        'baseZoom'          => Config::BASE_ZOOM_LEVEL,
                        'baseScale'         => Config::BASE_IMAGE_SCALE,
                        'prefetchSize'      => Config::PREFETCH_SIZE,
	                    'timeIncrementSecs' => Config::DEFAULT_TIMESTEP
					);
                    echo "var defaults = " . json_encode($settings) . ";\n";
                    echo "\t\t\t\t";
                    printf ("var api = '%s';\n", Config::API_BASE_URL);
				?>
				var helioviewer = new Helioviewer('helioviewer-viewport', api, view, defaults );
			});
		</script>

	</head>
	<body>
		<div id="minHeight"></div>
		<!-- Message Console -->
		<div id="message-console" style="display:none;">&nbsp;</div>

		<!-- Header and Content -->
		<div id="outsideBox">

			<!-- Left Column -->
			<div id="left-col">
				<div id="left-col-header">
					<img src="images/logo/simple.png" alt="Helioviewer.org Logo" style="margin-top:24px; margin-left: 9px;"></img>
				</div>
				<br><br>
				<div class="accordion-title" style="margin-left:5px; margin-top: 15px;">Observation</div> 
				<div id="observation-controls" class="ui-widget ui-widget-content ui-corner-all" style="padding: 2px 2px 8px 2px; border: 1px solid black; color: white; font-size: 0.95em; margin: 0px 5px 0px 5px;">
					<!--  Observation Date -->
					<div style="margin-bottom: 4px; position: relative;">
						<div style="width: 78px; margin-top:3px; float: left; font-weight: 600;">Date:</div>
						<input type="text" id="date" name="date" value="">
					</div>

					<!-- Observation Time -->
					<div style="margin-bottom: 8px;">
						<div style="float: left; width: 78px; font-weight: 600;">Time:</div>
						<input type="text" id="time" name="time" value="" style="width:80px">
					</div>
					
					<!-- Time Navigation Buttons & Time Increment selector -->
					<div>
						<div style="float: left; width: 78px; font-weight: 600;">Time-step:</div>
						<select id="timestep-select" style="width:85px; border: none; margin-right: 1px; float: left;" name="time-step"></select>
						<span id="timeBackBtn" class="ui-icon ui-icon-circle-arrow-w" style="float: left;" title=" - Move the Observation Date/Time backward one time-step"></span>
						<span id="timeForwardBtn" class="ui-icon ui-icon-circle-arrow-e" title=" - Move the Observation Date/Time forward one time-step"></span>
						<!-- Movie Builder -->
						<!-- <img id="movieBuilder"alt="Show movie." src="images/blackGlass/glass_button_movies.png"  title=" - Quick Movie."> -->
					</div>

				</div>
				<br><br>
				<div id="layerManager"></div>
				<br><br>
				<div id="eventAccordion"></div>
			</div>

			<!-- Right Column -->
			<div id="right-col">
				<div id="right-col-header">
					<span id="loading" style="display: none">Loading...</span>
				</div>

				<!-- Recent Updates -->
				<div class='notes ui-widget ui-widget-content ui-corner-all' style="height:425px">
					<!--<strong style="text-decoration: underline; font-size:130%; margin-bottom:10px; ">Recent Updates</strong><br><br>-->
                    <div style="background: url(images/recent_updates-green.png); width: 160px; height: 21px; margin-bottom: 8px;"></div>
					<strong>> 02/09/2009</strong><p>Fixed an issue which resulting in incorrect mouse-coordinates being displayed.</p><br><br>
					<strong>> 02/02/2009</strong><p>Helioviewer <a style="color: white;" href="docs/">source code documentation</a> now available.</p><br><br>
					<strong>> 01/15/2009</strong><p>Experimental version of <a href="api/" style="color:white;">Helioviewer APIs</a> available.</p><br><br>
					<strong>> 12/24/2008</strong><p>Unified interface for time navigation.</p><br><br>
				</div>
			</div>

			<!-- Middle Column -->
			<div id="middle-col">
				<div id="middle-col-header">
					<div style="position: absolute; min-width:550px; top:14px;">

						<!-- Message Console -->
						<span id="message-console-spacer" style="width:100%; position: absolute; left:0pt; display:none; font-size:1em;">&nbsp;</span><div style="height:25px;">&nbsp;</div>
					</div>
				</div>
				<!-- End middle-col-header -->

				<!-- Viewport -->
				<div id="helioviewer-viewport-container-outer" class="ui-widget ui-widget-content ui-corner-all">
					<div id="helioviewer-viewport-container-inner" class="centered" style="top:3%; width:97%; height:94%">
						<div id="helioviewer-viewport" class="viewport" style="z-index: 0; left: 0px; top:0px; width: 100%; height: 100%"></div>

							<!-- UI COMPONENTS -->

							<!--  Zoom-Level Slider -->
							<div id="zoomControl" style="position: absolute; left: 16px; top:39px; z-index:1000">
								<div id="zoomControlZoomIn" class="sliderPlus" title=" - Zoom in.">+</div>
								<div id="zoomControlTrack" class="sliderTrack">
									<div id="zoomControlHandle" class="sliderHandle" title=" - Drag handle to zoom in and out."></div>
								</div>
								<div id="zoomControlZoomOut" class="sliderMinus" title=" - Zoom out.">-</div>
							</div>
					</div>
				</div>
			</div>
			<div id="clearfooter"></div>
		</div>
		<!-- end outer div -->

		<!-- Footer -->
		<div id="footer">
			<!-- <div style="height:250px; width:100%; float:left; font-size:0.85em"> -->
			<div style="height:50px; width:100%; float:left; font-size:0.85em">

				<!-- Links -->
				<div style="text-align:right; font-size:100%; height:30px; margin-right: 258px; margin-top: 3px; position: relative;">
                    <div class="ui-corner-bottom" style="background: transparent url(images/blackGlass/transparentBG25.png); position: absolute; right: 25px; top:-3px; padding: 4px; border-bottom: 1px solid #262424; border-left: 1px solid #262424; border-right: 1px solid #262424; font-size: 1.0em; -moz-border-radius-bottomleft: 20px; -moz-border-radius-bottomright: 20px;">
    					<a id="helioviewer-about" class="light" href="#" style="margin-right:20px;">About</a>
    					<a id="helioviewer-shortcuts" class="light" href="#" style="margin-right: 20px;">Usage Tips</a>
    					<a href="http://achilles.nascom.nasa.gov/~dmueller/" class="light" target="_blank" style="margin-right:20px">JHelioviewer</a>
    					<a href="wiki/" class="light" style="margin-right:20px" target="_blank">Wiki</a>
    					<a href="api/" class="light" style="margin-right:20px" target="_blank">API</a>
    					<a href="mailto:webmaster@helioviewer.org" class="light" style="margin-right:20px;">Contact</a>
    					<a href="https://bugs.launchpad.net/helioviewer/" class="light" target="_blank">Report Bug</a>
                    </div>
				</div>
				
				<!-- Timeline -->
				<!--
				<div style="text-align: center;">
					<div id="timeline" style="height: 150px; width: 70%; margin-left: auto; margin-right: auto; border: 1px solid #000"></div>
				</div>
				-->
			</div>
		</div>
		
		<!-- About dialog -->
		<div id='about-dialog'>
			<img src="images/logo/about_white.png" alt="Helioviewer.org Logo"><br>
			<span style="font-size:small;"><?php printf("Last Updated: %s (rev. %s)", Config::LAST_UPDATE, Config::BUILD_NUM); ?></span><br><br>
			<span style='font-weight: bold;'>Current Developers:</span><br>
			<ul>
				<li><a href="mailto:webmaster@helioviewer.org" class="light">Keith Hughitt</a></li>
				<li><a href="mailto:Jack.Ireland@ nasa.gov" class="light">Jack Ireland</a></li>
			</ul>
		</div>
		
		<!-- Helioviewer usage dialog -->
		<div id='keyboard-shortcuts-dialog' style="font-size: 0.85em; color: #DFE5CF; font-family: 'Courier New', Courier, monospace;">
			<strong>Keyboard Shortcuts:</strong>
			<br><br>
				<table>
					<tr>
						<td width="30%"><strong>c</strong></td>
						<td>Center the screen.</td>
					</tr>
					<tr>
						<td><strong>d</strong></td>
						<td>Display detailed feature/event labels.</td>
					</tr>
					<tr>
						<td><strong>m</strong></td>
						<td>Toggle mouse coordinates display.</td>
					</tr>
					<tr>
						<td><strong>+</strong></td>
						<td>Zoom-in once.</td>
					</tr>
					<tr>
						<td><strong>-</strong></td>
						<td>Zoom-out once.</td>
					</tr>
					<tr>
						<td><strong>&larr;</strong></td>
						<td>Pan left.</td>
					</tr>
					<tr>
						<td><strong>&uarr;</strong></td>
						<td>Pan upward.</td>
					</tr>
					<tr>
						<td><strong>&rarr;</strong></td>
						<td>Pan Right.</td>
					</tr>
					<tr>
						<td><strong>&darr;</strong></td>
						<td>Pan downward.</td>
					</tr>
					
				</table>
				<br><br>
				<strong>Mouse Shortcuts:</strong>
				<br><br>
				<table>
					<tr>
						<td width="75%">Double-click</td>
						<td>Zoom in.</td>
					</tr>
					<tr>
						<td>Shift + Double-click</td>
						<td>Zoom out.</td>
					</tr>
					<tr>
						<td>Mouse-wheel up</td>
						<td>Zoom in.</td>
					</tr>
					<tr>
						<td>Mouse-wheel down</td>
						<td>Zoom out.</td>
					</tr>
				</table>
				
		</div>
		
	</body>
</html>
