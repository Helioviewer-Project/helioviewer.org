<?php 
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Image_HelioviewerImage class definition
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
require_once 'SubFieldImage.php';
/**
 * Image_HelioviewerImage class definition
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
class Image_HelioviewerImage extends Image_SubFieldImage
{
    protected $instrument;
    protected $detector;
    protected $measurement;
    protected $filepath;
    protected $options;
    
    /**
     * Constructor
     * 
     * @param string $jp2           Original JP2 image from which the subfield should be derrived
     * @param string $filepath      Location to output the file to (not including a file extension)
     * @param array  $roi           Subfield region of interest in pixels
     * @param string $instrument    Instrument
     * @param string $detector      Detector
     * @param string $measurement   Measurement
     * @param float  $offsetX       Offset of the sun center from the image center
     * @param float  $offsetY       Offset of the sun center from the image center
     */
    public function __construct(
        $jp2, $filepath, $roi, $instrument, $detector, $measurement, $offsetX, $offsetY, $options
    ) {
        // Default options
        $defaults = array(
            "date"          => "",
            "compress"      => true,
            "format"        => "jpg",
            "layeringOrder" => 1,
            "opacity"       => 100
        );
        $this->options = array_replace($defaults, $options);
        
        $this->instrument  = $instrument;
        $this->detector    = $detector;
        $this->measurement = $measurement;
        $this->filepath    = $filepath . "." . $this->options['format'];
        
        $imageSettings = array(
            "opacity" => $this->options['opacity']
        );

        parent::__construct($jp2, $roi, $this->filepath, $offsetX, $offsetY, $imageSettings);

        $padding = $this->computePadding($roi);
        $this->setPadding($padding);

        if (HV_DISABLE_CACHE || $this->_imageNotInCache()) {
            $this->build();
        }
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
        return $this->getWaterMarkName();
    }
    
    /**
     * Gets the timestamp that will be displayed in the image's watermark
     * 
     * @return string date
     */
    public function getWaterMarkDateString()
    {
        // Add extra spaces between date and time for readability.
        return str_replace("T", "   ", $this->options['date']) . "\n";		
    }

    /**
     * Get the layering order
     * 
     * @return int layeringOrder
     */
    public function getLayeringOrder() 
    {
        return $this->options['layeringOrder'];
    }
    
    /**
     * Get opacity
     * 
     * @return float opacity
     */
    public function getOpacity()
    {
        return $this->options['opacity'];
    }
    
    /**
     * Check to see if the image is cached
     * 
     * @return boolean 
     */
    private function _imageNotInCache() 
    {
        return !file_exists($this->filepath);
    }
    
    
    /**
     * Gets the filepath
     * 
     * @return string outputFile
     */
    public function getFilePathString() 
    {
        return $this->filepath;
    }

    /**
     * Sets a new filepath 
     * 
     * @param string $filePath New filepath
     * 
     * @return void
     */
    public function setNewFilePath($filePath) 
    {
        $this->setNewFilePath($filePath);
    }
}
?>