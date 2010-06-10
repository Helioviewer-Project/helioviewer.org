<?php 

//require_once 'SubFieldImage.php';

abstract class Image_CompositeImageLayer //extends Image_SubFieldImage
{
	protected $outputFile;
	protected $timestamp;
	protected $image;
	protected $_cacheDir = HV_CACHE_DIR;
	
	public function __construct($timestamp, $image, $outputFile)
	{
		$this->timestamp 	= $timestamp;
		$this->outputFile 	= $outputFile;
		$this->image		= $image;
	}
	
	public function getFilePathString() 
	{
		return $this->outputFile;
	}
	
	public function getImageDimensions()
	{
		return $this->image->_getImageDimensions($this->getFilePathString());
	}
	
	public function setNewFilePath($filePath) 
	{
		$this->outputFile = $filePath;
	}
	
	public function timestamp() 
	{
		return $this->timestamp;
	}
}
?>