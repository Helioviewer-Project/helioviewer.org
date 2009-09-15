<?php
/**
 * @class SolarTile
 * @author Keith Hughitt
 */
require('Tile.php');

class SolarTile extends Tile {
    private $observatory;
	private $instrument;
	private $detector;
	private $measurement;    
		
 	/**
     * constructor
     */
    public function __construct($uri, $x, $y, $zoomLevel, $tileSize, $width, $height, $scale, $format, $obs, $inst, $det, $meas, $date, $display = true) {
		$this->observatory = $obs;
		$this->instrument  = $inst;
		$this->detector    = $det;
		$this->measurement = $meas;
		$this->date        = $date;
	
		$this->setColorTable($this->getColorTable());
	
		$file = Config::JP2_DIR . $uri;
		
        parent::__construct($file, $x, $y, $zoomLevel, $tileSize, $width, $height, $scale, $format, $display = true);
    }
		
    /**
     * getTileFilepath
     * @return
     */
    private function getTileFilepath() {
        // Base directory
        $filepath = $this->cacheDir . "/";
                
        if (!file_exists($filepath)) {
            mkdir($filepath);
            chmod($filepath, 0777);
        }

        // Base filename
        $exploded = explode("/", $this->jp2);
        $filename = substr(end($exploded), 0, -4);
		
        // Date information
        $year  = substr($this->date, 0, 4);
        $month = substr($this->date, 5, 2);
        $day   = substr($this->date, 8, 2);

		$fieldArray = array($year, $month, $day, $this->observatory, $this->instrument, $this->detector, $this->measurement);
		
		foreach($fieldArray as $field) {
			$filepath .= $field . "/";
			
	        if (!file_exists($filepath)) {
	        	echo $filepath . "<br>";
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

        $filepath .= $filename . "_" . $this->zoomLevel . "_" . $xStr . "_" . $yStr . ".$this->format";

        return $filepath;
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
        if ($this->detector == "EIT") {
            return Config::WEB_ROOT_DIR . "/images/color-tables/ctable_EIT_" . $this->measurement . ".png";
        }
        else if ($this->detector == "C2") {
            return Config::WEB_ROOT_DIR .  "/images/color-tables/ctable_idl_3.png";
        }
        else if ($this->detector == "C3") {
            return Config::WEB_ROOT_DIR . "/images/color-tables/ctable_idl_1.png";
        }        
    }

    /**
     * hasAlphaMask
     * @return string
     */
    private function hasAlphaMask() {
        return $this->measurement === "0WL" ? true : false;
    }
}
?>