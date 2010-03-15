<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Helioviewer Tile Class Definition
 *
 * PHP version 5
 *
 * @category WebClient
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once 'Tile.php';
/**
 * A Helioviewer-specific tile class
 *
 * @category WebClient
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 *
 * TODO (2009/12/07)
 *  To improve smoothness of transparency edges, use a larger mask (e.g.
 *  2080x2080  instead of 1040x1040) so that most of scaling will be downwards
 *  
 * = 02/25/2010 =
 * To improve the tile rendering when resizing is required on the browser-side, a couple things could be done:
 *  1. Create a ts x ts empty div and place in each tile spot until the image is ready to be loaded
 *  2. Hide all tiles until all are ready to be displayed (similar to when zooming in and out)
 */
class Image_Tiling_HelioviewerTile extends Image_Tiling_Tile
{
    private $_observatory;
    private $_instrument;
    private $_detector;
    private $_measurement;
    private $_sunCenterOffsetX;
    private $_sunCenterOffsetY;
    private $_cacheDir = HV_CACHE_DIR;
    private $_noImage  = HV_EMPTY_TILE;

    /**
     * Helioviewer Tile Constructor
     *
     * @param string $uri              URI for the original JPEG 2000 image
     * @param int    $x                Helioviewer.org tile x-coordinate
     * @param int    $y                Helioviewer.org tile y-coordinate
     * @param float  $tileScale        Requested image scale to use for tile
     * @param int    $tileSize         Requested tile size (width and height)
     * @param int    $jp2Width         Width of the original JP2 image
     * @param int    $jp2Height        Height of the original JP2 image
     * @param float  $jp2Scale         Plate scale (arc-seconds/pixal) of original image
     * @param float  $sunCenterOffsetX Amount original image is offset from sun center (x)
     * @param float  $sunCenterOffsetY Amount original image is offset from sun center (y)
     * @param string $format           Desired format for resulting tile image
     * @param string $obs              Observatory
     * @param string $inst             Instrument
     * @param string $det              Detector
     * @param string $meas             Measurement
     * @param bool   $display          Display the tile immediately or generate only
     *
     * @return void
     */
    public function __construct(
        $uri, $x, $y, $tileScale, $tileSize, $jp2Width, $jp2Height, $jp2Scale,
        $sunCenterOffsetX, $sunCenterOffsetY, $format, $obs, $inst, $det, $meas, $display = true
    ) {
        $this->_observatory      = $obs;
        $this->_instrument       = $inst;
        $this->_detector         = $det;
        $this->_measurement      = $meas;
        $this->_sunCenterOffsetX = $sunCenterOffsetX;
        $this->_sunCenterOffsetY = $sunCenterOffsetY;

        $jp2  = HV_JP2_DIR . $uri;
        $tile = $this->_getTileFilepath($jp2, $x, $y, $tileScale, $format);

        // If tile already exists in cache, use it
        // TODO: Once a smarter caching system is in place, take advantage of
        //       which data we know will be cached (e.g. most recent 2 weeks), and
        //       skip file_exists check.
        if (!HV_DISABLE_CACHE && $display) {
            if (file_exists($tile)) {
                $this->displayCachedTile($tile);
                exit();
            }
        }

        // Now we are ready to call the base Tile constructor
        parent::__construct(
            $jp2, $tile, $x, $y, $tileScale, $tileSize, $jp2Width, $jp2Height, $jp2Scale, $format
        );

        $colorTable = $this->_getColorTable();

        if ($colorTable) {
            $this->setColorTable($colorTable);
        }

        if ($this->_instrument == "LASCO") {
            $this->setAlphaMask(true);
        }

        $this->buildImage();

        if ($display) {
            $this->display();
        }
    }

    /**
     * getTileFilePath
     *
     * @param string $jp2    The location of the tile's source JP2 image.
     * @param int    $x      Tile x-coordinate
     * @param int    $y      Tile y-coordinate
     * @param float  $scale  Image scale of requested tile
     * @param string $format The file format used by the tile
     *
     * @return string The path in the cache where the tile should be stored
     */
    private function _getTileFilepath($jp2, $x, $y, $scale, $format)
    {
        // Base directory
        $filepath = $this->_cacheDir . "/";

        // Base filename
        $exploded = explode("/", $jp2);
        $filename = substr(end($exploded), 0, -4);

        // Date information
        $year  = substr($filename, 0, 4);
        $month = substr($filename, 5, 2);
        $day   = substr($filename, 8, 2);

        $fieldArray = array(
            $year, $month, $day, $this->_observatory, $this->_instrument,
            $this->_detector, $this->_measurement
        );
        
        foreach ($fieldArray as $field) {
            $filepath .= str_replace(" ", "-", $field) . "/";
        }

        // Convert coordinates to strings
        $xStr = "+" . str_pad($x, 2, '0', STR_PAD_LEFT);
        if (substr($x, 0, 1) == "-") {
            $xStr = "-" . str_pad(substr($x, 1), 2, '0', STR_PAD_LEFT);
        }

        $yStr = "+" . str_pad($y, 2, '0', STR_PAD_LEFT);
        if (substr($y, 0, 1) == "-") {
            $yStr = "-" . str_pad(substr($y, 1), 2, '0', STR_PAD_LEFT);
        }

        $filepath .= $filename . "_" . $scale . "_" . $xStr . "_" . $yStr . ".$format";

        return $filepath;
    }

    /**
     * Gets the filepath for the color look-up table that corresponds to the image.
     *
     * Note 2009/09/15: Would it make sense to return color table when initially
     * looking up image, and pass to tile requests?
     *
     * @return string|bool Returns the filepath for the color lookup table, or false
     *                     if none is found.
     */
    private function _getColorTable()
    {
        //$rootdir = substr(getcwd(), 0, -4);

        if ($this->_detector == "EIT") {
            return "resources/images/color-tables/ctable_EIT_{$this->_measurement}.png";
        } else if ($this->_detector == "C2") {
            return "resources/images/color-tables/ctable_idl_3.png";
        } else if ($this->_detector == "C3") {
            return "resources/images/color-tables/ctable_idl_1.png";
        } else {
            return false;
        }
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
    public function applyAlphaMask($input)
    {
        $maskWidth  = 1040;
        $maskHeight = 1040;
        $mask       = "resources/images/alpha-masks/LASCO_{$this->_detector}_Mask.png";
        
        // Extracted subfield will always have a spatial scale equal to either the original JP2 scale, or
        // the original JP2 scale / (2 ^ $reduce)
        if ($this->reduce > 0) {
            $maskScaleFactor = 1 / pow(2, $this->reduce);
        } else {
            $maskScaleFactor = 1;
        }
        
        //var_dump($this);
        $maskTopLeftX = ($this->roi['left'] + ($maskWidth - $this->jp2Width)/2 - $this->_sunCenterOffsetX)   * $maskScaleFactor;
        $maskTopLeftY = ($this->roi['top'] +  ($maskHeight - $this->jp2Height)/2 - $this->_sunCenterOffsetY) * $maskScaleFactor;

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

    /**
     * Displays the image on the page
     *
     * @param string $tile Filepath to the cached tile.
     *
     * @TODO: Would it be better to make SubFieldImage->display static and call? Or instantiate
     * super classes (Tile and SubFieldImage), and then call display normally?
     *
     * @return void
     */
    public function displayCachedTile($tile)
    {
        try {
            //header("Cache-Control: public, max-age=" . $lifetime * 60);
            $headers = apache_request_headers();
            
            // Enable caching of images served by PHP
            // http://us.php.net/manual/en/function.header.php#61903
            $lastModified = 'Last-Modified: '.gmdate('D, d M Y H:i:s', filemtime($tile)).' GMT';
            if (isset($headers['If-Modified-Since']) && (strtotime($headers['If-Modified-Since']) == filemtime($tile))) {
                // Cache is current (304)
                header($lastModified, true, 304);    
            } else {
                // Image not in cache or out of date (200)
                header($lastModified, true, 200);

                header('Content-Length: '.filesize($tile));

                $format = substr($tile, -3);
                if ($format == "png") {
                    header("Content-Type: image/png");
                } else {
                    header("Content-Type: image/jpeg");
                }

                // Filename & Content-length
                $exploded = explode("/", $tile);
                $filename = end($exploded);
                header("Content-Disposition: inline; filename=\"$filename\"");
                
                if (!readfile($tile)) {
                    throw new Exception("Unable to read tile from cache: $filename");
                }

            }
        } catch (Exception $e) {
            header("Content-Type: text/html");
            logErrorMsg($e->getMessage(), true);
        }
    }
}
?>