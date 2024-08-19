<?php
	/*
		Environment variable to specify what version of HV to display
		Default: false (not set)
		Available:
				embed
				minimal
	*/
	$hv_output = getenv('HV_OUTPUT');
	$outputType = false;

	//Disable debug mode by default
	$debug = false;

	//Force debug mode. Set it to true to always force debug mode.
	$forceDebug = false;

	//check if URL have debug parameter
	if (isset($_GET['debug']) || $forceDebug) {
		$debug = true;
	}

	$debugTime = 0;
	if($debug){
		$debugTime = time();
	}

	//check if URL have output parameter or if $hv_output enabled
        if($hv_output == 'embed' || $hv_output == 'minimal'){
                $outputType = $hv_output;
        }else if(isset($_GET['output']) && ($_GET['output'] == 'embed' || $_GET['output'] == 'minimal')){
                $outputType = $_GET['output'];
        }

        if($outputType){ // minimal and embed statistic
                //Load Config
                include_once "../api.helioviewer.org/src/Config.php";
                $config = new Config("../api.helioviewer.org/settings/Config.ini");

                //Log Statistic
                include_once HV_ROOT_DIR.'/../src/Database/Statistics.php';
                $statistics = new Database_Statistics();
                //$statistics->log($outputType);
		$statistics->logRedis($outputType);
        }else{ //standard mode statistic
                //Load Config
                include_once "../api.helioviewer.org/src/Config.php";
                $config = new Config("../api.helioviewer.org/settings/Config.ini");

                //Log Statistic
                include_once HV_ROOT_DIR.'/../src/Database/Statistics.php';
                $statistics = new Database_Statistics();

		//temporary additional logging
		$ip = "$_SERVER[REMOTE_ADDR]";
		$url = "$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]";
		if(strpos($url,"helioviewer.org")===0){
			//$statistics->log("standard");
			$statistics->logRedis("standard");
			//$statistics->logAccess("standard",$ip,$url);
        	}
	}

	function attr($attr, $file) {
		return $attr . '="/' . $file . '?v=' . filemtime($file) . '"';
	}

?><!DOCTYPE html>
<html lang="en">
<head>
	<!-- Helioviewer.org 3.2 2017/03/31 -->
	<title><?=($debug ? '[DEBUG]' : '')?> Helioviewer.org - Solar and heliospheric image visualization tool</title>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="description" content="Helioviewer.org - Solar and heliospheric image visualization tool" />
	<meta name="keywords" content="Helioviewer, JPEG 2000, JP2, sun, solar, heliosphere, solar physics, viewer, visualization, space, astronomy, SOHO, SDO, STEREO, AIA, HMI, EUVI, COR, EIT, LASCO, SDO, MDI, coronagraph, " />
	<!--if ($this->config["disable_cache"])-->
	<!--<meta http-equiv="Cache-Control" content="No-Cache" />-->

	<link rel="shortcut icon" type="image/png" href="/favicon.png"/>

	<!-- Blog RSS Feed -->
	<link rel="alternate" type="application/rss+xml" title="The Helioviewer Project Blog RSS Feed" href="http://helioviewer-project.github.io/feed/" />
	<link rel="alternate" type="application/atom+xml" title="The Helioviewer Project Blog Atom Feed" href="http://helioviewer-project.github.io/feed/atom/" />

	<!--- NASA -->
	<script id='_fed_an_ua_tag' type='text/javascript' src='https://dap.digitalgov.gov/Universal-Federated-Analytics-Min.js?agency=NASA&subagency=GSFC&dclink=true'>
</script>

	<!--OpenGraph Metadata-->
	<meta property="og:title" content="Helioviewer.org" />
	<!--OpenGraph Metadata Image-->
	<meta id="fb-og-image" property="og:description" content="Solar and heliospheric image visualization tool." />
	<meta id="fb-og-image" property="og:image" content="//helioviewer.org/resources/images/logos/hvlogo1s_transparent.png" />

	<!-- Library CSS -->
	<link rel="stylesheet" href="/resources/lib/yui-2.8.2r1/reset-fonts.css" />
	<link rel="stylesheet" href="/resources/lib/jquery-ui-1.13.1/jquery-ui.min.css" />
	<link rel="stylesheet" href="/resources/lib/jquery.jgrowl/jquery.jgrowl.min.css" />
	<link rel="stylesheet" href="/resources/lib/jquery.qTip3/jquery.qtip.min.css" />
	<link rel="stylesheet" href="/resources/lib/jquery.imgareaselect-0.9.8/css/imgareaselect-default.css" />
	<link rel="stylesheet" href="/resources/lib/DatetimePicker/jquery.datetimepicker.css" />
	<link rel="stylesheet" <?=attr('href', "resources/lib/flatpickr/flatpickr.min.css");?> />
	<link rel="stylesheet" <?=attr('href', "resources/lib/flatpickr/flatpickr.style.css");?> type="text/css" />
	<link rel="stylesheet" href="/resources/lib/boneVojage/bonevojage.css">
	<link rel="stylesheet" href="/resources/lib/mediaelement/build/mediaelementplayer.min.css">

	<!-- jQuery UI Theme Modifications -->
	<link rel="stylesheet" href="/resources/css/dot-luv.css">

	<!-- Helioviewer CSS -->
	<?php
	if ($debug){
	?>
		<link rel="stylesheet" href="/resources/css/helioviewer-base.css" />
		<link rel="stylesheet" href="/resources/css/zoom-control.css" />
		<link rel="stylesheet" href="/resources/css/helioviewer-web.css" />
		<link rel="stylesheet" href="/resources/css/layout.css" />
		<link rel="stylesheet" href="/resources/css/accordions.css" />
		<link rel="stylesheet" href="/resources/css/dialogs.css" />
		<link rel="stylesheet" href="/resources/css/celestial-bodies.css" />
		<link rel="stylesheet" href="/resources/css/events.css" />
		<link rel="stylesheet" href="/resources/css/event-viewer.css" />
		<link rel="stylesheet" href="/resources/css/media-manager.css" />
		<link rel="stylesheet" href="/resources/css/timeline.css" />
		<link rel="stylesheet" href="/resources/css/timenav.css" />
		<link rel="stylesheet" href="/resources/css/video-gallery.css" />
		<link rel="stylesheet" href="/resources/css/youtube.css" />
		<link rel="stylesheet" href="/resources/css/font-awesome.min.css" />
		<link rel="stylesheet" href="/resources/css/helioviewer-views.css" />
	<?php
	} else {
	?>
		<link rel="stylesheet" href="/resources/compressed/helioviewer.min.css?v=<?=filemtime('resources/compressed/helioviewer.min.css')?>" />
		<!-- Google Analytics -->
		<script type="text/javascript">
			var _gaq = _gaq || [];
			_gaq.push(['_setAccount', 'UA-20263053-1']);
			_gaq.push(['_trackPageview']);
			_gaq.push(['_trackPageLoadTime']);

			(function() {
				var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
				ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
				var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
			}) ();
		</script>
	<?php
	}
	?>
	<script type="text/javascript">var outputType = <?php if($outputType){ echo "'".$outputType."'"; } else { echo 'false'; }?>;</script>

<?php
if(isset($_SERVER['HTTP_USER_AGENT'])) {
	if(strpos($_SERVER['HTTP_USER_AGENT'],'Phone')|strpos($_SERVER['HTTP_USER_AGENT'],'Android')|strpos($_SERVER['HTTP_USER_AGENT'],'iPad')) {
		$mtime = filemtime('resources/lib/responsive/responsive_hv.css');
		$hvmobcssfiles= <<<MCF
			<!-- START responsive CSS files -->
			<link rel='stylesheet' href='/resources/lib/responsive/zeynep.css'>
			<link href="/resources/lib/responsive/hamburger.min.css" rel="stylesheet">
			<link rel="stylesheet" href="/resources/lib/responsive/responsive_hv.css?v=$mtime">
			<!-- END responsive CSS files -->
	MCF;
		echo $hvmobcssfiles;
	} else {
		$hvdesktopcsshides= <<<DCH
			<style>
			.zeynep {
				display: none;
			}
			#hvmobilemenu_btn {
				display: none;
			}
			.zeynep-overlay {
				display: none;
			}
			.hvmobdstab_wrap {
				display: none;
			}
			.hvmobds_table {
				display: none;
			}
			.hvbottombar {
				display: none;
			}
			.hvbottomcal_wrap {
				display: none;
			}
			</style>
	DCH;
		echo $hvdesktopcsshides;
	}
}
?>
	<style id="js-styles"></style>
</head>
<body <?php echo ($outputType ? 'class="helioviewer-view-type-'.$outputType.'"' : '')?>>

<!-- Previously dynamic-made elements, created for selecting purposes -->
<a class="text-btn" style="display:none;"></a>

<!-- START mobile menu -->
<div class="zeynep" style="background-color:none;">
	<ul>

		<li id="hvmobscale_li"></li>

		<li>
			<table class="hvmobmenu_table" cellpadding="0" cellspacing="0" border="0" style="margin-top: 50px;">
				<td class="hvmobmenu_left_td">
					<span class="hvmobmenuitems" drawersec="hv-drawer-news">
						<img src="/resources/images/projectanounce_icon_transp.png" alt="HV project transparent image">&nbsp;&nbsp;
					</span>
				</td>
				<td class="hvmobmenu_right_td">
					<span class="hvmobmenuitems" drawersec="hv-drawer-news">Helioviewer Project Announcements.</span>
				</td>
			</table>
		</li>

		<li>
			<table class="hvmobmenu_table" cellpadding="0" cellspacing="0" border="0">
				<td class="hvmobmenu_left_td">
					<span class="hvmobmenuitems" drawersec="hv-drawer-youtube">
						<img src="/resources/images/viewyoutube_icon_transp.png" alt="Youtube icon">&nbsp;&nbsp;
					</span>
				</td>
				<td class="hvmobmenu_right_td">
					<span class="hvmobmenuitems" drawersec="hv-drawer-youtube">View Helioviewer Movies<br>Shared to YouTube.</span>
				</td>
			</table>
		</li>


		<li>
			<table class="hvmobmenu_table" cellpadding="0" cellspacing="0" border="0">
				<td class="hvmobmenu_left_td">
					<span class="hvmobmenuitems" drawersec="hv-drawer-movies">
						<img src="/resources/images/createmovie_icon_transp.png" alt="Create movie transparent icon">&nbsp;&nbsp;
					</span>
				</td>
				<td class="hvmobmenu_right_td">
					<span class="hvmobmenuitems" drawersec="hv-drawer-movies">Create a movie.</span>
				</td>
			</table>
		</li>

		<li>
			<table class="hvmobmenu_table" cellpadding="0" cellspacing="0" border="0">
				<td class="hvmobmenu_left_td">
					<span class="hvmobmenuitems" drawersec="hv-drawer-screenshots">
						<img src="/resources/images/screenshot_icon_transp.png" alt="Screenshot transparent icon">&nbsp;&nbsp;
					</span>
				</td>
				<td class="hvmobmenu_right_td">
					<span class="hvmobmenuitems" drawersec="hv-drawer-screenshots">Create a screenshot.</span>
				</td>
			</table>
		</li>

		<!--
		<li>
			<table class="hvmobmenu_table" cellpadding="0" cellspacing="0" border="0">
				<td class="hvmobmenu_left_td">
					<a href="">
						<img class="hvmobmenuitems" drawersec="hv-drawer-data" src="/resources/images/datadownload_icon_transp.png">&nbsp;&nbsp;
					</a>
				</td>
				<td class="hvmobmenu_right_td">
					<span class="hvmobmenuitems" drawersec="hv-drawer-data">Request Science Data Download from External Partners.</span>
				</td>
			</table>
		</li>
		-->

		<li>
			<table class="hvmobmenu_table" cellpadding="0" cellspacing="0" border="0">
				<td class="hvmobmenu_left_td">
					<span class="hvmobmenuitems" drawersec="hv-drawer-share">
						<img src="/resources/images/shareviewport_icon_transp.png" alt="Share viewport transparent icon">&nbsp;&nbsp;
					</span>
				</td>
				<td class="hvmobmenu_right_td">
					<span class="hvmobmenuitems" drawersec="hv-drawer-share">Share the current viewport on social media.</span>
				</td>
			</table>
		</li>

		<li class="has-submenu">
			<table class="hvmobmenu_table" cellpadding="0" cellspacing="0" border="0">
				<td class="hvmobmenu_left_td">
					<a href="#" data-submenu="hvhelp">
						<img src="/resources/images/help_icon_transp.png" alt="Help transparent icon">&nbsp;&nbsp;
					</a>
				</td>
				<td class="hvmobmenu_right_td">
					<a href="#" data-submenu="hvhelp">Get Help with Helioviewer.</a>
				</td>
			</table>

				<div id="hvhelp" class="submenu">

					<div class="submenu-header">
						<a href="#" data-submenu-close="hvhelp"><span style="font-weight:bold;">&#60;</span>&nbsp;&nbsp;Main Menu</a>
					</div>

					<label>Get Help With Helioviewer</label>

					<ul>
						<li id="about_hv_mobmenu_link">
							<span class="hvmobmenuitems" drawersec="hv-drawer-about" style="display:block;padding:8px;">About Helioviewer</span>
						</li>
						<!--
						<li>
							<a href="">User's Guide</a>
						</li>
						-->
						<li>
							<span class="hvmobmenuitems" drawersec="hv-drawer-glossary" style="display:block;padding:8px;">Visual Glossary</span>
						</li>
						<!--
						<li>
							<a href="">Documentation</a>
						</li>
						-->
						<li>
							<a target="_blank" href="https://api.helioviewer.org/docs/v2/">Public API Documentation</a>
						</li>
						<li>
							<a target="_blank" href="https://helioviewer-project.github.io/">Blog</a>
						</li>
						<li>
							<a target="_blank" href="mailto: HelioViewerDevelopment@nasa.onmicrosoft.com;">Contact</a>
						</li>
						<li>
							<a target="_blank" href="https://github.com/Helioviewer-Project/helioviewer.org/issues">Report Problem</a>
						</li>
					</ul>

				</div>


		</li>
		<!--
		<li>
			<table class="hvmobmenu_table" cellpadding="0" cellspacing="0" border="0">
				<td class="hvmobmenu_left_td">
					<a href="">
						<img class="hvmobmenuitems" drawersec="" src="/resources/images/setting_icon_transp.png">&nbsp;&nbsp;
					</a>
				</td>
				<td class="hvmobmenu_right_td">
					<span class="hvmobmenuitems" drawersec="">Edit Settings & Defaults</span>
				</td>
			</table>
		</li>
		-->
	</ul>

</div>


<button id="hvmobilemenu_btn" class="hamburger hamburger--emphatic btn-open first" type="button" aria-label="Mobile hamburger menu button">
  <span class="hamburger-box">
    <span class="hamburger-inner"></span>
  </span>
</button>


<div class="zeynep-overlay"></div>


<!-- END mobile menu -->


<!-- START Mobile toolbar -->

<div id="hvmobscale_div"></div>

<!-- END Mobile toolbar -->


<!-- START Mobile Drawer Tabs -->
<div class="hvmobdstab_wrap">
	<!--
	<div class="hvmobdstabs" id="accordion-date_mobtab" drawersec="accordion-date">Observation Date</div>&nbsp;
	<div class="hvmobdstabs" id="accordion-images_mobtab" drawersec="accordion-images">Images</div>&nbsp;
	<div class="hvmobdstabs" id="accordion-events_mobtab" drawersec="accordion-events">Features & Events</div>&nbsp;
	<div class="hvmobdstabs" id="accordion-bodies_mobtab" drawersec="accordion-bodies">Celestial Bodies</div>
	-->

<!-- START: Mobile Data source menu -->
<table class="hvmobds_table" cellpadding="0" cellspacing="0" border="0">
	<tr class="hvmobds_tr">
		<td class="hvmobds_td">
			<a class="hvmobdstabs" drawersec="accordion-images">
				<img class="hvmobds_icon" src="https://develop.helioviewer.org/resources/images/mobile/images_icon1.png" alt="Layers icon">
				<br><span>Images &amp;<span class="hvmobbs_br"><br></span> Layers</span>
			</a>
		</td>
		<td class="hvmobds_td">
			<a class="hvmobdstabs" drawersec="accordion-events">
				<img class="hvmobds_icon" src="https://develop.helioviewer.org/resources/images/mobile/events_icon1.png" alt="Events icon">
				<br><span>Features &amp;<span class="hvmobbs_br"><br></span> Events</span>
			</a>
		</td>
		<td class="hvmobds_td">
			<a class="hvmobdstabs" drawersec="accordion-bodies">
				<img class="hvmobds_icon" src="https://develop.helioviewer.org/resources/images/mobile/celestial_icon2.png" alt="Celestial Bodies icon">
				<br><span>Celestial<span class="hvmobbs_br"><br></span> Bodies</span>
			</a>
		</td>
	</tr>
</table>
<!-- END: Mobile Data source menu -->

</div>
<!-- END Mobile Drawer Tabs -->

<!-- START Mobile DateTime field -->
<div class="hvbottombar" style="">
	<div class="dtcycle">

		<table class="dtcycle_table2" cellpadding="0" cellspacing="0" border="0" style="width: 100%;height: 100%;">
			<tr>
				<td class="dtcycle_arrows_td" hvdtcontrol="day_down" style="text-align:left;"><img hvdtcontrol="day_down" class="dtcycle_arrows" src="/resources/images/mobile/leftarrow1.png" alt="Timeframe left arrow"></td>

				<!--
				<td id="dt_monthyear_td" style="">
					<span id="dt_month_td"></span><br>
					<span id="dt_year_td"></span>
				</td>
				<td id="dtday_td" style=""><span id="dt_day_spaces1">&nbsp;&nbsp;&nbsp;</span><span id="dt_day_td"></span></td>
				-->

				<td id="hvmobdate_td" style=""></td>

				<td id="hvmobtime_td" style=""></td>

				<td class="dtcycle_arrows_td" hvdtcontrol="day_up" style="text-align:right;"><img hvdtcontrol="day_up" class="dtcycle_arrows" src="/resources/images/mobile/rightarrow1.png" alt="Timeframe right arrow"></td>
			</tr>

			<tr>
				<td class="dtcycle_jump_td" colspan="2" style="">
					<span style="color:#ffffff;">JUMP:</span>&nbsp;
					<span id="hvmobjump_div"></span>
				</td>

				<td class="dtcycle_jump_td" id="timeNowBtn_mob_td" colspan="2" >

				</td>
			</tr>

		</table>


	</div>
</div>
<!-- END Mobile DateTime field -->

<!-- START mobile bottom calendar tool -->

<div class="hvbottomcal_wrap">
<img src="/resources/images/mobile/calendar1.png" class="hvbottomcal_img" alt="Calendar icon">
</div>

<!-- END mobile bottom calendar tool -->

<!-- START Mobile Event Popup -->
<!--<div id="invispopupbg"></div>-->
<div id="event-popup_mob"></div>
<!-- END Mobile Event Popup -->


	<?php if($outputType != 'embed'){ ?>
	<div class="user-select-none" style="width: 100%; margin: 0; padding: 0; text-align: center; z-index: 9;">
		<!-- Image area select tool -->
		<div id='image-area-select-buttons'>

			<div style="margin: 0 auto; width: 20em;">
				<div id='cancel-selecting-image' class='text-btn'>
					<span class='fa fa-times-circle fa-fw'></span>
					<span>Cancel</span>
				</div>
				<div id='done-selecting-image' class='text-btn'>
					<span class='fa fa-check-circle fa-fw'></span>
					<span>Confirm Selection</span>
				</div>
			</div>

		</div>
	</div>
	<?php } ?>

	<div style="width: 100%; height: 100%; margin: 0; padding: 0;">
		<?php if(!$outputType){ ?>
		<div id="hv-header" class="user-select-none">

			<div id="loading">
				<span>
					<span>Loading Data</span>
					<span class="fa fa-circle-o-notch fa-spin"></span>
				</span>
			</div>

			<div id="logo">
				<h1>
					<span><a class="logo-icon fa fa-sun-o fa-fw" href="" title="The Open-Source Solar and Heliospheric Data Browser"><span class="sr-only">Helioviewer.org</span></a><a class="logo-text" href="" title="The Open-Source Solar and Heliospheric Data Browser">Helioviewer.org</a></span>
				</h1>
			</div>

			<div id="zoom">

				<!--  Zoom Controls -->
				<div id="zoomControls" style="display: none;">
					<div id="zoomControlZoomIn" title="Zoom in." style="display: none;">+</div>
					<div id="zoomSliderContainer" style="display: none;">
						<div id="zoomControlSlider" style="display: none;"></div>
					</div>
					<div id="zoomControlZoomOut" title="Zoom out." style="display: none;">-</div>
				</div>

				<div id="center-button" class="viewport-action fa fa-crosshairs" title="Center the Sun in the Viewport"></div>

				<div id="zoom-out-button" class="viewport-action fa fa-search-minus" title="Zoom Out"></div>

				<div id="zoom-in-button" class="viewport-action fa fa-search-plus" title="Zoom In"></div>

			</div>

			<div id="menus">

				<div class="left">

					<div id="news-button" class="fa fa-rss fa-fw qtip-left social-button" title="Helioviewer Project Announcements."></div>

					<div id="youtube-button" class="fa fa-fw qtip-left" title="View Helioviewer Movies Shared to YouTube."></div>

					<div id="movies-button" class="fa fa-file-video-o fa-fw qtip-left social-button" title="Create a Helioviewer Movie."></div>

					<a id="screenshots-button" class="fa fa-file-picture-o fa-fw qtip-left social-button" title="Download a screenshot of the current Helioviewer Viewport."></a>

					<a id="data-button" class="fa fa-file-code-o fa-fw qtip-left social-button" title="Request Science Data Download from External Partners."></a>

					<div id="share-button" class="fa fa-share-square-o fa-fw qtip-left social-button" title="Share the current viewport on social media."></div>
				</div>

				<div class="right" style="margin-right: 0.5em;">
					<div id="help-button" class="fa fa-question fa-fw qtip-left" href="" style="margin-left: 0.5em;" title="Get Help with Helioviewer."></div>

					<div id="settings-button" class="fa fa-cog fa-fw qtip-left" title="Edit Settings &amp; Defaults."></div>
				</div>

			</div>


			<div id="scale">

				<div id="earth-button" class="viewport-action segmented-left fa fa-globe" title="Toggle Earth-Scale Indicator."></div><div id="scalebar-button" class="viewport-action segmented-right fa fa-arrows-h" style="border-left: 0;" title="Toggle Length scale indicator."></div>

			</div>

			<!-- Mouse coordinates display -->
			<div id="mouse-coords-box">
				<div id="mouse-coords">
					<div id="js-coord-help" class="coord-notice" rel="/dialogs/mouse_coordinates.html"><span class="fa fa-info"></span></div>
					<div class="mouse-coordinate-labels">
						<span id="js-label-1">X: </span>
						<span id="js-label-2">Y: </span>
					</div>
					<div class="mouse-coordinate-values">
						<span><span id="mouse-coords-x"></span><span class="mouse-unit" id="js-unit-1"></span></span>
						<span><span id="mouse-coords-y"></span><span class="mouse-unit" id="js-unit-2"></span></span>
					</div>
				</div>
				<div id="mouse-cartesian" style="margin-top:4px;" class="viewport-action segmented-left fa fa-cube" title="Toggle Mouse Coordinates (Cartesian)"></div><div id="mouse-polar" class="viewport-action segmented-right fa fa-dot-circle-o" style="border-left: 0;margin-top:4px;" title="Toggle Mouse Coordinates (Polar)"></div>
			</div>

		</div>

		<div id="hv-drawer-left" class="user-select-none">
			<div class="drawer-contents">
				<div id="accordion-date" class="accordion">

					<div class="header">

						<div class="disclosure-triangle closed">►</div>
						<h1>Observation Date</h1>
						<div class="right fa fa-question-circle contextual-help" style="margin-right: 15px;" title="
	Changing the 'Observation Date' will update the Viewport with data matching the new date and time.<br /><br />

	Use the 'Jump' controls to browse forward and backward in time by a regular interval.<br /><br />

	Note that when an image is not available for the exact date and time you selected, the closest available match will be displayed instead.<br />
						">
						</div>
					</div>

					<div class="content">
						<div class="section">
							<div id="observation-controls" class="row">
								<div class="label">Date:</div>
								<div class="field">
									<input aria-label="Observation date" type="text" id="date" name="date" value="" pattern="[\d]{4}/[\d]{2}/[\d]{2}" maxlength="10" class="datepicker hasDatepicker"/>

									<input aria-label="Observation time" id="time" name="time" value="" type="text" maxlength="8" pattern="[\d]{2}:[\d]{2}:[\d]{2}" class="timepicker"/>

									<div class="suffix dateSelector" data-tip-pisition="right" data-date-field="date" data-time-field="time">UTC</div>

									<div id="timeNowBtn" class="fa fa-clock-o right" style="padding-top: 0.4em; font-size: 1em;" title="Jump to the most recent available image's for the currently loaded layer(s).">
										<span class="ui-icon-label">NEWEST</span>
									</div>
								</div>
							</div>
							<div class="row">
								<div id="time-step-jump" class="label">Jump:</div>
								<div class="field">

									<select aria-labelledby="time-step-jump" id="timestep-select" name="time-step"></select>

									<div id="timeBackBtn" class="inline fa fa-arrow-circle-left" style="font-size: 1.5em;" title="Jump Backward in Time."></div>
									<div id="timeForwardBtn" class="inline fa fa-arrow-circle-right" style="font-size: 1.5em;" title="Jump Forward in Time."></div>
								</div>
							</div>
						</div>
					</div>

				</div>

				<div id="accordion-images" class="accordion">
					<div class="header">
						<div class="disclosure-triangle closed">►</div>
						<h1>Images

							<div class="dropdown-holder layersPresetsList" style="display:inline-block;">
							    <ul class="clearfix">
							        <li class="dropdown-main" style="width:30px">
							            <a href="#" id="images-presets-dropdown" class="text-button" title="Images presets" style="font-size:0.75em;width:15px"><span class="fa fa-th"></span> <!--fa-server fa-bars--><span class="sr-only">Layer presets</span></a>
							            <ul class="sub-menu">

							            </ul>
							        </li>
							    </ul>
							</div>

						</h1>
						<div class="right fa fa-question-circle contextual-help" style="margin-right: 15px;" title="Up to five (5) independent image layers may be viewed simultaneously."></div>
						<div class="accordion-header">
							<a href="#" id="add-new-tile-layer-btn" class="text-button" title="Click to add an image data layer to the Viewport."><span class="fa fa-plus-circle"></span> Add Layer</a>
						</div>
					</div>
					<div class="content">
						<div id="tileLayerAccordion">
							<div id="TileLayerAccordion-Container"></div>
						</div>
					</div>
				</div>

				<div id="accordion-events" class="accordion">
					<div class="header">
						<div class="disclosure-triangle closed">►</div>
						<h1>Features and Events</h1>
						<div class="right fa fa-question-circle contextual-help" style="margin-right: 15px;" title="Solar feature and event annotations such as marker pins, extended region polygons, and metadata."></div>
					</div>
					<div class="content">
						<div id="eventLayerAccordion">
							<div id="EventLayerAccordion-Container"></div>
						</div>
					</div>
				</div>
				<div id="accordion-bodies" class="accordion">
					<div class="header">
						<div class="disclosure-triangle closed">►</div>
						<h1>Celestial Bodies</h1>
						<div class="right fa fa-question-circle contextual-help" style="margin-right: 15px;" title="Celestial Bodies - Satellites orbiting in the solar system."></div>
					</div>
					<div class="content">
						<div id="solarBodiesAccordion">
							<div id="SolarBodiesAccordion-Container"></div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div id="hv-drawer-tab-left" class="drawer-tab drawer-tab-left user-select-none">Data Sources</div>


		<div id="hv-drawer-news" class="hv-drawer-right user-select-none">
			<div class="drawer-contents">

				<div id="accordion-news" class="accordion">
					<div class="header">
						<div class="disclosure-triangle-alway-open opened">►</div>
						<h1>Helioviewer Project News</h1>
						<div class="right fa fa-question-circle contextual-help qtip-left" title="Helioviewer Project news and tweets."></div>
					</div>
					<div class="content" style="display:block;">
						<div class="section">
							<div id="social-panel" class="ui-widget ui-widget-content ui-corner-all"></div>
						</div>
					</div>
				</div>

			</div>
		</div>


		<div id="hv-drawer-youtube" class="hv-drawer-right user-select-none">
			<div class="drawer-contents">

				<div id="accordion-youtube-current" class="accordion">
					<div class="header">
						<div class="disclosure-triangle closed">►</div>
						<h1>Movies Spanning Observation Date</h1>
						<div class="right fa fa-question-circle contextual-help qtip-left" title="View YouTube movies generated by users of Helioviewer for current observation date."></div>
					</div>
					<div class="content">
						<div class="section">
							<!-- User-Submitted Videos -->
							<div id="user-video-gallery-current" class="ui-widget ui-widget-content ui-corner-all">
								<label for="movies-show-in-viewport"><input type="checkbox" id="movies-show-in-viewport"/> Show in Viewport</label>
								<div id="user-video-gallery-main-current">
									<span id="user-video-gallery-spinner-current"></span>
								</div>
								<p class="js-no-movies" style="display: none;">No shared movies found.</p>
							</div>
						</div>
					</div>
				</div>

				<div id="accordion-youtube" class="accordion">
					<div class="header">
						<div class="disclosure-triangle closed">►</div>
						<h1>Recently Shared to YouTube</h1>
						<div class="right fa fa-question-circle contextual-help qtip-left" title="View YouTube movies generated by users of Helioviewer."></div>
					</div>
					<div class="content">
						<div class="section">
							<!-- User-Submitted Videos -->
							<div id="user-video-gallery" class="ui-widget ui-widget-content ui-corner-all">
								<div id="user-video-gallery-main">
									<span id="user-video-gallery-spinner"></span>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div class="clear clearfix" style="display:block;clear:both;"></div>
			</div>
		</div>


		<div id="hv-drawer-movies" class="hv-drawer-right user-select-none">
			<div class="drawer-contents">

				<div id="accordion-movies" class="accordion">
					<div class="header">
						<div class="disclosure-triangle-alway-open opened">►</div>
						<h1>Generate a Movie</h1>
						<div class="right fa fa-question-circle contextual-help qtip-left" title="Generate a custom move from up to three (3) image layers plus solar feature and event marker pins, labels, and extended region polygons."></div>
					</div>
					<div class="content" style="display:block;">
						<div class="section">

							<!-- Movie Manager -->
							<div id='movie-manager-container' class='media-manager-container'>
								<div id='movie-manager-build-btns' class='media-manager-build-btns'>
									<div style="width: 70%; margin: 0 auto;">
										<div id='movie-manager-full-viewport' class='text-btn qtip-left' title='Create a movie using the entire viewport.'>
											<span class='fa fa-arrows-alt fa-fw'></span>
											<span style='line-height: 1.6em'>Full Viewport</span>
										</div>
										<div id='movie-manager-select-area' class='text-btn qtip-left' style='float:right;' title='Create a movie of a sub-region of the viewport.'>
											<span class='fa fa-crop fa-fw'></span>
											<span style='line-height: 1.6em'>Select Area</span>
										</div>
									</div>
								</div>
								<div id='movie-history-title'>
									Movie History:
									<div id='movie-clear-history-button' class='text-btn qtip-left' style='float:right;' title='Remove all movies from the history.'>
										<span style='font-weight: 200;'>clear history</span>
										<span class='fa fa-trash-o'></span>
									</div>
								</div>
								<div id='movie-history'></div>
							</div>

							<!-- Movie Settings -->
							<div id='movie-settings-container' class='media-manager-container'>
								<b>Movie Settings:</b>

								<div id='movie-settings-btns' style='float:right;'>
									<span id='movie-settings-toggle-help' style='display:inline-block;' class='fa fa-help qtip-left' title='Movie settings help'></span>
								</div>

								<!-- Begin movie settings -->
								<div id='movie-settings-form-container'>
								<form id='movie-settings-form'>

								<!-- Advanced movie settings -->
								<div id='movie-settings-advanced'>

									<!-- Movie duration -->
									<fieldset style='padding: 0px; margin: 5px 0px 8px' class="movie-duration-box">
										<label for='movie-duration' style='margin-right: 5px; font-style: italic;'>Duration</label>
										<select id='movie-duration' name='movie-duration'>
											<option value='3600'>1 hour</option>
											<option value='10800'>3 hours</option>
											<option value='21600'>6 hours</option>
											<option value='43200'>12 hours</option>
											<option value='86400'>1 day</option>
											<option value='172800'>2 days</option>
											<option value='604800'>1 week</option>
											<option value='2419200'>28 days</option>
										</select>
									</fieldset>

									<!-- Movie Start/End Time -->
									<fieldset style='padding: 0px; margin: 5px 0px 8px' class="movie-time-box">
										<label for='movie-start-date' style='width: 40px; font-style: italic;'>Start </label>
										<input aria-label="Start date" type="text" id="movie-start-date" name="movie-start-date" value="" pattern="[\d]{4}/[\d]{2}/[\d]{2}" maxlength="10" class="hasDatepicker"/>
										<input aria-label="Start time" id="movie-start-time" name="movie-start-time" value="" type="text" maxlength="8" pattern="[\d]{2}:[\d]{2}:[\d]{2}"/> UTC<br/>

										<label for='movie-end-date' style='width: 40px; font-style: italic;'>End </label>
										<input aria-label="End date" type="text" id="movie-end-date" name="movie-end-date" value="" pattern="[\d]{4}/[\d]{2}/[\d]{2}" maxlength="10" class="hasDatepicker"/>
										<input aria-label="End time" id="movie-end-time" name="movie-end-time" value="" type="text" maxlength="8" pattern="[\d]{2}:[\d]{2}:[\d]{2}"/> UTC<br/>
									</fieldset>

									<!-- Movie Speed -->
									<fieldset id='movie-settings-speed'>
										<legend>Speed</legend>
										<div style='padding:10px;'>
											<input aria-labelledby="speed-method-fps" type="radio" name="speed-method" id="speed-method-f" value="framerate" checked="checked" />
											<label id="speed-method-fps" for="speed-method-f" style='width: 62px;'>Frames/Sec</label>
											<input aria-labelledby="speed-method-fps" id='frame-rate' min="1" max="30" step="1" type="number" name="framerate"/>(1-30)<br />

											<input aria-labelledby="speed-method-length" type="radio" name="speed-method" id="speed-method-l" value="length" />
											<label id="speed-method-length" for="speed-method-l" style='width: 62px;'>Length (s)</label>
											<input aria-labelledby="speed-method-length" id='movie-length' min="5" max="100" value="20" step="1" type="number" name="movie-length" disabled="disabled"/>(5-100)<br />
										</div>
									</fieldset>

									<!-- Movie Start/End Time -->
									<fieldset style='padding: 0px; margin: 5px 0px 8px;' class="movie-format-box">
										<label for='movie-size' style='width: 40px; font-style: italic;'>Size</label>
										<select id='movie-size' name='movie-size' style="width:190px;">
											<option value='0' selected="selected">Original</option>
											<option value='1'>720p (1280 x 720, HD Ready)</option>
											<option value='2'>1080p (1920 x 1080, Full HD)</option>
											<option value='3'>1440p (2560 x 1440, Quad HD)</option>
											<option value='4'>2160p (3840 x 2160, 4K or Ultra HD)</option>
										</select>
									</fieldset>

									<!-- Display Shared YouTube movies -->
									<fieldset style='padding: 0px; margin: 5px 0px 8px;' class="movie-icon-box">
										<input type="checkbox" name="movie-icons" id="movie-icons" value="1" />
										<label for='movie-icons' style='width: 200px; font-style: italic;'>Display YouTube movies icons</label>
									</fieldset>

									<!-- Rotate field of view of movie with Sun -->
									<fieldset style='padding: 0px; margin: 5px 0px 8px;' class="movie-follow-viewport-box">
										<input type="checkbox" name="follow-viewport" id="follow-viewport" value="1"/>
										<label for='follow-viewport' style='width: 200px; font-style: italic;'>Rotate field of view of movie with Sun</label>
									</fieldset>

								</div>

								<!-- Movie request submit button -->
								<div id='movie-settings-submit'>
									<a href="#" class="movie-settings-more-btn" style="float:left;margin-top:17px;text-decoration: underline;">Advanced Settings</a>
									<a href="#" class="movie-settings-less-btn" style="float:left;margin-top:17px;text-decoration: underline;">Less Settings</a>
									<input aria-label="Cancel" type="button" id='movie-settings-cancel-btn' value="Cancel" />
									<input aria-label="Submit" type="submit" id='movie-settings-submit-btn' value="Ok" />
								</div>

								</form>
								</div>

								<!-- Movie settings help -->
								<div id='movie-settings-help' style='display:none'>
									<b>Duration</b><br /><br />
									<p>The duration of time that the movie should span, centered about your current observation time.</p><br />

									<b>Speed</b><br /><br />
									<p>Movie speed can be controlled either by specifying a desired frame-rate (the number of frames displayed each second) or a length in seconds.</p><br />
								</div>

								<!-- Movie settings validation console -->
								<div id='movie-settings-validation-console' style='display:none; text-align: center; margin: 7px 1px 0px; padding: 0.5em; border: 1px solid #fa5f4d; color: #333; background: #fa8072;' class='ui-corner-all'>

								</div>
							</div>

						</div>
					</div>
				</div>

			</div>
		</div>


		<div id="hv-drawer-screenshots" class="hv-drawer-right user-select-none">
			<div class="drawer-contents">

				<div id="accordion-screenshots" class="accordion">
					<div class="header">
						<div class="disclosure-triangle-alway-open opened">►</div>
						<h1>Generate a Screenshot</h1>
						<div class="right fa fa-question-circle contextual-help qtip-left" title="Download a custom screenshot matching the state of your Helioviewer session, minus the user-interface."></div>
					</div>
					<div class="content" style="display:block;">

						<!-- Screenshot Manager -->
						<div id='screenshot-manager-container' class='media-manager-container'>

							<div class="section">
								<div id='screenshot-manager-build-btns' class='media-manager-build-btns'>
									<div style="width: 70%; margin: 0 auto;">
										<div id='screenshot-manager-full-viewport' class='text-btn qtip-left' title='Create a screenshot using the entire viewport.'>
											<span class='fa fa-arrows-alt fa-fw'></span>
											<span style='line-height: 1.6em'>Full Viewport</span>
										</div>
										<div id='screenshot-manager-select-area' class='text-btn qtip-left' style='float:right;' title='Create a screenshot of a sub-region of the viewport.'>
											<span class='fa fa-crop fa-fw'></span>
											<span style='line-height: 1.6em'>Select Area</span>
										</div>
									</div>
								</div>

								<div id='screenshot-history-title'>
									Screenshot History:
									<div id='screenshot-clear-history-button' class='text-btn qtip-left' style='float:right;' title='Remove all screenshots from the history.'>
										<span style='font-weight: 200;'>clear history</span>
										<span class='fa fa-trash-o'></span>
									</div>
								</div>
								<div id='screenshot-history'></div>
							</div>

						</div>

					</div>
				</div>

			</div>
		</div>


		<div id="hv-drawer-data" class="hv-drawer-right user-select-none">
			<div class="drawer-contents">

				<div id="accordion-vso" class="accordion">
					<div class="header">
						<div class="disclosure-triangle closed">►</div>
						<h1>Virtual Solar Observatory</h1>
						<div class="right fa fa-question-circle contextual-help qtip-left" title="Request science data downloads via the Virtual Solar Observatory (VSO)."></div>
					</div>
					<div class="content">
						<div class="section">
							<h1>Request Viewport Images from VSO</h1>
							<div id="vso-links"></div>
						</div>

						<div class="section">
							<h1>Request Image Sequence from VSO</h1>
							<div>
								<div class="row">
									<div id="vso-start-date-label" class="label inactive">Start Date:</div>
									<div class="field">
										<input aria-labelledby="vso-start-date-label" type="text" id="vso-start-date" name="vso-start-date" value="" pattern="[\d]{4}/[\d]{2}/[\d]{2}" maxlength="10" class="hasDatepicker" disabled />

										<input aria-label="Start time" id="vso-start-time" name="vso-start-time" value="" type="text" maxlength="8" pattern="[\d]{2}:[\d]{2}:[\d]{2}" disabled />

										<div class="suffix dateSelector" data-tip-pisition="left" data-date-field="vso-start-date" data-time-field="vso-start-time">UTC</div>
									</div>
								</div>

								<div class="row">
									<div id="vso-end-date-label" class="label inactive">End Date:</div>
									<div class="field">
										<input aria-labelledby="vso-end-date-label" type="text" id="vso-end-date" name="vso-end-date" value="" pattern="[\d]{4}/[\d]{2}/[\d]{2}" maxlength="10" class="hasDatepicker" disabled />

										<input aria-label="End time" id="vso-end-time" name="vso-end-time" value="" type="text" maxlength="8" pattern="[\d]{2}:[\d]{2}:[\d]{2}" disabled />

										<div class="suffix inactive dateSelector" data-tip-pisition="left" data-date-field="vso-end-date" data-time-field="vso-end-time">UTC</div>
									</div>
								</div>

								<div class="row">
									<div id="vso-previews"></div>
								</div>

								<div class="row">
									<div id="vso-buttons"  class="buttons">
										<div id="vso-sunpy" style="display: none;" class="text-button fa fa-download inactive qtip-left" title="Download a Python SunPy script that will request from the Virtual Solar Observatory the data set specified above."> SunPy Script</div>
										<div id="vso-ssw" class="text-button fa fa-download inactive qtip-left" title="Download an IDL SolarSoft script that will request from the Virtual Solar Observatory the data set specified above."> SSW Script</div>
										<a id="vso-www" class="text-button fa fa-external-link-square inactive qtip-left" title="Launch a Virtual Solar Observatory web page that will request the data set specified above." target="_blank"> VSO Website</a>
									</div>
								</div>

							</div>
						</div>
					</div>
				</div>

				<div id="accordion-sdo" class="accordion">
					<div class="header">
						<div class="disclosure-triangle closed">►</div>
						<h1>SDO AIA/HMI Cut-out Service</h1>
						<div class="right fa fa-question-circle contextual-help qtip-left" title="Request AIA or HMI sub-field images."></div>
					</div>
					<div class="content">
						<div class="section">
							<h1>Request Image Sequence from Cut-out Service</h1>
							<div style="padding-bottom:50px">
								<div class="row">
									<div id="sdo-start-date-label" class="label inactive">Start Date:</div>
									<div class="field">
										<input aria-labelledby="sdo-start-date-label" type="text" id="sdo-start-date" name="sdo-start-date" value="" pattern="[\d]{4}/[\d]{2}/[\d]{2}" maxlength="10" class="hasDatepicker" disabled />

										<input aria-label="Start time" id="sdo-start-time" name="sdo-start-time" value="" type="text" maxlength="8" pattern="[\d]{2}:[\d]{2}:[\d]{2}" disabled />

										<div class="suffix inactive dateSelector" data-tip-pisition="left" data-date-field="sdo-start-date" data-time-field="sdo-start-time">UTC</div>
									</div>
								</div>

								<div class="row">
									<div id="sdo-end-date-label" class="label inactive">End Date:</div>
									<div class="field">
										<input aria-labelledby="sdo-end-date-label" type="text" id="sdo-end-date" name="sdo-end-date" value="" pattern="[\d]{4}/[\d]{2}/[\d]{2}" maxlength="10" class="hasDatepicker" disabled />

										<input aria-label="End time" id="sdo-end-time" name="sdo-end-time" value="" type="text" maxlength="8" pattern="[\d]{2}:[\d]{2}:[\d]{2}" disabled />

										<div class="suffix inactive dateSelector" data-tip-pisition="left" data-date-field="sdo-end-date" data-time-field="sdo-end-time">UTC</div></div>
								</div>

								<br />


								<div class="row">
									<div style="font-size: 1.3em;">
										<div class="media-manager-build-btns buttons" style="width: 70%; margin: 0 auto;">
											<div id='sdo-full-viewport' class='text-btn qtip-left selected inactive' title='Entire viewport.'>
												<span class='fa fa-arrows-alt fa-fw'></span>
												<span style='line-height: 1.6em'>Full Viewport</span>
											</div>
											<div id='sdo-select-area' class='text-btn qtip-left inactive' style='float:right;' title='Sub-field'>
												<span class='fa fa-crop fa-fw'></span>
												<span style='line-height: 1.6em'>Select Area</span>
											</div>
										</div>
									</div>
								</div>


								<div class="row">
									<div class="label inactive">Center (x,y):</div>
									<div class="field">
										<input aria-label="Center X" type="text" id="sdo-center-x" name="sdo-center-x" value="0" maxlength="6" disabled />
										<input aria-label="Center Y" id="sdo-center-y" name="sdo-center-y" value="0" type="text" maxlength="6" disabled />
										<div class="suffix inactive">arcsec</div>
									</div>
								</div>

								<div class="row">
									<div id="sdo-width-label" class="label inactive">Width:</div>
									<div class="field" style="text-align: left;">
										<input aria-labelledby="sdo-width-label" type="text" id="sdo-width" name="sdo-width" value="2000" maxlength="6" disabled />
										<div class="suffix inactive">arcsec</div>
									</div>
								</div>

								<div class="row">
									<div id="sdo-height-label" class="label inactive">Height:</div>
									<div class="field">
										<input aria-labelledby="sdo-height-label" type="text" id="sdo-height" name="sdo-height" value="2000" maxlength="6" disabled />
										<div class="suffix inactive">arcsec</div>
									</div>
								</div>

								<div class="row">
									<div id="sdo-previews"></div>
								</div>

								<div class="row">
									<div id="sdo-buttons" class="buttons">
										<div id="sdo-ssw" class="text-button fa fa-download inactive qtip-left" title="Download an IDL SolarSoft script that will request from the SDO Cut-out Service the data set specified above."> SSW Script</div>
										<a id="sdo-www" class="text-button fa fa-external-link-square qtip-left" title="Launch a SDO Cut-out Service web page that will request the data set specified above." target="_blank"> SDO Cut-out Service Website</a>
									</div>
								</div>

							</div>
						</div>
					</div>
				</div>
			</div>
		</div>



		<div id="hv-drawer-share" class="hv-drawer-right user-select-none">
			<div class="drawer-contents">

				<div id="accordion-link" class="accordion">
					<div class="header">
						<div class="disclosure-triangle-alway-open opened">►</div>
						<h1>Share Link to Current Viewport</h1>
						<div class="right fa fa-question-circle contextual-help qtip-left" title="Share Link to Current Viewport"></div>
					</div>
					<div class="content" style="display:block;">
						<div class="section">
							<div id="helioviewer-url-box" style="font-size: 1em;">
								<span id="helioviewer-url-box-msg"></span>
								<span id="helioviewer-url-box-stale-link-msg" style="color:#f8e64f; display:none;">Your link has become stale, click <a id="update-share-url-link" style="cursor:pointer">here</a> to update it.</span>
								<span id="helioviewer-url-box-stale-link-success-msg" style="color:green; display:none;">Updated!</span>
								<form style="margin-top: 5px; text-align: center;">
									<input aria-label="Viewport URL" type="text" id="helioviewer-share-url" style="width:98%;" value="" readonly/>
								</form>
							</div>

							<br />

							<div>
								<div style="width: 65%; height: 40px; margin: 0 auto; font-size: 1.5em;">
									<div id='share-copy-link' class='text-btn qtip-left' title='Copy Link'>
										<span class='fa fa-copy fa-fw'></span>
										<span style='line-height: 1.6em'>Copy Link</span>
									</div>
									<div id='share-email-link' class='text-btn qtip-left' style='float:right;' title='Email Link'>
										<span class='fa fa-envelope fa-fw'></span>
										<span style='line-height: 1.6em'>Email Link</span>
									</div>
								</div>
							</div>

						</div>
					</div>
				</div>

				<div id="accordion-social" class="accordion">
					<div class="header">
						<div class="disclosure-triangle-alway-open opened">►</div>
						<h1>Share to Social Networks</h1>
						<div class="right fa fa-question-circle contextual-help qtip-left" title="Share Link to Current Viewport"></div>
					</div>
					<div class="content" style="display:block;">
						<div class="section">
							<div id="social-panel">

								<div id='twitter' class='social-btns'>
									<div style="font-size: 1.5em;">
										<div id='share-twitter-link' class='text-btn qtip-left' style="width: 90%;border:none;" title='Share Screenshot on X'>
											<span class='fa fa-twitter-square fa-fw'></span>
											<span style='line-height: 1.6em'>Share Screenshot on X</span>
										</div>
									</div>
								</div>

								<div id='facebook' class='social-btns'>
									<div style="font-size: 1.5em;">
										<div id='share-facebook-link' class='text-btn qtip-left color-facebook' style="width: 90%;border:none;" title='Share Screenshot with Facebook'>
											<span class='fa fa-facebook-square fa-fw'></span>
											<span style='line-height: 1.6em'>Share Screenshot with Facebook</span>
										</div>
									</div>
								</div>

								<div id='pinterest' class='social-btns'>
									<div style="font-size: 1.5em;">
										<div id='share-pinterest-link' class='text-btn qtip-left' style="width: 90%;border:none;" title='Pin Screenshot'>
											<span class='fa fa-pinterest-square fa-fw'></span>
											<span style='line-height: 1.6em'>Pin Screenshot</span>
										</div>
									</div>
								</div>


							</div>
						</div>
					</div>
				</div>

			</div>
		</div>



		<div id="hv-drawer-help" class="hv-drawer-right user-select-none">
			<div class="drawer-contents">

				<div id="accordion-help-links" class="accordion">
					<div class="header">
						<div class="disclosure-triangle-alway-open opened">►</div>
						<h1>The Helioviewer Project</h1>
						<div class="right fa fa-question-circle contextual-help qtip-left" title="About Helioviewer.org"></div>
					</div>
					<div class="content" style="display:block;">
						<div class="section">
							<div id="help-links-panel" class="">

								<div class='social-btns'>
									<div style="font-size: 1.5em;">
										<div id='help-links-tutorial' onclick="startTutorial();" class='text-btn qtip-left' style="width: 90%;border:none;" title="Interactive Tutorial" rel="/dialogs/about.php">
											<span class='fa fa-compass fa-fw'></span>
											<span style='line-height: 1.6em'>Interactive Tutorial</span>
										</div>
									</div>
								</div>
								<div class='social-btns'>
									<div style="font-size: 1.5em;">
										<div id='help-links-about' class='text-btn qtip-left' style="width: 90%;border:none;" title="About Helioviewer.org" rel="/dialogs/about.php">
											<span class='fa fa-question-circle fa-fw'></span>
											<span style='line-height: 1.6em'>About Helioviewer.org</span>
										</div>
									</div>
								</div>

								<div class='social-btns'>
									<div style="font-size: 1.5em;">
										<div id='help-links-guide' class='text-btn qtip-left' style="width: 90%;border:none;" title="User's Guide">
											<span class='fa fa-bookmark-o fa-fw'></span>
											<span style='line-height: 1.6em'>User's Guide</span>
										</div>
									</div>
								</div>

								<div class='social-btns'>
									<div style="font-size: 1.5em;">
										<div id='help-links-glossary' class='text-btn qtip-left color-facebook' style="width: 90%;border:none;" title='Visual Glossary' rel="/dialogs/glossary.html">
											<span class='fa fa-key fa-fw'></span>
											<span style='line-height: 1.6em'>Visual Glossary</span>
										</div>
									</div>
								</div>

								<div class='social-btns'>
									<div style="font-size: 1.5em;">
										<div id='help-links-shortcuts' class='text-btn qtip-left' style="width: 90%;border:none;" title='Keyboard Shortcuts' rel="/dialogs/usage.php">
											<span class='fa fa-keyboard-o fa-fw'></span>
											<span style='line-height: 1.6em'>Keyboard Shortcuts</span>
										</div>
									</div>
								</div>

								<div class='social-btns'>
									<div style="font-size: 1.5em;">
										<div id='help-links-documentation' class='text-btn qtip-left' style="width: 90%;border:none;" title='Documentation'>
											<span class='fa fa-book fa-fw'></span>
											<span style='line-height: 1.6em'>Documentation</span>
										</div>
									</div>
								</div>

								<div class='social-btns'>
									<div style="font-size: 1.5em;">
										<div id='help-links-api-documentation' class='text-btn qtip-left' style="width: 90%;border:none;" title='Public API Documentation'>
											<span class='fa fa-code fa-fw'></span>
											<span style='line-height: 1.6em'>Public API Documentation</span>
										</div>
									</div>
								</div>

								<div class='social-btns'>
									<div style="font-size: 1.5em;">
										<div id="help-links-statistics" class='text-btn qtip-left' style="width: 90%;border:none;">
											<span class='fa fa-bar-chart fa-fw'></span>
											<span style='line-height: 1.6em'>Statistics</span>
										</div>
									</div>
								</div>

								<div class='social-btns'>
									<div style="font-size: 1.5em;">
										<div id="help-links-status" class='text-btn qtip-left' style="width: 90%;border:none;">
											<span class='fa fa-cloud-download fa-fw'></span>
											<span style='line-height: 1.6em'>Status</span>
										</div>
									</div>
								</div>

								<div class='social-btns'>
									<div style="font-size: 1.5em;">
										<div id="help-links-coverage" class='text-btn qtip-left' style="width: 90%;border:none;">
											<span class='fa fa-calendar fa-fw'></span>
											<span style='line-height: 1.6em'>Coverage</span>
										</div>
									</div>
								</div>

								<div class='social-btns'>
									<div style="font-size: 1.5em;">
										<div id='help-links-blog' onclick="window.open('https://helioviewer-project.github.io/','_blank');" class='text-btn qtip-left' style="width: 90%;border:none;" title='Blog'>
											<span class='fa fa-rss fa-fw'></span>
											<span style='line-height: 1.6em'>Blog</span>
										</div>
									</div>
								</div>

								<div class='social-btns'>
									<div style="font-size: 1.5em;">
										<div id='help-links-jhelioviewer' class='text-btn qtip-left' style="width: 90%;border:none;" title='JHelioviewer'>
											<span class='fa fa-sun-o fa-fw'></span>
											<span style='line-height: 1.6em'>JHelioviewer</span>
										</div>
									</div>
								</div>

								<div class='social-btns'>
									<div style="font-size: 1.5em;">
										<div id='help-links-contact' class='text-btn qtip-left' style="width: 90%;border:none;" title='Contact'>
											<span class='fa fa-envelope fa-fw'></span>
											<span style='line-height: 1.6em'>Contact</span>
										</div>
									</div>
								</div>

								<div class='social-btns'>
									<div style="font-size: 1.5em;">
										<div id='help-links-github' class='text-btn qtip-left' style="width: 90%;border:none;" title='Report problem'>
											<span class='fa fa-exclamation fa-fw'></span>
											<span style='line-height: 1.6em'>Report problem</span>
										</div>
									</div>
								</div>

								<br />


							</div>
						</div>
					</div>
				</div>

			</div>
		</div>

		<div id="hv-drawer-tab-timeline" class="drawer-tab drawer-tab-bottom">Image Timeline</div>
		<div id="hv-drawer-timeline" class="helioviewer-drawer-bottom">
			<div class="drawer-contents" style="height:350px;">
				<div id="hv-drawer-timeline-logarithmic-holder" style="display:block;position:absolute;top:10px;left:10px;z-index:5;"><input aria-labelledby="hv-drawer-timeline-logarithmic-holder" type="checkbox" id="hv-drawer-timeline-logarithmic"> Logarithmic View</div>
				<div class="drawer-items">
					<div id="data-coverage-timeline" style="width:100%;height:315px;"></div>
					<button id="btn-prev" aria-label="Previous button">&larr; 7 days</button>
					<div id="btn-center" class="viewport-action fa fa-crosshairs qtip-topleft" title="Center Timeline at Observation Date"></div>
					<div id="btn-zoom-out" class="viewport-action fa fa-search-minus qtip-topleft" title="Zoom Out Timeline"></div>
					<div id="btn-zoom-in" class="viewport-action fa fa-search-plus qtip-topleft" title="Zoom In Timeline"></div>
					<button id="btn-next" aria-label="Next button">7 days &rarr;</button>
				</div>
			</div>
		</div>

		<div id="hv-drawer-tab-timeline-events" class="drawer-tab drawer-tab-bottom">Events Timeline</div>
		<div id="hv-drawer-timeline-events" class="helioviewer-drawer-bottom">
			<div class="drawer-contents" style="height:350px;">
				<div id="hv-drawer-timeline-events-logarithmic-holder" style="display:none;position:absolute;top:10px;left:10px;z-index:5;"><input aria-labelledby="hv-drawer-timeline-events-logarithmic-holder" type="checkbox" id="hv-drawer-timeline-events-logarithmic"> Logarithmic View</div>
				<div class="drawer-items">
					<div id="data-coverage-timeline-events" style="width:100%;height:315px;"></div>
					<button id="timeline-events-btn-prev" aria-label="Timeline previous button">&larr; 7 days</button>
					<div id="timeline-events-btn-center" class="viewport-action fa fa-crosshairs qtip-topleft" title="Center Timeline at Observation Date"></div>
					<div id="timeline-events-btn-zoom-out" class="viewport-action fa fa-search-minus qtip-topleft" title="Zoom Out Timeline"></div>
					<div id="timeline-events-btn-zoom-in" class="viewport-action fa fa-search-plus qtip-topleft" title="Zoom In Timeline"></div>
					<button id="timeline-events-btn-next" aria-label="Timeline next button">7 days &rarr;</button>
				</div>
			</div>
		</div>

		<!-- Glossary dialog -->
		<div id='glossary-dialog'></div>

		<!-- About dialog -->
		<div id='about-dialog'></div>

		<!-- Mouse coordinates dialog -->
		<div id='mouse-coords-dialog' class="dialog"></div>

		<!-- Layer choice dialog -->
		<div id='layer-choice-dialog'></div>

		<!-- Settings dialog -->
		<div id='settings-dialog'>
			<form id='helioviewer-settings'>
				<!-- Initial observation date -->
				<fieldset id='helioviewer-settings-date'>
				<legend>When starting Helioviewer:</legend>
					<div style='padding: 10px;'>
						<input id="settings-date-latest" type="radio" name="date" value="latest" /><label for="settings-date-latest">Display most recent images available</label><br />
						<input id="settings-date-previous" type="radio" name="date" value="last-used" /><label for="settings-date-previous">Display images from previous visit</label><br />
					</div>
				</fieldset>

				<br />

				<!-- Other -->
				<fieldset id='helioviewer-settings-other'>
				<legend>While using Helioviewer:</legend>
				<div style='padding:10px;'>
					<input type="checkbox" name="latest-image-option" id="settings-latest-image" value="true" />
					<label for="settings-latest-image">Refresh with the latest data every 5 minutes</label><br />

					<input type="checkbox" name="movie-play-automatic-option" id="settings-movie-play-automatic" value="true" />
					<label for="settings-movie-play-automatic">Automatically play generated movies</label><br />

					<label for='settings-movie-duration' >Default movie duration</label>
					<select id='settings-movie-duration' name='settings-movie-duration'>
						<option value='3600'>1 hour</option>
						<option value='10800'>3 hours</option>
						<option value='21600'>6 hours</option>
						<option value='43200'>12 hours</option>
						<option value='86400'>1 day</option>
						<option value='172800'>2 days</option>
						<option value='604800'>1 week</option>
						<option value='2419200'>28 days</option>
					</select>
					<br/>

					<label id="js-zoom-label" for='js-zoom-type' class="jq-tooltip" title="Continuous zoom will smoothly zoom in and out while step zoom will leap between preprogrammed scales.">Zoom Type</label>
					<select id='js-zoom-type' title="test" name='js-zoom-type'>
						<option value='continuous'>continuous</option>
						<option value='step'>step</option>
					</select>
					<br/>

					<label id='js-focus-label' for='js-zoom-focus' class="jq-tooltip" title="Focus on mouse will make zoom operations zoom in on the mouse pointer. Focus on center will make zoom operations zoom in to the center of the viewport." >Zoom Focus</label>
					<select id='js-zoom-focus' name='js-zoom-focus'>
						<option value='cursor'>Focus on mouse</option>
						<option value='center'>Focus on center</option>
					</select>
				</div>
				</fieldset>
			</form>
			<br>
			<a href="https://security.google.com/settings/security/permissions" target="_blank" style="font-weight:bold;">Revoke YouTube API Access for Helioviewer.org</a> <br/>
		</div>

		<!-- Usage Dialog -->
		<div id='usage-dialog'></div>

		<!-- URL Dialog -->
		<div id='url-dialog' style="display:none;">
			<div id="helioviewer-url-box">
				<span id="helioviewer-share-modal-msg"></span>
				<form style="margin-top: 5px;">
					<input aria-label="Movie URL" type="text" id="helioviewer-share-modal-url" style="width:98%;" value="https://helioviewer.org" readonly/>
				</form>
			</div>
		</div>

		<!-- Video Upload Dialog -->
		<div id='upload-dialog' style="display: none">
			<!-- Loading indicator -->
			<div id='youtube-auth-loading-indicator' style='display: none;'>
				<div id='youtube-auth-spinner'></div>
				<span style='font-size: 28px;'>Processing</span>
			</div>

			<!-- Upload Form -->
			<div id='upload-form'>
				<div>
					<img id='youtube-logo-large' src="/resources/images/yt_logo_rgb_dark.png" alt='YouTube logo'/>
				</div>
				<br><br><br>
				<div><h1>Upload Video</h1></div>
				<form id="youtube-video-info" action="/index.php" method="post">
					<!-- Title -->
					<label for="youtube-title">Title:</label>
					<input id="youtube-title" type="text" name="title" maxlength="100" />
					<br />

					<!-- Description -->
					<label for="youtube-desc">Description:</label>
					<textarea id="youtube-desc" type="text" rows="5" cols="45" name="description" maxlength="5000"></textarea>
					<br />

					<!-- Tags -->
					<label for="youtube-tags">Tags:</label>
					<input id="youtube-tags" type="text" name="tags" maxlength="500" value="" />
					<br /><br />

					<!-- Sharing -->
					<div style='float: right; margin-right: 30px;'>
					<label style='width: 100%; margin: 0px;'>
						<input type="checkbox" name="share" value="true" checked="checked" style='width: 15px; float: right; margin: 2px 2px 0 4px;'/>Share my video with other Helioviewer.org users:
					</label>
					<br />
					<input id='youtube-submit-btn' type="submit" value="Submit" />
					</div>

					<!-- Hidden fields -->
					<input id="youtube-movie-id" type="hidden" name="id" value="" />
				</form>
				<br><br><br><br>
				<div id="about-credits" style="width:100%; text-align:center;">
					<span style="margin-left:auto; margin-right: auto;">
						<span style="font-weight:bold;">YouTube API Client Acknowledgements:</span>
						<br />
						<a href="https://www.youtube.com/terms" target="_blank">YouTube Terms of Service (ToS)</a> <br/>
						<a href="https://policies.google.com/privacy" target="_blank">Google Privacy Policy</a> <br/>
						<a href="https://security.google.com/settings/security/permissions" target="_blank">Revoke YouTube API Access for Helioviewer.org</a> <br/>
					</span>
				</div>
				<div id='upload-error-console-container'><div id='upload-error-console'>...</div></div>
			</div>
		</div>
		<?php } else if($outputType == 'minimal'){ ?>
			<div id="loading">
				<span>
					<span>Loading Data</span>
					<span class="fa fa-circle-o-notch fa-spin"></span>
				</span>
			</div>
			<div id="k12-scale" class="" style="display: flex;">
					<div id="scale" class="" style="position: fixed; left: 3.5em;">

						<div id="earth-button" class="viewport-action segmented-left fa fa-globe qtip-topright" title="Toggle Earth-Scale Indicator."></div><div id="scalebar-button" class="viewport-action segmented-right fa fa-arrows-h qtip-topright" style="border-left: 0;" title="Toggle Length scale indicator."></div>

					</div>


					<div>
			<!--<div id="youtube-button" class="fa fa-youtube fa-fw qtip-left social-button" title="View Helioviewer Movies Shared to YouTube."></div>-->
			<div id="movies-button" class="fa fa-file-video-o fa-fw qtip-left social-button" title="Create a Helioviewer Movie."></div>
			<div id="screenshots-button" class="fa fa-file-picture-o fa-fw qtip-left social-button" title="Download a screenshot of the current Helioviewer Viewport."></div>
						<a id= "help-anchor" target="_blank" href="https://helioviewer.org"><div id="help-button" class="fa fa-question fa-fw qtip-left social-button" title="Get Help with Helioviewer."></div></a>
					</div>
			</div>

			<div id="zoom">
				<!--  Zoom Controls -->
				<div id="zoomControls">
					<div id="center-button" class="viewport-action fa fa-crosshairs" title="Center the Sun in the Viewport"></div>
					<div id="zoom-in-button" title="Zoom in.">
						<img src="/resources/images/ftedit-add.svg" style="width:80%; height:80%" alt="HV project transparent image"/>
					</div>
					<div id="zoomSliderContainer">
						<div id="zoomControlSlider"></div>
					</div>
					<div id="zoom-out-button" class="qtip-topright" title="Zoom out.">-</div>
				</div>
			</div>

			<div class="hv-drawer-right user-select-none hv-drawer-date">
				<div class="drawer-contents" style="display: block;">
					<div id="k12-accordion-date" class="accordion">
						<!--<div class="header">
							<div class="disclosure-triangle-alway-open opened">►</div>
							<h1>Observation Date</h1>
							<div class="right fa fa-question-circle contextual-help" style="margin-right: 15px;" title="
								Changing the 'Observation Date' will update the Viewport with data matching the new date and time.<br /><br />

								Use the 'Jump' controls to browse forward and backward in time by a regular interval.<br /><br />

								Note that when an image is not available for the exact date and time you selected, the closest available match will be displayed instead.<br />
							">
							</div>
						</div>-->
						<div class="content" style="display:block;">
							<div id='date-manager-container' class='date-manager-container'>
								<div class="section">
									<div id="observation-controls" class="row">
										<div id="date-input-label" class="label" style="margin-top: 0.1em">Date</div>
										<div class="field">
											<input aria-labelledby="date-input-label" type="text" id="date" name="date" value="" pattern="[\d]{4}/[\d]{2}/[\d]{2}" maxlength="10" class="datepicker hasDatepicker"/>
											<input aria-label="Time" id="time" name="time" value="" type="text" maxlength="8" pattern="[\d]{2}:[\d]{2}:[\d]{2}" class="timepicker"/>
											<div class="suffix" data-tip-pisition="right" title="Coordinated Universal Time">UTC </div>

										</div>
									</div>
									<div class="row">
										<div id="time-step-label" class="label">Time Step</div>
										<div class="field">
											<select aria-labelledby="time-step-label" id="timestep-select" name="time-step"></select>
											<div id="timeBackBtn" class="inline fa fa-arrow-circle-left" style="font-size: 1.5em;" title="Jump Backward in Time."></div>
											<div id="timeForwardBtn" class="inline fa fa-arrow-circle-right" style="font-size: 1.5em;" title="Jump Forward in Time."></div>
											<div id="timeNowBtn" class="inline fa fa-clock-o right k12-timeNowBtn" style="font-size: 1em;" title="Jump to the most recent available image's for the currently loaded layer(s).">
												<span class="ui-icon-label">NEWEST</span>
										</div>
										</div>
									</div>
									<div class="row">
										<div id="observation-label" class="label" style="margin-top:0.4em;">Make an Observation</div>
										<div id="image-layer-select-container" class="field" style="margin-top:0.95em; padding-bottom:0.5em;">
											<select aria-labelledby="observation-label" id="image-layer-select" name="image-select-layers" style="width:18.5em;">
												<option value="0" class="image-layer-switch" data-id="0" data-name="NOAA flares and active regions" data-date="" data-layers="[SDO,AIA,171,1,100,0,60,1,2017-11-16T09:02:20.000Z]" data-events="[AR,NOAA_SWPC_Observer,1],[FL,SWPC,1]">Flares and Active Regions</option>
												<option value="1" class="image-layer-switch" data-id="1" data-name="Eruption Monitor" data-date="" data-layers="[SDO,AIA,304,1,100,0,60,1,2017-11-16T09:02:20.000Z],[SOHO,LASCO,C2,white-light,1,100,0,60,1,2017-05-18T15:35:00.000Z],[SOHO,LASCO,C3,white-light,1,100,0,60,1,2017-05-18T15:35:00.000Z]" data-events="[CE,all,1],[ER,all,1],[FI,all,1],[FA,all,1],[FE,all,1]">Eruptions and CMEs</option>
												<option value="2" class="image-layer-switch" data-id="2" data-name="Magnetic flux Monitor" data-date="" data-layers="[SDO,HMI,magnetogram,1,100,0,60,1,2017-11-16T09:02:20.000Z]" data-events="[EF,all,1]">Magnetic Field</option>
												<option value="3" class="image-layer-switch" data-id="3" data-name="Coronal hole Monitor" data-date="" data-layers="[SDO,AIA,211,1,100,0,60,1,2017-11-16T09:02:20.000Z]" data-events="[CH,all,1]">Coronal Holes</option>
												<option value="4" class="image-layer-switch" data-id="4" data-name="Sunspots" data-date="" data-layers="[SDO,HMI,continuum,1,100,0,60,1,2017-11-16T09:02:20.000Z]" data-events="[SS,all,1]">Sunspots</option>
											</select>
											</div>
										<div class="clear clearfix" style="display:block;clear:both;"></div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div id="hv-drawer-movies" class="hv-drawer-right user-select-none">
				<div class="drawer-contents">

					<div id="accordion-movies" class="accordion">
						<div class="header">
							<div class="disclosure-triangle-alway-open opened">►</div>
							<h1>Make a Movie</h1>
							<div class="right fa fa-question-circle contextual-help qtip-left" title="Make a movie from what you currently see on your screen."></div>
						</div>
						<div class="content" style="display:block;">
							<div class="section">

								<!-- Movie Manager -->
								<div id='movie-manager-container' class='media-manager-container'>
									<div id='movie-manager-build-btns' class='media-manager-build-btns'>
										<div style="width: 70%; margin: 0 auto;">
											<div id='movie-manager-full-viewport' class='text-btn qtip-left' title='Create a movie using the entire viewport.'>
												<span class='fa fa-arrows-alt fa-fw'></span>
												<span style='line-height: 1.6em'>Full Screen</span>
											</div>
											<div id='movie-manager-select-area' class='text-btn qtip-left' style='float:right;' title='Create a movie of a sub-region of the viewport.'>
												<span class='fa fa-crop fa-fw'></span>
												<span style='line-height: 1.6em'>Select Area</span>
											</div>
										</div>
									</div>
									<div id='movie-history-title'>
										Movie History:
										<div id='movie-clear-history-button' class='text-btn qtip-left' style='float:right;' title='Remove all movies from the history.'>
											<span style='font-weight: 200;'>clear history</span>
											<span class='fa fa-trash-o'></span>
										</div>
									</div>
									<div id='movie-history'></div>
								</div>

								<!-- Movie Settings -->
								<div id='movie-settings-container' class='media-manager-container'>
									<b>Movie Settings:</b>

									<div id='movie-settings-btns' style='float:right;'>
										<span id='movie-settings-toggle-help' style='display:inline-block;' class='fa fa-help qtip-left' title='Movie settings help'></span>
									</div>

									<!-- Begin movie settings -->
									<div id='movie-settings-form-container'>
									<form id='movie-settings-form'>

									<!-- Advanced movie settings -->
									<div id='movie-settings-advanced'>

										<!-- Movie duration -->
										<fieldset style='padding: 0px; margin: 5px 0px 8px' class="movie-duration-box">
											<label for='movie-duration' style='width: 60px; font-style: italic;'>Duration</label>
											<select id='movie-duration' name='movie-duration'>
												<option value='3600'>1 hour</option>
												<option value='10800'>3 hours</option>
												<option value='21600'>6 hours</option>
												<option value='43200'>12 hours</option>
												<option value='86400'>1 day</option>
												<option value='172800'>2 days</option>
												<option value='604800'>1 week</option>
												<option value='2419200'>28 days</option>
											</select>
										</fieldset>

										<!-- Movie Start/End Time -->
										<fieldset style='padding: 0px; margin: 5px 0px 8px' class="movie-time-box">
											<label for='movie-start-date' style='width: 55px; font-style: italic;'>Start </label>
											<input type="text" id="movie-start-date" name="movie-start-date" value="" pattern="[\d]{4}/[\d]{2}/[\d]{2}" maxlength="10" class="hasDatepicker"/>
											<input aria-label="Time" id="movie-start-time" name="movie-start-time" value="" type="text" maxlength="8" pattern="[\d]{2}:[\d]{2}:[\d]{2}"/> UTC<br/>

											<label for='movie-end-date' style='width: 55px; font-style: italic;'>End </label>
											<input type="text" id="movie-end-date" name="movie-end-date" value="" pattern="[\d]{4}/[\d]{2}/[\d]{2}" maxlength="10" class="hasDatepicker"/>
											<input aria-label="Time" id="movie-end-time" name="movie-end-time" value="" type="text" maxlength="8" pattern="[\d]{2}:[\d]{2}:[\d]{2}"/> UTC<br/>
										</fieldset>

										<!-- Movie Speed -->
										<fieldset id='movie-settings-speed' style='padding: 15px 0px 10px 0px; margin: 5px 0px 8px;'>
											<!--<div style='padding: 0px; margin: 5px 0px 8px;'>
												<input type="radio" name="speed-method" id="speed-method-f" value="framerate" checked="checked" />
												<label for="speed-method-f" style='width: 62px;'>Frames/Sec</label>
												<input id='frame-rate' maxlength='2' size='3' type="text" name="framerate" min="1" max="30" value="15" pattern='^(0?[1-9]|[1-2][0-9]|30)$' />(1-30)<br />
												-->
												<input type="hidden" name="speed-method" id="speed-method-l" value="length" checked="checked" />
												<label id="for-speed-method-l-label" for="speed-method-l" style='width: 55px; font-style: italic;'>Length (s)</label>
												<input aria-labelledby="for-speed-method-l-label" id='movie-length' maxlength='3' size='3' type="text" name="movie-length" min="5" max="300" value="20" pattern='^(0{0,2}[5-9]|0?[1-9][0-9]|100)$'  />(10-100)<br />

										</fieldset>

										<!-- Movie Start/End Time -->
										<fieldset style='padding: 0px 0px 10px 0px; margin: 5px 0px 8px; display: -ms-flexbox; display: flex;' class="movie-format-box">
											<label for='movie-size' style='width: 40px; font-style: italic;'>Size</label>
											<h2 style="position: relative; top:5px; left: 21px">720p (1280 x 720)</h2>
											<!--<select id='movie-size' name='movie-size' style="width:190px;" disabled='disabled'>-->
												<!--<option value='0' selected="selected">Original</option>-->
												<!--<option value='1' selected="selected">720p (1280 x 720)</option>-->
												<!--<option value='2'>1080p (1920 x 1080, Full HD)</option>
												<option value='3'>1440p (2560 x 1440, Quad HD)</option>
												<option value='4'>2160p (3840 x 2160, 4K or Ultra HD)</option>-->
											<!--</select>-->
											<input type='hidden' id='movie-size' name='movie-size' value='1' selected="selected" />
										</fieldset>

										<!-- Display Shared YouTube movies
										<fieldset style='padding: 0px; margin: 5px 0px 8px;' class="movie-icon-box">
											<input type="checkbox" name="movie-icons" id="movie-icons" value="1" />
											<label for='movie-icons' style='width: 200px; font-style: italic;'>Display YouTube movies icons</label>
										</fieldset>
										-->

										<!-- Rotate field of view of movie with Sun
										<fieldset style='padding: 0px; margin: 5px 0px 8px;' class="movie-follow-viewport-box">
											<input type="checkbox" name="follow-viewport" id="follow-viewport" value="1"/>
											<label for='follow-viewport' style='width: 200px; font-style: italic;'>Rotate field of view of movie with Sun</label>
										</fieldset>
										-->

									</div>

									<!-- Movie request submit button -->
									<div id='movie-settings-submit'>
										<a href="#" class="movie-settings-more-btn" style="float:left;margin-top:17px;text-decoration: underline;">Advanced Settings</a>
										<a href="#" class="movie-settings-less-btn" style="float:left;margin-top:17px;text-decoration: underline;">Less Settings</a>
										<input type="button" id='movie-settings-cancel-btn' value="Cancel" />
										<input type="submit" id='movie-settings-submit-btn' value="Ok" />
									</div>

									</form>
									</div>

									<!-- Movie settings help -->
									<div id='movie-settings-help' style='display:none'>
										<b>Duration</b><br /><br />
										<p>The duration of time that the movie should span, centered about your current observation time.</p><br />

										<b>Speed</b><br /><br />
										<p>Movie speed can be controlled by specifying a length in seconds.</p><br />
									</div>

									<!-- Movie settings validation console -->
									<div id='movie-settings-validation-console' style='display:none; text-align: center; margin: 7px 1px 0px; padding: 0.5em; border: 1px solid #fa5f4d; color: #333; background: #fa8072;' class='ui-corner-all'>

									</div>
								</div>

							</div>
						</div>
					</div>

				</div>
			</div>


			<div id="hv-drawer-screenshots" class="hv-drawer-right user-select-none">
				<div class="drawer-contents">

					<div id="accordion-screenshots" class="accordion">
						<div class="header">
							<div class="disclosure-triangle-alway-open opened">►</div>
							<h1>Take a Picture</h1>
							<div class="right fa fa-question-circle contextual-help qtip-left" title="Download a custom screenshot matching the state of your Helioviewer session, minus the user-interface."></div>
						</div>
						<div class="content" style="display:block;">

							<!-- Screenshot Manager -->
							<div id='screenshot-manager-container' class='media-manager-container'>

								<div class="section">
									<div id='screenshot-manager-build-btns' class='media-manager-build-btns'>
										<div style="width: 70%; margin: 0 auto;">
											<div id='screenshot-manager-full-viewport' class='text-btn qtip-left' title='Take a picture using the entire screen.'>
												<span class='fa fa-arrows-alt fa-fw'></span>
												<span style='line-height: 1.6em'>Full Screen</span>
											</div>
											<div id='screenshot-manager-select-area' class='text-btn qtip-left' style='float:right;' title='Take a picture of a sub-region of the screen.'>
												<span class='fa fa-crop fa-fw'></span>
												<span style='line-height: 1.6em'>Select Area</span>
											</div>
										</div>
									</div>

									<div id='screenshot-history-title'>
										Picture History:
										<div id='screenshot-clear-history-button' class='text-btn qtip-left' style='float:right;' title='Remove all pictures from the history.'>
											<span style='font-weight: 200;'>clear history</span>
											<span class='fa fa-trash-o'></span>
										</div>
									</div>
									<div id='screenshot-history'></div>
								</div>

							</div>

						</div>
					</div>

				</div>
			</div>


		<?php } else { ?>
			<div id="zoom" style="width:70px;height:400px;">
				<!--  Zoom Controls -->
				<div id="zoomControls">
					<div id="center-button" class="viewport-action fa fa-crosshairs" title="Center the Sun in the Viewport"></div>
					<div id="zoom-in-button" title="Zoom in.">
						<img src="/resources/images/ftedit-add.svg" style="width:80%; height:80%" alt="HV project transparent image"/>
					</div>
					<div id="zoomSliderContainer">
						<div id="zoomControlSlider"></div>
					</div>
					<div id="zoom-out-button" title="Zoom out.">-</div>
				</div>
			</div>
		<?php } ?>
	</div>


	<!-- Viewport -->
	<div id="helioviewer-viewport-container-outer" class="user-select-none">
		<div id="helioviewer-viewport-container-inner">
			<div id="helioviewer-viewport">
                <!-- START mobile touchscreen viewport div -->
                <div id="toptouchlayer" style=""></div>
                 <!-- END mobile touchscreen viewport div -->

				<!-- Movement sandbox -->
				<div id="sandbox" style="position: absolute;">
					<div id="moving-container"></div>
				</div>

				<!-- Message console -->
				<div id="message-console"></div>

				<!-- Image area select boundary container -->
				<div id="image-area-select-container"></div>
			</div>
		</div>
	</div>

	<!-- Library JavaScript -->
	<script src="/resources/lib/jquery/jquery-3.6.0.min.js" type="text/javascript"></script>
	<script src="/resources/lib/jquery-ui-1.13.1/jquery-ui.min.js" type="text/javascript"></script>
	<script src="/resources/lib/jquery-ui-touch-punch/jquery.ui.touch-punch.js" type="text/javascript"></script>
	<script src="/resources/lib/jquery.class/jquery.class.min.js" type="text/javascript"></script>
	<script src="/resources/lib/jquery.mousewheel/jquery.mousewheel.3.1.13.min.js" type="text/javascript"></script>
	<script src="/resources/lib/jquery.browser/dist/jquery.browser.min.js" type="text/javascript" language="javascript"></script>
	<script src="/resources/lib/jquery.qTip3/jquery.qtip.min.js" type="text/javascript"></script>
	<script src="/resources/lib/jquery-number-master/jquery.number.min.js" type="text/javascript"></script>
	<script src="/resources/lib/jquery.json-2.3/jquery.json-2.3.min.js" type="text/javascript" ></script>
	<script src="/resources/lib/jquery.cookie/jquery.cookie.min.js" type="text/javascript" ></script>
	<script src="/resources/lib/Cookiejar/jquery.cookiejar.pack.js" type="text/javascript"></script>
	<script src="/resources/lib/Highstock-4.2.1/js/highstock.js" type="text/javascript"></script>
	<script src="/resources/lib/Highstock-4.2.1/js/highcharts-more.js" type="text/javascript"></script>
	<script src="/resources/lib/custom_events-master/customEvents.js" type="text/javascript"></script>
	<script src="/resources/lib/jquery.jgrowl/jquery.jgrowl.min.js" type="text/javascript"></script>
	<script src="/resources/lib/jquery.imgareaselect-0.9.8/scripts/jquery.imgareaselect.pack.js" type="text/javascript"></script>
	<script src="/resources/lib/jquery.xml2json/jquery.xml2json.pack.js" type="text/javascript" language="javascript"></script>
	<script src="/resources/lib/jquery.jsTree-1.0rc/jquery.jstree.js"></script>
	<script src="/resources/lib/DatetimePicker/build/jquery.datetimepicker.full.js" type="text/javascript" language="javascript"></script>
	<script <?=attr('src', "resources/lib/flatpickr/flatpickr.min.js");?> type="text/javascript" language="javascript"></script>
	<script src="/resources/lib/boneVojage/jquery.bonevojage.js" type="text/javascript" language="javascript"></script>
	<script src="/resources/lib/mediaelement/build/mediaelement-and-player.min.js" type="text/javascript" language="javascript"></script>

	<script src="/resources/js/dist/HelioviewerModules.js?v=<?=filemtime('resources/js/dist/HelioviewerModules.js')?>" type="text/javascript"></script>

	<?php
	if ($debug){
	?>
		<script src="/resources/js/Utility/Config.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Utility/HelperFunctions.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Utility/LayerImgDates.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Utility/ClosestImages.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Tiling/Layer/Layer.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Tiling/Layer/TileLoader.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Tiling/Layer/TileLayer.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Tiling/Layer/HelioviewerTileLayer.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Utility/KeyboardManager.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Tiling/Manager/LayerManager.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Tiling/Manager/TileLayerManager.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Tiling/Manager/HelioviewerTileLayerManager.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Image/JP2Image.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/UI/ZoomControls.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Viewport/Helper/ScrollZoom.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Viewport/Helper/PinchDetector.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Viewport/Helper/HelioviewerZoomer.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Viewport/Helper/TouchMover.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Viewport/Helper/MouseCoordinates.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Viewport/Helper/HelioviewerMouseCoordinates.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Viewport/Helper/SandboxHelper.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Viewport/Helper/ViewportMovementHelper.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Viewport/HelioviewerViewport.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/HelioviewerClient.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/UI/ImageScale.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/UI/Timeline.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/UI/TimelineEvents.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/UI/TimeSelector.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Utility/InputValidator.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Utility/SettingsLoader.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Utility/UserSettings.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Utility/Tutorial.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Tiling/Manager/LayerManager.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Events/SelectedEventsCache.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Events/EventManager.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Events/EventType.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Events/EventTree.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Events/EventFeatureRecognitionMethod.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Events/EventLayerManager.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Events/EventLayerManager.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Events/HelioviewerEventLayer.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Events/HelioviewerEventLayerManager.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/UI/TreeSelect.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/UI/ImageSelectTool.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Media/MediaManager.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Media/MovieManager.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Media/ScreenshotManager.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/UI/TileLayerAccordion.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/UI/EventLayerAccordion.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/UI/MessageConsole.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/UI/TimeControls.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Utility/FullscreenControl.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/HelioviewerWebClient.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/UI/UserVideoGallery.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/UI/Glossary.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/UI/jquery.ui.dynaccordion.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/UI/ImagePresets.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/UI/TileLayerData.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Viewport/CelestialBodiesSatellites.js?v=<?=$debugTime?>" type="text/javascript"></script>
		<script src="/resources/js/Patches/broken_screenshots_493.js?v=<?=$debugTime?>" type="text/javascript"></script>
	<?php
	} else {
	?>
	<!-- Helioviewer JavaScript -->
		<script src="/resources/compressed/helioviewer.min.js?v=<?=filemtime('resources/compressed/helioviewer.min.js')?>" type="text/javascript"></script>
	<?php
	}
	?>

<?php
if(isset($_SERVER['HTTP_USER_AGENT'])) {
	if(strpos($_SERVER['HTTP_USER_AGENT'],'Phone')|strpos($_SERVER['HTTP_USER_AGENT'],'Android')|strpos($_SERVER['HTTP_USER_AGENT'],'iPad')) {
	$hvmobjsfiles= <<<MJF
	<!-- START responsive JS files -->
	<script src='/resources/lib/responsive/zeynep1.js'></script>
	<script src="/resources/lib/responsive/interact.min.js"></script>
	<script src="/resources/lib/responsive/responsive_hv.js"></script>
	<!-- END responsive JS files -->
	MJF;
	echo $hvmobjsfiles;
	}
}
?>

	<script src="/resources/js/CustomHandling/CustomHandling.js?chrndnm=<?php echo (rand(9999,9999999)); ?>" type="text/javascript"></script>

	<!-- Launch Helioviewer -->
	<script type="text/javascript">

		var serverSettings, settingsJSON, urlSettings, debug, scrollLock = false, embedView = false;
		<?php if($outputType){ ?>
		embedView = true;
		<?php } ?>
		function getUrlParameters() {

			let sPageURL = decodeURIComponent(decodeURIComponent(window.location.search.substring(1)));
			let sURLVariables = sPageURL.split('&');
			let sParameterName;
			let i;
			let data = {};

			data['eventLabels'] = true;
			data['imageLayers'] = '';
			data['eventLayers'] = '';

			for (i = 0; i < sURLVariables.length; i++) {
				sParameterName = sURLVariables[i].split('=');

				if (sParameterName[0] === 'imageScale') {
					data['imageScale'] = parseFloat(sParameterName[1]);
				}else if (sParameterName[0] === 'centerX') {
					data['centerX'] = parseFloat(sParameterName[1]);
				}else if (sParameterName[0] === 'centerY') {
					data['centerY'] = parseFloat(sParameterName[1]);
				}else if (sParameterName[0] === 'imageLayers') {
					// Process imageLayers separately if set
					if (sParameterName[1] != '') {
						if (sParameterName[1][0] == '[') {
							var str = sParameterName[1];
							var imageLayersString = str.slice(1, -1);
						} else {
							var imageLayersString = sParameterName[1];
						}
						data['imageLayers'] = imageLayersString.split("],[");
					}
					else {
						data['imageLayers'] = '';
					}
				}else if (sParameterName[0] === 'eventLayers') {
					//Process eventLayers separately if set
					if (sParameterName[1] != '') {
						if (sParameterName[1][0] == '[') {
							var str = sParameterName[1];
							var imageLayersString = str.slice(1, -1);
						} else {
							var imageLayersString = sParameterName[1];
						}
						data['eventLayers'] = imageLayersString.split("],[");
					}
					else {
						data['eventLayers'] = '';
					}
				}else if (sParameterName[0] === 'eventLabels') {
					if ( typeof sParameterName[1] != 'undefined' && (sParameterName[1] == false  || sParameterName[1] == 'false' ) ) {
						data['eventLabels'] = false;
					}
				}else if (sParameterName[0] === 'debug') {
					data['debug'] = true;
				}else if (sParameterName[0] === 'celestialBodies'){
					// Process Celestial bodies labels seperately if set
					if(sParameterName[1] != '') {
						data['celestialBodiesChecked'] = sParameterName[1];
					}
				}else{
					if(sParameterName[0] != ''){
						data[sParameterName[0]] = sParameterName[1];
					}
				}
			}
			return data;
		};

		var Helioviewer = {}; // Helioviewer global namespace

		$( document ).ready(function(){

			// Disable jquery animations,
			// We don't need any animations
			jQuery.fx.off = true

			settingsJSON = {};

			serverSettings = new Config(settingsJSON).toArray();

			zoomLevels = [0.30255511, 0.60511022,1.21022044,2.42044088,4.84088176,9.68176352,19.36352704,38.72705408,77.45410816,154.90821632];

			urlSettings = getUrlParameters();

			// Set global configurations
			Helioviewer.serverSettings = serverSettings;
			Helioviewer.urlSettings = urlSettings;
			Helioviewer.api = serverSettings['backEnd'];
			Helioviewer.dataType = "json";
			Helioviewer.root = serverSettings['rootURL'];
			Helioviewer.messageConsole = new MessageConsole();
			Helioviewer.outputType = "<?php echo $outputType; ?>";
			Helioviewer.debug = <?php echo $debug ? 'true' : 'false'; ?>;


			const loadHelioviewer = (userSettings) => {

				Helioviewer.userSettings = userSettings;

				// Initialize Helioviewer.org
				helioviewerWebClient = new HelioviewerWebClient(zoomLevels);

				// Play movie if id is specified
				if (urlSettings.movieId) {
					helioviewerWebClient.loadMovie(urlSettings.movieId);
				}

				$(document).trigger("helioviewer-ready", [true]);

			};

			// Either load state from backend or use regular flow to load it
			SettingsLoader.loadSettings(urlSettings, serverSettings).then(loadHelioviewer, (userSettings) => {
				Helioviewer.messageConsole.warn("Could not load Helioviewer via shared URL");
				loadHelioviewer(userSettings);
			});
		});
	</script>

	<?php
		if($outputType=='embed' && (!isset($_GET['hideWatermark']) || $_GET['hideWatermark'] != 'true')){
			$link = sprintf("http://%s%s", $_SERVER['HTTP_HOST'], str_replace("output=embed", "", $_SERVER['REQUEST_URI']));
			echo '<a href="'.$link.'" target="_blank"><div id="watermark" style="width: 140px; height: 35px; display: block;"></div></a>';
		}
	?>
</body>
</html>
