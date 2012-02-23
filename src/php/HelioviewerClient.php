<?php 
/**
 * HelioviewerClient class definition
 * 
 * An abstract base class representing a generic Helioviewer client instance
 *
 * PHP version 5
 *
 * @category Application
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
/**
 * HelioviewerClient class definition
 * 
 * An abstract base class representing a generic Helioviewer client instance
 *
 * PHP version 5
 *
 * @category Application
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
abstract class HelioviewerClient
{
    protected $config;
    protected $urlSettings;
    protected $compressedJSFile;
    protected $compressedCSSFile;
    
    /**
     * Initializes an instance of a Helioviewer client
     */
    public function __construct($urlSettings, $ini="settings/Config.ini")
    {
        // Load Server Configuration
        if ((!file_exists($ini)) || (!$this->config = parse_ini_file($ini))) {
            die("Missing config file!");
        }
        
        // Settings specified via URL parameters
        $this->urlSettings = $urlSettings;
        
        // Debug support
        if ($this->urlSettings['debug']) {
            $this->config['compress_js'] = $this->config['compress_css'] = false;
        }
        
        // Begin HTML header and print OpenGraph metatags
        $this->printHeaderStart();
        $this->addOpenGraphTags();
        
        // Version string
        $signature = "rev=" + $this->config['disable_cache'] ? time() : $this->config['build_num']; 
        
        // CSS includes
        $this->loadCSS();
        $this->loadCustomCSS($signature);
        
        // Google Analytics
        if ($this->config['google_analytics_id']) {
            $this->loadGoogleAnalytics();
        }
        
        // AddThis
        if ($this->config['addthis_analytics_id']) {
            $this->loadAddThis();
        }
        
        $this->printHeaderEnd();
        $this->printBodyStart();
        $this->loadJS();
        $this->loadCustomJS($signature);
        $this->printScriptStart();
        $this->printScriptEnd();
        $this->printBodyEnd();
    }
    
    /**
     * Prints the HTML header
     */
    protected function printHeaderStart() {
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php printf("<!-- Helioviewer.org 2.2.2 (rev. %s), %s -->\n", $this->config["build_num"], $this->config["last_update"]);?>
    <title>Helioviewer.org - Solar and heliospheric image visualization tool</title>
    <meta charset="utf-8" />
    <meta name="description" content="Helioviewer.org - Solar and heliospheric image visualization tool" />
    <meta name="keywords" content="Helioviewer, JPEG 2000, JP2, sun, solar, heliosphere, solar physics, viewer, visualization, space, astronomy, SOHO, SDO, STEREO, AIA, HMI, EUVI, COR, EIT, LASCO, SDO, MDI, coronagraph, " />
    <?php if ($this->config["disable_cache"]) echo "<meta http-equiv=\"Cache-Control\" content=\"No-Cache\" />";?>
    
    <link rel="shortcut icon" href="favicon.ico" />
    
    <!--OpenGraph Metadata-->
    <meta property="og:title" content="Helioviewer.org" />
<?        
    }
    
    /**
     * Prints HTML header closing element
     */
    protected function printHeaderEnd()
    {
        echo "</head>\n";   
    }
    
    /**
     * Prints beginning of HTML body section
     */
    protected function printBodyStart()
    {
        echo "<body>";
    }

    /**
     * Prints HTML body close
     */    
    protected function printBodyEnd()
    {
?>
</body>
</html>
<?php
    }
    
    /**
     * Prints main script block beginning
     */
    protected function printScriptStart() {
?>

<!-- Launch Helioviewer -->
<script type="text/javascript">
    var serverSettings, settingsJSON, urlSettings, debug;

    $(function () {
        <?php
            printf("settingsJSON = %s;\n", json_encode($this->config));
            
            // Compute acceptible zoom values
            $zoomLevels = array();
            
            for($imageScale = $this->config["min_image_scale"]; $imageScale <= $this->config["max_image_scale"]; $imageScale = $imageScale * 2) {
                $zoomLevels[] = round($imageScale, 8);
            }
            
            printf("\tzoomLevels = %s;\n", json_encode($zoomLevels));

            // Convert to JSON
            printf("\turlSettings = %s;\n", json_encode($this->urlSettings));
        ?>
        serverSettings = new Config(settingsJSON).toArray();

    <?php
    }
    
    /**
     * Prints main script block end
     */
    protected function printScriptEnd() {
        echo "</script>";
    }
    
    /**
     * Adds OpenGraph meta tags
     */
    protected function addOpenGraphTags() {
?>
    <meta property="og:description" content="Solar and heliospheric image visualization tool." />
    <meta property="og:image" content="http://helioviewer.org/resources/images/logos/hvlogo1s_transparent.png" />
<?php
    }
    
    /**
     * Loads CSS includes
     */
    protected function loadCSS()
    {
    ?>

    <!-- Library CSS -->
    <link rel="stylesheet" href="lib/yui-2.8.2r1/reset-fonts.css" />
    <link rel="stylesheet" href="lib/jquery.ui-1.8/css/dot-luv-modified/jquery-ui-1.8.12.custom.css" />  
<?php
    }
    
    /**
     * Loads Helioviewer-specific CSS files
     */
    protected function loadCustomCSS($signature, $includes=array()) {
?>
    <!-- Helioviewer CSS -->
    <?php
        $css = array_merge(array("helioviewer-base", "zoom-control"), $includes);
        
        // CSS
        if ($this->config["compress_css"]) {
            echo "<link rel=\"stylesheet\" href=\"build/css/{$this->compressedCSSFile}?$signature\" />\n    ";
        }
        else {
            foreach($css as $file)
                printf("<link rel=\"stylesheet\" href=\"resources/css/%s.css?$signature\" />\n    ", $file);
        }
    }
    
    /**
     * Loads JavaScript includes
     */
    protected function loadJS() {
    if ($this->config["compress_js"]) {
    ?>
<!-- Library JavaScript -->
<script src="http://code.jquery.com/jquery-1.7.0.min.js" type="text/javascript"></script>
<script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/jquery-ui.min.js" type="text/javascript"></script>
<script src="lib/jquery.class/jquery.class.min.js" type="text/javascript"></script>
<script src="lib/jquery.mousewheel.3.0.6/jquery.mousewheel.min.js" type="text/javascript"></script>
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
<script src="lib/date.js/date-en-US.js" type="text/javascript"></script>
<script src="lib/jquery.qTip2/jquery.qtip.js" type="text/javascript"></script>
<?php
}
?>
<script src="lib/jquery.json-2.2/jquery.json-2.2.min.js" type="text/javascript" ></script>
<script src="lib/jquery.cookie/jquery.cookie.min.js" type="text/javascript" ></script>
<script src="lib/Cookiejar/jquery.cookiejar.pack.js" type="text/javascript"></script>
<?php
    }
    
    /**
     * Loads Helioviewer-specific JS files
     */
    protected function loadCustomJS($signature, $includes=array()) {
        echo "\n<!-- Helioviewer JavaScript -->\n";
        if ($this->config["compress_js"]) {
            if (!file_exists("build/" . $this->compressedJSFile)) {
               $error = "<div style='position: absolute; width: 100%; text-align: center; top: 40%; font-size: 14px;'>
                         <img src='resources/images/logos/about.png' alt='helioviewer logo'></img><br>
                         <b>Configuration:</b> Unable to find compressed JavaScript files.
                         If you haven't already, use Apache Ant with the included build.xml file to generate 
                         compressed files.</div></body></html>";
               die($error);
            }
        
            echo "<script src=\"build/{$this->compressedJSFile}?$signature\" type=\"text/javascript\"></script>\n\t";
        }
        else {
            $js = array("Utility/Config.js", "Utility/HelperFunctions.js", 
                        "Tiling/Layer/Layer.js", "Tiling/Layer/TileLoader.js", "Tiling/Layer/TileLayer.js", 
                        "Tiling/Layer/HelioviewerTileLayer.js", "Utility/KeyboardManager.js", "Tiling/Manager/LayerManager.js", 
                        "Tiling/Manager/TileLayerManager.js", "Tiling/Manager/HelioviewerTileLayerManager.js", 
                        "Image/JP2Image.js", "Viewport/Helper/MouseCoordinates.js", 
                        "Viewport/Helper/HelioviewerMouseCoordinates.js", "Viewport/Helper/SandboxHelper.js",
                        "Viewport/Helper/ViewportMovementHelper.js", "Viewport/HelioviewerViewport.js", 
                        "HelioviewerClient.js", "UI/ZoomControls.js", "Utility/InputValidator.js",
                        "Utility/SettingsLoader.js", "Utility/UserSettings.js");
            foreach(array_merge($js, $includes) as $file)
                printf("<script src=\"src/js/%s?$signature\" type=\"text/javascript\"></script>\n", $file);
        }
    }
    
    /**
     * Loads Google Analytics
     */
    protected function loadGoogleAnalytics()
    {
?>
    <!-- Google Analytics -->
    <script type="text/javascript">
        var _gaq = _gaq || [];
        _gaq.push(['_setAccount', '<?php echo $this->config["google_analytics_id"];?>']);
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
    
    /**
     * Loads AddThis support
     */
    protected function loadAddThis()
    {
?>

    <!-- AddThis -->
    <script type="text/javascript">
        var addthis_config = {
            data_track_clickback: true,
            pubid: "<?php echo $this->config['addthis_analytics_id'];?>",
            data_ga_property: "<?php echo $this->config['google_analytics_id'];?>"
        };
    </script>
    <script type="text/javascript" src="http://s7.addthis.com/js/250/addthis_widget.js#async=1"></script>        
<?php
    }


}