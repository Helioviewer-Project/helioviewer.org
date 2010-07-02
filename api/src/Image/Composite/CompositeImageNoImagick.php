<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Image_CompositeImageNoImagick class definition
 * This class uses command-line imagemagick commands rather than php imagick to do image processing.
 * Can be used instead of CompositeImage.php if Imagick does not work.
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
require_once HV_ROOT_DIR . '/api/src/Image/Composite/CompositeImage.php';
/**
 * Image_CompositeImageNoImagick class definition
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
abstract class Image_Composite_CompositeImageNoImagick extends Image_Composite_CompositeImage
{
    /**
     * Instantiates a Image_CompositeImage object
     *
     * @param object $meta     Meta information object that holds information like width, height, scale
     * @param array  $options  An array with ["edges"] => true/false, ["sharpen"] => true/false
     * @param string $tmpDir   The temporary directory where images are cached
     * @param string $filename Desired filename of the output
     */
    protected function __construct($meta, $options, $tmpDir, $filename)
    {
        parent::__construct($meta, $options, $tmpDir, $filename);
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
                throw new Exception("Error: No valid layers specified in layerImages[" . $this->layerImages . "]");
            }

            // Composite images on top of one another if there are multiple layers.
            if (sizeOf($this->layerImages) > 1) {
                $this->composite = $this->_buildComposite();
            } else {
                // Otherwise, the image has one layer and just needs to be watermarked.
                $imagickImage = new IMagick($this->layerImages[0]->getFilePathString());
                $output = $this->tmpDir . "/$this->outputFile";

                if ($this->watermarkOn === true || $this->watermarkOn === "true") {
                    $this->_watermark($this->layerImages[0]);
                }

                $this->composite = $output; 
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
     * @param CompositeImageLayer $imageLayer A built CompositeImageLayer
     *
     * @return void
     */    
    private function _watermark($imageLayer)
    {
        $watermark   = HV_ROOT_DIR . "/api/resources/images/watermark_small_gs.png";
        $imageWidth  = $this->metaInfo->width();
        $imageHeight = $this->metaInfo->height();
        $image       = $imageLayer->getFilePathString();
        
        // If the image is too small, use only the circle, not the url, and scale it so it fits the image.
        if ($imageWidth / 300 < 2) {
            $watermark = $this->_watermarkSmall($imageWidth);
        }

        exec(escapeshellcmd(HV_PATH_CMD . " composite -gravity SouthEast -dissolve 60% -geometry +10+10 " . $watermark . " " . $image . " " . $image));

        // If the image is too small, text won't fit. Don't put a timestamp on it. 
        if ($imageWidth < 285) {
            return $image;
        }

        $cmd = HV_PATH_CMD . "convert " . $image . " -gravity SouthWest" . $this->addWaterMarkTextNoImagick();
        $cmd .= " -type TrueColor -alpha off -colors 256 -depth 8 " . $image;

        exec(escapeshellcmd($cmd));

        return $image;    	
    }
    
    /**
     * Fetch the small watermark image and scale it to fit the composite image. 
     * 
     * @param {int} $imageWidth -- The width of the composite image.
     * 
     * @return {string} the filepath to the scaled watermark image
     */
    private function _waterMarkSmall($imageWidth)
    {
        $watermark = HV_ROOT_DIR . "/api/resources/images/watermark_circle_small.png";

        $scale = ($imageWidth * 100 / 2) / 300;
        $resize = HV_PATH_CMD . "convert -scale " . $scale . "% " . $watermark . " " . $this->cacheDir . "watermark_scaled.png";
        
        exec(escapeshellcmd($resize));
        return $this->cacheDir . "watermark_scaled.png";
    }
    
    /**
     * Composites the layers on top of each other after putting them in the proper order.
     * 
     * @return string Filepath to the composited, watermarked image
     */
    private function _buildComposite()
    {
        $sortedImages   = $this->_sortByLayeringOrder($this->layerImages);
        $tmpImg         = $this->tmpDir . "/" . $this->outputFile;
        $filesToDelete  = array();

        $cmd = HV_PATH_CMD . "composite -gravity Center";

        $layerNum = 1;
        foreach ($sortedImages as $image) {
            $opacity = $image->opacity();
            // If the image has an opacity level of less than 100, need to set its opacity.
            if ($opacity < 100) {
                $file     = $image->getFilePathString();
                $tmpOpImg = substr($file, 0, -4) . "-op" . $opacity . ".tif";

                $opacityCmd = HV_PATH_CMD . "convert $file -alpha on -channel o -evaluate set $opacity% $tmpOpImg";
                exec(escapeshellcmd($opacityCmd));

                $image->setNewFilepath($tmpOpImg);
                array_push($filesToDelete, $tmpOpImg);
            }

            $cmd .= " " . $image->getFilePathString();

            // If there are more than 2 layers, then the composite command needs to be called after every layer,
            // compositing the last composite image and the current image.
            if ($layerNum > 1 && isset($sortedImages[$layerNum])) {
                $tmpCompImg = $this->tmpDir . "/" . time() . "-comp.tif";
                
                $cmd .= " -compose dst-over $tmpCompImg && composite -gravity Center $tmpCompImg";
                array_push($filesToDelete, $tmpCompImg);
            }
            $layerNum++;
        }
        $cmd .= " -compose dst-over -depth 8 -quality 10 " . $tmpImg;

        try {
            // Need to break $cmd into pieces at each "&&", because escapeshellcmd escapes & and the command doesn't work then.
            $commands = explode("&&", $cmd);
            foreach ($commands as $command) {
                exec(escapeshellcmd($command), $out, $ret);
                if ($ret != 0) {
                    throw new Exception("Error executing command $cmd.");
                }
            }

            exec(escapeshellcmd(HV_PATH_CMD . "convert $tmpImg -background black -alpha off -colors 256 -depth 8 $tmpImg"), $out, $ret);
            if ($ret != 0) {
                throw new Exception("Error turning alpha channel off on $tmpImg.");
            }
        }
        catch(Exception $e) {
            logErrorMsg($e->getMessage(), true);
        }
        
        $image = $sortedImages[0];
        $image->setNewFilePath($tmpImg);
        
        $this->_cleanUp($filesToDelete);
        if ($this->watermarkOn === true || $this->watermarkOn === "true") {
            return $this->_watermark($image);
        }
        return $image;    	
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
}
?>
