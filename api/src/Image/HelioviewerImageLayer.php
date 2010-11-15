<?php 
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Image_HelioviewerImageLayer class definition
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once 'ImageLayer.php';
/**
 * Image_HelioviewerImageLayer class definition
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Image_HelioviewerImageLayer extends Image_ImageLayer
{
    protected $layeringOrder;
    protected $opacity;
    
    /**
     * Constructor
     * 
     * @param string $jp2           Original JP2 image from which the subfield should be derrived
     * @param string $outputFile    Location to output the subfield image to
     * @param array  $roi           Subfield region of interest in pixels
     * @param string $instrument    Instrument
     * @param string $detector      Detector
     * @param string $measurement   Measurement
     * @param int    $layeringOrder What order the image should be composited
     * @param float  $offsetX       Offset of the sun center from the image center
     * @param float  $offsetY       Offset of the sun center from the image center
     * @param float  $opacity       The opacity of the image
     * @param string $date          The date of the image
     * @param bool   $compress      Whether to compress the image after extracting or not (true for tiles)
     */
    public function __construct(
        $jp2, $outputFile, $roi, $instrument, $detector, $measurement, $layeringOrder,  
        $offsetX, $offsetY, $opacity, $date, $compress
    ) {
        $this->layeringOrder = $layeringOrder;
        $this->opacity		 = $opacity;
        $this->date          = $date;

        // Region of interest
        $this->_roi = $roi;
        $pixelRoi   = $this->_getPixelRoi($jp2->getWidth(), $jp2->getHeight(), $jp2->getScale(), $offsetX, $offsetY);

        // Make a blank image if the region of interest does not include this image.
        if ($this->_imageNotVisible($pixelRoi)) {
            $outputFile = HV_ROOT_DIR . "/resources/images/transparent_512.png";
            
            include_once HV_ROOT_DIR . "/api/src/Image/ImageType/BlankImage.php";
            $image = new Image_ImageType_BlankImage(
               $jp2, $pixelRoi, $roi->imageScale(), $detector, $measurement, $offsetX, $offsetY, 
               $outputFile,  $opacity, $compress
            );
            
        } else {   	        
            $type      = strtoupper($instrument) . "Image";
            $classname = "Image_ImageType_" . $type;
        
            include_once HV_ROOT_DIR . "/api/src/Image/ImageType/$type.php";

            $image = new $classname(
                $jp2, $pixelRoi, $roi->imageScale(), $detector, $measurement, $offsetX, $offsetY, $outputFile, 
                $opacity, $compress
            );
        }
        
        parent::__construct($image, $outputFile);

        $padding = $this->image->computePadding($roi);
        $image->setPadding($padding);

        if (HV_DISABLE_CACHE || $this->_imageNotInCache()) {
            $this->image->build();
        }
    }
    
    /**
     * Displays the image
     * 
     * @return void
     */
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
        return ($pixelRoi['bottom'] - $pixelRoi['top'] <= 1) || ($pixelRoi['right'] - $pixelRoi['left'] <= 1);
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
     * @return string date
     */
    public function getWaterMarkDateString()
    {
        // Add extra spaces between date and time for readability.
        return str_replace("T", "   ", $this->date) . "\n";		
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
        
        $top  = max($this->_roi->top()   /$scale + $centerY, 0);
        $left = max($this->_roi->left()  /$scale + $centerX, 0);
        $top  = $top  < 0.1? 0 : $top;
        $left = $left < 0.1? 0 : $left;
        
        return array(
            'top'    => $top,
            'left'   => $left,
            'bottom' => max(min($this->_roi->bottom() /$scale + $centerY, $height), 0),
            'right'  => max(min($this->_roi->right()  /$scale + $centerX, $width), 0)
        );
    }
}
?>