<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Image_Movie_HelioviewerMovieBuilder class definition
 *
 * PHP version 5
 *
 * @category Movie
 * @package  Helioviewer
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once 'src/Image/Screenshot/HelioviewerScreenshotBuilder.php';
require_once 'src/Movie/HelioviewerMovie.php';
require_once 'src/Helper/DateTimeConversions.php';
require_once 'src/Helper/LayerParser.php';
require_once 'src/Database/ImgIndex.php';

/**
 * Image_Movie_HelioviewerMovieBuilder class definition
 *
 * PHP version 5
 *
 * @category Movie
 * @package  Helioviewer
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Movie_HelioviewerMovieBuilder
{
    private $_params;
    private $_imgIndex;
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
     * Estimates the time it will take to create the requested movie
     * 
     * @param array $params Movie creation parameters
     * 
     * @return void
     */
    public function calculateETA($params)
    {
        $defaults = array(
            'numFrames'   => false,
            'filename'    => false,
            'endTime'     => false
        );

        $this->_params = array_merge($defaults, $params);
        list($width, $height, $imageScale) = $this->_limitToMaximumDimensions();

        $layers = getLayerArrayFromString($this->_params['layers']);
        list($isoStartTime, $isoEndTime, $startTime, $endTime) = $this->_getStartAndEndTimes();
        
        $numFrames = $this->_getOptimalNumFrames($layers, $isoStartTime, $isoEndTime);
        
        $timePerFrame = 0.000001 * $width * $height + 0.25;
        $eta = $timePerFrame * $numFrames;

        header('Content-type: application/json');
        
        try {
            $this->_validateNumFrames($numFrames, $isoStartTime, $isoEndTime);
            echo JSON_encode(array("eta" => round($eta)));
        } catch (Exception $e) {
            throw $e;
        }
        return;
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
            'filename'    => false,
            'sharpen'     => false,
            'edges'       => false,
            'display'     => true,
            'watermarkOn' => true,
            'endTime'     => false,
            'hqFormat'    => "mp4",
            'quality'     => 10
        );

        $this->_params = array_merge($defaults, $params);

        list($width, $height, $imageScale) = $this->_limitToMaximumDimensions();
        
        $options = array(
            'enhanceEdges' => $this->_params['edges'],
            'sharpen'      => $this->_params['sharpen']
        );

        //Check to make sure values are acceptable
        try {
            //Limit number of layers to three
            $layers = getLayerArrayFromString($this->_params['layers']);

            $this->_limitNumLayers($layers);
        
            list($isoStartTime, $isoEndTime, $startTime, $endTime) = $this->_getStartAndEndTimes();

            $numFrames = $this->_getOptimalNumFrames($layers, $isoStartTime, $isoEndTime);
            $this->_validateNumFrames($numFrames, $isoStartTime, $isoEndTime);
            
            $cadence    = $this->_determineOptimalCadence($startTime, $endTime, $numFrames);
            $timestamps = $this->_getTimestamps($this->_params['layers'], $startTime, $cadence, $numFrames);
            $this->_validateNumFrames(sizeOf($timestamps), $isoStartTime, $isoEndTime);
            
            if (!$this->_params['filename']) {
                $start = str_replace(array(":", "-", "T", "Z"), "_", $isoStartTime);
                $end   = str_replace(array(":", "-", "T", "Z"), "_", $isoEndTime);
                $filename = $start . "_" . $end . $this->buildFilename($layers);
            } else {
                $filename = $this->_params['filename'];
            }

            $numFrames = sizeOf($timestamps);
            
            // Subtract 1 because we added an extra frame to the end
            $frameRate = $this->_determineOptimalFrameRate($numFrames - 1);
            
            // Instantiate movie class
            $movie = new Movie_HelioviewerMovie(
                $startTime, $numFrames, $frameRate, $this->_params['hqFormat'], $options, $filename,
                $this->_params['quality'], $width, $height, $imageScale, $outputDir
            );
            
            $tmpImageDir = $outputDir . "/tmp-" . $filename;
            
            // Build movie frames
            $images = $this->_buildFramesFromMetaInformation($width, $height, $imageScale, $timestamps, $tmpImageDir);

            // Compile movie
            $filepath = $movie->buildMovie($images, $tmpImageDir);

            if (!file_exists($filepath)) {
                throw new Exception('The requested movie is either unavailable or does not exist.');
            }
            
            $url = str_replace(HV_ROOT_DIR, HV_WEB_ROOT_URL, $filepath);
            
            if ($this->_params['display'] === true) {
                return Movie_HelioviewerMovie::showMovie($url, $movie->width(), $movie->height());
            }

            return $url;
            
        } catch(Exception $e) {
            touch($outputDir . "/INVALID");
               throw new Exception("Unable to create movie: " . $e->getMessage(), $e->getCode());
        }
    }
    
    /**
     * Checks to make sure there are between 1 and 3 layers
     * 
     * @param array $layers -- an array of layer strings
     * 
     * @return void
     */
    private function _limitNumLayers ($layers)
    {
        if (sizeOf($layers) == 0 || sizeOf($layers) > 3) {
            $msg = "Invalid layer choices! You must specify 1-3 comma-separated layernames.";
            throw new Exception($msg);
        }    
    }
    
    /**
     * Checks to make sure there are at least 1 frame in the movie.
     * 
     * @param int  $numFrames    Number of frames in the movie
     * @param date $isoStartTime ISO Date string
     * @param date $isoEndTime   ISO Date string
     * 
     * @return void
     */
    private function _validateNumFrames($numFrames, $isoStartTime, $isoEndTime)
    {
        if ($numFrames == 0) {
            $msg = "There are not enough images for the given layers between " . toReadableISOString($isoStartTime) . " and " 
                 . toReadableISOString($isoEndTime);
            throw new Exception($msg, 1);
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
     * @param array  $eventInfo      an associative array with information gotten from HEK
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
                    $files[] = $this->buildMovie($params, $outputDir, true);
                } catch(Exception $e) {
                    // Log these error messages for now. See if they can be avoided in future.
                    throw $e;
                }
            }
        }

        return $files;
    }
    
    /**
     * Checks to see if the bounding box was given in the parameters or uses eventInfo if it wasn't.
     * 
     * @param array $params    The parameters from the API call
     * @param array $eventInfo an associative array with information gotten from HEK
     * 
     * @return array
     */
    private function _getBoundingBox($params, $eventInfo)
    {
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
    
    /**
     * Pads the bounding box up to a minimum size of roughly 400x400 pixels
     * 
     * @param array $box        The bounding box coordinates
     * @param float $imageScale The scale of the image in arcsec/pixel
     * 
     * @return array
     */
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
    
    /**
     * Checks to see if layers were specified in the parameters. If not, uses all source
     * id's from $eventInfo
     * 
     * @param array $params    The parameters from the API call
     * @param array $eventInfo an associative array with information gotten from HEK
     * 
     * @return array
     */
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
     * @param {Array}  $timestamps timestamps associated with each frame in the movie 
     * @param {String} $tmpDir     the directory where the frames will be stored
     * 
     * @return $images an array of built movie frames
     */
    private function _buildFramesFromMetaInformation($width, $height, $imageScale, $timestamps, $tmpDir) 
    {
        $builder = new Image_Screenshot_HelioviewerScreenshotBuilder();
        $images  = array();
        
        $frameNum = 0;
        
        // Movie frame parameters
        $params = array(
            'width'      => $width,
            'height'     => $height,
            'imageScale' => $imageScale,
            'layers'     => $this->_params['layers'],
            'quality'    => $this->_params['quality'],
            'sharpen'    => $this->_params['sharpen'],
            'edges'      => $this->_params['edges'],
            'x1'         => $this->_params['x1'],
            'x2'         => $this->_params['x2'],
            'y1'         => $this->_params['y1'],
            'y2'         => $this->_params['y2'],
            'watermarkOn'=> $this->_params['watermarkOn'],
            'display'    => false,
            'interlace'  => false,
            'format'     => 'png' //'bmp'
        );

        // Compile frames
        foreach ($timestamps as $time => $closestImages) {
            $params['obsDate']  = toISOString(parseUnixTimestamp($time));
            $params['filename'] = "frame" . $frameNum++;
            
            $image = $builder->takeScreenshot($params, $tmpDir, $closestImages);
            $images[] = $image;
        }

        // Copy the last frame so that it actually shows up in the movie for the same amount of time
        // as the rest of the frames.        
        $lastImage = dirname($image) . "/frame" . $frameNum . ".png";
        copy($image, $lastImage);
        $images[]  = $lastImage;
        
        return $images;
    }
    
    /**
     * Rescales width, height, and imageScale if the dimensions are larger than the
     * maximum allowed dimensions.
     * 
     * @return array The new image width, height and scale to use
     */
    private function _limitToMaximumDimensions()
    {
        $imageScale = $this->_params['imageScale'];
        $width      = ($this->_params['x2'] - $this->_params['x1']) / $imageScale;
        $height     = ($this->_params['y2'] - $this->_params['y1']) / $imageScale;  

        // Limit to maximum dimensions
        if ($width > $this->maxWidth || $height > $this->maxHeight) {
            $scaleFactor = min($this->maxWidth / $width, $this->maxHeight / $height);
            $width      *= $scaleFactor;
            $height     *= $scaleFactor;
            $imageScale /= $scaleFactor;
        }
        
        return array($width, $height, $imageScale);
    }
    
    /**
     * Fetches the closest images from the database for each given time. Adds them to the timestamp
     * array if they are not duplicates of sets of images in the timestamp array already. $closestImages
     * is an array with one image per layer, associated with their sourceId.
     * 
     * @param {Array} $layers    An array layers to use for movie generation
     * @param {int}   $startTime The Unix Timestamp of the start time
     * @param {float} $timeStep  The cadence or the movie
     * @param {int}   $numFrames The number of frames
     * 
     * @return array
     */
    private function _getTimestamps($layers, $startTime, $timeStep, $numFrames)
    {
        $timestamps = array();
        
        for ($time = $startTime; $time < $startTime + $numFrames * $timeStep; $time += $timeStep) {
            $isoTime = toISOString(parseUnixTimestamp(round($time)));
            $closestImages = $this->_getClosestImagesForTime($layers, $isoTime);

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
     * @param {Array} $layers  An array layers to use for movie generation
     * @param {Date}  $isoTime The ISO date string of the timestamp
     * 
     * @return array
     */
    private function _getClosestImagesForTime($layers, $isoTime)
    {
        $sourceIds  = array();
        
        $layerArray = getLayerArrayFromString($layers);
        foreach ($layerArray as $layer) {
            $layerInfo = singleLayerToArray($layer);
            array_push($sourceIds, getSourceIdFromLayerArray($layerInfo));
        }
        
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
     * @param Int $numFrames number of frames in the movie
     * 
     * @return Int optimized frame rate
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
}