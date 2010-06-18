<?php 
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Image_HelioviewerCompositeImageLayer class definition
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @author   Jaclyn Beck <jabeck@nmu.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once 'CompositeImageLayer.php';
/**
 * Image_HelioviewerCompositeImageLayer class definition
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @author   Jaclyn Beck <jabeck@nmu.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Image_HelioviewerCompositeImageLayer extends Image_CompositeImageLayer
{
    protected $layeringOrder;
    protected $opacity;
    
    /**
     * Constructor
     * 
     * @param string $sourceJp2     Original JP2 image from which the subfield should be derrived
     * @param string $outputFile    Location to output the subfield image to
     * @param string $format        File format to use when saving the image
     * @param int    $width         Width of the output image
     * @param int    $height        Height of the output image
     * @param float  $imageScale    Scale of the output image in arcseconds/px
     * @param array  $roi           Subfield region of interest in pixels
     * @param string $instrument    Instrument
     * @param string $detector      Detector
     * @param string $measurement   Measurement
     * @param int    $layeringOrder What order the image should be composited
     * @param float  $offsetX       Offset of the sun center from the image center
     * @param float  $offsetY       Offset of the sun center from the image center
     * @param float  $opacity       The opacity of the image
     * @param int    $jp2Width      Width of the JP2 image at it's natural resolution
     * @param int    $jp2Height     Height of the JP2 image at it's natural resolution
     * @param float  $jp2Scale      Pixel scale of the original JP2 image
     * @param date   $timestamp     The timestamp of the image
     */
    public function __construct(
        $sourceJp2, $outputFile, $format, $width, $height, $imageScale, $roi, $instrument, $detector, 
        $measurement, $layeringOrder, $offsetX, $offsetY, $opacity, $jp2Width, $jp2Height, $jp2Scale, $timestamp
    ) {
        $this->layeringOrder = $layeringOrder;
        $this->opacity		 = $opacity;
        
        $type = strtoupper($instrument) . "Image";
        include_once HV_ROOT_DIR . "/api/src/Image/ImageType/$type.php";
        
        $classname = "Image_ImageType_" . $type;
        
        $image = new $classname(
            $width, $height, $timestamp, $sourceJp2, $roi, $format, $jp2Width, $jp2Height,
            $jp2Scale, $imageScale, $detector, $measurement, $offsetX, $offsetY, $outputFile
        );
        
        $padding = $this->_computePadding();
        $image->setPadding($padding);
        
        parent::__construct($timestamp, $image, $outputFile);

        if(HV_DISABLE_CACHE || $this->_imageNotInCache())
            $this->image->build();
    }
    
    /**
     * Gets a string that will be displayed in the image's watermark
     * 
     * @return string watermark name
     */    
    public function getWaterMarkName()
    {
        return $this->image->getWaterMarkName();
    }
    
    /**
     * Gets the timestamp that will be displayed in the image's watermark
     * 
     * @return string timestamp
     */
    public function getWaterMarkTimestamp()
    {
        // Add extra spaces between date and time for readability.
        return str_replace("T", "   ", $this->timestamp) . "\n";		
    }

    /**
     * Get the layering order
     * 
     * @return int layeringOrder
     */
    public function layeringOrder() 
    {
        return $this->layeringOrder;
    }
    
    /**
     * Get opacity
     * 
     * @return float opacity
     */
    public function opacity()
    {
        return $this->opacity;
    }
    
    /**
     * Check to see if the image is cached
     * 
     * @return boolean 
     */
    private function _imageNotInCache() 
    {
        return !file_exists($this->outputFile);
    }
    
    /**
     * TODO This is hard-coded. Fix it when I've figured out where the padding code went for a composite image.
     * 
     * @return array padding
     */
    private function _computePadding()
    {
        return array(
            "gravity" 	=> "center",
            "width" 	=> 0,
            "height" 	=> 0
        );
    }
}
?>