<?php
/*
 * Created on Sep 12, 2008
 * Last modified May 29, 2009
 * by Keith Hughitt
 */
require 'SubFieldImage.php';

class CompositeImage {
	private $layers;
	private $composite;

	/**
	 * Constructor
	 * @param object $layers an array of at least one layer name, such as SOHEITEIT304 (obs, inst, det, meas, no quotation marks)
	 * @param object $zoomLevel a number between 8-15, default is 10.
	 * @param object $xRange
	 * @param object $yRange
	 * @param object $options an array with ["edges"] => true/false, ["sharpen"] => true/false
	 * @param object $image an array with data on each layer: ["timestamp"], ["unix_timestamp"], ["timediff"], ["timediffabs"], ["uri"]
	 */
	public function __construct($layers, $zoomLevel, $xRange, $yRange, $options, $image) {
		date_default_timezone_set('UTC');
		$this->layers     = $layers;
		$this->zoomLevel  = $zoomLevel;
		$this->xRange     = $xRange;
		$this->yRange     = $yRange;
		$this->options    = $options;
		$this->tileSize	  = 512;

		$images = array();

		$jp2filepath = $this->getFilepath($image['uri']);

//		$filepath = Config::JP2_DIR . "2003/01/31/SOH/EIT/EIT/304/2003_01_31_011937_SOH_EIT_EIT_304.jp2";
//		$filepath = Config::TMP_ROOT_DIR . "/1/eit_final.jpg";

		// Build separate images
//		foreach($this->layers as $layer) {
//		array_push($images, $this->buildImage($layer));
//		}

		// Composite on top of one another
//		if (sizeOf($this->layers) > 1) {
//			$this->composite = $this->buildComposite($images);
//		} 
		
	// Only one layer for now. 
//		else {
//		$this->composite = $images[0];

		if(file_exists($jp2filepath))
			$this->subFieldImage = new SubFieldImage($jp2filepath, $image['uri'], $this->zoomLevel, $this->xRange, $this->yRange, $this->tileSize, false);
		else {
			echo "Error: JP2 image " . $jp2filepath . " does not exist. <br />";
			exit();
		}
	
		$filepath = $this->subFieldImage->getCacheFilepath();
		echo $filepath . " From CompositeImage->constructor<br />";

		if(file_exists($filepath))
			array_push($images, $filepath);
		else {
			echo "Error: cached imaged " . $filepath . " does not exist. <br />";
			exit();
		}

//		$img = $this->buildImage($this->subFieldImage);
//		echo $img;
//		exit();		
		// There is only one layer right now. Later, $this->composite will equal $this->compositeImages(...)		
		$this->composite = $images[0];
		echo $this->composite;
//		}

		//Optional settings
/*		if ($this->options['enhanceEdges'] == "true")
			$this->composite->edgeImage(3);

		if ($this->options['sharpen'] == "true")
			$this->composite->adaptiveSharpenImage(2,1);
*/
	}
	
	private function buildImage($image) {
//		$filepath = $this->getFilepath($image['uri']);
		
		// File extension
//		if ($layer->instrument() == "LAS")
			$ext = "png";
//		else
//			$ext = "jpg";

		$image->setImageFormat($ext);
		// Set background to be transparent for LASCO
		//if ($inst == "LAS")
		//	$tiles->setBackgroundColor(new ImagickPixel("transparent"));

		return $image;
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
 
	public function timestamps() {
		return $this->timestamps;
	}
	
	public function nextTime() {
		return array_shift($this->timestamps);
	}
	
	public function numFrames() {
		return sizeOf($this->timestamps);
	}

	/**
	 * @name getFilepath
	 * @description Builds a directory string for the given layer
	 */
	private function getFilepath($uri) {
/*		$d    = getdate($layer->nextTime());
		$obs  = $layer->observatory();
		$inst = $layer->instrument();
		$det  = $layer->detector();
		$meas = $layer->measurement();

		$year = $d['year'];
		$mon  = str_pad($d['mon'], 2 , "0", STR_PAD_LEFT);
		$day  = str_pad($d['mday'], 2 , "0", STR_PAD_LEFT);
		$hour = str_pad($d['hours'], 2 , "0", STR_PAD_LEFT);
		$min  = str_pad($d['minutes'], 2 , "0", STR_PAD_LEFT);
		$sec  = str_pad($d['seconds'], 2 , "0", STR_PAD_LEFT);
*/
		if(strlen($uri) != 37) {
			echo "Error: supplied uri is not a valid image file path. <br />";
			exit();
		}
		
		$year = substr($uri, 0, 4);
		$month = substr($uri, 5, 2); 
		$day = substr($uri, 8, 2);
		$obs = substr($uri, 18, 3);
		$inst = substr($uri, 22, 3);
		$det = substr($uri, 26, 3);
		$meas = substr($uri, 30, 3);

		$path = Config::JP2_DIR . implode("/", array($year, $month, $day));
		$path .= "/$obs/$inst/$det/$meas/";
		$path .= $uri;
//		$path .= implode("_", array($year, $mon, $day, $hour . $min . $sec, $obs, $inst, $det, $meas)) . ".jp2";

		return $path;
	}
	
	function getComposite() {
		return $this->composite;
	}
}
?>
