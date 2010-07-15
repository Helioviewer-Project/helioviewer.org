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
    }
    
    /**
     * Prepares the parameters passed in from the api call and makes a movie from them. 
     * 
     * @param {Array} $params parameters passed in by the api call. 
     * 
     * @return {String} a url to the movie, or the movie will display.
     */
    public function buildMovie($params, $outputDir) 
    {
        $defaults = array(
            'numFrames'   => false,
            'frameRate'   => 8,
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
            
            $isoStartTime = $this->_params['startTime'];
            $startTime    = toUnixTimestamp($isoStartTime);
            
            // If endTime was not given, default to 24 hours after the startTime, but make sure that
            // if the user is requesting 'today' as a start time to END at today and start 24 hours prior
            // to ensure that they actually have a video to look at.
            if (!$this->_params['endTime']) {
            	$now        = time();
            	if ($now - $startTime < 86400) {
                    $startTime -= 86400;
            	}
                $endTime    = $startTime + 86400;
                $isoEndTime = toISOString(parseUnixTimestamp($endTime));
            } else {
                $isoEndTime = $this->_params['endTime'];
                $endTime    = toUnixTimestamp($isoEndTime);
            }
            
            $numFrames = ($this->_params['numFrames'] === false)? 
                            $this->_determineOptimalNumFrames($layers, $isoStartTime, $isoEndTime) :
                            min($this->_params['numFrames'], $this->maxNumFrames);
            $numFrames = max($numFrames, 10);

            $cadence   = $this->_determineOptimalCadence($startTime, $endTime, $numFrames);

            if (!$this->_params['filename']) {
            	$start = str_replace(array(":", "-", "T", "Z"), "_", $isoStartTime);
            	$end   = str_replace(array(":", "-", "T", "Z"), "_", $isoEndTime);
                $filename = $start . "_" . $end . $this->buildFilename($layers);
            } else {
            	$filename = $this->_params['filename'];
            }

            $movie = new Movie_HelioviewerMovie(
                $startTime, $numFrames,
                $this->_params['frameRate'],
                $this->_params['hqFormat'],
                $options, $cadence, $filename,
                $this->_params['quality'],
                $movieMeta, $outputDir
            );

            $images = $this->_buildFramesFromMetaInformation($movieMeta, $this->_params['layers'], $startTime, $cadence, $numFrames, $outputDir);
            $url 	= $movie->buildMovie($images);
            
            return $this->_displayMovie($url, $params, $this->_params['display'], $movie->width(), $movie->height());

        } catch(Exception $e) {
            echo 'Error: ' .$e->getMessage();
            exit();
        }
    }
    
    /**
     * Searches the cache for movies related to the event and returns an array of filepaths if at least
     * one exists. If not, returns false
     * 
     * @param array  $originalParams the original parameters passed in by the API call
     * @param string $outputDir      the directory path to where the cached file should be stored
     * 
     * @return string
     */
    public function getMoviesForEvent($originalParams, $outputDir) 
    {
        $defaults = array(
           'ipod'    => false
        );
        $format = ".flv";
        $params = array_merge($defaults, $originalParams);
        $filename = "";
        if ($params['ipod'] === "true" || $params['ipod'] === true) {
            $outputDir .= "/iPod";
            $filename .= "ipod-";
            $format = ".mp4";
        } else {
            $outputDir .= "/regular";
        }
        
        $filename .= "Movie_" . $params['eventId'];

        $movies = glob($outputDir . "/" . $filename . "*" . $format);
        if (sizeOf($movies) === 0) {
        	return false;
        }
        
        return $movies;
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
    public function createMovieForEvent($originalParams, $outputDir) 
    {
        $defaults = array(
           'display' => false,
           'ipod'    => false
        );
        $params = array_merge($defaults, $originalParams);
        $format = ".flv";
        $filename = "";
        if ($params['ipod'] === "true" || $params['ipod'] === true) {
        	$params['hqFormat'] = "ipod";
            $outputDir .= "/iPod/";
            $format = ".mp4";
        } else {
            $outputDir .= "/regular/";
        }
        
        $filename .= "Movie_" . $params['eventId'] . $this->buildFilename(getLayerArrayFromString($params['layers']));
        
        if (file_exists($outputDir . $filename . $format)) {
            return $outputDir . $filename . $format;
        }
        $params['filename'] = $filename;
        return $this->buildMovie($params, $outputDir);
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
        $timestamps = array();
        
        $width  = $movieMeta->width();
        $height = $movieMeta->height();
        $scale  = $movieMeta->imageScale();
        
        for ($time = $startTime; $time < $startTime + $numFrames * $timeStep; $time += $timeStep) {
            array_push($timestamps, round($time));
        }
        $frameNum = 0;

        foreach ($timestamps as $time) {
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

            $image = $builder->takeScreenshot($params, $tmpDir);
            array_push($images, $image);
        }
        
        return $images;
    }
    
    /**
     * Uses the startTime and endTime to determine how many frames to make, up to 120.
     * 
     * @param Array $layers    Array of layer strings
     * @param Date  $startTime ISO date
     * @param Date  $endTime   ISO date
     * 
     * @return the number of frames
     */
    private function _determineOptimalNumFrames($layers, $startTime, $endTime)
    {
        include_once HV_ROOT_DIR . "/api/src/Database/ImgIndex.php";
        $imgIndex = new Database_ImgIndex();
        
        $maxInRange = 0;
        
        foreach ($layers as $layer) {
            $layerInfo = singleLayerToArray($layer);
            if (sizeOf($layerInfo) > 4) {
                list($observatory, $instrument, $detector, $measurement, $opacity) = $layerInfo;
                $sourceId = $imgIndex->getSourceId($observatory, $instrument, $detector, $measurement);        
            } else {
                $sourceId = $layerInfo[0];
            }

            $maxInRange = max($maxInRange, $imgIndex->getImageCount($startTime, $endTime, $sourceId));
        }

        return min($maxInRange, $this->maxNumFrames);
    }
    
    /**
     * Uses the startTime, endTime, and numFrames to calculate the amount of time in between
     * each frame.
     * 
     * @param Date $startTime ISO date
     * @param Date $endTime   ISO date
     * @param Int  $numFrames number of frames in the movie
     * 
     * @return the number of seconds in between each frame
     */
    private function _determineOptimalCadence($startTime, $endTime, $numFrames)
    {
        return ($endTime - $startTime) / $numFrames;
    }
    
    /**
     * Displays the movie or returns the url to it.
     * 
     * @param {String}  $url     url of the movie
     * @param {Object}  $movie   Movie object
     * @param {Array}   $params  parameters from the API call
     * @param {Boolean} $display whether to display or return the url
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
            //return $movie->showMovie(str_replace(HV_ROOT_DIR, HV_WEB_ROOT_URL, $url), $movie->width(), $movie->height());
        } else if ($params == $_POST) {
            header('Content-type: application/json');
            echo json_encode(str_replace(HV_ROOT_DIR, HV_WEB_ROOT_URL, $url));
        } else {
            echo str_replace(HV_ROOT_DIR, HV_WEB_ROOT_URL, $url);
        }
    }
}