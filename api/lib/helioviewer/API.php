<?php
/**
 * @package Helioviewer API
 * @author Keith Hughitt <keith.hughitt@nasa.gov>
 *
 * TODO: Move JP2 Image Series functionality to ImageSeries class
 * TODO: Switch from "timestamp" -> "date" for getClosestImage and getViewerImage.
 */
/**
 * @package Helioviewer API
 */
error_reporting(E_ALL | E_STRICT | E_NOTICE);
#error_reporting(0);

class API {

    /**
     * @param array An array of parameters relevant to the API call
     * @param string ["plain-text"|"json"] The format to return results in
     */
    public function __construct ($params, $format) {
        require_once('DbConnection.php');
 
        $this->params  = $params;
        $this->format  = $format;

        require_once('Config.php');
        new Config("../settings/Config.ini");

        try {
            if (!$this->validate($params["action"]))
                throw new Exception("Invalid parameters specified for <a href='http://www.helioviewer.org/api/index.php#" . $params['action'] . "'>" . $params['action'] . "</a>.");

            if (!$this->{"_" . $params["action"]}() === 1)
                throw new Exception("Unable to execute " . $params["action"] . ". Please make sure you are using valid input and contact the web-admin if problems persist.");

        } catch (Exception $e) {
            echo "<br><b>Error:</b> ", $e->getMessage(), "<br>";
        }

        exit();
    }

    /**
     * @return int Returns "1" if the action was completed successfully.
     */
    private function _getTile () {
        require_once("HelioviewerTile.php");
        $tile = new HelioviewerTile($this->params['uri'], $this->params['x'], $this->params['y'], $this->params['zoom'], $this->params['ts'],
                         $this->params['jp2Width'], $this->params['jp2Height'], $this->params['jp2Scale'], $this->params['offsetX'], $this->params['offsetY'],
                         $this->params['format'],  $this->params['obs'], $this->params['inst'], $this->params['det'], $this->params['meas']);

        return 1;
    }

    /**
     * @return int Returns "1" if the action was completed successfully.
     * http://localhost/hv/api/index.php?action=getClosestImage&date=2003-10-05T00:00:00Z&source=0&server=api/index.php
     * TODO: Add a more elegant check for local vs. remote server
     */
    private function _getClosestImage () {
        // TILE_SERVER_1
        if ($this->params['server'] === 'api/index.php') {
            require_once('ImgIndex.php');
            $imgIndex = new ImgIndex(new DbConnection());
    
            // Search by source id
            if (isset($this->params['sourceId']))
                $result = $imgIndex->getClosestImage($this->params['date'], $this->params['sourceId'], false);

                // Search by human-readable parameters
            else {
                foreach(array('observatory', 'instrument', 'detector', 'measurement') as $field)
                    $parameters["$field"] = $this->params[$field];

                $result = $imgIndex->getClosestImage($this->params['date'], $parameters);
            }
                
            if ($this->format == "json")
                header('Content-type: application/json');
                
            echo json_encode($result);
            
        // TILE_SERVER_2 (Eventually, will need to generalize to support N tile servers)
        } else {
            $source = $this->params['sourceId'];
            $date   = $this->params['date'];
            $url =  HV_TILE_SERVER_2 . "?action=getClosestImage&sourceId=$source&date=$date&server=1";
            
            header('Content-Type: application/json');
            echo file_get_contents($url);
        }
        return 1;
    }
    
    /**
     * getDataSources
     * @return Returns a tree representing the available data sources
     */
    private function _getDataSources () {
        require('lib/helioviewer/ImgIndex.php');
        
        // NOTE: Make sure to remove database specification after testing completed!
        $imgIndex = new ImgIndex(new DbConnection($dbname = "helioviewer"));
        $dataSources = json_encode($imgIndex->getDataSources());
        
        if ($this->format == "json")
            header('Content-type: application/json');

        print $dataSources;
        
        return 1;
    }

    /**
     * getViewerImage (aka "getCompositeImage")
     *
     * Example usage: (outdated!)
     *         http://helioviewer.org/api/index.php?action=getViewerImage&layers=SOH_EIT_EIT_195&timestamps=1065312000&zoomLevel=10&tileSize=512&xRange=-1,0&yRange=-1,0
     *         http://helioviewer.org/api/index.php?action=getViewerImage&layers=SOH_EIT_EIT_195,SOH_LAS_0C2_0WL&timestamps=1065312000,1065312360&zoomLevel=13&tileSize=512&xRange=-1,0&yRange=-1,0&edges=false
     * 
     * Notes:
     *         Building a UTC timestamp in javascript
     *             var d = new Date(Date.UTC(2003, 9, 5));
     *             var unix_ts = d.getTime() * 1000;
     * 
     *         TODO
     *             * If no params are passed, print out API usage description (and possibly a query builder form)...
     *             * Add support for fuzzy times/var/www/hv/jp2/v2009051tamp matching. Could default to exact matching unless user specifically requests fuzzy date-matching.
     *             * Separate out layer details into a Layer PHP class?
     *             * Update getViewerImage to use "layers" instead of "layers" + "timestamps"
     *
     * @return int Returns "1" if the action was completed successfully.
     *
     */
    private function _getViewerImage () {
        require('lib/helioviewer/CompositeImage.php');

        //Create and display composite image
        $img = CompositeImage::compositeImageFromQuery($params);
        $img->printImage();

        return 1;
    }

    /**
     * @return int Returns "1" if the action was completed successfully.
     */
    private function _getJP2Image () {
        require('lib/helioviewer/ImgIndex.php');
        $imgIndex = new ImgIndex(new DbConnection());

        $date = $this->params['date'];

        // Search by source id
        if (isset($this->params['source'])) {
            $filepath = $imgIndex->getJP2FilePath($date, $this->params['source']);
        }
        // Search by human-readable parameters
        else {
            foreach(array('observatory', 'instrument', 'detector', 'measurement') as $field)
                $parameters["$field"] = $this->params[$field];

            $filepath = $imgIndex->getJP2FilePath($date, $parameters);
        }

        $uri = HV_JP2_DIR . $filepath;
        
        // http url (relative path)getUTC
        if ($this->params['getRelativeURL']) {
            $jp2RootRegex = "/" . preg_replace("/\//", "\/", HV_JP2_DIR) . "/";
            $url = preg_replace($jp2RootRegex, "", $uri);
            echo $url;
        }
        
        // http url (full path)
        else if ($this->params['getURL']) {
            $webRootRegex = "/" . preg_replace("/\//", "\/", HV_JP2_DIR) . "/";
        //echo HV_JP2_ROOT_URL . "<br>";
        //echo $webRootRegex . "<br>";
        //echo $uri . "<br>";
            $url = preg_replace($webRootRegex, HV_JP2_ROOT_URL, $uri);
            echo $url;
        }
        
        // jpip url
        else if ($this->params['getJPIP']) {
            $webRootRegex = "/" . preg_replace("/\//", "\/", HV_JP2_DIR) . "/";
            $jpip = "jpip" . substr(preg_replace($webRootRegex, HV_JPIP_ROOT_URL, $uri), 4);
            echo $jpip;
        }
        
        // jp2 image
        else {
            $fp = fopen($uri, 'r');
            $stat = stat($uri);
            
            $exploded = explode("/", $filepath);
            $filename = end($exploded);
            
            header("Content-Length: " . $stat['size']);
            header("Content-Type: "   . image_type_to_mime_type(IMAGETYPE_JP2));
            header("Content-Disposition: attachment; filename=\"$filename\"");

            $contents = fread($fp, $stat['size']);

            echo $contents;
            fclose($fp);
        }

        return 1;
    }

    /**
     * @return int Returns "1" if the action was completed successfully.
     * 
     *  Converting timestamp to a PHP DateTime:
     *     $dt = new DateTime("@$startTime");
     *     echo $dt->format(DATE_ISO8601);
     *     date_add($dt, new DateInterval("T" . $cadence . "S"));
     *  (See http://us2.php.net/manual/en/function.date-create.php)
     */
    private function _getJP2ImageSeries () {
        $startTime   = toUnixTimestamp($this->params['startTime']);
        $endTime     = toUnixTimestamp($this->params['endTime']);
        $cadence     = $this->params['cadence'];
        $format      = $this->params['format'];
        $jpip        = $this->params['getJPIP'];
        
        $observatory = $this->params['observatory'];
        $instrument  = $this->params['instrument'];
        $detector    = $this->params['detector'];
        $measurement = $this->params['measurement'];

        // Create a temporary directory to store image-  (TODO: Move this + other directory creation to installation script)
        $tmpdir = HV_TMP_ROOT_DIR . "/movies/";
        if (!file_exists($tmpdir)) {
            mkdir($tmpdir);
            chmod($tmpdir, 0777);
        }

        // Filename (From,To,By)
        $filename = implode("_", array($observatory, $instrument, $detector, $measurement, "F$startTime", "T$endTime", "B$cadence")) . "." . strtolower($format);
        
        // Filepath
        $filepath = "$tmpdir" . $filename;

        // URL
        $url = HV_TMP_ROOT_URL . "/movies/" . $filename;

        // If the file doesn't exist already, create it
        if (!file_exists($filepath))
            $this->buildJP2ImageSeries($filepath);

        // Output the file/jpip URL
        if ($jpip) {        
            $webRootRegex = "/" . preg_replace("/\//", "\/", HV_ROOT_DIR) . "/";
            $mj2 = "jpip" . substr(preg_replace($webRootRegex, HV_WEB_ROOT_URL, $url), 4);
            echo $mj2;
        } else {
            echo $url;
        }
        return 1;
    }
    
    /**
     * @param string The filename to use
     * Constructs a JPX/MJ2 image series
     */
    private function ftp serversbuildJP2ImageSeries ($output_file) {
        require_once('ImgIndex.php');
        
        $startTime   = toUnixTimestamp($this->params['startTime']);
        $endTime     = toUnixTimestamp($this->params['endTime']);
        $cadence     = $this->params['cadence'];
        $format      = $this->params['format'];
        $links       = $this->params['links'];
        $debug       = $this->params['debug'];

        // Layer information
        foreach(array('observatory', 'instrument', 'detector', 'measurement') as $field) {
          $src["$field"] = $this->params[$field];
        }

        // Connect to database
        $imgIndex = new ImgIndex(new DbConnection());

        // Determine number of frames to grab
        $timeInSecs = $endTime - $startTime;
        $numFrames  = min(HV_MAX_MOVIE_FRAMES, ceil($timeInSecs / $cadence));
        
        // Timer
        $time = $startTime;

        $images = array();

        // Get nearest JP2 images to each time-step
        for ($i = 0; $i < $numFrames; $i++) {
            $isoDate = toISOString(parseUnixTimestamp($time));
            $jp2 = HV_JP2_DIR . $imgIndex->getJP2FilePath($isoDate, $src, $debug);
            array_push($images, $jp2);
            $time += $cadence;
        }

        // Remove redundant entries
        $images = array_unique($images);

        // Append filepaths to kdu_merge command
        $cmd = HV_KDU_MERGE_BIN . " -i ";
        foreach($images as $jp2) {
            $cmd .= "$jp2,";
        }

        // Drop trailing comma
        $cmd = substr($cmd, 0, -1);

        // Virtual JPX files
        if ($links)
            $cmd .= " -links";
        
        $cmd .= " -o $output_file";
    
        // MJ2 Creation
        if ($format == "MJ2")
            $cmd .= " -mj2_tracks P:0-@25";
    
        //die($cmd);
    
        // Execute kdu_merge command
        exec(HV_PATH_CMD . " " . escapeshellcmd($cmd), $output, $return);

    }
    
    /**
     * @return int Returns "1" if the action was completed successfully.
     * NOTE: Add option to specify XML vs. JSON... FITS vs. Entire header?
     */
    private function _getJP2Header () {
        $filepath = HV_JP2_DIR . $this->params["file"];

        // Query header information using Exiftool
        $cmd = HV_EXIF_TOOL . " $filepath | grep Fits";
        exec($cmd, $out, $ret);

        $fits = array();
        foreach ($out as $index => $line) {
            $data = explode(":", $line);
            $param = substr(strtoupper(str_replace(" ", "", $data[0])), 8);
            $value = $data[1];
            array_push($fits, $param . ": " . $value);
        }

        // Sort FITS keys        
        // sort($fits);

        if ($this->format == "json") {
            header('Content-type: application/json');
            echo json_encode($fits);
        }
        else {
            echo json_encode($fits);
        }

        return 1;
    }

    /**
     * @return int Returns "1" if the action was completed successfully.
     */
    private function _getEventCatalogs () {
        if ($this->format == "text") {
            header("Content-type: text/plain");
            $url = HV_EVENT_SERVER_URL . $_SERVER["QUERY_STRING"] . "&debug=1";
        }
        else {
            header("Content-type: application/json");
            $url = HV_EVENT_SERVER_URL . "action=getEventCatalogs";
        }
        echo file_get_contents($url);        
        return 1;
    }

    /**
     * @return int Returns "1" if the action was completed successfully.
     */
    private function _getEvents () {
        if ($this->format == "text") {
            header("Content-type: text/plain");
            $url = HV_EVENT_SERVER_URL . $_SERVER["QUERY_STRING"] . "&debug=1";
        }
        else {
            header("Content-type: application/json");
            $url = HV_EVENT_SERVER_URL . "action=getEvents&date=" . $this->params["date"] . "&windowSize=" . $this->params["windowSize"] . "&catalogs=" . $this->params["catalogs"];
        }
        echo file_get_contents($url);
        return 1;
    }

    /**
     * @return int Returns "1" if the action was completed successfully.
     */
    private function _launchJHelioviewer () {
        require_once('lib/helioviewer/JHV.php');
        if ((isset($this->params['files'])) && ($this->params['files'] != "")) {
            $jhv = new JHV($this->params['files']);
        } else {
            $jhv = new JHV();
        }
        $jhv->launch();
    }

    /**
     * @description All possible parameters: startDate, zoomLevel, numFrames, frameRate, timeStep, layers, imageSize ("x,y"),
     *     filename, edges, sharpen, format.
     * 
     * API example: http://localhost/helioviewer/api/index.php?action=buildMovie&startDate=1041465600&zoomLevel=13&numFrames=20
     *     &frameRate=8&timeStep=86400&layers=SOH,EIT,EIT,304,1,100x0,1034,0,1034,-230,-215/SOH,LAS,0C2,0WL,1,100x0,1174,28,1110,-1,0
     *     &imageSize=588,556&filename=example&sharpen=false&edges=false
     * 
     * Note that filename does NOT have the . extension on it. The reason for this is that in the media settings pop-up dialog,
     * there is no way of knowing ahead of time whether the image is a .png, .tif, .flv, etc, and in the case of movies, the file is 
     * both a .flv and .mov/.asf/.mp4
     * 
     * @return int Returns "1" if the action was completed successfully.
     */
    private function _buildMovie () {
        require_once('Movie.php');

        // Required parameters
        $startDate = $this->params['startDate'];
        $zoomLevel = $this->params['zoomLevel'];
        $numFrames = $this->params['numFrames'];
        $frameRate = $this->params['frameRate'];
        $timeStep  = $this->params['timeStep'];
        $quality   = $this->params['quality'];
           
        // Layerstrings are separated by "/"
        $layerStrings = explode("/", $this->params['layers']);

        $imageCoords = explode(",", $this->params['imageSize']);
        $imageSize      = array("width" => $imageCoords[0], "height" => $imageCoords[1]);
        $filename       = $this->params['filename'];
   class JHV {
    private $files;
    
    public function __construct($files=Null) {
        $this->files = $files;        
    }
    
    public function launch() {
        header('content-type: application/x-java-jnlp-file');
        header('content-disposition: attachment; filename="JHelioviewer.jnlp"'); 
        echo '<?xml version="1.0" encoding="utf-8"?>' . "\n";
?>
<jnlp spec="1.0+" codebase="http://achilles.nascom.nasa.gov/~dmueller/jhv/" href="JHelioviewer.jnlp">
    <information>    
        <title>JHelioviewer</title>   
        <vendor>ESA</vendor>   
        <homepage href="index.html" />
        <description>JHelioviewer web launcher</description>   
        <offline-allowed />  
    </information> 
    
    <resources>    
        <j2se version="1.5+" initial-heap-size="256M" max-heap-size="1500M"/>     
        <jar href="JHelioviewer.jar" />  
    </resources>  
    
    <security>    
        <all-permissions />  
    </security> 
    
    <application-desc main-class="org.helioviewer.JavaHelioViewer">
<?php if (isset($this->files)) {
    echo "        <argument>$this->files</argument>\n";
}
?>
    </application-desc>
</jnlp>

<?php
    }
}
?>         
        $hqFormat  = $this->params['format'];
        //$hqFormat = "mp4";
        
        // Optional parameters
        $options = array();
        $options['enhanceEdges'] = $this->params['edges'] || false;
        $options['sharpen']      = $this->params['sharpen'] || false;    
                
        //Check to make sure values are acceptable
        try {    
            //Limit number of layers to three
            if (strlen($this->params['layers']) == 0) {
                throw new Exception("Invalid layer choices! You must specify 1-3 command-separate layernames.");
            }

            //Limit number of frames
            if (($numFrames < 10) || ($numFrames > HV_MAX_MOVIE_FRAMES)) {
                throw new Exception("Invalid number of frames. Number of frames should be at least 10 and no more than " . HV_MAX_MOVIE_FRAMES . ".");
            }

            $layers = $this->_formatLayerStrings($layerStrings);

            $movie = new Movie($layers, $startDate, $zoomLevel, $numFrames, $frameRate, $hqFormat, $options, $timeStep, $imageSize, $filename, $quality);
            $movie->buildMovie();

        } catch(Exception $e) {
            echo 'Error: ' .$e->getMessage();
            exit();
        }

        return 1;
    }

    /**
     * @description Obtains layer information, ranges of pixels visible, and the date being looked at and creates a composite image
     *                 (a Screenshot) of all the layers. 
     * 
     * All possible parameters: obsDate, zoomLevel, layers, imageSize, filename, edges, sharpen
     * 
     * API example: http://localhost/helioviewer/api/index.php?action=takeScreenshot&obsDate=1041465600&zoomLevel=13
     *    &layers=SOH,EIT,EIT,304,1,100x0,1034,0,1034,-230,-215/SOH,LAS,0C2,0WL,1,100x0,1174,28,1110,-1,0
     *     &imageSize=588,556&filename=example&sharpen=false&edges=false
     * 
     * Note that filename does NOT have the . extension on it. The reason for this is that in the media settings pop-up dialog,
     * there is no way of knowing ahead of time whether the image is a .png, .tif, .flv, etc, and in the case of movies, the file is 
     * both a .flv and .mov/.asf/.mp4
     * 
     * @return Returns 1 if the action was completed successfully.
     */
    private function _takeScreenshot() {
        require_once('Screenshot.php');
        
        $obsDate   = $this->params['obsDate'];
        $zoomLevel = $this->params['zoomLevel'];
        $quality   = $this->params['quality'];

        $layerStrings = explode("/", $this->params['layers']);
        
        $imgCoords = explode(",", $this->params['imageSize']);
        $imageSize = array("width" => $imgCoords[0], "height" => $imgCoords[1]);
        
        $filename  = $this->params['filename'];
        
        $options = array();
        $options['enhanceEdges'] = $this->params['edges'] || false;
        $options['sharpen']      = $this->params['sharpen'] || false;    

        try {
            if(sizeOf($layerStrings) < 1) 
                throw new Exception("Invalid layer choices! You must specify at least 1 layer.");

            $layers = $this->_formatLayerStrings($layerStrings);
            
            $screenshot = new Screenshot($obsDate, $zoomLevel, $options, $imageSize, $filename, $quality);    
            $screenshot->buildImages($layers);
            
            $composite = $screenshot->getComposite();
            if(!file_exists($composite))
                throw new Exception("The requested screenshot is either unavailable or does not exist.");

            if($this->params == $_GET) {                
                header('Content-type: image/png');
                echo file_get_contents($composite);
            }
            
            else {
                header('Content-type: application/json');
                // Replace '/var/www/helioviewer', or wherever the directory is, with 'http://localhost/helioviewer' so it can be displayed.
                echo json_encode(str_replace(HV_ROOT_DIR, HV_WEB_ROOT_URL, $composite));
            }
        }
        catch(Exception $e) {
            echo 'Error: ' . $e->getMessage();
            exit();
        }
        
        return 1;
    }

    /**
     * @description Queries the database to get the real jp2 image's width and height for that particular layer. Needed because
     *                     the width and height used in tileLayer.js are not the actual height and width and it mixes things up when
     *                     trying to align images for screenshots and movies.
     *
     * Required parameters: observatory, instrument, detector, measurement.
     * @return 1 on success
     */
/*
    private function _getJP2Dimensions() {
        require_once('ImgIndex.php');
        $imgIndex = new ImgIndex(new DbConnection());
    
        $obs  = $this->params['observatory'];
        $inst = $this->params['instrument'];
        $det  = $this->params['detector'];
        $meas = $this->params['measurement'];
        
        $dimensions = $imgIndex->getJP2Dimensions($obs, $inst, $det, $meas);
        
        echo $dimensions['width'] . 'x' . $dimensions['height'];
        
        return 1;
    }
*/    
        
    /**
     * @description gets the movie url and loads it into MC Mediaplayer
     * @return int Returns "1" if the action was completed successfully.
     */
    private function _playMovie () {
        $url = $this->params['url'];
        $width  = $this->params['width'];
        $height = $this->params['height'];

        ?>
            <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
            <html>
            <head>
                <title>Helioviewer.org QuickMovie</title>
            </head>
            <body style="background-color: black; color: #FFF;">
                <!-- MC Media Player -->
                <div style="text-align: center;">
                    <script type="text/javascript">
                        playerFile = "http://www.mcmediaplayer.com/public/mcmp_0.8.swf";
                        fpFileURL = "<?php print $url?>";
                        fpButtonSize = "48x48";
                        fpAction = "play";
                        cpHidePanel = "mouseout";
                        cpHideDelay = "1";
                        defaultEndAction = "repeat";
                        playerSize = "<?php print $width . 'x' . $height?>";
                    </script>
                    <script type="text/javascript" src="http://www.mcmediaplayer.com/public/mcmp_0.8.js"></script>
                    <!-- / MC Media Player -->
                </div>
                <br>
            </body>
            </html>
        <?php
        return 1;
    }
    
    /**
     * @description 'Opens' the requested file in the current window as an attachment, which pops up the "Save file as" dialog.
     * @TODO test this to make sure it works in all browsers.
     * @return 1 on success.
     */
    private function _downloadFile() {
        $url = $this->params['url'];
        
        // Convert web url into directory url so stat() works.
        // Need to use stat() instead of filesize() because filesize fails for every file on Linux
        // due to security permissions with apache. To get the file size, do $stat['size']
        $url = str_replace(HV_WEB_ROOT_URL, HV_ROOT_DIR, $url);
        $stat = stat($url);

        if(strlen($url) > 1) {
            header("Pragma: public"); 
            header("Expires: 0");
            header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
            header("Cache-Control: private",false); // required for certain browsers 
            header("Content-Disposition: attachment; filename=\"" . basename($url) . "\";" );
            header("Content-Transfer-Encoding: binary");

            header("Content-Length: " . $stat['size']); 

            echo file_get_contents($url);
        }
        else {
            print("Error: Problem retrieving file.");
        }
        return 1;
    }
    
    /**
     * sendEmail
     * TODO: CAPTCHA, Server-side security
     * @return 
     */
    private function _sendEmail() {
        // The message
        //$message = "Line 1\nLine 2\nLine 3";

        // In case any of our lines are larger than 70 characters, we should use wordwrap()
        //$message = wordwrap($message, 70);

        // Send
        //mail('test@mail.com', 'My Subject', $message);   
    }
    
    /**
     * @description Takes the string representation of a layer from the javascript and formats it so that only useful/necessary information is included.
     * @return {Array} $formatted -- The array containing properly formatted strings
     * @param {Array} $layers -- an array of strings in the format: "obs,inst,det,meas,visible,opacityxxStart,xSize,yStart,ySize"
     *                     The extra "x" was put in the middle so that the string could be broken in half and parsing one half by itself 
     *                     rather than parsing 10 different strings and putting the half that didn't need parsing back together.
     */    
    private function _formatLayerStrings($layers) {
        $formatted = array();
        
        foreach($layers as $layer) {
            $layerInfo = explode("x", $layer);    

            // $meta is now: [xStart,xSize,yStart,ySize,hcOffsetx,hcOffsety]            
            $meta = split(",", $layerInfo[1]);
            $offsetX = $meta[4];
            $offsetY = $meta[5];
            
            // Add a "+" in front of positive numbers so that the offsets are readable by imagemagick
            $meta[4] = ($offsetX >= 0? "+" : "") . $offsetX;
            $meta[5] = ($offsetY >= 0? "+" : "") . $offsetY;

            // Extract relevant information from $layerInfo[0] (obs,inst,det,meas,visible,opacity). 
            $rawName = explode(",", $layerInfo[0]);
            $opacity = $rawName[5];
            //Get rid of the "visibility" boolean in the middle of the string.
            array_splice($rawName, 4);

            $name = implode("_", $rawName);
            // Stick opacity on the end. the $image string now looks like: "obs_inst_det_meas,xStart,xSize,yStart,ySize,hcOffsetx,hcOffsety,opacity"
            $image = $name . "," . implode(",", $meta) . "," . $opacity;
            array_push($formatted, $image);
        }

        return $formatted;
    }

    /**
     * @description Checks to make sure all required parameters were passed in.
     * @param {Array} $fields is an array containing any required fields, such as 'layers', 'zoomLevel', etc.
     * @return 1 on success
     */    
    private function _checkForMissingParams($fields) {
        try{
            foreach($fields as $field) {
                if(empty($this->params[$field])) {
                    throw new Exception("Invalid value for $field.");
                }
            }
        }
        catch (Exception $e) {
            echo 'Error: ' . $e->getMessage();
            exit();
        }
        return 1;
    }
    
    /**
     * Typecast boolean strings or unset optional params to booleans
     *
     */
    private function _fixBools($fields) {
        foreach($fields as $field) {
            if (!isset($this->params[$field]))
                $this->params[$field] = false;
            else {
                if (strtolower($this->params[$field]) === "true")
                    $this->params[$field] = true;
                else
                    $this->params[$field] = false;	
            }
        }
        
        return 1;
    }

    /**
     * @return bool Input validity.
     * 
     * Action-specific code for validating input. Currently only input for external-use API's are
     * validated. All input destined for database use is secured at time of SQL construction. 
     */
    private function validate ($action) {
        // Some useful regexes
        $layer_regex            = "/^[a-zA-Z0-9]{12}$/";
        $layer_list_regex       = "/^[a-zA-Z0-9]{12}(,[a-zA-Z0-9]{12})*$/";
        $timestamp_regex        = "/^[0-9]{1,10}$/";
        $timestamp_list_regex   = "/^[0-9]{1,10}(,[0-9]{1,10})*$/";
        $coordinate_range_regex = "/^[0-9]{1,2},[0-9]{1,2}$/";

        switch ($action) {
            case "getTile":
                break;
            case "getClosestImage":
                break;
            case "getDataSources":
                break;
            case "getViewerImage":
                if (!isset($this->params["layers"]) or !preg_match($layer_list_regex, $this->params["layers"]))
                    return false;
                if (!isset($this->params["timestamps"]) or !preg_match($timestamp_list_regex, $this->params["timestamps"]))
                    return false;
                if (!isset($this->params["zoomLevel"]) or !is_numeric($this->params["zoomLevel"]) or $this->params["zoomLevel"] < 0 or $this->params["zoomLevel"] > 20)
                    return false;
                if (!isset($this->params["xRange"]))
                    return false;
                if (!isset($this->params["yRange"]))
                    return false;                
                break;
            case "getJP2Header":
                if (!isset($this->params["file"]))
                    return false;
                break;
            case "getEventCatalogs":
                break;
            case "getEvents":
                break;
            case "getLayerAvailability":
                break;
            case "getJP2Image":
            	$bools = array("getURL", "getRelativeURL", "getJPIP");
            	$this->_fixBools($bools);
                break;
            case "getJP2ImageSeries":
            	$bools = array("getJPIP", "links", "debug");
            	$this->_fixBools($bools);
            	
            	if ($this->params['links'] && ($this->params['format'] != "JPX"))
            	   die('<b>Error</b>: Format must be set to "JPX" in order to create a linked image series.');
            	
                break;
            case "launchJHelioviewer":
                break;
                
            case "buildMovie":
                // Check to make sure all required parameters were passed in before proceeding.
                $checkArray = array(
                    'startDate', 
                    'zoomLevel', 
                    'numFrames', 
                    'frameRate', 
                    'timeStep',
                    'layers',
                    'imageSize',
                    'filename'
                );
                $this->_checkForMissingParams($checkArray);
                break;
                
            case "playMovie":
                break;
            case "sendEmail":
                break;
                
            case "takeScreenshot":
                // Check to make sure all required parameters were passed in before proceeding.
                $checkArray = array(
                    'obsDate', 
                    'zoomLevel', 
                    'layers',
                    'imageSize',
                    'filename'
                );
                $this->_checkForMissingParams($checkArray);
                break;
                
            case "getJP2Dimensions":
                break;
            case "downloadFile":
                break;
            default:
                throw new Exception("Invalid action specified. See the <a href='http://www.helioviewer.org/api/'>API Documentation</a> for a list of valid actions.");        
        }

        return true;
    }
}

/**
 * @return int Number of seconds since Jan 1, 1970 UTC
 * @param string $datestr ISO 8601 Date string, e.g. "2003-10-05T00:00:00Z"
 */
function toUnixTimestamp($dateStr) {
    date_default_timezone_set('UTC');
    return strtotime($dateStr);
}

/**
 * @return DateTime A PHP DateTime object
 * @param int $timestamp The number of seconds since Jan 1, 1970 UTC
 */
function parseUnixTimestamp($timestamp) {
    date_default_timezone_set('UTC');
    return new DateTime("@$timestamp");
}

/**
 * @return string Returns a date formatted for MySQL queries (2003-10-05 00:00:00)
 * @param DateTime $date
 */
function toMySQLDateString($date) {
    return $date->format("Y-m-d H:i:s");
}

/**
 * Parses an ISO 8601 date string with one formatted for MySQL
 * @return string
 * @param object $dateStr
 */
function isoDateToMySQL($dateStr) {
    return str_replace("Z", "", str_replace("T", " ", $dateStr));
}

/**
 * @return ISO 8601 Date string (2003-10-05T00:00:00Z)
 * @param DateTime $date
 */
function toISOString($date) {
    return $date->format("Y-m-d\TH:i:s\Z");
}

?>
