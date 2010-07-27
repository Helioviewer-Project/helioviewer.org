<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Image_Movie_HelioviewerMovieBuilder class definition
 *
 * PHP version 5
 *
 * @category Movie
 * @package  Helioviewer
 * @author   Jaclyn Beck <jabeck@nmu.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once HV_ROOT_DIR . '/api/src/Image/Screenshot/HelioviewerScreenshotBuilder.php';
require_once HV_ROOT_DIR . '/api/src/Movie/HelioviewerMovie.php';
require_once HV_ROOT_DIR . '/api/src/Helper/DateTimeConversions.php';
require_once HV_ROOT_DIR . '/api/src/Helper/LayerParser.php';
require_once HV_ROOT_DIR . '/api/src/Database/ImgIndex.php';
/**
 * Image_Movie_HelioviewerMovieBuilder class definition
 *
 * PHP version 5
 *
 * @category Movie
 * @package  Helioviewer
 * @author   Jaclyn Beck <jabeck@nmu.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Movie_HelioviewerMovieBuilder
{
    private $_params;
    protected $maxNumFrames = 120;
    protected $maxWidth  = 1920;
    protected $maxHeight = 1080;
    /**
     * Does not require any parameters or setup.
     */
    public function __construct() 
    {
        $this->_imgIndex = new Database_ImgIndex();
    }
    
    /**
     * Prepares the parameters passed in from the api call and makes a movie from them. 
     * 
     * @param {Array}  $params    parameters passed in by the api call. 
     * @param {String} $outputDir The directory where the movie will be stored
     * 
     * @return {String} a url to the movie, or the movie will display.
     */
    public function buildMovie($params, $outputDir) 
    {
        $defaults = array(
            'numFrames'   => false,
            //'frameRate'   => 12,
            'filename'	  => false,
            'sharpen'	  => false,
            'edges'		  => false,
            'quality'	  => 10,
            'hqFormat'	  => "mp4",
            'display'	  => true,
            'watermarkOn' => true,
            'endTime'     => false
        );

        $this->_params = array_merge($defaults, $params);

        $imageScale = $params['imageScale'];
        $width      = ($params['x2'] - $params['x1']) / $imageScale;
        $height     = ($params['y2'] - $params['y1']) / $imageScale;  

        // Limit to maximum dimensions
        if ($width > $this->maxWidth || $height > $this->maxHeight) {
            $scaleFactor = min($this->maxWidth / $width, $this->maxHeight / $height);
            $width      *= $scaleFactor;
            $height     *= $scaleFactor;
            $imageScale /= $scaleFactor;
        }
        
        $options 	= array(
            'enhanceEdges'	=> $this->_params['edges'],
            'sharpen' 		=> $this->_params['sharpen']
        );
        
        $movieMeta = new Image_ImageMetaInformation($width, $height, $imageScale);

        //Check to make sure values are acceptable
        try {
            //Limit number of layers to three
            $layers = getLayerArrayFromString($this->_params['layers']);
            if (sizeOf($layers) == 0 || sizeOf($layers) > 3) {
                $msg = "Invalid layer choices! You must specify 1-3 comma-separated layernames.";
                throw new Exception($msg);
            }
        
            list($isoStartTime, $isoEndTime, $startTime, $endTime) = $this->_getStartAndEndTimes();

            $numFrames = $this->_getOptimalNumFrames($layers, $isoStartTime, $isoEndTime);
            if ($numFrames < 1) {
                $msg = "There are no images for the given layers between " . toReadableISOString($isoStartTime) . " and " 
                        . toReadableISOString($isoEndTime) . ", so a movie was not created.";
                throw new Exception($msg);
            }
            $cadence   = $this->_determineOptimalCadence($startTime, $endTime, $numFrames);

            if (!$this->_params['filename']) {
                $start = str_replace(array(":", "-", "T", "Z"), "_", $isoStartTime);
                $end   = str_replace(array(":", "-", "T", "Z"), "_", $isoEndTime);
                $filename = $start . "_" . $end . $this->buildFilename($layers);
            } else {
                $filename = $this->_params['filename'];
            }

            $tmpImageDir = $outputDir . "/tmp-" . $filename;
            $images      = $this->_buildFramesFromMetaInformation($movieMeta, $this->_params['layers'], $startTime, $cadence, $numFrames, $tmpImageDir);
            if ($images === false) {
                $msg = "There are no images for the given layers between " . toReadableISOString($isoStartTime) . " and " 
                        . toReadableISOString($isoEndTime) . ", so a movie was not created.";
                throw new Exception($msg);
            }
        
            $numFrames = sizeOf($images);
            if ($numFrames < 3) {
                $msg = "There is only one image for the given layers between " . toReadableISOString($isoStartTime) . " and " 
                        . toReadableISOString($isoEndTime) . ", so a movie was not created.";
                throw new Exception($msg);
            }
            
            // Subtract 1 because we added an extra frame to the end
            $frameRate = $this->_determineOptimalFrameRate($numFrames - 1);

            $movie = new Movie_HelioviewerMovie(
                $startTime, $numFrames,
                $frameRate, $this->_params['hqFormat'],
                $options, $filename,
                $this->_params['quality'],
                $movieMeta, $outputDir
            );
            
            $url = $movie->buildMovie($images, $tmpImageDir);
            
            return $this->_displayMovie($url, $params, $this->_params['display'], $movie->width(), $movie->height());

        } catch(Exception $e) {
        	if (!empty($_POST)) {
                header('Content-type: application/json');
                echo json_encode(array("error" => $e->getMessage()));       		
        	} else {
                //printErrorMsg($e->getMessage());
        	}
        }
    }
    
    /**
     * Figures out startTime and endTime based on parameters. If endTime is not given, endTime defaults to 24 hours after
     * startTime. If startTime is within a day of "now", startTime defaults to 24 hours before, and endTime becomes the old
     * startTime to ensure that the user actually has a video to look at. 
     *
     * @return array
     */
    private function _getStartAndEndTimes ()
    {
        $isoStartTime  = $this->_params['startTime'];
        $startTime     = toUnixTimestamp($isoStartTime);
        // Convert to seconds.
        $defaultWindow = HV_DEFAULT_MOVIE_TIME_WINDOW_IN_HOURS * 3600;
            
        if (!$this->_params['endTime']) {
            $now = time();
            if ($now - $startTime < $defaultWindow) {
                $startTime -= $defaultWindow;
                $isoStartTime = toISOString(parseUnixTimestamp($startTime));
            }
            
            $endTime    = $startTime + $defaultWindow;
            $isoEndTime = toISOString(parseUnixTimestamp($endTime));
            
        } else {
            $isoEndTime = $this->_params['endTime'];
            $endTime    = toUnixTimestamp($isoEndTime);
        }
        
        return array($isoStartTime, $isoEndTime, $startTime, $endTime);
    }
    
    /**
     * Searches the cache for a movie related to the event and returns the filepath if one exists. If not,
     * returns false
     * 
     * @param array  $originalParams the original parameters passed in by the API call
     * @param string $outputDir      the directory path to where the cached file should be stored
     * 
     * @return string
     */
    public function createForEvent($originalParams, $eventInfo, $outputDir) 
    {
        $defaults = array(
           'ipod'    => false
        );
        $params = array_merge($defaults, $originalParams);
        $params['display'] = false;
        $format = ".flv";
        $filename = "";
        if ($params['ipod'] === "true" || $params['ipod'] === true) {
            $params['hqFormat'] = "ipod";
            $outputDir .= "/iPod";
            $format = ".mp4";
        } else {
            $outputDir .= "/regular";
        }
        
        $filename .= "Movie_";
        
        $box = $this->_getBoundingBox($params, $eventInfo);
        $params['x1'] = $box['x1'];
        $params['x2'] = $box['x2'];
        $params['y1'] = $box['y1'];
        $params['y2'] = $box['y2'];

        $layers = $this->_getLayersFromParamsOrSourceIds($params, $eventInfo);
        $files  = array();

        foreach ($layers as $layer) {
            $layerFilename = $filename . $params['eventId'] . $this->buildFilename(getLayerArrayFromString($layer));

            if (!HV_DISABLE_CACHE && file_exists($outputDir . "/" . $layerFilename . $format)) {
                $files[] = $outputDir . "/" . $layerFilename . $format;
            } else {
                try {
                    $params['filename'] = $layerFilename;
                    $params['layers']   = $layer;
                    $files[] = $this->buildMovie($params, $outputDir);
                } catch(Exception $e) {
                    // Ignore any exceptions thrown by buildMovie, since they
                    // occur when no movie is made and we only care about movies that
                    // are made.
                }
            }
        }

        return $files;
    }
    
    private function _getBoundingBox($params, $eventInfo) {
        $box = array();
        
        if (!isset($params['x1'])) {
            $box = $eventInfo['boundingBox'];
        } else {
            $box['x1'] = $params['x1'];
            $box['x2'] = $params['x2'];
            $box['y1'] = $params['y1'];
            $box['y2'] = $params['y2'];
        }

        return $this->_padToMinSize($box, $params['imageScale']);
    }
    
    private function _padToMinSize($box, $imageScale)
    {
        $minSize = (400 * $imageScale) / 2;
        $centerX = ($box['x1'] + $box['x2']) / 2;
        $centerY = ($box['y1'] + $box['y2']) / 2;
        
        $minX    = min($centerX - $minSize, $box['x1']);
        $minY    = min($centerY - $minSize, $box['y1']);
        $maxX    = max($centerX + $minSize, $box['x2']);
        $maxY    = max($centerY + $minSize, $box['y2']);
        
        return array(
            "x1" => $minX, 
            "x2" => $maxX, 
            "y1" => $minY, 
            "y2" => $maxY);
    }
    
    private function _getLayersFromParamsOrSourceIds($params, $eventInfo)
    {
        $layers = array();

        if (!isset($params['layers'])) {
            $sourceIds = $eventInfo['sourceIds'];
            foreach ($sourceIds as $source) {
                $layers[] = "[" . $source . ",1,100]";
            }
        } else {
            $layers[] = $params['layers'];
        }
        
        return $layers;
    }
    
    /**
     * Takes in a layer string and formats it into an appropriate filename by removing square brackets
     * and extra information like visibility and opacity.
     * 
     * @param string $layers a string of layers in the format [layer],[layer]...
     * 
     * @return string
     */
    protected function buildFilename($layers)
    {
        $filename = "";
        foreach ($layers as $layer) {
            $filename .= "__" . extractLayerName($layer);
        }
        return $filename;
    }
    
    /**
     * Takes in meta and layer information and creates movie frames from them.
     * 
     * @param {Object}  $movieMeta an ImageMetaInformation object that has width, height, and imageScale. 
     * @param {String}  $layers    a string of layers
     * @param {ISODate} $startTime date the movie starts on
     * @param {int}     $timeStep  time step in between images in the frames
     * @param {int}     $numFrames number of frames in the movie
     * @param {String}  $tmpDir    the directory where the frames will be stored
     * 
     * @return $images an array of built movie frames
     */
    private function _buildFramesFromMetaInformation($movieMeta, $layers, $startTime, $timeStep, $numFrames, $tmpDir) 
    {
        $builder 	= new Image_Screenshot_HelioviewerScreenshotBuilder();
        $images 	= array();
        $sourceIds  = array();
        
        $width  = $movieMeta->width();
        $height = $movieMeta->height();
        $scale  = $movieMeta->imageScale();

        $layerArray = getLayerArrayFromString($layers);
        foreach ($layerArray as $layer) {
            $layerInfo = singleLayerToArray($layer);
            array_push($sourceIds, getSourceIdFromLayerArray($layerInfo));
        }
        
        $timestamps = $this->_getTimestamps($sourceIds, $startTime, $timeStep, $numFrames);

        if (sizeOf($timestamps) < 1) {
            return false;
        }
        
        $frameNum = 0;

        foreach ($timestamps as $time => $closestImages) {
            $isoTime = toISOString(parseUnixTimestamp($time));
            
            $params = array(
                'width'  	 => $width,
                'height'	 => $height,
                'imageScale' => $scale,
                'obsDate' 	 => $isoTime,
                'layers' 	 => $layers,
                'filename'	 => "frame" . $frameNum++,
                'quality'	 => $this->_params['quality'],
                'sharpen'	 => $this->_params['sharpen'],
                'edges'		 => $this->_params['edges'],
                'display'	 => false,
                'x1' 	     => $this->_params['x1'],
                'x2'         => $this->_params['x2'],
                'y1'         => $this->_params['y1'],
                'y2'         => $this->_params['y2'],
                'watermarkOn'=> $this->_params['watermarkOn']
            );
    
            $image = $builder->takeScreenshot($params, $tmpDir, $closestImages);
            $images[] = $image;
        }

        // Copy the last frame so that it actually shows up in the movie for the same amount of time
        // as the rest of the frames. 
        $lastImage = copy($image, dirname($image) . "/frame" . $frameNum . ".jpg");
        $images[]  = $lastImage;
        
        return $images;
    }
    
    /**
     * Fetches the closest images from the database for each given time. Adds them to the timestamp
     * array if they are not duplicates of sets of images in the timestamp array already. $closestImages
     * is an array with one image per layer, associated with their sourceId.
     * 
     * @param {Array} $sourceIds An array of source ids, one for each layer
     * @param {int}   $startTime The Unix Timestamp of the start time
     * @param {float} $timeStep  The cadence or the movie
     * @param {int}   $numFrames The number of frames
     * 
     * @return array
     */
    private function _getTimestamps($sourceIds, $startTime, $timeStep, $numFrames)
    {
        $timestamps = array();
        
        for ($time = $startTime; $time < $startTime + $numFrames * $timeStep; $time += $timeStep) {
            $isoTime = toISOString(parseUnixTimestamp(round($time)));
            $closestImages = $this->_getClosestImagesForTime($sourceIds, $isoTime);

            // Only add frames if they are unique
            if ($closestImages != end($timestamps)) {
                $timestamps[round($time)] = $closestImages;
                
            }
        }
        
        return $timestamps;
    }
    
    /**
     * Queries the database to get the closest image to $isoTime for each layer.
     * Returns all images in an associative array with source IDs as the keys. 
     * 
     * @param {Array} $sourceIds An array of source ids, one for each layer
     * @param {Date}  $isoTime   The ISO date string of the timestamp
     * 
     * @return array
     */
    private function _getClosestImagesForTime($sourceIds, $isoTime)
    {
        $images = array();
        foreach ($sourceIds as $id) {
            $images[$id] = $this->_imgIndex->getClosestImage($isoTime, $id);
        }
        return $images;
    }
    
    /**
     * Uses the startTime and endTime to determine how many frames to make, up to 120.
     * Fetches timestamps based on that number.
     * 
     * @param Array $layers    Array of layer strings
     * @param Date  $startTime ISO date
     * @param Date  $endTime   ISO date
     * 
     * @return the number of frames
     */
    private function _getOptimalNumFrames($layers, $startTime, $endTime)
    {
        $maxInRange = 0;
        
        foreach ($layers as $layer) {
            $layerInfo = singleLayerToArray($layer);
            $sourceId  = getSourceIdFromLayerArray($layerInfo);

            $maxInRange = max($maxInRange, $this->_imgIndex->getImageCount($startTime, $endTime, $sourceId));
        }

        // If the user specifies numFrames, use the minimum of their number and the maximum images in range.
        if ($this->_params['numFrames'] !== false) {
            $numFrames = min($maxInRange, $this->_params['numFrames']);
        } else {
            $numFrames = $maxInRange;
        }
        return min($numFrames, HV_MAX_MOVIE_FRAMES / sizeOf($layers));
    }
    
    /**
     * Uses the startTime, endTime, and numFrames to calculate the amount of time in between
     * each frame.
     * 
     * @param Date $startTime Unix Timestamp
     * @param Date $endTime   Unix Timestamp
     * @param Int  $numFrames number of frames in the movie
     * 
     * @return the number of seconds in between each frame
     */
    private function _determineOptimalCadence($startTime, $endTime, $numFrames)
    {
        return ($endTime - $startTime) / $numFrames;
    }
    
    /**
     * Uses numFrames to calculate the frame rate that should
     * be used when encoding the movie.
     * 
     * @param Int  $numFrames number of frames in the movie
     * 
     * @return Int 
     */
    private function _determineOptimalFrameRate($numFrames)
    {
    	$duration  = HV_DEFAULT_MOVIE_PLAYBACK_IN_SECONDS;
    	$frameRate = $numFrames / $duration;
    	
    	// Take the smaller number in case the user specifies a larger
    	// frame rate than is practical.
    	if (isset($this->_params['frameRate'])) {
    		$frameRate = min($frameRate, $this->_params['frameRate']);
    	}

    	return $frameRate;
    }
    
    /**
     * Displays the movie or returns the url to it.
     * 
     * @param {String}  $url     url of the movie
     * @param {Array}   $params  parameters from the API call
     * @param {Boolean} $display whether to display or return the url
     * @param {int}     $width   the width of the movie
     * @param {int}     $height  the height of the movie
     * 
     * @return {String} movie object or displays a movie
     */
    private function _displayMovie($url, $params, $display, $width, $height)
    {
        if (!file_exists($url)) {
            throw new Exception('The requested movie is either unavailable or does not exist.');
        }

        if ($display === true && $params == $_GET) {
            return Movie_HelioviewerMovie::showMovie(str_replace(HV_ROOT_DIR, HV_WEB_ROOT_URL, $url), $width, $height);
        } else if ($params == $_POST) {
            header('Content-type: application/json');
            echo json_encode(array(
                                "url" => str_replace(HV_ROOT_DIR, HV_WEB_ROOT_URL, $url),
                            ));
            return $url;
        } else {
            //echo str_replace(HV_ROOT_DIR, HV_WEB_ROOT_URL, $url);
            return $url;
        }
    }
}