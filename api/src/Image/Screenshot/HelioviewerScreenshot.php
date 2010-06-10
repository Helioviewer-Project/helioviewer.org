<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Image_HelioviewerScreenshot class definition
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Jaclyn Beck <jabeck@nmu.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once HV_ROOT_DIR . '/api/src/Image/Composite/HelioviewerCompositeImage.php';
require_once HV_ROOT_DIR . '/api/src/Image/HelioviewerCompositeImageLayer.php';

class Image_Screenshot_HelioviewerScreenshot extends Image_Composite_HelioviewerCompositeImage
{
    protected $outputFile;
    protected $layerImages;
    protected $timestamp;
    protected $imageSize;

    /**
     * Create an instance of Image_Screenshot
     *
     * @param int    $timestamp  The unix timestamp of the observation date in the viewport
     * @param array  $options    An array containing true/false values for "EdgeEnhance" and "Sharpen"
     * @param string $filename   Location where the screenshot will be stored
     * @param int    $quality    Screenshot compression quality
     */
    public function __construct($timestamp, $meta, $options, $filename, $quality)
    {
        $this->timestamp     = $timestamp;
        $this->quality       = $quality;

        $tmpDir = HV_CACHE_DIR . "/screenshots";
        $this->extractedDir = HV_CACHE_DIR . "/extracted_images";
		$this->_makeDirectory($this->extractedDir);

        parent::__construct($meta, $options, $tmpDir, $filename);
    }

    /**
     * Builds the screenshot.
     *
     * @param {Array} layerMetaInfoArray -- An array of HelioviewerImageMetaInformation objects, one for each layer
     *
     * @return void
     */
    public function buildImages($layerMetaInfoArray)
    {
        $this->layerImages = array();

        // Find the closest image for each layer, add the layer information string to it
        foreach ($layerMetaInfoArray as $meta) {
            $closestImage = $this->_getClosestImage($meta);
            
           	$pathToFile 	= $this->_getJP2Path($closestImage);
           	$tmpOutputFile 	= $this->_getTmpOutputPath($closestImage);
           	
            $image = new Image_HelioviewerCompositeImageLayer(
            	$pathToFile, $tmpOutputFile, 'png', $meta, 
            	$closestImage['width'], $closestImage['height'], $closestImage['scale'], $closestImage['date']
            );
            array_push($this->layerImages, $image);
        }

        $this->compileImages();
    }
    
    private function _getJP2Path($closestImage) {
    	return HV_JP2_DIR . $closestImage['filepath'] . "/" . $closestImage['filename'];
    }
    
    private function _getTmpOutputPath($closestImage) {
    	return $this->extractedDir . "/" . substr($closestImage['filename'], 0, -4) . "_" . $this->metaInfo->width() . "x" . $this->metaInfo->height() . ".png";
    }

    /**
     * Queries the database to find the closest image to a given timestamp.
     *
     * @param HelioviewerImageMetaInformation meta
     *
     * @return array closestImg, an array with the image's id, filepath, filename, date
     */
    private function _getClosestImage($meta)
    {
        include_once HV_ROOT_DIR . '/api/src/Database/ImgIndex.php';
        $imgIndex = new Database_ImgIndex();
        $time = $this->timestamp;

        $closestImg = $imgIndex->getClosestImage($time, $imgIndex->getSourceId($meta->observatory(), $meta->instrument(), $meta->detector(), $meta->measurement()));
        return $closestImg;
    }
}
?>