<?php 
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Image_ImageType_AIAImage class definition
 * There is one xxxImage for each type of detector Helioviewer supports.
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once HV_ROOT_DIR . '/api/src/Image/SubFieldImage.php';
/**
 * Image_ImageType_AIAImage class definition
 * There is one xxxImage for each type of detector Helioviewer supports.
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Image_ImageType_AIAImage extends Image_SubFieldImage
{
    private   $_measurement;
    
    /**
     * Constructor
     * 
     * @param string $jp2          source JP2 image
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
        
        parent::__construct($jp2, $roi, $desiredScale, $outputFile, $offsetX, $offsetY, $opacity, $compress);
        
        // AIA 171, 193, and 304 color tables are same as EIT for the similar wavelengths
        $colorTable = HV_ROOT_DIR . "/api/resources/images/color-tables/SDO_AIA_{$this->_measurement}.png";

        $this->setColorTable($colorTable);
    }
    
    /**
     * Gets a string that will be displayed in the image's watermark
     * 
     * @return string watermark name
     */
    public function getWaterMarkName() 
    {
        return "AIA $this->_measurement\n";
    }
}