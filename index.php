<?php
$ini = "settings/Config.ini";
if ((!file_exists($ini)) || (!$config = parse_ini_file($ini)))
    die("Missing config file!");
// Remove variables that are not used on the client-side
unset($config['youtube_developer_key'], $config['enable_statistics_collection']);
// Debug support
if (isset($_GET['debug']) && ((bool) $_GET['debug'] == true))
    $config['compress_js'] = $config['compress_css'] = false;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php printf("<!-- Helioviewer 2.1.0 (rev. %s), %s -->\n", $config["build_num"], $config["last_update"]);?>
    <title>Helioviewer - Solar and heliospheric image visualization tool</title>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="ie=9" />
    <meta http-equiv="X-UA-Compatible" content="ie=8" />
    <meta http-equiv="X-UA-Compatible" content="chrome=1" />
    <meta name="description" content="Helioviewer - Solar and heliospheric image visualization tool" />
    <meta name="keywords" content="Helioviewer, jpeg 2000, jp2, solar image viewer, sun, solar, heliosphere, solar physics, viewer, visualization, space, astronomy, SOHO, EIT, LASCO, SDO, MDI, coronagraph, " />
    
    <?php if ($config["disable_cache"]) echo "<meta http-equiv=\"Cache-Control\" content=\"No-Cache\" />\n"; ?>
    
    <link rel="shortcut icon" href="favicon.ico" />
        
    <!--[if IE]>
    <script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/chrome-frame/1/CFInstall.min.js"></script>
    <script type="text/javascript" src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->

    <!-- YUI CSS Reset -->
    <link rel="stylesheet" href="lib/yui-2.8.2r1/reset-fonts.css" />

    <!-- Plugin Styles -->
    <link rel="stylesheet" href="lib/jquery.ui-1.8/css/dot-luv-modified/jquery-ui-1.8.custom.css" />  
    <link rel="stylesheet" href="lib/jquery.jgrowl/jquery.jgrowl.css" />
    <link rel="stylesheet" href="lib/jquery.imgareaselect-0.9.2/css/imgareaselect-default.css" />
    <link rel="stylesheet" href="lib/jquery.qTip2/jquery.qtip.min.css" />
    <!--<link rel="stylesheet" href="resources/css/tooltips.css" /> -->

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
            $css = array("main.css", "layout.css", "accordions.css", "dialogs.css", "sliders.css", "timenav.css", "viewport.css");
            foreach($css as $file)
                printf("<link rel=\"stylesheet\" href=\"resources/css/%s?$version\" />\n    ", $file);
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
        
        (function() {
            var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
            ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
            var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
        }) ();
    </script>
    <?php
            }
?>
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
                        <div id="helioviewer-viewport-container-inner" style="top:3%; width:97%; height:94%">
                            <div id="helioviewer-viewport">
                                <!-- Movement sandbox -->
                                <div id="sandbox" style="position: absolute;">
                                    <div id="moving-container" style="left: 0; top: 0"></div>
                                </div>
                                
                                <!-- Message console -->
                                <div id="message-console"></div>
                                
                                <!-- Image area select boundary container -->
                                <div id="image-area-select-container"></div>
                                
                            </div>

                            <!-- UI COMPONENTS -->

                            <!--  Zoom Controls -->
                            <div id="zoomControls"></div>

                            <!-- Center button -->
                            <div id="center-button" title="Center the image on the screen.">
                               <span>center</span>
                            </div>

                            <!--Social buttons -->
                            <div id="social-buttons">
                                <!-- Link button -->
                                <div id="link-button" class="text-btn">
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
                                <div id="settings-button" class="text-btn">
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
                            <div id='fullscreen-btn' title="Toggle fullscreen display.">
                                <span class='ui-icon ui-icon-arrow-4-diag'></span>
                            </div>

                            <!-- Mouse coordinates display -->
                            <div id="mouse-coords" style="display: none;">
                                <div id="mouse-coords-x"></div>
                                <div id="mouse-coords-y"></div>
                            </div>
                            
                            <!-- Screenshot Manager -->
                            <div id='screenshot-manager-container' class='media-manager-container'>
                                <div id='screenshot-manager-build-btns' class='media-manager-build-btns'>
                                    <div id='screenshot-manager-full-viewport' class='text-btn'>
                                        <span class='ui-icon ui-icon-arrowthick-2-se-nw' style='float:left;'></span>
                                        <span style='line-height: 1.6em'>Full Viewport</span>
                                    </div>
                                    <div id='screenshot-manager-select-area' class='text-btn' style='float:right;'>
                                        <span class='ui-icon ui-icon-scissors' style='float:left;'></span>
                                        <span style='line-height: 1.6em'>Select Area</span> 
                                    </div>
                                </div>
                                <div id='screenshot-history-title' class='media-history-title'>
                                    Screenshot History    
                                    <div id='screenshot-clear-history-button' class='text-btn' style='float:right;'>
                                        <span class='ui-icon ui-icon-trash' style='float:left;'></span>
                                        <span style='font-weight:normal'><i>Clear</i></span>
                                    </div> 
                                </div>
                                <div id='screenshot-history'></div>
                            </div>
                            <!-- Movie Manager -->
                            <div id='movie-manager-container' class='media-manager-container'>
                                <div id='movie-manager-build-btns' class='media-manager-build-btns'>
                                    <div id='movie-manager-full-viewport' class='text-btn'>
                                        <span class='ui-icon ui-icon-arrowthick-2-se-nw' style='float:left;'></span>
                                        <span style='line-height: 1.6em'>Full Viewport</span>
                                    </div>
                                    <div id='movie-manager-select-area' class='text-btn' style='float:right;'>
                                        <span class='ui-icon ui-icon-scissors' style='float:left;'></span>
                                        <span style='line-height: 1.6em'>Select Area</span> 
                                    </div>
                                </div>
                                <div id='movie-history-title' class='media-history-title'>
                                    movie History    
                                    <div id='movie-clear-history-button' class='text-btn' style='float:right;'>
                                        <span class='ui-icon ui-icon-trash' style='float:left;'></span>
                                        <span style='font-weight:normal'><i>Clear</i></span>
                                    </div> 
                                </div>
                                <div id='movie-history'></div>
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
                <img src="resources/images/logos/simple.png" id="helioviewer-logo-main" alt="Helioviewer.org Logo" style="margin-top:24px; margin-left: 9px;">
            </div>
            <br><br>
            <div class="section-header" style="margin-left:5px; margin-top: 15px;">Time</div>
            <div id="observation-controls" class="ui-widget ui-widget-content ui-corner-all">
                <!--  Observation Date -->
                <div style="margin-bottom: 4px; position: relative;">
                    <div style="width: 78px; margin-top:3px; float: left; font-weight: 600;">Date:</div>
                    <input type="text" id="date" name="date" value="">
                    <span id="timeNowBtn" title="Go to the time of the most recent available image for the currently loaded layers.">latest</span>
                </div>

                <!-- Observation Time -->
                <div style="margin-bottom: 8px;">
                    <div style="float: left; width: 78px; font-weight: 600;">Time:</div>
                    <input type="text" id="time" name="time" value="" style="width:80px">
                    <span style='font-size: 11px; font-weight: 700; margin-left: 2px;'>UTC</span>
                </div>

                <!-- Time Navigation Buttons & Time Increment selector -->
                <div>
                    <div style="float: left; width: 78px; font-weight: 600;">Time-step:</div>
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
            <div id="social-panel" class="ui-widget ui-widget-content ui-corner-all"></div>
            
            <!-- User-Submitted Videos -->
            <div style="margin: 5px 0px 2px 5px; height: 48px; position: relative;" class="section-header">
                <img id='yt-logo' src='resources/images/Social.me/48 by 48 pixels/youtube.png' alt='YouTube Logo' />
                <span style='position: absolute; bottom: 5px;'>Recently Shared</span>
            </div>
            <div id="user-video-gallery" class="ui-widget ui-widget-content ui-corner-all">
                <a id="user-video-gallery-next" href="#">
                    <div class='ui-icon ui-icon-triangle-1-n'></div>
                </a>
                <div id="user-video-gallery-main">
                    <div id="user-video-gallery-spinner"></div>
                </div>
                <a id="user-video-gallery-prev" href="#">
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
                <a id="helioviewer-about" class="light" href="dialogs/about.php">About</a>
                <a id="helioviewer-usage" class="light" href="dialogs/usage.php">Usage Tips</a>
                <a href="http://helioviewer.org/wiki/Main_Page" class="light" target="_blank">Wiki</a>
                <a href="http://helioviewer.org/blog" class="light" target="_blank">Blog</a>
                <a href="http://jhelioviewer.org" class="light" target="_blank">JHelioviewer</a>
                <a href="api/" class="light" target="_blank">API</a>
                <a href="mailto:contact@helioviewer.org" class="light">Contact</a>
                <a href="https://bugs.launchpad.net/helioviewer.org/" class="light" style="margin-right:2px;" target="_blank">Report Problem</a>
            </div>
        </div>
    </div>
</div>
<!-- end Footer -->

<!-- Loading Indicator -->
<div id="loading" style="display: none">Loading...</div>

<!-- About dialog -->
<div id='about-dialog'></div>

<!-- Layer choice dialog -->
<div id='layer-choice-dialog'></div>

<!-- Settings dialog -->
<div id='settings-dialog' style='display:none; margin: 15px; font-size: 1em;'>
    Movie Duration: 
    <select id='settings-movie-length' name='movie-length'>
        <option value='10800'>3 hours</option>
        <option value='21600'>6 hours</option>
        <option value='43200'>12 hours</option>
        <option value='86400'>1 day</option>
        <option value='172800'>2 days</option>
        <option value='604800'>1 week</option>
    </select>
    <br /><br />
    <span style='font-size: 0.8em;'><b>Note:</b> When making a movie, your current observation time will become the center
    of the movie. For example, if your observation time is set to "12:00:00" and you
    choose to make a 6 hour movie, then movie will start at "09:00:00" and end at "15:00:00".</span>
</div>

<!-- Usage Dialog -->
<div id='usage-dialog'></div>

<!-- URL Dialog -->
<div id='url-dialog' style="display:none;">
    <div id="helioviewer-url-box">
        Use the following link to refer to current page:
        <form style="margin-top: 5px;">
            <input type="text" id="helioviewer-url-input-box" style="width:98%;" value="http://helioviewer.org" />
        </form>
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
<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js" type="text/javascript"></script>

<script src="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.6/jquery-ui.min.js" type="text/javascript"></script>
<script src="lib/jquery.class/jquery.class.min.js" type="text/javascript"></script>

<!-- Mousewheel support -->
<script src="lib/jquery.mousewheel.3.0.2/jquery.mousewheel.min.js" type="text/javascript"></script>

<!-- jGrowl -->
<script src="lib/jquery.jgrowl/jquery.jgrowl_compressed.js" type="text/javascript"></script>

<!-- imgAreaSelect jQuery plugin -->
<script src="lib/jquery.imgareaselect-0.9.2/scripts/jquery.imgareaselect.pack.js" type="text/javascript"></script>

<!-- date.js -->
<script src="lib/date.js/date-en-US.js" type="text/javascript"></script>

<!-- jFeed -->
<script src="lib/jquery.jfeed/build/jquery.jfeed.js" type="text/javascript"></script>

<!-- qTip -->
<script src="lib/jquery.qTip2/jquery.qtip.js" type="text/javascript"></script>

<!-- XML to JSON -->
<script src="lib/jquery.xml2json/jquery.xml2json.pack.js" type="text/javascript" language="javascript"></script>

<?php
    } else {
?>

<!-- jQuery -->
<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.js" type="text/javascript"></script>

<script src="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.6/jquery-ui.js" type="text/javascript"></script>
<script src="lib/jquery.class/jquery.class.js" type="text/javascript"></script>

<!-- Mousewheel support -->
<script src="lib/jquery.mousewheel.3.0.2/jquery.mousewheel.js" type="text/javascript"></script>

<!-- jGrowl -->
<script src="lib/jquery.jgrowl/jquery.jgrowl.js" type="text/javascript"></script>

<!-- imgAreaSelect jQuery plugin -->
<script src="lib/jquery.imgareaselect-0.9.2/scripts/jquery.imgareaselect.js" type="text/javascript"></script>

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
                    "Media/ScreenshotManager.js", "Media/ScreenshotManagerUI.js", "Media/Screenshot.js",  
                    "Image/JP2Image.js", "Tiling/Manager/TileLayerAccordion.js", "UI/MessageConsole.js",
                    "UI/TimeControls.js", "UI/TooltipHelper.js", "Utility/SettingsLoader.js", "Utility/UserSettings.js", 
                    "Utility/FullscreenControl.js", "Viewport/Helper/MouseCoordinates.js", "Viewport/Viewport.js", 
                    "Viewport/Helper/HelioviewerMouseCoordinates.js", "Viewport/Helper/SandboxHelper.js",
                    "Viewport/Helper/ViewportMovementHelper.js", "Viewport/HelioviewerViewport.js", 
                    "Viewport/ViewportController.js", "Helioviewer.js", "UI/ZoomControls.js", "UI/UserVideoGallery.js", 
                    "Utility/InputValidator.js", "UI/jquery.ui.dynaccordion.js");
        foreach($js as $file)
            printf("<script src=\"src/%s?$version\" type=\"text/javascript\"></script>\n", $file);
    }
?>

<script type="text/javascript">
    var serverSettings, settingsJSON, urlSettings;

    $(function () {
        if ($.browser.msie && ($.browser.version < 8)) {
            CFInstall.check({mode: "overlay"});
        }
        
        <?php
            printf("settingsJSON = %s;\n", json_encode($config));

            // Settings specified via URL parameters
            $urlSettings = array();

            //API Example: helioviewer.org/?date=2003-10-05T00:00:00Z&imageScale=2.4&imageLayers=[SOHO,AIA,AIA,171,1,70],[SOHO,LASCO,C2,white light,0,100]
            if (isset($_GET['imageLayers'])) {
                $imageLayersString = ($_GET['imageLayers'][0] == "[") ? substr($_GET['imageLayers'],1,-1) : $_GET['imageLayers'];
                $imageLayers = preg_split("/\],\[/", $imageLayersString);
                $urlSettings['imageLayers'] = $imageLayers;
            }

            if (isset($_GET['date']))
                $urlSettings['date'] = $_GET['date'];

            if (isset($_GET['imageScale']))
                $urlSettings['imageScale'] = $_GET['imageScale'];

            // Convert to JSON
            printf("\turlSettings = %s;\n", json_encode($urlSettings));
        ?>
        serverSettings = new Config(settingsJSON).toArray();
        helioviewer    = new Helioviewer(urlSettings, serverSettings);
    });
</script>

</body>
</html>
