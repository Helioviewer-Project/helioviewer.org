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
        $layerMetaArray = $this->_createMetaInformation(
        	$params['layers'],
        	$imageScale, $width, $height
        );
        
        $screenshot = new Image_Screenshot_HelioviewerScreenshot(
        	$params['obsDate'], 
        	$imageMeta, $options, 
        	$params['filename'], 
        	$params['quality']
        );
        
        $screenshot->buildImages($layerMetaArray);

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
            list($obs, $inst, $det, $meas) = explode(",", $layer);
        	array_push($metaArray, new Image_HelioviewerImageMetaInformation(
        		$params['width'], 
        		$params['height'],
				$params['imageScale'], 
				$obs, $inst, $det, $meas, 
				$roi, 0, 0
        	));
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
     * @param {Array} $layers -- an array of strings in the format:
     *     "obs,inst,det,meas,visible,opacityxxStart,xSize,yStart,ySize"
     *      The extra "x" was put in the middle so that the string could be
     *      broken in half to make parsing easier. 
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
            $layerInfo = explode("x", $layer);

            list($xStart, $xSize, $yStart, $ySize, $offsetX, $offsetY) = explode(",", $layerInfo[1]);
            list($obs, $inst, $det, $meas, $visible, $opacity) = explode(",", $layerInfo[0]);

			$roi = array(
            	'top' 	 => $yStart,
            	'left' 	 => $xStart,
            	'bottom' => $yStart + $ySize,
            	'right'	 => $xStart + $xSize
            );
            $metaObject = new Image_HelioviewerImageMetaInformation($width, $height, $imageScale, $obs, $inst, $det, $meas, $roi, $offsetX, $offsetY);

            array_push($metaArray, $metaObject);
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

        if ($params == $_GET) {
            header('Content-type: image/png');
            echo file_get_contents($composite);
        } else if ($params == $_POST) {
            header('Content-type: application/json');
            // Replace '/var/www/helioviewer', or wherever the directory is,
            // with 'http://localhost/helioviewer' so it can be displayed.
            echo json_encode(str_replace(HV_ROOT_DIR, HV_WEB_ROOT_URL, $composite));
        } else { // So tests will pass.
        	return $composite;
        }
    }
}