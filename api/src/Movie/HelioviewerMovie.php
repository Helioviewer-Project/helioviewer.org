<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Movie_HelioviewerMovie Class Definition
 *
 * PHP version 5
 *
 * @category Movie
 * @package  Helioviewer
 * @author   Jaclyn Beck <jabeck@nmu.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once HV_ROOT_DIR . '/api/lib/phpvideotoolkit/config.php';
require_once HV_ROOT_DIR . '/api/lib/phpvideotoolkit/phpvideotoolkit.php5.php';
require_once HV_ROOT_DIR . '/api/src/Image/ImageMetaInformation.php';
require_once HV_ROOT_DIR . '/api/src/Helper/DateTimeConversions.php';
/**
 * Represents a static (e.g. ogv/mp4) movie generated by Helioviewer
 *
 * Note: For movies, it is easiest to work with Unix timestamps since that is what is returned
 *       from the database. To get from a javascript Date object to a Unix timestamp, simply
 *       use "date.getTime() * 1000." (getTime returns the number of miliseconds)
 *
 * @category Movie
 * @package  Helioviewer
 * @author   Jaclyn Beck <jabeck@nmu.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Movie_HelioviewerMovie
{
    private $_images = array ();
    private $_metaInfo;
    private $_maxFrames;
    private $_startTime;
    private $_endTime;
    private $_timeStep;
    private $_numFrames;
    private $_frameRate;
    private $_db;
    private $_baseScale = 2.63;
    private $_baseZoom = 10;
    private $_tileSize = 512;
    private $_filetype = "flv";
    private $_highQualityLevel = 100;
    private $_highQualityFileType;
    private $_watermarkOptions = "-x 720 -y 965 ";
    private $_filename;
    private $_options;
    private $_quality;
    private $_padDimensions;

    /**
     * HelioviewerMovie Constructor
     *
     * @param int    $startTime Requested movie start time (unix timestamp)
     * @param int    $numFrames Number of frames to include
     * @param int    $frameRate Number of frames per second
     * @param string $hqFormat  Format to use for high-quality version of the movie
     * @param array  $options   An array with ["edges"] => true/false, ["sharpen"] => true/false
     * @param int    $timeStep  Desired timestep between movie frames in seconds. Default is 86400 seconds, or 1 day.
     * @param string $filename  Desired filename for the movie
     * @param int    $quality   Movie quality
     * @param Object $meta      An ImageMetaInformation object with width, height, and imageScale
     */
    public function __construct(
        $startTime, $numFrames, $frameRate, $hqFormat,
        $options, $timeStep, $filename, $quality, $meta
    ) {
        $this->_metaInfo = $meta;

        // working directory
        $this->tmpDir = HV_TMP_DIR;
        if (!file_exists($this->tmpDir)) {
            mkdir($this->tmpDir, 0777, true);
            chmod($this->tmpDir, 0777);
        }

        // _startTime is a Unix timestamp in seconds.
        $this->_startTime  = $startTime;
        $this->_numFrames  = $numFrames;
        $this->_frameRate  = $frameRate;
        $this->_quality    = $quality;
        $this->_options    = $options;

        // _timeStep is in seconds
        $this->_timeStep  = $timeStep;
        $this->_filename   = $filename;

        $this->_endTime = $startTime + ($numFrames * $timeStep);

        $this->_padDimensions = $this->_setAspectRatios();
        $this->_highQualityFiletype = $hqFormat;
    }

    /**
     * TODO: implement
     *
     * @return void
     */
    public function toMovie()
    {

    }

    /**
     * TODO: implement
     *
     * @return void
     */
    public function toArchive()
    {

    }

    /**
     * TODO: implement
     *
     * @return void
     */
    public function getNumFrames()
    {

    }
    
    /**
     * Get width
     * 
     * @return int width
     */
    public function width()
    {
        return $this->_metaInfo->width();
    }
    
    /**
     * Get height
     * 
     * @return int height
     */
    public function height()
    {
        return $this->_metaInfo->height();
    }

    /**
     * Builds the requested movie
     *
     * Makes a temporary directory to store frames in, calculates a timestamp for every frame, gets the closest
     * image to each timestamp for each layer. Then takes all layers belonging to one timestamp and makes a movie frame
     * out of it. When done with all movie frames, phpvideotoolkit is used to compile all the frames into a movie.
     * 
     * @param array $builtImages An array of built movie frames (in the form of HelioviewerScreenshot objects)
     *
     * @return void
     */
    public function buildMovie($builtImages)
    {
        $this->_images = $builtImages;
        // Make a temporary directory to store the movie in.
        $now       = time();
        $movieName = /*"Helioviewer-Movie-" . */$this->_filename;
        $tmpdir    = HV_TMP_DIR . "/$now/";

        $tmpurl    = HV_TMP_ROOT_URL . "/$now/$movieName." . $this->_filetype;
        mkdir($tmpdir);
        chmod($tmpdir, 0777);

        // Pad to a 16:9 aspect ratio by adding a black border around the image.
        // This is set up so that width CAN be padded if it's uncommented. Currently it is not padded.
        foreach ($this->_images as $image) {
            //$imgWidth = $this->_imageSize["width"];
            //$width     = $this->padDimensions["width"];
            //$widthDiff = ($width - $imgWidth) / 2;

            $imgHeight = $this->_metaInfo->height();
            $height = $this->_padDimensions["height"];
            $heightDiff = ($height - $imgHeight) / 2;

            if (/*$widthDiff > 0 || */ $heightDiff > 0) {
                $padCmd = ' && convert -bordercolor black -border 0x' . $heightDiff . " " . $image . " " . $image;
                exec(HV_PATH_CMD . escapeshellcmd($padCmd));
            }
        }

        // Use phpvideotoolkit to compile them
        $toolkit = new PHPVideoToolkit($tmpdir);

        // compile the image to the tmp dir
        $ok = $toolkit->prepareImagesForConversionToVideo($this->_images, $this->_frameRate);

        if (!$ok) {
            // if there was an error then get it
            logErrorMsg("PHPVideoToolkit: {$toolkit->getLastError()}");
            exit();
        }

        $toolkit->setVideoOutputDimensions(ceil($this->_metaInfo->width()), ceil($this->_metaInfo->height()));
    
        // Need to do something slightly different to get the video to be iPod compatible
        if ($this->_highQualityFiletype === "ipod") {
            return $this->_createIpodVideo($tmpdir, $toolkit, $movieName);
        }
        
        // set the output parameters (Flash video)
        $output_filename = "$movieName." . $this->_filetype;

        $ok = $toolkit->setOutput($tmpdir, $output_filename, PHPVideoToolkit::OVERWRITE_EXISTING);

        if (!$ok) {
            //         if there was an error then get it
            logErrorMsg("PHPVideoToolkit: {$toolkit->getLastError()}");
            exit();
        }

        //     execute the ffmpeg command
        $movie = $toolkit->execute(false, true);

        // check the return value in-case of error
        if ($movie !== PHPVideoToolkit::RESULT_OK) {
            // if there was an error then get it
            logErrorMsg("PHPVideoToolkit: {$toolkit->getLastError()}");
        }
        
        // Create a high-quality version as well
        $hq_filename = "$movieName." . $this->_highQualityFiletype;
        $toolkit->setConstantQuality($this->_highQualityLevel);

        // Use ASF for Windows
        if ($this->_highQualityFiletype == "avi") {
            $toolkit->setFormat(PHPVideoToolkit::FORMAT_ASF);
        }

        // Use MPEG-4 for Mac
        if ($this->_highQualityFiletype == "mov") {
            $toolkit->setVideoCodec(PHPVideoToolkit::FORMAT_MPEG4);
        }

        $this->_createHighQualityVideo($tmpdir, $toolkit, $movieName);

        return $tmpdir . $movieName . "." . $this->_filetype;
    }
    
    private function _createIpodVideo($tmpdir, $toolkit, $movieName) 
    {
    	$this->_highQualityFiletype = "mp4";
    	
    	$this->_createHighQualityVideo($tmpdir, $toolkit, $movieName);
    	
        $hq_filename = "$movieName." . $this->_highQualityFiletype;
        $ipodVideoName = $tmpdir . "ipod-$hq_filename";
        $cmd = "/usr/bin/ffmpeg -i " . $tmpdir . $hq_filename . " -f mp4 -acodec "
            . "libmp3lame -ar 48000 -ab 64k -vcodec libx264 -b 800k -flags +loop "
            . "-cmp +chroma -subq 5 -trellis 1 -refs 1 -coder 0 -me_range 16 "
            . "-keyint_min 25 -sc_threshold 40 -i_qfactor 0.71 -bt 200k -maxrate "
            . "96k -bufsize 96k -rc_eq 'blurCplx^(1-qComp)' -qcomp 0.6 -qmin 10 "
            . "-qmax 51 -qdiff 4 -level 30 -g 30 -async 2 " . $ipodVideoName;

        exec(escapeshellcmd($cmd));
        if (file_exists($tmpdir . $hq_filename))
        {
            unlink($tmpdir . $hq_filename);
        }
        return $ipodVideoName;
    }
    
    /**
     * Creates a high quality version of the video and then unlinks all images
     * used to create the movie.
     * 
     * @param string $tmpdir
     * @param object $toolkit
     * @param string $movieName
     * 
     * @return void
     */
    private function _createHighQualityVideo($tmpdir, $toolkit, $movieName)
    {
        // Create a high-quality version as well
        $hq_filename = "$movieName." . $this->_highQualityFiletype;
        $toolkit->setConstantQuality($this->_highQualityLevel);
        
        $ok = $toolkit->setOutput($tmpdir, $hq_filename, PHPVideoToolkit::OVERWRITE_EXISTING);

        if (!$ok) {
            // if there was an error then get it
            logErrorMsg("PHPVideoToolkit: {$toolkit->getLastError()}");
        }

        // execute the ffmpeg command
        $mp4 = $toolkit->execute(false, true);

        if ($mp4 !== PHPVideoToolkit::RESULT_OK) {
            //         if there was an error then get it
            logErrorMsg("PHPVideoToolkit: {$toolkit->getLastError()}");
        }

        // Clean up png/tif images that are no longer needed
        foreach ($this->_images as $image) {
        	if (file_exists($image)) 
        	{
                unlink($image);
        	}     
        }    	
    }

    /**
     * Adds black border to movie frames if neccessary to guarantee a 16:9 aspect ratio
     *
     * Checks the ratio of width to height and adjusts each dimension so that the
     * ratio is 16:9. The movie will be padded with a black background in JP2Image.php
     * using the new width and height.
     *
     * @return array Width and Height of padded movie frames
     */
    private function _setAspectRatios()
    {
        $width  = $this->_metaInfo->width();
        $height = $this->_metaInfo->height();

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
     * Displays movie in a Flash player along with a link to the high-quality version
     *
     * @param string $url    The URL for the movie to be displayed
     * @param int    $width  Movie width
     * @param int    $height Movie Height
     *
     * @return void
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
