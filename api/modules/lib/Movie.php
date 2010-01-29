<?php
/*
 * Created on Sep 15, 2008
 * Modified on 7-30-2009 by Jaclyn Beck
 * 
 * Note: For movies, it is easiest to work with Unix timestamps since that is what is returned
 *       from the database. To get from a javascript Date object to a Unix timestamp, simply
 *       use "date.getTime() * 1000." (getTime returns the number of miliseconds)
 */

require_once ('MovieFrame.php');
require_once ('DbConnection.php');
require_once ('lib/phpvideotoolkit/config.php');
require_once ('lib/phpvideotoolkit/phpvideotoolkit.php5.php');

class Movie
{
    private $images = array ();
    private $imageSize;
    private $maxFrames;
    private $startTime;
    private $endTime;
    private $timeStep;
    private $db;
    private $baseScale = 2.63;
    private $baseZoom = 10;
    private $tileSize = 512;
    private $filetype = "flv";
    private $highQualityLevel = 100;
    private $watermarkOptions = "-x 720 -y 965 ";

    /**
     * Constructor
     * @param object $layers is an array with at least one value, in the format of OBS_INST_DET_MEAS,xstart,xsize,ystart,ysize,hcOffsetx,hcOffsety,opacity
     * @param object $startTime is a unix timestamp.
     * @param object $zoomLevel is a number between 8-15 (for now) with 10 being the default, base zoom level.
     * @param object $numFrames is a number between 1 and 150, with the default being 40.
     * @param object $frameRate is almost always 8.
     * @param object $hqFormat
     * @param object $options is an array with ["edges"] => true/false, ["sharpen"] => true/false
     * @param object $timeStep is in seconds. Default is 86400 seconds, or 1 day. 
     * @param array $imageSize -- width and height of image
     * @param string $filename -- desired filename for the image
     */
    public function __construct($layers, $startTime, $zoomLevel, $numFrames, $frameRate, $hqFormat, $options, $timeStep, $imageSize, $filename, $quality)
    {
        date_default_timezone_set('UTC');
        // $layers is an array of layer information arrays, identified by their layer names.
        // Each layer information array has values for "name", "xRange", "yRange", "hcOffset", and "opacityValue"
        $this->layers = $layers;
        
        // working directory
        $this->tmpdir = substr(getcwd(), 0, -3) + "tmp"; 
        
        // startTime is a Unix timestamp in seconds.
        $this->startTime = $startTime;
        $this->zoomLevel = $zoomLevel;
        $this->numFrames = $numFrames;
        $this->frameRate = $frameRate;
        $this->quality     = $quality;
        $this->options      = $options;
        
        // timeStep is in seconds
        $this->timeStep  = $timeStep;
        $this->imageSize = $imageSize;
        $this->filename     = $filename;

        $this->padDimensions         = $this->setAspectRatios();
        $this->highQualityFiletype     = $hqFormat;
        $this->db = new DbConnection();
    }

    /*
     * toMovie
     */
    public function toMovie()
    {

    }

    /*
     * toArchive
     */
    public function toArchive()
    {

    }

    /*
     * getNumFrames
     */
    public function getNumFrames()
    {

    }

    /**
     * buildMovie
     * Makes a temp directory to store frames in, calculates a timestamp for every frame, gets the closest image to 
     * each timestamp for each layer. Then takes all layers belonging to one timestamp and makes a movie frame out of it.
     * When done with all movie frames, phpvideotoolkit is used to compile all the frames into a movie.
     */
    public function buildMovie()
    {
        // Make a temporary directory to store the movie in.
        $now = time();
        $movieName = "Helioviewer-Movie-" . $this->filename;
        $tmpdir = HV_TMP_ROOT_DIR . "/$now/";
        $tmpurl = HV_TMP_ROOT_URL . "/$now/$movieName." . $this->filetype;
        mkdir($tmpdir);
        chmod($tmpdir, 0777);

        // Build an array with all timestamps needed when requesting images
        $timeStamps = array ();

        // Calculates unix time stamps, successively increasing by the time step (default step is 86400 seconds, or 1 day)
        for ($time = $this->startTime; $time < $this->startTime + ($this->numFrames * $this->timeStep); $time += $this->timeStep)
        {
            array_push($timeStamps, $time);
        }

        // Array that holds $closestImage array for each layer
        $layerImages = array();
        
        // Array to hold timestamps corresponding to each image, and each image's uri
        $closestImage = array(); 
                
        foreach ($this->layers as $layer)
        {
            // $layerInfo will have values Array ("obs_inst_det_meas", xStart, xSize, yStart, ySize, offsetx, offsety, opacity)
            $layerInfo = explode(",", $layer);

            // name is now: 'obs_inst_det_meas'
            $name = $layerInfo[0];

            // closestImage is an associative array the size of numFrames with each entry having: 
            // Array('timestamp', 'unix_timestamp', 'timediff', 'timediffAbs', 'uri', 'opacityGrp')
            $closestImage = $this->getImageTimestamps($name, $timeStamps);
            
            // layerImages is an associative array the size of the number of layers. An example entry would be: 
            // layerImages['SOH_EIT_EIT_304'] = closestImage array. So each entry has an array of the closest images to each timestamp.
            $layerImages[$name] = $closestImage;
        }

        // For each frame, make a composite image of all layers at that timestamp
        for($frameNum = 0; $frameNum < $this->numFrames; $frameNum++) {
            // images array holds one image from each layer (the closest images to a specific timestamp)
            $images = array();
            $realTimestamps = array();
            
            foreach($this->layers as $layer) {
                $layerInfo = explode(",", $layer);    

                // name is 'SOH_EIT_EIT_304'
                $name = $layerInfo[0];
                
                // Chop the name off the array but keep the rest of the information.
                // ranges is an array: [xStart, xSize, yStart, ySize, offsetX, offsetY, opacity]
                $ranges = array_slice($layerInfo, 1);
                
                $closestImage = $layerImages[$name][$frameNum];
                
                // $image is now: "uri,xStart,xSize,yStart,ySize,opacity,opacityGrp"
                $image =  $closestImage['uri'] . "," . implode(",", $ranges) . "," .$closestImage['opacityGrp'];
                $images[$name] = $image;
                $realTimestamps[$name] = $closestImage['timestamp'];
            }    

            // All frames will be put in cache/movies/$now        
            $movieFrame = new MovieFrame($this->zoomLevel, $this->options, $images, $frameNum, $now, $this->imageSize, $realTimestamps, $this->quality);    
            $frameFile = $movieFrame->getComposite(); 

            array_push($this->images, $frameFile);
        }    

        // Pad to a 16:9 aspect ratio by adding a black border around the image.
        // This is set up so that width CAN be padded if it's uncommented. Currently it is not padded.
        foreach($this->images as $image) {
            //$imgWidth = $this->imageSize["width"];
            //$width     = $this->padDimensions["width"];
            //$widthDiff = ($width - $imgWidth) / 2;
            
            $imgHeight = $this->imageSize["height"];
            $height = $this->padDimensions["height"];
            $heightDiff = ($height - $imgHeight) / 2;
            
            if(/*$widthDiff > 0 || */ $heightDiff > 0) {
                exec(HV_PATH_CMD . escapeshellcmd(" && convert -bordercolor black -border " . /*$widthDiff*/ 0 . "x" . $heightDiff . " " . $image . " " . $image));
            }
        }
        
        // Use phpvideotoolkit to compile them
        $toolkit = new PHPVideoToolkit($tmpdir);
        
        // compile the image to the tmp dir
        $ok = $toolkit->prepareImagesForConversionToVideo($this->images, $this->frameRate);
        
        if (!$ok) {
            // if there was an error then get it
            $error = "[PHPVideotoolkit][" . date("Y/m/d H:i:s") . "]\n\t " . $toolkit->getLastError() . "\n\n";
            file_put_contents(HV_ERROR_LOG, $error,FILE_APPEND);
            print $error;
            die();
        }

        $toolkit->setVideoOutputDimensions($this->imageSize['width'], $this->imageSize['height']);
    
        // set the output parameters (Flash video)
        $output_filename = "$movieName." . $this->filetype;
        $ok = $toolkit->setOutput($tmpdir, $output_filename, PHPVideoToolkit::OVERWRITE_EXISTING);
        
        if (!$ok) {
            //         if there was an error then get it
            $error = "[PHPVideotoolkit][" . date("Y/m/d H:i:s") . "]\n\t " . $toolkit->getLastError() . "\n\n";
            file_put_contents(HV_ERROR_LOG, $error,FILE_APPEND);
            print $error;
            die();
        }
    
        //     execute the ffmpeg command
        $movie = $toolkit->execute(false, true);

        // check the return value in-case of error
        if ($movie !== PHPVideoToolkit::RESULT_OK) {
            // if there was an error then get it
            $error = "[PHPVideotoolkit][" . date("Y/m/d H:i:s") . "]\n\t " . $toolkit->getLastError() . "\n\n";
            file_put_contents(HV_ERROR_LOG, $error,FILE_APPEND);
            print $error;
            die();
        }

        // Create a high-quality version as well
        $hq_filename = "$movieName." . $this->highQualityFiletype;
        $toolkit->setConstantQuality($this->highQualityLevel);
    
        // Use ASF for Windows
        if ($this->highQualityFiletype == "avi")
            $toolkit->setFormat(PHPVideoToolkit::FORMAT_ASF);
        
        // Use MPEG-4 for Mac
        if ($this->highQualityFiletype == "mov")
            $toolkit->setVideoCodec(PHPVideoToolkit::FORMAT_MPEG4);
    
        // Add a watermark
        //$watermark = HV_ROOT_DIR . "/images/logos/watermark_small_gs.png"; 
//        $toolkit->addWatermark($watermark, PHPVIDEOTOOLKIT_FFMPEG_IMLIB2_VHOOK, $this->watermarkOptions);
        
        $ok = $toolkit->setOutput($tmpdir, $hq_filename, PHPVideoToolkit::OVERWRITE_EXISTING);
            
        if (!$ok) {
            // if there was an error then get it
            $error = "[PHPVideotoolkit][" . date("Y/m/d H:i:s") . "]\n\t " . $toolkit->getLastError() . "\n\n";
            file_put_contents(HV_ERROR_LOG, $error,FILE_APPEND);
            print $error;
            die();
        }

        // execute the ffmpeg command
        $mp4 = $toolkit->execute(false, true);
        
        if ($mp4 !== PHPVideoToolkit::RESULT_OK) {
            //         if there was an error then get it
            $error = "[PHPVideotoolkit][" . date("Y/m/d H:i:s") . "]\n\t " . $toolkit->getLastError() . "\n\n";
            file_put_contents(HV_ERROR_LOG, $error,FILE_APPEND);
            print $error;
            die();
        }

        // Clean up png/tif images that are no longer needed
        foreach($this->images as $image) {
            unlink($image);
        }    

//        $this->showMovie($tmpurl, 512, 512);
        
        header('Content-type: application/json');
        echo json_encode($tmpurl);
    }

    /**
     * @description Checks the ratio of width to height and adjusts each dimension so that the
     *                 ratio is 16:9. The movie will be padded with a black background in JP2Image.php
     *                 using the new width and height.
     */
    private function setAspectRatios() {
        $width  = $this->imageSize["width"];
        $height = $this->imageSize["height"];
        
        $ratio = $width / $height;

        // Commented out because padding the width looks funny. 
        /*
        // If width needs to be adjusted but height is fine
        if ($ratio < 16/9) {
            $adjust = (16/9) * $height / $width;
            $width *= $adjust;
        }
        */    
        // Adjust height if necessary
        if ($ratio > 16/9) {
            $adjust = (9/16) * $width / $height;
            $height *= $adjust;
        }
        
        $dimensions = array("width" => $width, "height" => $height);
        return $dimensions;
    }
            
    /**
     * Queries the database to find the exact timestamps for images nearest each time in $timeStamps.
     * Returns an array the size of numFrames that has 'timestamp', 'unix_timestamp', 'timediff', 'timediffAbs', 'uri', and 'opacityGrp'
     * for each image.
     */
    private function getImageTimestamps($name, $timeStamps) //($obs, $inst, $det, $meas, $timeStamps)
    {
        $resultArray = array ();

        // Go through the array and find the closest image in the database to the given timeStamp
        if ($timeStamps)
        {
            foreach ($timeStamps as $time)
            {
                // sprintf takes too long, especially when it is called 40+ times.
/*                $sql = sprintf("SELECT DISTINCT timestamp, UNIX_TIMESTAMP(timestamp) AS unix_timestamp, UNIX_TIMESTAMP(timestamp) - %d AS timediff, ABS(UNIX_TIMESTAMP(timestamp) - %d) AS timediffAbs, uri, opacityGrp 
                        FROM image
                            LEFT JOIN measurement on measurementId = measurement.id
                            LEFT JOIN measurementType on measurementTypeId = measurementType.id
                            LEFT JOIN detector on detectorId = detector.id
                            LEFT JOIN opacityGroup on opacityGroupId = opacityGroup.id
                            LEFT JOIN instrument on instrumentId = instrument.id
                            LEFT JOIN observatory on observatoryId = observatory.id
                         WHERE observatory.abbreviation='%s' AND instrument.abbreviation='%s' AND detector.abbreviation='%s' AND measurement.abbreviation='%s' ORDER BY timediffAbs LIMIT 0,1",
                $time, $time, mysqli_real_escape_string($this->db->link, $obs), mysqli_real_escape_string($this->db->link, $inst), mysqli_real_escape_string($this->db->link, $det), mysqli_real_escape_string($this->db->link, $meas));
*/
                $sql = "SELECT DISTINCT timestamp, UNIX_TIMESTAMP(timestamp) AS unix_timestamp, UNIX_TIMESTAMP(timestamp) - $time AS timediff, ABS(UNIX_TIMESTAMP(timestamp) - $time) AS timediffAbs, uri, opacityGrp
                            FROM image WHERE uri LIKE '%_%_%_%_" . mysqli_real_escape_string($this->db->link, $name) . ".jp2' ORDER BY timediffAbs LIMIT 0,1";
                try {
                    $result = $this->db->query($sql);
                    $row = mysqli_fetch_array($result, MYSQL_ASSOC);
                    if(!$row)
                        throw new Exception("Could not find the requested image.");
                }
                catch (Exception $e) {
                    $error = "[getImageTimestamps][" . date("Y/m/d H:i:s") . "]\n\t " . $e->getMessage() . "\n\n";
                    file_put_contents(HV_ERROR_LOG, $error,FILE_APPEND);
                    print $error;
                    die();
                }

                array_push($resultArray, $row);
            }
        }

        return $resultArray;
    }

    /*
     * quickMovie
    
    public function quickMovie()
    {
        // Make a temporary directory
        $now = time();
        $movieName = "Helioviewer-Quick-Movie-".$this->startTime;
        $tmpdir = HV_TMP_ROOT_DIR."/$now/";
        $tmpurl = HV_TMP_ROOT_URL."/$now/$movieName.".$this->filetype;
        mkdir($tmpdir);

        // Create an array of the timestamps to use for each layer
        $imageTimes = array ();

        // Create another array to keep track of the dimensions to use for each layer
        $dimensions = array ();

        $i = 0;
        foreach ($this->layers as $layer)
        {
            // Get dimensions to display for the layer
            $d = $this->getMovieDimensions($layer);

            // Make sure that at least some tiles are visible in the viewport
            if (($d['width'] > 0) && ($d['height'] > 0))
            {
                array_push($dimensions, $d);

                if ($i == 0)
                    $times = $this->getImageTimes($layer);
                else
                    $times = $this->getImageTimes($layer, $imageTimes[0]);

                array_push($imageTimes, $times);
            }
    
            // Remove the layer if it is not visible
            else
            {
                array_splice($this->layers, $i, 1);
            }
            $i++;
        }
    
        // PAD IF NECESSARY? (OR OFFSET... WHICHEVER IS EASIER... USE LARGEST IMAGE AS A GUIDELINE)
        
        //print_r($dimensions);
        //exit();
        
        //print "<br>" . sizeOf($imageTimes) . "<br><br>";
        
        // For each frame, create a composite images and store it into $this->images
        for ($j = 0; $j < $this->numFrames; $j++)
        {
        
            // CompositeImage expects an array of timestamps
            $timestamps = array ();
        
        // Grab timestamp for each layer
        foreach ($imageTimes as $time)
        {
            array_push($timestamps, $time[$j]['unix_timestamp']);
        }
        
        // Build a composite image
        $img = new CompositeImage($this->layers, $timestamps, $this->zoomLevel, $this->options);
        $filename = $tmpdir.$j.'.jpg';
        $img->writeImage($filename);
        
        array_push($this->images, $filename);
        }
        
        // init PHPVideoToolkit class
        $toolkit = new PHPVideoToolkit($tmpdir);
        
        // compile the image to the tmp dir
        $ok = $toolkit->prepareImagesForConversionToVideo($this->images, $this->frameRate);
        if (!$ok)
        {
            // if there was an error then get it
            echo $toolkit->getLastError()."<br />\r\n";
        exit ;
        }
        
        $toolkit->setVideoOutputDimensions(1024, 1024);
        
        // set the output parameters (Flash video)
        $output_filename = "$movieName.".$this->filetype;
        $ok = $toolkit->setOutput($tmpdir, $output_filename, PHPVideoToolkit::OVERWRITE_EXISTING);
        if (!$ok)
        {
            //         if there was an error then get it
            echo $toolkit->getLastError()."<br />\r\n";
        exit ;
        }
        
        //     execute the ffmpeg command
        $quickMov = $toolkit->execute(false, true);
        
        // check the return value in-case of error
        if ($quickMov !== PHPVideoToolkit::RESULT_OK)
        {
            // if there was an error then get it
            echo $toolkit->getLastError()."<br />\r\n";
        exit ;
        }
        
        // Create a high-quality version as well
        $hq_filename = "$movieName.".$this->highQualityFiletype;
        $toolkit->setConstantQuality($this->highQualityLevel);
        
        // Use ASF for Windows
        if ($this->highQualityFiletype == "avi")
            $toolkit->setFormat(PHPVideoToolkit::FORMAT_ASF);
        
        // Use MPEG-4 for Mac
        if ($this->highQualityFiletype == "mov")
            $toolkit->setVideoCodec(PHPVideoToolkit::FORMAT_MPEG4);
        
        // Add a watermark
        $toolkit->addWatermark($this->watermarkURL, PHPVIDEOTOOLKIT_FFMPEG_IMLIB2_VHOOK, $this->watermarkOptions);
        
        $ok = $toolkit->setOutput($tmpdir, $hq_filename, PHPVideoToolkit::OVERWRITE_EXISTING);
        if (!$ok)
        {
            // if there was an error then get it
            echo $toolkit->getLastError()."<br />\r\n";
        exit ;
        }
        
        // execute the ffmpeg command
        $mp4 = $toolkit->execute(false, true);
        if ($mp4 !== PHPVideoToolkit::RESULT_OK)
        {
            //         if there was an error then get it
            echo $toolkit->getLastError()."<br />\r\n";
        exit ;
        }
        
        //$this->showMovie($tmpurl, 512, 512);
        
        header('Content-type: application/json');
        echo json_encode($tmpurl);
    }
*/
    /*
     * getImageTimes
     *
     * Queries the database and returns an array of times of size equal to $this->numFrames.
     * If specified, each time will be chosen to be as close as possible to the time in the same
     * indice of the $times array. Otherwise it will simply return an array of the closest
     * times to $this->startTime.
     */
/*    private function getImageTimes($layer, $times = null)
    {
        $obs = substr($layer, 0, 3);
        $inst = substr($layer, 3, 3);
        $det = substr($layer, 6, 3);
        $meas = substr($layer, 9, 3);
        
        $resultArray = array ();
        
        //If $times is defined, correlate returned times to it.
        if ($times)
        {
            foreach ($times as $time)
            {
                $time = $time['unix_timestamp'];
                $sql = sprintf("SELECT DISTINCT timestamp, UNIX_TIMESTAMP(timestamp) AS unix_timestamp, UNIX_TIMESTAMP(timestamp) - %d AS timediff, ABS(UNIX_TIMESTAMP(timestamp) - %d) AS timediffAbs 
                                    FROM image
                                        LEFT JOIN measurement on measurementId = measurement.id
                                        LEFT JOIN measurementType on measurementTypeId = measurementType.id
                                        LEFT JOIN detector on detectorId = detector.id
                                        LEFT JOIN opacityGroup on opacityGroupId = opacityGroup.id
                                        LEFT JOIN instrument on instrumentId = instrument.id
                                        LEFT JOIN observatory on observatoryId = observatory.id
                                     WHERE observatory.abbreviation='%s' AND instrument.abbreviation='%s' AND detector.abbreviation='%s' AND measurement.abbreviation='%s' ORDER BY timediffAbs LIMIT 0,1",
                $time, $time, mysqli_real_escape_string($this->db->link, $obs), mysqli_real_escape_string($this->db->link, $inst), mysqli_real_escape_string($this->db->link, $det), mysqli_real_escape_string($this->db->link, $meas));
            
            $result = $this->db->query($sql);
            $row = mysqli_fetch_array($result, MYSQL_ASSOC);
            array_push($resultArray, $row);
            }
        }
    
        //Otherwise simply return the closest times to the startTIme specified
        else
        {
            $sql = sprintf("SELECT DISTINCT timestamp, UNIX_TIMESTAMP(timestamp) AS unix_timestamp, UNIX_TIMESTAMP(timestamp) - %d AS timediff, ABS(UNIX_TIMESTAMP(timestamp) - %d) AS timediffAbs 
                            FROM image
                                LEFT JOIN measurement on measurementId = measurement.id
                                LEFT JOIN measurementType on measurementTypeId = measurementType.id
                                LEFT JOIN detector on detectorId = detector.id
                                LEFT JOIN opacityGroup on opacityGroupId = opacityGroup.id
                                LEFT JOIN instrument on instrumentId = instrument.id
                                LEFT JOIN observatory on observatoryId = observatory.id
                             WHERE observatory.abbreviation='%s' AND instrument.abbreviation='%s' AND detector.abbreviation='%s' AND measurement.abbreviation='%s' ORDER BY timediffAbs LIMIT 0,%d",
            $this->startTime, $this->startTime, mysqli_real_escape_string($this->db->link, $obs), mysqli_real_escape_string($this->db->link, $inst), mysqli_real_escape_string($this->db->link, $det), mysqli_real_escape_string($this->db->link, $meas), $this->numFrames);
        
            //echo "SQL: $sql <br><br>";
            
            $result = $this->db->query($sql);
            
            while ($row = mysqli_fetch_array($result, MYSQL_ASSOC))
            {
                array_push($resultArray, $row);
            }
            
            //Sort the results
            foreach ($resultArray as $key=>$row)
            {
                $timediff[$key] = $row['timediff'];
            }
            array_multisort($timediff, SORT_ASC, $resultArray);
        }
        return $resultArray;
    }
*/
    /**
     * showMovie
     */
    public function showMovie($url, $width, $height)
    {
        ?>
        <!-- MC Media Player -->
        <script type="text/javascript">
            playerFile = "http://www.mcmediaplayer.com/public/mcmp_0.8.swf";
            fpFileURL = "<?php print $url?>";
            playerSize = "<?php print $width . 'x' . $height?>";
        </script>
        <script type="text/javascript" src="http://www.mcmediaplayer.com/public/mcmp_0.8.js">
        </script>
        <!-- / MC Media Player -->
        <?php
    }
}
?>
