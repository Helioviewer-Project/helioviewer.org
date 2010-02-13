<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Helioviewer JHelioviewer Module Class Definition
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
               "bools" => array("getURL", "getJPIP", "debug"),
               "dates" => array('date')
            );

            if (isset($this->_params["sourceId"])) {
                $expected["required"] = array('date', 'sourceId');
                $expected["ints"]     = array('sourceId');
            } else {
                $expected["required"] = array('date', 'observatory', 'instrument', 'detector', 'measurement');
            }
            break;

        case "buildJP2ImageSeries":
            // Need to fix bools now for linked jpx check below
            $bools = array("getURL", "getJPIP", "links", "frames", "verbose", "debug");
            Validation_InputValidator::checkBools($bools, $this->_params);

            $expected = array(
                "dates" => array('startTime', 'endTime'),
                "ints"  => array('cadence')
            );

            if ($this->_params['links'] && ($this->_params['format'] != "JPX")) {
                throw new Exception('Format must be set to "JPX" in order to create a linked image series.');
            }
            break;
        case "getJPX":
            break;
        case "getMJ2":
            break;
        case "getJP2ImageSeries":
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
        include_once 'lib/Database/DbConnection.php';
        $imgIndex = new Database_ImgIndex(new Database_DbConnection());

        $date = $this->_params['date'];

        // Search by source id
        if (!isset($this->_params['sourceId'])) {
            $this->_params['sourceId'] = $imgIndex->getSourceId(
                $this->_params['observatory'], $this->_params['instrument'],
                $this->_params['detector'], $this->_params['measurement']
            );
        }

        $filepath = $imgIndex->getJP2FilePath($date, $this->_params['sourceId'], $this->_params['debug']);

        $uri = HV_JP2_DIR . $filepath;

        // http url (full path)
        if ($this->_params['getURL']) {
            $webRootRegex = "/" . preg_replace("/\//", "\/", HV_JP2_DIR) . "/";
            $url = preg_replace($webRootRegex, HV_JP2_ROOT_URL, $uri);
            echo $url;

        } else if ($this->_params['getJPIP']) {
            // jpip url
            echo $this->_getJPIPURL($uri);

        } else {
            // jp2 image
            $fp = fopen($uri, 'r');
            $stat = stat($uri);

            $exploded = explode("/", $filepath);
            $filename = end($exploded);

            header("Content-Length: " . $stat['size']);
            header("Content-Type: "   . image_type_to_mime_type(IMAGETYPE_JP2));
            header("Content-Disposition: attachment; filename=\"$filename\"");

            $contents = fread($fp, $stat['size']);

            echo $contents;
            fclose($fp);
        }
    }

    /**
     * Gets a JPX image series
     *
     * @return void
     */
    public function getJPX ()
    {
        $this->_params['format'] = 'JPX';
        $this->_params['action'] = 'buildJP2ImageSeries';
        $this->execute();
    }

    /**
     * Gets a Motion JPEG 2000 (MJ2) movie.
     *
     * @return void
     */
    public function getMJ2 ()
    {
        $this->_params['format'] = 'MJ2';
        $this->_params['action'] = 'buildJP2ImageSeries';
        $this->execute();
    }

    /**
     * Gets a JPX or MJ2 file
     *
     * @deprecated
     * @return void
     */
    public function getJP2ImageSeries ()
    {
        $this->_params['action'] = 'buildJP2ImageSeries';
        $this->execute();
    }

    /**
     *  Note: It's also possible in PHP 5.3 to increment DateTime
     *  objects directly:
     *
     *     date_add($dt, new DateInterval("T" . $cadence . "S"));
     *
     *  @return void
     */

    /**
     * Constructs a JPX/MJ2 image series
     *
     * @return void
     */
    public function buildJP2ImageSeries ()
    {
        include_once 'lib/Database/ImgIndex.php';
        include_once 'lib/Database/DbConnection.php';
        include_once 'lib/Helper/DateTimeConversions.php';

        $startTime   = toUnixTimestamp($this->_params['startTime']);
        $endTime     = toUnixTimestamp($this->_params['endTime']);
        $cadence     = $this->_params['cadence'];
        $jpip        = $this->_params['getJPIP'];
        $format      = $this->_params['format'];
        $links       = $this->_params['links'];
        $frames      = $this->_params['frames'];
        $verbose     = $this->_params['verbose'];
        $debug       = $this->_params['debug'];
        $observatory = $this->_params['observatory'];
        $instrument  = $this->_params['instrument'];
        $detector    = $this->_params['detector'];
        $measurement = $this->_params['measurement'];

        // Create a temporary directory to store image-
        // TODO: Move this + other directory creation to installation script
        $dir = HV_JP2_DIR . "/movies/";

        // Filename (From,To,By)
        $from = str_replace(":", ".", $this->_params['startTime']);
        $to   = str_replace(":", ".", $this->_params['endTime']);
        $filenameParts = array($observatory, $instrument, $detector, $measurement, "F$from", "T$to", "B$cadence");
        $filename = implode("_", $filenameParts);

        // Differentiate linked JPX files
        if ($links) {
            $filename .= "L";
        }

        // File extension
        $filename = str_replace(" ", "-", $filename) . "." . strtolower($format);

        // Filepath
        $output_file = $dir . $filename;

        // URL
        $url = HV_JP2_ROOT_URL . "/movies/" . $filename;

        // If the file doesn't exist already, create it
        if (!file_exists($output_file) || $frames) {
            // Connect to database
            $imgIndex = new Database_ImgIndex(new Database_DbConnection());

            if (!isset($this->_params['sourceId'])) {
                $source = $imgIndex->getSourceId($observatory, $instrument, $detector, $measurement);
            } else {
                $source = $this->_params["sourceId"];
            }

            //var_dump($source);

            // Determine number of frames to grab
            $timeInSecs = $endTime - $startTime;
            $numFrames  = min(HV_MAX_JPX_FRAMES, ceil($timeInSecs / $cadence));

            // Timer
            $time = $startTime;

            $images = array();

            include_once 'lib/Helper/DateTimeConversions.php';

            // Get nearest JP2 images to each time-step
            for ($i = 0; $i < $numFrames; $i++) {
                $isoDate = toISOString(parseUnixTimestamp($time));
                $jp2 = HV_JP2_DIR . $imgIndex->getJP2FilePath($isoDate, $source, $debug);
                array_push($images, $jp2);
                $time += $cadence;
            }

            // Remove redundant entries
            $images = array_unique($images);

            // Append filepaths to kdu_merge command
            $cmd = HV_KDU_MERGE_BIN . " -i ";
            foreach ($images as $jp2) {
                $cmd .= "$jp2,";
            }

            // Drop trailing comma
            $cmd = substr($cmd, 0, -1);

            // Virtual JPX files
            if ($links) {
                $cmd .= " -links";
            }

            $cmd .= " -o $output_file";

            // MJ2 Creation
            if ($format == "MJ2") {
                $cmd .= " -mj2_tracks P:0-@25";
            }

            //die($cmd);

            // Execute kdu_merge command
            exec(HV_PATH_CMD . " " . escapeshellcmd($cmd), $output, $return);
        }

        // URL
        if ($jpip) {
            $uri = $this->_getJPIPURL($output_file);
        } else {
            $uri = $url;
        }

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
            header('Content-Type: application/json');
            print json_encode(array("uri" => $uri, "frames" => $timestamps));
        } else {
            print $uri;
        }
    }
}

?>