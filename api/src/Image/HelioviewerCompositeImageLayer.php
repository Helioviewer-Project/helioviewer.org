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
        $this->imageScale    = $imageScale;
        
        $type = strtoupper($instrument) . "Image";
        include_once HV_ROOT_DIR . "/api/src/Image/ImageType/$type.php";
        
        $classname = "Image_ImageType_" . $type;
        
        $this->_roi = $roi;
        $pixelRoi = $this->_getPixelRoi($jp2Width, $jp2Height, $jp2Scale, $offsetX, $offsetY);

        $image = new $classname(
            $width, $height, $timestamp, $sourceJp2, $pixelRoi, $format, $jp2Width, $jp2Height,
            $jp2Scale, $imageScale, $detector, $measurement, $offsetX, $offsetY, $outputFile
        );
        
        parent::__construct($timestamp, $image, $outputFile);
        
        $padding = $this->image->computePadding($roi, $imageScale);
        $image->setPadding($padding);

        if(HV_DISABLE_CACHE || $this->_imageNotInCache()) {
        	$this->image->build();
        }
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
     * Converts arcseconds (given in $roi in the constructor) to image pixels
     * 
     * @param array $image An array with image meta information, gotten from the database
     * 
     * @return array an array of pixel offsets
     */
    private function _getPixelRoi($width, $height, $scale, $offsetX, $offsetY)
    {
    	$centerX = $width / 2 + $offsetX;
    	$centerY = $width / 2 + $offsetY;
    	
    	return array(
            'top'    => max($this->_roi['top']   /$scale + $centerY, 0),
            'left'   => max($this->_roi['left']  /$scale + $centerX, 0),
            'bottom' => min($this->_roi['bottom']/$scale + $centerY, $height),
            'right'  => min($this->_roi['right'] /$scale + $centerX, $width)
        );
    }
}
?>