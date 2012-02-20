<?php 
/**
 * HelioviewerEmbeddedClient class definition
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
 * HelioviewerEmbeddedClient class definition
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
class HelioviewerEmbeddedClient extends HelioviewerClient
{
    /**
     * Initializes a Helioviewer.org embedded instance
     */
    public function __construct($ini)
    {
        parent::__construct($ini);
    }
    
    /**
     * Loads Helioviewer-specific CSS
     */
    protected function loadCustomCSS($signature)
    {
    ?>

    <!-- Helioviewer CSS -->
    <?php

        $css = array("helioviewer-base", "helioviewer-embedded", "zoom-control");
        
        // CSS
        if ($this->config["compress_css"]) {
            echo "<link rel=\"stylesheet\" href=\"build/css/helioviewer-embed.min.css?$signature\" />\n    ";
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
<script src="lib/date.js/date-en-US.js" type="text/javascript"></script>
<script src="lib/jquery.qTip2/jquery.qtip.min.js" type="text/javascript"></script>
    <?php
        } else {
    ?>
    
<!-- Library JavaScript -->
<script src="http://code.jquery.com/jquery-1.7.0.js" type="text/javascript"></script>
<script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/jquery-ui.js" type="text/javascript"></script>
<script src="lib/jquery.class/jquery.class.js" type="text/javascript"></script>
<script src="lib/jquery.mousewheel.3.0.6/jquery.mousewheel.js" type="text/javascript"></script>
<script src="lib/jquery.jgrowl/jquery.jgrowl.js" type="text/javascript"></script>
<script src="lib/date.js/date-en-US.js" type="text/javascript"></script>
<script src="lib/jquery.qTip2/jquery.qtip.js" type="text/javascript"></script>
<?php
}
    }

    /**
     * Loads Helioviewer-specific JavaScript
     */
    protected function loadCustomJS($signature)
    {
        echo "<!-- Helioviewer JavaScript -->\n";
        if ($this->config["compress_js"]) {
            $compressed = "build/helioviewer-embed.min.js";
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
                        "Tiling/Layer/HelioviewerTileLayer.js", "Utility/KeyboardManager.js", "Tiling/Manager/LayerManager.js", 
                        "Tiling/Manager/TileLayerManager.js", "Tiling/Manager/HelioviewerTileLayerManager.js", 
                        "Image/JP2Image.js", "UI/MessageConsole.js", "Viewport/Helper/MouseCoordinates.js", "Viewport/Viewport.js", 
                        "Viewport/Helper/HelioviewerMouseCoordinates.js", "Viewport/Helper/SandboxHelper.js",
                        "Viewport/Helper/ViewportMovementHelper.js", "Viewport/HelioviewerViewport.js", 
                        "Viewport/ViewportController.js", "Helioviewer.js", "UI/ZoomControls.js", "Utility/InputValidator.js");
            foreach($js as $file)
                printf("<script src=\"src/js/%s?$signature\" type=\"text/javascript\"></script>\n", $file);
        }
    }
    
    /**
     * Prints beginning of HTML body section
     */
    protected function printBodyStart()
    {
?>
<body>
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
<!-- end Body -->

<?php
    }
}