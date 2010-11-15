<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Helper_RegionOfInterest Class Definition
 * 
 * PHP version 5
 * 
 * @category Helper
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */

/**
 * A simple class to represent a rectangular region of interest on or around the Sun
 * 
 * @category Helper
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 * @see      http://www.lmsal.com/helio-informatics/hpkb/
 */
class Helper_RegionOfInterest
{
    private $_top;
    private $_left;
    private $_bottom;
    private $_right;
    private $_scale;
    
    /**
     * Creates a new RegionOfInterest instance
     * 
     * @param float $x1         Left coordinate in arc-seconds
     * @param float $x2         Right coordinate in arc-seconds
     * @param float $y1         Top coordinate in arc-seconds
     * @param float $y2         Bottom coordinate in arc-seconds
     * @param float $imageScale Image scale in arc-seconds/pixel
     *  
     * @return void
     */
    public function __construct($x1, $x2, $y1, $y2, $imageScale, $maxWidth=1920, $maxHeight=1080)
    {
        $this->_top    = $y1;
        $this->_left   = $x1;
        $this->_bottom = $y2;
        $this->_right  = $x2;
        $this->_scale  = $imageScale;
        
        // Maximum dimensions allowed for request
        $this->_maxWidth  = $maxWidth;
        $this->_maxHeight = $maxHeight;

        $this->_limitToMaximumDimensions();
    }
    
    public function top() {
        return $this->_top;
    }
    
    public function left() {
        return $this->_left;
    }
    
    public function bottom() {
        return $this->_bottom;
    }
    
    public function right() {
        return $this->_right;
    }
    
    public function imageScale() {
        return $this->_scale;
    }
    
    public function getWidth() {
        return $this->_right - $this->_left;
    }
    
    public function getHeight() {
        return $this->_bottom - $this->_top;
    }
    
    public function getPixelWidth() {
        return ($this->_right - $this->_left) / $this->_scale;
    }

    public function getPixelHeight() {
        return ($this->_bottom - $this->_top) / $this->_scale;
    }
    
    /**
     * Adjusts imageScale if neccessary so that entire region of interest fits within a maximum width and height
     * 
     * @return void
     */
    private function _limitToMaximumDimensions()
    {
        $width  = $this->getPixelWidth();
        $height = $this->getPixelHeight();

        if ($width > $this->_maxWidth || $height > $this->_maxHeight) {
            $scaleFactor = min($this->_maxWidth / $width, $this->_maxHeight / $height);
            $this->_scale /= $scaleFactor;
        }
    }
}