<?php
/**
 * @class Tile
 * @author Keith Hughitt
 * @author Jaclyn Beck
 * 6-12-2009 The JP2Image class now uses pixels instead of tile coordinates, so this class
 * 			 has a method to convert its tile coordinates into pixels.
 */
require('JP2Image.php');

class Tile extends JP2Image {
    protected $x;
    protected $y;

    /**
     * constructor
     */
    public function __construct($file, $x, $y, $zoomLevel, $tileSize, $width, $height, $scale, $format, $display = true) {
        $xRange    = array("start" => $x, "size" => $x);
        $yRange    = array("start" => $y, "size" => $y);
		$imageSize = array('width' => $tileSize, 'height' => $tileSize);
		
        parent::__construct($file, $xRange, $yRange, $zoomLevel, $imageSize, $width, $height, $scale, $format);

        $this->x = $x;
        $this->y = $y;

        $this->getTile($display);
    }

    /**
     * getTile
     */
    function getTile($display) {
        // Filepaths (for intermediate pgm and final png/jpg image)
        $tile = $this->getTileFilepath();
        
        // If tile already exists in cache, use it
        if (Config::ENABLE_CACHE && $display) {
            if (file_exists($tile)) {
                $this->display($tile);
                exit();
            }
        }

        // If nothing useful is in the cache, create the tile from scratch		
		$this->convertTileIndexToPixels();
        $im = $this->buildImage($tile);

        // Store image
        $this->image = $im;
        
        // Display image
        if ($display)
            $this->display($tile);
    }
	
	protected function getTileFilepath() {
		//Virtual	
	}

	/**
	 * @description Converts tile coordinates such as (-1, 0) into actual pixels. This method
	 * 				changes xRange and yRange to reflect pixels instead of tile coordinates. 
	 * 				The basic formula for this is: pixels = (num outerTs before start value) * outerTs + (numInnerTiles before start value) * innerTs
	 * 				The size of the tile (xSize or ySize) is either outerTs or innerTs, depending where the tile is in the image.
	 * @return 
	 */	
	function convertTileIndexToPixels() {
		try {
			// Making aliases for clarity
	        $jp2Width  = $this->jp2Width;
	        $jp2Height = $this->jp2Height;
	        $ts 	   = $this->imageRelWidth;
	      
	        // Rounding
	        $precision = 6;
	        
	        // Parameters
	        $top = $left = $width = $height = null;
	        
	        // Number of tiles for the entire image
	        $imgNumTilesX = max(2, ceil($jp2Width  / $ts));
	        $imgNumTilesY = max(2, ceil($jp2Height / $ts));
	
	        // Tile placement architecture expects an even number of tiles along each dimension
	        if ($imgNumTilesX % 2 != 0)
	            $imgNumTilesX += 1;
	
	        if ($imgNumTilesY % 2 != 0)
	            $imgNumTilesY += 1;
	                  
	        // Shift so that 0,0 now corresponds to the top-left tile
	        $relX = (0.5 * $imgNumTilesX) + $this->x;
	        $relY = (0.5 * $imgNumTilesY) + $this->y;
	
	        // Number of "inner" tiles
	        $numTilesInsideX = $imgNumTilesX - 2;
	        $numTilesInsideY = $imgNumTilesY - 2;
	      
	        // Dimensions for inner and outer tiles
	        $innerTS = $ts;
	        $outerTS = ($jp2Width - ($numTilesInsideX * $innerTS)) / 2;
	
			// Upper left corner of 'tile'
			$this->yRange['start'] 	= (($relY == 0)? 0 : $outerTS + ($relY - 1) * $innerTS);
			$this->xRange['start'] 	= (($relX == 0)? 0 : $outerTS + ($relX - 1) * $innerTS);
	
			// Width and height of 'tile'
			$this->yRange['size'] 	= (( ($relY == 0) || ($relY == ($imgNumTilesY - 1)) )? $outerTS : $innerTS);
			$this->xRange['size'] 	= (( ($relX == 0) || ($relX == ($imgNumTilesX - 1)) )? $outerTS : $innerTS);
			
			if($this->xRange['start'] < 0 || $this->yRange['start'] < 0) {
				throw new Exception("[convertTileIndexToPixels] Invalid start value for xRange or yRange");
			}
			if($this->xRange['size'] > $this->jp2Width || $this->yRange['size'] > $this->jp2Height) {
				throw new Exception("[convertTileIndexToPixels] Invalid size value for xRange or yRange");
			}
		}
		catch(Exception $e) {
           $msg = "[PHP][" . date("Y/m/d H:i:s") . "]\n\t " . $e->getMessage() . "\n\n";
           file_put_contents(Config::ERROR_LOG, $msg, FILE_APPEND);
		   echo $msg;
		}
	}
}
?>
