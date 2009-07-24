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
	protected $imageSize;
	
	/**
	 * Constructor
	 * @param array $layerImages is an array of layer information strings in the format: "uri,xStart,xSize,yStart,ySize,opacity,opacityGrp"
	 * @param array $options is an array with true/false values for "EdgeEnhance" and "Sharpen"
	 * @param int $folderId is the unix timestamp of when the movie was requested, and is used to make a folder to store the movie in.
	 */
	public function __construct($zoomLevel, $options, $layerImages, $frameNum, $folderId, $imageSize) {
		$this->frameNum 	= $frameNum;
		$this->layerImages 	= $layerImages;
		$this->imageSize 	= $imageSize;
		
		$tmpDir = CONFIG::CACHE_DIR . "movies/";

		parent::__construct($zoomLevel, $options, $tmpDir);

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