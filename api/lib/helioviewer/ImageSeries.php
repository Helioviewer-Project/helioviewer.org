<?php
/*
 * Created on Sep 15, 2008
 *
 * Note: For movies, it is easiest to work with Unix timestamps since that is what is returned
 *       from the database. To get from a javascript Date object to a Unix timestamp, simply
 *       use "date.getTime() * 1000." (getTime returns the number of miliseconds)
 */
require_once ('CompositeImage.php');
require_once ('DbConnection.php');
require_once ('lib/phpvideotoolkit/config.php');
require_once ('lib/phpvideotoolkit/phpvideotoolkit.php5.php');

class ImageSeries
{
    private $images = array ();
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
    private $watermarkURL = "/var/www/hv/images/logos/watermark_small_gs.png";
    private $watermarkOptions = "-x 720 -y 965 ";

    /*
     * constructor
     */
    public function __construct($layers, $startTime, $zoomLevel, $numFrames, $frameRate, $hqFormat, $xRange, $yRange, $options, $timeStep)
    {
        date_default_timezone_set('UTC');

        $this->layers = $layers;
        // startTime is a Unix timestamp in seconds.
        $this->startTime = $startTime;
        $this->zoomLevel = $zoomLevel;
        $this->numFrames = $numFrames;
        $this->frameRate = $frameRate;
        $this->highQualityFiletype = $hqFormat;
        $this->xRange = $xRange;
        $this->yRange = $yRange;
        $this->options = $options;
        // timeStep is in seconds
        $this->timeStep = $timeStep;

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

    /*
     * buildMovie
     * @TDOD: is it possible to combine getImageTimestamps and getFilePaths so that the combined
     * function just sets $this->imageTimestamps and $this->images?
     */
    public function buildMovie()
    {
        // Make a temporary directory to store the movie in.
 //       $now = time();
 		$now = 1;
        $movieName = "Helioviewer-Movie-".$this->startTime;
        $tmpdir = Config::TMP_ROOT_DIR."/$now/";
        $tmpurl = Config::TMP_ROOT_URL."/$now/$movieName.".$this->filetype;
        mkdir($tmpdir);
		
        // Build an array with all timestamps needed when requesting images
        $timeStamps = array ();

        // Calculates unix time stamps, successively increasing by the time step (default step is 86400 seconds, or 1 day)
        for ($time = $this->startTime; $time <= $this->startTime+($this->numFrames*$this->timeStep); $time += $this->timeStep)
        {
            array_push($timeStamps, $time);
        }

		// Array that holds $closestImages for each layer
//		$layerImages = array();
		/*
		 * Right now there is only one layer so I'm using $closestImages by itself for now.
		 */
		$closestImages = array(); 		
        foreach ($this->layers as $layer)
        {
            // Extract info from $layer
            $obs = substr($layer, 0, 3);
            $inst = substr($layer, 3, 3);
            $det = substr($layer, 6, 3);
            $meas = substr($layer, 9, 3);

            // Array to hold timestamps corresponding to each image, and each image's uri
//            $closestImages = array ();
            $closestImages = $this->getImageTimestamps($obs, $inst, $det, $meas, $timeStamps);
//			array_push($layerImages, $closestImages);
        }
		
  		$frameNum = 0;
   	    foreach ($closestImages as $image) {
         	$compImage = new CompositeImage($this->layers, $this->zoomLevel, $this->xRange, $this->yRange, $this->options, $image);
          	$filename = $tmpdir.$frameNum.'.jpg';
           	$compImage->writeImage($filename);

            array_push($this->images, $filename);
			$frameNum++;
		}

            // Use phpvideotoolkit to compile them

    }

    /*
     * Queries the database to find the exact timestamps for images nearest each time in $timeStamps.
     * Returns an array the size of numFrames that has 'timestamp', 'unix_timestamp', 'timediff', 'timediffAbs', and 'uri'
     * for each image.
     */
    private function getImageTimestamps($obs, $inst, $det, $meas, $timeStamps)
    {
        $resultArray = array ();

        // Go through the array and find the closest image in the database to the given timeStamp
        if ($timeStamps)
        {
            foreach ($timeStamps as $time)
            {
                $sql = sprintf("SELECT DISTINCT timestamp, UNIX_TIMESTAMP(timestamp) AS unix_timestamp, UNIX_TIMESTAMP(timestamp) - %d AS timediff, ABS(UNIX_TIMESTAMP(timestamp) - %d) AS timediffAbs, uri 
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

        return $resultArray;
    }

    /*	private function getFilepath($obs, $inst, $det, $meas, $time) {
     // Convert unix timestamp back to date and time
     $date = strftime("%Y,%m,%d,%H,%M,%S", $time);
     sscanf($date, "%s,%s,%s,%s,%s,%s", $year, $month, $day, $hour, $min, $sec);
     $path = $this->rootDir . implode("/", array($year, $month, $day));
     $path .= "/$obs/$inst/$det/$meas/";
     $path .= implode("_", array($year, $month, $day, $hour . $min . $sec, $obs, $inst, $det, $meas)) . ".jp2";
     return $path;
     }
     */
    /*
     * quickMovie
     */
    public function quickMovie()
    {
        // Make a temporary directory
        $now = time();
        $movieName = "Helioviewer-Quick-Movie-".$this->startTime;
        $tmpdir = Config::TMP_ROOT_DIR."/$now/";
        $tmpurl = Config::TMP_ROOT_URL."/$now/$movieName.".$this->filetype;
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
    // 		if there was an error then get it
    echo $toolkit->getLastError()."<br />\r\n";
exit ;
}

// 	execute the ffmpeg command
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
    // 		if there was an error then get it
    echo $toolkit->getLastError()."<br />\r\n";
exit ;
}

//$this->showMovie($tmpurl, 512, 512);

header('Content-type: application/json');
echo json_encode($tmpurl);
}

/*
 * getImageTimes
 *
 * Queries the database and returns an array of times of size equal to $this->numFrames.
 * If specified, each time will be chosen to be as close as possible to the time in the same
 * indice of the $times array. Otherwise it will simply return an array of the closest
 * times to $this->startTime.
 */
private function getImageTimes($layer, $times = null)
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

/*
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
