<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Image_Screenshot_HelioviewerScreenshotBuilder class definition
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once 'HelioviewerScreenshot.php';
require_once 'src/Helper/LayerParser.php';
/**
 * Image_Screenshot_HelioviewerScreenshotBuilder class definition
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Image_Screenshot_HelioviewerScreenshotBuilder
{
    protected $maxWidth  = 1920;
    protected $maxHeight = 1080;
    
    /**
     * Does not require any parameters or setup.
     */
    public function __construct()
    {
    }
    
    /**
     * Prepares the parameters passed in from the api call and creates a screenshot from them.
     * 
     * @param 
     *                              
     * @return string the screenshot
     */
    public function takeScreenshot($layers, $obsDate, $roi, $options)
    {
        // Any settings specified in $this->_params will override $defaults
        $defaults = array(
            'closestImages' => array(),
            'outputDir'   => HV_CACHE_DIR . "/screenshots",
            'format'      => 'png',
            'display'	  => true,
            'watermarkOn' => true,
            'filename'    => false,
            'compress'    => false,
            'interlace'   => true,
            'quality'     => 20
        );
        
        $options = array_replace($defaults, $options);
        
        $pixelWidth  = $roi->getPixelWidth();
        $pixelHeight = $roi->getPixelHeight();
        
        // Image scale (arcseconds/pixel)
        $imageScale  = $roi->imageScale();
        
        // Limit to maximum dimensions
        if ($pixelWidth > $this->maxWidth || $pixelHeight > $this->maxHeight) {
            $scaleFactor = min($this->maxWidth / $pixelWidth, $this->maxHeight / $pixelHeight);
            $pixelWidth *= $scaleFactor;
            $pixelHeight*= $scaleFactor;
            $imageScale /= $scaleFactor;
        }

        // Screenshot meta information
        $layerArray = $this->_createMetaInformation($layers, $imageScale, $pixelWidth, $pixelHeight, $options['closestImages']);

        // Instantiate a screenshot
        $screenshot = new Image_Screenshot_HelioviewerScreenshot(
            $obsDate, $pixelWidth, $pixelHeight, $imageScale, $options['filename'], $options['quality'],
            $options['watermarkOn'], $roi, $options['outputDir'], $options['compress']
        );

        $screenshot->buildImages($layerArray);
        
        $composite = $screenshot->getComposite();
        
        // Check to see if screenshot was successfully created
        if (!file_exists($composite)) {
            throw new Exception('The requested screenshot is either unavailable or does not exist.');
        }
        
        return $composite;
    }
    
    /**
     * Takes in a layer string and formats it into an appropriate filename by removing square brackets
     * and extra information like visibility and opacity.
     * 
     * @param string $layers a string of layers in the format [layer],[layer]...
     * 
     * @return string
     */
    protected function buildFilename($layers)
    {
        $filename = "";
        foreach ($layers as $layer) {
            $filename .= "__" . extractLayerName($layer);
        }
        return $filename;
    }
    
    /**
     * _createMetaInformation
     * Takes the string representation of a layer from the javascript creates meta information for
     * each layer. 
     *
     * @param {Array} $layers        a string of layers. use functions in LayerParser.php to extract
     *                               relevant information.
     * @param {float} $imageScale    Scale of the image
     * @param {int}   $width         desired width of the output image
     * @param {int}   $height        desired height of the output image
     * @param array   $closestImages An array of the closest images to the timestamp for this
     *                               screenshot, associated by sourceId as keys.
     *
     * @return {Array} $metaArray -- The array containing one meta information 
     * object per layer
     */
    private function _createMetaInformation($layers, $imageScale, $width, $height, $closestImages)
    {
        $layerStrings = getLayerArrayFromString($layers);
        $metaArray    = array();
        
        if (sizeOf($layerStrings) < 1) {
            throw new Exception('Invalid layer choices! You must specify at least 1 layer.');
        }
        
        foreach ($layerStrings as $layer) {
            $layerArray = singleLayerToArray($layer);
            $sourceId   = getSourceIdFromLayerArray($layerArray);
            $opacity    = array_pop($layerArray);
            $visible    = array_pop($layerArray);

            $image = (sizeOf($closestImages) > 0? $closestImages[$sourceId] : false);

            if ($visible !== 0 && $visible !== "0") {
                $layerInfoArray = array(
                    'sourceId' 	   => $sourceId,
                    'width' 	   => $width,
                    'height'	   => $height,
                    'imageScale'   => $imageScale,
                    'opacity'	   => $opacity,
                    'closestImage' => $image
                );
                array_push($metaArray, $layerInfoArray);
            }
        }

        return $metaArray;
    }
}
?>