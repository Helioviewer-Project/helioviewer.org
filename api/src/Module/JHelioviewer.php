<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Helioviewer JHelioviewer Module Class Definition
 *
 * PHP version 5
 *
 * @category Modules
 * @package  Helioviewer
 * @author   Jeff Stys <jeff.stys@nasa.gov>
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
 * @author   Jeff Stys <jeff.stys@nasa.gov>
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 *
 */
class Module_JHelioviewer implements Module {

    private $_params;
    private $_options;

    /**
     * Create a JHelioviewer module instance
     *
     * @param array &$params API Request parameters.
     *
     * @return void
     */
    public function __construct(&$params) {
        $this->_params = $params;
        $this->_options = array();
    }

    /**
     * Validate and execute the requested API action
     *
     * @return void
     */
    public function execute() {

        if ( $this->validate() ) {
            try {
                $this->{$this->_params['action']}();
            }
            catch (Exception $e) {
                handleError($e->getMessage(), $e->getCode());
            }
        }
    }

    /**
     * Find the best match for a single JPEG2000 image and either
     * output a link to the image, or display the image directly.
     *
     * @return void
     */
    public function getJP2Image() {

        include_once 'src/Database/ImgIndex.php';
        $imgIndex = new Database_ImgIndex();

        // Optional parameters
        $defaults = array(
            'jpip' => false,
            'json' => false
        );

        $options = array_replace($defaults, $this->_options);

        // If image id is set, use it
        if ( isset($this->_params['id']) ) {
            $filepath = HV_JP2_DIR
                      . $imgIndex->getJP2FilePathFromId($this->_params['id']);
        }
        else {
            // Otherwise look up sourceId if not specified
            $sourceId = $this->_getSourceId($imgIndex);

            // Filepath to JP2 Image
            $filepath = HV_JP2_DIR.$imgIndex->getJP2FilePath(
                $this->_params['date'], $sourceId);
        }

        // Output results
        if ( $options['jpip'] ) {

            if ( $options['json'] ) {
                header('Content-type: application/json;charset=UTF-8');
                echo json_encode(
                    array('uri' => $this->_getJPIPURL($filepath)) );
            }
            else {
                echo $this->_getJPIPURL($filepath);
            }
        }
        else {
            $this->_displayJP2($filepath);
        }
    }

    /**
     * Construct a JPX image series
     *
     * @return void
     */
    public function getJPX() {

        include_once 'src/Image/JPEG2000/HelioviewerJPXImage.php';
        include_once 'src/Database/ImgIndex.php';

        $imgIndex = new Database_ImgIndex();

        // Optional parameters
        $defaults = array(
            'jpip'    => false,
            'cadence' => false,
            'linked'  => false,
            'verbose' => false
        );
        $options = array_replace($defaults, $this->_options);

/*
        // Make sure cadence is valid
        if ($options['cadence'] && $options['cadence'] <= 0) {
            $options['cadence'] = 1;
//            throw new Exception('Invalid cadence specified. ' .
//                                'Cadence must be greater than 0.');
        }
*/

        // sourceId as well as observatory, instrument, detector and
        // measurement names are required
        $sourceId = $this->_getSourceId($imgIndex);
        list($obs, $inst, $det, $meas) = $this->_getSourceIdInfo($sourceId,
            $imgIndex);

        // Compute filename
        $filename = $this->_getJPXFilename(
            $obs, $inst, $det, $meas, $this->_params['startTime'],
            $this->_params['endTime'], $options['cadence'], $options['linked']
        );

        // Create JPX image instance
        try {
            $jpx = new Image_JPEG2000_HelioviewerJPXImage(
                $sourceId, $this->_params['startTime'],
                $this->_params['endTime'], $options['cadence'],
                $options['linked'], $filename
            );
        }
        catch (Exception $e) {
            // If a problem is encountered, return an error message as JSON
            header('Content-type: application/json;charset=UTF-8');
            echo json_encode(
                array(
                    'error'   => $e->getMessage(),
                    'uri'     => null
                )
            );
            return;
        }

        // Chose appropriate action based on request parameters
        if ( $options['verbose'] ) {
            $jpx->printJSON($options['jpip'], $options['verbose']);
        }
        else {
            if ( $options['jpip'] ) {
                echo $jpx->getJPIPURL();
            }
            else {
                $jpx->displayImage();
            }
        }
    }

    /**
     * Return the sourceId for the current request
     *
     * @param object &$imgIndex A Helioviewer database instance
     *
     * @return int The id of the datasource specified for the request
     */
    private function _getSourceId(&$imgIndex) {

        if ( isset($this->_params['sourceId']) ) {
            return $this->_params['sourceId'];
        }

        return $imgIndex->getSourceId(
            $this->_params['observatory'], $this->_params['instrument'],
            $this->_params['detector'],    $this->_params['measurement']
        );
    }

    /**
     * Return info for a given sourceId
     *
     * @param int    $sourceId  Id of data source
     * @param object &$imgIndex Database accessor
     *
     * @return array An array containing the observatory, instrument, detector and measurement associated with the
     *               specified datasource id.
     */
    private function _getSourceIdInfo($sourceId, &$imgIndex) {

        if ( !( isset($this->_params['observatory']) &&
                isset($this->_params['instrument'])  &&
                isset($this->_params['detector'])    &&
                isset($this->_params['measurement'])    ) ) {

            // Get an associative array of the datasource meta information
            $info = $imgIndex->getDatasourceInformationFromSourceId($sourceId);

            // Return as an indexed array
            return array( $info['observatory'],
                          $info['instrument'],
                          $info['detector'],
                          $info['measurement'] );
        }
        else {
            return array( $this->_params['observatory'],
                          $this->_params['instrument'],
                          $this->_params['detector'],
                          $this->_params['measurement'] );
        }
    }

    /**
     * Generate the filename to use for storing JPXimage.
     * Filenames are of the form:
     *     Obs_Inst_Det_Meas_FROM_TO_BY[L].jpx
     *
     * @param string $obs       Observatory
     * @param string $inst      Instrument
     * @param string $det       Detector
     * @param string $meas      Measurement
     * @param string $startTime Requested start time for JPX
     *                          (ISO 8601 UTC date string)
     * @param string $endTime   Requested finish time for JPX
     *                          (ISO 8601 UTC date string)
     * @param int    $cadence   Number of seconds between each frame in the
     *                          image series
     * @param bool   $linked    Whether or not requested JPX image should be
     *                          a linked JPX
     *
     * @return string Filename to use for generated JPX image
     */
    private function _getJPXFilename($obs, $inst, $det, $meas, $startTime,
        $endTime, $cadence, $linked) {

        $from = str_replace(':', '.', $startTime);
        $to   = str_replace(':', '.', $endTime);
        $filename = implode('_', array( $obs, $inst, $det, $meas,
                                        'F'.$from, 'T'.$to ) );

        // Indicate the cadence in the filename if one was specified
        if ( $cadence ) {
            $filename .= 'B'.$cadence;
        }

        // Append an "L" to the filename for "Linked" JPX files
        if ( $linked ) {
            $filename .= 'L';
        }

        return str_replace(' ', '-', $filename).'.jpx';
    }

    /**
     * Output the specified JP2 image directly
     *
     * @param string $filepath The location of the image to be displayed.
     *
     * @return void
     */
    private function _displayJP2($filepath) {

        $fp   = @fopen($filepath, 'r');
        $stat = stat($filepath);

        $filename = basename($filepath);

        header('Content-Length: '.$stat['size']);
        header('Content-Type: '  .image_type_to_mime_type(IMAGETYPE_JP2));
        header('Content-Disposition: attachment; filename="'.$filename.'"');

        $contents = @fread($fp, $stat['size']);

        echo $contents;

        @fclose($fp);
    }

    /**
     * Convert a URL from the 'http' protocol to 'jpip'
     *
     * @param string $filepath    Location of JPX file
     * @param string $jp2Dir      The JPEG 2000 archive root directory
     * @param string $jpipBaseURL The JPIP Server base URL
     *
     * @return string A JPIP URL.
     */
    private function _getJPIPURL($filepath, $jp2Dir=HV_JP2_DIR,
        $jpipBaseURL = HV_JPIP_ROOT_URL) {

        $webRootRegex = '/'.preg_replace("/\//", "\/", $jp2Dir).'/';
        $jpip = preg_replace($webRootRegex, $jpipBaseURL, $filepath);

        return $jpip;
    }

    /**
     * launch JHelioviewer
     *
     * @return void
     */
    public function launchJHelioviewer () {

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
                    <argument><?php vprintf("[startTime=%s;endTime=%s;linked=true;imageScale=%f;imageLayers=%s]", $args); ?></argument>
                </application-desc>
            </jnlp>
<?php
    }

    /**
     * Validate the requested action and associated input parameters.
     *
     * @return void
     */
    public function validate() {

        switch($this->_params['action']) {

        case 'getJP2Image':
            $expected = array(
               'optional' => array('jpip', 'json'),
               'bools'    => array('jpip', 'json'),
               'dates'    => array('date')
            );

            // If imageId is specified, that is all that is needed
            if ( isset($this->_params['id']) ) {
                $expected['required'] = array('id');
                $expected['ints']     = array('id');
            }
            // Either sourceId or observatory, instrument, detector and
            // measurement must be specified
            else if ( isset($this->_params['sourceId']) ) {
                $expected['required'] = array('date', 'sourceId');
                $expected['ints']     = array('sourceId');
            }
            else {
                $expected['required'] = array('date', 'observatory',
                                              'instrument', 'detector',
                                              'measurement');
            }
            break;

        case 'getJPX':
            $expected = array(
                'required' => array('startTime', 'endTime'),
                'optional' => array('cadence', 'jpip', 'linked', 'verbose'),
                'bools'    => array('jpip', 'verbose', 'linked'),
                'dates'    => array('startTime', 'endTime'),
                'ints'     => array('cadence')
            );

            // Either sourceId or observatory, instrument, detector
            // and measurement must be specified
            if ( isset($this->_params['sourceId']) ) {
                $expected['required'] = array('startTime', 'endTime',
                                              'sourceId');
                $expected['ints']     = array('sourceId');
            }
            else {
                $expected['required'] = array('startTime', 'endTime',
                                              'observatory', 'instrument',
                                              'detector', 'measurement');
            }
            break;

        case 'launchJHelioviewer':
            $expected = array(
                'required' => array('startTime', 'endTime', 'imageScale',
                                    'layers'),
                'floats'   => array('imageScale'),
                'dates'    => array('startTime', 'endTime'),
            );
            break;

        default:
            break;
        } // end switch block

        if ( isset($expected) ) {
            Validation_InputValidator::checkInput($expected, $this->_params,
                $this->_options);
        }

        return true;
    }
}
?>