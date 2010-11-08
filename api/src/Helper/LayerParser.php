<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Layer parsing methods. Any changes to how layers are specified or should be parsed, will be made here.
 *
 * PHP version 5
 *
 * @category Helper
 * @package  Helioviewer
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */

/**
 * Takes in a layer string in one of two formats: 
 * [obs,inst,det,meas,visible,opacity] or
 * [sourceId,visible,opacity]
 * and parses it into "obs_inst_det_meas" or "sourceId"
 * for the layer name. 
 * 
 * @param string $layer The layer string, in one of the above formats.
 * 
 * @return string
 */
function extractLayerName ($layer) 
{
    $infoArray  = explode(",", str_replace(array("[", "]"), "", $layer));
    if (sizeOf($infoArray) > 4) {
        $infoArray  = array_slice($infoArray, 1, -2);
    } else {
        $infoArray = array_slice($infoArray, 0, -2);
    }
    return implode("_", $infoArray);
}

/**
 * Takes in a string of comma-separated layers in the format:
 * [layer1],[layer2],[layer3] and explodes them into an array.
 * This method is here in case the layers are separated differently
 * or their specification changes at some point in the future.
 * 
 * @param string $layers A string of layers in the above format
 * 
 * @return array
 */
function getLayerArrayFromString($layers)
{
    return explode("],", $layers);
}

/**
 * Gets rid of square brackets and explodes the layer string into
 * an array. The layer string is in one of two formats:
 * [obs,inst,det,meas,visible,opacity] or
 * [sourceId,visible,opacity]
 * 
 * @param string $layer A layer string in the above format
 * 
 * @return array
 */
function singleLayerToArray($layer)
{
    return explode(",", str_replace(array("[","]"), "", $layer));
}

/**
 * Queries the database to get the image's source id based on the information
 * in layerArray.
 * 
 * @param Array $layerArray An array of information from a single layer string
 *                          that contains either [obs, inst, det, meas, visible, opacity]
 *                          or [sourceId, visible, opacity]
 * 
 * @return int
 */
function getSourceIdFromLayerArray($layerArray)
{
    if (sizeOf($layerArray) > 4) {
        list($observatory, $instrument, $detector, $measurement, $visible, $opacity) = $layerArray;
        
        include_once HV_ROOT_DIR . '/api/src/Database/ImgIndex.php';
        $imgIndex = new Database_ImgIndex();
        $sourceId = $imgIndex->getSourceId($observatory, $instrument, $detector, $measurement);
        return $sourceId;
    }
    return $layerArray[0];	
}

?>