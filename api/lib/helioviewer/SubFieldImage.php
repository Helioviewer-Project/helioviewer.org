<?php
/**
 * @class SubFieldImage - A simple class to keep track of a specific layer's associated parameters.
 */
require('JP2Image.php');

class SubFieldImage extends JP2Image {
	private $jp2Filepath;

	/**
	  * Constructor
	  * @param object $filepath a string representing the location of the jp2 image, including subfolders.
	  * @param object $uri the name of the jp2 image file, in the format 2003_01_31_SOH_EIT_EIT_304.jpg
	  * @param object $zoomLevel a number between 8-15, default is 10.
	  * @param object $x 0 or -1, the range of tiles viewed. 
	  * @param object $y 0 or -1, the range of tiles viewed.
	  * @param object $imageSize is 512 pixels. 
	  * @param correlate
	  */	
	
	public function __construct($filepath, $uri, $zoomLevel, $x, $y, $imageSize, $correlate = NULL) {
        $xRange = array("start" => $x, "end" => $x);
        $yRange = array("start" => $y, "end" => $y);

        parent::__construct($uri, $zoomLevel, $xRange, $yRange, $imageSize);

        $this->x = $x;
        $this->y = $y;
		$this->jp2Filepath = $filepath;
		$this->getImage(true);
	}
	
	function getImage($display) {
		// JPG or PNG
		$format = $this->getImageFormat();
		
		// Filepath of image in cache directory
		$filepath = $this->getFilePath($format);
//		echo "Checking cache...<br />";
		// If it's already cached, just display it
		if(Config::ENABLE_CACHE && $display && file_exists($filepath)) {
			$this->image = $filepath;
//			echo "File exists";
//			$this->display($filepath);
		}
		
		else {	
//			echo "Building image with filepath " . $filepath . "...<br />";	
			// If it's not cached, build it and put it in the cache.
	        $this->image = $this->buildImage($filepath);	
//	        echo "Image: " . $this->image . " (from SubFieldImage->getImage())<br />";
	        // Display image
//	        if ($display)
//	            $this->display($filepath);
		}
	}
	
	/**
	 * @description Gets the filepath of where the image will go in the cache directory. 
	 * @description Filepaths are of the format /var/www/helioviewer/cache/movies/year/month/day/obs/inst/det/meas/image_uri
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
		$folders = array("movies", $year, $month, $day, $this->observatory, $this->instrument, $this->detector, $this->measurement);
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

		$filepath .= implode("_", array(substr($this->uri, 0, -4), $this->zoomLevel, $xStartStr, $xEndStr, $yStartStr, $yEndStr));

		$filepath .= ".tif";
//		 echo $filepath . " From SubFieldImage->getFilepath()  <br />";
		return $filepath;
	}
	
	function getCacheFilepath() {
		return $this->image;
	}
}
?>