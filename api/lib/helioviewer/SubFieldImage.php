<?php
/**
 * @class SubFieldImage - Obtains an extracted region from a jp2 image and saves it as a .tif
 */
require('JP2Image.php');

class SubFieldImage extends JP2Image {
	private $jp2Filepath;
	protected $hcOffset;

	/**
	  * Constructor
	  * @param object $filepath a string representing the location of the jp2 image, including subfolders.
	  * @param object $uri the name of the jp2 image file, in the format 2003_01_31_SOH_EIT_EIT_304.jpg
	  * @param object $zoomLevel a number between 8-15, default is 10.
	  * @param object $x the range of tiles viewed, in pixels. 
	  * @param object $y the range of tiles viewed, in pixels.
	  * @param object $imageSize is 512 pixels. 
	  */	
	
	public function __construct($uri, $zoomLevel, $x, $y, $imageSize, $hcOffset) {
        parent::__construct($uri, $zoomLevel, $x, $y, $imageSize, false);
				
		$this->hcOffset = $hcOffset;
		
		// The true/false parameter means whether to display the image or not when finished building it (used for debugging).
		$this->_getImage(false);
	}
	
	private function _getImage($display) {
		// JPG or PNG
		$format = $this->getImageFormat();

		// Filepath of image in cache directory
		$filepath = $this->_getFilePath($format);

		// If it's already cached, just use the cached file
		if(Config::ENABLE_CACHE && file_exists($filepath)) {
			$this->image = $filepath;
			if($display)
				$this->display($filepath);
		}
		
		else {	
			// If it's not cached, build it and put it in the cache.
			// The true/false parameter means whether the image is a tile or not (tiles are padded, subfieldimages are only padded with -gravity Center for now).
	        $this->image = $this->buildImage($filepath);	
				
	        // Display image
	        if ($display)
	            $this->display($filepath);
		}
	}
	
	/**
	 * @description Gets the filepath of where the image will go in the cache directory. 
	 * @description Filepaths are of the format /var/www/helioviewer/cache/movies/year/month/day/obs/inst/det/meas/image_uri
	 * @return $filepath
	 * @param object $format is something like "jpg" or "png"
	 */	
	private function _getFilePath($format) {
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

		// Convert coordinates to strings
		$xStartStr = "+" . str_pad($this->xRange["start"], 2, '0', STR_PAD_LEFT);
		if (substr($this->xRange["start"],0,1) == "-")
			$xStartStr = "-" . str_pad(substr($this->xRange["start"], 1), 2, '0', STR_PAD_LEFT);

		$yStartStr = "+" . str_pad($this->yRange["start"], 2, '0', STR_PAD_LEFT);
		if (substr($this->yRange["start"],0,1) == "-")
			$yStartStr = "-" . str_pad(substr($this->yRange["start"], 1), 2, '0', STR_PAD_LEFT);
			
		$xEndStr = "+" . str_pad($this->xRange["end"], 2, '0', STR_PAD_LEFT);
		if (substr($this->xRange["end"],0,1) == "-")
			$xEndStr = "-" . str_pad(substr($this->xRange["end"], 1), 2, '0', STR_PAD_LEFT);

		$yEndStr = "+" . str_pad($this->yRange["end"], 2, '0', STR_PAD_LEFT);
		if (substr($this->yRange["end"],0,1) == "-")
			$yEndStr = "-" . str_pad(substr($this->yRange["end"], 1), 2, '0', STR_PAD_LEFT);	

		$filepath .= implode("_", array(substr($this->uri, 0, -4), $this->zoomLevel, $xStartStr, $xEndStr, $yStartStr, $yEndStr, $this->hcOffset["x"], $this->hcOffset["y"]));

		$filepath .= ".tif";

		return $filepath;
	}
	
	function getCacheFilepath() {
		return $this->image;
	}
}
?>