<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Helioviewer JHelioviewer Module Class Definition
 *
 * = 02/13/2010 =
 * MJ2 Creation has been removed since it is not currently being used.
 * To add support back in the future simply follow the same steps as for JPX
 * generation, but pass kdu_merge the additional sub-command:
 *
 *     -mj2_tracks P:0-@25
 *
 * PHP version 5
 *
 * @category Modules
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once 'interface.Module.php';

/**
 * Provides methods for assisting JHelioviewer such as JPEG 2000 archive
 * searching and JPX file generation
 *
 * @category Modules
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 *
 */
class Module_JHelioviewer implements Module
{
    /**
     * API Request parameters
     *
     * @var mixed
     */
    private $_params;

    /**
     * Creates a JHelioviewer module instance
     *
     * @param array &$params API Request parameters.
     *
     * @return void
     */
    public function __construct(&$params)
    {
        $this->_params = $params;
    }

    /**
     * execute
     *
     * @return void
     */
    public function execute()
    {
        if ($this->validate()) {
            $this->{$this->_params['action']}();
        }
    }

    /**
     * Validate the requested action and input
     *
     * @return void
     */
    public function validate()
    {
        switch($this->_params['action'])
        {
        case "getJP2Image":
            $expected = array(
               "bools" => array("getJPIP", "debug"),
               "dates" => array('date')
            );

            if (isset($this->_params["sourceId"])) {
                $expected["required"] = array('date', 'sourceId');
                $expected["ints"]     = array('sourceId');
            } else {
                $expected["required"] = array('date', 'observatory', 'instrument', 'detector', 'measurement');
            }
            break;

        case "getJPX":
            $expected = array(
                "bools" => array("getJPIP", "frames", "verbose", "links", "debug"),
                "dates" => array('startTime', 'endTime'),
                "ints"  => array('cadence')
            );
            break;
        default:
            break;
        }

        if (isset($expected)) {
            Validation_InputValidator::checkInput($expected, $this->_params);
        }

        return true;
    }

    /**
     * Prints JHelioviewer module documentation
     *
     * @return void
     */
    public static function printDoc()
    {

    }

    /**
     * Converts a regular HTTP URL to a JPIP URL
     *
     * @param string $url         An HTTP URL.
     * @param string $jp2Dir      The JPEG 2000 archive root directory
     * @param string $jpipBaseURL The JPIP Server base URL
     *
     * @return string A JPIP URL.
     */
    private function _getJPIPURL($url, $jp2Dir = HV_JP2_DIR, $jpipBaseURL = HV_JPIP_ROOT_URL)
    {
        $webRootRegex = "/" . preg_replace("/\//", "\/", $jp2Dir) . "/";
        $jpip = preg_replace($webRootRegex, $jpipBaseURL, $url);
        return $jpip;
    }

    /**
     * Finds the best match for a single JPEG 2000 image and either prints a link to it or displays
     * it directly.
     *
     * @return void
     */
    public function getJP2Image ()
    {
        include_once 'lib/Database/ImgIndex.php';
        $imgIndex = new Database_ImgIndex();

        $date = $this->_params['date'];

        // Search by source id
        if (!isset($this->_params['sourceId'])) {
            $this->_params['sourceId'] = $imgIndex->getSourceId(
                $this->_params['observatory'], $this->_params['instrument'],
                $this->_params['detector'], $this->_params['measurement']
            );
        }

        $relativePath = $imgIndex->getJP2FilePath($date, $this->_params['sourceId'], $this->_params['debug']);

        $filepath = HV_JP2_DIR . $relativePath;

        if ($this->_params['getJPIP']) {
            echo $this->_getJPIPURL($filepath);
        } else {
            $this->_displayJP2($filepath);
        }
    }

    /**
     * Prints a JP2 image to the screen
     *
     * @param string $filepath The location of the image to be displayed.
     *
     * @return void
     */
    private function _displayJP2($filepath)
    {
        $fp   = fopen($filepath, 'r');
        $stat = stat($filepath);

        $exploded = explode("/", $filepath);
        $filename = end($exploded);

        header("Content-Length: " . $stat['size']);
        header("Content-Type: "   . image_type_to_mime_type(IMAGETYPE_JP2));
        header("Content-Disposition: attachment; filename=\"$filename\"");

        $contents = fread($fp, $stat['size']);

        echo $contents;
        fclose($fp);
    }

    /**
     * Prints a JPX image to the screen
     *
     * @param string $filepath The location of the jpx file to be displayed.
     *
     * @return void
     */
    private function _displayJPX($filepath)
    {
        $fp   = fopen($filepath, 'r');
        $stat = stat($filepath);

        $exploded = explode("/", $filepath);
        $filename = end($exploded);

        header("Content-Length: " . $stat['size']);
        header("Content-Type: "   . image_type_to_mime_type(IMAGETYPE_JPX));
        header("Content-Disposition: attachment; filename=\"$filename\"");

        $contents = fread($fp, $stat['size']);

        echo $contents;
        fclose($fp);
    }

    /**
     * Constructs a JPX image series
     *
     * TODO 02/13/2010: Create new classes (e.g. JPEG2000/ImageSeries.php and/or JPEG2000/JPX.php)
     * and move some of the below complexity into those classes. That way it will also be easier to
     * test some of the methods that are private here (e.g. _getJPIPURL).
     *
     * @return void
     */
    public function getJPX ()
    {
        $startTime   = $this->_params['startTime'];
        $endTime     = $this->_params['endTime'];
        $cadence     = $this->_params['cadence'];
        $jpip        = $this->_params['getJPIP'];
        $links       = $this->_params['links'];
        $frames      = $this->_params['frames'];
        $verbose     = $this->_params['verbose'];
        $debug       = $this->_params['debug'];
        $observatory = $this->_params['observatory'];
        $instrument  = $this->_params['instrument'];
        $detector    = $this->_params['detector'];
        $measurement = $this->_params['measurement'];

        $message     = null;

        // Filename
        $filename = $this->getJPXFilename(
            $startTime, $endTime, $cadence, $observatory, $instrument, $detector, $measurement, $links
        );

        // Filepath
        $filepath = HV_JP2_DIR . '/movies/' . $filename;

        // URL
        if ($jpip) {
            $url = $this->_getJPIPURL($filepath);
        } else {
            $url = HV_JP2_ROOT_URL . "/movies/" . $filename;
        }

        // If the file doesn't exist already, create it
        if (!file_exists($filepath) || $frames) {
            include_once 'lib/Database/ImgIndex.php';
            include_once 'lib/Helper/DateTimeConversions.php';

            // Connect to database
            $imgIndex = new Database_ImgIndex();

            if (!isset($this->_params['sourceId'])) {
                $source = $imgIndex->getSourceId($observatory, $instrument, $detector, $measurement);
            } else {
                $source = $this->_params["sourceId"];
            }

            // Determine number of frames to grab
            $timeInSecs = toUnixTimestamp($endTime) - toUnixTimestamp($startTime);
            $numFrames  = ceil($timeInSecs / $cadence);

            // If the requested number of movie frames would exceed maximum allowed, decrease cadence to span
            // request window and grab the maximum number of frames at that cadence
            // TODO 02/13/2010 Adjust filename to reflect actual cadence... perform this before file_exists check?
            if ($numFrames > HV_MAX_JPX_FRAMES) {
                $cadence   = $cadence * ($numFrames / HV_MAX_JPX_FRAMES);
                $numFrames = HV_MAX_JPX_FRAMES;
                $message   = "Warning: Movie cadence has been increased to one image every $cadence seconds in order
                              to avoid exceeding the maximum allowed number of frames (" . HV_MAX_JPX_FRAMES . ").";
            }

            // Get JPX image frames
            $images = $this->getJPXImageFrames(
                toUnixTimestamp($startTime), $numFrames, $cadence, $source, $imgIndex, $debug
            );

            // Build JPX
            $this->buildJPXImage($images, $links, $filepath);
        }

        // JSON output
        if ($frames || $verbose) {
            $output = array("uri" => $url);

            // Include image timestamps to speed up streaming
            if ($frames) {
                $timestamps = array();
                foreach ($images as $img) {
                    $exploded = explode("/", $img);
                    $dateStr = substr(end($exploded), 0, 24);
                    $regex   = '/(\d+)_(\d+)_(\d+)__(\d+)_(\d+)_(\d+)_(\d+)/';
                    $utcDate = preg_replace($regex, '$1-$2-$3T$4:$5:$6.$7Z', $dateStr);
                    array_push($timestamps, toUnixTimestamp($utcDate));
                }
                $output["frames"] = $timestamps;
            }

            // Verbose mode
            if ($verbose) {
                $output["message"] = $message;
            }
            header('Content-Type: application/json');
            print json_encode($output);
        } elseif (!$jpip) {
            echo $url;
        } else {
            $this->_displayJPX($filepath);
        }
    }

    /**
     * Given a set of JP2 images, runs kdu_merge to build a single JPX image from them
     *
     * @param array  $frames A list of JP2 filepaths
     * @param bool   $links  If true, then a linked JPX file will be created
     * @param string $outputFile Location to output file to
     *
     * @return void
     */
    public function buildJPXImage($frames, $links, $outputFile)
    {
        //Append filepaths to kdu_merge command
        $cmd = HV_KDU_MERGE_BIN . " -i ";

        foreach ($frames as $jp2) {
            $cmd .= "$jp2,";
        }

        // Drop trailing comma
        $cmd = substr($cmd, 0, -1);

        // Virtual JPX files
        if ($links) {
            $cmd .= " -links";
        }

        $cmd .= " -o $outputFile";

        // Execute kdu_merge command
        exec(HV_PATH_CMD . " " . escapeshellcmd($cmd), $output, $return);
    }

    /**
     * Returns a list of JP2 files to use for JPX generation
     *
     * @param int $startTime JPX Start time unix timestamp
     *
     * @return array List of filepaths to use for JPX generation
     */
    public function getJPXImageFrames($startTime, $numFrames, $cadence, $source, $imgIndex, $debug)
    {
        // Timer
        $time = $startTime;

        $images = array();

        // Get nearest JP2 images to each time-step
        for ($i = 0; $i < $numFrames; $i++) {
            $isoDate = toISOString(parseUnixTimestamp($time));
            $jp2 = HV_JP2_DIR . $imgIndex->getJP2FilePath($isoDate, $source, $debug);
            array_push($images, $jp2);
            $time += $cadence;
        }

        // Remove redundant entries and return
        return array_unique($images);
    }

    public function printJSON($frames, $message)
    {

    }

    /**
     * Determines filename to use for storing generated JPX image. Filenames are of the form:
     *
     *  Obs_Inst_Det_Meas_FROM_TO_BY(L).jpx
     *
     * @return string Filename to use for generated JPX image
     */
    public function getJPXFilename($startTime, $endTime, $cadence, $obs, $inst, $det, $meas, $links)
    {
        $from = str_replace(":", ".", $startTime);
        $to   = str_replace(":", ".", $endTime);
        $filename = implode("_", array($obs, $inst, $det, $meas, "F$from", "T$to", "B$cadence"));

        // Differentiate linked JPX files
        if ($links) {
            $filename .= "L";
        }

        return str_replace(" ", "-", $filename) . ".jpx";
    }
}

?>