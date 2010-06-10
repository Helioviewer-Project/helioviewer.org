<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Image_HelioviewerImageMetaInformation class definition
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Jaclyn Beck <jabeck@nmu.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */

require_once 'ImageMetaInformation.php';

class Image_HelioviewerImageMetaInformation extends Image_ImageMetaInformation
{
	protected $_observatory;
	protected $_instrument;
	protected $_detector;
	protected $_measurement;
	protected $_roi;
	protected $_solarCenterOffset;
	protected $_timestamp;
	
	// Timestamps are added later as these are unknown until after metainfo creation in some cases.
	public function __construct($width, $height, $scale, $obs, $inst, $det, $meas, $roi, $offsetX, $offsetY) 
	{
		parent::__construct($width, $height, $scale);
		$this->_observatory 	= $obs;
		$this->_instrument 		= $inst;
		$this->_detector 		= $det;
		$this->_measurement 	= $meas;
		$this->_roi 			= $roi;
		$this->_solarCenterOffset = array('x' => $offsetX, 'y' => $offsetY);
	}

	public function timestamp() {
		return $this->_timestamp;
	}
	public function getObservatoryInformationString() 
	{
		return implode("_", array($this->_observatory, $this->_instrument, $this->_detector, $this->_measurement));
	}
	
	public function observatory() 
	{
		return $this->_observatory;
	}
	
	public function instrument() 
	{
		return $this->_instrument;
	}
	
	public function detector() 
	{
		return $this->_detector;
	}
	
	public function measurement() 
	{
		return $this->_measurement;
	}
	
	public function ROI() 
	{
		return $this->_roi;
	}
	
	public function solarCenterOffsetX()
	{
		return $this->_solarCenterOffset['x'];
	}
	
	public function solarCenterOffsetY()
	{
		return $this->_solarCenterOffset['y'];
	}
	
	public function getWaterMarkName()
	{
		// Decide what to include in the name. EIT and MDI only need detector and measurement
		if ($this->_instrument === $this->_detector) {
			$name = "$this->_detector $this->_measurement\n";
		} else {
			// LASCO needs instrument and detector.
			$name = "$this->_instrument $this->_detector\n";
		}
		return $name;
	}
	
}
?>