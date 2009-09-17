<?php
/**
 * @class SubFieldImage
 */
require('JP2Image.php');

class SubFieldImage extends JP2Image {
    protected $subfieldFile; //image
	protected $subfieldWidth; //imageWidth
	protected $subfieldHeight;
	protected $subfieldRelWidth; //imageRelWidth
	protected $subfieldRelHeight;
	protected $region; // {top: , left: , bottom: , right: }
	
	/**
	  */	
	public function __construct() {
        //parent::__construct();

	}
	
    /**
     * getRegionString
     * Build a region string to be used by kdu_expand. e.g. "-region {0.0,0.0},{0.5,0.5}"
     * 
     * NOTE: Because kakadu's internal precision for region strings is less than PHP,
     * the numbers used are cut off to prevent erronious rounding.
     */
	private function getRegionString() {
		$precision = 6;

		// Calculate the top, left, width, and height in terms of kdu_expand parameters (between 0 and 1)
		$top 	= substr($this->yRange["start"] / $this->jp2Height, 0, $precision);	
		$left 	= substr($this->xRange["start"] / $this->jp2Width,  0, $precision);
		$height = substr($this->yRange["size"]   / $this->jp2Height, 0, $precision);
		$width 	= substr($this->xRange["size"]   / $this->jp2Width,  0, $precision);
		
        $region = "-region \{$top,$left\},\{$height,$width\}";

        return $region;		
	}
	
	/** 
	 * If the image is a Tile, it is padded according to where it lies in the image.
	 * If the image is a SubFieldImage, the image is padded with an offset from the NW corner.
	 */ 
    private function padImage ($jp2Width, $jp2Height, $width, $height, $x, $y) {		
		if($this->isTile) {
	        // Determine min and max tile numbers
	        $imgNumTilesX = max(2, ceil($jp2Width  / $this->imageWidth));
	        $imgNumTilesY = max(2, ceil($jp2Height / $this->imageHeight));
	        
	        // Tile placement architecture expects an even number of tiles along each dimension
	        if ($imgNumTilesX % 2 != 0)
	            $imgNumTilesX += 1;
	
	        if ($imgNumTilesY % 2 != 0)
	            $imgNumTilesY += 1;

			$numInnerTilesX = $imgNumTilesX - 2;
			$numInnerTilesY = $imgNumTilesY - 2;

	 		$tileMinX = ($this->jp2Width  / 2) - ($width  * $numInnerTilesX / 2);
			$tileMaxX = ($this->jp2Width  / 2) + ($width  * $numInnerTilesX / 2);     
			$tileMinY = ($this->jp2Height / 2) - ($height * $numInnerTilesY / 2); 
			$tileMaxY = ($this->jp2Height / 2) + ($height * $numInnerTilesY / 2);   

	        // Determine where the tile is located (where tile should lie in the padding)
	        $gravity = null;

	        if ($x < $tileMinX) {
	            if ($y < $tileMinY) {
	                $gravity = "SouthEast";
	            }
	            else if ($y == $tileMaxY) {
	                $gravity = "NorthEast";
	            }
	            else {
	                $gravity = "East";
	            }
	        }
			
	        else if ($x == $tileMaxX) {
	            if ($y < $tileMinY) {
	                $gravity = "SouthWest";
	            }
	            else if ($y == $tileMaxY) {
	                $gravity = "NorthWest"; 
	            }
	            else {
	                $gravity = "West";
	            }
	        }
	        
	        else {
	            if($y < $tileMinY) {
	            	$gravity = "South";
	            }

	            else {
	                $gravity = "North";
	            }
	        }

			$offset = " ";
		}
	
		/* 
		 * If the item is a subfieldImage, it is assumed that the overall picture is larger than, but contains this image.
		 * The image has a heliocentric offset and will be padded with that offset. 
		 */
		else {
			$gravity = "NorthWest";
			// Offset the image from the center using the heliocentric offset
			$offset  = $this->hcOffset["x"] . $this->hcOffset["y"] . " ";
		}

        // Construct padding command
        // TEST: use black instead of transparent for background?
        return "-gravity $gravity -extent " . $width . "x" . $height . $offset;
    }
}
?>