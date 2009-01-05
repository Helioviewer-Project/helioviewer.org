<?php
/*
 * Created on Sep 12, 2008
 * Last modified Oct 21, 2008
 * by Keith Hughitt
 */
class CompositeImage {
	private $layers;
	private $composite;

	/*
	 * @constructor
	 */
	public function __construct($layers, $zoomLevel, $xRange, $yRange, $options) {
		date_default_timezone_set('UTC');
		$this->layers     = $layers;
		$this->zoomLevel  = $zoomLevel;
		$this->xRange     = $xRange;
		$this->yRange     = $yRange;
		$this->options    = $options;

		$images = array();

		// Build separate images
		foreach($this->layers as $layer) {
			array_push($images, $this->buildImage($layer));
		}

		// Composite on top of one another
		if (sizeOf($this->layers) > 1) {
			$this->composite = $this->buildComposite($images);
		}
		else {
			$this->composite = $images[0];
		}

		//Optional settings
		if ($this->options['enhanceEdges'] == "true")
			$this->composite->edgeImage(3);

		if ($this->options['sharpen'] == "true")
			$this->composite->adaptiveSharpenImage(2,1);
	}
	
	private function buildImage($layer) {
		$filepath = $this->getFilepath($layer);
		
		//echo "Filepath: $filepath<br>";
		//exit();

		// File extension
		if ($layer->instrument() == "LAS")
			$ext = "png";
		else
			$ext = "jpg";

		//$img->setImageFormat($ext);
		// Set background to be transparent for LASCO
		//if ($inst == "LAS")
		//	$tiles->setBackgroundColor(new ImagickPixel("transparent"));

		//return $img;
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
	private function getFilepath($layer) {
		$d    = getdate($layer->nextTime());
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

		$path = $this->rootDir . implode("/", array($year, $mon, $day));
		$path .= "/$obs/$inst/$det/$meas/";
		$path .= implode("_", array($year, $mon, $day, $hour . $min . $sec, $obs, $inst, $det, $meas)) . ".jp2";

		return $path;
	}
}
?>
