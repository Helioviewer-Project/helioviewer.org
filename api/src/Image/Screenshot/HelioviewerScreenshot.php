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
require_once 'src/Database/ImgIndex.php';
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
    protected $layerImages = array();
    protected $db;
    protected $outputFile;
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

        $this->db          = new Database_ImgIndex();
        $this->layers      = $layers;
        $this->date        = $obsDate;
        $this->roi         = $roi;
        $this->watermarkOn = $options['watermarkOn'];
        $this->filename    = $options['filename'];

        // Choose a filename if none was specified
        if (!$this->filename) {
            $time = str_replace(array(":", "-", "T", "Z"), "_", $this->date);
            $this->outputFile = $time . $this->layers->toString() . "_" . rand() . ".jpg";
        }
        
        $this->buildImages();
        $this->compileImages();
        
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
     * Builds the screenshot.

     * @return void
     */
    public function buildImages()
    {
        // Find the closest image for each layer, add the layer information string to it
        foreach ($this->layers->toArray() as $layer) {
            $image = $this->db->getClosestImage($this->date, $layer['sourceId']);

            // Instantiate a JP2Image
            $jp2Filepath =  HV_JP2_DIR . $image['filepath'] . "/" . $image['filename'];
          
            $jp2 = new Image_JPEG2000_JP2Image($jp2Filepath, $image['width'], $image['height'], $image['scale']);

            $tmpFile = $this->_getTmpOutputPath($image['filepath'], $image['filename'], $this->roi, $layer['opacity']);

            $offsetX =  $image['sunCenterX']  - ($image['width'] / 2);
            $offsetY = ($image['height'] / 2) -  $image['sunCenterY'];

            // Optional parameters
            $options = array(
                "date"          => $image['date'],
                "layeringOrder" => $layer['layeringOrder'],
                "opacity"       => $layer['opacity'],
                "compress"      => false,
            );
            
            // Choose type of tile to create
            $type = strtoupper($layer['instrument']) . "Image";
            include_once "src/Image/ImageType/$type.php";
            
            $classname = "Image_ImageType_" . $type;
    
            $image = new $classname(
                $jp2, $tmpFile, $this->roi, $layer['instrument'], $layer['detector'], $layer['measurement'], 
                $offsetX, $offsetY, $options
            );
            
            array_push($this->layerImages, $image);
        }
    }
    
    /**
     * Builds a single layer image
     */
    private function _buildScreenshotLayer()
    {
        
    }

    /**
     * Builds a temporary output path where the extracted image will be stored

     * @param string $filepath Filepath of the image 
     * @param string $filename Filename of the image
     * @param roi    $roi      The region of interest in arcseconds
     * @param int    $opacity  The opacity of the image from 0 to 100
     * 
     * @return string a string containing the image's temporary output path
     */
    private function _getTmpOutputPath($filepath, $filename, $roi, $opacity)
    {
        $cacheDir = HV_CACHE_DIR . $filepath;

        if (!file_exists($cacheDir)) {
            mkdir($cacheDir, 0777, true);
            chmod($cacheDir, 0777);
        }

        return $cacheDir . "/" . substr($filename, 0, -4) . "_" . 
            $this->scale . "_" . round($roi->left()) . "_" . round($roi->right()) . "x_" . 
            round($roi->top()) . "_" . round($roi->bottom()) . "y-op$opacity.png";
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
}
?>