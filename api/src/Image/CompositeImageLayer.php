<?php 

//require_once 'SubFieldImage.php';

abstract class Image_CompositeImageLayer //extends Image_SubFieldImage
{
	protected $metaInfo;
	protected $_cacheDir = HV_CACHE_DIR;
	
	public function __construct($metadata)
	{
		$this->metaInfo = $metadata;
		//parent::__construct($sourceJp2, $outputFile, $metadata->ROI(), $format, $jp2Width, $jp2Height, $jp2Scale, $this->metaInfo->imageScale());
	}
	
	public function getFilePathString() 
	{
		return $this->outputFile;
	}
	
	public function getImageDimensions()
	{
		return $this->_image->_getImageDimensions($this->getFilePathString());
	}
	
	public function setNewFilePath($filePath) 
	{
		$this->outputFile = $filePath;
	}
}
?>