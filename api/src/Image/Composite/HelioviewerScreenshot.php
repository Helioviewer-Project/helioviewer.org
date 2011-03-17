<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Image_Composite_HelioviewerScreenshot class definition
 * 
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once 'src/Image/Composite/HelioviewerCompositeImage.php';

/**
 * Image_Composite_HelioviewerScreenshot class definition
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Image_Composite_HelioviewerScreenshot extends Image_Composite_HelioviewerCompositeImage
{
	/**
	 * Creates a new screenshot
	 */
    public function __construct($layers, $obsDate, $roi, $options)
    {
    	parent::__construct($layers, $obsDate, $roi, $options);
    	
        $this->_id = $this->_getScreenshotId();

    	$filepath = $this->_buildFilepath();
    	
    	var_dump($filepath);
    	die();

    	//$this->build($filepath);    	
    	//TODO: Either include a status field in db, or remove entry if build fails?
    }
    
    /**
     * Adds the screenshot to the database and returns its assigned identifier
     * 
     * @return int Screenshot id
     */
    private function _getScreenshotId()
    {
    	return $this->db->insertScreenshot(
            $this->date,
            $this->scale,
            $this->roi->getPolygonString(),
            $this->watermark,
            $this->layers->serialize(),
            $this->layers->getBitMask()
        );
    }
    
    /**
     * Computes a filename to use for the screenshot
     * 
     * @return string Filename
     */
    private function _buildFilepath ()
    {
    	date_default_timezone_set('UTC');

    	return sprintf("%s/screenshots/%s/%s/%s_%s.jpg", 
    	   HV_CACHE_DIR,
    	   date("Y/m/d"),
    	   $this->_id,
    	   substr(str_replace(array(":", "-", "T", "Z"), "_", $this->date), 0, -5),
    	   $this->layers->toString()    	   
    	);
    }
}