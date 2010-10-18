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
require_once HV_ROOT_DIR . '/api/src/Image/SubFieldImage.php';
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
    private   $_measurement;
    protected $tileSize;
    protected $width;
    protected $height;
    
    /**
     * Constructor
     * 
     * @param int    $width        Desired width of the image
     * @param int    $height       Desired height of the image
     * @param date   $date         Timestamp of the image
     * @param string $sourceJp2    The filepath to the image's JP2 file
     * @param array  $roi          Top-left and bottom-right pixel coordinates on the image
     * @param string $format       File format
     * @param int    $jp2Width     Width of the JP2 image
     * @param int    $jp2Height    Height of the JP2 image
     * @param int    $jp2Scale     Scale of the JP2 image
     * @param float  $desiredScale Desired scale of the output image
     * @param string $detector     Detector
     * @param string $measurement  Measurement
     * @param int    $offsetX      Offset of the sun center from the image center
     * @param int    $offsetY      Offset of the sun center from the image center
     * @param string $outputFile   Filepath to where the final image will be stored
     * @param int    $opacity      The opacity of the image from 0 to 100
     * @param bool   $compress     Whether to compress the image after extracting or not (true for tiles)
     */     
    public function __construct(
        $width, $height, $date, $sourceJp2, $roi, $format, $jp2Width, $jp2Height, 
        $jp2Scale, $desiredScale, $detector, $measurement, $offsetX, $offsetY, $outputFile, 
        $opacity, $compress
    ) {
        $this->_measurement = $measurement;

        $defaultRoi = array(
            'left'   => 0,
            'right'  => 512,
            'top'    => 0,
            'bottom' => 512
        );
        parent::__construct(
            $sourceJp2, $date, $roi, $format, $jp2Width, $jp2Height, $jp2Scale, $desiredScale, 
            $outputFile, $offsetX, $offsetY, $opacity, $compress
        );

        $this->width 	= $width;
        $this->height 	= $height;
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
     * @param Array $roi   -- Region of interest
     * @param Float $scale -- Image Scale
     * 
     * @return Array
     */
    public function computePadding($roi, $scale) 
    {
        $width  = ($roi['right']  - $roi['left']) / $scale;
        $height = ($roi['bottom'] - $roi['top'])  / $scale;
        
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