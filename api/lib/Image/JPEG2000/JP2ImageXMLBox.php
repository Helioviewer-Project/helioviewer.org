<?php
/**
 * @package JP2ImageXMLBox
 * @author Keith Hughitt <keith.hughitt@nasa.gov>
 */
class Image_JPEG2000_JP2ImageXMLBox {
    private $file;
    private $xml;

    /**
     * @param string $file JPEG 2000 Image location
     */
    public function __construct($file) {
    	$this->file = $file;
    	$this->getXMLBox("fits");
    }

    /**
     * Given a filename and the name of the root node, extracts
     * the XML header box from a JP2 image
     * @param object $filename
     * @param object $root Name of the XMLBox root node (if known)
     */
    public function getXMLBox ($root) {
        if (!file_exists($this->file)) {
            $msg = "[PHP][" . date("Y/m/d H:i:s") . "]\n\t Unable to extract XMLbox for " . $this->file . ": file does not exist!\n\n";
            file_put_contents(HV_ERROR_LOG, $msg, FILE_APPEND);
            exit();
        }
        
        $fp = fopen($this->file, "rb");
        
        $xml  = "";

        while (!feof($fp)) {
            $line = fgets($fp);
            $xml .= $line;
            if (strpos($line, "</$root>") !== False)
                break;        }
        $xml = substr($xml, strpos($xml, "<$root>"));
        
        fclose($fp);

        $this->xml = new DOMDocument();
        $this->xml->loadXML($xml);
    }
    
    /**
     * Returns the dimensions for a given image
     * @return 
     * @param object $dom
     */
    public function getImageDimensions() {
        try {
            $width  = $this->getElementValue("NAXIS1");
            $height = $this->getElementValue("NAXIS2");
        } catch (Exception $e) {
            echo 'Unable to locate image dimensions in header tags!';
        }
        return array($width, $height);
    }
    
    /**
     * Returns the plate scale for a given image
     * @return 
     * @param object $dom
     */
    public function getImagePlateScale() {
        try {
            $scale = $this->getElementValue("CDELT1");
        } catch (Exception $e) {
            echo 'Unable to locate image dimensions in header tags!';
        }
        return $scale;        
    }
    
    /**
     * Returns the coordinates for the image center
     * @param object $dom
     * @return 
     */
    public function getImageCenter() {
        try {
            $x = $this->getElementValue("CRPIX1");
            $y = $this->getElementValue("CRPIX2");
        } catch (Exception $e) {
            echo 'Unable to locate image center in header tags!';
        }
        return array($x, $y);
    }
    
    /**
     * Retrieves the value of a unique dom-node element or returns false if element is not found, or more
     * than one is found.
     * @param object $dom
     * @param object $name
     */  
    private function getElementValue($name) {
        $element = $this->xml->getElementsByTagName($name);
        
        if ($element)
            return $element->item(0)->childNodes->item(0)->nodeValue;
        else
            throw new Exception('Element not found');
    }    
}