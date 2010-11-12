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
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Movie_HelioviewerMovieBuilder
{
    private   $_imgIndex;
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
     * @return {String} a url to the movie, or the movie will display.
     */
    public function buildMovie($layersStr, $startTimeStr, $imageScale, $x1, $x2, $y1, $y2, $options) 
    {
        $defaults = array(
            'display'     => true,
            'endTime'     => false,
            'filename'    => false,
            'frameRate'   => false,
            'hqFormat'    => "mp4",
            'numFrames'   => false,
            'quality'     => 10,
            'uuid'        => false,
            'watermarkOn' => true
        );
        
        $options = array_replace($defaults, $options);
        
        list($width, $height, $imageScale) = $this->_limitToMaximumDimensions($imageScale, $x1, $x2, $y1, $y2);

        //Check to make sure values are acceptable
        try {
            //Limit number of layers to three
            $layers = getLayerArrayFromString($layersStr);

            $this->_checkNumLayers($layers);
        
            list($startTimestamp, $endTimestamp) = $this->_getStartAndEndTimes($startTimeStr, $options['endTime']);
            
            // Some functions expect date strings instead of unix timestamps
            $startDateString = toISOString(parseUnixTimestamp($startTimestamp));
            $endDateString   = toISOString(parseUnixTimestamp($endTimestamp));

            // Compute the optimal number of frames to include in the movie
            $optimalNumFrames = $this->_getOptimalNumFrames($layers, $startDateString, $endDateString, $options['numFrames']);
            
            // Create directories in cache to store movies
            $cacheDir = $this->_createCacheDirectories($options['uuid']);
            
            $tmpImageDir = $cacheDir . "/frames";
            
            // Make sure that data was found to create a movie
            if ($optimalNumFrames == 0) {
                $msg = sprintf("There are not enough images for the given layers between %s and %s.", 
                               toReadableISOString($startDateString), toReadableISOString($endDateString));

                throw new Exception($msg, 1);
            }
            
            // Compute the optimal movie cadence
            $cadence = $this->_determineOptimalCadence($startTimestamp, $endTimestamp, $optimalNumFrames);
            
            // Find the actual movie frames
            $timestamps = $this->_getTimestamps($layersStr, $startTimestamp, $cadence, $optimalNumFrames);
            
            $numFrames = sizeOf($timestamps);
            
            // Make sure that data was found to create a movie
            if ($numFrames == 0) {
                $msg = sprintf("There are not enough images for the given layers between %s and %s.", 
                               toReadableISOString($startDateString), toReadableISOString($endDateString));

                throw new Exception($msg, 1);
            }
           
            // Compute filename
            if (!$options['filename']) {
                $start = str_replace(array(":", "-", "T", "Z"), "_", $startDateString);
                $end   = str_replace(array(":", "-", "T", "Z"), "_", $endDateString);
                $filename = $start . "_" . $end . $this->buildFilename($layers);
            } else {
                $filename = $options['filename'];
            }

            // Subtract 1 because we added an extra frame to the end
            $frameRate = $this->_determineOptimalFrameRate($numFrames - 1, $options['frameRate']);
            
            // Instantiate movie class
            $movie = new Movie_HelioviewerMovie(
                $startTimestamp, $numFrames, $frameRate, $options['hqFormat'], $filename,
                $options['quality'], $width, $height, $imageScale, $cacheDir
            );
            
            // Build movie frames
            $images = $this->_buildFramesFromMetaInformation(
                $layersStr, $imageScale, $timestamps, $x1, $x2, $y1, $y2, $tmpImageDir, $options['quality'], $options['watermarkOn']
            );

            // Compile movie
            $filepath = $movie->buildMovie($images, $tmpImageDir);
            
            $url = str_replace(HV_ROOT_DIR, HV_WEB_ROOT_URL, $filepath);
            
            if ($options['display'] === true) {
                echo Movie_HelioviewerMovie::showMovie($url, $movie->width(), $movie->height());
            } else {
                header('Content-type: application/json');
                echo json_encode(array("url" => $filepath));   
            }
            
        } catch(Exception $e) {
            touch($cacheDir . "/INVALID");
               throw new Exception("Unable to create movie: " . $e->getMessage(), $e->getCode());
        }
    }
    
    /**
     * Create directories in cache used to store movies
     */
    private function _createCacheDirectories ($uuid) {
        if (!$uuid) {
            $uuid = uuid_create(UUID_TYPE_DEFAULT);
        }

        $cacheDir = HV_CACHE_DIR . "/movies/" . $uuid;

        if (!file_exists($cacheDir)) {
            mkdir($cacheDir, 0777, true);
            chmod($cacheDir, 0777);
        }
        
        return $cacheDir;
    }
    
    /**
     * Checks to make sure there are between 1 and 3 layers
     * 
     * @param array $layers -- an array of layer strings
     * 
     * @return void
     */
    private function _checkNumLayers ($layers)
    {
        if (sizeOf($layers) == 0 || sizeOf($layers) > 3) {
            $msg = "Invalid layer choices! You must specify 1-3 comma-separated layernames.";
            throw new Exception($msg);
        }    
    }
    

    /**
     * Determines appropriate start and end times to use for movie generation and returns timestamps for those times
     *
     * @return array
     */
    private function _getStartAndEndTimes ($startTimeString, $endTimeString)
    {
        $startTime = toUnixTimestamp($startTimeString);
        
        // Convert to seconds.
        $defaultWindow = HV_DEFAULT_MOVIE_TIME_WINDOW_IN_HOURS * 3600;

        // If endTime is not given, endTime defaults to 24 hours after startTime.
        if (!$endTimeString) {
            $endTime = $startTime + $defaultWindow;
        } else {
            $endTime = toUnixTimestamp($endTimeString);
        }
        
        $now = time();
        
        // If startTime is within a day of "now", then endTime becomes "now" and the startTime becomes "now" - 24H.
        if ($now - $startTime < $defaultWindow) {
            $endTime   = $now;
            $startTime = $now - $defaultWindow;
        }

        return array($startTime, $endTime);
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
    public function createForEvent($params, $eventInfo, $outputDir) 
    {
        $format = ".flv";
        $filename = "";
        
        // iPod modifications
        if (isset($params['ipod']) && $params['ipod']) {
            $params['hqFormat'] = "ipod";
            $outputDir .= "/iPod";
            $format = ".mp4";
        } else {
            $outputDir .= "/regular";
        }
        
        // Base filename
        $filename .= "Movie_";
        
        // Compute region of interest
        $box = $this->_getBoundingBox($params, $eventInfo);

        // Break up layer string into separate layers
        $layers = $this->_getLayersFromParamsOrSourceIds($params, $eventInfo);
        
        // Array to keep track of movies
        $files  = array();

        foreach ($layers as $layer) {
            $layerFilename = $filename . $params['eventId'] . $this->buildFilename(getLayerArrayFromString($layer));

            // If movie already exists, use cached version
            if (!HV_DISABLE_CACHE && file_exists($outputDir . "/" . $layerFilename . $format)) {
                $files[] = $outputDir . "/" . $layerFilename . $format;
                
            // Otherwise generate movie
            } else {
                try {
                    
                    $options = array(
                        "display"  => false,
                        "endTime"  => $params['endTime'],
                        "filename" => $layerFilename
                    );
                    
                    //$files[] = $this->buildMovie($params, $outputDir, true);
                    $files[] = $this->buildMovie(
                        $layer, $params['startTime'], $params['imageScale'], $box['x1'], $box['x2'], $box['y1'], $box['y2'],
                        $options
                    );
                } catch(Exception $e) {
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
    //private function _buildFramesFromMetaInformation($imageScale, $timestamps, $tmpDir) 
    private function _buildFramesFromMetaInformation($layers, $imageScale, $timestamps, $x1, $x2, $y1, $y2, $tmpDir, $quality, $watermarkOn)
    {
        $builder = new Image_Screenshot_HelioviewerScreenshotBuilder();
        $images  = array();
        
        $frameNum = 0;
        
        // Movie frame parameters
        $options = array(
            'quality'    => $quality,
            'watermarkOn'=> $watermarkOn,
            'outputDir'  => $tmpDir,
            'display'    => false,
            'interlace'  => false,
            'format'     => 'jpg' //'bmp'
        );
        
        // Compile frames
        foreach ($timestamps as $time => $closestImages) {
            $obsDate = toISOString(parseUnixTimestamp($time));
            
            $options = array_merge($options, array(
                'filename'      => "frame" . $frameNum++,
                'closestImages' => $closestImages
            ));
                        
            $image = $builder->takeScreenshot($layers, $obsDate, $imageScale, $x1, $x2, $y1, $y2, $options);
            
            $images[] = $image;
        }

        // Copy the last frame so that it actually shows up in the movie for the same amount of time
        // as the rest of the frames.        
        $lastImage = dirname($image) . "/frame" . $frameNum . ".jpg";
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
    private function _limitToMaximumDimensions($imageScale, $x1, $x2, $y1, $y2)
    {
        $width      = ($x2 - $x1) / $imageScale;
        $height     = ($y2 - $y1) / $imageScale;  

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
    private function _getOptimalNumFrames($layers, $startTime, $endTime, $numFrames)
    {
        $maxInRange = 0;
        
        foreach ($layers as $layer) {
            $layerInfo = singleLayerToArray($layer);
            $sourceId  = getSourceIdFromLayerArray($layerInfo);

            $maxInRange = max($maxInRange, $this->_imgIndex->getImageCount($startTime, $endTime, $sourceId));
        }

        // If the user specifies numFrames, use the minimum of their number and the maximum images in range.
        if ($numFrames !== false) {
            $numFrames = min($maxInRange, $numFrames);
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
    private function _determineOptimalFrameRate($numFrames, $requestedFrameRate)
    {
        $duration  = HV_DEFAULT_MOVIE_PLAYBACK_IN_SECONDS;
        $frameRate = $numFrames / $duration;
        
        // Take the smaller number in case the user specifies a larger
        // frame rate than is practical.
        if ($requestedFrameRate) {
            $frameRate = min($frameRate, $requestedFrameRate);
        }

        return $frameRate;
    }
}