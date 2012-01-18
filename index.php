<?php
$ini = "settings/Config.ini";
if ((!file_exists($ini)) || (!$config = parse_ini_file($ini)))
    die("Missing config file!");
// Remove variables that are not used on the client-side
unset($config['enable_statistics_collection']);

// Debug support
if (isset($_GET['debug']) && ((bool) $_GET['debug'] == true)) {
    $debug = true;
    $config['compress_js'] = $config['compress_css'] = false;
} else {
    $debug = false;    
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php printf("<!-- Helioviewer.org 2.2.2 (rev. %s), %s -->\n", $config["build_num"], $config["last_update"]);?>
    <title>Helioviewer - Solar and heliospheric image visualization tool</title>
    <meta charset="utf-8" />
    <meta name="description" content="Helioviewer.org - Solar and heliospheric image visualization tool" />
    <meta name="keywords" content="Helioviewer, JPEG 2000, JP2, sun, solar, heliosphere, solar physics, viewer, visualization, space, astronomy, SOHO, SDO, STEREO, AIA, HMI, EUVI, COR, EIT, LASCO, SDO, MDI, coronagraph, " />
    <meta property="og:title" content="Helioviewer.org" />
<?php
    // Settings specified via URL parameters
    $urlSettings = array();

    //API Example: helioviewer.org/?date=2003-10-05T00:00:00Z&imageScale=2.4&imageLayers=[SOHO,AIA,AIA,171,1,70],[SOHO,LASCO,C2,white light,0,100]
    if (isset($_GET['imageLayers'])) {
        $imageLayersString = ($_GET['imageLayers'][0] == "[") ? substr($_GET['imageLayers'],1,-1) : $_GET['imageLayers'];
        $imageLayers = preg_split("/\],\[/", $imageLayersString);
        $urlSettings['imageLayers'] = $imageLayers;
    }
    
    if (isset($_GET['centerX']))
        $urlSettings['centerX'] = $_GET['centerX'];
    
    if (isset($_GET['centerY']))
        $urlSettings['centerY'] = $_GET['centerY'];

    if (isset($_GET['date']))
        $urlSettings['date'] = $_GET['date'];

    if (isset($_GET['imageScale']))
        $urlSettings['imageScale'] = $_GET['imageScale'];
    
    if(isset($_GET['movieId']))
        $urlSettings['movieId'] = $_GET['movieId'];
    
    // Open Graph meta tags
    $ogDescription = "Solar and heliospheric image visualization tool.";
    $ogImage       = "http://helioviewer.org/resources/images/logos/hvlogo1s_transparent.png";

    if (isset($urlSettings["movieId"]) && preg_match('/^[a-zA-Z0-9]+$/', $urlSettings["movieId"])) {
        include_once "api/src/Config.php";
        $configObj = new Config("settings/Config.ini");
        include_once 'api/src/Movie/HelioviewerMovie.php';
        
        $movie = new Movie_HelioviewerMovie($urlSettings["movieId"], "mp4");
        $thumbnails = $movie->getPreviewImages();

        $flvURL = HV_API_ROOT_URL . "?action=downloadMovie&format=flv&id=" . $movie->publicId;
        $swfURL = HV_WEB_ROOT_URL . "/lib/flowplayer/flowplayer-3.2.7.swf?config=" . urlencode("{'clip':{'url':'$flvURL'}}");
        
        $ogDescription = $movie->getTitle();
        $ogImage       = $thumbnails['full'];
?>
    <meta property="og:video" content="<?php echo $swfURL;?>" />
    <meta property="og:video:width" content="<?php echo $movie->width;?>" />
    <meta property="og:video:height" content="<?php echo $movie->height;?>" />
    <meta property="og:video:type" content="application/x-shockwave-flash" />
<?php 
    } else if (sizeOf($urlSettings) >= 5) {
        include_once "api/src/Config.php";
        $configObj = new Config("settings/Config.ini");

        include_once 'api/src/Helper/HelioviewerLayers.php';
        include_once 'api/src/Helper/DateTimeConversions.php';

        $layers = new Helper_HelioviewerLayers($_GET['imageLayers']);

        $screenshotParams = array(
            "action"      => "takeScreenshot",
            "display"     => true,
            "date"        => $urlSettings['date'],
            "imageScale"  => $urlSettings['imageScale'],
            "layers" => $_GET['imageLayers'],
            "x0" => $urlSettings['centerX'],
            "y0" => $urlSettings['centerY'],
            "width" => 128,
            "height" => 128
        );
        $ogImage = HV_API_ROOT_URL . "?" . http_build_query($screenshotParams);
        $ogDescription = $layers->toHumanReadableString() . " (" . toReadableISOString($urlSettings['date']) . " UTC)";
    }
?>
    <meta property="og:description" content="<?php echo $ogDescription;?>" />
    <meta property="og:image" content="<?php echo $ogImage;?>" />
    <?php if ($config["disable_cache"]) echo "<meta http-equiv=\"Cache-Control\" content=\"No-Cache\" />\n"; ?>
    
    <link rel="shortcut icon" href="favicon.ico" />
        
    <!--[if IE]>
    <script type="text/javascript" src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->

    <!-- YUI CSS Reset -->
    <link rel="stylesheet" href="lib/yui-2.8.2r1/reset-fonts.css" />

    <!-- Plugin Styles -->
    <link rel="stylesheet" href="lib/jquery.ui-1.8/css/dot-luv-modified/jquery-ui-1.8.12.custom.css" />  
    <link rel="stylesheet" href="lib/jquery.jgrowl/jquery.jgrowl.css" />
    <link rel="stylesheet" href="lib/jquery.imgareaselect-0.9.5/css/imgareaselect-default.css" />
    <link rel="stylesheet" href="lib/jquery.qTip2/jquery.qtip.min.css" />

    <!-- Helioviewer-Specific Styles -->
    <?php

        if ($config['disable_cache']) {
            $signature = time();
        } else {
            $signature = $config['build_num'];
        }
        $version = "rev=$signature";

        // CSS
        if ($config["compress_css"]) {
            echo "<link rel=\"stylesheet\" href=\"build/css/helioviewer.min.css?$version\" />\n    ";
        }
        else {
            $css = array("main", "layout", "accordions", "dialogs", 
                         "media-manager", "sliders", "timenav", 
                         "video-gallery", "viewport", "youtube");
            foreach($css as $file)
                printf("<link rel=\"stylesheet\" href=\"resources/css/%s.css?$version\" />\n    ", $file);
        }
    ?>

    <!-- Theme Modifications -->
    <link rel="stylesheet" href="resources/css/dot-luv.css">
    <?php
        // Load Google Analytics if enabled 
        if ($config["google_analytics_id"]) {
    ?>

    <!-- Google Analytics -->
    <script type="text/javascript">
        var _gaq = _gaq || [];
        _gaq.push(['_setAccount', '<?php echo $config["google_analytics_id"];?>']);
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

    <!-- AddThis -->
    <script type="text/javascript">
        var addthis_config = {
            data_track_clickback: true,
            pub_id: "<?php echo $config['addthis_analytics_id'];?>",
            data_ga_property: "<?php echo $config['google_analytics_id'];?>"
        };
    </script>
<script type="text/javascript" src="http://s7.addthis.com/js/250/addthis_widget.js#async=1"></script>
</head>
<body>

<!-- Header -->
<div id="header"></div>

<!-- Body -->
<div id="colmask">
    <div id="colmid">
        <div id="colright">

        <!-- Middle Column -->
        <div id="col1wrap">
            <div id="col1pad">
                <div id="col1">
                    <!-- Viewport -->
                    <div id="helioviewer-viewport-container-outer" class="ui-widget ui-widget-content ui-corner-all">
                        <div id="helioviewer-viewport-container-inner">
                            <div id="helioviewer-viewport">
                                <!-- Movement sandbox -->
                                <div id="sandbox" style="position: absolute;">
                                    <div id="moving-container"></div>
                                </div>
                                
                                <!-- Message console -->
                                <div id="message-console"></div>
                                
                                <!-- Image area select boundary container -->
                                <div id="image-area-select-container"></div>
                                
                            </div>

                            <!-- UI COMPONENTS -->

                            <!--  Zoom Controls -->
                            <div id="zoomControls">
                                <div id="zoomControlZoomIn" title="Zoom in.">+</div>
                                <div id="zoomSliderContainer">
                                    <div id="zoomControlSlider"></div>
                                </div>
                                <div id="zoomControlZoomOut" title="Zoom out.">-</div>
                            </div>

                            <!-- Center button -->
                            <div id="center-button" title="Center the image on the screen.">
                               <span>center</span>
                            </div>

                            <!--Social buttons -->
                            <div id="social-buttons">
                                <!-- Link button -->
                                <div id="link-button" class="text-btn qtip-left" title="Get a link to the current page.">
                                    <span class="ui-icon ui-icon-link" style="float: left;"></span>
                                    <span style="line-height: 1.6em">Link</span>
                                </div>

                                <!-- Email button -->
                                <!--<div id="email-button" class="text-btn">
                                    <span class="ui-icon ui-icon-mail-closed" style="float: left;"></span>
                                    <span style="line-height: 1.6em">Email</span>
                                </div>-->

                                <!-- Movie button -->
                                <div id="movie-button" class="text-btn">
                                    <span class="ui-icon ui-icon-video" style="float: left;"></span>
                                    <span style="line-height: 1.6em">Movie</span>
                                </div>

                                <!-- Screenshot button -->
                                <div id="screenshot-button" class="text-btn">
                                    <span class="ui-icon ui-icon-image" style="float: left;"></span>
                                    <span style="line-height: 1.6em">Screenshot</span>
                                </div>
                                
                                <!-- Settings button -->
                                <div id="settings-button" class="text-btn qtip-left" title="Configure Helioviewer.org user preferences.">
                                    <span class="ui-icon ui-icon-gear" style="float: left;"></span>
                                    <span style="line-height: 1.6em">Settings</span>
                                </div>

                                <!-- JHelioviewer -->
                                <!-- 2010/12/28: Disabling until JNLP launching is fixed -->
                                <!-- <div id="jhelioviewer-button" class="text-btn">
                                    <span class="ui-icon ui-icon-arrowthickstop-1-s" style="float: left;"></span>
                                    <span style="line-height: 1.6em">JHelioviewer</span>
                                </div> -->
                            </div>

                            <!-- Fullscreen toggle -->
                            <div id='fullscreen-btn' class='qtip-left' title="Toggle fullscreen display.">
                                <span class='ui-icon ui-icon-arrow-4-diag'></span>
                            </div>

                            <!-- Mouse coordinates display -->
                            <div id="mouse-coords" style="display: none;">
                                <div id="mouse-coords-x"></div>
                                <div id="mouse-coords-y"></div>
                            </div>
                            
                            <!-- Screenshot Manager -->
                            <div id='screenshot-manager-container' class='media-manager-container glow'>
                                <div id='screenshot-manager-build-btns' class='media-manager-build-btns'>
                                    <div id='screenshot-manager-full-viewport' class='text-btn' title='Create a screenshot using the entire viewport.'>
                                        <span class='ui-icon ui-icon-arrowthick-2-se-nw' style='float:left;'></span>
                                        <span style='line-height: 1.6em'>Full Viewport</span>
                                    </div>
                                    <div id='screenshot-manager-select-area' class='text-btn qtip-left' style='float:right;' title='Create a screenshot of a sub-region of the viewport.'>
                                        <span class='ui-icon ui-icon-scissors' style='float:left;'></span>
                                        <span style='line-height: 1.6em'>Select Area</span> 
                                    </div>
                                </div>
                                <div id='screenshot-history-title' class='media-history-title'>
                                    Screenshot History    
                                    <div id='screenshot-clear-history-button' class='text-btn qtip-left' style='float:right;' title='Remove all screenshots from the history.'>
                                        <span class='ui-icon ui-icon-trash' style='float:left;'></span>
                                        <span style='font-weight:normal'><i>Clear</i></span>
                                    </div> 
                                </div>
                                <div id='screenshot-history'></div>
                            </div>
                            <!-- Movie Manager -->
                            <div id='movie-manager-container' class='media-manager-container glow'>
                                <div id='movie-manager-build-btns' class='media-manager-build-btns'>
                                    <div id='movie-manager-full-viewport' class='text-btn qtip-left' title='Create a movie using the entire viewport.'>
                                        <span class='ui-icon ui-icon-arrowthick-2-se-nw' style='float:left;'></span>
                                        <span style='line-height: 1.6em'>Full Viewport</span>
                                    </div>
                                    <div id='movie-manager-select-area' class='text-btn qtip-left' style='float:right;' title='Create a movie of a sub-region of the viewport.'>
                                        <span class='ui-icon ui-icon-scissors' style='float:left;'></span>
                                        <span style='line-height: 1.6em'>Select Area</span> 
                                    </div>
                                </div>
                                <div id='movie-history-title' class='media-history-title'>
                                    Movie History    
                                    <div id='movie-clear-history-button' class='text-btn qtip-left' style='float:right;' title='Remove all movies from the history.'>
                                        <span class='ui-icon ui-icon-trash' style='float:left;'></span>
                                        <span style='font-weight:normal'><i>Clear</i></span>
                                    </div> 
                                </div>
                                <div id='movie-history'></div>
                            </div>
                            
                            <!-- Movie Settings -->
                            <div id='movie-settings-container' class='media-manager-container glow'>
                                <div style='margin-bottom: 10px; border-bottom: 1px solid; padding-bottom: 10px;'>
                                    <b>Movie Settings:</b>
                                    
                                    <div id='movie-settings-btns' style='float:right;'>
                                        <span id='movie-settings-toggle-advanced' style='display:inline-block;' class='ui-icon ui-icon-gear'></span>
                                        <span id='movie-settings-toggle-help' style='display:inline-block;' class='ui-icon ui-icon-help'></span>
                                    </div>
                                </div>

                                <!-- Begin movie settings -->
                                <div id='movie-settings-form-container'>
                                <form id='movie-settings-form'>

								<!-- Movie duration -->
                                <fieldset style='padding: 0px; margin: 5px 0px 8px'>
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
                                
                                <!-- Advanced movie settings -->
                                <div id='movie-settings-advanced'>
                                    
                                    <!-- Movie Speed -->
                                    <fieldset id='movie-settings-speed'>
                                        <legend>Speed</legend>
                                        <div style='padding:10px;'>
                                            <input type="radio" name="speed-method" id="speed-method-f" value="framerate" checked="checked" />
                                            <label for="speed-method-f" style='width: 62px;'>Frames/Sec</label>
                                            <input id='frame-rate' maxlength='2' size='3' type="text" name="framerate" min="1" max="30" value="15" pattern='^(0?[1-9]|[1-2][0-9]|30)$' />(1-30)<br />
                                            
                                            <input type="radio" name="speed-method" id="speed-method-l" value="length" />
                                            <label for="speed-method-l" style='width: 62px;'>Length (s)</label>
                                            <input id='movie-length' maxlength='3' size='3' type="text" name="movie-length" min="5" max="300" value="20" pattern='^(0{0,2}[5-9]|0?[1-9][0-9]|100)$' disabled="disabled" />(5-100)<br />
                                        </div>
                                    </fieldset>
                                    
                                    <!-- Cadence -->
                                    <fieldset id='movie-settings-cadence'>
                                        <legend>Cadence</legend>
                                        <div style='padding:10px;'>
                                            <input type="radio" name="cadence-method" id="cadence-method-u" value="unlimited" checked="checked" />
                                            <label for="cadence-method-u">Unlimited</label><br />

                                            <input type="radio" name="cadence-method" id="cadence-method-m" value="minimum" />                                            
                                            <label for="cadence-method-m">One image every</label>
                                            <input id='settings-cadence-value' type="text" size='3' maxlength='3' name="cadence-value" min="0" value="5" pattern='^[\d]+$' disabled="disabled" />
                                            <select id='settings-cadence-increment' name='cadence-increment' disabled="disabled">
                                                <option value='1'>Seconds</option>
                                                <option value='60'>Minutes</option>
                                                <option value='3600'>Hours</option>
                                                <option value='86400'>Days</option>
                                            </select>
                                        </div>
                                    </fieldset>
                                    
                                    <!-- Other -->
                                    <fieldset id='movie-settings-other'>
                                        <legend>Other</legend>
                                        <div style='padding:10px;'>
                                            <input type="checkbox" name="watermark-enabled" id="watermark-enabled" value="true" checked="checked" />
                                            <label for="cadence-method-u">Watermark on</label><br />											
                                        </div>
                                    </fieldset>
                                </div>

                                <!-- Movie request submit button -->
                                <div id='movie-settings-submit'>
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
                                	<p>Movie speed can be controlled either by specifying a desired frame-rate (the number of frames displayed each second) or a length in seconds.</p><br />
                                	
                                	<b>Cadence</b><br /><br />
                                	<p>The amount of time between each image in the movie.</p><br />
                                	
                                	<b>Watermark</b><br /><br />
                                    <p>Whether or not to include the Helioviewer.org logo in the video.</p><br />
                                </div>
                                
                                <!-- Movie settings validation console -->
                                <div id='movie-settings-validation-console' style='display:none; text-align: center; margin: 7px 1px 0px; padding: 0.5em; border: 1px solid #fa5f4d; color: #333; background: #fa8072;' class='ui-corner-all'>
                                	
                                </div>
                            </div>

                            <!-- Image area select tool -->
                            <div id='image-area-select-buttons'>
                                <div id='done-selecting-image' class='text-btn'>
                                    <span class='ui-icon ui-icon-circle-check'></span>
                                    <span>Done</span>
                                </div> 
                                <div id='cancel-selecting-image' class='text-btn'> 
                                    <span class='ui-icon ui-icon-circle-close'></span>
                                    <span>Cancel</span>
                                </div>
                                <div id='help-selecting-image' class='text-btn' style='float:right;'> 
                                    <span class='ui-icon ui-icon-info'></span>
                                </div>
                            </div>
                        </div>


                    </div>
                </div>
            </div>
        </div>

        <!-- Left Column -->
        <div id="col2">
            <div id="left-col-header">
                <a href='<?php echo $config['web_root_url'];?>'>
                    <img src="<?php echo $config['main_logo'];?>" id="helioviewer-logo-main" alt="Helioviewer.org Logo">
                </a>
            </div>
            <br><br>
            <div class="section-header" style="margin-left:5px; margin-top: 15px;">Time</div>
            <div id="observation-controls" class="ui-widget ui-widget-content ui-corner-all shadow">
                <!--  Observation Date -->
                <div id="observation-date-container">
                    <div id="observation-date-label">Date:</div>
                    <input type="text" id="date" name="date" value="" maxlength='10' pattern="[\d]{4}/[\d]{2}/[\d]{2}">
                    <span id="timeNowBtn" title="Go to the time of the most recent available image for the currently loaded layers.">latest</span>
                </div>

                <!-- Observation Time -->
                <div id="observation-time-container">
                    <div id="observation-time-label">Time:</div>
                    <input id="time" name="time" value="" style="width:80px" type="text" maxlength="8" pattern="[\d]{2}:[\d]{2}:[\d]{2}">
                    <span style='font-size: 11px; font-weight: 700; margin-left: 2px;'>UTC</span>
                </div>

                <!-- Time Navigation Buttons & Time Increment selector -->
                <div>
                    <div id="time-navigation-buttons">Time-step:</div>
                    <select id="timestep-select" name="time-step"></select>
                    <span id="timeBackBtn" class="ui-icon ui-icon-circle-arrow-w" title="Move the Observation Date/Time backward one time-step"></span>
                    <span id="timeForwardBtn" class="ui-icon ui-icon-circle-arrow-e" title="Move the Observation Date/Time forward one time-step"></span>
                </div>
            </div>

            <br><br>
            <div id="tileLayerAccordion"></div>
            <br><br>

        </div>

        <!-- Right Column -->
        <div id="col3">
            <div id="right-col-header" style='height: 11px'></div>
            
            <!-- Recent Blog Entries -->
            <div style="margin-left: 5px; margin-top: 15px;" class="section-header">News</div>
            <div id="social-panel" class="ui-widget ui-widget-content ui-corner-all shadow"></div>
            
            <!-- User-Submitted Videos -->
            <div id="user-video-gallery-header" class="section-header">
                <a href="http://www.youtube.com/user/HelioviewerScience" target="_blank" style='text-decoration: none;'>
                    <img id='youtube-logo' src='resources/images/Social.me/48 by 48 pixels/youtube.png' alt='YouTube Logo' />
                </a>
                <span style='position: absolute; bottom: 5px;'>Recently Shared</span>
            </div>
            <div id="user-video-gallery" class="ui-widget ui-widget-content ui-corner-all shadow">
                <a id="user-video-gallery-next" class="qtip-left" href="#" title="Go to next page.">
                    <div class='ui-icon ui-icon-triangle-1-n'></div>
                </a>
                <div id="user-video-gallery-main">
                    <div id="user-video-gallery-spinner"></div>
                </div>
                <a id="user-video-gallery-prev" class="qtip-left" href="#" title="Go to previous page.">
                    <div class='ui-icon ui-icon-triangle-1-s'></div>
                </a>
            </div>
        </div>
        </div>
    </div>
</div>
<!-- end Body -->

<!-- Footer -->
<div id="footer">
    <div id="footer-container-outer">
        <div id="footer-container-inner">
            <!-- Meta links -->
            <div id="footer-links">
                <a href="http://helioviewer.org/wiki/Helioviewer.org_User_Guide" class="light" target="_blank">Help</a>
                <a id="helioviewer-glossary" class="light" href="dialogs/glossary.html">Glossary</a>
                <a id="helioviewer-about" class="light" href="dialogs/about.php">About</a>
                <a id="helioviewer-usage" class="light" href="dialogs/usage.php">Usage Tips</a>
                <a href="http://wiki.helioviewer.org/wiki/Main_Page" class="light" target="_blank">Wiki</a>
                <a href="http://blog.helioviewer.org/" class="light" target="_blank">Blog</a>
                <a href="http://jhelioviewer.org" class="light" target="_blank">JHelioviewer</a>
                <a href="api/" class="light" target="_blank">API</a>
                <a href="mailto:<?php echo $config['contact_email']; ?>" class="light">Contact</a>
                <a href="https://bugs.launchpad.net/helioviewer.org/" class="light" style="margin-right:2px;" target="_blank">Report Problem</a>
            </div>
        </div>
    </div>
</div>
<!-- end Footer -->

<!-- Loading Indicator -->
<div id="loading" style="display: none">
    <span style='vertical-align: top; margin-right: 3px;'>Loading</span>
    <img src="resources/images/ajax-loader.gif" alt="Loading" />
</div>

<!-- Viewport shadow -->
<div id='helioviewer-viewport-container-shadow' class='shadow'></div>

<!-- Glossary dialog -->
<div id='glossary-dialog'></div>

<!-- About dialog -->
<div id='about-dialog'></div>

<!-- Layer choice dialog -->
<div id='layer-choice-dialog'></div>

<!-- Settings dialog -->
<div id='settings-dialog' style='display:none; margin: 15px; font-size: 1em;'>

</div>

<!-- Usage Dialog -->
<div id='usage-dialog'></div>

<!-- URL Dialog -->
<div id='url-dialog' style="display:none;">
    <div id="helioviewer-url-box">
        <span id="helioviewer-url-box-msg">Use the following link to refer to current page:</span>
        <form style="margin-top: 5px;">
            <input type="text" id="helioviewer-url-input-box" style="width:98%;" value="http://helioviewer.org" />
            <label for="helioviewer-url-shorten">Shorten with bit.ly?</label>
            <input type="checkbox" id="helioviewer-url-shorten" />
            <input type="hidden" id="helioviewer-short-url" value="" />
            <input type="hidden" id="helioviewer-long-url" value="" />
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
        <img id='youtube-logo-large' src='resources/images/Social.me/60 by 60 pixels/youtube.png' alt='YouTube logo' />
        <h1>Upload Video</h1>
        <br />
        <form id="youtube-video-info" action="api/index.php" method="post">
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
        <div id='upload-error-console-container'><div id='upload-error-console'>...</div></div>
    </div>
</div>

<?php
    // Firebug Lite
    if (isset($_GET['fblite']) && ((bool) $_GET['fblite'] == true)) {
?>
<script type="text/javascript" src="https://getfirebug.com/firebug-lite.js"></script>
<?php
    }
    if ($config["compress_js"]) {
?>

<!-- jQuery -->
<script src="http://code.jquery.com/jquery-1.7.0.min.js" type="text/javascript"></script>
<script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/jquery-ui.min.js" type="text/javascript"></script>
<script src="lib/jquery.class/jquery.class.min.js" type="text/javascript"></script>

<!-- Mousewheel support -->
<script src="lib/jquery.mousewheel.3.0.6/jquery.mousewheel.min.js" type="text/javascript"></script>

<!-- jGrowl -->
<script src="lib/jquery.jgrowl/jquery.jgrowl_minimized.js" type="text/javascript"></script>

<!-- imgAreaSelect jQuery plugin -->
<script src="lib/jquery.imgareaselect-0.9.5/scripts/jquery.imgareaselect.pack.js" type="text/javascript"></script>

<!-- date.js -->
<script src="lib/date.js/date-en-US.js" type="text/javascript"></script>

<!-- jFeed -->
<script src="lib/jquery.jfeed/build/jquery.jfeed.js" type="text/javascript"></script>

<!-- qTip -->
<script src="lib/jquery.qTip2/jquery.qtip.min.js" type="text/javascript"></script>

<!-- XML to JSON -->
<script src="lib/jquery.xml2json/jquery.xml2json.pack.js" type="text/javascript" language="javascript"></script>

<?php
    } else {
?>

<!-- jQuery -->
<script src="http://code.jquery.com/jquery-1.7.0.js" type="text/javascript"></script>
<script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/jquery-ui.js" type="text/javascript"></script>
<script src="lib/jquery.class/jquery.class.js" type="text/javascript"></script>

<!-- Mousewheel support -->
<script src="lib/jquery.mousewheel.3.0.6/jquery.mousewheel.js" type="text/javascript"></script>

<!-- jGrowl -->
<script src="lib/jquery.jgrowl/jquery.jgrowl.js" type="text/javascript"></script>

<!-- imgAreaSelect jQuery plugin -->
<script src="lib/jquery.imgareaselect-0.9.5/scripts/jquery.imgareaselect.js" type="text/javascript"></script>

<!-- date.js -->
<script src="lib/date.js/date-en-US.js" type="text/javascript"></script>

<!-- jFeed -->
<script src="lib/jquery.jfeed/build/jquery.jfeed.js" type="text/javascript"></script>

<!-- qTip -->
<script src="lib/jquery.qTip2/jquery.qtip.js" type="text/javascript"></script>

<!-- XML to JSON -->
<script src="lib/jquery.xml2json/jquery.xml2json.js" type="text/javascript" language="javascript"></script>

<?php
}
?>
<!-- CookieJar -->
<script type="text/javascript" src="lib/jquery.json-2.2/jquery.json-2.2.min.js"></script>
<script type="text/javascript" src="lib/jquery.cookie/jquery.cookie.min.js"></script>
<script type="text/javascript" src="lib/Cookiejar/jquery.cookiejar.pack.js"></script>

<!-- Simile -->
<!--<script src="http://static.simile.mit.edu/timeline/api-2.2.0/timeline-api.js" type="text/javascript"></script>-->

<!-- Pixastic -->
<!-- $("img.tile[src!=resources/images/transparent_512.gif]"); -->
<!--<script src="lib/pixastic/pixastic.custom.js" type="text/javascript"></script>-->

<!-- Helioviewer JavaScript -->
<?php 
    // JavaScript
    if ($config["compress_js"]) {
        $compressed = "build/helioviewer.min.js";
        if (!file_exists($compressed)) {
           $error = "<div style='position: absolute; width: 100%; text-align: center; top: 40%; font-size: 14px;'>
                     <img src='resources/images/logos/about.png' alt='helioviewer logo'></img><br>
                     <b>Configuration:</b> Unable to find compressed JavaScript files.
                     If you haven't already, use Apache Ant with the included build.xml file to generate 
                     compressed files.</div></body></html>";
           die($error);
        }
    
        echo "<script src=\"$compressed?$version\" type=\"text/javascript\"></script>\n\t";
    }
    else {
        $js = array("Utility/Config.js", "Utility/HelperFunctions.js", "UI/IconPicker.js", 
                    "Tiling/Layer/Layer.js", "Tiling/Layer/TileLoader.js", "Tiling/Layer/TileLayer.js", 
                    "Tiling/Layer/HelioviewerTileLayer.js", "UI/TreeSelect.js", "UI/ImageSelectTool.js",  
                    "Utility/KeyboardManager.js", "Tiling/Manager/LayerManager.js", "Events/EventManager.js", 
                    "Tiling/Manager/TileLayerManager.js", "Tiling/Manager/HelioviewerTileLayerManager.js", 
                    "Events/EventType.js", "Events/EventFeatureRecognitionMethod.js", "Media/MediaManagerUI.js",
                    "Media/MediaManager.js", "Media/MovieManager.js", "Media/MovieManagerUI.js",
                    "Media/ScreenshotManager.js", "Media/ScreenshotManagerUI.js",  
                    "Image/JP2Image.js", "Tiling/Manager/TileLayerAccordion.js", "UI/MessageConsole.js",
                    "UI/TimeControls.js", "Utility/SettingsLoader.js", "Utility/UserSettings.js", 
                    "Utility/FullscreenControl.js", "Viewport/Helper/MouseCoordinates.js", "Viewport/Viewport.js", 
                    "Viewport/Helper/HelioviewerMouseCoordinates.js", "Viewport/Helper/SandboxHelper.js",
                    "Viewport/Helper/ViewportMovementHelper.js", "Viewport/HelioviewerViewport.js", 
                    "Viewport/ViewportController.js", "Helioviewer.js", "UI/ZoomControls.js", "UI/UserVideoGallery.js", 
                    "UI/Glossary.js", "Utility/InputValidator.js", "UI/jquery.ui.dynaccordion.js");
        foreach($js as $file)
            printf("<script src=\"src/%s?$version\" type=\"text/javascript\"></script>\n", $file);
    }
?>

<script type="text/javascript">
    var serverSettings, settingsJSON, urlSettings, debug;

    $(function () {
        <?php
            printf("settingsJSON = %s;\n", json_encode($config));
            
            // Compute acceptible zoom values
            $zoomLevels = array();
            
            for($imageScale = $config["min_image_scale"]; $imageScale <= $config["max_image_scale"]; $imageScale = $imageScale * 2) {
                $zoomLevels[] = round($imageScale, 8);
            }
            
            printf("\tzoomLevels = %s;\n", json_encode($zoomLevels));

            // Convert to JSON
            printf("\turlSettings = %s;\n", json_encode($urlSettings));
            
            // Debugging support
            printf("\tdebug = %s;\n", json_encode($debug));
        ?>
        serverSettings = new Config(settingsJSON).toArray();
        
        // Initialize Helioviewer.org
        helioviewer    = new Helioviewer(urlSettings, serverSettings, zoomLevels, debug);
        
        // Play movie if id is specified
        if (urlSettings.movieId) {
            helioviewer.loadMovie(urlSettings.movieId);
        }
    });
</script>

</body>
</html>
