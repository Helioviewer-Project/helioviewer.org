<?php 
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * ImageType_MDIImage class definition
 * There is one xxxImage for each type of detector Helioviewer supports.
 * 
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once HV_ROOT_DIR . '/api/src/Image/SubFieldImage.php';
/**
 * ImageType_MDIImage class definition
 * There is one xxxImage for each type of detector Helioviewer supports.
 * 
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Image_ImageType_MDIImage extends Image_SubFieldImage
{
    private $_measurement;
    
    /**
     * Constructor
     *
     * @param string $jp2          Source JP2 image
     * @param array  $roi          Top-left and bottom-right pixel coordinates on the image
     * @param float  $desiredScale Desired scale of the output image
     * @param string $detector     Detector
     * @param string $measurement  Measurement
     * @param int    $offsetX      Offset of the sun center from the image center
     * @param int    $offsetY      Offset of the sun center from the iamge center
     * @param string $outputFile   Filepath to where the final image will be stored
     * @param int    $opacity      The opacity of the image from 0 to 100
     * @param bool   $compress     Whether to compress the image after extracting or not (true for tiles)
     */
    public function __construct(
        $jp2, $roi, $desiredScale, $detector, $measurement, $offsetX, $offsetY, $outputFile, $opacity, $compress
    ) {
        $this->_measurement = $measurement;
        
        parent::__construct($jp2, $roi, $desiredScale,$outputFile, $offsetX, $offsetY, $opacity, $compress);

        // MDI has no color table
        $this->setColorTable(false);
    }
    
    /**
     * No color table. Do nothing.
     * 
     * @param string &$input  Input file
     * 
     * @return void
     */
    protected function setColorPalette(&$input)
    {
        return false;
    }
    
    /**
     * Gets a string that will be displayed in the image's watermark
     * 
     * @return string watermark name
     */
    public function getWaterMarkName() 
    {
        return "MDI $this->_measurement\n";
    }
}