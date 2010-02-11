<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Image_SubFieldImage class definition
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
require 'JPEG2000/JP2Image.php';
/**
 * Represents a JPEG 2000 sub-field image.
 *
 * The SubFieldImage class provides functionality for outputting a sub-section of a JPEG 2000
 * image (possibly the entire image) in a common format such as JPEG or PNG. Color tables and alpha
 * masks can also be applied at this level.
 *
 * @category Image
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @author   Jaclyn Beck <jabeck@nmu.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Image_SubFieldImage
{
    /**
    protected $subfieldFile; //image
    protected $subfieldWidth; //imageWidth
    protected $subfieldHeight;
    protected $subfieldRelWidth; //imageRelWidth ... = $this->imageWidth  * $this->desiredToActual;
    protected $subfieldRelHeight;
    protected $region; // {top: , left: , bottom: , right: }
    **/
    protected $sourceJp2;
    protected $outputFile;
    protected $roi;
    protected $format;
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
    protected $alphaMask     = false;
    protected $colorTable    = false;
    protected $paddingString = false;
    protected $squareImage   = false;

    /**
     * Creates an Image_SubFieldImage instance
     * 
     * @param string $sourceJp2    Original JP2 image from which the subfield should be derrived
     * @param string $outputFile   Location to output the subfield image to
     * @param array	 $roi          Subfield region of interest
     * @param string $format       File format to use when saving the subfield image
     * @param int    $jp2Width     Width of the JP2 image at it's natural resolution
     * @param int    $jp2Height    Height of the JP2 image at it's natural resolution
     * @param float  $jp2Scale     Pixel scale of the original JP2 image
     * @param float  $desiredScale The requested pixel scale that the subfield image should generated at
     * 
     * @TODO: Rename "jp2scale" syntax to "nativeImageScale" to get away from JP2-specific terminology
     *           ("desiredScale" -> "desiredImageScale" or "requestedImageScale")
      */
    public function __construct($sourceJp2, $outputFile, $roi, $format, $jp2Width, $jp2Height, $jp2Scale, $desiredScale)
    {
        $this->sourceJp2  = new Image_JPEG2000_JP2Image($sourceJp2, $jp2Width, $jp2Height, $jp2Scale);
        $this->outputFile = $outputFile;
        $this->roi        = $roi;
        $this->format     = $format;

        $this->jp2Width  = $jp2Width;
        $this->jp2Height = $jp2Height;
        $this->subfieldWidth  = $roi["right"] - $roi["left"];
        $this->subfieldHeight = $roi["bottom"] - $roi["top"];

        $this->desiredScale    = $desiredScale;
        $this->desiredToActual = $desiredScale / $jp2Scale;
        $this->scaleFactor     = log($this->desiredToActual, 2);

        $this->subfieldRelWidth  = $this->subfieldWidth  / $this->desiredToActual;
        $this->subfieldRelHeight = $this->subfieldHeight / $this->desiredToActual;

        $this->jp2RelWidth  = $jp2Width  /  $this->desiredToActual;
        $this->jp2RelHeight = $jp2Height /  $this->desiredToActual;
    }

    /**
     * Builds the requested subfield image.
     * 
     * Extracts a region of the JP2 image, converts it into a .png file, and handles
     * any padding, resizing, and transparency. PNG is used as an intermediate format
     * due to lack of support for PGM files in GD.
     *
     * @TODO: Normalize quality scale.
     * 
     * @return void
     */
    protected function buildImage()
    {
        try {
            $grayscale    = substr($this->outputFile, 0, -3) . "pgm";
            $intermediate = substr($this->outputFile, 0, -3) . "png";

            // Extract region
            $this->sourceJp2->extractRegion($grayscale, $this->roi, $this->scaleFactor);

            $cmd = HV_PATH_CMD;

            // Generate grayscale image
            $toIntermediateCmd = $cmd . " convert $grayscale -depth 8 -quality 10 -type Grayscale ";

            // kdu_expand can only handle whole number values for -reduce
            if (fmod($this->scaleFactor, 1) != 0) {
                $toIntermediateCmd .= "-resize " . $this->subfieldRelWidth . "x" . $this->subfieldRelHeight . "! ";
            }

            exec(escapeshellcmd($toIntermediateCmd . $intermediate));
            //die($toIntermediateCmd . $intermediate);
            //echo($toIntermediateCmd . $intermediate . "<br><br>");

            //Apply color-lookup table
            if ($this->colorTable) {
                $this->_setColorPalette($intermediate, $this->colorTable, $intermediate);
            }

            // IM command for transparency, padding, rescaling, etc.
            if ($this->hasAlphaMask()) {
                $cmd = HV_PATH_CMD . " convert ";
            } else {
                $cmd = HV_PATH_CMD . " convert $intermediate -background black ";
            }

            // Get dimensions of extracted region (TODO: simpler to compute using roi + scaleFactor?)
            $extracted = $this->_getImageDimensions($intermediate);

            // if ($this->desiredToActual > 1) {
            //    $cmd .= $this->padImage($this->subfieldWidth, $this->subfieldHeight, $this->roi["left"], $this->roi["top"]);
            // } else if ($this->squareImage && (($this->subfieldWidth != $this->subfieldHeight) || (fmod($this->scaleFactor, 1) != 0))) {
            
            // Pad up the the relative tilesize (in cases where region extracted for outer tiles is smaller than for inner tiles)
            if ($this->desiredToActual > 1) {
                $cmd .= $this->_padImage($this->subfieldWidth, $this->subfieldHeight, $this->roi["left"], $this->roi["top"]);
            } else if ($this->squareImage && ($this->subfieldWidth != $this->subfieldHeight) ) {
                $cmd .= $this->_padTile($this->jp2Width, $this->jp2Height, $this->tileSize, $this->x, $this->y);
            }

            if ($this->hasAlphaMask()) {
                $cmd .= $this->applyAlphaMask($intermediate);
            }

            // Compression settings & Interlacing
            $cmd .= $this->setImageParams();

            // Execute command
            exec(escapeshellcmd("$cmd $this->outputFile"), $out, $ret);
            if ($ret != 0) {
                throw new Exception("Unable to apply final processing. Command: $cmd");
            }

            if ($this->outputFile != $intermediate) {
                unlink($intermediate);
            }

            unlink($grayscale);

        } catch(Exception $e) {
            $error = "[buildImage][" . date("Y/m/d H:i:s") . "]\n\t " . $e->getMessage() . "\n\n";
            file_put_contents(HV_ERROR_LOG, $error, FILE_APPEND);
            print $e->getMessage();

            //Clean-up and exit
            $this->abort($this->outputFile);
        }
    }

    /**
     * Pads a tile to the desired dimensions
     * 
     * @param int $jp2Width  JP2 base width
     * @param int $jp2Height JP2 base height
     * @param int $ts        Tilesize in pixelss
     * @param int $x         Tile x-coordinate
     * @param int $y         Tile y-coordinate
     * 
     * TODO: Move to Tile class
     * 
     * @return string Command to pad tile
     */
    private function _padTile ($jp2Width, $jp2Height, $ts, $x, $y)
    {
        // Determine min and max tile numbers
        $imgNumTilesX = max(2, ceil($this->jp2RelWidth  / $this->tileSize));
        $imgNumTilesY = max(2, ceil($this->jp2RelHeight / $this->tileSize));

        // Tile placement architecture expects an even number of tiles along each dimension
        if ($imgNumTilesX % 2 != 0) {
            $imgNumTilesX += 1;
        }

        if ($imgNumTilesY % 2 != 0) {
            $imgNumTilesY += 1;
        }

        $tileMinX = - ($imgNumTilesX / 2);
        $tileMaxX =   ($imgNumTilesX / 2) - 1;
        $tileMinY = - ($imgNumTilesY / 2);
        $tileMaxY =   ($imgNumTilesY / 2) - 1;

        // Determine where the tile is located (where tile should lie in the padding)
        $gravity = null;
        if ($x == $tileMinX) {
            if ($y == $tileMinY) {
                $gravity = "SouthEast";
            } else if ($y == $tileMaxY) {
                $gravity = "NorthEast";
            } else {
                $gravity = "East";
            }
        } else if ($x == $tileMaxX) {
            if ($y == $tileMinY) {
                $gravity = "SouthWest";
            } else if ($y == $tileMaxY) {
                $gravity = "NorthWest";
            } else {
                $gravity = "West";
            }
        } else {
            if ($y == $tileMinY) {
                $gravity = "South";
            } else {
                $gravity = "North";
            }
        }

        // Construct padding command
        return "-gravity $gravity -extent $ts" . "x" . "$ts ";
        //   return "-extent $ts" . "x" . "$ts ";
    }


    /**
     * Pads the subfield image
     * 
     * TODO: Move to relevent sub-classes (e.g. Tile and Screenshot)
     * 
     * If the image is a Tile, it is padded according to where it lies in the image.
     * If the image is a SubFieldImage, the image is padded with an offset from the NW corner.
     * 
     * @param int $width  Width to pad to
     * @param int $height Height to pad to
     * @param int $x      Tile x-coordinate
     * @param int $y      Tile y-coordinate
     * 
     * @return string Command to pad subfield image
     */
    private function _padImage ($width, $height, $x, $y)
    {
        //if($this->isTile) {

        // Determine min and max (i.e. outermost) tile numbers
        $imgNumTilesX = max(2, ceil($this->jp2RelWidth  / $this->subfieldWidth));
        $imgNumTilesY = max(2, ceil($this->jp2RelHeight / $this->subfieldHeight));

        // Tile placement architecture expects an even number of tiles along each dimension
        if ($imgNumTilesX % 2 != 0) {
            $imgNumTilesX += 1;
        }

        if ($imgNumTilesY % 2 != 0) {
            $imgNumTilesY += 1;
        }

        // Inner tiles are all tiles except the edge tiles (For four-tile case, all tiles are outer tiles)
        $numInnerTilesX = $imgNumTilesX - 2;
        $numInnerTilesY = $imgNumTilesY - 2;

        $tileMinX = ($this->jp2Width - ($this->subfieldRelWidth  * $numInnerTilesX)) / 2;
        $tileMaxX = ($this->jp2Width + ($this->subfieldRelWidth  * $numInnerTilesX)) / 2;
        $tileMinY = ($this->jp2Height - ($this->subfieldRelHeight * $numInnerTilesY)) / 2;
        $tileMaxY = ($this->jp2Height + ($this->subfieldRelHeight * $numInnerTilesY)) / 2;

        //        var_dump($this);
        //        print "x: $x<br> y: $y<br> imgNumTilesX: $imgNumTilesX<br> imgNumTilesY: $imgNumTilesY<br>";
        //        print "tileMinX: $tileMinX, tileMinY: $tileMinY<br>tileMaxX: $tileMaxX, tileMaxY: $tileMaxY<br><br>";
        //        exit();

        // Determine where the tile is located (where tile should lie in the padding)
        $gravity = null;

        if ($x < $tileMinX) {
            if ($y < $tileMinY) {
                $gravity = "SouthEast";
            } else if ($y == $tileMaxY) {
                $gravity = "NorthEast";
            } else {
                $gravity = "East";
            }
        } else if ($x == $tileMaxX) {
            if ($y < $tileMinY) {
                $gravity = "SouthWest";
            } else if ($y == $tileMaxY) {
                $gravity = "NorthWest";
            } else {
                $gravity = "West";
            }
        } else {
            if ($y < $tileMinY) {
                $gravity = "South";
            } else {
                $gravity = "North";
            }
        }

        $offset = " ";
        //}

        /*
         * If the item is a subfieldImage, it is assumed that the overall picture is larger than, but contains this image.
         * The image has a heliocentric offset and will be padded with that offset.
         */
        //        else {
        //            $gravity = "NorthWest";
        //            // Offset the image from the center using the heliocentric offset
        //            $offset  = $this->hcOffset["x"] . $this->hcOffset["y"] . " ";
        //        }cmd;
        //            exit();

        // Construct padding command
        // TEST: use black instead of transparent for background?
        return "-gravity $gravity -extent " . $width . "x" . $height . $offset;
    }


    /**
     * Sets the subfield image color lookup table (CLUT)
     * 
     * @param string $clut Location of the lookup table to use
     * 
     * @return void
     */
    protected function setColorTable($clut)
    {
        $this->colorTable = $clut;
    }

    /**
     * Enable/Disable alpha mask support
     * 
     * @param string $value Locatation of the base image to use for an alpha mask
     * 
     * @return void
     */
    protected function setAlphaMask($value)
    {
        $this->alphaMask = $value;
    }

    /**
     * Returns true if the image has an associated alpha mask
     * 
     * @return bool Whether or not the subfield image uses an associated alpha mask for transparent regions.
     */
    protected function hasAlphaMask()
    {
        return $this->alphaMask;
    }

    /**
     * Set Image Parameters
     * 
     * @return string Image compression and quality related flags.
     */
    protected function setImageParams()
    {
        $args = " -quality ";
        if ($this->format == "png") {
            $args .= HV_PNG_COMPRESSION_QUALITY . " -interlace plane -colors " . HV_NUM_COLORS;
        } else {
            $args .= HV_JPEG_COMPRESSION_QUALITY . " -interlace line";
        }
        $args .= " -depth " . HV_BIT_DEPTH . " ";

        return $args;
    }

    /**
     * Specify the subfield image is square
     * 
     * @param bool $value Whether or not the subfield is a square image
     * 
     * @return void
     */
    protected function setSquareImage($value)
    {
        $this->squareImage = $value;
    }

    /**
     * Handles clean-up in case something goes wrong to avoid mal-formed tiles from being displayed
     * 
     * @param string $filename Filename for aborted subfield image
     * 
     * @TODO: Close any open IM/GD file handlers
     * 
     * @return void
     */
    private function _abort($filename)
    {
        $pgm = substr($filename, 0, -3) . "pgm";
        $png = substr($filename, 0, -3) . "png";

        // Clean up
        if (file_exists($pgm)) {
            unlink($pgm);
        }
        if (file_exists($png)) {
            unlink($png);
        }
        if (file_exists($filename)) {
            unlink($filename);
        }

        if ($this->hasAlphaMask()) {
            $mask = substr($filename, 0, -4) . "-mask.tif";
        }
        if (file_exists($mask)) {
            unlink($mask);
        }

        die();
    }

    /**
     * Applies the specified color lookup table to the image using GD
     * 
     * Note: input and output are usually the same file.
     * 
     * @param string $input  Location of input image
     * @param string $clut   Location of the color lookup table to use
     * @param string $output Location to save new image to
     * 
     * @return void
     */
    private function _setColorPalette ($input, $clut, $output)
    {
        $gd = null;
        try {
            if (file_exists($input)) {
                $gd = imagecreatefrompng($input);
            } else {
                throw new Exception("Unable to apply color-table: $input does not exist.");
            }

            if (!$gd) {
                throw new Exception("Unable to apply color-table: $input is not a valid image.");
            }

        } catch(Exception $e) {
            $error = "[gd][" . date("Y/m/d H:i:s") . "]\n\t " . $e->getMessage() . "\n\n";
            file_put_contents(HV_ERROR_LOG, $error, FILE_APPEND);
            print $e->getMessage();

            die();
        }
        $ctable = imagecreatefrompng($clut);

        for ($i = 0; $i <= 255; $i++) {
            $rgba = imagecolorsforindex($ctable, $i);
            imagecolorset($gd, $i, $rgba["red"], $rgba["green"], $rgba["blue"]);
        }

        // Enable interlacing
        imageinterlace($gd, true);

        //$this->format == "jpg" ? imagejpeg($gd, $output, HV_JPEG_COMPRESSION_QUALITY) : imagepng($gd, $output);
        //if ($this->format == "jpg")
        //    imagejpeg($gd, $output, HV_JPEG_COMPRESSION_QUALITY);
        //else
        imagepng($gd, $output);

        // Cleanup
        if ($input != $output) {
            unlink($input);
        }
        imagedestroy($gd);
        imagedestroy($ctable);
    }

    /**
     * Displays the image on the page
     * 
     * @return void
     */
    public function display()
    {
        try {
            // Cache-Lifetime (in minutes)
            $lifetime = 60;
            $exp_gmt = gmdate("D, d M Y H:i:s", time() + $lifetime * 60) ." GMT";
            header("Expires: " . $exp_gmt);
            header("Cache-Control: public, max-age=" . $lifetime * 60);

            // Filename & Content-length
            if (isset($this->outputFile)) {
                $exploded = explode("/", $this->outputFile);
                $filename = end($exploded);

                $stat = stat($this->outputFile);
                header("Content-Length: " . $stat['size']);
                header("Content-Disposition: inline; filename=\"$filename\"");
            }

            if ($this->format == "png") {
                header("Content-Type: image/png");
            } else {
                header("Content-Type: image/jpeg");
            }

            if (!readfile($this->outputFile)) {
                throw new Exception("Error displaying $filename\n");
            }
        } catch (Exception $e) {
            $msg = "[PHP][" . date("Y/m/d H:i:s") . "]\n\t " . $e->getMessage() . "\n\n";
            file_put_contents(HV_ERROR_LOG, $msg, FILE_APPEND);
        }
    }

    /**
     * Calls the identify command in order to determine an image dimensions
     * 
     * @param string $filename The image filepath
     * 
     * @return array the width and height of the given image
     */
    private function _getImageDimensions($filename)
    {
        try {
            $cmd = HV_PATH_CMD . " identify $filename | grep -o \" [0-9]*x[0-9]* \"";

            $dimensions = preg_split("/x/", trim(exec(escapeshellcmd($cmd))));
            if (sizeof($dimensions) < 2) {
                throw new Exception("Unable to extract image dimensions for $filename!");
            } else {
                return array (
                    'width'  => (int)$dimensions[0],
                    'height' => (int)$dimensions[1]
                );
            }
        } catch (Exception $e) {
            $msg = "[PHP][" . date("Y/m/d H:i:s") . "]\n\t " . $e->getMessage() . "\n\n";
            file_put_contents(HV_ERROR_LOG, $msg, FILE_APPEND);
            $this->_abort($filename);
        }
    }
}
?>