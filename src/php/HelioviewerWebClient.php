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
 * @author   Jeff Stys <jeff.stys@nasa.gov>
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
 * @author   Jeff Stys <jeff.stys@nasa.gov>
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class HelioviewerWebClient extends HelioviewerClient {
    /**
     * Initializes a Helioviewer.org instance
     */
    public function __construct($urlSettings) {

        include_once 'src/php/Config.php';
        $this->configObj = new Config('settings/Config.ini');

        $this->compressedJSFile  = 'helioviewer.min.js';
        $this->compressedCSSFile = 'helioviewer.min.css';

        parent::__construct($urlSettings);
    }

    /**
     * Loads library CSS
     */
    protected function loadCSS() {
        parent::loadCSS();
?>
    <link rel="stylesheet" href="lib/jquery.jgrowl/jquery.jgrowl.css" />
    <link rel="stylesheet" href="lib/jquery.qTip2/jquery.qtip.min.css" />
    <link rel="stylesheet" href="lib/jquery.imgareaselect-0.9.8/css/imgareaselect-default.css" />

    <!-- jQuery UI Theme Modifications -->
    <link rel="stylesheet" href="resources/css/dot-luv.css">

<?php
    }

    /**
     * Loads Helioviewer-specific CSS
     */
    protected function loadCustomCSS($signature, $includes=array()) {
        $css = array("helioviewer-web", "layout", "accordions", "dialogs",
                     "events", "media-manager", "timenav", "video-gallery",
                     "youtube", "font-awesome.min");
        parent::loadCustomCSS($signature, $css);
    }

    /**
     * Loads JavaScript
     */
    protected function loadJS() {
        parent::loadJS();

        if ($this->config["compress_js"]) {
    ?>
<script src="lib/jquery.jgrowl/jquery.jgrowl_minimized.js" type="text/javascript"></script>
<script src="lib/jquery.imgareaselect-0.9.8/scripts/jquery.imgareaselect.pack.js" type="text/javascript"></script>
<script src="lib/jquery.jfeed/build/jquery.jfeed.js" type="text/javascript"></script>
<script src="lib/jquery.xml2json/jquery.xml2json.pack.js" type="text/javascript" language="javascript"></script>
<script src="lib/jquery.jsTree-1.0rc/jquery.jstree.min.js"></script>
<?php
        } else {
    ?>
<script src="lib/jquery.jgrowl/jquery.jgrowl.js" type="text/javascript"></script>
<script src="lib/jquery.imgareaselect-0.9.8/scripts/jquery.imgareaselect.js" type="text/javascript"></script>
<script src="lib/jquery.jfeed/build/jquery.jfeed.js" type="text/javascript"></script>
<script src="lib/jquery.xml2json/jquery.xml2json.js" type="text/javascript" language="javascript"></script>
<script src="lib/jquery.jsTree-1.0rc/jquery.jstree.js"></script>
<?php
        }
    }

    /**
     * Loads Helioviewer-specific JavaScript
     */
    protected function loadCustomJS($signature, $includes=array()) {
        $js = array('UI/TreeSelect.js', 'UI/ImageSelectTool.js',
                    'Media/MediaManagerUI.js', 'Media/MediaManager.js',
                    'Media/MovieManager.js', 'Media/MovieManagerUI.js',
                    'Media/ScreenshotManager.js',
                    'Media/ScreenshotManagerUI.js',
                    'UI/TileLayerAccordion.js',
                    'UI/EventLayerAccordion.js', 'UI/MessageConsole.js',
                    'UI/TimeControls.js', 'Utility/FullscreenControl.js',
                    'Utility/MorescreenControl.js', 'HelioviewerWebClient.js',
                    'UI/UserVideoGallery.js', 'UI/Glossary.js',
                    'UI/jquery.ui.dynaccordion.js');
        parent::loadCustomJS($signature, $js);
    }

    /**
     * Adds OpenGraph metatags corresponding to data loaded
     *
     * When a custom Helioviewer.org was used to load the page, customize
     * metatags
     * to reflect the data loaded. This improves experience when sharing links
     * on Facebook, etc.
     */
    protected function addOpenGraphTags() {

        if ( isset($this->urlSettings['movieId']) &&
             preg_match('/^[a-zA-Z0-9]+$/', $this->urlSettings["movieId"]) ) {

            try {
                $this->_addOpenGraphTagsForMovie(
                    $this->urlSettings['movieId'] );
                return;
            }
            catch (Exception $e) {
                unset($this->urlSettings['movieId']);
            }
        }

        if ( sizeOf($this->urlSettings) >= 7 ) {
            $this->_addOpenGraphForSharedURL();
        }
        else {
            parent::addOpenGraphTags();
        }
    }

    /**
     * Adds OpenGraph metatags for a shared movie link
     */
    private function _addOpenGraphTagsForMovie($id) {

        // Forward remote requests
        if ( HV_BACK_END !== 'api/index.php' ) {
            $params = array(
                'action' => 'getMovieStatus',
                'format' => 'mp4',
                'id'     => $id
            );

            include_once 'src/php/Net/Proxy.php';

            $proxy = new Net_Proxy(HV_BACK_END.'?');
            $info = json_decode($proxy->post($params, true), true);

            $flvURL = HV_BACK_END.'?action=downloadMovie&format=flv&id='.$id;
            $swfURL = substr(HV_BACK_END, 0, -14)
                    . '/lib/flowplayer/flowplayer-5.4.6.swf?config="'
                    . urlencode("{'clip':{'url':'$flvURL'}}");
        }
        else {
            // Otherwise process locally
            include_once 'src/php/Movie/HelioviewerMovie.php';

            $movie = new Movie_HelioviewerMovie($id, 'mp4');
            $info = array(
                'title'      => $movie->getTitle(),
                'thumbnails' => $movie->getPreviewImages(),
                'width'      => $movie->width,
                'height'     => $movie->height
            );

            $flvURL = HV_BACK_END.'?action=downloadMovie&format=flv&id='
                    . $id;
            $swfURL = HV_WEB_ROOT_URL
                    . '/lib/flowplayer/flowplayer-3.2.8.swf?config='
                    . urlencode("{'clip':{'url':'$flvURL'}}");
        }
?>
        <meta property="og:description" content="<?php //echo $info['title'];?>" />
        <meta property="og:image" content="<?php echo $info['thumbnails']['full'];?>" />
        <meta property="og:video" content="<?php echo $swfURL;?>" />
        <meta property="og:video:width" content="<?php echo $info['width'];?>" />
        <meta property="og:video:height" content="<?php echo $info['height'];?>" />
        <meta property="og:video:type" content="application/x-shockwave-flash" />
<?php
    }

    /**
     * Adds OpenGraph metatags for a shared URL
     */
    private function _addOpenGraphForSharedURL() {

        // When opening shared link, include thumbnail metatags for Facebook, etc to use

        include_once 'src/php/Helper/HelioviewerLayers.php';
        include_once 'src/php/Helper/DateTimeConversions.php';

        $layers = new Helper_HelioviewerLayers($_GET['imageLayers']);

        $screenshotParams = array(
            'action'      => 'takeScreenshot',
            'display'     => true,
            'date'        => $this->urlSettings['date'],
            'imageScale'  => $this->urlSettings['imageScale'],
            'layers'      => $_GET['imageLayers'],
            'x0'          => $this->urlSettings['centerX'],
            'y0'          => $this->urlSettings['centerY'],
            'width'       => 128,
            'height'      => 128
        );

        $ogImage = HV_BACK_END.'?'.http_build_query($screenshotParams);
        $ogDescription = $layers->toHumanReadableString().' ('
                       . toReadableISOString($this->urlSettings['date'])
                       . ' UTC)';
        ?>
        <meta property="og:description" content="<?php echo $ogDescription;?>" />
        <meta property="og:image" content="<?php echo $ogImage;?>" />
        <?php
    }

    /**
     * Prints beginning of HTML body section
     */
    protected function printBody($signature) {
?>

<!-- Header -->
<div id="header"></div>


<div style="width: 100%; height: 100%; margin: 0; padding: 0;">
    <div id="helioviewer-header">
        <div class="logo">
            <h1>
                <a class="fa fa-sun-o fa-fw" href="" title="Copy Link to the Current View."></a>
                <a href="" title="The Open-Source Solar and Heliospheric Data Browser">Helioviewer.org</a>
            </h1>
        </div>
        <div class="menus">

            <div class="left">
                <a class="fa fa-link fa-fw" href="" title="Copy Link to the Current View."></a>
                <a class="fa fa-twitter-square fa-fw" href="" title="Tweet Short Link to the Current View."></a>
                <a class="fa fa-facebook-square fa-fw" href="" title="Post Link and Preview Image of Current View to Facebook."></a>
                <a class="fa fa-pinterest-square fa-fw" href="" title="Pin Image of Current View to Pinterest."></a>
                <a class="fa fa-youtube-square fa-fw" href="http://www.youtube.com/user/HelioviewerScience" target="_blank" title="Visit the HelioviewerScience YouTube Channel."></a>
            </div>

            <div class="right" style="margin-right: 0.5em;">
                <a class="fa fa-question fa-fw" href="" style="margin-left: 0.5em;"title="Get Help with Helioviewer."></a>
                <a class="fa fa-cog fa-fw" href="" title="Edit Settings &amp; Defaults."></a>
            </div>
        </div>
    </div>


            <div id="helioviewer-drawer-left">
                <div class="drawer-tab drawer-tab-left">Data Sources</div>
                <div class="drawer-contents">

                    <div id="accordion-date" class="accordion">

                        <div class="header">
                            <div class="disclosure-triangle closed">►</div>
                            <h1>Observation Date</h1>
                            <div class="right ui-icon icon-question contextual-help" title="Changing the Observation Date will update the Viewport with image(s) matching the new date and time.

Use the 'Jump' controls to browse forward and backward in time by a regular interval.

Note that when an image is not available for the exact date and time you selected, the closest available match will be displayed instead."></div>
                        </div>

                        <div class="content">

                            <div class="row">
                                <div class="label">Date:</div>
                                <div class="field">
                                    <input type="text" id="date" name="date" value="" pattern="[\d]{4}/[\d]{2}/[\d]{2}" maxlength="10" class="hasDatepicker">

                                    <input id="time" name="time" value="" type="text" maxlength="8" pattern="[\d]{2}:[\d]{2}:[\d]{2}">

                                    <div class="suffix">UTC</div>
                                </div>
                                <div id="ui-datepicker-trigger" class="ui-icon icon-calendar-1 ui-datepicker-trigger" title="Calendar-Style Date Picker"></div>
                            </div>

                            <div class="row">
                                <div class="label">Jump:</div>
                                <div class="field">

                                    <select id="timestep-select" name="time-step">
                                        <option value="1">1 Sec</option>
                                        <option value="60">1 Min</option>
                                        <option value="300">5 Mins</option>
                                        <option value="900">15 Mins</option>
                                        <option value="3600">1 Hour</option>
                                        <option value="21600">6 Hours</option>
                                        <option value="43200">12 Hours</option>
                                        <option value="86400" selected>1 Day</option>
                                        <option value="604800">1 Week</option>
                                        <option value="2419200">28 Days</option>
                                        <option value="31556926">1 Year</option>
                                    </select>

                                    <div class="inline ui-icon icon-arrow-circle-left" style="font-size: 1.5em;" title="Jump Backward in Time."></div>
                                    <div class="inline ui-icon icon-arrow-circle-right" style="font-size: 1.5em;" title="Jump Forward in Time."></div>
                                </div>
                                <div class="ui-icon icon-clock-1 right" style="padding-top: 0.4em; font-size: 1em;" title="Jump to the Current Date and Time."><span class="ui-icon-label">Now</span></div>
                            </div>

                        </div>

                    </div>

                    <div id="accordion-images" class="accordion">
                        <div class="header">
                            <div class="disclosure-triangle closed">►</div>
                            <h1>Image Data Layers</h1>
                        </div>
                        <div class="content">zzz</div>
                    </div>

                    <div id="accordion-sfe" class="accordion">
                        <div class="header">
                            <div class="disclosure-triangle closed">►</div>
                            <h1>Solar Features &amp; Events</h1>
                        </div>
                        <div class="content">zzz</div>
                    </div>

                </div>
            </div>


            <div id="helioviewer-drawer-right">
                <div class="drawer-tab drawer-tab-right">Data Export</div>
                <div class="drawer-contents">

                    <div id="accordion-news" class="accordion">
                        <div class="header">
                            <div class="disclosure-triangle closed">►</div>
                            <h1>Helioviewer Project News</h1>
                        </div>
                        <div class="content">
                            <div class="blog">
                                <a class="left ui-icon icon-comment-1" style="font-size: 2em;" href="http://blog.helioviewer.org/" target="_blank" title="Go to the Helioviewer Project Blog."></a>
                                <div class="text"><a href="http://blog.helioviewer.org/2014/03/04/helioviewer-api-tools-for-multiple-platforms-now-available/" target="_blank">Helioviewer API tools for multiple platforms now available...</a></div>
                            </div>
                            <div class="tweet">
                                <a class="left ui-icon icon-twitter-alt" style="font-size: 2em;" href="http://twitter.com/helioviewer" target="_blank" title="Go to the Helioviewer Project Twitter Account."></a>
                                <div class="text">Slinky, snaky reversing eruption <a href="http://www.youtube.com/watch?v=11GADUVSCUY" target="_blank" rel="nofollow">youtube.com/watch?v=11GADUVSCUY</a> shared by goggog67</div>
                            </div>
                        </div>
                    </div>

                    <div id="accordion-youtube" class="accordion">
                        <div class="header">
                            <div class="disclosure-triangle closed">►</div>
                            <h1>Movies Shared to YouTube</h1>
                        </div>
                        <div class="content">zzz</div>
                    </div>

                    <div id="accordion-generate" class="accordion">
                        <div class="header">
                            <div class="disclosure-triangle closed">►</div>
                            <h1>Generate Movies or Screenshots</h1>
                        </div>
                        <div class="content">zzz</div>
                    </div>

                    <div id="accordion-vso" class="accordion">
                        <div class="header">
                            <div class="disclosure-triangle closed">►</div>
                            <h1>Virtual Solar Observatory</h1>
                        </div>
                        <div class="content">zzz</div>
                    </div>

                    <div id="accordion-sdo" class="accordion">
                        <div class="header">
                            <div class="disclosure-triangle closed">►</div>
                            <h1>SDO AIA/HMI Cut-out Service</h1>
                        </div>
                        <div class="content">zzz</div>
                    </div>

                    <div id="accordion-hek" class="accordion">
                        <div class="header">
                            <div class="disclosure-triangle closed">►</div>
                            <h1>Heliophysics Event Knowledgebase</h1>
                        </div>
                        <div class="content">zzz</div>
                    </div>

                </div>
            </div>
            <div id="helioviewer-drawer-bottom">
                <div class="drawer-tab drawer-tab-bottom">Data Timeline</div>
                <div class="drawer-contents"></div>
            </div>
        </div>
</div>



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
            <div id="link-button" class="text-btn qtip-topleft" title="Generate a direct link to the current view.">
                <span class="ui-icon ui-icon-link" style="float: left;"></span>
                <span style="line-height: 1.6em">Link</span>
            </div>

            <!-- Movie button -->
            <div id="movie-button" class="text-btn qtip-topleft" title="Generate a movie based on the current view.">
                <span class="ui-icon ui-icon-video" style="float: left;"></span>
                <span style="line-height: 1.6em">Movie</span>
            </div>

            <!-- Screenshot button -->
            <div id="screenshot-button" class="text-btn qtip-topleft" title="Save a screenshot of the current view.">
                <span class="ui-icon ui-icon-image" style="float: left;"></span>
                <span style="line-height: 1.6em">Screenshot</span>
            </div>

            <!-- Settings button -->
            <div id="settings-button" class="text-btn qtip-topleft" title="Configure Helioviewer.org user preferences.">
                <span class="ui-icon ui-icon-gear" style="float: left;"></span>
                <span style="line-height: 1.6em">Settings</span>
            </div>

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
                    <span id='movie-settings-toggle-advanced' style='display:inline-block;' class='ui-icon ui-icon-gear qtip-left' title='Advanced movie settings'></span>
                    <span id='movie-settings-toggle-help' style='display:inline-block;' class='ui-icon ui-icon-help qtip-left' title='Movie settings help'></span>
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
            </div>

            <!-- Movie settings validation console -->
            <div id='movie-settings-validation-console' style='display:none; text-align: center; margin: 7px 1px 0px; padding: 0.5em; border: 1px solid #fa5f4d; color: #333; background: #fa8072;' class='ui-corner-all'>

            </div>
        </div>

        <!-- Image area select tool -->
        <div id='image-area-select-buttons'>
            <div id='done-selecting-image' class='text-btn'>
                <span class='ui-icon ui-icon-circle-check'></span>
                <span>OK</span>
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



<!-- Body -->
<div id="colmask">
    <div id="colmid">
        <div id="colright">

        <!-- Middle Column -->
        <div id="col1wrap">
            <div id="col1pad">
                <div id="col1">

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
            <br/>
            <div class="section-header" style="margin-left:5px;">Time</div>
            <div id="observation-controls" class="ui-widget ui-widget-content ui-corner-all shadow">
                <!--  Observation Date -->
                <div id="observation-date-container">
                    <div id="observation-date-label">Date:</div>
                    <input type="text" id="date" name="date" value="" pattern="[\d]{4}/[\d]{2}/[\d]{2}" maxlength='10'>
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

            <br/>
            <div id="tileLayerAccordion"></div>
            <br/>
            <div id="eventLayerAccordion"></div>

        </div>

        <!-- Right Column -->
        <div id="col3">
            <div id="right-col-header" style='height: 11px'></div>
            <!-- Recent Blog Entries -->
            <div style="margin: 0 0 4px 5px;" class="section-header">
                <a href="<?php echo HV_NEWS_URL; ?>" target="_blank">Helioviewer Project News</a></div>
            <div id="social-panel" class="ui-widget ui-widget-content ui-corner-all shadow"></div>

            <!-- User-Submitted Videos -->
            <div id="user-video-gallery-header" class="section-header">
                <a href="http://www.youtube.com/user/HelioviewerScience" target="_blank" style='text-decoration: none;'>
                    <img id='youtube-logo' src='resources/images/youtube_79x32.png' alt='YouTube Logo' />
                </a>
                <span style='position: relative;'>User-Generated Movies</span>
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
                <a href="http://helioviewer.org/wiki/Helioviewer.org_User_Guide_2.4.0" class="light" target="_blank">Help</a>
                <a id="helioviewer-glossary" class="light" href="dialogs/glossary.html">Glossary</a>
                <a id="helioviewer-about" class="light" href="dialogs/about.php">About</a>
                <a id="helioviewer-usage" class="light" href="dialogs/usage.php">Usage Tips</a>
                <a href="http://wiki.helioviewer.org/wiki/Main_Page" class="light" target="_blank">Wiki</a>
                <a href="http://blog.helioviewer.org/" class="light" target="_blank">Blog</a>
                <a href="http://jhelioviewer.org" class="light" target="_blank">JHelioviewer</a>
                <a href="http://api.helioviewer.org/docs/v2/" class="light" target="_blank">Public API</a>
                <a href="https://twitter.com/Helioviewer" class="light" title="Follow @helioviewer on Twitter" target="_blank">@helioviewer</a>
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

<!-- Glossary dialog -->
<div id='glossary-dialog'></div>

<!-- About dialog -->
<div id='about-dialog'></div>

<!-- Layer choice dialog -->
<div id='layer-choice-dialog'></div>

<!-- Settings dialog -->
<div id='settings-dialog'>
    <form id='helioviewer-settings'>
        <!-- Initial observation date -->
        <fieldset id='helioviewer-settings-date'>
        <legend>When starting Helioviewer.org:</legend>
            <div style='padding: 10px;'>
                <input id="settings-date-latest" type="radio" name="date" value="latest" /><label for="settings-date-latest">Display most recent images available</label><br />
                <input id="settings-date-previous" type="radio" name="date" value="last-used" /><label for="settings-date-previous">Display images from previous visit</label><br />
            </div>
        </fieldset>

        <!-- Other -->
        <fieldset id='helioviewer-settings-other'>
        <legend>When using Helioviewer.org:</legend>
        <div style='padding:10px;'>
            <input type="checkbox" name="latest-image-option" id="settings-latest-image" value="true" />
            <label for="settings-latest-image">Update viewport every 5 minutes</label><br />
        </div>
        </fieldset>
    </form>
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
        <img id='youtube-logo-large' src="resources/images/youtube_79x32.png" alt='YouTube logo' />
        <h1>Upload Video</h1>
        <br />
        <form id="youtube-video-info" action="<?php echo HV_BACK_END; ?>/index.php" method="post">
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
    parent::printBody($signature);
    }

    /**
     * Prints the end of the script block
     */
    protected function printScript() {
        parent::printScript();
?>
    // Initialize Helioviewer.org
    helioviewer = new HelioviewerWebClient(urlSettings, serverSettings, zoomLevels);

    // Play movie if id is specified
    if (urlSettings.movieId) {
        helioviewer.loadMovie(urlSettings.movieId);
    }
    });
<?php
    }
}
?>