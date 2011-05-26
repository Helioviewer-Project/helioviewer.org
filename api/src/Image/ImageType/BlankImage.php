<?php 
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Image_ImageType_BlankImage class definition
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
 * Image_ImageType_BlankImage class definition
 * There is one xxxImage for each type of detector Helioviewer supports.
 * This class represents an image that cannot be built because it has either no
 * width or no height, and so a transparent 512x512 image is substituted instead.
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Image_ImageType_BlankImage extends Image_SubFieldImage
{
    /**
     * Creates a new blank image
     * 
     * @param string $jp2      Source JP2 image
     * @param string $filepath Location to output the file to
     * @param array  $roi      Top-left and bottom-right pixel coordinates on the image
     * @param string $inst     Instrument
     * @param string $det      Detector
     * @param string $meas     Measurement
     * @param int    $offsetX  Offset of the sun center from the image center
     * @param int    $offsetY  Offset of the sun center from the iamge center
     * @param array  $options  Optional parameters
     */     
    public function __construct($jp2, $filepath, $roi, $obs, $inst, $det, $meas, $offsetX, $offsetY, $options)
    {
        parent::__construct($jp2, $filepath, $roi, $obs, $inst, $det, $meas, $offsetX, $offsetY, $options);
    }
    
    /**
     * Overrides SubfieldImage's build() method to do nothing, since no image is being created. 
     * 
     * @return void
     */
    public function build()
    {
        // Do nothing.
    }
    
    /**
     * Overrides SubFieldImage's computePadding() method to avoid unnecessary computation.
     * 
     * @param Array $roi Region of interest
     *
     * @return Array
     */
    public function computePadding($roi) 
    {
        $width  = $roi->getWidth()  / $roi->imageScale();
        $height = $roi->getHeight() / $roi->imageScale();
        
        return array(
           "gravity" => "northwest",
           "width"   => $width,
           "height"  => $height,
           "offsetX" => 0,
           "offsetY" => 0
        );    	
    }
    
    /**
     * Gets a string that will be displayed in the image's watermark
     * 
     * @return string watermark name
     */
    public function getWaterMarkName() 
    {
        return "";
    }
}