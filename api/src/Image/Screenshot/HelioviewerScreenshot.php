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
require_once 'src/Image/JPEG2000/JP2Image.php';
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
class Image_Screenshot_HelioviewerScreenshot
{
    protected $layerImages = array();
    protected $db;
    protected $outputFile;
    protected $date;
    protected $filename;
    protected $watermarkOn;
    protected $compositeFilepath;
    
    // FROM COMPOSITE_IMAGE
    protected $composite;
    protected $cacheDir;
    protected $width;
    protected $height;
    protected $scale;
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
        
        $this->width      = $roi->getPixelWidth();
        $this->height     = $roi->getPixelHeight();
        $this->scale      = $roi->imageScale();     
        $this->cacheDir   = $options['outputDir'];

        $this->db          = new Database_ImgIndex();
        $this->layers      = $layers;
        $this->date        = $obsDate;
        $this->roi         = $roi;
        $this->watermarkOn = $options['watermarkOn'];

        // Choose a filename if none was specified
        $this->outputFile = $this->_buildFilename($options['filename']);        
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
     * Builds a filepath to use for the composite image if none was specified
     * 
     * @param mixed $filename Filename to use if specified
     */
    private function _buildFilename ($filename)
    {
        if ($filename) {
            return $filename;
        }

        $time = str_replace(array(":", "-", "T", "Z"), "_", $this->date);
        return $time . $this->layers->toString() . "_" . rand() . ".jpg";
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
    
    /**
     * Builds each image separately and then composites them together if necessary.
     *
     * @return void
     */
    protected function compileImages()
    {
        try  {
            if (empty($this->layerImages)) {
                throw new Exception("No valid layers specified in layerImages");
            }

            // Composite images on top of one another if there are multiple layers.
            if (sizeOf($this->layerImages) > 1) {
                $this->composite = $this->_buildComposite();
            } else {
                // Otherwise, the image has one layer and just needs to be watermarked.
                $imagickImage = new IMagick($this->layerImages[0]->getFilePathString());
                $output = $this->cacheDir . "/$this->outputFile";

                if ($this->watermarkOn === true || $this->watermarkOn === "true") {
                    $this->_watermark($imagickImage);
                }
                $this->_finalizeImage($imagickImage, $output);
            
                $this->composite = $output; 
            }

        } catch(Exception $e) {
            throw new Exception("Unable to compile composite image layers: {$e->getMessage()}");
        }
    }

    /**
     * Composites a watermark (the date strings of the image) onto the lower left corner and the HV logo in the
     * lower right corner.
     *
     * Layer names are added togeter as one string, and date strings are added as a separate string,
     * to line them up nicely. An example string would  be:
     *
     *      -annotate +20+0 'EIT 304\nLASCO C2\n'
     * and:
     *      -annotate +100+0 '2003-01-01 12:00\n2003-01-01 11:30\n'
     *
     * These two strings are then layered on top of each other and put in the southwest corner of the image.
     *
     * @param Object $imagickImage An Imagick object
     *
     * @return void
     */
    private function _watermark($imagickImage)
    {
        $output      = $this->cacheDir . "/$this->outputFile";

        if ($this->width < 200 || $this->height < 200) {
            return;
        }
        
        $watermark   = new IMagick(HV_ROOT_DIR . "/api/resources/images/watermark_small_black_border.png");
        
        // If the image is too small, use only the circle, not the url, and scale it so it fits the image.
        if ($this->width / 300 < 2) {
            $watermark->readImage(HV_ROOT_DIR . "/api/resources/images/watermark_circle_small_black_border.png");
            $scale = ($this->width / 2) / 300;
            $width = $watermark->getImageWidth();
            $watermark->scaleImage($width * $scale, $width * $scale);     
        }
        
        // For whatever reason, compositeImage() doesn't carry over gravity settings so the offsets must
        // be relative to the top left corner of the image rather than the desired gravity. 
        $x = $this->width  - $watermark->getImageWidth()  - 10;
        $y = $this->height - $watermark->getImageHeight() - 10;
        $imagickImage->compositeImage($watermark, IMagick::COMPOSITE_DISSOLVE, $x, $y);
        
        // If the image is too small, text won't fit. Don't put a date string on it. 
        if ($this->width > 285) {
            $this->addWaterMarkText($imagickImage);
        }
        
        $watermark->destroy();
    }
    
    /**
     * Composites the layers on top of each other after putting them in the proper order.
     * 
     * @return string Filepath to the composited, watermarked image
     */
    private function _buildComposite()
    {
        $sortedImages = $this->sortByLayeringOrder($this->layerImages);
        $tmpImg       = $this->cacheDir . "/" . $this->outputFile;

        $layerNum = 1;
        $imagickImage = false;
        foreach ($sortedImages as $image) {
            $previous = $imagickImage;
            $imagickImage = new IMagick($image->getFilePathString());

            // If $previous exists, then the images need to be composited. For memory purposes, 
            // destroy $previous when done with it. 
            if ($previous) { 
                $imagickImage->compositeImage($previous, IMagick::COMPOSITE_DSTOVER, 0, 0);
                $previous->destroy();
            }
            $layerNum++;
        }
        
        if ($this->watermarkOn === true || $this->watermarkOn === "true") {
            $this->_watermark($imagickImage);
        }
        $this->_finalizeImage($imagickImage, $tmpImg);
        
        if (!file_exists($tmpImg)) {
            throw new Exception("Unable to turn alpha channel off for $tmpImg.");
        }

        return $tmpImg;
    }
    
    /**
     * Writes the image to a file and cleans up memory.
     * 
     * @param Object $imagickImage An Imagick object
     * @param String $output       The filepath where the image will be written to
     * 
     * @return void
     */
    private function _finalizeImage($imagickImage, $output)
    {
        // Need to up the time limit that imagick is allowed to use to execute commands. 
        set_time_limit(60);
        $imagickImage->setImageFormat('JPG');
        $imagickImage->setImageInterlaceScheme(IMagick::INTERLACE_LINE);
        $imagickImage->setBackgroundColor('black');
        $imagickImage->setImageDepth(8);
        $imagickImage->writeImage($output);
        $imagickImage->destroy();
    }
    
    /**
     * Deletes any extra or temporary files that were created in the building process. 
     * 
     * @param array $files -- array of filename strings
     * 
     * @return void
     */
    private function _cleanUp($files)
    {
        foreach ($files as $file) {
            if(file_exists($file))
                unlink($file);
        }
    }

    /**
     * Sorts the layers by their associated layering order
     *
     * Layering orders that are supported currently are 3 (C3 images), 2 (C2 images), 1 (EIT/MDI images).
     * The array is sorted by increasing layeringOrder.
     *
     * @param array $images Array of Composite image layers
     *
     * @return array Array containing the sorted image layers
     */
    protected function sortByLayeringOrder($images)
    {
        $sortedImages = array();

        // Array to hold any images with layering order 2 or 3.
        // These images must go in the sortedImages array last because of how compositing works.
        $groups = array("2" => array(), "3" => array());

        // Push all layering order 1 images into the sortedImages array,
        // push layering order 2 and higher into separate array.
        foreach ($images as $image) {
            $order = $image->getLayeringOrder();
            if ($order > 1) {
                array_push($groups[$order], $image);
            } else {
                array_push($sortedImages, $image);
            }
        }

        // Push the group 2's and group 3's into the sortedImages array now.
        foreach ($groups as $group) {
            foreach ($group as $image) {
                array_push($sortedImages, $image);
            }
        }

        // return the sorted array in order of smallest layering order to largest.
        return $sortedImages;
    }

    /**
     * Prints the image to the screen
     *
     * @return void
     */
    public function printImage()
    {
        header("Content-Type: image/png");
        echo $this->composite;
    }

    /**
     * Starts the compositing process from an array of built images
     * 
     * @param array $images An array of built ImageLayer images
     * 
     * @return void
     */
    public function compositeImageFromImageArray($images) 
    {
        $this->layerImages = $images;
        $this->compileImages();
    }

    /**
     * Returns the composite image.
     *
     * @return string Filepath to the composited image
     */
    function getComposite()
    {
        return $this->composite;
    }
}
?>