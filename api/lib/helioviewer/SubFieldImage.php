<?php
/**
 * @class SubFieldImage - A simple class to keep track of a specific layer's associated parameters.
 */
require('JP2Image.php');

class SubFieldImage extends JP2Image {
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

		// If it's already cached, just display it
		if(Config::ENABLE_CACHE && $display) {
			if(file_exists($filepath)) {
				$this->display($filepath);
				exit();
			}
		}
		
		// If it's not cached, build it and put it in the cache.
        $this->image = $this->buildImage($filepath);	
        
        // Display image
        if ($display)
            $this->display($filepath);
	}
	
	/**
	 * @description Gets the filepath of where the image will go in the cache directory. 
	 * @description Filepaths are of the format /var/www/helioviewer/cache/movies/year/month/day/obs/inst/det/meas/image_uri
	 * @return $filepath
	 * @param object $format
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

		$filepath .= implode("_", array(substr($this->uri, 0, -4), $this->zoomLevel, $xStartStr, $xEndStr, $yStartStr, $yEndStr, ".tif"));

		return $filepath;
	}
}
?>