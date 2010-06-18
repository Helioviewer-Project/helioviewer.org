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
    private $_width;
    private $_height;
    private $_timestamp;
    private $_imageScale;
    private $_filePath;
    
    /**
     * Constructor
     * 
     * @param int   $width  Image width
     * @param int   $height Image height
     * @param float $scale  Image scale
     */
    public function __construct($width, $height, $scale) 
    {
        $this->_width		= $width;
        $this->_height		= $height;
        $this->_imageScale 	= $scale;
    }
    
    /**
     * Sets the timestamp of the image
     * 
     * @param date $time The timestamp
     * 
     * @return void
     */
    public function setTimestamp($time) 
    {
        $this->_timestamp = $time;
    }

    /**
     * Sets the filepath of the image
     * 
     * @param string $filepath Filepath
     * 
     * @return void
     */
    public function setFilePath($filepath) 
    {
        $this->_filePath = $filepath;
    }

    /**
     * Gets the width
     * 
     * @return int width 
     */    
    public function width() 
    {
        return $this->_width;
    }

    /**
     * Gets the height
     * 
     * @return int height 
     */      
    public function height() 
    {
        return $this->_height;
    }

    /**
     * Gets the timestamp
     * 
     * @return date timestamp
     */      
    public function timestamp() 
    {
        return $this->_timestamp();
    }

    /**
     * Gets the image scale
     * 
     * @return float image scale
     */      
    public function imageScale() 
    {
        return $this->_imageScale;
    }
}
?>