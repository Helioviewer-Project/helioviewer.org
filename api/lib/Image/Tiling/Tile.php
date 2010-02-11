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
require_once 'lib/Image/SubFieldImage.php';
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
abstract class Image_Tiling_Tile extends Image_SubFieldImage
{
    protected $x;
    protected $y;
    protected $tileSize;

    /**
     * Abstract tile class setup
     * 
     * @param string $jp2          Location of source JP2 image
     * @param string $tile         Location where tile is or will be stored
     * @param int    $x            Tile x-coordinate
     * @param int    $y            Tile y-coordinate
     * @param float  $desiredScale Pixel scale (arc-seconds/pixel) for which the tile should be scaled to
     * @param int    $tileSize     Length of a side of the (square) tile in pixels
     * @param int    $jp2Width     Width of the source JP2 image
     * @param int    $jp2Height    Height of the source JP2 image
     * @param float  $jp2Scale     Natural pixel scale of the source JP2 image
     * @param string $format       Format to store the tile in
     * @param bool   $display      If true, the tile will be printed to the screen after generation
     */
    public function __construct( 
        $jp2, $tile, $x, $y, $desiredScale, $tileSize, $jp2Width, $jp2Height, $jp2Scale, $format, $display = true
    ) {
        $this->x = $x;
        $this->y = $y;
        $this->tileSize = $tileSize;
        
        $roi = $this->convertTileIndexToPixels($jp2Width, $jp2Height, $jp2Scale, $desiredScale, $tileSize, $x, $y);
        
        parent::__construct($jp2, $tile, $roi, $format, $jp2Width, $jp2Height, $jp2Scale, $desiredScale);
        
        $this->setSquareImage(true);
    }
    
    /**
     * Returns tilesize relative to scale of image requested
     * 
     * @param float $jp2Scale     Natural pixel scale of the source JP2 image
     * @param float $desiredScale Pixel scale (arc-seconds/pixel) for which the tile should be scaled to
     * @param int   $tileSize     Length of a side of the (square) tile in pixels
     * 
     * @return float Size of a single natural-scale tile  at the requested scale
     */
    protected function getRelativeTileSize($jp2Scale, $desiredScale, $tileSize)
    {
        return $tileSize * ($desiredScale / $jp2Scale);
    }

    /**
     * Converts from tile coordinates (number of tiles in x & y directions) to pixel coordinates for a single tile
     * 
     * Converts tile coordinates such as (-1, 0) into actual pixels. This method changes xRange and yRange to reflect 
     * pixels instead of tile coordinates. The basic formula for this is:
     * 
     *     pixels = (num outerTs before start value) * outerTs + (numInnerTiles before start value) * innerTs
     * 
     * The size of the tile (xSize or ySize) is either outerTs or innerTs, depending where the tile is in the image.
     * 
     * @param int   $jp2Width     Width of the source JP2 image
     * @param int   $jp2Height    Height of the source JP2 image
     * @param float $jp2Scale     Natural pixel scale of the source JP2 image
     * @param float $desiredScale Pixel scale (arc-seconds/pixel) for which the tile should be scaled to
     * @param int   $tileSize     Length of a side of the (square) tile in pixels
     * @param int   $x            Tile x-coordinate
     * @param int   $y            Tile y-coordinate
     * 
     * @return array An array containing the pixel coordinates for a single tile's top-left and bottom-right corners
     */    
    function convertTileIndexToPixels($jp2Width, $jp2Height, $jp2Scale, $desiredScale, $tileSize, $x, $y)
    {
        // Rounding
        $precision = 6;
        
        $relativeTileSize = $this->getRelativeTileSize($jp2Scale, $desiredScale, $tileSize);
        
        // Parameters
        $top = $left = $width = $height = null;
        
        // Number of tiles for the entire image
        $imgNumTilesX = max(2, ceil($jp2Width  /  $relativeTileSize));
        $imgNumTilesY = max(2, ceil($jp2Height /  $relativeTileSize));

        // Tile placement architecture expects an even number of tiles along each dimension
        if ($imgNumTilesX % 2 != 0) {
            $imgNumTilesX += 1;
        }

        if ($imgNumTilesY % 2 != 0) {
            $imgNumTilesY += 1;
        }
                  
        // Shift so that 0,0 now corresponds to the top-left tile
        $relX = (0.5 * $imgNumTilesX) + $x;
        $relY = (0.5 * $imgNumTilesY) + $y;

        // Number of "inner" tiles
        $numTilesInsideX = $imgNumTilesX - 2;
        $numTilesInsideY = $imgNumTilesY - 2;
      
        // Dimensions for inner and outer tiles
        $innerTS = $relativeTileSize;
        $outerTS = ($jp2Width - ($numTilesInsideX * $innerTS)) / 2;

        /**
        // Upper left corner of 'tile'
        $this->yRange['start']     = (($relY == 0)? 0 : $outerTS + ($relY - 1) * $innerTS);
        $this->xRange['start']     = (($relX == 0)? 0 : $outerTS + ($relX - 1) * $innerTS);
        
        // Width and height of 'tile'
        $this->yRange['size']     = (( ($relY == 0) || ($relY == ($imgNumTilesY - 1)) )? $outerTS : $innerTS);
        $this->xRange['size']     = (( ($relX == 0) || ($relX == ($imgNumTilesX - 1)) )? $outerTS : $innerTS);**/
        
        // Upper left corner of 'tile'
        $top  = (($relY == 0)? 0 : $outerTS + ($relY - 1) * $innerTS);
        $left = (($relX == 0)? 0 : $outerTS + ($relX - 1) * $innerTS);
        
        // Width and height of 'tile'
        $bottom = $top  + (( ($relY == 0) || ($relY == ($imgNumTilesY - 1)) )? $outerTS : $innerTS);
        $right    = $left + (( ($relX == 0) || ($relX == ($imgNumTilesX - 1)) )? $outerTS : $innerTS);
            
        try {
            if ($left < 0 || $top < 0) {
                throw new Exception("[convertTileIndexToPixels] Invalid start value for top or left values.");
            }
            if ($right > $jp2Width || $bottom > $jp2Height) {
                throw new Exception("[convertTileIndexToPixels] Invalid size value for right or bottom values.");
            }
        }
        catch(Exception $e) {
            $msg = "[PHP][" . date("Y/m/d H:i:s") . "]\n\t " . $e->getMessage() . "\n\n";
            file_put_contents(HV_ERROR_LOG, $msg, FILE_APPEND);
            echo $msg;
        }
        
        return array(
            "top"    => $top,
            "left"   => $left,
            "bottom" => $bottom,
            "right"  => $right
        );
    }
}
?>