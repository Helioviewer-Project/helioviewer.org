<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Image_HelioviewerScreenshot class definition
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once 'src/Image/Composite/CompositeImage.php';
require_once 'src/Image/JPEG2000/JP2Image.php';
require_once 'src/Image/HelioviewerImage.php';
require_once 'src/Helper/LayerParser.php';
/**
 * Image_HelioviewerScreenshot class definition
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Image_Screenshot_HelioviewerScreenshot extends Image_Composite_CompositeImage
{
    protected $outputFile;
    protected $layerImages;
    protected $date;
    protected $filename;
    protected $watermarkOn;
    protected $compositeFilepath;
    /**
     * Prepares the parameters passed in from the api call and creates a screenshot from them.
     *                              
     * @return string the screenshot
     */
    public function __construct($layers, $obsDate, $roi, $options)
    {
        // Any settings specified in $this->_params will override $defaults
        $defaults = array(
            'closestImages' => array(),
            'outputDir'   => HV_CACHE_DIR . "/screenshots",
            'format'      => 'png', // 11/16/2010 Not currently used!
            'watermarkOn' => true,
            'filename'    => false,
            'compress'    => false, // 11/16/2010 Not currently used!
            'interlace'   => true,  // 11/16/2010 Not currently used!
            'quality'     => 20     // 11/16/2010 Not currently used!
        );
        
        $options = array_replace($defaults, $options);
        
        $pixelWidth  = $roi->getPixelWidth();
        $pixelHeight = $roi->getPixelHeight();
        
        // Image scale (arcseconds/pixel)
        $imageScale  = $roi->imageScale();
        
        parent::__construct($pixelWidth, $pixelHeight, $imageScale, $options['outputDir'], $options['filename'] . ".jpg");

        // Screenshot meta information
        $layerArray = $this->_createMetaInformation($layers, $imageScale, $pixelWidth, $pixelHeight, $options['closestImages']);

        $this->date        = $obsDate;
        $this->roi         = $roi;
        $this->watermarkOn = $options['watermarkOn'];
        $this->filename    = $options['filename'];

        $this->buildImages($layerArray);
        
        // TEMP
        $this->compositeFilepath = $this->getComposite();
        
        // Check to see if screenshot was successfully created
        if (!file_exists($this->compositeFilepath)) {
            throw new Exception('The requested screenshot is either unavailable or does not exist.');
        }
    }
    
    /**
     * 
     */
    public function getFilepath() {
        return $this->compositeFilepath;
    }
    
    public function getURL() {
        return str_replace(HV_ROOT_DIR, HV_WEB_ROOT_URL, $this->compositeFilepath);
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

            $image = (sizeOf($closestImages) > 0 ? $closestImages[$sourceId] : false);

            if ($visible !== 0 && $visible !== "0") {
                $layerInfoArray = array(
                    'sourceId'     => $sourceId,
                    'width'        => $width,
                    'height'       => $height,
                    'imageScale'   => $imageScale,
                    'opacity'      => $opacity,
                    'closestImage' => $image
                );
                array_push($metaArray, $layerInfoArray);
            }
        }

        return $metaArray;
    }

    /**
     * Builds the screenshot.
     *
     * @param {Array} $layerInfoArray -- An associative array of
     * 	sourceId,width,height,imageScale,offsetX,offsetY for each layer
     *
     * @return void
     */
    public function buildImages($layerInfoArray)
    {
        $filenameInfo = "";
        $this->layerImages = array();

        // Find the closest image for each layer, add the layer information string to it
        foreach ($layerInfoArray as $layer) {
            if (!$layer['closestImage']) {
                $closestImage = $this->_getClosestImage($layer['sourceId']);
            } else {
                $closestImage = $layer['closestImage'];
            }

            $obsInfo 	   = $this->_getObservatoryInformation($layer['sourceId']);
            $filenameInfo .= "_" . $obsInfo['instrument'] . "_" . $obsInfo['detector'] . "_" . $obsInfo['measurement'] . "_";

            // Instantiate a JP2Image
            $jp2Filepath = $this->_getJP2Path($closestImage);
          
            $jp2 = new Image_JPEG2000_JP2Image(
                $jp2Filepath, $closestImage['width'], $closestImage['height'], $closestImage['scale']
            );       

            $tmpOutputFile  = $this->_getTmpOutputPath($closestImage, $this->roi, $layer['opacity']);

            $offsetX = $closestImage['sunCenterX'] - $closestImage['width'] /2;
            $offsetY = $closestImage['height']/2   - $closestImage['sunCenterY'];
            
            // Optional parameters
            $options = array(
                "date"          => $closestImage['date'],
                "compress"      => false,
                "layeringOrder" => $obsInfo['layeringOrder'],
                "opacity"       => $layer['opacity']
            );
            
            $image = new Image_HelioviewerImage(
                $jp2, $tmpOutputFile, $this->roi, $obsInfo['instrument'], $obsInfo['detector'], $obsInfo['measurement'], 
                $offsetX, $offsetY, $options
            );
            array_push($this->layerImages, $image);
        }

        if (!$this->filename) {
            $time = str_replace(array(":", "-", "T", "Z"), "_", $this->date);
            //$this->setOutputFile($time . $filenameInfo . time() . "." . $this->format);
            
            // 11/12/2010
            //$this->setOutputFile($time . $filenameInfo . time() . ".jpg");
            $this->outputFile = $time . $filenameInfo . rand() . ".jpg";
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
     * @param roi   $roi          The region of interest in arcseconds
     * @param int   $opacity      The opacity of the image from 0 to 100
     * 
     * @return string a string containing the image's temporary output path
     */
    private function _getTmpOutputPath($closestImage, $roi, $opacity)
    {
        $cacheDir = HV_CACHE_DIR . $closestImage['filepath'];

        if (!file_exists($cacheDir)) {
            mkdir($cacheDir, 0777, true);
            chmod($cacheDir, 0777);
        }

        return $cacheDir . "/" . substr($closestImage['filename'], 0, -4) . "_" . 
            $this->scale . "_" . round($roi->left()) . "_" . round($roi->right()) . "x_" . 
            round($roi->top()) . "_" . round($roi->bottom()) . "y-op$opacity.png";
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
        
        $closestImg = $imgIndex->getClosestImage($this->date, $sourceId);
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
    
    /**
     * Builds an imagemagick command to composite watermark text onto the image
     * 
     * @param Object $imagickImage An initialized IMagick object
     * 
     * @return void
     */
    protected function addWaterMarkText($imagickImage)
    {
        $nameCmd = "";
        $timeCmd = "";
        $height  = $imagickImage->getImageHeight();
        
        $lowerPad = $height - 8; 
        // Put the names on first, then put the times on as a separate layer so the times are nicely aligned.
        foreach ($this->layerImages as $layer) {
            $lowerPad -= 12;
            $nameCmd  .= $layer->getWaterMarkName();
            $timeCmd  .= $layer->getWaterMarkDateString();
        }
        
        $black = new IMagickPixel("#000C");
        $white = new IMagickPixel("white");
        
        // Outline words in black
        $underText = new IMagickDraw();
        $underText->setStrokeColor($black);
        $underText->setStrokeWidth(2);
        $imagickImage->annotateImage($underText, 20, $lowerPad, 0, $nameCmd);
        $imagickImage->annotateImage($underText, 125, $lowerPad, 0, $timeCmd);
        
        // Write words in white over outline
        $text = new IMagickDraw();
        $text->setFillColor($white);
        $text->setStrokeWidth(0);
        $imagickImage->annotateImage($text, 20, $lowerPad, 0, $nameCmd);
        $imagickImage->annotateImage($text, 125, $lowerPad, 0, $timeCmd);
        
        $black->destroy();
        $white->destroy();
        $underText->destroy();
        $text->destroy();
    }
    
    /**
     * Does the same thing as addWaterMarkText but with no imagick.
     * returns a string, as it is assumed that this is called from addWatermarkNoImagick()
     * 
     * @return string
     */
    protected function addWaterMarkTextNoImagick()
    {
        $cmd     = "";
        $nameCmd = "";
        $timeCmd = "";

        // Put the names on first, then put the times on as a separate layer so the times are nicely aligned.
        foreach ($this->layerImages as $layer) {
            $nameCmd .= $layer->getWaterMarkName();
            $timeCmd .= $layer->getWaterMarkDateString();
        }

        // Outline words in black
        $cmd .= " -stroke #000C -strokewidth 2 -annotate +20+0 '$nameCmd'";
        // Write words in white over outline
        $cmd .= " -stroke none -fill white -annotate +20+0 '$nameCmd'";
        // Outline words in black
        $cmd .= " -stroke #000C -strokewidth 2 -annotate +125+0 '$timeCmd'";
        // Write words in white
        $cmd .= " -stroke none -fill white -annotate +125+0 '$timeCmd'";

        return $cmd;
    }
}
?>