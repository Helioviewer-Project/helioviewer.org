<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Image_JPEG2000_JP2Image class definition
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
/**
 * JPEG 2000 Image class
 *
 * @category Image
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 *
 * @TODO: Extend Exception class to create more useful objects.
 * @TODO: Use different name for intermediate PNG than final version.
 * @TODO: Forward request to secondary server if it fails for a valid tile?
 * @TODO: build up a "process log" string for each tile process which can be
 *        output to the log in case of failure.
 */
class Image_JPEG2000_JP2Image
{
    private $_file;   //$jp2;
    private $_width;  //$jp2Width;
    private $_height; //$jp2Height;
    private $_scale;  //$jp2Scale;

    /**
     * Creates a new Image_JPEG2000_JP2Image instance
     *
     * @param string $file   Location of the JPEG 2000 image to work with
     * @param int    $width  JP2 image width
     * @param int    $height JP2 image height
     * @param float  $scale  JP2 image plate-scale
     */
    public function __construct($file, $width, $height, $scale)
    {
        $this->_file   = $file;
        $this->_width  = $width;
        $this->_height = $height;
        $this->_scale  = $scale;
    }

    /**
     * Returns the JPEG 2000 image's native plate-scale
     *
     * @return float image scale
     */
    public function getScale()
    {
        return $this->_scale;
    }

    /**
     * Returns the JPEG 2000 image's native width
     *
     * @return int image width
     */
    public function getWidth()
    {
        return $this->_width;
    }

    /**
     * Returns the JPEG 2000 image's native height
     *
     * @return int image height
     */
    public function getHeight()
    {
        return $this->_height;
    }

    /**
     * Extract a region using kdu_expand
     *
     * @param string $outputFile  Location to output file to.
     * @param array  $roi         An array representing the rectangular region of interest (roi).
     * @param int    $scaleFactor Difference between the JP2's natural resolution and the requested resolution, if
     *                            the requested resolution is less than the natural one.
     *
     * @TODO: Should precision of -reduce be limited in same manner as region strings? (e.g. MDI @ zoom-level 9)
     *
     * @return String - outputFile of the expanded region
     */
    public function extractRegion($outputFile, $roi, $scaleFactor = 0)
    {
        $cmd = HV_KDU_EXPAND . " -i $this->_file -o $outputFile ";

        // Case 1: JP2 image resolution = desired resolution
        // Nothing special to do...

        // Case 2: JP2 image resolution > desired resolution (use -reduce)
        if ($scaleFactor > 0)
            $cmd .= "-reduce $scaleFactor ";

        // Case 3: JP2 image resolution < desired resolution
        // Don't do anything...

        // Add desired region
        $cmd .= $this->_getRegionString($roi);

        // Execute the command
        try {
            $result = exec(HV_PATH_CMD . escapeshellcmd($cmd), $out, $ret);
            if (($ret != 0) || (sizeof($out) > 5)) {
                $msg = "Error extracting JPEG 2000 subfield region!\n\tCommand: \"" . escapeshellcmd($cmd) . "\".\n\tResult: $result";
                throw new Exception($msg);
            }

        } catch(Exception $e) {
            logErrorMsg($e->getMessage(), true);
        }
    }

    /**
     * Builds a region string to be used by kdu_expand. e.g. "-region {0.0,0.0},{0.5,0.5}"
     *
     * NOTE: Because kakadu's internal precision for region strings is less than PHP,
     * the numbers used are cut off to prevent erronious rounding.
     *
     * @param array $roi The requestd region of interest.
     *
     * @return string A kdu_expand -region formatted sub-command.
     */
    private function _getRegionString($roi)
    {
        $precision = 6;

        $top    = $roi["top"];
        $left   = $roi["left"];
        $bottom = $roi["bottom"];
        $right  = $roi["right"];

        // Calculate the top, left, width, and height in terms of kdu_expand parameters (between 0 and 1)
        $scaledTop    = substr($top / $this->_height, 0, $precision);
        $scaledLeft   = substr($left / $this->_width, 0, $precision);
        $scaledHeight = substr(($bottom - $top) / $this->_height, 0, $precision);
        $scaledWidth  = substr(($right - $left) / $this->_width, 0, $precision);

        $region = '-region {' . "$scaledTop,$scaledLeft" . '},{' . "$scaledHeight,$scaledWidth" . '}';

        return $region;
    }
}
?>