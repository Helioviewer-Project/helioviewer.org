<?php 
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Image_CompositeImage class definition
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @author   Jaclyn Beck <jabeck@nmu.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once 'CompositeImageLayer.php';

class Image_HelioviewerCompositeImageLayer extends Image_CompositeImageLayer
{	
	public function __construct($sourceJp2, $outputFile, $format, $metadata, $jp2Width, $jp2Height, $jp2Scale, $timestamp)
	{
		parent::__construct($metadata);
		
        $type = strtoupper($metadata->instrument()) . "Image";
        require_once HV_ROOT_DIR . "/api/src/Image/ImageType/$type.php";
        
        $classname = "Image_ImageType_" . $type;
        
        $this->_image = new $classname(
        	$metadata->width(), $metadata->height(), $timestamp, $sourceJp2, $metadata->roi(), $format, 
        	$jp2Width, $jp2Height, $jp2Scale, $metadata->imageScale(), $metadata->detector(), $metadata->measurement(),
        	$metadata->solarCenterOffsetX(), $metadata->solarCenterOffsetY(), $outputFile
        );
        
		$padding = $this->_computePadding();
		$this->_image->setPadding($padding);
		$this->setTimestamp($timestamp);
		
		$this->outputFile = $outputFile;
		if($this->_imageNotInCache())
			$this->_image->build();
	}
	
	public function setTimestamp($date) {
		$this->metaInfo->setTimestamp($date);
	}
	
	public function prepareAndBuildImage() {
		$colorTable = $this->_getColorTable();

        if ($colorTable) {
            $this->setColorTable(HV_ROOT_DIR . "/api/" . $colorTable);
        }

        if ($this->metaInfo->instrument() == "LASCO") {
            $this->setAlphaMask(true);
        }

		$this->buildImage();
	}
	
	public function getWaterMarkName() {		
		return $this->metaInfo->getWaterMarkName();
	}
	
	public function getWaterMarkTimestamp() {
		// Add extra spaces between date and time for readability.
		return str_replace("T", "   ", $this->metaInfo->timestamp()) . "\n";		
	}
	
    public function observatory() 
	{
		return $this->metaInfo->observatory();
	}
	
	public function instrument() 
	{
		return $this->metaInfo->instrument();
	}
	
	public function detector() 
	{
		return $this->metaInfo->detector();
	}
	
	public function measurement() 
	{
		return $this->metaInfo->measurement();
	}
	
	public function getObservatoryInformationString() 
	{
		return $this->metaInfo->getObservatoryInformationString();
	}
	
	public function timestamp() {
		return $this->metaInfo->timestamp();
	}
	
	private function _imageNotInCache() 
	{
		return !file_exists($this->outputFile);
	}
    
    /*
     * @TODO This is hard-coded. Fix it when I've figured out where the padding code went for a composite image.
     */
    private function _computePadding() {
    	return array(
    		"gravity" 	=> "center",
    		"width" 	=> 0,
    		"height" 	=> 0
    	);
    }
}
?>