<?php
/**
 * @class Tile
 * @author Keith Hughitt
 * @author Jaclyn Beck
 * 6-12-2009 The JP2Image class now uses pixels instead of tile coordinates, so this class
 *              has a method to convert its tile coordinates into pixels.
 */
require('SubFieldImage.php');

abstract class Tile extends SubFieldImage {
    protected $x;
    protected $y;
    protected $tileSize;

    /**
     * constructor
     */
    public function __construct($jp2, $tile, $x, $y, $desiredScale, $tileSize, $jp2Width, $jp2Height, $jp2Scale, $format, $display = true) {
        $this->x = $x;
        $this->y = $y;
        $this->tileSize = $tileSize;
        
        $roi = $this->convertTileIndexToPixels($jp2Width, $jp2Height, $jp2Scale, $desiredScale, $tileSize, $x, $y);
        
        parent::__construct($jp2, $tile, $roi, $format, $jp2Width, $jp2Height, $jp2Scale, $desiredScale);
        
        $this->setSquareImage(true);
    }
    
    /**
     * Returns tilesize relative to scale of image requested
     * @return 
     */
    protected function getRelativeTileSize($jp2Scale, $desiredScale, $tileSize) {
        return $tileSize * ($desiredScale / $jp2Scale);
    }

    /**
     * @description Converts tile coordinates such as (-1, 0) into actual pixels. This method
     *                 changes xRange and yRange to reflect pixels instead of tile coordinates. 
     *                 The basic formula for this is: pixels = (num outerTs before start value) * outerTs + (numInnerTiles before start value) * innerTs
     *                 The size of the tile (xSize or ySize) is either outerTs or innerTs, depending where the tile is in the image.
     * @return 
     */    
    function convertTileIndexToPixels($jp2Width, $jp2Height, $jp2Scale, $desiredScale, $tileSize, $x, $y) {
        // Rounding
        $precision = 6;
        
        $relativeTileSize = $this->getRelativeTileSize($jp2Scale, $desiredScale, $tileSize);
        
        // Parameters
        $top = $left = $width = $height = null;
        
        // Number of tiles for the entire image
        $imgNumTilesX = max(2, ceil($jp2Width  /  $relativeTileSize));
        $imgNumTilesY = max(2, ceil($jp2Height /  $relativeTileSize));

        // Tile placement architecture expects an even number of tiles along each dimension
        if ($imgNumTilesX % 2 != 0)
            $imgNumTilesX += 1;

        if ($imgNumTilesY % 2 != 0)
            $imgNumTilesY += 1;
                  
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
            if($left < 0 || $top < 0) {
                throw new Exception("[convertTileIndexToPixels] Invalid start value for top or left values.");
            }
            if($right > $jp2Width || $bottom > $jp2Height) {
                throw new Exception("[convertTileIndexToPixels] Invalid size value for right or bottom values.");
            }
        }
        catch(Exception $e) {
           $msg = "[PHP][" . date("Y/m/d H:i:s") . "]\n\t " . $e->getMessage() . "\n\n";
           file_put_contents(Config::ERROR_LOG, $msg, FILE_APPEND);
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
