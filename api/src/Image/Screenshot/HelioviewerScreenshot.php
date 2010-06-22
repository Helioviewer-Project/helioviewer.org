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
class Image_Screenshot_HelioviewerScreenshot extends Image_Composite_HelioviewerCompositeImage
{
    protected $outputFile;
    protected $layerImages;
    protected $timestamp;
    protected $imageSize;
    protected $offsetLeft;
    protected $offsetRight;
    protected $offsetBottom;
    protected $offsetTop;

    /**
     * Create an instance of Image_Screenshot
     *
     * @param int    $timestamp The unix timestamp of the observation date in the viewport
     * @param object $meta      An ImageMetaInformation object
     * @param array  $options   An array containing true/false values for "EdgeEnhance" and "Sharpen"
     * @param string $filename  Location where the screenshot will be stored
     * @param int    $quality   Screenshot compression quality
     * @param array  $offsets   The offsets of the top-left and bottom-right corners of the image
     *                          from the center of the sun.
     */
    public function __construct($timestamp, $meta, $options, $filename, $quality, $offsets)
    {
        $this->timestamp     = $timestamp;
        $this->quality       = $quality;
        $this->offsetLeft	 = $offsets['left'];
        $this->offsetTop	 = $offsets['top'];
        $this->offsetBottom	 = $offsets['bottom'];
        $this->offsetRight	 = $offsets['right'];

        $tmpDir = HV_CACHE_DIR . "/screenshots";
        $this->extractedDir = HV_CACHE_DIR . "/extracted_images";
        $this->makeDirectory($this->extractedDir);

        parent::__construct($meta, $options, $tmpDir, $filename);
    }

    /**
     * Builds the screenshot.
     *
     * @param {Array} $layerInfoArray -- An associative array of 
     * 	sourceId,width,height,imageScale,roi,offsetX,offsetY for each layer
     *
     * @return void
     */
    public function buildImages($layerInfoArray)
    {
        $this->layerImages = array();

        // Find the closest image for each layer, add the layer information string to it
        foreach ($layerInfoArray as $layer) {
            $closestImage = $this->_getClosestImage($layer['sourceId']);
            $obsInfo 	  = $this->_getObservatoryInformation($layer['sourceId']);

            $roi = array(
                'top'    => $this->offsetTop,
                'left'   => $this->offsetLeft,
                'bottom' => $this->offsetBottom,
                'right'  => $this->offsetRight
            );
       
            $pathToFile     = $this->_getJP2Path($closestImage);
            $tmpOutputFile  = $this->_getTmpOutputPath($closestImage, $roi);

            $offsetX = $closestImage['sunCenterX'] - $closestImage['width'] /2;
            $offsetY = $closestImage['height']/2   - $closestImage['sunCenterY'];
            
            $image = new Image_HelioviewerCompositeImageLayer(
                $pathToFile, $tmpOutputFile, 'png', 
                $layer['width'], $layer['height'], $layer['imageScale'], 
                $roi, $obsInfo['instrument'], $obsInfo['detector'],
                $obsInfo['measurement'], $obsInfo['layeringOrder'], 
                $offsetX, $offsetY, $layer['opacity'],
                $closestImage['width'], $closestImage['height'], 
                $closestImage['scale'], $closestImage['date']
            );
            array_push($this->layerImages, $image);
        }

        $this->compileImages();
    }
    
    /**
     * Gets the path to the JP2 image on disk
     * 
     * @param array $closestImage An array containing image meta information, obtained from the database
     * 
     * @return string the filepath to the JP2 image
     */
    private function _getJP2Path($closestImage)
    {
        return HV_JP2_DIR . $closestImage['filepath'] . "/" . $closestImage['filename'];
    }
    
    /**
     * Builds a temporary output path where the extracted image will be stored
     * 
     * @param array $closestImage An array containing image meta information, obtained from the database
     * 
     * @return string a string containing the image's temporary output path
     */
    private function _getTmpOutputPath($closestImage, $roi)
    {
        return $this->extractedDir . "/" . substr($closestImage['filename'], 0, -4) . "_" . 
            $this->metaInfo->imageScale() . "_" . $roi['left'] . "_" . $roi['right'] . "x_" . 
            $roi['top'] . "_" . $roi['bottom'] . "y.png";
    }

    /**
     * Queries the database to find the closest image to a given timestamp.
     *
     * @param int $sourceId The source ID of the image
     *
     * @return array closestImg, an array with the image's id, filepath, filename, date
     */
    private function _getClosestImage($sourceId)
    {
        include_once HV_ROOT_DIR . '/api/src/Database/ImgIndex.php';
        $imgIndex = new Database_ImgIndex();
        
        $closestImg = $imgIndex->getClosestImage($this->timestamp, $sourceId);
        return $closestImg;
    }
    
    /**
     * If a source ID is passed in as a parameter, the database is queried to get the
     * image's observatory, instrument, detector, measurement
     * 
     * @param int $sourceId the source ID of the image
     * 
     * @return array an array with the image's obs, inst, det, meas info
     */
    private function _getObservatoryInformation($sourceId)
    {
        include_once HV_ROOT_DIR . '/api/src/Database/ImgIndex.php';
        $imgIndex = new Database_ImgIndex();
        $result = $imgIndex->getDatasourceInformationFromSourceId($sourceId);
        return $result;    	
    }
}
?>