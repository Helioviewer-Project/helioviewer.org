<?php
/**
 * @author Jaclyn Beck
 * @description The FrameLayer class is used when generating composite images, or 'frames', for movies.
 */

require('CompositeImage.php');

class MovieFrame extends CompositeImage {
	protected $frameNum;
	protected $layerImages;
	protected $cacheFileDir;
	/*
	 * Constructor
	 */
	public function __construct($zoomLevel, $options, $layerImages, $frameNum, $folderId, $hcOffset) {
		$this->frameNum = $frameNum;
		$this->layerImages = $layerImages;
		
		$tmpDir = CONFIG::CACHE_DIR . "movies/";

		parent::__construct($zoomLevel, $options, $tmpDir, $hcOffset);

		// Directory to store all of the final frame images before they are compiled into a video	
		$this->cacheFileDir = $tmpDir . $folderId . "/";
		
		if(!file_exists($this->cacheFileDir)) {
			mkdir($this->cacheFileDir);
			chmod($this->cacheFileDir, 0777);
		}
		
		$this->compileImages();
	}
}

?>