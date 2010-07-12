<?php 
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Image_ImageType_TemplateImage class definition
 * There is one xxxImage for each type of detector Helioviewer supports.
 * Use this class for an idea of how to create new image classes for new image types.
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Jaclyn Beck <jabeck@nmu.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once HV_ROOT_DIR . '/api/src/Image/SubFieldImage.php';
/**
 * Image_ImageType_EITImage class definition
 * There is one xxxImage for each type of detector Helioviewer supports.
 * Use this class for an idea of how to create new image classes for new image types.
 * 
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Jaclyn Beck <jabeck@nmu.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Image_ImageType_TEMPLATEImage extends Image_SubFieldImage
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
     * @param int    $offsetY      Offset of the sun center from the iamge center
     * @param string $outputFile   Filepath to where the final image will be stored
     */     
    public function __construct(
        $width, $height, $date, $sourceJp2, $roi, $format, $jp2Width, $jp2Height, 
        $jp2Scale, $desiredScale, $detector, $measurement, $offsetX, $offsetY, $outputFile
    ) {
        $this->_measurement = $measurement;
        
        parent::__construct(
            $sourceJp2, $date, $roi, $format, $jp2Width, $jp2Height, $jp2Scale, $desiredScale, 
            $outputFile, $offsetX, $offsetY
        );

        // Enter color table here if it exists, otherwise leave this commented out. 
        /*
        $colorTable = HV_ROOT_DIR . "/api/resources/images/color-tables/ctable_EIT_{$this->_measurement}.png";

        if (file_exists($colorTable)) {
            $this->setColorTable($colorTable);
        }
        */
        $this->width 	= $width;
        $this->height 	= $height;
    }
    
    /**
     * Returns the detector/measurement nickname used in filepaths
     * 
     * @param string $det  Not used for EIT images but is used in other image types like
     *                     LASCO, so this parameter is required anyway.
     * @param string $meas The measurement of the image.
     * 
     * @return string The nickname
     */    
    public static function getFilePathNickName($det, $meas) 
    {
    	/*
    	 * Enter the appropriate filepath nickname as it should appear. Examples:
    	 * "AIA/" . $meas
    	 * "LASCO-" . $det . "/" . $meas
    	 */ 
        return "EIT/" . $meas;
    }
    
    /**
     * Gets a string that will be displayed in the image's watermark
     * 
     * @return string watermark name
     */
    public function getWaterMarkName() 
    {
        /*
         * Enter the appropriate layer nickname as it should appear in the watermark. Examples:
         * "AIA $this->_measurement\n"
         * "LASCO $this->_detector\n"
         */ 
        return "EIT $this->_measurement\n";
    }
    
    /**
     * Uncomment this if the image has NO COLOR TABLE.
     * 
     * @param string $input  Input file
     * @param string $output Output file
     * 
     * @return void
     */
    /*
    protected function setColorPalette($input, $output)
    {
        return;
    }*/
    
    /**
     * The rest of these functions are for ALPHA MASKED IMAGES ONLY. Uncomment all of these if
     * the image requires alpha-masking or transparency.
     */
    /**
     * calls applyAlphaMask to build an alpha mask command for imagemagick.
     * 
     * @param Object $imagickImage An IMagick object
     * 
     * @return void
     */
    /*
    protected function applyAlphaMaskCmd($imagickImage)
    {
        $this->applyAlphaMask($imagickImage);
    }*/
    
    /**
     * Calls the command-line imagemagick functions instead of imagick.
     * 
     * @param string $intermediate The filepath to the grayscale image.
     * 
     * @return void
     */
    /*
    protected function applyAlphaMaskCmdNoImagick($intermediate)
    {
        $this->applyAlphaMaskNoImagick($intermediate);
    }*/
    
    /**
     * Sets the background of the image to transparent.
     * 
     * @param Object $imagickImage An IMagick object
     * 
     * @return void
     */
    /*
    protected function setBackground($imagickImage)
    {
        $imagickImage->setImageBackgroundColor('transparent');
    }*/
    
    /**
     * Generates a portion of an ImageMagick convert command to apply an alpha mask
     * 
     * Note: More accurate values for radii used to generate the LASCO C2 & C3 alpha masks:
     *  rocc_outer = 7.7;   // (.9625 * orig)
     *  rocc_inner = 2.415; // (1.05 * orig)
     *  
     *  LASCO C2 Image Scale
     *      $lascoC2Scale = 11.9;
     *  
     *  Solar radius in arcseconds, source: Djafer, Thuillier and Sofia (2008)
     *      $rsunArcSeconds = 959.705;
     *      $rsun           = $rsunArcSeconds / $lascoC2Scale; 
     *                      = 80.647 // Previously, used hard-coded value of 80.814221
     *                      
     *  Generating the alpha masks:
     *      $rocc_inner = 2.415;
     *      $rocc_outer = 7.7;
     *
     *      // convert to pixels
     *      $radius_inner = $rocc_inner * $rsun;
     *      $radius_outer = $rocc_outer * $rsun;
     *      $innerCircleY = $crpix2 + $radius_inner;
     *      $outerCircleY = $crpix2 + $radius_outer;
     *
     *      exec("convert -size 1024x1024 xc:black -fill white -draw \"circle $crpix1,$crpix2 $crpix1,$outerCircleY\"
     *          -fill black -draw \"circle $crpix1,$crpix2 $crpix1,$innerCircleY\" +antialias LASCO_C2_Mask.png")
     *
     *  Masks have been pregenerated and stored in order to improve performance.
     *  
     *  Note on offsets:
     *  
     *   The original CRPIX1 and CRPIX2 values used to determine the location of the center of the sun in the image
     *   are specified with respect to a bottom-left corner origin. The values passed in to this method from the tile
     *   request, however, specify the offset with respect to a top-left corner origin. This simply makes things
     *   a bit easier since ImageMagick also treats images as having a top-left corner origin.
     *   
     *  Region of interest:
     *  
     *    The region of interest (ROI) below is specified at the original JP2 image scale.
     *
     * @param Object $imagickImage an initialized Imagick object
     *
     * @return void
     */
    /*
    protected function applyAlphaMask($imagickImage)
    {
        $maskWidth  = 1040;
        $maskHeight = 1040;
        $mask       = HV_ROOT_DIR . "/api/resources/images/alpha-masks/LASCO_{$this->_detector}_Mask.png";

        if ($this->reduce > 0) {
            $maskScaleFactor = 1 / pow(2, $this->reduce);
        } else {
            $maskScaleFactor = 1;
        }

        $maskTopLeftX = ($this->roi['left'] + ($maskWidth  - $this->jp2Width) /2 - $this->solarCenterOffsetX) * $maskScaleFactor;
        $maskTopLeftY = ($this->roi['top']  + ($maskHeight - $this->jp2Height)/2 - $this->solarCenterOffsetY) * $maskScaleFactor;

        $width  = $this->subfieldWidth  * $maskScaleFactor;
        $height = $this->subfieldHeight * $maskScaleFactor;

        $mask  = new IMagick($mask);
        
        $mask->scaleImage($maskWidth * $maskScaleFactor, $maskHeight * $maskScaleFactor);
        $mask->cropImage($width, $height, $maskTopLeftX, $maskTopLeftY);
        $mask->resetImagePage("{$width}x{$height}+0+0");

        $mask->setImageBackgroundColor('black');
        $mask->setImageExtent($width, $height);

        $imagickImage->setImageExtent($width, $height);
        $imagickImage->compositeImage($mask, IMagick::COMPOSITE_COPYOPACITY, 0, 0);
        $mask->destroy();
    }*/
    
    /**
     * Does the same thing as applyAlphaMask but with command-line calls instead of IMagick
     * 
     * @param string $input The filepath to the image
     * 
     * @return void
     */
    /*
    protected function applyAlphaMaskNoImagick($input)
    {
        $maskWidth  = 1040;
        $maskHeight = 1040;
        $mask       = HV_ROOT_DIR . "/api/resources/images/alpha-masks/LASCO_{$this->_detector}_Mask.png";

        if ($this->reduce > 0) {
            $maskScaleFactor = 1 / pow(2, $this->reduce);
        } else {
            $maskScaleFactor = 1;
        }
        
        //var_dump($this);
        $maskTopLeftX = ($this->roi['left'] + ($maskWidth  - $this->jp2Width) /2 - $this->solarCenterOffsetX) * $maskScaleFactor;
        $maskTopLeftY = ($this->roi['top']  + ($maskHeight - $this->jp2Height)/2 - $this->solarCenterOffsetY) * $maskScaleFactor;

        $width  = $this->subfieldWidth  * $maskScaleFactor;
        $height = $this->subfieldHeight * $maskScaleFactor;

        $gravity   = $this->padding["gravity"];

        $str = "convert -respect-parenthesis ( %s -gravity %s -background black -extent %fx%f ) " .
               "( %s -resize %f%% -crop %fx%f%+f%+f +repage -monochrome -gravity %s " .
               "-background black -extent %fx%f ) -alpha off -compose copy_opacity -composite $input";
        
        $cmd = sprintf(
            $str, $input, $gravity, $width, $height, $mask, 100 * $maskScaleFactor,
            $width, $height, $maskTopLeftX, $maskTopLeftY, 
            $gravity, $width, $height
        );

        exec(escapeshellcmd($cmd));
    }*/
}