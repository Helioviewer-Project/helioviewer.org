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
    public function buildMovie($params) 
    {
        $defaults = array(
            'numFrames'   => 20,
            'frameRate'   => 8,
            'timeStep'	  => 28800,
            'filename'	  => "movie" . time(),
            'sharpen'	  => false,
            'edges'		  => false,
            'quality'	  => 10,
            'hqFormat'	  => "mp4",
            'display'	  => true,
            'watermarkOn' => true
        );
        $this->_params = array_merge($defaults, $params);
        
        $imageScale = $params['imageScale'];
        $width      = ($params['x2'] - $params['x1']) / $imageScale;
        $height     = ($params['y2'] - $params['y1']) / $imageScale;   

        $options 	= array(
            'enhanceEdges'	=> $this->_params['edges'],
            'sharpen' 		=> $this->_params['sharpen']
        );
        
        $movieMeta = new Image_ImageMetaInformation($width, $height, $imageScale);

        //Check to make sure values are acceptable
        try {
            //Limit number of layers to three
            $layers = explode("/", $this->_params['layers']);
            if (sizeOf($layers) == 0 || sizeOf($layers) > 3) {
                $msg = "Invalid layer choices! You must specify 1-3 comma-separated layernames.";
                throw new Exception($msg);
            }
            
            $numFrames = $this->_params['numFrames'];
            $startDate = toUnixTimestamp($this->_params['startDate']);
            $timeStep  = $this->_params['timeStep'];
            
            //Limit number of frames
            if (($numFrames < 10) || ($numFrames > HV_MAX_MOVIE_FRAMES)) {
                $msg = "Invalid number of frames. Number of frames should be " .
                "at least 10 and no more than " . HV_MAX_MOVIE_FRAMES . ".";
                throw new Exception($msg);
            }

            $movie = new Movie_HelioviewerMovie(
                $startDate, $numFrames,
                $this->_params['frameRate'],
                $this->_params['hqFormat'],
                $options, $timeStep,
                $this->_params['filename'],
                $this->_params['quality'],
                $movieMeta
            );
        
            $images = $this->_buildFramesFromMetaInformation($movieMeta, $this->_params['layers'], $startDate, $timeStep, $numFrames);
            $url 	= $movie->buildMovie($images);
            
            return $this->_displayMovie($url, $movie, $params, $this->_params['display']);

        } catch(Exception $e) {
            echo 'Error: ' .$e->getMessage();
            exit();
        }
    }
    
    /**
     * Takes in meta and layer information and creates movie frames from them.
     * 
     * @param {Object}  $movieMeta an ImageMetaInformation object that has width, height, and imageScale. 
     * @param {String}  $layers    a string of layers
     * @param {ISODate} $startDate date the movie starts on
     * @param {int}     $timeStep  time step in between images in the frames
     * @param {int}     $numFrames number of frames in the movie
     * 
     * @return $images an array of built movie frames
     */
    private function _buildFramesFromMetaInformation($movieMeta, $layers, $startDate, $timeStep, $numFrames) 
    {
        $builder 	= new Image_Screenshot_HelioviewerScreenshotBuilder();
        $images 	= array();
        $timestamps = array();
        
        $width  = $movieMeta->width();
        $height = $movieMeta->height();
        $scale  = $movieMeta->imageScale();
        
        for ($time = $startDate; $time < $startDate + $numFrames * $timeStep; $time += $timeStep) {
            array_push($timestamps, $time);
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

            $image = $builder->takeScreenshot($params);
            array_push($images, $image);
        }
        
        return $images;
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
    private function _displayMovie($url, $movie, $params, $display)
    {
        if (!file_exists($url)) {
            throw new Exception('The requested movie is either unavailable or does not exist.');
        }

        if ($display === true && $params == $_GET) {
            return $movie->showMovie(str_replace(HV_ROOT_DIR, HV_WEB_ROOT_URL, $url), $movie->width(), $movie->height());
        } else if ($params == $_POST) {
            header('Content-type: application/json');
            echo json_encode(str_replace(HV_ROOT_DIR, HV_WEB_ROOT_URL, $url));
        } else {
            echo str_replace(HV_ROOT_DIR, HV_WEB_ROOT_URL, $url);
        }
    }
}