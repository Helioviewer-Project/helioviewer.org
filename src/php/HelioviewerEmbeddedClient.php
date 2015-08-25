<?php
/**
 * HelioviewerEmbeddedClient class definition
 *
 * Helioviewer.org HTML web client
 *
 * @category Application
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     https://github.com/Helioviewer-Project
 */
require_once "HelioviewerClient.php";

class HelioviewerEmbeddedClient extends HelioviewerClient
{
    /**
     * Initializes a Helioviewer.org embedded instance
     */
    public function __construct($ini)
    {
        $this->compressedJSFile  = "helioviewer-embed.min.js";
        $this->compressedCSSFile = "helioviewer-embed.min.css";

        parent::__construct($ini);

        # Log embed API call if stats are enabled
        if ($this->config['enable_statistics_collection']) {
            date_default_timezone_set('UTC');

            # load config
            require_once "src/php/Config.php";
            $config = new Config("settings/Config.ini");

            # record in statistics table
            require_once 'src/php/Database/Statistics.php';
            $statistics = new Database_Statistics();
            $statistics->log("embed");
        }
    }

    /**
     * Loads Helioviewer-specific JavaScript
     */
    protected function loadCustomJS($signature, $includes=array())
    {
        parent::loadCustomJS($signature, array("HelioviewerEmbeddedClient.js"));
    }

    /**
     * Loads Helioviewer-specific CSS
     */
    protected function loadCustomCSS($signature, $includes=array())
    {
        echo "\n";
        parent::loadCustomCSS($signature, array("helioviewer-embed"));
    }

    /**
     * Prints beginning of HTML body section
     */
    protected function printBody($signature)
    {
?>

<!-- Viewport -->
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

<!-- Mouse coordinates display -->
<div id="mouse-coords" style="display: none;">
    <div id="mouse-coords-x"></div>
    <div id="mouse-coords-y"></div>
</div>

    <?php
    parent::printBody($signature);
    }

    /**
     * Prints the end of the script block
     */
    protected function printScript() {
        parent::printScript();
        $link = sprintf("http://%s%s", $_SERVER['HTTP_HOST'], str_replace("&hideWatermark=false", "",
                                                              str_replace("output=embed", "", $_SERVER['REQUEST_URI'])));
?>
    // Initialize Helioviewer.org
        helioviewer = new HelioviewerEmbeddedClient(urlSettings, serverSettings, zoomLevels, "<?php echo $link;?>");
    });
<?php
    }
}
