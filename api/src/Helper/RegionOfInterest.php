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
define("INVALID_REGION_OF_INTEREST", "Requested region has a width or height equal to zero");
/**
 * A simple class to represent a rectangular region of interest on or around the Sun. Region of interest here refers
 * to a region of interest in space. This region may be larger than, smaller than, or the same size as a given
 * image. In order to determine how the region of interest in space translates to an image sub-region, the getPixelROI
 * method should be used.
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
     * @param int   $maxWidth   Maximum width allowed
     * @param int   $maxHeight  Maximum height allowed
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
        
        // Make sure width and height are non-zero
        if ($this->getWidth() <= 0 || $this->getHeight() <= 0) {
            throw new Exception(INVALID_REGION_OF_INTEREST, 1);
        }

        $this->_limitToMaximumDimensions();
    }
    
    /**
     * Gets the top coordinate (y1) of the region of interest
     * 
     * @return float ROI top coordinate
     */
    public function top()
    {
        return $this->_top;
    }

    /**
     * Gets the left coordinate (x1) of the region of interest
     * 
     * @return float ROI left coordinate
     */
    public function left()
    {
        return $this->_left;
    }
    
    /**
     * Gets the bottom coordinate (y2) of the region of interest
     * 
     * @return float ROI bottom coordinate
     */
    public function bottom()
    {
        return $this->_bottom;
    }

    /**
     * Gets the right coordinate (x2) of the region of interest
     * 
     * @return float ROI right coordinate
     */
    public function right()
    {
        return $this->_right;
    }
    
    /**
     * Gets the image scale associated with the region of interest in arcseconds/pixel
     * 
     * @return float Image scale for the ROI
     */
    public function imageScale()
    {
        return $this->_scale;
    }
    
    /**
     * Gets the region of interest width in arcseconds
     * 
     * @return float ROI width (arcseconds)
     */
    public function getWidth()
    {
        return $this->_right - $this->_left;
    }
    
    /**
     * Gets the region of interest height in arcseconds
     * 
     * @return float ROI height (arcseconds)
     */
    public function getHeight()
    {
        return $this->_bottom - $this->_top;
    }
    
    /**
     * Gets the region of interest width in pixels on the corresponding JP2 image
     * 
     * @return float ROI Width (pixels)
     */
    public function getPixelWidth()
    {
        return ($this->_right - $this->_left) / $this->_scale;
    }

    /**
     * Gets the region of interest height in pixels on the corresponding JP2 image
     * 
     * @return float ROI Height (pixels)
     */
    public function getPixelHeight()
    {
        return ($this->_bottom - $this->_top) / $this->_scale;
    }
    
    /**
     * Returns pixel values for the region of an image that overlaps with this region of interest
     * 
     * @param int   $imageWidth  The width of the image in pixels
     * @param int   $imageHeight The height of the image in pixels
     * @param float $imageScale  The scale of the image in arcseconds/pixel
     * @param float $offsetX     The offset of the center of the sun from the center of the image
     * @param float $offsetY     The offset of the center of the sun from the center of the image
     * 
     * @return array an array of pixel offsets
     */
    public function getImageSubRegion($imageWidth, $imageHeight, $imageScale, $offsetX, $offsetY)
    {
        $centerX = $imageWidth  / 2 + $offsetX;
        $centerY = $imageHeight / 2 + $offsetY;
        
        $top  = max($this->_top   /$imageScale + $centerY, 0);
        $left = max($this->_left  /$imageScale + $centerX, 0);
        $top  = $top  < 0.1 ? 0 : $top;
        $left = $left < 0.1 ? 0 : $left;
        
        return array(
            'top'    => $top,
            'left'   => $left,
            'bottom' => max(min($this->_bottom /$imageScale + $centerY, $imageHeight), 0),
            'right'  => max(min($this->_right  /$imageScale + $centerX, $imageWidth), 0)
        );
    }
    
    /**
     * Returns a polygon string representation of the region of interest of the form POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))
     * where each item between commas is an x & y coordinate for one of the corners of the roi.
     *
     * Example:
     * 
     *    p1-------p2
     *    |        |
     *    |        |
     *    p4-------p3
     * 
     * @return string Polygon representation of the region of interest
     */
    public function getPolygonString()
    {
       $p1 = $this->_left  . " " . $this->_top;
       $p2 = $this->_right . " " . $this->_top;
       $p3 = $this->_right . " " . $this->_bottom;
       $p4 = $this->_left  . " " . $this->_bottom;
       
       return sprintf("POLYGON((%s))", implode(array($p1, $p2, $p3, $p4, $p1), ","));
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