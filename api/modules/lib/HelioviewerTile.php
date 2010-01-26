<?php
/**
 * @class HelioviewerTile
 * @author Keith Hughitt
 * 
 * TODO (2009/12/07)
 *  To improve smoothness of transparency edges, use a larger mask (e.g. 2080x2080 instead of 1040x1040) so that most of scaling will be downwards.
 */
require_once('Tile.php');

class HelioviewerTile extends Tile {
    private $observatory;
    private $instrument;
    private $detector;
    private $measurement;
    private $cacheDir = HV_CACHE_DIR;
    private $noImage  = HV_EMPTY_TILE;
        
     /**
     * constructor
     */
    public function __construct($uri, $x, $y, $zoom, $tileSize, $jp2Width, $jp2Height, $jp2Scale, $offsetX, $offsetY, $format, $obs, $inst, $det, $meas, $display = true) {
        $this->observatory = $obs;
        $this->instrument  = $inst;
        $this->detector    = $det;
        $this->measurement = $meas;
        $this->zoomLevel   = $zoom;
        $this->offsetX     = $offsetX;
        $this->offsetY     = $offsetY;
        
        $jp2  = HV_JP2_DIR . $uri;
        $tile = $this->getTileFilepath($jp2, $x, $y, $format);

        // If tile already exists in cache, use it
        if (HV_DISABLE_CACHE && $display) {
            if (file_exists($tile)) {
                $this->displayCachedTile($tile);
                exit();
            }
        }
        $desiredScale = $this->getImageScale($zoom);
        
        parent::__construct($jp2, $tile, $x, $y, $desiredScale, $tileSize, $jp2Width, $jp2Height, $jp2Scale, $format);
        $colorTable = $this->getColorTable();
        
        if ($colorTable)
            $this->setColorTable($colorTable);
        
        if ($this->instrument == "LASCO")
            $this->setAlphaMask(true);
            
        $this->buildImage();
        
        if ($display)
            $this->display();
    }
        
    /**
     * getTileFilepath
     * @return
     */
    private function getTileFilepath($jp2, $x, $y, $format) {
        // Base directory
        $filepath = $this->cacheDir . "/";
                
        if (!file_exists($filepath)) {
            mkdir($filepath);
            chmod($filepath, 0777);
        }

        // Base filename
        $exploded = explode("/", $jp2);
        $filename = substr(end($exploded), 0, -4);
        
        // Date information
        $year  = substr($filename, 0, 4);
        $month = substr($filename, 5, 2);
        $day   = substr($filename, 8, 2);

        $fieldArray = array($year, $month, $day, $this->observatory, $this->instrument, $this->detector, $this->measurement);
        
        foreach($fieldArray as $field) {
            $filepath .= str_replace(" ", "_", $field) . "/";
            
            if (!file_exists($filepath)) {
                //echo $filepath . "<br>";
                mkdir($filepath);
                chmod($filepath, 0777);
            }
        }    

        // Convert coordinates to strings
        $xStr = "+" . str_pad($x, 2, '0', STR_PAD_LEFT);
        if (substr($x,0,1) == "-")
            $xStr = "-" . str_pad(substr($x, 1), 2, '0', STR_PAD_LEFT);

        $yStr = "+" . str_pad($y, 2, '0', STR_PAD_LEFT);
        if (substr($y,0,1) == "-")
            $yStr = "-" . str_pad(substr($y, 1), 2, '0', STR_PAD_LEFT);

        $filepath .= $filename . "_" . $this->zoomLevel . "_" . $xStr . "_" . $yStr . ".$format";

        return $filepath;
    }
    
    /**
     * @description Translates a given zoom-level into an image plate scale.
     */
    private function getImageScale($zoomLevel) {
        $zoomOffset = $zoomLevel - HV_BASE_ZOOM_LEVEL;
        return HV_BASE_IMAGE_SCALE * (pow(2, $zoomOffset));
    }
        
    /**
     * Gets the filepath for the color look-up table that corresponds to the image.
     * @return string clut filepath
     * @param object $detector
     * @param object $measurement
     * 
     * Note (2009/09/15): Would it make sense to return color table when initially looking up image, and pass to tile requests?
     */
    private function getColorTable() {
        //$rootdir = substr(getcwd(), 0, -4);
        
        if ($this->detector == "EIT") {
            return HV_ROOT_DIR . "/images/color-tables/ctable_EIT_" . $this->measurement . ".png";
        }
        else if ($this->detector == "C2") {
            return HV_ROOT_DIR .  "/images/color-tables/ctable_idl_3.png";
        }
        else if ($this->detector == "C3") {
            return HV_ROOT_DIR . "/images/color-tables/ctable_idl_1.png";
        }
        else
            return false;       
    }
    
    /**
     * Generates a portion of an ImageMagick convert command to apply an alpha mask
     * @return The location of the alpha mask to use
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
     *      exec("convert -size 1024x1024 xc:black -fill white -draw \"circle $crpix1,$crpix2 $crpix1,$outerCircleY\" -fill black -draw \"circle $crpix1,$crpix2 $crpix1,$innerCircleY\" +antialias LASCO_C2_Mask.png")
     */
    public function applyAlphaMask($input) {
        $maskWidth  = 1040;
        $maskHeight = 1040;
        
        if ($this->detector == "C2")
            $mask = HV_ROOT_DIR . "/images/alpha-masks/LASCO_C2_Mask.png";            
        else if ($this->detector == "C3")
            $mask = HV_ROOT_DIR . "/images/alpha-masks/LASCO_C3_Mask.png";

        // Ratio of the original image scale to the desired scale
        $actualToDesired = 1 / $this->desiredToActual;

        // Determine offset
        $offsetX = $this->offsetX + (($maskWidth  - $this->jp2Width  + $this->roi["left"])  * $actualToDesired);
        $offsetY = $this->offsetY + (($maskHeight - $this->jp2Height + $this->roi["top"]) * $actualToDesired);
        
        //$cmd = sprintf(" %s -scale %s %s -alpha Off -compose copy_opacity -composite ", $input, $scale, $mask);
        //$cmd = sprintf(" -geometry %s%s %s \( -resize '%s%%' %s \) -alpha Off -compose copy_opacity -composite ", $offsetX, $offsetY, $input, 100 * $actualToDesired, $mask);
        //$str = " %s -extent 512x512 \( -resize '%f%%' -crop %fx%f%+f%+f %s \) -compose copy_opacity -composite -channel A -threshold 50%% "; 
        $str = " -respect-parenthesis \( %s -gravity SouthWest -background black -extent 512x512 \) \( %s -resize '%f%%' -crop %fx%f%+f%+f +repage -monochrome -gravity SouthWest -background black -extent 512x512 \) -alpha off -compose copy_opacity -composite ";
        $cmd = sprintf($str, $input, $mask, 100 * $actualToDesired, $this->subfieldRelWidth, $this->subfieldRelHeight , $offsetX, $offsetY);
        
        return $cmd;
    }
    
    /**
     * Displays the image on the page
     * @TODO: Would it be better to make SubFieldImage->display static and call? Or instantiate
     * super classes (Tile and SubFieldImage), and then call display normally?
     */
    public function displayCachedTile($tile) {
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

            if ($format == "png")
                header("Content-Type: image/png");
            else
                header("Content-Type: image/jpeg");
                
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
    //    return $this->measurement === "0WL" ? true : false;
    //}
}
?>