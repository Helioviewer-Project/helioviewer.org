<?php 
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Image_ImageType_LASCOImage class definition
 * There is one xxxImage for each type of detector Helioviewer supports.
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

class Image_ImageType_LASCOImage extends Image_SubFieldImage
{
	private   $_measurement;
	private   $_detector;
	protected $tileSize;
	protected $width;
	protected $height;
	protected $_cacheDir = HV_CACHE_DIR;
    protected $_noImage  = HV_EMPTY_TILE;
    protected $solarCenterOffsetX;
    protected $solarCenterOffsetY;
	
	public function __construct(
		$width, $height, $date, $sourceJp2, $roi, $format, $jp2Width, $jp2Height, 
		$jp2Scale, $desiredScale, $detector, $measurement, $offsetX, $offsetY, $outputFile)
	{
		$this->_detector 	= $detector;
		$this->_measurement = $measurement;
		parent::__construct($sourceJp2, $date, $roi, $format, $jp2Width, $jp2Height, $jp2Scale, $desiredScale, $outputFile);

		if ($this->_detector == "C2") {
            $colorTable = HV_ROOT_DIR . "/api/resources/images/color-tables/ctable_idl_3.png";
        } else if ($this->_detector == "C3") {
            $colorTable = HV_ROOT_DIR . "/api/resources/images/color-tables/ctable_idl_1.png";
        }

        if (file_exists($colorTable)) {
            $this->setColorTable($colorTable);
        }
        
		$this->setAlphaMask(true);
        $this->width 	= $width;
        $this->height 	= $height;
        $this->solarCenterOffsetX = $offsetX;
        $this->solarCenterOffsetY = $offsetY;
        $this->relativeTileSize   = $width * ($desiredScale / $jp2Scale);
	}

   	protected function getAlphaMaskCmd($intermediate)
    {
    	return $this->applyAlphaMask($intermediate);
    }
	
	public static function getFilePathNickName($det, $meas) 
	{
		return "LASCO-$det/$meas";
	}
	
	public function getWaterMarkName() 
	{
		return "LASCO $this->_detector\n";
	}
	
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
     * @param string $input image filepath
     *
     * @return string An imagemagick sub-command for generating the necessary alpha mask
     */
	protected function applyAlphaMask($input)
    {
        $maskWidth  = 1040;
        $maskHeight = 1040;
        $mask       = HV_ROOT_DIR . "/api/resources/images/alpha-masks/LASCO_{$this->_detector}_Mask.png";
        
        // Extracted subfield will always have a spatial scale equal to either the original JP2 scale, or
        // the original JP2 scale / (2 ^ $reduce)
        if ($this->reduce > 0) {
            $maskScaleFactor = 1 / pow(2, $this->reduce);
        } else {
            $maskScaleFactor = 1;
        }
        
        //var_dump($this);
        $maskTopLeftX = ($this->roi['left'] + ($maskWidth  - $this->jp2Width) /2 - $this->solarCenterOffsetX) * $maskScaleFactor;
        $maskTopLeftY = ($this->roi['top'] +  ($maskHeight - $this->jp2Height)/2 - $this->solarCenterOffsetY) * $maskScaleFactor;

        // Crop dimensions
        $cropWidth  = $this->subfieldWidth  * $maskScaleFactor;
        $cropHeight = $this->subfieldHeight * $maskScaleFactor;
        
        // Length of tile edge and gravity
        if ($this->padding) {
            $side    = $this->padding["width"];
            $gravity = $this->padding["gravity"];
        } else {
            $side    = $this->relativeTileSize * $maskScaleFactor;
            $gravity = "SouthWest";
        }

        $str = " -respect-parenthesis ( %s -gravity %s -background black -extent %fx%f ) " .
               "( %s -resize '%f%%' -crop %fx%f%+f%+f +repage -monochrome -gravity %s " .
               "-background black -extent %fx%f ) -alpha off -compose copy_opacity -composite ";
        
        $cmd = sprintf(
            $str, $input, $gravity, $side, $side, $mask, 100 * $maskScaleFactor,
            $cropWidth, $cropHeight, $maskTopLeftX, $maskTopLeftY, $gravity, $side, $side
        );

        return $cmd;
    }
}