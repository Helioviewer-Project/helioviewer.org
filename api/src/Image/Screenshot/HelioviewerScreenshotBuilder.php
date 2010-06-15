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

class Image_Screenshot_HelioviewerScreenshotBuilder 
{
	public function __construct()
	{
	}
	
	public function takeScreenshot($originalParams) {
    	// Any settings specified in $this->_params will override $defaults
    	$defaults = array(
			'edges'		=> false,
			'sharpen' 	=> false,
			'filename' 	=> "screenshot" . time() . ".png",
			'quality' 	=> 10,
    		'display'	=> true
		);
		$params = array_merge($defaults, $originalParams);
		
        $width  	= $params['width'];
        $height 	= $params['height'];
        $imageScale = $params['imageScale'];
        
        $options = array(
        	'enhanceEdges'	=> $params['edges'] || false,
        	'sharpen' 		=> $params['sharpen'] || false
        );
        
		$imageMeta = new Image_ImageMetaInformation($width, $height, $imageScale);

        $layerArray = $this->_createMetaInformation(
        	$params['layers'],
        	$imageScale, $width, $height
        );

        list($left,$top) 	 = explode(",", $params['offsetLeftTop']);
        list($right,$bottom) = explode(",", $params['offsetRightBottom']);
        
        $screenshot = new Image_Screenshot_HelioviewerScreenshot(
        	$params['obsDate'], 
        	$imageMeta, $options, 
        	$params['filename'] . ".png", 
        	$params['quality'],
        	array('top' => $top, 'left' => $left, 'bottom' => $bottom, 'right' => $right)
        );
        
        $screenshot->buildImages($layerArray);
        return $this->_displayScreenshot($screenshot->getComposite(), $originalParams, $params['display']);
	}

    /**
	 * _createMetaInformation
     * Takes the string representation of a layer from the javascript creates meta information for
     * each layer. 
     *
     * @param {Array} $layers -- a string of layers in the format:
     *     "sourceId,visible,opacity", 
     *     layers are separated by "/"
     * @param {float} $imageScale
     * @param {int} $width
     * @param {int} $height
     *
     * @return {Array} $metaArray -- The array containing one meta information 
     * object per layer
     */
    private function _createMetaInformation($layers, $imageScale, $width, $height)
    {
    	$layerStrings 	= explode("/", $layers);
        $metaArray 		= array();
        
        if (sizeOf($layerStrings) < 1) {
            throw new Exception('Invalid layer choices! You must specify at least 1 layer.');
        }
        
        foreach ($layerStrings as $layer) {
        	$layerArray = explode(",", $layer);
        	if(sizeOf($layerArray) > 4) {
				list($observatory, $instrument, $detector, $measurement, $visible, $opacity) = $layerArray;
				$sourceId = $this->_getSourceId($observatory, $instrument, $detector, $measurement);		
        	} else {
           		list($sourceId, $visible, $opacity) = $layerArray;
        	}
        	
        	if($visible) {     
	            $layerInfoArray = array(
	            	'sourceId' 	 => $sourceId,
	            	'width' 	 => $width,
	            	'height'	 => $height,
	            	'imageScale' => $imageScale,
	            	'opacity'	 => $opacity
	            );
	            array_push($metaArray, $layerInfoArray);
        	}
        }

        return $metaArray;
    }
    
    /**
     * Checks to see if the screenshot file is there and displays it either as an image/png or
     * as JSON, depending on where the request came from. 
     * @param {string} $composite -- filepath to composite image
     * @param {Array} $params -- Array of parameters from the API call
     * @return void
     */
    private function _displayScreenshot($composite, $params, $display) {
        if (!file_exists($composite)) {
            throw new Exception('The requested screenshot is either unavailable or does not exist.');
        }

        if ($display || $params == $_GET) {
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
    
    private function _getSourceId($obs, $inst, $det, $meas)
    {
        include_once HV_ROOT_DIR . '/api/src/Database/ImgIndex.php';
        $imgIndex = new Database_ImgIndex();
   		$result = $imgIndex->getSourceId($obs, $inst, $det, $meas);
        return $result;    	
    }
}