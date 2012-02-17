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
    
    /**
     * Initializes an instance of a Helioviewer client
     */
    public function __construct($ini)
    {
        // Load Server Configuration
        if ((!file_exists($ini)) || (!$this->config = parse_ini_file($ini))) {
            die("Missing config file!");
        }
        
        // Settings specified via URL parameters
        $this->urlSettings = $this->_parseURLSettings();
        
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
     * prints HTML body close
     */    
    protected function printBodyEnd()
    {
        echo "</body>";
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
    <link rel="stylesheet" href="lib/jquery.jgrowl/jquery.jgrowl.css" />
    <link rel="stylesheet" href="lib/jquery.imgareaselect-0.9.5/css/imgareaselect-default.css" />
    <link rel="stylesheet" href="lib/jquery.qTip2/jquery.qtip.min.css" />
    
    <!-- Helioviewer CSS -->
    <?php
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


    /**
     * Loads Helioviewer-specific CSS files
     */
    protected function loadCustomCSS($signature)
    {
    }
    
    /**
     * Parses any URL parameters specified
     * 
     * @return void
     */
    private function _parseURLSettings() {
        $urlSettings = array();
        
        // imageLayers (string)
        if (isset($_GET['imageLayers'])) {
            if ($_GET['imageLayers'][0] == "[") {
                $imageLayersString = substr($_GET['imageLayers'],1,-1);
            } else {
                $imageLayersString = $_GET['imageLayers'];
            }
            $urlSettings['imageLayers'] = preg_split("/\],\[/", $imageLayersString);
        }
        
        // centerX (float)
        if (isset($_GET['centerX']))
            $urlSettings['centerX'] = (float) $_GET['centerX'];
        
        // centerY (float)
        if (isset($_GET['centerY']))
            $urlSettings['centerY'] = (float) $_GET['centerY'];
    
        // date (string)
        if (isset($_GET['date']))
            $urlSettings['date'] = $_GET['date'];
    
        // imageScale (float)
        if (isset($_GET['imageScale']))
            $urlSettings['imageScale'] = (float) $_GET['imageScale'];
        
        // movieId (string)
        if(isset($_GET['movieId']))
            $urlSettings['movieId'] = $_GET['movieId'];
        
        // embed (boolean)
        if(isset($_GET['embed']) && ($_GET['embed'] == "true" || $_GET['embed'] == "1")) {
            $urlSettings['embed'] = true;
        } else {
            $urlSettings['embed'] = false;
        }
        
        // debug (string)
        if(isset($_GET['debug']) && ($_GET['debug'] == "true" || $_GET['debug'] == "1")) {
            $urlSettings['debug'] = true;
        } else {
            $urlSettings['debug'] = false;
        }

        return $urlSettings;
    }

}