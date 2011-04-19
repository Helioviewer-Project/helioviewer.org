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
require_once 'src/Image/HelioviewerImage.php';
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
class Image_ImageType_MDIImage extends Image_HelioviewerImage
{
    /**
     * Creates a new MDIImage
     * 
     * @param string $jp2      Source JP2 image
     * @param string $filepath Location to output the file to (not including a file extension)
     * @param array  $roi      Top-left and bottom-right pixel coordinates on the image
     * @param string $inst     Instrument
     * @param string $det      Detector
     * @param string $meas     Measurement
     * @param int    $offsetX  Offset of the sun center from the image center
     * @param int    $offsetY  Offset of the sun center from the iamge center
     * @param array  $options  Optional parameters
     * 
     * @return void
     */ 
    public function __construct($jp2, $filepath, $roi, $dsun, $inst, $det, $meas, $offsetX, $offsetY, $options)
    {
        // MDI has no color table
        $this->setColorTable(false);
        
        parent::__construct($jp2, $filepath, $roi, $dsun, $inst, $det, $meas, $offsetX, $offsetY, $options);
    }
    
    /**
     * MDI does not use a color table; Do nothing.
     * 
     * @param string $input Image to apply color table to
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
        return "MDI $this->measurement\n";
    }
}