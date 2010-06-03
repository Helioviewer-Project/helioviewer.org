<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Image_JPEG2000_JP2ImageXMLBox class definition
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
/**
 * JPEG 2000 Image XML Box parser class
 *
 * @category Image
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Image_JPEG2000_JP2ImageXMLBox
{
    private $_file;
    private $_xml;

    /**
     * Create an instance of Image_JPEG2000_JP2Image_XMLBox
     *
     * @param string $file JPEG 2000 Image location
     */
    public function __construct($file, $root = "fits")
    {
        $this->_file = $file;
        $this->getXMLBox($root);
    }

    /**
     * Given a filename and the name of the root node, extracts
     * the XML header box from a JP2 image
     *
     * @param string $root Name of the XMLBox root node (if known)
     *
     * @return void
     */
    public function getXMLBox ($root)
    {
        if (!file_exists($this->_file)) {
            $msg = "Unable to extract XMLbox for {$this->_file}. File does not exist!";
            logErrorMsg($msg, true);
            throw new Exception("Unable to find file: {$this->_file}.");
        }

        $fp = fopen($this->_file, "rb");

        $xml  = "";

        while (!feof($fp)) {
            $line = fgets($fp);
            $xml .= $line;
            if (strpos($line, "</$root>") !== false) {
                break;
            }
        }
        $xml = substr($xml, strpos($xml, "<$root>"));

        fclose($fp);
        
        // TEMP Work-around 2010/04/12 for AIA Invalid XML
        $xml = str_replace("&", "&amp;", $xml);
        
        $this->_xmlString = '<?xml version="1.0" encoding="utf-8"?>' . "\n" . $xml;

        $this->_xml = new DOMDocument();
        $this->_xml->loadXML($this->_xmlString);
    }
    
    public function printXMLBox () {
    	header('Content-type: text/xml');
    	echo $this->_xmlString;
    }

    /**
     * Returns the dimensions for a given image
     *
     * @return array JP2 width and height
     */
    public function getImageDimensions()
    {
        try {
            $width  = $this->_getElementValue("NAXIS1");
            $height = $this->_getElementValue("NAXIS2");
        } catch (Exception $e) {
            echo 'Unable to locate image dimensions in header tags!';
        }
        return array($width, $height);
    }

    /**
     * Returns the plate scale for a given image
     *
     * @return string JP2 image scale
     */
    public function getImagePlateScale()
    {
        try {
            $scale = $this->_getElementValue("CDELT1");
        } catch (Exception $e) {
            // TEMP Work-around 2010/04/12: Include support for AIA 171
            $scale =  0.6075; // ESTIMATE        
            //echo 'Unable to locate image scale in header tags!';            
        }
        return $scale;
    }

    /**
     * Returns the coordinates for the center of the sun in the image.
     * 
     * NOTE: The values for CRPIX1 and CRPIX2 reflect the x and y coordinates with the origin
     * at the bottom-left corner of the image, not the top-left corner.
     *
     * @return array Pixel coordinates of the solar center
     */
    public function getSunCenter()
    {
        try {
            $x = $this->_getElementValue("CRPIX1");
            $y = $this->_getElementValue("CRPIX2");
        } catch (Exception $e) {
            // TEMP Work-around 2010/04/12: Include support for AIA 171
            $x = 2048;
            $y = 2048;
            //echo 'Unable to locate sun center center in header tags!';
        }
        return array($x, $y);
    }
    
    /**
     * Returns true if the image was rotated 180 degrees
     * 
     * Note that while the image data may have been rotated to make it easier to line
     * up different data sources, the meta-information regarding the sun center, etc. are
     * not adjusted, and thus must be manually adjusted to account for any rotation.
     *
     * @return boolean True if the image has been rotated
     */
    public function getImageRotationStatus()
    {
        try {
            $rotation = $this->_getElementValue("CROTA1");
            if (abs($rotation) > 170) {
                return true;
            }
        } catch (Exception $e) {
            // AIA, EIT, and MDI do their own rotation
            return false;
        }        
    }

    /**
     * Retrieves the value of a unique dom-node element or returns false if element is not found, or more
     * than one is found.
     *
     * @param string $name The name of the XML element whose value should be return
     *
     * @return string the value for the specified element
     */
    private function _getElementValue($name)
    {
        $element = $this->_xml->getElementsByTagName($name);

        if ($element) {
            if (!is_null($element->item(0))) {
                return $element->item(0)->childNodes->item(0)->nodeValue;
            }
        }
        throw new Exception('Element not found');
    }
}