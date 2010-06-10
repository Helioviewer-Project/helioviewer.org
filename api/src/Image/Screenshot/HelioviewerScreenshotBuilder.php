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
require_once HV_ROOT_DIR . '/api/src/Image/HelioviewerImageMetaInformation.php';

class Image_Screenshot_HelioviewerScreenshotBuilder 
{
	public function __construct()
	{
	}
	
	public function takeScreenshot($params) {
        $width  = $params['width'];
        $height = $params['height'];
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
        
        $screenshot = new Image_Screenshot_HelioviewerScreenshot(
        	$params['obsDate'], 
        	$imageMeta, $options, 
        	$params['filename'], 
        	$params['quality']
        );
        
        $screenshot->buildImages($layerArray);

        return $this->_displayScreenshot($screenshot->getComposite(), $params);
	}
	
	public function takeFullImageScreenshot($params) {
    	$options = array(
        	'enhanceEdges'	=> false,
        	'sharpen' 		=> false
        );
        $layers = explode("/", $params['layers']);
        
        $imageMeta = new Image_ImageMetaInformation(
        	$params['width'], 
        	$params['height'], 
        	$params['imageScale']
        );

        /*
         * @TODO Don't hardcode bottom and right! These numbers work for SOHO images but will break on SDO.
         */
        $roi = array(
        	'top' 	 => 0,
        	'left' 	 => 0,
        	'bottom' => 1024,
        	'right'	 => 1024
        );
        
        $metaArray = array();
        foreach ($layers as $layer) {
        	$layerArray = explode(",", $layer);
	        if(sizeOf($layerArray) > 1) {
				list($observatory, $instrument, $detector, $measurement) = $layerArray;
				$sourceId = $this->_getSourceId($observatory, $instrument, $detector, $measurement);		
	        } else 
	        {
				$sourceId = $layer;
	        }
            $layerInfoArray = array(
            	'sourceId' 	 => $sourceId,
            	'width' 	 => $params['width'],
            	'height'	 => $params['height'],
            	'imageScale' => $params['imageScale'],
            	'roi' 		 => $roi,
            	'offsetX' 	 => 0,
            	'offsetY' 	 => 0
            );
            array_push($metaArray, $layerInfoArray);
        }
        
        $screenshot = new Image_Screenshot_HelioviewerScreenshot(
        	$params['obsDate'], 
        	$imageMeta, $options, 
        	"screenshot" . time() . ".png", 10
        );
        
        $screenshot->buildImages($metaArray);

        return $this->_displayScreenshot($screenshot->getComposite(), $params);
	}

    /**
	 * _createMetaInformation
     * Takes the string representation of a layer from the javascript creates meta information for
     * each layer. 
     *
     * @param {Array} $layers -- a string of layers in the format:
     *     "sourceId,visible,opacity,xStart,xSize,yStart,ySize,offsetX,offsetY", 
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
        	if(sizeOf($layerArray) > 10) {
				list(
					$observatory, $instrument, $detector, $measurement, $visible, $opacity,
					$xStart, $xSize, $yStart, $ySize, $offsetX, $offsetY
				) = $layerArray;
				$sourceId = $this->_getSourceId($observatory, $instrument, $detector, $measurement);		
        	}
        	
        	else 
        	{
           		list(
           			$sourceId, $visible, $opacity, $xStart, $xSize, $yStart, $ySize, 
           			$offsetX, $offsetY
           		) = $layerArray;
        	}
        	
			$roi = array(
            	'top' 	 => $yStart,
            	'left' 	 => $xStart,
            	'bottom' => $yStart + $ySize,
            	'right'	 => $xStart + $xSize
            );
            //$metaObject = new Image_HelioviewerImageMetaInformation($width, $height, $imageScale, $obs, $inst, $det, $meas, $roi, $offsetX, $offsetY);

            $layerInfoArray = array(
            	'sourceId' 	 => $sourceId,
            	'width' 	 => $xSize,
            	'height'	 => $ySize,
            	'imageScale' => $imageScale,
            	'roi' 		 => $roi,
            	'offsetX' 	 => $offsetX,
            	'offsetY' 	 => $offsetY
            );
            array_push($metaArray, $layerInfoArray);
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
    private function _displayScreenshot($composite, $params) {
        if (!file_exists($composite)) {
            throw new Exception('The requested screenshot is either unavailable or does not exist.');
        }

       /* if ($params == $_GET) {
            header('Content-type: image/png');
            echo file_get_contents($composite);
        }*/ if ($params == $_POST) {
            header('Content-type: application/json');
            // Replace '/var/www/helioviewer', or wherever the directory is,
            // with 'http://localhost/helioviewer' so it can be displayed.
            echo json_encode(str_replace(HV_ROOT_DIR, HV_WEB_ROOT_URL, $composite));
        } else {
			header('Content-type: image/png');
            echo file_get_contents($composite);;
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