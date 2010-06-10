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

class Movie_HelioviewerMovieBuilder 
{
	private $_params;
	public function __construct() 
	{
	}
	
	public function buildMovie($params, $quickMovie = false) 
	{
		$this->_params = $params;
		
       	$width  	= $this->_params['width'];
        $height 	= $this->_params['height'];
        $imageScale = $this->_params['imageScale'];   
        $options 	= array(
        	'enhanceEdges'	=> $this->_params['edges'] || false,
        	'sharpen' 		=> $this->_params['sharpen'] || false
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
        
        	$images = $this->_buildFramesFromMetaInformation($movieMeta, $this->_params['layers'], $startDate, $timeStep, $numFrames, $quickMovie);
        	$url 	= $movie->buildMovie($images);
        	
            return $this->_displayMovie($url, $movie);

        } catch(Exception $e) {
            echo 'Error: ' .$e->getMessage();
            exit();
        }
	}
    
    private function _buildFramesFromMetaInformation($movieMeta, $layers, $startDate, $timeStep, $numFrames, $quickMovie) 
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
        	$image = 
        	$params = array(
        		'width'  	 => $width,
        		'height'	 => $height,
        		'imageScale' => $scale,
        		'obsDate' 	 => $isoTime,
        		'layers' 	 => $layers,
        		'filename'	 => "frame" . $frameNum++ . ".png",
        		'quality'	 => $this->_params['quality'],
        		'sharpen'	 => $this->_params['sharpen'],
        		'edges'		 => $this->_params['edges']
        	);
        	
        	if($quickMovie)
        		$image = $builder->takeFullImageScreenshot($params);
        	else
        		$image = $builder->takeScreenshot($params);
        	array_push($images, $image);
        }
    	
        return $images;
    }
    
    private function _displayMovie($url, $movie) 
    {
		if (!file_exists($url)) {
            throw new Exception('The requested movie is either unavailable or does not exist.');
        }

       /* if ($this->_params == $_GET) {
            return $movie->showMovie(str_replace(HV_ROOT_DIR, HV_WEB_ROOT_URL,$url), $movie->width(), $movie->height());
        }*/ if ($this->_params == $_POST) {
        	header('Content-type: application/json');
        	echo json_encode(str_replace(HV_ROOT_DIR, HV_WEB_ROOT_URL,$url));
        } else {
        	return $movie->showMovie(str_replace(HV_ROOT_DIR, HV_WEB_ROOT_URL,$url), $movie->width(), $movie->height());
        }
    }
}