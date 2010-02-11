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
    public function __construct($file)
    {
        $this->_file = $file;
        $this->getXMLBox("fits");
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
            $msg = "[PHP][" . date("Y/m/d H:i:s") . "]\n\t Unable to extract XMLbox for " . $this->_file . ": file does not exist!\n\n";
            file_put_contents(HV_ERROR_LOG, $msg, FILE_APPEND);
            exit();
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

        $this->_xml = new DOMDocument();
        $this->_xml->loadXML($xml);
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
            echo 'Unable to locate image dimensions in header tags!';
        }
        return $scale;
    }

    /**
     * Returns the coordinates for the center of the sun in the image.
     *
     * @return array Pixel coordinates of the solar center
     */
    public function getSunCenter()
    {
        try {
            $x = $this->_getElementValue("CRPIX1");
            $y = $this->_getElementValue("CRPIX2");
        } catch (Exception $e) {
            echo 'Unable to locate image center in header tags!';
        }
        return array($x, $y);
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
            return $element->item(0)->childNodes->item(0)->nodeValue;
        } else {
            throw new Exception('Element not found');
        }
    }
}