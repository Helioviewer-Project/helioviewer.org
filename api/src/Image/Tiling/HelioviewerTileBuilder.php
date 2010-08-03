<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Image_Tiling_HelioviewerTileBuilder class definition
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once HV_ROOT_DIR . '/api/src/Image/HelioviewerImageLayer.php';
require_once HV_ROOT_DIR . '/api/src/Helper/LayerParser.php';
/**
 * Image_Tiling_HelioviewerTileBuilder class definition
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Image_Tiling_HelioviewerTileBuilder
{
    /**
     * Does not require any parameters or setup.
     */
    public function __construct()
    {
    }
    
    /**
     * Creates a HelioviewerImageLayer with the parameters given in the API call.
     * 
     * @param {Array} $params The parameters passed in from the API call
     * 
     * @return tile
     */
    public function getTile ($params)
    {
        $filepath = HV_CACHE_DIR 
            . getCacheFilename(
                $params['uri'], $params['imageScale'], $params['x1'], 
                $params['x2'], $params['y1'], $params['y2'], $params['format']
            );
        $jp2File = HV_JP2_DIR . $params['uri'];
        
        $roi = array(
           "top"    => $params['y1'],
           "left"   => $params['x1'],
           "bottom" => $params['y2'],
           "right"  => $params['x2']
        );

        $tile = new Image_HelioviewerImageLayer(
            $jp2File, $filepath, $params['format'], $params['size'],
            $params['size'], $params['imageScale'], $roi, 
            $params['instrument'], $params['detector'], $params['measurement'], 1, 
            $params['offsetX'], $params['offsetY'], 100, 
            $params['jp2Width'], $params['jp2Height'], 
            $params['jp2Scale'], $params['date'], true
        );
        
        return $tile->display();  
    }
}
?>