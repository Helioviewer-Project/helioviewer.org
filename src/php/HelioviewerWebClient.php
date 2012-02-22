<?php 
/**
 * HelioviewerWebClient class definition
 * 
 * Helioviewer.org HTML web client
 *
 * PHP version 5
 *
 * @category Application
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once "HelioviewerClient.php";
/**
 * HelioviewerWebClient class definition
 * 
 * Helioviewer.org HTML web client
 *
 * PHP version 5
 *
 * @category Application
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class HelioviewerWebClient extends HelioviewerClient
{
    /**
     * Initializes a Helioviewer.org instance
     */
    public function __construct($urlSettings)
    {
        parent::__construct($urlSettings);
    }
    
    /**
     * Loads library CSS
     */
    protected function loadCSS()
    {
        parent::loadCSS();
?>
<link rel="stylesheet" href="lib/jquery.jgrowl/jquery.jgrowl.css" />
<?php
    }
    
    /**
     * Loads Helioviewer-specific CSS
     */
    protected function loadCustomCSS($signature)
    {
?>
    <link rel="stylesheet" href="lib/jquery.imgareaselect-0.9.5/css/imgareaselect-default.css" />
    <link rel="stylesheet" href="lib/jquery.qTip2/jquery.qtip.min.css" />
    
    <!-- Helioviewer CSS -->
    <?php
        $css = array("helioviewer-base", "helioviewer-web", "layout", 
                     "accordions", "dialogs", "media-manager", "zoom-control",  
                     "timenav", "video-gallery", "youtube");
        // CSS
        if ($this->config["compress_css"]) {
            echo "<link rel=\"stylesheet\" href=\"build/css/helioviewer.min.css?$signature\" />\n    ";
        }
        else {
            foreach($css as $file)
                printf("<link rel=\"stylesheet\" href=\"resources/css/%s.css?$signature\" />\n    ", $file);
        }
?>

    <!-- Theme Modifications -->
    <link rel="stylesheet" href="resources/css/dot-luv.css">

<?php
    }
    
    /**
     * Loads JavaScript
     */
    protected function loadJS()
    {
    if ($this->config["compress_js"]) {
    ?>
    
<!-- Library JavaScript -->
<script src="http://code.jquery.com/jquery-1.7.0.min.js" type="text/javascript"></script>
<script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/jquery-ui.min.js" type="text/javascript"></script>
<script src="lib/jquery.class/jquery.class.min.js" type="text/javascript"></script>
<script src="lib/jquery.mousewheel.3.0.6/jquery.mousewheel.min.js" type="text/javascript"></script>
<script src="lib/jquery.jgrowl/jquery.jgrowl_minimized.js" type="text/javascript"></script>
<script src="lib/jquery.imgareaselect-0.9.5/scripts/jquery.imgareaselect.pack.js" type="text/javascript"></script>
<script src="lib/date.js/date-en-US.js" type="text/javascript"></script>
<script src="lib/jquery.jfeed/build/jquery.jfeed.js" type="text/javascript"></script>
<script src="lib/jquery.qTip2/jquery.qtip.min.js" type="text/javascript"></script>
<script src="lib/jquery.xml2json/jquery.xml2json.pack.js" type="text/javascript" language="javascript"></script>
    <?php
        } else {
    ?>
    
<!-- Library JavaScript -->
<script src="http://code.jquery.com/jquery-1.7.0.js" type="text/javascript"></script>
<script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/jquery-ui.js" type="text/javascript"></script>
<script src="lib/jquery.class/jquery.class.js" type="text/javascript"></script>
<script src="lib/jquery.mousewheel.3.0.6/jquery.mousewheel.js" type="text/javascript"></script>
<script src="lib/jquery.jgrowl/jquery.jgrowl.js" type="text/javascript"></script>
<script src="lib/jquery.imgareaselect-0.9.5/scripts/jquery.imgareaselect.js" type="text/javascript"></script>
<script src="lib/date.js/date-en-US.js" type="text/javascript"></script>
<script src="lib/jquery.jfeed/build/jquery.jfeed.js" type="text/javascript"></script>
<script src="lib/jquery.qTip2/jquery.qtip.js" type="text/javascript"></script>
<script src="lib/jquery.xml2json/jquery.xml2json.js" type="text/javascript" language="javascript"></script>
<?php
}
?>
<script src="lib/jquery.json-2.2/jquery.json-2.2.min.js" type="text/javascript" ></script>
<script src="lib/jquery.cookie/jquery.cookie.min.js" type="text/javascript" ></script>
<script src="lib/Cookiejar/jquery.cookiejar.pack.js" type="text/javascript"></script>

<?php
    }

    /**
     * Loads Helioviewer-specific JavaScript
     */
    protected function loadCustomJS($signature)
    {
        echo "<!-- Helioviewer JavaScript -->\n";
        if ($this->config["compress_js"]) {
            $compressed = "build/helioviewer.min.js";
            if (!file_exists($compressed)) {
               $error = "<div style='position: absolute; width: 100%; text-align: center; top: 40%; font-size: 14px;'>
                         <img src='resources/images/logos/about.png' alt='helioviewer logo'></img><br>
                         <b>Configuration:</b> Unable to find compressed JavaScript files.
                         If you haven't already, use Apache Ant with the included build.xml file to generate 
                         compressed files.</div></body></html>";
               die($error);
            }
        
            echo "<script src=\"$compressed?$signature\" type=\"text/javascript\"></script>\n\t";
        }
        else {
            $js = array("Utility/Config.js", "Utility/HelperFunctions.js", 
                        "Tiling/Layer/Layer.js", "Tiling/Layer/TileLoader.js", "Tiling/Layer/TileLayer.js", 
                        "Tiling/Layer/HelioviewerTileLayer.js", "UI/TreeSelect.js", "UI/ImageSelectTool.js",  
                        "Utility/KeyboardManager.js", "Tiling/Manager/LayerManager.js",  
                        "Tiling/Manager/TileLayerManager.js", "Tiling/Manager/HelioviewerTileLayerManager.js", 
                        "Media/MediaManagerUI.js", "Media/MediaManager.js", "Media/MovieManager.js", 
                        "Media/MovieManagerUI.js", "Media/ScreenshotManager.js", "Media/ScreenshotManagerUI.js",  
                        "Image/JP2Image.js", "UI/TileLayerAccordion.js", "UI/MessageConsole.js",
                        "UI/TimeControls.js", "Utility/SettingsLoader.js", "Utility/UserSettings.js", 
                        "Utility/FullscreenControl.js", "Viewport/Helper/MouseCoordinates.js", 
                        "Viewport/Helper/HelioviewerMouseCoordinates.js", "Viewport/Helper/SandboxHelper.js",
                        "Viewport/Helper/ViewportMovementHelper.js", "Viewport/HelioviewerViewport.js", 
                        "HelioviewerClient.js", "HelioviewerWebClient.js", 
                        "UI/ZoomControls.js", "UI/UserVideoGallery.js", "UI/Glossary.js", 
                        "Utility/InputValidator.js", "UI/jquery.ui.dynaccordion.js");
            foreach($js as $file)
                printf("<script src=\"src/js/%s?$signature\" type=\"text/javascript\"></script>\n", $file);
        }
    }
    
    /**
     * Adds OpenGraph metatags corresponding to data loaded
     * 
     * When a custom Helioviewer.org was used to load the page, customize metatags
     * to reflect the data loaded. This improves experience when sharing links
     * on Facebook, etc.
     */
    protected function addOpenGraphTags() {
        if (isset($this->urlSettings["movieId"]) && preg_match('/^[a-zA-Z0-9]+$/', $this->urlSettings["movieId"])) {
            $this->_addOpenGraphTagsForMovie($this->urlSettings["movieId"]);
        } else if (sizeOf($this->urlSettings) >= 7) {
            $this->_addOpenGraphForSharedURL();
        } else {
            parent::addOpenGraphTags();
        }
    }
    
    /**
     * Adds OpenGraph metatags for a shared movie link
     */
    private function _addOpenGraphTagsForMovie($id)
    {
        include_once "api/src/Config.php";
        $configObj = new Config("settings/Config.ini");
        
        include_once 'api/src/Movie/HelioviewerMovie.php';
        
        $movie = new Movie_HelioviewerMovie($id, "mp4");
        $thumbnails = $movie->getPreviewImages();

        $flvURL = HV_API_ROOT_URL . "?action=downloadMovie&format=flv&id=" . $movie->publicId;
        $swfURL = HV_WEB_ROOT_URL . "/lib/flowplayer/flowplayer-3.2.7.swf?config=" . urlencode("{'clip':{'url':'$flvURL'}}");
    ?>
        <meta property="og:description" content="<?php echo $movie->getTitle();?>" />
        <meta property="og:image" content="<?php echo $thumbnails['full'];?>" />
        <meta property="og:video" content="<?php echo $swfURL;?>" />
        <meta property="og:video:width" content="<?php echo $movie->width;?>" />
        <meta property="og:video:height" content="<?php echo $movie->height;?>" />
        <meta property="og:video:type" content="application/x-shockwave-flash" />
    <?php 
    }

    /**
     * Adds OpenGraph metatags for a shared URL
     */
    private function _addOpenGraphForSharedURL() {
        // When opening shared link, include thumbnail metatags for Facebook, etc to use
        include_once "api/src/Config.php";
        $configObj = new Config("settings/Config.ini");
        
        include_once 'api/src/Helper/HelioviewerLayers.php';
        include_once 'api/src/Helper/DateTimeConversions.php';
        
        $layers = new Helper_HelioviewerLayers($_GET['imageLayers']);
        
        $screenshotParams = array(
            "action"      => "takeScreenshot",
            "display"     => true,
            "date"        => $this->urlSettings['date'],
            "imageScale"  => $this->urlSettings['imageScale'],
            "layers" => $_GET['imageLayers'],
            "x0" => $this->urlSettings['centerX'],
            "y0" => $this->urlSettings['centerY'],
            "width" => 128,
            "height" => 128
        );
        $ogImage = HV_API_ROOT_URL . "?" . http_build_query($screenshotParams);
        $ogDescription = $layers->toHumanReadableString() . " (" . toReadableISOString($this->urlSettings['date']) . " UTC)";
        ?>
        <meta property="og:description" content="<?php echo $ogDescription;?>" />
        <meta property="og:image" content="<?php echo $ogImage;?>" />
        <?php
    }

    /**
     * Prints beginning of HTML body section
     */
    protected function printBodyStart()
    {
?>
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
                <a href='<?php echo $this->config['web_root_url'];?>'>
                    <img src="<?php echo $this->config['main_logo'];?>" id="helioviewer-logo-main" alt="Helioviewer.org Logo">
                </a>
            </div>
            <br><br>
            <div class="section-header" style="margin-left:5px; margin-top: 15px;">Time</div>
            <div id="observation-controls" class="ui-widget ui-widget-content ui-corner-all shadow">
                <!--  Observation Date -->
                <div id="observation-date-container">
                    <div id="observation-date-label">Date:</div>
                    <input type="text" id="date" name="date" value="" maxlength='10'>
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
                <a href="mailto:<?php echo $this->config['contact_email']; ?>" class="light">Contact</a>
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
    Movie Duration: 
    <select id='settings-movie-length' name='movie-length'>
        <option value='3600'>1 hour</option>
        <option value='10800'>3 hours</option>
        <option value='21600'>6 hours</option>
        <option value='43200'>12 hours</option>
        <option value='86400'>1 day</option>
        <option value='172800'>2 days</option>
        <option value='604800'>1 week</option>
        <option value='2419200'>28 days</option>
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
    }
    
    /**
     * Prints the end of the script block
     */
    protected function printScriptEnd() {
?>
    // Initialize Helioviewer.org
         helioviewer = new HelioviewerWebClient("api/index.php", urlSettings, serverSettings, zoomLevels);
    });
</script>
<?php
    }
}