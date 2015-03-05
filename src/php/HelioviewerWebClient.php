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
                    'HelioviewerWebClient.js',
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
        <meta id="fb-og-description" property="og:description" content="<?php //echo $info['title'];?>" />
        <meta id="fb-og-image" property="og:image" content="<?php echo $info['thumbnails']['full'];?>" />
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
            'width'       => 1920,
            'height'      => 1920
        );

        $ogImage = HV_BACK_END.'?'.http_build_query($screenshotParams);
        $ogDescription = $layers->toHumanReadableString().' ('
                       . toReadableISOString($this->urlSettings['date'])
                       . ' UTC)';
        ?>
        <meta id="fb-og-description" property="og:description" content="<?php echo $ogDescription;?>" />
        <meta id="fb-og-image" property="og:image" content="<?php echo $ogImage;?>" />
        <?php
    }

    /**
     * Prints beginning of HTML body section
     */
    protected function printBody($signature) {
?>



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


<div style="width: 100%; height: 100%; margin: 0; padding: 0;">

    <div id="hv-header" class="user-select-none">


        <div id="loading">
            <span>
                <span>Loading Data</span>
                <span class="fa fa-circle-o-notch fa-spin"></span>
            </span>
        </div>

        <div id="logo">
            <h1>
                <span><a class="logo-icon fa fa-sun-o fa-fw" href="" title="The Open-Source Solar and Heliospheric Data Browser"></a><a class="logo-text" href="" title="The Open-Source Solar and Heliospheric Data Browser">Helioviewer.org</a></span>
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

                <div id="news-button" class="fa fa-rss fa-fw qtip-bottomleft social-button" title="Helioviewer Project Announcements."></div>

                <a id="youtube-button" class="fa fa-youtube fa-fw qtip-bottomleft social-button header-tab" title="View Helioviewer Movies Shared to YouTube."></a>

                <div id="movies-button" class="fa fa-file-video-o fa-fw qtip-bottomleft social-button" title="Create a Helioviewer Movie."></div>

                <a id="screenshots-button" class="fa fa-file-picture-o fa-fw qtip-bottomleft social-button" title="Download a screenshot of the current Helioviewer Viewport."></a>

                <a id="data-button" class="fa fa-file-code-o fa-fw qtip-bottomleft social-button" title="Request Science Data Download from External Partners."></a>

                <div id="share-button" class="fa fa-share-square-o fa-fw qtip-bottomleft social-button" title="Share the current viewport on social media."></div>
            </div>

            <div class="right" style="margin-right: 0.5em;">
                <div id="help-button" class="fa fa-question fa-fw qtip-bottomleft" href="" style="margin-left: 0.5em;" title="Get Help with Helioviewer."></div>

                <div id="settings-button" class="fa fa-cog fa-fw qtip-bottomleft" title="Edit Settings &amp; Defaults."></div>
            </div>

        </div>


        <div id="scale">
            <div id="mouse-cartesian" class="viewport-action segmented-left fa fa-cube" title="Toggle Mouse Coordinates (Cartesian)"></div><div id="mouse-polar" class="viewport-action segmented-right fa fa-dot-circle-o" style="border-left: 0;" title="Toggle Mouse Coordinates (Polar)"></div>

            <div id="earth-button" class="viewport-action fa fa-globe" title="Toggle Earth-Scale Indicator"></div>

        </div>

        <!-- Mouse coordinates display -->
        <div id="mouse-coords" style="display: none;">
            <div id="mouse-coords-x"></div>
            <div id="mouse-coords-y"></div>
        </div>

    </div>

    <div id="hv-drawer-left" class="user-select-none">
        <div class="drawer-contents">
            <div id="accordion-date" class="accordion">

                <div class="header">

                    <div class="disclosure-triangle closed">►</div>
                    <h1>Observation Date</h1>
                    <div class="right fa fa-question-circle contextual-help" title="
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
                                <input type="text" id="date" name="date" value="" pattern="[\d]{4}/[\d]{2}/[\d]{2}" maxlength="10" class="hasDatepicker"/>

                                <input id="time" name="time" value="" type="text" maxlength="8" pattern="[\d]{2}:[\d]{2}:[\d]{2}"/>

                                <div class="suffix">UTC</div>

                                <div id="timeNowBtn" class="fa fa-clock-o right" style="padding-top: 0.4em; font-size: 1em;" title="Jump to the most recent available image)s_ for the currently loaded layer(s).">
                                    <span class="ui-icon-label">NEWEST</span>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="label">Jump:</div>
                            <div class="field">

                                <select id="timestep-select" name="time-step"></select>

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
                    <h1>Image Data Layers</h1>
                    <div class="right fa fa-question-circle contextual-help" title="Up to five (5) independent image layers may be viewed simultaneously."></div>
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
                    <h1>Feature &amp; Event Annotations</h1>
                    <div class="right fa fa-question-circle contextual-help" title="Solar feature and event annotations such as marker pins, extended region polygons, and metadata."></div>
                </div>
                <div class="content">
                    <div id="eventLayerAccordion">
                        <div id="EventLayerAccordion-Container"></div>
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
                    <div class="disclosure-triangle closed">►</div>
                    <h1>Helioviewer Project News</h1>
                    <div class="right fa fa-question-circle contextual-help" title="Helioviewer Project news and tweets."></div>
                </div>
                <div class="content">
                    <div class="section">
                        <div id="social-panel" class="ui-widget ui-widget-content ui-corner-all"></div>
                    </div>
                </div>
            </div>

        </div>
    </div>


    <div id="hv-drawer-youtube" class="hv-drawer-right user-select-none">
        <div class="drawer-contents">

            <div id="accordion-youtube" class="accordion">
                <div class="header">
                    <div class="disclosure-triangle closed">►</div>
                    <h1>Movies Shared to YouTube</h1>
                    <div class="right fa fa-question-circle contextual-help" title="View YouTube movies generated by users of Helioviewer."></div>
                </div>
                <div class="content">
                    <div class="section">
                        <!-- User-Submitted Videos -->
                        <div id="user-video-gallery" class="ui-widget ui-widget-content ui-corner-all">
                            <a id="user-video-gallery-next" class="qtip-left" href="#" title="Go to next page.">
                                <div class='fa fa-triangle-1-n'></div>
                            </a>
                            <div id="user-video-gallery-main">
                                <div id="user-video-gallery-spinner"></div>
                            </div>
                            <a id="user-video-gallery-prev" class="qtip-left" href="#" title="Go to previous page.">
                                <div class='fa fa-triangle-1-s'></div>
                            </a>
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
                    <div class="disclosure-triangle closed">►</div>
                    <h1>Generate a Movie</h1>
                    <div class="right fa fa-question-circle contextual-help" title="Generate a custom move from up to three (3) image layers plus solar feature and event marker pins, labels, and extended region polygons."></div>
                </div>
                <div class="content">
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

                    </div>
                </div>
            </div>

        </div>
    </div>


    <div id="hv-drawer-screenshots" class="hv-drawer-right user-select-none">
        <div class="drawer-contents">

            <div id="accordion-screenshots" class="accordion">
                <div class="header">
                    <div class="disclosure-triangle closed">►</div>
                    <h1>Generate a Screenshot</h1>
                    <div class="right fa fa-question-circle contextual-help" title="Download a custom screenshot matching the state of your Helioviewer session, minus the user-interface."></div>
                </div>
                <div class="content">

                    <!-- Screenshot Manager -->
                    <div id='screenshot-manager-container' class='media-manager-container'>

                        <div class="section">
                            <div id='screenshot-manager-build-btns' class='media-manager-build-btns'>
                                <div style="width: 70%; margin: 0 auto;">
                                    <div id='screenshot-manager-full-viewport' class='text-btn' title='Create a screenshot using the entire viewport.'>
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
                    <div class="right fa fa-question-circle contextual-help" title="Request science data downloads via the Virtual Solar Observatory (VSO)."></div>
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
                                <div class="label">Start Date:</div>
                                <div class="field">
                                    <input type="text" id="vso-start-date" name="vso-start-date" value="" pattern="[\d]{4}/[\d]{2}/[\d]{2}" maxlength="10" class="hasDatepicker"/>

                                    <input id="vso-start-time" name="vso-start-time" value="" type="text" maxlength="8" pattern="[\d]{2}:[\d]{2}:[\d]{2}"/>

                                    <div class="suffix">UTC</div>
                                </div>
                            </div>

                            <div class="row">
                                <div class="label">End Date:</div>
                                <div class="field">
                                    <input type="text" id="vso-end-date" name="vso-end-date" value="" pattern="[\d]{4}/[\d]{2}/[\d]{2}" maxlength="10" class="hasDatepicker"/>

                                    <input id="vso-end-time" name="vso-end-time" value="" type="text" maxlength="8" pattern="[\d]{2}:[\d]{2}:[\d]{2}"/>

                                    <div class="suffix">UTC</div></div>
                            </div>

                            <div class="row">
                                <div id="vso-previews"></div>
                            </div>

                            <div class="row">
                                <div id="vso-buttons"  class="buttons">
                                    <div id="vso-sunpy" class="text-button fa fa-download inactive" title="Download a Python SunPy script that will request from the Virtual Solar Observatory the data set specified above."> SunPy Script</div>
                                    <div id="vso-ssw" class="text-button fa fa-download inactive" title="Download an IDL SolarSoft script that will request from the Virtual Solar Observatory the data set specified above."> SSW Script</div>
                                    <a id="vso-www" class="text-button fa fa-external-link-square inactive" title="Launch a Virtual Solar Observatory web page that will request the data set specified above." target="_blank"> VSO Website</a>
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
                    <div class="right fa fa-question-circle contextual-help" title="Request AIA or HMI sub-field images."></div>
                </div>
                <div class="content">
                    <div class="section">
                        <h1>Request Image Sequence from Cut-out Service</h1>
                        <div>
                            <div class="row">
                                <div class="label inactive">Start Date:</div>
                                <div class="field">
                                    <input type="text" id="sdo-start-date" name="sdo-start-date" value="" pattern="[\d]{4}/[\d]{2}/[\d]{2}" maxlength="10" class="hasDatepicker" disabled />

                                    <input id="sdo-start-time" name="sdo-start-time" value="" type="text" maxlength="8" pattern="[\d]{2}:[\d]{2}:[\d]{2}" disabled />

                                    <div class="suffix inactive">UTC</div>
                                </div>
                            </div>

                            <div class="row">
                                <div class="label inactive">End Date:</div>
                                <div class="field">
                                    <input type="text" id="sdo-end-date" name="sdo-end-date" value="" pattern="[\d]{4}/[\d]{2}/[\d]{2}" maxlength="10" class="hasDatepicker" disabled />

                                    <input id="sdo-end-time" name="sdo-end-time" value="" type="text" maxlength="8" pattern="[\d]{2}:[\d]{2}:[\d]{2}" disabled />

                                    <div class="suffix inactive">UTC</div></div>
                            </div>

                            <br />


                            <div class="row">
                                <div id='movie-manager-build-btns' class='media-manager-build-btns' style="font-size: 1.4em;">
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
                            </div>


                            <div class="row">
                                <div class="label inactive">Center (x,y):</div>
                                <div class="field">
                                    <input type="text" id="sdo-center-x" name="sdo-center-x" value="0" maxlength="6" disabled />
                                    <input id="sdo-center-y" name="sdo-center-y" value="0" type="text" maxlength="6" disabled />
                                    <div class="suffix inactive">arcsec</div>
                                </div>
                            </div>

                            <div class="row">
                                <div class="label inactive">Width:</div>
                                <div class="field" style="text-align: left;">
                                    <input type="text" id="sdo-width" name="sdo-width" value="2000" maxlength="6" disabled />
                                    <div class="suffix inactive">arcsec</div>
                                </div>
                            </div>

                            <div class="row">
                                <div class="label inactive">Height:</div>
                                <div class="field">
                                    <input type="text" id="sdo-height" name="sdo-height" value="2000" maxlength="6" disabled />
                                    <div class="suffix inactive">arcsec</div>
                                </div>
                            </div>

                            <div class="row">
                                <div id="sdo-previews"></div>
                            </div>

                            <div class="row">
                                <div id="sdo-buttons" class="buttons">
                                    <div id="sdo-ssw" class="text-button fa fa-download inactive" title="Download an IDL SolarSoft script that will request from the SDO Cut-out Service the data set specified above."> SSW Script</div>
                                    <a id="sdo-www" class="text-button fa fa-external-link-square" title="Launch a SDO Cut-out Service web page that will request the data set specified above." target="_blank"> SDO Cut-out Service Website</a>
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
                    <div class="disclosure-triangle closed">►</div>
                    <h1>Share Link to Current Viewport</h1>
                    <div class="right fa fa-question-circle contextual-help" title="Share Link to Current Viewport"></div>
                </div>
                <div class="content">
                    <div class="section">
                        <div id="helioviewer-url-box" style="font-size: 1em;">
                            <span id="helioviewer-url-box-msg"></span>
                            <form style="margin-top: 5px; text-align: center;">
                                <input type="text" id="helioviewer-url-input-box" style="width:98%;" value="http://helioviewer.org" />
                                <label for="helioviewer-url-shorten">Shorten with bit.ly? </label>
                                <input type="checkbox" id="helioviewer-url-shorten" />
                                <input type="hidden" id="helioviewer-short-url" value="" />
                                <input type="hidden" id="helioviewer-long-url" value="" />
                            </form>
                        </div>

                        <br />

                        <div id='movie-manager-build-btns' class='media-manager-build-btns'>
                            <div style="width: 65%; margin: 0 auto; font-size: 1.5em;">
                                <div id='movie-manager-full-viewport' class='text-btn qtip-left' title=''>
                                    <span class='fa fa-copy fa-fw'></span>
                                    <span style='line-height: 1.6em'>Copy Link</span>
                                </div>
                                <div id='movie-manager-select-area' class='text-btn qtip-left' style='float:right;' title=''>
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
                    <div class="disclosure-triangle closed">►</div>
                    <h1>Share to Social Networks</h1>
                    <div class="right fa fa-question-circle contextual-help" title="Share Link to Current Viewport"></div>
                </div>
                <div class="content">
                    <div class="section">
                        <div id="social-panel" class="ui-widget ui-widget-content ui-corner-all">

                            <div id='twitter' class='social-btns'>
                                <div style="width: 50%; margin: 0 auto; font-size: 1.5em;">
                                    <div id='' class='text-btn qtip-left' style="width: 100%;" title=''>
                                        <span class='fa fa-twitter-square fa-fw'></span>
                                        <span style='line-height: 1.6em'>Tweet Screenshot</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                    <div class="section">
                        <div id="social-panel" class="ui-widget ui-widget-content ui-corner-all">

                            <div id='facebook' class='social-btns'>
                                <div style="width: 50%; margin: 0 auto; font-size: 1.5em;">
                                    <div id='' class='text-btn qtip-left color-facebook' style="width: 100%;" title=''>
                                        <span class='fa fa-facebook-square fa-fw'></span>
                                        <span style='line-height: 1.6em'>Share Screenshot</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                    <div class="section">
                        <div id="social-panel" class="ui-widget ui-widget-content ui-corner-all">

                            <div id='pinterest' class='social-btns'>
                                <div style="width: 50%; margin: 0 auto; font-size: 1.5em;">
                                    <div id='' class='text-btn qtip-left' style="width: 100%;" title=''>
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
                    <div class="disclosure-triangle closed">►</div>
                    <h1>The Helioviewer Project</h1>
                    <div class="right fa fa-question-circle contextual-help" title="..."></div>
                </div>
                <div class="content">
                    <div class="section">
                        <div id="help-links-panel" class="">

                            <div id='' class='social-btns'>
                                <div style="width: 90%; margin: 0 auto; font-size: 1.5em;">
                                    <div id='' class='text-btn qtip-left' style="width: 100%;" title=''>
                                        <span class='fa fa-bookmark-o fa-fw'></span>
                                        <span style='line-height: 1.6em'>User's Guide</span>
                                    </div>
                                </div>
                            </div>

                            <div id='' class='social-btns'>
                                <div style="width: 90%; margin: 0 auto; font-size: 1.5em;">
                                    <div id='' class='text-btn qtip-left color-facebook' style="width: 100%;" title=''>
                                        <span class='fa fa-key fa-fw'></span>
                                        <span style='line-height: 1.6em'>Visual Glossary</span>
                                    </div>
                                </div>
                            </div>

                            <div id='' class='social-btns'>
                                <div style="width: 90%; margin: 0 auto; font-size: 1.5em;">
                                    <div id='' class='text-btn qtip-left' style="width: 100%;" title=''>
                                        <span class='fa fa-keyboard-o fa-fw'></span>
                                        <span style='line-height: 1.6em'>Keyboard Shortcuts</span>
                                    </div>
                                </div>
                            </div>

                            <div id='' class='social-btns'>
                                <div style="width: 90%; margin: 0 auto; font-size: 1.5em;">
                                    <div id='' class='text-btn qtip-left' style="width: 100%;" title=''>
                                        <span class='fa fa-book fa-fw'></span>
                                        <span style='line-height: 1.6em'> Documentation</span>
                                    </div>
                                </div>
                            </div>

                            <div id='' class='social-btns'>
                                <div style="width: 90%; margin: 0 auto; font-size: 1.5em;">
                                    <div id='' class='text-btn qtip-left' style="width: 100%;" title=''>
                                        <span class='fa fa-code fa-fw'></span>
                                        <span style='line-height: 1.6em'> Public API Documentation</span>
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
            </div>
            </fieldset>
        </form>
    </div>

    <!-- Usage Dialog -->
    <div id='usage-dialog'></div>

    <!-- URL Dialog -->
    <div id='url-dialog' style="display:none;">
        <div id="helioviewer-url-box">
            <span id="helioviewer-url-box-msg"></span>
            <form style="margin-top: 5px;">
                <input type="text" id="helioviewer-url-input-box" style="width:98%;" value="http://helioviewer.org" />
                <label for="helioviewer-url-shorten">Shorten with bit.ly? </label>
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
</div>


<!-- Viewport -->
<div id="helioviewer-viewport-container-outer" class="user-select-none">
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
    </div>
</div>


<!-- Footer -->
<!-- <div id="footer">
    <div id="footer-container-outer">
        <div id="footer-container-inner"> -->
            <!-- Meta links -->
<!--             <div id="footer-links">
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
</div> -->
<!-- end Footer -->


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