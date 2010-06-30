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
/**
 * Helioviewer Tile Class Definition
 * 
 * PHP version 5
 * TODO (2009/12/07)
 * To improve smoothness of transparency edges, use a larger mask (e.g. 
 * 2080x2080  instead of 1040x1040) so that most of scaling will be downwards
 * 
 * @category WebClient
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
abstract class Image_Tiling_Tile
{
    protected $x;
    protected $y;
    protected $tileSize;
    protected $relativeTileSize;

    /**
     * Abstract tile class setup
     * 
     * @param string $desiredScale Pixel scale (arc-seconds/pixel) for which the tile should be scaled to
     * @param string $tileSize     Length of a side of the (square) tile in pixels
     * @param float  $jp2Scale     Natural pixel scale of the source JP2 image
     * @param int    $x            Tile x-coordinate
     * @param int    $y            Tile y-coordinate
     * @param bool   $display      If true, the tile will be printed to the screen after generation
     */
    public function __construct( 
        $desiredScale, $tileSize, $jp2Scale, $x, $y, $display = true
    ) {
        $this->tileSize			= $tileSize;
        $this->relativeTileSize = $tileSize * ($desiredScale / $jp2Scale);
        
        $this->x = $x;
        $this->y = $y;
    }
    
    /**
     * Pads a tile to the desired dimensions
     * 
     * For outer tiles (corner and side tiles), it may be necessary to pad the extracted subfield region
     * in order to guarantee that a square tile is returned and also, in the case where the extracted region
     * is already at the desired scale, to prevent the browser from resizing the tile to be larger than it should be.
     * 
     * How big should the final tile be? (Assuming browser can resize up or down as long as requested
     * region is exactly represented in tile).
     * 
     *     $desiredToActual * $tileSize
     *     
     * For example, if the user is viewing a tiled JP2 image with original scale of 2.63, and the requested scale
     * is 1.315, then the 512x512 that the user sees is actually only 256x256 at the JP2's natural image scale.
     * So the resulting tile that is returned to the user should be:
     * 
     *   = $desiredToActual * tileSize
     *   = (1.315 / 2.63) * 512
     *   = 0.5 * 512
     *   = 256
     *
     * @return mixed Returns an array with dimentions and gravity to use for padding, or false if none is needed
     */
    protected function computePadding ()
    {
        $x = $this->x;
        $y = $this->y;
        
        // Determine min and max tile numbers
        $imgNumTilesX = max(2, ceil($this->image->jp2RelWidth()  / $this->tileSize));
        $imgNumTilesY = max(2, ceil($this->image->jp2RelHeight() / $this->tileSize));

        // Tile placement architecture expects an even number of tiles along each dimension
        if ($imgNumTilesX % 2 != 0) {
            $imgNumTilesX += 1;
        }

        if ($imgNumTilesY % 2 != 0) {
            $imgNumTilesY += 1;
        }

        $tileMinX = - ($imgNumTilesX / 2);
        $tileMaxX =   ($imgNumTilesX / 2) - 1;
        $tileMinY = - ($imgNumTilesY / 2);
        $tileMaxY =   ($imgNumTilesY / 2) - 1;

        // Determine where the tile is located (where tile should lie in the padding)
        $gravity = null;
        $right = $this->image->subfieldRelWidth()  - $this->tileSize;
        $down  = $this->image->subfieldRelHeight() - $this->tileSize;

        if ($x == $tileMinX) {
            if ($y == $tileMinY) {
                $offsetX = $right;
                $offsetY = $down;
                //$gravity = "SouthEast";
            } else if ($y == $tileMaxY) {
            	$offsetX = $right;
            	$offsetY = 0;
                //$gravity = "NorthEast";
            } else {
            	$offsetX = $right;
            	$offsetY = 0;
                //$gravity = "East";
            }
        } else if ($x == $tileMaxX) {
            if ($y == $tileMinY) {
            	$offsetX = 0;
            	$offsetY = $down;
                //$gravity = "SouthWest";
            } else if ($y == $tileMaxY) {
            	$offsetX = 0;
            	$offsetY = 0;
                //$gravity = "NorthWest";
            } else {
            	$offsetX = 0;
            	$offsetY = 0;
                //$gravity = "West";
            }
        } else {
            if ($y == $tileMinY) {
            	$offsetX = 0;
            	$offsetY = $down;
                //$gravity = "South";
            } else if ($y == $tileMaxY) {
            	$offsetX = 0;
            	$offsetY = 0;
                //$gravity = "North";
            } else {
            	$offsetX = 0;
            	$offsetY = $down;
                //$gravity = "SouthWest";//return false;
            }
        }
        /*
        $reduceFactor = $this->image->reduceFactor();
        // Length of side in padded tile 
        if ($reduceFactor > 0) {
            $side = ($this->relativeTileSize / pow(2, $reduceFactor));
        } else {
            $side = $this->relativeTileSize;
        }*/

        return array(
            "gravity" => "NorthWest",
            "width"   => $this->tileSize,
            "height"  => $this->tileSize,
            "offsetX" => $offsetX,
            "offsetY" => $offsetY
        );
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
     * @param int   $jp2Width         Width of the source JP2 image
     * @param int   $jp2Height        Height of the source JP2 image
     * @param float $jp2Scale         Natural pixel scale of the source JP2 image
     * @param float $desiredScale     Pixel scale (arc-seconds/pixel) for which the tile should be scaled to
     * @param int   $tileSize         Length of a side of the (square) tile in pixels
     * @param int   $relativeTileSize The size of the tile relative to the JP2 Image
     * @param int   $x                Tile x-coordinate
     * @param int   $y                Tile y-coordinate
     * 
     * @return array An array containing the pixel coordinates for a single tile's top-left and bottom-right corners
     */    
    function convertTileIndexToPixels($jp2Width, $jp2Height, $jp2Scale, $desiredScale, $tileSize, $relativeTileSize, $x, $y)
    {
        // Rounding
        $precision = 6;
        
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

        // Number of "inner" (non-edge) tiles
        $numTilesInsideX = $imgNumTilesX - 2;
        $numTilesInsideY = $imgNumTilesY - 2;
      
        // Dimensions for inner and outer tiles
        $innerTS = $relativeTileSize;
        $outerTS = ($jp2Width - ($numTilesInsideX * $innerTS)) / 2;

        // Upper left corner of 'tile'
        $top  = (($relY == 0)? 0 : $outerTS + ($relY - 1) * $innerTS);
        $left = (($relX == 0)? 0 : $outerTS + ($relX - 1) * $innerTS);
        
        // Width and height of 'tile'
        $bottom = $top  + (( ($relY == 0) || ($relY == ($imgNumTilesY - 1)) )? $outerTS : $innerTS);
        $right    = $left + (( ($relX == 0) || ($relX == ($imgNumTilesX - 1)) )? $outerTS : $innerTS);
            
        try {
            if ($left < 0 || $top < 0) {
                $msg = "Unable to convert from tile to pixel coordinates: Invalid start value for top or left values.";
                throw new Exception($msg);
            }
            if ($right > $jp2Width || $bottom > $jp2Height) {
                throw new Exception("Unable to convert from tile to pixel coordinates: Invalid size value for right or bottom values.");
            }
        }
        catch(Exception $e) {
            logErrorMsg($e->getMessage(), true);
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