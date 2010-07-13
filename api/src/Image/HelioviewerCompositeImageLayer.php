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

        $this->_roi = $roi;
        $pixelRoi = $this->_getPixelRoi($jp2Width, $jp2Height, $jp2Scale, $offsetX, $offsetY);

        // Make a blank image if the region of interest does not include this image.
        if ($this->_imageNotVisible($pixelRoi)) {
        	$outputFile = HV_ROOT_DIR . "/resources/images/transparent_512.png";
        	
        	include_once HV_ROOT_DIR . "/api/src/Image/ImageType/BlankImage.php";
        	$image = new Image_ImageType_BlankImage(
        	   $width, $height, $timestamp, $sourceJp2, $pixelRoi, $format, $jp2Width, $jp2Height,
                $jp2Scale, $imageScale, $detector, $measurement, $offsetX, $offsetY, $outputFile
        	);
        } else {   	        
            $type      = strtoupper($instrument) . "Image";
            $classname = "Image_ImageType_" . $type;
        
        	include_once HV_ROOT_DIR . "/api/src/Image/ImageType/$type.php";

            $image = new $classname(
                $width, $height, $timestamp, $sourceJp2, $pixelRoi, $format, $jp2Width, $jp2Height,
                $jp2Scale, $imageScale, $detector, $measurement, $offsetX, $offsetY, $outputFile
            );
        }
        
        parent::__construct($timestamp, $image, $outputFile);
        
        $padding = $this->image->computePadding($roi, $imageScale);
        $image->setPadding($padding);

        if (HV_DISABLE_CACHE || $this->_imageNotInCache()) {
            $this->image->build();
        }
    }
    
    public function display()
    {
    	$this->image->display();
    }
    /**
     * Determines if the roi is invalid by calculating width and height and seeing if they are
     * less than 0.
     * 
     * @param Array $pixelRoi An array with values for top, left, bottom, and right
     * 
     * @return boolean
     */
    private function _imageNotVisible($pixelRoi)
    {
    	return ($pixelRoi['bottom'] - $pixelRoi['top'] <= 1) || 
    	           ($pixelRoi['right'] - $pixelRoi['left'] <= 1);
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
     * @param int   $width   The width of the JP2 image in pixels
     * @param int   $height  The height of the JP2 image in pixels
     * @param float $scale   The scale of the JP2 image in arcsec/pixel
     * @param float $offsetX The offset of the center of the sun from the center of the image
     * @param float $offsetY The offset of the center of the sun from the center of the image
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
            'bottom' => max(min($this->_roi['bottom']/$scale + $centerY, $height), 0),
            'right'  => max(min($this->_roi['right'] /$scale + $centerX, $width), 0)
        );
    }
}
?>