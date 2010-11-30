<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Image_Composite_HelioviewerCompositeImage class definition
 * 
 * TODO: Instead of writing intermediate layers as files, store as IMagick objects. 
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
 * Image_Composite_HelioviewerCompositeImage class definition
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
class Image_Composite_HelioviewerCompositeImage
{
    
    private $_date;
    private $_db;
    private $_cacheDir;
    private $_composite;
    private $_imageLayers;
    private $_filename;
    private $_filepath;
    private $_format;
    private $_layers;
    private $_roi;
    private $_width;
    private $_height;
    private $_scale;
    
    /**
     * Creates a new HelioviewerCompositeImage instance
     * 
     * @param object $layers  A Helper_HelioviewerLayers object representing the requested image layers
     * @param string $obsDate The date for which the composite image should be created
     * @param object $roi     The rectangular region of interest defining the composite image's boundaries
     * @param array  $options A list of optional parameters to use when creating the composite image 
     *                              
     * @return void
     */
    public function __construct($layers, $obsDate, $roi, $options)
    {
        // Default image settings (optimized for small filesize)
        $defaults = array(
            'outputDir'   => HV_CACHE_DIR . "/screenshots",
            'format'      => 'jpg',
            'watermarkOn' => true,
            'filename'    => false,
            'compress'    => true,
            'interlace'   => true
        );
        
        $options = array_replace($defaults, $options);
        
        $this->_width  = $roi->getPixelWidth();
        $this->_height = $roi->getPixelHeight();
        $this->_scale  = $roi->imageScale();     

        $this->_db     = new Database_ImgIndex();
        $this->_layers = $layers;
        $this->_date   = $obsDate;
        $this->_roi    = $roi;

        $this->_cacheDir  = $options['outputDir'];
        $this->_format    = $options['format'];
        $this->_compress  = $options['compress'];
        $this->_interlace = $options['interlace'];
        $this->_watermark = $options['watermarkOn'];

        // Choose a filename if none was specified
        $this->_filename = $this->_buildFilename($options['filename']);
        
        // Build individual layers
        $this->_imageLayers = $this->_buildCompositeImageLayers();

        // Composite layers and create the final image
        $this->_filepath = $this->_buildCompositeImage();
        
        // Check to see if composite image was successfully created
        if (!file_exists($this->_filepath)) {
            throw new Exception('The requested image is either unavailable or does not exist.');
        }
    }
    
    /**
     * Builds the composite image.
     * 
     * TODO: Instead of writing out individual layers as files and then reading them back in simply use the IMagick
     *       objects directly.
     *
     * @return void
     */
    private function _buildCompositeImageLayers()
    {
        $imageLayers = array();

        // Find the closest image for each layer, add the layer information string to it
        foreach ($this->_layers->toArray() as $layer) {
            $image = $this->_buildImageLayer($layer);
            array_push($imageLayers, $image);
        }
        
        // Check to see if layers were created
        if (empty($imageLayers)) {
            throw new Exception("Unable to create layers needed for composite image");
        }
        
        return $imageLayers;
    }
    
    /**
     * Builds a single layer image
     * 
     * @param array $layer Associative array containing the layer properties
     * 
     * @return object A HelioviewerImage instance (e.g. AIAImage or LASCOImage)
     */
    private function _buildImageLayer($layer)
    {
        $image = $this->_db->getClosestImage($this->_date, $layer['sourceId']);

        // Instantiate a JP2Image
        $jp2Filepath = HV_JP2_DIR . $image['filepath'] . "/" . $image['filename'];
      
        $jp2 = new Image_JPEG2000_JP2Image($jp2Filepath, $image['width'], $image['height'], $image['scale']);

        $tmpFile = $this->_getTmpOutputPath($image['filepath'], $image['filename'], $this->_roi, $layer['opacity']);

        $offsetX =  $image['sunCenterX']  - ($image['width'] / 2);
        $offsetY = ($image['height'] / 2) -  $image['sunCenterY'];

        // Options for individual layers
        $options = array(
            "date"          => $image['date'],
            "format"        => "bmp",
            "layeringOrder" => $layer['layeringOrder'],
            "opacity"       => $layer['opacity'],
            "compress"      => false,
        );
        
        // Choose type of tile to create
        $type = strtoupper($layer['instrument']) . "Image";
        include_once "src/Image/ImageType/$type.php";
        
        $classname = "Image_ImageType_" . $type;

        return new $classname(
            $jp2, $tmpFile, $this->_roi, $layer['instrument'], $layer['detector'], $layer['measurement'], 
            $offsetX, $offsetY, $options
        );
    }

    /**
     * Builds a temporary output path where the extracted image will be stored
     * 
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
            $this->_scale . "_" . round($roi->left()) . "_" . round($roi->right()) . "x_" . 
            round($roi->top()) . "_" . round($roi->bottom()) . "y-op$opacity";
    }

    /**
     * Builds each image separately and then composites them together if necessary.
     *
     * @return string Composite image filepath
     */
    private function _buildCompositeImage()
    {
        $filepath = $this->_cacheDir . "/" . $this->_filename;
        
        if (!file_exists($this->_cacheDir)) {
            mkdir($this->_cacheDir, 0777, true);
            chmod($this->_cacheDir, 0777);
        }
        
        // Composite images on top of one another if there are multiple layers.
        if (sizeOf($this->_imageLayers) > 1) {
            $sortedImages = $this->_sortByLayeringOrder($this->_imageLayers);

            $imagickImage = false;
            foreach ($sortedImages as $image) {
                $previous = $imagickImage;
                $imagickImage = new IMagick($image->getFilepath());
    
                // If $previous exists, then the images need to be composited. For memory purposes, 
                // destroy $previous when done with it. 
                if ($previous) { 
                    $imagickImage->compositeImage($previous, IMagick::COMPOSITE_DSTOVER, 0, 0);
                    $previous->destroy();
                }
            }
        } else {
            // For single layer images the composite image is simply the first image layer
            $imagickImage = new IMagick($this->_imageLayers[0]->getFilepath());
        }
        
        if ($this->_watermark) {
            $this->_addWatermark($imagickImage);
        }
        $this->_finalizeImage($imagickImage, $filepath);

        // Store the IMagick composite image
        $this->_composite = $imagickImage;
        
        return $filepath;
    }

    /**
     * Finalizes image and writes it to a file
     * 
     * @param Object $imagickImage An Imagick object
     * @param String $output       The filepath where the image will be written to
     * 
     * @return void
     */
    private function _finalizeImage($imagickImage, $output)
    {
        set_time_limit(60); // Need to up the time limit that imagick is allowed to use to execute commands. 

        // Compress image
        $this->_compressImage($imagickImage);

        // Flatten image and write to disk
        $imagickImage->setImageAlphaChannel(IMagick::ALPHACHANNEL_OPAQUE);
        $imagickImage->writeImage($output);
    }
    
    /**
     * Sets compression and interlacing settings for the composite image
     * 
     * @param object $imagickImage An initialized Imagick object
     * 
     * @return void
     */
    private function _compressImage($imagickImage)
    {
        // Apply compression based on image type for those formats that support it
        if ($this->_format === "png") {
            // Compression type
            $imagickImage->setImageCompression(IMagick::COMPRESSION_LZW);
            
            // Compression quality
            $quality = $this->_compress ? PNG_HIGH_COMPRESSION : PNG_LOW_COMPRESSION;
            $imagickImage->setImageCompressionQuality($quality);
            
            // Interlacing
            if ($this->_interlace) {
                $imagickImage->setInterlaceScheme(IMagick::INTERLACE_PLANE);
            }
        } elseif ($this->_format === "jpg") {
            // Compression type
            $imagickImage->setImageCompression(IMagick::COMPRESSION_JPEG);

            // Compression quality
            $quality = $this->_compress ? JPG_HIGH_COMPRESSION : JPG_LOW_COMPRESSION;             
            $imagickImage->setImageCompressionQuality($quality);
            
            // Interlacing
            if ($this->_interlace) {
                $imagickImage->setInterlaceScheme(IMagick::INTERLACE_LINE);
            }
        }

        $imagickImage->setImageDepth(8);
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
     * @param object $imagickImage An Imagick object
     *
     * @return void
     */
    private function _addWatermark($imagickImage)
    {
        $output = $this->_cacheDir . "/$this->_filename";

        if ($this->_width < 200 || $this->_height < 200) {
            return;
        }
        
        $watermark   = new IMagick(HV_ROOT_DIR . "/api/resources/images/watermark_small_black_border.png");
        
        // If the image is too small, use only the circle, not the url, and scale it so it fits the image.
        if ($this->_width / 300 < 2) {
            $watermark->readImage(HV_ROOT_DIR . "/api/resources/images/watermark_circle_small_black_border.png");
            $scale = ($this->_width / 2) / 300;
            $width = $watermark->getImageWidth();
            $watermark->scaleImage($width * $scale, $width * $scale);     
        }
        
        // For whatever reason, compositeImage() doesn't carry over gravity settings so the offsets must
        // be relative to the top left corner of the image rather than the desired gravity. 
        $x = $this->_width  - $watermark->getImageWidth()  - 10;
        $y = $this->_height - $watermark->getImageHeight() - 10;
        $imagickImage->compositeImage($watermark, IMagick::COMPOSITE_DISSOLVE, $x, $y);
        
        // If the image is too small, text won't fit. Don't put a date string on it. 
        if ($this->_width > 285) {
            $this->_addTimestampWatermark($imagickImage);
        }
        
        // Cleanup
        $watermark->destroy();
    }
    
    /**
     * Builds an imagemagick command to composite watermark text onto the image
     * 
     * @param object $imagickImage An initialized IMagick object
     * 
     * @return void
     */
    private function _addTimestampWatermark($imagickImage)
    {
        $nameCmd = "";
        $timeCmd = "";
        $height  = $imagickImage->getImageHeight();
        
        $lowerPad = $height - 8; 

        // Put the names on first, then put the times on as a separate layer so the times are nicely aligned.
        foreach ($this->_imageLayers as $layer) {
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
        
        // Cleanup
        $black->destroy();
        $white->destroy();
        $underText->destroy();
        $text->destroy();
    }
    
    /**
     * Sorts the layers by their associated layering order
     *
     * Layering orders that are supported currently are 3 (C3 images), 2 (C2 images), 1 (EIT/MDI images).
     * The array is sorted by increasing layeringOrder.
     *
     * @param array &$images Array of Composite image layers
     *
     * @return array Array containing the sorted image layers
     */
    private function _sortByLayeringOrder(&$images)
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
     * Builds a filepath to use for the composite image if none was specified
     * 
     * @param string $filename Filename to use if specified
     * 
     * @return void
     */
    private function _buildFilename ($filename)
    {
        if ($filename) {
            return "$filename.{$this->_format}";
        }

        $time = str_replace(array(":", "-", "T", "Z"), "_", $this->_date);
        return $time . $this->_layers->toString() . "_" . rand() . ".{$this->_format}";
    }
    
    /**
     * Displays the composite image
     * 
     * @return void
     */
    public function display()
    {
        $fileinfo = new finfo(FILEINFO_MIME);
        $mimetype = $fileinfo->file($this->_filepath);
        header("Content-Disposition: inline; filename=\"" . basename($this->_filepath) . "\"");
        header("Content-type: " . $mimetype);
        echo $this->_composite;
    }
    
    /**
     * Returns the filepath for the generated composite image
     * 
     * @return string Filepath for the composite image
     */
    public function getFilepath()
    {
        return $this->_filepath;
    }
    
    /**
     * Returns a URL to the composite image
     * 
     * @return void
     */
    public function getURL()
    {
        return str_replace(HV_ROOT_DIR, HV_WEB_ROOT_URL, $this->_filepath);
    }
    
    /**
     * Destructor
     * 
     * @return void
     */
    public function __destruct()
    {
        // Destroy IMagick object
        if (isset($this->_composite)) {
            $this->_composite->destroy();    
        }
       
        // Delete files used to create composite image
        foreach ($this->_imageLayers as $tmpFile) {
            unlink($tmpFile->getFilepath());
        }
    }
}
?>