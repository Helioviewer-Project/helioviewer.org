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
    public function __construct($uri, $zoomLevel, $x, $y, $tileSize, $display = true) {
        $xRange = array("start" => $x, "end" => $x);
        $yRange = array("start" => $y, "end" => $y);

        parent::__construct($uri, $zoomLevel, $xRange, $yRange, $tileSize);

        $this->x = $x;
        $this->y = $y;
	
		$this->convertTileIndexToPixels();
        $this->getTile($display);
    }

    /**
     * getTile
     */
    function getTile($display) {
       
        // Tile image format
        $format = $this->getImageFormat();
        
        // Filepaths (for intermediate pgm and final png/jpg image)
        $tile = $this->getTileFilepath($format);
        
        // If tile already exists in cache, use it
        if (Config::ENABLE_CACHE && $display) {
            if (file_exists($tile)) {
                $this->display($tile);
                exit();
            }
        }

        // If nothing useful is in the cache, create the tile from scratch
        $im = $this->buildImage($tile);

        // Store image
        $this->image = $im;
        
        // Display image
        if ($display)
            $this->display($tile);
    }

    /**
     * getTileFilepath
     * @return
     */
    function getTileFilepath($format) {
        // Base directory
        $filepath = $this->cacheDir;
                
        if (!file_exists($filepath)) {
            mkdir($filepath);
            chmod($filepath, 0777);
        }
        // Base filename
        $filename = substr($this->uri, 0, -4);

        // Date information
        $year  = substr($this->timestamp,0,4);
        $month = substr($this->timestamp,5,2);
        $day   = substr($this->timestamp,8,2);

		$fieldArray = array($year, $month, $day, $this->observatory, $this->instrument, $this->detector, $this->measurement);
		
		foreach($fieldArray as $field) {
			$filepath .= $field . "/";
			
	        if (!file_exists($filepath)) {
	            mkdir($filepath);
	            chmod($filepath, 0777);
	        }
		}    

        // Convert coordinates to strings
        $xStr = "+" . str_pad($this->x, 2, '0', STR_PAD_LEFT);
        if (substr($this->x,0,1) == "-")
            $xStr = "-" . str_pad(substr($this->x, 1), 2, '0', STR_PAD_LEFT);

        $yStr = "+" . str_pad($this->y, 2, '0', STR_PAD_LEFT);
        if (substr($this->y,0,1) == "-")
            $yStr = "-" . str_pad(substr($this->y, 1), 2, '0', STR_PAD_LEFT);

        $filepath .= $filename . "_" . $this->zoomLevel . "_" . $xStr . "_" . $yStr . ".$format";

        return $filepath;
    }

	/**
	 * @description Converts tile coordinates such as (-1, 0) into actual pixels. This method
	 * 				changes xRange and yRange to reflect pixels instead of tile coordinates. 
	 * @return 
	 */	
	function convertTileIndexToPixels() {
        $jp2Width  = $this->jp2Width;
        $jp2Height = $this->jp2Height;
        $ts = $this->relativeTilesize;
      
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

        // number of tiles (may be greater than one for movies, etc)
        $numTilesX = min($imgNumTilesX - $relX, 1);
        $numTilesY = min($imgNumTilesY - $relY, 1);

        // Number of "inner" tiles
        $numTilesInsideX = $imgNumTilesX - 2;
        $numTilesInsideY = $imgNumTilesY - 2;
      
        // Dimensions for inner and outer tiles
        $innerTS = $ts;
        $outerTS = ($jp2Width - ($numTilesInsideX * $innerTS)) / 2;

		// Upper left corner of 'tile'
		$this->yRange["start"] 	= (($relY == 0)? 0 : $outerTS + ($relY - 1) * $innerTS);
		$this->xRange["start"] 	= (($relX == 0)? 0 : $outerTS + ($relX - 1) * $innerTS);

		// Width and height of 'tile'
		$this->yRange["end"] 	= (( ($relY == 0) || ($relY == ($imgNumTilesY - 1)) )? $outerTS : $innerTS);
		$this->xRange["end"] 	= (( ($relX == 0) || ($relX == ($imgNumTilesX - 1)) )? $outerTS : $innerTS);
	}
}
?>
