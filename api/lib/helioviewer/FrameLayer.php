<?php
/**
 * @author Jaclyn Beck
 * @description The FrameLayer class is used when generating composite images, or 'frames', for movies.
 */

require('CompositeImage.php');

class FrameLayer extends CompositeImage {
	protected $frameNum;
	protected $layerImages;
	/*
	 * Constructor
	 */
	public function __construct($zoomLevel, $options, $layerImages, $frameNum) {
		$this->frameNum = $frameNum;
		$this->layerImages = $layerImages;
		
		$tmpDir = CONFIG::CACHE_DIR . "movies/";

		parent::__construct($zoomLevel, $options, $tmpDir);
		
		$this->compileImages();
	}
}

?>