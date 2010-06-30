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
    private $_cacheDir = HV_CACHE_DIR;
    private $_noImage  = HV_EMPTY_TILE;
    protected $image;

    /**
     * Helioviewer Tile Constructor
     *
     * @param string $uri                URI for the original JPEG 2000 image
     * @param string $date               The date of the source JP2 image
     * @param int    $x                  Helioviewer.org tile x-coordinate
     * @param int    $y                  Helioviewer.org tile y-coordinate
     * @param float  $tileScale          Requested image scale to use for tile
     * @param int    $tileSize           Requested tile size (width and height)
     * @param int    $jp2Width           Width of the original JP2 image
     * @param int    $jp2Height          Height of the original JP2 image
     * @param float  $jp2Scale           Plate scale (arc-seconds/pixal) of original image
     * @param float  $solarCenterOffsetX Amount original image is offset from sun center (x)
     * @param float  $solarCenterOffsetY Amount original image is offset from sun center (y)
     * @param string $format             Desired format for resulting tile image
     * @param string $obs                Observatory
     * @param string $inst               Instrument
     * @param string $det                Detector
     * @param string $meas               Measurement
     * @param bool   $display            Display the tile immediately or generate only
     *
     * @return void
     */
    public function __construct(
        $uri, $date, $x, $y, $tileScale, $tileSize, $jp2Width, $jp2Height, $jp2Scale,
        $solarCenterOffsetX, $solarCenterOffsetY, $format, $obs, $inst, $det, $meas, $display = true
    ) {
        $type 		= strtoupper($inst) . "Image";
        $classname	= "Image_ImageType_$type";
        include_once HV_ROOT_DIR . "/api/src/Image/ImageType/$type.php";
        
        $jp2  = HV_JP2_DIR . $uri;
        $tile = $this->getTileFilepath($jp2, $date, $x, $y, $tileScale, $format, $classname, $det, $meas);
        
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
            $tileScale, $tileSize, $jp2Scale, $x, $y
        );

        $roi = $this->convertTileIndexToPixels($jp2Width, $jp2Height, $jp2Scale, $tileScale, $tileSize, $this->relativeTileSize, $x, $y);

        // Dynamically generate a class that corresponds to the type of image. Current classes available:
        // AIAImage, EITImage, MDIImage, LASCOImage
        $this->image = new $classname(
            $tileSize, $tileSize, $date, $jp2, $roi, $format, $jp2Width, $jp2Height, 
            $jp2Scale, $tileScale, $det, $meas, $solarCenterOffsetX, $solarCenterOffsetY, $tile
        );
        
        // Padding is calculated in the tile and not in the xxxImage because padding is done differently between tiles and
        // CompositeImageLayers. 
        $padding = $this->computePadding();
        $this->image->setPadding($padding);
        $this->image->setTileSize($tileSize);
        $this->image->build();

        if ($display) {
            $this->image->display();
        } 
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
  
    
    /**
     * getTileFilePath
     *
     * @param string $jp2       The location of the tile's source JP2 image.
     * @param string $date      The date of the source JP2 image (e.g. "2003-11-08 01:19:35")
     * @param int    $x         Tile x-coordinate
     * @param int    $y         Tile y-coordinate
     * @param float  $scale     Image scale of requested tile
     * @param string $format    The file format used by the tile
     * @param string $classname The name of the class to be created, ex. EIT_Image or MDI_Image
     * @param string $det       The detector, ex. EIT, C2
     * @param string $meas      The measurement, ex. 171, white-light
     *
     * @return string The path in the cache where the tile should be stored
     */
    protected function getTileFilepath($jp2, $date, $x, $y, $scale, $format, $classname, $det, $meas)
    {
        // Base directory
        $filepath = $this->_cacheDir . "/";

        // Base filename
        $exploded = explode("/", $jp2);
        $filename = substr(end($exploded), 0, -4);

        // Date information
        $year  = substr($date, 0, 4);
        $month = substr($date, 5, 2);
        $day   = substr($date, 8, 2);

        /**
        $fieldArray = array(
            $year, $month, $day, $this->_observatory, $this->_instrument,
            $this->_detector, $this->_measurement
        );
        */
        
        // $classname::getFilePathNickName does not work in php 5.2.x, using call_user_func instead
        $filepath .= call_user_func($classname . '::getFilePathNickName', $det, $meas);
        
        $filepath .= "/$year/$month/$day/";

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
}
?>