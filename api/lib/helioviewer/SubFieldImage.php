<?php
/**
 * @class SubFieldImage - Obtains an extracted region from a jp2 image and saves it as a .tif
 */
require('JP2Image.php');

class SubFieldImage extends JP2Image {
	/**
	  * Constructor
	  * @param object $filepath a string representing the location of the jp2 image, including subfolders.
	  * @param object $uri the name of the jp2 image file, in the format 2003_01_31_SOH_EIT_EIT_304.jpg
	  * @param object $zoomLevel a number between 8-15, default is 10.
	  * @param object $x the range of tiles viewed, in pixels. 
	  * @param object $y the range of tiles viewed, in pixels.
	  * @param object $imageSize is 512 pixels. 
	  */	
	
	public function __construct($uri, $zoomLevel, $x, $y, $imageSize, $hcOffset, $quality) {
        parent::__construct($uri, $zoomLevel, $x, $y, $imageSize, false);

		$this->hcOffset = $hcOffset;
		$this->quality	= $quality;
		
		// The true/false parameter means whether to display the image or not when finished building it (used for debugging).
		$this->getImage(false);
	}

	/**
	 * Checks the cache to see if the image is already there, and uses it if it is. If not, it builds the image.
	 * @param object $display -- true or false
	 */	
	function getImage($display) {
		// JPG or PNG
		$format = $this->getImageFormat();

		// Filepath of image in cache directory
		$filepath = $this->getFilePath($format);

		// If it's already cached, just use the cached file
		if(Config::ENABLE_CACHE && file_exists($filepath)) {
			$this->image = $filepath;
			if($display)
				$this->display($filepath);
		}
		
		else {	
			// If it's not cached, build it and put it in the cache.
	        $this->image = $this->buildImage($filepath);	
				
	        // Display image
	        if ($display)
	            $this->display($filepath);
		}
	}
	
	/**
	 * @description Gets the filepath of where the image will go in the cache directory. 
	 * @description Filepaths are of the format /var/www/helioviewer/cache/movies/fileTimeStamp
	 * @return $filepath
	 * @param object $format is something like "jpg" or "png"
	 */	
	protected function getFilePath($format) {
        // Base filename
		$filename = substr($this->uri, 0, -4);

        // Date information
        $year  = substr($this->timestamp,0,4);
        $month = substr($this->timestamp,5,2);
        $day   = substr($this->timestamp,8,2);

        // Create necessary directories		
		$folders = array($year, $month, $day, $this->observatory, $this->instrument, $this->detector, $this->measurement);
		$filepath = $this->cacheDir;

		foreach($folders as $folder) {
			$filepath .= $folder . "/";
			if(!file_exists($filepath)) {
				mkdir($filepath);
				chmod($filepath, 0777);
			}			
		}

		// Convert coordinates to strings, padding 0's in the front of single digits
		$xStartStr = "+" . str_pad($this->xRange["start"], 2, '0', STR_PAD_LEFT);
		if (substr($this->xRange["start"],0,1) == "-")
			$xStartStr = "-" . str_pad(substr($this->xRange["start"], 1), 2, '0', STR_PAD_LEFT);

		$yStartStr = "+" . str_pad($this->yRange["start"], 2, '0', STR_PAD_LEFT);
		if (substr($this->yRange["start"],0,1) == "-")
			$yStartStr = "-" . str_pad(substr($this->yRange["start"], 1), 2, '0', STR_PAD_LEFT);
			
		$xEndStr = "+" . str_pad($this->xRange["size"], 2, '0', STR_PAD_LEFT);
		if (substr($this->xRange["size"],0,1) == "-")
			$xEndStr = "-" . str_pad(substr($this->xRange["size"], 1), 2, '0', STR_PAD_LEFT);

		$yEndStr = "+" . str_pad($this->yRange["size"], 2, '0', STR_PAD_LEFT);
		if (substr($this->yRange["size"],0,1) == "-")
			$yEndStr = "-" . str_pad(substr($this->yRange["size"], 1), 2, '0', STR_PAD_LEFT);	

		$filepath .= implode("_", array(substr($this->uri, 0, -4), $this->zoomLevel, $xStartStr, $xEndStr, $yStartStr, $yEndStr, $this->hcOffset["x"], $this->hcOffset["y"]));

		$filepath .= ".tif";

		return $filepath;
	}
	
	/**
	 * Returns the filepath of the image, which is in the cache once it is built.
	 */
	function getCacheFilepath() {
		return $this->image;
	}
}
?>