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
            try {
                $this->{$this->_params['action']}();
            } catch (Exception $e) {
                handleError($e->getMessage(), $e->getCode());
            }
        }
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

        // TEMP Work-around
        if ($this->_params['measurement'] == "white light") {
            $this->_params['measurement'] = "white-light";
        }

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
            if ($this->_params['json']) {
                header('Content-type: application/json;charset=UTF-8');
                echo json_encode(array("uri" => $this->_getJPIPURL($filepath)));
            } else {
                echo $this->_getJPIPURL($filepath);
            }
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
     * @return void
     */
    public function getJPX ()
    {
        include_once 'src/Image/JPEG2000/HelioviewerJPXImage.php';

        // TEMP Work-around
        if ($this->_params['measurement'] == "white light") {
            $this->_params['measurement'] = "white-light";
        }

        // Create JPX image instance
        try {
            $jpx = new Image_JPEG2000_HelioviewerJPXImage(
                $this->_params['observatory'], $this->_params['instrument'], $this->_params['detector'],
                $this->_params['measurement'], $this->_params['sourceId'], $this->_params['startTime'],
                $this->_params['endTime'], $this->_params['cadence'], $this->_params['linked']
            );
        } catch (Exception $e) {
            header('Content-type: application/json;charset=UTF-8');
            echo json_encode(array(
                "error"   => $e->getMessage(), 
                "message" => $e->getMessage(), // DEPRECATED (https://bugs.edge.launchpad.net/jhelioviewer/+bug/621223)
                "uri"     => null
            ));
            return;
        }

        // JPIP URL
        if ($this->_params['jpip']) {
            $jpip = true;
        } else {
            $jpip = false;
        }

        // Chose appropriate action based on request parameters
        if (!($this->_params['frames'] || $this->_params['verbose'])) {
            if ($jpip) {
                echo $jpx->getJPIPURL();
            } else {
                $jpx->displayImage();
            }             
        } else {
            $jpx->printJSON($jpip, $this->_params['frames'], $this->_params['verbose']);
        }
    }
    
    /**
     * launchJHelioviewer
     *
     * @return void
     */
    public function launchJHelioviewer ()
    {
        $args = array($this->_params['startTime'], $this->_params['endTime'], 
                      $this->_params['imageScale'], $this->_params['layers']);
     
        header('content-type: application/x-java-jnlp-file');
        header('content-disposition: attachment; filename="JHelioviewer.jnlp"');
        echo '<?xml version="1.0" encoding="utf-8"?>' . "\n";

        ?>
            <jnlp spec="1.0+" codebase="http://achilles.nascom.nasa.gov/~dmueller/jhv/" href="JHelioviewer.jnlp">
                <information>
                    <title>JHelioviewer</title>
                    <vendor>ESA</vendor>
                    <homepage href="index.html" />
                    <description>JHelioviewer web launcher</description>
                    <offline-allowed />
                </information>
            
                <resources>
                    <j2se version="1.5+" max-heap-size="1000M"/>
                    <jar href="JHelioviewer.jar" />
                </resources>
            
                <security>
                    <all-permissions />
                </security>
            
                <application-desc main-class="org.helioviewer.JavaHelioViewer">
                    <argument>-jhv</argument>
                    <argument><?php vprintf("[startTime=%s;endTime=%s;linked=true;imageScale=%f;imageLayers=%s]", $args);?></argument>
                </application-desc>
            </jnlp>
        <?php
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
        case 'getJP2Image':
            $expected = array(
               'bools' => array('jpip', 'json'),
               'dates' => array('date')
            );

            if (isset($this->_params['sourceId'])) {
                $expected['required'] = array('date', 'sourceId');
                $expected['ints']     = array('sourceId');
            } else {
                $expected['required'] = array('date', 'observatory', 'instrument', 'detector', 'measurement');
            }
            break;

        case 'getJPX':
            $expected = array(
                'required' => array('startTime', 'endTime'),
                'optional' => array('sourceId', 'cadence'),
                'bools'    => array('jpip', 'frames', 'verbose', 'linked'),
                'dates'    => array('startTime', 'endTime'),
                'ints'     => array('cadence')
            );

            break;
        case "launchJHelioviewer":
            $expected = array(
                'required' => array('startTime', 'endTime', 'imageScale', 'layers'),
                'floats'   => array('imageScale'),
                'dates'    => array('startTime', 'endTime'),
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
     * Prints the JHelioviewer module's documentation header
     * 
     * @return void
     */
    public static function printDocHeader()
    {
        ?>
            <li>
                <a href="index.php#JPEG2000API">JPEG 2000</a>
                <ul>
                    <li><a href="index.php#getJP2Image">Retrieving a JPEG 2000 Image</a></li>
                    <li><a href="index.php#getJPX">Creating a JPX Movie</a></li>
                </ul>
            </li>
        <?php     
    }


    /**
     * Prints JHelioviewer module documentation
     *
     * @return void
     */
    public static function printDoc()
    {
        ?>
        <!-- JPEG 2000 API -->
        <div id="JPEG2000API">
            <h1>JPEG 2000 API:</h1>
            <p>Helioviewer's JPEG 2000 API's enable access to the raw JPEG 2000 images used to generate the tiles seen on the
            site, as well as real-time generation of JPEG 2000 Image Series (JPX).</p>
            <ol style="list-style-type: upper-latin;">
                <!-- JPEG 2000 Image API -->
                <li>
                <div id="getJP2Image">JP2 Images:
                <p>Returns a single JPEG 2000 (JP2) image. If an image is not available for the date request the closest
                available image is returned.</p>
        
                <br />
        
                <div class="summary-box"><span
                    style="text-decoration: underline;">Usage:</span><br />
                <br />
        
                <?php echo HV_API_ROOT_URL;?>?action=getJP2Image<br />
                <br />
        
                Supported Parameters:<br />
                <br />
        
                <table class="param-list" cellspacing="10">
                    <tbody valign="top">
                        <tr>
                            <td width="25%"><b>observatory</b></td>
                            <td width="35%"><i>String</i></td>
                            <td>Observatory</td>
                        </tr>
                        <tr>
                            <td><b>instrument</b></td>
                            <td><i>String</i></td>
                            <td>Instrument</td>
                        </tr>
                        <tr>
                            <td><b>detector</b></td>
                            <td><i>String</i></td>
                            <td>Detector</td>
                        </tr>
                        <tr>
                            <td><b>measurement</b></td>
                            <td><i>String</i></td>
                            <td>Measurement</td>
                        </tr>
                        <tr>
                            <td><b>date</b></td>
                            <td><i>ISO 8601 UTC Date</i></td>
                            <td>Observation date and time</td>
                        </tr>
                        <tr>
                            <td><b>sourceId</b></td>
                            <td><i>Integer</i></td>
                            <td><i>[Optional]</i> The image source ID (can be used in place of observatory, instrument, detector and
                            measurement parameters).</td>
                        </tr>
                        <tr>
                            <td><b>jpip</b></td>
                            <td><i>Boolean</i></td>
                            <td><i>[Optional]</i> Returns a JPIP URI instead of an actual image.</td>
                        </tr>
                    </tbody>
                </table>
        
                <br />
        
                <span class="example-header">Examples:</span>
                <span class="example-url">
                <a href="<?php echo HV_API_ROOT_URL;?>?action=getJP2Image&amp;observatory=SOHO&amp;instrument=EIT&amp;detector=EIT&amp;measurement=171&amp;date=2003-10-05T00:00:00Z">
                <?php echo HV_API_ROOT_URL;?>?action=getJP2Image&observatory=SOHO&instrument=EIT&detector=EIT&measurement=171&date=2003-10-05T00:00:00Z
                </a>
                </span><br />
                <span class="example-url">
                <a href="<?php echo HV_API_ROOT_URL;?>?action=getJP2Image&amp;observatory=SOHO&amp;instrument=LASCO&amp;detector=C2&amp;measurement=white-light&amp;date=2003-10-05T00:00:00Z&amp;jpip=true">
                <?php echo HV_API_ROOT_URL;?>?action=getJP2Image&observatory=SOHO&instrument=LASCO&detector=C2&measurement=white-light&date=2003-10-05T00:00:00Z&jpip=true
                </a>
                </span>
                </div>
                </div>
                </li>
        
                <br />
        
                <!-- JPX API -->
                <li>
                <div id="getJPX">JPX API
                <p>Returns a JPEG 2000 Image Series (JPX) file. The movie frames are chosen by matching the closest image
                available at each step within the specified range of dates.</p>
        
                <br />
        
                <div class="summary-box"><span style="text-decoration: underline;">Usage:</span><br />
        
                <br />
        
                <?php echo HV_API_ROOT_URL;?>?action=getJPX<br />
                <br />
        
                Supported Parameters:<br />
                <br />
        
                <table class="param-list" cellspacing="10">
                    <tbody valign="top">
                        <tr>
                            <td width="20%"><b>observatory</b></td>
                            <td width="20%"><i>String</i></td>
                            <td>Observatory</td>
                        </tr>
                        <tr>
                            <td><b>instrument</b></td>
                            <td><i>String</i></td>
                            <td>Instrument</td>
                        </tr>
                        <tr>
                            <td><b>detector</b></td>
                            <td><i>String</i></td>
                            <td>Detector</td>
                        </tr>
                        <tr>
                            <td><b>measurement</b></td>
                            <td><i>String</i></td>
                            <td>Measurement</td>
                        </tr>
                        <tr>
                            <td><b>startTime</b></td>
                            <td><i>ISO 8601 UTC Date</i></td>
                            <td>Movie start time</td>
                        </tr>
                        <tr>
                            <td><b>endTime</b></td>
                            <td><i>ISO 8601 UTC Date</i></td>
                            <td>Movie end time</td>
                        </tr>
                        <tr>
                            <td><b>cadence</b></td>
                            <td><i>Integer</i></td>
                            <td><i>[Optional]</i> The desired amount of time between each movie-frame, in seconds. If no 
                            cadence is specified, the server will attempt to select an optimal cadence.</td>
                        </tr>
                        <tr>
                            <td><b>sourceId</b></td>
                            <td><i>Integer</i></td>
                            <td><i>[Optional]</i> The image source ID (can be used in place of observatory, instrument, detector and
                            measurement parameters).</td>
                        </tr>
                        <tr>
                            <td><b>frames</b></td>
                            <td><i>Boolean</i></td>
                            <td><i>[Optional]</i> Returns individual movie-frame timestamps along with the file URI
                            as JSON.</td>
                        </tr>
                        <tr>
                            <td><b>verbose</b></td>
                            <td><i>Boolean</i></td>
                            <td><i>[Optional]</i> In addition to the JPX file URI, returns any warning or
                            error messages generated during the request.</td>
                        </tr>
                        <tr>
                            <td><b>frames</b></td>
                            <td><i>Boolean</i></td>
                            <td><i>[Optional]</i> Returns a JSON data structure including the JPX URI and also a list of
                            the timestamps associated with each layer in the file.</td>
                        </tr>
                        <tr>
                            <td><b>jpip</b></td>
                            <td><i>Boolean</i></td>
                            <td><i>[Optional]</i> Returns a JPIP URI instead of an actual movie.</td>
                        </tr>
                        <tr>
                            <td><b>linked</b></td>
                            <td><i>Boolean</i></td>
                            <td><i>[Optional]</i> Returns a linked JPX file containing image pointers instead of data for each
                            individual frame in the series. Currently, only JPX image series support this feature.</td>
                        </tr>
                    </tbody>
                </table>
        
                <br />
                Result:<br />
                <br />
                The default action is to simply return the requested JPX file. If additional information is needed,
                for example, then a JSON result will be returned with the file URI plus any additional parameters requested.
                <br /><br />
        
                <!-- Return parameter description -->
                <table class="param-list" cellspacing="10">
                    <tbody valign="top">
                        <tr>
                            <td width="20%"><b>uri</b></td>
                            <td width="20%"><i>String</i></td>
                            <td><i>[Optional]</i> Location of the requested file.</td>
                        </tr>
                        <tr>
                            <td><b>frames</b></td>
                            <td><i>List</i></td>
                            <td><i>[Optional]</i> List of timestamps.</td>
                        </tr>
                        <tr>
                            <td><b>verbose</b></td>
                            <td><i>String</i></td>
                            <td><i>[Optional]</i> Any warning or error messages generated during the request</td>
                        </tr>
                    </tbody>
                </table>
        
                <br />
        
                <span class="example-header">Examples:</span>
                <span class="example-url">
                <a href="<?php echo HV_API_ROOT_URL;?>?action=getJPX&amp;observatory=SOHO&amp;instrument=EIT&amp;detector=EIT&amp;measurement=171&amp;startTime=2003-10-05T00:00:00Z&amp;endTime=2003-10-20T00:00:00Z">
                    <?php echo HV_API_ROOT_URL;?>?action=getJPX&observatory=SOHO&instrument=EIT&detector=EIT&measurement=171&startTime=2003-10-05T00:00:00Z&endTime=2003-10-20T00:00:00Z
                </a>
                </span><br />
                <span class="example-url">
                <a href="<?php HV_API_ROOT_URL;?>?action=getJPX&amp;observatory=SOHO&amp;instrument=MDI&amp;detector=MDI&amp;measurement=magnetogram&amp;startTime=2003-10-05T00:00:00Z&amp;endTime=2003-10-20T00:00:00Z&amp;cadence=3600&amp;linked=true&amp;jpip=true">
                    <?php echo HV_API_ROOT_URL;?>?action=getJPX&observatory=SOHO&instrument=MDI&detector=MDI&measurement=magnetogram&startTime=2003-10-05T00:00:00Z&endTime=2003-10-20T00:00:00Z&cadence=3600&linked=true&jpip=true
                </a>
                </span></div>
                </div>
        
                <br />
        
                <!-- getJPX API Notes -->
                <div class="summary-box" style="background-color: #E3EFFF;">
                <span style="text-decoration: underline;">Notes:</span>
        
                <br /><br />
        
                <ul>
                    <li>
                    <p>If no cadence is specified Helioviewer.org attempts to choose an optimal cadence for the requested range and data source.</p>
                    </li>
                </ul>
                </div>
        
                <br />
        <?php
    }
}
?>