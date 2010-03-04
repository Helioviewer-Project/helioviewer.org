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
require_once 'SubFieldImage.php';
/**
 * Abstract class used for screenshots and movies. Handles most of the functionality and building.
 *
 * @category Image
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @author   Jaclyn Beck <jabeck@nmu.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
abstract class Image_CompositeImage
{
    protected $composite;
    protected $imageScale;
    protected $options;
    protected $imageSize;
    protected $tmpDir;
    protected $layerImages;
    protected $transImageDir;
    protected $compositeImageDir;

    /**
     * Instantiates a Image_CompositeImage object
     *
     * TODO 02/10/2010: In order to keep the composite image class as generic as possible, zoom-level
     * and other helioviewer- or solar-specific items should be handled else by child classes.
     *
     * @param int    $imageScale The requested image scale.
     * @param array  $options    An array with ["edges"] => true/false, ["sharpen"] => true/false
     * @param string $tmpDir     The temporary directory where images are cached
     */
    protected function __construct($imageScale, $options, $tmpDir)
    {
        //date_default_timezone_set('UTC');

        $this->imageScale = $imageScale;
        $this->options    = $options;
        $this->tmpDir     = $tmpDir;

        // Create the temp directory where images will be stored.
        // $this->tmpDir is determined in either the MovieFrame or Screenshot class.
        if (!file_exists($this->tmpDir)) {
            mkdir($this->tmpDir, 0777, true);
            chmod($this->tmpDir, 0777);
        }

        // Directory where all intermediate images with opacity levels of < 100 are created and stored
        $this->transImageDir = HV_CACHE_DIR . "transparent_images/";
        if (!file_exists($this->transImageDir)) {
            mkdir($this->transImageDir);
            chmod($this->transImageDir, 0777);
        }

        $this->compositeImageDir = HV_CACHE_DIR . "composite_images/";
        if (!file_exists($this->compositeImageDir)) {
            mkdir($this->compositeImageDir);
            chmod($this->compositeImageDir, 0777);
        }
    }

    /**
     * Builds each image separately and then composites them together if necessary.
     *
     * @return void
     */
    protected function compileImages()
    {
        // builtImages array holds the filepaths for all 'built' images.
        // opacities array holds the "opacityValue" and "opacityGroup" for each image.
        $builtImages = array();
        $opacities   = array("value" => array(), "group" => array());

        // At this point, layerImages should be an array of image strings
        try  {
            if (empty($this->layerImages)) {
                throw new Exception("Error: No valid layers specified in layerImages[" . $this->layerImages . "]");
            }

            // For each layer, extract info from the string and create a SubfieldImage out of it.
            // Add the subfield image to an array and add its opacity levels to another array
            foreach ($this->layerImages as $image) {
                // Each $image is a string: "uri,xStart,xSize,yStart,ySize,offsetX,offsetY,opacity,opacityGrp";
                $imageInfo = explode(",", $image);
                $uri = $imageInfo[0];

                $xRange = array("start" => $imageInfo[1], "size" => $imageInfo[2]);
                $yRange = array("start" => $imageInfo[3], "size" => $imageInfo[4]);

                $this->hcOffset = array("x" => $imageInfo[5], "y" => $imageInfo[6]);
                array_push($opacities["value"], $imageInfo[7]);
                array_push($opacities["group"], $imageInfo[8]);

                $subFieldImage = new Image_SubFieldImage($uri, $this->format, $this->imageScale, $xRange, $yRange, $this->imageSize, $this->hcOffset, $this->quality);
                $filepath = $subFieldImage->getCacheFilepath();

                if (!file_exists($filepath)) {
                    throw new Exception("Cached image $filepath does not exist.");
                }

                array_push($builtImages, $filepath);
            }
        }
        catch(Exception $e) {
            $error = "Unable to compile composite image layers: {$e->getMessage()}";
            logErrorMsg($error, true);
        }

        // All layers should be built, and $builtImages should contain all of the subfield images.
        // Composite images on top of one another if there are multiple layers.
        if (sizeOf($this->layerImages) > 1) {
            $this->composite = $this->_buildComposite($builtImages, $opacities);
        } elseif (isset($this->frameNum)) {
            // If the image is identified by a frameNum, just copy the image to the movie directory
            $builtImages[0] = $this->_watermark($builtImages[0]);
            $cacheImg = $this->cacheFileDir . $this->frameNum . ".tif";
            copy($builtImages[0], $cacheImg);
            $this->composite = $cacheImg;
        } else {
            // Otherwise, the image is a screenshot and needs to be converted into a png.
            $builtImages[0] = $this->_watermark($builtImages[0]);
            $cmd = HV_PATH_CMD . " && convert " . $builtImages[0] . " " . $this->cacheFileDir . $this->id . ".png";
            exec(escapeshellcmd($cmd), $out, $ret);

            $this->composite = $this->cacheFileDir . $this->id . ".png";
        }

        //Optional settings
        /*if ($this->options['enhanceEdges'] == "true") {
            $this->composite->edgeImage(3);
        }

        if ($this->options['sharpen'] == "true") {
            $this->composite->adaptiveSharpenImage(2,1);
        }
        */
    }

    /**
     * Composites a watermark (the timestamps of the image) onto the lower left corner.
     *
     * Layer names are added togeter as one string, and timestamps are added as a separate string,
     * to line them up nicely. An example string would  be:
     *
     *      -annotate +20+0 'EIT 304\nLAS C2 WL\n'
     *
     * and:
     *
     *      -annotate +100+0 '2003-01-01 12:00\n2003-01-01 11:30\n'
     *
     * These two strings are then layered on top of each other and put in the southwest corner of the image.
     *
     * @param string $image Filepath to the image to be watermarked
     *
     * @return string $image The filepath to the watermarked image
     */
    private function _watermark($image)
    {
        $watermark = "resources/images/watermark_small_gs.png";

        // If the image is too small, use only the circle, not the url, and scale it so it fits the image.
        if ($this->imageSize['width'] / 300 < 2) {
            $watermark = "resources/images/watermark_circle_small.png";
            // Scale the watermark to half the size of the image, and covert it to a percentage.
            $scale = ($this->imageSize['width'] * 100 / 2) / 300;
            $resize = HV_PATH_CMD . " && convert -scale " . $scale . "% " . $watermark . " " . $this->compositeImageDir . "watermark_scaled.png";

            exec(escapeshellcmd($resize));
            $watermark = $this->compositeImageDir . "watermark_scaled.png";
        }

        exec(escapeshellcmd(HV_PATH_CMD . " && composite -gravity SouthEast -dissolve 60% -geometry +10+10 " . $watermark . " " . $image . " " . $image, $out, $ret));

        // If the image is too small, text won't fit. Don't put a timestamp on it. 235x235 is very small
        // and probably will not be requested anyway.
        if ($this->imageSize['width'] < 235) {
            return $image;
        }

        $cmd = HV_PATH_CMD . " && convert " . $image . " -gravity SouthWest";
        $nameCmd = "";
        $timeCmd = "";

        // Put the names on first, then put the times on as a separate layer so the times are nicely aligned.
        foreach ($this->timestamps as $key => $time) {
            $rawName = explode('_', $key);
            $obs  = $rawName[0];
            $inst = $rawName[1];
            $det  = $rawName[2];
            $meas = $rawName[3];

            // Decide what to include in the name. EIT and MDI only need detector and measurement
            if ($inst === $det) {
                $name = $det . " " . $meas;
            } else {
                 // LASCO needs instrument detector and measurement. Take out the 0's in 0C2/0C3 and 0WL
                $name = $inst . " " . str_replace("0", "", $det) . " " . str_replace("0", "", $meas);
            }

            $nameCmd .= $name . "\n";

            // Get rid of seconds, since they don't really matter and it makes time more readable
            // Add extra spaces between date and time for readability.
            $time = str_replace(" ", "   ", substr($time, 0, -3));
            $timeCmd .= $time . "\n";
        }

        // Outline words in black
        $cmd .= " -stroke '#000C' -strokewidth 2 -annotate +20+0 '" . $nameCmd;
        // Write words in white over outline
        $cmd .= "' -stroke none -fill white -annotate +20+0 '" . $nameCmd;
        // Outline words in black
        $cmd .= "' -stroke '#000C' -strokewidth 2 -annotate +100+0 '" . $timeCmd;
        // Write words in white
        $cmd .= "' -stroke none -fill white -annotate +100+0 '" . $timeCmd . "' -type TrueColor -alpha off " . $image;

        exec(escapeshellcmd($cmd));

        return $image;
    }

    /**
     * Composites the layers on top of each other after putting them in the proper order.
     *
     * @param array $images    The image layers to composite
     * @param array $opacities The opacities to use for each layer in the composite
     *
     * @return string Filepath to the composited image
     */
    private function _buildComposite($images, $opacities)
    {
        // Put images into the order they will be composited onto each other.
        // sortedImages is an array of image info arrays. Each image info array has the keys
        // "image" (the filepath of the image) and "opacity" (opacity value of the image)
        $sortedImages = $this->_sortByLayeringOrder($images, $opacities["group"], $opacities["value"]);

        if (isset($this->frameNum)) {
            $tmpImg = $this->cacheFileDir . $this->frameNum . ".tif";
        } else {
            $tmpImg = $this->cacheFileDir . $this->id . ".png";
        }

        $cmd = HV_PATH_CMD . " && composite -gravity Center";

        // It is assumed that the array $images is already in the correct order for opacity groups,
        // since it was sorted above.
        $i = 1;
        foreach ($sortedImages as $image) {
            $img = $image["image"];
            $op  = $image["opacity"];

            // If the image has an opacity level of less than 100, need to set its opacity.
            if ($op < 100) {
                // Get the image's uri
                $imgFilepath = explode("/", $img);
                $imgUri = array_pop($imgFilepath);

                $tmpOpImg = $this->transImageDir . substr($imgUri, 0, -4) . "-op" . $op . ".tif";

                // If it's not in the cache, make it
                if (!file_exists($tmpOpImg)) {
                    $opacityCmd = HV_PATH_CMD . " && convert $img -alpha on -channel o -evaluate set $op% $tmpOpImg";
                    exec(escapeshellcmd($opacityCmd));
                }

                $img = $tmpOpImg;
            }

            $cmd .= " " . $img;

            // If there are more than 2 layers, then the composite command needs to be called after every layer,
            // compositing the last composite image and the current image.
            if ($i > 1 && isset($sortedImages[$i])) {
                $tmpCompImg = $this->compositeImageDir . time() . "-comp.tif";
                $cmd .= " -compose dst-over $tmpCompImg && composite -gravity Center $tmpCompImg";
            }
            $i++;
        }
        $cmd .= " -compose dst-over -depth 8 -quality 10 " . $tmpImg;

        try {
            exec(escapeshellcmd($cmd), $out, $ret);
            if ($ret != 0) {
                throw new Exception("Error executing command $cmd.");
            }

            exec(escapeshellcmd(HV_PATH_CMD . " && convert $tmpImg -background black -alpha off $tmpImg"), $out, $ret);
            if ($ret != 0) {
                throw new Exception("Error turning alpha channel off on $tmpImg.");
            }
        }
        catch(Exception $e) {
           logErrorMsg($e->getMessage(), true);
        }
        $tmpImg = $this->_watermark($tmpImg);
        return $tmpImg;
    }

    /**
     * Sorts the layers by their associated layering order
     *
     * Layering orders that are supported currently are 3 (C3 images), 2 (C2 images), 1 (EIT/MDI images).
     * The array is sorted like this: 3, 2, 1(layer order that the user has in their viewport).
     * The parameters "$images" and "$opacities" are each an array_reverse of the arrays they came from.
     *
     * @param array $images        Composite image layers
     * @param array $layerOrders   Image layer layering orders
     * @param array $opacityValues layer opacities
     *
     * @return array Array containing the sorted image layers
     */
    private function _sortByLayeringOrder($images, $layerOrders, $opacityValues)
    {
        $sortedImages = array();

        /* Multisort sorts by layering order and by value, which is not good, because the order of layers with
         * layering order 1 needs to be preserved.
         *
         * Example:
         *
         * If the bottom layer is EIT 100% opacity, and the next layer is MDI 25%, and the top layer
         * is another EIT 60%, we do not want to sort this because the picture will come out differently
         * (EIT 100%, EIT 60%, MDI 25%) than what the user was looking at.
         */
        $i = 0;

        // Array to hold any images with layering order 2 or 3.
        // These images must go in the sortedImages array last because of how compositing works.
        $groups = array("2" => array(), "3" => array());

        // Push all layering order 1 images into the sortedImages array,
        // push layering order 2 and higher into separate array.
        foreach ($layerOrders as $layerOrder) {
            if ($layerOrder > 1) {
                array_push($groups[$layerOrder], array("image" => $images[$i], "opacity" => $opacityValues[$i]));
            } else {
                array_push($sortedImages, array("image" => $images[$i], "opacity" => $opacityValues[$i]));
            }
            $i++;
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
     * Writes the composite image to the cache
     *
     * @param string $filepath The location to save the image to.
     *
     * @return void
     */
    public function writeImage($filepath)
    {
        $this->composite->writeImage($filepath);
    }

    /**
     * Returns the timestamps for each layer in the composite image
     *
     * @return array layer timestamps
     */
    public function timestamps()
    {
        return $this->timestamps;
    }

    /**
     * Returns the number of layers in the composite image
     *
     * @return int number of layers
     */
    public function numFrames()
    {
        return sizeOf($this->timestamps);
    }

    /**
     * Builds a directory string for the given layer
     *
     * @param string $uri JP2 image location
     *
     * @return string Image filepath
     */
    protected function getFilepath($uri)
    {
        // Extract the relevant data from the image uri (excluding the .jp2 at the end)
        $uriData = explode("_", substr($uri, 0, -4));
        $year      = $uriData[0];
        $month      = $uriData[1];
        $day      = $uriData[2];
        // Skip over the unix timestamp in the middle
        $obs      = $uriData[4];
        $inst       = $uriData[5];
        $det      = $uriData[6];
        $meas      = $uriData[7];

        $path  = HV_JP2_DIR . implode("/", array($year, $month, $day));
        $path .= "/$obs/$inst/$det/$meas/";
        $path .= $uri;

        return $path;
    }

    /**
     * Creates a composite image starting from an image query
     *
     * @param array $params Query parameters
     *
     * @return Image_CompositeImage composited image
     */
    public static function compositeImageFromQuery($params)
    {
        //Process query string
        try {
            // Extract timestamps
            $timestamps = explode(",", $this->params['timestamps']);
            if (strlen($this->params['timestamps']) == 0) {
                throw new Exception("Error: Incorrect number of timestamps specified!");
            }

            // Region of interest
            $x = explode(",", $this->params['xRange']);
            $y = explode(",", $this->params['yRange']);

            $xRange = array();
            $xRange['start'] = $x[0];
            $xRange['size']   = $x[1];

            $yRange = array();
            $yRange['start'] = $y[0];
            $yRange['size']   = $y[1];

            // Zoom-level & tilesize
            $imageScale = $this->params['imageScale'];
            $tileSize  = $this->params['tileSize'];

            // Construct layers
            $layers = array();
            $i = 0;
            foreach (explode(",", $this->params['layers']) as $layer) {
                array_push($layers, new Layer($layer, $timestamps[$i], $timestamps[$i], $imageScale, $xRange, $yRange, $tileSize));
                $i++;
            }

            // Limit to 3 layers
            if ((sizeOf($layers) > 3) || (strlen($this->params['layers']) == 0)) {
                throw new Exception("Error: Invalid layer choices! You must specify 1-3 command-separate layernames.");
            }

            // Optional parameters
            $options = array();
            $options["edgeEnhance"] = $this->params['edges'];
            $options["sharpen"]     = $this->params['sharpen'];
        }
        catch(Exception $e) {
            echo 'Error: ' .$e->getMessage();
            exit();
        }

        $returnimage = new Image_CompositeImage($layers, $imageScale, $xRange, $yRange, $options);
        return $returnimage;
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
