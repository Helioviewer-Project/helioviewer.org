<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Image_SubFieldImage class definition
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Jeff Stys <jeff.stys@nasa.gov>
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */

/**
 * Represents a JPEG 2000 sub-field image.
 *
 * The SubFieldImage class provides functionality for outputting a sub-section
 * of a JPEG 2000 image (possibly the entire image) in a common format such as
 * JPEG or PNG. Color tables and alpha masks can also be applied at this level.
 *
 * @TODO Switch to using a single "optional" array passed to initialize for
 *       color table, padding, etc?
 *
 * @category Image
 * @package  Helioviewer
 * @author   Jeff Stys <jeff.stys@nasa.gov>
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Image_SubFieldImage {

    protected $jp2;
    protected $image;
    protected $outputFile;
    protected $roi;
    protected $imageSubRegion;
    protected $desiredScale;
    protected $desiredToActual;
    protected $scaleFactor;
    protected $subfieldWidth;
    protected $subfieldHeight;
    protected $subfieldRelWidth;
    protected $subfieldRelHeight;
    protected $jp2Width;
    protected $jp2Height;
    protected $jp2RelWidth;
    protected $jp2RelHeight;
    protected $offsetX;
    protected $offsetY;
    protected $options;

    /**
     * Creates an Image_SubFieldImage instance
     *
     * @param string $jp2          Original JP2 image from which the subfield
     *                             should be derrived
     * @param array  $roi          Subfield region of interest
     * @param string $outputFile   Location to output the subfield image to
     * @param float  $offsetX      Offset of the center of the sun from the
     *                             center of the image on the x-axis
     * @param float  $offsetY      Offset of the center of the sun from the
     *                             center of the image on the y-axis
     *
     * @TODO: Add optional parameter "noResize" or something similar to allow
     *        return images which represent the same region, but may be at a
     *        different scale (e.g. tiles). The normal case (for movies, etc)
     *        would be to resize to the requested scale on the server-side.
     *
     * @TODO: Rename "jp2scale" syntax to "nativeImageScale" to get away from
     *        JP2-specific terminology
     *        ("desiredScale" -> "desiredImageScale" or "requestedImageScale")
     */
    public function __construct($jp2, $roi, $outputFile, $offsetX, $offsetY,
        $options) {

        $this->outputFile  = $outputFile;
        $this->jp2         = $jp2;
        $this->roi         = $roi;

        // Default settings
        $defaults = array(
            'bitdepth'    => 8,
            'compress'    => true,
            'interlace'   => true,
            'opacity'     => 100,
            'rescale'     => IMagick::FILTER_TRIANGLE
        );

        $this->imageOptions = array_replace($defaults, $options);

        // Source image dimensions
        $jp2Width  = $jp2->getWidth();
        $jp2Height = $jp2->getHeight();
        $jp2Scale  = $jp2->getScale();

        // Convert region of interest from arc-seconds to pixels
        $this->imageSubRegion = $roi->getImageSubRegion($jp2Width, $jp2Height,
            $jp2Scale, $offsetX, $offsetY);

        // Desired image scale (normalized to 1au)
        $this->desiredScale    = $roi->imageScale();

        $this->desiredToActual = $this->desiredScale / $jp2->getScale();
        $this->scaleFactor     = log($this->desiredToActual, 2);
        $this->reduce          = max(0, floor($this->scaleFactor));

        $this->subfieldWidth   = $this->imageSubRegion['right']
                               - $this->imageSubRegion['left'];
        $this->subfieldHeight  = $this->imageSubRegion['bottom']
                               - $this->imageSubRegion['top'];

        $this->subfieldRelWidth  = $this->subfieldWidth
                                 / $this->desiredToActual;
        $this->subfieldRelHeight = $this->subfieldHeight
                                 / $this->desiredToActual;

        $this->jp2RelWidth  = $jp2Width  / $this->desiredToActual;
        $this->jp2RelHeight = $jp2Height / $this->desiredToActual;

        $this->offsetX = $offsetX;
        $this->offsetY = $offsetY;
    }

    /**
     * Sets parameters (gravity and size) for any padding which should be
     * applied to extracted subfield image
     *
     * @param array $padding An associative array containing the width,
     *                       height, and gravity values to use during padding.
     *
     * @return void
     */
    public function setPadding($padding) {
        $this->padding = $padding;
        // Allow browser to rescale tiles which are not larger than the
        // requested size
        /*if (!($padding && ($padding['width'] > $this->width))) {
            $this->setSkipResize(true);
        }*/
    }

    /**
     * Saves the new filepath
     *
     * @param string $filepath The new file path to the image
     *
     * @return void
     */
    public function setNewFilePath($filepath) {
        $this->outputFile = $filepath;
    }

    /**
     * Gets the SubfieldImage's output file
     *
     * @return string outputFile
     */
    public function outputFile() {
        return $this->outputFile;
    }

    /**
     * Getters that are needed for determining padding, as they must be
     * accessed from Tile or ImageLayer classes.
     *
     * @return int jp2RelWidth
     */
    public function jp2RelWidth() {
        return $this->jp2RelWidth;
    }

    /**
     * Gets the jp2 image's relative height
     *
     * @return int jp2RelHeight
     */
    public function jp2RelHeight() {
        return $this->jp2RelHeight;
    }

    /**
     * Gets the extracted image's relative width
     *
     * @return int subfieldRelWidth
     */
    public function subfieldRelWidth() {
        return $this->subfieldRelWidth;
    }

    /**
     * Gets the extracted image's relative height
     *
     * @return int subfieldRelHeight
     */
    public function subfieldRelHeight() {
        return $this->subfieldRelHeight;
    }

    /**
     * Builds the requested subfield image.
     *
     * Normalizing request & native image scales:
     *
     * When comparing the requested or "desired" image scale for the subfield
     * image to the native or "actual" image scale of the source image, it is
     * convenient to create a variable called "desiredToActual" which
     * represents the ratio of the desired scale to the actual scale.
     *
     * There are three possible cases which may occur:
     *
     *     1) desiredToActual = 1
     *
     *          In this case the subfield requested is at the natural image
     *          scale. No resizing is necessary.
     *
     *     2) desiredToActual < 1
     *
     *          The subfield requested is at a lower image scale (HIGHER
     *          quality) than the source JP2.
     *
     *     3) desiredToActual > 1
     *
     *          The subfield requested is at a higher image scale (LOWER
     *          quality) than the source JP2.
     *
     * @TODO: Normalize quality scale.
     * @TODO: Create a cleanup array with names of files to be wiped after
     *        processing is complete?
     * @TODO: Move generation of intermediate file to separate method
     *
     * @return void
     */
    protected function build() {
        /*
         * Need to extend the time limit that writeImage() can use so it
         * doesn't throw fatal errors when movie frames are being made.
         * It seems that even if this particular instance of writeImage
         * doesn't take the  full time frame, if several instances of it are
         * running PHP will complain.
         */
        set_time_limit(600);

        try {
            // Choose extension to convert source image to
            if ($this->options['palettedJP2']) {
                $extension = '.bmp';
            }
            else {
                $extension = '.pgm';
            }
            $input = substr($this->outputFile, 0, -4).rand().$extension;

            // Extract region (PGM)
            $this->jp2->extractRegion($input, $this->imageSubRegion,
                $this->reduce);

            // Apply colormap if needed
            if ( !$this->options['palettedJP2'] ) {

                // Convert to GD-readable format
                $grayscale = new IMagick($input);

                if ( isset($this->options['verifyGrayscale']) &&
                     $this->options['verifyGrayscale'] &&
                     $grayscale->getImageType()!=imagick::IMGTYPE_GRAYSCALE ) {

                    $this->colorTable = false;
                }

                $grayscale->setImageFormat('PNG');
                $grayscale->setImageDepth(8);
                // Fastest PNG compression setting
                $grayscale->setImageCompressionQuality(10);

                $grayscaleString = $grayscale->getimageblob();

                // Assume that no color table is needed
                $coloredImage = $grayscale;

                // Apply color table if one exists
                if ($this->colorTable) {
                    $grayscale->destroy();
                    $coloredImageString =
                    $this->setColorPalette($grayscaleString);

                    $coloredImage = new IMagick();
                    $coloredImage->readimageblob($coloredImageString);
                }
            }
            else {
                $coloredImage = new IMagick($input);
            }

            // Set alpha channel for images with transparent components
            $this->setAlphaChannel($coloredImage);

            // Apply compression and interlacing
            $this->compressImage($coloredImage);

            // Resize extracted image to correct size before padding.
            $rescaleBlurFactor = 0.6;

            $coloredImage->resizeImage(
                round($this->subfieldRelWidth),
                round($this->subfieldRelHeight),
                $this->imageOptions['rescale'],
                $rescaleBlurFactor
            );
            $coloredImage->setImageBackgroundColor('transparent');

            // Places the current image on a larger field of black if the final
            // image is larger than this one
            $imagickVersion = $coloredImage->getVersion();

            if ( $imagickVersion['versionNumber'] >
                    IMAGE_MAGICK_662_VERSION_NUM) {

                // ImageMagick 6.6.2-6 and higher
                // Problematic change occurred in revision 6.6.4-2
                // See: http://www.imagemagick.org/script/changelog.php
                $coloredImage->extentImage(
                    $this->padding['width'], $this->padding['height'],
                    $this->padding['offsetX'], $this->padding['offsetY']
                );
            }
            else {
                // Imagick 3.0 and lower
                $coloredImage->extentImage(
                     $this->padding['width'],    $this->padding['height'],
                    -$this->padding['offsetX'], -$this->padding['offsetY']
                );
            }

            $this->image = $coloredImage;

            // Check for PGM before deleting just in case another process
            // already removed it
            if ( @file_exists($input) ) {
                @unlink($input);
            }
        }
        catch(Exception $e) {
            // Clean-up intermediate files
            $this->_abort($this->outputFile);
            throw $e;
        }
    }

    /**
     * Returns the IMagick instance assocated with the image
     */
    public function getIMagickImage() {
        return $this->image;
    }

    /**
     * Saves the file using the specified output filename
     */
    public function save() {
        if ( !@file_exists($this->outputFile) &&
             !is_null($this->image) ) {

            $this->image->writeImage($this->outputFile);
        }
    }

    /**
     * Sets compression for images that are not ImageLayers
     *
     * @param Object &$imagickImage An initialized Imagick object
     *
     * @return void
     */
    protected function compressImage(&$imagickImage) {
        // Get extension
        $parts = explode('.', $this->outputFile);
        $extension = end($parts);

        // Apply compression based on image type for those formats that
        // support it
        if ( $extension === 'png' ) {
            // Compression type
            $imagickImage->setImageCompression(IMagick::COMPRESSION_LZW);

            // Compression quality
            $quality = $this->imageOptions['compress'] ?
                PNG_HIGH_COMPRESSION : PNG_LOW_COMPRESSION;
            $imagickImage->setImageCompressionQuality($quality);

            // Interlacing
            if ( $this->imageOptions['interlace'] ) {
                $imagickImage->setInterlaceScheme(IMagick::INTERLACE_PLANE);
            }
        }
        else if ($extension === 'jpg') {
            // Compression type
            $imagickImage->setImageCompression(IMagick::COMPRESSION_JPEG);

            // Compression quality
            $quality = $this->imageOptions['compress'] ?
                JPG_HIGH_COMPRESSION : JPG_LOW_COMPRESSION;
            $imagickImage->setImageCompressionQuality($quality);

            // Interlacing
            if ( $this->imageOptions['interlace'] ) {
                $imagickImage->setInterlaceScheme(IMagick::INTERLACE_LINE);
            }
        }

        $imagickImage->setImageDepth($this->imageOptions['bitdepth']);
    }

    /**
     * Figures out where the extracted image lies inside the final image
     * if the final image is larger.
     *
     * @param Array $roi   The region of interest in arcseconds of the final
     *                     image.
     *
     * @return array with padding
     */
    public function computePadding() {
        $centerX = $this->jp2->getWidth()  / 2 + $this->offsetX;
        $centerY = $this->jp2->getHeight() / 2 + $this->offsetY;

        $leftToCenter = ($this->imageSubRegion['left'] - $centerX);
        $topToCenter  = ($this->imageSubRegion['top']  - $centerY);
        $scaleFactor  = $this->jp2->getScale() / $this->desiredScale;
        $relLeftToCenter = $leftToCenter * $scaleFactor;
        $relTopToCenter  = $topToCenter  * $scaleFactor;

        $left = ($this->roi->left() / $this->desiredScale) - $relLeftToCenter;
        $top  = ($this->roi->top()  / $this->desiredScale) - $relTopToCenter;

        // Rounding to prevent imprecision during later implicit integer
        // casting (Imagick->extentImage)
        // www.php.net/manual/en/language.types.float.php#warn.float-precision
        return array(
           'gravity' => 'northwest',
           'width'   => round($this->roi->getPixelWidth()),
           'height'  => round($this->roi->getPixelHeight()),
           'offsetX' => ($left < 0.001 && $left > -0.001)? 0 : round($left),
           'offsetY' => ($top  < 0.001 && $top  > -0.001)? 0 : round($top)
        );
    }

    /**
     * Default behavior for images is to just set their opacity.
     * LASCOImage.php and CORImage.php have an applyAlphaMaskCmd that
     * overrides this one and applies
     * an alpha mask and does some special commands for opacity
     *
     * @param Object &$imagickImage IMagick Object
     *
     * @return string
     */
    protected function setAlphaChannel(&$imagickImage) {
        $imagickImage->setImageOpacity($this->imageOptions['opacity'] / 100);
    }

    /**
     * Sets the subfield image color lookup table (CLUT)
     *
     * @param string $clut Location of the lookup table to use
     *
     * @return void
     */
    protected function setColorTable($clut) {
        $this->colorTable = $clut;
    }

    /**
     * Handles clean-up in case something goes wrong to avoid mal-formed tiles
     * from being displayed
     *
     * @param string $filename Filename for aborted subfield image
     *
     * @TODO: Close any open IM/GD file handlers
     *
     * @return void
     */
    private function _abort($filename) {
        $files = glob(substr($filename, 0, -3).'*');

        if ($files) {
            foreach($tmpFiles as $file) {
                @unlink($file);
            }
        }
    }

    /**
     * Applies the specified color lookup table to the image using GD
     * Override this in any ImageType class that doesn't have a color
     * table, i.e. MDI and AIA (for now)
     *
     * Note: input and output are usually the same file.
     *
     * @param string &$input  Location of input image
     *
     * @return String binary string representation of image after processing
     */
    protected function setColorPalette(&$input) {
        $clut = $this->colorTable;

        // Read in image string
        $gd = imagecreatefromstring($input);

        if (!$gd) {
            throw new Exception('Unable to apply color-table: ' . $input 
                . ' is not a valid image.', 32);
        }

        $ctable = imagecreatefrompng($clut);

        // Apply color table
        for ($i = 0; $i <= 255; $i++) {
            $rgb = imagecolorat($ctable, 0, $i);
            $r = ($rgb >> 16) & 0xFF;
            $g = ($rgb >> 8)  & 0xFF;
            $b =  $rgb        & 0xFF;
            imagecolorset($gd, $i, $r, $g, $b);
        }

        // Write new image string
        ob_start();

        imagepng($gd, NULL);
        $blob = ob_get_contents();

        ob_end_clean();

        // Clean up
        imagedestroy($gd);
        imagedestroy($ctable);

        return $blob;
    }

    /**
     * Displays the image on the page
     *
     * @return void
     */
    public function display() {

        //header('Cache-Control: public, max-age=' . $lifetime * 60);
        $headers = apache_request_headers();

        // Enable caching of images served by PHP
        // http://us.php.net/manual/en/function.header.php#61903
        $lastModified = 'Last-Modified: ' . gmdate('D, d M Y H:i:s',
            @filemtime($this->outputFile)) . ' GMT';

        if ( isset($headers['If-Modified-Since']) &&
             (strtotime($headers['If-Modified-Since']) ==
                @filemtime($this->outputFile))) {

            // Cache is current (304)
            header($lastModified, true, 304);
        }
        else {
            // Image not in cache or out of date (200)
            header($lastModified, true, 200);

            header('Content-Length: '.@filesize($this->outputFile));

            // Set content-type
            $fileinfo = new finfo(FILEINFO_MIME);
            $mimetype = $fileinfo->file($this->outputFile);
            header('Content-type: '.$mimetype);

            // Filename & Content-length
            $filename = basename($this->outputFile);

            header('Content-Disposition: inline; filename="'.$filename.'"');

            // Attempt to read in from cache and display
            $attempts = 0;

            while ($attempts < 3) {
                // If read is successful, we are finished
                if ( @readfile($this->outputFile) ) {
                    return;
                }
                $attempts += 1;
                usleep(500000); // wait 0.5s
            }

            // If the image fails to load after 3 tries, display an error
            // message
            throw new Exception(
                'Unable to read image from cache: '.$filename, 33 );
        }
    }

    /**
     * Destructor
     *
     * @return void
     */
    public function __destruct() {
        // Destroy IMagick object
        if ( isset($this->image) ) {
            $this->image->destroy();
        }
    }
}
?>