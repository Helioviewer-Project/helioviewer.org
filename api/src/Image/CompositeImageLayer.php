<?php 

//require_once 'SubFieldImage.php';

abstract class Image_CompositeImageLayer //extends Image_SubFieldImage
{
	protected $metaInfo;
	protected $timestamp;
	protected $_cacheDir = HV_CACHE_DIR;
	
	public function __construct($timestamp)
	{
		$this->timestamp = $timestamp;
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
	
	public function timestamp() 
	{
		return $this->timestamp;
	}
}
?>