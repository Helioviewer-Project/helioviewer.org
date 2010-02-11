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
 */
class Image_Tiling_HelioviewerTile extends Image_Tiling_Tile
{
    private $_observatory;
    private $_instrument;
    private $_detector;
    private $_measurement;
    private $_cacheDir = HV_CACHE_DIR;
    private $_noImage  = HV_EMPTY_TILE;
        
    /**
     * Helioviewer Tile Constructor
     * 
     * @param string $uri       URI for the original JPEG 2000 image
     * @param int    $x         Helioviewer.org tile x-coordinate
     * @param int    $y         Helioviewer.org tile y-coordinate
     * @param int    $zoom      Helioviewer.org zoom-level
     * @param int    $tileSize  Requested tile size (width and height)
     * @param int    $jp2Width  Width of the original JP2 image
     * @param int    $jp2Height Height of the original JP2 image
     * @param float  $jp2Scale  Plate scale (arc-seconds/pixal) of original image
     * @param float  $offsetX   Amount original image is offset from sun center (x) 
     * @param float  $offsetY   Amount original image is offset from sun center (y)
     * @param string $format    Desired format for resulting tile image
     * @param string $obs       Observatory
     * @param string $inst      Instrument
     * @param string $det       Detector
     * @param string $meas      Measurement
     * @param bool   $display   Display the tile immediately or generate only
     * 
     * @return void
     */
    public function __construct(
        $uri, $x, $y, $zoom, $tileSize, $jp2Width, $jp2Height, $jp2Scale,  
        $offsetX, $offsetY, $format, $obs, $inst, $det, $meas, $display = true
    ) {
        $this->_observatory = $obs;
        $this->_instrument  = $inst;
        $this->_detector    = $det;
        $this->_measurement = $meas;
        $this->zoomLevel    = $zoom;
        $this->offsetX      = $offsetX;
        $this->offsetY      = $offsetY;
        
        $jp2  = HV_JP2_DIR . $uri;
        $tile = $this->_getTileFilepath($jp2, $x, $y, $format);

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
        $desiredScale = $this->_getImageScale($zoom);
        
        // Now we are ready to call the base Tile constructor
        parent::__construct(
            $jp2, $tile, $x, $y, $desiredScale, $tileSize, $jp2Width, $jp2Height, $jp2Scale, $format
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
     * @param string $format The file format used by the tile
     *   
     * @return string The path in the cache where the tile should be stored
     */
    private function _getTileFilepath($jp2, $x, $y, $format)
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
            $filepath .= str_replace(" ", "_", $field) . "/";
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

        $filepath .= $filename . "_" . $this->zoomLevel . "_" . $xStr . "_" . $yStr . ".$format";

        return $filepath;
    }
    
    /**
     * Translates a given zoom-level into an image plate scale.
     * 
     * @param int $zoomLevel Zoom-level for given tile request
     * 
     * @return float Returns the arc-seconds/pixal equivalent of the requested zoom-level.
     */
    private function _getImageScale($zoomLevel)
    {
        $zoomOffset = $zoomLevel - HV_BASE_ZOOM_LEVEL;
        return HV_BASE_IMAGE_SCALE * (pow(2, $zoomOffset));
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
            return HV_ROOT_DIR . "/images/color-tables/ctable_EIT_" . $this->_measurement . ".png";
        } else if ($this->_detector == "C2") {
            return HV_ROOT_DIR .  "/images/color-tables/ctable_idl_3.png";
        } else if ($this->_detector == "C3") {
            return HV_ROOT_DIR . "/images/color-tables/ctable_idl_1.png";
        } else {
            return false;
        }       
    }
    
    /**
     * Generates a portion of an ImageMagick convert command to apply an alpha mask
     * Note: Values for radii used to generate the LASCO C2 & C3 alpha masks:
     *  rocc_outer = 7.7;   // (.9625 * orig)
     *  rocc_inner = 2.415; // (1.05 * orig)
     *  
     *  Generating the alpha masks:
     *      $rsun       = 80.814221; // solar radius in image pixels
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
     * @param string $input image filepath
     * 
     * @return string An imagemagick sub-command for generating the necessary alpha mask
     */
    public function applyAlphaMask($input)
    {
        $maskWidth  = 1040;
        $maskHeight = 1040;
        
        if ($this->_detector == "C2") {
            $mask = HV_ROOT_DIR . "/images/alpha-masks/LASCO_C2_Mask.png";
        } else if ($this->_detector == "C3") {
            $mask = HV_ROOT_DIR . "/images/alpha-masks/LASCO_C3_Mask.png";
        }

        // Ratio of the original image scale to the desired scale
        $actualToDesired = 1 / $this->desiredToActual;

        // Determine offset
        $offsetX = $this->offsetX + (($maskWidth  - $this->jp2Width  + $this->roi["left"])  * $actualToDesired);
        $offsetY = $this->offsetY + (($maskHeight - $this->jp2Height + $this->roi["top"]) * $actualToDesired);
        
        /**
            $cmd = sprintf(" %s -scale %s %s -alpha Off -compose copy_opacity -composite ", $input, $scale, $mask);
            $str = " -geometry %s%s %s \( -resize '%s%%' %s \) -alpha Off -compose copy_opacity -composite ";
            $cmd = sprintf($str, $offsetX, $offsetY, $input, 100 * $actualToDesired, $mask);
            $str = " %s -extent 512x512 \( -resize '%f%%' -crop %fx%f%+f%+f %s \) -compose copy_opacity " .
                   "-composite -channel A -threshold 50%% ";
        */ 
        $str = " -respect-parenthesis \( %s -gravity SouthWest -background black -extent 512x512 \) " .
               "\( %s -resize '%f%%' -crop %fx%f%+f%+f +repage -monochrome -gravity SouthWest " .
               "-background black -extent 512x512 \) -alpha off -compose copy_opacity -composite ";
        $cmd = sprintf(
            $str, $input, $mask, 100 * $actualToDesired, 
            $this->subfieldRelWidth, $this->subfieldRelHeight, $offsetX, $offsetY
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
            $format = substr($tile, -3);
            
            // Cache-Lifetime (in minutes)
            $lifetime = 60;
            $exp_gmt = gmdate("D, d M Y H:i:s", time() + $lifetime * 60) ." GMT";
            header("Expires: " . $exp_gmt);
            header("Cache-Control: public, max-age=" . $lifetime * 60);
    
            // Filename & Content-length
            $exploded = explode("/", $tile);
            $filename = end($exploded);
            
            $stat = stat($tile);
            header("Content-Length: " . $stat['size']);
            header("Content-Disposition: inline; filename=\"$filename\"");    

            if ($format == "png") {
                header("Content-Type: image/png");
            } else {
                header("Content-Type: image/jpeg");
            }
                
            if (!readfile($tile)) {
                throw new Exception("Error displaying $filename\n");
            }
        } catch (Exception $e) {
            header("Content-Type: text/html");
            $msg = "[PHP][" . date("Y/m/d H:i:s") . "]\n\t " . $e->getMessage() . "\n\n";
            file_put_contents(HV_ERROR_LOG, $msg, FILE_APPEND);
        }
    }

    /**
     * hasAlphaMask
     * @return string
     */
    //private function hasAlphaMask() {
    //    return $this->_measurement === "0WL" ? true : false;
    //}
}
?>