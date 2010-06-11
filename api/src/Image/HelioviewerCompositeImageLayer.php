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
	protected $layeringOrder;
	protected $opacity;
	
	public function __construct(
		$sourceJp2, $outputFile, $format, $width, $height, $imageScale, $roi, $instrument, $detector, 
		$measurement, $layeringOrder, $offsetX, $offsetY, $opacity, $jp2Width, $jp2Height, $jp2Scale, $timestamp
	)
	{
		$this->layeringOrder = $layeringOrder;
		$this->opacity		 = $opacity;
		
        $type = strtoupper($instrument) . "Image";
        require_once HV_ROOT_DIR . "/api/src/Image/ImageType/$type.php";
        
        $classname = "Image_ImageType_" . $type;
        
        $image = new $classname(
        	$width, $height, $timestamp, $sourceJp2, $roi, $format, $jp2Width, $jp2Height,
        	$jp2Scale, $imageScale, $detector, $measurement, $offsetX, $offsetY, $outputFile
        );
        
		$padding = $this->_computePadding();
		$image->setPadding($padding);
		
		parent::__construct($timestamp, $image, $outputFile);

		if(HV_DISABLE_CACHE || $this->_imageNotInCache())
			$this->image->build();
	}
	
	public function getWaterMarkName() {
		return $this->image->getWaterMarkName();
	}
	
	public function getWaterMarkTimestamp() {
		// Add extra spaces between date and time for readability.
		return str_replace("T", "   ", $this->timestamp) . "\n";		
	}

	public function layeringOrder() 
	{
		return $this->layeringOrder;
	}
	
	public function opacity()
	{
		return $this->opacity;
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