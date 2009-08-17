<?php
/**
 * @package Helioviewer API
 * @author Keith Hughitt <keith.hughitt@nasa.gov>
 *
 * TODO: Move JP2 Image Series functionality to ImageSeries class
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
        $this->params = $params;
        $this->format = $format;

        require_once('../settings/Config.php');

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
     * 
     * TODO: Add a more elegant check for local vs. remote server
     */
    private function _getClosestImage () {
        // TILE_SERVER_1
        if ($this->params['server'] === 'api/index.php') {
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
            $xRange['size']   = $x[1];

            $yRange = array();
            $yRange['start'] = $y[0];
            $yRange['size']   = $y[1];

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
        
        // Convert date string to a UNIX timestamp
        // NOTE: Currently supporting deprecated "timestamp" field as well
        if (isset($this->params['date'])) {
            $timestamp = $this->getUTCTimestamp($this->params['date']);
        } else {
            $timestamp = $this->params['timestamp'];
        }

        // file name and location
        $filename = $imgIndex->getJP2Filename($timestamp, $src);
        $filepath = $this->getFilepath($filename);
        
        // http url (relative path)
        if ((isset($this->params['getRelativeURL'])) && ($this->params['getRelativeURL'] === "true")) {
            $jp2RootRegex = "/" . preg_replace("/\//", "\/", Config::JP2_DIR) . "/";
            $url = "/" . preg_replace($jp2RootRegex, "", $filepath);
            echo $url;
        }
        
        // http url (full path)
        else if ((isset($this->params['getURL'])) && ($this->params['getURL'] === "true")) {
            $webRootRegex = "/" . preg_replace("/\//", "\/", Config::WEB_ROOT_DIR) . "/";
            $url = preg_replace($webRootRegex, Config::WEB_ROOT_URL, $filepath);
            echo $url;
        }
        
        // jpip url
        else if ((isset($this->params['getJPIP'])) && ($this->params['getJPIP'] == "true")) {
            $webRootRegex = "/" . preg_replace("/\//", "\/", Config::WEB_ROOT_DIR) . "/";
            $jpip = "jpip" . substr(preg_replace($webRootRegex, Config::WEB_ROOT_URL, $filepath), 4);
            echo $jpip;
        }
        
        // jp2 image
        else {
            $fp = fopen($filepath, 'r');
			$stat = stat($filepath);
			
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
     *     echo $dt->format("U");
     *     date_add($dt, new DateInterval("T" . $cadence . "S"));
     *  (See http://us2.php.net/manual/en/function.date-create.php)
     */
    private function _getJP2ImageSeries () {
        $startTime   = $this->getUTCTimestamp($this->params['startTime']);
        $endTime     = $this->getUTCTimestamp($this->params['endTime']);
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

        // Filename (From,To,By)
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
        
        $startTime   = $this->getUTCTimestamp($this->params['startTime']);
        $endTime     = $this->getUTCTimestamp($this->params['endTime']);
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
     * @description All possible parameters: startDate, zoomLevel, numFrames, frameRate, timeStep, layers, imageSize ("x,y"),
     * 	filename, edges, sharpen, format.
     * 
     * API example: http://localhost/helioviewer/api/index.php?action=buildMovie&startDate=1041465600&zoomLevel=13&numFrames=20
     * 	&frameRate=8&timeStep=86400&layers=SOH,EIT,EIT,304,1,100x0,1034,0,1034,-230,-215/SOH,LAS,0C2,0WL,1,100x0,1174,28,1110,-1,0
     * 	&imageSize=588,556&filename=example&sharpen=false&edges=false
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
       	
		// Layerstrings are separated by "/"
		$layerStrings = explode("/", $this->params['layers']);

		$imageCoords = explode(",", $this->params['imageSize']);
		$imageSize 	 = array("width" => $imageCoords[0], "height" => $imageCoords[1]);
		$filename  	 = $this->params['filename'];
			
        //$hqFormat  = $this->params['format'];
        $hqFormat = "mp4";
		
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
            if (($numFrames < 10) || ($numFrames > Config::MAX_MOVIE_FRAMES)) {
                throw new Exception("Invalid number of frames. Number of frames should be at least 10 and no more than " . Config::MAX_MOVIE_FRAMES . ".");
            }

			$layers = $this->_formatLayerStrings($layerStrings);

            $movie = new Movie($layers, $startDate, $zoomLevel, $numFrames, $frameRate, $hqFormat, $options, $timeStep, $imageSize, $filename);
            $movie->buildMovie();

        } catch(Exception $e) {
            echo 'Error: ' .$e->getMessage();
            exit();
        }

        return 1;
    }

	/**
	 * @description Obtains layer information, ranges of pixels visible, and the date being looked at and creates a composite image
	 * 				(a Screenshot) of all the layers. 
	 * 
	 * All possible parameters: obsDate, zoomLevel, layers, imageSize, filename, edges, sharpen
	 * 
	 * API example: http://localhost/helioviewer/api/index.php?action=takeScreenshot&obsDate=1041465600&zoomLevel=13
	 *	&layers=SOH,EIT,EIT,304,1,100x0,1034,0,1034,-230,-215/SOH,LAS,0C2,0WL,1,100x0,1174,28,1110,-1,0
     * 	&imageSize=588,556&filename=example&sharpen=false&edges=false
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
			
			$screenshot = new Screenshot($obsDate, $zoomLevel, $options, $imageSize, $filename);	
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
				echo json_encode(str_replace(CONFIG::WEB_ROOT_DIR, CONFIG::WEB_ROOT_URL, $composite));
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
	 * 					the width and height used in tileLayer.js are not the actual height and width and it mixes things up when
	 * 					trying to align images for screenshots and movies.
	 * 
	 * Required parameters: observatory, instrument, detector, measurement.
	 * @return 1 on success
	 */
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
		$url = str_replace(Config::WEB_ROOT_URL, Config::WEB_ROOT_DIR, $url);
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
        //mail('keith.hughitt@gmail.com', 'My Subject', $message);   
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
     * @return int Number of seconds since Jan 1, 1970 UTC
     * @param string $date ISO 8601 Date string, e.g. "2003-10-05T00:00:00Z"
     */
    public static function getUTCTimestamp($date) {
        return strtotime($date);
    }

	/**
	 * @description Takes the string representation of a layer from the javascript and formats it so that only useful/necessary information is included.
	 * @return {Array} $formatted -- The array containing properly formatted strings
	 * @param {Array} $layers -- an array of strings in the format: "obs,inst,det,meas,visible,opacityxxStart,xSize,yStart,ySize"
	 * 					The extra "x" was put in the middle so that the string could be broken in half and parsing one half by itself 
	 * 					rather than parsing 10 different strings and putting the half that didn't need parsing back together.
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
?>
