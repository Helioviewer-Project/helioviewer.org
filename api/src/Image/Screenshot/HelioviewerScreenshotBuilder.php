<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Image_Screenshot_HelioviewerScreenshotBuilder class definition
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Jaclyn Beck <jabeck@nmu.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once 'HelioviewerScreenshot.php';
require_once HV_ROOT_DIR . '/api/src/Helper/LayerParser.php';
/**
 * Image_Screenshot_HelioviewerScreenshotBuilder class definition
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Jaclyn Beck <jabeck@nmu.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Image_Screenshot_HelioviewerScreenshotBuilder
{
    protected $maxWidth  = 1920;
    protected $maxHeight = 1080;
    
    /**
     * Does not require any parameters or setup.
     */
    public function __construct()
    {
    }
    
    /**
     * Prepares the parameters passed in from the api call and creates a screenshot from them.
     * 
     * @param array  $originalParams The original parameters passed in by the API call. These
     *                               are then merged with $defaults in case some of those
     *                               parameters weren't specified.
     * @param string $outputDir      The directory path where the screenshot will be stored.
     * @param array  $closestImages  An array of the closest images to the timestamp for this
     *                               screenshot, associated by sourceId as keys.
     *                              
     * @return string the screenshot
     */
    public function takeScreenshot($originalParams, $outputDir, $closestImages)
    {
        // Any settings specified in $this->_params will override $defaults
        $defaults = array(
            'edges'		  => false,
            'sharpen' 	  => false,
            'quality' 	  => 10,
            'display'	  => true,
            'watermarkOn' => true,
            'filename'    => false,
            'compress'    => false
        );
        $params = array_merge($defaults, $originalParams);
        
        $imageScale = $params['imageScale'];
        $width  	= ($params['x2'] - $params['x1']) / $imageScale;
        $height 	= ($params['y2'] - $params['y1']) / $imageScale;
        
        // Limit to maximum dimensions
        if ($width > $this->maxWidth || $height > $this->maxHeight) {
            $scaleFactor = min($this->maxWidth / $width, $this->maxHeight / $height);
            $width      *= $scaleFactor;
            $height     *= $scaleFactor;
            $imageScale /= $scaleFactor;
        }
        
        $options = array(
            'enhanceEdges'	=> $params['edges'] || false,
            'sharpen' 		=> $params['sharpen'] || false
        );
        
        $imageMeta = new Image_ImageMetaInformation($width, $height, $imageScale);

        $layerArray = $this->_createMetaInformation(
            $params['layers'],
            $imageScale, $width, $height, $closestImages
        );
        
        $screenshot = new Image_Screenshot_HelioviewerScreenshot(
            $params['obsDate'], 
            $imageMeta, $options, 
            $params['filename'], 
            $params['quality'], $params['watermarkOn'],
            array('top' => $params['y1'], 'left' => $params['x1'], 'bottom' => $params['y2'], 'right' => $params['x2']),
            $outputDir, $params['compress']
        );

        $screenshot->buildImages($layerArray);
        return $this->_displayScreenshot($screenshot->getComposite(), $originalParams, $params['display']);
    }
    
    /**
     * Searches the cache for screenshots related to the event and returns an array of filepaths if at least one
     * exists. If not, returns false
     * 
     * @param array  $originalParams the original parameters passed in by the API call
     * @param string $outputDir      the directory path to where the cached file should be stored
     * 
     * @return string
     */
    public function getScreenshotsForEvent($originalParams, $outputDir) 
    {
        $defaults = array(
           'ipod'    => false
        );
        $params = array_merge($defaults, $originalParams);
        
        $filename = "Screenshot_";
        if ($params['ipod'] === "true" || $params['ipod'] === true) {
            $outputDir .= "/iPod";
            $filename .= "iPhone_";
        } else {
            $outputDir .= "/regular";
        }
        
        $filename .= $params['eventId'];
        
        $images = glob($outputDir . "/" . $filename . "*.jpg");
        
        return $images;
    }
    
    /**
     * Creates a screenshot based upon an event, specified in $originalParams and
     * returns the filepath to the completed screenshot.
     * 
     * @param Array  $originalParams An array of parameters passed in by the API call
     * @param Array  $eventInfo      An array of parameters gotten from querying HEK
     * @param String $outputDir      The path to where the file will be stored
     * 
     * @return string
     */
    public function createForEvent($originalParams, $eventInfo, $outputDir)
    { 
        $defaults = array(
            'ipod'    => false
        );
        
        $params = array_merge($defaults, $originalParams);
        $params['display'] = false;
        $filename = "Screenshot_";
        if ($params['ipod'] === "true" || $params['ipod'] === true) {
            $outputDir .= "/iPod";
            $filename .= "iPhone_";
        } else {
            $outputDir .= "/regular";
        }

        $box = $this->_getBoundingBox($params, $eventInfo);
        $params['x1'] = $box['x1'];
        $params['x2'] = $box['x2'];
        $params['y1'] = $box['y1'];
        $params['y2'] = $box['y2'];

        $layers = $this->_getLayersFromParamsOrSourceIds($params, $eventInfo);
        $files  = array();

        foreach ($layers as $layer) {
        	$layerFilename = $filename . $params['eventId'] . $this->buildFilename(getLayerArrayFromString($layer));

            if (!HV_DISABLE_CACHE && file_exists($outputDir . "/" . $layerFilename . ".jpg")) {
                $files[] = $outputDir . "/" . $layerFilename . ".jpg";
            } else {
            	try {
                    $params['filename'] = $layerFilename;
                    $params['layers']   = $layer;
                    $files[] = $this->takeScreenshot($params, $outputDir, array());
            	} catch(Exception $e) {
                    // Ignore any exceptions thrown by takeScreenshot, since they
            		// occur when no image is made and we only care about images that
                    // are made.
            	}
            }
        }

        return $files;
    }
    
    private function _getBoundingBox($params, $eventInfo) {
    	$box = array();
    	
    	if (!isset($params['x1'])) {
    		$box = $eventInfo['boundingBox'];
    	} else {
    		$box['x1'] = $params['x1'];
    		$box['x2'] = $params['x2'];
    		$box['y1'] = $params['y1'];
    		$box['y2'] = $params['y2'];
    	}

    	return $this->_padToMinSize($box, $params['imageScale']);
    }
    
    private function _padToMinSize($box, $imageScale)
    {
        $minSize = (400 * $imageScale) / 2;
        $centerX = ($box['x1'] + $box['x2']) / 2;
        $centerY = ($box['y1'] + $box['y2']) / 2;
        
        $minX    = min($centerX - $minSize, $box['x1']);
        $minY    = min($centerY - $minSize, $box['y1']);
        $maxX    = max($centerX + $minSize, $box['x2']);
        $maxY    = max($centerY + $minSize, $box['y2']);
        
        return array(
            "x1" => $minX, 
            "x2" => $maxX, 
            "y1" => $minY, 
            "y2" => $maxY);
    }
    
    private function _getLayersFromParamsOrSourceIds($params, $eventInfo)
    {
    	$layers = array();

    	if (!isset($params['layers'])) {
    		$sourceIds = $eventInfo['sourceIds'];
    		foreach ($sourceIds as $source) {
    			$layers[] = "[" . $source . ",1,100]";
    		}
    	} else {
    		$layers[] = $params['layers'];
    	}
    	
    	return $layers;
    }

    /**
     * Takes in a layer string and formats it into an appropriate filename by removing square brackets
     * and extra information like visibility and opacity.
     * 
     * @param string $layers a string of layers in the format [layer],[layer]...
     * 
     * @return string
     */
    protected function buildFilename($layers)
    {
        $filename = "";
        foreach ($layers as $layer) {
            $filename .= "__" . extractLayerName($layer);
        }
        return $filename;
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

            $image = (sizeOf($closestImages) > 0? $closestImages[$sourceId] : false);

            if ($visible !== 0 && $visible !== "0") {
                $layerInfoArray = array(
                    'sourceId' 	   => $sourceId,
                    'width' 	   => $width,
                    'height'	   => $height,
                    'imageScale'   => $imageScale,
                    'opacity'	   => $opacity,
                    'closestImage' => $image
                );
                array_push($metaArray, $layerInfoArray);
            }
        }

        return $metaArray;
    }
    
    /**
     * Checks to see if the screenshot file is there and displays it either as an image/png or
     * as JSON, depending on where the request came from. 
     * 
     * @param {string}  $composite filepath to composite image
     * @param {Array}   $params    Array of parameters from the API call
     * @param {Boolean} $display   Whether to display the image or return its filepath
     * 
     * @return void
     */
    private function _displayScreenshot($composite, $params, $display) 
    {
        if (!file_exists($composite)) {
            throw new Exception('The requested screenshot is either unavailable or does not exist.');
        }

        if (($display === true || $display === "true") && $params == $_GET) {
            header('Content-type: image/png');
            echo file_get_contents($composite);
        } else if ($params == $_POST) {
            header('Content-type: application/json');
            // Replace '/var/www/helioviewer', or wherever the directory is,
            // with 'http://localhost/helioviewer' so it can be displayed.
            echo json_encode(str_replace(HV_ROOT_DIR, HV_WEB_ROOT_URL, $composite));
        } else {
            return $composite;
        }
    }
}
?>