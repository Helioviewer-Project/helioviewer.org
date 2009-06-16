<?php
/*
 * Created on Sep 12, 2008
 * Last modified May 29, 2009
 * by Keith Hughitt
 */
require 'SubFieldImage.php';

abstract class CompositeImage {
	protected $composite;
	protected $zoomLevel;
	protected $options;
	protected $imageSize;
	protected $tmpDir;
	protected $layerImages;

	/**
	 * Constructor
	 * @param object $zoomLevel a number between 8-15, default is 10.
	 * @param object $options an array with ["edges"] => true/false, ["sharpen"] => true/false
	 * @param object $image an array with data on each layer: ["timestamp"], ["unix_timestamp"], ["timediff"], ["timediffabs"], ["uri"]
	 * @param object $frameNum is the frame number if this belongs to a movie, or an id number if it's a screenshot.
	 */
	protected function __construct($zoomLevel, $options, $tmpDir) { 
		date_default_timezone_set('UTC');

		$this->zoomLevel  	= $zoomLevel;
		$this->options    	= $options;
		$this->tmpDir 	   	= $tmpDir;

//		$this->layerImages	= $layerImages;
		
		// Default imageSize will be 512 for now. Later on this will be modified to reflect appropriate aspect ratios for movies or screenshots.
		$this->imageSize  = 512;
//		$this->frameNum = $frameNum;

//		$this->tmpDir = CONFIG::CACHE_DIR . "movies/";
		// Create the temp directory where images will be stored.
		if(!file_exists($this->tmpDir)) {
			mkdir($this->tmpDir);
			chmod($this->tmpDir, 0777);
		}			
	}
	
	protected function compileImages() {
		// Array holds the filepaths for all 'built' images.
		$builtImages = array();
		$opacities = array();
		
		foreach($this->layerImages as $image) {
			// Build each image separately
			$uri = $image['closestImages']['uri'];
			$jp2filepath = $this->getFilepath($uri);

			$xRange = $image["xRange"];	
			$yRange = $image["yRange"];
			array_push($opacities, array("opacityValue" => $image["opacity"], "opacityGroup" => $image['closestImages']['opacityGrp']));
				
			if(file_exists($jp2filepath))
				$subFieldImage = new SubFieldImage($jp2filepath, $uri, $this->zoomLevel, $xRange, $yRange, $this->imageSize);
			else {
				echo "Error: JP2 image " . $jp2filepath . " does not exist. <br />";
				exit();
			}

			$filepath = $subFieldImage->getCacheFilepath();
			//echo $filepath . " From CompositeImage->constructor<br />";

			if(file_exists($filepath))
				array_push($builtImages, $filepath);
			else {
				echo "Error: cached imaged " . $filepath . " does not exist. <br />";
				exit();
			}
		}

		// Composite on top of one another
		if (sizeOf($this->layerImages) > 1) {
			$this->composite = $this->buildComposite($builtImages, $opacities);
		} 

		else {
			if(isset($this->frameNum))
				$this->composite = $builtImages[0];
			else {
				$cmd = CONFIG::PATH_CMD . " && " . CONFIG::DYLD_CMD . " && convert " . $builtImages[0] . " " . $this->tmpDir . $this->id . ".png";
				exec($cmd);
				$this->composite = $this->tmpDir . $this->id . ".png";
			}

//		$img = $this->buildImage($this->subFieldImage);
//		echo $img;
//		exit();		
		}
//		echo $this->composite;
		//Optional settings
/*		if ($this->options['enhanceEdges'] == "true")
			$this->composite->edgeImage(3);

		if ($this->options['sharpen'] == "true")
			$this->composite->adaptiveSharpenImage(2,1);
*/
	}
	
	protected function buildImage($image) {
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
	private function buildComposite($images, $opacities) {
		//TEMP
//		$eit = $images[0];
//		$las = $images[1];
//		echo $eit . " " . $las;

		// Put images into the order they will be composited onto each other. 
		$sortedImages = $this->sortByOpacity($images, $opacities); 

		if(isset($this->frameNum))		
			$tmpImg = $this->tmpDir . $this->frameNum . ".tif";
		else
			$tmpImg = $this->tmpDir . $this->id . ".png";
			
		$cmd = CONFIG::PATH_CMD . " && " . CONFIG::DYLD_CMD . " && composite -gravity Center";
		
		// It is assumed that the array $images is already in the correct order for opacity groups.
		foreach($sortedImages as $image)
			$cmd .= " " . $image["image"];
		$cmd .= " " . $tmpImg;
//		echo "Executing " . $cmd . "<br />";
		exec($cmd);
		//$eit->compositeImage($las, $las->getImageCompose(), 0, 0);
//		$eit->compositeImage($las, imagick::COMPOSITE_OVER, 0, 0);
		return $tmpImg;	
	}

	/*
	 * Sorts the layers by opacity group and then by opacity value. 
	 * Opacity groups that are used currently are 3 (C3 images), 2 (C2 images), 1 (EIT/MDI images).
	 * The array is sorted like this: Group 3, Group 2, Group 1(smallest opacity, -> , largest opacity).
	 */
	private function sortByOpacity($images, $opacities) {
		// Separate images by opacity group.
		// TODO: find a sort function that is cleaner than this.
		$imageGroups = array("1" => array(), "2" => array(), "3" => array(), "4" => array());
		$i = 0;
		foreach($opacities as $op) {
			array_push($imageGroups[$op["opacityGroup"]], array("image" => $images[$i], "opacity" => $op["opacityValue"]));
			$i++;
		}

		// Sort each group separately in order of increasing opacity
		foreach($imageGroups as $group) {
			array_multisort($group, SORT_NUMERIC, SORT_ASC);
		}

		$sortedImages = array();
		foreach($imageGroups as $group) {
			foreach($group as $data) {
				array_push($sortedImages, $data);
			}
		}
//			echo substr($images[$key], -60, -27);
		// return the sorted array in order of largest opacity group to smallest.
		return array_reverse($sortedImages);		
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
	protected function getFilepath($uri) {
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

		$path = CONFIG::JP2_DIR . implode("/", array($year, $month, $day));
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
