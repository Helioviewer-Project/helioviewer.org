<?php
	if (isset($_GET['action'])) {
		require_once("lib/helioviewer/API.php");
		new API($_GET);
	} else {
?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
	<head>
		<title>Helioviewer.org API</title>
		<link rel="shortcut icon" href="../favicon.ico">
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
		<meta http-equiv="Cache-Control" content="No-Cache">
		<meta name="author" content="Keith Hughitt">
		<meta name="description" content="Helioviewer - Solar and heliospheric image visualization tool">
		<meta name="keywords" content="Helioviewer, hv, solar image viewer, sun, solar, heliosphere, solar physics, viewer, visualization, space, astronomy, API">
		<style type="text/css">
			body {font-size: 0.85em;}
			
			.toc {
				background-color: #E3EFFF;
				color: #111;
				border: 1px solid black;
				width: 250px;
				height: 404.508497px;
				margin-left:30px;
			}
			
			a {
				text-decoration: none;
				color: #111;			
			}
			
			a:hover {
				text-decoration: underline;
				color: #d9759d;			
			}
			
			ol > li, ul > li {margin: 5px 0px 5px 0px;}
		
			div.content {
				color: #000;
				width: 90%;
				height: 100%;
				margin-left:30px;
				padding: 10px;
			}
			
			div.content > div { width: 90%; }
			
			div.content > div > p { margin-left: 20px; text-indent: 20px; font-family: verdana, sans-serif }
			div > p:first-letter {color:#3366FF; font-size:large;}
			
			div.summary-box {
				width: 60%;
				margin-left: 40px;
				background-color: #f0f1f2;
				color: #000;
				border: 1px solid black;
				padding: 10px;
			}
			
			span.example-header {display: block; color: #3366FF}
			span.example-url    {display: block; margin-left: 20px; font-size: 12px;}
			span.example-url > a {color: #3399ff;}
			
			table.param-list {border: none; margin-left: 10px;}
			
		</style>
	</head>
	
	<body>
		<img alt="Helioviewer.org Logo" src="../images/logo/about.png"/ style="float:left;">
		<h1 style="position:relative; top:22px;">API</h1><br>
		
		<!-- Table of contents -->
		<div class='toc'>
			<ol>
				<li><a href="index.html#Overview">Overview</a></li>
				<li><a href="index.html#CustomView">Loading a Custom View</a></li>
				<li><a href="index.html#ImageAPI">Image API</a>
					<ul>
						<li>Image id</li>
						<li>Tiles</li>
					</ul>
				</li>
				<li><a href="index.html#FeatureEventAPI">Feature/Event API</a>
					<ul>
						<li><a href="index.html#Catalogs">Catalogs</a></li>
						<li><a href="index.html#CatalogEntries">Catalog Entries</a></li>
					</ul>
				</li>
				<li><a href="index.html#JPEG2000API">JPEG-2000 API</a>
					<ul>
						<li><a href="index.html#JP2">Image API</a></li>
						<li><a href="index.html#JP2SERIES">Image Series API</a></li>
					</ul>
				</li>
				<li><a href="index.html#MovieAPI">Movie API</a></li>
				<li>
					<a href="index.html#Appendices">Appendices</a>
						<ol style="list-style-type: upper-latin;">
							<li><a href="index.html#Identifiers">Identifiers</a></li>
							<li><a href="index.html#VariableTypes">Variable Types</a></li>
						</ol>
				</li>
			</ol>
		</div>
		
		<br><hr><br>
		
		<!-- Main Content -->
		<div class='content'>
			
			<!-- Overview -->
			<div id="Overview">
				1. Overview 
				<p>In order to facilitate third-party application developers who wish use content from and interact with Helioviewer.org, 
				a number of <abbr title="Application Programming Interface">APIs</abbr> have been developed, offering access to a variety of components used
				by Helioviewer. All of the interfaces are accessed using HTML query strings. The simplest API's require only a single URI, and result in
				some resource being returned, e.g. a movie or <abbr title="JPEG-2000">JP2</abbr> image series, or some action being performed, e.g. loading
				a particular "View." into Helioviewer. Some of the API's are somewhat more complex, and involve two steps. For example, in order to get a list
				of events from some catalogs for a certain period of time, first a query is usually made to see which catalogs are available and functional. A second
				query then returns a list of features/events are fetched using a second query. It is possible to skip the first part of the query if you know
				the ID's for the desired catalogs and are confident that they are available, you can skip the first query and go straight to the second query.
				More on that later though.</p>
			</div>
			
			<!-- Custom View API-->
			<div id="CustomView">
				2. Custom View API:
				<p>The custom view API enables the user to load a specific set of parameters into Helioviewer: "view," here, simply means a given set of observation
				parameters. This is useful for dynamically loading a specific view or observation into Helioviewer using a URL.</p>
				
				<div class="summary-box">
					<span style="text-decoration: underline;">Usage:</span><br><br>
					
					http://www.helioviewer.org/index.php<br><br>
					
					Supported Parameters:<br><br>
					
					<table class="param-list">
						<tbody valign="top">
							<tr>
								<td width="25%"><b>obs-date</b></td>
								<td width="35%"><i>Unix Timestamp</i></td>
								<td>Date and time to display</td>
							</tr>
							<tr>
								<td><b>img-scale</b></td>
								<td><i>Float</i></td>
								<td>Image scale in arc-seconds/pixel</td>
							</tr>
							<tr>
								<td><b>layers</b></td>
								<td><i>List</i></td>
								<td>A comma-separated list of the image layers to be displayed</td>
							</tr>
						</tbody>
					</table>
					
					<br>
					
					<span class="example-header">Example:</span>
					<span class="example-url">
						<a href="http://www.helioviewer.org/index.php?obs-date=1065512000&img-scale=2.63&layers=SOHEITEIT171,SOHLAS0C20WL">http://www.helioviewer.org/index.php?obs-date=1065512000&img-scale=2.63&layers=SOHEITEIT171,SOHLAS0C20WL</a>
					</span>	
				</div>
			</div>
			
			<br>
			
			<!-- Image API -->
			<div id="ImageAPI">
				3. Image API:
				<p><i>Under Development...</i></p>
				<ul>
				</ul>
			</div>
			
			<!-- Feature/Event API -->
			<div id="FeatureEventAPI">
				4. Feature/Event API:
				<p>There are two ways to use Helioviewer's Feature/Event API. The first is to query the available catalogs, and then query for specific
				features/events within each catalog. The second method is to go straight to querying for features/events, skipping the catalog step. This
				requires that you already know the identifiers for each specific catalog you wish you query. Both steps are described below.</p>
				<ol style="list-style-type: upper-latin;">
					<!-- Catalog API -->
					<li>
						<div id="Catalogs">
							Feature/Event Catalogs:
							<p>To query the list of available catalogs, simply call the "getEvents" API with no parameters. This will return a list
							of the available catalogs, as well as some meta-information describing each of the catalogs. The most important parameters
							returned are the "id", the identifier used to query the specific catalog for features/events, and "eventType" which specified
							the type of feature/event the catalog described, e.g. "CME" or "Active Region."</p>
							
							<br>
							
							<div class="summary-box">
								<span style="text-decoration: underline;">Usage:</span><br><br>
								http://helioviewer.org/api/getEvents.php<br><br>
								
								Result:<br><br>
								
								An array of catalog objects is returned formatted as JSON. Each catalog object includes the following six parameters:
								
								<!-- Feature/Event Catalog Parameter Description -->
								<table class="param-list" cellspacing="10">
									<tbody valign="top">
										<tr>
											<td width="25%"><b>adjustRotation</b></td>
											<td width="15%"><i>Boolean</i></td>
											<td>...</td>
										</tr>
										<tr>
											<td><b>coordinateSystem</b></td>
											<td><i>String</i></td>
											<td>The type of coordinate system used by the catalog provider. Recognized coordinate systems include "HELIOGRAPHIC,"
											"PRINCIPAL_ANGLE," and "ANGULAR."</td>
										</tr>
										<tr>
											<td><b>description</b></td>
											<td><i>String</i></td>
											<td>A brief human-readable description of the catalog.</td>
										</tr>
										<tr>
											<td><b>eventType</b></td>
											<td><i>String</i></td>
											<td>The type of event described. See <a href="index.html#Identifiers">Appendix A</a> for a list of the supported event types.</td>
										</tr>
										<tr>
											<td><b>id</b></td>
											<td><i>String</i></td>
											<td>The identifier for a specific catalog. The identifier consists of two parts separate by double-colans. The left-side
											of the double-colans identifies the catalog provider, which may be the same for several catalogs. The right-side identifies
											the specific catalog.</td>
										</tr>
										<tr>
											<td><b>name</b></td>
											<td><i>String</i></td>
											<td>A human-readable name for the catalog.</td>
										</tr>
									</tbody>
								</table>

							</div>
							
							<br>
							
							<!-- Catalog API Notes -->
							<div class="summary-box" style="background-color: #E3EFFF;">
								<span style="text-decoration: underline;">Notes:</span><br><br>
								<ul>
									<li>
										<p>The identifiers for working with the feature/event API do not follow the three-character used for most of the other API's on
										Helioviewer. Although it may be switched to follow this convention in the future, the Feature/Event identifiers are currently variable
										length. Refer to the table in the following section, <a href="index.html#CatalogEntries">Catalog Entries</a> for the specific id's used.</p>
									</li>
									<li>
										<p>Results are returned as <abbr name="JSON" title="JavaScript Object Notation">JSON</abbr>. Future versions will provide the ability
										to request results in either JSON or VOEvent format.
										</p>
									</li>
								</ul>
							</div>
			
						</div>
					</li>
					
					<br>
					
					<!-- Catalog Entry API -->
					<li>
						<div id="CatalogEntries">
							Feature/Event Catalog Entries:
							<p></p>
							
							<div class="summary-box">
								<span style="text-decoration: underline;">Usage:</span><br><br>
								
								http://helioviewer.org/api/getEvents.php<br><br>
								
								Supported Parameters:<br><br>
					
								<table class="param-list" cellspacing="10">
									<tbody valign="top">
										<tr>
											<td width="25%"><b>catalogs</b></td>
											<td width="35%"><i>List</i></td>
											<td>A comma-separated list of catalog identifiers identifying the catalogs to be included in the search.</td>
										</tr>
										<tr>
											<td><b>date</b></td>
											<td><i>ISO 8601 UTC Date</i></td>
											<td>The date about which the feature/event query is centered.</td>
										</tr>
										<tr>
											<td><b>task</b></td>
											<td><i>String</i></td>
											<td>The specific task to perform: must be set to "getPoi" for this type of query.</td>
										</tr>
										<tr>
											<td><b>windowSize</b></td>
											<td><i>Integer</i></td>
											<td>The window-size (in seconds) to search.</td>
										</tr>
									</tbody>
								</table>
								
								<br>
								
								Result:<br><br>
								An array of event objects is returned formatted as JSON. Each event object includes 12 required parameters as well as an array, "properties"
								which contains additional parameters which vary from catalog to catalog. Among the 12 require parameters, two of the parameters relating to
								the coordinates of the event may also vary, but every event object will include a set of coordinates.<br><br>
								
								<!-- Event Parameter Description -->
								<table class="param-list" cellspacing="10">
									<tbody valign="top">
										<tr>
											<td width="20%"><b>angularX</b></td>
											<td width="20%"><i>Integer</i></td>
											<td><i>[Optional]</i> ...</td>
										</tr>
										<tr>
											<td><b>angularY</b></td>
											<td><i>Integer</i></td>
											<td><i>[Optional]</i> ...</td>
										</tr>
										<tr>
											<td><b>catalogId</b></td>
											<td><i>String</i></td>
											<td>The ID of the catalog from which the event came from.</td>
										</tr>
										<tr>
											<td><b>detail</b></td>
											<td><i>String</i></td>
											<td>Miscellaneous event-related details. The variable properties array is derived primarily from this.</td>
										</tr>
										<tr>
											<td><b>endTime</b></td>
											<td><i>ISO 8601 UTC Date</i></td>
											<td>End event time.</td>
										</tr>
										<tr>
											<td><b>eventId</b></td>
											<td><i>String</i></td>
											<td>Event identifier: varies depending on the catalog source.</td>
										</tr>
										<tr>
											<td><b>hlat</b></td>
											<td><i>Integer</i></td>
											<td><i>[Optional]</i> Heliocentric lattitudinal coordinate of event...</td>
										</tr>
										<tr>
											<td><b>hlong</b></td>
											<td><i>Integer</i></td>
											<td><i>[Optional]</i> Heliocentric longitudinal coordinate of event...</td>
										</tr>
										<tr>
											<td><b>info</b></td>
											<td><i>String</i></td>
											<td>A shorter version of the "detail" parameter: lists some basic parameters of the event which vary from catalog to catalog.</td>
										</tr>
										<tr>
											<td><b>polarCpa</b></td>
											<td><i>Integer</i></td>
											<td><i>[Optional]</i> Polar coordinates angle, in degrees.</td>
										</tr>
										<tr>
											<td><b>polarWidth</b></td>
											<td><i>Integer</i></td>
											<td><i>[Optional]</i> Polar coordinates width...</td>
										</tr>
										<tr>
											<td><b>properties</b></td>
											<td><i>List</i></td>
											<td>An array of parameters which depend on the specific catalog queried. Should handle separately from other known parameters.</td>
										</tr>
										<tr>
											<td><b>shortInfo</b></td>
											<td><i>String</i></td>
											<td>An even shorter version of the "detail" parameter: lists some very basic parameters of the event which vary from catalog to catalog.</td>
										</tr>
										<tr>
											<td><b>sourceUrl</b></td>
											<td><i>String</i></td>
											<td>Source URL for the individual event, or a link to the catalog search interface if no individual URL can be generated.</td>
										</tr>
										<tr>
											<td><b>startTime</b></td>
											<td><i>ISO 8601 UTC Date</i></td>
											<td>Start event time.</td>
										</tr>
										<tr>
											<td><b>sunX</b></td>
											<td><i>Float</i></td>
											<td>Normalized Heliocentric cartesian X-coordinate.</td>
										</tr>
										<tr>
											<td><b>sunY</b></td>
											<td><i>Float</i></td>
											<td>Normalized Heliocentric cartesian Y-coordinate.</td>
										</tr>
									</tbody>
								</table>
								
								<br>
								
								<span class="example-header">Example:</span>
								<span class="example-url">
									<a href=http://helioviewer.org/api/getEvents.php?task=getPoi&date=2003-10-05T00:00:00Z&windowSize=86400&catalogs=VSOService::noaa,GOESXRayService::GOESXRay">http://helioviewer.org/api/getEvents.php?task=getPoi&date=2003-10-05T00:00:00Z&windowSize=86400&catalogs=VSOService::noaa,GOESXRayService::GOESXRay</a>
								</span>
							</div>
							
							<br>
							
							<!-- Catalog Entry API Notes -->
							<div class="summary-box" style="background-color: #E3EFFF;">
								<span style="text-decoration: underline;">Notes:</span><br><br>
								<ul>
									<li>
										<p>In order to search the feature/event catalogs, the "task" parameter must be set to "getPoi."</p>
									</li>
									<li>
										<p>The coordinate parameters returned will vary depending on the specific catalog queried. For catalogs which use the "PRINCIPAL_ANGLE"
										coordinate system, the parameters "polarCpa" and "polarWidth" are returned. For catalogs which use the "HELIOGRAPHIC" coordinate system, "hlat"
										and "hlong" parameters are return. 
										</p>
									</li>
								</ul>
							</div>
							
						</div>
					</li>
				</ol>
			</div>
			
			
			
			<!-- JPEG-2000 API -->
			<div id="JPEG2000API">
				6. JPEG-2000 API:
				<p>Helioviewer's JPEG-2000 API's enable access to the raw JPEG-2000 images used to generate the tiles seen on the site, as
				well as real-time generation of JPEG-2000 Image Series.</p>
				<ol style="list-style-type: upper-latin;">
					<!-- JPEG-2000 Image API -->
					<li>
						<div id="JP2">
							JP2 Images:
							<p>desc.</p>
							
							<br>
							
							<div class="summary-box">
							</div>
						</div>
					</li>
					
					<!-- JPEG-2000 Image-Series API -->
					<li>
						<div id="JP2SERIES">
							JP2 Image Series:
							<p>desc.</p>
							
							<br>
							
							<div class="summary-box">
							</div>
						</div>
					</li>
				</ol>
			</div>
			
			<!-- Movie API -->
			<div id="MovieAPI">
				6. Movie API:
				<p><i>Under Development...</i></p>
			</div>
			
			<!-- Appendices -->
			<div id="Appendices">
				7. Appendices:
				<p></p>
				<ol style="list-style-type: upper-latin;">
					<!-- Appendix A: Identifiers -->
					<li>
						<div id="Identifiers">
							Supported Identifiers
							<p>This appendice contains a list of the identifiers supported by Helioviewer. Many of the identifiers consist of three alphanumeric
							characters. Where an appropriate abbreviation is short than three characters, 0's are filled in from the left (e.g. "C2" -> "0C2").
							For some queries, complex identifiers may be built up from the simpler ones below. E.g. to uniquely identify a specific type of
							image, you must specify a 12-character concatenated set of four identifiers: Observatory, Instrument, Detector, and Measurement.
							For example, to refer to an EIT 171 image, the identifier <i>SOHEITEIT171</i> is used. Note that not all identifiers follow the
							three-character convention. The Feature/Event API identifiers in particular use a different system for naming.</p> 
							<div class="summary-box" style="background-color: #E3EFFF;">
							
								<!-- Observatories -->
								<i>Observatories:</i><br><br>
								<table class="param-list">
									<tr>
										<td width="140px"><strong>Identifier:</strong></td>
										<td><strong>Description:</strong></td>
									</tr>
									<tr>
										<td>SOH</td>
										<td>SOHO (Solar and Heliospheric Observatory)</td>
									</tr>
									<tr>
										<td>TRA</td>
										<td>TRACE (Transition Region and Coronal Explorer)</td>
									</tr>
								</table>
								
								<br>
								
								<!-- Instruments -->
								<i>Instruments:</i><br><br>
								<table class="param-list">
									<tr>
										<td width="140px"><strong>Identifier:</strong></td>
										<td><strong>Description:</strong></td>
									</tr>
									<tr>
										<td>EIT</td>
										<td>EIT (Extreme ultraviolet Imaging Telescope)</td>
									</tr>
									<tr>
										<td>LAS</td>
										<td>LASCO (Large Angle and Spectrometric Coronagraph Experiment)</td>
									</tr>
									<tr>
										<td>MDI</td>
										<td>MDI (The Michelson Doppler Imager)</td>
									</tr>
									<tr>
										<td>TRA</td>
										<td>TRACE (Transition Region and Coronal Explorer)</td>
									</tr>
								</table>
								
								<br>
								
								<!-- Detectors -->
								<i>Detectors:</i><br><br>
								<table class="param-list">
									<tr>
										<td width="140px"><strong>Identifier:</strong></td>
										<td><strong>Description:</strong></td>
									</tr>
									<tr>
										<td>0C2</td>
										<td>LASCO C2</td>
									</tr>
									<tr>
										<td>0C3</td>
										<td>LASCO C3</td>
									</tr>
									<tr>
										<td>EIT</td>
										<td>EIT (Extreme ultraviolet Imaging Telescope)</td>
									</tr>
									<tr>
										<td>MDI</td>
										<td>MDI (The Michelson Doppler Imager)</td>
									</tr>
								</table>
																
								<br>
								
								<!-- Measurements -->
								<i>Measurements:</i><br><br>
								<table class="param-list">
									<tr>
										<td width="140px"><strong>Identifier:</strong></td>
										<td><strong>Description:</strong></td>
									</tr>
									<tr>
										<td>171</td>
										<td>171 nm</td>
									</tr>
									<tr>
										<td>195</td>
										<td>195 nm</td>
									</tr>
									<tr>
										<td>284</td>
										<td>284 nm</td>
									</tr>
									<tr>
										<td>304</td>
										<td>304 nm</td>
									</tr>
									<tr>
										<td>0WL</td>
										<td>White-light</td>
									</tr>
									<tr>
										<td>INT</td>
										<td>Intensity spectrogram</td>
									</tr>
									<tr>
										<td>MAG</td>
										<td>Magnetogram</td>
									</tr>
								</table>
								
								<br>
								
								<!-- Event Types -->
								<i>Event Types:</i><br><br>
								<table class="param-list">
									<tr>
										<td width="140px"><strong>Identifier:</strong></td>
										<td><strong>Description:</strong></td>
									</tr>
										<td>CME</td>
										<td>Coronal Mass Ejection</td>
									</tr>
									<tr>
										<td>Solar Flare</td>
										<td>Solar Flare</td>
									</tr>
									<tr>
										<td>Type II Radio Burst</td>
										<td>Type II Radio Burst</td>
									</tr>
									<tr>
										<td>Active Region</td>
										<td>Active Region</td>
									</tr>
									<tr>
										<td>GeneralActivityReport</td>
										<td>SOHO General Activity Report</td>
									</tr>
								</table>
							</div>							
						</div>						
					</li>
				</ul>
			</div>
					
		</div>

		<div style="font-size: 0.7em; text-align: center; margin-top: 20px;">
			Last Updated: 2009-01-02 | <a href="mailto:webmaster@helioviewer.org">Questions?</a>
		</div>
	
	</body>
</html>	
<?php
	}
?>