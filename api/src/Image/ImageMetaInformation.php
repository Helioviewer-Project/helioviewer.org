<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Image_ImageMetaInformation class definition
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Jaclyn Beck <jabeck@nmu.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */

class Image_ImageMetaInformation
{
	protected $_width;
	protected $_height;
	protected $_timestamp;
	protected $_imageScale;
	protected $_filePath;
	
	public function __construct($width, $height, $scale) 
	{
		$this->_width		= $width;
		$this->_height		= $height;
		$this->_imageScale 	= $scale;
	}
	
	public function setTimestamp($time) 
	{
		$this->_timestamp = $time;
	}
	
	public function setFilePath($filepath) 
	{
		$this->_filePath = $filepath;
	}
	
	public function width() 
	{
		return $this->_width;
	}
	
	public function height() 
	{
		return $this->_height;
	}
	
	public function timestamp() 
	{
		return $this->_timestamp();
	}
	
	public function imageScale() 
	{
		return $this->_imageScale;
	}
}
?>