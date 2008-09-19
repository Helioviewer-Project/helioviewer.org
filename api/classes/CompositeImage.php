<?php
/*
 * Created on Sep 12, 2008
 */
class CompositeImage {
	
	private $layers;
	private $obs = "soho";
	private $rootDir = "../tiles/";
	private $composite;
	private $emptyTile = "../images/transparent.gif";
	private $edgeEnhance = false;
	
	/*
	 * @constructor
	 */
	public function __construct($layers, $timestamps, $zoomLevel, $edges) {
		date_default_timezone_set('UTC');
		$this->layers = $layers;
		$this->timestamps = $timestamps;
		$this->zoomLevel = $zoomLevel;
		$this->edgeEnhance = $edges;
		
		//$this->debug();
		
		$images = array();
		
		$i = 0;
		foreach($this->layers as $layer) {
			$inst = substr($layer, 0, 3);
			$det  = substr($layer, 3,3);
			$meas = substr($layer, 6,3);
			
			array_push($images, $this->buildImage($inst, $det, $meas, $this->timestamps[$i]));
			
			$i++;
		}
		
		if (sizeOf($this->layers) > 1) {
			$this->composite = $this->buildComposite($images);
		}
		else {
			$this->composite = $images[0];
		}
		
		//Optional edge detection
		if ($this->edgeEnhance == "true")
			$this->composite->edgeImage(3);
	}

	/**
	 * @name buildImage
	 * @description Builds and ImageMagick image representing a single image
	 */	
	private function buildImage($inst, $det, $meas, $ts) {
		$filepath = $this->getFilepath($inst, $det, $meas, $ts);
		$numTiles = $this->getNumTiles($det);

		if ($inst == "LAS")
			$ext = "png";
		else
			$ext = "jpg";
		
		$tilesArray = array();
		
		for ($i = 0; $i < $numTiles/2; $i++) {
			for ($j = 0; $j < $numTiles/2; $j++) {
				$x = str_pad($j, 2, "0", STR_PAD_LEFT);
				$y = str_pad($i, 2, "0", STR_PAD_LEFT);
				$tile = $filepath . "-$x-$y.$ext";
				
				//Substitute a blank tile if tile does not exist
				if (file_exists($tile))
					array_push($tilesArray, $tile);
				else
					array_push($tilesArray, $this->emptyTile);
			}
		}
		
		$tiles = new Imagick($tilesArray);
		
		// Set background to be transparent for LASCO
		if ($inst == "LAS")
			$tiles->setBackgroundColor(new ImagickPixel("transparent"));
			
		// Determine geometry to use (e.g. 2x2+0+0 for four-tile images)
		$geometry = $numTiles/2 . "x" . $numTiles/2 . "+0+0";
		
		$img = $tiles->montageImage( new imagickdraw(), $geometry, "512x512+0+0", imagick::MONTAGEMODE_UNFRAME, "0x0+0+0" );
		$img->setImageFormat($ext);

		return $img;
	}
	
	/*
	 * buildComposite
	 */
	private function buildComposite($images) {
		//TEMP
		$eit = $images[0];
		$las = $images[1];

		//$eit->compositeImage($las, $las->getImageCompose(), 0, 0);
		$eit->compositeImage($las, imagick::COMPOSITE_OVER, 0, 0);
		return $eit;
	}
	
	/*
	 * printImage
	 */
	public function printImage() {
		header( "Content-Type: image/png" );
		echo $this->composite;
	}
	
	/*
	 * getImage
	 */
	 public function getImage() {
	 	return $this->composite;
	 }
	 
	 /*
	  * writeImage
	  */
	 public function writeImage($filename) {
	 	$this->composite->writeImage($filename);
	 }
	
	/**
	 * @name getFilepath
	 * @description Builds a directory string for the given layer
	 */
	private function getFilepath($inst, $det, $meas, $ts) {
		//$format = '%Y-%m-%dUTC%H:%M:%S';
		//$d = strptime(date($ts), $format);
		$d = getdate($ts);
		
		/*
		$year = $d['tm_year'] + 1900;
		$mon  = str_pad($d['tm_mon'] + 1, 2 , "0", STR_PAD_LEFT);
		$day =  str_pad($d['tm_mday'], 2 , "0", STR_PAD_LEFT);
		$hour =  str_pad($d['tm_hour'], 2 , "0", STR_PAD_LEFT);
		$min =  str_pad($d['tm_min'], 2 , "0", STR_PAD_LEFT);
		$sec =  str_pad($d['tm_sec'], 2 , "0", STR_PAD_LEFT);*/
		
		$year = $d['year'];
		$mon  = str_pad($d['mon'], 2 , "0", STR_PAD_LEFT);
		$day =  str_pad($d['mday'], 2 , "0", STR_PAD_LEFT);
		$hour =  str_pad($d['hours'], 2 , "0", STR_PAD_LEFT);
		$min =  str_pad($d['minutes'], 2 , "0", STR_PAD_LEFT);
		$sec =  str_pad($d['seconds'], 2 , "0", STR_PAD_LEFT);
		
		$path = $this->rootDir . implode("/", array($year, $mon, $day, $hour));	
		$path .= "/$this->obs/$inst/$det/$meas/";
		$path .= implode("_", array($year, $mon, $day, $hour . $min . $sec, $this->obs, $inst, $det, $meas));
		$path .= "-$this->zoomLevel";
		
		return $path;
	}
	
	/**
	 * @name getNumTiles
	 */
	private function getNumTiles($detector) {
		switch ($detector) {
			case "EIT":
				$zoomOffset = 10;
				break;
			case "0C2":
				$zoomOffset = 13;
				break;
			case "0C3":
				$zoomOffset = 15;
				break;
			case "MDI":
				$zoomOffset = 10;
		}
		
		$difference = $zoomOffset - $this->zoomLevel;
		if ($difference > 0)
			return pow(4, 1 + $difference);
		else
			return 4;     
	}

	/**
	 * @name debug
	 * @description (Debugging) Prints the parameters passed in by the user.
	 */
	public function debug() {
		print "<strong>Debugging Information:</strong><br><br>";
	
		print "&nbsp;&nbsp;&nbsp;&nbsp;Layers: ";
		foreach ($this->layers as $l)
			print " $l";
		
		print "<br><br>";
		
		print "&nbsp;&nbsp;&nbsp;&nbsp;Timestamps: ";
		foreach ($this->timestamps as $t)
			print " " . $t;
			
		print "<br><br>";
		
		print "Number of tiles:<br>";
		print "LAS 0C2: " . $this->getNumTiles("0C2") . "<br>";
		print "EIT: " . $this->getNumTiles("EIT");
		
	}
}
?>
