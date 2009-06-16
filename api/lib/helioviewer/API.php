<?php
/**
 * @package Helioviewer API
 * @author Keith Hughitt <Vincent.K.Hughitt@nasa.gov>
 *
 * TODO: Move JP2 Image Series functionality to ImageSeries class
 */
/**
 * @package Helioviewer API
 */
error_reporting(E_ALL | E_STRICT | E_NOTICE);
class API {

    /**
     * @param array An array of parameters relevant to the API call
     * @param string ["plain-text"|"json"] The format to return results in
     */
    public function __construct ($params, $format) {
    	require_once('DbConnection.php');
        $this->params = $params;
        $this->format = $format;

        $_SERVER['HTTP_HOST'] == "localhost" ? require_once('../settings/Config.php') : require_once('../settings/Config.Server.php');

        try {
            if (!$this->validate($params["action"]))
                throw new Exception("Invalid parameters specified for <a href='http://www.helioviewer.org/api/index.php#" . $params['action'] . "'>" . $params['action'] . "</a>.");

            #if (!call_user_func(array("API" ,"_" . $params["action"])))
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
        require_once("Tile.php");
        $tile = new Tile($this->params['uri'], $this->params['zoom'], $this->params['x'], $this->params['y'], $this->params['ts']);

        return 1;
    }

    /**
     * @return int Returns "1" if the action was completed successfully.
     */
    private function _getClosestImage () {
        // TILE_SERVER_1
        if ($this->params['server'] == 1) {
            require_once('ImgIndex.php');
            $imgIndex = new ImgIndex(new DbConnection());
    
            $queryForField = 'abbreviation';
            foreach(array('observatory', 'instrument', 'detector', 'measurement') as $field) {
                $src["$field.$queryForField"] = $this->params[$field];
            }
    
            $result = $imgIndex->getClosestImage($this->params['timestamp'], $src);
    
            if ($this->format == "json") {
                header('Content-type: application/json');
                echo json_encode($result);
            } else {
                echo json_encode($result);
            }
        // TILE_SERVER_2 (Eventually, will need to generalize to support N tile servers)
        } else {
            $obs  = $this->params['observatory'];
            $inst = $this->params['instrument'];
            $det  = $this->params['detector'];
            $meas = $this->params['measurement'];
            $ts   = $this->params['timestamp'];
            
            $url =  Config::TILE_SERVER_2 . "?action=getClosestImage&observatory=$obs&instrument=$inst&detector=$det&measurement=$meas&timestamp=$ts&server=1";
            
            header('Content-Type: application/json');
            echo file_get_contents($url);
        }
        return 1;
    }

    /**
     * getViewerImage (aka "getCompositeImage")
     *
     * Example usage:
     *         http://helioviewer.org/api/index.php?action=getViewerImage&layers=SOHEITEIT195&timestamps=1065312000&zoomLevel=10&tileSize=512&xRange=-1,0&yRange=-1,0
     *         http://helioviewer.org/api/index.php?action=getViewerImage&layers=SOHEITEIT195,SOHLAS0C20WL&timestamps=1065312000,1065312360&zoomLevel=13&tileSize=512&xRange=-1,0&yRange=-1,0&edges=false
     * 
     * Notes:
     *         Building a UTC timestamp in javascript
     *             var d = new Date(Date.UTC(2003, 9, 5));
     *             var unix_ts = d.getTime() * 1000;
     * 
     *         TODO
     *             * If no params are passed, print out API usage description (and possibly a query builder form)...
     *             * Add support for fuzzy timestamp matching. Could default to exact matching unless user specifically requests fuzzy date-matching.
     *          * Separate out layer details into a Layer PHP class?
     *
     * @return int Returns "1" if the action was completed successfully.
     *
     */
    private function _getViewerImage () {
        require('lib/helioviewer/CompositeImage.php');

        //Process query string
        try {
            // Extract timestamps
            $timestamps = explode(",", $this->params['timestamps']);
            if (strlen($this->params['timestamps']) == 0) {
                throw new Exception("Error: Incorrect number of timestamps specified!");
            }

            // Region of interest
            $x = explode(",", $this->params['xRange']);
            $y = explode(",", $this->params['yRange']);

            $xRange = array();
            $xRange['start'] = $x[0];
            $xRange['end']   = $x[1];

            $yRange = array();
            $yRange['start'] = $y[0];
            $yRange['end']   = $y[1];

            // Zoom-level & tilesize
            $zoomLevel = $this->params['zoomLevel'];
            $tileSize  = $this->params['tileSize'];

            // Construct layers
            $layers = array();
            $i = 0;
            foreach (explode(",", $this->params['layers']) as $layer) {
                array_push($layers, new Layer($layer, $timestamps[$i], $timestamps[$i], $zoomLevel, $xRange, $yRange, $tileSize));
                $i++;
            }

            // Limit to 3 layers
            if ((sizeOf($layers) > 3) || (strlen($this->params['layers']) == 0)) {
                throw new Exception("Error: Invalid layer choices! You must specify 1-3 command-separate layernames.");
            }

            // Optional parameters
            $options = array();
            $options["edgeEnhance"] = $this->params['edges'];
            $options["sharpen"]     = $this->params['sharpen'];
        }
        catch(Exception $e) {
            echo 'Error: ' .$e->getMessage();
            exit();
        }

        //Create and display composite image
        $img = new CompositeImage($layers, $zoomLevel, $xRange, $yRange, $options);
        $img->printImage();

        return 1;
    }

    /**
     * @return int Returns "1" if the action was completed successfully.
     */
    private function _getJP2Image () {
        require('lib/helioviewer/ImgIndex.php');
        $imgIndex = new ImgIndex(new DbConnection());

        // find the closest image
        foreach(array('observatory', 'instrument', 'detector', 'measurement') as $field) {
            $src["$field.abbreviation"] = $this->params[$field];
        }

        // file name and location
        $filename = $imgIndex->getJP2Filename($this->params['timestamp'], $src);
        $filepath = $this->getFilepath($filename);

        // regex for URL construction
        $webRootRegex = "/" . preg_replace("/\//", "\/", Config::WEB_ROOT_DIR) . "/";
        
        // http url
        if ((isset($this->params['getURL'])) && ($this->params['getURL'] === "true")) {
            $url = preg_replace($webRootRegex, Config::WEB_ROOT_URL, $filepath);
            echo $url;
        }
        
        // jpip url
        else if ((isset($this->params['getJPIP'])) && ($this->params['getJPIP'] == "true")) {
            $jpip = "jpip" . substr(preg_replace($webRootRegex, Config::WEB_ROOT_URL, $filepath), 4);
            echo $jpip;
        }
        
        // jp2 image
        else {
            $fp = fopen($filepath, 'r');

            header("Content-Length: " . filesize($filepath));
            header("Content-Type: "   . image_type_to_mime_type(IMAGETYPE_JP2));
            header("Content-Disposition: attachment; filename=\"$filename\"");

            $contents = fread($fp, filesize($filepath));

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
     *     echo $dt->format("U");
     *     date_add($dt, new DateInterval("T" . $cadence . "S"));
     *  (See http://us2.php.net/manual/en/function.date-create.php)
     */
    private function _getJP2ImageSeries () {
        $startTime   = $this->params['startTime'];
        $endTime     = $this->params['endTime'];
        $cadence     = $this->params['cadence'];
        $format      = $this->params['format'];
        
        $observatory = $this->params['observatory'];
        $instrument  = $this->params['instrument'];
        $detector    = $this->params['detector'];
        $measurement = $this->params['measurement'];

        // Create a temporary directory to store image-series (TODO: Move this + other directory creation to installation script)
        $tmpdir = Config::TMP_ROOT_DIR . "/movies/";
        if (!file_exists($tmpdir)) {
            mkdir($tmpdir);
            chmod($tmpdir, 0777);
        }

        // Filename
        $filename = implode("_", array($observatory, $instrument, $detector, $measurement, "F$startTime", "T$endTime", "B$cadence")) . "." . strtolower($format);
        
        // Filepath
        $filepath = "$tmpdir" . $filename;

        // URL
        $url = Config::TMP_ROOT_URL . "/movies/" . $filename;

        // If the file doesn't exist already, create it
        if (!file_exists($filepath)) {
            $this->buildJP2ImageSeries($filepath);
        }

        // Output the file/jpip URL
        if ((isset($this->params['getJPIP'])) && ($this->params['getJPIP'] == "true")) {
            $webRootRegex = "/" . preg_replace("/\//", "\/", Config::WEB_ROOT_DIR) . "/";
            $mj2 = "jpip" . substr(preg_replace($webRootRegex, Config::WEB_ROOT_URL, $url), 4);
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
    private function buildJP2ImageSeries ($output_file) {
        //date_default_timezone_set('UTC');
        require_once('ImgIndex.php');
        
        $startTime   = $this->params['startTime'];
        $endTime     = $this->params['endTime'];
        $cadence     = $this->params['cadence'];
        $format      = $this->params['format'];

        // Layer information
        foreach(array('observatory', 'instrument', 'detector', 'measurement') as $field) {
          $src["$field.abbreviation"] = $this->params[$field];
        }

        // Connect to database
        $imgIndex = new ImgIndex(new DbConnection());

        // Determine number of frames to grab
        $timeInSecs = $endTime - $startTime;
        $numFrames  = min(Config::MAX_MOVIE_FRAMES, ceil($timeInSecs / $cadence));
        
        // Timer
        $time = $startTime;

        $images = array();

        // Get nearest JP2 images to each time-step
        for ($i = 0; $i < $numFrames; $i++) {
            $jp2 = $this->getFilepath($imgIndex->getJP2Filename($time, $src));
            array_push($images, $jp2);
            $time += $cadence;
        }
        
        // Remove redundant entries
        $images = array_unique($images);

        // Append filepaths to kdu_merge command
        $cmd = Config::KDU_MERGE_BIN . " -i ";
        foreach($images as $jp2) {
            $cmd .= "$jp2,";
        }

        // Drop trailing comma
        $cmd = substr($cmd, 0, -1);

        $cmd .= " -o $output_file";
    
        // MJ2 Creation
        if ($format == "MJ2")
            $cmd .= " -mj2_tracks P:0-@25";
    
        // Execute kdu_merge command
        exec('export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:' . Config::KDU_LIBS_DIR . "; " . escapeshellcmd($cmd), $output, $return);

    }
    
    /**
     * @return int Returns "1" if the action was completed successfully.
     * NOTE: Add option to specify XML vs. JSON... FITS vs. Entire header?
     */
    private function _getJP2Header () {
        $filepath = $this->getFilepath($this->params["uri"]);

        // Query header information using Exiftool
        $cmd = Config::EXIF_TOOL . " $filepath | grep Fits";
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
            $url = Config::EVENT_SERVER_URL . $_SERVER["QUERY_STRING"] . "&debug=1";
        }
        else {
            header("Content-type: application/json");
            $url = Config::EVENT_SERVER_URL . "action=getEventCatalogs";
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
            $url = Config::EVENT_SERVER_URL . $_SERVER["QUERY_STRING"] . "&debug=1";
        }
        else {
            header("Content-type: application/json");
            $url = Config::EVENT_SERVER_URL . "action=getEvents&date=" . $this->params["date"] . "&windowSize=" . $this->params["windowSize"] . "&catalogs=" . $this->params["catalogs"];
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
     * @return int Returns "1" if the action was completed successfully.
     */
    private function _buildMovie () {
        require_once('ImageSeries.php');
       
        // Required parameters
        $startDate = $this->params['startDate'];
        $zoomLevel = $this->params['zoomLevel'];
        $numFrames = $this->params['numFrames'];
        $frameRate = $this->params['frameRate'];
		$timeStep  = $this->params['timeStep'];
		$opacity   = explode(",", $this->params['opacity']);        
        $xRange    = explode("/", $this->params['xRange']);
       	$yRange    = explode("/", $this->params['yRange']);
		$layerName = explode(",", $this->params['layers']);
		
        $hqFormat  = $this->params['format'];

        // Optional parameters
        $options = array();
        $options['enhanceEdges'] = $this->params['edges'] || false;
        $options['sharpen']      = $this->params['sharpen'] || false;    
/*$layers = explode(",", $this->params['layers']);
header('Content-type: application/json');
echo json_encode($layers["SOH_EIT_EIT_304"]);
exit();	
*/
		// Each array (opacity, xRange, and yRange) should already be in order with the first value of each array corresponding to
		// the first layer, the second values corresponding to the second layer, and so on. 
		$layers = array();
		$i = 0;
		foreach($layerName as $lname) {
			$layers[$lname] = array("name" => $lname, "opacity" => $opacity[$i], "xRange" => $xRange[$i], "yRange" => $yRange[$i]);
			$i++;
		}
	
        //Check to make sure values are acceptable
        try {
            //Limit number of layers to three
            if ((sizeOf($layers) > 3) || (strlen($this->params['layers']) == 0)) {
                throw new Exception("Invalid layer choices! You must specify 1-3 command-separate layernames.");
            }

            //Limit number of frames
            if (($numFrames < 10) || ($numFrames > Config::MAX_MOVIE_FRAMES)) {
                throw new Exception("Invalid number of frames. Number of frames should be at least 10 and no more than " . Config::MAX_MOVIE_FRAMES . ".");
            }

		// Can you just pass imgSeries the $_GET or $_POST array? or put some layer info in one array.
            $imgSeries = new ImageSeries($layers, $startDate, $zoomLevel, $numFrames, $frameRate, $hqFormat, /*$xRange, $yRange, $opacity, */ $options, $timeStep);
            $imgSeries->buildMovie();

        } catch(Exception $e) {
            echo 'Error: ' .$e->getMessage();
            exit();
        }

        return 1;
    }

    /**
     * @return int Returns "1" if the action was completed successfully.
     */
    private function _playMovie () {
        $url = $this->params['url'];
        $hqFormat  = $this->params['format'];
        $width  = 512;
        $height = 512;

        $highQualityVersion = substr($url, 0, -3) . $hqFormat;
        ?>
            <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
            <html>
            <head>
                <title>Helioviewer.org QuickMovie</title>
            </head>
            <body style="background-color: #000, color: #FFF">
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
 <!--               <div style="text-align: center;">
                    <a href="<?php print $highQualityVersion;?>" style="text-decoration: none; color: white; font-weight: bold;">High-quality download.</a>
                </div> -->
            </body>
            </html>
        <?php
        return 1;
    }
    /**
     * @return int Returns "1" if the action was completed successfully.
     */
    private function _getLayerAvailability () {
        $dbConnection = new DbConnection();

        // Layer parameters
        $obs  = mysqli_real_escape_string($dbConnection->link, $this->params['observatory']);
        $inst = mysqli_real_escape_string($dbConnection->link, $this->params['instrument']);
        $det  = mysqli_real_escape_string($dbConnection->link, $this->params['detector']);
        $meas = mysqli_real_escape_string($dbConnection->link, $this->params['measurement']);

        // Validate new combinations (Note: measurement changes are always valid)
        if (isset($this->params['changed'])) {
            $changed  = mysqli_real_escape_string($dbConnection->link, $this->params['changed']);
            $newValue = mysqli_real_escape_string($dbConnection->link, $this->params['value']);

            // If query returns any matches then the new combination is valid
            $query = sprintf("SELECT count(*) as count from observatory 
                                INNER JOIN instrument ON observatory.id = instrument.observatoryId
                                INNER JOIN detector ON detector.instrumentId = instrument.id
                                  INNER JOIN measurement ON measurement.detectorId = detector.id
                                WHERE
                                observatory.abbreviation = '%s' AND instrument.abbreviation = '%s' and detector.abbreviation='%s' and measurement.abbreviation = '%s';",
                                $obs, $inst, $det, $meas);

            $result = $dbConnection->query($query);
            $row = mysqli_fetch_array($result, MYSQL_ASSOC);
            $valid = $row['count'];

            //If combination is invalid, adjust options to provide a valid combination
            if (!$valid) {
                //CASE 1: Observatory changed

                //CASE 2: Instrument changefirst grab a list of valid detectors for the chosen instrumentd
                if ($changed == "instrument") {
                    //Find a valid detector for the chosen instrument
                    $query = sprintf("SELECT detector.abbreviation from detector INNER JOIN instrument ON instrument.id = detector.instrumentId 
                                      WHERE instrument.abbreviation = '%s' LIMIT 1;", $newValue);
                    $result = $dbConnection->query($query);
                    $row = mysqli_fetch_array($result, MYSQL_ASSOC);
                    $det = $row['abbreviation'];

                    //Measurements will be automatically updated...
                }

                //CASE 3: Detector changed

                //CASE 4: Measurement change
                //Do nothing
            }
        }

        // Determine appropriate options to display given the current combination of layer parameters
        $options = array(
            "observatories" => array(array("name" => "SOHO", "abbreviation" => "SOH")),
            "instruments" =>   $this->getValidChoices($dbConnection, "observatory", "instrument", $obs),
            "detectors" =>     $this->getValidChoices($dbConnection, "instrument", "detector", $inst),
            "measurements" =>  $this->getValidChoices($dbConnection, "detector", "measurement", $det)
        );

        //Output results
        if ($this->format == "json")
            header("Content-type: application/json");

        echo json_encode($options);
        return 1;
    }
    
     /**
     *
     * @return Array Allowed values for given field
     * @param $db Object MySQL Database connection
     * @param $f1 String Field Objectof interest
     * @param $f2 String Limiting field
     * @param $limit String Limiting field value
     *
     * Queries one field based on a limit in another. Performs queries of the sort
     * "Give me all instruments where observatory equals SOHO."
     */
    private function getValidChoices ($db, $f1, $f2, $f1_value) {
        $values = array();
        $query = "SELECT $f2.name, $f2.abbreviation from $f2 INNER JOIN $f1 ON $f1.id = $f2.$f1" . "Id" . " WHERE $f1.abbreviation = '$f1_value';";

        if ($this->format === "plaintext")
            echo "<strong>query:</strong><br>$query<br><br>";

        $result = $db->query($query);
        while ($row = mysqli_fetch_array($result, MYSQL_ASSOC)) {
            array_push($values, $row);
        }

        return $values;
    }
    
    /**
     * @return string filepath to the specified jpeg 2000 image
     * 
     * Given a jp2 uri, builds a complete filepath to the image
     */
    public static function getFilepath ($uri) {
        $exploded = explode("_", substr($uri, 0, -4));
        
        // remove time portion
        array_splice($exploded, 3, 1);
        
        // recombine to construct filepath
        return Config::JP2_DIR . implode("/", $exploded) . "/$uri";
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
                if (!isset($this->params["uri"]))
                    return false;
                break;
            case "getEventCatalogs":
                break;
            case "getEvents":
                break;
            case "getLayerAvailability":
                break;
            case "getJP2Image":
                break;
            case "getJP2ImageSeries":
                break;
            case "launchJHelioviewer":
                break;
            case "buildMovie":
                break;
			case "playMovie":
				break;
            default:
                throw new Exception("Invalid action specified. See the <a href='http://www.helioviewer.org/api/'>API Documentation</a> for a list of valid actions.");        
        }

        return true;
    }
}
?>
