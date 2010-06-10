<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Image_CompositeImage class definition
 *
 * PHP version 5
 *
 * @category Composite
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @author   Jaclyn Beck <jabeck@nmu.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once HV_ROOT_DIR . '/api/src/Image/SubFieldImage.php';
require_once HV_ROOT_DIR . '/api/src/Image/ImageMetaInformation.php';

abstract class Image_Composite_CompositeImage
{
    protected $composite;
    protected $options;
    protected $imageSize;
    protected $tmpDir;
    protected $layerImages;
    protected $transImageDir;
    protected $compositeImageDir;
    protected $metaInfo;

    /**
     * Instantiates a Image_CompositeImage object
     *
     * @param ImageMetaInformation $meta -- Meta information object that holds information like width, height, scale
     * @param array  $options    An array with ["edges"] => true/false, ["sharpen"] => true/false
     * @param string $tmpDir     The temporary directory where images are cached
     * @param string $filename	 Desired filename of the output
     */
    protected function __construct($meta, $options, $tmpDir, $filename)
    {
        //date_default_timezone_set('UTC');
        $this->metaInfo   = $meta;
        $this->options    = $options;
        $this->tmpDir     = $tmpDir;
		$this->_setOutputFile($filename);

        $this->transImageDir = HV_CACHE_DIR . "/transparent_images/";
        $this->compositeImageDir = HV_CACHE_DIR . "/composite_images/";
        
		$this->_makeDirectory($this->tmpDir);
		$this->_makeDirectory($this->transImageDir);
		$this->_makeDirectory($this->compositeImageDir);
    }
    
    protected function _makeDirectory($directory) 
    {
        if (!file_exists($directory)) {
            mkdir($directory, 0777, true);
            chmod($directory, 0777);
        }
    }
    
    /**
     * Builds each image separately and then composites them together if necessary.
     *
     * @return void
     */
    protected function compileImages()
    {
        // opacities array holds the "opacityValue" and "opacityGroup" for each image.
        $opacities   = array("value" => array(), "group" => array());

        try  {
            if (empty($this->layerImages)) {
                throw new Exception("Error: No valid layers specified in layerImages[" . $this->layerImages . "]");
            }

            // Composite images on top of one another if there are multiple layers.
	        if (sizeOf($this->layerImages) > 1) {
	            $this->composite = $this->_buildComposite($opacities);
	        } else {
	            // Otherwise, the image is a screenshot and needs to be watermarked.
	            $this->composite = $this->_watermark($this->layerImages[0]);
	        }
		    //Optional settings
	        /*if ($this->options['enhanceEdges'] == "true") {
	            $this->composite->edgeImage(3);
	        }
	
	        if ($this->options['sharpen'] == "true") {
	            $this->composite->adaptiveSharpenImage(2,1);
	        }
	        */
        } catch(Exception $e) {
            $error = "Unable to compile composite image layers: {$e->getMessage()}";
            logErrorMsg($error, true);
        }
    }

    /**
     * Composites a watermark (the timestamps of the image) onto the lower left corner and the HV logo in the
     * lower right corner.
     *
     * Layer names are added togeter as one string, and timestamps are added as a separate string,
     * to line them up nicely. An example string would  be:
     *
     *      -annotate +20+0 'EIT 304\nLASCO C2\n'
     * and:
     *      -annotate +100+0 '2003-01-01 12:00\n2003-01-01 11:30\n'
     *
     * These two strings are then layered on top of each other and put in the southwest corner of the image.
     *
     * @param CompositeImageLayer $imageLayer
     *
     * @return string $image The filepath to the watermarked image
     */
    
    private function _watermark($imageLayer)
    {
        $watermark 	 = HV_ROOT_DIR . "/api/resources/images/watermark_small_gs.png";
		$imageWidth  = $this->metaInfo->width();
		$image 		 = $imageLayer->getFilePathString();
		
        // If the image is too small, use only the circle, not the url, and scale it so it fits the image.
        if ($imageWidth / 300 < 2) {
        	$watermark = $this->_waterMarkSmall($imageWidth);
        }

        exec(escapeshellcmd(HV_PATH_CMD . " composite -gravity SouthEast -dissolve 60% -geometry +10+10 " . $watermark . " " . $image . " " . $image));

        // If the image is too small, text won't fit. Don't put a timestamp on it. 
        if ($imageWidth < 235) {
            return $image;
        }

        $cmd = HV_PATH_CMD . "convert " . $image . " -gravity SouthWest" . $this->getWaterMarkText();
        $cmd .= " -type TrueColor -alpha off " . $image;

        exec(escapeshellcmd($cmd));

        return $image;
    }
    
    /**
     * Fetch the small watermark image and scale it to fit the composite image. 
     * @param {int} $imageWidth -- The width of the composite image.
     * @return {string} the filepath to the scaled watermark image
     */
    private function _waterMarkSmall($imageWidth) {
    	$watermark = HV_ROOT_DIR . "/api/resources/images/watermark_circle_small.png";

        $scale = ($imageWidth * 100 / 2) / 300;
        $resize = HV_PATH_CMD . "convert -scale " . $scale . "% " . $watermark . " " . $this->compositeImageDir . "watermark_scaled.png";
        exec(escapeshellcmd($resize));
        return $this->compositeImageDir . "watermark_scaled.png";
    }
    
    /**
     * In cases where movie frames are being generated, the naming system of adding time() to the end
     * of the filename sometimes overwrites duplicate files if they are created fast enough. This checks
     * to see if the filename is already being used and will recursively append "_" to the name until
     * a unique filename is found. 
     * @param {string} $filename 
     * @return void
     */
    private function _setOutputFile($filename) {
    	if(file_exists($this->tmpDir . "/" . $filename)) {
    		$filename = substr($filename, 0, -4) . "_.png";
    		$this->_setOutputFile($filename);
    	}
    	else
    		$this->outputFile = $filename;
    }

    /**
     * Composites the layers on top of each other after putting them in the proper order.
     *
     * @param array $opacities The opacities to use for each layer in the composite
     * @return string Filepath to the composited, watermarked image
     */
    private function _buildComposite($opacities)
    {
        $sortedImages = $this->layerImages;//$this->_sortByLayeringOrder($images, $opacities["group"], $opacities["value"]);
		$tmpImg = $this->tmpDir . "/" . $this->outputFile;

        $cmd = HV_PATH_CMD . "composite -gravity Center";

        $layerNum = 1;
        foreach ($sortedImages as $image) {
/*            $img = $image["image"];
            $op  = $image["opacity"];

            // If the image has an opacity level of less than 100, need to set its opacity.
            if ($op < 100) {
                // Get the image's uri
                $imgFilepath = explode("/", $img);
                $imgUri = array_pop($imgFilepath);

                $tmpOpImg = $this->transImageDir . substr($imgUri, 0, -4) . "-op" . $op . ".tif";

                // If it's not in the cache, make it
                if (!file_exists($tmpOpImg)) {
                    $opacityCmd = HV_PATH_CMD . "convert $img -alpha on -channel o -evaluate set $op% $tmpOpImg";
                    exec(escapeshellcmd($opacityCmd));
                }

                $img = $tmpOpImg;
            }
*/
            $cmd .= " " . $image->getFilePathString();
    
            // If there are more than 2 layers, then the composite command needs to be called after every layer,
            // compositing the last composite image and the current image.
            if ($layerNum > 1 && isset($sortedImages[$layerNum])) {
                $tmpCompImg = $this->tmpDir . "/" . time() . "-comp.tif";
                $cmd .= " -compose dst-over $tmpCompImg && composite -gravity Center $tmpCompImg";
            }
            $layerNum++;
        }

        $cmd .= " -compose dst-over -depth 8 -quality 10 " . $tmpImg;

        try {
        	// Need to break $cmd into pieces at each "&&", because escapeshellcmd escapes & and the command doesn't work then.
        	$commands = explode("&&", $cmd);
        	foreach($commands as $command) {
	            exec(escapeshellcmd($command), $out, $ret);
	            if ($ret != 0) {
	                throw new Exception("Error executing command $cmd.");
	            }
        	}

            exec(escapeshellcmd(HV_PATH_CMD . "convert $tmpImg -background black -alpha off $tmpImg"), $out, $ret);
            if ($ret != 0) {
                throw new Exception("Error turning alpha channel off on $tmpImg.");
            }
        }
        catch(Exception $e) {
            logErrorMsg($e->getMessage(), true);
        }
        
		$image = $sortedImages[0];
		$image->setNewFilePath($tmpImg);
        return $this->_watermark($image);
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

    public function compositeImageFromImageArray($images) 
    {
    	$this->layerImages = $images;
    	$this->compileImages();
    }
    /**
     * OUTDATED
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
