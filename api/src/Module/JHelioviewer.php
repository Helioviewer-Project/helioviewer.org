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
     * Prints JHelioviewer module documentation
     *
     * @return void
     */
    public static function printDoc()
    {

    }

    /**
     * Finds the best match for a single JPEG 2000 image and either prints a link to it or displays
     * it directly.
     *
     * @return void
     */
    public function getJP2Image ()
    {
        include_once 'src/Database/ImgIndex.php';
        $imgIndex = new Database_ImgIndex();

        $date = $this->_params['date'];

        // Search by source id
        if (!isset($this->_params['sourceId'])) {
            $this->_params['sourceId'] = $imgIndex->getSourceId(
                $this->_params['observatory'], $this->_params['instrument'],
                $this->_params['detector'], $this->_params['measurement']
            );
        }

        $relativePath = $imgIndex->getJP2FilePath($date, $this->_params['sourceId']);

        $filepath = HV_JP2_DIR . $relativePath;

        if ($this->_params['jpip']) {
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
     * Converts a regular HTTP URL to a JPIP URL
     *
     * @param string $filepath    Location of JPX file
     * @param string $jp2Dir      The JPEG 2000 archive root directory
     * @param string $jpipBaseURL The JPIP Server base URL
     *
     * @return string A JPIP URL.
     */
    private function _getJPIPURL($filepath, $jp2Dir = HV_JP2_DIR, $jpipBaseURL = HV_JPIP_ROOT_URL)
    {
        $webRootRegex = "/" . preg_replace("/\//", "\/", $jp2Dir) . "/";
        $jpip = preg_replace($webRootRegex, $jpipBaseURL, $filepath);
        return $jpip;
    }

    /**
     * Constructs a JPX image series
     *
     * TODO 02/15/2010: Let jhv team know param change: "links" -> "linked"
     *
     * TODO 02/13/2010: Create new classes (e.g. JPEG2000/ImageSeries.php and/or JPEG2000/JPX.php)
     * and move some of the below complexity into those classes. That way it will also be easier to
     * test some of the methods that are private here (e.g. _getJPIPURL).
     *
     * @return void
     */
    public function getJPX ()
    {
        include_once 'src/Image/JPEG2000/HelioviewerJPXImage.php';

        // Create JPX image instance
        $jpx = new Image_JPEG2000_HelioviewerJPXImage(
            $this->_params['observatory'], $this->_params['instrument'], $this->_params['detector'],
            $this->_params['measurement'], $this->_params['sourceId'], $this->_params['startTime'],
            $this->_params['endTime'], $this->_params['cadence'], $this->_params['linked']
        );

        // Chose appropriate action based on request parameters
        if (!($this->_params['frames'] || $this->_params['verbose'])) {
            if ($this->_params['jpip']) {
                echo $jpx->getJPIPURL();
            } else {
                $jpx->displayImage();
            }
        } else {
            $jpx->printJSON($this->_params['jpip'], $this->_params['frames'], $this->_params['verbose']);
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
               "bools" => array("jpip"),
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
                "required" => array("startTime", "endTime", "cadence"),
                "optional" => array("sourceId"),
                "bools"    => array("jpip", "frames", "verbose", "linked"),
                "dates"    => array('startTime', 'endTime'),
                "ints"     => array('cadence')
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
}

?>